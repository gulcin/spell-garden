import { useEffect, useRef, useState } from 'react';
import { Board, type BoardHandle } from '../activities/Board.tsx';
import { generateItem, sampleItem } from '../activities/generate.ts';
import type { Item } from '../activities/types.ts';
import { classify, TEMPLATE_LABEL, type TemplateId } from '../curriculum/classify.ts';
import { allTopics } from '../curriculum/data.ts';
import { freshProgress, type Progress } from '../progress/types.ts';
import { REWARDS } from '../story.ts';
import type { ShopCategory } from '../wardrobe/catalog.ts';
import { About } from './About.tsx';
import { CrystalShop } from './CrystalShop.tsx';
import { WardrobeProvider } from './DressedApprentice.tsx';
import { DressedApprentice } from './DressedApprentice.tsx';
import { Garden } from './Garden.tsx';
import { GardenMapButton } from './GardenMapButton.tsx';
import { Home } from './Home.tsx';
import { Parent } from './Parent.tsx';
import { PLACES, placeStyle, Prop } from './pictures.tsx';
import { RewardScreen } from './Reward.tsx';
import { WardrobeMirror } from './Wardrobe.tsx';

function previewProgress(screen: string, dressed: boolean): Progress {
  const progress = freshProgress('Aida');
  if (screen === 'shop') {
    progress.crystals = 24;
    return progress;
  }
  if (dressed) {
    progress.crystals = 18;
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
  return progress;
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
  const category = (params.get('category') ?? 'dress') as ShopCategory;
  const dressed = params.get('dressed') === '1' || screen === 'wardrobe';
  const [progress, setProgress] = useState<Progress>(() => previewProgress(screen, dressed));
  const away = screen !== 'home';
  function update(recipe: (current: Progress) => Progress) {
    setProgress((current) => recipe(current));
  }
  return (
    <WardrobeProvider wardrobe={progress.wardrobe}>
    <main className={away ? 'app away' : 'app'}>
      {away ? <GardenMapButton onHome={() => undefined} /> : null}
      {screen === 'home' ? (
        <Home progress={progress} onStart={() => undefined} onShop={() => undefined} onGarden={() => undefined} onAbout={() => undefined} onParent={() => undefined} onRename={() => undefined} />
      ) : null}
      {screen === 'shop' ? (
        <CrystalShop progress={progress} update={update} category={category} onWardrobe={() => undefined} />
      ) : null}
      {screen === 'wardrobe' ? <WardrobeMirror progress={progress} update={update} onShop={() => undefined} /> : null}
      {screen === 'about' ? <About onHome={() => undefined} /> : null}
      {screen === 'garden' ? <Garden progress={progress} onHome={() => undefined} /> : null}
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
        <Activity screen={screen} template={screen === 'example' ? 'fallback' : template} named={params.get('named') === 'colours'} />
      ) : null}
    </main>
    </WardrobeProvider>
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

function previewItem(template: TemplateId, named: boolean): Item {
  if (named) {
    const topic = allTopics().find((entry) => classify(entry) === template && /blue|pink|cloudy/.test(generateItem(entry, 'colour-check').prompt));
    if (topic) return generateItem(topic, 'colour-check');
  }
  return sampleItem(template);
}

function Activity({ screen, template, named }: { screen: string; template: TemplateId; named: boolean }) {
  const item = previewItem(template, named);
  const place = PLACE_OF[item.template] ?? 'lantern-grove';
  const api = useRef<BoardHandle | null>(null);
  useEffect(() => {
    window.__prague = { item, getState: () => api.current?.getState() };
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
          <button type="button" className="btn gold xl">
            Cast the spell
          </button>
        </div>
      </div>
    </section>
  );
}
