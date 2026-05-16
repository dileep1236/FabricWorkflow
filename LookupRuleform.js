import React, { useState } from 'react';
import {
  Box, TextField, Checkbox, FormControlLabel, Button, Grid
} from '@mui/material';

export default function LookupRuleForm({
  form,
  setForm,
  mappings,
  setMappings,
  onSave,
  onClose,
  gatewayOptions,
  sourceDatagateway,
  sourceQuery
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
        sourceName: form.sourceName
      },
    ]);
  };

  return (
    <Box mt={2}>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            label="Rule Name"
            name="lookupRuleName"
            value={form.lookupRuleName}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Description"
            name="description"
            value={form.description}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Reference Query"
            name="referenceQuery"
            value={form.referenceQuery}
            onChange={handleChange}
            fullWidth
            multiline
             rows={6}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Source Filter"
            name="sourceFilter"
            value={form.sourceFilter}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={form.isActive}
                onChange={handleChange}
                name="isActive"
              />
            }
            label="Is Active"
          />
        </Grid>
      </Grid>

      {/* Mappings Table */}
      <Box mt={3}>
        <Button onClick={addMappingRow}>Add Mapping Row</Button>
        {mappings.map((map, index) => (
          <Grid container spacing={2} key={index} mt={2}>
            <Grid item xs={4}>
              <TextField
                label="Source Column"
                value={map.sourceColumnName}
                onChange={(e) =>
                  handleMappingChange(index, 'sourceColumnName', e.target.value)
                }
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Reference Column"
                value={map.referenceColumnName}
                onChange={(e) =>
                  handleMappingChange(index, 'referenceColumnName', e.target.value)
                }
                fullWidth
              />
            </Grid>
            <Grid item xs={2}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={map.isLookupColumn}
                    onChange={(e) =>
                      handleMappingChange(index, 'isLookupColumn', e.target.checked)
                    }
                  />
                }
                label="Lookup"
              />
            </Grid>
            <Grid item xs={2}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={map.isOutputColumn}
                    onChange={(e) =>
                      handleMappingChange(index, 'isOutputColumn', e.target.checked)
                    }
                  />
                }
                label="Output"
              />
            </Grid>
          </Grid>
        ))}
      </Box>

      {/* Actions */}
      <Box mt={4} display="flex" justifyContent="flex-end" gap={2}>
        <Button variant="outlined" onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onSave}>Save</Button>
      </Box>
    </Box>
  );
}
