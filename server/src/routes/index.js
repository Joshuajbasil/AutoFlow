import { Router } from 'express';
import mongoose from 'mongoose';
import { rateLimit } from 'express-rate-limit';
import { authenticate, authorize } from '../middleware/auth.js';
import { authController } from '../controllers/auth.js';
import { validate, loginSchema, registerSchema, profileSchema, passwordSchema, employeeSchema, activeSchema, listSchema } from '../validators/auth.js';
import { User, Workshop, publicUser } from '../models/index.js';
import { createAccount } from '../services/accounts.js';
import { HttpError } from '../utils/errors.js';

export function apiRouter(config) {
  const router = Router();
  const auth = authController(config);
  const sensitive = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: { message: 'Too many attempts. Please try again in 15 minutes.' } } });
  router.get('/health', (req, res) => { const ready = mongoose.connection.readyState === 1; res.status(ready ? 200 : 503).json({ status: ready ? 'ok' : 'unavailable' }); });
  router.post('/auth/register', sensitive, validate(registerSchema), auth.register);
  router.post('/auth/login', sensitive, validate(loginSchema), auth.login);
  router.use(authenticate(config));
  router.get('/auth/me', auth.me);
  router.post('/auth/logout', auth.logout);
  router.patch('/auth/profile', validate(profileSchema), auth.updateProfile);
  router.post('/auth/password', sensitive, validate(passwordSchema), auth.changePassword);
  router.get('/dashboard', async (req, res) => {
    const workshop = await Workshop.findById(req.workshopId).select('name slug timezone capacity');
    if (!workshop) throw new HttpError(404, 'Workshop not found.');
    let summary = null;
    let recentAccounts = [];
    if (req.user.role === 'admin') {
      const scope = { workshop: req.workshopId };
      const [customers, technicians, activeAccounts, inactiveAccounts, recent] = await Promise.all([
        User.countDocuments({ ...scope, role: 'customer' }),
        User.countDocuments({ ...scope, role: 'technician', active: true }),
        User.countDocuments({ ...scope, active: true }),
        User.countDocuments({ ...scope, active: false }),
        User.find(scope).sort({ createdAt: -1 }).limit(5),
      ]);
      summary = { customers, technicians, activeAccounts, inactiveAccounts };
      recentAccounts = recent.map(publicUser);
    }
    res.json({ workshop, summary, recentAccounts, account: publicUser(req.user) });
  });
  router.get('/users', authorize('admin'), validate(listSchema, 'query'), async (req, res) => {
    const { page, limit, search, role, active, sort } = req.validated;
    const filter = { workshop: req.workshopId };
    if (role) filter.role = role;
    if (active) filter.active = active === 'true';
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [{ name: { $regex: escaped, $options: 'i' } }, { email: { $regex: escaped, $options: 'i' } }];
    }
    const [users, total] = await Promise.all([User.find(filter).sort(sort === 'name' ? { name: 1, _id: 1 } : { createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit), User.countDocuments(filter)]);
    res.json({ users: users.map(publicUser), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  });
  router.post('/users', authorize('admin'), sensitive, validate(employeeSchema), async (req, res) => {
    const user = await createAccount({ ...req.validated, workshop: req.workshopId, role: 'technician' });
    res.status(201).json({ user: publicUser(user) });
  });
  router.patch('/users/:id/active', authorize('admin'), validate(activeSchema), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, 'Account not found.');
    const user = await User.findOneAndUpdate({ _id: req.params.id, workshop: req.workshopId, role: { $in: ['technician', 'customer'] } }, { $set: { active: req.validated.active }, $inc: { tokenVersion: 1 } }, { new: true, runValidators: true });
    if (!user) throw new HttpError(404, 'Account not found or cannot be modified.');
    res.json({ user: publicUser(user) });
  });
  return router;
}
