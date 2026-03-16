"use strict";
// This file handles routes to server-side
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const imagekit_1 = require("./imagekit");
const promise_1 = __importDefault(require("mysql2/promise"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: process.env.ALLOWED_ORIGIN ?? '*', credentials: true }));
app.use(express_1.default.json({ limit: '10mb' }));
// pool
const pool = promise_1.default.createPool({
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
async function getUserById(id) {
    const [rows] = await pool.query('SELECT id, username, firstname, email FROM users WHERE id = ?', [id]);
    return Array.isArray(rows) && rows.length ? rows[0] : null;
}
// API endpoint
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
// serve Vite build (connect to client)
const distDir = path_1.default.join(process.cwd(), 'dist'); // Vite default outDir is "dist"
app.use(express_1.default.static(distDir));
app.get(/^\/(?!api).*/, (req, res) => {
    if (req.path.startsWith('/api'))
        return res.status(404).json({ error: 'Not found' });
    res.sendFile(path_1.default.join(distDir, 'index.html'));
});
if (process.env.NODE_ENV !== "test") {
    app.listen(process.env.PORT || 3002, () => {
        console.log(`ImageKit auth server listening on ${process.env.PORT || 3002}`);
    });
}
exports.default = app;
