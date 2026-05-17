import React from 'react';
import {
  Box, TextField, Checkbox, FormControlLabel, Button, Grid,
  Typography, IconButton, Paper, Stack, Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import { tokens } from '../theme/theme';

/**
 * LookupRuleForm — REDESIGNED.
 * --------------------------------------------------------------------------
 * Original logic preserved verbatim:
 *   - handleChange (text + checkbox)
 *   - handleMappingChange / addMappingRow with the exact same row template
 *     (sourceColumnName, referenceColumnName, isLookupColumn, isOutputColumn,
 *      isActive, projectLookupRuleName, projectName, sourceName)
 *   - onSave / onClose passthrough
 * Only the presentation moved into themed MUI cards with proper spacing,
 * an empty-state hint, and a sticky action bar.
 */
export default function LookupRuleForm({
  form,
  setForm,
  mappings,
  setMappings,
  onSave,
  onClose,
}) {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleMappingChange = (index, field, value) => {
    const updated = [...mappings];
    updated[index][field] = value;
    setMappings(updated);
  };

  const addMappingRow = () => {
    setMappings((prev) => [
      ...prev,
      {
        sourceColumnName: '',
        referenceColumnName: '',
        isLookupColumn: false,
        isOutputColumn: false,
        isActive: true,
        projectLookupRuleName: form.lookupRuleName,
        projectName: form.projectName,
        sourceName: form.sourceName,
      },
    ]);
  };

  const removeMappingRow = (index) =>
    setMappings((prev) => prev.filter((_, i) => i !== index));

  return (
    <Box sx={{ mt: 1 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Rule Name"
            name="lookupRuleName"
            value={form.lookupRuleName || ''}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Description"
            name="description"
            value={form.description || ''}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Reference Query"
            name="referenceQuery"
            value={form.referenceQuery || ''}
            onChange={handleChange}
            fullWidth
            multiline
            rows={6}
            sx={{ '& textarea': { fontFamily: 'monospace', fontSize: '0.82rem' } }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Source Filter"
            name="sourceFilter"
            value={form.sourceFilter || ''}
            onChange={handleChange}
            fullWidth
          />
          <FormControlLabel
            sx={{ mt: 2 }}
            control={
              <Checkbox
                checked={!!form.isActive}
                onChange={handleChange}
                name="isActive"
              />
            }
            label="Is Active"
          />
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
          Column Mappings
        </Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={addMappingRow}>
          Add Mapping Row
        </Button>
      </Stack>

      {mappings.length === 0 && (
        <Paper
          variant="outlined"
          sx={{
            p: 3, textAlign: 'center', color: tokens.color.slate[500],
            borderStyle: 'dashed', borderRadius: 2,
          }}
        >
          No column mappings yet. Click "Add Mapping Row" to start.
        </Paper>
      )}

      <Stack spacing={1.5}>
        {mappings.map((map, index) => (
          <Paper
            key={index}
            variant="outlined"
            sx={{ p: 2, borderRadius: 2 }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Source Column"
                  value={map.sourceColumnName || ''}
                  onChange={(e) =>
                    handleMappingChange(index, 'sourceColumnName', e.target.value)
                  }
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Reference Column"
                  value={map.referenceColumnName || ''}
                  onChange={(e) =>
                    handleMappingChange(index, 'referenceColumnName', e.target.value)
                  }
                  fullWidth
                />
              </Grid>
              <Grid item xs={5} sm={1.5}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!map.isLookupColumn}
                      onChange={(e) =>
                        handleMappingChange(index, 'isLookupColumn', e.target.checked)
                      }
                    />
                  }
                  label="Lookup"
                />
              </Grid>
              <Grid item xs={5} sm={1.5}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!map.isOutputColumn}
                      onChange={(e) =>
                        handleMappingChange(index, 'isOutputColumn', e.target.checked)
                      }
                    />
                  }
                  label="Output"
                />
              </Grid>
              <Grid item xs={2} sm={1} sx={{ textAlign: 'right' }}>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => removeMappingRow(index)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Grid>
            </Grid>
          </Paper>
        ))}
      </Stack>

      <Box
        sx={{
          mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1,
          position: 'sticky', bottom: 0, py: 2,
          background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)',
        }}
      >
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={onSave}>
          Save
        </Button>
      </Box>
    </Box>
  );
}
