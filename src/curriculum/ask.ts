import type { Topic } from './types.ts';

function scene(domain: string): string {
  switch (domain) {
    case 'Measurement':
      return 'Try it in the kitchen with cups, a ribbon, or the clock.';
    case 'Fractions':
      return 'A piece of fruit or a folded paper strip makes a friendly pie.';
    case 'Geometry':
      return 'Hunt for the shape on a walk, or build it with sticks and buttons.';
    case 'Multiplication & Division':
      return 'Share grapes or line up buttons in rows.';
    case 'Addition & Subtraction':
      return 'Use pebbles, spoons, or steps across the room.';
    case 'Counting & Cardinality':
      return 'Count something real and small, like berries in a bowl.';
    case 'Data & Statistics':
      return 'Sort a handful of toys and make a little picture graph together.';
    case 'Probability':
      return 'Use two colours of buttons in a cup and talk about what might happen.';
    case 'Ratio & Proportion':
      return 'Mix a drink or a paint colour and talk about the parts.';
    case 'Algebra':
      return 'Hide a few counters under a cup and talk about the missing part.';
    case 'Number Representation & Place Value':
      return 'Bundle ten pencils with a band and talk about tens and ones.';
    default:
      return 'Use counters you already have — buttons, grapes, or pebbles.';
  }
}

function lowerFirst(text: string): string {
  const trimmed = text.trim().replace(/\.$/, '');
  if (!trimmed) return 'talk about this idea in their own words';
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
}

/** A real-world "Ask her" prompt built from the topic's evidence and description. */
export function askHer(topic: Topic, name: string): string {
  const who = name.trim() || 'her';
  const evidence = topic.evidence[0] || topic.description || topic.name;
  return `Ask ${who}: can you ${lowerFirst(evidence)}? ${scene(topic.domain)}`;
}
