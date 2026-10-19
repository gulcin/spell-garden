import { setSpeechAudible } from './music/engine.ts';
import { onAudioSettings, soundEnabled } from './music/settings.ts';

export const ADVENTURE_RATE = 0.86;

let speechTicket = 0;
let duckTimer = 0;

/** How long to wait before lifting the music duck if the voice never finishes. */
export function speechDuckFallback(text: string): number {
  const words = text.split(' ').filter(Boolean).length;
  return Math.min(20000, Math.max(2500, words * 400 + 800));
}

export function stopSpeaking(): void {
  speechTicket += 1;
  if (typeof window !== 'undefined') window.clearTimeout(duckTimer);
  setSpeechAudible(false);
  if (typeof window === 'undefined') return;
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* Some browsers throw if speech was never started. */
  }
}

onAudioSettings((settings) => {
  if (!settings.sound) stopSpeaking();
});

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
  if (!synth || !soundEnabled()) {
    setSpeechAudible(false);
    return;
  }
  const ticket = ++speechTicket;
  try {
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = 'en-GB';
    utter.rate = 0.93;
    utter.pitch = 1.06;
    const release = () => {
      if (ticket !== speechTicket) return;
      window.clearTimeout(duckTimer);
      setSpeechAudible(false);
    };
    utter.onstart = () => setSpeechAudible(true);
    utter.onend = release;
    utter.onerror = release;
    setSpeechAudible(true);
    window.clearTimeout(duckTimer);
    duckTimer = window.setTimeout(release, speechDuckFallback(clean));
    const voices = synth.getVoices?.() ?? [];
    const voice =
      voices.find((item) => /en-GB/i.test(item.lang) && /female|libby|sonia|fiona|emma|woman/i.test(item.name)) ??
      voices.find((item) => /^en-GB/i.test(item.lang)) ??
      voices.find((item) => /^en/i.test(item.lang));
    if (voice) utter.voice = voice;
    synth.speak(utter);
  } catch {
    if (ticket === speechTicket) setSpeechAudible(false);
  }
}

declare global {
  interface Window {
    __speechLog?: string[];
    __prague?: { item: unknown; getState: () => unknown; solved?: () => boolean };
  }
}
