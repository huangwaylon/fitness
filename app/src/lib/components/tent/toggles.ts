// What a tap on a room's piece does besides a jiggle (docs/design.md "The tent": Things that do something), pure: each
// piece's family by its NH code (the rule: toggles.test.ts reads NH's English names), the switched ones' state and the
// play spot by an instrument. No items.json here: the island's tap code reads it too (its first load).
//   Switched (kept, on every phone: the piece's light switch, contract/tent.ts `lt`/`l`, as a lamp's): a screen (on,
// then a tap a channel, after the last off), a fan, a washer, a tap's water, a bath's steam, a heater. Off as they come
// unless they are a light too (NH's lamp-like ones: on as they came). A screen's channel is its switch's time
// (atFor: the op's time `at`, a few ms later, its remainder CHANNELS): nothing new on the wire.
//   One-off (this phone's, not sent): an instrument played (my villager walks up and plays a few seconds, a riff), a
// wardrobe's or a fridge's door and a look inside, a toy's little move.

import { CHANNELS } from '#lib/contract/tent.ts';
export { CHANNELS, atFor, channelOf } from '#lib/contract/tent.ts';

export type Instrument = 'keys' | 'strings' | 'drums' | 'gong' | 'mallet' | 'winds' | 'theremin' | 'sing' | 'dj';
export type Switched = 'screen' | 'fan' | 'washer' | 'water' | 'steam' | 'heater';
export type Family = Instrument | Switched | 'closet' | 'toy';
/** A toy's move: ticking side to side, rocking to and fro (a rocking horse), a turn, a shake, flipped over and back, a
 *  hop. */
export type ToyMove = 'sway' | 'rock' | 'spin' | 'shake' | 'flip' | 'hop';
/** What a wardrobe's or a fridge's look inside finds. */
export type Inside = 'clothes' | 'cold' | 'stuff';

/** NH's codes by family (`f` dropped). */
const CODES: Record<Family, string> = {
  screen: '1009 1087 1108 1221 8225 8226 8227 12342 13207 13295 13464 13502 13521 1222 1850 3252 3333 3590 12778 13209 3399 3428 3986 13640 13157 13925 2596 12690 3465 12257',
  fan: '2736 3820 957 3431 13156',
  washer: '1227 2740 12710',
  water: '547 1229 1314 1631 4015 4026 13591 4017 7230 3683 13338',
  steam: '1757 1840 4080 7153 13203 1836 5961 14554 14483 4008 3819 1111 3689',
  heater: '2771',
  keys: '1081 1171 1875 4070 12516 11942 12409 7045',
  strings: '669 987 1449 1644 1645 2772 5955 383',
  drums: '1803 1906 13471 13774 4093',
  gong: '4075',
  mallet: '4121',
  winds: '846 1206 13470',
  theremin: '3063',
  sing: '1045 9503 13476',
  dj: '941',
  closet: '2560 3436 833 2713 3959 3972 3997 4049 4109 4135 9502 9766 12670 12673 12674 12677 12701 12998 13080 13108 13109 13110 13111 13118 13143 13189 13884 14526 12437 5960 12264 9642 3271 3196 12559 12561 1263 12573 1561',
  toy: '1153 12612 13306 1042 1124 1145 1411 1892 3623 8464 13522 13719 14352 14353 14354 3555 1504 83 685 12274 7147 14023 14300 13251 13252 690 13243 6830 13247 5975 12412 14592 3206'
};
const codes = (s: string) => s.split(' ').map((n) => `f${n}`);
const FAMILY: ReadonlyMap<string, Family> = new Map(Object.entries(CODES).flatMap(([f, s]) => codes(s).map((c) => [c, f as Family] as const)));
const TOYS: Record<Exclude<ToyMove, 'hop'>, string> = {
  sway: '8464 1042 5975 12412 13306',
  rock: '83 685 14300',
  spin: '1411 14023 1153 6830 14592',
  shake: '1124 1145 12612 13252',
  flip: '1892'
};
const TOY: ReadonlyMap<string, ToyMove> = new Map(Object.entries(TOYS).flatMap(([m, s]) => codes(s).map((c) => [c, m as ToyMove] as const)));
const COLD = new Set(codes('2713 4109 4135 9766'));
const STUFF = new Set(codes('2560 833 3972 12670 12673 12674 12677 12701 13884 14526 3271 12573 1561'));

export const INSTRUMENTS: readonly Instrument[] = ['keys', 'strings', 'drums', 'gong', 'mallet', 'winds', 'theremin', 'sing', 'dj'];
export const SWITCHED: readonly Switched[] = ['screen', 'fan', 'washer', 'water', 'steam', 'heater'];
/** The switched families that move while on (a frame now and then: the room's ambient rate); a screen and a heater
 *  only glow (no frames). */
export const MOVING: ReadonlySet<Switched> = new Set(['fan', 'washer', 'water', 'steam']);

/** A piece's family (its code), null: it only jiggles. */
export const familyOf = (code: string): Family | null => FAMILY.get(code) ?? null;
export const isInstrument = (f: Family | null): f is Instrument => !!f && (INSTRUMENTS as readonly string[]).includes(f);
export const isSwitched = (f: Family | null): f is Switched => !!f && (SWITCHED as readonly string[]).includes(f);
/** Every code of a family (the tests', the docs' counts). */
export const codesOf = (f: Family): string[] => codes(CODES[f]);
export const toyMove = (code: string): ToyMove => TOY.get(code) ?? 'hop';
export const insideOf = (code: string): Inside => (COLD.has(code) ? 'cold' : STUFF.has(code) ? 'stuff' : 'clothes');

/** A switched piece on: its switch (`l`), else as it came (a light too, `lt`: on; else off). */
export const onOf = (l: 0 | 1 | undefined, lt: boolean): boolean => (l ?? (lt ? 1 : 0)) === 1;

/** Each channel's glow (linear rgb): the news' cool white, a nature film's green, a cartoon's pink. */
export const TINTS: readonly (readonly [number, number, number])[] = [[0.72, 0.86, 1], [0.5, 1, 0.62], [1, 0.58, 0.86]];

/** What a tap on a switched piece makes it: a screen off → on (channel 0), on → the next channel, after the last off;
 *  the rest on ↔ off. */
export function nextOf(f: Switched, on: boolean, ch: number): { l: 0 | 1; ch?: number } {
  if (!on) return f === 'screen' ? { l: 1, ch: 0 } : { l: 1 };
  if (f === 'screen' && ch < CHANNELS - 1) return { l: 1, ch: ch + 1 };
  return { l: 0 };
}

/** At most this many switched pieces move at once (the nearest the room's middle); the others stay on, still. */
export const ACTIVE_MAX = 4;
/** The moving ones to animate: the nearest `mid` first, at most ACTIVE_MAX (ties by id: the same on every phone). */
export function activeOf<T extends { id: string; at: readonly [number, number] }>(on: readonly T[], mid: readonly [number, number]): T[] {
  const d = (p: T) => Math.hypot(p.at[0] - mid[0], p.at[1] - mid[1]);
  return [...on].sort((a, b) => d(a) - d(b) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)).slice(0, ACTIVE_MAX);
}

/** An instrument's play: how long (ms). */
export const PLAY_MS = 3600;
/** How far out of a piece's footprint one stands to play it (model units). */
const STEP = 4;
/** Where to stand to play an instrument (model units) and the way to face: its front's middle, else a side's, else its
 *  back's, the nearest `near` of those `free` (grid.ts standable); null when none is. `half`: its footprint's half
 *  extents in its own frame (w, d), `f` its facing, `c` its middle. */
export function playSpot(c: readonly [number, number], half: readonly [number, number], f: number, free: (p: readonly [number, number]) => boolean, near: readonly [number, number]): [number, number] | null {
  const [W, D] = [half[0] + STEP, half[1] + STEP], t = (((f % 4) + 4) % 4) * (Math.PI / 2), co = Math.round(Math.cos(t)), si = Math.round(Math.sin(t));
  // (a point in its own frame turned as the room turns it: grid.ts toRoom)
  const at = (x: number, z: number): [number, number] => [c[0] + (x * co + z * si || 0), c[1] + (z * co - x * si || 0)];
  const tiers = [[at(0, D)], [at(-W, 0), at(W, 0)], [at(0, -D)]];
  for (const tier of tiers) {
    const ok = tier.filter(free);
    if (ok.length) return ok.reduce((a, b) => (Math.hypot(b[0] - near[0], b[1] - near[1]) < Math.hypot(a[0] - near[0], a[1] - near[1]) ? b : a));
  }
  return null;
}
