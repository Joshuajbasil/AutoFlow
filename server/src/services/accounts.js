import bcrypt from 'bcrypt';
import { User, CustomerProfile } from '../models/index.js';

export async function createAccount({ workshop, name, email, phone = '', password, role }) {
  const passwordHash = await bcrypt.hash(password, 12);
  // Identity is the authoritative account record. A missing CRM extension is safely
  // upserted on profile reads, so a standalone local MongoDB needs no transaction.
  return User.create({ workshop, name, email, phone, passwordHash, role });
}

export async function ensureCustomerProfile(user) {
  return CustomerProfile.findOneAndUpdate(
    { workshop: user.workshop, user: user._id },
    { $setOnInsert: { address: '', preferences: { emailUpdates: false } } },
    { upsert: true, new: true, runValidators: true },
  );
}
