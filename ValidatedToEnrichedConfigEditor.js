import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
  IconButton,
  Tooltip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RuleIcon from  '@mui/icons-material/Rule';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import FileUploadMapping from './FileUploadMapping';
import CloseIcon from '@mui/icons-material/Close';
import DynamicRowEditor from './DynamicRowEditor';
// import MatchingRuleForm from './MatchingRuleForm';
import MatchingEnrichedConfigEditor from './MatchingEnrichedConfigEditor';
import LookupConfigEditor from './LookupConfigEditor';
export default function ValidatedToEnrichedForm() {
  const [formData, setFormData] = useState({
    projectName: '',
    sourceName: '',
    sourceType: '',
    sourceData: '',
    destinationTableName: '',
    destinationSchemaName: '',
    isActive: false,
    extendedConfig: '',
    lastSuccessfulStartTime: '',
    lastUpdatedBy: '',
    lastUpdatedDateTime: '',
    destdatagatewayname: ''
  });

  const [rows, setRows] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [rowIdCounter, setRowIdCounter] = useState(1);
  const [gatewayOptions, setGatewayOptions] = useState([]);
  const [open, setOpen] = useState(false);
  const camelize = str => str.charAt(0).toLowerCase() + str.slice(1);
const [showMatchingModal, setShowMatchingModal] = useState(false);
const [showLookupModal, setShowLookupModal] = useState(false);
  const handleDelete = async (row) => {
    if (!window.confirm(`Delete row "${row.projectName}"?`)) return;
    try {
      const res = await fetch('http://localhost:5000/api/delete-row-enriched', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName: row.projectName, sourceName: row.sourceName })
      });
      if (!res.ok) throw new Error('Delete failed');
      setRows(prev => prev.filter(r => r.id !== row.id));
      alert('Row deleted.');
    } catch (err) {
      alert(err.message);
    }
  };
  const handleClose = () => {
    setOpen(false);
    setSelectedRow(null);
  };
  const fieldConfig = [
    { label: 'Project Name', field: 'projectName', type: 'text' },
    { label: 'Source Name', field: 'sourceName', type: 'text' },
    { label: 'Destination Schema Name', field: 'destinationSchemaName', type: 'text' },
    { label: 'Destination Table Name', field: 'destinationTableName', type: 'text' },
    { label: 'Extended Config', field: 'extendedConfig', type: 'text' },
    { label: 'Last Updated By', field: 'lastUpdatedBy', type: 'text' },
    { label: 'Source Query', field: 'sourceData', type: 'text area' },
    // { label: 'Source Type', field: 'sourceType', type: 'select', options: [{ label: 'File', value: 1 }, { label: 'Query', value: 2 }] },
    { label: 'Is Active', field: 'isActive', type: 'checkbox' },
    // { label: 'Source Data Gateway', field: 'sourcedatagatewayname', type: 'select', options: gatewayOptions.map(g => ({ value: g.DisplayName, label: g.DisplayName })) },
    { label: 'Destination Data Gateway', field: 'destinationDatagatewayname', type: 'select', options: gatewayOptions.map(g => ({ value: g.DisplayName, label: g.DisplayName })) }
  ];

  // // Conditionally inject sourceDetails label
  // if (formData.sourceType === 1) {
  //   fieldConfig.push({ label: 'Source Path', field: 'sourceDetails', type: 'textarea' });
  // } else if (formData.sourceType === 2) {
  //   fieldConfig.push({ label: 'Source Query', field: 'sourceDetails', type: 'textarea' });
  // }

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'projectName', headerName: 'Project Name', width: 150 },
    { field: 'sourceName', headerName: 'Source Name', width: 150 },
    { field: 'sourceType', headerName: 'Source Type', width: 120 },
    { field: 'sourceData', headerName: 'Source Details', width: 180 },
    { field: 'destinationTableName', headerName: 'Destination Table', width: 150 },
    // { field: 'destinationSchemaName', headerName: 'Destination Schema', width: 150 },
    // { field: 'isActive', headerName: 'Active', width: 100, type: 'boolean' },
    // { field: 'extendedConfig', headerName: 'Extended Config', width: 150 },
    // { field: 'lastUpdatedBy', headerName: 'Updated By', width: 120 },
    // { field: 'sourcedatagatewayname', headerName: 'Source Gateway', width: 120 },
    // { field: 'destdatagatewayname', headerName: 'Destination Gateway', width: 120 }
    {
          field: 'actions',
          headerName: 'Actions',
          width: 200,
          sortable: false,
          renderCell: (params) => (
            <Box display="flex" gap={2}>
              <IconButton color="error" onClick={() => handleDelete(params.row)}>
                <DeleteIcon />
              </IconButton>
              <Tooltip title="Add Matching">
                <IconButton color="success" onClick={() => handleOpen(params.row,'matching')}>
                  <RuleIcon />
                </IconButton>
              </Tooltip>
               <Tooltip title="Add Lookup">
                <IconButton color="info" onClick={() => handleOpen(params.row,'lookup')}>
                  <RuleIcon />
                </IconButton>
              </Tooltip>
            </Box>
          )
        }
  ];
  const [validationMessage, setValidationMessage] = useState('');
  const validateReferenceQuery = async (query, referenceDatagatewayName) => {
    try {
      console.log('referenceDatagatewayName:', referenceDatagatewayName);
      console.log('destinationDatagatewayName:', formData.destinationDatagatewayname);
      const res = await fetch('http://localhost:5000/api/validate-reference-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ "refquery": query ,"referenceDatagatewayName": referenceDatagatewayName,"sourcequery": formData.sourceData, "sourceDatagatewayName": formData.destinationDatagatewayname })                 
      });
      const result = await res.json();

     return result; // 🎯 Pass full result back to modal
  } catch (error) {
    return { status: 'error', message: error.message };
  }
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const initLoad = () => {
    Promise.all([
      fetch('http://localhost:5000/api/get-all-validatedtoenriched').then(res => res.json()),
      fetch('http://localhost:5000/api/get-datagateways').then(res => res.json())
    ])
      .then(([data, gateways]) => {
        const normalized = data.map((row, i) => {
          const obj = {};
          Object.keys(row).forEach(k => obj[camelize(k)] = row[k]);
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

  const handleAdd = () => {
    setSelectedRow(null);
    setFormData({
      projectName: '',
      sourceName: '',
      sourceType: '',
      sourceDetails: '',
      destinationName: '',
      isActive: false,
      extendedConfig: '',
      lastSuccessfulStartTime: '',
      lastUpdatedBy: '',
      lastUpdatedDateTime: '',
      destinationTableName: '',
      destinationSchemaName: '',
      destinationDatagatewayname: ''
    });
  };

  const handleDeleteAll = async () => {
    if (rows.length === 0) {
      alert('No rows to delete.');
      return;
    }
    if (!window.confirm('Delete all rows?')) return;

    try {
      const res = await fetch('http://localhost:5000/api/delete-all-rows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ "validated": false })
      });
      const data = await res.json();
      alert(data.message || 'Deleted.');
      setRows([]);
      setSelectedRow(null);
    } catch (err) {
      alert('Delete all failed: ' + err.message);
    }
  };


  const handleSave = () => {
    if (!formData.projectName || !formData.sourceName) {
      alert('Project Name and Source Name are required.');
      return;
    }

    const newRow = {
      ...formData,
      id: selectedRow?.id || rowIdCounter
    };

    const updatedRows = selectedRow
      ? rows.map(r => (r.id === selectedRow.id ? newRow : r))
      : [...rows, newRow];

    setRows(updatedRows);
    setRowIdCounter(prev => prev + 1);

    fetch('http://localhost:5000/api/execute-sql-enriched', {
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
      .catch(err => alert('Execution failed: ' + err.message));
  };

  const handleOpen = (row,mode='matching') => {
    setSelectedRow(row);
      if (mode=='matching') {
    setShowMatchingModal(true);
    setShowLookupModal(false)
  } else if (mode=='lookup') {
    setShowLookupModal(true);
    setShowMatchingModal(false)
  }
    setOpen(true);
  };
  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Validated to Enriched Editor
      </Typography>

      <Box display="flex" gap={2} mb={2}>
        <Button variant="contained" onClick={handleAdd}>Add New Row</Button>
        <Button variant="outlined" color="error" onClick={handleDeleteAll}>Delete All</Button>
      </Box>

      <Box component="form" mb={4}>
        <DynamicRowEditor fields={fieldConfig} values={formData} onChange={handleFieldChange} />
        <Box mt={2}>
          <Button fullWidth variant="contained" onClick={handleSave}>
            Save Changes
          </Button>
        </Box>
      </Box>

      <DataGrid
        rows={rows}
        columns={columns}
        pageSize={5}
        onRowClick={(params) => {
          setSelectedRow(params.row);
          setFormData(params.row);
        }}
        sx={{ mt: 4 }}
      />

 <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle>
          Add Matching Rule for {selectedRow?.projectName}
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{ position: 'absolute', top: 8, right: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
         {showMatchingModal && (
        <MatchingEnrichedConfigEditor
          show={showMatchingModal}
          handleClose={() => setShowMatchingModal(false)}
          initialData={selectedRow} // pass the row into the form
          onValidate={validateReferenceQuery}
        />
        
      )}
       {showLookupModal && (
        <LookupConfigEditor
          show={showLookupModal}
          handleClose={() => setShowLookupModal(false)}
          initialData={selectedRow} // pass the row into the form
          onValidate={validateReferenceQuery}
        />
        
      )}
        </DialogContent>
      </Dialog>

     
    </Box>

  );

}
