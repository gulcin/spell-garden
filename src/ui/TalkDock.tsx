import { useEffect, useState } from 'react';
import { personAt } from '../cast/people.ts';
import { applyTalk, type TalkStep, type TalkView } from '../cast/talk.ts';
import type { Progress } from '../progress/types.ts';
import { speak } from '../speech.ts';

const MENU: TalkStep = { at: 'menu' };

export function TalkDock({
  progress,
  update,
  placeId,
}: {
  progress: Progress;
  update: (recipe: (current: Progress) => Progress) => void;
  placeId: string;
}) {
  const person = personAt(placeId);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<TalkStep>(MENU);
  const [view, setView] = useState<TalkView | null>(null);

  useEffect(() => {
    if (open && view?.line) speak(view.line);
  }, [open, view?.line]);

  if (!person) return null;
  const portrait = `${import.meta.env.BASE_URL}art/cast/${person.id}`;

  function choose(replyId: string | null, from: TalkStep) {
    const preview = applyTalk(progress, placeId, replyId, from);
    setStep(preview.step);
    setView(preview.view);
    setOpen(true);
    update((current) => applyTalk(current, placeId, replyId, from).progress);
  }

  return (
    <>
      <button type="button" className="friend-chip" data-testid={`talk-${person.id}`} onClick={() => choose(null, MENU)}>
        <img src={`${portrait}.webp`} srcSet={`${portrait}.webp 1x, ${portrait}@2x.webp 2x`} alt="" />
        <span>Talk to {person.name}</span>
      </button>
      {open && view ? (
        <div className="talk-layer" role="presentation">
          <section className="talk-card" role="dialog" aria-modal="true" aria-label={`Talking with ${person.name}`} data-testid="talk">
            <div className="talk-who">
              <img src={`${portrait}.webp`} srcSet={`${portrait}.webp 1x, ${portrait}@2x.webp 2x`} alt="" />
              <div>
                <p className="kicker">{person.role}</p>
                <h2>{person.name}</h2>
                <p>{person.blurb}</p>
              </div>
            </div>
            <p className="talk-line" data-testid="talk-line">
              {view.line}
            </p>
            <div className="talk-replies">
              {view.replies.map((reply) => (
                <button key={reply.id} type="button" className="btn" data-testid={`reply-${reply.id}`} onClick={() => choose(reply.id, step)}>
                  {reply.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="btn quiet"
              data-testid="talk-close"
              onClick={() => setOpen(false)}
            >
              Bye for now
            </button>
          </section>
        </div>
      ) : null}
    </>
  );
}
