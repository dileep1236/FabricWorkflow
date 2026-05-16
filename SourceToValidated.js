// SourceToValidatedEditor.jsx
import React, { useState ,useEffect} from 'react';
import { DataGrid } from '@mui/x-data-grid';
import {
  Container,
  Typography,
  Button,
  Box,
  TextareaAutosize,
  Stack,
  IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { MenuItem, Select } from '@mui/material';


export default function SourceToValidatedEditor() {
   const [rows, setRows] = useState([]);
const [rowIdCounter, setRowIdCounter] = useState(1);
  const [sqlScript, setSqlScript] = useState('');
const [isAddingRow, setIsAddingRow] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState([]);
 const handleRowUpdate = (updatedRow) => {
  setRows(prev => prev.map(row => row.id === updatedRow.id ? updatedRow : row));
  // setIsAddingRow(false); // restore UI
  return updatedRow;
};
const [gatewayOptions, setGatewayOptions] = useState([]);

const renderGatewaySelector = (params) => {
  return (
    <Select
      value={params.value || ''}
      onChange={(event) => {
        params.api.setEditCellValue({ id: params.id, field: params.field, value: event.target.value }, event);
      }}
      fullWidth
    >
      {gatewayOptions.map((option) => (
        <MenuItem key={option.DataGatewayName} value={option.DisplayName}>
          {option.DisplayName}
        </MenuItem>
      ))}
    </Select>
  );
};
const renderLoadTypeSelector = (params) => (
  <Select
    value={params.value || ''}
    onChange={(event) => {
      params.api.setEditCellValue({
        id: params.id,
        field: params.field,
        value: event.target.value,
      }, event);
    }}
    fullWidth
  >
    <MenuItem value="Full">Full</MenuItem>
    <MenuItem value="Incremental">Incremental</MenuItem>
    
  </Select>
);

const columns = [
  
  { field: 'projectName', headerName: 'Project Name', width: 200, editable: true },
  { field: 'sourceName', headerName: 'Source Name', width: 200, editable: true },
  { field: 'sourcePath', headerName: 'Source Path', width: 250, editable: true },
  { field: 'destinationName', headerName: 'Destination Name', width: 200, editable: true },
  { field: 'loadType', headerName: 'Load Type', width: 150, editable: true,renderEditCell: renderLoadTypeSelector},
  { field: 'primaryKeyColumns', headerName: 'Primary Key Columns', width: 250, editable: true },
  { field: 'pickLatestRowColumn', headerName: 'Pick Latest Row Column', width: 250, editable: true },
  { field: 'incrementalColumn', headerName: 'Incremental Column', width: 200, editable: true },
  { field: 'filterCondition', headerName: 'Filter Condition', width: 250, editable: true },
  { field: 'isActive', headerName: 'Is Active', type: 'boolean', width: 100, editable: true },
  { field: 'enableCdc', headerName: 'Enable CDC', type: 'boolean', width: 100, editable: true },
  { field: 'rowsToSkip', headerName: 'Rows to Skip', type: 'number', width: 120, editable: true },
  { field: 'extendedConfig', headerName: 'Extended Config', width: 300, editable: true },
  { field: 'datagatewayname', headerName: 'Data Gateway Name', width: 200, editable: true ,renderEditCell: renderGatewaySelector},
  { field: 'lastUpdatedBy', headerName: 'Last Updated By', width: 200, editable: true },
  { field: 'lastUpdatedDateTime', headerName: 'Last Updated', type: 'dateTime', width: 200, editable: true },
   {
    field: 'actions',
    headerName: 'Actions',
    width: 100,
    renderCell: (params) => (
      <IconButton onClick={() => handleDelete(params.row)}>
        <DeleteIcon color="error" />
      </IconButton>
    ),
  }
];

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
useEffect(() => {
  fetch('http://localhost:5000/api/get-all')
    .then(res => res.json())
    .then(data => {
      if (!Array.isArray(data)) {
        alert('Unexpected response format');
        return;
      }

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
    })
    .catch(err => {
      console.error('❌ Fetch error:', err);
      alert('Failed to load data: ' + err.message);
    });
    fetch('http://localhost:5000/api/get-datagateways')
    .then(res => res.json())
    .then(data => {
    
      setGatewayOptions(data.results); // Example: ['Gateway A', 'Gateway B']
    })
}, []);

  const handleAddRow = () => {
    console.log(gatewayOptions)
    const newRow = {
      id: rowIdCounter,
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
      lastSuccessfulStartTime: new Date(),
      lastUpdatedBy: '',
      lastUpdatedDateTime: new Date(),
      datagatewayname: ''
    };
    setRows(prev => [...prev, newRow]);
    setRowIdCounter(prev => prev + 1);
    //  setIsAddingRow(true); // hide buttons while editing
  };

  const generateSQLScript = () => {
    const deleteScript = rows.map(row => {
  const esc = val => val == null ? 'NULL' : `'${val.toString().replace(/'/g, "''")}'`;
  return `DELETE FROM [config].[SourceToValidated] WHERE [ProjectName] = ${esc(row.projectName)} AND [SourceName] = ${esc(row.sourceName)};`;
}).join('\n');

    const insertHeader = `INSERT INTO [config].[SourceToValidated] (
  [ProjectName], [SourceName], [SourcePath], [DestinationName],
  [LoadType], [PrimaryKeyColumns], [PickLatestRowColumn], [IncrementalColumn],
  [FilterCondition], [IsActive], [EnableCdc], [RowsToSkip], [ExtendedConfig],
  [LastSuccessfulStartTime], [LastUpdatedBy], [LastUpdatedDateTime],
  [Datagatewayname]
)\nVALUES\n`;

    const esc = val => val == null ? 'NULL' : `'${val.toString().replace(/'/g, "''")}'`;
    const dt = val => val instanceof Date ? `'${val.toISOString().slice(0, 23)}'` : esc(val);

    const values = rows.map(row => `(
  ${esc(row.projectName)},
  ${esc(row.sourceName)},
  ${esc(row.sourcePath)},
  ${esc(row.destinationName)},
  ${esc(row.loadType)},
  ${esc(row.primaryKeyColumns)},
  ${esc(row.pickLatestRowColumn)},
  ${esc(row.incrementalColumn)},
  ${esc(row.filterCondition)},
  ${row.isActive ? 1 : 0},
  ${row.enableCdc ? 1 : 0},
  ${row.rowsToSkip ?? 0},
  ${esc(row.extendedConfig)},
  ${dt(row.lastSuccessfulStartTime)},
  ${esc(row.lastUpdatedBy)},
  ${dt(row.lastUpdatedDateTime)},
  ${esc(row.datagatewayname)}
)`).join(',\n');

    setSqlScript(`${deleteScript}${insertHeader}${values};`);
    console.log('Generated SQL script:', `${deleteScript}${insertHeader}${values};`);
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Source to Validated Editor</Typography>
{!isAddingRow && (
  <Stack direction="row" spacing={2} mb={2}>
    <Button variant="contained" onClick={handleAddRow}>Add Row</Button>

    {/* <Button variant="outlined" onClick={generateSQLScript} disabled={rows.length === 0}>Generate SQL Script</Button>  */}
    {/* {/* <Button variant="outlined" onClick={handleDownloadSQL} disabled={!sqlScript}>Download SQL Script</Button> */}
    <Button
  variant="contained"
  onClick={() => {
   
 generateSQLScript();

   fetch('http://localhost:5000/api/execute-sql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },

  body: JSON.stringify({"sqlScript": sqlScript })
})
  .then(async res => {
    const contentType = res.headers.get('content-type');
    const text = await res.text();
    if (!res.ok) throw new Error(text);
    if (!contentType?.includes('application/json')) {
      console.warn('Expected JSON, got:', text);
      throw new Error('Unexpected response format from server');
    }
    return JSON.parse(text);  // now you're controlling the parse
  })
  .then(data => alert(data.message))
  .catch(err => alert('Execution failed: ' + err.message));

  }}
>
Save Config
</Button>
  </Stack>
)}


      {sqlScript && (
        <Box mb={2}>
          <TextareaAutosize
            minRows={6}
            style={{ width: '100%', fontFamily: 'monospace' }}
            readOnly
            value={sqlScript}
          />
        </Box>
      )}

      <div style={{ height: 700, width: '100%' }}>
        <DataGrid
          showCellVerticalBorder={true}
          showColumnVerticalBorder={true}
          rows={rows}
          columns={columns}
          processRowUpdate={handleRowUpdate}
          experimentalFeatures={{ newEditingApi: true }}
          pageSize={10}
 onRowSelectionModelChange={(ids) => {
    console.log('🔍 rowSelectionModelChange fired with:', ids);
    setSelectedRowIds(ids);
  }}
        />
      </div>
    </Container>
  );
}
