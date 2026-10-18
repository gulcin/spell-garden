import { useMemo, useState } from 'react';
import { allTopics, domains } from '../curriculum/data.ts';
import type { Progress } from '../progress/types.ts';
import { PageBanner } from './pictures.tsx';

const PAGE = 3;

function kidSpellName(name: string): string {
  return name.replace(/\s*\(ages?[^)]*\)/i, '').trim();
}

/** Kid-facing spell list. Every spell is open. No ages, no locks. */
export function Garden({
  progress,
  onHome,
  onTry,
}: {
  progress: Progress;
  onHome: () => void;
  onTry: (topicId: string) => void;
}) {
  const [domain, setDomain] = useState(domains()[0] ?? '');
  const [page, setPage] = useState(0);
  const topics = useMemo(
    () => allTopics().filter((topic) => topic.domain === domain).sort((a, b) => a.name.localeCompare(b.name)),
    [domain],
  );
  const pages = Math.max(1, Math.ceil(topics.length / PAGE));
  const safePage = Math.min(page, pages - 1);
  const shown = topics.slice(safePage * PAGE, safePage * PAGE + PAGE);
  const name = progress.learnerName || 'Aida';

  return (
    <div className="garden" data-testid="spell-beds">
      <PageBanner place="greenhouse" />
      <button type="button" className="text-link" onClick={onHome}>
        Back to the tower
      </button>
      <h1>Spell beds</h1>
      <p className="lede">Pick a spell and try it, {name}. Every spell is open.</p>
      <div className="chips">
        {domains().map((entry) => (
          <button
            key={entry}
            type="button"
            className={entry === domain ? 'chip on' : 'chip'}
            onClick={() => {
              setDomain(entry);
              setPage(0);
            }}
          >
            {entry}
          </button>
        ))}
      </div>
      <ul className="spell-list">
        {shown.map((topic) => (
          <li key={topic.id}>
            <button type="button" className="spell-row" data-testid={`spell-${topic.id}`} onClick={() => onTry(topic.id)}>
              <strong>{kidSpellName(topic.name)}</strong>
              <span>Try this spell</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="spell-pager">
        <button type="button" data-testid="spell-prev" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
          Back
        </button>
        <button type="button" data-testid="spell-next" disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)}>
          More
        </button>
      </div>
    </div>
  );
}
