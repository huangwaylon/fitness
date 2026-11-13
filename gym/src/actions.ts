// What the LINE buttons do, apart from drawing cards. Each returns the reply text; settings changes return
// [reply text, whether anything changed]. Also the bot interface they and the cards (ui.ts) need.
import { DEFAULT_WINDOW } from './config.ts';
import { CheckFailed, PROGRAMS, type Slot } from './hacomono.ts';
import type { Line } from './line.ts';
import * as messages from './messages.ts';
import { SKIP, type Rule, type Store } from './store.ts';
import { at, dayOf, type Day } from './time.ts';

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
  /** Check now; throws CheckFailed. */
  runCheck(alert: boolean): Promise<Slot[]>;
  /** Write the state if it changed. */
  save(): Promise<void>;
  /** The check settings changed: reschedule. */
  wake(): Promise<void>;
}

/** A ⏳ time that can't be used: the message is the hint for the user. */
export class Refused extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'Refused';
  }
}

export const MANUAL_CHECK_COOLDOWN_MS = 60_000;

/** GET /gym/config (members only: index.ts), for the app's 設定 → ジムボット: 📋 設定を見る's answer as its parts
 *  (messages.StatusView: the words LINE shows, made by the same functions) with the facts behind the closing line,
 *  and `text`, exactly LINE's reply. The app's lib/gym/config.ts mirrors it (change both together). */
export interface GymConfig extends messages.StatusView {
  v: 1;
  now: number;
  paused: boolean;
  intervalMin: number;
  lastCheck: number | null;
  nextCheck: number | null;
  text: string;
}

async function statusViewOf(bot: Bot, now: number): Promise<[messages.StatusView, number | null]> {
  const nextCheck = await bot.nextCheck();
  return [messages.statusView(bot.store, dayOf(now), bot.lastCheck, nextCheck, bot.failures > 0), nextCheck];
}

/** Every day that's checked or has a setting, and how checking goes (📋 設定を見る). */
export async function status(bot: Bot): Promise<string[]> {
  return messages.statusLines((await statusViewOf(bot, Date.now()))[0]);
}

/** 📋's answer for the app (GymConfig). */
export async function config(bot: Bot): Promise<GymConfig> {
  const now = Date.now();
  const [view, nextCheck] = await statusViewOf(bot, now);
  const { paused, intervalMinutes: intervalMin } = bot.store;
  return { v: 1, now, ...view, paused, intervalMin, lastCheck: bot.lastCheck, nextCheck, text: messages.statusLines(view).join('\n') };
}

/** Check now (at most once a minute, shared by everyone) and list everything open. */
export async function manualCheck(bot: Bot): Promise<string[]> {
  const now = Date.now();
  if (bot.store.paused) return [messages.CHECK_PAUSED];
  if (bot.checking) return [messages.CHECK_RUNNING]; // waiting for it, then checking again, could outlast the reply token
  const wait = bot.lastManualCheck === null ? 0 : MANUAL_CHECK_COOLDOWN_MS - (now - bot.lastManualCheck);
  if (wait > 0) return [messages.checkCooldown(wait / 1000)];
  bot.lastManualCheck = now;
  let found: Slot[];
  let partial = false;
  try {
    found = await bot.runCheck(false);
  } catch (e) {
    if (!(e instanceof CheckFailed)) {
      console.error('manual check failed', e);
      return [messages.ERROR];
    }
    if (e.allFailed) return [messages.CHECK_FAILED];
    [found, partial] = [e.found, true];
  }
  return messages.openNow(found, partial);
}

/** Set a day's rule. */
export function setDay(bot: Bot, day: Day, rule: Rule): [string, boolean] {
  const today = dayOf(Date.now());
  return dayReply(bot, day, today, bot.store.setRule(day, rule, today));
}

/** Clear a day's rule, ⏳ time and announced times, so it behaves like any unset day. */
export function resetDay(bot: Bot, day: Day): [string, boolean] {
  const today = dayOf(Date.now());
  if (!bot.store.reset(day)) return dayReply(bot, day, today, false);
  return [messages.dayReset(bot.store, day, today), true];
}

/** Only check a day from `when` on (null = right away). Throws Refused for a time that has passed, is after the day,
 *  or leaves no slot in the day's ⏰ window (a 🔕 or 💤 day gets DEFAULT_WINDOW). */
export function setCheckFrom(bot: Bot, day: Day, when: number | null): [string, boolean] {
  const now = Date.now();
  if (when !== null && when <= now) throw new Refused(messages.FROM_PASSED);
  if (when !== null && dayOf(when) > day) throw new Refused(messages.fromAfterDay(day));
  if (when !== null) {
    const rule = bot.store.effectiveRule(day, dayOf(now));
    const window: Rule = rule === SKIP || rule === undefined ? [DEFAULT_WINDOW[0], DEFAULT_WINDOW[1]] : rule;
    // the window's last slot starts a slot's length before its end, and only slots after the ⏳ time count
    const slotMs = Math.min(...PROGRAMS.map((p) => p.minutes)) * 60_000;
    if (Array.isArray(window) && when >= at(day, window[1]) - slotMs) {
      throw new Refused(messages.fromAfterWindow(day, window));
    }
  }
  return dayReply(bot, day, dayOf(now), bot.store.setCheckFrom(day, when, dayOf(now)));
}

function dayReply(bot: Bot, day: Day, today: Day, changed: boolean): [string, boolean] {
  const reply = changed ? messages.dayChanged : messages.dayUnchanged;
  return [reply(bot.store, day, today), changed];
}

/** Check every `minutes`, counted from the last check. */
export async function setInterval(bot: Bot, minutes: number): Promise<[string, boolean]> {
  return checkSettingReply(bot, bot.store.setInterval(minutes), messages.intervalNote(minutes));
}

/** Stop (or restart) automatic checks. */
export async function setPaused(bot: Bot, paused: boolean): Promise<[string, boolean]> {
  return checkSettingReply(bot, bot.store.setPaused(paused), paused ? messages.PAUSED_NOTE : messages.RESUMED_NOTE);
}

async function checkSettingReply(bot: Bot, changed: boolean, note: string): Promise<[string, boolean]> {
  if (!changed) return [messages.checkSettings(bot.store), false];
  await bot.wake(); // the alarm picks it up right away
  return [note, true];
}
