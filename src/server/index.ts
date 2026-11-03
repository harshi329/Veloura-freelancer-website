import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import express from 'express';
import { createApp } from './app.js';
import { connectDB } from './db/connect.js';
import { runMigrations } from './db/migrate.js';
import { seedDatabase } from './db/seed.js';
import { getJwtSecret } from './middleware/auth.js';

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  // Validate JWT Secret early before starting server
  getJwtSecret();

  await connectDB();
  await runMigrations();

  // Seed demo data ONLY in development when explicitly enabled
  const shouldSeed =
    process.env.NODE_ENV !== 'production' &&
    (process.env.SEED_DEMO_DATA === 'true' || process.env.AUTO_SEED === 'true');

  if (shouldSeed) {
    console.log('[Veloura] Seeding demo marketplace accounts (SEED_DEMO_DATA is true)...');
    await seedDatabase(false);
  } else {
    console.log('[Veloura] Automatic demo seeding disabled (production mode or SEED_DEMO_DATA not set).');
  }

  const app = createApp();

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const clientDist = path.resolve(process.cwd(), 'dist/client');
    if (fs.existsSync(clientDist)) {
      app.use(express.static(clientDist));
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) {
          next();
          return;
        }
        res.sendFile(path.join(clientDist, 'index.html'));
      });
    }
  }

  app.listen(PORT, () => {
    console.log(`[Veloura] Full-stack server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Veloura] Failed to start server:', err);
  process.exit(1);
});
