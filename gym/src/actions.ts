// What the buttons do, apart from drawing cards: ONE code path for LINE's taps (ui.ts maps a postback to a GymAction)
// and the app's POST /gym/act (parseAction reads its body, webAct runs it). `apply` changes the state and answers in
// the bot's words, or refuses with a code and LINE's hint. Also the bot interface they and the cards need, 📋's
// answer (status) and the app's /gym/config (config).
import {
  ACT_STATUS, CHANGES_KEPT, CHECK_COOLDOWN_MS, CLOSES, DAYS_SHOWN, INTERVALS, OPENS, parseActInput,
  type ActAnswer, type ActError, type Change, type ChangeKind, type DayRow, type GymConfig, type Member, type OpenSlot
} from '../../app/src/lib/gym/contract.ts';
import { isRec } from '../../app/src/lib/contract/guards.ts';
import { DEFAULT_WINDOW } from './config.ts';
import { CheckFailed, PROGRAMS, slotEnd, type Slot } from './hacomono.ts';
import type { Line } from './line.ts';
import * as messages from './messages.ts';
import { ANY, SKIP, defaultDays, type Rule, type Store } from './store.ts';
import { addDays, at, clockOf, dayOf, type Clock, type Day } from './time.ts';

/** An app change as kept in runtime.changes (`said`: carried by a LINE reply since). */
export interface StoredChange {
  t: number;
  by: Member;
  a: ChangeKind;
  d: Day | null;
  s?: Clock;
  e?: Clock;
  at?: number;
  m?: number;
  said: boolean;
}

/** What the buttons need from the bot (the Durable Object implements it). */
export interface Bot {
  store: Store;
  line: Line;
  /** The one group answered and alerted ('' until set up). */
  groupId: string;
  /** The last automatic or manual check. */
  lastCheck: number | null;
  /** The next automatic check (null while stopped). */
  nextCheck(): Promise<number | null>;
  /** Fully failed checks in a row. */
  failures: number;
  /** A check is running. */
  checking: boolean;
  lastManualCheck: number | null;
  /** Check now; throws CheckFailed. `peek` (the app's 🔎): marks nothing announced, so the alarm still alerts. */
  runCheck(alert: boolean, peek?: boolean): Promise<Slot[]>;
  /** Write the state if it changed. */
  save(): Promise<void>;
  /** The check settings changed: reschedule. */
  wake(): Promise<void>;
  /** The app's last changes, newest first (runtime.changes). */
  changes: StoredChange[];
  /** A member's name: NAME_A / NAME_B, else メンバーA / B. */
  nameOf(who: Member): string;
}

/** One action, from a LINE tap or the app. */
export type GymAction =
  | { a: 'any' | 'skip' | 'reset' | 'unfrom'; d: Day }
  | { a: 'range'; d: Day; s: Clock; e: Clock }
  | { a: 'from'; d: Day; at: number }
  | { a: 'interval'; m: number }
  | { a: 'pause' }
  | { a: 'resume' }
  /** `peek`: the app's (marks nothing; the answer only in the app). */
  | { a: 'check'; peek?: boolean };
type DayAction = Extract<GymAction, { d: Day }>;

/** Why an action can't be done: the code (the app's) and LINE's hint, in the bot's words. */
export interface Refusal {
  code: ActError;
  hint: string;
  /** cooldown: seconds until 🔎 can run. */
  retryAfter?: number;
}
/** Done: whether anything changed, the reply (LINE's text), and 🔎's lines and slots. */
export interface Applied {
  changed: boolean;
  reply: string;
  lines?: string[];
  slots?: Slot[];
  partial?: boolean;
}
export const refused = <T extends object>(r: T | Refusal): r is Refusal => 'code' in r;

// --- the app's body ---

/** A POST /gym/act body read into actions (one, or one a day for the bulk form) with the `base` each was seen at,
 *  or why not: `bad_action` (not one), `day_too_far` (past the days shown), `bad_range` (outside the opening hours).
 *  A ⏳ clock time is on its day. */
export function parseAction(raw: unknown, now: number): { acts: { act: GymAction; base?: string }[]; bulk: boolean } | Refusal {
  const input = parseActInput(raw);
  if (!input) return { code: 'bad_action', hint: messages.OUTDATED };
  if (input.a === 'pause' || input.a === 'resume') return { acts: [{ act: { a: input.a } }], bulk: false };
  if (input.a === 'check') return { acts: [{ act: { a: 'check', peek: true } }], bulk: false };
  if (input.a === 'interval') return { acts: [{ act: { a: 'interval', m: input.m } }], bulk: false };
  if (input.a === 'range' && (input.s < OPENS || input.e > CLOSES)) return { code: 'bad_range', hint: messages.BAD_RANGE };
  const last = addDays(dayOf(now), DAYS_SHOWN - 1);
  const days = 'days' in input ? input.days : [{ d: input.d, base: input.base }];
  const far = days.find((x) => x.d > last);
  if (far) return { code: 'day_too_far', hint: messages.dayTooFar(far.d) };
  const actOf = (d: Day): DayAction => {
    if (input.a === 'range') return { a: 'range', d, s: input.s, e: input.e };
    if (input.a === 'from') return { a: 'from', d, at: typeof input.at === 'number' ? input.at : at(d, input.at) };
    return { a: input.a, d };
  };
  return { acts: days.map((x) => ({ act: actOf(x.d), ...(x.base === undefined ? {} : { base: x.base }) })), bulk: 'days' in input };
}

// --- applying ---

/** Do one action (ui.ts's taps, and each of the app's), as at `now` (an app act's days all at its one instant). Never
 *  throws for a refusal. */
export async function apply(bot: Bot, act: GymAction, now = Date.now()): Promise<Applied | Refusal> {
  if (act.a === 'check') return check(bot, act.peek ?? false, now);
  if (act.a === 'interval') return checkSetting(bot, bot.store.setInterval(act.m), messages.intervalNote(act.m));
  if (act.a === 'pause' || act.a === 'resume') {
    const paused = act.a === 'pause';
    return checkSetting(bot, bot.store.setPaused(paused), paused ? messages.PAUSED_NOTE : messages.RESUMED_NOTE);
  }
  const refusal = dayRefusal(act, now);
  if (refusal) return refusal;
  const today = dayOf(now);
  if (act.a === 'reset') {
    if (!bot.store.reset(act.d)) return dayReply(bot, act.d, today, false);
    return { changed: true, reply: messages.dayReset(bot.store, act.d, today) };
  }
  if (act.a === 'unfrom') return dayReply(bot, act.d, today, bot.store.setCheckFrom(act.d, null, today));
  if (act.a === 'from') return setCheckFrom(bot, act.d, act.at, now);
  const rule: Rule = act.a === 'range' ? [act.s, act.e] : act.a === 'any' ? ANY : SKIP;
  return dayReply(bot, act.d, today, bot.store.setRule(act.d, rule, today));
}

/** A day action that can't be done whatever the state: a day that has passed, a range that ends before it starts. */
function dayRefusal(act: DayAction, now: number): Refusal | null {
  if (act.d < dayOf(now)) return { code: 'day_passed', hint: messages.dayPassed(act.d) };
  if (act.a === 'range' && act.e <= act.s) return { code: 'bad_range', hint: messages.BAD_RANGE };
  return null;
}

/** Only check a day from `when` on. Refused for a time that has passed, is after the day, or leaves no slot in the
 *  day's ⏰ window (a 🔕 or 💤 day gets DEFAULT_WINDOW). */
function setCheckFrom(bot: Bot, day: Day, when: number, now: number): Applied | Refusal {
  if (when <= now) return { code: 'from_passed', hint: messages.FROM_PASSED };
  if (dayOf(when) > day) return { code: 'from_after_day', hint: messages.fromAfterDay(day) };
  const rule = bot.store.effectiveRule(day, dayOf(now));
  const window: Rule = rule === SKIP || rule === undefined ? [DEFAULT_WINDOW[0], DEFAULT_WINDOW[1]] : rule;
  // the window's last slot starts a slot's length before its end, and only slots after the ⏳ time count
  const slotMs = Math.min(...PROGRAMS.map((p) => p.minutes)) * 60_000;
  if (Array.isArray(window) && when >= at(day, window[1]) - slotMs) {
    return { code: 'from_after_window', hint: messages.fromAfterWindow(day, window) };
  }
  return dayReply(bot, day, dayOf(now), bot.store.setCheckFrom(day, when, dayOf(now)));
}

function dayReply(bot: Bot, day: Day, today: Day, changed: boolean): Applied {
  const reply = changed ? messages.dayChanged : messages.dayUnchanged;
  return { changed, reply: reply(bot.store, day, today) };
}

async function checkSetting(bot: Bot, changed: boolean, note: string): Promise<Applied> {
  if (!changed) return { changed: false, reply: messages.checkSettings(bot.store) };
  await bot.wake(); // the alarm picks it up right away
  return { changed: true, reply: note };
}

/** 🔎: at most once a minute, shared by everyone (LINE and the app); refused while stopped or while a check runs. */
async function check(bot: Bot, peek: boolean, now: number): Promise<Applied | Refusal> {
  if (bot.store.paused) return { code: 'paused', hint: messages.CHECK_PAUSED };
  if (bot.checking) return { code: 'running', hint: messages.CHECK_RUNNING }; // waiting could outlast the reply token
  const wait = bot.lastManualCheck === null ? 0 : CHECK_COOLDOWN_MS - (now - bot.lastManualCheck);
  if (wait > 0) return { code: 'cooldown', hint: messages.checkCooldown(wait / 1000), retryAfter: Math.ceil(wait / 1000) };
  bot.lastManualCheck = now;
  let found: Slot[];
  let partial = false;
  try {
    found = await bot.runCheck(false, peek);
  } catch (e) {
    if (!(e instanceof CheckFailed)) {
      console.error('manual check failed', e);
      return { code: 'failed', hint: messages.ERROR };
    }
    if (e.allFailed) return { code: 'site_failed', hint: messages.CHECK_FAILED };
    [found, partial] = [e.found, true];
  }
  const lines = messages.openNow(found, partial);
  return { changed: false, reply: lines.join('\n'), lines, slots: found, partial };
}

// --- the app (POST /gym/act) ---

/** A day's setting (its saved rule and ⏳, not the announced times) as a short hash: FNV-1a, base 36. */
export function baseOf(store: Store, day: Day): string {
  const text = JSON.stringify([store.rule(day) ?? null, store.checkFrom(day) ?? null]);
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(36);
}

/** The app's act, start to end: read, the per-day `base` checked (409 `stale`, nothing applied, when any of its days
 *  changed since), applied all or nothing, kept in runtime.changes and saved. One log line per day (and per refusal),
 *  as LINE's taps log theirs, `(by web A)`. The answer carries the config after it. */
export async function webAct(bot: Bot, raw: unknown, by: Member, rid: string): Promise<{ status: number; body: ActAnswer; retryAfter?: number }> {
  const now = Date.now();
  const tag = (a: string, d?: Day) => `act by=${by} a=${a}${d ? ` d=${d}` : ''}`;
  const refuse = async (r: Refusal, a: string, d?: Day, withConfig = false) => {
    console.log(`${tag(a, d)} refused ${r.code} rid=${rid}`);
    const body: ActAnswer = { ok: false, error: r.code, hint: r.hint, ...(withConfig ? { config: await config(bot) } : {}) };
    return { status: ACT_STATUS[r.code], body, ...(r.retryAfter ? { retryAfter: r.retryAfter } : {}) };
  };
  const p = parseAction(raw, now);
  const a = isRec(raw) && typeof raw.a === 'string' && /^[a-z]{1,12}$/.test(raw.a) ? raw.a : '?';
  if (refused(p)) return refuse(p, a);
  const first = p.acts[0].act;
  const stale = p.acts.find((x) => x.base !== undefined && 'd' in x.act && x.base !== baseOf(bot.store, x.act.d));
  if (stale) return refuse({ code: 'stale', hint: messages.STALE }, a, 'd' in stale.act ? stale.act.d : undefined, true);
  // all or nothing: a day's refusal before anything is applied (the bulk form has no ⏳, whose rules need the state)
  for (const { act } of p.acts) {
    const r = 'd' in act ? dayRefusal(act, now) : null;
    if (r) return refuse(r, a, 'd' in act ? act.d : undefined);
  }
  const done: { act: GymAction; before: string; r: Applied }[] = [];
  for (const { act } of p.acts) {
    const day = 'd' in act ? act.d : undefined;
    const before = loggedSetting(bot, day);
    const r = await apply(bot, act, now);
    if (refused(r)) {
      // only a single act refuses here (⏳'s rules and 🔎's need the state; the bulk form has neither, and its days
      // passed the checks above at this same instant), so nothing was applied before it and the save after is harmless
      if (done.length) throw new Error(`act refused mid-apply: ${r.code}`);
      return refuse(r, a, day, r.code === 'cooldown' || r.code === 'running');
    }
    done.push({ act, before, r });
  }
  const changed = done.filter((x) => x.r.changed);
  for (const { act, before } of done) {
    const day = 'd' in act ? act.d : undefined;
    const c = changed.some((x) => x.act === act);
    console.log(`${tag(act.a, day)} changed=${c ? 1 : 0} rid=${rid}`);
    if (c) console.log(`changed ${day ?? 'check settings'}: ${before} -> ${loggedSetting(bot, day)} (by web ${by})`);
  }
  if (changed.length) {
    const fresh = changed.map(({ act }): StoredChange => ({ t: now, by, ...changeOf(act as Exclude<GymAction, { a: 'check' }>), said: false }));
    bot.changes = [...fresh.reverse(), ...bot.changes].slice(0, CHANGES_KEPT);
    await bot.save();
  }
  const reply = done.map((x) => x.r.reply).join('\n');
  const answer: ActAnswer = { ok: true, changed: changed.length > 0, reply, config: await config(bot) };
  if (first.a === 'check') {
    const r = done[0].r;
    Object.assign(answer, { lines: r.lines, partial: r.partial ?? false, slots: openSlots(r.slots ?? []) });
    console.log(`act by=${by} a=check open=${r.slots?.length ?? 0}${r.partial ? ' partial' : ''} rid=${rid}`);
  }
  return { status: 200, body: answer };
}

/** What an action did, for runtime.changes. */
function changeOf(act: Exclude<GymAction, { a: 'check' }>): Omit<StoredChange, 't' | 'by' | 'said'> {
  if (act.a === 'interval') return { a: 'interval', d: null, m: act.m };
  if (act.a === 'pause' || act.a === 'resume') return { a: act.a, d: null };
  if (act.a === 'range') return { a: 'range', d: act.d, s: act.s, e: act.e };
  if (act.a === 'from') return { a: 'from', d: act.d, at: act.at };
  return { a: act.a, d: act.d };
}

/** 🔎's slots for the app: a row per time, every program open then. */
function openSlots(slots: Slot[]): OpenSlot[] {
  const byStart = new Map<number, OpenSlot>();
  for (const s of [...slots].sort((x, y) => x.start - y.start)) {
    const row = byStart.get(s.start) ?? { day: dayOf(s.start), start: clockOf(s.start), end: clockOf(slotEnd(s)), programs: [] };
    if (!row.programs.includes(s.program.key)) row.programs.push(s.program.key);
    byStart.set(s.start, row);
  }
  return [...byStart.values()];
}

/** A day's saved setting (or the check settings), in English for the log. */
export function loggedSetting(bot: Bot, day?: Day): string {
  const store = bot.store;
  if (day === undefined) return `every ${store.intervalMinutes} min, ${store.paused ? 'stopped' : 'running'}`;
  const rule = store.rule(day);
  let text = rule === undefined ? 'default' : typeof rule === 'string' ? rule : `${rule[0]}-${rule[1]}`;
  const checkFrom = store.checkFrom(day);
  if (checkFrom !== undefined) text += `, from ${dayOf(checkFrom).slice(5)} ${clockOf(checkFrom)}`;
  const announced = store.notified().filter((t) => dayOf(t) === day).length;
  if (announced) text += `, ${announced} announced`;
  return text;
}

// --- 📋 and /gym/config ---

/** The app's changes as LINE says them (`11/14（金）🔔 終日（ウェイ）`). */
export const changeText = (bot: Bot, c: StoredChange): string => messages.changeText(c, bot.nameOf(c.by));

/** The changes 📋 names: the last day's, at most 3. */
export const recentChanges = (bot: Bot, now: number): StoredChange[] => bot.changes.filter((c) => c.t > now - 86_400_000).slice(0, 3);

async function statusViewOf(bot: Bot, now: number): Promise<[messages.StatusView, number | null]> {
  const nextCheck = await bot.nextCheck();
  const recent = recentChanges(bot, now).map((c) => changeText(bot, c));
  return [messages.statusView(bot.store, dayOf(now), bot.lastCheck, nextCheck, bot.failures > 0, recent), nextCheck];
}

/** Every day that's checked or has a setting, and how checking goes (📋 設定を見る). */
export async function status(bot: Bot, now = Date.now()): Promise<string[]> {
  return messages.statusLines((await statusViewOf(bot, now))[0]);
}

/** The calendar's rows: today and the next DAYS_SHOWN - 1 days. */
function rowsOf(store: Store, now: number): DayRow[] {
  const today = dayOf(now);
  const usual = defaultDays(today);
  const announced = store.notified();
  return Array.from({ length: DAYS_SHOWN }, (_, i) => {
    const day = addDays(today, i);
    const rule = store.rule(day);
    return {
      day,
      rule: rule === undefined ? null : typeof rule === 'string' ? rule : [rule[0], rule[1]],
      usual: rule === undefined && usual.includes(day),
      from: store.checkFrom(day) ?? null,
      announced: announced.filter((t) => dayOf(t) === day).map(clockOf),
      resettable: store.hasAnything(day),
      base: baseOf(store, day)
    };
  });
}

/** GET /gym/config (members only: index.ts), for the app's ボット → ジム: 📋 設定を見る's answer as its parts (the words
 *  LINE shows, made by the same functions) with `text`, exactly LINE's reply, and the calendar's rows, the 🔎
 *  cooldown and the app's changes (the contract's GymConfig). */
export async function config(bot: Bot): Promise<GymConfig> {
  const now = Date.now();
  const [view, nextCheck] = await statusViewOf(bot, now);
  const { paused, intervalMinutes: intervalMin } = bot.store;
  const ready = bot.lastManualCheck === null ? null : bot.lastManualCheck + CHECK_COOLDOWN_MS;
  const changes: Change[] = bot.changes.map(({ said: _, ...c }) => ({ ...c, who: bot.nameOf(c.by), text: changeText(bot, { ...c, said: false }) }));
  const { recent: _, ...parts } = view;
  return {
    v: 1, now, ...parts, text: messages.statusLines(view).join('\n'), paused, intervalMin, lastCheck: bot.lastCheck, nextCheck,
    rows: rowsOf(bot.store, now), defaultDays: defaultDays(dayOf(now)).length, intervals: INTERVALS,
    checkReadyAt: ready !== null && ready > now ? ready : null, checking: bot.checking, changes
  };
}
