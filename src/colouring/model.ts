import { PALETTE, PAPER } from './palette.ts';

export type StrokePoint = { x: number; y: number; w: number };

export type Stroke = {
  tool: 'brush' | 'eraser';
  color: string;
  points: StrokePoint[];
};

export type ArtAction =
  | { kind: 'fill'; region: string; prev: string | null; next: string }
  | { kind: 'stroke'; stroke: Stroke };

export type Artwork = {
  sheetId: string;
  fills: Record<string, string>;
  strokes: Stroke[];
  rewarded: boolean;
  updatedAt: number;
};

export type View = { scale: number; x: number; y: number };

export const HISTORY_CAP = 20;

export function emptyArtwork(sheetId: string): Artwork {
  return { sheetId, fills: {}, strokes: [], rewarded: false, updatedAt: 0 };
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Pen pressure fattens the crayon. A mouse or a quiet finger keeps the chosen size. */
export function crayonWidth(size: number, pointerType: string, pressure: number): number {
  if (pointerType === 'pen' && pressure > 0) return size * (0.35 + Math.min(1, pressure) * 0.65);
  return size;
}

export function applyFill(
  fills: Record<string, string>,
  region: string,
  color: string,
): { fills: Record<string, string>; prev: string | null; changed: boolean } {
  const prev = fills[region] ?? null;
  const current = prev ?? PAPER;
  if (current === color) return { fills, prev, changed: false };
  const next = { ...fills };
  if (color === PAPER) delete next[region];
  else next[region] = color;
  return { fills: next, prev, changed: true };
}

export function pushHistory(history: ArtAction[], action: ArtAction): ArtAction[] {
  const next = [...history, action];
  return next.length > HISTORY_CAP ? next.slice(next.length - HISTORY_CAP) : next;
}

export function undoArt(
  art: Artwork,
  history: ArtAction[],
  future: ArtAction[],
): { art: Artwork; history: ArtAction[]; future: ArtAction[] } | null {
  const action = history[history.length - 1];
  if (!action) return null;
  const past = history.slice(0, -1);
  if (action.kind === 'fill') {
    const fills = { ...art.fills };
    if (action.prev == null) delete fills[action.region];
    else fills[action.region] = action.prev;
    return { art: { ...art, fills }, history: past, future: [...future, action] };
  }
  return { art: { ...art, strokes: art.strokes.slice(0, -1) }, history: past, future: [...future, action] };
}

export function redoArt(
  art: Artwork,
  history: ArtAction[],
  future: ArtAction[],
): { art: Artwork; history: ArtAction[]; future: ArtAction[] } | null {
  const action = future[future.length - 1];
  if (!action) return null;
  const rest = future.slice(0, -1);
  if (action.kind === 'fill') {
    const fills = { ...art.fills };
    if (action.next === PAPER) delete fills[action.region];
    else fills[action.region] = action.next;
    return { art: { ...art, fills }, history: pushHistory(history, action), future: rest };
  }
  return { art: { ...art, strokes: [...art.strokes, action.stroke] }, history: pushHistory(history, action), future: rest };
}

/** One crystal, once, and only when she says the page feels finished. */
export function finishReward(art: Artwork): { art: Artwork; gained: number } {
  if (art.rewarded) return { art, gained: 0 };
  return { art: { ...art, rewarded: true }, gained: 1 };
}

export function clampView(view: View, width: number, height: number): View {
  const scale = clamp(view.scale, 1, 4);
  const minX = Math.min(0, width - width * scale);
  const minY = Math.min(0, height - height * scale);
  return { scale, x: clamp(view.x, minX, 0), y: clamp(view.y, minY, 0) };
}

export function zoomAt(view: View, factor: number, anchorX: number, anchorY: number, width: number, height: number): View {
  const scale = clamp(view.scale * factor, 1, 4);
  const sx = (anchorX - view.x) / view.scale;
  const sy = (anchorY - view.y) / view.scale;
  return clampView({ scale, x: anchorX - sx * scale, y: anchorY - sy * scale }, width, height);
}

export function paintStrokes(ctx: CanvasRenderingContext2D, strokes: Stroke[]): void {
  for (const stroke of strokes) {
    const eraser = stroke.tool === 'eraser';
    ctx.save();
    ctx.globalCompositeOperation = eraser ? 'destination-out' : 'source-over';
    ctx.strokeStyle = stroke.color;
    ctx.fillStyle = stroke.color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const pts = stroke.points;
    if (pts.length === 1) {
      ctx.beginPath();
      ctx.arc(pts[0]!.x, pts[0]!.y, pts[0]!.w / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1]!;
        const b = pts[i]!;
        ctx.beginPath();
        ctx.lineWidth = (a.w + b.w) / 2;
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}

/** A half-coloured page, for a preview. Real drawings come from the corner itself. */
export function demoArtwork(sheetId: string, regionIds: string[]): Artwork {
  const fills: Record<string, string> = {};
  const colours = PALETTE.filter((swatch) => swatch.id !== 'paper').map((swatch) => swatch.hex);
  regionIds.forEach((id, index) => {
    if (id.startsWith('paper') || index % 3 !== 0) return;
    fills[id] = colours[index % colours.length] ?? colours[0]!;
  });
  return {
    sheetId,
    fills,
    strokes: [
      {
        tool: 'brush',
        color: '#e0b03a',
        points: [
          { x: 140, y: 180, w: 16 },
          { x: 210, y: 240, w: 22 },
          { x: 280, y: 210, w: 12 },
          { x: 360, y: 280, w: 18 },
        ],
      },
    ],
    rewarded: false,
    updatedAt: Date.now(),
  };
}
