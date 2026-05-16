import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Button,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { tokens } from '../theme/theme';

/**
 * ConfirmDialog — a single reusable replacement for window.confirm().
 * --------------------------------------------------------------------------
 * Every editor previously hand-rolled its own confirm dialog markup. This
 * component centralizes it. Drive it with a single `pending` state object:
 *
 *   const [pending, setPending] = useState(null);
 *   ...
 *   <ConfirmDialog
 *     open={Boolean(pending)}
 *     title={pending?.all ? 'Delete all rows?' : 'Delete this row?'}
 *     message={...}
 *     onCancel={() => setPending(null)}
 *     onConfirm={() => { doDelete(pending); setPending(null); }}
 *   />
 */
export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  destructive = true,
  onConfirm,
  onCancel,
}) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle
        sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}
      >
        {destructive && (
          <WarningAmberIcon
            fontSize="small"
            sx={{ color: tokens.color.error }}
          />
        )}
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ fontSize: '0.86rem', color: 'text.secondary' }}>
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel}>{cancelLabel}</Button>
        <Button
          variant="contained"
          color={destructive ? 'error' : 'primary'}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
