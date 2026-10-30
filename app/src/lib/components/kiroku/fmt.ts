// Small formatters shared by the きろく screens (the day title, numbers, the change-log line); dates: i18n/format.ts.
import type { RingFruit } from '#lib/types.ts';
import type { EditLog } from '#lib/model/history.ts';
import { workoutLabel } from '#lib/contract/labels.ts';
import { isWeightKg } from '#lib/contract/api.ts';
import { MOVE_GOAL, RULES } from '#lib/config/rules.ts';
import { i18n, t } from '#lib/i18n/index.ts';
import { weekdayOf } from '#lib/i18n/format.ts';

export const dayTitle = (d: string) => t('kiroku.dayTitle', { m: Number(d.slice(5, 7)), d: Number(d.slice(8, 10)), w: weekdayOf(d) });

export const num = (n: number | null) => (n === null ? '–' : n.toLocaleString('en-US'));
export const typeLabel = (type: string) => workoutLabel(type, i18n.locale);

/** The word joints of a Japanese workout label (筋力|トレーニング, 高強度|インターバル|トレーニング). */
const JA_JOINTS = /(筋力|トレーニング|インターバル|ウォーキング|ランニング|カーディオ)/;
/** A workout label in the pieces it may break between (T7): iPhone Safari has no `word-break: auto-phrase`, so
 *  Japanese would otherwise break inside a word (筋力トレーニ / ング). `spaced`: the pieces are English words. */
export function typeParts(type: string): { parts: string[]; spaced: boolean } {
  const label = typeLabel(type);
  if (i18n.locale !== 'ja') return { parts: label.split(' '), spaced: true };
  return { parts: label.split(JA_JOINTS).filter(Boolean), spaced: false };
}

/** Lock countdown for an open week: days (or hours on the last day). */
export function leftLabel(lockAt: number, now: number): string {
  const h = Math.max(0, Math.ceil((lockAt - now) / 3600_000));
  return h >= 24 ? t('kiroku.daysLeft', { n: Math.floor(h / 24) }) : t('kiroku.hoursLeft', { n: h });
}

/** One change-log line: field, before → after. */
export function editText(e: EditLog): { field: string; before: string; after: string } {
  const field = t(`kiroku.field.${e.field}`, { subject: e.subject ? typeLabel(e.subject) : '' });
  const v = (x: number | boolean | null): string => {
    if (x === null) return '–';
    if (typeof x === 'number') return e.field === 'steps' ? num(x) : e.field === 'move_kcal' ? t('kiroku.kcal', { n: num(x) }) : t('kiroku.min', { n: x });
    if (e.field === 'workout_strength') return t(x ? 'kiroku.val.yes' : 'kiroku.val.no');
    return t(x ? 'kiroku.val.out' : 'kiroku.val.in');
  };
  return { field, before: v(e.before), after: v(e.after) };
}

/** Days needed for each weekly badge (the latest rules: 5 · 5 · 5 · 4 · 3). */
export function badgeGoals(): Record<RingFruit, number> {
  const b = RULES[RULES.length - 1].badges;
  return { peach: b.exerciseDays, pear: b.moveDays, cherry: b.standDays, apple: b.stepDays, coconut: b.gymDays };
}


/** A weight: `68.4 kg`. */
export const kgText = (kg: number): string => t('weight.kg', { kg: kg.toFixed(1) });

/** A weight change: `−0.3 kg`, `+0.2 kg`, `±0.0 kg` (a true minus sign); `–` when there's none yet. */
export function kgDelta(d: number | null): string {
  if (d === null) return '–';
  const r = Math.round(d * 10) / 10;
  const sign = r < 0 ? '−' : r > 0 ? '+' : '±';
  return t('weight.kg', { kg: sign + Math.abs(r).toFixed(1) });
}

/**
 * What was typed in a weight field → kg (one decimal), or null: `68.4`, `68,4` (decimal comma), full-width `６８．４`,
 * a trailing `kg`. 20–300 kg only; more than one decimal is rounded.
 */
export function parseKgInput(text: string): number | null {
  const s = text.trim().replace(/[０-９．，]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/\s*kg$/i, '').replace(',', '.');
  if (!/^\d{1,3}(\.\d+)?$/.test(s)) return null;
  const kg = Math.round(Number(s) * 10) / 10;
  return isWeightKg(kg) ? kg : null;
}

/** What was typed as a Move goal → whole kcal, or null: `600`, `1,200`, full-width `６００`, a trailing `kcal`. */
export function parseKcalInput(text: string): number | null {
  const s = text.trim().replace(/[０-９，]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/\s*kcal$/i, '').replace(/,/g, '');
  if (!/^\d{1,4}$/.test(s)) return null;
  const n = Number(s);
  return n >= MOVE_GOAL.min && n <= MOVE_GOAL.max ? n : null;
}

/** A month, for a projected goal date: `2027年3月` / `Mar 2027`. */
export function monthText(d: string): string {
  if (i18n.locale === 'ja') return `${d.slice(0, 4)}年${Number(d.slice(5, 7))}月`;
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${d}T00:00:00Z`));
}
