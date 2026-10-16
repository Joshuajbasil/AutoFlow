import { useState } from 'react';
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { api, errorMessage } from '../services/api';
import { PageTitle, RoleChip } from '../components/Common';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [busy, setBusy] = useState('');
  const [feedback, setFeedback] = useState(null);
  async function submit(event, kind) {
    event.preventDefault(); const form = event.currentTarget;
    setBusy(kind); setFeedback(null);
    const input = Object.fromEntries(new FormData(form));
    try {
      if (kind === 'profile') { const { data } = await api.patch('/auth/profile', input); updateUser(data.user); setFeedback({ severity: 'success', message: 'Your profile has been updated.' }); }
      else { if (input.newPassword !== input.confirmPassword) throw new Error('Passwords do not match.'); delete input.confirmPassword; const { data } = await api.post('/auth/password', input); form.reset(); setFeedback({ severity: 'success', message: data.message }); }
    } catch (e) { setFeedback({ severity: 'error', message: e.message === 'Passwords do not match.' ? e.message : errorMessage(e) }); }
    finally { setBusy(''); }
  }
  return <><PageTitle eyebrow="ACCOUNT SETTINGS" title="My account" description="Keep your details current and your account secure." />{feedback && <Alert severity={feedback.severity} sx={{ mb: 3 }}>{feedback.message}</Alert>}<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3, alignItems: 'start' }}><Paper variant="outlined" sx={{ p: 3 }}><Stack direction="row" justifyContent="space-between" mb={3}><Typography variant="h6" fontSize={18}>Personal details</Typography><RoleChip role={user.role} /></Stack><Stack component="form" onSubmit={e => submit(e, 'profile')} gap={3}><TextField label="Full name" name="name" defaultValue={user.name} required slotProps={{ htmlInput: { minLength: 2, maxLength: 100 } }} /><TextField label="Email address" value={user.email} slotProps={{ input: { readOnly: true } }} helperText="Your email is your account sign-in identifier." /><TextField label="Phone" name="phone" type="tel" defaultValue={user.phone} slotProps={{ htmlInput: { maxLength: 30 } }} /><Button variant="contained" type="submit" disabled={!!busy} sx={{ alignSelf: 'flex-start' }}>{busy === 'profile' ? 'Saving…' : 'Save changes'}</Button></Stack></Paper><Paper variant="outlined" sx={{ p: 3 }}><Typography variant="h6" fontSize={18} mb={1}>Change password</Typography><Typography variant="body2" color="text.secondary" mb={3}>Changing your password signs out your other sessions.</Typography><Stack component="form" onSubmit={e => submit(e, 'password')} gap={3}><TextField label="Current password" name="currentPassword" type="password" autoComplete="current-password" required /><TextField label="New password" name="newPassword" type="password" autoComplete="new-password" required helperText="At least 12 characters; maximum 72 UTF-8 bytes." slotProps={{ htmlInput: { minLength: 12, maxLength: 72 } }} /><TextField label="Confirm new password" name="confirmPassword" type="password" autoComplete="new-password" required /><Button variant="outlined" type="submit" disabled={!!busy} sx={{ alignSelf: 'flex-start' }}>{busy === 'password' ? 'Updating…' : 'Update password'}</Button></Stack></Paper></Box></>;
}
