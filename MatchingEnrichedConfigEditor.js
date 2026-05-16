import React, { useState, useEffect } from 'react';
import {
  Box, Button, IconButton, Tooltip, Dialog, DialogTitle, DialogContent
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import MatchingRuleForm from './MatchingRuleForm';

export default function MatchingEnrichedConfigEditor({ initialData }) {
  const [rows, setRows] = useState([]);
  const [gatewayOptions, setGatewayOptions] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [showMatchingModal, setShowMatchingModal] = useState(false);
  const [mappings, setMappings] = useState([]);

const [form, setForm] = useState({
  matchingRuleName: '',
  referenceDatagatewayName: '',
  referenceQuery: '',
  sourceDataFilter: '',
  minimumThreshold: '',
  maximumThreshold: '',
  isRemediationRequired: false,
  remediationThreshold: '',
  sourceDatagatewayName: initialData?.destinationDatagatewayname || '',
  projectName: initialData?.projectName || '',
  sourceName: initialData?.sourceName || ''
});
  // Normalize backend keys to camelCase
  const normalizeKeys = (obj) =>
    Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [
        k.charAt(0).toLowerCase() + k.slice(1),
        v,
      ])
    );

  useEffect(() => {
    if (!initialData?.projectName || !initialData?.sourceName) return;
    console.log('Loading data for:', initialData);
    const params = new URLSearchParams({
      projectName: initialData.projectName,
      sourceName: initialData.sourceName,
    });

    Promise.all([
      fetch('http://localhost:5000/api/get-datagateways').then((res) =>
        res.json()
      ),
      fetch(
        `http://localhost:5000/api/get-rule-and-mapping?${params}`
      ).then((res) => res.json()),
    ])
      .then(([gateways, ruleAndMapping]) => {
        setGatewayOptions(gateways?.results || []);
        const enrichedRules = (ruleAndMapping.rules || []).map((r, index) => ({
          id: index + 1,
          ...normalizeKeys(r.rule),
          mappings: r.mappings.map(normalizeKeys),
        }));
        setRows(enrichedRules);
        console.log('Enriched rules:', enrichedRules.map(r => r.mappings));
        setMappings( enrichedRules.flatMap(r => r.mappings) || []);
      })
      .catch((err) => console.error('Error loading data:', err));
  }, [initialData]);

  const handleOpen = (row) => {
    setSelectedRow(row);
    setShowMatchingModal(true);
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete rule "${row.matchingRuleName}"?`)) return;

    await fetch('http://localhost:5000/api/delete-row-enriched', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectName: row.projectName,
        sourceName: row.sourceName,
        matchingRuleName: row.matchingRuleName,
      }),
    });

    setRows((prev) => prev.filter((r) => r.id !== row.id));
  };

 const handleSave = async () => {
  const base = selectedRow && typeof selectedRow === 'object' ? selectedRow : form;
  console.log('Base rule data:', base);
const payload = {
  ...base,
  mappings
};

  console.log('Saving rule and mappings:', payload);
  const response = await fetch('http://localhost:5000/api/save-rule-and-mapping', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  if(result.status=="success") {
    // Handle successful save
    setRows((prev) => prev.map((r) => (r.id === base.id ? { ...r, ...payload } : r)));
    setSelectedRow(null);
    setShowMatchingModal(false);
    
  }
  console.log('Save result:', result);
};

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'matchingRuleName', headerName: 'Rule Name', width: 180 },
    { field: 'referenceDatagatewayName', headerName: 'Gateway', width: 160 },
    { field: 'minThreshold', headerName: 'Min Threshold', width: 140 },
    { field: 'maxThreshold', headerName: 'Max Threshold', width: 140 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Box display="flex" gap={1}>
          <IconButton color="error" onClick={() => handleDelete(params.row)}>
            <DeleteIcon />
          </IconButton>
          <Tooltip title="Edit Rule">
            <IconButton color="primary" onClick={() => handleOpen(params.row)}>
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box p={3}>
      <Box mb={2}>
        <Button
          variant="contained"
          onClick={() => {
            setSelectedRow(null);
            setShowMatchingModal(true);
          }}
        >
          Add New Matching Rule
        </Button>
      </Box>

      <DataGrid rows={rows} columns={columns} autoHeight pageSize={5} />

      {showMatchingModal && (
        <Dialog open maxWidth="lg" fullWidth onClose={() => setShowMatchingModal(false)}>
          <DialogTitle>{selectedRow ? 'Edit Matching Rule' : 'Add New Matching Rule'}</DialogTitle>
          <DialogContent>
            <MatchingRuleForm
              form={selectedRow || form}
              gatewayOptions={gatewayOptions}
              setMappings={setMappings}
              setForm={setForm}
              mappings={selectedRow?.mappings || []}
              onSave={handleSave}
              onClose={() => setShowMatchingModal(false)}
              sourceDatagateway={initialData?.destinationDatagatewayname || ''}
              sourceQuery={initialData?.sourceData || ''}
            />
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
}
