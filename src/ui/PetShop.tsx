import { useState } from 'react';
import {
  PET_GROUPS,
  earnLine,
  petsIn,
  shopPets,
  type Pet,
  type PetGroup,
} from '../pets/catalog.ts';
import { buyPet, draftRename, markSeen, ownedPet, renamePet, setCompanion, unseenArrivals } from '../pets/state.ts';
import type { Progress } from '../progress/types.ts';
import { CrystalCounter } from './CrystalCounter.tsx';
import { placeStyle } from './pictures.tsx';

const PAGE = 2;

export function PetArt({
  id,
  className,
  alt = '',
  secret = false,
}: {
  id: string;
  className?: string;
  alt?: string;
  secret?: boolean;
}) {
  const base = `${import.meta.env.BASE_URL}art/pets/${id}`;
  return (
    <img
      className={secret ? `pet-secret ${className ?? ''}`.trim() : className}
      src={`${base}.webp`}
      srcSet={`${base}.webp 1x, ${base}@2x.webp 2x`}
      alt={alt}
      draggable={false}
    />
  );
}

export function PetReveal({
  progress,
  update,
  onBook,
}: {
  progress: Progress;
  update: (recipe: (current: Progress) => Progress) => void;
  onBook: () => void;
}) {
  const waiting = unseenArrivals(progress.pets);
  const pet = waiting[0];
  if (!pet) return null;
  const owned = ownedPet(progress.pets, pet.id);
  function greet() {
    update((current) => ({ ...current, pets: markSeen(current.pets, [pet.id]) }));
  }
  function rest() {
    update((current) => ({ ...current, pets: markSeen(current.pets, waiting.map((friend) => friend.id)) }));
    onBook();
  }
  return (
    <div className="pet-reveal" role="dialog" aria-modal="true" aria-label={`${pet.name} found you`} data-testid="pet-reveal">
      <article>
        <p className="kicker">{pet.group === 'fairies' ? 'A fairy found you' : 'A friend found you'}</p>
        <PetArt id={pet.id} alt="" />
        <h2>{owned?.name ?? pet.name}</h2>
        <p>{pet.blurb}</p>
        <button type="button" className="btn gold xl" data-testid="pet-hello" onClick={greet}>
          Hello, {owned?.name ?? pet.name}
        </button>
        {waiting.length > 1 ? (
          <button type="button" className="btn quiet" data-testid="pet-later" onClick={rest}>
            I'll meet the others in the book
          </button>
        ) : null}
      </article>
    </div>
  );
}

export function PetShop({
  progress,
  update,
}: {
  progress: Progress;
  update: (recipe: (current: Progress) => Progress) => void;
}) {
  const [book, setBook] = useState(false);
  const [group, setGroup] = useState<PetGroup>('cats');
  const [page, setPage] = useState(0);
  const [cheer, setCheer] = useState<string | null>(null);
  const base = import.meta.env.BASE_URL;
  const shelf = book ? petsIn(group) : shopPets();
  const pageSize = book ? 1 : PAGE;
  const pageCount = Math.max(1, Math.ceil(shelf.length / pageSize));
  const pageIndex = Math.min(page, pageCount - 1);
  const visible = shelf.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize);
  const groupIndex = PET_GROUPS.findIndex((entry) => entry.id === group);

  function showGroup(next: number) {
    const entry = PET_GROUPS[(next + PET_GROUPS.length) % PET_GROUPS.length];
    if (!entry) return;
    setGroup(entry.id);
    setPage(0);
  }

  function buy(pet: Pet) {
    let bought = false;
    update((current) => {
      const next = buyPet(current, pet.id);
      bought = next !== current;
      return next;
    });
    setCheer(bought ? `${pet.name} is yours.` : `You need ${pet.price ?? 0} crystals for ${pet.name}.`);
  }

  return (
    <section className="shop place-scene pet-shop" style={placeStyle('pet-shop')} data-testid="pet-shop">
      <header className="shop-top">
        <div>
          <p className="kicker">Pet shop</p>
          <h1>Poppy's friends</h1>
        </div>
        <div className="shop-tools">
          <button type="button" className={book ? 'btn' : 'btn gold'} data-testid="pet-shelf" onClick={() => { setBook(false); setPage(0); }}>
            Shop
          </button>
          <button type="button" className={book ? 'btn gold' : 'btn'} data-testid="pet-book" aria-label="Collection book" onClick={() => { setBook(true); setPage(0); }}>
            Book
          </button>
          <CrystalCounter count={progress.crystals} />
        </div>
      </header>
      <div className="shopkeeper-row">
        <img className="shopkeeper" src={`${base}art/cast/poppy.webp`} srcSet={`${base}art/cast/poppy.webp 1x, ${base}art/cast/poppy@2x.webp 2x`} alt="Poppy, a cream bunny in an apron" />
        <p>I am Poppy. Most friends can be bought with crystals. A few find you when you have been out in the garden.</p>
      </div>
      {cheer ? (
        <p className="note good shop-cheer" role="status" data-testid="pet-cheer">
          {cheer}
        </p>
      ) : null}
      {book ? (
        <div className="pet-tabs">
          <button type="button" data-testid="pet-group-prev" onClick={() => showGroup(groupIndex - 1)} aria-label="Previous group">
            ‹
          </button>
          <h2 data-testid="pet-group-name">{PET_GROUPS[groupIndex]?.label}</h2>
          <button type="button" data-testid="pet-group-next" onClick={() => showGroup(groupIndex + 1)} aria-label="Next group">
            ›
          </button>
        </div>
      ) : null}
      <div className="shop-grid" data-testid={book ? 'pet-collection' : 'pet-shelf-grid'}>
        {visible.map((pet) => {
          const owned = ownedPet(progress.pets, pet.id);
          const walking = progress.pets.companionId === pet.id;
          return (
            <article key={pet.id} className="shop-card" data-testid={`pet-${pet.id}`} data-group={pet.group}>
              <PetArt id={pet.id} alt="" secret={book && !owned} />
              <h2>{owned?.name.trim() ? owned.name : pet.name}</h2>
              <p>{owned ? pet.blurb : pet.price != null && pet.earn ? `${pet.price} crystals, or they find you. ${earnLine(pet)}` : pet.price != null ? `${pet.price} crystals` : earnLine(pet)}</p>
              {owned ? (
                <>
                  {book ? (
                    <label className="pet-name">
                      Name
                      <input
                        value={owned.name}
                        maxLength={16}
                        data-testid={`pet-name-${pet.id}`}
                        onChange={(event) => update((current) => ({ ...current, pets: draftRename(current.pets, pet.id, event.target.value) }))}
                        onBlur={(event) => update((current) => ({ ...current, pets: renamePet(current.pets, pet.id, event.target.value) }))}
                      />
                    </label>
                  ) : (
                    <span>Yours</span>
                  )}
                  <button
                    type="button"
                    className={walking ? 'btn gold' : 'btn'}
                    data-testid={`walk-pet-${pet.id}`}
                    onClick={() => update((current) => ({ ...current, pets: setCompanion(current.pets, pet.id) }))}
                  >
                    {walking ? 'Walking with you' : 'Walk with me'}
                  </button>
                </>
              ) : pet.price != null ? (
                <button
                  type="button"
                  className="btn gold"
                  data-testid={`buy-pet-${pet.id}`}
                  disabled={progress.crystals < pet.price}
                  onClick={() => buy(pet)}
                >
                  {progress.crystals < pet.price ? `Need ${pet.price}` : `Buy · ${pet.price}`}
                </button>
              ) : (
                <span className="pet-wait">Not in the shop yet</span>
              )}
            </article>
          );
        })}
      </div>
      <div className="spell-pager shop-pager">
        <button type="button" data-testid="pet-prev" disabled={pageIndex === 0} onClick={() => setPage(pageIndex - 1)}>
          Back
        </button>
        <button type="button" data-testid="pet-next" disabled={pageIndex >= pageCount - 1} onClick={() => setPage(pageIndex + 1)}>
          Next
        </button>
      </div>
    </section>
  );
}
