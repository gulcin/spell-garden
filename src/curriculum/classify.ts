import type { Topic } from './types.ts';

export type TemplateId =
  | 'ten-frame'
  | 'number-line'
  | 'base-ten'
  | 'sharing'
  | 'array'
  | 'fraction'
  | 'coins'
  | 'clock'
  | 'balance'
  | 'measure'
  | 'shapes'
  | 'symmetry'
  | 'pattern'
  | 'sort'
  | 'bar-model'
  | 'graph'
  | 'coordinate'
  | 'angle'
  | 'chance'
  | 'fallback';

export const TEMPLATE_LABEL: Record<TemplateId, string> = {
  'ten-frame': 'Ten-frame sparks',
  'number-line': 'Frog on the number line',
  'base-ten': 'Base-ten blocks',
  sharing: 'Sharing gems',
  array: 'Crystal arrays',
  fraction: 'Potion pies and bars',
  coins: 'Spark coins',
  clock: 'Garden clock',
  balance: 'Balance scale',
  measure: 'Planks and lengths',
  shapes: 'Shape sorting',
  symmetry: 'Mirror garden',
  pattern: 'Spell patterns',
  sort: 'Sorting hoops',
  'bar-model': 'Story bars',
  graph: 'Pictogram stacks',
  coordinate: 'Starflower grid',
  angle: 'Wand angles',
  chance: 'Marble pouch',
  fallback: 'Guided story choice',
};

/** Templates a child solves by dragging, not only by tapping a choice. */
export const DRAG_TEMPLATES: TemplateId[] = [
  'ten-frame',
  'number-line',
  'base-ten',
  'sharing',
  'array',
  'coins',
  'clock',
  'balance',
  'measure',
  'pattern',
  'sort',
  'bar-model',
  'graph',
  'coordinate',
  'angle',
  'chance',
];

export function isDragTemplate(id: TemplateId): boolean {
  return DRAG_TEMPLATES.includes(id);
}

export function isManipulative(id: TemplateId): boolean {
  return id !== 'fallback';
}

function has(name: string, re: RegExp): boolean {
  return re.test(name);
}

/**
 * Best-fit activity for a Marble maths topic.
 * Specific phrases win, then the domain default. Meta and late-algebra
 * topics that have no honest manipulative land on the guided fallback.
 */
export function classify(topic: Topic): TemplateId {
  const n = topic.name.toLowerCase();
  const d = topic.domain;

  if (has(n, /symmetry|reflecting/)) return 'symmetry';
  if (has(n, /coin|pence|pound|giving change|working with money|estimating and comparing money/)) return 'coins';
  if (has(n, /money/)) return 'coins';

  if (has(n, /days, weeks|ordering events|calendar facts|comparing durations/)) return 'fallback';
  if (has(n, /clock|telling time|12-hour|24-hour|minutes in an hour|time duration|comparing time|sequence intervals/)) {
    return 'clock';
  }

  if (has(n, /angle|degrees and turns|turns & directions|right angles/)) return 'angle';

  if (has(n, /quadratic|simultaneous|linear function graphs|proportion graphs/)) return 'fallback';
  if (has(n, /coordinate|plotting|quadrant/)) return 'coordinate';

  if (has(n, /mean|scatter|line graph|statistical analysis/)) return 'fallback';
  if (has(n, /pictogram|tally|bar graph|reading tables|sorting data|sorting into categor/)) return 'graph';

  if (has(n, /venn|tree diagram|complementary|probability|likelihood|chance/)) return 'chance';

  if (has(n, /odd and even|odd or even/)) return 'sort';
  if (has(n, /pattern|sequences|sequence|nth-term/)) return 'pattern';

  if (has(n, /decimal & percent notation|fraction notation/) && topic.type === 'LANGUAGE') return 'fallback';
  if (has(n, /fraction|half|quarter|tenth|decimal|percent|mixed number|improper|simplifying fractions/)) {
    return 'fraction';
  }

  if (has(n, /proportional reasoning vocabulary/)) return 'fallback';
  if (has(n, /ratio|proportion|similar shape|scale and similar|dividing quantities|bar model|one quantity as a fraction|compound units/)) {
    return 'bar-model';
  }

  if (has(n, /order of operations|brackets|factorising|expanding|like terms|sign rules|algebraic notation|expressions & equations vocabulary|systematic listing|writing algebraic|writing number sentences|estimation to check/)) {
    return 'fallback';
  }

  if (has(n, /remainder|equal sharing|division as|dividing|unknown factor|what division/)) return 'sharing';
  if (has(n, /array|times table|multiplication|factor|prime|square and cube|commutative|rows & columns|area by tiling|area and the distributive|multiplicative/)) {
    if (has(n, /long multiplication|division with decimals|dividing by two-digit/)) {
      return has(n, /divis/) ? 'sharing' : 'array';
    }
    return 'array';
  }

  if (has(n, /conversion|miles & kilometres|metric & imperial|powers of ten notation|number sets/)) {
    if (has(n, /length|measuring length|perimeter/)) return 'measure';
    if (topic.ageRangeStart >= 11 && has(n, /conversion|miles|metric|notation|number sets/)) return 'fallback';
  }

  if (has(n, /mass|weight/)) return 'balance';
  if (has(n, /perimeter|area|volume|capacity|liquid|length|height|measuring & plotting|unit cube/)) return 'measure';

  if (has(n, /positional language|position, direction/)) return 'fallback';
  if (has(n, /shape|polygon|circle|triangle|quadrilateral|3-d|2-d|faces|edges, vertices|parallel|perpendicular|nets|flat vs solid|composing|combining simple/)) {
    return 'shapes';
  }

  if (has(n, /roman numeral|number words|number sets & infinity/)) return 'fallback';
  if (has(n, /negative|temperature/)) return 'number-line';
  if (has(n, /rounding|estimat/)) return 'number-line';
  if (has(n, /place value|digit|ten is|hundred is|ordering numbers|comparing large numbers|comparing and ordering numbers|more or less|reading and writing numbers|teen numbers|powers of ten|multiples of 10|multiples of 100|numbers to |representing numbers$/)) {
    return 'base-ten';
  }

  if (has(n, /number line|skip count|counting in|counting forwards|counting within|one more|rote counting|two written numerals/)) {
    return 'number-line';
  }

  if (has(n, /comparing groups|more or fewer/)) return 'sort';
  if (has(n, /how many|one-to-one|representing numbers with objects/)) return 'ten-frame';

  if (has(n, /missing number|unknown in addition|equals sign|inverse: addition/)) return 'balance';
  if (has(n, /word problem|two-step/)) return 'bar-model';
  if (has(n, /number bond|bonds|pairs|combining|taking away|putting together|within 5|within 10\b|fluent adding and subtracting within 10|addition in any order|grouping numbers/)) {
    return 'ten-frame';
  }
  if (has(n, /add|subtract|fluent/)) {
    if (has(n, /within 20/)) return 'ten-frame';
    if (topic.ageRangeStart >= 7 || has(n, /100|1000|tens|hundreds|two-digit|three-digit/)) return 'base-ten';
    return 'ten-frame';
  }

  if (has(n, /sort|categor/)) return 'sort';

  switch (d) {
    case 'Counting & Cardinality':
      return 'ten-frame';
    case 'Addition & Subtraction':
      return topic.ageRangeStart >= 7 ? 'base-ten' : 'ten-frame';
    case 'Multiplication & Division':
      return has(n, /divis|sharing|remain/) ? 'sharing' : 'array';
    case 'Fractions':
      return 'fraction';
    case 'Number Representation & Place Value':
      return 'base-ten';
    case 'Measurement':
      return 'measure';
    case 'Geometry':
      return 'shapes';
    case 'Data & Statistics':
      return 'graph';
    case 'Algebra':
      return topic.ageRangeStart <= 11 ? 'pattern' : 'fallback';
    case 'Ratio & Proportion':
      return 'bar-model';
    case 'Probability':
      return 'chance';
    default:
      return 'fallback';
  }
}
