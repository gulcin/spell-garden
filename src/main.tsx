import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-600.css';
import '@fontsource/fredoka/latin-700.css';
import '@fontsource/nunito/latin-400.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import { watchReportQueue } from './feedback/reports.ts';
import { GardenBoundary } from './ui/Rescue.tsx';
import { startUpdateChecks } from './swUpdates.ts';
import { lockVisibleViewport } from './viewport.ts';
import { App } from './App.tsx';
import { Gallery } from './ui/Gallery.tsx';
import './styles.css';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    const data = event.data as { type?: string } | null;
    if (data?.type === 'SPELL_PING') event.ports[0]?.postMessage('alive');
  });
}

watchReportQueue();
startUpdateChecks();
lockVisibleViewport();
window.setTimeout(() => {
  try {
    sessionStorage.removeItem('spell-garden.swReloads');
  } catch {
    /* The one-reload guard can stay for this visit. */
  }
}, 4000);

const preview = new URLSearchParams(window.location.search).get('preview');
const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <GardenBoundary>{preview === 'art' ? <Gallery /> : <App />}</GardenBoundary>
    </StrictMode>,
  );
}

