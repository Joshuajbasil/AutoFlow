import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Avatar, Box, Button, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Stack, Typography, Alert } from '@mui/material';
import BuildRounded from '@mui/icons-material/BuildRounded';
import DashboardRounded from '@mui/icons-material/DashboardRounded';
import GroupOutlined from '@mui/icons-material/GroupOutlined';
import LogoutRounded from '@mui/icons-material/LogoutRounded';
import MenuRounded from '@mui/icons-material/MenuRounded';
import PersonOutline from '@mui/icons-material/PersonOutline';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import { useAuth } from '../context/AuthContext';
import { roleLabel } from '../components/Common';
import { errorMessage } from '../services/api';

const width = 244;
export default function AppLayout() {
  const { user, workshop, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();
  const links = [{ to: '/', label: user.role === 'customer' ? 'My overview' : 'Overview', icon: <DashboardRounded /> }, ...(user.role === 'admin' ? [{ to: '/people', label: 'People & access', icon: <GroupOutlined /> }] : []), { to: '/profile', label: 'My account', icon: <PersonOutline /> }];
  const sidebar = <Stack sx={{ height: '100%', color: '#b3bfd2', bgcolor: '#101929', p: 2.5 }}>
    <Stack direction="row" gap={1.4} alignItems="center" sx={{ px: 1, mt: 1, mb: 5 }}><BuildRounded sx={{ color: 'white', bgcolor: '#2865ef', borderRadius: 2, p: .8, fontSize: 36 }} /><Typography color="white" variant="h5">AutoFlow<span style={{ color: '#6399ff' }}>.</span></Typography></Stack>
    <Typography variant="overline" sx={{ color: '#6f809b', fontSize: 10, letterSpacing: 1.7, px: 1.4, mb: 1 }}>WORKSPACE</Typography>
    <List disablePadding>{links.map(link => <ListItemButton component={NavLink} to={link.to} end={link.to === '/'} key={link.to} onClick={() => setOpen(false)} sx={{ borderRadius: 2, mb: .8, py: 1.1, '&.active': { bgcolor: '#2865ef', color: 'white' }, '&:hover': { bgcolor: '#ffffff10' }, '&.active:hover': { bgcolor: '#3471fa' } }}><ListItemIcon sx={{ minWidth: 36, color: 'inherit', '& svg': { fontSize: 20 } }}>{link.icon}</ListItemIcon><ListItemText primary={link.label} slotProps={{ primary: { fontSize: 13, fontWeight: 600 } }} /></ListItemButton>)}</List>
    <Box sx={{ mt: 'auto', mb: 2, p: 2, border: '1px solid #ffffff12', borderRadius: 2, bgcolor: '#ffffff04' }}><ShieldOutlined sx={{ color: '#75a2ff', mb: 1 }} /><Typography variant="body2" color="#d9e2f1" fontWeight={600}>{workshop.name}</Typography><Typography variant="caption" color="#8496b1">Your private workshop workspace</Typography></Box>
    <Divider sx={{ borderColor: '#ffffff12', mb: 2 }} /><Stack direction="row" gap={1.2} alignItems="center"><Avatar sx={{ bgcolor: '#283951', width: 34, height: 34, fontSize: 13 }}>{user.name.split(' ').map(v => v[0]).slice(0, 2).join('')}</Avatar><Box sx={{ minWidth: 0 }}><Typography variant="body2" color="white" noWrap>{user.name}</Typography><Typography variant="caption">{roleLabel[user.role]}</Typography></Box></Stack>
  </Stack>;
  return <Box sx={{ display: 'flex', minHeight: '100vh' }}>
    <Box component="nav" aria-label="Main navigation" sx={{ width: { md: width }, flexShrink: 0 }}><Drawer variant="temporary" open={open} onClose={() => setOpen(false)} sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width } }}>{sidebar}</Drawer><Drawer variant="permanent" sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width, border: 0 } }} open>{sidebar}</Drawer></Box>
    <Box sx={{ flexGrow: 1, minWidth: 0 }}><Stack component="header" direction="row" alignItems="center" justifyContent="space-between" sx={{ height: 76, bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', px: { xs: 2, md: 4 } }}><Stack direction="row" gap={2} alignItems="center"><IconButton aria-label="Open navigation" onClick={() => setOpen(true)} sx={{ display: { md: 'none' } }}><MenuRounded /></IconButton><Typography variant="body2" color="text.secondary">Workspace <span style={{ padding: '0 12px', color: '#bbc3ce' }}>/</span><span style={{ color: '#142238', fontWeight: 600 }}>{links.find(l => l.to === location.pathname)?.label || 'Page'}</span></Typography></Stack><Button size="small" color="inherit" disabled={busy} startIcon={<LogoutRounded sx={{ fontSize: 16 }} />} onClick={async () => { setBusy(true); setError(''); try { await logout(); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); } }}>Sign out</Button></Stack>
    <Box component="main" id="main-content" sx={{ p: { xs: 2.5, md: 4 }, maxWidth: 1500, mx: 'auto' }}>{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}<Outlet /></Box></Box>
  </Box>;
}
