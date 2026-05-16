import React, { useState, useEffect } from 'react';
import {
  Box, Button, IconButton, Tooltip, Dialog, DialogTitle, DialogContent
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import LookupRuleForm from './LookupRuleform'

export default function LookupConfigEditor({ initialData }) {
  const [rows, setRows] = useState([]);
  const [gatewayOptions, setGatewayOptions] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [mappings, setMappings] = useState([]);

  const [form, setForm] = useState({
    lookupRuleName: '',
    description: '',
    sourceFilter: '',
    sourceQuery: '',
    referenceQuery: '',
    referenceDatagatewayName: '',
    isActive: true,
    projectName: initialData?.projectName || '',
    sourceName: initialData?.sourceName || ''
  });

  const normalizeKeys = (obj) =>
    Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [
        k.charAt(0).toLowerCase() + k.slice(1),
        v
      ])
    );

  useEffect(() => {
    if (!initialData?.projectName || !initialData?.sourceName) return;

    const params = new URLSearchParams({
      projectName: initialData.projectName,
      sourceName: initialData.sourceName
    });

    Promise.all([
      fetch('http://localhost:5000/api/get-datagateways').then((res) => res.json()),
      fetch(`http://localhost:5000/api/get-lookup-rule-and-mapping?${params}`).then((res) => res.json())
    ])
      .then(([gateways, ruleMapping]) => {
        setGatewayOptions(gateways?.results || []);
        const normalizedRules = (ruleMapping.rules || []).map((r, i) => ({
          id: i + 1,
          ...normalizeKeys(r.rule),
          mappings: r.mappings.map(normalizeKeys)
        }));
        setRows(normalizedRules);
        setMappings(normalizedRules.flatMap((r) => r.mappings) || []);
      })
      .catch((err) => console.error('Error loading lookup rules:', err));
  }, [initialData]);

  const handleOpen = (row) => {
    setSelectedRow(row);
    setShowLookupModal(true);
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete lookup rule "${row.lookupRuleName}"?`)) return;

    await fetch('http://localhost:5000/api/delete-lookup-rule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectName: row.projectName,
        sourceName: row.sourceName,
        lookupRuleName: row.lookupRuleName
      })
    });

    setRows((prev) => prev.filter((r) => r.id !== row.id));
  };

  const handleSave = async () => {
    const base = selectedRow && typeof selectedRow === 'object' ? selectedRow : form;
    const payload = {
      ...base,
      mappings
    };

    const response = await fetch('http://localhost:5000/api/save-lookup-rule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (result.status === 'success') {
      setRows((prev) =>
        prev.map((r) => (r.id === base.id ? { ...r, ...payload } : r))
      );
      setSelectedRow(null);
      setShowLookupModal(false);
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'lookupRuleName', headerName: 'Rule Name', width: 180 },
    { field: 'referenceDatagatewayName', headerName: 'Gateway', width: 160 },
    { field: 'description', headerName: 'Description', width: 200 },
    { field: 'sourceFilter', headerName: 'Source Filter', width: 160 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Box display="flex" gap={1}>
          <Tooltip title="Delete Rule">
            <IconButton color="error" onClick={() => handleDelete(params.row)}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Lookup">
            <IconButton color="primary" onClick={() => handleOpen(params.row)}>
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  return (
    <Box p={3}>
      <Box mb={2}>
        <Button
          variant="contained"
          onClick={() => {
            setSelectedRow(null);
            setShowLookupModal(true);
          }}
        >
          Add New Lookup Rule
        </Button>
      </Box>

      <DataGrid rows={rows} columns={columns} autoHeight pageSize={5} />

      {showLookupModal && (
        <Dialog open maxWidth="lg" fullWidth onClose={() => setShowLookupModal(false)}>
          <DialogTitle>{selectedRow ? 'Edit Lookup Rule' : 'Add Lookup Rule'}</DialogTitle>
          <DialogContent>
            <LookupRuleForm
              form={selectedRow || form}
              setForm={setForm}
              mappings={selectedRow?.mappings || []}
              setMappings={setMappings}
              onSave={handleSave}
              onClose={() => setShowLookupModal(false)}
              gatewayOptions={gatewayOptions}
              sourceDatagateway={initialData?.destinationDatagatewayname || ''}
              sourceQuery={initialData?.sourceData || ''}
            />
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
}
