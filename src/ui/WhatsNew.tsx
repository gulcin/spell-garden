import { useMemo } from 'react';
import changelog from '../../CHANGELOG.md?raw';
import { parseChangelog, versionLabel } from '../version.ts';

export function WhatsNew({ onClose }: { onClose: () => void }) {
  const notes = useMemo(() => parseChangelog(changelog), []);
  return (
    <section className="whats-new" data-testid="whats-new-screen">
      <button type="button" className="text-link" data-testid="whats-new-back" onClick={onClose}>
        Back to the journal
      </button>
      <p className="version-stamp" data-testid="app-version">
        {versionLabel()}
      </p>
      <h1>What's new</h1>
      {notes.map((note) => (
        <article key={note.version}>
          <h2>
            Version {note.version}
            {note.date ? ` · ${note.date}` : ''}
          </h2>
          {note.intro.map((line) => (
            <p key={line}>{line}</p>
          ))}
          {note.sections.map((section) => (
            <div key={section.title}>
              <h3>{section.title}</h3>
              <ul>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </article>
      ))}
    </section>
  );
}
