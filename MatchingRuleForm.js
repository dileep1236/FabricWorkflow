import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid, TextField, FormControl, Select, MenuItem, FormControlLabel,
  Checkbox, Typography, Button, CircularProgress, Box, Alert, Divider,
  Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import MappingRow from './MappingRow';
import { api } from '../api/client';
import { tokens } from '../theme/theme';

/**
 * MatchingRuleForm — REDESIGNED.
 * --------------------------------------------------------------------------
 * Logic preserved verbatim:
 *   - toPascalCaseMapping normalization on incoming `mappings`
 *   - handleValidateQuery posts the SAME body to /validate-reference-query
 *     and on result.message === 'success' sets source/reference columns and
 *     mappings; otherwise shows the message
 *   - addMapping / removeMapping / updateMapping with identical PascalCase
 *     row template
 *   - the auto-validate on mappings change (useEffect) is kept
 * Only presentation changed: themed two-column layout, an Alert for the
 * validation result, an empty-state hint, and a sticky save bar.
 */
export default function MatchingRuleForm({
  form, setForm,
  gatewayOptions,
  mappings, setMappings,
  onSave, onClose,
  sourceDatagateway, sourceQuery,
}) {
  const [localMappings, setLocalMappings] = useState([]);
  const [sourceColumns, setSourceColumns] = useState([]);
  const [referenceColumns, setReferenceColumns] = useState([]);
  const [validationMessage, setValidationMessage] = useState('');
  const [validationOk, setValidationOk] = useState(null);
  const [validating, setValidating] = useState(false);

  const toPascalCaseMapping = (m) => ({
    SourceColumnName: m.sourceColumnName || m.SourceColumnName,
    ReferenceColumnName: m.referenceColumnName || m.ReferenceColumnName,
    MatchType: m.matchType || m.MatchType,
    Weightage: m.weightage || m.Weightage,
    SimilarityThreshold: m.similarityThreshold || m.SimilarityThreshold,
    IsMatchColumn: m.isMatchColumn ?? m.IsMatchColumn ?? false,
    IsOutputColumn: m.isOutputColumn ?? m.IsOutputColumn ?? false,
    IsPrimaryColumn: m.isPrimaryColumn ?? m.IsPrimaryColumn ?? false,
  });

  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const updateMapping = (index, field, value) => {
    const updated = [...localMappings];
    updated[index][field] = value;
    setLocalMappings(updated);
  };

  const addMapping = () => {
    const updated = [
      ...localMappings,
      {
        SourceColumnName: '',
        ReferenceColumnName: '',
        MatchType: 'Exact',
        Weightage: '',
        SimilarityThreshold: '',
        IsMatchColumn: false,
        IsOutputColumn: false,
        IsPrimaryColumn: false,
      },
    ];
    setLocalMappings(updated);
    setMappings(updated);
  };

  const removeMapping = (index) =>
    setLocalMappings((prev) => prev.filter((_, i) => i !== index));

  const handleValidateQuery = useCallback(async () => {
    setValidating(true);
    setValidationMessage('');
    setValidationOk(null);
    try {
      const result = await api.post('/validate-reference-query', {
        sourceQuery,
        referenceQuery: form.referenceQuery,
        sourceDatagatewayName: sourceDatagateway,
        referenceDatagatewayName: form.referenceDatagatewayName,
      });
      if (result.message === 'success') {
        setSourceColumns(result.sourcecolumns || []);
        setReferenceColumns(result.referencecolumns || []);
        if (result.mappings?.length > 0) {
          setLocalMappings(result.mappings);
        }
        setValidationOk(true);
        setValidationMessage('Query validated successfully.');
      } else {
        setValidationOk(false);
        setValidationMessage(result.message || 'Validation failed.');
      }
    } catch (err) {
      setValidationOk(false);
      setValidationMessage('Error validating query: ' + err.message);
    }
    setValidating(false);
  }, [sourceQuery, form.referenceQuery, sourceDatagateway, form.referenceDatagatewayName]);

  useEffect(() => {
    if (Array.isArray(mappings)) {
      setLocalMappings(mappings.map(toPascalCaseMapping));
      handleValidateQuery();
    } else {
      setLocalMappings([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mappings]);

  return (
    <Box sx={{ mt: 1 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Stack spacing={2}>
            <TextField
              label="Matching Rule Name"
              fullWidth
              value={form.matchingRuleName || ''}
              onChange={(e) => handleChange('matchingRuleName', e.target.value)}
            />
            <FormControl fullWidth size="small">
              <Select
                value={form.referenceDatagatewayName || ''}
                onChange={(e) => handleChange('referenceDatagatewayName', e.target.value)}
                displayEmpty
              >
                <MenuItem disabled value="">
                  <em>Reference Gateway</em>
                </MenuItem>
                {gatewayOptions.map((opt) => (
                  <MenuItem key={opt.DisplayName} value={opt.DisplayName}>
                    {opt.DisplayName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Source Data Filter"
              fullWidth
              value={form.sourceDataFilter || ''}
              onChange={(e) => handleChange('sourceDataFilter', e.target.value)}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Minimum Threshold"
                fullWidth
                value={form.minimumThreshold || ''}
                onChange={(e) => handleChange('minimumThreshold', e.target.value)}
              />
              <TextField
                label="Maximum Threshold"
                fullWidth
                value={form.maximumThreshold || ''}
                onChange={(e) => handleChange('maximumThreshold', e.target.value)}
              />
            </Stack>
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.isRemediationRequired || false}
                  onChange={(e) => handleChange('isRemediationRequired', e.target.checked)}
                />
              }
              label="Remediation Required"
            />
            {form.isRemediationRequired && (
              <TextField
                label="Remediation Threshold"
                fullWidth
                value={form.remediationThreshold || ''}
                onChange={(e) => handleChange('remediationThreshold', e.target.value)}
              />
            )}
          </Stack>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            label="Reference Query"
            fullWidth
            multiline
            rows={6}
            value={form.referenceQuery || ''}
            onChange={(e) => handleChange('referenceQuery', e.target.value)}
            sx={{ '& textarea': { fontFamily: 'monospace', fontSize: '0.82rem' } }}
          />
          <Button
            variant="outlined"
            sx={{ mt: 2 }}
            onClick={handleValidateQuery}
            disabled={validating}
            startIcon={validating ? <CircularProgress size={16} /> : null}
          >
            {validating ? 'Validating…' : 'Validate Query'}
          </Button>
          {validationMessage && (
            <Alert
              severity={validationOk ? 'success' : 'error'}
              sx={{ mt: 2, borderRadius: 2 }}
            >
              {validationMessage}
            </Alert>
          )}
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1.5 }}
      >
        <Typography variant="subtitle2" sx={{ textTransform: 'uppercase' }}>
          Matching Columns
        </Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={addMapping}>
          Add Matching Column
        </Button>
      </Stack>

      {Array.isArray(localMappings) && localMappings.length === 0 && (
        <Box
          sx={{
            p: 3, textAlign: 'center', color: tokens.color.slate[500],
            border: `1px dashed ${tokens.color.slate[200]}`, borderRadius: 2,
          }}
        >
          No mappings defined. Validate a query or add one manually.
        </Box>
      )}

      {localMappings.map((row, i) => (
        <MappingRow
          key={i}
          index={i}
          row={row}
          sourceColumns={sourceColumns}
          referenceColumns={referenceColumns}
          updateMapping={updateMapping}
          removeMapping={removeMapping}
        />
      ))}

      <Box
        sx={{
          mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1,
          position: 'sticky', bottom: 0, py: 2,
          background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)',
        }}
      >
        <Button variant="outlined" color="error" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={() => {
            setMappings(localMappings);
            onSave();
          }}
        >
          Save Mapping
        </Button>
      </Box>
    </Box>
  );
}
