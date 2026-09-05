import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@shared/theme.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// PWA: Service Worker登録(本番ビルドのみ。devはvite serveでsw.jsが変換されないため)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .catch((err) => console.warn('SW registration failed:', err));
  });
}
