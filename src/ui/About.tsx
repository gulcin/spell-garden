import { ATTRIBUTION } from '../curriculum/types.ts';
import { PROGRESS_KEY } from '../progress/types.ts';

export function About({ onHome }: { onHome: () => void }) {
  return (
    <article className="about panel">
      <button type="button" className="text-link" onClick={onHome}>
        Back to the tower
      </button>
      <h1>About this garden</h1>
      <p>
        Prague is a young apprentice. She does not fight anything. Maths mends bridges, fills potion bottles, wakes sleepy
        creatures, and lights lanterns. Every picture here is original.
      </p>
      <p>
        The spells follow the open Marble maths topics, from early counting through early algebra. A new garden starts
        around IB PYP Grade 3 (about age 8). Missing ideas are practised first, and the path can climb with no age ceiling.
        A grown-up can change that starting level in the journal.
      </p>
      <p className="attribution">{ATTRIBUTION}</p>
      <p>
        Progress stays on this device under the localStorage key <code>{PROGRESS_KEY}</code>. Nothing is sent over the network
        while you play. Add the garden to the home screen and it keeps working on a plane.
      </p>
      <p>Hints are read aloud in an English voice. Tap “Hear it again” any time. “I don't know” walks through the idea, then offers a fresh try.</p>
    </article>
  );
}
