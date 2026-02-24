import { defineConfig } from 'vite';
import path from 'node:path';
import os from 'node:os';

export default defineConfig({
    cacheDir: path.join(os.tmpdir(), 'vite-cache-Litera'),
    base: '/',
});