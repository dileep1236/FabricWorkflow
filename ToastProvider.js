import React, { createContext, useContext, useCallback, useState } from 'react';
import { Snackbar, Alert, Slide } from '@mui/material';

/**
 * Toast notification system.
 * --------------------------------------------------------------------------
 * Replaces the dozens of blocking `alert("...")` and
 * `window.confirm("...")` calls with non-blocking, on-brand feedback.
 *
 *   const toast = useToast();
 *   toast.success('Saved');
 *   toast.error('Save failed');
 */

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const show = useCallback((message, severity = 'info') => {
    setToast({ message, severity, key: Date.now() });
  }, []);

  const value = {
    show,
    success: (m) => show(m, 'success'),
    error: (m) => show(m, 'error'),
    info: (m) => show(m, 'info'),
    warning: (m) => show(m, 'warning'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        key={toast?.key}
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        TransitionComponent={(props) => <Slide {...props} direction="left" />}
      >
        {toast && (
          <Alert
            onClose={() => setToast(null)}
            severity={toast.severity}
            variant="filled"
            sx={{ borderRadius: 2, boxShadow: 6, fontWeight: 600 }}
          >
            {toast.message}
          </Alert>
        )}
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}
