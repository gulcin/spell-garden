/** Pink 1, lemon citrine 5, clear blue 10, metallic gold 20. Same family as the ten-frame tones. */

export const CRYSTAL_COLOURS = [
  { id: 'pink', name: 'Pink', value: 1 },
  { id: 'yellow', name: 'Yellow', value: 5 },
  { id: 'blue', name: 'Blue', value: 10 },
  { id: 'gold', name: 'Gold', value: 20 },
] as const;

export type CrystalColour = (typeof CRYSTAL_COLOURS)[number]['id'];

export type Purse = Record<CrystalColour, number>;

const NUMBER_WORDS = ['', 'A', 'Two', 'Three', 'Four'] as const;

export function emptyPurse(): Purse {
  return { pink: 0, yellow: 0, blue: 0, gold: 0 };
}

export function purseTotal(purse: Purse): number {
  return CRYSTAL_COLOURS.reduce((sum, colour) => sum + purse[colour.id] * colour.value, 0);
}

/** Canonical coins. Five pinks become one yellow, and so on. */
export function breakInto(amount: number): Purse {
  const n = Math.max(0, Math.floor(Number.isFinite(amount) ? amount : 0));
  return {
    gold: Math.floor(n / 20),
    blue: Math.floor((n % 20) / 10),
    yellow: Math.floor((n % 10) / 5),
    pink: n % 5,
  };
}

function crystalWords(count: number, colour: CrystalColour): string {
  const name = CRYSTAL_COLOURS.find((entry) => entry.id === colour)?.name.toLowerCase() ?? colour;
  if (count === 1) return `a ${name} crystal`;
  return `${count} ${name} crystals`;
}

/** Largest first, so gold is never mistaken for the pale yellow. */
export function joinCrystals(purse: Purse): string {
  const parts = [...CRYSTAL_COLOURS]
    .reverse()
    .filter((colour) => purse[colour.id] > 0)
    .map((colour) => crystalWords(purse[colour.id], colour.id));
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0]!;
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

function diff(earlier: Purse, later: Purse): { taken: Purse; back: Purse } {
  const taken = emptyPurse();
  const back = emptyPurse();
  for (const colour of CRYSTAL_COLOURS) {
    const delta = earlier[colour.id] - later[colour.id];
    if (delta > 0) taken[colour.id] = delta;
    else if (delta < 0) back[colour.id] = -delta;
  }
  return { taken, back };
}

/** What lands in the pocket, including when smaller crystals shine into a larger one. */
export function rewardSpeech(beforeTotal: number, gain: number): string {
  const gainN = Math.floor(gain);
  if (!Number.isFinite(gainN) || gainN <= 0) return '';
  const before = Math.max(0, Math.floor(Number.isFinite(beforeTotal) ? beforeTotal : 0));
  const earlier = breakInto(before);
  const later = breakInto(before + gainN);
  const grew = CRYSTAL_COLOURS.filter((colour) => later[colour.id] > earlier[colour.id] && colour.value > gainN);
  if (grew.length > 0) {
    const used = emptyPurse();
    const made = emptyPurse();
    for (const colour of CRYSTAL_COLOURS) {
      const lost = earlier[colour.id] - later[colour.id];
      if (lost > 0) used[colour.id] = lost;
    }
    for (const colour of grew) made[colour.id] = later[colour.id] - earlier[colour.id];
    const from = joinCrystals(used);
    const into = joinCrystals(made);
    return from ? `Your ${from} shine into ${into}.` : `Your crystals shine into ${into}.`;
  }
  const arrived = emptyPurse();
  for (const colour of CRYSTAL_COLOURS) {
    const extra = later[colour.id] - earlier[colour.id];
    if (extra > 0) arrived[colour.id] = extra;
  }
  const colours = CRYSTAL_COLOURS.filter((colour) => arrived[colour.id] > 0);
  if (colours.length === 1) {
    const colour = colours[0]!;
    const count = arrived[colour.id];
    const word = NUMBER_WORDS[count];
    if (count === 1) return `A ${colour.name.toLowerCase()} crystal settles in your pocket.`;
    if (word) return `${word} ${colour.name.toLowerCase()} crystals settle in your pocket.`;
    return `${count} ${colour.name.toLowerCase()} crystals settle in your pocket.`;
  }
  const phrase = joinCrystals(arrived);
  return `${phrase.charAt(0).toUpperCase()}${phrase.slice(1)} settle in your pocket.`;
}

/** Clover counts the price and hands back the change. */
export function paymentSpeech(beforeTotal: number, price: number): string {
  const before = Math.max(0, Math.floor(Number.isFinite(beforeTotal) ? beforeTotal : 0));
  const cost = Math.max(0, Math.floor(Number.isFinite(price) ? price : 0));
  const { taken, back } = diff(breakInto(before), breakInto(before - cost));
  const take = joinCrystals(taken);
  const change = joinCrystals(back);
  if (!change) return `Clover takes ${take}.`;
  return `Clover takes ${take} and hands back ${change}.`;
}

/** She laid these crystals on the counter herself. Change that folds back into a larger coin is said out loud. */
export function tenderSpeech(beforeTotal: number, tender: Purse, price: number, itemName: string): string {
  const paid = purseTotal(tender);
  const cost = Math.max(0, Math.floor(Number.isFinite(price) ? price : 0));
  const before = Math.max(0, Math.floor(Number.isFinite(beforeTotal) ? beforeTotal : 0));
  const handed = joinCrystals(tender);
  const change = breakInto(Math.max(0, paid - cost));
  const back = joinCrystals(change);
  const name = itemName.toLowerCase();
  if (!back) return `You pay ${handed} for the ${name}. That is exactly ${cost}.`;
  const wallet = breakInto(before);
  const kept = emptyPurse();
  for (const colour of CRYSTAL_COLOURS) kept[colour.id] = Math.max(0, wallet[colour.id] - tender[colour.id]);
  const mixed = emptyPurse();
  for (const colour of CRYSTAL_COLOURS) mixed[colour.id] = kept[colour.id] + change[colour.id];
  const pocket = joinCrystals(breakInto(before - cost));
  if (joinCrystals(mixed) === pocket) {
    return `You pay ${handed}, which is ${paid}. The ${name} costs ${cost}, so Clover hands back ${back}.`;
  }
  return `You pay ${handed}, which is ${paid}. The ${name} costs ${cost}, so ${paid} take away ${cost} is ${paid - cost}. Those coins and the ones you kept shine into ${pocket}.`;
}

function isPurseShape(value: unknown): value is Record<CrystalColour, number> {
  if (!value || typeof value !== 'object') return false;
  const raw = value as Record<string, unknown>;
  return CRYSTAL_COLOURS.every((colour) => {
    const count = raw[colour.id];
    return typeof count === 'number' && Number.isFinite(count) && count >= 0;
  });
}

/** A saved purse wins. An older save with only a total is broken into coins. */
export function normalizePurse(value: unknown, crystals: number): { crystals: number; purse: Purse } {
  if (isPurseShape(value)) {
    const counts = emptyPurse();
    for (const colour of CRYSTAL_COLOURS) counts[colour.id] = Math.floor(value[colour.id]);
    const purse = breakInto(purseTotal(counts));
    return { purse, crystals: purseTotal(purse) };
  }
  const total = Math.max(0, Math.floor(Number.isFinite(crystals) ? crystals : 0));
  return { purse: breakInto(total), crystals: total };
}
