/** Pin the app to the visible screen, including iPad Safari with the toolbar showing. */
export function lockVisibleViewport(): void {
  const apply = () => {
    const viewport = window.visualViewport;
    const height = Math.round(viewport?.height ?? window.innerHeight);
    const width = Math.round(viewport?.width ?? window.innerWidth);
    const root = document.documentElement;
    root.style.setProperty('--app-h', `${height}px`);
    root.style.setProperty('--app-w', `${width}px`);
  };
  apply();
  window.addEventListener('resize', apply);
  window.visualViewport?.addEventListener('resize', apply);
  window.visualViewport?.addEventListener('scroll', apply);
}
