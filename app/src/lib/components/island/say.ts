// My villager's phrases (docs/design.md "Villager taps"): a tap on my villager opens the picker (SayPicker.svelte), a
// pick shows the phrase in a balloon over it for SAY_MS on both phones (Says.svelte; the relay's `say`, presence only).
// The presets are i18n keys; my own phrases (じぶんで かく) are kept on this phone, the last few, as quick picks. Plain
// TS: the storage and the clock come in.
import { DEVICE, localKV, readJson, writeJson, type KV } from '#lib/sync/storage.ts';
import { cleanSay } from '#lib/sync/live-protocol.ts';

/** The preset phrases (i18n `say.<id>`): greetings and cheer, in the picker's order. */
export const SAY_PRESETS = ['hi', 'otsukare', 'ganbaro', 'yatta', 'aruko', 'oyasumi'] as const;
/** A phrase's balloon shows this long (ms). */
export const SAY_MS = 4000;
/** One phrase over the relay at most this often (ms); a newer pick within it waits, replacing the waiting one. */
export const SAY_GAP_MS = 1500;
/** My own phrases kept as quick picks, newest first. */
export const RECENT_MAX = 3;

/** My own phrases kept on this phone (newest first; cleaned again: the storage is the phone's, not ours). */
export function recentSays(kv: KV | null = localKV()): string[] {
  const kept = readJson<unknown>(kv, DEVICE.says);
  if (!Array.isArray(kept)) return [];
  const out: string[] = [];
  for (const k of kept) {
    const s = cleanSay(k);
    if (s && !out.includes(s)) out.push(s);
  }
  return out.slice(0, RECENT_MAX);
}

/** Keep one of my own phrases (first, once); returns the list as kept. */
export function rememberSay(text: string, kv: KV | null = localKV()): string[] {
  const s = cleanSay(text);
  if (!s) return recentSays(kv);
  const next = [s, ...recentSays(kv).filter((x) => x !== s)].slice(0, RECENT_MAX);
  writeJson(kv, DEVICE.says, next);
  return next;
}

/** The relay's side of my phrases: at most one per `gap`; one picked sooner waits for its turn, and a newer one
 *  replaces it. `send` false (nobody to hear it) is fine: presence only. */
export function sayGate(send: (text: string) => void, gap = SAY_GAP_MS, clock: () => number = Date.now) {
  let last = -Infinity;
  let waiting: string | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const go = (text: string) => {
    last = clock();
    waiting = null;
    send(text);
  };
  return {
    say(text: string) {
      const due = last + gap - clock();
      if (due <= 0 && !waiting) return go(text);
      waiting = text;
      timer ??= setTimeout(() => {
        timer = undefined;
        if (waiting) go(waiting);
      }, Math.max(0, due));
    },
    stop() {
      clearTimeout(timer);
      timer = undefined;
      waiting = null;
    }
  };
}
