import React, { useState } from 'react';
import {
  Box, Button, Paper, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, Card, CardContent, LinearProgress, FormControl,
  InputLabel, Select, MenuItem, ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';

import DynamicRowEditor from './DynamicRowEditor';
import FileUploadMapping from './FileUploadMapping';
import { PageHeader, EditorToolbar } from './EditorChrome';
import ConfirmDialog from './ConfirmDialog';
import { useConfigEditor } from '../hooks/useConfigEditor';

/**
 * LandingConfigEditor — REFACTORED.
 * --------------------------------------------------------------------------
 * Original: ~298 lines. Unique to this editor: a "task type" filter (Query /
 * File / API) that drives BOTH the list endpoint (?taskType=) and which form
 * fields are shown. The shared hook now supports a `filter` so this still
 * collapses to declarative config + the field-set switch below.
 */

const makeInitialFields = (taskType = 'Query') => ({
  projectName: '', taskName: '', sourceType: taskType,
  sourceConnection: '', sourceQuery: '', sourceFilePath: '',
  destinationFilePath: '', destinationTableName: '', destinationSchemaName: '',
  destinationConnection: '', fileName: '', fileFormat: 'Delimited',
  columnDelimiter: '\t', rowDelimiter: '\n', textQualifier: '"',
  hasHeader: true, loadType: '', resetExtract: '', threshold: 1000000,
  extractType: 'incremental', enableCdc: false, isActive: true,
  rowsToSkip: 0, extendedConfig: '', allowMultipleFiles: false,
  badRowAction: '', archiveSourceFile: false, lastUpdatedBy: '',
  lastUpdatedDateTime: new Date().toISOString(),
});

export default function LandingConfigEditor() {
  const editor = useConfigEditor({
    listEndpoint: (taskType) =>
      `/get-all-ingest?taskType=${encodeURIComponent(taskType || 'Query')}`,
    saveEndpoint: '/execute-sql',
    deleteEndpoint: '/delete-row',
    deleteAllEndpoint: '/delete-all-rows',
    initialFields: (taskType) => makeInitialFields(taskType),
    initialFilter: 'Query',
  });

  const [mapRow, setMapRow] = useState(null);
  const [pending, setPending] = useState(null);

  const { gatewayOptions } = editor;

  const baseFields = [
    { label: 'Project Name', field: 'projectName', type: 'text' },
    { label: 'Task Name', field: 'taskName', type: 'text' },
    { label: 'Source Connection', field: 'sourceConnection', type: 'text' },
    { label: 'Destination Connection', field: 'destinationConnection', type: 'select', options: gatewayOptions.map((g) => ({ value: g.DisplayName, label: g.DisplayName })) },
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

  const getFieldConfig = () => {
    if (!editor.selectedRow) return [];
    const t = editor.selectedRow.sourceType;
    if (t === 'File') return [...baseFields, ...fileFields];
    if (t === 'API') return [...baseFields, ...apiFields];
    return [...baseFields, ...queryFields];
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 64 },
    { field: 'projectName', headerName: 'Project', flex: 1, minWidth: 160 },
    { field: 'taskName', headerName: 'Task', flex: 1, minWidth: 160 },
    { field: 'destinationConnection', headerName: 'Destination Connection', flex: 1, minWidth: 180 },
    {
      field: 'actions', headerName: 'Actions', width: 110, sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Column Mapping">
            <IconButton size="small" color="primary"
              onClick={(e) => { e.stopPropagation(); setMapRow(params.row); }}>
              <ViewColumnIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error"
              onClick={(e) => { e.stopPropagation(); setPending({ row: params.row }); }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Source → Landing"
        description="Define ingestion tasks that pull data from source systems (query, file or API) into the Landing zone."
      />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={editor.filter}
          onChange={(_, v) => {
            if (v) {
              editor.setFilter(v);
              editor.setSelectedRow(null);
            }
          }}
          sx={{ '& .MuiToggleButton-root': { textTransform: 'none', px: 2 } }}
        >
          <ToggleButton value="Query">Query</ToggleButton>
          <ToggleButton value="File">File</ToggleButton>
          <ToggleButton value="API">API</ToggleButton>
        </ToggleButtonGroup>
        <Box sx={{ flex: 1 }} />
      </Box>

      <EditorToolbar
        onAdd={editor.handleAdd}
        onReload={editor.reload}
        onDeleteAll={() => setPending({ all: true })}
        addLabel={`Add ${editor.filter} Task`}
      />

      {editor.selectedRow && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <DynamicRowEditor
              fields={getFieldConfig()}
              values={editor.selectedRow}
              onChange={editor.handleFieldChange}
            />
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={() => editor.setSelectedRow(null)}>Cancel</Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={editor.saving}
                onClick={editor.handleSave}
              >
                {editor.saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      <Paper variant="outlined" sx={{ height: 520, borderRadius: 3, overflow: 'hidden' }}>
        {editor.loading && <LinearProgress />}
        <DataGrid
          rows={editor.rows}
          columns={columns}
          pageSizeOptions={[8, 16, 32]}
          initialState={{ pagination: { paginationModel: { pageSize: 8 } } }}
          disableRowSelectionOnClick
          onRowClick={(p) => editor.setSelectedRow(p.row)}
          sx={{ border: 0 }}
        />
      </Paper>

      <Dialog open={Boolean(mapRow)} onClose={() => setMapRow(null)} fullWidth maxWidth="lg">
        <DialogTitle sx={{ fontWeight: 700 }}>
          Column Mapping — {mapRow?.projectName}
          <IconButton onClick={() => setMapRow(null)} sx={{ position: 'absolute', top: 10, right: 10 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {mapRow && <FileUploadMapping selectedRow={mapRow} />}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(pending)}
        title={pending?.all ? 'Delete all rows?' : 'Delete this row?'}
        message={
          pending?.all
            ? `This permanently removes every ${editor.filter} landing task.`
            : `"${pending?.row?.projectName}" will be permanently removed.`
        }
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending.all) editor.handleDeleteAll();
          else editor.handleDelete(pending.row);
          setPending(null);
        }}
      />
    </Box>
  );
}
