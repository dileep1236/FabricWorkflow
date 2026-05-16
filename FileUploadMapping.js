import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Button, TextField, Typography, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Select, MenuItem,
  Checkbox, IconButton, Stack, Chip, Tooltip, FormControlLabel,
  TablePagination, Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SaveIcon from '@mui/icons-material/Save';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

import { api } from '../api/client';
import { useToast } from './ToastProvider';
import { tokens } from '../theme/theme';

/**
 * FileUploadMapping — REBUILT.
 * --------------------------------------------------------------------------
 * Original: raw HTML <table>/<input>/<select> styled by the broken App.css
 * (the 0.5rem font rule + a wrapping .container that double-boxed the
 * dialog). All business logic is preserved verbatim:
 *   - delimiter auto-detection
 *   - CSV (PapaParse) / XLSX / TXT parsing
 *   - load existing mapping from /get-mapping
 *   - derived columns, CDC "enable all", primary-key ↔ CDC interlock
 *   - identical payload to /execute-sql-columns
 *
 * Only the presentation layer changed: MUI table, chips for column flags,
 * proper pagination, toast feedback instead of alert().
 */

const DATATYPES = [
  'StringType', 'VarcharType', 'CharType', 'BooleanType', 'ByteType',
  'ShortType', 'IntegerType', 'LongType', 'FloatType', 'DoubleType',
  'DecimalType', 'DateType', 'TimestampType', 'TimestampNTZType',
  'BinaryType', 'ArrayType', 'MapType', 'StructType',
];

const ROWS_PER_PAGE = 10;

const truthy = (v) => v === '1' || v === 1 || v === true;

export default function FileUploadMapping({ selectedRow }) {
  const toast = useToast();
  const [projectName, setProjectName] = useState(selectedRow?.projectName || '');
  const [sourceName, setSourceName] = useState(selectedRow?.sourceName || '');
  const [sourceColumns, setSourceColumns] = useState([]);
  const [mapping, setMapping] = useState({});
  const [page, setPage] = useState(0);
  const [isCDCEnabledAll, setIsCDCEnabledAll] = useState(false);
  const [derivedColumns, setDerivedColumns] = useState([]);
  const [saving, setSaving] = useState(false);
  const nextProjectColumnID = 1;

  useEffect(() => {
    if (selectedRow) {
      setProjectName(selectedRow.projectName || '');
      setSourceName(selectedRow.sourceName || '');
    }
  }, [selectedRow]);

  const detectDelimiter = (text) => {
    const firstLine = text.split('\n')[0];
    if (firstLine.includes('\t')) return '\t';
    if (firstLine.includes(';')) return ';';
    if (firstLine.includes('|')) return '|';
    return ',';
  };

  const initialLoad = useCallback(
    async (proj, src) => {
      try {
        const data = await api.post('/get-mapping', {
          projectName: proj,
          sourceName: src,
        });
        if (data && Array.isArray(data.mapping)) {
          const structured = data.mapping.reduce((acc, row) => {
            acc[row.SourceColumnName] = {
              destination: row.ProjectColumnName || '',
              datatype: row.Datatype || 'StringType',
              isCDCEnabled: truthy(row.IsCDCEnabled),
              isEncryptEnabled: truthy(row.IsEncryptEnabled),
              isPrimaryKey: truthy(row.IsPrimaryKey),
              isIdentity: truthy(row.IsIdentity),
              isDerived: truthy(row.IsDerived),
              isRollingField: truthy(row.IsRollingField),
              isDedupRankingField: truthy(row.IsDedupRankingField),
              expression: row.DerivedExpression || '',
              projectColumnID: row.ProjectColumnID || 0,
            };
            return acc;
          }, {});
          setMapping(structured);
          setSourceColumns(Object.keys(structured));
        }
      } catch (err) {
        toast.error('Could not load existing mapping: ' + err.message);
      }
    },
    [toast],
  );

  useEffect(() => {
    if (projectName && sourceName) initialLoad(projectName, sourceName);
  }, [projectName, sourceName, initialLoad]);

  const processHeaders = (data) => {
    const headers = data[0] || [];
    setSourceColumns(headers);
    const initial = headers.reduce((acc, col, index) => {
      acc[col] = {
        destination: String(col).replace(/\s+/g, '').toLowerCase(),
        datatype: 'StringType',
        isCDCEnabled: false,
        isEncryptEnabled: false,
        isPrimaryKey: false,
        isIdentity: false,
        isDerived: false,
        isRollingField: false,
        isDedupRankingField: false,
        expression: '',
        projectColumnID: nextProjectColumnID + index,
      };
      return acc;
    }, {});
    setMapping(initial);
    setPage(0);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const fileType = file.name.split('.').pop().toLowerCase();
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target.result;
      if (fileType === 'csv') {
        Papa.parse(text, {
          delimiter: detectDelimiter(text),
          complete: (result) => processHeaders(result.data),
        });
      } else if (fileType === 'xlsx' || fileType === 'xls') {
        const workbook = XLSX.read(text, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (sheetData.length > 0) processHeaders(sheetData);
      } else if (fileType === 'txt') {
        const rows = text.split('\n').map((r) => r.split('\t'));
        if (rows.length > 0) processHeaders(rows);
      }
    };

    if (fileType === 'xlsx' || fileType === 'xls') reader.readAsBinaryString(file);
    else reader.readAsText(file);
  };

  const handleMappingChange = (col, field, value) => {
    setMapping((prev) => {
      const updated = { ...prev, [col]: { ...prev[col] } };
      if (field === 'isPrimaryKey' && value) updated[col].isCDCEnabled = false;
      updated[col][field] = value;
      return updated;
    });
  };

  const handleEnableAllCDC = (event) => {
    const checked = event.target.checked;
    setIsCDCEnabledAll(checked);
    setMapping((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((col) => {
        if (!updated[col].isPrimaryKey) {
          updated[col] = { ...updated[col], isCDCEnabled: checked };
        }
      });
      return updated;
    });
  };

  const addDerivedColumn = () => {
    const name = `DerivedColumn${derivedColumns.length + 1}`;
    setMapping((prev) => ({
      ...prev,
      [name]: {
        destination: name,
        datatype: 'StringType',
        isCDCEnabled: false,
        isEncryptEnabled: false,
        isPrimaryKey: false,
        isIdentity: false,
        isDerived: true,
        isRollingField: false,
        isDedupRankingField: false,
        expression: '',
        projectColumnID: nextProjectColumnID + Object.keys(prev).length,
      },
    }));
    setSourceColumns((prev) => [...prev, name]);
    setDerivedColumns((prev) => [...prev, name]);
  };

  const deleteColumn = (colName) => {
    setMapping((prev) => {
      const { [colName]: _removed, ...rest } = prev;
      return rest;
    });
    setSourceColumns((prev) => prev.filter((c) => c !== colName));
    setDerivedColumns((prev) => prev.filter((c) => c !== colName));
  };

  const handleSave = async () => {
    if (!projectName || !sourceName) {
      toast.warning('Project Name and Source Name are required.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/execute-sql-columns', {
        projectName,
        sourceName,
        mapping,
      });
      toast.success('Column mapping saved.');
    } catch (err) {
      toast.error('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const pagedColumns = useMemo(
    () => sourceColumns.slice(page * ROWS_PER_PAGE, page * ROWS_PER_PAGE + ROWS_PER_PAGE),
    [sourceColumns, page],
  );

  const flagCols = [
    { key: 'isEncryptEnabled', label: 'Encrypt' },
    { key: 'isPrimaryKey', label: 'PK' },
    { key: 'isDerived', label: 'Derived' },
    { key: 'isIdentity', label: 'Identity' },
    { key: 'isRollingField', label: 'Rolling' },
    { key: 'isDedupRankingField', label: 'Dedup' },
  ];

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          label="Project Name"
          fullWidth
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />
        <TextField
          label="Source Name"
          fullWidth
          value={sourceName}
          onChange={(e) => setSourceName(e.target.value)}
        />
      </Stack>

      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
        <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>
          Upload File
          <input
            hidden
            type="file"
            accept=".csv,.xlsx,.xls,.txt"
            onChange={handleFileUpload}
          />
        </Button>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={addDerivedColumn}>
          Add Derived Column
        </Button>
        <Box sx={{ flex: 1 }} />
        {sourceColumns.length > 0 && (
          <Chip
            size="small"
            label={`${sourceColumns.length} columns`}
            sx={{ bgcolor: tokens.color.brand[50], color: tokens.color.brand[700] }}
          />
        )}
      </Stack>

      {sourceColumns.length > 0 && (
        <>
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ borderRadius: 2, maxHeight: 480 }}
          >
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Source Column</TableCell>
                  <TableCell>Destination Column</TableCell>
                  <TableCell>Data Type</TableCell>
                  <TableCell align="center">
                    <Stack alignItems="center">
                      <span>CDC</span>
                      <Tooltip title="Enable CDC for all non-PK columns">
                        <Checkbox
                          size="small"
                          checked={isCDCEnabledAll}
                          onChange={handleEnableAllCDC}
                          sx={{ p: 0.25 }}
                        />
                      </Tooltip>
                    </Stack>
                  </TableCell>
                  {flagCols.map((f) => (
                    <TableCell key={f.key} align="center">{f.label}</TableCell>
                  ))}
                  <TableCell>Expression</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pagedColumns.map((col) => {
                  const m = mapping[col] || {};
                  const isDerivedCol = derivedColumns.includes(col);
                  return (
                    <TableRow key={col} hover>
                      <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {col}
                        {isDerivedCol && (
                          <Chip
                            label="derived"
                            size="small"
                            sx={{
                              ml: 1, height: 18, fontSize: '0.62rem',
                              bgcolor: tokens.color.brand[50],
                              color: tokens.color.brand[700],
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <TextField
                          variant="standard"
                          value={m.destination ?? ''}
                          onChange={(e) => handleMappingChange(col, 'destination', e.target.value)}
                          sx={{ minWidth: 140 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          variant="standard"
                          value={m.datatype || 'StringType'}
                          onChange={(e) => handleMappingChange(col, 'datatype', e.target.value)}
                          sx={{ minWidth: 130, fontSize: '0.82rem' }}
                        >
                          {DATATYPES.map((dt) => (
                            <MenuItem key={dt} value={dt} sx={{ fontSize: '0.82rem' }}>
                              {dt}
                            </MenuItem>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell align="center">
                        <Checkbox
                          size="small"
                          checked={!!m.isCDCEnabled}
                          disabled={!!m.isPrimaryKey}
                          onChange={(e) => handleMappingChange(col, 'isCDCEnabled', e.target.checked)}
                        />
                      </TableCell>
                      {flagCols.map((f) => (
                        <TableCell key={f.key} align="center">
                          <Checkbox
                            size="small"
                            checked={!!m[f.key]}
                            onChange={(e) => handleMappingChange(col, f.key, e.target.checked)}
                          />
                        </TableCell>
                      ))}
                      <TableCell>
                        {m.isDerived && (
                          <TextField
                            variant="standard"
                            placeholder="Enter expression"
                            value={m.expression || ''}
                            onChange={(e) => handleMappingChange(col, 'expression', e.target.value)}
                            sx={{ minWidth: 160, '& input': { fontFamily: 'monospace', fontSize: '0.78rem' } }}
                          />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {isDerivedCol && (
                          <Tooltip title="Remove derived column">
                            <IconButton size="small" color="error" onClick={() => deleteColumn(col)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={sourceColumns.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={ROWS_PER_PAGE}
            rowsPerPageOptions={[ROWS_PER_PAGE]}
          />
        </>
      )}

      <Divider sx={{ my: 2 }} />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          disabled={saving || sourceColumns.length === 0}
          onClick={handleSave}
        >
          {saving ? 'Saving…' : 'Save Mapping'}
        </Button>
      </Box>
    </Box>
  );
}
