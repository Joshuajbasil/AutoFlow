import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { randomUUID } from 'node:crypto';
import { apiRouter } from './routes/index.js';
import { HttpError, errorHandler } from './utils/errors.js';

export function createApp(config) {
  const app = express();
  app.disable('x-powered-by');
  if (config.TRUST_PROXY === '1') app.set('trust proxy', 1);
  app.use((req, res, next) => { req.id = randomUUID(); res.set('X-Request-Id', req.id); res.set('Cache-Control', 'no-store'); next(); });
  app.use(helmet());
  app.use(cors({ origin: config.CLIENT_ORIGIN, credentials: true, allowedHeaders: ['Content-Type', 'X-AutoFlow-Client'] }));
  app.use('/api', rateLimit({ windowMs: 60000, limit: 180, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: { message: 'Too many requests. Please try again shortly.' } } }));
  app.use((req, res, next) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      if (req.headers.origin && req.headers.origin !== config.CLIENT_ORIGIN) throw new HttpError(403, 'Request origin is not allowed.');
      // Custom headers require CORS preflight, preventing cross-site form CSRF.
      if (req.get('X-AutoFlow-Client') !== 'web') throw new HttpError(403, 'Missing request verification header.');
      if (!req.is('application/json')) throw new HttpError(415, 'Content-Type must be application/json.');
    }
    next();
  });
  app.use(express.json({ limit: '20kb' }));
  app.use(cookieParser());
  app.use('/api', apiRouter(config));
  app.use((req, res, next) => next(new HttpError(404, 'Endpoint not found.')));
  app.use(errorHandler);
  return app;
}
