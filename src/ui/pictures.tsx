/** Painted storybook art. WebP is preferred; PNG is the fallback. */
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
  { id: 'lantern-grove', name: 'Lantern grove', x: 16, y: 31 },
  { id: 'potion-cottage', name: 'Potion cottage', x: 40, y: 21 },
  { id: 'crystal-cave', name: 'Crystal cave', x: 73, y: 26 },
  { id: 'observatory', name: 'Observatory', x: 86, y: 45 },
  { id: 'lily-pond', name: 'Lily pond', x: 57, y: 47 },
  { id: 'greenhouse', name: 'Greenhouse', x: 71, y: 74 },
  { id: 'wizard-tower', name: 'Wizard tower', x: 36, y: 67 },
  { id: 'mushroom-ring', name: 'Mushroom ring', x: 15, y: 70 },
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
