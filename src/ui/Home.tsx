import { PLACES, Prop, REWARD_ART } from './pictures.tsx';
import type { Progress } from '../progress/types.ts';
import { REWARDS } from '../story.ts';
import { CrystalCounter } from './CrystalCounter.tsx';
import { DressedApprentice } from './DressedApprentice.tsx';

export function Home({
  progress,
  onStart,
  onShop,
  onGarden,
  onAbout,
  onParent,
  onRename,
}: {
  progress: Progress;
  onStart: () => void;
  onShop: () => void;
  onGarden: () => void;
  onAbout: () => void;
  onParent: () => void;
  onRename: (name: string) => void;
}) {
  const friends = REWARDS.filter((reward) => reward.kind === 'friend' && progress.rewards.includes(reward.id));
  const here = progress.sessions.length % PLACES.length;
  const base = import.meta.env.BASE_URL;
  return (
    <div className="home">
      <header className="hero">
        <DressedApprentice
          className="guide"
          alt="Aida, a young wizard with long straight hair, an owl, and a star wand"
        />
        <div className="hero-copy">
          <CrystalCounter count={progress.crystals} />
          <p className="kicker">A gentle wizard garden</p>
          <h1>{progress.learnerName}'s Spell Garden</h1>
          <p className="lede">Kind magic, grown slowly with maths. No hurry, no timers, no scary things.</p>
          <label className="name-edit">
            Her name
            <input
              value={progress.learnerName}
              data-testid="learner-name"
              onChange={(event) => onRename(event.target.value)}
              maxLength={24}
            />
          </label>
          {friends.length > 0 ? (
            <div className="friend-row" aria-label="Friends who have woken">
              {friends.map((friend) => (
                <Prop key={friend.id} name={REWARD_ART[friend.id] ?? 'star'} className="friend-prop" alt={friend.name} />
              ))}
            </div>
          ) : null}
        </div>
      </header>
      <section className="garden-map" aria-label="Garden map">
        <div className="map-head">
          <h2>The garden map</h2>
          <button type="button" className="text-link" data-testid="garden-link" onClick={onGarden}>
            Open the beds
          </button>
        </div>
        <div className="map-frame">
          <div className="map-stage">
            <picture>
              <source type="image/webp" srcSet={`${base}art/map.webp`} />
              <img
                className="map-art"
                src={`${base}art/map.jpg`}
                width={1280}
                height={720}
                alt="A watercolor map of Aida's garden, with glowing places and the crystal shop"
              />
            </picture>
            {PLACES.map((place, index) => {
              const state = index === here ? 'now' : index < progress.sessions.length ? 'visited' : 'ahead';
              return (
                <button
                  key={place.id}
                  type="button"
                  className={`hotspot hotspot-${state}${place.x > 80 ? ' hotspot-edge' : ''}`}
                  style={{ left: `${place.x}%`, top: `${place.y}%` }}
                  data-testid={state === 'now' ? 'map-stop-current' : 'map-stop'}
                  aria-current={state === 'now' ? 'step' : undefined}
                  onClick={state === 'now' ? onStart : undefined}
                >
                  <span>{place.name}</span>
                </button>
              );
            })}
            <button
              type="button"
              className="hotspot hotspot-shop"
              style={{ left: '50%', top: '78%' }}
              data-testid="map-shop"
              onClick={onShop}
            >
              <span>Crystal shop</span>
            </button>
          </div>
        </div>
      </section>
      <button type="button" className="btn gold xl start" data-testid="start" onClick={onStart}>
        {progress.placement.done ? "Begin today's chapter" : 'Wake the lanterns'}
      </button>
      <nav className="home-nav">
        <button type="button" data-testid="about-link" onClick={onAbout}>
          About
        </button>
        <button type="button" data-testid="parent-link" onClick={onParent}>
          Grown-ups
        </button>
      </nav>
    </div>
  );
}
