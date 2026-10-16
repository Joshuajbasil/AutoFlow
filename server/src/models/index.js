import mongoose from 'mongoose';

const { Schema, model } = mongoose;
const options = { timestamps: true, strict: 'throw' };
const workshopSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  slug: { type: String, required: true, lowercase: true, match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, maxlength: 60 },
  timezone: { type: String, default: 'America/New_York' },
  capacity: { type: Number, default: 4, min: 1, max: 100 },
  registrationEnabled: { type: Boolean, default: true },
}, options);
workshopSchema.index({ slug: 1 }, { unique: true });

const userSchema = new Schema({
  workshop: { type: Schema.Types.ObjectId, ref: 'Workshop', required: true, immutable: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  phone: { type: String, default: '', maxlength: 30 },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'technician', 'customer'], required: true, immutable: true },
  active: { type: Boolean, default: true },
  tokenVersion: { type: Number, default: 0, select: false },
  lastLoginAt: Date,
}, options);
userSchema.index({ workshop: 1, email: 1 }, { unique: true });
userSchema.index({ workshop: 1, role: 1, active: 1, createdAt: -1 });

// Customer contact details live on User; this one-to-one extension holds CRM data.
const customerProfileSchema = new Schema({
  workshop: { type: Schema.Types.ObjectId, ref: 'Workshop', required: true, immutable: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
  address: { type: String, default: '', maxlength: 300 },
  preferences: { emailUpdates: { type: Boolean, default: false } },
}, options);
customerProfileSchema.index({ workshop: 1, user: 1 }, { unique: true });

export const Workshop = model('Workshop', workshopSchema);
export const User = model('User', userSchema);
export const CustomerProfile = model('CustomerProfile', customerProfileSchema);

export function publicUser(user) {
  return { id: user._id.toString(), name: user.name, email: user.email, phone: user.phone, role: user.role, active: user.active, workshopId: user.workshop.toString(), createdAt: user.createdAt, lastLoginAt: user.lastLoginAt };
}
