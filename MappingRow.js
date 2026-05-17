import React from 'react';
import {
  Grid, TextField, Select, MenuItem, Checkbox, FormControlLabel,
  Autocomplete, IconButton, Paper,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

/**
 * MappingRow — lightly restyled (was already MUI). Field names, the
 * update/remove callbacks and the PascalCase keys (SourceColumnName,
 * ReferenceColumnName, MatchType, Weightage, SimilarityThreshold,
 * IsOutputColumn, IsMatchColumn, IsPrimaryColumn) are preserved exactly so
 * MatchingRuleForm / the backend payload are unaffected.
 */
export default function MappingRow({
  index, row, sourceColumns, referenceColumns, updateMapping, removeMapping,
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 1 }}>
      <Grid container spacing={1.5} alignItems="center">
        <Grid item xs={12} sm={2.5}>
          <Autocomplete
            fullWidth
            freeSolo
            options={sourceColumns}
            value={row.SourceColumnName || ''}
            onInputChange={(e, v) => updateMapping(index, 'SourceColumnName', v)}
            renderInput={(p) => (
              <TextField {...p} label="Source Column" size="small" />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={2.5}>
          <Select
            fullWidth
            size="small"
            value={row.ReferenceColumnName || ''}
            onChange={(e) => updateMapping(index, 'ReferenceColumnName', e.target.value)}
            displayEmpty
            disabled={referenceColumns.length === 0}
          >
            <MenuItem disabled value="">
              <em>Select Reference Column</em>
            </MenuItem>
            {referenceColumns.map((col) => (
              <MenuItem key={col} value={col}>{col}</MenuItem>
            ))}
          </Select>
        </Grid>

        <Grid item xs={6} sm={1.5}>
          <Select
            fullWidth
            size="small"
            value={row.MatchType || 'Exact'}
            onChange={(e) => updateMapping(index, 'MatchType', e.target.value)}
          >
            <MenuItem value="None">None</MenuItem>
            <MenuItem value="Exact">Exact</MenuItem>
            <MenuItem value="Fuzzy">Fuzzy</MenuItem>
          </Select>
        </Grid>

        <Grid item xs={6} sm={1.5}>
          <TextField
            label="Weightage"
            fullWidth
            size="small"
            value={row.Weightage || ''}
            onChange={(e) => updateMapping(index, 'Weightage', e.target.value)}
          />
        </Grid>

        <Grid item xs={6} sm={1.5}>
          <TextField
            label="Similarity"
            fullWidth
            size="small"
            value={row.SimilarityThreshold || ''}
            onChange={(e) => updateMapping(index, 'SimilarityThreshold', e.target.value)}
          />
        </Grid>

        <Grid item xs={3} sm={0.75}>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={row.IsOutputColumn || false}
                onChange={(e) => updateMapping(index, 'IsOutputColumn', e.target.checked)}
              />
            }
            label="Out"
          />
        </Grid>

        <Grid item xs={3} sm={0.75}>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={row.IsMatchColumn || false}
                onChange={(e) => updateMapping(index, 'IsMatchColumn', e.target.checked)}
              />
            }
            label="Match"
          />
        </Grid>

        <Grid item xs={3} sm={0.75}>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={row.IsPrimaryColumn || false}
                onChange={(e) => updateMapping(index, 'IsPrimaryColumn', e.target.checked)}
              />
            }
            label="PK"
          />
        </Grid>

        <Grid item xs={3} sm={0.75} sx={{ textAlign: 'right' }}>
          <IconButton size="small" color="error" onClick={() => removeMapping(index)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Grid>
      </Grid>
    </Paper>
  );
}
