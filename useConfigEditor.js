import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useToast } from '../components/ToastProvider';

/**
 * useConfigEditor
 * --------------------------------------------------------------------------
 * The three editor components (Landing / BronzeToValidated /
 * ValidatedToEnriched) each reimplemented almost identical state and CRUD
 * logic: load rows, normalize keys, add, save, delete, delete-all.
 *
 * This hook extracts that shared behavior so each editor only has to declare
 * *what* endpoints and fields it uses — not *how* to wire them up. ~120 lines
 * of duplication per editor collapse into a few lines of configuration.
 *
 * @param {object}   cfg
 * @param {string|function} cfg.listEndpoint   GET endpoint returning rows.
 *        May be a function (filterValue) => string for filtered lists
 *        (the Landing editor filters by taskType).
 * @param {string}   cfg.saveEndpoint          POST endpoint to persist { rows }
 * @param {string}   cfg.deleteEndpoint        POST endpoint to delete one row
 * @param {string}   cfg.deleteAllEndpoint     POST endpoint to clear all rows
 * @param {object|function} cfg.initialFields  blank-row template (or a
 *        function (filterValue) => template so "Add" respects the active filter)
 * @param {function} [cfg.identify]            (row) => payload to delete a row
 * @param {function} [cfg.buildSavePayload]    (rows) => body, defaults to {rows}
 * @param {function} [cfg.buildDeleteAllPayload] () => body, defaults to {}
 * @param {*}        [cfg.initialFilter]       initial value for the filter
 */
const camelize = (str) => str.charAt(0).toLowerCase() + str.slice(1);

export function useConfigEditor(cfg) {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [rowIdCounter, setRowIdCounter] = useState(1);
  const [gatewayOptions, setGatewayOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState(cfg.initialFilter ?? null);

  const resolveList = useCallback(
    (f) =>
      typeof cfg.listEndpoint === 'function'
        ? cfg.listEndpoint(f)
        : cfg.listEndpoint,
    [cfg],
  );

  const resolveInitial = useCallback(
    (f) =>
      typeof cfg.initialFields === 'function'
        ? cfg.initialFields(f)
        : cfg.initialFields,
    [cfg],
  );

  const load = useCallback(
    async (f = filter) => {
      setLoading(true);
      try {
        const [data, gateways] = await Promise.all([
          api.get(resolveList(f)),
          api.get('/get-datagateways').catch(() => ({ results: [] })),
        ]);
        const normalized = (data || []).map((row, i) => {
          const obj = {};
          Object.keys(row).forEach((k) => (obj[camelize(k)] = row[k]));
          return { ...obj, id: i + 1 };
        });
        setRows(normalized);
        setRowIdCounter(normalized.length + 1);
        setGatewayOptions(gateways?.results || []);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    },
    [filter, resolveList, toast],
  );

  useEffect(() => {
    load(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleFieldChange = useCallback((field, value) => {
    setSelectedRow((prev) => ({ ...(prev || {}), [field]: value }));
  }, []);

  const handleAdd = useCallback(() => {
    setSelectedRow({ id: rowIdCounter, ...resolveInitial(filter) });
    setRowIdCounter((p) => p + 1);
  }, [rowIdCounter, resolveInitial, filter]);

  const handleSave = useCallback(async () => {
    if (
      !selectedRow?.projectName ||
      !(selectedRow?.taskName || selectedRow?.sourceName)
    ) {
      toast.warning('Project Name and Task/Source Name are required.');
      return;
    }
    const updatedRows = rows.some((r) => r.id === selectedRow.id)
      ? rows.map((r) => (r.id === selectedRow.id ? selectedRow : r))
      : [...rows, selectedRow];

    setSaving(true);
    try {
      const body = cfg.buildSavePayload
        ? cfg.buildSavePayload(updatedRows)
        : { rows: updatedRows };
      const data = await api.post(cfg.saveEndpoint, body);
      setRows(updatedRows);
      toast.success((data && data.message) || 'Changes saved.');
      setSelectedRow(null);
      load();
    } catch (err) {
      toast.error('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  }, [rows, selectedRow, cfg, load, toast]);

  const handleDelete = useCallback(
    async (row) => {
      const payload = cfg.identify
        ? cfg.identify(row)
        : { projectName: row.projectName, taskName: row.taskName };
      try {
        await api.post(cfg.deleteEndpoint, payload);
        setRows((prev) => prev.filter((r) => r.id !== row.id));
        toast.success('Row deleted.');
      } catch (err) {
        toast.error(err.message);
      }
    },
    [cfg, toast],
  );

  const handleDeleteAll = useCallback(async () => {
    if (rows.length === 0) {
      toast.info('No rows to delete.');
      return;
    }
    try {
      const body = cfg.buildDeleteAllPayload
        ? cfg.buildDeleteAllPayload()
        : {};
      const data = await api.post(cfg.deleteAllEndpoint, body);
      toast.success((data && data.message) || 'All rows deleted.');
      setRows([]);
      setSelectedRow(null);
      load();
    } catch (err) {
      toast.error('Delete all failed: ' + err.message);
    }
  }, [rows.length, cfg, load, toast]);

  return {
    rows,
    selectedRow,
    setSelectedRow,
    gatewayOptions,
    loading,
    saving,
    filter,
    setFilter,
    handleFieldChange,
    handleAdd,
    handleSave,
    handleDelete,
    handleDeleteAll,
    reload: load,
  };
}
