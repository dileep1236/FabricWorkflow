import React from 'react';
import {
  Grid, TextField, Select, MenuItem,
  Checkbox, FormControlLabel, Autocomplete, IconButton, Box
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

export default function MappingRow({ index, row, sourceColumns, referenceColumns, updateMapping, removeMapping }) {
  return (
    <Box sx={{ border: '1px solid #ccc', borderRadius: 1, padding: 2, fontSize: '0.75rem', mb: 1 }}>
      <Grid container spacing={1} alignItems="center">
        <Grid item xs={2.5}>
          <Autocomplete
            fullWidth
            freeSolo
            options={sourceColumns}
            value={row.SourceColumnName || ''}
            onInputChange={(e, newValue) => updateMapping(index, 'SourceColumnName', newValue)}
            renderInput={(params) => <TextField {...params} label="Source Column" size="small" />}
          />
        </Grid>

        <Grid item xs={2.5}>
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

        <Grid item xs={1.5}>
          <Select
            fullWidth
            size="small"
            value={row.MatchType}
            onChange={(e) => updateMapping(index, 'MatchType', e.target.value)}
          >
            <MenuItem value="None">None</MenuItem>
            <MenuItem value="Exact">Exact</MenuItem>
            <MenuItem value="Fuzzy">Fuzzy</MenuItem>
          </Select>
        </Grid>

        <Grid item xs={1.5}>
          <TextField
            label="Weightage"
            fullWidth
            size="small"
            value={row.Weightage || ''}
            onChange={(e) => updateMapping(index, 'Weightage', e.target.value)}
          />
        </Grid>

        <Grid item xs={1.5}>
          <TextField
            label="Similarity Threshold"
            fullWidth
            size="small"
            value={row.SimilarityThreshold || ''}
            onChange={(e) => updateMapping(index, 'SimilarityThreshold', e.target.value)}
          />
        </Grid>

        <Grid item xs={0.75}>
          <FormControlLabel
            control={
              <Checkbox
                checked={row.IsOutputColumn || false}
                onChange={(e) => updateMapping(index, 'IsOutputColumn', e.target.checked)}
              />
            }
            label="Output"
          />
        </Grid>

        <Grid item xs={0.75}>
          <FormControlLabel
            control={
              <Checkbox
                checked={row.IsMatchColumn || false}
                onChange={(e) => updateMapping(index, 'IsMatchColumn', e.target.checked)}
              />
            }
            label="Match"
          />
        </Grid>

        <Grid item xs={0.75}>
          <FormControlLabel
            control={
              <Checkbox
                checked={row.IsPrimaryColumn || false}
                onChange={(e) => updateMapping(index, 'IsPrimaryColumn', e.target.checked)}
              />
            }
            label="PK"
          />
        </Grid>

        <Grid item xs={0.75}>
          <IconButton color="error" onClick={() => removeMapping(index)}>
            <DeleteIcon />
          </IconButton>
        </Grid>
      </Grid>
    </Box>
  );
}
