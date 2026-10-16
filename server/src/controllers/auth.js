import bcrypt from 'bcrypt';
import { Workshop, User, publicUser } from '../models/index.js';
import { createAccount, ensureCustomerProfile } from '../services/accounts.js';
import { issueSession, clearSession } from '../middleware/auth.js';
import { HttpError } from '../utils/errors.js';

// Use the same work factor for unknown accounts to reduce account enumeration timing.
const dummyHash = await bcrypt.hash('unused-comparison-password', 12);
export function authController(config) {
  return {
    async register(req, res) {
      const { workshopSlug, ...input } = req.validated;
      const workshop = await Workshop.findOne({ slug: workshopSlug, registrationEnabled: true });
      if (!workshop) throw new HttpError(400, 'Customer registration is unavailable for this workshop code.');
      const user = await createAccount({ ...input, workshop: workshop._id, role: 'customer' });
      issueSession(res, user, config);
      res.status(201).json({ user: publicUser(user), workshop: { id: workshop.id, name: workshop.name, slug: workshop.slug } });
    },
    async login(req, res) {
      const { workshopSlug, email, password } = req.validated;
      const workshop = await Workshop.findOne({ slug: workshopSlug });
      const user = workshop ? await User.findOne({ workshop: workshop._id, email }).select('+passwordHash +tokenVersion') : null;
      const valid = await bcrypt.compare(password, user?.passwordHash || dummyHash);
      if (!valid || !user?.active) throw new HttpError(401, 'Invalid workshop code, email, or password.');
      user.lastLoginAt = new Date();
      await user.save();
      issueSession(res, user, config);
      res.json({ user: publicUser(user), workshop: { id: workshop.id, name: workshop.name, slug: workshop.slug } });
    },
    async me(req, res) {
      const workshop = await Workshop.findById(req.workshopId).select('name slug timezone');
      if (!workshop) throw new HttpError(401, 'Workshop is unavailable.');
      if (req.user.role === 'customer') await ensureCustomerProfile(req.user);
      res.json({ user: publicUser(req.user), workshop: { id: workshop.id, name: workshop.name, slug: workshop.slug, timezone: workshop.timezone } });
    },
    async logout(req, res) {
      await User.updateOne({ _id: req.user._id, workshop: req.workshopId }, { $inc: { tokenVersion: 1 } });
      clearSession(res, config);
      res.status(204).end();
    },
    async updateProfile(req, res) {
      const user = await User.findOneAndUpdate({ _id: req.user._id, workshop: req.workshopId }, { $set: req.validated }, { new: true, runValidators: true });
      res.json({ user: publicUser(user) });
    },
    async changePassword(req, res) {
      const user = await User.findOne({ _id: req.user._id, workshop: req.workshopId }).select('+passwordHash +tokenVersion');
      if (!await bcrypt.compare(req.validated.currentPassword, user.passwordHash)) throw new HttpError(400, 'Current password is incorrect.');
      const passwordHash = await bcrypt.hash(req.validated.newPassword, 12);
      const updated = await User.findOneAndUpdate({ _id: user._id, workshop: req.workshopId, tokenVersion: user.tokenVersion }, { $set: { passwordHash }, $inc: { tokenVersion: 1 } }, { new: true }).select('+tokenVersion');
      if (!updated) throw new HttpError(409, 'Your session changed. Please sign in again.');
      issueSession(res, updated, config);
      res.json({ message: 'Password changed. Other sessions have been signed out.' });
    },
  };
}
