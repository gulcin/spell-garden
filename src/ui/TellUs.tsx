import { useState } from 'react';
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
  return (
    <button
      type="button"
      className="tell-us"
      data-testid="tell-us"
      onClick={() => {
        speak('Tell us');
        onOpen();
      }}
    >
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

  function dictate() {
    const host = window as Window & { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor };
    const Ctor = host.SpeechRecognition ?? host.webkitSpeechRecognition;
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
    if (!kind) return;
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
      /* The note is still shown. A grown-up can send the letter. */
    }
    setKept(report);
    speak('Kept. You can send it to Mum.');
  }

  return (
    <div className="tell-backdrop" role="presentation" onClick={onClose}>
      <section
        className="tell-sheet"
        role="dialog"
        aria-labelledby="tell-title"
        data-testid="tell-sheet"
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
              onClick={() => setKind(choice.id)}
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
          <button type="button" className="btn gold xl" data-testid="tell-keep" disabled={!kind} onClick={keep}>
            Keep this note
          </button>
        )}
        <button type="button" className="text-link" data-testid="tell-close" onClick={onClose}>
          Close
        </button>
      </section>
    </div>
  );
}
