import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

dotenv.config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) });

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  MONGODB_URI: z.string().regex(/^mongodb(\+srv)?:\/\//),
  JWT_SECRET: z.string().min(32).refine(v => !v.startsWith('replace-'), 'Generate a random JWT secret'),
  CLIENT_ORIGIN: z.url().default('http://localhost:5173'),
  TRUST_PROXY: z.enum(['0', '1']).default('0'),
});

export function loadConfig(source = process.env) {
  const result = schema.safeParse(source);
  if (!result.success) throw new Error(`Invalid environment: ${result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
  const config = result.data;
  if (config.NODE_ENV === 'production' && !config.CLIENT_ORIGIN.startsWith('https://')) throw new Error('Production requires an HTTPS CLIENT_ORIGIN');
  if (new URL(config.CLIENT_ORIGIN).origin !== config.CLIENT_ORIGIN) throw new Error('CLIENT_ORIGIN must be an origin without a trailing slash or path');
  return config;
}
