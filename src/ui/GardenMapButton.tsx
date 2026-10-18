import { speak } from '../speech.ts';

/** Always-visible way back to the garden map. Leaving saves quietly. */
export function GardenMapButton({ onHome }: { onHome: () => void }) {
  const src = `${import.meta.env.BASE_URL}art/map-mark.webp`;
  return (
    <button
      type="button"
      className="map-home"
      data-testid="garden-map"
      onClick={() => {
        speak('Garden map');
        onHome();
      }}
    >
      <img src={src} alt="" />
      <span>Garden map</span>
    </button>
  );
}
