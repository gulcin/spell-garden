import { classify } from '../curriculum/classify.ts';
import type { Topic } from '../curriculum/types.ts';

/** Aida is in grade 3. Spell beds lead with this age. */
export const GRADE_3_AGE = 8;

const PLAY: Record<string, string> = {
  shapes: 'Tap the shapes that match.',
  symmetry: 'Finish the mirror picture.',
  coordinate: 'Find the spot on the grid.',
  angle: 'Turn the wand to the angle.',
  pattern: 'Continue the pattern.',
  sort: 'Sort them into the right place.',
  graph: 'Read the little picture graph.',
  fraction: 'Share the shape into fair pieces.',
  measure: 'Compare the lengths.',
  'ten-frame': 'Count the sparks in the frame.',
  'number-line': 'Hop along the number line.',
  'base-ten': 'Build the number with blocks.',
  sharing: 'Share the gems fairly.',
  array: 'Make the rows of crystals.',
  coins: 'Count the coins.',
  clock: 'Set the garden clock.',
  balance: 'Balance the two sides.',
  'bar-model': 'Fill the story bar.',
  chance: 'See what might come out of the pouch.',
  fallback: 'Pick the answer that fits.',
};

export function kidSpellName(name: string): string {
  return name.replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
}

function ageDistance(topic: Topic, age: number): number {
  if (topic.ageRangeStart <= age && topic.ageRangeEnd >= age) return 0;
  if (topic.ageRangeStart > age) return topic.ageRangeStart - age;
  return 50 + (age - topic.ageRangeEnd);
}

/** Grade-matching spells first, then the next grades, then younger ones. */
export function sortSpells(topics: Topic[], age = GRADE_3_AGE): Topic[] {
  return [...topics].sort((a, b) => {
    const distance = ageDistance(a, age) - ageDistance(b, age);
    if (distance !== 0) return distance;
    if (a.ageRangeStart !== b.ageRangeStart) return b.ageRangeStart - a.ageRangeStart;
    return kidSpellName(a.name).localeCompare(kidSpellName(b.name)) || a.name.localeCompare(b.name);
  });
}

export function kidDomainTitle(domain: string): string {
  switch (domain) {
    case 'Geometry':
      return 'Shapes and space';
    case 'Addition & Subtraction':
      return 'Adding and taking away';
    case 'Multiplication & Division':
      return 'Groups and sharing';
    case 'Fractions':
      return 'Fair shares';
    case 'Measurement':
      return 'Length, time, and weight';
    case 'Counting & Cardinality':
      return 'Counting';
    case 'Number Representation & Place Value':
      return 'Tens and ones';
    case 'Data & Statistics':
      return 'Pictures of data';
    case 'Probability':
      return 'What might happen';
    case 'Ratio & Proportion':
      return 'Mixing fairly';
    case 'Algebra':
      return 'Missing numbers';
    case 'Mathematical Thinking':
      return 'Thinking it through';
    default:
      return domain;
  }
}

export function kidDomainLede(domain: string, name: string): string {
  const who = name.trim() || 'Aida';
  switch (domain) {
    case 'Geometry':
      return `${who}, tap a spell. Find a shape, build one, or say where it sits.`;
    default:
      return `${who}, tap a spell and play it.`;
  }
}

export function kidSpellBlurb(topic: Topic): string {
  const name = topic.name.toLowerCase();
  if (/positional|position, direction/.test(name)) return 'Say where the frog is sitting.';
  if (/turn|describing movement/.test(name)) return 'Turn and see which way you face.';
  if (/symmetry/.test(name)) return 'Find the mirror line.';
  if (/2-d shapes/.test(name)) return 'Tap the flat shapes that match.';
  if (/3-d|solid|nets|faces|vertices/.test(name)) return 'Spot the solid shapes.';
  if (/coordinate|grid|plot/.test(name)) return 'Find the spot on the grid.';
  if (/angle/.test(name)) return 'Look at the corner.';
  if (/circle/.test(name)) return 'Find the round shapes.';
  if (/parallel|perpendicular/.test(name)) return 'Find the lines that match.';
  return PLAY[classify(topic)] ?? 'Tap to play this spell.';
}
