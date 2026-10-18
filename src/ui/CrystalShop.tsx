import { useState } from 'react';
import type { Progress } from '../progress/types.ts';
import { SHOP_CATEGORIES, SHOP_ITEMS, itemById, type ShopCategory } from '../wardrobe/catalog.ts';
import { buyItem, equipItem } from '../wardrobe/economy.ts';
import { speak } from '../speech.ts';
import { CrystalCounter } from './CrystalCounter.tsx';
import { DressedApprentice } from './DressedApprentice.tsx';
import { placeStyle, Prop } from './pictures.tsx';

export function CrystalShop({
  progress,
  update,
  category = 'dress',
  onWardrobe,
}: {
  progress: Progress;
  update: (recipe: (current: Progress) => Progress) => void;
  category?: ShopCategory;
  onWardrobe: () => void;
}) {
  const [shelf, setShelf] = useState<ShopCategory>(category);
  const [cheer, setCheer] = useState<string | null>(null);
  const items = SHOP_ITEMS.filter((item) => item.category === shelf);

  function purchase(id: string) {
    const item = itemById(id);
    if (!item || progress.wardrobe.owned.includes(id) || progress.crystals < item.price) return;
    update((current) => buyItem(current, id).progress);
    const line = `${item.name} is yours. It suits you.`;
    setCheer(line);
    speak(line);
  }

  function wear(id: string) {
    const item = itemById(id);
    if (!item) return;
    update((current) => equipItem(current, id));
    const line = `She puts on the ${item.name.toLowerCase()}.`;
    setCheer(line);
    speak(line);
  }

  return (
    <section className="shop place-scene" style={placeStyle('crystal-shop')} data-testid="crystal-shop">
      <header className="shop-top">
        <div>
          <p className="kicker">Crystal shop</p>
          <h1>Clover's counter</h1>
        </div>
        <CrystalCounter count={progress.crystals} />
      </header>
      <div className="shopkeeper-row">
        <Prop name="shopkeeper" className="shopkeeper" alt="Clover the shop fox, holding a crystal" />
        <p>Hello. Crystals from the cave spend here. The first thing on each shelf is a small pile.</p>
      </div>
      {cheer ? (
        <p className="note good shop-cheer" role="status" data-testid="shop-cheer">
          {cheer}
        </p>
      ) : null}
      <div className="shop-tabs" role="tablist" aria-label="Shop shelves">
        {SHOP_CATEGORIES.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={shelf === entry.id}
            className={shelf === entry.id ? 'on' : ''}
            data-testid={`shelf-${entry.id}`}
            onClick={() => setShelf(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </div>
      <div className="shop-grid">
        {items.map((item) => {
          const owned = progress.wardrobe.owned.includes(item.id);
          const wearing = progress.wardrobe.equipped[item.slot] === item.id;
          const short = Math.max(0, item.price - progress.crystals);
          const base = `${import.meta.env.BASE_URL}art/wear/${item.id}`;
          return (
            <article key={item.id} className="shop-card" data-testid={`item-${item.id}`}>
              <img src={`${base}.webp`} alt="" />
              <h2>{item.name}</h2>
              <p>{item.line}</p>
              {owned ? (
                <button type="button" className="btn gold" disabled={wearing} onClick={() => wear(item.id)}>
                  {wearing ? 'Wearing' : 'Wear this'}
                </button>
              ) : (
                <button type="button" className="btn gold" disabled={short > 0} onClick={() => purchase(item.id)}>
                  {short > 0 ? `Need ${short} more` : `Buy · ${item.price}`}
                </button>
              )}
            </article>
          );
        })}
      </div>
      <div className="shop-mirror-preview">
        <DressedApprentice className="guide guide-small" alt="" />
        <button type="button" className="btn xl" data-testid="open-wardrobe" onClick={onWardrobe}>
          Open the mirror
        </button>
      </div>
    </section>
  );
}
