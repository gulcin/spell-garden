import { useEffect, useRef } from 'react';
import { Board, type BoardHandle } from '../activities/Board.tsx';
import { sampleItem } from '../activities/generate.ts';
import { TEMPLATE_LABEL, type TemplateId } from '../curriculum/classify.ts';
import { freshProgress } from '../progress/types.ts';
import { REWARDS } from '../story.ts';
import { About } from './About.tsx';
import { Garden } from './Garden.tsx';
import { GardenMapButton } from './GardenMapButton.tsx';
import { Home } from './Home.tsx';
import { Parent } from './Parent.tsx';
import { PLACES, placeStyle, Prop } from './pictures.tsx';
import { RewardScreen } from './Reward.tsx';

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
  const progress = freshProgress('Aida');
  const away = screen !== 'home';
  return (
    <main className={away ? 'app away' : 'app'}>
      {away ? <GardenMapButton onHome={() => undefined} /> : null}
      {screen === 'home' ? (
        <Home progress={progress} onStart={() => undefined} onGarden={() => undefined} onAbout={() => undefined} onParent={() => undefined} onRename={() => undefined} />
      ) : null}
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
        <Activity screen={screen} template={screen === 'example' ? 'fallback' : template} />
      ) : null}
    </main>
  );
}

function Intro({ place }: { place: string }) {
  return (
    <section className="quest place-scene" style={placeStyle(place)}>
      <header className="quest-top">
        <p className="kicker">The sleepy lanterns</p>
      </header>
      <div className="panel story">
        <Prop name="apprentice" className="guide guide-small" alt="" />
        <h2>A quiet beginning</h2>
        <p>Five tiny spells, Aida. They are not a test you can fail. They only show the garden where to open the gate.</p>
        <button type="button" className="btn gold xl">
          I'm ready
        </button>
      </div>
    </section>
  );
}

function Activity({ screen, template }: { screen: string; template: TemplateId }) {
  const item = sampleItem(template);
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
            <Prop name="apprentice" className="guide guide-small" alt="" />
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
        <Prop name="apprentice" className="play-guide" alt="" />
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
