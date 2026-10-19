import { useState } from 'react';
import { createPortal } from 'react-dom';
import changelog from '../../CHANGELOG.md?raw';
import { buildInfo, gardenNewsPlan, kidHighlights, parseChangelog, SEEN_VERSION_KEY } from '../version.ts';

function readSeen(): string | null {
  try {
    return localStorage.getItem(SEEN_VERSION_KEY);
  } catch {
    return null;
  }
}

function writeSeen(version: string) {
  try {
    localStorage.setItem(SEEN_VERSION_KEY, version);
  } catch {
    /* the garden still opens */
  }
}

function linesForThisVisit(): string[] | null {
  const seen = readSeen();
  const plan = gardenNewsPlan(seen, buildInfo.version);
  if (plan === 'record') {
    writeSeen(buildInfo.version);
    return null;
  }
  if (plan !== 'show' || !seen) return null;
  const highlights = kidHighlights(parseChangelog(changelog), seen);
  return highlights.length > 0 ? highlights : ['Something new is waiting in the garden.'];
}

export function GardenNews() {
  const [lines, setLines] = useState<string[] | null>(linesForThisVisit);
  if (!lines) return null;
  return createPortal(
    <div className="tell-backdrop" role="presentation">
      <section className="tell-sheet news-card" role="dialog" aria-labelledby="garden-news-title" data-testid="garden-news">
        <h2 id="garden-news-title">New in the garden!</h2>
        <ul>
          {lines.map((line, index) => (
            <li key={`${index}-${line}`}>{line}</li>
          ))}
        </ul>
        <button
          type="button"
          className="btn gold"
          data-testid="garden-news-close"
          onClick={() => {
            writeSeen(buildInfo.version);
            setLines(null);
          }}
        >
          Okay!
        </button>
      </section>
    </div>,
    document.body,
  );
}
