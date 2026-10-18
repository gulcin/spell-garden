import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PALETTE } from '../src/colouring/palette.ts';
import { SHEETS } from '../src/colouring/sheets.ts';
import {
  applyFill,
  crayonWidth,
  emptyArtwork,
  finishReward,
  pushHistory,
  redoArt,
  undoArt,
  zoomAt,
  type ArtAction,
} from '../src/colouring/model.ts';
import { PLACES } from '../src/ui/pictures.tsx';
import { normalizeVisited } from '../src/progress/storage.ts';

describe('colouring corner', () => {
  it('keeps chapter places separate from the nook', () => {
    expect(PLACES).toHaveLength(8);
    expect(PLACES.some((place) => place.id === 'colouring-nook')).toBe(false);
    expect(normalizeVisited(['colouring-nook', 'crystal-shop', 'nope'], 0)).toEqual(['colouring-nook', 'crystal-shop']);
  });

  it('offers the named colours, eleven witch sheets, and five blank pages', () => {
    const names = PALETTE.map((swatch) => swatch.name);
    expect(names).toEqual(expect.arrayContaining(['Clear blue', 'Gold', 'Pink', 'Purple']));
    expect(PALETTE.length).toBeGreaterThanOrEqual(16);
    const pictures = SHEETS.filter((sheet) => sheet.kind === 'picture');
    const blanks = SHEETS.filter((sheet) => sheet.kind === 'blank');
    expect(pictures.length).toBeGreaterThanOrEqual(11);
    expect(blanks).toHaveLength(5);
    for (const sheet of pictures) {
      const svg = readFileSync(new URL(`../public/art/colouring/${sheet.id}.svg`, import.meta.url), 'utf8');
      const regions = [...svg.matchAll(/data-region="([^"]+)" d="([^"]+)"/g)];
      expect(regions.length).toBeGreaterThanOrEqual(12);
      expect(new Set(regions.map((match) => match[1])).size).toBe(regions.length);
      for (const match of regions) expect(match[2]?.trim().endsWith('Z')).toBe(true);
      expect(svg).toContain('pointer-events="none"');
    }
    for (const sheet of blanks) {
      const svg = readFileSync(new URL(`../public/art/colouring/${sheet.id}.svg`, import.meta.url), 'utf8');
      const regions = [...svg.matchAll(/data-region="([^"]+)" d="([^"]+)"/g)];
      expect(regions.map((match) => match[1])).toEqual(['page']);
      expect(regions[0]?.[2]?.trim().endsWith('Z')).toBe(true);
      expect(svg).toContain('fill="#f8e7cf"');
      expect(svg).toContain('pointer-events="none"');
    }
  });

  it('fills, undoes, and redoes a region', () => {
    const art = emptyArtwork('cauldron');
    const first = applyFill(art.fills, 'pot-1', '#2f80ed');
    expect(first.changed).toBe(true);
    const again = applyFill(first.fills, 'pot-1', '#2f80ed');
    expect(again.changed).toBe(false);
    const cleared = applyFill(first.fills, 'pot-1', '#fffdf8');
    expect(cleared.fills['pot-1']).toBeUndefined();
    const action: ArtAction = { kind: 'fill', region: 'pot-1', prev: null, next: '#2f80ed' };
    const painted = { ...art, fills: first.fills };
    const undone = undoArt(painted, [action], []);
    expect(undone?.art.fills['pot-1']).toBeUndefined();
    const redone = undone ? redoArt(undone.art, undone.history, undone.future) : null;
    expect(redone?.art.fills['pot-1']).toBe('#2f80ed');
    expect(pushHistory(Array.from({ length: 20 }, () => action), action)).toHaveLength(20);
  });

  it('gives one crystal only when a page is finished on purpose', () => {
    const art = emptyArtwork('nim');
    const first = finishReward(art);
    expect(first.gained).toBe(1);
    expect(finishReward(first.art).gained).toBe(0);
  });

  it('uses pencil pressure and keeps a pinch inside the page', () => {
    expect(crayonWidth(20, 'pen', 0.2)).toBeLessThan(20);
    expect(crayonWidth(20, 'touch', 0.2)).toBe(20);
    const view = zoomAt({ scale: 1, x: 0, y: 0 }, 2, 100, 80, 200, 160);
    expect(view.scale).toBe(2);
    expect(view.x).toBeLessThanOrEqual(0);
    expect(view.y).toBeLessThanOrEqual(0);
  });
});
