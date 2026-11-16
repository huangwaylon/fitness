// English Study's collections (docs/english.md "The page"): curated groups on the library's すべて, each a level of its
// own. Not courses: no order to finish, nothing locked, the count only information. One is built from situation tags
// (filling itself as clips land), a curated id list, or both; it shows once it has MIN_CLIPS. Titles and notes:
// i18n.ts `col.<id>` / `colNote.<id>`. Pure.
import type { ClipMeta } from './catalog.ts';

export interface Collection {
  id: 'phone' | 'ask' | 'work' | 'shop' | 'camera' | 'travel';
  /** Every clip with one of these situations. */
  tags?: readonly string[];
  /** And these clips (ids; collections.test checks each is a clip). */
  clips?: readonly string[];
}

/** The situations (types.ts Clip tags), in the order the library's chips go. */
export const SITUATIONS: readonly string[] = ['職場', '恋愛', '友だち', '家', '店・レストラン', '電話', '旅行', '買い物', 'お願い・断り'];

/** A collection shows with this many clips. */
export const MIN_CLIPS = 4;

export const COLLECTIONS: readonly Collection[] = [
  { id: 'phone', tags: ['電話'], clips: ['fluoride'] },
  // a polite no, and talking someone into it
  { id: 'ask', tags: ['お願い・断り'], clips: ['twodates', 'joeystay'] },
  { id: 'work', tags: ['職場'] },
  { id: 'shop', tags: ['店・レストラン', '買い物'] },
  // the mockumentaries' talking heads: what's said to the camera against the scene
  { id: 'camera', clips: ['fakedating'] },
  { id: 'travel', tags: ['旅行'] }
];

/** A collection's clips, in the library's order. */
export const clipsOf = (c: Collection, lib: readonly ClipMeta[]): ClipMeta[] =>
  lib.filter((m) => c.clips?.includes(m.id) || m.tags.some((t) => c.tags?.includes(t)));

/** The collections the library shows, each with its clips. */
export const shownOf = (lib: readonly ClipMeta[]): { c: Collection; clips: ClipMeta[] }[] =>
  COLLECTIONS.map((c) => ({ c, clips: clipsOf(c, lib) })).filter((x) => x.clips.length >= MIN_CLIPS);
