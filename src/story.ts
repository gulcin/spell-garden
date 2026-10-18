export type Reward = {
  id: string;
  kind: 'friend' | 'sparkle' | 'decor';
  name: string;
  line: string;
};

export const REWARDS: Reward[] = [
  { id: 'moth', kind: 'friend', name: 'Nim the moss-moth', line: 'Nim the moss-moth wakes, stretches speckled wings, and chooses your shoulder.' },
  { id: 'lantern-glow', kind: 'sparkle', name: 'Lantern Glow', line: 'You learn Lantern Glow, a soft spell that warms sleepy lights.' },
  { id: 'frog', kind: 'friend', name: 'Pebble the brook frog', line: 'Pebble hops from the brook, blinks once, and stays to listen.' },
  { id: 'vine', kind: 'decor', name: 'Window vine', line: 'A tiny vine curls around your tower window and opens one star-flower.' },
  { id: 'owl', kind: 'friend', name: 'Teacup the loft owl', line: 'Teacup the loft owl yawns, then tucks a ribbon beside your books.' },
  { id: 'bridge-mend', kind: 'sparkle', name: 'Bridge Mend', line: 'You learn Bridge Mend. Loose planks knit themselves with golden thread.' },
  { id: 'bunny', kind: 'friend', name: 'Moss-bunny', line: 'A moss-bunny thumps once, softly, and settles beside your kettle.' },
  { id: 'rug', kind: 'decor', name: 'Moon rug', line: 'A round moon rug unfurls on the tower floor.' },
  { id: 'beetle', kind: 'friend', name: 'Lumen the lantern beetle', line: 'Lumen lights a gentle gold and circles your wand.' },
  { id: 'kettle', kind: 'decor', name: 'Star kettle', line: 'A star kettle appears, humming, ready for warm petal tea.' },
  { id: 'kitten', kind: 'friend', name: 'Cloud kitten', line: 'A cloud kitten drifts down, purrs, and curls on the moon rug.' },
  { id: 'banner', kind: 'decor', name: 'Kindness banner', line: 'A banner stitched with tiny sums hangs above your door.' },
];

export type Chapter = {
  id: string;
  title: string;
  intro: string;
  rewardId: string;
};

export const CHAPTERS: Chapter[] = [
  { id: 'lanterns', title: 'The sleepy lanterns', intro: 'The garden lanterns have nodded off. Each true spell wakes one with a warm glow.', rewardId: 'moth' },
  { id: 'brook', title: 'The lily brook', intro: 'A few planks of the brook bridge are loose. Careful maths will mend them kindly.', rewardId: 'lantern-glow' },
  { id: 'kitchen', title: 'The potion kitchen', intro: 'The bottles are waiting. Sharing, pouring, and counting will fill them evenly.', rewardId: 'frog' },
  { id: 'greenhouse', title: 'The crystal greenhouse', intro: 'Crystal seedlings want neat rows. You can help them grow.', rewardId: 'vine' },
  { id: 'loft', title: 'The star-moth loft', intro: 'Up in the loft, a clock and a pile of spark-coins need a gentle sort.', rewardId: 'owl' },
  { id: 'gate', title: 'The garden gate', intro: 'The gate remembers patterns. Finish them and it opens without a creak.', rewardId: 'bridge-mend' },
  { id: 'kettle', title: 'Petal tea', intro: 'Someone left the scales unbalanced. A quiet spell will set them level.', rewardId: 'bunny' },
  { id: 'rug', title: 'The moon rug', intro: 'Shapes and mirrors are hiding in the rug. Find the ones that match.', rewardId: 'rug' },
  { id: 'beetle', title: 'Lumen’s walk', intro: 'A lantern beetle is almost awake. Fractions of pie will do it kindly.', rewardId: 'beetle' },
  { id: 'window', title: 'The tower window', intro: 'From the window you can see number-lilies all along the brook.', rewardId: 'kettle' },
  { id: 'cloud', title: 'A small cloud', intro: 'A cloud has come to visit. It likes fair shares and tidy tens.', rewardId: 'kitten' },
  { id: 'door', title: 'The painted door', intro: 'The door wants one more chapter of kind magic before bedtime.', rewardId: 'banner' },
];

export function nextReward(earned: string[]): Reward {
  return REWARDS.find((reward) => !earned.includes(reward.id)) ?? REWARDS[earned.length % REWARDS.length]!;
}

export function chapterFor(sessionsFinished: number): Chapter {
  return CHAPTERS[sessionsFinished % CHAPTERS.length]!;
}

export const DEMO_LINE: Record<string, string> = {
  'ten-frame': 'Watch a spark glide into an empty box. One box holds one spark.',
  'number-line': 'The frog hops from lily to lily. Drag it, or tap the lily you want.',
  'base-ten': 'A little cube is one. A rod is ten cubes snapped together. A flat is a hundred.',
  sharing: 'Drag the gems so each jar gets the same number.',
  array: 'Crystals grow in neat rows. Fill the rows the spell asks for.',
  fraction: 'Tap slices of the pie or bar to colour exactly the part you need.',
  coins: 'Drag spark-coins onto the shopkeeper’s palm until the price is exact.',
  clock: 'The short hand is the hour. The long hand is the minutes. Turn them slowly.',
  balance: 'Add stones until both pans hang level, or until the missing number fits.',
  measure: 'Lay one plank in each space up to the star flag. That is how you measure.',
  shapes: 'Tap each shape the spell names. Tap again if you change your mind.',
  symmetry: 'The right side should mirror the left. Tap the squares that finish it.',
  pattern: 'Look at what repeats, then drag the tile that comes next.',
  sort: 'Drag each tile into the hoop where it belongs.',
  'bar-model': 'The bar is the whole story. Fill only the empty part.',
  graph: 'Stack the creatures in their own columns, one picture for each visitor.',
  coordinate: 'Across first, then up. Drag the starflower to that square.',
  angle: 'Turn the wand around the dot until the opening matches the spell.',
  chance: 'Drag marbles into the pouch so the colours match the story.',
  fallback: 'Read the little example. Then tap the answer that fits the new question.',
};
