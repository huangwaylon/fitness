// ボット → ジム's calendar and day editor, as pure functions (docs/design.md "Bots"; the rows are GET /gym/config's,
// contract.ts): the 4 weeks from this week's Monday (the 25 days settable, the rest blank), each cell's look and its
// accessible words, the half-hour slot picker (a tap starts an hour, the next picks the last slot, a tap inside trims
// the end), the ⏳ dates and times allowed, the optimistic row after an act, the acts that undo one, and the select
// mode's bulk act. The page (GymPage, GymCalendar, GymDayEditor) only draws them.
import { t } from '#lib/i18n/index.ts';
import { md, weekdayOf } from '#lib/i18n/format.ts';
import '#lib/i18n/gym.ts';
import {
  CLOSES, DEFAULT_WINDOW, LAST_START, OPENS, SLOT_MINUTES, addDays, at, clockFrom, clockOf, dayOf, fromLimit, fromRefusal, minutesOf, weekday,
  type ActInput, type Change, type Clock, type Day, type DayAct, type DayRow, type Rule
} from './contract.ts';

/** A cell's fill: 終日 leaf, 時間指定 mint, ふだん mint dashed (the next DAYS_TO_CHECK days), 未チェック paper, オフ sunk. */
type Fill = 'any' | 'range' | 'usual' | 'none' | 'off';
export interface Cell {
  day: Day;
  /** One of the 25 days (else blank and inert). */
  row: DayRow | null;
  today: boolean;
  /** The day of the month. */
  date: number;
  fill: Fill;
  /** `12–13`, `18:30–20` (a range or ふだん), else null. */
  time: string | null;
  from: boolean;
  announced: number;
  /** VoiceOver's words: `11月14日(金) 終日、⏳ 18:00から、通知済み2件`. */
  label: string;
}

/** A day's own rule, or ふだん's window, or none (未チェック). */
export const ruleOf = (row: DayRow): Rule | null => row.rule ?? (row.usual ? [DEFAULT_WINDOW[0], DEFAULT_WINDOW[1]] : null);

function fillOf(row: DayRow): Fill {
  if (row.rule === 'any') return 'any';
  if (row.rule === 'skip') return 'off';
  if (row.rule) return 'range';
  return row.usual ? 'usual' : 'none';
}

/** `12` · `18:30` (a clock time without its :00 and its leading zero). */
const short = (c: Clock): string => (c.endsWith(':00') ? String(Number(c.slice(0, 2))) : `${Number(c.slice(0, 2))}:${c.slice(3)}`);
/** `12–13`, `18:30–20`. */
const shortRange = ([s, e]: readonly [Clock, Clock]): string => `${short(s)}–${short(e)}`;
/** `12:00〜13:00`. */
export const longRange = ([s, e]: readonly [Clock, Clock]): string => `${s}〜${e}`;

/** `11/14（金）` / `Fri 11/14`: the editor's title, a change's day. */
export const dayTitle = (d: Day): string => t('gym.dayTitle', { md: md(d), wd: weekdayOf(d) });

/** A ⏳ as words, as 📋 words it: `18:00` on its own day, `11/10（火）18:00` on an earlier one. */
export const fromWords = (day: Day | null, when: number): string =>
  day !== null && dayOf(when) === day ? clockOf(when) : t('gym.fromDay', { day: dayTitle(dayOf(when)), time: clockOf(when) });

/** A row's ⏳ as words (fromWords), if set. */
export const fromText = (row: DayRow): string | null => (row.from === null ? null : fromWords(row.day, row.from));

/** The rule in words: 終日, 12:00〜13:00, ふだん（12:00〜13:00）, 未チェック, オフ. */
export function ruleText(row: DayRow): string {
  const f = fillOf(row);
  if (f === 'range') return longRange(row.rule as [Clock, Clock]);
  if (f === 'usual') return t('gym.rule.usual', { range: longRange(DEFAULT_WINDOW) });
  return t(`gym.rule.${f}`);
}

/** VoiceOver's words for a cell. */
function labelOf(row: DayRow, today: boolean): string {
  const parts = [`${dayTitle(row.day)}${today ? t('gym.cell.today') : ''}`, ruleText(row)];
  const from = fromText(row);
  if (from) parts.push(t('gym.cell.from', { time: from }));
  if (row.announced.length) parts.push(t('gym.cell.announced', { n: row.announced.length }));
  return parts.join(t('gym.cell.sep'));
}

/** Monday of the week a day is in. */
const mondayOf = (d: Day): Day => addDays(d, -weekday(d));

/** The calendar: 4 weeks Mon–Sun from this week's (the rows' first day is today, the Worker's), a cell a day. */
export function weeks(rows: readonly DayRow[]): Cell[][] {
  if (!rows.length) return [];
  const today = rows[0].day;
  const byDay = new Map(rows.map((r) => [r.day, r]));
  const start = mondayOf(today);
  return Array.from({ length: 4 }, (_, w) => Array.from({ length: 7 }, (_, i) => {
    const day = addDays(start, w * 7 + i);
    const row = byDay.get(day) ?? null;
    const base = { day, row, today: day === today, date: Number(day.slice(8, 10)) };
    if (!row) return { ...base, fill: 'none' as const, time: null, from: false, announced: 0, label: dayTitle(day) };
    const rule = ruleOf(row);
    return {
      ...base, fill: fillOf(row), time: Array.isArray(rule) ? shortRange(rule) : null, from: row.from !== null,
      announced: row.announced.length, label: labelOf(row, day === today)
    };
  }));
}

// ---- the slot picker ----

/** The half-hour slots a day: 10:00 … 21:30 (24: a 6×4 grid). */
export const SLOTS: readonly Clock[] = Array.from({ length: (minutesOf(CLOSES) - minutesOf(OPENS)) / SLOT_MINUTES }, (_, i) => clockFrom(minutesOf(OPENS) + i * SLOT_MINUTES));
const plus = (c: Clock, minutes: number): Clock => clockFrom(Math.min(minutesOf(c) + minutes, minutesOf(CLOSES)));

/** The picker's state: the range shown, and whether its end is still to pick (after a first tap). */
export interface SlotPick { range: [Clock, Clock] | null; open: boolean }

/** A slot tapped: the first tap starts an hour (2 slots; 21:30 → 22:00), the next picks the last slot (before the
 *  start: a new start), a tap inside a picked range trims its end to that slot. Saved as [first, last + 30]. */
export function pickSlot(p: SlotPick, slot: Clock): SlotPick {
  const r = p.range;
  if (p.open && r && slot >= r[0]) return { range: [r[0], plus(slot, SLOT_MINUTES)], open: false };
  if (!p.open && r && slot >= r[0] && plus(slot, SLOT_MINUTES) < r[1]) return { range: [r[0], plus(slot, SLOT_MINUTES)], open: false };
  return { range: [slot, plus(slot, 2 * SLOT_MINUTES)], open: true };
}

/** How many slots a range holds. */
export const slotCount = ([s, e]: readonly [Clock, Clock]): number => (minutesOf(e) - minutesOf(s)) / SLOT_MINUTES;

/** A chip: watched (in the range), announced (✓). */
export const slotState = (slot: Clock, range: readonly [Clock, Clock] | null, announced: readonly Clock[]) => ({
  watched: !!range && slot >= range[0] && slot < range[1],
  announced: announced.includes(slot)
});

// ---- ⏳ ----

/** A ⏳ time the editor offers: its instant, and whether the bot takes it. */
export interface FromChoice { clock: Clock; at: number; ok: boolean }

/** The ⏳ times on `date` for a row's day: the half hours the bot takes (contract fromRefusal: still ahead; on the
 *  day itself before its window's last slot), and the saved ⏳ when it is on that date and not one of them (LINE's any
 *  minute; ok false when the bot would refuse it now), so the select shows what is set. */
export function fromTimes(row: DayRow, date: Day, now: number): FromChoice[] {
  const rule = ruleOf(row);
  const choice = (when: number): FromChoice => ({ clock: clockOf(when), at: when, ok: fromRefusal(row.day, when, now, rule) === null });
  const last = date === row.day ? minutesOf(LAST_START) : 24 * 60 - SLOT_MINUTES;
  const out: FromChoice[] = [];
  for (let m = 0; m <= last; m += SLOT_MINUTES) {
    const c = choice(at(date, clockFrom(m)));
    if (c.ok) out.push(c);
  }
  const saved = row.from;
  if (saved !== null && dayOf(saved) === date && !out.some((c) => c.at === saved)) out.push(choice(saved));
  return out.sort((a, b) => a.at - b.at);
}

/** The ⏳ dates for a row's day: from today (Tokyo) to the day itself, each with a time the bot takes, and the saved
 *  ⏳'s date. */
export function fromDates(row: DayRow, now: number): Day[] {
  const days: Day[] = [];
  for (let d = dayOf(now); d <= row.day; d = addDays(d, 1)) {
    if ((row.from !== null && dayOf(row.from) === d) || fromTimes(row, d, now).some((c) => c.ok)) days.push(d);
  }
  return days;
}

// ---- acts, optimistic rows, undo ----

/** A day act on one row. */
export type DayInput = Extract<ActInput, { d: Day }>;

/** Whether a day is one of the default days (ふだん when unset): the first `defaultDays` rows. */
const usualDay = (rows: readonly DayRow[], day: Day, defaultDays: number): boolean => rows.findIndex((r) => r.day === day) < defaultDays;
const sameRule = (a: Rule | null, b: Rule | null) => a === b || (Array.isArray(a) && Array.isArray(b) && a[0] === b[0] && a[1] === b[1]);
const isDefault = (r: Rule | null) => sameRule(r, [DEFAULT_WINDOW[0], DEFAULT_WINDOW[1]]);

/** A row as the bot will have it after `act` (the page shows it at once; the answer replaces it). */
export function predict(row: DayRow, act: DayInput, usual: boolean): DayRow {
  let { rule, from, announced } = row;
  const setRule = (r: Rule | null) => {
    rule = usual && isDefault(r) ? null : r;
    // a ⏳ the new window leaves no slot after is cleared (the bot's store.setRule)
    if (from !== null && from >= fromLimit(row.day, rule)) from = null; // (ふだん / none: DEFAULT_WINDOW)
  };
  if (act.a === 'any' || act.a === 'skip') setRule(act.a);
  if (act.a === 'range') setRule([act.s, act.e]);
  if (act.a === 'skip' || act.a === 'unfrom') from = null;
  if (act.a === 'reset') [rule, from, announced] = [null, null, []];
  if (act.a === 'from') {
    from = typeof act.at === 'number' ? act.at : at(row.day, act.at);
    if (rule === 'skip' || (rule === null && !usual)) setRule([DEFAULT_WINDOW[0], DEFAULT_WINDOW[1]]);
  }
  return { ...row, rule, from, announced, usual: rule === null && usual, resettable: rule !== null || from !== null || announced.length > 0 };
}

/** Rows after an act on some of them. */
export function predictAll(rows: readonly DayRow[], input: ActInput, defaultDays: number): DayRow[] {
  if (!('d' in input) && !('days' in input)) return [...rows];
  const days = 'days' in input ? new Set(input.days.map((x) => x.d)) : new Set([input.d]);
  return rows.map((r) => {
    if (!days.has(r.day)) return r;
    const one = ('days' in input ? { ...input, d: r.day, days: undefined } : input) as DayInput;
    return predict(r, one, usualDay(rows, r.day, defaultDays));
  });
}

type UndoAct = { a: DayAct } | { a: 'range'; s: Clock; e: Clock };

/** What undoes a change: the acts (in order, bulk where days share one) that put each day's rule and ⏳ back as they
 *  were. Announced times a reset cleared don't come back (the bot keeps none to restore). */
export function undoActs(before: readonly DayRow[], after: readonly DayRow[], defaultDays: number): ActInput[] {
  const groups = new Map<string, { act: UndoAct; days: Day[] }>();
  const froms: ActInput[] = [];
  const add = (act: UndoAct, day: Day) => {
    const k = JSON.stringify(act);
    const g = groups.get(k) ?? { act, days: [] };
    g.days.push(day);
    groups.set(k, g);
  };
  for (const b of before) {
    const a = after.find((x) => x.day === b.day);
    if (!a) continue;
    const usual = usualDay(after, b.day, defaultDays);
    // the rule first (🔕 clears a ⏳; 🔔 and ⏰ keep it), then the ⏳
    let fromNow = a.from;
    if (!sameRule(a.rule, b.rule)) {
      if (b.rule === 'any' || b.rule === 'skip') add({ a: b.rule }, b.day);
      else if (Array.isArray(b.rule)) add({ a: 'range', s: b.rule[0], e: b.rule[1] }, b.day);
      else if (usual) add({ a: 'range', s: DEFAULT_WINDOW[0], e: DEFAULT_WINDOW[1] }, b.day);
      else {
        add({ a: 'reset' }, b.day);
        fromNow = null;
      }
      if (b.rule === 'skip') fromNow = null;
    }
    if (b.from !== fromNow) froms.push(b.from === null ? { a: 'unfrom', d: b.day } : { a: 'from', d: b.day, at: b.from });
  }
  const bulk = [...groups.values()].map(({ act, days }): ActInput =>
    (days.length === 1 ? { ...act, d: days[0] } : { ...act, days: days.map((d) => ({ d })) }) as ActInput);
  return [...bulk, ...froms];
}

/** The select mode's act: one for every day picked, each with the base it was seen at. */
export function bulkAct(kind: DayAct | 'range', days: readonly Day[], rows: readonly DayRow[], range?: readonly [Clock, Clock]): ActInput {
  const list = days.map((d) => ({ d, base: rows.find((r) => r.day === d)?.base }));
  return (kind === 'range' ? { a: 'range', s: range![0], e: range![1], days: list } : { a: kind, days: list }) as ActInput;
}

/** An act with each day's current base (the page sends every act with the base of what it shows). */
export function withBase(input: ActInput, rows: readonly DayRow[]): ActInput {
  const base = (d: Day) => rows.find((r) => r.day === d)?.base;
  if ('days' in input) return { ...input, days: input.days.map((x) => ({ d: x.d, base: base(x.d) })) } as ActInput;
  if ('d' in input) return { ...input, base: base(input.d) } as ActInput;
  return input;
}

/** The days a poll's answer changed under the page (their base moved): highlighted a moment. */
export const movedDays = (was: readonly DayRow[], now: readonly DayRow[]): Day[] =>
  now.filter((r) => { const w = was.find((x) => x.day === r.day); return !!w && w.base !== r.base; }).map((r) => r.day);

/** What an act did, in a word (the 取り消す banner's line, the change list's). */
function changeWhat(c: Pick<Change, 'a' | 's' | 'e' | 'at' | 'm' | 'd'>): string {
  if (c.a === 'range') return longRange([c.s!, c.e!]);
  if (c.a === 'from') return t('gym.cell.from', { time: fromWords(c.d, c.at!) });
  if (c.a === 'interval') return t('gym.ctl.every', { n: c.m! });
  return t(`gym.ch.${c.a}`);
}

/** A change list row: `11/14（金） 終日`, who and when. */
export const changeLine = (c: Change): string => (c.d ? `${dayTitle(c.d)} ${changeWhat(c)}` : changeWhat(c));
