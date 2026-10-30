// Sound settings (docs/design/sound.md §10): per device (a phone's speaker is not shared data, so not synced like
// the language), kept in the storage registry (sync/storage.ts DEVICE.sound). Everything starts OFF (an
// app opened on a train must never surprise anyone).
import { DEVICE, readJson, writeJson, type KV } from '#lib/sync/storage.ts';

export interface SoundSettings {
  /** ミュージック: the hourly BGM and the island's ambience. */
  music: boolean;
  /** 効果音: taps, coins, jingles, reactions. */
  sfx: boolean;
  /** おしゃべり: the dialogue text blips. */
  voice: boolean;
  /** 音量: master volume, 0–1. */
  volume: number;
}

export const DEFAULT_SOUND: Readonly<SoundSettings> = Object.freeze({ music: false, sfx: false, voice: false, volume: 0.8 });

/** Anything stored that isn't a well-formed setting falls back to its default. */
export function sanitize(v: unknown): SoundSettings {
  const o = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
  const bool = (k: 'music' | 'sfx' | 'voice') => (typeof o[k] === 'boolean' ? (o[k] as boolean) : DEFAULT_SOUND[k]);
  const vol = typeof o.volume === 'number' && Number.isFinite(o.volume) ? Math.min(1, Math.max(0, o.volume)) : DEFAULT_SOUND.volume;
  return { music: bool('music'), sfx: bool('sfx'), voice: bool('voice'), volume: vol };
}

export const loadSound = (kv: KV | null): SoundSettings => sanitize(readJson(kv, DEVICE.sound));

/** False when it could not be stored (private mode, full): it still applies for this session. */
export const saveSound = (kv: KV | null, s: SoundSettings): boolean => writeJson(kv, DEVICE.sound, sanitize(s));

/** Nothing can sound: no AudioContext is created at all (iOS keeps the audio hardware awake for an open one). */
export const silent = (s: SoundSettings): boolean => s.volume <= 0 || (!s.music && !s.sfx && !s.voice);
