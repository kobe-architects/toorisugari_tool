import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// PC分析 SPA。本番は Laravel の public/pc/ に出力し /pc/ で配信。
export default defineConfig({
  base: '/pc/',
  plugins: [react()],
  resolve: {
    alias: { '@shared': path.resolve(__dirname, '../shared/src') },
  },
  server: {
    host: true, // 同一LANから 192.168.x.x:5174 でアクセス可能に
    port: 5174,
    fs: { allow: ['..'] },
    proxy: {
      '/api': 'http://127.0.0.1:8000',
      '/storage': 'http://127.0.0.1:8000',
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../../backend/public/pc'),
    emptyOutDir: true,
  },
});
