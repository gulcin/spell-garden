import type { Art, ShapeName } from './types.ts';
import { Prop } from '../ui/pictures.tsx';

const PHOTO: Partial<Record<Art, string>> = {
  spark: 'star',
  star: 'star',
  gem: 'crystal',
  crystal: 'crystal',
  coin: 'coin',
  token: 'coin',
  stone: 'coin',
  frog: 'frog',
  leaf: 'sprout',
  drop: 'potion',
  marble: 'seed',
  moth: 'moth',
  fish: 'flower',
  owl: 'owl',
};

const BLOCKS: Partial<Record<Art, string>> = {
  unit: 'block-unit',
  block: 'block-unit',
  rod: 'block-rod',
  flat: 'block-flat',
  plank: 'plank',
};

const TINTED = new Set<Art>(['spark', 'gem', 'crystal', 'marble']);

export function Glyph({ art, label, tone }: { art: Art; label?: string; tone?: number }) {
  const photo = PHOTO[art];
  const tint = tone != null && TINTED.has(art) ? ` tone-${tone % 6}` : '';
  if (photo) {
    return (
      <span className={`photo-prop${tint}`}>
        <Prop name={photo} className="glyph-photo" />
        {label ? <em className="prop-label">{label}</em> : null}
      </span>
    );
  }
  const block = BLOCKS[art];
  if (block) {
    return (
      <span className={`photo-prop block-art block-${art}`}>
        <Prop name={block} className="glyph-photo" />
      </span>
    );
  }
  if (art === 'ribbon') return <span className="ribbon">more</span>;
  return <Moon />;
}

function Moon() {
  return (
    <svg viewBox="0 0 64 64" className="glyph" aria-hidden>
      <path d="M38 8 A22 22 0 1 0 38 56 A15 15 0 1 1 38 8" fill="#f6e2a8" stroke="#c4963e" strokeWidth="2" />
    </svg>
  );
}

export function ShapeGlyph({ shape }: { shape: ShapeName }) {
  const common = { fill: 'none' as const, stroke: '#5c457e', strokeWidth: 3 };
  return (
    <svg viewBox="0 0 80 80" className="glyph" aria-hidden>
      {shape === 'triangle' ? <polygon points="40,12 68,66 12,66" {...common} fill="#f6d7a8" /> : null}
      {shape === 'square' ? <rect x="16" y="16" width="48" height="48" rx="8" {...common} fill="#c9dff3" /> : null}
      {shape === 'circle' ? <circle cx="40" cy="40" r="24" {...common} fill="#f3c7cf" /> : null}
      {shape === 'rectangle' ? <rect x="10" y="24" width="60" height="34" rx="8" {...common} fill="#d5edcf" /> : null}
      {shape === 'pentagon' ? <polygon points="40,10 70,32 58,66 22,66 10,32" {...common} fill="#e4d4f6" /> : null}
      {shape === 'hexagon' ? <polygon points="40,10 66,24 66,54 40,70 14,54 14,24" {...common} fill="#f8dfc4" /> : null}
      {shape === 'cube' ? (
        <>
          <polygon points="40,14 66,28 40,42 14,28" fill="#efe4ff" stroke="#5c457e" strokeWidth="3" />
          <polygon points="14,28 40,42 40,68 14,54" fill="#d9c7ff" stroke="#5c457e" strokeWidth="3" />
          <polygon points="40,42 66,28 66,54 40,68" fill="#b9a2e8" stroke="#5c457e" strokeWidth="3" />
        </>
      ) : null}
      {shape === 'cone' ? (
        <>
          <ellipse cx="40" cy="62" rx="22" ry="8" fill="#e7b84a" stroke="#5c457e" strokeWidth="3" />
          <polygon points="40,14 62,60 18,60" fill="#f0c56b" stroke="#5c457e" strokeWidth="3" />
          <ellipse cx="40" cy="62" rx="22" ry="8" fill="#f8dc9a" stroke="#5c457e" strokeWidth="3" />
        </>
      ) : null}
      {shape === 'sphere' ? (
        <>
          <circle cx="40" cy="42" r="22" fill="#c5e4f8" stroke="#5c457e" strokeWidth="3" />
          <ellipse cx="32" cy="34" rx="7" ry="5" fill="#fff" opacity="0.9" />
        </>
      ) : null}
    </svg>
  );
}

export function wedgePath(index: number, total: number): string {
  const a0 = (index / total) * Math.PI * 2 - Math.PI / 2;
  const a1 = ((index + 1) / total) * Math.PI * 2 - Math.PI / 2;
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const x0 = Math.cos(a0);
  const y0 = Math.sin(a0);
  const x1 = Math.cos(a1);
  const y1 = Math.sin(a1);
  return `M 0 0 L ${x0} ${y0} A 1 1 0 ${large} 1 ${x1} ${y1} Z`;
}
