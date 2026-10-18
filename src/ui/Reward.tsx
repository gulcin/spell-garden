import type { Reward } from '../story.ts';

export function RewardScreen({ reward, name, onHome }: { reward: Reward; name: string; onHome: () => void }) {
  return (
    <section className="reward panel" data-testid="reward">
      <p className="kicker">A cosy reward</p>
      <div className={`reward-art reward-${reward.kind}`} aria-hidden />
      <h1>{reward.name}</h1>
      <p>{reward.line}</p>
      <p>{name}, the tower is a little more itself now. Rest whenever you like.</p>
      <button type="button" className="btn gold xl" data-testid="reward-home" onClick={onHome}>
        Back to the tower
      </button>
    </section>
  );
}
