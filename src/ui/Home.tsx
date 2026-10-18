import { allTopics, domains } from '../curriculum/data.ts';
import { statusOf, masteredIds } from '../progress/mastery.ts';
import type { Progress } from '../progress/types.ts';
import { REWARDS } from '../story.ts';

export function Home({
  progress,
  onStart,
  onGarden,
  onAbout,
  onParent,
  onRename,
}: {
  progress: Progress;
  onStart: () => void;
  onGarden: () => void;
  onAbout: () => void;
  onParent: () => void;
  onRename: (name: string) => void;
}) {
  const mastered = masteredIds(progress);
  const friends = REWARDS.filter((reward) => reward.kind === 'friend' && progress.rewards.includes(reward.id));
  return (
    <div className="home">
      <header className="hero">
        <div className="tower">
          <div className="tower-build" aria-hidden>
            <span className="moon" />
            <span className="roof" />
            <span className="walls">
              <i className="window" />
              <i className="door" />
            </span>
            {friends.map((friend) => (
              <span key={friend.id} className={`friend friend-${friend.id}`} title={friend.name} />
            ))}
          </div>
          <img
            className="apprentice"
            src={`${import.meta.env.BASE_URL}apprentice.png`}
            width={560}
            height={668}
            alt="Prague, with long dark blond hair, blue eyes, a raised wand, and an owl on her shoulder"
          />
        </div>
        <p className="kicker">A gentle wizard garden</p>
        <h1>{progress.learnerName}'s Spell Garden</h1>
        <p className="lede">Kind magic, grown slowly with maths. No hurry, no timers, no scary things.</p>
        <label className="name-edit">
          Her name
          <input
            value={progress.learnerName}
            data-testid="learner-name"
            onChange={(event) => onRename(event.target.value)}
            maxLength={24}
          />
        </label>
      </header>
      <section className="map" aria-label="Spell map">
        <div className="map-head">
          <h2>The garden map</h2>
          <button type="button" className="text-link" data-testid="garden-link" onClick={onGarden}>
            Open the beds
          </button>
        </div>
        <div className="beds">
          {domains().map((domain) => {
            const topics = allTopics().filter((topic) => topic.domain === domain);
            const done = topics.filter((topic) => statusOf(topic, progress, mastered) === 'mastered').length;
            const ready = topics.filter((topic) => statusOf(topic, progress, mastered) === 'ready').length;
            return (
              <button key={domain} type="button" className="bed" onClick={onGarden}>
                <strong>{domain}</strong>
                <span>
                  {done} glowing · {ready} ready
                </span>
              </button>
            );
          })}
        </div>
      </section>
      <button type="button" className="btn gold xl start" data-testid="start" onClick={onStart}>
        {progress.placement.done ? "Begin today's chapter" : 'Wake the lanterns'}
      </button>
      <nav className="home-nav">
        <button type="button" data-testid="about-link" onClick={onAbout}>
          About
        </button>
        <button type="button" data-testid="parent-link" onClick={onParent}>
          Grown-ups
        </button>
      </nav>
    </div>
  );
}
