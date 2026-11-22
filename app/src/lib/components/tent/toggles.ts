// What a tap on a room's piece does besides a jiggle (docs/design.md "The tent": Things that do something), pure: each
// piece's family by its NH code (the rule: toggles.test.ts reads NH's English names), the switched ones' state and the
// play spot by an instrument. No items.json here: the island's tap code reads it too (its first load).
//   Switched (kept, on every phone: the piece's light switch, contract/tent.ts `lt`/`l`, as a lamp's): a screen (on,
// then a tap a channel, after the last off), a fan, a washer, a tap's water, a bath's steam, a heater. Off as they come
// unless they are a light too (NH's lamp-like ones: on as they came). A screen's channel is its switch's time
// (atFor: the op's time `at`, a few ms later, its remainder CHANNELS): nothing new on the wire.
//   One-off (this phone's, not sent): an instrument played (my villager walks up and plays a few seconds, a riff), a
// wardrobe's or a fridge's door and a look inside, a toy's little move; a mirror, a clothes rack or a clothes
// wardrobe walked up to, a look in it, then the looks sheet; a clock says the time; a bin gets something tossed in;
// a gadget answers (a machine whirs, a lucky cat beckons, a dharma wobbles, a piggy bank clinks, a radio crackles…).

import { CHANNELS } from '#lib/contract/tent.ts';
export { CHANNELS, atFor, channelOf } from '#lib/contract/tent.ts';

export type Instrument = 'keys' | 'strings' | 'drums' | 'gong' | 'mallet' | 'winds' | 'theremin' | 'sing' | 'dj';
export type Switched = 'screen' | 'fan' | 'washer' | 'water' | 'steam' | 'heater' | 'glow';
/** A one-off's answer where it stands: a machine whirring, confetti or bubbles bursting out, a lucky cat beckoning,
 *  a dharma wobbling, a coin clinking in, a radio crackling, a bell ringing, a toy running its loop, a tree twinkling. */
export type Gadget = 'whir' | 'burst' | 'beckon' | 'wobble' | 'coin' | 'radio' | 'bell' | 'loop' | 'twinkle';
export type Family = Instrument | Switched | Gadget | 'closet' | 'toy' | 'dress' | 'clock' | 'bin';
/** What my villager does at a piece besides playing it: a look in a mirror (a turn, a look, a twirl), a toss into a
 *  bin. */
export type Act = Instrument | 'mirror' | 'toss';
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
  glow: '4105',
  keys: '1081 1171 1875 4070 12516 11942 12409 7045',
  strings: '669 987 1449 1644 1645 2772 5955 383',
  drums: '1803 1906 13471 13774 4093',
  gong: '4075',
  mallet: '4121',
  winds: '846 1206 13470',
  theremin: '3063',
  sing: '1045 9503 13476',
  dj: '941',
  closet: '2560 3436 833 2713 3959 3972 3997 4049 4109 4135 9502 9766 12670 12673 12674 12677 12701 12998 13080 13108 13109 13110 13111 13118 13143 13189 13884 14526 12437 5960 12264 9642 3271 3196 12559 12561 1263 12573 1561 14572 14831',
  dress: '1816 3955 4001 4051 7682 7865 12881 12882 12883 12884 12885 12886 12888 12891 12993 13192 13368 13514 1868 4754 14799 12420 12241 12260 14478 14533 3561 12554 12611 7137 8826',
  clock: '4037 915 4106 3275 3954 2731 4111 13266 13274 3996 4133 4144 4756 3595 12692 14491 12418 12268 12242 12266 6832 12557 3976 14567 3208',
  bin: '2555 2556 4045 9767 12774 13214 3490',
  whir: '907 908 1092 1127 1745 7681 12601 13304 13305 13503 13516 13517 667 920 954 1043 1050 1128 1211 1888 3282 4019 4101 7280 13511 13509 14485 14486 14484 429 11261',
  burst: '13465 13466 12245 7231 13776 4128',
  beckon: '1051 131 9814',
  wobble: '1573 14487 1652 12976 14489',
  coin: '7392 1877 12713 12714 14714 14479',
  radio: '13270 13479 3697',
  bell: '1456 14476',
  loop: '85 13242 13250',
  twinkle: '3966 3991 14594 14728 4067',
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
const STUFF = new Set(codes('2560 833 3972 12670 12673 12674 12677 12701 13884 14526 3271 12573 1561 14572 14831'));
/** A burst's bubbles (the bubble machine, the cloud maker's puffs), else confetti. */
const BUBBLES = new Set(codes('13465 12245'));
/** The RC helicopter flies its loop; the train set and the mini circuit run theirs on the floor. */
const FLIES = new Set(codes('13242'));

export const INSTRUMENTS: readonly Instrument[] = ['keys', 'strings', 'drums', 'gong', 'mallet', 'winds', 'theremin', 'sing', 'dj'];
export const SWITCHED: readonly Switched[] = ['screen', 'fan', 'washer', 'water', 'steam', 'heater', 'glow'];
export const GADGETS: readonly Gadget[] = ['whir', 'burst', 'beckon', 'wobble', 'coin', 'radio', 'bell', 'loop', 'twinkle'];
/** The switched families that move while on (a frame now and then: the room's ambient rate); a screen and a heater
 *  only glow (no frames). */
export const MOVING: ReadonlySet<Switched> = new Set(['fan', 'washer', 'water', 'steam']);

/** A piece's family (its code), null: it only jiggles. */
export const familyOf = (code: string): Family | null => FAMILY.get(code) ?? null;
export const isInstrument = (f: string | null): f is Instrument => !!f && (INSTRUMENTS as readonly string[]).includes(f);
export const isSwitched = (f: Family | null): f is Switched => !!f && (SWITCHED as readonly string[]).includes(f);
export const isGadget = (f: Family | null): f is Gadget => !!f && (GADGETS as readonly string[]).includes(f);
/** A tap dresses up at it (the looks sheet after a look in it): a mirror, a rack, a mannequin, a clothes wardrobe. */
export const dressesAt = (code: string): boolean => {
  const f = familyOf(code);
  return f === 'dress' || (f === 'closet' && insideOf(code) === 'clothes');
};
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

/** A gadget's answer: its piece's move (pieceFx.ts), the flourish over it, its cue. */
export function gadgetOf(code: string, g: Gadget): { move: 'rumble' | 'pop' | 'beckon' | 'wobble' | 'hop' | 'shake' | 'ring' | 'fly' | 'circle' | 'shimmer'; spark: Spark | null; cue: `room-${Gadget | 'bubbles'}` } {
  const bubbles = BUBBLES.has(code);
  switch (g) {
    case 'whir': return { move: 'rumble', spark: null, cue: 'room-whir' };
    case 'burst': return { move: 'pop', spark: bubbles ? 'bubbles' : 'confetti', cue: bubbles ? 'room-bubbles' : 'room-burst' };
    case 'beckon': return { move: 'beckon', spark: null, cue: 'room-beckon' };
    case 'wobble': return { move: 'wobble', spark: null, cue: 'room-wobble' };
    case 'coin': return { move: 'hop', spark: null, cue: 'room-coin' };
    case 'radio': return { move: 'shake', spark: 'notes', cue: 'room-radio' };
    case 'bell': return { move: 'ring', spark: null, cue: 'room-bell' };
    case 'loop': return { move: FLIES.has(code) ? 'fly' : 'circle', spark: null, cue: 'room-loop' };
    case 'twinkle': return { move: 'shimmer', spark: 'twinkle', cue: 'room-twinkle' };
  }
}
/** A flourish over a piece (pieceFx.ts sparksOf): confetti, bubbles, twinkles, notes. */
export type Spark = 'confetti' | 'bubbles' | 'twinkle' | 'notes';

/** The Tokyo time a clock says (24 h `h`, `m`): its line (rooms' tent.clock.<key>) and values (a 12-hour clock: 0 and 12 are 12; 「ちょうど」 on
 *  the hour; ぷん after 1, 3, 4, 6, 8 and 0, else ふん). */
export function clockLine(h: number, m: number): { key: 'sharp' | 'fun' | 'pun'; h: number; m: number; mm: string } {
  const key = !m ? 'sharp' : [1, 3, 4, 6, 8, 0].includes(m % 10) ? 'pun' : 'fun';
  return { key, h: h % 12 || 12, m, mm: String(m).padStart(2, '0') };
}

/** An instrument's play: how long (ms). */
export const PLAY_MS = 3600;
/** A look in a mirror (a turn, a look, a twirl) and a toss into a bin (ms). */
export const MIRROR_MS = 2400, TOSS_MS = 1000;
/** How long an act holds my villager (ms). */
export const actMs = (a: Act): number => (a === 'mirror' ? MIRROR_MS : a === 'toss' ? TOSS_MS : PLAY_MS);
/** How far out of a piece's footprint one stands to play it (model units). */
const STEP = 4;
/** Which side of an instrument one plays it from, so the room's camera sees the player's face: behind the drums, the
 *  marimba, the DJ's deck and the theremin (the player facing out over them), beside the gong and the harps, else in
 *  front (a piano's keys). */
export type From = 'front' | 'back' | 'side';
const HARPS = new Set(codes('987 5955'));
export const playFrom = (code: string, f: Instrument): From =>
  f === 'drums' || f === 'mallet' || f === 'dj' || f === 'theremin' ? 'back' : f === 'gong' || HARPS.has(code) ? 'side' : 'front';
/** Where to stand to play an instrument (model units) and the way to face: its `from` side's middle first (front:
 *  then a side's, then its back's; back: then a side's, then its front's; side: then its front's, then its back's),
 *  the nearest `near` of those `free` (grid.ts standable); null when none is. `half`: its footprint's half extents in
 *  its own frame (w, d), `f` its facing, `c` its middle. */
export function playSpot(c: readonly [number, number], half: readonly [number, number], f: number, free: (p: readonly [number, number]) => boolean, near: readonly [number, number], from: From = 'front'): [number, number] | null {
  const [W, D] = [half[0] + STEP, half[1] + STEP], t = (((f % 4) + 4) % 4) * (Math.PI / 2), co = Math.round(Math.cos(t)), si = Math.round(Math.sin(t));
  // (a point in its own frame turned as the room turns it: grid.ts toRoom)
  const at = (x: number, z: number): [number, number] => [c[0] + (x * co + z * si || 0), c[1] + (z * co - x * si || 0)];
  const front = [at(0, D)], sides = [at(-W, 0), at(W, 0)], back = [at(0, -D)];
  const tiers = from === 'back' ? [back, sides, front] : from === 'side' ? [sides, front, back] : [front, sides, back];
  for (const tier of tiers) {
    const ok = tier.filter(free);
    if (ok.length) return ok.reduce((a, b) => (Math.hypot(b[0] - near[0], b[1] - near[1]) < Math.hypot(a[0] - near[0], a[1] - near[1]) ? b : a));
  }
  return null;
}
