import { useEffect, useMemo, useState } from 'react';
import { askHer } from '../curriculum/ask.ts';
import { TEMPLATE_LABEL, classify } from '../curriculum/classify.ts';
import { allPrereqs, allTopics, clustersFor, domains } from '../curriculum/data.ts';
import { markMastered, masteredIds, statusOf } from '../progress/mastery.ts';
import { applyStartAge, gradeLabel, startAgeChoices } from '../progress/placement.ts';
import { PROGRESS_KEY, freshProgress, type Progress, type Status } from '../progress/types.ts';
import { parseProgress } from '../progress/storage.ts';
import { flushReportQueue, hydrateReports, loadReports, mumMailto, type Report } from '../feedback/reports.ts';
import { checkForUpdates } from '../swUpdates.ts';
import { versionLabel } from '../version.ts';
import { PageBanner, Prop } from './pictures.tsx';

const STATUS_WORD: Record<Status, string> = {
  mastered: 'Mastered',
  practicing: 'Practising',
  ready: 'Ready',
  locked: 'Open',
};

export function Parent({
  progress,
  update,
  onHome,
  startOpen = false,
}: {
  progress: Progress;
  update: (recipe: (current: Progress) => Progress) => void;
  onHome: () => void;
  startOpen?: boolean;
}) {
  const [open, setOpen] = useState(startOpen);
  const [answer, setAnswer] = useState('');
  const [gateNote, setGateNote] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState('All');
  const [picked, setPicked] = useState<string | null>(null);
  const [importNote, setImportNote] = useState<string | null>(null);

  if (!open) {
    return (
      <section className="panel gate">
        <PageBanner place="potion-cottage" />
        <button type="button" className="text-link" onClick={onHome}>
          Back to the tower
        </button>
        <h1>For grown-ups</h1>
        <p>A small gate, so the journal stays a parent place. What is 36 + 47?</p>
        <input
          inputMode="numeric"
          data-testid="gate-answer"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          aria-label="36 plus 47"
        />
        <button
          type="button"
          className="btn primary"
          data-testid="gate-submit"
          onClick={() => {
            if (answer.trim() === '83') setOpen(true);
            else setGateNote('Try the sum again.');
          }}
        >
          Open the journal
        </button>
        {gateNote ? <p className="note">{gateNote}</p> : null}
      </section>
    );
  }

  return (
    <Journal
      progress={progress}
      update={update}
      onHome={onHome}
      query={query}
      setQuery={setQuery}
      domain={domain}
      setDomain={setDomain}
      picked={picked}
      setPicked={setPicked}
      importNote={importNote}
      setImportNote={setImportNote}
    />
  );
}

function ReportList() {
  const [reports, setReports] = useState<Report[]>(() => loadReports());
  useEffect(() => {
    let live = true;
    void hydrateReports().then((rows) => {
      if (live) setReports(rows);
    });
    return () => {
      live = false;
    };
  }, []);
  const [note, setNote] = useState<string | null>(null);
  const [updateNote, setUpdateNote] = useState('');
  const [checking, setChecking] = useState(false);

  async function send() {
    const latest = loadReports();
    setReports(latest);
    if (latest.length === 0) {
      setNote('No notes yet.');
      return;
    }
    try {
      const posted = await flushReportQueue();
      if (posted) setNote('Sent to the garden post box, and the letter is ready.');
    } catch {
      setNote('The post box is quiet. The letter is still ready.');
    }
    window.location.href = mumMailto(latest);
  }

  return (
    <section className="reports" data-testid="report-list">
      <p className="version-stamp" data-testid="app-version">
        {versionLabel()}
      </p>
      <button
        type="button"
        className="btn quiet"
        data-testid="check-updates"
        disabled={checking}
        onClick={() => {
          setChecking(true);
          void checkForUpdates().then((line) => {
            setUpdateNote(line);
            setChecking(false);
          });
        }}
      >
        {checking ? 'Looking…' : 'Check for updates'}
      </button>
      {updateNote ? (
        <p className="note" role="status" data-testid="update-status">
          {updateNote}
        </p>
      ) : null}
      <h2>Notes for Mum</h2>
      {reports.length === 0 ? <p>No notes yet. The Tell us button keeps them on this iPad.</p> : null}
      <ul className="sessions">
        {reports.map((report) => (
          <li key={report.id}>
            <strong>{report.kind === 'love' ? 'I love this' : report.kind === 'broken' ? 'Something is broken' : 'Idea'}</strong>
            <span>
              {new Date(report.createdAt).toLocaleString()} · {report.context.placeName || 'garden'} · {report.context.activity || 'no activity'}
            </span>
            <span>{report.text || 'No extra words.'}</span>
            <span>
              {report.context.question ? `Question: ${report.context.question}` : 'No question on screen.'}{' '}
              {report.context.lastAnswer ? `Answer: ${report.context.lastAnswer}` : ''}
            </span>
          </li>
        ))}
      </ul>
      <button type="button" className="btn gold" data-testid="send-mum" onClick={() => void send()}>
        Send to Mum
      </button>
      {note ? <p className="note">{note}</p> : null}
    </section>
  );
}

function Journal({
  progress,
  update,
  onHome,
  query,
  setQuery,
  domain,
  setDomain,
  picked,
  setPicked,
  importNote,
  setImportNote,
}: {
  progress: Progress;
  update: (recipe: (current: Progress) => Progress) => void;
  onHome: () => void;
  query: string;
  setQuery: (value: string) => void;
  domain: string;
  setDomain: (value: string) => void;
  picked: string | null;
  setPicked: (value: string | null) => void;
  importNote: string | null;
  setImportNote: (value: string | null) => void;
}) {
  const mastered = masteredIds(progress);
  const latest = [...progress.sessions].reverse().find((session) => session.endedAt);
  const fresh = allTopics().filter((topic) => {
    const state = progress.topics[topic.id];
    return state?.via === 'practice' && state.masteredAt && latest && state.masteredAt >= latest.startedAt;
  });
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allTopics()
      .filter((topic) => domain === 'All' || topic.domain === domain)
      .filter((topic) => !q || `${topic.name} ${topic.domain} ${topic.description}`.toLowerCase().includes(q))
      .sort((a, b) => a.domain.localeCompare(b.domain) || a.ageRangeStart - b.ageRangeStart || a.name.localeCompare(b.name));
  }, [query, domain]);
  const grownupNote = useMemo(() => {
    if (domain === 'All') return '';
    const age = progress.placement.frontierAge || 8;
    const clusters = clustersFor(domain);
    const fit = [...clusters].reverse().find((cluster) => cluster.ageRangeStart <= age) ?? clusters[0];
    return fit?.summary ?? '';
  }, [domain, progress.placement.frontierAge]);
  const focus = allTopics().find((topic) => topic.id === picked) ?? null;
  const hopped = useMemo(() => {
    return allTopics()
      .map((topic) => ({ topic, skips: progress.topics[topic.id]?.skips ?? 0 }))
      .filter((row) => row.skips > 0)
      .sort((a, b) => b.skips - a.skips || a.topic.name.localeCompare(b.topic.name));
  }, [progress]);

  function download() {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'spell-garden-progress.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="journal">
      <PageBanner place="observatory" />
      <button type="button" className="text-link" onClick={onHome}>
        Back to the tower
      </button>
      <h1>{progress.learnerName}'s journal</h1>
      <p className="lede">Mastered, practising, or ready. Ages and the notes for grown-ups stay on this screen.</p>
      <ReportList />
      <label className="start-level">
        Starting level
        <select
          data-testid="start-age"
          aria-label="Starting level"
          value={progress.placement.frontierAge}
          onChange={(event) => {
            const age = Number(event.target.value);
            update((current) => applyStartAge(current, age, allTopics(), Date.now()));
          }}
        >
          {startAgeChoices().map((age) => (
            <option key={age} value={age}>
              {gradeLabel(age)}
            </option>
          ))}
        </select>
        <span>Chapters begin here. Missing ideas are practised first, and the path can climb past this age.</span>
      </label>
      {fresh.length > 0 ? (
        <div className="banner" data-testid="new-mastery">
          <strong>Newly mastered</strong>
          <ul>
            {fresh.map((topic) => (
              <li key={topic.id}>
                {topic.name} · {progress.topics[topic.id]?.correct ?? 0} correct
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {hopped.length > 0 ? (
        <section className="banner" data-testid="skipped-skills">
          <strong>Spells she hopped past</strong>
          <ul>
            {hopped.map(({ topic, skips }) => (
              <li key={topic.id}>
                {topic.name} · {skips} skipped · the next one is a little gentler
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <div className="journal-tools">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search spells" aria-label="Search spells" />
        <select value={domain} onChange={(event) => setDomain(event.target.value)} aria-label="Domain">
          <option>All</option>
          {domains().map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
        <button type="button" className="btn quiet" onClick={download}>
          Export JSON
        </button>
        <label className="btn quiet file">
          Import JSON
          <input
            type="file"
            accept="application/json"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              try {
                const next = parseProgress(await file.text());
                update(() => next);
                setImportNote('Progress brought in.');
              } catch (error) {
                setImportNote(error instanceof Error ? error.message : 'Could not read that file.');
              }
            }}
          />
        </label>
      </div>
      {importNote ? <p className="note">{importNote}</p> : null}
      <p className="fine">
        Stored at <code>{PROGRESS_KEY}</code>. {rows.length} spells shown.
      </p>
      {grownupNote ? (
        <p className="summary" data-testid="grownup-summary">
          {grownupNote}
        </p>
      ) : null}
      <ul className="journal-list">
        {rows.map((topic) => {
          const status = statusOf(topic, progress, mastered);
          const state = progress.topics[topic.id];
          return (
            <li key={topic.id}>
              <button type="button" className="topic-row" data-testid="topic-row" data-topic-id={topic.id} onClick={() => setPicked(topic.id)}>
                <span className={`pill ${status}`} data-testid="status">
                  {STATUS_WORD[status]}
                </span>
                <span>
                  <strong>{topic.name}</strong>
                  <em>
                    {topic.domain} · ages {topic.ageRangeStart}–{topic.ageRangeEnd} · {TEMPLATE_LABEL[classify(topic)]}
                  </em>
                </span>
                <span className="counts" data-testid="success-count">
                  {state?.correct ?? 0} correct · {state?.incorrect ?? 0} missed
                  {(state?.skips ?? 0) > 0 ? ` · ${state?.skips} skipped` : ''}
                  {state?.via === 'placement' && state.masteredAt ? ' · placed' : ''}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {rows.length === 0 ? <p>No spells match that search.</p> : null}
      {focus ? (
        <aside className="detail">
          <h2>{focus.name}</h2>
          <p>{focus.description}</p>
          {(progress.topics[focus.id]?.skips ?? 0) > 0 ? (
            <p>
              She hopped past this spell {progress.topics[focus.id]?.skips}{' '}
              {(progress.topics[focus.id]?.skips ?? 0) === 1 ? 'time' : 'times'}. The next one waits a little gentler.
            </p>
          ) : null}
          <h3>Builds on</h3>
          {allPrereqs(focus.id).length === 0 ? <p>This spell can be a starting place.</p> : null}
          <ul>
            {allPrereqs(focus.id).map((dep) => {
              const name = allTopics().find((topic) => topic.id === dep.prerequisiteId)?.name ?? dep.prerequisiteId;
              return (
                <li key={`${dep.strength}-${dep.prerequisiteId}`}>
                  <strong>{name}</strong> · {dep.strength}. {dep.reason}
                </li>
              );
            })}
          </ul>
          <h3>Ask her</h3>
          <p className="ask">{askHer(focus, progress.learnerName)}</p>
          <div className="dock">
            <button
              type="button"
              className="btn gold"
              onClick={() => update((current) => ({ ...current, topics: { ...current.topics, [focus.id]: markMastered(current.topics[focus.id], Date.now()) } }))}
            >
              Mark mastered
            </button>
            <button
              type="button"
              className="btn quiet"
              onClick={() =>
                update((current) => {
                  const topics = { ...current.topics };
                  delete topics[focus.id];
                  return { ...current, topics };
                })
              }
            >
              Reset
            </button>
          </div>
        </aside>
      ) : null}
      <section>
        <h2>Chapters</h2>
        {progress.sessions.length === 0 ? (
          <p className="empty-note">
            <Prop name="book" className="example-book" alt="" />
            No chapters yet. When she finishes a quest, it will rest here.
          </p>
        ) : null}
        <ul className="sessions">
          {progress.sessions.map((session) => (
            <li key={session.id}>
              <strong>{session.chapterTitle}</strong>
              <span>
                {new Date(session.startedAt).toLocaleString()} · {session.correct} kind spells · {session.incorrect} soft misses
                {(session.skips ?? 0) > 0 ? ` · ${session.skips} skipped` : ''}
                {session.endedAt ? '' : ' · still open'}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <button type="button" className="btn quiet" data-testid="reset-all" onClick={() => update(() => freshProgress(progress.learnerName))}>
        Reset everything
      </button>
    </div>
  );
}
