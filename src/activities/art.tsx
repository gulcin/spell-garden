import type { Art, ShapeName } from './types.ts';

const TONES = ['#f0b429', '#6cb6eb', '#e36a8a', '#c9b6e4', '#3eae7a', '#f3d2a4'];

export function Glyph({ art, label, tone = 0 }: { art: Art; label?: string; tone?: number }) {
  const fill = TONES[tone % TONES.length] ?? '#f0b429';
  if (art === 'frog') {
    return (
      <svg viewBox="0 0 64 64" className="glyph" aria-hidden>
        <ellipse cx="32" cy="40" rx="18" ry="14" fill="#7dce7a" />
        <circle cx="22" cy="24" r="8" fill="#7dce7a" />
        <circle cx="42" cy="24" r="8" fill="#7dce7a" />
        <circle cx="22" cy="24" r="3" fill="#2c2144" />
        <circle cx="42" cy="24" r="3" fill="#2c2144" />
        <path d="M24 42 Q32 48 40 42" fill="none" stroke="#2c2144" strokeWidth="2" />
      </svg>
    );
  }
  if (art === 'coin' || art === 'token' || art === 'stone') {
    return (
      <span className="coin-face" style={{ background: art === 'stone' ? '#d7c4a8' : fill }}>
        {label ?? ''}
      </span>
    );
  }
  if (art === 'rod') return <span className="rod-block" />;
  if (art === 'flat') return <span className="flat-block" />;
  if (art === 'unit' || art === 'block' || art === 'plank') return <span className="unit-block" style={{ background: fill }} />;
  if (art === 'ribbon') return <span className="ribbon">more</span>;
  return (
    <svg viewBox="0 0 64 64" className="glyph" aria-hidden>
      {art === 'spark' || art === 'star' ? (
        <polygon points="32,6 38,24 58,24 42,36 48,56 32,44 16,56 22,36 6,24 26,24" fill={fill} />
      ) : null}
      {art === 'moon' ? <path d="M36 8 A22 22 0 1 0 36 56 A16 16 0 1 1 36 8" fill="#f6e7b4" /> : null}
      {art === 'leaf' ? <ellipse cx="32" cy="34" rx="14" ry="22" fill="#3eae7a" transform="rotate(-20 32 34)" /> : null}
      {art === 'drop' || art === 'gem' ? <polygon points="32,6 54,28 32,58 10,28" fill={art === 'gem' ? '#7a5cff' : fill} /> : null}
      {art === 'crystal' ? <polygon points="32,4 52,24 44,58 20,58 12,24" fill="#9ad7ff" /> : null}
      {art === 'moth' ? (
        <>
          <ellipse cx="22" cy="32" rx="12" ry="16" fill="#f3d2a4" />
          <ellipse cx="42" cy="32" rx="12" ry="16" fill="#e7c0d4" />
          <ellipse cx="32" cy="34" rx="4" ry="12" fill="#6b4b3a" />
        </>
      ) : null}
      {art === 'owl' ? (
        <>
          <ellipse cx="32" cy="34" rx="16" ry="18" fill="#e6d2b5" />
          <circle cx="26" cy="32" r="4" fill="#2c2144" />
          <circle cx="38" cy="32" r="4" fill="#2c2144" />
        </>
      ) : null}
      {art === 'fish' ? <ellipse cx="30" cy="32" rx="16" ry="10" fill="#f0b429" /> : null}
      {art === 'marble' ? <circle cx="32" cy="32" r="16" fill={fill} /> : null}
    </svg>
  );
}

export function ShapeGlyph({ shape }: { shape: ShapeName }) {
  const common = { fill: 'none', stroke: '#2c2144', strokeWidth: 3 };
  return (
    <svg viewBox="0 0 80 80" className="glyph" aria-hidden>
      {shape === 'triangle' ? <polygon points="40,12 68,66 12,66" {...common} fill="#f6d36b" /> : null}
      {shape === 'square' ? <rect x="16" y="16" width="48" height="48" rx="4" {...common} fill="#9ad7ff" /> : null}
      {shape === 'circle' ? <circle cx="40" cy="40" r="24" {...common} fill="#f3b6c9" /> : null}
      {shape === 'rectangle' ? <rect x="10" y="24" width="60" height="34" rx="4" {...common} fill="#c9f0d4" /> : null}
      {shape === 'pentagon' ? <polygon points="40,10 70,32 58,66 22,66 10,32" {...common} fill="#e6d4ff" /> : null}
      {shape === 'hexagon' ? <polygon points="40,10 66,24 66,54 40,70 14,54 14,24" {...common} fill="#ffe1b5" /> : null}
      {shape === 'cube' ? <polygon points="24,28 40,18 56,28 56,52 40,62 24,52" {...common} fill="#d9c7ff" /> : null}
      {shape === 'cone' ? <polygon points="40,12 64,60 16,60" {...common} fill="#f6c56b" /> : null}
      {shape === 'sphere' ? <ellipse cx="40" cy="42" rx="22" ry="20" {...common} fill="#b7e4ff" /> : null}
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
