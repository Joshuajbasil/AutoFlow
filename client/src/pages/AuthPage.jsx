import { useState } from 'react';
import { Link as RouterLink, Navigate, useLocation } from 'react-router-dom';
import { Alert, Box, Button, Chip, InputAdornment, IconButton, Link, Paper, Stack, TextField, Typography } from '@mui/material';
import ArrowForward from '@mui/icons-material/ArrowForward';
import AutoAwesome from '@mui/icons-material/AutoAwesome';
import BuildRounded from '@mui/icons-material/BuildRounded';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../services/api';

export default function AuthPage({ register = false }) {
  const { user, authenticate } = useAuth();
  const location = useLocation();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);
  if (user) return <Navigate to={location.state?.from || '/'} replace />;
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try { await authenticate(register ? 'register' : 'login', Object.fromEntries(new FormData(event.currentTarget))); }
    catch (e) { setError(errorMessage(e)); }
    finally { setBusy(false); }
  }
  return <Box sx={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
    <Stack sx={{ bgcolor: '#101929', color: 'white', p: { xs: 4, lg: 9 }, position: 'relative', overflow: 'hidden', justifyContent: 'space-between', minHeight: { md: '100vh' }, backgroundImage: 'radial-gradient(ellipse at 20% 100%, #193d6e 0%, transparent 65%)' }}>
      <Stack direction="row" alignItems="center" gap={1.5}><BuildRounded sx={{ bgcolor: '#2865ef', p: 1, fontSize: 40, borderRadius: 2 }} /><Typography variant="h5">AutoFlow<span style={{ color: '#5590ff' }}>.</span></Typography></Stack>
      <Box sx={{ my: { xs: 5, md: 10 }, maxWidth: 490 }}><Chip icon={<AutoAwesome sx={{ color: '#93b5ff !important' }} />} label="A better day in the workshop" sx={{ bgcolor: '#ffffff0b', color: '#a9c5ff', border: '1px solid #ffffff15', mb: 4 }} /><Typography variant="h3" sx={{ fontSize: { xs: 36, lg: 54 }, lineHeight: 1.12 }}>Great service.<br />Starts with<br /><span style={{ color: '#6c9dff' }}>a clear workspace.</span></Typography><Typography sx={{ color: '#acb9ce', lineHeight: 1.8, my: 3 }}>Your team, your customers, and your workshop.<br />One connected place to keep things moving.</Typography><Stack gap={1.5}>{['A dedicated workspace for every workshop', 'The right access for every role', 'Secure accounts, connected people'].map(text => <Stack key={text} direction="row" gap={1.2} alignItems="center"><CheckCircleOutline sx={{ fontSize: 18, color: '#77b9a8' }} /><Typography variant="body2" color="#c9d3e2">{text}</Typography></Stack>)}</Stack></Box>
      <Typography variant="caption" color="#8b9bb3">AUTOFLOW / WORKSHOP MANAGEMENT</Typography>
    </Stack>
    <Stack justifyContent="center" alignItems="center" sx={{ p: { xs: 3, md: 6 } }}><Paper variant="outlined" sx={{ width: '100%', maxWidth: 440, p: { xs: 3, sm: 4 } }}>
      <Typography variant="overline" color="primary" fontWeight={700}>YOUR WORKSPACE, CONNECTED</Typography><Typography variant="h4" sx={{ mt: 1, mb: 1 }}>{register ? 'Create your account' : 'Welcome back'}</Typography><Typography color="text.secondary" variant="body2" mb={3}>{register ? 'Join your workshop as a customer.' : 'Sign in to your AutoFlow workspace.'}</Typography>
      <Stack component="form" onSubmit={submit} gap={2.3}>{error && <Alert severity="error">{error}</Alert>}
        <TextField label="Workshop code" name="workshopSlug" required autoComplete="organization" helperText="Provided by your workshop · demo: autoflow-demo" slotProps={{ htmlInput: { maxLength: 60 } }} />
        {register && <TextField label="Full name" name="name" required autoComplete="name" slotProps={{ htmlInput: { minLength: 2, maxLength: 100 } }} />}
        <TextField label="Email address" name="email" type="email" required autoComplete="email" />
        {register && <TextField label="Phone (optional)" name="phone" type="tel" autoComplete="tel" />}
        <TextField label="Password" name="password" type={visible ? 'text' : 'password'} required autoComplete={register ? 'new-password' : 'current-password'} helperText={register ? 'At least 12 characters; maximum 72 UTF-8 bytes.' : undefined} slotProps={{ htmlInput: { minLength: register ? 12 : 1, maxLength: 72 }, input: { endAdornment: <InputAdornment position="end"><IconButton aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(!visible)} edge="end">{visible ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> } }} />
        <Button type="submit" variant="contained" size="large" disabled={busy} endIcon={<ArrowForward />}>{busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'}</Button>
      </Stack>
      <Typography variant="body2" color="text.secondary" mt={3}>{register ? 'Already have an account? ' : 'New to your workshop? '}<Link component={RouterLink} to={register ? '/login' : '/register'}>{register ? 'Sign in' : 'Create an account'}</Link></Typography>
    </Paper><Typography variant="caption" color="text.secondary" mt={3}>Need access? Contact your workshop administrator.</Typography></Stack>
  </Box>;
}
