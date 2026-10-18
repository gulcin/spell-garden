import { useEffect, useRef, useState } from 'react';
import type { Progress } from '../progress/types.ts';
import { pageArt, pageAudio, pageCues, storyById, STORIES, type Tale } from '../stories/library.ts';
import { placeStyle } from './pictures.tsx';

type CueFile = { duration: number; words: { text: string; start: number; end: number }[] };

export function StoryButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="btn quiet story-open" data-testid="story-open" onClick={onClick}>
      Story
    </button>
  );
}

export function StoryOffer({ storyId, onHear, onSkip }: { storyId: string; onHear: () => void; onSkip: () => void }) {
  const story = storyById(storyId);
  return (
    <section className="panel story place-card story-offer place-scene" style={placeStyle(storyId)} data-testid="story-offer">
      <p className="kicker">{story?.place ?? 'A place in the garden'}</p>
      <h1>{story?.title ?? 'A little story'}</h1>
      <p>
        {story
          ? `${story.title} is a short story about this place. You can hear it now, or go on and come back later.`
          : 'There is a short story here, if you would like it.'}
      </p>
      <button type="button" className="btn gold xl" data-testid="story-hear" onClick={onHear}>
        Hear the story
      </button>
      <button type="button" className="btn quiet xl" data-testid="story-skip" onClick={onSkip}>
        Not now
      </button>
    </section>
  );
}

export function StoryShelf({
  progress,
  onOpen,
  onBedtime,
  onFavourite,
}: {
  progress: Progress;
  onOpen: (id: string) => void;
  onBedtime: () => void;
  onFavourite: (id: string) => void;
}) {
  const base = import.meta.env.BASE_URL;
  return (
    <section
      className="shelf-room place-scene"
      data-testid="story-shelf"
      style={{
        backgroundImage: `image-set(url("${base}art/bookshelf.webp") 1x, url("${base}art/bookshelf@2x.webp") 2x)`,
      }}
    >
      <header className="shop-top">
        <div>
          <p className="kicker">Story shelf</p>
          <h1>Listen now, or later</h1>
        </div>
      </header>
      <p className="colour-intro">Every story is open. A heart keeps a favourite. Heard stories can be listened to again.</p>
      <button type="button" className="btn gold xl" data-testid="bedtime" onClick={onBedtime}>
        Bedtime listen
      </button>
      <div className="book-grid">
        {STORIES.map((story) => {
          const heard = progress.storiesHeard.includes(story.id);
          const loved = progress.storyFavourites.includes(story.id);
          const cover = pageArt(story.id, 0);
          return (
            <article key={story.id} className="book-card">
              <button type="button" className="book-open" data-testid={`book-${story.id}`} onClick={() => onOpen(story.id)}>
                <img src={cover.src} srcSet={cover.srcSet} alt="" />
                <strong>{story.title}</strong>
                <span>{story.place}</span>
                {heard ? <em data-testid={`heard-${story.id}`}>Listen again</em> : <em className="fresh">Ready</em>}
              </button>
              <button
                type="button"
                className={loved ? 'heart on' : 'heart'}
                aria-pressed={loved}
                aria-label={loved ? `Remove ${story.title} from favourites` : `Save ${story.title} for later`}
                data-testid={`favourite-${story.id}`}
                onClick={() => onFavourite(story.id)}
              >
                ♥
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function StoryReader({
  storyId,
  bedtime,
  onHeard,
  onClose,
  onNextStory,
  onToggleFavourite,
  loved,
  startPage = 0,
  autoplay = true,
}: {
  storyId: string;
  bedtime: boolean;
  loved: boolean;
  onHeard: () => void;
  onClose: () => void;
  onNextStory: () => void;
  onToggleFavourite: () => void;
  startPage?: number;
  autoplay?: boolean;
}) {
  const story = storyById(storyId);
  if (!story) return null;
  return (
    <ReaderBody
      key={`${story.id}-${bedtime ? 'night' : 'day'}-${startPage}`}
      story={story}
      bedtime={bedtime}
      loved={loved}
      startPage={startPage}
      autoplay={autoplay}
      onHeard={onHeard}
      onClose={onClose}
      onNextStory={onNextStory}
      onToggleFavourite={onToggleFavourite}
    />
  );
}

function ReaderBody({
  story,
  bedtime,
  loved,
  startPage,
  autoplay,
  onHeard,
  onClose,
  onNextStory,
  onToggleFavourite,
}: {
  story: Tale;
  bedtime: boolean;
  loved: boolean;
  startPage: number;
  autoplay: boolean;
  onHeard: () => void;
  onClose: () => void;
  onNextStory: () => void;
  onToggleFavourite: () => void;
}) {
  const reduce = useReduceMotion();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [page, setPage] = useState(() => Math.max(0, Math.min(story.pages.length - 1, startPage)));
  const [turn, setTurn] = useState('');
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [cues, setCues] = useState<CueFile | null>(null);
  const heardRef = useRef(false);
  const last = story.pages.length - 1;

  useEffect(() => {
    let gone = false;
    setCues(null);
    setTime(0);
    fetch(pageCues(story.id, page))
      .then((response) => (response.ok ? response.json() : null))
      .then((data: CueFile | null) => {
        if (!gone) setCues(data);
      })
      .catch(() => undefined);
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = pageAudio(story.id, page);
    audio.currentTime = 0;
    const start = async () => {
      if (!autoplay) {
        if (!gone) setPlaying(false);
        return;
      }
      try {
        await audio.play();
        if (!gone) setPlaying(true);
      } catch {
        if (!gone) setPlaying(false);
      }
    };
    void start();
    return () => {
      gone = true;
      audio.pause();
    };
  }, [autoplay, page, story.id]);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const tick = () => {
      const audio = audioRef.current;
      if (audio) setTime(audio.currentTime);
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [playing, page, story.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setTime(audio.currentTime);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnd = () => {
      setPlaying(false);
      if (page < last) {
        go(page + 1, 'next');
        return;
      }
      if (!heardRef.current) {
        heardRef.current = true;
        onHeard();
      }
      if (bedtime) onNextStory();
    };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnd);
    };
  }, [bedtime, last, onHeard, onNextStory, page]);

  function go(next: number, direction: 'next' | 'back') {
    const clamped = Math.max(0, Math.min(last, next));
    if (clamped === page) return;
    audioRef.current?.pause();
    if (reduce) {
      setPage(clamped);
      return;
    }
    setTurn(direction);
    window.setTimeout(() => {
      setPage(clamped);
      setTurn('');
    }, 280);
  }

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play();
    else audio.pause();
  }

  const text = story.pages[page] ?? '';
  const pieces = piecesOf(text);
  const wordCount = pieces.filter((piece) => piece.index != null).length;
  const active = activeWord(cues, time, wordCount);
  const art = pageArt(story.id, page);
  const groups = sentences(pieces);

  return (
    <section className={bedtime ? 'story-reader bedtime' : 'story-reader'} data-testid="story-reader">
      <header className="story-top">
        <button type="button" className="btn quiet" data-testid="story-close" onClick={onClose}>
          {bedtime ? 'Goodnight' : 'Close'}
        </button>
        <div>
          <p className="kicker">{story.place}</p>
          <h1>{story.title}</h1>
        </div>
        <img
          className={reduce ? 'story-moth still' : 'story-moth'}
          src={`${import.meta.env.BASE_URL}art/moth.webp`}
          alt=""
        />
        <button type="button" className={loved ? 'heart on' : 'heart'} aria-pressed={loved} data-testid="story-favourite" onClick={onToggleFavourite}>
          ♥
        </button>
      </header>
      <article className={turn ? `story-sheet turn-${turn}` : 'story-sheet'} data-testid="story-page" data-page={page}>
        <div className={reduce ? 'story-stage still' : 'story-stage'}>
          <img className="story-art story-layer back" src={art.src} srcSet={art.srcSet} alt="" />
          <div className="story-sparkles story-layer mid" aria-hidden>
            {Array.from({ length: 7 }, (_, i) => (
              <i key={i} style={{ ['--i' as string]: i }} />
            ))}
          </div>
        </div>
        <div className="story-words" aria-live="off">
          {bedtime ? <p className="kicker">The pictures are resting. The voice goes on.</p> : null}
          <p>
            {groups.map((group, groupIndex) => {
              const on = group.some((piece) => piece.index === active);
              return (
                <span key={groupIndex} className={on ? 'sentence now' : 'sentence'}>
                  {group.map((piece, pieceIndex) =>
                    piece.index == null ? (
                      piece.word
                    ) : (
                      <span key={pieceIndex} className={piece.index === active ? 'word now' : 'word'}>
                        {piece.word}
                      </span>
                    ),
                  )}
                </span>
              );
            })}
          </p>
        </div>
      </article>
      <div className="story-controls">
        <button type="button" data-testid="story-back" onClick={() => go(page - 1, 'back')} disabled={page === 0}>
          Back
        </button>
        <button type="button" className="btn gold" data-testid="story-play" onClick={toggle}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <button
          type="button"
          data-testid="story-next"
          onClick={() => {
            if (page === last) {
              if (!heardRef.current) {
                heardRef.current = true;
                onHeard();
              }
              if (bedtime) onNextStory();
              else onClose();
              return;
            }
            go(page + 1, 'next');
          }}
        >
          {page === last ? 'The end' : 'Next'}
        </button>
      </div>
      <p className="story-count">
        Page {page + 1} of {story.pages.length}
      </p>
      <audio ref={audioRef} preload="auto" playsInline data-testid="story-audio" />
    </section>
  );
}

function piecesOf(text: string): { word: string; index: number | null }[] {
  let index = 0;
  return text.split(/(\s+)/).filter(Boolean).map((word) => {
    if (/^\s+$/.test(word)) return { word, index: null };
    const piece = { word, index };
    index += 1;
    return piece;
  });
}

function sentences(pieces: { word: string; index: number | null }[]) {
  const groups: { word: string; index: number | null }[][] = [];
  let current: { word: string; index: number | null }[] = [];
  for (const piece of pieces) {
    current.push(piece);
    if (piece.index != null && /[.!?]["']?$/.test(piece.word)) {
      groups.push(current);
      current = [];
    }
  }
  if (current.length) groups.push(current);
  return groups;
}

function activeWord(cues: CueFile | null, time: number, wordCount: number): number {
  if (!cues || wordCount === 0) return -1;
  if (cues.words.length === wordCount) {
    const found = cues.words.findIndex((word) => time >= word.start && time < word.end + 0.04);
    return found;
  }
  if (!cues.duration) return -1;
  return Math.min(wordCount - 1, Math.floor((time / cues.duration) * wordCount));
}

function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduce(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);
  return reduce;
}

export function rememberStory(progress: Progress, id: string, field: 'storyOffers' | 'storiesHeard' | 'storyFavourites'): Progress {
  const list = progress[field];
  if (field === 'storyFavourites' && list.includes(id)) {
    return { ...progress, storyFavourites: list.filter((item) => item !== id) };
  }
  if (list.includes(id)) return progress;
  return { ...progress, [field]: [...list, id] };
}
