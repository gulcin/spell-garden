import { useState } from 'react';
import { buyFurniture } from '../house/buy.ts';
import { furnitureById, shopFurniture } from '../house/catalog.ts';
import type { Progress } from '../progress/types.ts';
import { SHOP_CATEGORIES, SHOP_ITEMS, itemById, type ShopCategory } from '../wardrobe/catalog.ts';
import { buyItem, equipItem } from '../wardrobe/economy.ts';
import { paymentSpeech, tenderSpeech, type Purse } from '../wardrobe/purse.ts';
import { speak } from '../speech.ts';
import { CrystalCounter } from './CrystalCounter.tsx';
import { PayTill } from './PayTill.tsx';
import { DressedApprentice } from './DressedApprentice.tsx';
import { placeStyle, Prop } from './pictures.tsx';
import { PlaceBookButton, StoryButton } from './StoryTime.tsx';

type Shelf = ShopCategory | 'home';

type PendingPay = { id: string; name: string; price: number; kind: 'wear' | 'home' };

export function CrystalShop({
  progress,
  update,
  category = 'dress',
  onWardrobe,
  onStory,
  onOpenBook,
  onHouse,
}: {
  progress: Progress;
  update: (recipe: (current: Progress) => Progress) => void;
  category?: Shelf;
  onWardrobe: () => void;
  onStory?: () => void;
  onOpenBook?: () => void;
  onHouse?: () => void;
}) {
  const [shelf, setShelf] = useState<Shelf>(category);
  const [cheer, setCheer] = useState<string | null>(null);
  const [paySelf, setPaySelf] = useState(false);
  const [paying, setPaying] = useState<PendingPay | null>(null);
  const items = SHOP_ITEMS.filter((item) => item.category === shelf);

  function say(line: string) {
    setCheer(line);
    speak(line);
  }

  function purchase(id: string) {
    const item = itemById(id);
    if (!item || progress.wardrobe.owned.includes(id) || progress.crystals < item.price) return;
    const line = `${item.name} is yours. It suits you. ${paymentSpeech(progress.crystals, item.price)}`;
    update((current) => buyItem(current, id).progress);
    say(line);
  }

  function purchaseHome(id: string) {
    const item = furnitureById(id);
    if (!item || progress.house.owned.includes(id) || progress.crystals < item.price) return;
    const line = `You brought home the ${item.name.toLowerCase()}. ${paymentSpeech(progress.crystals, item.price)}`;
    update((current) => buyFurniture(current, id).progress);
    say(line);
  }

  function beginPay(next: PendingPay) {
    if (progress.crystals < next.price) return;
    setPaying(next);
  }

  function completePay(tender: Purse) {
    if (!paying) return;
    const line = `${paying.kind === 'home' ? `You brought home the ${paying.name.toLowerCase()}.` : `${paying.name} is yours. It suits you.`} ${tenderSpeech(progress.crystals, tender, paying.price, paying.name)}`;
    if (paying.kind === 'home') update((current) => buyFurniture(current, paying.id).progress);
    else update((current) => buyItem(current, paying.id).progress);
    say(line);
    setPaying(null);
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
        <div className="shop-tools">
          {onStory ? <StoryButton onClick={onStory} /> : null}
          <CrystalCounter count={progress.crystals} />
        </div>
      </header>
      <div className="shopkeeper-row">
        <Prop name="shopkeeper" className="shopkeeper" alt="Clover the shop fox, holding a crystal" />
        <div>
          <p>Hello. Crystals from the cave spend here. Pink is 1, yellow is 5, blue is 10, and gold is 20. The first thing on each shelf is a small pile.</p>
          <button
            type="button"
            className={paySelf ? 'btn gold' : 'btn quiet'}
            data-testid="pay-mode"
            aria-pressed={paySelf}
            onClick={() => {
              setPaySelf((on) => !on);
              setPaying(null);
            }}
          >
            I'll pay
          </button>
        </div>
      </div>
      {onOpenBook ? <PlaceBookButton placeId="crystal-shop" books={progress.books} onOpen={onOpenBook} /> : null}
      {cheer ? (
        <p className="note good shop-cheer" role="status" data-testid="shop-cheer">
          {cheer}
        </p>
      ) : null}
      <div className="shop-tabs" role="tablist" aria-label="Shop shelves">
        {[...SHOP_CATEGORIES, { id: 'home' as const, label: 'Home' }].map((entry) => (
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
      {paying ? (
        <PayTill
          crystals={progress.crystals}
          price={paying.price}
          itemName={paying.name}
          onPay={completePay}
          onCancel={() => setPaying(null)}
        />
      ) : null}
      {shelf === 'home' ? (
        <div className="shop-grid" data-testid="home-shelf">
          {shopFurniture().map((item) => {
            const owned = progress.house.owned.includes(item.id);
            const placed = progress.house.placed.some((piece) => piece.itemId === item.id);
            const short = Math.max(0, item.price - progress.crystals);
            const art = `${import.meta.env.BASE_URL}art/house/${item.id}`;
            return (
              <article key={item.id} className="shop-card" data-testid={`item-${item.id}`}>
                <img src={`${art}.webp`} alt="" />
                <h2>{item.name}</h2>
                <p>{item.line}</p>
                {owned ? (
                  <button type="button" className="btn gold" onClick={onHouse} disabled={!onHouse}>
                    {placed ? 'In the house' : 'Put in the house'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn gold"
                    disabled={short > 0}
                    onClick={() => (paySelf ? beginPay({ id: item.id, name: item.name, price: item.price, kind: 'home' }) : purchaseHome(item.id))}
                  >
                    {short > 0 ? `Need ${short} more` : paySelf ? `I'll pay · ${item.price}` : `Buy · ${item.price}`}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      ) : null}
      {shelf !== 'home' ? <div className="shop-grid">
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
                <button
                  type="button"
                  className="btn gold"
                  disabled={short > 0}
                  onClick={() => (paySelf ? beginPay({ id: item.id, name: item.name, price: item.price, kind: 'wear' }) : purchase(item.id))}
                >
                  {short > 0 ? `Need ${short} more` : paySelf ? `I'll pay · ${item.price}` : `Buy · ${item.price}`}
                </button>
              )}
            </article>
          );
        })}
      </div> : null}
      <div className="shop-mirror-preview">
        <DressedApprentice className="guide guide-small" alt="" />
        <button type="button" className="btn xl" data-testid="open-wardrobe" onClick={onWardrobe}>
          Open the mirror
        </button>
      </div>
    </section>
  );
}
