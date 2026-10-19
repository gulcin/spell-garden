import { describe, expect, it } from 'vitest';
import { scaleToFit } from '../src/activities/fitBoard.ts';

describe('scaleToFit', () => {
  it('leaves a board alone when it already fits', () => {
    expect(scaleToFit(400, 300, 380, 280)).toBe(1);
    expect(scaleToFit(400, 300, 400, 300)).toBe(1);
  });

  it('shrinks a board that is taller or wider than the space', () => {
    expect(scaleToFit(400, 200, 400, 400)).toBe(0.5);
    expect(scaleToFit(200, 400, 400, 400)).toBe(0.5);
  });

  it('does not shrink a board into nothing', () => {
    expect(scaleToFit(40, 40, 400, 400)).toBe(0.5);
    expect(scaleToFit(0, 200, 100, 100)).toBe(1);
  });
});
