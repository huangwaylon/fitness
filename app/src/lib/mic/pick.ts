// The mic's choices on this phone (docs/kikimimi-mic.md §2.6, §3.2): the switch and the 音声認識 picked in せってい
// (DEVICE.mic), and which recogniser that means here. 自動 is the phone's own whisper only: Safari's and the relay's
// send the voice off the phone, so they are used only when picked by hand (after their disclosure). The probe's
// numbers may refine 自動 once the user has run it (M0's step); until then this rule stands. Pure but for the store
// it's handed.
import { DEVICE, readJson, writeJson, type KV } from '#lib/sync/storage.ts';

export const CHOICES = ['auto', 'whisper', 'webkit', 'relay'] as const;
export type Choice = (typeof CHOICES)[number];
export type Backend = Exclude<Choice, 'auto'>;

export interface MicPrefs {
  on: boolean;
  be: Choice;
}

/** What can run on this phone now: whisper's model served or cached, Safari's recogniser, the relay (paired). */
export type Can = Record<Backend, boolean>;

/** The recogniser a choice gives here (null: none can run; the mic still captures). */
export function pickBackend(be: Choice, can: Can): Backend | null {
  if (be === 'auto') return can.whisper ? 'whisper' : null;
  return can[be] ? be : null;
}

/** A stored value made safe (anything else: off). */
export function sanitizeMic(v: unknown): MicPrefs {
  const o = (v && typeof v === 'object' ? v : {}) as Partial<Record<keyof MicPrefs, unknown>>;
  return { on: o.on === true, be: CHOICES.includes(o.be as Choice) ? (o.be as Choice) : 'auto' };
}

export const readMic = (kv: KV | null): MicPrefs => sanitizeMic(readJson(kv, DEVICE.mic));
export const keepMic = (kv: KV | null, p: MicPrefs): boolean => writeJson(kv, DEVICE.mic, p);
