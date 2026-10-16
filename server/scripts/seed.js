import mongoose from 'mongoose';
import { loadConfig } from '../src/config/env.js';
import { connectDatabase } from '../src/config/database.js';
import { Workshop, User, CustomerProfile } from '../src/models/index.js';
import { createAccount, ensureCustomerProfile } from '../src/services/accounts.js';

try {
  const config = loadConfig();
  if (config.NODE_ENV === 'production') throw new Error('Demo seeding is disabled in production.');
  const password = process.env.SEED_PASSWORD;
  if (!password || password.length < 12 || Buffer.byteLength(password) > 72) throw new Error('Set SEED_PASSWORD to 12–72 characters (maximum 72 UTF-8 bytes).');
  await connectDatabase(config.MONGODB_URI);
  await Promise.all([Workshop.init(), User.init(), CustomerProfile.init()]);
  const workshop = await Workshop.findOneAndUpdate({ slug: 'autoflow-demo' }, { $setOnInsert: { name: 'Precision Auto Works', timezone: 'America/New_York', capacity: 4 } }, { upsert: true, new: true, runValidators: true });
  const accounts = [
    { name: 'Alex Morgan', email: 'owner@autoflow.demo', role: 'admin', phone: '555-0101' },
    { name: 'Jordan Lee', email: 'tech@autoflow.demo', role: 'technician', phone: '555-0102' },
    { name: 'Taylor Brooks', email: 'customer@autoflow.demo', role: 'customer', phone: '555-0103' },
    { name: 'Sam Rivera', email: 'sam@autoflow.demo', role: 'customer', phone: '555-0104' },
    { name: 'Casey Chen', email: 'casey@autoflow.demo', role: 'technician', phone: '555-0105' },
  ];
  for (const account of accounts) {
    let user = await User.findOne({ workshop: workshop._id, email: account.email });
    if (!user) user = await createAccount({ ...account, workshop: workshop._id, password });
    if (user.role === 'customer') await ensureCustomerProfile(user);
    console.log(`${account.role}: ${account.email}`);
  }
  console.log('Workshop code: autoflow-demo. New accounts use SEED_PASSWORD. Existing accounts were preserved.');
} catch (error) { console.error('Seed failed:', error.message); process.exitCode = 1; }
finally { await mongoose.disconnect(); }
