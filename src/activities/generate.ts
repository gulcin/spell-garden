import { classify, type TemplateId } from '../curriculum/classify.ts';
import { allTopics, topicByName } from '../curriculum/data.ts';
import type { Topic } from '../curriculum/types.ts';
import type { Action, Art, Item, Piece, ShapeName, Zone } from './types.ts';

export function countUpHint(from: number, to: number): string {
  return `Count up from ${from} to ${to}. How many more?`;
}

export function rng(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function int(rand: () => number, lo: number, hi: number): number {
  return lo + Math.floor(rand() * (hi - lo + 1));
}

function pick<T>(rand: () => number, list: readonly T[]): T {
  return list[Math.floor(rand() * list.length)]!;
}

function shuffle<T>(rand: () => number, list: readonly T[]): T[] {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const a = next[i]!;
    const b = next[j]!;
    next[i] = b;
    next[j] = a;
  }
  return next;
}

function hints(a: string, b: string, c: string): [string, string, string] {
  return [a, b, c];
}

function counted(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

const TRAY_PHRASE = {
  flat: 'a flat for a hundred',
  rod: 'a rod for a ten',
  unit: 'a cube for a one',
} as const;

/** Names only the block kinds sitting in the tray. */
export function baseTenPrompt(total: number, pieces: { art: string }[]): string {
  const phrases = (['flat', 'rod', 'unit'] as const)
    .filter((art) => pieces.some((piece) => piece.art === art))
    .map((art) => TRAY_PHRASE[art]);
  const use =
    phrases.length === 0
      ? 'the blocks in the tray'
      : phrases.length === 1
        ? phrases[0]
        : phrases.length === 2
          ? `${phrases[0]} and ${phrases[1]}`
          : `${phrases[0]}, ${phrases[1]}, and ${phrases[2]}`;
  return `Build ${total} on the mat. Use ${use}.`;
}

/** How many steps gentler the puzzle in progress should be. Set only inside generateItem. */
let gentle = 0;

function rawBand(topic: Topic): number {
  if (topic.ageRangeStart <= 6) return 0;
  if (topic.ageRangeStart <= 8) return 1;
  if (topic.ageRangeStart <= 10) return 2;
  return 3;
}

function band(topic: Topic): number {
  return Math.max(0, rawBand(topic) - gentle);
}

type Built = Omit<Item, 'key' | 'topicId' | 'topicName' | 'template'>;

function pack(topic: Topic, template: TemplateId, salt: string, built: Built): Item {
  return {
    key: `${topic.id}:${salt}`,
    topicId: topic.id,
    topicName: topic.name,
    template,
    ...built,
  };
}

function slots(count: number, prefix: string, role: string): Zone[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}${i}`,
    role,
    capacity: 1,
    row: Math.floor(i / 5),
    col: i % 5,
  }));
}

const PLACEMENT = [
  { name: 'One-to-one counting', salt: 'placement-count' },
  { name: 'Fluent adding and subtracting within 5', salt: 'placement-add' },
  { name: 'Counting forwards and backwards', salt: 'placement-line' },
  { name: 'Division as equal sharing', salt: 'placement-share' },
  { name: 'What Is a Half?', salt: 'placement-half' },
] as const;

export function placementPlan(): { topic: Topic; salt: string }[] {
  return PLACEMENT.map((row) => ({ topic: topicByName(row.name), salt: row.salt }));
}

export function sampleItem(template: TemplateId): Item {
  const topic = allTopics().find((entry) => classify(entry) === template);
  if (!topic) throw new Error(`No topic paints ${template}`);
  return generateItem(topic, `art-preview-${template}`);
}

export function generateItem(topic: Topic, salt: string, ease = 0): Item {
  const previous = gentle;
  gentle = Number.isFinite(ease) ? Math.max(0, Math.min(2, Math.floor(ease))) : 0;
  try {
    return generateItemAtEase(topic, salt);
  } finally {
    gentle = previous;
  }
}

function generateItemAtEase(topic: Topic, salt: string): Item {
  if (salt.includes('placement-count')) return placeCount(topic, salt);
  if (salt.includes('placement-add')) return placeAdd(topic, salt);
  if (salt.includes('placement-line')) return placeLine(topic, salt);
  if (salt.includes('placement-share')) return placeShare(topic, salt);
  if (salt.includes('placement-half')) return placeHalf(topic, salt);
  const template = classify(topic);
  const rand = rng(`${topic.id}:${salt}`);
  switch (template) {
    case 'ten-frame':
      return tenFrame(topic, rand, salt);
    case 'number-line':
      return numberLine(topic, rand, salt);
    case 'base-ten':
      return baseTen(topic, rand, salt);
    case 'sharing':
      return sharing(topic, rand, salt);
    case 'array':
      return array(topic, rand, salt);
    case 'fraction':
      return fraction(topic, rand, salt);
    case 'coins':
      return coins(topic, rand, salt);
    case 'clock':
      return clock(topic, rand, salt);
    case 'balance':
      return balance(topic, rand, salt);
    case 'measure':
      return measure(topic, rand, salt);
    case 'shapes':
      return shapes(topic, rand, salt);
    case 'symmetry':
      return symmetry(topic, rand, salt);
    case 'pattern':
      return pattern(topic, rand, salt);
    case 'sort':
      return sort(topic, rand, salt);
    case 'bar-model':
      return barModel(topic, rand, salt);
    case 'graph':
      return graph(topic, rand, salt);
    case 'coordinate':
      return coordinate(topic, rand, salt);
    case 'angle':
      return angle(topic, rand, salt);
    case 'chance':
      return chance(topic, rand, salt);
    default:
      return fallback(topic, rand, salt);
  }
}

function placeCount(topic: Topic, salt: string): Item {
  const n = 5;
  const pieces: Piece[] = Array.from({ length: n + 2 }, (_, i) => ({ id: `p${i}`, art: 'spark', tone: i % 3 }));
  const zones = slots(10, 'slot', 'slot');
  return pack(topic, 'ten-frame', salt, {
    prompt: 'Count out 5 sparks and tuck them into the ten-frame, one in each box.',
    hints: hints(
      'Drag a spark into an empty box.',
      'Count out loud as each spark lands.',
      'Stop when five boxes are glowing. Leave the extras in the nest.',
    ),
    walkthrough: ['I take one spark for each number up to five.', 'Five boxes glow. The extras stay in the nest.'],
    pieces,
    zones,
    initial: {},
    goal: { kind: 'fill-count', count: n, zonePrefix: 'slot' },
    solution: pieces.slice(0, n).map((piece, i) => ({ op: 'move', pieceId: piece.id, zoneId: `slot${i}` })),
  });
}

function placeAdd(topic: Topic, salt: string): Item {
  const pieces: Piece[] = [
    ...[0, 1, 2].map((i) => ({ id: `b${i}`, art: 'spark' as const, group: 'blue', tone: 0 })),
    ...[0, 1].map((i) => ({ id: `g${i}`, art: 'spark' as const, group: 'gold', tone: 1 })),
  ];
  return pack(topic, 'ten-frame', salt, {
    prompt: 'Put 3 blue sparks and 2 gold sparks into the ten-frame.',
    hints: hints(
      'Blue sparks and gold sparks can share the frame.',
      'Count the blue ones first, then the gold.',
      'Three blue, then two gold. That is five sparks altogether.',
    ),
    walkthrough: ['Three blue sparks go in.', 'Two gold sparks join them.', 'The frame holds five.'],
    pieces,
    zones: slots(10, 'slot', 'slot'),
    initial: {},
    goal: { kind: 'mix', counts: { blue: 3, gold: 2 }, zonePrefix: 'slot' },
    solution: pieces.map((piece, i) => ({ op: 'move', pieceId: piece.id, zoneId: `slot${i}` })),
  });
}

function placeLine(topic: Topic, salt: string): Item {
  return hop(topic, salt, range(0, 10), 4, 6, 'The frog sits on 4. Hop to the lily that is 2 more.');
}

function placeShare(topic: Topic, salt: string): Item {
  return shareExact(topic, salt, 6, 2, 0, 'Share 6 gems fairly into 2 potion jars.');
}

function placeHalf(topic: Topic, salt: string): Item {
  return shade(topic, salt, 1, 2, 'pie', 'The moon pie is cut into 2 equal slices. Colour 1 slice. That is a half.');
}

function tenFrame(topic: Topic, rand: () => number, salt: string): Item {
  const name = topic.name.toLowerCase();
  const b = band(topic);
  const wide = gentle === 0 && b >= 1 && /20/.test(name);
  const slotCount = wide ? 20 : 10;
  const mixCap = gentle > 0 ? Math.max(2, 4 - gentle) : b === 0 ? 4 : 6;
  const countCap = gentle > 0 ? Math.max(3, 6 - gentle) : b === 0 ? 7 : 10;
  const zones = slots(slotCount, 'slot', 'slot');
  const subtract = /subtract|taking away|separat/.test(name) && (!/add/.test(name) || rand() < 0.45);
  if (/bond|pairs/.test(name) || (/make/.test(name) && rand() < 0.5)) {
    const total = /9/.test(name) ? 9 : 10;
    const have = int(rand, 2, total - 2);
    const pieces: Piece[] = Array.from({ length: total + 2 }, (_, i) => ({ id: `p${i}`, art: 'spark', tone: i % 2 }));
    const initial: Record<string, string> = {};
    pieces.slice(0, have).forEach((piece, i) => {
      initial[piece.id] = `slot${i}`;
    });
    const need = pieces.slice(have, total);
    const empty: string[] = [];
    for (let i = 0; i < slotCount && empty.length < need.length; i++) {
      if (!Object.values(initial).includes(`slot${i}`)) empty.push(`slot${i}`);
    }
    return pack(topic, 'ten-frame', salt, {
      prompt: `${have} sparks are already glowing. Fill the frame until there are ${total}.`,
      hints: hints(
        'Count the sparks already in the boxes.',
        `You have ${have}. Count up until you reach ${total}.`,
        'Each new spark fills one empty box. Stop at the total.',
      ),
      walkthrough: [`The frame starts with ${have}.`, `I add sparks until I reach ${total}.`],
      pieces,
      zones,
      initial,
      goal: { kind: 'fill-count', count: total, zonePrefix: 'slot' },
      solution: need.map((piece, i) => ({ op: 'move' as const, pieceId: piece.id, zoneId: empty[i] ?? `slot${i}` })),
    });
  }
  if (subtract) {
    const start = int(rand, gentle > 0 ? 3 : 4, Math.min(gentle > 0 ? 6 : 9, slotCount));
    const take = int(rand, 1, start - 1);
    const pieces: Piece[] = Array.from({ length: start }, (_, i) => ({ id: `p${i}`, art: 'spark', tone: 2 }));
    const initial: Record<string, string> = {};
    pieces.forEach((piece, i) => {
      initial[piece.id] = `slot${i}`;
    });
    zones.push({ id: 'nest', role: 'nest', label: 'Nest', capacity: 20 });
    const moving = pieces.slice(start - take);
    return pack(topic, 'ten-frame', salt, {
      prompt: `The ten-frame holds ${start} sparks. Move ${take} back to the nest.`,
      hints: hints(
        'Drag a spark from a box into the nest.',
        `Count ${counted(take, 'spark')} as you move them.`,
        'The boxes that still glow are what is left.',
      ),
      walkthrough: [
        `I move ${counted(take, 'spark')} to the nest.`,
        `${counted(start - take, 'spark')} ${start - take === 1 ? 'stays' : 'stay'} in the frame.`,
      ],
      pieces,
      zones,
      initial,
      goal: { kind: 'fill-count', count: start - take, zonePrefix: 'slot' },
      solution: moving.map((piece) => ({ op: 'move', pieceId: piece.id, zoneId: 'nest' })),
    });
  }
  if (/how many|one-to-one|representing numbers with objects|count/.test(name) && !/add|subtract/.test(name)) {
    const n = int(rand, 3, countCap);
    const pieces: Piece[] = Array.from({ length: n + 2 }, (_, i) => ({ id: `p${i}`, art: 'spark', tone: i % 3 }));
    return pack(topic, 'ten-frame', salt, {
      prompt: `Count out ${n} sparks and tuck them into the ten-frame.`,
      hints: hints('One spark in each box.', 'Count as you drop them.', `Stop at ${n}. Extras stay in the nest.`),
      walkthrough: [`I count ${n} sparks into the boxes.`],
      pieces,
      zones,
      initial: {},
      goal: { kind: 'fill-count', count: n, zonePrefix: 'slot' },
      solution: pieces.slice(0, n).map((piece, i) => ({ op: 'move' as const, pieceId: piece.id, zoneId: `slot${i}` })),
    });
  }
  const a = int(rand, 1, mixCap);
  let c = int(rand, 1, mixCap);
  if (a + c > slotCount) c = slotCount - a;
  const pieces: Piece[] = [
    ...Array.from({ length: a }, (_, i) => ({ id: `b${i}`, art: 'spark' as const, group: 'blue', tone: 0 })),
    ...Array.from({ length: c }, (_, i) => ({ id: `g${i}`, art: 'spark' as const, group: 'gold', tone: 1 })),
    { id: 'extra', art: 'spark', group: 'cloud', tone: 3 },
  ];
  return pack(topic, 'ten-frame', salt, {
    prompt: `Put ${a} blue sparks and ${c} gold sparks into the ten-frame. Leave the cloudy spark in the nest.`,
    hints: hints(
      'Choose the blue sparks first.',
      `You want ${a} blue and ${c} gold.`,
      'The cloudy spark is not part of this spell.',
    ),
    walkthrough: [`${a} blue sparks go in.`, `${c} gold sparks join them.`, `Together that is ${a + c}.`],
    pieces,
    zones,
    initial: {},
    goal: { kind: 'mix', counts: { blue: a, gold: c }, zonePrefix: 'slot' },
    solution: pieces.filter((piece) => piece.group !== 'cloud').map((piece, i) => ({ op: 'move' as const, pieceId: piece.id, zoneId: `slot${i}` })),
  });
}

function range(lo: number, hi: number, step = 1): number[] {
  const out: number[] = [];
  for (let n = lo; n <= hi; n += step) out.push(n);
  return out;
}

function hop(topic: Topic, salt: string, pads: number[], start: number, end: number, prompt: string): Item {
  const zones: Zone[] = pads.map((n) => ({ id: padId(n), role: 'lily', label: String(n), capacity: 1 }));
  const more = end - start;
  return pack(topic, 'number-line', salt, {
    prompt,
    hints: hints(
      'Drag the frog along the lilies, one hop at a time.',
      more > 0 ? `Start at ${start} and count ${counted(more, 'hop')} forward.` : `Start at ${start} and count ${counted(-more, 'hop')} back.`,
      countUpHint(Math.min(start, end), Math.max(start, end)),
    ),
    walkthrough: [
      `The frog begins on ${start}.`,
      `I count the hops until I land on ${end}.`,
      countUpHint(Math.min(start, end), Math.max(start, end)),
    ],
    pieces: [{ id: 'frog', art: 'frog' }],
    zones,
    initial: { frog: padId(start) },
    goal: { kind: 'piece-at', pieceId: 'frog', zoneId: padId(end) },
    solution: [{ op: 'move', pieceId: 'frog', zoneId: padId(end) }],
  });
}

function padId(n: number): string {
  return n < 0 ? `padm${-n}` : `pad${n}`;
}

function numberLine(topic: Topic, rand: () => number, salt: string): Item {
  const name = topic.name.toLowerCase();
  if (/negative|temperature/.test(name)) {
    const start = int(rand, -2, 3);
    let end = start + pick(rand, [-3, -2, -1, 1, 2, 3]);
    end = Math.max(-5, Math.min(5, end));
    if (end === start) end = start === 5 ? 2 : start + 1;
    return hop(topic, salt, range(-5, 5), start, end, `The frog is on ${start}. Hop to ${end}. Cold numbers live below zero.`);
  }
  if (/skip|counting in|2s|4s|6s|8s|50s|100s/.test(name)) {
    const step = /100/.test(name) ? 100 : /50/.test(name) ? 50 : /8s/.test(name) ? 8 : /6s/.test(name) ? 6 : /4s/.test(name) ? 4 : 2;
    const hops = int(rand, 2, gentle > 0 ? 2 : 4);
    const zones: Zone[] = [];
    for (let i = 0; i <= 5; i++) zones.push({ id: padId(i * step), role: 'lily', label: String(i * step), capacity: 1 });
    const end = hops * step;
    return pack(topic, 'number-line', salt, {
      prompt: `Count in ${step}s. Make ${hops} hops from 0.`,
      hints: hints(
        `Each hop skips to the next lily of ${step}.`,
        `Say the ${step}s out loud as the frog jumps.`,
        `After ${hops} hops you will be standing on a lily. That number is your spell.`,
      ),
      walkthrough: [`Start at 0.`, `Hop ${hops} times by ${step}.`, `The frog lands on ${end}.`],
      pieces: [{ id: 'frog', art: 'frog' }],
      zones,
      initial: { frog: padId(0) },
      goal: { kind: 'piece-at', pieceId: 'frog', zoneId: padId(end) },
      solution: [{ op: 'move', pieceId: 'frog', zoneId: padId(end) }],
    });
  }
  if ((/1000|large|within 1,000|to 100/.test(name) || band(topic) >= 2) && gentle < 2) {
    const start = int(rand, 0, gentle > 0 ? 4 : 6) * 10;
    const add = int(rand, 1, gentle > 0 ? 1 : 3) * 10;
    const end = Math.min(100, start + add);
    const landing = end === start ? start + 10 : end;
    return hop(topic, salt, range(0, 100, 10), start, landing, `The frog sits on ${start}. Hop to the lily that is ${landing - start} more.`);
  }
  const max = 10;
  const start = int(rand, 0, 6);
  const add = int(rand, 1, Math.min(gentle > 0 ? Math.max(1, 3 - gentle) : 4, max - start));
  return hop(topic, salt, range(0, max), start, start + add, `The frog sits on ${start}. Hop to the lily that is ${add} more.`);
}

function baseTen(topic: Topic, rand: () => number, salt: string): Item {
  const name = topic.name.toLowerCase();
  const useHundreds = band(topic) >= 2 && /1000|hundred|three-digit|large/.test(name);
  if (/add|subtract|strategies|mental|written|two-digit/.test(name) && rand() < 0.55 && !/reading|writing|ordering|comparing/.test(name)) {
    const ones = int(rand, gentle > 0 ? 10 : 11, gentle > 0 ? 12 : 16);
    const tens = int(rand, 1, gentle > 0 ? 2 : 3);
    const total = tens * 10 + ones;
    const pieces: Piece[] = [];
    const initial: Record<string, string> = {};
    for (let i = 0; i < ones; i++) {
      pieces.push({ id: `u${i}`, art: 'unit', value: 1 });
      initial[`u${i}`] = 'mat';
    }
    for (let i = 0; i < tens; i++) {
      pieces.push({ id: `r${i}`, art: 'rod', value: 10 });
      initial[`r${i}`] = 'mat';
    }
    pieces.push({ id: 'rbank', art: 'rod', value: 10 });
    pieces.push({ id: 'rbank2', art: 'rod', value: 10 });
    return pack(topic, 'base-ten', salt, {
      prompt: `The mat has ${counted(tens, 'rod')} and ${counted(ones, 'loose one', 'loose ones')}. Snap 10 ones into a rod so fewer than 10 ones are left.`,
      hints: hints(
        'Ten little cubes can snap into one rod.',
        'Press Snap when you see 10 loose ones.',
        'After the snap, count the rods and the ones that are left.',
      ),
      walkthrough: ['I gather 10 ones.', 'They snap into a new rod.', `The value is still ${total}, written the tidy way.`],
      pieces,
      zones: [{ id: 'mat', role: 'mat', label: 'Mat', capacity: 40 }],
      initial,
      goal: { kind: 'value', zoneId: 'mat', total, onesAtMost: 9 },
      solution: [{ op: 'bundle', zoneId: 'mat' }],
    });
  }
  const hundreds = useHundreds ? int(rand, 1, 3) : 0;
  const tens = int(rand, hundreds ? 0 : 1, 5);
  const ones = int(rand, 0, 8);
  const total = hundreds * 100 + tens * 10 + ones;
  const pieces: Piece[] = [];
  for (let i = 0; i < hundreds + 1; i++) pieces.push({ id: `f${i}`, art: 'flat', value: 100, label: '100' });
  for (let i = 0; i < Math.max(tens + 2, 4); i++) pieces.push({ id: `r${i}`, art: 'rod', value: 10, label: '10' });
  for (let i = 0; i < Math.max(ones + 3, 8); i++) pieces.push({ id: `u${i}`, art: 'unit', value: 1, label: '1' });
  const offered = useHundreds ? pieces : pieces.filter((piece) => piece.art !== 'flat');
  const solution: Action[] = [];
  for (let i = 0; i < hundreds; i++) solution.push({ op: 'move', pieceId: `f${i}`, zoneId: 'mat' });
  for (let i = 0; i < tens; i++) solution.push({ op: 'move', pieceId: `r${i}`, zoneId: 'mat' });
  for (let i = 0; i < ones; i++) solution.push({ op: 'move', pieceId: `u${i}`, zoneId: 'mat' });
  return pack(topic, 'base-ten', salt, {
    prompt: baseTenPrompt(total, offered),
    hints: hints(
      'Make the biggest blocks first.',
      hundreds ? `You need ${hundreds} flats, then the tens, then the ones.` : `Rods are tens. Cubes are ones.`,
      'Stop when the blocks show the number, with fewer than 10 ones.',
    ),
    walkthrough: [
      hundreds ? `I take ${hundreds} flat${hundreds === 1 ? '' : 's'} for the hundreds.` : 'No hundreds this time.',
      `I take ${tens} rod${tens === 1 ? '' : 's'} and ${ones} cube${ones === 1 ? '' : 's'}.`,
      `Together they make ${total}.`,
    ],
    pieces: offered,
    zones: [{ id: 'mat', role: 'mat', label: 'Mat', capacity: 40 }],
    initial: {},
    goal: { kind: 'value', zoneId: 'mat', total, onesAtMost: 9, tensAtMost: useHundreds ? 9 : undefined },
    solution,
  });
}

function shareExact(topic: Topic, salt: string, gems: number, jars: number, rem: number, prompt: string): Item {
  const pieces: Piece[] = Array.from({ length: gems }, (_, i) => ({ id: `g${i}`, art: 'gem', tone: i % 4 }));
  const zones: Zone[] = Array.from({ length: jars }, (_, i) => ({
    id: `jar${i}`,
    role: 'jar',
    label: `Jar ${i + 1}`,
    capacity: 16,
  }));
  if (rem > 0) zones.push({ id: 'bowl', role: 'bowl', label: 'Leftovers', capacity: 8 });
  const each = Math.floor((gems - rem) / jars);
  const counts: Record<string, number> = {};
  for (let i = 0; i < jars; i++) counts[`jar${i}`] = each;
  if (rem > 0) counts.bowl = rem;
  const solution: Action[] = [];
  for (let i = 0; i < gems - rem; i++) solution.push({ op: 'move', pieceId: `g${i}`, zoneId: `jar${i % jars}` });
  for (let i = gems - rem; i < gems; i++) solution.push({ op: 'move', pieceId: `g${i}`, zoneId: 'bowl' });
  return pack(topic, 'sharing', salt, {
    prompt,
    hints: hints(
      'Give each jar one gem, then go around again.',
      'Fair means every jar ends with the same number.',
      rem > 0 ? 'If a gem cannot get a jar of its own, it waits in the leftover bowl.' : 'Keep going until the nest is empty and the jars match.',
    ),
    walkthrough: [
      `I deal the gems one by one into ${jars} jars.`,
      rem > 0 ? `Each jar gets ${each}, and ${rem} wait in the bowl.` : `Each jar gets ${each} gems.`,
    ],
    pieces,
    zones,
    initial: {},
    goal: { kind: 'zone-counts', counts },
    solution,
  });
}

function sharing(topic: Topic, rand: () => number, salt: string): Item {
  const name = topic.name.toLowerCase();
  const b = band(topic);
  const jars = int(rand, 2, gentle > 0 ? 2 : b >= 2 ? 5 : 3);
  const each = int(rand, 2, gentle > 0 ? Math.max(2, 4 - gentle) : b === 0 ? 4 : 6);
  const rem = /remainder/.test(name) ? int(rand, 1, jars - 1) : 0;
  const gems = jars * each + rem;
  const prompt = rem
    ? `Share ${gems} gems into ${jars} jars as fairly as you can. Leftovers go in the little bowl.`
    : `Share ${gems} gems fairly into ${jars} potion jars.`;
  return shareExact(topic, salt, gems, jars, rem, prompt);
}

function array(topic: Topic, rand: () => number, salt: string): Item {
  const name = topic.name.toLowerCase();
  const b = band(topic);
  let rows = int(rand, 2, gentle > 0 ? 2 : b === 0 ? 3 : 4);
  let cols = int(rand, 2, gentle > 0 ? Math.max(2, 4 - gentle) : b === 0 ? 4 : 6);
  if (/square|cube/.test(name)) {
    rows = int(rand, 2, 4);
    cols = rows;
  }
  if (/by tens|multiplying by tens/.test(name)) {
    cols = 10;
    rows = int(rand, 2, 3);
  }
  const gridRows = rows + 1;
  const gridCols = cols + 2;
  const zones: Zone[] = [];
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      zones.push({ id: `r${r}c${c}`, role: 'cell', row: r, col: c, capacity: 1 });
    }
  }
  const pieces: Piece[] = Array.from({ length: rows * cols }, (_, i) => ({ id: `k${i}`, art: 'crystal', tone: i % 3 }));
  const solution: Action[] = [];
  let n = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) solution.push({ op: 'move', pieceId: `k${n++}`, zoneId: `r${r}c${c}` });
  }
  return pack(topic, 'array', salt, {
    prompt: `Grow an array of crystals: ${rows} rows with ${cols} in each row. Start at the left of each row.`,
    hints: hints(
      'Fill the top row first, from the left.',
      `Each row needs ${cols} crystals.`,
      `You need ${rows} rows like that. Empty soil can stay empty.`,
    ),
    walkthrough: [`I plant ${cols} crystals in a row.`, `I do that ${rows} times.`, `That array is ${rows} × ${cols}.`],
    pieces,
    zones,
    initial: {},
    goal: { kind: 'array', rows, cols },
    solution,
  });
}

function shade(topic: Topic, salt: string, num: number, den: number, layout: 'pie' | 'bar', prompt: string): Item {
  const slices = Array.from({ length: den }, (_, i) => ({ id: `slice${i}` }));
  return pack(topic, 'fraction', salt, {
    prompt,
    hints: hints(
      layout === 'pie' ? 'Tap a slice to colour it. Tap again to undo.' : 'Tap a piece of the potion bar.',
      `The whole is split into ${den} equal parts.`,
      `Colour ${num} of those parts.`,
    ),
    walkthrough: [`The whole has ${den} equal parts.`, `I colour ${num} of them.`],
    pieces: [],
    zones: [],
    initial: {},
    slices,
    layout,
    goal: { kind: 'shaded', count: num },
    solution: slices.slice(0, num).map((slice) => ({ op: 'tap' as const, id: slice.id })),
  });
}

function fraction(topic: Topic, rand: () => number, salt: string): Item {
  const name = topic.name.toLowerCase();
  if (/compar/.test(name)) {
    const dens = gentle > 0 ? [2, 3, 4] : [2, 3, 4, 5, 6, 8];
    const d1 = pick(rand, dens);
    const d2 = pick(rand, dens);
    const n1 = int(rand, 1, d1 - 1);
    const n2 = int(rand, 1, d2 - 1);
    const left = n1 / d1;
    const right = n2 / d2;
    const answer = Math.abs(left - right) < 1e-9 ? 'same' : left > right ? 'left' : 'right';
    const compare = [
      { id: 'left', num: n1, den: d1, caption: `${n1}/${d1}` },
      { id: 'right', num: n2, den: d2, caption: `${n2}/${d2}` },
      { id: 'same', num: 1, den: 1, caption: 'They are equal' },
    ];
    return pack(topic, 'fraction', salt, {
      prompt: 'Which potion is more full? Tap the greater one, or tap equal if they match.',
      hints: hints(
        'Look at how much of each bar is coloured.',
        'Same-sized wholes are easier to compare.',
        'If the coloured parts match, they are equal.',
      ),
      walkthrough: [`The left shows ${n1}/${d1}.`, `The right shows ${n2}/${d2}.`, answer === 'same' ? 'They are the same amount.' : `The ${answer} one is more.`],
      pieces: [],
      zones: [],
      initial: {},
      compare,
      choices: compare.map((card) => ({ id: card.id, label: card.caption })),
      goal: { kind: 'choice', id: answer },
      solution: [{ op: 'tap', id: answer }],
    });
  }
  if (/decimal|percent|tenth|hundredth/.test(name)) {
    const n = int(rand, 1, 9);
    if (/percent/.test(name)) {
      return shade(topic, salt, n, 10, 'bar', `Shade ${n * 10} percent of the potion bar. Each piece is 10 percent.`);
    }
    return shade(topic, salt, n, 10, 'bar', `Shade ${counted(n, 'tenth')} of the potion bar.`);
  }
  if (/add|sum/.test(name)) {
    const den = pick(rand, gentle > 0 ? [4] : [4, 5, 6, 8]);
    const a = int(rand, 1, Math.max(1, den - 3));
    const c = int(rand, 1, den - a - 1);
    return shade(topic, salt, a + c, den, den > 6 ? 'bar' : 'pie', `Shade the sum of ${a}/${den} and ${c}/${den}.`);
  }
  if (/equivalent/.test(name)) {
    const base = pick(rand, [2, 3, 4]);
    const k = pick(rand, [2, 3]);
    return shade(topic, salt, k, base * k, 'bar', `Shade the amount that matches 1/${base}. The bar is split into ${base * k}, so colour ${k} pieces.`);
  }
  const den = /half/.test(name) ? 2 : /quarter/.test(name) ? 4 : pick(rand, gentle >= 2 ? [2, 4] : gentle > 0 ? [2, 3, 4] : [2, 3, 4, 6, 8]);
  const num = /half/.test(name) ? 1 : /quarter/.test(name) && rand() < 0.5 ? 1 : int(rand, 1, den - 1);
  const word = num === 1 && den === 2 ? ' That is a half.' : num === 1 && den === 4 ? ' That is a quarter.' : '';
  return shade(topic, salt, num, den, den <= 6 ? 'pie' : 'bar', `Colour ${num} of the ${den} equal parts.${word}`);
}

function coinBank(): Piece[] {
  const spec: [string, number][] = [
    ['c20', 20],
    ['c10a', 10],
    ['c10b', 10],
    ['c5', 5],
    ['c1a', 1],
    ['c1b', 1],
    ['c1c', 1],
    ['c1d', 1],
    ['c1e', 1],
    ['c1f', 1],
  ];
  return spec.map(([id, value]) => ({ id, art: 'coin' as const, value, label: String(value) }));
}

function pay(pieces: Piece[], total: number): Action[] {
  let left = total;
  const actions: Action[] = [];
  const order = [...pieces].sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  for (const piece of order) {
    const value = piece.value ?? 0;
    if (value > 0 && value <= left) {
      actions.push({ op: 'move', pieceId: piece.id, zoneId: 'palm' });
      left -= value;
    }
  }
  if (left !== 0) throw new Error(`Cannot pay ${total}`);
  return actions;
}

function coins(topic: Topic, rand: () => number, salt: string): Item {
  const name = topic.name.toLowerCase();
  const pieces = coinBank();
  const coinHi = Math.max(8, (rawBand(topic) >= 2 ? 36 : 22) - gentle * (rawBand(topic) >= 2 ? 8 : 4));
  let total = int(rand, gentle > 0 ? 4 : 6, coinHi);
  let prompt = `The star cake costs ${total} sparks. Drag coins that pay exactly.`;
  if (/change/.test(name)) {
    const cost = int(rand, 4, gentle > 0 ? 9 : 16);
    const paid = cost <= 9 ? 10 : 20;
    total = paid - cost;
    prompt = `The lantern costs ${cost} sparks. You paid ${paid}. Drag the change the shopkeeper should hand back.`;
  }
  return pack(topic, 'coins', salt, {
    prompt,
    hints: hints(
      'Start with the biggest coin that is not too big.',
      'Watch the palm total as coins land.',
      'If you go past the number, drag a coin back to the purse.',
    ),
    walkthrough: [`I need ${counted(total, 'spark')} exactly.`, 'I choose coins that add to that number and no more.'],
    pieces,
    zones: [{ id: 'palm', role: 'palm', label: 'Palm', capacity: 12 }],
    initial: {},
    goal: { kind: 'sum', zoneId: 'palm', total },
    solution: pay(pieces, total),
  });
}

function clock(topic: Topic, rand: () => number, salt: string): Item {
  const name = topic.name.toLowerCase();
  const b = band(topic);
  let hour = int(rand, 1, 12);
  let minute = 0;
  const easyClock = gentle > 0 || b === 0;
  if (gentle >= 2 && !/half/.test(name)) minute = 0;
  else if (/half/.test(name) || (easyClock && rand() < 0.5)) minute = rand() < 0.5 ? 30 : 0;
  else if (easyClock) minute = 0;
  else minute = pick(rand, [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
  if (/duration|sequence intervals|comparing time/.test(name)) {
    hour = int(rand, 1, 10);
    minute = 0;
    const endMinute = rand() < 0.5 ? 30 : 15;
    const prompt =
      endMinute === 30
        ? `Tea starts at ${hour} o'clock and lasts half an hour. Set the clock to when tea ends.`
        : `A story starts at ${hour} o'clock and lasts a quarter of an hour. Set the clock to when it ends.`;
    return clockItem(topic, salt, hour, endMinute, prompt);
  }
  if (hour === 12 && minute === 0) minute = 30;
  const label =
    minute === 0
      ? `${hour} o'clock`
      : minute === 30
        ? `half past ${hour}`
        : minute === 15
          ? `quarter past ${hour}`
          : minute === 45
            ? `quarter to ${hour === 12 ? 1 : hour + 1}`
            : `${minute} minutes past ${hour}`;
  return clockItem(topic, salt, hour, minute, `Set the garden clock to ${label}.`);
}

/** A neutral time whose hands sit well apart, and never the time the spell is asking for. */
function openingClock(hour: number, minute: number): { hour: number; minute: number } {
  const openings = [
    { hour: 10, minute: 20 },
    { hour: 2, minute: 40 },
    { hour: 7, minute: 35 },
    { hour: 4, minute: 50 },
  ];
  return openings.find((start) => start.hour % 12 !== hour % 12 || start.minute !== minute) ?? { hour: 8, minute: 10 };
}

function clockItem(topic: Topic, salt: string, hour: number, minute: number, prompt: string): Item {
  return pack(topic, 'clock', salt, {
    prompt,
    hints: hints(
      'The short hand is the hour. The long hand is the minutes.',
      minute === 0 ? 'For o’clock, the long hand points up at 12.' : 'Count the minute marks by fives around the edge.',
      'Turn one hand, then the other, until both feel right.',
    ),
    walkthrough: [`The hour hand rests on ${hour}.`, `The minute hand shows ${minute} minutes.`],
    pieces: [],
    zones: [],
    initial: {},
    clockStart: openingClock(hour, minute),
    goal: { kind: 'clock', hour, minute },
    solution: [{ op: 'clock', hour, minute }],
  });
}

function balance(topic: Topic, rand: () => number, salt: string): Item {
  const name = topic.name.toLowerCase();
  if (/mass|weight/.test(name) || topic.domain === 'Measurement') {
    const n = int(rand, 3, gentle > 0 ? Math.max(4, 6 - gentle) : 8);
    const pieces: Piece[] = [];
    const solution: Action[] = [];
    for (let i = 0; i < n; i++) {
      pieces.push({ id: `one${i}`, art: 'stone', value: 1, label: '1' });
      solution.push({ op: 'move', pieceId: `one${i}`, zoneId: 'pan' });
    }
    if (n >= 5) pieces.push({ id: 'five', art: 'stone', value: 5, label: '5' });
    return pack(topic, 'balance', salt, {
      prompt: 'The melon weighs the same as the mushrooms. Put stones on the empty pan until the scale balances.',
      hints: hints(
        'Count the mushrooms first.',
        'Each stone marked 1 matches one mushroom.',
        'The pans balance when the stones match the mushrooms.',
      ),
      walkthrough: [`I count ${n} mushrooms.`, `I put stones that add to ${n} on the empty pan.`],
      pieces,
      zones: [{ id: 'pan', role: 'pan', label: 'Stones', capacity: 12 }],
      initial: {},
      mushrooms: n,
      goal: { kind: 'sum', zoneId: 'pan', total: n },
      solution,
    });
  }
  const known = int(rand, 1, gentle > 0 ? 4 : 7);
  const missing = int(rand, 1, gentle > 0 ? Math.max(2, 5 - gentle) : 8);
  const total = known + missing;
  const pieces: Piece[] = Array.from({ length: 9 }, (_, i) => ({
    id: `t${i + 1}`,
    art: 'token' as const,
    value: i + 1,
    label: String(i + 1),
  }));
  return pack(topic, 'balance', salt, {
    prompt: `Make the pans match. ${known} plus which stone equals ${total}?`,
    hints: hints(
      'Both sides need the same value.',
      `Start at ${known} and count up to ${total}.`,
      countUpHint(known, total),
    ),
    walkthrough: [`The left side has ${known}.`, `I count up to ${total}.`, `The missing stone is ${missing}.`],
    pieces,
    zones: [{ id: 'pan', role: 'pan', label: 'Missing', capacity: 4 }],
    initial: {},
    equation: { left: `${known} +`, right: `= ${total}` },
    goal: { kind: 'sum', zoneId: 'pan', total: missing },
    solution: [{ op: 'move', pieceId: `t${missing}`, zoneId: 'pan' }],
  });
}

function measure(topic: Topic, rand: () => number, salt: string): Item {
  const length = int(rand, 3, Math.max(3, (rawBand(topic) >= 2 ? 8 : 6) - gentle));
  const zones: Zone[] = [];
  const counts: Record<string, number> = {};
  for (let i = 0; i < length; i++) {
    zones.push({ id: `span${i}`, role: 'span', capacity: 1, col: i });
    counts[`span${i}`] = 1;
  }
  zones.push({ id: 'extra0', role: 'extra', capacity: 1, col: length });
  zones.push({ id: 'extra1', role: 'extra', capacity: 1, col: length + 1 });
  counts.extra0 = 0;
  counts.extra1 = 0;
  const pieces: Piece[] = Array.from({ length: length + 2 }, (_, i) => ({ id: `pl${i}`, art: 'plank' }));
  return pack(topic, 'measure', salt, {
    prompt: 'Lay planks on the wooden bridge until you reach the star flag. Do not go past the flag.',
    hints: hints(
      'The wooden spaces are the bridge. The grass past the flag is not.',
      'One plank fills one space.',
      'Stop when every wooden space has a plank and the grass is clear.',
    ),
    walkthrough: ['I fill each wooden space with one plank.', 'I leave the spaces past the flag empty.', `The bridge is ${length} planks long.`],
    pieces,
    zones,
    initial: {},
    spanCount: length,
    goal: { kind: 'zone-counts', counts },
    solution: pieces.slice(0, length).map((piece, i) => ({ op: 'move' as const, pieceId: piece.id, zoneId: `span${i}` })),
  });
}

function shapes(topic: Topic, rand: () => number, salt: string): Item {
  const name = topic.name.toLowerCase();
  if (/positional|position, direction/.test(name)) {
    return choice(
      topic,
      'shapes',
      salt,
      'The frog sits on the lily. Where is the frog?',
      ['On means right there.', 'Under means below. Beside means next to it.'],
      'On the lily',
      ['Under the lily', 'Beside the pond', 'Above the clouds'],
      hints('Look at the word on.', 'The frog is not under the lily.', 'On means sitting right there.'),
      ['The frog sits on the lily.', 'So the place is on the lily.'],
    );
  }
  if (/turns & direction|describing movement/.test(name)) {
    return choice(
      topic,
      'shapes',
      salt,
      'Which way is a quarter turn to the right?',
      ['Clock hands move to the right.', 'A quarter turn is one corner of a square.'],
      'The same way clock hands go',
      ['The other way from clock hands', 'Straight up', 'Backwards'],
      hints('Think of the garden clock.', 'The minute hand moves to the right.', 'A quarter turn follows that same way.'),
      ['Clock hands travel to the right.', 'A quarter turn to the right follows them.'],
    );
  }
  const pool: { shape: ShapeName; label: string }[] = [
    { shape: 'triangle', label: 'Triangle' },
    { shape: 'square', label: 'Square' },
    { shape: 'circle', label: 'Circle' },
    { shape: 'rectangle', label: 'Rectangle' },
    { shape: 'pentagon', label: 'Pentagon' },
    { shape: 'hexagon', label: 'Hexagon' },
    { shape: 'cube', label: 'Cube' },
    { shape: 'cone', label: 'Cone' },
    { shape: 'sphere', label: 'Sphere' },
  ];
  let want: (shape: ShapeName) => boolean = (shape) => shape === 'triangle';
  let prompt = 'Tap every triangle.';
  if (/circle|parts of a circle/.test(name)) {
    want = (shape) => shape === 'circle';
    prompt = 'Tap every circle.';
  } else if (/3-d|solid|faces|nets|cube/.test(name)) {
    want = (shape) => shape === 'cube' || shape === 'cone' || shape === 'sphere';
    prompt = 'Tap the solid shapes. Leave the flat shapes alone.';
  } else if (/quadrilateral|4 sides|square/.test(name)) {
    want = (shape) => shape === 'square' || shape === 'rectangle';
    prompt = 'Tap the shapes with 4 sides.';
  } else if (rand() < 0.4) {
    want = (shape) => shape === 'square';
    prompt = 'Tap every square.';
  }
  const toggles = shuffle(rand, pool)
    .slice(0, 6)
    .map((row, i) => ({ id: `sh${i}`, shape: row.shape, label: row.label }));
  if (!toggles.some((row) => want(row.shape))) {
    toggles[0] = { id: 'sh0', shape: 'triangle', label: 'Triangle' };
    want = (shape) => shape === 'triangle';
    prompt = 'Tap every triangle.';
  }
  const ids = toggles.filter((row) => want(row.shape)).map((row) => row.id);
  return pack(topic, 'shapes', salt, {
    prompt,
    hints: hints(
      'Look at the sides and the corners.',
      'Tap a shape to choose it. Tap again to let it go.',
      'Count the shapes you chose and check them against the spell.',
    ),
    walkthrough: ['I look at each shape slowly.', 'I tap only the ones the spell asked for.'],
    pieces: [],
    zones: [],
    initial: {},
    toggles,
    goal: { kind: 'toggles', ids },
    solution: ids.map((id) => ({ op: 'tap' as const, id })),
  });
}

function symmetry(topic: Topic, rand: () => number, salt: string): Item {
  const cols = 4;
  const rows = 4;
  const given: string[] = [];
  const mirrors: string[] = [];
  const seeds = shuffle(rand, [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 1],
    [0, 1],
    [2, 1],
  ] as const).slice(0, 3);
  for (const [r, c] of seeds) {
    given.push(`g${r}-${c}`);
    mirrors.push(`g${r}-${cols - 1 - c}`);
  }
  return pack(topic, 'symmetry', salt, {
    prompt: 'Finish the reflection. Tap squares on the right so the garden mirrors the left.',
    hints: hints(
      'A mirror flips left and right.',
      'Each coloured square needs a partner the same distance from the middle.',
      'The pale squares on the left are already done. Colour their partners.',
    ),
    walkthrough: ['I find each coloured square on the left.', 'I tap the matching square on the right.'],
    pieces: [],
    zones: [],
    initial: {},
    symmetry: { cols, rows, given },
    goal: { kind: 'symmetry', ids: [...given, ...mirrors] },
    solution: mirrors.map((id) => ({ op: 'tap' as const, id })),
  });
}

function pattern(topic: Topic, rand: () => number, salt: string): Item {
  const name = topic.name.toLowerCase();
  const numeric = band(topic) >= 2 && /nth|number pattern|linear number|generating/.test(name);
  if (numeric) {
    const start = int(rand, 1, 4);
    const step = int(rand, 2, 5);
    const lead = [0, 1, 2, 3].map((i) => ({ art: 'token' as const, label: String(start + i * step) }));
    const next = start + 4 * step;
    const distractors = [next + step, next - 1, start].filter((n) => n !== next && n > 0).slice(0, 2);
    const pieces: Piece[] = [
      { id: 'fit', art: 'token', label: String(next), value: next },
      ...distractors.map((n, i) => ({ id: `d${i}`, art: 'token' as const, label: String(n), value: n })),
    ];
    return pack(topic, 'pattern', salt, {
      prompt: 'The sequence grows by the same amount each time. Drag the next number into the gap.',
      hints: hints(
        'Find the jump from one number to the next.',
        'That same jump happens every time.',
        'Add the jump once more to the last number you can see.',
      ),
      walkthrough: [`The jump is ${step}.`, `After ${start + 3 * step}, the next number is ${next}.`],
      pieces,
      zones: [{ id: 'gap', role: 'gap', capacity: 1, label: '?' }],
      initial: {},
      lead,
      goal: { kind: 'piece-at', pieceId: 'fit', zoneId: 'gap' },
      solution: [{ op: 'move', pieceId: 'fit', zoneId: 'gap' }],
    });
  }
  const sets: { seq: Art[]; next: Art }[] = [
    { seq: ['star', 'moon', 'star', 'moon', 'star'], next: 'moon' },
    { seq: ['leaf', 'leaf', 'drop', 'leaf', 'leaf'], next: 'drop' },
    { seq: ['moon', 'star', 'leaf', 'moon', 'star'], next: 'leaf' },
    { seq: ['drop', 'star', 'drop', 'star', 'drop'], next: 'star' },
  ];
  const chosen = pick(rand, sets);
  const others = (['star', 'moon', 'leaf', 'drop'] as Art[]).filter((art) => art !== chosen.next).slice(0, 2);
  const pieces: Piece[] = [
    { id: 'fit', art: chosen.next },
    ...others.map((art, i) => ({ id: `d${i}`, art })),
  ];
  return pack(topic, 'pattern', salt, {
    prompt: 'Drag the tile that continues the pattern into the gap.',
    hints: hints(
      'Say the pattern out loud.',
      'Look at the last tile and ask what usually comes next.',
      'The gap wants the tile that keeps the rhythm.',
    ),
    walkthrough: ['I read the tiles from left to right.', 'The rhythm tells me the missing tile.'],
    pieces,
    zones: [{ id: 'gap', role: 'gap', capacity: 1, label: '?' }],
    initial: {},
    lead: chosen.seq.map((art) => ({ art })),
    goal: { kind: 'piece-at', pieceId: 'fit', zoneId: 'gap' },
    solution: [{ op: 'move', pieceId: 'fit', zoneId: 'gap' }],
  });
}

function sort(topic: Topic, rand: () => number, salt: string): Item {
  const name = topic.name.toLowerCase();
  if (/more|fewer|comparing groups/.test(name)) {
    const left = int(rand, 2, 5);
    let right = int(rand, 2, 6);
    if (right === left) right = left + 1;
    const zone = right > left ? 'right' : 'left';
    return pack(topic, 'sort', salt, {
      prompt: 'Drag the gold ribbon onto the pool with more fireflies.',
      hints: hints('Count each pool.', 'The greater count is the one with more.', 'The ribbon marks the larger pool.'),
      walkthrough: [`One pool has ${left}. The other has ${right}.`, 'The ribbon goes on the pool with more.'],
      pieces: [{ id: 'ribbon', art: 'ribbon', label: 'more' }],
      zones: [
        { id: 'left', role: 'pool', label: 'Left', capacity: 1 },
        { id: 'right', role: 'pool', label: 'Right', capacity: 1 },
      ],
      initial: {},
      pools: [
        { label: 'Left pool', count: left, art: 'spark' },
        { label: 'Right pool', count: right, art: 'spark' },
      ],
      goal: { kind: 'piece-at', pieceId: 'ribbon', zoneId: zone },
      solution: [{ op: 'move', pieceId: 'ribbon', zoneId: zone }],
    });
  }
  const nums = shuffle(rand, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, 6);
  const pieces: Piece[] = nums.map((n) => ({
    id: `n${n}`,
    art: 'token',
    label: String(n),
    value: n,
    group: n % 2 === 0 ? 'even' : 'odd',
  }));
  return pack(topic, 'sort', salt, {
    prompt: 'Sort the number tiles. Odd numbers go in one hoop, even numbers in the other.',
    hints: hints(
      'Even numbers can be split into pairs with nothing left over.',
      'If a number ends in 1, 3, 5, 7, or 9, it is odd.',
      'Check each tile once and let it rest in its hoop.',
    ),
    walkthrough: ['I look at each number.', 'Pairs with none left over are even. The others are odd.'],
    pieces,
    zones: [
      { id: 'odd', role: 'hoop', label: 'Odd', capacity: 8 },
      { id: 'even', role: 'hoop', label: 'Even', capacity: 8 },
    ],
    initial: {},
    goal: { kind: 'groups', groupZone: { odd: 'odd', even: 'even' } },
    solution: pieces.map((piece) => ({ op: 'move' as const, pieceId: piece.id, zoneId: piece.group === 'even' ? 'even' : 'odd' })),
  });
}

function barModel(topic: Topic, rand: () => number, salt: string): Item {
  const name = topic.name.toLowerCase();
  if (/ratio|proportion|similar|scale/.test(name) && band(topic) >= 2) {
    const unit = int(rand, 2, 4);
    const a = unit;
    const c = unit * 2;
    const pieces: Piece[] = [
      ...Array.from({ length: a }, (_, i) => ({ id: `p${i}`, art: 'gem' as const, group: 'pink', tone: 5 })),
      ...Array.from({ length: c }, (_, i) => ({ id: `g${i}`, art: 'gem' as const, group: 'gold', tone: 1 })),
      { id: 'spare', art: 'gem', group: 'spare', tone: 3 },
    ];
    return pack(topic, 'bar-model', salt, {
      prompt: `There are ${a + c} seats on the bar. For every 1 pink gem there are 2 gold gems. Fill the bar in that ratio and leave the spare gem out.`,
      hints: hints(
        'Start with one pink, then two gold, and repeat.',
        `You need ${a} pink and ${c} gold.`,
        'The spare gem is not part of the ratio.',
      ),
      walkthrough: [`${a} pink and ${c} gold is the ratio 1 to 2.`, `Together they fill ${a + c} seats.`],
      pieces,
      zones: [{ id: 'bar', role: 'bar', label: 'Bar', capacity: 16 }],
      initial: {},
      goal: { kind: 'mix', counts: { pink: a, gold: c }, zonePrefix: 'bar' },
      solution: pieces.filter((piece) => piece.group !== 'spare').map((piece) => ({ op: 'move' as const, pieceId: piece.id, zoneId: 'bar' })),
    });
  }
  const total = int(rand, gentle > 0 ? 4 : 6, gentle > 0 ? 8 : 10);
  const known = int(rand, 2, total - 2);
  const unknown = total - known;
  const pieces: Piece[] = Array.from({ length: total + 1 }, (_, i) => ({ id: `b${i}`, art: 'block', tone: i < known ? 0 : 1 }));
  const initial: Record<string, string> = {};
  pieces.slice(0, known).forEach((piece, i) => {
    initial[piece.id] = `slot${i}`;
  });
  const counts: Record<string, number> = {};
  const zones = slots(total, 'slot', 'bar');
  for (let i = 0; i < total; i++) counts[`slot${i}`] = 1;
  return pack(topic, 'bar-model', salt, {
    prompt: `${counted(known, 'moth')} ${known === 1 ? 'is' : 'are'} resting on the story bar. More arrive until there are ${total}. Fill the empty part.`,
    hints: hints(
      'The whole bar is the total.',
      'The filled part is what you already know.',
      'The empty boxes are the missing part. Fill each one.',
    ),
    walkthrough: [`The bar holds ${total}.`, `${known} are already there.`, `I fill ${unknown} more boxes.`],
    pieces,
    zones,
    initial,
    goal: { kind: 'zone-counts', counts },
    solution: pieces.slice(known, total).map((piece, i) => ({ op: 'move' as const, pieceId: piece.id, zoneId: `slot${known + i}` })),
  });
}

function graph(topic: Topic, rand: () => number, salt: string): Item {
  const name = topic.name.toLowerCase();
  const cats: { id: string; art: Art; label: string; n: number }[] = [
    { id: 'moth', art: 'moth', label: 'Moths', n: int(rand, 1, gentle > 0 ? 3 : 5) },
    { id: 'frog', art: 'frog', label: 'Frogs', n: int(rand, 1, gentle > 0 ? 3 : 5) },
    { id: 'owl', art: 'owl', label: 'Owls', n: int(rand, 1, gentle > 0 ? 2 : 4) },
  ];
  if (/reading|comparing bar|tables/.test(name)) {
    const ask = pick(rand, cats);
    const wrongs = [ask.n + 1, Math.max(0, ask.n - 1), cats.find((cat) => cat.id !== ask.id)!.n].filter((n) => n !== ask.n);
    return choice(topic, 'graph', salt, `The pictogram is finished. How many ${ask.label.toLowerCase()} visited?`, [
      'Each picture stands for one visitor.',
      `Count only the ${ask.label.toLowerCase()} column.`,
    ], String(ask.n), [...new Set(wrongs)].map(String).slice(0, 3), hints(
      'Find the right column first.',
      'Each little picture counts as one.',
      'Count them with your finger.',
    ), [`I look at the ${ask.label} column and count the pictures.`]);
  }
  const pieces: Piece[] = [];
  const counts: Record<string, number> = {};
  const zones: Zone[] = cats.map((cat) => ({ id: `col-${cat.id}`, role: 'column', label: cat.label, capacity: 8 }));
  for (const cat of cats) {
    counts[`col-${cat.id}`] = cat.n;
    for (let i = 0; i < cat.n; i++) pieces.push({ id: `${cat.id}${i}`, art: cat.art, group: cat.id });
  }
  return pack(topic, 'graph', salt, {
    prompt: `Build a pictogram: ${cats.map((cat) => counted(cat.n, cat.label.toLowerCase().replace(/s$/, ''), cat.label.toLowerCase())).join(', ')}.`,
    hints: hints(
      'Each creature has its own column.',
      'Stack one picture for each visitor.',
      'Match the picture to the column name.',
    ),
    walkthrough: cats.map((cat) => `I stack ${counted(cat.n, cat.label.toLowerCase().replace(/s$/, ''), cat.label.toLowerCase())}.`),
    pieces,
    zones,
    initial: {},
    goal: { kind: 'zone-counts', counts },
    solution: pieces.map((piece) => ({ op: 'move' as const, pieceId: piece.id, zoneId: `col-${piece.group}` })),
  });
}

function coordinate(topic: Topic, rand: () => number, salt: string): Item {
  let x = int(rand, 0, gentle > 0 ? 3 : 5);
  let y = int(rand, 0, gentle > 0 ? 3 : 5);
  if (x === 0 && y === 0) x = 2;
  const zones: Zone[] = [];
  for (let row = 0; row <= 5; row++) {
    for (let col = 0; col <= 5; col++) {
      zones.push({ id: `c${col}-${row}`, role: 'grid', row, col, capacity: 1, label: `${col},${row}` });
    }
  }
  return pack(topic, 'coordinate', salt, {
    prompt: `Plant the starflower at (${x}, ${y}). Go across ${x}, then up ${y}.`,
    hints: hints(
      'The first number is across from the corner.',
      'The second number is up from the corner.',
      'The corner where both numbers are 0 is the start.',
    ),
    walkthrough: [`I step across to ${x}.`, `Then I step up to ${y}.`, `The star sits at (${x}, ${y}).`],
    pieces: [{ id: 'star', art: 'star' }],
    zones,
    initial: {},
    goal: { kind: 'piece-at', pieceId: 'star', zoneId: `c${x}-${y}` },
    solution: [{ op: 'move', pieceId: 'star', zoneId: `c${x}-${y}` }],
  });
}

function angle(topic: Topic, rand: () => number, salt: string): Item {
  const name = topic.name.toLowerCase();
  let degrees = 90;
  let prompt = 'Turn the wand until it makes a right angle, like the corner of a book.';
  if (/straight|half turn/.test(name)) {
    degrees = 180;
    prompt = 'Turn the wand into a straight line, a half turn.';
  } else if (/acute|estimating angles/.test(name)) {
    degrees = pick(rand, [30, 45, 60]);
    prompt = `Open a narrow acute angle. Aim for ${degrees} degrees, smaller than a book corner.`;
  } else if (/obtuse/.test(name)) {
    degrees = pick(rand, [120, 135, 150]);
    prompt = `Open an obtuse angle, wider than a book corner. Aim for ${degrees} degrees.`;
  } else if (/full|complete turn|360/.test(name)) {
    degrees = 270;
    prompt = 'Turn the wand three quarters of the way around the circle.';
  } else if (band(topic) >= 2 && rand() < 0.5) {
    degrees = pick(rand, [45, 90, 180, 270]);
    prompt = degrees === 90 ? prompt : `Turn the wand to ${degrees} degrees.`;
  }
  return pack(topic, 'angle', salt, {
    prompt,
    hints: hints(
      'Grab the wand and turn it around the gold dot.',
      degrees === 90 ? 'A right angle is a square corner.' : 'The little numbers on the arc can help.',
      'Let go when the opening matches the spell. It snaps gently.',
    ),
    walkthrough: [degrees === 90 ? 'A right angle is 90 degrees, a square corner.' : `The opening should be ${degrees} degrees.`],
    pieces: [],
    zones: [],
    initial: {},
    angleStart: 0,
    goal: { kind: 'angle', degrees },
    solution: [{ op: 'angle', degrees }],
  });
}

function chance(topic: Topic, rand: () => number, salt: string): Item {
  const name = topic.name.toLowerCase();
  const pieces: Piece[] = [
    ...Array.from({ length: 4 }, (_, i) => ({ id: `b${i}`, art: 'marble' as const, group: 'blue', tone: 0, label: 'blue' })),
    ...Array.from({ length: 4 }, (_, i) => ({ id: `g${i}`, art: 'marble' as const, group: 'gold', tone: 1, label: 'gold' })),
  ];
  const pouch: Zone = { id: 'pouch', role: 'pouch', label: 'Pouch', capacity: 8 };
  if (/equally|fair/.test(name)) {
    return pack(topic, 'chance', salt, {
      prompt: 'Put marbles in the pouch so blue and gold are equally likely. Use at least one of each.',
      hints: hints(
        'Equally likely means the same number of each colour.',
        'Start with one blue and one gold.',
        'You can add more, as long as the colours still match.',
      ),
      walkthrough: ['I choose the same number of blue and gold.', 'Two of each is a fair pouch.'],
      pieces,
      zones: [pouch],
      initial: {},
      goal: { kind: 'equal', groups: ['blue', 'gold'], zoneId: 'pouch', min: 1 },
      solution: [
        { op: 'move', pieceId: 'b0', zoneId: 'pouch' },
        { op: 'move', pieceId: 'b1', zoneId: 'pouch' },
        { op: 'move', pieceId: 'g0', zoneId: 'pouch' },
        { op: 'move', pieceId: 'g1', zoneId: 'pouch' },
      ],
    });
  }
  if (/impossible|certain|language|likelihood|0-to-1|scale|sum to one/.test(name) && rand() < 0.5) {
    return pack(topic, 'chance', salt, {
      prompt: 'Make gold impossible. Fill the pouch with only blue marbles. Use four of them.',
      hints: hints(
        'Impossible means it cannot happen.',
        'If every marble is blue, gold cannot be drawn.',
        'Four blue marbles, and no gold.',
      ),
      walkthrough: ['Gold is impossible when there are no gold marbles.', 'I put four blue marbles in the pouch.'],
      pieces,
      zones: [pouch],
      initial: {},
      goal: { kind: 'mix', counts: { blue: 4 }, zonePrefix: 'pouch' },
      solution: ['b0', 'b1', 'b2', 'b3'].map((id) => ({ op: 'move' as const, pieceId: id, zoneId: 'pouch' })),
    });
  }
  const gold = 1;
  const blue = int(rand, 2, 4);
  return pack(topic, 'chance', salt, {
    prompt: `Fill the pouch with ${gold} gold marble and ${blue} blue marbles.`,
    hints: hints(
      'Gold marbles and blue marbles are different.',
      `Count ${gold} gold first.`,
      `Then add ${blue} blue.`,
    ),
    walkthrough: [`${gold} gold goes in.`, `${blue} blue join it.`],
    pieces,
    zones: [pouch],
    initial: {},
    goal: { kind: 'mix', counts: { gold, blue }, zonePrefix: 'pouch' },
    solution: [
      { op: 'move', pieceId: 'g0', zoneId: 'pouch' },
      ...Array.from({ length: blue }, (_, i) => ({ op: 'move' as const, pieceId: `b${i}`, zoneId: 'pouch' })),
    ],
  });
}

function choice(
  topic: Topic,
  template: TemplateId,
  salt: string,
  prompt: string,
  example: string[],
  correct: string,
  wrongs: string[],
  hint: [string, string, string],
  walk: string[],
): Item {
  const rand = rng(`${salt}:mix`);
  const rows = [{ label: correct, ok: true }];
  for (const label of wrongs) {
    if (label !== correct && rows.length < 4 && !rows.some((row) => row.label === label)) rows.push({ label, ok: false });
  }
  const fillers = ['Look only at the pictures', 'Skip the question', 'Pick the biggest number', 'Hide the working'];
  for (const label of fillers) {
    if (rows.length >= 4) break;
    if (!rows.some((row) => row.label === label)) rows.push({ label, ok: false });
  }
  const shuffled = shuffle(rand, rows);
  const choices = shuffled.map((row, i) => ({ id: `c${i}`, label: row.label }));
  const correctId = choices[shuffled.findIndex((row) => row.ok)]!.id;
  return pack(topic, template, salt, {
    prompt,
    hints: hint,
    walkthrough: walk,
    example,
    pieces: [],
    zones: [],
    initial: {},
    choices,
    goal: { kind: 'choice', id: correctId },
    solution: [{ op: 'tap', id: correctId }],
  });
}

function fallback(topic: Topic, rand: () => number, salt: string): Item {
  const name = topic.name.toLowerCase();
  const evidence = topic.evidence[0] || topic.description;
  if (/order of operations/.test(name)) {
    return choice(topic, 'fallback', salt, 'What is 5 + 2 × 3?', [
      'Multiply before you add.',
      'In 2 + 3 × 4, the 3 × 4 happens first, so 2 + 12 = 14.',
    ], '11', ['21', '10', '7'], hints('Look for the multiplication first.', '2 × 3 is 6.', 'Then add the 5.'), ['5 + 2 × 3 means 5 + 6.', 'That is 11.']);
  }
  if (/bracket/.test(name)) {
    return choice(topic, 'fallback', salt, 'What is 3 × (4 + 1)?', [
      'Brackets are a nest. Work inside them first.',
      '2 × (3 + 1) is 2 × 4, which is 8.',
    ], '15', ['13', '12', '7'], hints('The brackets come first.', '4 + 1 is 5.', 'Then 3 groups of 5.'), ['Inside the brackets, 4 + 1 = 5.', '3 × 5 = 15.']);
  }
  if (/roman/.test(name)) {
    return choice(topic, 'fallback', salt, 'What number is IX?', [
      'I before V or X means one less.',
      'IV means 4. VI means 6.',
    ], '9', ['11', '10', '4'], hints('I before X means one less than ten.', 'X is 10.', 'One less than 10 is 9.'), ['IX is one less than ten.', 'That is 9.']);
  }
  if (/mean|average/.test(name)) {
    return choice(topic, 'fallback', salt, 'What is the mean of 3, 5 and 7?', [
      'The mean is the fair share: add, then divide by how many numbers.',
      'The mean of 2, 4 and 6 is (2+4+6) ÷ 3 = 4.',
    ], '5', ['15', '4', '7'], hints('Add the three numbers.', '3 + 5 + 7 is 15.', 'Share 15 into 3 equal parts.'), ['3 + 5 + 7 = 15.', '15 ÷ 3 = 5.']);
  }
  if (/prime/.test(name)) {
    return choice(topic, 'fallback', salt, 'Which of these is a prime number?', [
      'A prime has exactly two factors: 1 and itself.',
      '7 is prime. 9 is not, because 3 × 3 = 9.',
    ], '11', ['9', '15', '1'], hints('Check whether something other than 1 multiplies to make it.', '9 is 3 × 3, so it is not prime.', '11 cannot be split that way.'), ['11 has no factors except 1 and 11.', 'So 11 is prime.']);
  }
  if (/like terms|collecting/.test(name)) {
    return choice(topic, 'fallback', salt, '3 pink sparks join 2 more pink sparks. How many pink sparks?', [
      'Things that match can be counted together.',
      '4 blue sparks and 1 blue spark make 5 blue sparks.',
    ], '5', ['6', '3', '2'], hints('They are the same kind, so they can join.', 'Start with 3.', 'Count on 2 more.'), ['3 pink sparks are here.', '2 more join them.', 'That is 5 pink sparks.']);
  }
  if (/expand/.test(name)) {
    return choice(topic, 'fallback', salt, 'Expand 3(x + 2).', [
      'Multiply the outside number by each term inside.',
      '2(x + 4) = 2x + 8.',
    ], '3x + 6', ['3x + 2', 'x + 6', '5x'], hints('3 multiplies both the x and the 2.', '3 times x is 3x.', '3 times 2 is 6.'), ['3(x + 2) = 3×x + 3×2.', 'That is 3x + 6.']);
  }
  if (/vocabulary|notation|language|communication|reasoning|strategy|working|sense of|precision|argument|modelling|generalising|choosing/.test(name) || topic.type === 'META' || topic.type === 'LANGUAGE') {
    const scene = evidence.length > 140 ? `${evidence.slice(0, 137)}…` : evidence;
    return choice(
      topic,
      'fallback',
      salt,
      `Which habit best shows “${topic.name}”?`,
      [topic.description.split('. ')[0] ?? topic.description, `One way to show it: ${scene}`],
      scene,
      [
        'Guess the biggest number and move on',
        'Hide the counters so nobody can see',
        'Skip any part that feels new',
      ],
      hints('Think about what a careful mathematician does.', 'The example is a clue.', 'Choose the habit that matches the idea, not a shortcut.'),
      ['The idea is about sense-making, not speed.', 'The matching habit is the one in the example.'],
    );
  }
  const a = int(rand, gentle > 0 ? 1 : 2, gentle > 0 ? 5 : 9);
  const c = int(rand, gentle > 0 ? 1 : 2, gentle > 0 ? Math.max(1, 4 - gentle) : 9);
  const sum = a + c;
  return choice(
    topic,
    'fallback',
    salt,
    `${topic.name}: what is ${a} + ${c}?`,
    [`A smaller one: 2 + 3 = 5, because we count on three from 2.`, topic.description.split('. ')[0] ?? topic.name],
    String(sum),
    [String(sum + 1), String(Math.max(0, sum - 1)), String(a * c)],
    hints('You can count on from the first number.', `Start at ${a}.`, 'Count the second number of hops.'),
    [`Start at ${a}.`, `Count on ${c}.`, `You land on ${sum}.`],
  );
}
