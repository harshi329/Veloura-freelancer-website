import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { apiRouter } from './routes/api.js';
import { authExtrasRouter } from './routes/authExtras.js';

export function createApp() {
  const app = express();
  // Correct req.protocol / req.ip behind Render or other reverse proxies.
  app.set('trust proxy', 1);

  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || true,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));
  app.use(cookieParser());

  app.use('/api', authExtrasRouter);
  app.use('/api', apiRouter);

  return app;
}
