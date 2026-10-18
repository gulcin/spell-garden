import { useMemo, useState } from 'react';
import { TEMPLATE_LABEL, classify } from '../curriculum/classify.ts';
import { allTopics, clustersFor, domains } from '../curriculum/data.ts';
import { masteredIds, statusOf } from '../progress/mastery.ts';
import type { Progress, Status } from '../progress/types.ts';
import { PageBanner } from './pictures.tsx';

const STATUS_WORD: Record<Status, string> = {
  mastered: 'Mastered',
  practicing: 'Practising',
  ready: 'Ready',
  locked: 'Locked',
};

export function Garden({ progress, onHome }: { progress: Progress; onHome: () => void }) {
  const [domain, setDomain] = useState(domains()[0] ?? '');
  const mastered = masteredIds(progress);
  const topics = useMemo(
    () => allTopics().filter((topic) => topic.domain === domain).sort((a, b) => a.ageRangeStart - b.ageRangeStart || a.name.localeCompare(b.name)),
    [domain],
  );
  const summary = clustersFor(domain)[0]?.summary;
  return (
    <div className="garden">
      <PageBanner place="greenhouse" />
      <button type="button" className="text-link" onClick={onHome}>
        Back to the tower
      </button>
      <h1>Spell beds</h1>
      <p className="lede">Each bed is a kind of maths. Locked spells open when the ones they build on are glowing.</p>
      <div className="chips">
        {domains().map((name) => (
          <button key={name} type="button" className={name === domain ? 'chip on' : 'chip'} onClick={() => setDomain(name)}>
            {name}
          </button>
        ))}
      </div>
      {summary ? <p className="summary">{summary}</p> : null}
      <ul className="spell-list">
        {topics.map((topic) => {
          const status = statusOf(topic, progress, mastered);
          return (
            <li key={topic.id}>
              <span className={`pill ${status}`}>{STATUS_WORD[status]}</span>
              <div>
                <strong>{topic.name}</strong>
                <em>
                  ages {topic.ageRangeStart}–{topic.ageRangeEnd} · {TEMPLATE_LABEL[classify(topic)]}
                </em>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
