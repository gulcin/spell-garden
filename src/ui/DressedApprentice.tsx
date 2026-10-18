import { createContext, useContext, type CSSProperties, type ReactNode } from 'react';
import { emptyWardrobe } from '../wardrobe/economy.ts';
import { WEAR_SLOTS, itemById, wearStyle } from '../wardrobe/catalog.ts';
import type { WardrobeState } from '../progress/types.ts';
import { Prop } from './pictures.tsx';

const WardrobeContext = createContext<WardrobeState>(emptyWardrobe());

export function WardrobeProvider({ wardrobe, children }: { wardrobe: WardrobeState; children: ReactNode }) {
  return <WardrobeContext.Provider value={wardrobe}>{children}</WardrobeContext.Provider>;
}

function useWardrobe(): WardrobeState {
  return useContext(WardrobeContext);
}

/** Full painted apprentice for each robe, so the old purple robe never shows through. */
const ROBE_LOOK: Record<string, string> = {
  'robe-moon': 'look-robe-moon',
  'robe-rose': 'look-robe-rose',
  'robe-moss': 'look-robe-moss',
  'robe-midnight': 'look-robe-midnight',
};

/** The apprentice, plus any robes, hats, extras, and broom she is wearing. */
export function DressedApprentice({ className, alt = '' }: { className?: string; alt?: string }) {
  const { equipped } = useWardrobe();
  const look = equipped.dress ? ROBE_LOOK[equipped.dress] : undefined;
  const layers = WEAR_SLOTS.map((slot) => equipped[slot]).filter((id): id is string => Boolean(id));
  return (
    <span className={className ? `dressed ${className}` : 'dressed'}>
      {look ? (
        <img
          className="look"
          src={`${import.meta.env.BASE_URL}art/wear/${look}.webp`}
          srcSet={`${import.meta.env.BASE_URL}art/wear/${look}.webp 1x, ${import.meta.env.BASE_URL}art/wear/${look}@2x.webp 2x`}
          alt={alt}
          draggable={false}
        />
      ) : (
        <Prop name="apprentice" alt={alt} />
      )}
      {layers.map((id) => {
        const item = itemById(id);
        if (!item || (look && item.slot === 'dress')) return null;
        const box = wearStyle(id, item.slot);
        const style: CSSProperties = { left: box.left, top: box.top, width: box.width, zIndex: box.z };
        const base = `${import.meta.env.BASE_URL}art/wear/${id}`;
        return (
          <img
            key={id}
            className="wear"
            src={`${base}.webp`}
            srcSet={`${base}.webp 1x, ${base}@2x.webp 2x`}
            alt=""
            style={style}
            draggable={false}
          />
        );
      })}
    </span>
  );
}
