import { CRYSTAL_COLOURS, breakInto, type CrystalColour } from '../wardrobe/purse.ts';

export function CrystalFace({ id, alt = '' }: { id: CrystalColour; alt?: string }) {
  const base = `${import.meta.env.BASE_URL}art/crystals/${id}`;
  return <img src={`${base}.webp`} srcSet={`${base}.webp 1x, ${base}@2x.webp 2x`} alt={alt} draggable={false} />;
}

export function CrystalCounter({ count }: { count: number }) {
  const total = Math.max(0, Math.floor(Number.isFinite(count) ? count : 0));
  const purse = breakInto(total);
  const held = [...CRYSTAL_COLOURS].reverse().filter((colour) => purse[colour.id] > 0);
  const detail = held.map((colour) => `${purse[colour.id]} ${colour.name.toLowerCase()}`).join(', ');
  const label = held.length === 0 ? '0 crystals' : `${total} crystals: ${detail}`;
  return (
    <div className="crystal-wallet" data-testid="crystal-wallet" aria-label={label}>
      {CRYSTAL_COLOURS.map((colour) => (
        <span key={colour.id} className={purse[colour.id] === 0 ? 'coin is-empty' : 'coin'} data-testid={`coin-${colour.id}`}>
          <CrystalFace id={colour.id} />
          <span>{purse[colour.id]}</span>
        </span>
      ))}
      <strong className="crystal-total" data-testid="crystal-count">
        {total}
      </strong>
    </div>
  );
}
