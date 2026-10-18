const PICTURES = [
  { id: 'cauldron', title: 'Bubbling cauldron', blurb: 'A pot of potions on the fire', kind: 'picture' },
  { id: 'hats', title: 'Witch hats', blurb: 'Pointed hats and a flower crown', kind: 'picture' },
  { id: 'brooms', title: 'Brooms', blurb: 'Twigs, blossoms, a star, and a moon', kind: 'picture' },
  { id: 'moons', title: 'Moons and stars', blurb: 'A crescent, a full moon, and a little sky', kind: 'picture' },
  { id: 'crystals', title: 'Crystal cave', blurb: 'Quiet gems beside a still pool', kind: 'picture' },
  { id: 'shelf', title: 'Potion shelf', blurb: 'Bottles in a row', kind: 'picture' },
  { id: 'familiars', title: 'Cat and owl', blurb: 'Two friends on a branch', kind: 'picture' },
  { id: 'apprentice', title: 'Flying apprentice', blurb: 'Aida, her owl, and a star wand', kind: 'picture' },
  { id: 'garden', title: 'Garden map', blurb: 'The whole garden, small enough to colour', kind: 'picture' },
  { id: 'mushrooms', title: 'Mushroom ring', blurb: 'A circle of caps, and a little beetle', kind: 'picture' },
  { id: 'nim', title: 'Nim the moth', blurb: 'Wide wings and a lantern', kind: 'picture' },
] as const;

const BLANKS = [
  { id: 'blank-1', title: 'A blank page', blurb: 'Cream paper, for your own picture', kind: 'blank' },
  { id: 'blank-2', title: 'Another blank page', blurb: 'Cream paper, for your own picture', kind: 'blank' },
  { id: 'blank-3', title: 'A third page', blurb: 'Cream paper, for your own picture', kind: 'blank' },
  { id: 'blank-4', title: 'A fourth page', blurb: 'Cream paper, for your own picture', kind: 'blank' },
  { id: 'blank-5', title: 'A fifth page', blurb: 'Cream paper, for your own picture', kind: 'blank' },
] as const;

export const SHEETS = [...PICTURES, ...BLANKS] as const;

export type SheetId = (typeof SHEETS)[number]['id'];

export function sheetById(id: string) {
  return SHEETS.find((sheet) => sheet.id === id) ?? null;
}
