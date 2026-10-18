import { useEffect, useRef, useState } from 'react';
import { allTopics } from './curriculum/data.ts';
import { applyPlacement } from './progress/placement.ts';
import { loadProgress, saveProgress } from './progress/storage.ts';
import { DEFAULT_LEARNER_NAME, type Progress } from './progress/types.ts';
import { chapterFor, nextReward, type Reward } from './story.ts';
import { About } from './ui/About.tsx';
import { Garden } from './ui/Garden.tsx';
import { GardenMapButton } from './ui/GardenMapButton.tsx';
import { Home } from './ui/Home.tsx';
import { Parent } from './ui/Parent.tsx';
import { PLACES, placeStyle } from './ui/pictures.tsx';
import { Quest } from './ui/Quest.tsx';
import { RewardScreen } from './ui/Reward.tsx';

type Screen = 'home' | 'placement' | 'placed' | 'chapter' | 'reward' | 'parent' | 'about' | 'garden';

type HistoryState = { spellGarden?: Screen };

export function App() {
  const [progress, setProgress] = useState<Progress>(() => loadProgress());
  const [screen, setScreen] = useState<Screen>('home');
  const [reward, setReward] = useState<Reward | null>(null);
  const [placedCorrect, setPlacedCorrect] = useState(0);
  const [placeId, setPlaceId] = useState<(typeof PLACES)[number]['id']>('lantern-grove');
  const [chapterIndex, setChapterIndex] = useState(0);
  const leaving = useRef(false);

  useEffect(() => {
    const onPop = (event: PopStateEvent) => {
      leaving.current = false;
      const state = event.state as HistoryState | null;
      setScreen(state?.spellGarden ?? 'home');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  function update(recipe: (current: Progress) => Progress) {
    setProgress((current) => {
      const next = recipe(current);
      saveProgress(next);
      return next;
    });
  }

  function show(next: Screen) {
    if (next === 'placement' || next === 'chapter') {
      const count = progress.sessions.length;
      setPlaceId(PLACES[count % PLACES.length]!.id);
      if (next === 'chapter') setChapterIndex(count);
    }
    if (next === 'home') {
      saveProgress(progress);
      setScreen('home');
      const state = window.history.state as HistoryState | null;
      if (state?.spellGarden && !leaving.current) {
        leaving.current = true;
        window.history.back();
      }
      return;
    }
    leaving.current = false;
    setScreen(next);
    const state = window.history.state as HistoryState | null;
    if (state?.spellGarden) window.history.replaceState({ spellGarden: next }, '');
    else window.history.pushState({ spellGarden: next }, '');
  }

  function start() {
    show(progress.placement.done ? 'chapter' : 'placement');
  }

  return (
    <main className={screen === 'home' ? 'app' : 'app away'}>
      {screen !== 'home' ? <GardenMapButton onHome={() => show('home')} /> : null}
      {screen === 'home' ? (
        <Home
          progress={progress}
          onStart={start}
          onGarden={() => show('garden')}
          onAbout={() => show('about')}
          onParent={() => show('parent')}
          onRename={(name) => update((current) => ({ ...current, learnerName: name || DEFAULT_LEARNER_NAME }))}
        />
      ) : null}
      {screen === 'garden' ? <Garden progress={progress} onHome={() => show('home')} /> : null}
      {screen === 'about' ? <About onHome={() => show('home')} /> : null}
      {screen === 'parent' ? <Parent progress={progress} update={update} onHome={() => show('home')} /> : null}
      {screen === 'placement' ? (
        <Quest
          mode="placement"
          progress={progress}
          placeId={placeId}
          update={update}
          onFinish={(correct, asked) => {
            update((current) => applyPlacement(current, correct, asked, allTopics(), Date.now()));
            setPlacedCorrect(correct);
            show('placed');
          }}
        />
      ) : null}
      {screen === 'placed' ? (
        <section className="panel story place-card">
          <p className="kicker">The gate is open</p>
          <h2>{progress.placement.frontierAge >= 8 ? 'The grade-three garden is ready' : 'We will start gently'}</h2>
          <p>
            {progress.learnerName} lit {placedCorrect} of the little spells. Chapters begin
            {progress.placement.frontierAge >= 8 ? ' around third grade' : ' a little earlier'}, step back when an idea is
            missing, and can climb as far as the spells go.
          </p>
          <button type="button" className="btn gold xl" data-testid="start-chapter" onClick={() => show('chapter')}>
            Start the first chapter
          </button>
        </section>
      ) : null}
      {screen === 'chapter' ? (
        <Quest
          mode="chapter"
          progress={progress}
          chapter={chapterFor(chapterIndex)}
          placeId={placeId}
          update={update}
          onFinish={() => {
            const gift = nextReward(progress.rewards);
            setReward(gift);
            update((current) => ({
              ...current,
              rewards: current.rewards.includes(gift.id) ? current.rewards : [...current.rewards, gift.id],
              sessions: current.sessions.map((session, index, all) =>
                index === all.length - 1 && session.endedAt == null
                  ? { ...session, endedAt: Date.now(), rewardId: gift.id }
                  : session,
              ),
            }));
            show('reward');
          }}
        />
      ) : null}
      {screen === 'reward' && reward ? (
        <div className="place-scene fill-scene" style={placeStyle(placeId)}>
          <RewardScreen reward={reward} name={progress.learnerName} onHome={() => show('home')} />
        </div>
      ) : null}
    </main>
  );
}
