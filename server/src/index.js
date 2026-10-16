import mongoose from 'mongoose';
import { loadConfig } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { createApp } from './app.js';
import { Workshop, User, CustomerProfile } from './models/index.js';

try {
  const config = loadConfig();
  await connectDatabase(config.MONGODB_URI);
  await Promise.all([Workshop.init(), User.init(), CustomerProfile.init()]);
  const server = createApp(config).listen(config.PORT, () => console.log(`AutoFlow API listening on port ${config.PORT}`));
  const shutdown = () => {
    server.close(async () => { await mongoose.disconnect(); process.exit(0); });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  server.on('error', error => { console.error('Server could not start:', error.code); process.exit(1); });
} catch (error) {
  console.error('Startup failed:', error.name === 'MongooseServerSelectionError' ? 'Cannot connect to MongoDB. Check MONGODB_URI and start your database.' : error.message);
  process.exit(1);
}
