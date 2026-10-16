import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { Workshop, User, CustomerProfile } from '../src/models/index.js';
import { cookieOptions } from '../src/middleware/auth.js';
import { loadConfig } from '../src/config/env.js';

let mongo, app, first, second, admin, tech, customer, outsider, hash;
const password = 'Workshop-test-password-42';
const config = { JWT_SECRET: randomBytes(48).toString('hex'), CLIENT_ORIGIN: 'http://localhost:5173', NODE_ENV: 'test', TRUST_PROXY: '0' };
const session = user => `autoflow_session=${jwt.sign({ workshopId: user.workshop.toString(), version: user.tokenVersion || 0 }, config.JWT_SECRET, { subject: user.id, expiresIn: '8h', issuer: 'autoflow', audience: 'autoflow-web' })}`;
const mutate = (method, path, user) => {
  let req = request(app)[method](path).set('X-AutoFlow-Client', 'web').set('Origin', config.CLIENT_ORIGIN);
  if (user) req = req.set('Cookie', session(user));
  return req;
};
beforeAll(async () => {
  mongo = await MongoMemoryServer.create({ binary: { downloadDir: fileURLToPath(new URL('../../node_modules/.cache/mongodb-memory-server', import.meta.url)) } });
  await mongoose.connect(mongo.getUri());
  await Promise.all([Workshop.init(), User.init(), CustomerProfile.init()]);
  hash = await bcrypt.hash(password, 12);
});
beforeEach(async () => {
  await Promise.all([User.deleteMany({}), Workshop.deleteMany({}), CustomerProfile.deleteMany({})]);
  [first, second] = await Workshop.create([{ name: 'Precision Auto', slug: 'precision' }, { name: 'Other Shop', slug: 'other-shop' }]);
  [admin, tech, customer, outsider] = await User.create([
    { workshop: first.id, name: 'Owner', email: 'owner@test.dev', role: 'admin', passwordHash: hash },
    { workshop: first.id, name: 'Tech', email: 'tech@test.dev', role: 'technician', passwordHash: hash },
    { workshop: first.id, name: 'Customer', email: 'customer@test.dev', role: 'customer', passwordHash: hash },
    { workshop: second.id, name: 'Outsider', email: 'outsider@test.dev', role: 'customer', passwordHash: hash },
  ]);
  app = createApp(config);
});
afterAll(async () => { await mongoose.disconnect(); if (mongo) await mongo.stop(); });

describe('authentication and input validation', () => {
  it('reports database health and requires authentication', async () => {
    expect((await request(app).get('/api/health')).status).toBe(200);
    expect((await request(app).get('/api/dashboard')).status).toBe(401);
  });
  it('creates a customer, hashes the password and persists a CRM profile', async () => {
    const response = await mutate('post', '/api/auth/register').send({ name: 'New Customer', email: 'new@test.dev', password, workshopSlug: 'precision' });
    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe('customer');
    expect(response.body.user.passwordHash).toBeUndefined();
    const user = await User.findById(response.body.user.id).select('+passwordHash');
    expect(user.passwordHash).not.toBe(password);
    expect(await bcrypt.compare(password, user.passwordHash)).toBe(true);
    const cookie = response.headers['set-cookie'];
    expect(cookie[0]).toContain('HttpOnly'); expect(cookie[0]).toContain('SameSite=Lax');
    expect((await request(app).get('/api/auth/me').set('Cookie', cookie)).status).toBe(200);
    expect(await CustomerProfile.countDocuments({ user: user.id, workshop: first.id })).toBe(1);
  });
  it('rejects role escalation, query operators and short passwords', async () => {
    const input = { name: 'New Customer', email: 'new@test.dev', password, workshopSlug: 'precision' };
    expect((await mutate('post', '/api/auth/register').send({ ...input, role: 'admin' })).status).toBe(400);
    expect((await mutate('post', '/api/auth/register').send({ ...input, password: 'short' })).status).toBe(400);
    expect((await mutate('post', '/api/auth/login').send({ workshopSlug: 'precision', email: { $ne: null }, password })).status).toBe(400);
  });
  it('respects disabled customer registration', async () => {
    await Workshop.updateOne({ _id: first.id }, { registrationEnabled: false });
    expect((await mutate('post', '/api/auth/register').send({ name: 'New Customer', email: 'new@test.dev', password, workshopSlug: 'precision' })).status).toBe(400);
  });
  it('logs in with correct credentials only and never exposes password hashes', async () => {
    const valid = await mutate('post', '/api/auth/login').send({ email: admin.email, password, workshopSlug: 'precision' });
    expect(valid.status).toBe(200); expect(valid.body.user.passwordHash).toBeUndefined();
    expect((await mutate('post', '/api/auth/login').send({ email: admin.email, password: 'incorrect', workshopSlug: 'precision' })).status).toBe(401);
    expect((await mutate('post', '/api/auth/login').send({ email: admin.email, password, workshopSlug: 'other-shop' })).status).toBe(401);
  });
  it('rejects duplicate email within a tenant but permits it in another', async () => {
    const input = { name: 'Another Customer', email: customer.email, password, workshopSlug: 'precision' };
    expect((await mutate('post', '/api/auth/register').send(input)).status).toBe(409);
    expect((await mutate('post', '/api/auth/register').send({ ...input, workshopSlug: 'other-shop' })).status).toBe(201);
  });
  it('revokes a copied JWT on logout', async () => {
    const cookie = session(customer);
    expect((await mutate('post', '/api/auth/logout', customer).send({})).status).toBe(204);
    expect((await request(app).get('/api/auth/me').set('Cookie', cookie)).status).toBe(401);
  });
  it('changes password and revokes previous sessions', async () => {
    const oldCookie = session(customer);
    const next = 'A-new-secure-password-123';
    const response = await mutate('post', '/api/auth/password', customer).send({ currentPassword: password, newPassword: next });
    expect(response.status).toBe(200);
    expect((await request(app).get('/api/auth/me').set('Cookie', oldCookie)).status).toBe(401);
    expect((await request(app).get('/api/auth/me').set('Cookie', response.headers['set-cookie'])).status).toBe(200);
    const login = await mutate('post', '/api/auth/login').send({ email: customer.email, password: next, workshopSlug: 'precision' });
    expect(login.status).toBe(200);
  });
  it('limits sensitive requests', async () => {
    for (let i = 0; i < 20; i++) await mutate('post', '/api/auth/login').send({});
    expect((await mutate('post', '/api/auth/login').send({})).status).toBe(429);
  });
});

describe('roles, tenant boundaries and CSRF', () => {
  it('restricts directory access to admins and scopes pagination to the workshop', async () => {
    for (const user of [tech, customer]) expect((await request(app).get('/api/users').set('Cookie', session(user))).status).toBe(403);
    const response = await request(app).get('/api/users?limit=2&page=1').set('Cookie', session(admin));
    expect(response.status).toBe(200); expect(response.body.users).toHaveLength(2); expect(response.body.pagination.total).toBe(3);
    expect(response.body.users.every(u => u.workshopId === first.id)).toBe(true);
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
  });
  it('creates technicians only through authorized administrators', async () => {
    const input = { name: 'New Tech', email: 'newtech@test.dev', password };
    expect((await mutate('post', '/api/users', tech).send(input)).status).toBe(403);
    const response = await mutate('post', '/api/users', admin).send(input);
    expect(response.status).toBe(201); expect(response.body.user.role).toBe('technician'); expect(response.body.user.workshopId).toBe(first.id);
  });
  it('blocks cross-tenant mutation and protects owner accounts', async () => {
    expect((await mutate('patch', `/api/users/${outsider.id}/active`, admin).send({ active: false })).status).toBe(404);
    expect((await mutate('patch', `/api/users/${admin.id}/active`, admin).send({ active: false })).status).toBe(404);
    expect((await User.findById(outsider.id)).active).toBe(true);
  });
  it('deactivation revokes sessions; reactivation does not revive old sessions', async () => {
    const cookie = session(tech);
    expect((await mutate('patch', `/api/users/${tech.id}/active`, admin).send({ active: false })).status).toBe(200);
    expect((await request(app).get('/api/auth/me').set('Cookie', cookie)).status).toBe(401);
    expect((await mutate('post', '/api/auth/login').send({ email: tech.email, password, workshopSlug: 'precision' })).status).toBe(401);
    await mutate('patch', `/api/users/${tech.id}/active`, admin).send({ active: true });
    expect((await request(app).get('/api/auth/me').set('Cookie', cookie)).status).toBe(401);
  });
  it('returns only personal data to customers and technicians on the dashboard', async () => {
    const owner = await request(app).get('/api/dashboard').set('Cookie', session(admin));
    expect(owner.body.summary).toEqual({ customers: 1, technicians: 1, activeAccounts: 3, inactiveAccounts: 0 });
    for (const user of [customer, tech]) {
      const response = await request(app).get('/api/dashboard').set('Cookie', session(user));
      expect(response.body.summary).toBeNull(); expect(response.body.recentAccounts).toEqual([]);
      expect(response.body.account.id).toBe(user.id);
    }
  });
  it('rejects missing CSRF header and untrusted origins', async () => {
    expect((await request(app).post('/api/auth/logout').set('Cookie', session(admin)).send({})).status).toBe(403);
    expect((await mutate('post', '/api/auth/logout', admin).set('Origin', 'https://attacker.test').send({})).status).toBe(403);
  });
  it('allows profile updates but rejects mass assignment', async () => {
    expect((await mutate('patch', '/api/auth/profile', customer).send({ name: 'Changed Name', phone: '555-0101', workshop: second.id })).status).toBe(400);
    expect((await mutate('patch', '/api/auth/profile', customer).send({ name: 'Changed Name', phone: '555-0101' })).status).toBe(200);
    expect((await User.findById(customer.id)).name).toBe('Changed Name');
  });
  it('validates pagination and treats regex metacharacters as literal search text', async () => {
    expect((await request(app).get('/api/users?limit=999').set('Cookie', session(admin))).status).toBe(400);
    const response = await request(app).get('/api/users?search=.*').set('Cookie', session(admin));
    expect(response.body.pagination.total).toBe(0);
  });
  it('enforces secure production configuration', () => {
    expect(cookieOptions({ NODE_ENV: 'production' }).secure).toBe(true);
    expect(() => loadConfig({ MONGODB_URI: 'mongodb://localhost/test', JWT_SECRET: 'short' })).toThrow();
    expect(() => loadConfig({ ...config, NODE_ENV: 'production', MONGODB_URI: 'mongodb://localhost/test' })).toThrow(/HTTPS/);
  });
});
