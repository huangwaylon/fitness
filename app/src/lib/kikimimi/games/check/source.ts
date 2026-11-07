// みみ チェック over this build's content (pool.ts): every voiced item of the places' levels (not アナウンス's), numbered
// as the tournament's are (taikai/source.ts TAIKAI_IDS: the open's `ids`), each with the skill it samples; and the
// game's source (def.ts CheckSource: the rounds of the ids dealt, the next id over the loaded levels).
import { itemMs } from '../../clips.ts';
import type { Entry, Feature, Level } from '../../bank.ts';
import { ENTRIES, loaded } from '../../pool.ts';
import { roundOf, type QuizRound } from '../quiz/kinds.ts';
import { TAIKAI_IDS, taikaiDeck } from '../taikai/source.ts';
import { BANDS, checkNext, type CheckItem, type CheckSkill, type CheckSource } from './def.ts';

const REDUCE: ReadonlySet<Feature> = new Set<Feature>(['contraction', 'weak-form', 'flap', 'yod', 'gonna', 'wanna', 'gotta', 'lemme', 'dunno', 'kinda', 'can-cant', 't-glottal', 'ellipsis']);
const PAIR: ReadonlySet<Feature> = new Set<Feature>(['l-r', 'vowel', 'b-v', 'th', 'sh-s', 'f-h', 'ending']);

/** The skill an item samples (one each): a number すうじ; a dialogue's gist (a picture's key word below もり) だいたい;
 *  a reduced form つながる おと; a near-sound word にた おと; a reply, its meaning or what comes next へんじ. Null: none. */
export function skillOfEntry(e: Pick<Entry, 'lv' | 'type' | 'tags'>): CheckSkill | null {
  const f = e.tags?.features ?? [];
  if (e.type === 'num') return 'num';
  if (e.type === 'gist' || (e.type === 'pic' && e.lv <= 3)) return 'gist';
  if ((e.type === 'word' || e.type === 'reply' || e.type === 'mean') && f.some((x) => REDUCE.has(x))) return 'reduce';
  if (e.type === 'word' && (f.some((x) => PAIR.has(x)) || e.lv >= 4)) return 'pair';
  if (e.type === 'reply' || e.type === 'mean' || e.type === 'next') return 'reply';
  return null;
}

/** The check's pool: the places' items with a skill, numbered. */
let pool: CheckItem[] | null = null;
export const checkPool = (): CheckItem[] =>
  (pool ??= ENTRIES.flatMap((e) => {
    const skill = BANDS.includes(e.lv) ? skillOfEntry(e) : null, n = TAIKAI_IDS.num(e.id);
    return skill && n !== undefined ? [{ n, lv: e.lv, skill }] : [];
  }));

/** A band's level and its neighbours' (pool.ts load: what the walk's next round may need), the band's in the middle
 *  (at an end, its own twice). */
export const checkLevels = (band: number): Level[] => [band - 1, band, band + 1].map((b) => BANDS[Math.max(0, Math.min(BANDS.length - 1, b))] as Level);

/** A check item's level and skill by its string id (a row's answers, the result). */
export function checkItemOf(id: string): CheckItem | undefined {
  const n = TAIKAI_IDS.num(id);
  return n === undefined ? undefined : checkPool().find((x) => x.n === n);
}

const DEALT = new Map<string, readonly QuizRound[]>();

export const checkSource: CheckSource = {
  rounds: (seed, ids) => {
    const key = `${seed}:${ids.join(',')}`;
    let rs = DEALT.get(key);
    if (!rs) {
      const items = taikaiDeck(seed, ids);
      rs = items.map((it) => roundOf(it, itemMs(it)));
      if (items.length < ids.length) return rs; // (a level not in yet)
      DEALT.set(key, rs);
      if (DEALT.size > 4) DEALT.delete(DEALT.keys().next().value!);
    }
    return rs;
  },
  next: (seed, done) =>
    checkNext(seed, done.map((d) => ({ n: TAIKAI_IDS.num(d.id) ?? -1, ok: d.ok })), checkPool(), (lv) => loaded(lv as Level))
};
