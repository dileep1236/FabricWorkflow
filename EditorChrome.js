import React from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import RefreshIcon from '@mui/icons-material/Refresh';
import { tokens } from '../theme/theme';

/**
 * Shared chrome for every config editor: a titled header with description
 * and a consistent action toolbar. Previously each editor hand-rolled its
 * own <Typography variant="h5"> + button row with slightly different markup.
 */

export function PageHeader({ title, description }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h5">{title}</Typography>
      {description && (
        <Typography
          variant="body2"
          sx={{ color: tokens.color.slate[500], mt: 0.5, maxWidth: 680 }}
        >
          {description}
        </Typography>
      )}
    </Box>
  );
}

export function EditorToolbar({ onAdd, onDeleteAll, onReload, addLabel = 'Add New Row' }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ mb: 2.5 }}>
      <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd}>
        {addLabel}
      </Button>
      {onReload && (
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={onReload}>
          Refresh
        </Button>
      )}
      <Box sx={{ flex: 1 }} />
      <Button
        variant="outlined"
        color="error"
        startIcon={<DeleteSweepIcon />}
        onClick={onDeleteAll}
      >
        Delete All
      </Button>
    </Stack>
  );
}
