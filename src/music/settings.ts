/** Grown-up audio choices. Kept apart from lesson progress so a reset does not silence the garden. */

export const AUDIO_SETTINGS_KEY = 'spell-garden.audio.v1';

export type AudioSettings = {
  /** Voices, hints, and story reading. */
  sound: boolean;
  /** Place loops. */
  music: boolean;
  /** 0–1. The loops stay quiet even at the top of the slider. */
  volume: number;
};

export const DEFAULT_AUDIO: AudioSettings = { sound: true, music: true, volume: 0.4 };

const listeners = new Set<(settings: AudioSettings) => void>();

export function normalizeAudio(value: unknown): AudioSettings {
  const raw = value && typeof value === 'object' ? (value as Partial<AudioSettings>) : {};
  const volume = typeof raw.volume === 'number' && Number.isFinite(raw.volume) ? raw.volume : DEFAULT_AUDIO.volume;
  return {
    sound: raw.sound !== false,
    music: raw.music !== false,
    volume: Math.min(1, Math.max(0, volume)),
  };
}

function readStorage(): AudioSettings {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_AUDIO;
    const raw = localStorage.getItem(AUDIO_SETTINGS_KEY);
    if (!raw) return DEFAULT_AUDIO;
    return normalizeAudio(JSON.parse(raw) as unknown);
  } catch {
    return DEFAULT_AUDIO;
  }
}

let current = readStorage();

export function audioSettings(): AudioSettings {
  return current;
}

export function soundEnabled(): boolean {
  return current.sound;
}

export function updateAudio(patch: Partial<AudioSettings>): AudioSettings {
  current = normalizeAudio({ ...current, ...patch });
  try {
    localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(current));
  } catch {
    /* Private mode can refuse storage. The choice still lasts for this visit. */
  }
  for (const listener of listeners) listener(current);
  return current;
}

export function onAudioSettings(listener: (settings: AudioSettings) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
