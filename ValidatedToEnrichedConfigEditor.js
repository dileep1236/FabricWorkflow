import React, { useState } from 'react';
import {
  Box, Button, Paper, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, Card, CardContent, LinearProgress, Tabs, Tab,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import RuleIcon from '@mui/icons-material/Rule';
import SearchIcon from '@mui/icons-material/ManageSearch';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';

import DynamicRowEditor from './DynamicRowEditor';
import { PageHeader, EditorToolbar } from './EditorChrome';
import ConfirmDialog from './ConfirmDialog';
import { useConfigEditor } from '../hooks/useConfigEditor';
import { api } from '../api/client';

// These existing sub-editors are reused unchanged.
import MatchingEnrichedConfigEditor from './MatchingEnrichedConfigEditor';
import LookupConfigEditor from './LookupConfigEditor';

/**
 * ValidatedToEnrichedConfigEditor — REFACTORED.
 * --------------------------------------------------------------------------
 * Original: ~330 lines. Differences vs the other editors:
 *   - Uses `formData` (renamed to selectedRow via the shared hook).
 *   - Saves to /execute-sql-enriched, deletes via /delete-row-enriched
 *     keyed on (projectName, sourceName).
 *   - DeleteAll posts { validated: false }.
 *   - Opens Matching / Lookup rule sub-editors in a tabbed dialog.
 *   - Provides validateReferenceQuery() down to the sub-editors.
 *
 * The shared hook absorbs all CRUD differences through its config options
 * (identify / buildDeleteAllPayload), so this file is now mostly the
 * enrichment-specific UI.
 */

const INITIAL_FIELDS = {
  projectName: '', sourceName: '', sourceType: '', sourceData: '',
  destinationTableName: '', destinationSchemaName: '', isActive: false,
  extendedConfig: '', lastSuccessfulStartTime: '', lastUpdatedBy: '',
  lastUpdatedDateTime: '', destinationDatagatewayname: '',
};

export default function ValidatedToEnrichedConfigEditor() {
  const editor = useConfigEditor({
    listEndpoint: '/get-all-validatedtoenriched',
    saveEndpoint: '/execute-sql-enriched',
    deleteEndpoint: '/delete-row-enriched',
    deleteAllEndpoint: '/delete-all-rows',
    initialFields: INITIAL_FIELDS,
    identify: (row) => ({
      projectName: row.projectName,
      sourceName: row.sourceName,
    }),
    buildDeleteAllPayload: () => ({ validated: false }),
  });

  const [ruleRow, setRuleRow] = useState(null);
  const [ruleTab, setRuleTab] = useState(0); // 0 = matching, 1 = lookup
  const [pending, setPending] = useState(null);

  const validateReferenceQuery = async (query, referenceDatagatewayName) => {
    try {
      return await api.post('/validate-reference-query', {
        refquery: query,
        referenceDatagatewayName,
        sourcequery: editor.selectedRow?.sourceData,
        sourceDatagatewayName: editor.selectedRow?.destinationDatagatewayname,
      });
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  };

  const fieldConfig = [
    { label: 'Project Name', field: 'projectName', type: 'text' },
    { label: 'Source Name', field: 'sourceName', type: 'text' },
    { label: 'Destination Schema Name', field: 'destinationSchemaName', type: 'text' },
    { label: 'Destination Table Name', field: 'destinationTableName', type: 'text' },
    { label: 'Extended Config', field: 'extendedConfig', type: 'text' },
    { label: 'Last Updated By', field: 'lastUpdatedBy', type: 'text' },
    { label: 'Source Query', field: 'sourceData', type: 'text area' },
    { label: 'Is Active', field: 'isActive', type: 'checkbox' },
    { label: 'Destination Data Gateway', field: 'destinationDatagatewayname', type: 'select', options: editor.gatewayOptions.map((g) => ({ value: g.DisplayName, label: g.DisplayName })) },
  ];

  const openRules = (row, tab) => {
    editor.setSelectedRow(row);
    setRuleRow(row);
    setRuleTab(tab);
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 64 },
    { field: 'projectName', headerName: 'Project', flex: 1, minWidth: 150 },
    { field: 'sourceName', headerName: 'Source', flex: 1, minWidth: 150 },
    { field: 'sourceType', headerName: 'Type', width: 110 },
    { field: 'sourceData', headerName: 'Source Details', flex: 1, minWidth: 180 },
    { field: 'destinationTableName', headerName: 'Destination Table', width: 170 },
    {
      field: 'actions', headerName: 'Actions', width: 150, sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Matching rules">
            <IconButton size="small" color="success"
              onClick={(e) => { e.stopPropagation(); openRules(params.row, 0); }}>
              <RuleIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Lookup rules">
            <IconButton size="small" color="info"
              onClick={(e) => { e.stopPropagation(); openRules(params.row, 1); }}>
              <SearchIcon fontSize="small" />
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
        title="Validated → Enriched"
        description="Configure enrichment of Validated (Silver) data into the Enriched (Gold) layer, including matching and lookup rules."
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

      {/* Tabbed Matching / Lookup rule dialog */}
      <Dialog open={Boolean(ruleRow)} onClose={() => setRuleRow(null)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 700, pb: 0 }}>
          Rules — {ruleRow?.projectName}
          <IconButton onClick={() => setRuleRow(null)} sx={{ position: 'absolute', top: 10, right: 10 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Tabs
          value={ruleTab}
          onChange={(_, v) => setRuleTab(v)}
          sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Matching" />
          <Tab label="Lookup" />
        </Tabs>
        <DialogContent dividers>
          {ruleRow && ruleTab === 0 && (
            <MatchingEnrichedConfigEditor
              show
              handleClose={() => setRuleRow(null)}
              initialData={ruleRow}
              onValidate={validateReferenceQuery}
            />
          )}
          {ruleRow && ruleTab === 1 && (
            <LookupConfigEditor
              show
              handleClose={() => setRuleRow(null)}
              initialData={ruleRow}
              onValidate={validateReferenceQuery}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(pending)}
        title={pending?.all ? 'Delete all rows?' : 'Delete this row?'}
        message={
          pending?.all
            ? 'This permanently removes every Validated→Enriched configuration row.'
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
