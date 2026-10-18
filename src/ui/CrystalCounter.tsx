import { Prop } from './pictures.tsx';

export function CrystalCounter({ count }: { count: number }) {
  const safe = Math.max(0, Math.floor(count));
  return (
    <p className="crystal-count" data-testid="crystal-count" aria-label={`${safe} crystals`}>
      <Prop name="crystal" alt="" />
      <span>{safe}</span>
    </p>
  );
}
