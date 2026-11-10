// けっこんしき's categories in Japanese (health plan C8; docs/wedding.md "Categories"). The starter list was the old
// board's English (Budget, Venue, …); the board's own words are Japanese now. The record's rows were renamed once
// (`catsRenameOps`: relay/scripts/wedding-cats.ts at the `probes` git tag, run on 2026-11-09 after a bookmark;
// idempotent, should an old phone's queued op bring an English one back).
import type { WConf, WTaskSet, WedBook } from './wedding.ts';

/** The starter categories, in the order the board offers them. */
export const CATEGORIES: readonly string[] = ['予算', '会場', '招待客', '業者', '衣装', '料理', 'ペーパーアイテム', '写真', '音楽', '美容', 'ギフト', '手続き', '新婚旅行', 'その他'];

/** The old starter names → the Japanese ones (招待客, as the tasks say 招待客リスト; 手続き: 婚姻届, the name changes). */
const LEGACY_CATS: Readonly<Record<string, string>> = {
  Budget: '予算', Venue: '会場', Guests: '招待客', Vendors: '業者', Attire: '衣装', Food: '料理', Stationery: 'ペーパーアイテム',
  Photo: '写真', Music: '音楽', Beauty: '美容', Gifts: 'ギフト', Paperwork: '手続き', Honeymoon: '新婚旅行', Other: 'その他'
};

const has = (c: string): boolean => Object.hasOwn(LEGACY_CATS, c);
/** A category renamed: an old starter name in Japanese, any other as typed. */
const catName = (c: string): string => (has(c) ? LEGACY_CATS[c] : c);
/** A category list renamed (each once, in its order). */
const catNames = (cs: readonly string[]): string[] => [...new Set(cs.map(catName))];

export type RenameOp = { type: 'wtask'; data: WTaskSet } | { type: 'wconf'; data: WConf };

/**
 * The record's one-time rename as ops a member's phone could send (each the whole new state of its slot, at `now` and
 * on, so it beats the row held): every task (live or deleted, a subtask too) whose category is an old starter name,
 * with the Japanese one; the category list if it names one. Idempotent: on a book that holds none, nothing.
 */
export function catsRenameOps(book: WedBook, now: number): RenameOp[] {
  const out: RenameOp[] = [];
  let at = now;
  for (const r of book.rows.values()) {
    if (r.type !== 'wtask' || r.op.rm || !has(r.op.cat)) continue;
    const { imported: _imported, ...op } = r.op;
    out.push({ type: 'wtask', data: { ...op, at: at++, cat: catName(op.cat) } });
  }
  const cats = book.rows.get('wconf|cats');
  if (cats?.type === 'wconf' && Array.isArray(cats.op.v) && cats.op.v.some(has)) out.push({ type: 'wconf', data: { k: 'cats', at: at++, v: catNames(cats.op.v) } });
  return out;
}
