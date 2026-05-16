import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';

import { theme } from './theme/theme';
import { ToastProvider } from './components/ToastProvider';
import AppShell from './components/AppShell';

import SignIn from './pages/SignIn';
import LandingConfigEditor from './components/LandingConfigEditor';
import BronzeToValidatedConfigEditor from './components/BronzeToValidatedConfigEditor';
import ValidatedToEnrichedConfigEditor from './components/ValidatedToEnrichedConfigEditor';
import PipelineWorkflow from './components/pipelineworkflow';

/**
 * App root — REFACTORED.
 * --------------------------------------------------------------------------
 * Original App.js imported 14 modules (many unused / duplicate:
 * WorkflowEditor1, workflow, EIMComponenet, Designer, two copies of the
 * Enriched form...) and wrapped everything in a single .container div.
 *
 * Now: a single ThemeProvider + ToastProvider + AppShell wrap the routes.
 * Authenticated routes render inside the shell; sign-in stands alone.
 */
function Protected({ children }) {
  return <AppShell>{children}</AppShell>;
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/" element={<SignIn />} />
            <Route path="/sourcetolanding" element={<Protected><LandingConfigEditor /></Protected>} />
            <Route path="/sourcetovalidated" element={<Protected><BronzeToValidatedConfigEditor /></Protected>} />
            <Route path="/validatedtoenriched" element={<Protected><ValidatedToEnrichedConfigEditor /></Protected>} />
            <Route path="/workflow" element={<Protected><PipelineWorkflow /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}
