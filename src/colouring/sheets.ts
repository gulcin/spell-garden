export const SHEETS = [
  { id: 'cauldron', title: 'Bubbling cauldron', blurb: 'A pot of potions on the fire' },
  { id: 'hats', title: 'Witch hats', blurb: 'Pointed hats and a flower crown' },
  { id: 'brooms', title: 'Brooms', blurb: 'Twigs, blossoms, a star, and a moon' },
  { id: 'moons', title: 'Moons and stars', blurb: 'A crescent, a full moon, and a little sky' },
  { id: 'crystals', title: 'Crystal cave', blurb: 'Quiet gems beside a still pool' },
  { id: 'shelf', title: 'Potion shelf', blurb: 'Bottles in a row' },
  { id: 'familiars', title: 'Cat and owl', blurb: 'Two friends on a branch' },
  { id: 'apprentice', title: 'Flying apprentice', blurb: 'Aida, her owl, and a star wand' },
  { id: 'garden', title: 'Garden map', blurb: 'The whole garden, small enough to colour' },
  { id: 'mushrooms', title: 'Mushroom ring', blurb: 'A circle of caps, and a little beetle' },
  { id: 'nim', title: 'Nim the moth', blurb: 'Wide wings and a lantern' },
] as const;

export type SheetId = (typeof SHEETS)[number]['id'];

export function sheetById(id: string) {
  return SHEETS.find((sheet) => sheet.id === id) ?? null;
}
