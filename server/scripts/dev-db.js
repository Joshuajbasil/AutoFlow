import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { MongoMemoryServer } from 'mongodb-memory-server';

// A real, disk-backed mongod for local development when MongoDB is not installed.
// The helper downloads the binary on first use; data persists under .local/mongodb.
const dbPath = fileURLToPath(new URL('../../.local/mongodb', import.meta.url));
await mkdir(dbPath, { recursive: true });
const downloadDir = fileURLToPath(new URL('../../node_modules/.cache/mongodb-memory-server', import.meta.url));
const mongo = new MongoMemoryServer({ binary: { downloadDir }, instance: { ip: '127.0.0.1', port: 27017, dbName: 'autoflow', dbPath, storageEngine: 'wiredTiger' } });
await mongo.start(true);
console.log(`Development MongoDB: ${mongo.getUri('autoflow')}`);
console.log('Data persists in .local/mongodb. Keep this terminal open.');
const shutdown = async () => { await mongo.stop({ doCleanup: false }); process.exit(0); };
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
