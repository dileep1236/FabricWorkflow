import React, { useState } from 'react';
import {
  Box, Button, Typography, Paper, CircularProgress, Stack, Divider,
} from '@mui/material';
import LayersIcon from '@mui/icons-material/Layers';
import MicrosoftIcon from '@mui/icons-material/Window';
import { useNavigate } from 'react-router-dom';
import { msalInstance, initializeMsal } from '../msalConfig';
import { useToast } from '../components/ToastProvider';
import { tokens } from '../theme/theme';

/**
 * SignIn — REDESIGNED.
 * --------------------------------------------------------------------------
 * Original: a bare <h1> + two unstyled <button>s with console.log.
 * Now: a centered, branded auth card with proper loading state, error
 * handling via toasts, and redirect into the app on success.
 */
const loginRequest = { scopes: ['https://app.powerbi.com/.default'] };

export default function SignIn() {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const signIn = async () => {
    setBusy(true);
    try {
      await initializeMsal();
      const res = await msalInstance.loginPopup(loginRequest);
      if (res?.accessToken) {
        toast.success('Signed in successfully');
        navigate('/sourcetovalidated');
      }
    } catch (err) {
      toast.error(err.message || 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: `radial-gradient(1200px 600px at 70% -10%, ${tokens.color.brand[100]}, transparent),
                     linear-gradient(180deg, ${tokens.color.slate[50]}, ${tokens.color.slate[25]})`,
        p: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: 420,
          maxWidth: '100%',
          p: 5,
          borderRadius: 4,
          border: `1px solid ${tokens.color.slate[100]}`,
          boxShadow: tokens.shadow.lg,
        }}
      >
        <Stack alignItems="center" spacing={2.5}>
          <Box
            sx={{
              width: 56, height: 56, borderRadius: 3, color: '#fff',
              display: 'grid', placeItems: 'center',
              background: `linear-gradient(135deg, ${tokens.color.brand[500]}, ${tokens.color.brand[700]})`,
              boxShadow: tokens.shadow.md,
            }}
          >
            <LayersIcon />
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Fabric ConfigBuilder
            </Typography>
            <Typography variant="body2" sx={{ color: tokens.color.slate[500], mt: 0.5 }}>
              Sign in with your Microsoft account to manage data pipeline configurations.
            </Typography>
          </Box>

          <Divider flexItem sx={{ borderColor: tokens.color.slate[100] }} />

          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={busy ? <CircularProgress size={18} color="inherit" /> : <MicrosoftIcon />}
            disabled={busy}
            onClick={signIn}
            sx={{ py: 1.25 }}
          >
            {busy ? 'Signing in…' : 'Continue with Microsoft'}
          </Button>

          <Typography sx={{ fontSize: '0.7rem', color: tokens.color.slate[300], textAlign: 'center' }}>
            Secured by Azure MSAL · Tokens are used for Fabric SQL access only
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
