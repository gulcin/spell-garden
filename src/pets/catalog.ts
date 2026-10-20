/** Friends Aida can buy with crystals, earn by visiting, or both. */

export type PetGroup = 'cats' | 'dogs' | 'creatures' | 'imaginary' | 'fairies';

export type EarnRule =
  | { kind: 'chapters'; count: number }
  | { kind: 'place'; placeId: string };

export type Pet = {
  id: string;
  name: string;
  group: PetGroup;
  blurb: string;
  /** Crystal price. Missing means she cannot buy this friend. */
  price: number | null;
  /** Milestone that brings the friend home. Missing means shop only. */
  earn: EarnRule | null;
};

export const PET_GROUPS: { id: PetGroup; label: string }[] = [
  { id: 'cats', label: 'Cats' },
  { id: 'dogs', label: 'Dogs' },
  { id: 'creatures', label: 'Creatures' },
  { id: 'imaginary', label: 'Imaginary' },
  { id: 'fairies', label: 'Fairies' },
];

export const PETS: Pet[] = [
  { id: 'cloud-cat', name: 'Cloud cat', group: 'cats', price: 8, earn: null, blurb: 'A cream long-hair who likes a sunny cushion.' },
  { id: 'ginger-tabby', name: 'Ginger tabby', group: 'cats', price: 10, earn: null, blurb: 'Orange stripes and a pink nose.' },
  { id: 'slate-cat', name: 'Slate cat', group: 'cats', price: 8, earn: null, blurb: 'Soft grey fur and pale green eyes.' },
  { id: 'midnight-cat', name: 'Midnight cat', group: 'cats', price: 12, earn: null, blurb: 'Black fur and calm gold eyes.' },
  { id: 'calico-cat', name: 'Calico cat', group: 'cats', price: 14, earn: null, blurb: 'Patches of cream, grey, and ginger.' },
  { id: 'garden-cat', name: 'Garden cat', group: 'cats', price: 12, earn: { kind: 'place', placeId: 'greenhouse' }, blurb: 'A tabby with a leaf tucked by her ear.' },

  { id: 'honey-spaniel', name: 'Honey spaniel', group: 'dogs', price: 10, earn: null, blurb: 'Long honey ears and a gentle face.' },
  { id: 'spot-terrier', name: 'Spot terrier', group: 'dogs', price: 8, earn: null, blurb: 'A small white terrier with brown spots.' },
  { id: 'moss-hound', name: 'Moss hound', group: 'dogs', price: 12, earn: null, blurb: 'A little hound in a moss-green collar.' },
  { id: 'star-collie', name: 'Star collie', group: 'dogs', price: 16, earn: null, blurb: 'A fluffy collie with a white star on her chest.' },
  { id: 'biscuit-pug', name: 'Biscuit pug', group: 'dogs', price: 10, earn: { kind: 'chapters', count: 1 }, blurb: 'A fawn pug with a curled tail.' },

  { id: 'clover-bunny', name: 'Clover bunny', group: 'creatures', price: 6, earn: null, blurb: 'A cream bunny with a clover on one ear.' },
  { id: 'thimble-hedgehog', name: 'Thimble hedgehog', group: 'creatures', price: 8, earn: null, blurb: 'A small hedgehog in a knitted scarf.' },
  { id: 'lantern-owl', name: 'Lantern owl', group: 'creatures', price: null, earn: { kind: 'place', placeId: 'observatory' }, blurb: 'A tawny owl who blinks slowly.' },
  { id: 'lily-frog', name: 'Lily frog', group: 'creatures', price: null, earn: { kind: 'place', placeId: 'lily-pond' }, blurb: 'A green frog sitting on a pink lily.' },
  { id: 'ember-fox', name: 'Ember fox cub', group: 'creatures', price: 16, earn: null, blurb: 'A small fox cub with a warm russet coat.' },
  { id: 'pebble-turtle', name: 'Pebble turtle', group: 'creatures', price: 8, earn: null, blurb: 'A turtle with a painted shell.' },
  { id: 'mango-parrot', name: 'Mango parrot', group: 'creatures', price: 12, earn: null, blurb: 'A green parrot with a mango-coloured chest.' },

  { id: 'baby-dragon', name: 'Baby dragon', group: 'imaginary', price: 20, earn: { kind: 'chapters', count: 3 }, blurb: 'A round lilac dragon, about as big as a loaf.' },
  { id: 'unicorn-foal', name: 'Unicorn foal', group: 'imaginary', price: 18, earn: null, blurb: 'A white foal with a pearly horn.' },
  { id: 'griffin-chick', name: 'Griffin chick', group: 'imaginary', price: 16, earn: null, blurb: 'A fluffy chick with a tiny lion tuft.' },
  { id: 'phoenix-chick', name: 'Phoenix chick', group: 'imaginary', price: null, earn: { kind: 'chapters', count: 4 }, blurb: 'A small gold chick with warm feathers.' },
  { id: 'moon-moth', name: 'Moon-moth', group: 'imaginary', price: 10, earn: null, blurb: 'A pale moth with moon spots on her wings.' },
  { id: 'star-whale', name: 'Star-whale', group: 'imaginary', price: 14, earn: null, blurb: 'A soft plush whale stitched with stars.' },
  { id: 'mushroom-sprite', name: 'Mushroom sprite', group: 'imaginary', price: null, earn: { kind: 'place', placeId: 'mushroom-ring' }, blurb: 'A tiny friend in a red cap.' },
  { id: 'prism-beetle', name: 'Prism beetle', group: 'imaginary', price: 12, earn: null, blurb: 'A little beetle with glass-bright wings.' },

  { id: 'dew-fairy', name: 'Dew fairy', group: 'fairies', price: null, earn: { kind: 'chapters', count: 1 }, blurb: 'A tiny fairy in a dewdrop dress.' },
  { id: 'lantern-fairy', name: 'Lantern fairy', group: 'fairies', price: null, earn: { kind: 'place', placeId: 'lantern-grove' }, blurb: 'A fairy who carries a small warm lantern.' },
  { id: 'pond-fairy', name: 'Pond fairy', group: 'fairies', price: null, earn: { kind: 'place', placeId: 'lily-pond' }, blurb: 'A fairy with lily-pad shoes.' },
  { id: 'moss-fairy', name: 'Moss fairy', group: 'fairies', price: null, earn: { kind: 'place', placeId: 'greenhouse' }, blurb: 'A fairy with a little moss in her hair.' },
  { id: 'star-fairy', name: 'Star fairy', group: 'fairies', price: null, earn: { kind: 'place', placeId: 'observatory' }, blurb: 'A fairy in a cape of little stars.' },
  { id: 'crystal-fairy', name: 'Crystal fairy', group: 'fairies', price: 18, earn: { kind: 'place', placeId: 'crystal-cave' }, blurb: 'A fairy holding one pale crystal.' },
];

const BY_ID = new Map(PETS.map((pet) => [pet.id, pet]));

const PLACE_LABEL: Record<string, string> = {
  'lantern-grove': 'lantern grove',
  'potion-cottage': 'potion cottage',
  'crystal-cave': 'crystal cave',
  observatory: 'observatory',
  'lily-pond': 'lily pond',
  greenhouse: 'greenhouse',
  'wizard-tower': 'wizard tower',
  'mushroom-ring': 'mushroom ring',
};

export function petById(id: string | null | undefined): Pet | undefined {
  if (!id) return undefined;
  return BY_ID.get(id);
}

export function petsIn(group: PetGroup): Pet[] {
  return PETS.filter((pet) => pet.group === group);
}

export function shopPets(): Pet[] {
  return PETS.filter((pet) => pet.price != null);
}

export function earnLine(pet: Pet): string {
  if (!pet.earn) return '';
  if (pet.earn.kind === 'chapters') {
    const count = pet.earn.count;
    return count === 1 ? 'They find you after 1 chapter.' : `They find you after ${count} chapters.`;
  }
  return `They find you at the ${PLACE_LABEL[pet.earn.placeId] ?? 'garden'}.`;
}

export type PetHow = 'bought' | 'earned';

export type PetRecord = {
  id: string;
  name: string;
  at: number;
  how: PetHow;
  /** Correct spells while this friend was the one walking beside her. */
  solved: number;
};

export type RestingPet = {
  id: string;
  x: number;
  y: number;
  flip: boolean;
};

export type PetState = {
  owned: PetRecord[];
  companionId: string | null;
  home: RestingPet[];
  /** Earned friends whose hello she has already seen. */
  seen: string[];
};

export function freshPets(): PetState {
  return { owned: [], companionId: null, home: [], seen: [] };
}
