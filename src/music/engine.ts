import { audioSettings, onAudioSettings, type AudioSettings } from './settings.ts';
import { loopSteps, scoreById, type MusicId, type Score, type VoiceScore } from './scores.ts';

export const CROSSFADE_S = 1.6;
export const DUCK = 0.2;
/** Even the top of the slider stays in the background. */
export const MASTER = 0.14;

type AudioCtor = typeof AudioContext;

type Player = {
  stop: (when: number) => void;
};

type BusPlay = {
  id: MusicId;
  bus: GainNode;
  player: Player;
};

let ctx: AudioContext | null = null;
let musicGain: GainNode | null = null;
let noise: AudioBuffer | null = null;
let unlocked = false;
let wanted: MusicId | null = null;
let active: BusPlay | null = null;
let speech = false;
let story = false;
let listening = false;

function ctor(): AudioCtor | null {
  if (typeof window === 'undefined') return null;
  const webkit = (window as Window & { webkitAudioContext?: AudioCtor }).webkitAudioContext;
  return window.AudioContext ?? webkit ?? null;
}

function midiToHz(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

function noiseBuffer(context: AudioContext): AudioBuffer {
  if (noise && noise.sampleRate === context.sampleRate) return noise;
  const length = context.sampleRate * 2;
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  const fade = Math.floor(context.sampleRate * 0.03);
  for (let i = 0; i < fade; i += 1) {
    const ramp = i / fade;
    data[i] *= ramp;
    data[length - 1 - i] *= ramp;
  }
  noise = buffer;
  return buffer;
}

function keep(bag: AudioScheduledSourceNode[], node: AudioScheduledSourceNode): void {
  bag.push(node);
  node.addEventListener('ended', () => {
    const index = bag.indexOf(node);
    if (index >= 0) bag.splice(index, 1);
  });
}

function mark(id: string): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.music = id;
  document.documentElement.dataset.musicDuck = speech || story ? '1' : '0';
}

function targetGain(settings: AudioSettings = audioSettings()): number {
  if (!settings.music) return 0;
  const ducked = speech || story ? DUCK : 1;
  return settings.volume * MASTER * ducked;
}

function applyGain(): void {
  if (!ctx || !musicGain) return;
  const now = ctx.currentTime;
  const next = targetGain();
  musicGain.gain.cancelScheduledValues(now);
  musicGain.gain.setValueAtTime(musicGain.gain.value, now);
  musicGain.gain.linearRampToValueAtTime(next, now + 0.35);
}

function noteLength(notes: number[], index: number, stepDur: number): number {
  let steps = 1;
  for (let cursor = index + 1; cursor < notes.length; cursor += 1) {
    if (notes[cursor] !== -1) break;
    steps += 1;
  }
  return Math.max(0.08, stepDur * steps * 0.92);
}

function envGain(context: AudioContext, bus: GainNode, when: number, peak: number, attack: number, hold: number): GainNode {
  const gain = context.createGain();
  const safe = Math.max(0.0001, peak);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(safe, when + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + attack + hold);
  gain.connect(bus);
  return gain;
}

function tone(
  context: AudioContext,
  bus: GainNode,
  when: number,
  midi: number,
  wave: OscillatorType,
  peak: number,
  attack: number,
  hold: number,
  glide = 0,
): OscillatorNode {
  const osc = context.createOscillator();
  osc.type = wave;
  osc.frequency.setValueAtTime(midiToHz(midi), when);
  if (glide !== 0) osc.frequency.exponentialRampToValueAtTime(midiToHz(midi + glide), when + attack + hold * 0.7);
  osc.connect(envGain(context, bus, when, peak, attack, hold));
  osc.start(when);
  osc.stop(when + attack + hold + 0.05);
  return osc;
}

function trigger(context: AudioContext, bus: GainNode, voice: VoiceScore, midi: number, when: number, dur: number, bag: AudioScheduledSourceNode[]): void {
  const level = voice.level;
  if (voice.kind === 'tap') {
    const src = context.createBufferSource();
    src.buffer = noiseBuffer(context);
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1400;
    filter.Q.value = 0.8;
    src.connect(filter);
    filter.connect(envGain(context, bus, when, level * 0.22, 0.008, 0.07));
    src.start(when);
    src.stop(when + 0.12);
    keep(bag, src);
    return;
  }
  if (voice.kind === 'bubble') {
    keep(bag, tone(context, bus, when, midi, 'sine', level * 0.08, 0.02, 0.2, 5));
    return;
  }
  if (voice.kind === 'bell') {
    keep(bag, tone(context, bus, when, midi, 'sine', level * 0.07, 0.01, Math.min(1.1, dur)));
    keep(bag, tone(context, bus, when, midi + 12, 'sine', level * 0.03, 0.01, Math.min(0.7, dur)));
    return;
  }
  if (voice.kind === 'pluck') {
    keep(bag, tone(context, bus, when, midi, 'triangle', level * 0.07, 0.012, Math.min(0.42, dur)));
    return;
  }
  keep(bag, tone(context, bus, when, midi, 'sine', level * 0.06, 0.06, dur));
}

function startBed(context: AudioContext, bus: GainNode, voice: VoiceScore, when: number, bag: AudioScheduledSourceNode[]): void {
  if (voice.kind === 'water') {
    const src = context.createBufferSource();
    src.buffer = noiseBuffer(context);
    src.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 640;
    const gain = context.createGain();
    gain.gain.setValueAtTime(voice.level * 0.015, when);
    const lfo = context.createOscillator();
    lfo.frequency.value = 0.18;
    const depth = context.createGain();
    depth.gain.value = voice.level * 0.01;
    lfo.connect(depth);
    depth.connect(gain.gain);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(bus);
    src.start(when);
    lfo.start(when);
    keep(bag, src);
    keep(bag, lfo);
    return;
  }
  if (voice.kind !== 'pad' || !voice.tones) return;
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.linearRampToValueAtTime(voice.level * 0.035, when + 1.4);
  gain.connect(bus);
  for (const midi of voice.tones) {
    for (const detune of [1, 1.004]) {
      const osc = context.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = midiToHz(midi) * detune;
      osc.connect(gain);
      osc.start(when);
      keep(bag, osc);
    }
  }
}

function startPlayer(context: AudioContext, bus: GainNode, score: Score): Player {
  const steps = loopSteps(score);
  const stepDur = (60 / score.bpm) * score.step;
  const loopDur = stepDur * Math.max(1, steps);
  const bag: AudioScheduledSourceNode[] = [];
  let alive = true;
  let next = context.currentTime + 0.06;
  for (const voice of score.voices) {
    if (voice.kind === 'pad' || voice.kind === 'water') startBed(context, bus, voice, next, bag);
  }

  function schedule(loopStart: number) {
    for (const voice of score.voices) {
      if (!voice.notes) continue;
      voice.notes.forEach((midi, index) => {
        if (midi <= 0) return;
        const when = loopStart + index * stepDur;
        if (when < context.currentTime - 0.02) return;
        trigger(context, bus, voice, midi, when, noteLength(voice.notes ?? [], index, stepDur), bag);
      });
    }
  }

  function tick() {
    if (!alive) return;
    const horizon = context.currentTime + 0.4;
    while (next < horizon) {
      schedule(next);
      next += loopDur;
    }
  }

  tick();
  const timer = window.setInterval(tick, 100);
  return {
    stop(when: number) {
      alive = false;
      window.clearInterval(timer);
      for (const source of bag.splice(0, bag.length)) {
        try {
          source.stop(when);
        } catch {
          /* Already finished. */
        }
      }
    },
  };
}

function drop(play: BusPlay | null) {
  if (!play || !ctx) return;
  const now = ctx.currentTime;
  play.bus.gain.cancelScheduledValues(now);
  play.bus.gain.setValueAtTime(play.bus.gain.value, now);
  play.bus.gain.linearRampToValueAtTime(0, now + CROSSFADE_S);
  const bus = play.bus;
  const player = play.player;
  window.setTimeout(() => {
    player.stop(ctx?.currentTime ?? 0);
    try {
      bus.disconnect();
    } catch {
      /* Already gone. */
    }
  }, CROSSFADE_S * 1000 + 80);
}

function startWanted() {
  if (!ctx || !musicGain || !unlocked) return;
  const settings = audioSettings();
  if (!settings.music || !wanted) {
    drop(active);
    active = null;
    mark('');
    applyGain();
    return;
  }
  if (active?.id === wanted) return;
  const bus = ctx.createGain();
  const now = ctx.currentTime;
  bus.gain.setValueAtTime(0, now);
  bus.gain.linearRampToValueAtTime(1, now + CROSSFADE_S);
  bus.connect(musicGain);
  const player = startPlayer(ctx, bus, scoreById(wanted));
  drop(active);
  active = { id: wanted, bus, player };
  mark(wanted);
  applyGain();
}

function ensureGraph() {
  if (ctx) return;
  const Audio = ctor();
  if (!Audio) return;
  ctx = new Audio();
  musicGain = ctx.createGain();
  musicGain.gain.value = 0;
  musicGain.connect(ctx.destination);
  applyGain();
}

/** iOS will only start audio inside a tap. The first pointer or key unlocks every loop after that. */
export function listenForMusic(): void {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  const unlock = () => {
    unlocked = true;
    ensureGraph();
    void ctx?.resume();
    startWanted();
  };
  window.addEventListener('pointerdown', unlock, { capture: true });
  window.addEventListener('keydown', unlock, { capture: true });
  onAudioSettings(() => {
    applyGain();
    startWanted();
  });
}

export function playMusic(id: MusicId | null): void {
  wanted = id;
  if (!unlocked) {
    mark('');
    return;
  }
  startWanted();
}

function markDuck(): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.musicDuck = speech || story ? '1' : '0';
}

export function setSpeechAudible(on: boolean): void {
  speech = on;
  markDuck();
  applyGain();
}

export function setStoryAudible(on: boolean): void {
  story = on;
  markDuck();
  applyGain();
}

/** Test hook. True once a tap has opened the audio graph. */
export function musicUnlocked(): boolean {
  return unlocked;
}
