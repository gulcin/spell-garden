import { useState } from 'react';
import { CRYSTAL_COLOURS, breakInto, emptyPurse, purseTotal, type CrystalColour, type Purse } from '../wardrobe/purse.ts';
import { CrystalFace } from './CrystalCounter.tsx';

function hit(testId: string, x: number, y: number): boolean {
  const node = document.querySelector(`[data-testid="${testId}"]`);
  if (!node) return false;
  const box = node.getBoundingClientRect();
  return x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
}

function Piece({
  colour,
  home,
  onMove,
  onGhost,
}: {
  colour: CrystalColour;
  home: 'wallet' | 'counter';
  onMove: (colour: CrystalColour, home: 'wallet' | 'counter', x: number, y: number, moved: boolean) => void;
  onGhost: (ghost: { colour: CrystalColour; x: number; y: number } | null) => void;
}) {
  return (
    <button
      type="button"
      className="coin-piece"
      data-testid={home === 'wallet' ? `pay-coin-${colour}` : `tender-coin-${colour}`}
      aria-label={`${colour} crystal`}
      onPointerDown={(event) => {
        const startX = event.clientX;
        const startY = event.clientY;
        const piece = event.currentTarget;
        piece.setPointerCapture(event.pointerId);
        let moved = false;
        function move(ev: PointerEvent) {
          if (Math.hypot(ev.clientX - startX, ev.clientY - startY) > 6) {
            moved = true;
            onGhost({ colour, x: ev.clientX, y: ev.clientY });
          }
        }
        function up(ev: PointerEvent) {
          piece.removeEventListener('pointermove', move);
          piece.removeEventListener('pointerup', up);
          onGhost(null);
          onMove(colour, home, ev.clientX, ev.clientY, moved);
        }
        piece.addEventListener('pointermove', move);
        piece.addEventListener('pointerup', up);
      }}
    >
      <CrystalFace id={colour} />
    </button>
  );
}

export function PayTill({
  crystals,
  price,
  itemName,
  onPay,
  onCancel,
}: {
  crystals: number;
  price: number;
  itemName: string;
  onPay: (tender: Purse) => void;
  onCancel: () => void;
}) {
  const wallet = breakInto(crystals);
  const [tender, setTender] = useState<Purse>(emptyPurse);
  const [ghost, setGhost] = useState<{ colour: CrystalColour; x: number; y: number } | null>(null);
  const paid = purseTotal(tender);
  const short = Math.max(0, price - paid);

  function add(colour: CrystalColour) {
    setTender((current) => {
      if (current[colour] >= wallet[colour]) return current;
      return { ...current, [colour]: current[colour] + 1 };
    });
  }

  function remove(colour: CrystalColour) {
    setTender((current) => {
      if (current[colour] <= 0) return current;
      return { ...current, [colour]: current[colour] - 1 };
    });
  }

  function move(colour: CrystalColour, home: 'wallet' | 'counter', x: number, y: number, moved: boolean) {
    const onCounter = hit('pay-counter', x, y);
    const onWallet = hit('pay-wallet', x, y);
    if (!moved) {
      if (home === 'wallet') add(colour);
      else remove(colour);
      return;
    }
    if (home === 'wallet' && onCounter) add(colour);
    if (home === 'counter' && (onWallet || !onCounter)) remove(colour);
  }

  const sum =
    paid === 0
      ? `The ${itemName.toLowerCase()} costs ${price}.`
      : short > 0
        ? `${paid} so far. You need ${short} more.`
        : paid === price
          ? `${paid}. That is exactly ${price}.`
          : `${paid} is ${paid - price} more than ${price}. Clover will hand back the change.`;

  return (
    <div className="pay-till" data-testid="pay-till">
      <p>Drag crystals to the counter, or tap one. Then pay.</p>
      <div className="pay-row">
        <div className="pay-wallet" data-testid="pay-wallet" aria-label="Crystals in your pocket">
          {CRYSTAL_COLOURS.map((colour) =>
            Array.from({ length: wallet[colour.id] - tender[colour.id] }, (_, index) => (
              <Piece key={`${colour.id}-pocket-${index}`} colour={colour.id} home="wallet" onMove={move} onGhost={setGhost} />
            )),
          )}
        </div>
        <div className="pay-counter" data-testid="pay-counter" aria-label="Counter">
          {CRYSTAL_COLOURS.map((colour) =>
            Array.from({ length: tender[colour.id] }, (_, index) => (
              <Piece key={`${colour.id}-counter-${index}`} colour={colour.id} home="counter" onMove={move} onGhost={setGhost} />
            )),
          )}
        </div>
      </div>
      <p className="pay-sum" data-testid="pay-sum">
        {sum}
      </p>
      <div className="pay-actions">
        <button type="button" className="btn quiet" data-testid="pay-cancel" onClick={onCancel}>
          Back
        </button>
        <button type="button" className="btn gold" data-testid="pay-confirm" disabled={paid < price} onClick={() => onPay(tender)}>
          Pay
        </button>
      </div>
      {ghost ? (
        <img
          className="coin-ghost"
          alt=""
          src={`${import.meta.env.BASE_URL}art/crystals/${ghost.colour}.webp`}
          style={{ left: ghost.x, top: ghost.y }}
        />
      ) : null}
    </div>
  );
}
