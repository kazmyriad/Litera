import { defineConfig } from 'vite';
import path from 'node:path';
import os from 'node:os';
import dotenv from 'dotenv';

dotenv.config();
const API_BASE = process.env.VITE_API_BASE ?? 'http://localhost:3002';

export default defineConfig({
  cacheDir: path.join(os.tmpdir(), 'vite-cache-Litera'),
  base: '/',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});