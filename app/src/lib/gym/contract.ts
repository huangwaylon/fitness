// The gym bot's contract (gym/README.md "The app"): what ボット → ジム reads (the members-only GET /gym/config) and
// sends (POST /gym/act), the fixed rules both sides draw from, and Tokyo's days and clock times. The Worker (gym/src)
// owns the rules and imports this file; the app reads it. No DOM, no Worker types: it imports only contract/guards.ts.
import { isRec } from '../contract/guards.ts';

// ---- Tokyo days and clock times: a day is 'YYYY-MM-DD', a clock time 'HH:MM' (both compare as text) ----

export type Day = string;
export type Clock = string;
/** Who acts from the app: a member (the guest's key is refused). @public (gym/src) */
export type Member = 'A' | 'B';

/** Tokyo's offset from UTC. @public (gym/src) */
export const JST_MS = 9 * 3_600_000;
const DAY_MS = 86_400_000;

/** The Tokyo day of an instant. */
export const dayOf = (ms: number): Day => new Date(ms + JST_MS).toISOString().slice(0, 10);
/** The Tokyo clock time of an instant (seconds dropped). */
export const clockOf = (ms: number): Clock => new Date(ms + JST_MS).toISOString().slice(11, 16);
/** The instant of a Tokyo day and clock time. */
export const at = (day: Day, clock: Clock): number => Date.parse(`${day}T${clock}:00+09:00`);
export const addDays = (day: Day, n: number): Day => new Date(Date.parse(day) + n * DAY_MS).toISOString().slice(0, 10);
/** 0 = Monday … 6 = Sunday. */
export const weekday = (day: Day): number => (new Date(day).getUTCDay() + 6) % 7;
export const minutesOf = (clock: Clock): number => Number(clock.slice(0, 2)) * 60 + Number(clock.slice(3, 5));
/** Minutes since midnight as a clock time (kept within the day: 23:59 at most). */
export const clockFrom = (minutes: number): Clock => {
  const m = Math.max(0, Math.min(minutes, 24 * 60 - 1));
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

// ---- The fixed rules ----

/** Days checked without a setting: today and the next 3. The gym allows 3 reservations at a time, so a few near
 *  days at lunch are the usual; the rest wait for a setting. @public (gym/src) */
export const DAYS_TO_CHECK = 4;
/** What those days are checked for: slots that start and end inside it (12:00 and 12:30). */
export const DEFAULT_WINDOW: readonly [Clock, Clock] = ['12:00', '13:00'];
/** Slots are 30 minutes and start 10:00–21:30. */
export const OPENS = '10:00';
export const CLOSES = '22:00';
export const SLOT_MINUTES = 30;
/** The last slot's start: a ⏰ starts by then, and a ⏳ is before it. */
export const LAST_START = '21:30';
/** How far ahead a day can be set, today included (the gym publishes about 4 weeks ahead). */
export const DAYS_SHOWN = 25;
/** Minutes between checks; 15 at first. */
export const INTERVALS = [10, 15, 30, 60] as const;
/** 🔎: once a minute for everyone (LINE and the app share it). @public (gym/src) */
export const CHECK_COOLDOWN_MS = 60_000;
/** POST /gym/act's body, at most. @public (gym/src) */
export const ACT_MAX_BYTES = 2048;
/** The app's changes kept (runtime.changes). @public (gym/src) */
export const CHANGES_KEPT = 12;

/** A day's saved rule: any open slot, none, or the slots inside a time range. */
export type Rule = 'any' | 'skip' | [Clock, Clock];

// ---- GET /gym/config ----

/** 📋's day row, in the bot's words (messages.ts statusView). */
export interface StatusDay {
  day: Day;
  /** `10/5（月）` */
  date: string;
  /** 🔔 終日, ⏰ 12:00〜13:00（ふだん）, 🔕 通知オフ, 💤 まだチェックしない（…） */
  rule: string;
  /** ⏳ 16:00から */
  from: string | null;
  /** Nothing announced that day (🔕, 💤). */
  soft: boolean;
}

/** One of the 25 days the calendar shows (today first). */
export interface DayRow {
  day: Day;
  /** The saved rule; null = none (ふだん within the default days, else 未チェック). */
  rule: Rule | null;
  /** No saved rule, and a default day: DEFAULT_WINDOW applies. */
  usual: boolean;
  /** ⏳: not checked before this instant (it may be on an earlier day, set from LINE). */
  from: number | null;
  /** The slot starts already announced that day (each time once). */
  announced: Clock[];
  /** 🧹 has something to clear (a rule, a ⏳ or an announced time). */
  resettable: boolean;
  /** The day's setting (rule and ⏳, not the announced times) as a short hash: sent back as `base`, a 409 `stale`
   *  when it moved since. */
  base: string;
}

/** What an app change did (runtime.changes), worded by each side. */
export type ChangeKind = 'any' | 'skip' | 'range' | 'reset' | 'from' | 'unfrom' | 'interval' | 'pause' | 'resume';
export interface Change {
  t: number;
  by: Member;
  /** NAME_A / NAME_B (the Worker's secrets), else メンバーA / B. */
  who: string;
  a: ChangeKind;
  d: Day | null;
  /** range */
  s?: Clock;
  e?: Clock;
  /** from: the instant */
  at?: number;
  /** interval: minutes */
  m?: number;
  /** As LINE says it: `11/14（金）🔔 終日（ウェイ）` */
  text: string;
}

export interface GymConfig {
  v: 1;
  now: number;
  /** 📋's parts and LINE's text (`text`), as the group sees them. */
  title: string;
  days: StatusDay[];
  notice: string | null;
  check: string;
  text: string;
  paused: boolean;
  intervalMin: number;
  lastCheck: number | null;
  nextCheck: number | null;
  /** The calendar: today and the next DAYS_SHOWN - 1 days. */
  rows: DayRow[];
  defaultDays: number;
  intervals: readonly number[];
  /** 🔎's cooldown ends then (null: ready). */
  checkReadyAt: number | null;
  /** A check is running now. */
  checking: boolean;
  /** The app's last changes, newest first: the latest per day and check setting (LINE never names them). */
  changes: Change[];
}

// ---- POST /gym/act ----

export type DayAct = 'any' | 'skip' | 'reset' | 'unfrom';
/** A day in a bulk act, with the `base` it was seen at. @public (gym/src) */
export interface BulkDay { d: Day; base?: string }
export type ActInput =
  | { a: DayAct; d: Day; base?: string }
  | { a: 'range'; d: Day; s: Clock; e: Clock; base?: string }
  /** `at`: a clock time on `d`, or an instant (the undo of a ⏳ set from LINE). */
  | { a: 'from'; d: Day; at: Clock | number; base?: string }
  | { a: 'interval'; m: number }
  | { a: 'pause' }
  | { a: 'resume' }
  | { a: 'check' }
  /** The calendar's select mode: one act for every day, all or nothing. */
  | { a: DayAct; days: BulkDay[] }
  | { a: 'range'; s: Clock; e: Clock; days: BulkDay[] };

export type ActError =
  | 'bad_action' | 'not_json' | 'too_large' | 'day_too_far'
  | 'day_passed' | 'bad_range' | 'from_passed' | 'from_after_day' | 'from_after_window'
  | 'stale' | 'paused' | 'running' | 'cooldown' | 'site_failed' | 'failed'
  | 'unauthorized' | 'no_keys' | 'origin' | 'method' | 'mode_off';

/** Each refusal's HTTP status. */
export const ACT_STATUS: Record<ActError, number> = {
  bad_action: 400, not_json: 400, too_large: 413, day_too_far: 400,
  day_passed: 422, bad_range: 422, from_passed: 422, from_after_day: 422, from_after_window: 422,
  stale: 409, paused: 409, running: 429, cooldown: 429, site_failed: 502, failed: 500,
  unauthorized: 401, no_keys: 401, origin: 403, method: 405, mode_off: 503
};

/** 🔎's open slot. */
export interface OpenSlot { day: Day; start: Clock; end: Clock; programs: ('training' | 'pilates')[] }

/** @public (gym/src) */
export type ActAnswer =
  | { ok: true; changed: boolean; reply: string; config: GymConfig; lines?: string[]; partial?: boolean; slots?: OpenSlot[] }
  /** `hint`: the bot's words (as LINE's 🤔); `config` with a 409 `stale` (and when known). */
  | { ok: false; error: ActError; hint?: string; config?: GymConfig };

const DAY_SHAPE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const HALF_HOUR = /^([01]\d|2[0-3]):(00|30)$/;
export const isDay = (v: unknown): v is Day => typeof v === 'string' && DAY_SHAPE.test(v) && addDays(v, 0) === v;
/** A clock time on the half hour (or 24:00's stand-in, CLOSES, as an end). */
export const isSlotClock = (v: unknown): v is Clock => typeof v === 'string' && (HALF_HOUR.test(v) || v === CLOSES);
const isBase = (v: unknown): v is string | undefined => v === undefined || (typeof v === 'string' && /^[0-9a-z]{1,12}$/.test(v));
const DAY_ACTS: readonly string[] = ['any', 'skip', 'reset', 'unfrom'];

/** A POST /gym/act body as the Worker reads it, or null when it isn't one (the shape only: the days' and times' rules
 *  are the bot's). Unknown keys are ignored. */
export function parseActInput(x: unknown): ActInput | null {
  if (!isRec(x) || typeof x.a !== 'string') return null;
  const a = x.a;
  if (a === 'pause' || a === 'resume' || a === 'check') return { a };
  if (a === 'interval') return (INTERVALS as readonly unknown[]).includes(x.m) ? { a, m: x.m as number } : null;
  const range = a === 'range';
  if (!range && !DAY_ACTS.includes(a) && a !== 'from') return null;
  if (range && (!isSlotClock(x.s) || !isSlotClock(x.e))) return null;
  if ('days' in x) {
    if (a === 'from' || !Array.isArray(x.days) || !x.days.length || x.days.length > DAYS_SHOWN) return null;
    const days: BulkDay[] = [];
    for (const d of x.days) {
      if (!isRec(d) || !isDay(d.d) || !isBase(d.base) || days.some((y) => y.d === d.d)) return null;
      days.push(d.base === undefined ? { d: d.d } : { d: d.d, base: d.base });
    }
    return range ? { a, s: x.s as Clock, e: x.e as Clock, days } : { a: a as DayAct, days };
  }
  if (!isDay(x.d) || !isBase(x.base)) return null;
  const base = x.base === undefined ? {} : { base: x.base };
  if (range) return { a, d: x.d, s: x.s as Clock, e: x.e as Clock, ...base };
  if (a === 'from') {
    const ok = (typeof x.at === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(x.at)) || (typeof x.at === 'number' && Number.isFinite(x.at));
    return ok ? { a, d: x.d, at: x.at as Clock | number, ...base } : null;
  }
  return { a: a as DayAct, d: x.d, ...base };
}
