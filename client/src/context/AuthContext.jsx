import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, errorMessage } from '../services/api';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const restore = useCallback(async () => {
    setLoading(true); setError('');
    try { const { data } = await api.get('/auth/me'); setSession(data); }
    catch (e) { setSession(null); if (e.response?.status !== 401) setError(errorMessage(e)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { restore(); const clear = () => setSession(null); window.addEventListener('autoflow:unauthorized', clear); return () => window.removeEventListener('autoflow:unauthorized', clear); }, [restore]);
  async function authenticate(mode, input) { const { data } = await api.post(`/auth/${mode}`, input); setSession(data); }
  async function logout() { await api.post('/auth/logout', {}); setSession(null); }
  function updateUser(user) { setSession(current => ({ ...current, user })); }
  return <AuthContext.Provider value={{ ...session, loading, error, restore, authenticate, logout, updateUser }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
