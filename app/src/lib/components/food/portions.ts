// ごはん's portions (docs/design.md "Gohan"): a portion and an entry's amount in words, where the amount starts, the
// −/＋ ladder, the label an entry keeps and an item's default portion.
import { round1, type FoodEntry, type FoodSnap } from '#lib/contract/food.ts';
import { portionsOf, unitOf, type Item, type Portion } from '#lib/food/index.ts';

/** Grams as typed: one decimal at most, no trailing `.0`. */
export const gramsText = (g: number): string => String(round1(g));

/** Whether a portion label already says its weight (「1枚(60g)」, 「200ml」): no second （Ng） after it. */
export const hasWeight = (label: string): boolean => /\d\s*(g|ml|グラム)/i.test(label.normalize('NFKC'));

/** A label's own weight in brackets (「（110g）」, 「(350ml)」), dropped when a ×n makes it wrong. */
const OWN_WEIGHT = /[（(][^（）()]*\d\s*(g|ml|グラム)[^（）()]*[）)]/gi;

/** A portion in words, the one format everywhere: its label and its weight once (「茶碗1杯（150g）」, 「中ジョッキ（350ml）」,
 *  「1パック（110g）」), ×n with the total (「1パック×2（220g）」), never a weight twice; no label: the weight alone. */
export function portionText(label: string | null | undefined, g: number, unit: 'g' | 'ml' = unitOf(label)): string {
  const w = `${gramsText(g)}${unit}`;
  if (!label) return w;
  const [base, x] = label.split('×');
  if (!x) return hasWeight(label) ? label : `${label}（${w}）`;
  const bare = base.replace(OWN_WEIGHT, '').trim();
  return !bare || /^\d+(\.\d+)?\s*(g|ml)$/i.test(bare.normalize('NFKC')) ? w : `${bare}×${x}（${w}）`;
}

/** A snapshot of a serving with no known weight (a custom food's, `sv`): its grams are a nominal 100 per serving,
 *  shown as servings, never as grams. */
export const servingOnly = (f: Pick<FoodSnap, 'sv'>): boolean => f.sv === true;

/** An entry's amount: the portion it was picked by and its weight (portionText), or the weight alone; a serving with
 *  no weight: its label alone (「1食」, 「1食×2」). */
export const amountText = (e: Pick<FoodEntry, 'g' | 'f'>): string =>
  servingOnly(e.f) ? (e.f.u ?? `×${gramsText(e.g / 100)}`) : portionText(e.f.u, e.g);

/** The portion and ×multiplier (a multiple of 0.5, ×0.5 to ×20) whose grams, saved to one decimal, are `g`, ×1 first;
 *  null when none does. */
export function matchPortion(ps: readonly Portion[], g: number): { pi: number; mult: number } | null {
  let best: { pi: number; mult: number } | null = null;
  ps.forEach((p, pi) => {
    const mult = Math.round((g / p.g) * 2) / 2;
    if (mult < MULT.min || mult > MULT.max || round1(p.g * mult) !== g) return;
    if (!best || (mult === 1 && best.mult !== 1)) best = { pi, mult };
  });
  return best;
}

/** Where the amount starts: the portion named by the label (「茶碗1杯×2」) when it makes the grams, else one that makes
 *  them, else typed grams; no grams: the default portion. */
export function startOf(ps: readonly Portion[], g0?: number, u0?: string): { pi: number; mult: number; custom: boolean } {
  if (g0 === undefined) return { pi: 0, mult: 1, custom: false };
  const [label, x] = (u0 ?? '').split('×');
  const pi = ps.findIndex((p) => p.label === label);
  const n = Number(x) || 1;
  if (pi >= 0 && round1(ps[pi].g * n) === g0) return { pi, mult: n, custom: false };
  const m = matchPortion(ps, g0);
  return m ? { ...m, custom: false } : { pi: 0, mult: 1, custom: true };
}

/** Foods eaten by the piece whose data gives a serving (「1人前」): おにぎり, 目玉焼き, ゆで卵 … counted too. */
const PIECE = /おにぎり|むすび|天むす|ゆで卵|温泉卵|目玉焼き|ハンバーグ|ホットドッグ|コロッケ|メンチカツ|まんじゅう|大福|ドーナツ|バーガー|梅干し/;

export type StepKind = 'count' | 'half';
/** −/＋'s ladder for a portion: 'count' for the things you count (本 · 個 · 杯 · 缶 · 枚 · 切れ · 貫 · パック …, and a
 *  piece food's 1人前: `name` PIECE), 'half' for 茶碗 (rice), 人前 and the rest (a weight). */
export function stepOf(label: string, name = ''): StepKind {
  const l = label.normalize('NFKC');
  if (/人前/.test(l) && PIECE.test(name)) return 'count';
  if (/茶碗|人前|^\s*[\d.]+\s*(g|ml)\s*$/i.test(l)) return 'half';
  return /本|個|杯|缶|枚|切れ|貫|パック|ジョッキ|袋|粒|尾|丁|玉|カップ|皿/.test(label) ? 'count' : 'half';
}

/** ×n's floor and cap. */
export const MULT = { min: 0.5, max: 20 } as const;
/** The rungs: halves all the way for 'half'; for 'count' halves up to 2 (½ an apple, 1½ toast), then whole ones. */
const RUNGS: Record<StepKind, readonly number[]> = {
  half: Array.from({ length: 40 }, (_, i) => (i + 1) / 2),
  count: [0.5, 1, 1.5, ...Array.from({ length: 19 }, (_, i) => i + 2)]
};

/** −/＋ from ×m: the next rung down or up (from a value off the ladder, a saved ×2.5, the nearest one that way); held
 *  at the floor and the cap. */
export function nextMult(m: number, d: -1 | 1, kind: StepKind): number {
  const r = RUNGS[kind];
  return (d > 0 ? r.find((x) => x > m) : r.findLast((x) => x < m)) ?? (d > 0 ? MULT.max : MULT.min);
}

/** The label an entry keeps for a picked portion (「茶碗1杯」, 「茶碗1杯×2」); none for 100 g or typed grams. */
export function portionLabel(p: Portion | null, mult: number): string | null {
  if (!p || /^100\s*(g|ml)$/i.test(p.label.normalize('NFKC'))) return null;
  return mult === 1 ? p.label : `${p.label}×${mult}`;
}

/** An item's default portion in a few words and its kcal (search rows: 「茶碗1杯 150g」 234 kcal): its label without
 *  its notes in brackets (「1枚（とんかつ用）」 → 1枚), then its weight; a serving with no weight (`sv`): its label. */
export function defaultPortion(it: Item): { label: string; kcal: number } {
  const ps = portionsOf(it);
  const p = ps[0];
  if (it.sv) return { label: p.label, kcal: Math.round((it.kcal * p.g) / 100) };
  const w = `${gramsText(p.g)}${ps.some((q) => unitOf(q.label) === 'ml') ? 'ml' : 'g'}`;
  const base = bareLabel(p.label);
  return { label: !base || /^\d+(\.\d+)?\s*(g|ml)$/i.test(base.normalize('NFKC')) ? w : `${base} ${w}`, kcal: Math.round((it.kcal * p.g) / 100) };
}

/** A portion label without its notes in brackets (「1枚（とんかつ用）」 → 1枚). */
export const bareLabel = (label: string): string => label.replace(/[（(][^（）()]*[）)]/g, '').trim();
