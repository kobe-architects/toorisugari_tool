import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// スマホPOS SPA。本番は Laravel の public/pos/ に出力し /pos/ で配信。
export default defineConfig({
  base: '/pos/',
  plugins: [react()],
  resolve: {
    alias: { '@shared': path.resolve(__dirname, '../shared/src') },
  },
  server: {
    host: true, // 同一LANのスマホ実機から 192.168.x.x:5173 でアクセス可能に
    port: 5173,
    // 親(frontend/)配下の shared を import できるよう許可
    fs: { allow: ['..'] },
    // 開発時 /api・/storage を Laravel(:8000) へ転送
    proxy: {
      '/api': 'http://127.0.0.1:8000',
      '/storage': 'http://127.0.0.1:8000',
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../../backend/public/pos'),
    emptyOutDir: true,
  },
});
