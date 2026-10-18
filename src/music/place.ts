import type { MusicId } from './scores.ts';
import { MUSIC_IDS } from './scores.ts';

const PLACE_LOOPS = new Set<string>(MUSIC_IDS);

/** Which loop belongs to this screen. Story time and bedtime are softer than the place she came from. */
export function musicFor(input: { screen: string; placeId?: string | null; bedtime?: boolean }): MusicId {
  if (input.screen === 'story' && input.bedtime) return 'bedtime';
  if (input.screen === 'story' || input.screen === 'story-offer' || input.screen === 'shelf') return 'story';
  if (input.screen === 'shop' || input.screen === 'wardrobe') return 'crystal-shop';
  if (input.screen === 'pets') return 'pet-shop';
  if (input.screen === 'house') return 'witch-house';
  if (input.screen === 'colour') return 'colouring-nook';
  if (input.screen === 'home' || input.screen === 'about' || input.screen === 'parent' || input.screen === 'garden') return 'map';
  const place = input.placeId ?? '';
  if (PLACE_LOOPS.has(place)) return place as MusicId;
  return 'map';
}
