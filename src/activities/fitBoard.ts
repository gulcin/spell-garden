/** Scale a manipulative so its natural size fits the space the screen actually gave it. */
export function scaleToFit(availableWidth: number, availableHeight: number, neededWidth: number, neededHeight: number): number {
  if (availableWidth < 8 || availableHeight < 8 || neededWidth < 1 || neededHeight < 1) return 1;
  const width = Math.max(1, availableWidth - 4);
  const height = Math.max(1, availableHeight - 4);
  const scale = Math.min(1, width / neededWidth, height / neededHeight);
  if (scale > 0.985) return 1;
  return Math.max(0.5, Math.round(scale * 1000) / 1000);
}
