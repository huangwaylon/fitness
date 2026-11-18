// `POST /grade`'s answer (docs/sugoroku.md "Speaking"): its shape and the one sanitiser both sides apply, the relay to
// the model's output (relay/src/gradeRoute.ts) and the phone to the relay's reply (lib/sugoroku/grade.ts). Dependency-free.

/** @public (relay/) */
export type Verdict = 'great' | 'ok' | 'tip';
/** A sentence's grade as shown: a recast (`fixed`, else `natural`), a friendly tip, `also` on great, the target used. */
export interface Grade {
  verdict: Verdict;
  fixed: string;
  natural: string;
  also: string;
  tip: string;
  used: boolean;
}
/** Where a grade came from: the model, or the Japanese-English list (relay/src/wasei.ts). */
export type GradeSrc = 'ai' | 'wasei';

/** The longest sentence (and any field) kept. @public (relay/) */
export const S_MAX = 200;
/** A tip's most characters (the prompt asks for 35). */
export const TIP_MAX = 40;
/** What a tip may never say (a scolding word, a grammar term): such a tip is dropped, the recast stays. */
const TIP_BANNED = /間違|誤り|不正解|不要|ダメ|NG|違う|忘れ|言いません|いけない|必要です|三人称|他動詞|不可算|冠詞|前置詞|過去分詞|主語|原形|副詞|助動詞/;
const KANA = /[ぁ-んァ-ン]/;

const str = (v: unknown): string => (typeof v === 'string' ? v.trim().slice(0, S_MAX) : '');
/** A recast fit to show: English (printable ASCII and curly quotes), no placeholder, at most twice the sentence. */
const fine = (x: string, s: string): boolean => !!x && !/\.\.\.|…/.test(x) && !/[^\x20-\x7e’‘“”]/.test(x) && x.length <= Math.max(40, s.length * 2);
/** A tip fit to show: Japanese, short, kind. @public (relay/) */
export const safeTip = (tip: string): boolean => KANA.test(tip) && !TIP_BANNED.test(tip) && [...tip].length <= TIP_MAX;

/** An answer's fields made safe for `s` (null: no verdict, not an answer). Strings trimmed and capped; a recast that
 *  isn't fit falls back to the sentence (`fixed`) or to none (`natural`, `also`); `also` on great only; an unfit tip
 *  dropped; `used` only when true. Pure. */
export function gradeOf(j: Record<string, unknown> | null, s: string): Grade | null {
  if (!j || (j.verdict !== 'great' && j.verdict !== 'ok' && j.verdict !== 'tip')) return null;
  const verdict = j.verdict;
  const fixed = str(j.fixed), natural = str(j.natural), also = str(j.also), tip = str(j.tip);
  return {
    verdict,
    fixed: fine(fixed, s) ? fixed : s,
    natural: fine(natural, s) ? natural : '',
    also: verdict === 'great' && fine(also, s) ? also : '',
    tip: safeTip(tip) ? tip : '',
    used: j.used === true
  };
}
