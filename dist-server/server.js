"use strict";
// This file handles routes to server-side
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const imagekit_1 = require("./imagekit");
const promise_1 = __importDefault(require("mysql2/promise"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: process.env.ALLOWED_ORIGIN ?? '*', credentials: true }));
app.use(express_1.default.json({ limit: '10mb' }));
// ----------- FILE UPLOAD SETUP -----------
const uploadsDir = path_1.default.join(process.cwd(), 'uploads');
if (!fs_1.default.existsSync(uploadsDir))
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const upload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (_req, _file, cb) => cb(null, uploadsDir),
        filename: (_req, file, cb) => {
            const ext = path_1.default.extname(file.originalname).toLowerCase();
            cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_IMAGE_MIME.includes(file.mimetype))
            cb(null, true);
        else
            cb(new Error('Only image files (jpg, png, gif, webp) are allowed'));
    },
});
app.use('/uploads', express_1.default.static(uploadsDir));
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
const isRemoteDb = !!process.env.DB_HOST &&
    process.env.DB_HOST !== 'localhost' &&
    process.env.DB_HOST !== '127.0.0.1';
const pool = promise_1.default.createPool({
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
async function getUserById(id) {
    const [rows] = await pool.query('SELECT id, username, firstname, lastname, email, dob FROM users WHERE id = ?', [id]);
    return Array.isArray(rows) && rows.length ? rows[0] : null;
}
async function checkUniqueUsernameEmail(username, email, idToIgnore) {
    const conditions = [];
    const params = [];
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
    }
    catch (e) {
        console.error('check unique error', e);
        res.status(500).json({ error: 'Server error' });
    }
});
// search user by id
app.get('/api/users/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1)
        return res.status(400).json({ error: 'Invalid user id' });
    try {
        const user = await getUserById(id);
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        res.json(user);
    }
    catch (e) {
        console.error('user fetch error', e);
        res.status(500).json({ error: 'Server error' });
    }
});
const USERNAME_REGEX = /^[A-Za-z0-9_]{1,20}$/;
const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
app.put('/api/users/:id', async (req, res) => {
    const id = Number(req.params.id);
    const { username, email, firstname, lastname, dob } = req.body || {};
    if (!Number.isInteger(id) || id < 1)
        return res.status(400).json({ error: 'Invalid user id' });
    if (!username || !USERNAME_REGEX.test(username))
        return res.status(400).json({ error: 'Bad username' });
    if (!email || !EMAIL_REGEX.test(email))
        return res.status(400).json({ error: 'Bad email' });
    try {
        const conflicts = await checkUniqueUsernameEmail(username, email, id);
        if (conflicts.length > 0) {
            return res.status(409).json({ error: 'Username or email already in use', conflicts });
        }
        await pool.query(`UPDATE users SET username = ?, email = ?, firstname = ?, lastname = ?, dob = ? WHERE id = ?`, [username, email, firstname, lastname, dob, id]);
        const user = await getUserById(id);
        res.json({ success: true, user });
    }
    catch (e) {
        console.error('update profile error', e);
        res.status(500).json({ error: 'Server error' });
    }
});
// local file upload — saves to /uploads and returns a relative URL
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file)
        return res.status(400).json({ error: 'No file uploaded' });
    const url = `/uploads/${req.file.filename}`;
    res.status(201).json({ url, filename: req.file.filename });
});
// imagekit
app.get('/api/imagekit/auth', (_req, res) => {
    res.json((0, imagekit_1.getAuthParams)());
});
app.post('/api/imagekit/upload-base64', async (_req, res) => {
    // body can be undefined if client sends no JSON, guard against that with ||
    const { base64, fileName, folder } = (_req.body || {});
    if (!base64)
        return res.status(400).json({ error: 'base64 is required' });
    const b64 = base64.includes(',') ? base64.split(',')[1] : base64;
    const buffer = Buffer.from(b64, 'base64');
    try {
        const result = await (0, imagekit_1.uploadBuffer)(buffer, { fileName, folder });
        res.status(201).json(result);
    }
    catch (e) {
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
        const passwordHash = await bcrypt_1.default.hash(password, BCRYPT_ROUNDS);
        // insert user
        const [result] = await pool.query(`
      INSERT INTO users (username, email, firstname, lastname, dob, password)
      VALUES (?, ?, ?, ?, ?, ?)
      `, [username, email, firstname, lastname, dob, passwordHash]);
        const newUserId = result.insertId;
        const user = await getUserById(newUserId);
        res.status(201).json({
            success: true,
            user,
        });
    }
    catch (e) {
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
        const [rows] = await pool.query(`
      SELECT id, username, email, password
      FROM users
      WHERE username = ? OR email = ?
      LIMIT 1
      `, [identifier, identifier]);
        if (!Array.isArray(rows) || rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const user = rows[0];
        // compare password
        const valid = await bcrypt_1.default.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // return safe user payload
        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
            },
        });
    }
    catch (err) {
        console.error('login error', err);
        res.status(500).json({ error: 'Server error' });
    }
});
// ----------- COMMUNITY ROUTES --------------
// Normalise a DB row into the shape the client expects. Keeps GET list and
// GET /:id consistent so we don't have to chase mismatched fields later.
function rowToCommunity(row) {
    // `categories` / `rules` in the DB are TEXT columns storing JSON. Parse
    // defensively so a legacy double-encoded value still renders instead of
    // throwing and nuking the whole list.
    const parseMaybeTwice = (value, fallback) => {
        if (value == null || value === '')
            return fallback;
        try {
            let parsed = JSON.parse(value);
            if (typeof parsed === 'string')
                parsed = JSON.parse(parsed);
            return parsed;
        }
        catch {
            return fallback;
        }
    };
    return {
        id: row.id,
        ownerId: row.owner_id,
        owner: row.owner ?? undefined,
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
app.get('/api/communities', async (_req, res) => {
    try {
        const [rows] = await pool.query(`
      SELECT c.*, u.username AS owner
      FROM communities c
      JOIN users u ON c.owner_id = u.id
      ORDER BY c.created_at DESC
      `);
        const communities = Array.isArray(rows) ? rows.map(rowToCommunity) : [];
        res.json(communities);
    }
    catch (e) {
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
        const [rows] = await pool.query(`
      SELECT c.*, u.username AS owner
      FROM communities c
      JOIN users u ON c.owner_id = u.id
      WHERE c.id = ?
      LIMIT 1
      `, [id]);
        if (!Array.isArray(rows) || rows.length === 0) {
            return res.status(404).json({ error: 'Community not found' });
        }
        res.json(rowToCommunity(rows[0]));
    }
    catch (e) {
        console.error('fetch community error', e);
        res.status(500).json({ error: 'Server error' });
    }
});
app.post('/api/communities', async (req, res) => {
    const body = req.body || {};
    const name = body.name;
    const description = body.description;
    const ownerId = Number(body.owner_id);
    const thumbnailUrl = body.thumbnail_url || null;
    const colorScheme = body.color_scheme || 'default';
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
    let categories = [];
    if (Array.isArray(body.categories)) {
        categories = body.categories;
    }
    else if (typeof body.categories === 'string' && body.categories.length > 0) {
        try {
            const parsed = JSON.parse(body.categories);
            if (Array.isArray(parsed))
                categories = parsed;
        }
        catch {
            return res.status(400).json({ error: 'categories must be an array' });
        }
    }
    const invalidCategories = categories.filter((cat) => !VALID_CATEGORIES.includes(cat));
    if (invalidCategories.length > 0) {
        return res.status(400).json({ error: `Invalid categories: ${invalidCategories.join(', ')}` });
    }
    // Same deal for `rules`: allow object or JSON-string.
    let rules = {};
    if (body.rules && typeof body.rules === 'object' && !Array.isArray(body.rules)) {
        rules = body.rules;
    }
    else if (typeof body.rules === 'string' && body.rules.length > 0) {
        try {
            const parsed = JSON.parse(body.rules);
            if (parsed && typeof parsed === 'object')
                rules = parsed;
        }
        catch {
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
        const [result] = await pool.query(`
      INSERT INTO communities
        (name, description, owner_id, categories, visibility, rules, color_scheme, thumbnail_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
            name.trim(),
            description,
            ownerId,
            JSON.stringify(categories),
            visibility,
            JSON.stringify(rules),
            colorScheme,
            thumbnailUrl,
        ]);
        // Auto-add the owner to community_members as an admin so they appear in
        // their own member list immediately.
        await pool.query(`INSERT INTO community_members (user_id, community_id, community_role) VALUES (?, ?, 'admin')`, [ownerId, result.insertId]);
        // Read back through the shared projection so the response shape matches GET.
        const [rows] = await pool.query(`
      SELECT c.*, u.username AS owner
      FROM communities c
      JOIN users u ON c.owner_id = u.id
      WHERE c.id = ?
      LIMIT 1
      `, [result.insertId]);
        const created = Array.isArray(rows) && rows.length ? rowToCommunity(rows[0]) : null;
        res.status(201).json(created);
    }
    catch (e) {
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
        const [communityRows] = await pool.query('SELECT id FROM communities WHERE id = ? LIMIT 1', [communityId]);
        if (!Array.isArray(communityRows) || communityRows.length === 0) {
            return res.status(404).json({ error: 'Community not found' });
        }
        const user = await getUserById(userId);
        if (!user) {
            return res.status(400).json({ error: 'user_id does not exist' });
        }
        // Idempotent: if the user is already a member, short-circuit.
        const [existing] = await pool.query('SELECT id, community_role FROM community_members WHERE user_id = ? AND community_id = ? LIMIT 1', [userId, communityId]);
        if (Array.isArray(existing) && existing.length > 0) {
            return res.json({ success: true, alreadyMember: true, membership: existing[0] });
        }
        const [result] = await pool.query(`INSERT INTO community_members (user_id, community_id, community_role) VALUES (?, ?, 'member')`, [userId, communityId]);
        res.status(201).json({
            success: true,
            membership: {
                id: result.insertId,
                user_id: userId,
                community_id: communityId,
                community_role: 'member',
            },
        });
    }
    catch (e) {
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
        const [rows] = await pool.query('SELECT community_role FROM community_members WHERE user_id = ? AND community_id = ? LIMIT 1', [userId, communityId]);
        if (Array.isArray(rows) && rows.length > 0) {
            res.json({ isMember: true, role: rows[0].community_role });
        }
        else {
            res.json({ isMember: false, role: null });
        }
    }
    catch (e) {
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
        const [result] = await pool.query('DELETE FROM community_members WHERE user_id = ? AND community_id = ?', [userId, communityId]);
        res.json({ success: true, removed: result.affectedRows > 0 });
    }
    catch (e) {
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
    if (!name)
        return res.status(400).json({ error: 'name is required' });
    const visibility = typeof body.visibility === 'string' ? body.visibility.toLowerCase() : 'public';
    if (visibility !== 'public' && visibility !== 'private') {
        return res.status(400).json({ error: 'visibility must be public or private' });
    }
    let categories = Array.isArray(body.categories) ? body.categories : [];
    let rules = (body.rules && typeof body.rules === 'object' && !Array.isArray(body.rules))
        ? body.rules : {};
    const colorScheme = body.color_scheme || 'default';
    const thumbnailUrl = body.thumbnail_url || null;
    const description = typeof body.description === 'string' ? body.description : '';
    try {
        const [communityRows] = await pool.query('SELECT owner_id FROM communities WHERE id = ? LIMIT 1', [id]);
        if (!Array.isArray(communityRows) || communityRows.length === 0) {
            return res.status(404).json({ error: 'Community not found' });
        }
        if (communityRows[0].owner_id !== requestingUserId) {
            return res.status(403).json({ error: 'Only the owner can edit this community' });
        }
        await pool.query(`UPDATE communities
       SET name = ?, description = ?, visibility = ?, categories = ?, rules = ?, color_scheme = ?, thumbnail_url = ?
       WHERE id = ?`, [name, description, visibility, JSON.stringify(categories), JSON.stringify(rules), colorScheme, thumbnailUrl, id]);
        const [rows] = await pool.query(`SELECT c.*, u.username AS owner FROM communities c JOIN users u ON c.owner_id = u.id WHERE c.id = ? LIMIT 1`, [id]);
        res.json(Array.isArray(rows) && rows.length ? rowToCommunity(rows[0]) : null);
    }
    catch (e) {
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
        const [communityRows] = await pool.query('SELECT owner_id FROM communities WHERE id = ? LIMIT 1', [id]);
        if (!Array.isArray(communityRows) || communityRows.length === 0) {
            return res.status(404).json({ error: 'Community not found' });
        }
        if (communityRows[0].owner_id !== requestingUserId) {
            return res.status(403).json({ error: 'Only the owner can delete this community' });
        }
        await pool.query('DELETE FROM community_members WHERE community_id = ?', [id]);
        await pool.query('DELETE FROM communities WHERE id = ?', [id]);
        res.json({ success: true });
    }
    catch (e) {
        console.error('delete community error', e);
        res.status(500).json({ error: 'Server error' });
    }
});
// ----------- BOOK ROUTES --------------
app.get('/api/books', async (_req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM books ORDER BY average_rating DESC');
        res.json(Array.isArray(rows) ? rows : []);
    }
    catch (e) {
        console.error('fetch books error', e);
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
    }
    catch (e) {
        console.error('fetch book error', e);
        res.status(500).json({ error: 'Server error' });
    }
});
// serve Vite build (connect to client)
const distDir = path_1.default.join(process.cwd(), 'dist'); // Vite default outDir is "dist"
app.use(express_1.default.static(distDir));
app.get(/^\/(?!api|uploads).*/, (req, res) => {
    if (req.path.startsWith('/api'))
        return res.status(404).json({ error: 'Not found' });
    res.sendFile(path_1.default.join(distDir, 'index.html'));
});
if (process.env.NODE_ENV !== 'test') {
    app.listen(process.env.PORT || 3002, () => {
        console.log(`Server listening on ${process.env.PORT || 3002}`);
    });
}
exports.default = app;
