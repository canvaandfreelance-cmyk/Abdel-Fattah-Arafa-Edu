// server.ts
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser } from './src/db/users.ts';
import { getUserFullData, syncUserData } from './src/db/data.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '15mb' }));

  // API Route: User info / verification
  app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user || !req.user.uid) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const dbUser = await getOrCreateUser(
        req.user.uid,
        req.user.email || 'user@example.com',
        req.user.name || undefined,
        req.user.picture || undefined
      );

      res.json({
        user: {
          id: dbUser.id,
          uid: dbUser.uid,
          email: dbUser.email,
          displayName: dbUser.displayName,
          photoUrl: dbUser.photoUrl,
          role: dbUser.role,
        },
      });
    } catch (error: any) {
      console.error('Error in /api/auth/me:', error);
      res.status(500).json({ error: 'Failed to authenticate user.' });
    }
  });

  // API Route: Get all user data from PostgreSQL
  app.get('/api/data', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user || !req.user.uid) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const dbUser = await getOrCreateUser(
        req.user.uid,
        req.user.email || 'user@example.com',
        req.user.name || undefined,
        req.user.picture || undefined
      );

      const data = await getUserFullData(dbUser.id);
      res.json(data);
    } catch (error: any) {
      console.error('Error in /api/data:', error);
      res.status(500).json({ error: 'Failed to retrieve database data.' });
    }
  });

  // API Route: Sync data to PostgreSQL
  app.post('/api/sync', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user || !req.user.uid) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const dbUser = await getOrCreateUser(
        req.user.uid,
        req.user.email || 'user@example.com',
        req.user.name || undefined,
        req.user.picture || undefined
      );

      const result = await syncUserData(dbUser.id, req.body);
      res.json(result);
    } catch (error: any) {
      console.error('Error in /api/sync:', error);
      res.status(500).json({ error: 'Failed to synchronize data with database.' });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // Vite integration
  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: 3000,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://0.0.0.0:${PORT} in ${isProduction ? 'production' : 'development'} mode`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
