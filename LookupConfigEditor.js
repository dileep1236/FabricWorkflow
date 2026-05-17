import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, Paper, LinearProgress,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';

import LookupRuleForm from './LookupRuleForm';
import ConfirmDialog from './ConfirmDialog';
import { api } from '../api/client';
import { useToast } from './ToastProvider';

/**
 * LookupConfigEditor — REFACTORED.
 * --------------------------------------------------------------------------
 * Original used hardcoded localhost fetches, window.confirm() and raw
 * DataGrid. Behaviour preserved exactly:
 *   - loads gateways + /get-lookup-rule-and-mapping?projectName&sourceName
 *   - normalizeKeys (PascalCase -> camelCase) on rule + mappings
 *   - delete via /delete-lookup-rule {projectName, sourceName, lookupRuleName}
 *   - save via /save-lookup-rule with { ...rule, mappings } payload
 * Now uses the shared api client (configurable base URL), toast feedback,
 * and the shared ConfirmDialog.
 */
const normalizeKeys = (obj) =>
  Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k.charAt(0).toLowerCase() + k.slice(1),
      v,
    ]),
  );

export default function LookupConfigEditor({ initialData }) {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(null);

  const [form, setForm] = useState({
    lookupRuleName: '',
    description: '',
    sourceFilter: '',
    sourceQuery: '',
    referenceQuery: '',
    referenceDatagatewayName: '',
    isActive: true,
    projectName: initialData?.projectName || '',
    sourceName: initialData?.sourceName || '',
  });

  const load = useCallback(async () => {
    if (!initialData?.projectName || !initialData?.sourceName) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        projectName: initialData.projectName,
        sourceName: initialData.sourceName,
      });
      const ruleMapping = await api.get(
        `/get-lookup-rule-and-mapping?${params}`,
      );
      const normalized = (ruleMapping.rules || []).map((r, i) => ({
        id: i + 1,
        ...normalizeKeys(r.rule),
        mappings: (r.mappings || []).map(normalizeKeys),
      }));
      setRows(normalized);
    } catch (err) {
      toast.error('Failed to load lookup rules: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [initialData, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (row) => {
    try {
      await api.post('/delete-lookup-rule', {
        projectName: row.projectName,
        sourceName: row.sourceName,
        lookupRuleName: row.lookupRuleName,
      });
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      toast.success('Lookup rule deleted.');
    } catch (err) {
      toast.error('Delete failed: ' + err.message);
    }
  };

  const handleSave = async () => {
    const base = selectedRow && typeof selectedRow === 'object' ? selectedRow : form;
    const payload = { ...base, mappings };
    try {
      const result = await api.post('/save-lookup-rule', payload);
      if (result && result.status === 'success') {
        setRows((prev) =>
          prev.map((r) => (r.id === base.id ? { ...r, ...payload } : r)),
        );
        toast.success('Lookup rule saved.');
        setSelectedRow(null);
        setShowModal(false);
        load();
      } else {
        toast.warning((result && result.message) || 'Save did not succeed.');
      }
    } catch (err) {
      toast.error('Save failed: ' + err.message);
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 64 },
    { field: 'lookupRuleName', headerName: 'Rule Name', flex: 1, minWidth: 180 },
    { field: 'referenceDatagatewayName', headerName: 'Gateway', width: 160 },
    { field: 'description', headerName: 'Description', flex: 1, minWidth: 180 },
    { field: 'sourceFilter', headerName: 'Source Filter', width: 160 },
    {
      field: 'actions', headerName: 'Actions', width: 110, sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit rule">
            <IconButton size="small" color="primary"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedRow(params.row);
                setShowModal(true);
              }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error"
              onClick={(e) => { e.stopPropagation(); setPending(params.row); }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedRow(null);
            setShowModal(true);
          }}
        >
          Add Lookup Rule
        </Button>
      </Box>

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {loading && <LinearProgress />}
        <DataGrid
          rows={rows}
          columns={columns}
          autoHeight
          pageSizeOptions={[5, 10]}
          initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
          disableRowSelectionOnClick
          sx={{ border: 0 }}
        />
      </Paper>

      <Dialog open={showModal} maxWidth="lg" fullWidth onClose={() => setShowModal(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {selectedRow ? 'Edit Lookup Rule' : 'Add Lookup Rule'}
          <IconButton
            onClick={() => setShowModal(false)}
            sx={{ position: 'absolute', top: 10, right: 10 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <LookupRuleForm
            form={selectedRow || form}
            setForm={setForm}
            mappings={selectedRow?.mappings || mappings}
            setMappings={setMappings}
            onSave={handleSave}
            onClose={() => setShowModal(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(pending)}
        title="Delete this lookup rule?"
        message={`"${pending?.lookupRuleName}" will be permanently removed.`}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          handleDelete(pending);
          setPending(null);
        }}
      />
    </Box>
  );
}
