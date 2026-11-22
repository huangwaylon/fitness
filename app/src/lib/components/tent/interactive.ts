// The pieces that do something when tapped in a room (docs/design.md "The tent": Things that do something), worked out
// from the tables the room's tap reads, so a piece given an interaction joins on its own: the stood-at and the one-offs
// (world3d/heldProps.ts), the seats, beds and uses (seats3d.json, seats-more.json, items' `u`), the toggles' families
// (toggles.ts), the music players (stereo.ts) and the lamps (`lt`). Each in one of もようがえ's 遊べる sub-filters, by
// what the tap does first (TentRoom.svelte's order). All of them ours from the start (the user, 2026-11-23), as ALWAYS.
import { ITEMS } from './items.ts';
import { seatShape } from './seats.ts';
import { familyOf, isGadget, isInstrument, isSwitched, dressesAt } from './toggles.ts';
import { isStereo } from './stereo.ts';
import { ACT_PIECES, STAND_PIECES } from '../world3d/heldProps.ts';
import { STAND_USES } from '../villager3d/poses-stand.ts';

/** What a piece does: sat or lain on, used (the gym, a bath, yoga, a stall, a drink or a call), worked at (cooked,
 *  typed, read…), ridden, played, switched (a screen, a fan, a lamp…), dressed up at, or something else (a clock, a bin,
 *  a toy, a gadget, a fridge's door). */
export const DOES = ['sit', 'use', 'work', 'ride', 'music', 'switch', 'dress', 'other'] as const;
export type Does = (typeof DOES)[number];
/** The rides' uses (villager3d/poses-ride.ts) that carry one along; a swivel chair is a seat, a massage chair or a
 *  sandpit used. */
const RIDES: ReadonlySet<string> = new Set(['drive', 'board', 'steer', 'balance', 'push', 'slide', 'ride', 'carousel']);
const byUse = (use: string | undefined, seat: Does): Does => (!use ? seat : use in STAND_USES ? 'work' : RIDES.has(use) ? 'ride' : use === 'swivel' ? 'sit' : 'use');

/** What a tap on a piece does, null: it only jiggles (a gyroid's bob is a jiggle too). */
export function doesOf(code: string): Does | null {
  if (!ITEMS[code]) return null;
  if (STAND_PIECES[code]) return 'work';
  if (ACT_PIECES[code]) return 'use';
  const sh = seatShape(code);
  if (sh) return sh.k === 'u' ? byUse(sh.use, 'use') : byUse(sh.use, sh.k === 's' && sh.yaw ? 'ride' : 'sit');
  const f = familyOf(code);
  if (isInstrument(f)) return 'music';
  if (dressesAt(code)) return 'dress';
  if (f === 'bin' || f === 'closet' || f === 'toy' || f === 'clock' || isGadget(f)) return 'other';
  if (isStereo(code) || isSwitched(f) || ITEMS[code].lt) return 'switch';
  return null;
}

/** Every piece that does something, in the catalogue's order, with what it does. */
export const INTERACTIVE: ReadonlyMap<string, Does> = new Map(Object.keys(ITEMS).flatMap((c) => ((d) => (d ? [[c, d] as const] : []))(doesOf(c))));

/** Each sub-filter's words a search finds it by besides its label (folded on use): the kana of its kanji, and 遊べる's. */
export const DOES_WORDS: Readonly<Record<Does, readonly string[]>> = {
  sit: ['すわる', 'ねる', 'いす', 'ベッド'],
  use: ['つかう'],
  work: ['りょうり', 'しごと'],
  ride: ['のりもの', 'のる'],
  music: ['がっき', 'えんそう'],
  switch: ['スイッチ', 'つける'],
  dress: ['ふく', 'きがえ', 'おしゃれ'],
  other: ['そのた']
};
