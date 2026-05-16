import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';

export default function SmartSelectWithCustom({
  label,
  value = { type: 'select', value: '' }, // ✅ Default fallback to avoid undefined errors
  options = [],
  onChange,
  placeholder = '',
  selectLabel = 'Select an option'
}) {
    console.log('SmartSelectWithCustom rendered with value:', value);
  const useCustom = value?.type === 'custom';
  const selectedValue = value?.value ?? '';
  console.log('Selected value:', selectedValue);
  const handleSelectChange = (e) => {
    const val = e.target.value;

    if (val === '__custom__') {
      onChange({ type: 'custom', value: '' }); // trigger custom mode
    } else {
      onChange({ type: 'select', value: val });
    }
  };

  const handleCustomChange = (e) => {
    onChange({ type: 'custom', value: e.target.value });
  };

  return (
    <FormControl fullWidth size="small">
      <InputLabel>{label}</InputLabel>

      {!useCustom ? (
        <Select
          label={label}
          value={selectedValue}
          onChange={handleSelectChange}
        >
          <MenuItem value="">-- {selectLabel} --</MenuItem>
          {options.map((opt) => (
            <MenuItem key={opt} value={opt}>
              {opt}
            </MenuItem>
          ))}
          <MenuItem value="__custom__">➕ Add new column</MenuItem>
        </Select>
      ) : (
        <TextField
          label={`Custom ${label}`}
          placeholder={placeholder}
          value={selectedValue}
          onChange={handleCustomChange}
          size="small"
        />
      )}
    </FormControl>
  );
}
