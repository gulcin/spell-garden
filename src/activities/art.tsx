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
  moth: 'lantern',
  fish: 'flower',
};

export function Glyph({ art, label, tone = 0 }: { art: Art; label?: string; tone?: number }) {
  const photo = PHOTO[art];
  if (photo) {
    return (
      <span className={`photo-prop tone-${tone % 6}`}>
        <Prop name={photo} className="glyph-photo" />
        {label ? <em className="prop-label">{label}</em> : null}
      </span>
    );
  }
  if (art === 'rod' || art === 'unit' || art === 'flat' || art === 'block' || art === 'plank') {
    return <Block kind={art === 'rod' ? 'rod' : art === 'flat' ? 'flat' : 'unit'} />;
  }
  if (art === 'ribbon') return <span className="ribbon">more</span>;
  if (art === 'owl') return <Owl />;
  return <Moon />;
}

function Block({ kind }: { kind: 'unit' | 'rod' | 'flat' }) {
  if (kind === 'rod') {
    return (
      <svg viewBox="0 0 28 78" className="glyph glyph-rod" aria-hidden>
        <rect x="3" y="2" width="22" height="74" rx="6" fill="#c9b4e6" stroke="#6d548f" strokeWidth="2" />
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="6" y={6 + i * 8.6} width="16" height="6" rx="2" fill="#efe6fb" />
        ))}
      </svg>
    );
  }
  if (kind === 'flat') {
    return (
      <svg viewBox="0 0 64 64" className="glyph glyph-flat" aria-hidden>
        <rect x="2" y="2" width="60" height="60" rx="8" fill="#b7d4ef" stroke="#5d7f9e" strokeWidth="2" />
        {Array.from({ length: 4 }, (_, row) =>
          Array.from({ length: 4 }, (_, col) => (
            <rect key={`${row}-${col}`} x={8 + col * 13} y={8 + row * 13} width="10" height="10" rx="2" fill="#f4fbff" opacity="0.85" />
          )),
        )}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" className="glyph glyph-unit" aria-hidden>
      <rect x="2" y="2" width="28" height="28" rx="7" fill="#f0c987" stroke="#a8753a" strokeWidth="2" />
      <rect x="6" y="6" width="12" height="8" rx="3" fill="#fff6df" opacity="0.85" />
    </svg>
  );
}

function Moon() {
  return (
    <svg viewBox="0 0 64 64" className="glyph" aria-hidden>
      <path d="M38 8 A22 22 0 1 0 38 56 A15 15 0 1 1 38 8" fill="#f6e2a8" stroke="#c4963e" strokeWidth="2" />
    </svg>
  );
}

function Owl() {
  return (
    <svg viewBox="0 0 64 64" className="glyph" aria-hidden>
      <ellipse cx="32" cy="36" rx="18" ry="18" fill="#f3e2c8" stroke="#8a6a48" strokeWidth="2" />
      <path d="M16 28 Q10 16 22 20" fill="#e7d3b4" stroke="#8a6a48" strokeWidth="2" />
      <path d="M48 28 Q54 16 42 20" fill="#e7d3b4" stroke="#8a6a48" strokeWidth="2" />
      <circle cx="25" cy="34" r="6" fill="#fff" />
      <circle cx="39" cy="34" r="6" fill="#fff" />
      <circle cx="25" cy="35" r="2.4" fill="#2c2144" />
      <circle cx="39" cy="35" r="2.4" fill="#2c2144" />
      <path d="M30 42 L32 46 L34 42" fill="#e0a15a" />
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
      {shape === 'cube' ? <polygon points="24,28 40,18 56,28 56,52 40,62 24,52" {...common} fill="#d9c7ff" /> : null}
      {shape === 'cone' ? <polygon points="40,12 64,60 16,60" {...common} fill="#f0c56b" /> : null}
      {shape === 'sphere' ? <ellipse cx="40" cy="42" rx="22" ry="20" {...common} fill="#c5e4f8" /> : null}
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
