// This file handles routes to server-side

import express, { request, response, NextFunction } from 'express';
import cors from 'cors';
import { getAuthParams, uploadBuffer} from './imagekit';

const app = express();
app.use(cors({ origin: process.env.ALLOWED_ORIGIN ?? '*', credentials: true}));
app.use(express.json({ limit: '10mb' }));

app.get('/api/imagekit/auth', (_req, res) => {
    res.json(getAuthParams());
});

app.post('/api/imagekit/upload-base64', async (req, res) => {
    const { base64, fileName, folder } = req.body as { base64: string; fileName?: string; folder?: string };
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

app.listen(process.env.PORT || 3001, () => {
    console.log(`ImageKit auth server listening on ${process.env.PORT}`);
});