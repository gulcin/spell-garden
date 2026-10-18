export type QuestKind = 'puzzle' | 'worth' | 'colour' | 'house';

export type TalkChoice = { id: string; label: string; ok?: boolean };

export type TalkQuestion = {
  id: string;
  kind: 'maths' | 'story';
  prompt: string;
  choices: TalkChoice[];
  praise: string;
  nudge: string;
};

export type PersonQuest = {
  id: string;
  kind: QuestKind;
  goal: number;
  /** What she is collecting, for the waiting line. */
  unit: string;
  offer: string;
  /** Short phrase for the storybook when she accepts. */
  bookAsk: string;
  done: string;
  reward: number;
};

export type Person = {
  id: string;
  placeId: string;
  name: string;
  role: string;
  blurb: string;
  hello: string;
  again: string;
  memory: string;
  hint: string;
  questions: TalkQuestion[];
  quest: PersonQuest;
};

export const PEOPLE: Person[] = [
  {
    id: 'bram',
    placeId: 'lantern-grove',
    name: 'Bram',
    role: 'lantern-keeper',
    blurb: 'Patient, and fond of a steady light.',
    hello: 'Hello, {name}. I am Bram. I keep the lanterns lit. I like {outfit}.',
    again: '{name}, the lanterns remember you. This is {visit}. I like {outfit}.',
    memory: 'the lanterns remember you',
    hint: 'Count on as you light each lantern. The path gets brighter one by one.',
    questions: [
      {
        id: 'bram-sum',
        kind: 'maths',
        prompt: 'I lit 2 lanterns, then 3 more. How many glow now?',
        choices: [
          { id: '4', label: '4' },
          { id: '5', label: '5', ok: true },
          { id: '6', label: '6' },
        ],
        praise: 'Yes. Five lanterns, glowing in a row.',
        nudge: 'Count them on your fingers. Two, then three more.',
      },
      {
        id: 'bram-story',
        kind: 'story',
        prompt: 'When evening comes, what do the lanterns do?',
        choices: [
          { id: 'glow', label: 'They glow softly', ok: true },
          { id: 'hide', label: 'They hide' },
          { id: 'sleep', label: 'They go out' },
        ],
        praise: 'They glow, soft and steady, so the path stays kind.',
        nudge: 'They stay put and glow. That is their whole job.',
      },
    ],
    quest: {
      id: 'bram-lanterns',
      kind: 'puzzle',
      goal: 5,
      unit: 'lanterns',
      offer: 'Please light 5 lanterns for me. Each spell you finish here lights one.',
      bookAsk: 'light 5 lanterns',
      done: 'Five lanterns. The path is bright.',
      reward: 2,
    },
  },
  {
    id: 'nanna',
    placeId: 'potion-cottage',
    name: 'Nanna Bramble',
    role: 'potion brewer',
    blurb: 'She hums, and her kettle smells of honey.',
    hello: 'Hello, {name}. I am Nanna Bramble. I brew flower tea, never anything cross. I like {outfit}.',
    again: '{name}, the kettle kept your seat warm. This is {visit}. I like {outfit}.',
    memory: 'the kettle kept your seat warm',
    hint: 'Read a potion one cup at a time. The kettle can wait.',
    questions: [
      {
        id: 'nanna-cups',
        kind: 'maths',
        prompt: 'The kettle wants 4 cups of water and 1 cup of honey. How many cups is that?',
        choices: [
          { id: '3', label: '3' },
          { id: '5', label: '5', ok: true },
          { id: '6', label: '6' },
        ],
        praise: 'Five cups. Four of water, and one sweet cup of honey.',
        nudge: 'Four, and then one more. Count the cups into the kettle.',
      },
      {
        id: 'nanna-story',
        kind: 'story',
        prompt: 'What does Nanna like to brew?',
        choices: [
          { id: 'tea', label: 'Flower tea', ok: true },
          { id: 'soup', label: 'Cold soup' },
          { id: 'air', label: 'Just air' },
        ],
        praise: 'Flower tea, with honey if you want it.',
        nudge: 'Flower tea. Warm, and easy to share.',
      },
    ],
    quest: {
      id: 'nanna-potions',
      kind: 'puzzle',
      goal: 3,
      unit: 'potions',
      offer: 'Please stir 3 potions with me. Each spell you finish here stirs one.',
      bookAsk: 'stir 3 potions',
      done: 'Three gentle potions, stirred and warm.',
      reward: 2,
    },
  },
  {
    id: 'cobble',
    placeId: 'crystal-cave',
    name: 'Cobble',
    role: 'crystal gnome',
    blurb: 'Cheerful, and he counts crystals like sweets.',
    hello: 'Hello, {name}. I am Cobble. I mind the blue crystals. I like {outfit}.',
    again: '{name}, the cave kept a glow for you. This is {visit}. I like {outfit}.',
    memory: 'the cave kept a glow for you',
    hint: 'Pink is 1, yellow is 5, blue is 10, and gold is 20.',
    questions: [
      {
        id: 'cobble-blue',
        kind: 'maths',
        prompt: 'A blue crystal is 10. How much are 3 blue crystals?',
        choices: [
          { id: '13', label: '13' },
          { id: '30', label: '30', ok: true },
          { id: '23', label: '23' },
        ],
        praise: 'Thirty. Ten and ten and ten.',
        nudge: 'Each blue one is 10. Three tens make 30.',
      },
      {
        id: 'cobble-story',
        kind: 'story',
        prompt: 'Where do Cobble’s crystals like to sit?',
        choices: [
          { id: 'pocket', label: 'In your pocket', ok: true },
          { id: 'shout', label: 'In a loud shout' },
          { id: 'boot', label: 'Under a boot' },
        ],
        praise: 'In your pocket, where you can count them.',
        nudge: 'In your pocket. They like a quiet place.',
      },
    ],
    quest: {
      id: 'cobble-blues',
      kind: 'worth',
      goal: 30,
      unit: 'in your pocket',
      offer: 'Please bring me 3 blue crystals. A blue one is 10, so that is 30. You may keep them.',
      bookAsk: 'bring a pocket worth 30, the same as 3 blue crystals',
      done: 'That pocket is worth enough for 3 blue crystals. They stay with you.',
      reward: 5,
    },
  },
  {
    id: 'wisp',
    placeId: 'observatory',
    name: 'Wisp',
    role: 'star gazer',
    blurb: 'Soft-voiced, and full of wonder about the sky.',
    hello: 'Hello, {name}. I am Wisp. I watch the stars. I like {outfit}.',
    again: '{name}, a star blinked when you arrived. This is {visit}. I like {outfit}.',
    memory: 'a star blinked when you arrived',
    hint: 'Look at one mark of the sky clock at a time.',
    questions: [
      {
        id: 'wisp-stars',
        kind: 'maths',
        prompt: '6 stars are out. 2 slip behind a cloud. How many can you still see?',
        choices: [
          { id: '4', label: '4', ok: true },
          { id: '8', label: '8' },
          { id: '3', label: '3' },
        ],
        praise: 'Four stars still showing. The cloud is only visiting.',
        nudge: 'Six take away two. Count what is left in the sky.',
      },
      {
        id: 'wisp-story',
        kind: 'story',
        prompt: 'What does a telescope help you do?',
        choices: [
          { id: 'see', label: 'See far things', ok: true },
          { id: 'tea', label: 'Make tea' },
          { id: 'dig', label: 'Dig in the garden' },
        ],
        praise: 'It helps you see far, quiet things.',
        nudge: 'It helps you see far things, like a small star.',
      },
    ],
    quest: {
      id: 'wisp-stars',
      kind: 'puzzle',
      goal: 4,
      unit: 'stars',
      offer: 'Please count 4 stars with me. Each spell you finish here counts one.',
      bookAsk: 'count 4 stars',
      done: 'Four stars, neatly counted.',
      reward: 2,
    },
  },
  {
    id: 'pebble',
    placeId: 'lily-pond',
    name: 'Pebble',
    role: 'frog ferryman',
    blurb: 'Hoppy, polite, and proud of his leaf boat.',
    hello: 'Hello, {name}. I am Pebble. I ferry friends across the lilies. I like {outfit}.',
    again: '{name}, the leaf boat kept your place. This is {visit}. I like {outfit}.',
    memory: 'the leaf boat kept your place',
    hint: 'Hop one lily, then count the pad where you landed.',
    questions: [
      {
        id: 'pebble-frogs',
        kind: 'maths',
        prompt: '3 frogs sit on one lily, and 2 sit on the next. How many frogs?',
        choices: [
          { id: '5', label: '5', ok: true },
          { id: '6', label: '6' },
          { id: '1', label: '1' },
        ],
        praise: 'Five frogs. Three and two.',
        nudge: 'Three on the first lily, two on the next. Add them.',
      },
      {
        id: 'pebble-story',
        kind: 'story',
        prompt: 'What does a ferryman do?',
        choices: [
          { id: 'carry', label: 'Carries friends across', ok: true },
          { id: 'hide', label: 'Hides the boat' },
          { id: 'clouds', label: 'Only counts clouds' },
        ],
        praise: 'He carries friends across, one hop at a time.',
        nudge: 'He carries friends across the water.',
      },
    ],
    quest: {
      id: 'pebble-hops',
      kind: 'puzzle',
      goal: 3,
      unit: 'hops',
      offer: 'Please ferry 3 hops with me. Each spell you finish here is one hop.',
      bookAsk: 'ferry 3 hops',
      done: 'Three hops, safe and dry.',
      reward: 2,
    },
  },
  {
    id: 'posy',
    placeId: 'greenhouse',
    name: 'Posy',
    role: 'gardener',
    blurb: 'She notices the smallest sprout.',
    hello: 'Hello, {name}. I am Posy. I water the sprouts. I like {outfit}.',
    again: '{name}, a sprout leaned toward the door. This is {visit}. I like {outfit}.',
    memory: 'a sprout leaned toward the door',
    hint: 'A sprout grows one leaf, then another. Count the leaves you can see.',
    questions: [
      {
        id: 'posy-seeds',
        kind: 'maths',
        prompt: '8 seeds are in the packet. I plant 3. How many seeds are left?',
        choices: [
          { id: '5', label: '5', ok: true },
          { id: '11', label: '11' },
          { id: '4', label: '4' },
        ],
        praise: 'Five seeds still in the packet.',
        nudge: 'Eight take away three. Count what is left in your hand.',
      },
      {
        id: 'posy-story',
        kind: 'story',
        prompt: 'What does a sprout need?',
        choices: [
          { id: 'water', label: 'Water and light', ok: true },
          { id: 'noise', label: 'A loud noise' },
          { id: 'hat', label: 'A wool hat' },
        ],
        praise: 'Water and light. A kind voice helps too.',
        nudge: 'Water and light. That is enough.',
      },
    ],
    quest: {
      id: 'posy-sprouts',
      kind: 'puzzle',
      goal: 4,
      unit: 'sprouts',
      offer: 'Please water 4 sprouts. Each spell you finish here waters one.',
      bookAsk: 'water 4 sprouts',
      done: 'Four sprouts, each with a drink.',
      reward: 2,
    },
  },
  {
    id: 'teacup',
    placeId: 'wizard-tower',
    name: 'Teacup',
    role: 'tower librarian',
    blurb: 'An owl who whispers, and loves a tidy shelf.',
    hello: 'Hello, {name}. I am Teacup. I keep the books in a soft order. I like {outfit}.',
    again: '{name}, your page was still marked. This is {visit}. I like {outfit}.',
    memory: 'your page was still marked',
    hint: 'Open the smallest sum first. The page tells you where you are.',
    questions: [
      {
        id: 'teacup-books',
        kind: 'maths',
        prompt: '10 books sit on the desk. I shelve 4. How many are left on the desk?',
        choices: [
          { id: '6', label: '6', ok: true },
          { id: '14', label: '14' },
          { id: '5', label: '5' },
        ],
        praise: 'Six books still on the desk.',
        nudge: 'Ten take away four. The shelf can hold the rest.',
      },
      {
        id: 'teacup-story',
        kind: 'story',
        prompt: 'How does Teacup like the library?',
        choices: [
          { id: 'quiet', label: 'Quiet and tidy', ok: true },
          { id: 'noisy', label: 'Very noisy' },
          { id: 'empty', label: 'With no books' },
        ],
        praise: 'Quiet and tidy, with room for one more story.',
        nudge: 'Quiet and tidy. That is the nicest shelf.',
      },
    ],
    quest: {
      id: 'teacup-shelf',
      kind: 'puzzle',
      goal: 3,
      unit: 'spells',
      offer: 'Please shelve 3 spells with me. Each spell you finish here shelves one.',
      bookAsk: 'shelve 3 spells',
      done: 'Three spells, shelved and peaceful.',
      reward: 2,
    },
  },
  {
    id: 'pip',
    placeId: 'mushroom-ring',
    name: 'Pip',
    role: 'mushroom fairy',
    blurb: 'She speaks for the fairies in the ring.',
    hello: 'Hello, {name}. I am Pip. Dot, Button, and I mind the mushroom ring. I like {outfit}.',
    again: '{name}, the fairies saved you a mushroom seat. This is {visit}. I like {outfit}.',
    memory: 'the fairies saved you a mushroom seat',
    hint: 'Count the caps in the ring, starting from the brightest.',
    questions: [
      {
        id: 'pip-caps',
        kind: 'maths',
        prompt: '4 red caps and 3 spotted caps. How many mushrooms in the ring?',
        choices: [
          { id: '7', label: '7', ok: true },
          { id: '1', label: '1' },
          { id: '8', label: '8' },
        ],
        praise: 'Seven caps. The fairies clapped.',
        nudge: 'Four and three. Count the red ones, then the spotted ones.',
      },
      {
        id: 'pip-story',
        kind: 'story',
        prompt: 'Who speaks for the fairies?',
        choices: [
          { id: 'pip', label: 'Pip', ok: true },
          { id: 'bear', label: 'A bear' },
          { id: 'wind', label: 'Only the wind' },
        ],
        praise: 'Pip does. The others wave while she talks.',
        nudge: 'Pip speaks, and the others stay close.',
      },
    ],
    quest: {
      id: 'pip-caps',
      kind: 'puzzle',
      goal: 5,
      unit: 'caps',
      offer: 'Please count 5 mushroom caps. Each spell you finish here counts one.',
      bookAsk: 'count 5 mushroom caps',
      done: 'Five caps, and the ring looks tidy.',
      reward: 2,
    },
  },
  {
    id: 'clover',
    placeId: 'crystal-shop',
    name: 'Clover',
    role: 'shop fox',
    blurb: 'Polite, and very fair about change.',
    hello: 'Hello, {name}. I am Clover. I mind the counter. I like {outfit}.',
    again: '{name}, I kept your place at the counter. This is {visit}. I like {outfit}.',
    memory: 'I kept your place at the counter',
    hint: 'If a crystal is bigger than the price, I hand the extra back.',
    questions: [
      {
        id: 'clover-change',
        kind: 'maths',
        prompt: 'A hat costs 6. You pay with a blue crystal worth 10. How much change?',
        choices: [
          { id: '4', label: '4', ok: true },
          { id: '16', label: '16' },
          { id: '6', label: '6' },
        ],
        praise: 'Four back. Ten take away six.',
        nudge: 'The blue crystal is 10. The hat is 6. Count what is left.',
      },
      {
        id: 'clover-story',
        kind: 'story',
        prompt: 'What does Clover do when a crystal is bigger than the price?',
        choices: [
          { id: 'back', label: 'Hands the extra back', ok: true },
          { id: 'keeps', label: 'Keeps it all' },
          { id: 'hides', label: 'Hides the change' },
        ],
        praise: 'I hand the extra back. That is the fair way.',
        nudge: 'I hand the extra back. Your pocket should match the price.',
      },
    ],
    quest: {
      id: 'clover-pinks',
      kind: 'worth',
      goal: 3,
      unit: 'in your pocket',
      offer: 'Please bring me 3 pink crystals. A pink one is 1, so that is 3. You may keep them.',
      bookAsk: 'bring a pocket worth 3, the same as 3 pink crystals',
      done: 'Three pink crystals would be 3, and your pocket is enough. Keep them.',
      reward: 2,
    },
  },
  {
    id: 'holly',
    placeId: 'witch-house',
    name: 'Holly',
    role: 'neighbour',
    blurb: 'She remembers what you wore, and brings biscuits.',
    hello: 'Hello, {name}. I am Holly, from next door. I brought biscuits. I like {outfit}.',
    again: '{name}, I still remember you. This is {visit}. I like {outfit}.',
    memory: 'I still remember you',
    hint: 'The house likes a little space around each chair.',
    questions: [
      {
        id: 'holly-biscuits',
        kind: 'maths',
        prompt: '2 biscuits for you, and 2 for the house. How many biscuits?',
        choices: [
          { id: '4', label: '4', ok: true },
          { id: '2', label: '2' },
          { id: '22', label: '22' },
        ],
        praise: 'Four biscuits. Two and two.',
        nudge: 'Two for you, two for the house. Add the pairs.',
      },
      {
        id: 'holly-story',
        kind: 'story',
        prompt: 'What did Holly bring to the door?',
        choices: [
          { id: 'biscuits', label: 'Biscuits', ok: true },
          { id: 'puddle', label: 'A cold puddle' },
          { id: 'nothing', label: 'Nothing at all' },
        ],
        praise: 'Biscuits, still warm.',
        nudge: 'Biscuits. The basket is full of them.',
      },
    ],
    quest: {
      id: 'holly-home',
      kind: 'house',
      goal: 1,
      unit: 'new things at home',
      offer: 'Please bring one new thing home for the witch’s house. A chair or a lamp will do.',
      bookAsk: 'bring one new thing home',
      done: 'The house has something new.',
      reward: 3,
    },
  },
  {
    id: 'smudge',
    placeId: 'colouring-nook',
    name: 'Smudge',
    role: 'colouring kitten',
    blurb: 'Quiet, with pink paint on one paw.',
    hello: 'Hello, {name}. I am Smudge. I like any colour you choose, and I like {outfit}.',
    again: '{name}, the cream page waited. This is {visit}. I like {outfit}.',
    memory: 'the cream page waited',
    hint: 'Any colour is a good colour. The cream page is happy either way.',
    questions: [
      {
        id: 'smudge-pots',
        kind: 'maths',
        prompt: '3 paint pots are open. I open 1 more. How many pots are open?',
        choices: [
          { id: '4', label: '4', ok: true },
          { id: '2', label: '2' },
          { id: '5', label: '5' },
        ],
        praise: 'Four open pots.',
        nudge: 'Three, and one more. That is four.',
      },
      {
        id: 'smudge-story',
        kind: 'story',
        prompt: 'What does Smudge like on the cream page?',
        choices: [
          { id: 'any', label: 'Any colour you choose', ok: true },
          { id: 'grey', label: 'Only grey' },
          { id: 'none', label: 'No colour ever' },
        ],
        praise: 'Any colour you choose. The page is yours.',
        nudge: 'Any colour you choose. There is no wrong pot.',
      },
    ],
    quest: {
      id: 'smudge-page',
      kind: 'colour',
      goal: 1,
      unit: 'pages',
      offer: 'Please finish one colouring page, just until it feels done.',
      bookAsk: 'finish one colouring page',
      done: 'A finished page. The cream paper looks proud.',
      reward: 2,
    },
  },
];

const BY_ID = new Map(PEOPLE.map((person) => [person.id, person]));
const BY_PLACE = new Map(PEOPLE.map((person) => [person.placeId, person]));
const BY_QUEST = new Map(PEOPLE.map((person) => [person.quest.id, person]));

export function personById(id: string): Person | null {
  return BY_ID.get(id) ?? null;
}

export function personAt(placeId: string): Person | null {
  return BY_PLACE.get(placeId) ?? null;
}

export function personByQuest(questId: string): Person | null {
  return BY_QUEST.get(questId) ?? null;
}

export function giftPhrase(amount: number): string {
  if (amount === 5) return 'a yellow crystal';
  if (amount === 3) return 'three pink crystals';
  if (amount === 2) return 'two pink crystals';
  if (amount === 1) return 'a pink crystal';
  return `${amount} crystals`;
}
