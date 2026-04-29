// This file handles routes to server-side

import 'dotenv/config';
import express, { request, response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAuthParams, uploadBuffer } from './imagekit';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import multer from 'multer';
import fs from 'fs';

const app = express();
app.use(cors({ origin: process.env.ALLOWED_ORIGIN ?? '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));

// ----------- FILE UPLOAD SETUP -----------
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_MIME.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files (jpg, png, gif, webp) are allowed'));
  },
});

app.use('/uploads', express.static(uploadsDir));

// Valid community categories - must match client schema
const VALID_CATEGORIES = [
  'fantasy',
  'horror',
  'art',
  'science',
  'music',
  'sports',
  'movies',
  'literature',
  'travel',
  'food',
  'romance',
  'sci-fi',
  'fiction',
  'non-fiction',
];

// database pool
// note: you must start the SQL connection first before running the server
// note: you must restart the server before running the front end
// type npm run build:server, then type node dist-server/server.js to start the server
// open a separate terminal and type npm run dev to start the front end
//
// Aiven MySQL requires TLS. We enable SSL whenever we're not pointing at
// localhost (so `npm run dev` against a local MySQL still works without certs).
const isRemoteDb =
  !!process.env.DB_HOST &&
  process.env.DB_HOST !== 'localhost' &&
  process.env.DB_HOST !== '127.0.0.1';

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASS ?? 'CrimsonCityWalls44!',
  database: process.env.DB_NAME ?? 'litera',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Aiven presents a valid CA-signed cert; rejectUnauthorized:true is the safe default.
  ssl: isRemoteDb ? { rejectUnauthorized: false } : undefined,
});

// Fail fast on startup if the DB is unreachable so Render logs point at the real problem
// instead of each API route returning a mysterious 500.
pool.getConnection()
  .then((conn) => {
    console.log(`[db] connected to ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    conn.release();
  })
  .catch((err) => {
    console.error('[db] initial connection failed:', err);
  });

// helper
async function getUserById(id: number) {
  const [rows] = await pool.query(
    'SELECT id, username, firstname, lastname, email, dob, avatar_url FROM users WHERE id = ?',
    [id]
  );
  if (!Array.isArray(rows) || !rows.length) return null;
  const u = rows[0] as any;
  return { ...u, avatarUrl: u.avatar_url ?? null };
}

async function checkUniqueUsernameEmail(username?: string, email?: string, idToIgnore?: number) {
  const conditions: string[] = [];
  const params: Array<string | number> = [];

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
  const { username, email, firstname, lastname, dob, avatarUrl } = req.body || {};

  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid user id' });
  if (!username || !USERNAME_REGEX.test(username)) return res.status(400).json({ error: 'Bad username' });
  if (!email || !EMAIL_REGEX.test(email)) return res.status(400).json({ error: 'Bad email' });

  try {
    const conflicts = await checkUniqueUsernameEmail(username, email, id);
    if (conflicts.length > 0) {
      return res.status(409).json({ error: 'Username or email already in use', conflicts });
    }

    await pool.query(
      `UPDATE users SET username = ?, email = ?, firstname = ?, lastname = ?, dob = ?, avatar_url = ? WHERE id = ?`,
      [username, email, firstname, lastname, dob, avatarUrl ?? null, id]
    );

    const user = await getUserById(id);
    res.json({ success: true, user });
  } catch (e) {
    console.error('update profile error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// local file upload — saves to /uploads and returns a relative URL
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = `/uploads/${req.file.filename}`;
  res.status(201).json({ url, filename: req.file.filename });
});

// imagekit
app.get('/api/imagekit/auth', (_req, res) => {
  res.json(getAuthParams());
});

app.post('/api/imagekit/upload-base64', async (_req, res) => {
  // body can be undefined if client sends no JSON, guard against that with ||
  const { base64, fileName, folder } = (_req.body || {}) as { base64?: string; fileName?: string; folder?: string };
  if (!base64) return res.status(400).json({ error: 'base64 is required' });

  const b64 = base64.includes(',') ? base64.split(',')[1] : base64;
  const buffer = Buffer.from(b64, 'base64');

  try {
    const result = await uploadBuffer(buffer, { fileName, folder });
    res.status(201).json(result);
  } catch (e) {
    console.error('[IK] upload failed:', e);
    res.status(500).json({ error: 'Upload failed' });
  }
});

const BCRYPT_ROUNDS = 12;

// create user
app.post('/api/users', async (req, res) => {
  const { username, email, firstname, lastname, dob, password } = req.body || {};

  // basic validation
  if (!username || !USERNAME_REGEX.test(username)) {
    return res.status(400).json({ error: 'Bad username' });
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'Bad email' });
  }

  try {
    // check uniqueness
    const conflicts = await checkUniqueUsernameEmail(username, email);
    if (conflicts.length > 0) {
      return res.status(409).json({
        error: 'Username or email already in use',
        conflicts,
      });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // insert user
    const [result] = await pool.query<mysql.ResultSetHeader>(
      `
      INSERT INTO users (username, email, firstname, lastname, dob, password)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [username, email, firstname, lastname, dob, passwordHash]
    );

    const newUserId = result.insertId;

    const user = await getUserById(newUserId);

    res.status(201).json({
      success: true,
      user,
    });
  } catch (e) {
    console.error('create user error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// login user
app.post('/api/auth/login', async (req, res) => {
  const { identifier, password } = req.body || {};

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  try {
    // find by username OR email
    const [rows] = await pool.query(
      `
      SELECT id, username, email, password
      FROM users
      WHERE username = ? OR email = ?
      LIMIT 1
      `,
      [identifier, identifier]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0] as any;

    // compare password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // return safe user payload — re-fetch to pick up avatar_url
    const fullUser = await getUserById(user.id);
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: fullUser?.avatarUrl ?? null,
      },
    });
  } catch (err) {
    console.error('login error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ----------- COMMUNITY ROUTES --------------

// Normalise a DB row into the shape the client expects. Keeps GET list and
// GET /:id consistent so we don't have to chase mismatched fields later.
function rowToCommunity(row: any) {
  // `categories` / `rules` in the DB are TEXT columns storing JSON. Parse
  // defensively so a legacy double-encoded value still renders instead of
  // throwing and nuking the whole list.
  const parseMaybeTwice = (value: string | null, fallback: any) => {
    if (value == null || value === '') return fallback;
    try {
      let parsed = JSON.parse(value);
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
      return parsed;
    } catch {
      return fallback;
    }
  };

  return {
    id: row.id,
    ownerId: row.owner_id,
    owner: row.owner ?? undefined,
    ownerAvatarUrl: row.owner_avatar_url ?? undefined,
    name: row.name,
    description: row.description,
    categories: parseMaybeTwice(row.categories, []),
    visibility: row.visibility,
    rules: parseMaybeTwice(row.rules, {}),
    colorScheme: row.color_scheme,
    thumbnailUrl: row.thumbnail_url,
    createdAt: row.created_at,
  };
}

// GET /api/communities/current-reads?user_id=X
// Returns the current book for every community the user is a member of.
// Must be declared before /:id so Express doesn't swallow "current-reads" as an id.
app.get('/api/communities/current-reads', async (req, res) => {
  const userId = Number(req.query.user_id);
  if (!Number.isInteger(userId) || userId < 1)
    return res.status(400).json({ error: 'valid user_id is required' });

  try {
    const [rows] = await pool.query(
      `SELECT c.id AS community_id, c.name AS community_name,
              b.id, b.isbn13, b.title, b.subtitle, b.authors, b.categories,
              b.thumbnail, b.description, b.published_year, b.average_rating
       FROM community_members cm
       JOIN communities c ON cm.community_id = c.id
       JOIN community_books cb ON cb.community_id = c.id AND cb.status = 'current'
       JOIN books b ON cb.book_id = b.id
       WHERE cm.user_id = ?`,
      [userId]
    );
    const result = (Array.isArray(rows) ? rows as any[] : []).map(r => ({
      communityId: r.community_id,
      communityName: r.community_name,
      book: {
        id: r.id, isbn13: r.isbn13, title: r.title, subtitle: r.subtitle,
        authors: r.authors, categories: r.categories, thumbnail: r.thumbnail,
        description: r.description, published_year: r.published_year,
        average_rating: r.average_rating,
      },
    }));
    res.json(result);
  } catch (e) {
    console.error('community current-reads error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ----------- SHELF ROUTES --------------

// GET /api/shelves?user_id=X
app.get('/api/shelves', async (req, res) => {
  const userId = Number(req.query.user_id);
  if (!Number.isInteger(userId) || userId < 1)
    return res.status(400).json({ error: 'valid user_id is required' });

  try {
    const [rows] = await pool.query(
      `SELECT s.id AS shelf_id, s.name AS shelf_name, s.created_at AS shelf_created,
              b.id, b.isbn13, b.title, b.subtitle, b.authors, b.categories,
              b.thumbnail, b.description, b.published_year, b.average_rating
       FROM user_shelves s
       LEFT JOIN shelf_books sb ON sb.shelf_id = s.id
       LEFT JOIN books b ON sb.book_id = b.id
       WHERE s.user_id = ?
       ORDER BY s.created_at DESC, sb.added_at ASC`,
      [userId]
    );
    const shelfMap = new Map<number, { id: number; name: string; books: any[] }>();
    for (const r of (Array.isArray(rows) ? rows as any[] : [])) {
      if (!shelfMap.has(r.shelf_id)) {
        shelfMap.set(r.shelf_id, { id: r.shelf_id, name: r.shelf_name, books: [] });
      }
      if (r.id != null) {
        shelfMap.get(r.shelf_id)!.books.push({
          id: r.id, isbn13: r.isbn13, title: r.title, subtitle: r.subtitle,
          authors: r.authors, categories: r.categories, thumbnail: r.thumbnail,
          description: r.description, published_year: r.published_year,
          average_rating: r.average_rating,
        });
      }
    }
    res.json([...shelfMap.values()]);
  } catch (e) {
    console.error('fetch shelves error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/shelves — body: { user_id, name, book_ids: number[] }
app.post('/api/shelves', async (req, res) => {
  const userId = Number((req.body || {}).user_id);
  const name = typeof (req.body || {}).name === 'string' ? (req.body.name as string).trim() : '';
  const bookIds: number[] = Array.isArray((req.body || {}).book_ids)
    ? (req.body.book_ids as any[]).map(Number).filter(n => Number.isInteger(n) && n > 0)
    : [];

  if (!Number.isInteger(userId) || userId < 1)
    return res.status(400).json({ error: 'valid user_id is required' });
  if (!name) return res.status(400).json({ error: 'name is required' });

  try {
    const [result] = await pool.query<mysql.ResultSetHeader>(
      'INSERT INTO user_shelves (user_id, name) VALUES (?, ?)',
      [userId, name]
    );
    const shelfId = result.insertId;
    if (bookIds.length > 0) {
      const values = bookIds.map(bid => [shelfId, bid]);
      await pool.query('INSERT IGNORE INTO shelf_books (shelf_id, book_id) VALUES ?', [values]);
    }
    res.status(201).json({ id: shelfId, name, books: [] });
  } catch (e) {
    console.error('create shelf error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/communities', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT c.*, u.username AS owner, u.avatar_url AS owner_avatar_url
      FROM communities c
      JOIN users u ON c.owner_id = u.id
      ORDER BY c.created_at DESC
      `
    );
    const communities = Array.isArray(rows) ? rows.map(rowToCommunity) : [];
    res.json(communities);
  } catch (e) {
    console.error('fetch communities error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/communities/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid community id' });
  }

  try {
    const [rows] = await pool.query(
      `
      SELECT c.*, u.username AS owner, u.avatar_url AS owner_avatar_url
      FROM communities c
      JOIN users u ON c.owner_id = u.id
      WHERE c.id = ?
      LIMIT 1
      `,
      [id]
    );
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ error: 'Community not found' });
    }
    res.json(rowToCommunity(rows[0]));
  } catch (e) {
    console.error('fetch community error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/communities', async (req, res) => {
  const body = req.body || {};
  const name: unknown = body.name;
  const description: unknown = body.description;
  const ownerId = Number(body.owner_id);
  const thumbnailUrl: string | null = body.thumbnail_url || null;
  const colorScheme: string = body.color_scheme || 'default';

  // --- Input validation ----------------------------------------------------
  if (typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'name is required' });
  }
  if (typeof description !== 'string') {
    return res.status(400).json({ error: 'description is required' });
  }
  if (!Number.isInteger(ownerId) || ownerId < 1) {
    return res.status(400).json({ error: 'valid owner_id is required' });
  }

  // Accept `categories` as either an array (correct) or a JSON string (legacy
  // client behaviour). Normalise to a real array before validating.
  let categories: string[] = [];
  if (Array.isArray(body.categories)) {
    categories = body.categories;
  } else if (typeof body.categories === 'string' && body.categories.length > 0) {
    try {
      const parsed = JSON.parse(body.categories);
      if (Array.isArray(parsed)) categories = parsed;
    } catch {
      return res.status(400).json({ error: 'categories must be an array' });
    }
  }
  const invalidCategories = categories.filter((cat) => !VALID_CATEGORIES.includes(cat));
  if (invalidCategories.length > 0) {
    return res.status(400).json({ error: `Invalid categories: ${invalidCategories.join(', ')}` });
  }

  // Same deal for `rules`: allow object or JSON-string.
  let rules: Record<string, unknown> = {};
  if (body.rules && typeof body.rules === 'object' && !Array.isArray(body.rules)) {
    rules = body.rules;
  } else if (typeof body.rules === 'string' && body.rules.length > 0) {
    try {
      const parsed = JSON.parse(body.rules);
      if (parsed && typeof parsed === 'object') rules = parsed;
    } catch {
      return res.status(400).json({ error: 'rules must be an object' });
    }
  }

  // DB ENUM is strictly lowercase 'public' | 'private'. The form sends
  // capitalised values, so normalise before hitting the driver.
  const visibility = typeof body.visibility === 'string' ? body.visibility.toLowerCase() : 'public';
  if (visibility !== 'public' && visibility !== 'private') {
    return res.status(400).json({ error: 'visibility must be public or private' });
  }

  try {
    // Confirm the owner exists so we return a clean 400 instead of a FK 500.
    const owner = await getUserById(ownerId);
    if (!owner) {
      return res.status(400).json({ error: 'owner_id does not exist' });
    }

    const [result] = await pool.query<mysql.ResultSetHeader>(
      `
      INSERT INTO communities
        (name, description, owner_id, categories, visibility, rules, color_scheme, thumbnail_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        name.trim(),
        description,
        ownerId,
        JSON.stringify(categories),
        visibility,
        JSON.stringify(rules),
        colorScheme,
        thumbnailUrl,
      ]
    );

    // Auto-add the owner to community_members as an admin so they appear in
    // their own member list immediately.
    await pool.query(
      `INSERT INTO community_members (user_id, community_id, community_role) VALUES (?, ?, 'admin')`,
      [ownerId, result.insertId]
    );

    // Read back through the shared projection so the response shape matches GET.
    const [rows] = await pool.query(
      `
      SELECT c.*, u.username AS owner, u.avatar_url AS owner_avatar_url
      FROM communities c
      JOIN users u ON c.owner_id = u.id
      WHERE c.id = ?
      LIMIT 1
      `,
      [result.insertId]
    );
    const created = Array.isArray(rows) && rows.length ? rowToCommunity(rows[0]) : null;
    res.status(201).json(created);
  } catch (e) {
    console.error('create community error', e);
    res.status(500).json({ error: e instanceof Error ? e.message : 'Server error' });
  }
});

// Join a community. Client posts { user_id }.
app.post('/api/communities/:id/join', async (req, res) => {
  const communityId = Number(req.params.id);
  const userId = Number((req.body || {}).user_id);

  if (!Number.isInteger(communityId) || communityId < 1) {
    return res.status(400).json({ error: 'Invalid community id' });
  }
  if (!Number.isInteger(userId) || userId < 1) {
    return res.status(400).json({ error: 'valid user_id is required' });
  }

  try {
    // Verify both community and user exist first — otherwise the FK violation
    // comes back as a generic 500 which is hard to debug from the UI.
    const [communityRows] = await pool.query(
      'SELECT id FROM communities WHERE id = ? LIMIT 1',
      [communityId]
    );
    if (!Array.isArray(communityRows) || communityRows.length === 0) {
      return res.status(404).json({ error: 'Community not found' });
    }
    const user = await getUserById(userId);
    if (!user) {
      return res.status(400).json({ error: 'user_id does not exist' });
    }

    // Idempotent: if the user is already a member, short-circuit.
    const [existing] = await pool.query(
      'SELECT id, community_role FROM community_members WHERE user_id = ? AND community_id = ? LIMIT 1',
      [userId, communityId]
    );
    if (Array.isArray(existing) && existing.length > 0) {
      return res.json({ success: true, alreadyMember: true, membership: existing[0] });
    }

    const [result] = await pool.query<mysql.ResultSetHeader>(
      `INSERT INTO community_members (user_id, community_id, community_role) VALUES (?, ?, 'member')`,
      [userId, communityId]
    );
    res.status(201).json({
      success: true,
      membership: {
        id: result.insertId,
        user_id: userId,
        community_id: communityId,
        community_role: 'member',
      },
    });
  } catch (e) {
    console.error('join community error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Check a single user's membership in a community.
app.get('/api/communities/:id/membership', async (req, res) => {
  const communityId = Number(req.params.id);
  const userId = Number(req.query.user_id);

  if (!Number.isInteger(communityId) || communityId < 1) {
    return res.status(400).json({ error: 'Invalid community id' });
  }
  if (!Number.isInteger(userId) || userId < 1) {
    return res.json({ isMember: false, role: null });
  }

  try {
    const [rows] = await pool.query(
      'SELECT community_role FROM community_members WHERE user_id = ? AND community_id = ? LIMIT 1',
      [userId, communityId]
    );
    if (Array.isArray(rows) && rows.length > 0) {
      res.json({ isMember: true, role: (rows[0] as any).community_role });
    } else {
      res.json({ isMember: false, role: null });
    }
  } catch (e) {
    console.error('membership check error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Leave a community. Client sends { user_id } in body.
app.delete('/api/communities/:id/members', async (req, res) => {
  const communityId = Number(req.params.id);
  const userId = Number((req.body || {}).user_id);

  if (!Number.isInteger(communityId) || communityId < 1) {
    return res.status(400).json({ error: 'Invalid community id' });
  }
  if (!Number.isInteger(userId) || userId < 1) {
    return res.status(400).json({ error: 'valid user_id is required' });
  }

  try {
    const [result] = await pool.query<mysql.ResultSetHeader>(
      'DELETE FROM community_members WHERE user_id = ? AND community_id = ?',
      [userId, communityId]
    );
    res.json({ success: true, removed: result.affectedRows > 0 });
  } catch (e) {
    console.error('leave community error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a community. Only the owner may do this.
app.put('/api/communities/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid community id' });
  }

  const body = req.body || {};
  const requestingUserId = Number(body.requesting_user_id);
  if (!Number.isInteger(requestingUserId) || requestingUserId < 1) {
    return res.status(400).json({ error: 'valid requesting_user_id is required' });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : null;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const visibility = typeof body.visibility === 'string' ? body.visibility.toLowerCase() : 'public';
  if (visibility !== 'public' && visibility !== 'private') {
    return res.status(400).json({ error: 'visibility must be public or private' });
  }

  let categories: string[] = Array.isArray(body.categories) ? body.categories : [];
  let rules: Record<string, unknown> = (body.rules && typeof body.rules === 'object' && !Array.isArray(body.rules))
    ? body.rules : {};

  const colorScheme: string = body.color_scheme || 'default';
  const thumbnailUrl: string | null = body.thumbnail_url || null;
  const description: string = typeof body.description === 'string' ? body.description : '';

  try {
    const [communityRows] = await pool.query(
      'SELECT owner_id FROM communities WHERE id = ? LIMIT 1',
      [id]
    );
    if (!Array.isArray(communityRows) || communityRows.length === 0) {
      return res.status(404).json({ error: 'Community not found' });
    }
    if ((communityRows[0] as any).owner_id !== requestingUserId) {
      return res.status(403).json({ error: 'Only the owner can edit this community' });
    }

    await pool.query(
      `UPDATE communities
       SET name = ?, description = ?, visibility = ?, categories = ?, rules = ?, color_scheme = ?, thumbnail_url = ?
       WHERE id = ?`,
      [name, description, visibility, JSON.stringify(categories), JSON.stringify(rules), colorScheme, thumbnailUrl, id]
    );

    const [rows] = await pool.query(
      `SELECT c.*, u.username AS owner, u.avatar_url AS owner_avatar_url FROM communities c JOIN users u ON c.owner_id = u.id WHERE c.id = ? LIMIT 1`,
      [id]
    );
    res.json(Array.isArray(rows) && rows.length ? rowToCommunity(rows[0]) : null);
  } catch (e) {
    console.error('update community error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a community. Only the owner may do this.
app.delete('/api/communities/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid community id' });
  }

  const requestingUserId = Number((req.body || {}).requesting_user_id);
  if (!Number.isInteger(requestingUserId) || requestingUserId < 1) {
    return res.status(400).json({ error: 'valid requesting_user_id is required' });
  }

  try {
    const [communityRows] = await pool.query(
      'SELECT owner_id FROM communities WHERE id = ? LIMIT 1',
      [id]
    );
    if (!Array.isArray(communityRows) || communityRows.length === 0) {
      return res.status(404).json({ error: 'Community not found' });
    }
    if ((communityRows[0] as any).owner_id !== requestingUserId) {
      return res.status(403).json({ error: 'Only the owner can delete this community' });
    }

    await pool.query('DELETE FROM community_members WHERE community_id = ?', [id]);
    await pool.query('DELETE FROM communities WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (e) {
    console.error('delete community error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ----------- COMMUNITY BOOK ROUTES --------------

// GET /api/communities/:id/books — returns { current: BookRecord|null, previous: BookRecord[] }
app.get('/api/communities/:id/books', async (req, res) => {
  const communityId = Number(req.params.id);
  if (!Number.isInteger(communityId) || communityId < 1)
    return res.status(400).json({ error: 'Invalid community id' });

  try {
    const [rows] = await pool.query(
      `SELECT b.*, cb.status, cb.added_at AS cb_added_at
       FROM community_books cb
       JOIN books b ON cb.book_id = b.id
       WHERE cb.community_id = ?
       ORDER BY cb.added_at DESC`,
      [communityId]
    );
    const books = Array.isArray(rows) ? (rows as any[]) : [];
    res.json({
      current:  books.find(b => b.status === 'current') ?? null,
      previous: books.filter(b => b.status === 'previous'),
    });
  } catch (e) {
    console.error('fetch community books error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/communities/:id/books/current — demote current book to previous (finish it)
app.patch('/api/communities/:id/books/current', async (req, res) => {
  const communityId = Number(req.params.id);
  const requestingUserId = Number((req.body || {}).requesting_user_id);

  if (!Number.isInteger(communityId) || communityId < 1)
    return res.status(400).json({ error: 'Invalid community id' });
  if (!Number.isInteger(requestingUserId) || requestingUserId < 1)
    return res.status(400).json({ error: 'valid requesting_user_id is required' });

  try {
    const [communityRows] = await pool.query(
      'SELECT owner_id FROM communities WHERE id = ? LIMIT 1',
      [communityId]
    );
    if (!Array.isArray(communityRows) || communityRows.length === 0)
      return res.status(404).json({ error: 'Community not found' });

    const [memberRows] = await pool.query(
      'SELECT community_role FROM community_members WHERE user_id = ? AND community_id = ? LIMIT 1',
      [requestingUserId, communityId]
    );
    const isOwner = (communityRows[0] as any).owner_id === requestingUserId;
    const isAdmin = Array.isArray(memberRows) && memberRows.length > 0 &&
      (memberRows[0] as any).community_role === 'admin';
    if (!isOwner && !isAdmin)
      return res.status(403).json({ error: 'Only admins can finish the current book' });

    const [result] = await pool.query<mysql.ResultSetHeader>(
      `UPDATE community_books SET status = 'previous' WHERE community_id = ? AND status = 'current'`,
      [communityId]
    );
    res.json({ success: true, updated: result.affectedRows > 0 });
  } catch (e) {
    console.error('finish book error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/communities/:id/books — set a new current book (owner/admin only)
// Body: { book_id, requesting_user_id }
// The previous current book (if any) is automatically demoted to 'previous'.
app.post('/api/communities/:id/books', async (req, res) => {
  const communityId = Number(req.params.id);
  const bookId = Number((req.body || {}).book_id);
  const requestingUserId = Number((req.body || {}).requesting_user_id);

  if (!Number.isInteger(communityId) || communityId < 1)
    return res.status(400).json({ error: 'Invalid community id' });
  if (!Number.isInteger(bookId) || bookId < 1)
    return res.status(400).json({ error: 'valid book_id is required' });
  if (!Number.isInteger(requestingUserId) || requestingUserId < 1)
    return res.status(400).json({ error: 'valid requesting_user_id is required' });

  try {
    const [communityRows] = await pool.query(
      'SELECT owner_id FROM communities WHERE id = ? LIMIT 1',
      [communityId]
    );
    if (!Array.isArray(communityRows) || communityRows.length === 0)
      return res.status(404).json({ error: 'Community not found' });

    const [memberRows] = await pool.query(
      'SELECT community_role FROM community_members WHERE user_id = ? AND community_id = ? LIMIT 1',
      [requestingUserId, communityId]
    );
    const isOwner = (communityRows[0] as any).owner_id === requestingUserId;
    const isAdmin = Array.isArray(memberRows) && memberRows.length > 0 &&
      (memberRows[0] as any).community_role === 'admin';
    if (!isOwner && !isAdmin)
      return res.status(403).json({ error: 'Only admins can set the current book' });

    const [bookRows] = await pool.query('SELECT id FROM books WHERE id = ? LIMIT 1', [bookId]);
    if (!Array.isArray(bookRows) || bookRows.length === 0)
      return res.status(404).json({ error: 'Book not found' });

    // Demote any existing current book to previous
    await pool.query(
      `UPDATE community_books SET status = 'previous' WHERE community_id = ? AND status = 'current'`,
      [communityId]
    );

    // Insert or re-promote this book to current
    await pool.query(
      `INSERT INTO community_books (community_id, book_id, status)
       VALUES (?, ?, 'current')
       ON DUPLICATE KEY UPDATE status = 'current', added_at = CURRENT_TIMESTAMP`,
      [communityId, bookId]
    );

    res.json({ success: true });
  } catch (e) {
    console.error('set community book error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ----------- BOOK ROUTES --------------

// Add a new book manually (used when the book isn't found in the library)
app.post('/api/books', async (req, res) => {
  const { title, authors, isbn13, thumbnail, published_year, description } = req.body || {};

  if (!title?.trim()) return res.status(400).json({ error: 'title is required' });
  if (!authors?.trim()) return res.status(400).json({ error: 'authors is required' });

  // Auto-generate a placeholder isbn13 if not supplied (field is NOT NULL, max 13 chars)
  const isbn = isbn13?.trim() || `USR${Date.now().toString().slice(-10)}`;

  try {
    const [result] = await pool.query<mysql.ResultSetHeader>(
      `INSERT INTO books (isbn13, title, authors, thumbnail, published_year, description)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        isbn.slice(0, 13),
        title.trim(),
        authors.trim(),
        thumbnail?.trim() || null,
        published_year ? Number(published_year) : null,
        description?.trim() || null,
      ]
    );
    const [rows] = await pool.query('SELECT * FROM books WHERE id = ? LIMIT 1', [result.insertId]);
    res.status(201).json(Array.isArray(rows) && rows.length ? rows[0] : null);
  } catch (e) {
    console.error('create book error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/books', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM books ORDER BY average_rating DESC');
    res.json(Array.isArray(rows) ? rows : []);
  } catch (e) {
    console.error('fetch books error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Must be defined before /api/books/:id so Express doesn't treat "popular" as an id param
app.get('/api/books/popular', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.*, COUNT(uf.book_id) AS favorite_count
       FROM books b
       JOIN user_favorites uf ON uf.book_id = b.id
       GROUP BY b.id
       ORDER BY favorite_count DESC
       LIMIT 3`
    );
    res.json(rows);
  } catch (e) {
    console.error('fetch popular books error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/books/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid book id' });
  }
  try {
    const [rows] = await pool.query('SELECT * FROM books WHERE id = ? LIMIT 1', [id]);
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json(rows[0]);
  } catch (e) {
    console.error('fetch book error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ----------- FAVORITES ROUTES --------------

app.get('/api/favorites', async (req, res) => {
  const userId = Number(req.query.user_id);
  if (!Number.isInteger(userId) || userId < 1) {
    return res.status(400).json({ error: 'valid user_id is required' });
  }
  try {
    const [rows] = await pool.query(
      'SELECT book_id FROM user_favorites WHERE user_id = ?',
      [userId]
    );
    res.json({ bookIds: (rows as any[]).map(r => r.book_id) });
  } catch (e) {
    console.error('fetch favorites error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/favorites', async (req, res) => {
  const userId = Number((req.body || {}).user_id);
  const bookId = Number((req.body || {}).book_id);
  if (!Number.isInteger(userId) || userId < 1) return res.status(400).json({ error: 'valid user_id required' });
  if (!Number.isInteger(bookId) || bookId < 1) return res.status(400).json({ error: 'valid book_id required' });
  try {
    await pool.query(
      'INSERT IGNORE INTO user_favorites (user_id, book_id) VALUES (?, ?)',
      [userId, bookId]
    );
    res.status(201).json({ success: true });
  } catch (e) {
    console.error('add favorite error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/favorites', async (req, res) => {
  const userId = Number((req.body || {}).user_id);
  const bookId = Number((req.body || {}).book_id);
  if (!Number.isInteger(userId) || userId < 1) return res.status(400).json({ error: 'valid user_id required' });
  if (!Number.isInteger(bookId) || bookId < 1) return res.status(400).json({ error: 'valid book_id required' });
  try {
    await pool.query(
      'DELETE FROM user_favorites WHERE user_id = ? AND book_id = ?',
      [userId, bookId]
    );
    res.json({ success: true });
  } catch (e) {
    console.error('remove favorite error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// google meet creation route

app.post("/api/meet/create", async (req, res) => {
  try {
    const { title, startDateTime, endDateTime } = req.body || {};

    res.json({
      success: true,
      eventId: "demo-event-123",
      htmlLink: null,
      meetLink: "https://meet.google.com/",
      conferenceData: {
        title,
        startDateTime,
        endDateTime,
        mode: "temporary-demo",
      },
    });
  } catch (error) {
    console.error("temporary meet route error", error);
    res.status(500).json({ error: "Failed to create demo meeting" });
  }
});


// serve Vite build (connect to client)
const distDir = path.join(process.cwd(), 'dist'); // Vite default outDir is "dist"
app.use(express.static(distDir));

app.get(/^\/(?!api|uploads).*/, (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(distDir, 'index.html'));
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(process.env.PORT || 3002, () => {
    console.log(`Server listening on ${process.env.PORT || 3002}`);
  });
}


export default app;
