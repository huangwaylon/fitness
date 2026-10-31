// けんこう's formatters: a metric's value with its unit, the axis numbers, the range label and the period change.
import type { LocalDate } from '#lib/types.ts';
import type { Metric, Range } from '#lib/model/health.ts';
import { formatNum, i18n, t } from '#lib/i18n/index.ts';
import { md } from '#lib/i18n/format.ts';

/** `620 kcal` · `45分` · `9,214歩` (rounded down, as the tree popup shows them). */
export function metricText(m: Metric, v: number): string {
  const n = formatNum(Math.floor(v));
  return m === 'move' ? t('kiroku.kcal', { n }) : m === 'steps' ? t('kiroku.steps', { n }) : t('kiroku.min', { n });
}

/** An axis number: `600`, `8,000`, `12k`. */
export const axisNum = (v: number): string => (v >= 10000 ? `${Math.round(v / 100) / 10}k` : formatNum(v));

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

/** `2026/3` / `Mar 2026`. */
function monthLabel(d: LocalDate, withYear = true): string {
  if (i18n.locale === 'ja') return withYear ? `${d.slice(0, 4)}/${Number(d.slice(5, 7))}` : `${Number(d.slice(5, 7))}月`;
  return new Intl.DateTimeFormat('en-US', { month: 'short', ...(withYear ? { year: 'numeric' } : {}), timeZone: 'UTC' }).format(new Date(`${d}T00:00:00Z`));
}

/** The visible range: `10/2–10/31`, with the year when it isn't this year's (`2025/12/30–1/5`); months for 1年 and すべて. */
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
    const text = r.unit !== 'month' ? md(d) : d.slice(5, 7) === '01' || i < step ? monthLabel(d) : monthLabel(d, false);
    out.unshift({ i, text });
  }
  return out;
}

/** `+12%` / `−8%` / `±0%` (a true minus sign). */
export function pctText(c: number): string {
  const r = Math.round(c * 100);
  return `${r < 0 ? '−' : r > 0 ? '+' : '±'}${Math.abs(r)}%`;
}
