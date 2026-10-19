import { PLACES, Prop, REWARD_ART } from './pictures.tsx';
import type { Progress } from '../progress/types.ts';
import { companionTitle } from '../pets/state.ts';
import { REWARDS } from '../story.ts';
import { CrystalCounter } from './CrystalCounter.tsx';
import { DressedApprentice } from './DressedApprentice.tsx';
import { PetArt } from './PetShop.tsx';

export function Home({
  progress,
  onStart,
  onVisit,
  onShop,
  onPets,
  onHouse,
  onColour,
  onStories,
  onGarden,
  onAbout,
  onParent,
  onRename,
}: {
  progress: Progress;
  onStart: () => void;
  onVisit: (placeId: string) => void;
  onShop: () => void;
  onPets: () => void;
  onHouse: () => void;
  onColour: () => void;
  onStories: () => void;
  onGarden: () => void;
  onAbout: () => void;
  onParent: () => void;
  onRename: (name: string) => void;
}) {
  const friends = REWARDS.filter((reward) => reward.kind === 'friend' && progress.rewards.includes(reward.id));
  const here = progress.sessions.length % PLACES.length;
  const herePlace = PLACES[here]!;
  const companion = companionTitle(progress.pets);
  const companionId = progress.pets.companionId;
  const base = import.meta.env.BASE_URL;
  return (
    <div className="home">
      <header className="hero">
        <div className="guide-wrap">
          <DressedApprentice
            className="guide"
            alt="Aida, a young wizard with long straight hair, an owl, and a star wand"
          />
          {companion && companionId ? <PetArt id={companionId} className="hero-pet" alt={companion} /> : null}
        </div>
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
              const visited = progress.visitedPlaces.includes(place.id);
              const state = index === here ? 'now' : visited ? 'visited' : 'open';
              const edge = place.x > 80 ? ' hotspot-edge' : '';
              const low = place.y >= 62 && place.x <= 80 ? ' hotspot-low' : '';
              return (
                <button
                  key={place.id}
                  type="button"
                  className={`hotspot hotspot-${state}${visited ? ' has-star' : ''}${edge}${low}`}
                  style={{ left: `${place.x}%`, top: `${place.y}%` }}
                  data-testid={index === here ? 'map-stop-current' : `map-stop-${place.id}`}
                  aria-current={index === here ? 'step' : undefined}
                  aria-label={place.name}
                  onClick={() => onVisit(place.id)}
                >
                  <span className="label-full">{place.name}</span>
                  <span className="label-short">{place.short}</span>
                </button>
              );
            })}
            <button
              type="button"
              className={`hotspot hotspot-shop hotspot-right${progress.visitedPlaces.includes('crystal-shop') ? ' has-star' : ''}`}
              style={{ left: '50%', top: '76%' }}
              data-testid="map-shop"
              onClick={onShop}
            >
              <span className="label-full">Crystal shop</span>
              <span className="label-short">Shop</span>
            </button>
            <button
              type="button"
              className={`hotspot hotspot-house hotspot-right${progress.visitedPlaces.includes('witch-house') ? ' has-star' : ''}`}
              style={{ left: '27%', top: '42%' }}
              data-testid="map-house"
              aria-label="Witch's house"
              onClick={onHouse}
            >
              <span className="label-full">Witch's house</span>
              <span className="label-short">House</span>
            </button>
            <button
              type="button"
              className={`hotspot hotspot-colour${progress.visitedPlaces.includes('colouring-nook') ? ' has-star' : ''}`}
              style={{ left: '58%', top: '14%' }}
              data-testid="map-colour"
              aria-label="Colouring corner"
              onClick={onColour}
            >
              <span className="label-full">Colouring</span>
              <span className="label-short">Colour</span>
            </button>
            <button
              type="button"
              className={`hotspot hotspot-pets hotspot-edge${progress.visitedPlaces.includes('pet-shop') ? ' has-star' : ''}`}
              style={{ left: '90%', top: '82%' }}
              data-testid="map-pets"
              aria-label="Pet shop"
              onClick={onPets}
            >
              <span className="label-full">Pet shop</span>
              <span className="label-short">Pets</span>
            </button>
            {companion && companionId ? (
              <span
                className="map-companion"
                data-testid="map-companion"
                style={{ left: `${Math.min(84, herePlace.x + 8)}%`, top: `${Math.max(10, herePlace.y - 10)}%` }}
              >
                <PetArt id={companionId} alt="" />
              </span>
            ) : null}
          </div>
        </div>
      </section>
      <button type="button" className="btn gold xl start" data-testid="start" onClick={onStart}>
        {progress.placement.done ? "Begin today's chapter" : 'Wake the lanterns'}
      </button>
      <nav className="home-nav">
        <button type="button" data-testid="story-shelf-link" onClick={onStories}>
          Story shelf
        </button>
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
