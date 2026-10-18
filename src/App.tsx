import { useEffect, useRef, useState } from 'react';
import { allTopics } from './curriculum/data.ts';
import { applyPlacement } from './progress/placement.ts';
import { loadProgress, saveProgress } from './progress/storage.ts';
import { DEFAULT_LEARNER_NAME, type Progress } from './progress/types.ts';
import { chapterFor, nextReward, type Reward } from './story.ts';
import { ReportLiveProvider, useReportLive } from './feedback/live.tsx';
import { About } from './ui/About.tsx';
import { ColouringCorner } from './ui/ColouringCorner.tsx';
import { CrystalShop } from './ui/CrystalShop.tsx';
import { Garden } from './ui/Garden.tsx';
import { GardenMapButton } from './ui/GardenMapButton.tsx';
import { Home } from './ui/Home.tsx';
import { TellSheet, TellUsButton } from './ui/TellUs.tsx';
import { Parent } from './ui/Parent.tsx';
import { PLACES, placeStyle } from './ui/pictures.tsx';
import { Quest } from './ui/Quest.tsx';
import { RewardScreen } from './ui/Reward.tsx';
import { rememberStory, StoryOffer, StoryReader, StoryShelf } from './ui/StoryTime.tsx';
import { storyById, STORIES } from './stories/library.ts';
import { WardrobeProvider } from './ui/DressedApprentice.tsx';
import { WardrobeMirror } from './ui/Wardrobe.tsx';

type Screen =
  | 'home'
  | 'placement'
  | 'placed'
  | 'chapter'
  | 'reward'
  | 'parent'
  | 'about'
  | 'garden'
  | 'shop'
  | 'wardrobe'
  | 'colour'
  | 'shelf'
  | 'story'
  | 'story-offer';

type HistoryState = { spellGarden?: Screen };

export function App() {
  return (
    <ReportLiveProvider>
      <GardenApp />
    </ReportLiveProvider>
  );
}

function GardenApp() {
  const { setLive } = useReportLive();
  const [progress, setProgress] = useState<Progress>(() => loadProgress());
  const [telling, setTelling] = useState(false);
  const [screen, setScreen] = useState<Screen>('home');
  const [reward, setReward] = useState<Reward | null>(null);
  const [placedCorrect, setPlacedCorrect] = useState(0);
  const [placeId, setPlaceId] = useState<(typeof PLACES)[number]['id']>('lantern-grove');
  const [chapterIndex, setChapterIndex] = useState(0);
  const [storyId, setStoryId] = useState(STORIES[0]?.id ?? 'lantern-grove');
  const [bedtime, setBedtime] = useState(false);
  const [resume, setResume] = useState<Screen>('home');
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
    setLive({ screen: next });
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

  function maybeOffer(id: string, next: Screen) {
    if (storyById(id) && !progress.storyOffers.includes(id)) {
      update((current) => rememberStory(current, id, 'storyOffers'));
      setStoryId(id);
      setBedtime(false);
      setResume(next);
      const tale = storyById(id);
      setLive({ screen: 'story-offer', placeId: id, placeName: tale?.place ?? id, activity: tale?.title ?? '', question: '' });
      show('story-offer');
      return;
    }
    show(next);
  }

  function start(chosen?: string) {
    const count = progress.sessions.length;
    const id = (chosen ?? PLACES[count % PLACES.length]!.id) as (typeof PLACES)[number]['id'];
    setPlaceId(id);
    const spot = PLACES.find((place) => place.id === id);
    const next: Screen = progress.placement.done ? 'chapter' : 'placement';
    setLive({ screen: next, placeId: id, placeName: spot?.name ?? id });
    if (progress.placement.done) setChapterIndex(count);
    maybeOffer(id, next);
  }

  function openShop() {
    update((current) =>
      current.visitedPlaces.includes('crystal-shop')
        ? current
        : { ...current, visitedPlaces: [...current.visitedPlaces, 'crystal-shop'] },
    );
    setLive({ screen: 'shop', placeId: 'crystal-shop', placeName: 'Crystal shop', activity: '', question: '' });
    maybeOffer('crystal-shop', 'shop');
  }

  function openColour() {
    update((current) =>
      current.visitedPlaces.includes('colouring-nook')
        ? current
        : { ...current, visitedPlaces: [...current.visitedPlaces, 'colouring-nook'] },
    );
    setLive({ screen: 'colour', placeId: 'colouring-nook', placeName: 'Colouring corner', activity: '', question: '' });
    maybeOffer('colouring-nook', 'colour');
  }

  function openStory(id: string, back: Screen) {
    const tale = storyById(id);
    if (!tale) return;
    setStoryId(id);
    setBedtime(false);
    setResume(back);
    setLive({ screen: 'story', placeId: id, placeName: tale.place, activity: tale.title, question: '' });
    show('story');
  }

  function beginBedtime() {
    const first = STORIES[0];
    if (!first) return;
    setStoryId(first.id);
    setBedtime(true);
    setResume('shelf');
    setLive({ screen: 'story', placeId: first.id, placeName: first.place, activity: 'Bedtime listen', question: '' });
    show('story');
  }

  function nextBedtimeStory() {
    const index = STORIES.findIndex((story) => story.id === storyId);
    const next = STORIES[index + 1];
    if (!next) {
      setBedtime(false);
      show('shelf');
      return;
    }
    setStoryId(next.id);
    setLive({ screen: 'story', placeId: next.id, placeName: next.place, activity: 'Bedtime listen', question: '' });
  }

  return (
    <WardrobeProvider wardrobe={progress.wardrobe}>
    <main className={screen === 'home' ? 'app' : 'app away'}>
      <div className="corner-tools">
        {screen !== 'home' ? <GardenMapButton onHome={() => show('home')} /> : null}
        <TellUsButton onOpen={() => setTelling(true)} />
      </div>
      {screen === 'home' ? (
        <Home
          progress={progress}
          onStart={() => start()}
          onVisit={(placeId) => start(placeId)}
          onShop={openShop}
          onColour={openColour}
          onStories={() => show('shelf')}
          onGarden={() => show('garden')}
          onAbout={() => show('about')}
          onParent={() => show('parent')}
          onRename={(name) => update((current) => ({ ...current, learnerName: name || DEFAULT_LEARNER_NAME }))}
        />
      ) : null}
      {screen === 'shop' ? (
        <CrystalShop progress={progress} update={update} onWardrobe={() => show('wardrobe')} onStory={() => openStory('crystal-shop', 'shop')} />
      ) : null}
      {screen === 'colour' ? (
        <ColouringCorner progress={progress} update={update} onStory={() => openStory('colouring-nook', 'colour')} />
      ) : null}
      {screen === 'shelf' ? (
        <StoryShelf
          progress={progress}
          onOpen={(id) => openStory(id, 'shelf')}
          onBedtime={beginBedtime}
          onFavourite={(id) => update((current) => rememberStory(current, id, 'storyFavourites'))}
        />
      ) : null}
      {screen === 'story-offer' ? (
        <StoryOffer storyId={storyId} onHear={() => openStory(storyId, resume)} onSkip={() => show(resume)} />
      ) : null}
      {screen === 'story' ? (
        <StoryReader
          storyId={storyId}
          bedtime={bedtime}
          loved={progress.storyFavourites.includes(storyId)}
          onHeard={() => update((current) => rememberStory(current, storyId, 'storiesHeard'))}
          onClose={() => {
            setBedtime(false);
            show(resume);
          }}
          onNextStory={nextBedtimeStory}
          onToggleFavourite={() => update((current) => rememberStory(current, storyId, 'storyFavourites'))}
        />
      ) : null}
      {screen === 'wardrobe' ? (
        <WardrobeMirror progress={progress} update={update} onShop={() => show('shop')} />
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
          onStory={() => openStory(placeId, 'placement')}
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
          onStory={() => openStory(placeId, 'chapter')}
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
      {telling ? <TellSheet onClose={() => setTelling(false)} /> : null}
    </main>
    </WardrobeProvider>
  );
}
