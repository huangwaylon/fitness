// The bot's state, saved as JSON (the Python bot's version-3 state.json shape, so it moves between the two unchanged).
//
// Each date has at most one saved rule:
//   - ANY          → alert for any open slot that day (🔔 終日)
//   - SKIP         → no alerts that day (🔕 通知オフ)
//   - [start, end] → only slots inside that time range (⏰)
//   - nothing      → ANY within the next DAYS_TO_CHECK days, otherwise not checked yet (💤)
//
// A checked day can also have a "check from" time (⏳): the day is ignored until then. It's kept when the rule
// changes between ANY and a range, cleared by SKIP, and dropped once it has passed.
//
// Each slot time (day + start, whichever program) is announced at most once, even if it's booked and freed again
// later. Records are dropped once the time has passed.
//
// Also the bot-wide check settings: the interval between checks and whether checks are paused.
// Mutations set `dirty`; the bot then saves the state.
import { CHECK_INTERVAL_MINUTES, DAYS_TO_CHECK } from './config.ts';
import { addDays, dayOf, isoJst, type Clock, type Day } from './time.ts';

export const VERSION = 3;
export const ANY = 'any';
export const SKIP = 'skip';
export type Rule = 'any' | 'skip' | [Clock, Clock];
/** null = any time of day. */
export type Window = [Clock, Clock] | null;

export interface StateJson {
  version: 3;
  interval_minutes: number;
  paused: boolean;
  days: Record<Day, 'any' | 'skip' | [Clock, Clock]>;
  check_from: Record<Day, string>;
  notified: string[];
}

/** Days checked all day unless set otherwise. */
export function defaultDays(today: Day): Day[] {
  return Array.from({ length: DAYS_TO_CHECK }, (_, i) => addDays(today, i));
}

const sameRule = (a: Rule | undefined, b: Rule | undefined): boolean =>
  a === b || (Array.isArray(a) && Array.isArray(b) && a[0] === b[0] && a[1] === b[1]);

const byKey = <T>(m: Map<Day, T>): [Day, T][] => [...m].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

// Parsing a saved state: anything malformed throws, as the Python bot's fromisoformat calls did.

function parseDay(value: unknown): Day {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\d$/.test(value) || addDays(value, 0) !== value) {
    throw new Error(`bad day: ${JSON.stringify(value)}`);
  }
  return value;
}

function parseClock(value: unknown): Clock {
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    throw new Error(`bad time: ${JSON.stringify(value)}`);
  }
  return value;
}

/** An ISO instant with its offset (the Python bot only compared offset-aware times). */
function parseInstant(value: unknown): number {
  const ms = typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d(:\d\d(\.\d+)?)?(Z|[+-]\d\d:\d\d)$/.test(value)
    ? Date.parse(value)
    : NaN;
  if (Number.isNaN(ms)) throw new Error(`bad time: ${JSON.stringify(value)}`);
  return ms;
}

function parseRule(value: unknown): Rule {
  if (value === ANY || value === SKIP) return value;
  if (!Array.isArray(value) || value.length !== 2) throw new Error(`bad rule: ${JSON.stringify(value)}`);
  return [parseClock(value[0]), parseClock(value[1])];
}

function entries(value: unknown): [string, unknown][] {
  if (value === undefined) return [];
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`bad state: ${JSON.stringify(value)}`);
  }
  return Object.entries(value);
}

export class Store {
  /** Minutes between checks. */
  intervalMinutes: number;
  /** No automatic checks until resumed. */
  paused: boolean;
  dirty = false;
  private rulesByDay: Map<Day, Rule>;
  private checkFromByDay: Map<Day, number>;
  private notifiedStarts: Set<number>;

  constructor(data?: unknown) {
    const d = (data === undefined ? { version: VERSION } : data) as Record<string, unknown>;
    if (typeof d !== 'object' || d === null || Array.isArray(d) || d.version !== VERSION) {
      throw new Error('unsupported state (version 3 expected)');
    }
    this.rulesByDay = new Map(entries(d.days).map(([day, v]) => [parseDay(day), parseRule(v)]));
    this.checkFromByDay = new Map(entries(d.check_from).map(([day, v]) => [parseDay(day), parseInstant(v)]));
    if (d.notified !== undefined && !Array.isArray(d.notified)) throw new Error('bad state: notified');
    this.notifiedStarts = new Set(((d.notified ?? []) as unknown[]).map(parseInstant));
    const interval = d.interval_minutes ?? CHECK_INTERVAL_MINUTES;
    // at least a minute: 0 or less would check again at once, over and over (a hand-edited restore)
    if (typeof interval !== 'number' || !Number.isFinite(interval) || interval < 1) {
      throw new Error('bad state: interval_minutes');
    }
    const paused = d.paused ?? false;
    if (typeof paused !== 'boolean') throw new Error('bad state: paused');
    this.intervalMinutes = interval;
    this.paused = paused;
  }

  /** The state as saved (Python's `to_dict`). */
  toJSON(): StateJson {
    return {
      version: VERSION,
      interval_minutes: this.intervalMinutes,
      paused: this.paused,
      days: Object.fromEntries(this.rules().map(([day, r]) => [day, typeof r === 'string' ? r : [r[0], r[1]]])),
      check_from: Object.fromEntries(byKey(this.checkFromByDay).map(([day, t]) => [day, isoJst(t)])),
      notified: this.notified().map(isoJst),
    };
  }

  // --- day rules ---

  /** The saved rule, if any. */
  rule(day: Day): Rule | undefined {
    return this.rulesByDay.get(day);
  }

  /** The rule in force: the saved one, else ANY for the default days, else undefined (not checked yet). */
  effectiveRule(day: Day, today: Day): Rule | undefined {
    return this.rulesByDay.get(day) ?? (defaultDays(today).includes(day) ? ANY : undefined);
  }

  /** Give a day its rule. Returns false if that's what it already was. */
  setRule(day: Day, rule: Rule, today: Day): boolean {
    const before = this.effectiveRule(day, today);
    if (rule === SKIP) this.changeCheckFrom(day, null);
    if (rule === ANY && defaultDays(today).includes(day)) {
      // The default anyway; keeps the saved list short.
      if (this.rulesByDay.delete(day)) this.dirty = true;
    } else if (!sameRule(this.rulesByDay.get(day), rule)) {
      this.rulesByDay.set(day, typeof rule === 'string' ? rule : [rule[0], rule[1]]);
      this.dirty = true;
    }
    return !sameRule(this.effectiveRule(day, today), before);
  }

  /** Clear everything for a day, including which of its times were announced, so they can alert again once the day
   *  is checked. Returns false if there was nothing to clear. */
  reset(day: Day): boolean {
    if (!this.hasAnything(day)) return false;
    this.rulesByDay.delete(day);
    this.checkFromByDay.delete(day);
    for (const t of this.notifiedStarts) if (dayOf(t) === day) this.notifiedStarts.delete(t);
    this.dirty = true;
    return true;
  }

  /** True if `reset` would clear something for the day. */
  hasAnything(day: Day): boolean {
    return this.rulesByDay.has(day) || this.checkFromByDay.has(day) || [...this.notifiedStarts].some((t) => dayOf(t) === day);
  }

  /** When checking the day starts, if set. */
  checkFrom(day: Day): number | undefined {
    return this.checkFromByDay.get(day);
  }

  /** Only check the day from `when` on (null = right away). A day that isn't checked becomes ANY.
   *  Returns false if nothing changed. */
  setCheckFrom(day: Day, when: number | null, today: Day): boolean {
    if (when !== null) {
      const rule = this.effectiveRule(day, today);
      if (rule === SKIP || rule === undefined) this.setRule(day, ANY, today);
    }
    return this.changeCheckFrom(day, when);
  }

  private changeCheckFrom(day: Day, when: number | null): boolean {
    if ((this.checkFromByDay.get(day) ?? null) === when) return false;
    if (when === null) this.checkFromByDay.delete(day);
    else this.checkFromByDay.set(day, when);
    this.dirty = true;
    return true;
  }

  /** The saved rules in date order. */
  rules(): [Day, Rule][] {
    return byKey(this.rulesByDay);
  }

  /** Days with a saved rule or a check-from time, in date order. */
  daysWithSettings(): Day[] {
    return [...new Set([...this.rulesByDay.keys(), ...this.checkFromByDay.keys()])].sort();
  }

  /** What to look for on each date that's checked right now, in date order. */
  windows(now: number): Map<Day, Window> {
    const today = dayOf(now);
    const windows = new Map<Day, Window>();
    for (const d of [...new Set([...defaultDays(today), ...this.rulesByDay.keys()])].sort()) {
      const rule = this.effectiveRule(d, today);
      if (rule !== SKIP && now >= (this.checkFromByDay.get(d) ?? now)) windows.set(d, rule === ANY ? null : rule!);
    }
    return windows;
  }

  /** Forget rules for past days, and "check from" times and slot records that have passed. */
  purge(now: number): void {
    const today = dayOf(now);
    let changed = false;
    for (const d of this.rulesByDay.keys()) {
      if (d < today) changed = this.rulesByDay.delete(d) || changed;
    }
    for (const [d, t] of this.checkFromByDay) {
      if (t <= now || d < today) changed = this.checkFromByDay.delete(d) || changed;
    }
    for (const t of this.notifiedStarts) {
      if (t <= now) changed = this.notifiedStarts.delete(t) || changed;
    }
    if (changed) this.dirty = true;
  }

  // --- notifications ---

  isNotified(start: number): boolean {
    return this.notifiedStarts.has(start);
  }

  markNotified(starts: Iterable<number>): void {
    for (const t of starts) {
      if (!this.notifiedStarts.has(t)) {
        this.notifiedStarts.add(t);
        this.dirty = true;
      }
    }
  }

  /** The announced slot starts, in time order. */
  notified(): number[] {
    return [...this.notifiedStarts].sort((a, b) => a - b);
  }

  // --- check settings ---

  /** Returns false if that's what it already was. */
  setInterval(minutes: number): boolean {
    if (this.intervalMinutes === minutes) return false;
    this.intervalMinutes = minutes;
    this.dirty = true;
    return true;
  }

  /** Returns false if that's what it already was. */
  setPaused(paused: boolean): boolean {
    if (this.paused === paused) return false;
    this.paused = paused;
    this.dirty = true;
    return true;
  }
}
