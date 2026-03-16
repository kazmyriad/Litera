// This file handles routes to server-side

import express, { request, response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAuthParams, uploadBuffer} from './imagekit';
import mysql from 'mysql2/promise';

const app = express();
app.use(cors({ origin: process.env.ALLOWED_ORIGIN ?? '*', credentials: true}));
app.use(express.json({ limit: '10mb' }));

// pool
const pool = mysql.createPool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASS ?? 'CrimsonCityWalls44!',
  database: process.env.DB_NAME ?? 'litera',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// helper
async function getUserById(id: number) {
  const [rows] = await pool.query('SELECT id, username, firstname, lastname, email FROM users WHERE id = ?', [id]);
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

// API endpoint
app.get('/api/users/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid user id' });

  try {
    const user = await getUserById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) {
    console.error('user fetch error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/imagekit/auth', (_req, res) => {
    res.json(getAuthParams());
});

app.post('/api/imagekit/upload-base64', async (_req, res) => {
    // body can be undefined if client sends no JSON, guard against that with ||
    const { base64, fileName, folder } = (_req.body || {}) as { base64?: string; fileName?: string; folder?: string; };
    if (!base64) return res.status(400).json({ error: 'base64 is required' });

    const b64 = base64.includes(',') ? base64.split(',')[1] : base64;
    const buffer = Buffer.from(b64, 'base64');

    try {
        const result = await uploadBuffer(buffer, {fileName, folder});
        res.status(201).json(result);
    } catch (e) {
        console.error('[IK] upload failed:', e);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// serve Vite build (connect to client)
const distDir = path.join(process.cwd(), 'dist'); // Vite default outDir is "dist"
app.use(express.static(distDir));

app.get(/^\/(?!api).*/, (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(distDir, 'index.html'));
});

if (process.env.NODE_ENV !== "test") {
  app.listen(process.env.PORT || 3002, () => {
    console.log(`ImageKit auth server listening on ${process.env.PORT || 3002}`);
  });
}

export default app;
