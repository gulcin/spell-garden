import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-600.css';
import '@fontsource/fredoka/latin-700.css';
import '@fontsource/nunito/latin-400.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import { watchReportQueue } from './feedback/reports.ts';
import { startUpdateChecks } from './swUpdates.ts';
import { App } from './App.tsx';
import { Gallery } from './ui/Gallery.tsx';
import './styles.css';

watchReportQueue();
startUpdateChecks();

const preview = new URLSearchParams(window.location.search).get('preview');
const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      {preview === 'art' ? <Gallery /> : <App />}
    </StrictMode>,
  );
}

