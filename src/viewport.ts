/** Pin the app to the visible screen when Safari's toolbar makes it shorter than the layout viewport. */
export function lockVisibleViewport(): void {
  const apply = () => {
    const viewport = window.visualViewport;
    const innerH = window.innerHeight;
    const visualH = Math.round(viewport?.height ?? innerH);
    const root = document.documentElement;
    if (visualH < innerH - 1) root.style.setProperty('--app-h', `${visualH}px`);
    else root.style.removeProperty('--app-h');
  };
  apply();
  window.addEventListener('resize', apply);
  window.visualViewport?.addEventListener('resize', apply);
  window.visualViewport?.addEventListener('scroll', apply);
}
