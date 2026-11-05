// すがた's tabs and what the stage says (design/avatar/sugata-ux.md §3.2–3.4), pure: the six tabs and their sub-rows,
// the closet kind each sub lists, the tab the level opens on, the status pill's state, and the stage's colour dots'
// names (their hue, numbered when two share one).
import type { ClosetKind, Hue } from './closet.ts';
import { hueOf } from './closet.ts';
import type { Hex } from '#lib/contract/look.ts';

export const TABS = ['coord', 'face', 'hair', 'wear', 'acc', 'villager'] as const;
export type Tab = (typeof TABS)[number];

/** A sub-row's segment: a closet grid's (garments, め, くち) or one of かお's own (はな, ほお, はだ). */
export type Sub = 'eye' | 'mouth' | 'nose' | 'cheek' | 'skin' | 'tops' | 'bottoms' | 'onepiece' | 'socks' | 'shoes' | 'hat' | 'glasses' | 'ornament';

/** Each tab's sub-row, in order (none: the tab is one panel). ぼうし is the last of ふく. */
export const SUBS: Record<Tab, readonly Sub[]> = {
  coord: [], face: ['eye', 'mouth', 'nose', 'cheek', 'skin'], hair: [],
  wear: ['tops', 'bottoms', 'onepiece', 'socks', 'shoes', 'hat'], acc: ['glasses', 'ornament'], villager: []
};

/** The closet grid a sub (or the かみ tab) lists; null: not a grid (はな, ほお, はだ). */
export const KIND_OF: Record<Sub | 'hair', ClosetKind | null> = {
  eye: 'eye', mouth: 'mouth', nose: null, cheek: null, skin: null, hair: 'hair',
  tops: 'top', bottoms: 'bottom', onepiece: 'onepiece', socks: 'socks', shoes: 'shoes', hat: 'hat', glasses: 'glasses', ornament: 'ornament'
};

/** The tab the level opens on: コーデ when any is saved, else ふく. */
export const firstTab = (saved: number): Tab => (saved > 0 ? 'coord' : 'wear');

/** What the stage's pill says: the look worn is いつもの or a saved コーデ exactly, started from one and changed (アレンジ
 *  ちゅう), a player look matching nothing (コーデなし), or a villager. */
export type Status =
  | { kind: 'usual' }
  | { kind: 'saved'; name: string }
  | { kind: 'edited'; from: string | null }
  | { kind: 'none' }
  | { kind: 'villager'; usual: boolean };

/**
 * The pill's state. `exact`: the コーデ the look is exactly ('usual', a name, or null); `from`: the コーデ last
 * picked this visit (or matched on opening), as 'usual', a name or null; `villager`: a villager look (`usual`: the
 * guest's, whose いつもの it is).
 */
export function statusOf(o: { villager: boolean; guest: boolean; exact: string | null; from: string | null }): Status {
  if (o.villager) return { kind: 'villager', usual: o.guest };
  if (o.exact === 'usual') return { kind: 'usual' };
  if (o.exact !== null) return { kind: 'saved', name: o.exact };
  if (o.from !== null) return { kind: 'edited', from: o.from };
  return { kind: 'none' };
}

/** Each colour dot's name: its hue bucket, numbered (1, 2…) only when two dots share one. */
export function dotNames(hexes: readonly Hex[]): { hue: Hue; n: number | null }[] {
  const hues = hexes.map(hueOf);
  const seen = new Map<Hue, number>();
  return hues.map((hue) => {
    const twice = hues.filter((h) => h === hue).length > 1;
    const n = (seen.get(hue) ?? 0) + 1;
    seen.set(hue, n);
    return { hue, n: twice ? n : null };
  });
}
