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

// database pool
// note: you must start the SQL connection first before running the server
// note: you must restart the server before running the front end
// type npm run build:server, then type node dist-server/server.js to start the server
// open a separate terminal and type npm run dev to start the front end

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
  const [rows] = await pool.query('SELECT id, username, firstname, lastname, email, dob FROM users WHERE id = ?', [id]);
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

async function checkUniqueUsernameEmail(username?: string, email?: string, idToIgnore?: number) {
  const conditions: string[] = [];
  const params: Array<string|number> = [];

  if (username) {
    conditions.push('username = ?');
    params.push(username);
  }
  if (email) {
    conditions.push('email = ?');
    params.push(email);
  }

  if (conditions.length === 0) {
    return [];
  }

  let sql = `SELECT id, username, email FROM users WHERE (${conditions.join(' OR ')})`;
  if (typeof idToIgnore === 'number' && !Number.isNaN(idToIgnore)) {
    sql += ' AND id <> ?';
    params.push(idToIgnore);
  }

  const [rows] = await pool.query(sql, params);
  return Array.isArray(rows) ? rows : [];
}

// API endpoints
// users
// check if username/email is unique (for validation on frontend)
app.get('/api/users/check-unique', async (req, res) => {
  const username = typeof req.query.username === 'string' ? req.query.username : undefined;
  const email = typeof req.query.email === 'string' ? req.query.email : undefined;
  const rawId = typeof req.query.id === 'string' ? req.query.id : undefined;
  const id = rawId && !Number.isNaN(Number(rawId)) ? Number(rawId) : undefined;

  if (!username && !email) {
    return res.status(400).json({ error: 'username/email required' });
  }

  try {
    const conflicts = await checkUniqueUsernameEmail(username, email, id);
    res.json({ unique: conflicts.length === 0, conflicts });
  } catch (e) {
    console.error('check unique error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// search user by id
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

const USERNAME_REGEX = /^[A-Za-z0-9_]{1,20}$/;
const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

app.put('/api/users/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { username, email, firstname, lastname, dob } = req.body || {};

  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid user id' });
  if (!username || !USERNAME_REGEX.test(username)) return res.status(400).json({ error: 'Bad username' });
  if (!email || !EMAIL_REGEX.test(email)) return res.status(400).json({ error: 'Bad email' });

  try {
    const conflicts = await checkUniqueUsernameEmail(username, email, id);
    if (conflicts.length > 0) {
      return res.status(409).json({ error: 'Username or email already in use', conflicts });
    }

    await pool.query(
      `UPDATE users SET username = ?, email = ?, firstname = ?, lastname = ?, dob = ? WHERE id = ?`,
      [username, email, firstname, lastname, dob, id]
    );

    const user = await getUserById(id);
    res.json({ success: true, user });
  } catch (e) {
    console.error('update profile error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// imagekit
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
