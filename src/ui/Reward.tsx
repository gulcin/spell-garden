import type { Reward } from '../story.ts';
import { DressedApprentice } from './DressedApprentice.tsx';
import { Prop, REWARD_ART } from './pictures.tsx';

export function RewardScreen({ reward, name, onHome }: { reward: Reward; name: string; onHome: () => void }) {
  return (
    <section className="reward panel" data-testid="reward">
      <div className="sparkles" aria-hidden>
        {Array.from({ length: 10 }, (_, i) => (
          <i key={i} style={{ ['--i' as string]: i }}>
            <img src={`${import.meta.env.BASE_URL}art/star.webp`} alt="" />
          </i>
        ))}
      </div>
      <p className="kicker">A cosy reward</p>
      <div className="reward-row">
        <DressedApprentice className="guide guide-small" alt="" />
        <Prop name={REWARD_ART[reward.id] ?? 'star'} className="reward-prop" alt={reward.name} />
      </div>
      <h1>{reward.name}</h1>
      <p>{reward.line}</p>
      <p>{name}, the tower is a little more itself now. Rest whenever you like.</p>
      <button type="button" className="btn gold xl" data-testid="reward-home" onClick={onHome}>
        Back to the tower
      </button>
    </section>
  );
}