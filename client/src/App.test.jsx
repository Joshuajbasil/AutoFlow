import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './App';
import AuthPage from './pages/AuthPage';

const { auth } = vi.hoisted(() => ({ auth: { user: null, authenticate: vi.fn() } }));
vi.mock('./context/AuthContext', () => ({ useAuth: () => auth }));
beforeEach(() => { auth.user = null; auth.authenticate.mockReset(); });

describe('role guards', () => {
  function mount() { render(<MemoryRouter initialEntries={['/private']}><Routes><Route path="/login" element={<p>Sign-in destination</p>} /><Route element={<ProtectedRoute roles={['admin']} />}><Route path="/private" element={<p>Admin directory</p>} /></Route></Routes></MemoryRouter>); }
  it('redirects anonymous users', () => { mount(); expect(screen.getByText('Sign-in destination')).toBeInTheDocument(); });
  it('blocks customers from admin pages', () => { auth.user = { role: 'customer' }; mount(); expect(screen.getByText('Access restricted')).toBeInTheDocument(); expect(screen.queryByText('Admin directory')).not.toBeInTheDocument(); });
  it('allows administrators', () => { auth.user = { role: 'admin' }; mount(); expect(screen.getByText('Admin directory')).toBeInTheDocument(); });
});
describe('sign in', () => {
  it('submits workshop credentials and displays server errors', async () => {
    auth.authenticate.mockRejectedValue({ response: { data: { error: { message: 'Invalid workshop code, email, or password.' } } } });
    render(<MemoryRouter><AuthPage /></MemoryRouter>);
    const actor = userEvent.setup();
    await actor.type(screen.getByLabelText(/Workshop code/), 'precision');
    await actor.type(screen.getByLabelText(/Email address/), 'owner@test.dev');
    await actor.type(screen.getByLabelText(/^Password/), 'some-password');
    await actor.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(auth.authenticate).toHaveBeenCalledWith('login', { workshopSlug: 'precision', email: 'owner@test.dev', password: 'some-password' });
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid workshop code');
  });
});
