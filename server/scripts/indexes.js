import mongoose from 'mongoose';
import { loadConfig } from '../src/config/env.js';
import { connectDatabase } from '../src/config/database.js';
import { Workshop, User, CustomerProfile } from '../src/models/index.js';

try {
  await connectDatabase(loadConfig().MONGODB_URI);
  // createIndexes adds declared indexes and never drops existing indexes.
  for (const model of [Workshop, User, CustomerProfile]) {
    await model.createIndexes();
    console.log(`${model.modelName}: indexes ready`);
  }
} catch (error) { console.error('Index creation failed:', error.message); process.exitCode = 1; }
finally { await mongoose.disconnect(); }
