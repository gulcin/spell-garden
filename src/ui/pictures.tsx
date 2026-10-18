import { DressedApprentice } from './DressedApprentice.tsx';

/** Painted storybook art. WebP is preferred; PNG is the fallback. */
export function placeStyle(id: string): { backgroundImage: string } {
  const base = `${import.meta.env.BASE_URL}art/places/${id}`;
  return {
    backgroundImage: `image-set(url("${base}.webp") 1x, url("${base}@2x.webp") 2x)`,
  };
}

export function PageBanner({ place }: { place: string }) {
  const base = `${import.meta.env.BASE_URL}art/places/${place}`;
  return (
    <div className="page-banner">
      <img className="banner-photo" src={`${base}.webp`} srcSet={`${base}.webp 1x, ${base}@2x.webp 2x`} alt="" />
      <DressedApprentice className="guide guide-small banner-guide" alt="" />
    </div>
  );
}

export function Prop({
  name,
  className,
  alt = '',
}: {
  name: string;
  className?: string;
  alt?: string;
}) {
  const base = `${import.meta.env.BASE_URL}art/`;
  return (
    <picture className={className}>
      <source type="image/webp" srcSet={`${base}${name}.webp 1x, ${base}${name}@2x.webp 2x`} />
      <img src={`${base}${name}.png`} alt={alt} draggable={false} />
    </picture>
  );
}

export const PLACES = [
  { id: 'lantern-grove', name: 'Lantern grove', short: 'Grove', x: 16, y: 31, heading: 'A sleepy glow', line: 'Nim the moth waits beside the lanterns, ready for a quiet start.', prop: 'moth' },
  { id: 'potion-cottage', name: 'Potion cottage', short: 'Cottage', x: 40, y: 21, heading: 'The warm kettle', line: 'A little potion sits on the step, humming while the cottage wakes.', prop: 'potion' },
  { id: 'crystal-cave', name: 'Crystal cave', short: 'Cave', x: 73, y: 26, heading: 'A bright hush', line: 'One crystal glows in the dark, just enough to count by.', prop: 'crystal' },
  { id: 'observatory', name: 'Observatory', short: 'Stars', x: 86, y: 45, heading: 'The open roof', line: 'The night is clear. The garden clock wants a careful look.', prop: 'clock' },
  { id: 'lily-pond', name: 'Lily pond', short: 'Pond', x: 57, y: 47, heading: 'Still water', line: 'Pebble the frog sits on a lily, waiting for the first hop.', prop: 'frog' },
  { id: 'greenhouse', name: 'Greenhouse', short: 'Glass', x: 71, y: 74, heading: 'Warm glass', line: 'A sprout is pushing up, one leaf at a time.', prop: 'sprout' },
  { id: 'wizard-tower', name: 'Wizard tower', short: 'Tower', x: 36, y: 67, heading: 'The quiet loft', line: 'Teacup the owl keeps watch beside the spell book.', prop: 'owl' },
  { id: 'mushroom-ring', name: 'Mushroom ring', short: 'Ring', x: 15, y: 70, heading: 'Soft ground', line: 'Lumen the beetle rests by a red cap, lantern-belly dim.', prop: 'beetle' },
] as const;

export const REWARD_ART: Record<string, string> = {
  moth: 'moth',
  'lantern-glow': 'lantern',
  frog: 'frog',
  vine: 'sprout',
  owl: 'owl',
  'bridge-mend': 'star',
  bunny: 'bunny',
  rug: 'coin',
  beetle: 'beetle',
  kettle: 'potion',
  kitten: 'kitten',
  banner: 'book',
};
