import React, { useState } from 'react';
import {
  Box, Button, Paper, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, Card, CardContent, LinearProgress,
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
 * BronzeToValidatedConfigEditor — REFACTORED.
 * --------------------------------------------------------------------------
 * Original: ~237 lines with ~120 lines of CRUD/fetch boilerplate copy-pasted
 * across three editors. Now all shared behavior lives in `useConfigEditor`
 * and the confirm dialog is the shared <ConfirmDialog>.
 */

const INITIAL_FIELDS = {
  projectName: '', taskName: '', sourcePath: '', destinationTableName: '',
  destinationSchemaName: '', loadType: '', destinationConnection: '',
  enableCdc: false, isActive: false, rowsToSkip: 0, extendedConfig: '',
  allowMultipleFiles: '', badRowAction: '', archiveSourceFile: '',
  lastUpdatedBy: '', lastUpdatedDateTime: new Date().toISOString(),
};

export default function BronzeToValidatedConfigEditor() {
  const editor = useConfigEditor({
    listEndpoint: '/get-all',
    saveEndpoint: '/execute-sql',
    deleteEndpoint: '/delete-row',
    deleteAllEndpoint: '/delete-all-rows',
    initialFields: INITIAL_FIELDS,
  });

  const [mapRow, setMapRow] = useState(null);
  const [pending, setPending] = useState(null); // delete confirmation

  const fieldConfig = [
    { label: 'Project Name', field: 'projectName', type: 'text' },
    { label: 'Task Name', field: 'taskName', type: 'text' },
    { label: 'Destination Table Name', field: 'destinationTableName', type: 'text' },
    { label: 'Destination Schema Name', field: 'destinationSchemaName', type: 'text' },
    { label: 'Load Type', field: 'loadType', type: 'select', options: ['Full', 'Incremental', 'Rolling', 'Append', 'Replace'] },
    { label: 'Destination Connection', field: 'destinationConnection', type: 'select', options: editor.gatewayOptions.map((g) => ({ value: g.DisplayName, label: g.DisplayName })) },
    { label: 'Enable CDC', field: 'enableCdc', type: 'checkbox' },
    { label: 'Is Active', field: 'isActive', type: 'checkbox' },
    { label: 'Rows to Skip', field: 'rowsToSkip', type: 'text' },
    { label: 'Extended Config', field: 'extendedConfig', type: 'text' },
    { label: 'Last Updated By', field: 'lastUpdatedBy', type: 'text' },
    { label: 'Bad Row Action', field: 'badRowAction', type: 'select', options: ['Fail', 'Allow', 'Drop'] },
    { label: 'Allow Multiple Files', field: 'allowMultipleFiles', type: 'checkbox' },
    { label: 'Archive Bronze File', field: 'archiveSourceFile', type: 'checkbox' },
  ];

  const columns = [
    { field: 'id', headerName: 'ID', width: 64 },
    { field: 'projectName', headerName: 'Project', flex: 1, minWidth: 160 },
    { field: 'taskName', headerName: 'Task', flex: 1, minWidth: 160 },
    { field: 'loadType', headerName: 'Load Type', width: 130 },
    { field: 'destinationSchemaName', headerName: 'Schema', width: 150 },
    { field: 'destinationTableName', headerName: 'Table', width: 170 },
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
        title="Bronze → Validated"
        description="Configure validation and load rules applied when promoting raw Bronze data into the Validated (Silver) layer."
      />

      <EditorToolbar
        onAdd={editor.handleAdd}
        onReload={editor.reload}
        onDeleteAll={() => setPending({ all: true })}
      />

      {editor.selectedRow && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <DynamicRowEditor
              fields={fieldConfig}
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
            ? 'This permanently removes every Bronze→Validated configuration row.'
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
