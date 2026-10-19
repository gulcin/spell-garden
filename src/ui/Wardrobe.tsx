import { useState } from 'react';
import type { Progress } from '../progress/types.ts';
import { SHOP_CATEGORIES, SHOP_ITEMS, itemById, itemPreview, type ShopCategory } from '../wardrobe/catalog.ts';
import { equipItem, unequipSlot } from '../wardrobe/economy.ts';
import { speak } from '../speech.ts';
import { CrystalCounter } from './CrystalCounter.tsx';
import { DressedApprentice } from './DressedApprentice.tsx';
import { placeStyle } from './pictures.tsx';

export function WardrobeMirror({
  progress,
  update,
  onShop,
}: {
  progress: Progress;
  update: (recipe: (current: Progress) => Progress) => void;
  onShop: () => void;
}) {
  const [note, setNote] = useState<string | null>(null);
  const [shelf, setShelf] = useState<ShopCategory>(() => {
    const first = SHOP_CATEGORIES.find((entry) =>
      SHOP_ITEMS.some((item) => item.category === entry.id && progress.wardrobe.owned.includes(item.id)),
    );
    return first?.id ?? 'dress';
  });
  const owned = SHOP_ITEMS.filter((item) => item.category === shelf && progress.wardrobe.owned.includes(item.id));

  function toggle(id: string) {
    const item = itemById(id);
    if (!item) return;
    const wearing = progress.wardrobe.equipped[item.slot] === id;
    update((current) => (wearing ? unequipSlot(current, item.slot) : equipItem(current, id)));
    const line = wearing ? `The ${item.name.toLowerCase()} rests on the hook.` : `She puts on the ${item.name.toLowerCase()}.`;
    setNote(line);
    speak(line);
  }

  return (
    <section className="wardrobe place-scene" style={placeStyle('crystal-shop')} data-testid="wardrobe">
      <header className="shop-top">
        <div>
          <p className="kicker">The mirror</p>
          <h1>What she is wearing</h1>
        </div>
        <CrystalCounter count={progress.crystals} />
      </header>
      <div className="shop-tabs" role="tablist" aria-label="Wardrobe shelves">
        {SHOP_CATEGORIES.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={shelf === entry.id}
            className={shelf === entry.id ? 'on' : ''}
            data-testid={`wardrobe-shelf-${entry.id}`}
            onClick={() => setShelf(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </div>
      <div className="wardrobe-fit">
        <div className="mirror-stage">
          <DressedApprentice className="guide mirror-figure" alt="Aida in the clothes she chose" />
        </div>
        {note ? (
          <p className="note good shop-cheer" role="status">
            {note}
          </p>
        ) : null}
        {owned.length === 0 ? (
          <p className="mirror-empty">This shelf is waiting. Two spells in the crystal cave can buy the first one.</p>
        ) : (
          <div className="shop-grid" data-testid="wardrobe-grid">
            {owned.map((item) => {
              const wearing = progress.wardrobe.equipped[item.slot] === item.id;
              const base = `${import.meta.env.BASE_URL}art/wear/${itemPreview(item.id)}`;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={wearing ? 'shop-card wear-card on' : 'shop-card wear-card'}
                  data-testid={`wear-${item.id}`}
                  aria-pressed={wearing}
                  onClick={() => toggle(item.id)}
                >
                  <img src={`${base}.webp`} alt="" />
                  <h2 className="wear-name">{item.name}</h2>
                  <span className="wear-state">{wearing ? 'Take it off' : 'Put it on'}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <button type="button" className="btn gold xl" data-testid="back-to-shop" onClick={onShop}>
        Back to the shop
      </button>
    </section>
  );
}
