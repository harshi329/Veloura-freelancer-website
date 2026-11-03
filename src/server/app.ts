import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { apiRouter } from './routes/api.js';
import { authExtrasRouter } from './routes/authExtras.js';

export function createApp() {
  const app = express();
  // Correct req.protocol / req.ip behind Render or other reverse proxies.
  app.set('trust proxy', 1);

  // 1. Security Headers via Helmet
  app.use(
    helmet({
      contentSecurityPolicy: false, // Managed by Vite index.html meta
      crossOriginEmbedderPolicy: false,
    })
  );

  // 2. Strict CORS policy
  const isProduction = process.env.NODE_ENV === 'production';
  const clientOrigin = process.env.CLIENT_ORIGIN;
  const origins = clientOrigin
    ? clientOrigin.split(',').map((o) => o.trim())
    : isProduction
    ? false // Refuse arbitrary origins in production if CLIENT_ORIGIN is not set
    : true; // Allow local dev origins

  app.use(
    cors({
      origin: origins,
      credentials: true,
    })
  );

  // 3. Sensible Body Parser Limits (5MB for portfolio credentials/images)
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));
  app.use(cookieParser());

  app.use('/api', authExtrasRouter);
  app.use('/api', apiRouter);

  return app;
}
