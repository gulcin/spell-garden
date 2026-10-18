import { useState } from 'react';
import { allTopics } from './curriculum/data.ts';
import { applyPlacement } from './progress/placement.ts';
import { loadProgress, saveProgress } from './progress/storage.ts';
import { DEFAULT_LEARNER_NAME, type Progress } from './progress/types.ts';
import { chapterFor, nextReward, type Reward } from './story.ts';
import { About } from './ui/About.tsx';
import { Garden } from './ui/Garden.tsx';
import { Home } from './ui/Home.tsx';
import { Parent } from './ui/Parent.tsx';
import { Quest } from './ui/Quest.tsx';
import { RewardScreen } from './ui/Reward.tsx';

type Screen = 'home' | 'placement' | 'placed' | 'chapter' | 'reward' | 'parent' | 'about' | 'garden';

export function App() {
  const [progress, setProgress] = useState<Progress>(() => loadProgress());
  const [screen, setScreen] = useState<Screen>('home');
  const [reward, setReward] = useState<Reward | null>(null);
  const [placedCorrect, setPlacedCorrect] = useState(0);

  function update(recipe: (current: Progress) => Progress) {
    setProgress((current) => {
      const next = recipe(current);
      saveProgress(next);
      return next;
    });
  }

  function start() {
    setScreen(progress.placement.done ? 'chapter' : 'placement');
  }

  return (
    <main className="app">
      {screen === 'home' ? (
        <Home
          progress={progress}
          onStart={start}
          onGarden={() => setScreen('garden')}
          onAbout={() => setScreen('about')}
          onParent={() => setScreen('parent')}
          onRename={(name) => update((current) => ({ ...current, learnerName: name || DEFAULT_LEARNER_NAME }))}
        />
      ) : null}
      {screen === 'garden' ? <Garden progress={progress} onHome={() => setScreen('home')} /> : null}
      {screen === 'about' ? <About onHome={() => setScreen('home')} /> : null}
      {screen === 'parent' ? <Parent progress={progress} update={update} onHome={() => setScreen('home')} /> : null}
      {screen === 'placement' ? (
        <Quest
          mode="placement"
          progress={progress}
          update={update}
          onFinish={(correct, asked) => {
            update((current) => applyPlacement(current, correct, asked, allTopics(), Date.now()));
            setPlacedCorrect(correct);
            setScreen('placed');
          }}
        />
      ) : null}
      {screen === 'placed' ? (
        <section className="panel story">
          <p className="kicker">The gate is open</p>
          <h2>{progress.placement.frontierAge >= 8 ? 'The grade-three garden is ready' : 'We will start gently'}</h2>
          <p>
            {progress.learnerName} lit {placedCorrect} of the little spells. Chapters begin
            {progress.placement.frontierAge >= 8 ? ' around third grade' : ' a little earlier'}, step back when an idea is
            missing, and can climb as far as the spells go.
          </p>
          <button type="button" className="btn gold xl" data-testid="start-chapter" onClick={() => setScreen('chapter')}>
            Start the first chapter
          </button>
        </section>
      ) : null}
      {screen === 'chapter' ? (
        <Quest
          mode="chapter"
          progress={progress}
          chapter={chapterFor(progress.sessions.length)}
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
            setScreen('reward');
          }}
        />
      ) : null}
      {screen === 'reward' && reward ? (
        <RewardScreen reward={reward} name={progress.learnerName} onHome={() => setScreen('home')} />
      ) : null}
    </main>
  );
}
