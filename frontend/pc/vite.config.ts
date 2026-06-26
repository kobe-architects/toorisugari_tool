import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// 本番(さくら)は公開ルート ~/www を他アプリと共用し /toorisugari_tool/ 配下で配信するため、
// build時のみ base をサブディレクトリにする（dev=vite serve は従来どおり '/pc/'）。
// ルーター basename と APIベースURL は import.meta.env.BASE_URL から自動導出される。
const PROD_BASE = '/toorisugari_tool/pc/';

// PC分析 SPA。本番は Laravel の public/pc/ に出力し /toorisugari_tool/pc/ で配信。
export default defineConfig(({ command }) => ({
  base: command === 'build' ? PROD_BASE : '/pc/',
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
}));
