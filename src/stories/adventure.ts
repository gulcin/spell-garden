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

const COUNT_VERB: Record<string, string> = {
  'lantern-grove': 'lit',
  'potion-cottage': 'poured',
  'crystal-cave': 'gathered',
  observatory: 'counted',
  'lily-pond': 'set out',
  greenhouse: 'grew',
  'wizard-tower': 'opened',
  'mushroom-ring': 'counted',
};

function noun(placeId: string, count: number): string {
  const pair = COUNT_NOUN[placeId] ?? ['treasure', 'treasures'];
  return count === 1 ? pair[0] : pair[1];
}

function countLine(placeId: string, count: number): string {
  const verb = COUNT_VERB[placeId] ?? 'counted';
  return `You ${verb} ${count} ${noun(placeId, count)}.`;
}

function mixLine(placeId: string, counts: Record<string, number>): string {
  const parts = Object.entries(counts).filter(([, count]) => count > 0);
  if (parts.length < 2) return countLine(placeId, sumCounts(counts));
  const verb = COUNT_VERB[placeId] ?? 'counted';
  const listed =
    parts.length === 2
      ? `${parts[0][1]} ${parts[0][0]} and ${parts[1][1]} ${parts[1][0]}`
      : `${parts
          .slice(0, -1)
          .map(([group, count]) => `${count} ${group}`)
          .join(', ')} and ${parts[parts.length - 1]![1]} ${parts[parts.length - 1]![0]}`;
  return `You ${verb} ${listed} ${noun(placeId, sumCounts(counts))}.`;
}

function shareNoun(placeId: string, count: number): string {
  if (placeId === 'crystal-cave') return count === 1 ? 'crystal' : 'crystals';
  if (placeId === 'potion-cottage') return count === 1 ? 'cup' : 'cups';
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

function deedFromGoal(placeId: string, template: Item['template'], goal: Goal): string {
  if (template === 'ten-frame' && goal.kind === 'fill-count') {
    return countLine(placeId, goal.count);
  }
  if (template === 'ten-frame' && goal.kind === 'mix') {
    return mixLine(placeId, goal.counts);
  }
  if (template === 'sharing' && goal.kind === 'zone-counts') {
    const jars = Object.keys(goal.counts).filter((id) => id.startsWith('jar')).length;
    const shared = sumCounts(goal.counts);
    const jarCount = jars || Object.keys(goal.counts).length;
    return `You shared ${shared} ${shareNoun(placeId, shared)} between ${jarCount} jars.`;
  }
  if (template === 'array' && goal.kind === 'array') {
    const count = goal.rows * goal.cols;
    return `You planted ${count} ${noun(placeId, count)} in ${goal.rows} rows of ${goal.cols}.`;
  }
  if (goal.kind === 'clock') return `You set the garden clock to ${clockPhrase(goal.hour, goal.minute)}.`;
  if (goal.kind === 'angle') return `You turned your wand to ${goal.degrees} degrees.`;
  if (goal.kind === 'value') return `You built the number ${goal.total} with blocks.`;
  if (goal.kind === 'sum') return `You made the coins add up to ${goal.total}.`;
  if (goal.kind === 'shaded') return `You coloured ${goal.count} equal ${goal.count === 1 ? 'part' : 'parts'}.`;
  if (goal.kind === 'piece-at') return 'You hopped to the lily the spell asked for.';
  if (goal.kind === 'fill-count') return countLine(placeId, goal.count);
  if (template === 'measure') return 'You laid the planks until the length was right.';
  if (template === 'shapes') return 'You found the shapes the spell named.';
  if (template === 'symmetry') return 'You finished the picture so both sides matched.';
  if (template === 'pattern') return 'You chose the tile that came next.';
  if (template === 'sort') return 'You sorted each tile into its hoop.';
  if (template === 'bar-model') return 'You filled the empty part of the story bar.';
  if (template === 'graph') return 'You stacked the visitors in their columns.';
  if (template === 'coordinate') return 'You set the starflower on its square.';
  if (template === 'chance') return 'You filled the pouch so the colours matched.';
  if (template === 'balance') return 'You levelled the two pans.';
  if (template === 'coins') return 'You paid the price with spark-coins.';
  return 'You finished a kind little spell.';
}

export function deedLine(placeId: string, item: Pick<Item, 'template' | 'goal'>): string {
  return deedFromGoal(placeId, item.template, item.goal);
}

export function outfitPhrase(wardrobe: WardrobeState | null | undefined): string {
  const equipped = wardrobe?.equipped ?? {};
  const names = Object.values(equipped)
    .map((id) => (id ? itemById(id)?.name : undefined))
    .filter((name): name is string => Boolean(name))
    .map((name) => name.toLowerCase());
  if (names.length === 0) return 'your lily hat and star cloak';
  if (names.length === 1) return `your ${names[0]}`;
  return `your ${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
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
  at: number;
}): Adventure {
  const place = PLACE_NAME[input.placeId] ?? 'garden';
  const friend = input.creature?.trim() || PLACE_FRIEND[input.placeId] || 'a quiet friend';
  const deeds = input.deeds.map((line) => line.trim()).filter(Boolean);
  const split = Math.max(1, Math.ceil(deeds.length / 2));
  const first = deeds.slice(0, split);
  const rest = deeds.slice(split);
  const work = first.length > 0 ? first.join(' ') : 'The spells were already glowing, so you walked through and listened.';
  const more = rest.join(' ');
  const crystals =
    input.crystals <= 0
      ? 'You left the crystals where they were, and that is all right.'
      : input.crystals === 1
        ? `You earned 1 crystal in the ${place}. It settled in your pocket.`
        : `You earned ${input.crystals} crystals in the ${place}. They settled in your pocket.`;
  const worn = outfitPhrase(input.wardrobe);
  const when = adventureDate(input.at);
  const pages = [
    `Today you visited the ${place}. You wore ${worn}.`,
    work,
    more ? `${more} ${crystals}` : crystals,
    `You met ${friend}.${input.gift ? ` You also brought home ${input.gift}.` : ''} This adventure is dated ${when}, so you can hear it again.`,
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
