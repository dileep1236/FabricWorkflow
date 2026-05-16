import { createTheme } from '@mui/material/styles';

/**
 * Fabric ConfigBuilder — Design System
 * --------------------------------------------------------------------------
 * A single source of truth for color, typography, spacing and component
 * styling. Import `theme` once at the app root via <ThemeProvider>.
 *
 * Rationale: the previous codebase scattered magic hex values
 * (#6483a5, #007bff, #28a745...) across App.css and inline styles, and
 * forced `font-size: 0.5rem` onto every MUI component. Centralizing tokens
 * here makes the UI cohesive and trivial to re-skin.
 */

// --- Design tokens --------------------------------------------------------
export const tokens = {
  color: {
    // Brand — a confident steel-blue derived from the original #6483a5,
    // tuned for AA contrast and an enterprise data-tooling feel.
    brand: {
      50: '#eef3f8',
      100: '#d4e1ee',
      300: '#7fa3c4',
      500: '#3a6ea5', // primary
      600: '#2f5a87',
      700: '#244569',
      900: '#16283d',
    },
    // Neutral slate — used for surfaces, borders and text.
    slate: {
      0: '#ffffff',
      25: '#fbfcfd',
      50: '#f4f6f8',
      100: '#e8ecf0',
      200: '#d5dbe2',
      300: '#b3bcc7',
      500: '#6b7785',
      700: '#3c4654',
      900: '#1a2230',
    },
    success: '#1f9d57',
    warning: '#c77700',
    error: '#d23f3f',
    info: '#2f6fb0',
  },
  radius: { sm: 6, md: 8, lg: 12 },
  shadow: {
    sm: '0 1px 2px rgba(16, 24, 40, 0.06)',
    md: '0 4px 12px rgba(16, 24, 40, 0.08)',
    lg: '0 12px 28px rgba(16, 24, 40, 0.12)',
  },
};

const c = tokens.color;

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: c.brand[500], dark: c.brand[600], light: c.brand[300], contrastText: '#fff' },
    success: { main: c.success },
    warning: { main: c.warning },
    error: { main: c.error },
    info: { main: c.info },
    background: { default: c.slate[50], paper: c.slate[0] },
    text: { primary: c.slate[900], secondary: c.slate[500] },
    divider: c.slate[200],
  },

  shape: { borderRadius: tokens.radius.md },

  typography: {
    // Distinctive but professional pairing: a humanist sans for UI,
    // monospace reserved for SQL / expressions.
    fontFamily: '"Inter Tight", "Segoe UI", system-ui, sans-serif',
    // NOTE: the old App.css forced 0.5rem everywhere — readable sizes restored.
    fontSize: 14,
    h4: { fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.01em' },
    h6: { fontSize: '1rem', fontWeight: 600 },
    subtitle2: { fontSize: '0.8rem', fontWeight: 600, color: c.slate[500] },
    body2: { fontSize: '0.85rem' },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: c.slate[50] },
        '::-webkit-scrollbar': { width: 10, height: 10 },
        '::-webkit-scrollbar-thumb': {
          background: c.slate[200],
          borderRadius: 8,
          border: '2px solid transparent',
          backgroundClip: 'content-box',
        },
        '::-webkit-scrollbar-thumb:hover': { background: c.slate[300] },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: tokens.radius.sm, padding: '7px 16px' },
        containedPrimary: {
          background: `linear-gradient(180deg, ${c.brand[500]}, ${c.brand[600]})`,
          '&:hover': { background: `linear-gradient(180deg, ${c.brand[600]}, ${c.brand[700]})` },
        },
        outlined: { borderColor: c.slate[200] },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        outlined: { borderColor: c.slate[100] },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: `1px solid ${c.slate[100]}`,
          borderRadius: tokens.radius.lg,
          boxShadow: tokens.shadow.sm,
        },
      },
    },
    MuiTextField: { defaultProps: { size: 'small' } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: c.slate[0],
          '& fieldset': { borderColor: c.slate[200] },
          '&:hover fieldset': { borderColor: c.slate[300] },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: { '& .MuiTableCell-head': {
          backgroundColor: c.slate[50],
          color: c.slate[700],
          fontWeight: 700,
          fontSize: '0.78rem',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          borderBottom: `1px solid ${c.slate[200]}`,
        } },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: `1px solid ${c.slate[100]}`,
          borderRadius: tokens.radius.lg,
          backgroundColor: c.slate[0],
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: c.slate[50],
            borderBottom: `1px solid ${c.slate[200]}`,
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 700,
            fontSize: '0.78rem',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: c.slate[700],
          },
          '& .MuiDataGrid-row:hover': { backgroundColor: c.brand[50] },
          '& .MuiDataGrid-cell': { borderColor: c.slate[100] },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: tokens.radius.sm },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: c.slate[900], fontSize: '0.72rem', borderRadius: 6 },
      },
    },
  },
});

export default theme;
