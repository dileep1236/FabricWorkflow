import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, Paper, IconButton, Tooltip, Dialog, DialogTitle, DialogContent
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

import DynamicRowEditor from './DynamicRowEditor';
import FileUploadMapping from './FileUploadMapping';

export default function BronzeToValidatedConfigEditor() {
  const [rows, setRows] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [rowIdCounter, setRowIdCounter] = useState(1);
  const [gatewayOptions, setGatewayOptions] = useState([]);
  const [open, setOpen] = useState(false);

  const initialFields = {
    projectName: '',
    taskName: '',
    sourcePath: '',
    destinationTableName: '',
    destinationSchemaName: '',
    loadType: '',
    destinationConnection: '',
    enableCdc: false,
    isActive: false,
    rowsToSkip: 0,
    extendedConfig: '',
    allowMultipleFiles: '',
    badRowAction:'',
    archiveSourceFile:'',
    lastUpdatedBy: '',
    lastUpdatedDateTime: new Date().toISOString(),
  };

  const fieldConfig = [
    { label: 'Project Name', field: 'projectName', type: 'text' },
    { label: 'Task Name', field: 'taskName', type: 'text' },
    { label: 'Destination Table Name', field: 'destinationTableName', type: 'text' },
    { label: 'Destination Schema Name', field: 'destinationSchemaName', type: 'text' },
    { label: 'Load Type', field: 'loadType', type: 'select', options: ['Full', 'Incremental', 'Rolling','Append','Replace'] },
    { label: 'DestinationConnection', field: 'destinationConnection', type: 'select', options: gatewayOptions.map(g => ({ value: g.DisplayName, label: g.DisplayName })) },
    { label: 'Enable CDC', field: 'enableCdc', type: 'checkbox' },
    { label: 'Is Active', field: 'isActive', type: 'checkbox' },
    { label: 'Rows to Skip', field: 'rowsToSkip', type: 'text' },
    { label: 'Extended Config', field: 'extendedConfig', type: 'text' },
    { label: 'Last Updated By', field: 'lastUpdatedBy', type: 'text' },
    { label: 'Bad Row Action', field: 'badRowAction', type: 'select', options: ['Fail', 'Allow', 'Drop']  },
    { label: 'Allow Multiple Files', field: 'allowMultipleFiles', type: 'checkbox' },
    { label: 'Archive Bronze File', field: 'archiveSourceFile', type: 'checkbox' }

    // { label: 'Last Updated DateTime', field: 'lastUpdatedDateTime', type: 'text' },
  ];

  const camelize = str => str.charAt(0).toLowerCase() + str.slice(1);

  const initLoad = () => {
    Promise.all([
      fetch('http://localhost:5000/api/get-all').then(res => res.json()),
      fetch('http://localhost:5000/api/get-datagateways').then(res => res.json())
    ])
      .then(([data, gateways]) => {
        console.log(data)
        const normalized = data.map((row, i) => {
          const obj = {};
          Object.keys(row).forEach(k => (obj[camelize(k)] = row[k]));
          return { ...obj, id: i + 1 };
        });
        setRows(normalized);
        setRowIdCounter(normalized.length + 1);
        setGatewayOptions(gateways?.results || []);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    initLoad();
  }, []);

  const handleFieldChange = (field, value) => {
    setSelectedRow(prev => ({ ...prev, [field]: value }));
  };

  const handleAdd = () => {
    const newRow = { id: rowIdCounter, ...initialFields };
    setSelectedRow(newRow);
    setRowIdCounter(prev => prev + 1);
  };

  const handleSave = () => {
    if (!selectedRow?.projectName || !selectedRow?.taskName) {
      alert('Project Name and Source Name are required.');
      return;
    }
    const updatedRows = rows.some(r => r.id === selectedRow.id)
      ? rows.map(r => (r.id === selectedRow.id ? selectedRow : r))
      : [...rows, selectedRow];

    setRows(updatedRows);
    console.log(updatedRows)
    fetch('http://localhost:5000/api/execute-sql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: updatedRows })
    })
      .then(res => res.json())
      .then(data => {
        alert(data.message);
        setSelectedRow(null);
        initLoad();
      })
      .catch(err => alert('Save failed: ' + err.message));
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete row "${row.projectName}"?`)) return;
    try {
      const res = await fetch('http://localhost:5000/api/delete-row', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName: row.projectName, taskName: row.taskName })
      });
      if (!res.ok) throw new Error('Delete failed');
      setRows(prev => prev.filter(r => r.id !== row.id));
      alert('Row deleted.');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteAll = () => {
    if (!window.confirm('Delete all rows?')) return;
    fetch('http://localhost:5000/api/delete-all-rows', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        alert(data.message || 'Deleted.');
        setRows([]);
        setSelectedRow(null);
        initLoad();
      })
      .catch(err => alert('Delete all failed: ' + err.message));
  };

  const handleOpen = (row) => {
    setSelectedRow(row);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedRow(null);
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'projectName', headerName: 'Project Name', width: 200 },
    { field: 'taskName', headerName: 'Task Name', width: 200 },
    { field: 'loadType', headerName: 'Load Type', width: 150 },
    { field: 'destinationConnection', headerName: 'Destination Connection Name', width: 200 },
       { field: 'destinationSchemaName', headerName: 'Destination Schema Name', width: 200 },
     { field: 'destinationTableName', headerName: 'Destination Table Name', width: 200 },
    
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <Box display="flex" gap={1}>
          <IconButton color="error" onClick={() => handleDelete(params.row)}>
            <DeleteIcon />
          </IconButton>
          <Tooltip title="Add Column Mapping">
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
      <Typography variant="h5" gutterBottom>Bronze to Validated Config Editor</Typography>

      <Box display="flex" gap={2} mb={2}>
        <Button variant="contained" onClick={handleAdd}>Add New Row</Button>
        <Button variant="outlined" color="error" onClick={handleDeleteAll}>Delete All</Button>
      </Box>

      {selectedRow && (
        <Box component="form" mb={4}>
          <DynamicRowEditor
            fields={fieldConfig}
            values={selectedRow}
            onChange={handleFieldChange}
          />
          <Box mt={2}>
            <Button fullWidth variant="contained" onClick={handleSave}>
              Save Changes
            </Button>
          </Box>
        </Box>
      )}

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle>
          Map Fields for {selectedRow?.projectName}
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{ position: 'absolute', top: 8, right: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedRow && <FileUploadMapping selectedRow={selectedRow} />}
        </DialogContent>
      </Dialog>

      <Paper sx={{ height: 500 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={6}
          onRowClick={(params) => setSelectedRow(params.row)}
        />
      </Paper>
    </Box>
  );
}
