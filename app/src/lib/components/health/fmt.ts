// The charts' formatters: the axis numbers, the range label, a bucket's title and a period's change (a value with its
// unit: goals.ts valueText).
import type { LocalDate } from '#lib/types.ts';
import type { GoalId } from '#lib/contract/goals.ts';
import type { Range } from '#lib/model/health.ts';
import { formatNum, t } from '#lib/i18n/index.ts';
import { formatDate, md, monthLabel } from '#lib/i18n/format.ts';
import { valueText } from './goals.ts';

/** An axis number: `600`, `8,000`, `2.5` (a step under 1: ごはん's salt); every number of an axis whose `top` reaches
 *  10,000 in k (`5k`, `10k`, `15k`, not `5,000` beside `10k`). */
export const axisNum = (v: number, top = v): string =>
  top >= 10000 && v ? `${Math.round(v / 100) / 10}k` : Number.isInteger(v) ? formatNum(v) : String(Math.round(v * 10) / 10);

/** A value over its bar: `620`, `1,033`, `12.4k` (4 digits whole: a kcal day read as 1.0k said nothing); every bar of a
 *  chart whose axis `top` reaches 10,000 in k, as its axis is (`9.7k` beside `10.5k`, not `9,797`). */
export const barNum = (v: number, top = v): string => (top >= 10000 ? `${(Math.floor(v / 100) / 10).toFixed(1)}k` : formatNum(Math.floor(v)));

/** A nice axis: 0 to a round top over `max`, about three steps. */
export function niceTicks(max: number): number[] {
  if (!(max > 0)) return [0, 1];
  const raw = max / 3;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((k) => k * pow).find((s) => s >= raw)!;
  const out: number[] = [];
  for (let v = 0; v < max + step * 0.999; v += step) out.push(v);
  return out;
}

/** The visible range: `10/2〜10/31`, with the year when it isn't this year's (`2025/12/30〜1/5`); months for 1年. */
export function rangeLabel(r: Range, today: LocalDate): string {
  if (r.unit === 'month') return t('kiroku.range', { a: monthLabel(r.from), b: monthLabel(r.to) });
  const y = (d: LocalDate) => d.slice(0, 4);
  const a = y(r.from) !== y(today) || y(r.from) !== y(r.to) ? `${y(r.from)}/${md(r.from)}` : md(r.from);
  const b = y(r.to) !== y(r.from) ? `${y(r.to)}/${md(r.to)}` : md(r.to);
  return t('kiroku.range', { a, b });
}

/** Which buckets get a date under the axis: about one per `px`, counted back from the newest. */
export function xLabels(r: Range, plotW: number, px = 46): { i: number; text: string }[] {
  const n = r.buckets.length;
  const step = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(plotW / px))));
  const out: { i: number; text: string }[] = [];
  for (let i = n - 1; i >= 0; i -= step) {
    const d = r.buckets[i].from;
    const text = r.unit !== 'month' ? md(d) : d.slice(5, 7) === '01' || i < step ? monthLabel(d) : monthLabel(d, { year: false });
    out.unshift({ i, text });
  }
  return out;
}

/** `+12%` / `−8%` / `±0%` (a true minus sign). */
export function pctText(c: number): string {
  const r = Math.round(c * 100);
  return `${r < 0 ? '−' : r > 0 ? '+' : '±'}${Math.abs(r)}%`;
}

/** A change in the card's unit: `−0.4%`, `+0.2`, `±0.0 kg` (a true minus sign, one decimal); `–` when there's none yet. */
export function deltaText(id: GoalId, d: number | null): string {
  if (d === null) return '–';
  const r = Math.round(d * 10) / 10;
  return (r < 0 ? '−' : r > 0 ? '+' : '±') + valueText(id, Math.abs(r), 1);
}

/** A bucket's title, for its callout: the day (formatDate: `11月4日(水)`), or a week's or month's days (`10/27–11/2`). */
export function bucketTitle(r: Range, i: number, today: LocalDate): string {
  const b = r.buckets[i];
  return r.unit === 'day' ? formatDate(b.from) : rangeLabel({ ...r, from: b.from, to: b.to, unit: 'day' }, today);
}
