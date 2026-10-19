import { useEffect, useRef, useState } from 'react';
import { Board, type BoardHandle } from '../activities/Board.tsx';
import { generateItem, sampleItem } from '../activities/generate.ts';
import { isSolved } from '../activities/logic.ts';
import type { Item } from '../activities/types.ts';
import { classify, TEMPLATE_LABEL, type TemplateId } from '../curriculum/classify.ts';
import { allTopics } from '../curriculum/data.ts';
import { freshProgress, type Progress, type WardrobeState } from '../progress/types.ts';
import { REWARDS } from '../story.ts';
import { SHOP_ITEMS, itemById, type ShopCategory } from '../wardrobe/catalog.ts';
import { buyFurniture } from '../house/buy.ts';
import { breakInto } from '../wardrobe/purse.ts';
import { ReportLiveProvider } from '../feedback/live.tsx';
import { About } from './About.tsx';
import { TellSheet, TellUsButton } from './TellUs.tsx';
import { ColouringCorner } from './ColouringCorner.tsx';
import { CrystalShop } from './CrystalShop.tsx';
import { WitchHouse } from './WitchHouse.tsx';
import { WardrobeProvider } from './DressedApprentice.tsx';
import { DressedApprentice } from './DressedApprentice.tsx';
import { Garden } from './Garden.tsx';
import { GardenMapButton } from './GardenMapButton.tsx';
import { Home } from './Home.tsx';
import { Parent } from './Parent.tsx';
import { PLACES, placeStyle, Prop } from './pictures.tsx';
import { RewardScreen } from './Reward.tsx';
import { SkipButton } from './SkipButton.tsx';
import { buildAdventure } from '../stories/adventure.ts';
import { appendPuzzlePage, bookByPlace } from '../stories/books.ts';
import { BookReader, rememberStory, StoryOffer, StoryReader, StoryShelf } from './StoryTime.tsx';
import { WardrobeMirror } from './Wardrobe.tsx';

function previewProgress(screen: string, dressed: boolean): Progress {
  const progress = freshProgress('Aida');
  if (screen === 'shop' || screen === 'house') {
    progress.crystals = 40;
    progress.purse = breakInto(40);
    if (dressed) {
      progress.wardrobe = {
        owned: ['robe-rose', 'hat-mushroom', 'extra-crown'],
        equipped: { dress: 'robe-rose', hat: 'hat-mushroom', crown: 'extra-crown' },
      };
    }
    if (screen === 'house') {
      const bought = buyFurniture(progress, 'rose-armchair', Date.UTC(2026, 9, 18));
      progress.house = bought.progress.house;
      progress.books = bought.progress.books;
      progress.crystals = bought.progress.crystals;
      progress.purse = bought.progress.purse;
    }
    return progress;
  }
  if (dressed) {
    progress.crystals = 18;
    progress.purse = breakInto(18);
    progress.wardrobe = {
      owned: ['robe-rose', 'hat-mushroom', 'extra-crown', 'extra-kitten', 'broom-blossom', 'extra-necklace'],
      equipped: {
        dress: 'robe-rose',
        hat: 'hat-mushroom',
        crown: 'extra-crown',
        familiar: 'extra-kitten',
        broom: 'broom-blossom',
        necklace: 'extra-necklace',
      },
    };
  }
  if (screen === 'shelf' || screen === 'adventure') {
    progress.wardrobe = {
      owned: ['robe-rose', 'hat-mushroom'],
      equipped: { dress: 'robe-rose', hat: 'hat-mushroom' },
    };
    progress.adventures = [
      buildAdventure({
        name: 'Aida',
        placeId: 'lantern-grove',
        deeds: ['You lit 7 lanterns.', 'You shared 12 crystals between 3 jars.'],
        crystals: 4,
        wardrobe: progress.wardrobe,
        creature: 'Nim the moth',
        at: Date.UTC(2026, 9, 18),
      }),
    ];
    progress.books = appendPuzzlePage(progress.books, {
      placeId: 'lantern-grove',
      chapterId: 'visit-preview',
      at: Date.UTC(2026, 9, 18),
      intro: { id: 'visit-preview:intro', text: 'Today you visited the lantern grove. You wore your rose petal robe and mushroom cap.' },
      deed: { id: 'visit-preview:1', text: 'You lit 7 lanterns.' },
    });
  }
  return progress;
}

function wardrobePreview(params: URLSearchParams): WardrobeState {
  const equipped: WardrobeState['equipped'] = {};
  const dress = params.get('robe') ?? '';
  const hat = params.get('hat') ?? '';
  const broom = params.get('broom') ?? '';
  const extra = params.get('extra') ?? '';
  if (dress) equipped.dress = dress;
  if (hat) equipped.hat = hat;
  if (broom) equipped.broom = broom;
  if (extra) {
    const item = itemById(extra);
    if (item) equipped[item.slot] = extra;
  }
  return { owned: SHOP_ITEMS.map((item) => item.id), equipped };
}

const PLACE_OF: Record<TemplateId, (typeof PLACES)[number]['id']> = {
  'ten-frame': 'lantern-grove',
  pattern: 'lantern-grove',
  fallback: 'lantern-grove',
  sharing: 'potion-cottage',
  fraction: 'potion-cottage',
  balance: 'potion-cottage',
  shapes: 'crystal-cave',
  chance: 'crystal-cave',
  clock: 'observatory',
  coins: 'observatory',
  coordinate: 'observatory',
  angle: 'observatory',
  'number-line': 'lily-pond',
  array: 'greenhouse',
  sort: 'greenhouse',
  'base-ten': 'wizard-tower',
  measure: 'wizard-tower',
  'bar-model': 'wizard-tower',
  symmetry: 'mushroom-ring',
  graph: 'mushroom-ring',
};

/** Unlinked art check. `?preview=art&screen=play&template=clock` */
export function Gallery() {
  const params = new URLSearchParams(window.location.search);
  const screen = params.get('screen') ?? 'home';
  const template = (params.get('template') ?? 'ten-frame') as TemplateId;
  const place = PLACE_OF[template] ?? 'lantern-grove';
  const category = (params.get('category') ?? 'dress') as ShopCategory | 'home';
  const dressed = params.get('dressed') === '1' || screen === 'wardrobe';
  const [progress, setProgress] = useState<Progress>(() => {
    const next = previewProgress(screen, dressed);
    if (screen === 'wardrobe') next.wardrobe = wardrobePreview(params);
    return next;
  });
  const [telling, setTelling] = useState(params.get('tell') === '1');
  const away = screen !== 'home';
  function update(recipe: (current: Progress) => Progress) {
    setProgress((current) => recipe(current));
  }
  return (
    <ReportLiveProvider>
    <WardrobeProvider wardrobe={progress.wardrobe}>
    <main className={away ? 'app away' : 'app'}>
      <div className="corner-tools">
        {away ? <GardenMapButton onHome={() => undefined} /> : null}
        <TellUsButton onOpen={() => setTelling(true)} />
      </div>
      {screen === 'home' ? (
        <Home progress={progress} onStart={() => undefined} onVisit={() => undefined} onShop={() => undefined} onHouse={() => undefined} onColour={() => undefined} onStories={() => undefined} onGarden={() => undefined} onAbout={() => undefined} onParent={() => undefined} onRename={() => undefined} />
      ) : null}
      {screen === 'shop' ? (
        <CrystalShop progress={progress} update={update} category={category} onWardrobe={() => undefined} onHouse={() => undefined} onStory={() => undefined} onOpenBook={() => undefined} />
      ) : null}
      {screen === 'shelf' ? (
        <StoryShelf
          progress={progress}
          onOpenBook={() => undefined}
          onBedtime={() => undefined}
          onFavourite={(id) => update((current) => rememberStory(current, id, 'storyFavourites'))}
        />
      ) : null}
      {screen === 'story-offer' ? <StoryOffer storyId={params.get('story') ?? 'crystal-cave'} books={progress.books} onOpenBook={() => undefined} onHear={() => undefined} onSkip={() => undefined} /> : null}
      {screen === 'book' ? (
        <BookReader
          placeId="lantern-grove"
          book={bookByPlace(progress.books, 'lantern-grove')}
          bedtime={false}
          loved={false}
          autoplay={params.get('speak') !== '0'}
          onHeard={() => undefined}
          onClose={() => undefined}
          onNextStory={() => undefined}
          onToggleFavourite={() => undefined}
        />
      ) : null}
      {screen === 'adventure' ? (
        <StoryReader
          storyId={progress.adventures[0]?.id ?? 'adventure'}
          adventure={progress.adventures[0] ?? null}
          bedtime={false}
          loved={false}
          autoplay={params.get('speak') !== '0'}
          onHeard={() => undefined}
          onClose={() => undefined}
          onNextStory={() => undefined}
          onToggleFavourite={() => undefined}
        />
      ) : null}
      {screen === 'story' ? (
        <StoryReader
          storyId={params.get('story') ?? 'crystal-cave'}
          bedtime={params.get('bedtime') === '1'}
          loved={progress.storyFavourites.includes(params.get('story') ?? 'crystal-cave')}
          startPage={Number(params.get('page') ?? '0')}
          autoplay={false}
          onHeard={() => undefined}
          onClose={() => undefined}
          onNextStory={() => undefined}
          onToggleFavourite={() =>
            update((current) => rememberStory(current, params.get('story') ?? 'crystal-cave', 'storyFavourites'))
          }
        />
      ) : null}
      {screen === 'house' ? <WitchHouse progress={progress} update={update} onShop={() => undefined} onOpenBook={() => undefined} /> : null}
      {screen === 'colour' || screen === 'sheet' ? (
        <ColouringCorner
          progress={progress}
          update={update}
          startSheet={screen === 'sheet' ? params.get('sheet') : null}
          demoPaint={params.get('paint') === '1'}
          onStory={() => undefined}
        />
      ) : null}
      {screen === 'wardrobe' ? <WardrobeMirror progress={progress} update={update} onShop={() => undefined} /> : null}
      {screen === 'about' ? <About onHome={() => undefined} /> : null}
      {screen === 'garden' ? <Garden progress={progress} onHome={() => undefined} onTry={() => undefined} /> : null}
      {screen === 'gate' ? <Parent progress={progress} update={() => undefined} onHome={() => undefined} /> : null}
      {screen === 'journal' ? <Parent progress={progress} update={() => undefined} onHome={() => undefined} startOpen /> : null}
      {screen === 'reward' ? (
        <div className="place-scene fill-scene" style={placeStyle(place)}>
          <RewardScreen reward={REWARDS[0]!} name="Aida" onHome={() => undefined} />
        </div>
      ) : null}
      {screen === 'placed' ? (
        <section className="panel story place-card">
          <p className="kicker">The gate is open</p>
          <h2>The grade-three garden is ready</h2>
          <p>Aida lit 4 of the little spells. Chapters begin around third grade, step back when an idea is missing, and can climb as far as the spells go.</p>
          <button type="button" className="btn gold xl">
            Start the first chapter
          </button>
        </section>
      ) : null}
      {screen === 'intro' ? <Intro place={params.get('place') ?? place} /> : null}
      {screen === 'demo' || screen === 'play' || screen === 'ok' || screen === 'hint' || screen === 'walk' || screen === 'example' ? (
        <Activity
          screen={screen}
          template={screen === 'example' ? 'fallback' : template}
          named={params.get('named') === 'colours'}
          topicQuery={params.get('topic')}
        />
      ) : null}
      {telling ? <TellSheet onClose={() => setTelling(false)} /> : null}
    </main>
    </WardrobeProvider>
    </ReportLiveProvider>
  );
}

function Intro({ place }: { place: string }) {
  const spot = PLACES.find((entry) => entry.id === place) ?? PLACES[0];
  return (
    <section className="quest place-scene" style={placeStyle(spot.id)}>
      <header className="quest-top">
        <p className="kicker">{spot.name}</p>
      </header>
      <div className="panel story">
        <div className="intro-cast">
          <DressedApprentice className="guide guide-small" alt="" />
          <Prop name={spot.prop} className="place-vignette" alt="" />
        </div>
        <h2>{spot.heading}</h2>
        <p>{spot.line}</p>
        <button type="button" className="btn gold xl">
          I'm ready
        </button>
      </div>
    </section>
  );
}

function previewItem(template: TemplateId, named: boolean, topicQuery: string | null): Item {
  if (topicQuery) {
    const needle = topicQuery.toLowerCase();
    const topic =
      allTopics().find((entry) => entry.id === topicQuery || entry.name.toLowerCase() === needle) ??
      allTopics().find((entry) => entry.name.toLowerCase().includes(needle));
    if (topic) return generateItem(topic, `art-preview-${topic.id}`);
  }
  if (named) {
    const topic = allTopics().find((entry) => classify(entry) === template && /blue|pink|cloudy/.test(generateItem(entry, 'colour-check').prompt));
    if (topic) return generateItem(topic, 'colour-check');
  }
  return sampleItem(template);
}

function Activity({
  screen,
  template,
  named,
  topicQuery,
}: {
  screen: string;
  template: TemplateId;
  named: boolean;
  topicQuery: string | null;
}) {
  const item = previewItem(template, named, topicQuery);
  const place = PLACE_OF[item.template] ?? 'lantern-grove';
  const api = useRef<BoardHandle | null>(null);
  useEffect(() => {
    window.__prague = {
      item,
      getState: () => api.current?.getState(),
      solved: () => {
        const state = api.current?.getState();
        return state ? isSolved(item, state) : false;
      },
    };
  }, [item]);
  const star = `${import.meta.env.BASE_URL}art/star.webp`;
  if (screen === 'walk') {
    return (
      <section className="quest place-scene" style={placeStyle(place)}>
        <div className="panel walk">
          <p className="kicker">A gentle look</p>
          <h2>Let's walk it together</h2>
          <ol>
            {item.walkthrough.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <button type="button" className="btn gold xl">
            I'll try a fresh one
          </button>
        </div>
      </section>
    );
  }
  if (screen === 'demo') {
    return (
      <section className="quest place-scene" style={placeStyle(place)}>
        <div className="panel demo" data-testid="demo">
          <p className="kicker">Watch first</p>
          <h2>{TEMPLATE_LABEL[item.template]}</h2>
          <p>{item.prompt}</p>
          <div className="demo-art" aria-hidden>
            <DressedApprentice className="guide guide-small" alt="" />
          </div>
          <button type="button" className="btn gold xl">
            Your turn
          </button>
        </div>
      </section>
    );
  }
  return (
    <section className="quest place-scene" data-place={place} style={placeStyle(place)}>
      <header className="quest-top">
        <p className="kicker">{TEMPLATE_LABEL[item.template]}</p>
        <div className="pips" aria-hidden>
          <i className="now" />
          <i />
          <i />
        </div>
      </header>
      <div className="play" data-testid="activity" data-template={item.template}>
        {screen === 'ok' ? (
          <div className="sparkles" aria-hidden>
            {Array.from({ length: 8 }, (_, i) => (
              <i key={i} style={{ ['--i' as string]: i }}>
                <img src={star} alt="" />
              </i>
            ))}
          </div>
        ) : null}
        <h2 className="prompt">{item.prompt}</h2>
        <button type="button" className="replay">
          Hear it again
        </button>
        <Board item={item} api={api} />
        {screen === 'hint' ? <p className="note">{item.hints[0]}</p> : null}
        {screen === 'ok' ? <p className="note good">The spell worked. The garden glows a little warmer.</p> : null}
        <DressedApprentice className="play-guide" alt="" />
        <div className="dock">
          <button type="button" className="btn quiet">
            Hint
          </button>
          <button type="button" className="btn quiet">
            I don't know
          </button>
          <SkipButton />
          <button type="button" className="btn gold xl">
            Cast the spell
          </button>
        </div>
      </div>
    </section>
  );
}
