import { lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation, Link as RouterLink } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import { useAuth } from './context/AuthContext';
import { Failure, Loading } from './components/Common';
import AppLayout from './layouts/AppLayout';
import AuthPage from './pages/AuthPage';
const Dashboard = lazy(() => import('./pages/Dashboard'));
const People = lazy(() => import('./pages/People'));
const Profile = lazy(() => import('./pages/Profile'));

export function ProtectedRoute({ roles }) {
  const { user } = useAuth(); const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) return <Box py={5}><Typography variant="h4" mb={2}>Access restricted</Typography><Typography color="text.secondary" mb={3}>This page is available to workshop administrators.</Typography><Button component={RouterLink} to="/">Back to overview</Button></Box>;
  return <Outlet />;
}
export default function App() {
  const { loading, error, restore } = useAuth();
  if (loading) return <Loading />;
  if (error) return <Box sx={{ maxWidth: 600, mx: 'auto', mt: 8, px: 3 }}><Typography variant="h4" mb={3}>Workspace unavailable</Typography><Failure message={error} retry={restore} /></Box>;
  return <Suspense fallback={<Loading />}><Routes><Route path="/login" element={<AuthPage key="login" />} /><Route path="/register" element={<AuthPage key="register" register />} /><Route element={<ProtectedRoute />}><Route element={<AppLayout />}><Route index element={<Dashboard />} /><Route path="profile" element={<Profile />} /><Route element={<ProtectedRoute roles={['admin']} />}><Route path="people" element={<People />} /></Route><Route path="*" element={<Box><Typography variant="h4" mb={2}>Page not found</Typography><Button component={RouterLink} to="/">Back to overview</Button></Box>} /></Route></Route></Routes></Suspense>;
}
