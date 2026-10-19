import type { HouseState } from '../house/layout.ts';
import type { Progress } from '../progress/types.ts';
import { spendCrystals } from '../wardrobe/economy.ts';
import {
  PETS,
  freshPets,
  petById,
  type Pet,
  type PetHow,
  type PetRecord,
  type PetState,
  type RestingPet,
} from './catalog.ts';

const PERCHES = ['cat-bed', 'quilt-bed', 'floor-cushion', 'rose-armchair'];

export function cleanPetName(value: string, fallback: string): string {
  const cleaned = value.replace(/[^a-zA-Z' -]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16);
  return cleaned || fallback;
}

export function normalizePets(value: unknown): PetState {
  if (!value || typeof value !== 'object') return freshPets();
  const raw = value as Partial<PetState>;
  const owned: PetRecord[] = [];
  const seenIds = new Set<string>();
  if (Array.isArray(raw.owned)) {
    for (const row of raw.owned) {
      if (!row || typeof row !== 'object') continue;
      const id = (row as Partial<PetRecord>).id;
      const pet = typeof id === 'string' ? petById(id) : undefined;
      if (!pet || seenIds.has(pet.id)) continue;
      seenIds.add(pet.id);
      const how: PetHow = (row as Partial<PetRecord>).how === 'earned' ? 'earned' : 'bought';
      const at = (row as Partial<PetRecord>).at;
      owned.push({
        id: pet.id,
        name: cleanPetName(typeof (row as Partial<PetRecord>).name === 'string' ? (row as PetRecord).name : '', pet.name),
        at: typeof at === 'number' && Number.isFinite(at) ? at : 0,
        how,
      });
    }
  }
  const companionId = typeof raw.companionId === 'string' && seenIds.has(raw.companionId) ? raw.companionId : null;
  const home: RestingPet[] = [];
  const resting = new Set<string>();
  if (Array.isArray(raw.home)) {
    for (const row of raw.home) {
      if (!row || typeof row !== 'object') continue;
      const id = (row as Partial<RestingPet>).id;
      if (typeof id !== 'string' || !seenIds.has(id) || resting.has(id)) continue;
      resting.add(id);
      const x = (row as Partial<RestingPet>).x;
      const y = (row as Partial<RestingPet>).y;
      home.push({
        id,
        x: typeof x === 'number' && Number.isFinite(x) ? Math.min(88, Math.max(12, x)) : 50,
        y: typeof y === 'number' && Number.isFinite(y) ? Math.min(90, Math.max(64, y)) : 78,
        flip: Boolean((row as Partial<RestingPet>).flip),
      });
    }
  }
  const seen = Array.isArray(raw.seen)
    ? raw.seen.filter((id): id is string => typeof id === 'string' && seenIds.has(id))
    : [];
  return { owned, companionId, home, seen };
}

export function endedChapters(progress: Pick<Progress, 'sessions'>): number {
  return progress.sessions.filter((session) => session.endedAt != null || session.rewardId != null).length;
}

export function earnMet(pet: Pet, progress: Pick<Progress, 'sessions' | 'visitedPlaces'>): boolean {
  if (!pet.earn) return false;
  if (pet.earn.kind === 'chapters') return endedChapters(progress) >= pet.earn.count;
  return progress.visitedPlaces.includes(pet.earn.placeId);
}

/** Adds friends whose milestone is already met. Bought friends stay as they are. */
export function grantEarned(pets: PetState, progress: Pick<Progress, 'sessions' | 'visitedPlaces'>, at = Date.now()): PetState {
  const have = new Set(pets.owned.map((pet) => pet.id));
  const arriving = PETS.filter((pet) => pet.earn && !have.has(pet.id) && earnMet(pet, progress));
  if (arriving.length === 0) return pets;
  return {
    ...pets,
    owned: [
      ...pets.owned,
      ...arriving.map((pet) => ({ id: pet.id, name: pet.name, at, how: 'earned' as const })),
    ],
  };
}

export function grantProgress(progress: Progress, at = Date.now()): Progress {
  const pets = grantEarned(progress.pets, progress, at);
  return pets === progress.pets ? progress : { ...progress, pets };
}

export function buyPet(progress: Progress, id: string, at = Date.now()): Progress {
  const pet = petById(id);
  if (!pet || pet.price == null || progress.pets.owned.some((owned) => owned.id === id)) return progress;
  const spent = spendCrystals(progress, pet.price);
  if (!spent) return progress;
  const owned = [...spent.pets.owned, { id: pet.id, name: pet.name, at, how: 'bought' as const }];
  return {
    ...spent,
    pets: {
      ...spent.pets,
      owned,
      companionId: spent.pets.companionId ?? pet.id,
    },
  };
}

/** Keeps a half-typed name, including a blank box, until she leaves the field. */
export function draftPetName(value: string): string {
  return value.replace(/[^a-zA-Z' -]/g, '').slice(0, 16);
}

export function renamePet(pets: PetState, id: string, name: string): PetState {
  const pet = petById(id);
  if (!pet) return pets;
  return {
    ...pets,
    owned: pets.owned.map((owned) => (owned.id === id ? { ...owned, name: cleanPetName(name, pet.name) } : owned)),
  };
}

export function draftRename(pets: PetState, id: string, name: string): PetState {
  if (!petById(id)) return pets;
  const draft = draftPetName(name);
  return {
    ...pets,
    owned: pets.owned.map((owned) => (owned.id === id ? { ...owned, name: draft } : owned)),
  };
}

export function setCompanion(pets: PetState, id: string | null): PetState {
  if (id == null) return pets.companionId == null ? pets : { ...pets, companionId: null };
  if (!pets.owned.some((owned) => owned.id === id) || pets.companionId === id) return pets;
  return { ...pets, companionId: id };
}

export function markSeen(pets: PetState, ids: string[]): PetState {
  const have = new Set(pets.owned.map((pet) => pet.id));
  const seen = new Set(pets.seen);
  for (const id of ids) if (have.has(id)) seen.add(id);
  if (seen.size === pets.seen.length) return pets;
  return { ...pets, seen: [...seen] };
}

export function unseenArrivals(pets: PetState): Pet[] {
  return pets.owned
    .filter((owned) => owned.how === 'earned' && !pets.seen.includes(owned.id))
    .map((owned) => petById(owned.id))
    .filter((pet): pet is Pet => Boolean(pet));
}

export function ownedPet(pets: PetState, id: string): PetRecord | undefined {
  return pets.owned.find((pet) => pet.id === id);
}

/** "Pip the cloud cat" when she has chosen a name, otherwise the kind of friend. */
export function companionTitle(pets: PetState): string | null {
  if (!pets.companionId) return null;
  const pet = petById(pets.companionId);
  const owned = ownedPet(pets, pets.companionId);
  if (!pet || !owned) return null;
  if (!owned.name.trim() || owned.name.trim().toLowerCase() === pet.name.toLowerCase()) return pet.name;
  return `${owned.name.trim()} the ${pet.name.toLowerCase()}`;
}

export function companionPhrase(pets: PetState | null | undefined): string {
  const title = pets ? companionTitle(pets) : null;
  return title ? ` ${title} came along.` : '';
}

/** Start index for the two-chip rest tray. A stale page never lands past the friends still waiting. */
export function restTrayStart(page: number, waiting: number): number {
  if (waiting <= 2) return 0;
  const start = Number.isFinite(page) ? Math.floor(page) : 0;
  return Math.min(Math.max(0, start), waiting - 2);
}

/** Floor spots keep going onto a lower row, so a fourth friend never stands on the first. */
function floorSpot(taken: Set<string>): { x: number; y: number } {
  for (let row = 0; row < 8; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      const spot = { x: 78 - column * 18, y: Math.min(90, 70 + row * 8) };
      if (!taken.has(`${spot.x}:${spot.y}`)) return spot;
    }
  }
  return { x: 18, y: 90 };
}

export function restPet(pets: PetState, house: HouseState, id: string): PetState {
  if (!pets.owned.some((pet) => pet.id === id) || pets.home.some((pet) => pet.id === id)) return pets;
  const taken = new Set(pets.home.map((pet) => `${Math.round(pet.x)}:${Math.round(pet.y)}`));
  const perch = house.placed.find((piece) => {
    if (!PERCHES.includes(piece.itemId)) return false;
    const y = Math.min(90, Math.max(64, piece.y - 8));
    return !taken.has(`${Math.round(piece.x)}:${Math.round(y)}`);
  });
  const spot = perch ? { x: perch.x, y: Math.min(90, Math.max(64, perch.y - 8)) } : floorSpot(taken);
  return { ...pets, home: [...pets.home, { id, x: spot.x, y: spot.y, flip: false }] };
}

export function callHome(pets: PetState, id: string): PetState {
  if (!pets.home.some((pet) => pet.id === id)) return pets;
  return { ...pets, home: pets.home.filter((pet) => pet.id !== id) };
}
