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
 * @param {object}  cfg
 * @param {string}  cfg.listEndpoint     GET endpoint returning rows
 * @param {string}  cfg.saveEndpoint     POST endpoint to persist { rows }
 * @param {string}  cfg.deleteEndpoint   POST endpoint to delete a single row
 * @param {string}  cfg.deleteAllEndpoint POST endpoint to clear all rows
 * @param {object}  cfg.initialFields    blank-row template
 * @param {function} [cfg.identify]      (row) => payload used to delete a row
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, gateways] = await Promise.all([
        api.get(cfg.listEndpoint),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.listEndpoint]);

  useEffect(() => {
    load();
  }, [load]);

  const handleFieldChange = useCallback((field, value) => {
    setSelectedRow((prev) => ({ ...(prev || {}), [field]: value }));
  }, []);

  const handleAdd = useCallback(() => {
    setSelectedRow({ id: rowIdCounter, ...cfg.initialFields });
    setRowIdCounter((p) => p + 1);
  }, [rowIdCounter, cfg.initialFields]);

  const handleSave = useCallback(async () => {
    if (!selectedRow?.projectName || !(selectedRow?.taskName || selectedRow?.sourceName)) {
      toast.warning('Project Name and Task/Source Name are required.');
      return;
    }
    const updatedRows = rows.some((r) => r.id === selectedRow.id)
      ? rows.map((r) => (r.id === selectedRow.id ? selectedRow : r))
      : [...rows, selectedRow];

    setSaving(true);
    try {
      const data = await api.post(cfg.saveEndpoint, { rows: updatedRows });
      setRows(updatedRows);
      toast.success((data && data.message) || 'Changes saved.');
      setSelectedRow(null);
      load();
    } catch (err) {
      toast.error('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  }, [rows, selectedRow, cfg.saveEndpoint, load, toast]);

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
    try {
      const data = await api.post(cfg.deleteAllEndpoint, {});
      toast.success((data && data.message) || 'All rows deleted.');
      setRows([]);
      setSelectedRow(null);
      load();
    } catch (err) {
      toast.error('Delete all failed: ' + err.message);
    }
  }, [cfg.deleteAllEndpoint, load, toast]);

  return {
    rows,
    selectedRow,
    setSelectedRow,
    gatewayOptions,
    loading,
    saving,
    handleFieldChange,
    handleAdd,
    handleSave,
    handleDelete,
    handleDeleteAll,
    reload: load,
  };
}
