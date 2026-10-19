import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { deviceContext, reportMailto, saveReport, type Report, type ReportKind } from '../feedback/reports.ts';
import { useReportLive } from '../feedback/live.tsx';
import { speak } from '../speech.ts';

const CHOICES: { id: ReportKind; label: string }[] = [
  { id: 'love', label: 'I love this' },
  { id: 'broken', label: 'Something is broken' },
  { id: 'idea', label: 'Idea' },
];

type SpeechCtor = new () => {
  lang: string;
  start: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
};

export function TellUsButton({ onOpen }: { onOpen: () => void }) {
  const spoken = useRef(0);
  function open(event: { preventDefault: () => void; stopPropagation: () => void; pointerType?: string; button?: number }) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    onOpen();
    const now = performance.now();
    if (now - spoken.current < 400) return;
    spoken.current = now;
    speak('Tell us');
  }
  return (
    <button type="button" className="tell-us" data-testid="tell-us" onPointerUp={open} onClick={open}>
      Tell us
    </button>
  );
}

export function TellSheet({ onClose }: { onClose: () => void }) {
  const { live } = useReportLive();
  const [kind, setKind] = useState<ReportKind | null>(null);
  const [text, setText] = useState('');
  const [kept, setKept] = useState<Report | null>(null);
  const [heard, setHeard] = useState<string | null>(null);
  const [armed, setArmed] = useState(false);
  const saving = useRef(false);
  const host = typeof document === 'undefined' ? null : document.body;

  useEffect(() => {
    const id = window.setTimeout(() => setArmed(true), 450);
    return () => window.clearTimeout(id);
  }, []);

  function dictate() {
    const win = window as Window & { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor };
    const Ctor = win.SpeechRecognition ?? win.webkitSpeechRecognition;
    if (!Ctor) {
      setHeard('This iPad can still use the keyboard. A grown-up can turn on dictation in Settings.');
      return;
    }
    const rec = new Ctor();
    rec.lang = 'en-GB';
    rec.onresult = (event) => {
      const line = event.results[0]?.[0]?.transcript ?? '';
      if (!line) return;
      setText((current) => (current ? `${current} ${line}` : line));
      setHeard('Heard you.');
    };
    rec.onerror = () => {
      setHeard('This iPad can still use the keyboard. A grown-up can turn on dictation in Settings.');
    };
    setHeard('Listening…');
    rec.start();
  }

  function keep() {
    if (!kind || kept || saving.current) return;
    saving.current = true;
    const report: Report = {
      id: `note-${Date.now()}`,
      kind,
      text: text.trim(),
      createdAt: Date.now(),
      context: deviceContext(live),
    };
    try {
      saveReport(report);
    } catch {
      /* The note stays on screen. A grown-up can still send the letter. */
    }
    setKept(report);
    speak('Kept. You can send it to Mum.');
  }

  function requestClose() {
    if (!armed) return;
    onClose();
  }

  if (!host) return null;

  return createPortal(
    <div
      className="tell-backdrop"
      role="presentation"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={requestClose}
    >
      <section
        className="tell-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tell-title"
        data-testid="tell-sheet"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <p className="kicker">A note for the garden</p>
        <h2 id="tell-title">Tell us</h2>
        <div className="tell-choices">
          {CHOICES.map((choice) => (
            <button
              key={choice.id}
              type="button"
              className={kind === choice.id ? 'on' : ''}
              data-testid={`tell-${choice.id}`}
              aria-pressed={kind === choice.id}
              onPointerUp={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setKind(choice.id);
              }}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setKind(choice.id);
              }}
            >
              {choice.label}
            </button>
          ))}
        </div>
        <label className="tell-write">
          A few words, if you like
          <textarea
            data-testid="tell-text"
            value={text}
            maxLength={500}
            rows={3}
            placeholder="You can leave this empty."
            onChange={(event) => setText(event.target.value)}
          />
        </label>
        <button type="button" className="btn quiet" data-testid="tell-mic" onClick={dictate}>
          Say it
        </button>
        <p className="tell-hint">{heard ?? 'Tap the microphone and say it, if you like.'}</p>
        {kept ? (
          <>
            <p className="note good" data-testid="tell-kept">
              Kept. Thank you. A copy stays on this iPad, and you can send it to Mum.
            </p>
            <a className="btn gold xl" data-testid="tell-send" href={reportMailto(kept)}>
              Send to Mum
            </a>
          </>
        ) : (
          <button
            type="button"
            className="btn gold xl"
            data-testid="tell-keep"
            disabled={!kind}
            onPointerUp={(event) => {
              event.preventDefault();
              event.stopPropagation();
              keep();
            }}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              keep();
            }}
          >
            Keep this note
          </button>
        )}
        <button type="button" className="text-link" data-testid="tell-close" onClick={onClose}>
          Close
        </button>
      </section>
    </div>,
    host,
  );
}
