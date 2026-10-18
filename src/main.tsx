import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-600.css';
import '@fontsource/fredoka/latin-700.css';
import '@fontsource/nunito/latin-400.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import { watchReportQueue } from './feedback/reports.ts';
import { App } from './App.tsx';
import { Gallery } from './ui/Gallery.tsx';
import './styles.css';

watchReportQueue();

const preview = new URLSearchParams(window.location.search).get('preview');
const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      {preview === 'art' ? <Gallery /> : <App />}
    </StrictMode>,
  );
}

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const base = import.meta.env.BASE_URL;
    navigator.serviceWorker
      .register(`${base}sw.js`, base.startsWith('/') ? { scope: base } : undefined)
      .catch(() => {
        /* Offline support is best-effort if the host blocks workers. */
      });
  });
}
