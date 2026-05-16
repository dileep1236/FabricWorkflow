import React, { useState, useEffect } from 'react';
import {
  Grid, TextField, FormControl, Select, MenuItem,
  FormControlLabel, Checkbox, Typography, Button, CircularProgress, Box, Autocomplete,
  IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import MappingRow from './MappingRow';
export default function MatchingRuleForm({
  form, setForm,
  gatewayOptions,
  mappings, setMappings,
  onSave, onClose,
  sourceDatagateway, sourceQuery
}) {
  const [localMappings, setLocalMappings] = useState([]);
  const [sourceColumns, setSourceColumns] = useState([]);
  const [referenceColumns, setReferenceColumns] = useState([]);
  const [validationMessage, setValidationMessage] = useState('');
  const [validating, setValidating] = useState(false);

useEffect(() => {
  if (Array.isArray(mappings)) {
   const normalizedMappings = mappings.map(toPascalCaseMapping);
   console.log(normalizedMappings)
    //setMappings(normalizedMappings);
    setLocalMappings(normalizedMappings);
    handleValidateQuery()
  } else {
    setLocalMappings([]); // fallback
  }
}, [mappings]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const updateMapping = (index, field, value) => {
    const updated = [...localMappings];
    updated[index][field] = value;
    setLocalMappings(updated);
    //setMappings(updated); // Sync to parent
  };
const toPascalCaseMapping = (mapping) => ({
  SourceColumnName: mapping.sourceColumnName || mapping.SourceColumnName,
  ReferenceColumnName: mapping.referenceColumnName || mapping.ReferenceColumnName,
  MatchType: mapping.matchType || mapping.MatchType,
  Weightage: mapping.weightage || mapping.Weightage,
  SimilarityThreshold: mapping.similarityThreshold || mapping.SimilarityThreshold,
  IsMatchColumn: mapping.isMatchColumn ?? mapping.IsMatchColumn ?? false,
  IsOutputColumn: mapping.isOutputColumn ?? mapping.IsOutputColumn ?? false,
  IsPrimaryColumn: mapping.isPrimaryColumn ?? mapping.IsPrimaryColumn ?? false
});
  const addMapping = () => {
     const updated = [...localMappings, {
    SourceColumnName: '',
    ReferenceColumnName: '',
    MatchType: 'Exact',
    Weightage: '',
    SimilarityThreshold: '',
    IsMatchColumn: false,
    IsOutputColumn: false,
    IsPrimaryColumn: false
  }];
  setLocalMappings(updated);
  setMappings(updated);
  console.log('Added new mapping:', updated);
  };

  const removeMapping = (index) => {
    const updated = localMappings.filter((_, i) => i !== index);
    setLocalMappings(updated);

    //setMappings(updated);
  };

  const handleValidateQuery = async () => {
    setValidating(true);
    setValidationMessage('');

    try {
      const res = await fetch('http://localhost:5000/api/validate-reference-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceQuery,
          referenceQuery: form.referenceQuery,
          sourceDatagatewayName: sourceDatagateway,
          referenceDatagatewayName: form.referenceDatagatewayName
        })
      });

      const result = await res.json();

      if (result.message === 'success') {
        setSourceColumns(result.sourcecolumns || []);
        setReferenceColumns(result.referencecolumns || []);
       
        if (result.mappings?.length > 0) {
          setLocalMappings(result.mappings);
        } else {
          const initialMappings = (result.sourcecolumns || []).map((sourceCol) => ({
            SourceColumnName: sourceCol,
            ReferenceColumnName: '',
            MatchType: 'Exact',
            Weightage: '',
            SimilarityThreshold: '',
            IsMatchColumn: false,
            IsOutputColumn: false,
            IsPrimaryColumn: false
          }));
          //setLocalMappings(initialMappings);
        }

        setValidationMessage('Query validated successfully.');
      } else {
        setValidationMessage(result.message || 'Validation failed.');
      }
    } catch (err) {
      setValidationMessage('Error validating query: ' + err.message);
    }

    setValidating(false);
  };

  return (
    <>
      <Grid container spacing={3} className="grid-item-global">
        <Grid item xs={6}>
          <TextField
            label="Matching Rule Name"
            fullWidth
            value={form.matchingRuleName || ''}
            onChange={(e) => handleChange('matchingRuleName', e.target.value)}
            size="small"
            sx={{ mt: 2 }}
          />

          <FormControl fullWidth size="small" sx={{ mt: 2 }}>
            <Select
              value={form.referenceDatagatewayName || ''}
              onChange={(e) => handleChange('referenceDatagatewayName', e.target.value)}
              displayEmpty
            >
              <MenuItem disabled value=""><em>Reference Gateway</em></MenuItem>
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
            size="small"
            sx={{ mt: 2 }}
          />

          <TextField
            label="Minimum Threshold"
            fullWidth
            value={form.minimumThreshold || ''}
            onChange={(e) => handleChange('minimumThreshold', e.target.value)}
            size="small"
            sx={{ mt: 2 }}
          />

          <TextField
            label="Maximum Threshold"
            fullWidth
            value={form.maximumThreshold || ''}
            onChange={(e) => handleChange('maximumThreshold', e.target.value)}
            size="small"
            sx={{ mt: 2 }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={form.isRemediationRequired || false}
                onChange={(e) => handleChange('isRemediationRequired', e.target.checked)}
              />
            }
            label="Remediation Required"
            sx={{ mt: 2 }}
          />

          {form.isRemediationRequired && (
            <TextField
              label="Remediation Threshold"
              fullWidth
              value={form.remediationThreshold || ''}
              onChange={(e) => handleChange('remediationThreshold', e.target.value)}
              size="small"
              sx={{ mt: 2 }}
            />
          )}
        </Grid>

        <Grid item xs={6} className="grid-item-global">
          <TextField
            label="Reference Query"
            fullWidth
            multiline
            rows={6}
            value={form.referenceQuery || ''}
            onChange={(e) => handleChange('referenceQuery', e.target.value)}
            sx={{ fontFamily: 'monospace', mt: 2 }}
          />

          <Button
            variant="outlined"
            sx={{ mt: 2 }}
            onClick={handleValidateQuery}
            disabled={validating}
          >
            {validating ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Validating...
              </>
            ) : (
              'Validate Query'
            )}
          </Button>

          {validationMessage && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {validationMessage}
            </Typography>
          )}
        </Grid>
      </Grid>

      {/* 🧠 Mapping Section */}
      <Typography variant="h6" sx={{ mt: 4 }}>Matching Columns</Typography>
      <Button onClick={addMapping} variant="outlined" size="small" sx={{ mb: 2 }}>
        Add Matching Column
      </Button>
{Array.isArray(localMappings) && localMappings.length === 0 && (
  <Typography color="error">No mappings defined. Try adding one.</Typography>
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


      <Box mt={4} display="flex" justifyContent="flex-end" gap={2}>
        <Button
          variant="contained"
          onClick={() => {
            setLocalMappings(localMappings); // ensure sync before saving
            onSave();
          }}
        >
          Save Mapping
        </Button>
        <Button variant="outlined" color="error" onClick={onClose}>
          Cancel
        </Button>
      </Box>
    </>
  );
}
