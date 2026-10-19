import { createContext, useContext, type CSSProperties, type ReactNode } from 'react';
import { emptyWardrobe } from '../wardrobe/economy.ts';
import { OVERLAY_ORDER, itemById, paintedLook, wearStyle } from '../wardrobe/catalog.ts';
import type { WardrobeState } from '../progress/types.ts';
import { Prop } from './pictures.tsx';

const WardrobeContext = createContext<WardrobeState>(emptyWardrobe());

export function WardrobeProvider({ wardrobe, children }: { wardrobe: WardrobeState; children: ReactNode }) {
  return <WardrobeContext.Provider value={wardrobe}>{children}</WardrobeContext.Provider>;
}

function useWardrobe(): WardrobeState {
  return useContext(WardrobeContext);
}

function art(file: string): { src: string; srcSet: string } {
  const base = `${import.meta.env.BASE_URL}art/wear/${file}`;
  return {
    src: `${base}.webp`,
    srcSet: `${base}.webp 1x, ${base}@2x.webp 2x`,
  };
}

/**
 * Body first (the whole apprentice in her robe and hat), then a necklace, bag,
 * wand, crown, and kitten, then the broom. Robes and hats are full paintings,
 * so the purple cloth never peeks out from under a cutout.
 */
export function DressedApprentice({ className, alt = '' }: { className?: string; alt?: string }) {
  const equipped = useWardrobe()?.equipped ?? {};
  const look = paintedLook(equipped.dress, equipped.hat);
  const picture = look ? art(look) : null;
  return (
    <span className={className ? `dressed ${className}` : 'dressed'}>
      {picture ? (
        <img className="look" src={picture.src} srcSet={picture.srcSet} alt={alt} draggable={false} />
      ) : (
        <Prop name="apprentice" alt={alt} />
      )}
      {OVERLAY_ORDER.map((slot) => {
        const id = equipped[slot];
        if (!id) return null;
        const item = itemById(id);
        if (!item || item.slot !== slot) return null;
        const box = wearStyle(id, slot);
        const style: CSSProperties = { left: box.left, top: box.top, width: box.width, zIndex: box.z };
        const piece = art(id);
        return (
          <img
            key={id}
            className={`wear wear-${slot}`}
            src={piece.src}
            srcSet={piece.srcSet}
            alt=""
            style={style}
            draggable={false}
          />
        );
      })}
    </span>
  );
}
