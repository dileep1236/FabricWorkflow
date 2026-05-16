import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, Paper, IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

import DynamicRowEditor from './DynamicRowEditor';
import FileUploadMapping from './FileUploadMapping';

export default function LandingConfigEditor() {
  const [rows, setRows] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [rowIdCounter, setRowIdCounter] = useState(1);
  const [gatewayOptions, setGatewayOptions] = useState([]);
  const [taskTypeFilter, setTaskTypeFilter] = useState('Query');
  const [open, setOpen] = useState(false);

  const initialFields = {
    projectName: '',
    taskName: '',
    sourceType: 'Query',
    sourceConnection: '',
    sourceQuery: '',
    sourceFilePath: '',
    destinationFilePath: '',
    destinationTableName: '',
    destinationSchemaName: '',
    destinationConnection: '',
    fileName: '',
    fileFormat: 'Delimited',
    columnDelimiter: '\t',
    rowDelimiter: '\n',
    textQualifier: '"',
    hasHeader: true,
    loadType: '',
    resetExtract: '',
    threshold: 1000000,
    extractType: 'incremental',
    enableCdc: false,
    isActive: true,
    rowsToSkip: 0,
    extendedConfig: '',
    allowMultipleFiles: false,
    badRowAction: '',
    archiveSourceFile: false,
    lastUpdatedBy: '',
    lastUpdatedDateTime: new Date().toISOString(),
  };

  const baseFields = [
    { label: 'Project Name', field: 'projectName', type: 'text' },
    { label: 'Task Name', field: 'taskName', type: 'text' },
    // { label: 'Source Type', field: 'sourceType', type: 'select', options: ['Query', 'File', 'API'] },
    { label: 'Source Connection', field: 'sourceConnection', type: 'text' },
    { label: 'Destination Connection', field: 'destinationConnection', type: 'select', options: gatewayOptions.map(g => ({ value: g.DisplayName, label: g.DisplayName })) },
    { label: 'Destination File Path', field: 'destinationFilePath', type: 'text' },
    { label: 'Destination Schema Name', field: 'destinationSchemaName', type: 'text' },
    { label: 'Destination Table Name', field: 'destinationTableName', type: 'text' },
    { label: 'Enable CDC', field: 'enableCdc', type: 'checkbox' },
    { label: 'Is Active', field: 'isActive', type: 'checkbox' },
    { label: 'Extended Config', field: 'extendedConfig', type: 'text' },
    { label: 'Last Updated By', field: 'lastUpdatedBy', type: 'text' },
  ];

  const queryFields = [
    { label: 'Source Query', field: 'sourceQuery', type: 'text area' },
    { label: 'Base Table', field: 'baseTable', type: 'text' },
    { label: 'Base Column', field: 'baseColumn', type: 'text' },
    { label: 'Extract Type', field: 'extractType', type: 'select', options: ['incremental', 'full', 'snapshot'] },
    { label: 'Threshold', field: 'threshold', type: 'text' },
    { label: 'Reset Extract', field: 'resetExtract', type: 'text' },
  ];

  const fileFields = [
    { label: 'Source File Path', field: 'sourceFilePath', type: 'text' },
    { label: 'File Name', field: 'fileName', type: 'text' },
    { label: 'File Format', field: 'fileFormat', type: 'select', options: ['Delimited', 'FixedWidth', 'CSV'] },
    { label: 'Column Delimiter', field: 'columnDelimiter', type: 'text' },
    { label: 'Row Delimiter', field: 'rowDelimiter', type: 'text' },
    { label: 'Text Qualifier', field: 'textQualifier', type: 'text' },
    { label: 'Has Header', field: 'hasHeader', type: 'checkbox' },
    { label: 'Archive Source File', field: 'archiveSourceFile', type: 'checkbox' },
  ];

  const apiFields = [
    { label: 'File Name', field: 'fileName', type: 'text' },
    { label: 'File Format', field: 'fileFormat', type: 'select', options: ['Delimited', 'JSON', 'XML'] },
    { label: 'Column Delimiter', field: 'columnDelimiter', type: 'text' },
    { label: 'Row Delimiter', field: 'rowDelimiter', type: 'text' },
    { label: 'Text Qualifier', field: 'textQualifier', type: 'text' },
    { label: 'Has Header', field: 'hasHeader', type: 'checkbox' },
  ];

  const getLandingFieldConfig = () => {
    if (!selectedRow) return [];
    if (selectedRow.sourceType === 'File') return [...baseFields, ...fileFields];
    if (selectedRow.sourceType === 'API') return [...baseFields, ...apiFields];
    return [...baseFields, ...queryFields];
  };

  const camelize = str => str.charAt(0).toLowerCase() + str.slice(1);

  const loadLandingData = (taskType = taskTypeFilter) => {
    Promise.all([
      fetch(`http://localhost:5000/api/get-all-ingest?taskType=${encodeURIComponent(taskType)}`).then(res => res.json()),
      fetch('http://localhost:5000/api/get-datagateways').then(res => res.json())
    ])
      .then(([data, gateways]) => {
        console.log('Loaded landing rows:', data);
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
    loadLandingData(taskTypeFilter);
  }, [taskTypeFilter]);

  const handleFieldChange = (field, value) => {
    setSelectedRow(prev => ({ ...prev, [field]: value }));
  };

  const handleAdd = () => {
    const newRow = { id: rowIdCounter, ...initialFields, sourceType: taskTypeFilter };
    setSelectedRow(newRow);
    setRowIdCounter(prev => prev + 1);
  };

  const handleSave = () => {
    if (!selectedRow?.projectName || !selectedRow?.taskName) {
      alert('Project Name and Task Name are required.');
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
        loadLandingData(taskTypeFilter);
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
        loadLandingData(taskTypeFilter);
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
    { field: 'destinationConnection', headerName: 'Destination Connection Name', width: 200 },

    
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
      <Typography variant="h5" gutterBottom>Landing Config Editor</Typography>

      <Box display="flex" gap={2} mb={2} alignItems="center">
        <Button variant="contained" onClick={handleAdd}>Add New Row</Button>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="task-type-label">Task Type</InputLabel>
          <Select
            labelId="task-type-label"
            value={taskTypeFilter}
            label="Task Type"
            onChange={(e) => {
              setTaskTypeFilter(e.target.value);
              setSelectedRow(null);
            }}
          >
            <MenuItem value="Query">Query</MenuItem>
            <MenuItem value="File">File</MenuItem>
            <MenuItem value="API">API</MenuItem>
          </Select>
        </FormControl>
        <Button variant="outlined" color="error" onClick={handleDeleteAll}>Delete All</Button>
      </Box>

      {selectedRow && (
        <Box component="form" mb={4}>
          <DynamicRowEditor
            fields={getLandingFieldConfig()}
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
          Edit Landing Config for {selectedRow?.projectName}
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
