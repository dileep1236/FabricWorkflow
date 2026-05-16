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
import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import FileUploadMapping from './FileUploadMapping';
import CloseIcon from '@mui/icons-material/Close';
export default function BronzeToValidatedConfigEditor() {
  const [rows, setRows] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [rowIdCounter, setRowIdCounter] = useState(1);
  const [gatewayOptions, setGatewayOptions] = useState([]);
  const [sqlScript, setSqlScript] = useState('');
const [open, setOpen] = React.useState(false);


const handleOpen = (row) => {
  setSelectedRow(row);
  setOpen(true);
};

const handleClose = () => {
  setOpen(false);
  setSelectedRow(null);
};
  const initialFields = {
    projectName: '',
    sourceName: '',
    sourcePath: '',
    destinationName: '',
    loadType: '',
    primaryKeyColumns: '',
    pickLatestRowColumn: '',
    incrementalColumn: '',
    filterCondition: '',
    isActive: false,
    enableCdc: false,
    rowsToSkip: 0,
    extendedConfig: '',
    lastSuccessfulStartTime: '',
    lastUpdatedBy: '',
    lastUpdatedDateTime: new Date().toISOString(),
    datagatewayname: ''
  };

  const initLoad = () => {
    Promise.all([
      fetch('http://localhost:5000/api/get-all').then(res => res.json()),
      fetch('http://localhost:5000/api/get-datagateways').then(res => res.json())
    ])
      .then(([data, gatewayData]) => {
         const camelize = (str) => str.charAt(0).toLowerCase() + str.slice(1);

      const transformedRows = data.map((row, index) => {
        const normalized = {};

        Object.keys(row).forEach((key) => {
          normalized[camelize(key)] = row[key];
        });

        return {
          ...normalized,
          id: index + 1,
          lastUpdatedDateTime: normalized.lastUpdatedDateTime ? new Date(normalized.lastUpdatedDateTime) : null,
          lastSuccessfulStartTime: normalized.lastSuccessfulStartTime ? new Date(normalized.lastSuccessfulStartTime) : null,
        };
      });

      console.log('✅ Normalized rows:', transformedRows);
      setRows(transformedRows);
      setRowIdCounter(transformedRows.length + 1);
      setGatewayOptions(gatewayData?.results || []);
      })
      .catch(err => console.error('Initial data fetch failed:', err));
  };

  useEffect(() => {
    initLoad();
  }, []);

  const handleFieldChange = (field, value) => {
    setSelectedRow(prev => ({ ...prev, [field]: value }));
  };

  const generateSQLScript = (inputRows = []) => {
    const esc = val => val == null ? 'NULL' : `'${val.toString().replace(/'/g, "''")}'`;
    const dt = val => {
      const d = new Date(val);
      return isNaN(d) ? 'NULL' : `'${d.toISOString().slice(0, 23)}'`;
    };

    const deleteScript = inputRows.map(row => (
      `DELETE FROM [config].[SourceToValidated] WHERE [ProjectName] = ${esc(row.projectName)} AND [SourceName] = ${esc(row.sourceName)};`
    )).join('\n');

    const insertHeader = `INSERT INTO [config].[SourceToValidated] (
      [ProjectName], [SourceName], [SourcePath], [DestinationName],
      [LoadType], 
   [IsActive], [EnableCdc], [RowsToSkip], [ExtendedConfig],
      [LastSuccessfulStartTime], [LastUpdatedBy], [LastUpdatedDateTime], [Datagatewayname]
    )\nVALUES\n`;

    const values = inputRows.map(row => `(
      ${esc(row.projectName)},
      ${esc(row.sourceName)},
      ${esc(row.sourcePath)},
      ${esc(row.destinationName)},
      ${esc(row.loadType)},
    

      ${row.isActive ? 1 : 0},
      ${row.enableCdc ? 1 : 0},
      ${row.rowsToSkip ?? 0},
      ${esc(row.extendedConfig)},
      ${dt(row.lastSuccessfulStartTime)},
      ${esc(row.lastUpdatedBy)},
      ${dt(row.lastUpdatedDateTime)},
      ${esc(row.datagatewayname)}
    )`).join(',\n');

    return `${deleteScript}\n\n${insertHeader}${values};`;
  };

  const handleSave = () => {
    
    if (!selectedRow) return;
if (!selectedRow?.projectName || !selectedRow?.sourceName) {
  alert('Project Name and Source Name are required.');
  return;
}
    const updatedRows = (() => {
      const found = rows.find(r => r.id === selectedRow.id);
      return found
        ? rows.map(r => (r.id === selectedRow.id ? selectedRow : r))
        : [...rows, selectedRow];
    })();

    setRows(updatedRows);

    const script = generateSQLScript(updatedRows);
    setSqlScript(script);

    fetch('http://localhost:5000/api/execute-sql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: updatedRows })
    })
      .then(async res => {
        const contentType = res.headers.get('content-type');
        const text = await res.text();
        if (!res.ok) throw new Error(text);
        if (!contentType?.includes('application/json')) throw new Error('Unexpected response format');
        return JSON.parse(text);
      })
      .then(data => {
        alert(data.message);
        setSelectedRow(null);
        initLoad();
      })
      .catch(err => alert('Execution failed: ' + err.message));
  };

  const handleAdd = () => {
    const newRow = { id: rowIdCounter, ...initialFields };
    setSelectedRow(newRow);
    setRowIdCounter(prev => prev + 1);
  };

 const handleDelete = async (row) => {
  const confirmed = window.confirm(`Delete row "${row.projectName}"?`);
  if (!confirmed) return;

  try {
    const res = await fetch('http://localhost:5000/api/delete-row', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectName: row.projectName,
        sourceName: row.sourceName
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete');

    // Remove locally after successful delete
    setRows(prev => prev.filter(r => r.id !== row.id));
    alert('Deleted successfully!');
  } catch (err) {
    alert(`Delete failed: ${err.message}`);
  }
};

  const handleDeleteAll = () => {
    if (window.confirm('This will delete all rows. Continue?')) {
      fetch('http://localhost:5000/api/delete-all-rows', {
        method: 'POST',
      })
        .then(res => res.json())
        .then(data => {
          alert(data.message || 'All rows deleted.');
          setRows([]);
          setSelectedRow(null);
          setSqlScript('');
          initLoad();
        })
        .catch(err => alert('Bulk delete failed: ' + err.message));
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'projectName', headerName: 'Project Name', width: 200 },
    { field: 'sourceName', headerName: 'Source Name', width: 200 },
    { field: 'loadType', headerName: 'Load Type', width: 150 },
    { field: 'datagatewayname', headerName: 'Gateway', width: 200 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <stack direction="row" spacing={1}>
        <IconButton color="error" onClick={() => handleDelete(params.row)}>
          <DeleteIcon />
        </IconButton>
        <Tooltip title="Add Column Mapping">
          <IconButton color="primary" onClick={() => handleOpen(params.row)}>
            <AddIcon /> {/* Dialog-based mapping form */}
          </IconButton>
        </Tooltip>

      </stack>
      )
      
    }
  ];

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>Bronze to Validated Editor</Typography>
      <Box display="flex" gap={2} mb={2}>
        <Button variant="contained" onClick={handleAdd}>Add New Row</Button>
        <Button variant="outlined" color="error" onClick={handleDeleteAll}>Delete All</Button>
      </Box>

      {selectedRow && (
        <Box component="form" mb={4}>
          <Grid container spacing={2}>
            {[
              ['Project Name', 'projectName'],
              ['Source Name', 'sourceName'],
              ['Source Path', 'sourcePath'],
              ['Destination Name', 'destinationName'],
              // ['Primary Key Columns', 'primaryKeyColumns'],
              // ['Pick Latest Row Column', 'pickLatestRowColumn'],
              // ['Incremental Column', 'incrementalColumn'],
              // ['Filter Condition', 'filterCondition'],
              ['Rows to Skip', 'rowsToSkip'],
              ['Extended Config', 'extendedConfig'],
              ['Last Updated By', 'lastUpdatedBy'],
              ['Last Updated DateTime', 'lastUpdatedDateTime']
            ].map(([label, field]) => (
              <Grid item xs={6} key={field}>
                <TextField
                  fullWidth
                  size="small"
                  label={label}
                  value={selectedRow?.[field] || ''}
                  onChange={(e) => handleFieldChange(field, e.target.value)}
                />
              </Grid>
            ))}

                      <Grid item xs={6}>
              <FormControl fullWidth size="small">
               
                <Select
                  labelId="load-type-label"
                  value={selectedRow?.loadType || ''}
                  onChange={(e) => handleFieldChange('loadType', e.target.value)}
                  displayEmpty
                  renderValue={(selected) =>
                    selected || <span style={{ color: '#aaa' }}>Load Type</span>
                  }
                >
                  <MenuItem disabled value=""><em>Load Type</em></MenuItem>
                  <MenuItem value="Full">Full</MenuItem>
                  <MenuItem value="Incremental">Incremental</MenuItem>
                  <MenuItem value="CDC">CDC</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6}>
              <FormControl fullWidth size="small">
              
                <Select
                  labelId="gateway-label"
                  value={selectedRow?.datagatewayname || ''}
                  onChange={(e) => handleFieldChange('datagatewayname', e.target.value)}
                  displayEmpty
                  renderValue={(selected) =>
                    selected || <span style={{ color: '#aaa' }}>Data Gateway</span>
                  }
                >
                  <MenuItem disabled value=""><em>Data Gateway</em></MenuItem>
                  {gatewayOptions.map((g) => (
                    <MenuItem key={g.DataGatewayId} value={g.DisplayName}>
                      {g.DisplayName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!selectedRow?.enableCdc}
                    onChange={(e) => handleFieldChange('enableCdc', e.target.checked)}
                  />
                }
                label="Enable CDC"
              />
            </Grid>

            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!selectedRow?.isActive}
                    onChange={(e) => handleFieldChange('isActive', e.target.checked)}
                  />
                }
                label="Is Active"
              />
            </Grid>

            <Grid item xs={12}>
              <Button fullWidth variant="contained" onClick={handleSave}>
                Save Changes
              </Button>
            </Grid>
          </Grid>
        </Box>
        
      )}
<Dialog open={open} onClose={handleClose} maxWidth="50%" fullWidth>
  <DialogTitle>Map Fields for {selectedRow?.projectName}
 <IconButton
      aria-label="close"
      onClick={handleClose}
      sx={{
        position: 'absolute',
        right: 8,
        top: 8,
        color: (theme) => theme.palette.grey[500],
      }}
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
