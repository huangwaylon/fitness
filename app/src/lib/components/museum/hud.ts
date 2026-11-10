// The museum's HUD, pure (RoomChip.svelte, MuseumCard.svelte's dock): the room chip's label from a room id (a wing,
// or a room of a wing of several: F1..F3, G1..G2), its wing's found/total, and which edge an exhibit's card docks to.
// In-world words, so spaced kana, the doorway plaques' terms (engine.ts).
import type { Wing } from './plan.ts';
import { BUG_IDS, FISH_IDS } from './species.ts';
import { SEA } from '../island/sea.ts';
import { FOSSIL_SETS, STANDALONE } from '../island/fossilIds.ts';
import { ART_IDS } from './artIds.ts';

export const WING_NAME: Readonly<Record<Wing, string>> = {
  hall: 'はくぶつかん', bug: 'こんちゅう', fish: 'さかな', sea: 'うみの さち', fossil: 'かせき', art: 'びじゅつ'
};
const WINGS = Object.keys(WING_NAME) as Wing[];
/** A multi-room wing's letter (F2: the fossils' second room, G1: the gallery's first). */
const LETTER: Readonly<Record<string, Wing>> = { f: 'fossil', g: 'art' };

/** A room id read: its wing and its number in the wing (null: a wing's one room). Tolerant: a wing ('fish'), a
 *  numbered room ('F2', 'g1', 'fossil-2', 'art_1'), any case; unknown → null. */
export function roomOf(id: string): { wing: Wing; n: number | null } | null {
  const s = id.trim().toLowerCase();
  if ((WINGS as string[]).includes(s)) return { wing: s as Wing, n: null };
  const m = /^([a-z]+?)[-_ ]?(\d+)$/.exec(s);
  const wing = m && (LETTER[m[1]] ?? ((WINGS as string[]).includes(m[1]) ? (m[1] as Wing) : undefined));
  return wing ? { wing, n: Number(m[2]) } : null;
}

/** The chip's name for a room: its wing's, and its number only where the wing has more than one room (`rooms`: every
 *  room id of the plan; without it, a numbered id counts as a wing of several). */
export function roomLabel(id: string, rooms?: readonly string[]): string {
  const r = roomOf(id);
  if (!r) return WING_NAME.hall;
  const several = !rooms || rooms.filter((x) => roomOf(x)?.wing === r.wing).length > 1;
  return r.n !== null && several ? `${WING_NAME[r.wing]} ${r.n}` : WING_NAME[r.wing];
}

/** Every wing's whole collection (NH's: 80 fish, 80 bugs, 40 sea creatures, 73 fossils, 43 artworks). */
export const WING_TOTAL: Readonly<Record<Exclude<Wing, 'hall'>, number>> = {
  fish: FISH_IDS.length, bug: BUG_IDS.length, sea: Object.keys(SEA).length,
  fossil: STANDALONE.length + Object.values(FOSSIL_SETS).reduce((n, s) => n + s.length, 0), art: ART_IDS.length
};

/** What's on show, as MuseumRoom has it: its specimens (fish, bugs, sea creatures), its fossils, its artworks. */
export interface OnShow { specimens: readonly { kind: 'fish' | 'bug' | 'sea' }[]; fossils: readonly unknown[]; artworks: readonly unknown[] }
/** A wing's found/total for the chip (the hall: none, the chip shows its name only). */
export function wingTally(wing: Wing, on: OnShow): { found: number; total: number } | null {
  if (wing === 'hall') return null;
  const found = wing === 'fossil' ? on.fossils.length : wing === 'art' ? on.artworks.length : on.specimens.filter((s) => s.kind === wing).length;
  return { found, total: WING_TOTAL[wing] };
}

/** The lower share of the screen an exhibit's card would cover: an exhibit drawn there gets its card at the top. */
export const DOCK_LOW = 0.45;
/** Which edge an exhibit's card docks to: the bottom (above the HUD row), unless the exhibit is drawn in the lower 45 %
 *  of the screen (its card would hide it), then the top (under the back pill). */
export const cardDock = (exhibitScreenY: number, viewportH: number): 'top' | 'bottom' =>
  viewportH > 0 && exhibitScreenY > viewportH * (1 - DOCK_LOW) ? 'top' : 'bottom';

