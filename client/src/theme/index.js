import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: { mode: 'light', primary: { main: '#2865ef' }, secondary: { main: '#0f766e' }, background: { default: '#f4f6fa', paper: '#ffffff' }, text: { primary: '#142238', secondary: '#637188' }, divider: '#e6eaf0', success: { main: '#168267' } },
  typography: { fontFamily: 'Inter, "Segoe UI", sans-serif', h3: { fontWeight: 750, letterSpacing: '-1.3px' }, h4: { fontWeight: 750, letterSpacing: '-.8px' }, h5: { fontWeight: 700 }, h6: { fontWeight: 700 }, button: { textTransform: 'none', fontWeight: 650 } },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { borderRadius: 8, padding: '10px 18px' } } },
    MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { outlined: { borderColor: '#e6eaf0' } } },
    MuiTextField: { defaultProps: { size: 'small', fullWidth: true } },
    MuiTableCell: { styleOverrides: { head: { color: '#637188', background: '#fafbfd', fontSize: 12, fontWeight: 700 }, root: { borderColor: '#edf0f5', padding: '16px' } } },
  },
});
