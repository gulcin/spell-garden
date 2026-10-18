import { useEffect, useMemo, useRef, useState } from 'react';
import { Board, type BoardHandle } from '../activities/Board.tsx';
import { generateItem, placementPlan } from '../activities/generate.ts';
import { isSolved } from '../activities/logic.ts';
import type { Item } from '../activities/types.ts';
import { applySkip, recordAttempt } from '../progress/mastery.ts';
import { planChapter, type ChapterSlot } from '../progress/select.ts';
import type { Progress } from '../progress/types.ts';
import { DEMO_LINE, type Chapter } from '../story.ts';
import { speak } from '../speech.ts';
import { useReportLive } from '../feedback/live.tsx';
import type { BoardState } from '../activities/types.ts';
import { crystalGain } from '../wardrobe/catalog.ts';
import { rewardSpeech } from '../wardrobe/purse.ts';
import { bumpPlaceQuests } from '../cast/talk.ts';
import { awardCrystals } from '../wardrobe/economy.ts';
import { CrystalCounter } from './CrystalCounter.tsx';
import { TalkDock } from './TalkDock.tsx';
import { DressedApprentice } from './DressedApprentice.tsx';
import { PLACES, placeStyle, Prop } from './pictures.tsx';
import { deedLine, visitIntro } from '../stories/adventure.ts';
import { appendPuzzlePage } from '../stories/books.ts';
import { SkipButton } from './SkipButton.tsx';
import { PlaceBookButton, StoryButton } from './StoryTime.tsx';

type Mode = 'placement' | 'chapter';

function describeBoard(item: Item, state: BoardState): string {
  if (item.template === 'clock') return `Clock ${state.clock.hour}:${String(state.clock.minute).padStart(2, '0')}.`;
  if (item.template === 'angle') return `Wand at ${state.angle} degrees.`;
  if (state.choice) return `Chose ${state.choice}.`;
  if (state.shaded.length > 0) return `Coloured ${state.shaded.length} parts.`;
  if (state.toggled.length > 0) return `Tapped ${state.toggled.join(', ')}.`;
  const placed = item.pieces
    .filter((piece) => state.at[piece.id])
    .map((piece) => `${piece.label || piece.art} in ${state.at[piece.id]}`);
  return placed.length > 0 ? placed.join('; ') : 'Nothing placed yet.';
}

const PRAISE = [
  'The spell worked. The garden glows a little warmer.',
  'Yes. That was kind, careful magic.',
  'Lovely. The numbers settled into place.',
];

export function Quest({
  mode,
  progress,
  chapter,
  placeId = 'lantern-grove',
  update,
  onFinish,
  onStory,
  onOpenBook,
}: {
  mode: Mode;
  progress: Progress;
  chapter?: Chapter;
  placeId?: string;
  update: (recipe: (current: Progress) => Progress) => void;
  onFinish: (correct: number, asked: number, deeds: string[], chapterId: string) => void;
  onStory?: () => void;
  onOpenBook?: () => void;
}) {
  const sessionId = useRef(`s-${Date.now()}`);
  const chapterId = useRef(`visit-${placeId}-${sessionId.current}`);
  const deeds = useRef<string[]>([]);
  const [slots] = useState<ChapterSlot[]>(() =>
    mode === 'placement'
      ? placementPlan().map((slot) => ({
          topic: slot.topic,
          salt: slot.salt,
          focus: false,
          review: false,
          rescue: false,
        }))
      : planChapter(progress, Date.now(), sessionId.current),
  );
  const [index, setIndex] = useState(0);
  const [retry, setRetry] = useState(0);
  const [phase, setPhase] = useState<'intro' | 'demo' | 'play' | 'ok' | 'walk'>('intro');
  const [hintLevel, setHintLevel] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [asked, setAsked] = useState(0);
  const api = useRef<BoardHandle | null>(null);
  const moving = useRef(false);
  const { setLive } = useReportLive();
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const slot = slots[index];
  const item = useMemo(() => {
    if (!slot) return null;
    const ease = progress.topics[slot.topic.id]?.ease ?? 0;
    return generateItem(slot.topic, retry ? `${slot.salt}:retry${retry}` : slot.salt, ease);
  }, [slot, retry, progress.topics]);

  useEffect(() => {
    moving.current = false;
  }, [index, phase]);

  useEffect(() => {
    if (!item || phase === 'intro' || phase === 'demo') return;
    window.__prague = { item, getState: () => api.current?.getState() };
  }, [item, phase]);

  useEffect(() => {
    const spot = PLACES.find((entry) => entry.id === placeId);
    setLive({
      screen: mode,
      placeId,
      placeName: spot?.name ?? placeId,
      activity: item?.template ?? '',
      question: phase === 'intro' || phase === 'demo' ? '' : (item?.prompt ?? ''),
    });
  }, [setLive, mode, placeId, item, phase]);

  if (!slot || !item) {
    return (
      <section className="panel story">
        <div className="reward-row">
          <DressedApprentice className="guide guide-small" alt="" />
          <Prop name="moth" className="reward-prop" alt="" />
        </div>
        <h2>The garden is resting</h2>
        <p>Every spell you can reach is already glowing. A grown-up can open a new path from the journal.</p>
        <button type="button" className="btn primary" onClick={() => onFinish(correct, asked, deeds.current, chapterId.current)}>
          Back to the tower
        </button>
      </section>
    );
  }

  const seen = progress.seenTemplates.includes(item.template);

  function rememberTemplate(current: Progress, template: string): Progress {
    if (current.seenTemplates.includes(template)) return current;
    return { ...current, seenTemplates: [...current.seenTemplates, template] };
  }

  function begin() {
    const line =
      mode === 'placement'
        ? `${progress.learnerName}, five tiny spells will find where your garden begins. There is no rush.`
        : `${progress.learnerName}, ${chapter?.intro ?? 'A new chapter of kind magic is ready.'}`;
    speak(line);
    if (mode === 'chapter') {
      update((current) => ({
        ...current,
        visitedPlaces: current.visitedPlaces.includes(placeId) ? current.visitedPlaces : [...current.visitedPlaces, placeId],
        sessions: [
          ...current.sessions,
          {
            id: sessionId.current,
            startedAt: Date.now(),
            endedAt: null,
            chapterTitle: chapter?.title ?? 'A quiet chapter',
            topicIds: [],
            correct: 0,
            incorrect: 0,
            skips: 0,
            rewardId: null,
          },
        ],
      }));
    }
    if (mode === 'placement') {
      update((current) =>
        current.visitedPlaces.includes(placeId) ? current : { ...current, visitedPlaces: [...current.visitedPlaces, placeId] },
      );
    }
    if (!seen) {
      setPhase('demo');
      speak(DEMO_LINE[item!.template] ?? 'Watch once, then it is your turn.');
    } else {
      setPhase('play');
      speak(item!.prompt);
    }
  }

  function skipDemo() {
    update((current) => rememberTemplate(current, item!.template));
    setPhase('play');
    speak(item!.prompt);
  }

  function record(ok: boolean, currentItem: Item) {
    setAsked((value) => value + 1);
    const at = Date.now();
    const deed = ok ? deedLine(placeId, currentItem) : '';
    const pageId = `${chapterId.current}:${deeds.current.length + 1}`;
    if (ok) {
      setCorrect((value) => value + 1);
      deeds.current = [...deeds.current, deed];
    }
    update((current) => {
      const prev = current.topics[currentItem.topicId];
      const nextTopic = recordAttempt(prev, ok, sessionId.current, currentItem.template, at);
      const sessions = current.sessions.map((session) =>
        session.id === sessionId.current
          ? {
              ...session,
              topicIds: session.topicIds.includes(currentItem.topicId) ? session.topicIds : [...session.topicIds, currentItem.topicId],
              correct: session.correct + (ok ? 1 : 0),
              incorrect: session.incorrect + (ok ? 0 : 1),
            }
          : session,
      );
      const next = { ...current, topics: { ...current.topics, [currentItem.topicId]: nextTopic }, sessions };
      const bumped = ok ? bumpPlaceQuests(next, placeId) : next;
      const awarded = ok ? awardCrystals(bumped, crystalGain(placeId)) : bumped;
      if (!ok) return awarded;
      return {
        ...awarded,
        books: appendPuzzlePage(awarded.books, {
          placeId,
          chapterId: chapterId.current,
          at,
          intro: { id: `${chapterId.current}:intro`, text: visitIntro(placeId, current.wardrobe) },
          deed: { id: pageId, text: deed },
        }),
      };
    });
  }

  function cast() {
    if (!item) return;
    const board = api.current?.getState();
    if (!board) return;
    if (isSolved(item, board)) {
      record(true, item);
      const praise = `${PRAISE[correct % PRAISE.length] ?? PRAISE[0]} ${rewardSpeech(progress.crystals, crystalGain(placeId))}`;
      setLive({ lastAnswer: `Correct. ${describeBoard(item, board)}` });
      setNote(praise);
      setPhase('ok');
      speak(praise);
      return;
    }
    const fizzle = 'That spell fizzled softly. Nothing is hurt. Change one thing and try again.';
    setLive({ lastAnswer: `Not yet. ${describeBoard(item, board)}` });
    setNote(fizzle);
    speak(fizzle);
  }

  function hint() {
    if (!item) return;
    const level = Math.min(2, hintLevel);
    const text = item.hints[level] ?? item.hints[0];
    setHintLevel(level + 1);
    setNote(text);
    speak(text);
  }

  function idk() {
    if (!item) return;
    const board = api.current?.getState();
    setLive({ lastAnswer: board ? `She said I don't know. ${describeBoard(item, board)}` : "She said I don't know." });
    record(false, item);
    setPhase('walk');
    setNote(null);
    speak(item.walkthrough.join(' '));
  }

  function freshTry() {
    if (!slot) return;
    const nextRetry = retry + 1;
    setRetry(nextRetry);
    setHintLevel(0);
    setNote(null);
    setPhase('play');
    const ease = progressRef.current.topics[slot.topic.id]?.ease ?? 0;
    const fresh = generateItem(slot.topic, `${slot.salt}:retry${nextRetry}`, ease);
    speak(fresh.prompt);
  }

  function next(skippedTopicId?: string) {
    if (index + 1 >= slots.length) {
      onFinish(correct, asked, deeds.current, chapterId.current);
      return;
    }
    const upcoming = slots[index + 1];
    if (!upcoming) return;
    const stored = progressRef.current.topics[upcoming.topic.id]?.ease ?? 0;
    const ease = skippedTopicId === upcoming.topic.id ? Math.min(2, stored + 1) : stored;
    const upcomingItem = generateItem(upcoming.topic, upcoming.salt, ease);
    const showDemo = !progressRef.current.seenTemplates.includes(upcomingItem.template);
    setIndex(index + 1);
    setRetry(0);
    setHintLevel(0);
    setNote(null);
    if (showDemo) {
      setPhase('demo');
      speak(DEMO_LINE[upcomingItem.template] ?? 'Watch once, then it is your turn.');
    } else {
      setPhase('play');
      speak(upcomingItem.prompt);
    }
  }

  function hopPast() {
    if (!item || moving.current) return;
    moving.current = true;
    const board = api.current?.getState();
    setLive({
      lastAnswer: board ? `She hopped past this spell. ${describeBoard(item, board)}` : 'She hopped past this spell.',
    });
    const topicId = item.topicId;
    update((current) => applySkip(current, topicId, sessionId.current, Date.now()));
    speak('On we hop. A gentler spell is waiting.');
    next(topicId);
  }

  const star = `${import.meta.env.BASE_URL}art/star.webp`;
  const spot = PLACES.find((entry) => entry.id === placeId) ?? PLACES[0];
  return (
    <section className="quest place-scene" data-place={placeId} style={placeStyle(placeId)}>
      {onOpenBook ? <PlaceBookButton placeId={placeId} books={progress.books} onOpen={onOpenBook} /> : null}
      <header className="quest-top">
        <p className="kicker">{mode === 'placement' ? 'Finding your path' : chapter?.title}</p>
        <div className="quest-meta">
          {onStory ? <StoryButton onClick={onStory} /> : null}
          <CrystalCounter count={progress.crystals} />
          <div className="pips" aria-label={`Spell ${index + 1} of ${slots.length}`}>
            {slots.map((entry, pip) => (
              <i key={`${entry.topic.id}-${pip}`} className={pip < index ? 'done' : pip === index ? 'now' : ''} />
            ))}
          </div>
        </div>
      </header>
      <TalkDock progress={progress} update={update} placeId={placeId} />
      {phase === 'intro' ? (
        <div className="panel story">
          <div className="intro-cast">
            <DressedApprentice className="guide guide-small" alt="" />
            <Prop name={spot.prop} className="place-vignette" alt="" />
          </div>
          <h2>{mode === 'placement' ? spot.heading : chapter?.title}</h2>
          <p>
            {mode === 'placement'
              ? `${spot.line} Five tiny spells, ${progress.learnerName}. They are not a test you can fail. They only show the garden where to open the gate.`
              : chapter?.intro}
          </p>
          <button type="button" className="btn gold xl" data-testid={mode === 'placement' ? 'begin-placement' : 'begin-puzzles'} onClick={begin}>
            {mode === 'placement' ? "I'm ready" : 'Begin the spells'}
          </button>
        </div>
      ) : null}
      {phase === 'demo' ? (
        <div className="panel demo" data-testid="demo">
          <p className="kicker">Watch first</p>
          <h2>{item.template.replace('-', ' ')}</h2>
          <p>{DEMO_LINE[item.template]}</p>
          <div className={`demo-art demo-${item.template}`} aria-hidden>
            <DressedApprentice className="guide guide-small" alt="" />
            <span className="ghost-hand" />
          </div>
          <button type="button" className="btn gold xl" data-testid="skip-demo" onClick={skipDemo}>
            Your turn
          </button>
        </div>
      ) : null}
      {phase === 'play' || phase === 'ok' ? (
        <div
          className="play"
          data-testid="activity"
          data-template={item.template}
          data-topic={item.topicId}
          data-focus={slot.focus ? 'yes' : 'no'}
        >
          {phase === 'ok' ? (
            <div className="sparkles" aria-hidden>
              {Array.from({ length: 8 }, (_, i) => (
                <i key={i} style={{ ['--i' as string]: i }}>
                  <img src={star} alt="" />
                </i>
              ))}
            </div>
          ) : null}
          <h2 className="prompt">{item.prompt}</h2>
          <button type="button" className="replay" data-testid="replay" onClick={() => speak(note && phase === 'play' ? note : item.prompt)}>
            Hear it again
          </button>
          <Board item={item} api={api} />
          {note ? <p className={phase === 'ok' ? 'note good' : 'note'}>{note}</p> : null}
          <DressedApprentice className="play-guide" alt="" />
          <div className="dock">
            {phase === 'play' ? (
              <>
                <button type="button" className="btn quiet" data-testid="hint" onClick={hint}>
                  Hint
                </button>
                <button type="button" className="btn quiet" data-testid="idk" onClick={idk}>
                  I don't know
                </button>
                <SkipButton onClick={hopPast} />
                <button type="button" className="btn gold xl" data-testid="cast" onClick={cast}>
                  Cast the spell
                </button>
              </>
            ) : (
              <button type="button" className="btn primary xl" data-testid="next" onClick={() => next()}>
                {index + 1 >= slots.length ? 'See what woke up' : 'On we go'}
              </button>
            )}
          </div>
        </div>
      ) : null}
      {phase === 'walk' ? (
        <div className="panel walk">
          <p className="kicker">A gentle look</p>
          <h2>Let's walk it together</h2>
          <ol>
            {item.walkthrough.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <button
            type="button"
            className="btn gold xl"
            data-testid="walk-done"
            onClick={() => {
              freshTry();
              speak('Here is a fresh one, just for you.');
            }}
          >
            I'll try a fresh one
          </button>
        </div>
      ) : null}
    </section>
  );
}
