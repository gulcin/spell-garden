import type { Goal, Item } from '../activities/types.ts';
import type { WardrobeState } from '../progress/types.ts';
import { itemById } from '../wardrobe/catalog.ts';

export type Adventure = {
  id: string;
  placeId: string;
  place: string;
  title: string;
  at: number;
  pages: string[];
  crystals: number;
  creature: string;
};

const PLACE_NAME: Record<string, string> = {
  'lantern-grove': 'lantern grove',
  'potion-cottage': 'potion cottage',
  'crystal-cave': 'crystal cave',
  observatory: 'observatory',
  'lily-pond': 'lily pond',
  greenhouse: 'greenhouse',
  'wizard-tower': 'wizard tower',
  'mushroom-ring': 'mushroom ring',
};

const PLACE_FRIEND: Record<string, string> = {
  'lantern-grove': 'Nim the moth',
  'potion-cottage': 'the warm kettle',
  'crystal-cave': 'the quiet crystals',
  observatory: 'the garden clock',
  'lily-pond': 'Pebble the frog',
  greenhouse: 'the little sprout',
  'wizard-tower': 'Teacup the owl',
  'mushroom-ring': 'Lumen the beetle',
};

const COUNT_NOUN: Record<string, [string, string]> = {
  'lantern-grove': ['lantern', 'lanterns'],
  'potion-cottage': ['cup', 'cups'],
  'crystal-cave': ['crystal', 'crystals'],
  observatory: ['star', 'stars'],
  'lily-pond': ['lily pad', 'lily pads'],
  greenhouse: ['sprout', 'sprouts'],
  'wizard-tower': ['book', 'books'],
  'mushroom-ring': ['mushroom cap', 'mushroom caps'],
};

/** Several openings per place, picked by the UTC day, so tomorrow's visit sounds different. */
const OPENINGS: Record<string, string[]> = {
  'lantern-grove': [
    '{name} stepped into the lantern grove and found every lantern asleep.',
    'A soft wind had blown the lantern grove dark, and {name} came to wake it.',
    'Fireflies hid in the lantern grove until {name} brought a little light back.',
  ],
  'potion-cottage': [
    '{name} found the potion cottage kettle cold and the cups still empty.',
    'The cottage chimney was quiet, so {name} came to warm the kettle.',
    'Petal tea would not pour until {name} counted the cups just right.',
  ],
  'crystal-cave': [
    '{name} ducked into the crystal cave and heard the gems whispering for help.',
    'The cave was dim, and {name} followed a faint spark inside.',
    'Loose crystals had rolled apart, so {name} came to share them fairly.',
  ],
  observatory: [
    '{name} climbed to the observatory and found the garden clock dozing.',
    'The dome was open, but the stars would not settle until {name} set the time.',
    'A night bird called, and {name} went up to count the stars.',
  ],
  'lily-pond': [
    '{name} reached the lily pond and saw the pads drifting apart.',
    'Pebble the frog could not cross, so {name} came to set the pads in a line.',
    'The moon sat on the water, and {name} counted the pads that held it.',
  ],
  greenhouse: [
    '{name} opened the greenhouse and found the sprouts asking for a drink.',
    'The glass was warm, but the little plants were waiting for {name}.',
    'A seedling had tipped over, and {name} came to set the rows straight.',
  ],
  'wizard-tower': [
    '{name} climbed the wizard tower and found the spell books in a heap.',
    'Teacup the owl blinked from the loft, waiting for {name} to open the right books.',
    'The tower window was foggy until {name} set the numbers in order.',
  ],
  'mushroom-ring': [
    '{name} tiptoed into the mushroom ring and found the caps dim.',
    'Lumen the beetle sat still, so {name} came to count the glowing caps.',
    'The ring had gone quiet, and {name} stepped in to wake it kindly.',
  ],
};

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function adventureDate(at: number): string {
  const date = new Date(at);
  const month = MONTHS[date.getUTCMonth()] ?? 'October';
  return `${date.getUTCDate()} ${month} ${date.getUTCFullYear()}`;
}

export function wordIndexAt(text: string, charIndex: number): number {
  const before = text.slice(0, Math.max(0, charIndex));
  return before.split(/\s+/).filter(Boolean).length;
}

function learner(name: string | null | undefined): string {
  const trimmed = name?.trim();
  return trimmed ? trimmed : 'Aida';
}

function dayIndex(at: number): number {
  return Math.floor(at / 86_400_000);
}

function noun(placeId: string, count: number): string {
  const pair = COUNT_NOUN[placeId] ?? ['treasure', 'treasures'];
  return count === 1 ? pair[0] : pair[1];
}

function countLine(placeId: string, count: number, name: string): string {
  const thing = `${count} ${noun(placeId, count)}`;
  switch (placeId) {
    case 'lantern-grove':
      return `${name} lit ${thing} to wake the sleeping path.`;
    case 'potion-cottage':
      return `${name} poured ${thing} so the kettle could sing.`;
    case 'crystal-cave':
      return `${name} gathered ${thing} to light the quiet cave.`;
    case 'observatory':
      return `${name} counted ${thing} so the night could see.`;
    case 'lily-pond':
      return `${name} set out ${thing} to make a bridge of leaves.`;
    case 'greenhouse':
      return `${name} grew ${thing} under the warm glass.`;
    case 'wizard-tower':
      return `${name} opened ${thing} in the sleepy loft.`;
    case 'mushroom-ring':
      return `${name} counted ${thing} until the ring glowed.`;
    default:
      return `${name} counted ${thing}, and the garden grew brighter.`;
  }
}

function mixLine(placeId: string, counts: Record<string, number>, name: string): string {
  const parts = Object.entries(counts).filter(([, count]) => count > 0);
  if (parts.length < 2) return countLine(placeId, sumCounts(counts), name);
  const listed =
    parts.length === 2
      ? `${parts[0][1]} ${parts[0][0]} and ${parts[1][1]} ${parts[1][0]}`
      : `${parts
          .slice(0, -1)
          .map(([group, count]) => `${count} ${group}`)
          .join(', ')} and ${parts[parts.length - 1]![1]} ${parts[parts.length - 1]![0]}`;
  const thing = noun(placeId, sumCounts(counts));
  if (placeId === 'lantern-grove') return `${name} lit ${listed} ${thing} to wake the path.`;
  if (placeId === 'potion-cottage') return `${name} poured ${listed} ${thing} so the kettle could sing.`;
  return `${name} gathered ${listed} ${thing} and set them in their places.`;
}

function shareNoun(placeId: string, count: number): string {
  if (placeId === 'crystal-cave') return count === 1 ? 'crystal' : 'crystals';
  if (placeId === 'potion-cottage') return count === 1 ? 'cup' : 'cups';
  if (placeId === 'lantern-grove') return count === 1 ? 'glow-berry' : 'glow-berries';
  return count === 1 ? 'gem' : 'gems';
}

export function clockPhrase(hour: number, minute: number): string {
  const h = ((hour - 1 + 12) % 12) + 1;
  if (minute === 0) return `${h} o'clock`;
  if (minute === 30) return `half past ${h}`;
  if (minute === 15) return `quarter past ${h}`;
  if (minute === 45) return `quarter to ${h === 12 ? 1 : h + 1}`;
  return `${minute} minutes past ${h}`;
}

function sumCounts(counts: Record<string, number>): number {
  return Object.values(counts).reduce((total, count) => total + count, 0);
}

function deedFromGoal(placeId: string, template: Item['template'], goal: Goal, name: string): string {
  if (template === 'ten-frame' && goal.kind === 'fill-count') return countLine(placeId, goal.count, name);
  if (template === 'ten-frame' && goal.kind === 'mix') return mixLine(placeId, goal.counts, name);
  if (template === 'sharing' && goal.kind === 'zone-counts') {
    const jars = Object.keys(goal.counts).filter((id) => id.startsWith('jar')).length;
    const shared = sumCounts(goal.counts);
    const jarCount = jars || Object.keys(goal.counts).length;
    return `To finish the sharing, ${name} shared ${shared} ${shareNoun(placeId, shared)} between ${jarCount} jars.`;
  }
  if (template === 'array' && goal.kind === 'array') {
    const count = goal.rows * goal.cols;
    return `${name} planted ${count} ${noun(placeId, count)} in ${goal.rows} rows of ${goal.cols}.`;
  }
  if (goal.kind === 'clock') return `${name} set the garden clock to ${clockPhrase(goal.hour, goal.minute)} so the stars would know the hour.`;
  if (goal.kind === 'angle') return `${name} turned her wand until it opened to ${goal.degrees} degrees.`;
  if (goal.kind === 'value') return `${name} built the number ${goal.total} with blocks.`;
  if (goal.kind === 'sum') return `${name} made the coins add up to ${goal.total}.`;
  if (goal.kind === 'shaded') return `${name} coloured ${goal.count} equal ${goal.count === 1 ? 'part' : 'parts'} of the picture.`;
  if (goal.kind === 'piece-at') return `${name} hopped to the lily the spell asked for.`;
  if (goal.kind === 'fill-count') return countLine(placeId, goal.count, name);
  if (template === 'measure') return `${name} laid the planks until the little bridge reached the star flag.`;
  if (template === 'shapes') return `${name} found the shapes the spell had named.`;
  if (template === 'symmetry') return `${name} finished the picture so both sides matched.`;
  if (template === 'pattern') return `${name} chose the tile that came next in the pattern.`;
  if (template === 'sort') return `${name} sorted each tile into its hoop.`;
  if (template === 'bar-model') return `${name} filled the empty part of the story bar.`;
  if (template === 'graph') return `${name} stacked the visitors in their own columns.`;
  if (template === 'coordinate') return `${name} set the starflower on its square.`;
  if (template === 'chance') return `${name} filled the pouch so the colours matched.`;
  if (template === 'balance') return `${name} levelled the two pans of the scale.`;
  if (template === 'coins') return `${name} paid the price with spark-coins.`;
  return `${name} finished a kind little spell, and the garden hummed.`;
}

export function deedLine(placeId: string, item: Pick<Item, 'template' | 'goal'>, name = 'Aida'): string {
  return deedFromGoal(placeId, item.template, item.goal, learner(name));
}

export function outfitPhrase(wardrobe: WardrobeState | null | undefined): string {
  const equipped = wardrobe?.equipped ?? {};
  const names = Object.values(equipped)
    .map((id) => (id ? itemById(id)?.name : undefined))
    .filter((entry): entry is string => Boolean(entry))
    .map((entry) => entry.toLowerCase());
  if (names.length === 0) return 'your lily hat and star cloak';
  if (names.length === 1) return `your ${names[0]}`;
  return `your ${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

function wornPhrase(wardrobe: WardrobeState | null | undefined): string {
  return outfitPhrase(wardrobe).replace(/^your /, 'her ');
}

export function visitIntro(
  placeId: string,
  wardrobe: WardrobeState | null | undefined,
  companion?: string | null,
  name = 'Aida',
  at = Date.UTC(2026, 9, 19),
): string {
  const who = learner(name);
  const openings = OPENINGS[placeId] ?? OPENINGS['lantern-grove']!;
  const problem = openings[dayIndex(at) % openings.length]!.replaceAll('{name}', who);
  const friend = companion?.trim() ? ` ${companion.trim()} came along.` : '';
  return `${problem} She wore ${wornPhrase(wardrobe)}.${friend}`;
}

function crystalSentence(placeId: string, crystals: number, name: string): string {
  const place = PLACE_NAME[placeId] ?? 'garden';
  if (crystals <= 0) return `${name} left the crystals glowing in the ${place}.`;
  if (crystals === 1) return `1 crystal settled in ${name}'s pocket.`;
  return `${crystals} crystals settled in ${name}'s pocket.`;
}

export function closingLines(input: {
  placeId: string;
  crystals: number;
  creature?: string | null;
  gift?: string | null;
  companion?: string | null;
  at: number;
  name?: string | null;
}): string[] {
  const place = PLACE_NAME[input.placeId] ?? 'garden';
  const friend = input.creature?.trim() || PLACE_FRIEND[input.placeId] || 'a quiet friend';
  const who = learner(input.name);
  const brought = input.gift ? ` She carried ${input.gift} home.` : '';
  const along = input.companion?.trim() ? ` ${input.companion.trim()} walked her to the gate.` : '';
  return [
    `${friend} stayed close, and the ${place} grew quiet and warm.`,
    `${crystalSentence(input.placeId, input.crystals, who)}${brought}${along} The garden kept ${adventureDate(input.at)} safe in its memory.`,
  ];
}

export function isAdventure(value: unknown): value is Adventure {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<Adventure>;
  return (
    typeof row.id === 'string' &&
    typeof row.placeId === 'string' &&
    typeof row.place === 'string' &&
    typeof row.title === 'string' &&
    typeof row.at === 'number' &&
    typeof row.crystals === 'number' &&
    typeof row.creature === 'string' &&
    Array.isArray(row.pages) &&
    row.pages.length > 0 &&
    row.pages.every((page) => typeof page === 'string')
  );
}

export function buildAdventure(input: {
  name: string;
  placeId: string;
  deeds: string[];
  crystals: number;
  wardrobe: WardrobeState | null | undefined;
  creature?: string | null;
  gift?: string | null;
  companion?: string | null;
  at: number;
}): Adventure {
  const place = PLACE_NAME[input.placeId] ?? 'garden';
  const friend = input.creature?.trim() || PLACE_FRIEND[input.placeId] || 'a quiet friend';
  const who = learner(input.name);
  const deeds = input.deeds.map((line) => line.trim()).filter(Boolean);
  const split = Math.max(1, Math.ceil(deeds.length / 2));
  const first = deeds.slice(0, split);
  const rest = deeds.slice(split);
  const work = first.length > 0 ? first.join(' ') : `${who} listened, and the ${place} listened back.`;
  const more = rest.join(' ');
  const ending = closingLines({ ...input, name: who });
  const pages = [
    visitIntro(input.placeId, input.wardrobe, input.companion, who, input.at),
    work,
    more || `${who} paused, and the ${place} glowed a little brighter.`,
    `${ending[0]} ${ending[1]}`,
  ];
  return {
    id: `adventure-${input.placeId}-${input.at}`,
    placeId: input.placeId,
    place: place.replace(/\b\w/g, (letter) => letter.toUpperCase()),
    title: "Today's adventure",
    at: input.at,
    pages,
    crystals: Math.max(0, input.crystals),
    creature: friend,
  };
}
