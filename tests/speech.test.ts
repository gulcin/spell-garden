import { afterEach, describe, expect, it, vi } from 'vitest';
import { updateAudio } from '../src/music/settings.ts';
import { speak, speechDuckFallback, stopSpeaking } from '../src/speech.ts';

class FakeUtterance {
  lang = '';
  rate = 1;
  pitch = 1;
  voice: unknown = null;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public text: string) {}
}

afterEach(() => {
  stopSpeaking();
  updateAudio({ sound: true, music: true, volume: 0.4 });
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('speech and the music duck', () => {
  it('lifts the duck if the voice never finishes', () => {
    vi.useFakeTimers();
    const dataset: Record<string, string> = {};
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
    vi.stubGlobal('document', { documentElement: { dataset } });
    vi.stubGlobal('window', {
      speechSynthesis: { cancel() {}, getVoices: () => [], speak() {} },
      clearTimeout: (id: number) => clearTimeout(id),
      setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
    });
    speak('Hello there friend');
    expect(dataset.musicDuck).toBe('1');
    vi.advanceTimersByTime(speechDuckFallback('Hello there friend'));
    expect(dataset.musicDuck).toBe('0');
  });

  it('cancels a voice that is already talking when sound turns off', () => {
    const dataset: Record<string, string> = {};
    const cancel = vi.fn();
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
    vi.stubGlobal('document', { documentElement: { dataset } });
    vi.stubGlobal('window', {
      speechSynthesis: { cancel, getVoices: () => [], speak() {} },
      clearTimeout() {},
      setTimeout: () => 1,
    });
    speak('Keep talking please');
    expect(dataset.musicDuck).toBe('1');
    updateAudio({ sound: false });
    expect(cancel).toHaveBeenCalled();
    expect(dataset.musicDuck).toBe('0');
  });
});
