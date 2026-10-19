import { useLayoutEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  PET_GROUPS,
  earnLine,
  petsIn,
  type Pet,
  type PetGroup,
} from '../pets/catalog.ts';
import { buyPet, draftRename, markSeen, ownedPet, renamePet, setCompanion, unseenArrivals } from '../pets/state.ts';
import type { Progress } from '../progress/types.ts';
import { CrystalCounter } from './CrystalCounter.tsx';
import { placeStyle } from './pictures.tsx';

function shelfPageSize(): number {
  if (typeof window === 'undefined') return 8;
  if (window.innerWidth < 700) return 4;
  if (window.innerHeight > window.innerWidth) return 6;
  return 8;
}

function offerLine(pet: Pet): string {
  const earned = earnLine(pet).replace(/^They find you /, 'Found ');
  if (pet.price != null && earned) return `${pet.price} crystals, or ${earned.charAt(0).toLowerCase()}${earned.slice(1)}`;
  if (pet.price != null) return `${pet.price} crystals`;
  return earned;
}

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
  const [group, setGroup] = useState<PetGroup>('cats');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(shelfPageSize);
  const [cheer, setCheer] = useState<string | null>(null);
  const base = import.meta.env.BASE_URL;
  const shelf = petsIn(group);
  const pageCount = Math.max(1, Math.ceil(shelf.length / pageSize));
  const pageIndex = Math.min(page, pageCount - 1);
  const visible = shelf.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize);

  useLayoutEffect(() => {
    const apply = () => {
      const next = shelfPageSize();
      flushSync(() => setPageSize(next));
    };
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, []);

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
          <CrystalCounter count={progress.crystals} />
        </div>
      </header>
      <div className="shopkeeper-row">
        <img className="shopkeeper" src={`${base}art/cast/poppy.webp`} srcSet={`${base}art/cast/poppy.webp 1x, ${base}art/cast/poppy@2x.webp 2x`} alt="Poppy, a cream bunny in an apron" />
        <p data-testid={cheer ? 'pet-cheer' : undefined}>{cheer ?? 'I am Poppy. Pick a shelf. Buy a friend with crystals, or wait for one to find you.'}</p>
      </div>
      <div className="pet-tabs" role="tablist" aria-label="Friend shelves">
        {PET_GROUPS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={group === entry.id}
            className={group === entry.id ? 'on' : ''}
            data-testid={`pet-group-${entry.id}`}
            onClick={() => {
              setGroup(entry.id);
              setPage(0);
            }}
          >
            {entry.label}
          </button>
        ))}
      </div>
      <div className="shop-grid" data-testid="pet-shelf-grid">
        {visible.map((pet) => {
          const owned = ownedPet(progress.pets, pet.id);
          const walking = progress.pets.companionId === pet.id;
          return (
            <article key={pet.id} className="shop-card" data-testid={`pet-${pet.id}`} data-group={pet.group}>
              <PetArt id={pet.id} alt="" secret={!owned && pet.price == null} />
              <h2>{owned?.name.trim() ? owned.name : pet.name}</h2>
              <p>{offerLine(pet)}</p>
              {owned ? (
                <>
                  <label className="pet-name">
                    <input
                      value={owned.name}
                      maxLength={16}
                      aria-label={`Name for ${pet.name}`}
                      data-testid={`pet-name-${pet.id}`}
                      onChange={(event) => update((current) => ({ ...current, pets: draftRename(current.pets, pet.id, event.target.value) }))}
                      onBlur={(event) => update((current) => ({ ...current, pets: renamePet(current.pets, pet.id, event.target.value) }))}
                    />
                  </label>
                  <button
                    type="button"
                    className={walking ? 'btn gold' : 'btn'}
                    data-testid={`walk-pet-${pet.id}`}
                    onClick={() => update((current) => ({ ...current, pets: setCompanion(current.pets, pet.id) }))}
                  >
                    {walking ? 'Walking' : 'Owned'}
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
              ) : null}
            </article>
          );
        })}
      </div>
      {pageCount > 1 ? (
        <div className="spell-pager shop-pager">
          <button type="button" data-testid="pet-prev" disabled={pageIndex === 0} onClick={() => setPage(pageIndex - 1)}>
            Back
          </button>
          <button type="button" data-testid="pet-next" disabled={pageIndex >= pageCount - 1} onClick={() => setPage(pageIndex + 1)}>
            Next
          </button>
        </div>
      ) : null}
    </section>
  );
}
