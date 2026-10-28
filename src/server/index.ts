import path from 'path';
import fs from 'fs';
import express from 'express';
import { createApp } from './app.js';
import { connectDB } from './db/connect.js';
import { runMigrations } from './db/migrate.js';
import { seedDatabase } from './db/seed.js';

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  await connectDB();
  await runMigrations();
  await seedDatabase(false);

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
