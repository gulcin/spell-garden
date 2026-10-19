/** Scale a manipulative so its natural size fits the space the screen actually gave it. */
export function scaleToFit(availableWidth: number, availableHeight: number, neededWidth: number, neededHeight: number): number {
  if (availableWidth < 8 || availableHeight < 8 || neededWidth < 1 || neededHeight < 1) return 1;
  const scale = Math.min(1, availableWidth / neededWidth, availableHeight / neededHeight);
  if (scale > 0.985) return 1;
  return Math.max(0.5, Math.round(scale * 1000) / 1000);
}
