export const ADVENTURE_RATE = 0.86;

export function pickUsVoice(voices: { lang: string; name: string }[]): { lang: string; name: string } | null {
  const american = voices.filter((voice) => /^en-US/i.test(voice.lang));
  return (
    american.find((voice) => /female|aria|jenny|sara|samantha|ava|zira/i.test(voice.name)) ?? american[0] ?? null
  );
}

export function speak(text: string): void {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean || typeof window === 'undefined') return;
  window.__speechLog = window.__speechLog ?? [];
  window.__speechLog.push(clean);
  const synth = window.speechSynthesis;
  if (!synth) return;
  try {
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = 'en-GB';
    utter.rate = 0.93;
    utter.pitch = 1.06;
    const voices = synth.getVoices?.() ?? [];
    const voice =
      voices.find((item) => /en-GB/i.test(item.lang) && /female|libby|sonia|fiona|emma|woman/i.test(item.name)) ??
      voices.find((item) => /^en-GB/i.test(item.lang)) ??
      voices.find((item) => /^en/i.test(item.lang));
    if (voice) utter.voice = voice;
    synth.speak(utter);
  } catch {
    /* A browser without a working speech engine still keeps the log. */
  }
}

declare global {
  interface Window {
    __speechLog?: string[];
    __prague?: { item: unknown; getState: () => unknown; solved?: () => boolean };
  }
}
