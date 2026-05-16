import React from 'react';
import {
  Grid,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
    Button,
    Box
} from '@mui/material';

export default function DynamicRowEditor({ fields, values, onChange }) {
  return (
    <Grid container spacing={2} className="grid-item-global">
      {fields.map(({ label, field, type, options = [] }) => (
        <Grid item xs={6} key={field}>
          {type === 'text' && (
            <TextField
              fullWidth
              size="small"
              label={label}
              value={values?.[field] || ''}
              onChange={(e) => onChange(field, e.target.value)}
            />
          )}

          {type === 'select' && (
            <FormControl fullWidth size="small">
              <Select
                displayEmpty
                value={values?.[field] || ''}
                onChange={(e) => onChange(field, e.target.value)}
                renderValue={(selected) =>
                  selected || <span style={{ color: '#aaa' }}>{label}</span>
                }
              >
                <MenuItem disabled value="">
                  <em>{label}</em>
                </MenuItem>
                {options.map((opt) =>
                  typeof opt === 'string' ? (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ) : (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  )
                )}
              </Select>
            </FormControl>
          )}

          {type === 'checkbox' && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!values?.[field]}
                  onChange={(e) => onChange(field, e.target.checked)}
                />
              }
              label={label}
            />
          )}
          {(type === 'text area' || type === 'textarea') && (
  <TextField
    label={label}
    fullWidth
    multiline
    rows={4}
    value={values[field] || ''}
    onChange={(e) => onChange(field, e.target.value)}
    size="small"
    sx={{ fontFamily: 'monospace' }}
  />
)}

 {type === 'browse' && (
   <Box display="flex" alignItems="center" gap={1}>
     <TextField
       label={label}
       fullWidth
       size="small"
       value={values[field] || ''}
       onChange={(e) => onChange(field, e.target.value)}
     />
    <input
  type="file"
  webkitdirectory="true"
  style={{ display: 'none' }}
  id="folderPicker"
  onChange={(e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const firstPath = files[0].webkitRelativePath; // e.g. "MyFolder/file.csv"
      const folderName = firstPath.split('/')[0];
      onChange('sourcePath', folderName); // or pass to your state handler
    }
  }}
/>
<label htmlFor="folderPicker">
  <Button variant="outlined" component="span">Browse Folder</Button>
</label>
   </Box>
 )}
        </Grid>
      ))}
    </Grid>
  );
}
