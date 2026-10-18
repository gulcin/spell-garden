/** Painted pots on the nook table. Paper puts a region back to the page. */
export const PAPER = '#fffdf8';

export const PALETTE = [
  { id: 'blue', name: 'Clear blue', hex: '#2f80ed' },
  { id: 'gold', name: 'Gold', hex: '#e0b03a' },
  { id: 'pink', name: 'Pink', hex: '#f2a0c4' },
  { id: 'purple', name: 'Purple', hex: '#7b5ea7' },
  { id: 'sky', name: 'Sky', hex: '#8ec8e8' },
  { id: 'leaf', name: 'Leaf', hex: '#6eae6a' },
  { id: 'moss', name: 'Moss', hex: '#3e6b45' },
  { id: 'rose', name: 'Rose', hex: '#e56b8a' },
  { id: 'peach', name: 'Peach', hex: '#f3a36b' },
  { id: 'cream', name: 'Cream', hex: '#f6e6c4' },
  { id: 'cocoa', name: 'Cocoa', hex: '#8a5a3a' },
  { id: 'night', name: 'Night', hex: '#2a2340' },
  { id: 'orange', name: 'Orange', hex: '#f08a3c' },
  { id: 'teal', name: 'Teal', hex: '#2f9b93' },
  { id: 'lilac', name: 'Lilac', hex: '#cdb6ea' },
  { id: 'berry', name: 'Berry', hex: '#c4474a' },
  { id: 'paper', name: 'Paper', hex: PAPER },
] as const;

export type PaletteId = (typeof PALETTE)[number]['id'];

export const BRUSH_SIZES = [8, 14, 22, 34] as const;
