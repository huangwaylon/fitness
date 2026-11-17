// English Study's situations (docs/english.md "The page"): the library's 場面で選ぶ tiles on すべて, each a level of its
// own. One a situation tag (店・レストラン and 買い物 one: お店), so no group shows twice; a few curated ids join the tag's
// clips. Not courses: no order to finish, nothing locked, the count only information; one shows once it has MIN_CLIPS.
// Titles and notes: i18n.ts `col.<id>` / `colNote.<id>`. Pure.
import type { ClipMeta } from './catalog.ts';

export interface Collection {
  id: 'work' | 'love' | 'friends' | 'home' | 'shop' | 'phone' | 'travel' | 'ask';
  /** Every clip with one of these situations. */
  tags: readonly string[];
  /** And these clips (ids; collections.test checks each is a clip). */
  clips?: readonly string[];
}

/** The situations (types.ts Clip tags). */
export const SITUATIONS: readonly string[] = ['職場', '恋愛', '友だち', '家', '店・レストラン', '電話', '旅行', '買い物', 'お願い・断り'];

/** A collection shows with this many clips. */
export const MIN_CLIPS = 4;

/** Every situation in exactly one, in the tiles' order. */
export const COLLECTIONS: readonly Collection[] = [
  { id: 'work', tags: ['職場'] },
  { id: 'friends', tags: ['友だち'] },
  { id: 'love', tags: ['恋愛'] },
  { id: 'home', tags: ['家'] },
  // a polite no, and talking someone into it
  { id: 'ask', tags: ['お願い・断り'], clips: ['twodates', 'joeystay'] },
  { id: 'shop', tags: ['店・レストラン', '買い物'] },
  { id: 'phone', tags: ['電話'], clips: ['fluoride'] },
  { id: 'travel', tags: ['旅行'] }
];

/** A collection's clips, in the library's order. */
export const clipsOf = (c: Collection, lib: readonly ClipMeta[]): ClipMeta[] =>
  lib.filter((m) => c.clips?.includes(m.id) || m.tags.some((t) => c.tags.includes(t)));

/** The collections the library shows, each with its clips. */
export const shownOf = (lib: readonly ClipMeta[]): { c: Collection; clips: ClipMeta[] }[] =>
  COLLECTIONS.map((c) => ({ c, clips: clipsOf(c, lib) })).filter((x) => x.clips.length >= MIN_CLIPS);
