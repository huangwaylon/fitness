// LINE buttons: the menu, day settings and check settings as cards in the group.
// Taps arrive as postback events (data like `a=any&d=2026-10-07`; LINE's date/time pickers add `params`). The data
// format never changes, so cards already in the chat keep working. Days are picked from buttons (`daysCard`), not
// LINE's date picker, so the weekday shows; menu cards from before still send `a=day` with the picked `params.date`.
// Every answer is a reply (free), visible to the whole group; a tap for a day that has passed gets a short hint.
// A change tap is a GymAction applied by actions.apply, the app's path too; app changes not said in the group yet
// ride along on the next reply (`send`).
import * as actions from './actions.ts';
import type { Bot, StoredChange } from './actions.ts';
import { DAYS_SHOWN, INTERVALS, LAST_START } from '../../app/src/lib/gym/contract.ts';
import { CLOSES, DEFAULT_WINDOW, OPENS } from './config.ts';
import { LineError, MAX_MESSAGES, texts } from './line.ts';
import * as messages from './messages.ts';
import { addDays, at, clockFrom, clockOf, dayOf, minutesOf, weekday, type Clock, type Day } from './time.ts';

// LINE's JSON, built and read loosely.
type Json = Record<string, any>;

const MENU_WORDS = new Set(['メニュー', 'めにゅー', 'menu']);
/** Taps about one day. */
const DAY_ACTIONS = new Set(['day', 'start', 'range', 'any', 'skip', 'reset', 'unfrom', 'from']);
const HOUR_MS = 3_600_000;

// --- building blocks ---

/** A button's tap, sent back as `data`. */
export function postback(label: string, data: Record<string, string | number>): Json {
  return { type: 'postback', label, data: query(data) };
}

/** LINE's own date/time picker (`mode` date, time or datetime); the choice comes back in `params`. */
export function picker(label: string, mode: string, data: Record<string, string>, initial: string, low: string,
  high: string): Json {
  return { type: 'datetimepicker', label, data: query(data), mode, initial, min: low, max: high };
}

const query = (data: Record<string, string | number>): string =>
  new URLSearchParams(Object.entries(data).map(([k, v]) => [k, String(v)])).toString();

export function button(action: Json, primary = false): Json {
  return { type: 'button', action, height: 'sm', style: primary ? 'primary' : 'secondary' };
}

/** Text (first line bold) above a column of buttons. */
function bubble(text: string, buttons: Json[]): Json {
  const [first, rest] = splitFirst(text);
  const body: Json[] = [{ type: 'text', text: first, weight: 'bold', wrap: true }];
  if (rest.trim()) body.push({ type: 'text', text: rest.trim(), wrap: true, size: 'sm', margin: 'md' });
  return {
    type: 'bubble',
    body: { type: 'box', layout: 'vertical', contents: body },
    footer: { type: 'box', layout: 'vertical', spacing: 'sm', contents: buttons },
  };
}

/** A message with one bubble; its first line is also the notification text. */
export function card(text: string, buttons: Json[]): Json {
  return { type: 'flex', altText: splitFirst(text)[0], contents: bubble(text, buttons) };
}

/** Bubbles side by side, swiped through (LINE allows 12). */
function carousel(altText: string, bubbles: Json[]): Json {
  return { type: 'flex', altText, contents: { type: 'carousel', contents: bubbles } };
}

const splitFirst = (text: string): [string, string] => {
  const i = text.indexOf('\n');
  return i < 0 ? [text, ''] : [text.slice(0, i), text.slice(i + 1)];
};

/** Round to :00 or :30 (down, or up). */
export function halfHour(clock: Clock, up = false): Clock {
  const m = minutesOf(clock);
  const rounded = up ? Math.ceil(m / 30) * 30 : Math.floor(m / 30) * 30;
  return rounded >= 24 * 60 ? '23:30' : clockFrom(rounded);
}

/** An instant as LINE's datetime picker writes it. */
const minute = (ms: number): string => `${dayOf(ms)}T${clockOf(ms)}`;

// --- screens ---

export function menuCard(bot: Bot): Json {
  return card(messages.panelText(bot.store.paused), [
    button(postback(messages.SET_DAY, { a: 'days' }), true),
    button(postback(messages.SHOW_STATUS, { a: 'status' })),
    button(postback(messages.CHECK_NOW, { a: 'check' })),
    button(postback(messages.CHECK_SETTINGS, { a: 'settings' })),
    button(postback(messages.HELP, { a: 'help' })),
  ]);
}

/** The next DAYS_SHOWN days as buttons with their weekday and setting, one bubble per week (Mon–Sun). Used instead of
 *  LINE's date picker, which can't show weekdays. */
export function daysCard(bot: Bot): Json {
  const today = dayOf(Date.now());
  const weeks: Day[][] = [];
  for (let n = 0; n < DAYS_SHOWN; n++) {
    const d = addDays(today, n);
    if (n === 0 || weekday(d) === 0) weeks.push([]);
    weeks[weeks.length - 1].push(d);
  }
  return carousel(messages.PICK_DAY, weeks.map((week) =>
    bubble(messages.pickDay(week[0], week[week.length - 1]), week.map((d) =>
      button(postback(messages.dayButton(bot.store, d, today), { a: 'day', d }), d === today)))));
}

export function dayCard(bot: Bot, day: Day): Json {
  const now = Date.now();
  const store = bot.store;
  const rule = store.rule(day);
  const checkFrom = store.checkFrom(day);
  const start = Array.isArray(rule) ? rule[0] : DEFAULT_WINDOW[0];
  const buttons = [
    button(postback(messages.ANY_LABEL, { a: 'any', d: day }), true),
    button(postback(messages.SKIP_LABEL, { a: 'skip', d: day })),
    button(picker(messages.RANGE, 'time', { a: 'start', d: day }, start, OPENS, LAST_START)),
  ];
  // ⏳ picker: from now until the day's last slot, starting at the saved time or the next whole hour
  // (Tokyo is a whole number of hours from UTC, so whole hours are the same in both)
  const low = now - (now % 60_000);
  const high = at(day, LAST_START);
  if (low < high) {
    const initial = checkFrom ?? Math.min(now - (now % HOUR_MS) + HOUR_MS, high);
    buttons.push(button(picker(messages.CHECK_FROM, 'datetime', { a: 'from', d: day },
      minute(Math.max(initial, low)), minute(low), minute(high))));
  }
  if (checkFrom !== undefined) buttons.push(button(postback(messages.CLEAR_CHECK_FROM, { a: 'unfrom', d: day })));
  if (store.hasAnything(day)) buttons.push(button(postback(messages.RESET, { a: 'reset', d: day })));
  return card(messages.pickedDay(store, day, dayOf(now)), buttons);
}

/** After ⏰'s start time: pick the end, suggested an hour later. */
export function rangeEndCard(day: Day, start: Clock): Json {
  const close = minutesOf(CLOSES);
  const low = Math.min(minutesOf(start) + 30, close);
  const suggested = Math.min(minutesOf(start) + 60, close);
  return card(messages.pickRangeEnd(day, start), [
    button(picker(messages.RANGE_END, 'time', { a: 'range', d: day, s: start },
      clockFrom(suggested), clockFrom(low), CLOSES), true),
  ]);
}

export function settingsCard(bot: Bot): Json {
  const store = bot.store;
  const buttons = INTERVALS.map((m) => button(
    postback(messages.intervalLabel(m) + (m === store.intervalMinutes ? messages.CURRENT : ''), { a: 'interval', m }),
    m === store.intervalMinutes,
  ));
  buttons.push(button(store.paused ? postback(messages.RESUME, { a: 'resume' }) : postback(messages.PAUSE, { a: 'pause' })));
  return card(messages.checkSettings(store), buttons);
}

// --- events ---

/** The bot was @mentioned, or someone sent just メニュー. Everything else in the group is chat: ignored. */
function wantsMenu(m: unknown): boolean {
  const message = m as Json;
  const mentioned = (message.mention?.mentionees ?? []).some((m: Json) => m.isSelf);
  return mentioned || MENU_WORDS.has(String(message.text ?? '').trim().toLowerCase());
}

/** One webhook event. Only the bot's group is answered; others just log their ID (to set up LINE_GROUP_ID).
 *  Unexpected errors still get a reply, never silence. */
export async function handle(bot: Bot, e: unknown): Promise<void> {
  const event = e as Json;
  const group = event.source?.groupId;
  if (!group || group !== bot.groupId) {
    if (group) console.log(`LINE event from a group that isn't set up: LINE_GROUP_ID=${group}`);
    return;
  }
  const token: string | undefined = event.replyToken;
  try {
    if (event.type === 'join' || (event.type === 'message' && wantsMenu(event.message))) {
      await show(bot, token, menuCard(bot));
    } else if (event.type === 'postback') {
      await onPostback(bot, event, token);
    }
  } catch (e) {
    if (e instanceof LineError) { // the reply itself failed (e.g. the token expired): nothing more to say
      console.warn(`LINE event failed: ${e.message}`);
      return;
    }
    console.error('LINE event failed', e);
    if (!token) return;
    try {
      await bot.line.reply(token, texts(messages.ERROR));
    } catch (e2) {
      console.warn(`could not send the error reply on LINE: ${e2}`);
    }
  }
}

const show = (bot: Bot, token: string | undefined, message: Json): Promise<void> => send(bot, token, [message]);

const say = (bot: Bot, token: string | undefined, text: string | string[], told?: readonly StoredChange[]): Promise<void> =>
  send(bot, token, texts(text), told);

/** Invalid input: say why; the card keeps working. */
const hint = (bot: Bot, token: string | undefined, text: string): Promise<void> => say(bot, token, `🤔 ${text}`);

/** Every reply. The app's changes not said in the group yet ride along as one line (on the last text, or a text of
 *  their own after a card while there's room), then count as said; `told`: the ones the reply names itself (📋's),
 *  the only ones said then. A reply that carried none (full, or failed) leaves them unsaid. */
async function send(bot: Bot, token: string | undefined, out: Json[], told?: readonly StoredChange[]): Promise<void> {
  let said = told ?? [];
  const unsaid = bot.changes.filter((c) => !c.said);
  if (unsaid.length && !told) {
    const line = messages.appChanges([...unsaid].reverse().map((c) => actions.changeText(bot, c)));
    const last = out.at(-1);
    if (last?.type === 'text') {
      out[out.length - 1] = { ...last, text: `${last.text}\n${line}` };
      said = unsaid;
    } else if (out.length < MAX_MESSAGES) {
      out.push({ type: 'text', text: line });
      said = unsaid;
    }
  }
  await bot.line.reply(token!, out);
  for (const c of said) c.said = true;
}

/** A value from a tap, checked against its shape (a bad one is an unexpected error: ERROR). */
function parsed(value: unknown, shape: RegExp): string {
  if (typeof value !== 'string' || !shape.test(value)) throw new Error(`bad postback value: ${value}`);
  return value;
}

const DAY_SHAPE = /^\d{4}-\d{2}-\d{2}$/;
const CLOCK_SHAPE = /^\d{2}:\d{2}$/;
const parseClock = (value: unknown): Clock => parsed(value, CLOCK_SHAPE);

async function onPostback(bot: Bot, event: Json, token: string | undefined): Promise<void> {
  const raw: string = event.postback.data;
  const data = Object.fromEntries(new URLSearchParams(raw));
  const params: Record<string, string> = event.postback.params ?? {};
  const action = data.a;
  const shown = Object.keys(params).length ? ` {${Object.entries(params).map(([k, v]) => `'${k}': '${v}'`).join(', ')}}` : '';
  console.log(`tap from ${event.source.userId ?? '?'}: ${raw}${shown}`);
  const day = DAY_ACTIONS.has(action) ? parsed(params.date || data.d, DAY_SHAPE) : undefined;
  if (day && day < dayOf(Date.now())) return hint(bot, token, messages.dayPassed(day)); // an old card

  if (action === 'menu') {
    await show(bot, token, menuCard(bot));
  } else if (action === 'help') {
    await say(bot, token, messages.HELP_TEXT);
  } else if (action === 'status') {
    const now = Date.now();
    await say(bot, token, await actions.status(bot, now), actions.recentChanges(bot, now));
  } else if (action === 'check') {
    const r = await actions.apply(bot, { a: 'check' });
    await say(bot, token, actions.refused(r) ? r.hint : r.lines!);
  } else if (action === 'settings') {
    await show(bot, token, settingsCard(bot));
  } else if (action === 'days') {
    await show(bot, token, daysCard(bot));
  } else if (action === 'day') {
    await show(bot, token, dayCard(bot, day!));
  } else if (action === 'start') { // LINE's picker allows any minute; slots are on the half hour
    await show(bot, token, rangeEndCard(day!, halfHour(parseClock(params.time), true)));
  } else if (action === 'range') {
    const start = halfHour(parseClock(data.s), true);
    const end = halfHour(parseClock(params.time));
    await change(bot, event, token, { a: 'range', d: day!, s: start, e: end });
  } else if (action === 'any' || action === 'skip' || action === 'reset' || action === 'unfrom') {
    await change(bot, event, token, { a: action, d: day! });
  } else if (action === 'from') {
    const picked = parsed(params.datetime, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    await change(bot, event, token, { a: 'from', d: day!, at: at(picked.slice(0, 10), picked.slice(11, 16)) });
  } else if (action === 'interval' && INTERVALS.map(String).includes(data.m)) {
    await change(bot, event, token, { a: 'interval', m: Number(data.m) });
  } else if (action === 'pause' || action === 'resume') {
    await change(bot, event, token, { a: action });
  } else {
    console.warn(`unknown LINE postback: ${raw}`);
    await hint(bot, token, messages.OUTDATED);
  }
}

/** Apply a settings change (actions.apply: the app's path too), save it, and say so in the group with who made it.
 *  The setting before and after is logged, to answer "my setting wasn't saved" later. */
async function change(bot: Bot, event: Json, token: string | undefined, act: actions.GymAction): Promise<void> {
  const day = 'd' in act ? act.d : undefined;
  const before = actions.loggedSetting(bot, day);
  const r = await actions.apply(bot, act);
  if (actions.refused(r)) {
    if (r.code.startsWith('from_')) console.log(`refused (invalid time) for ${day}`);
    return hint(bot, token, r.hint);
  }
  if (!r.changed) {
    console.log(`no change for ${day ?? 'check settings'}: ${before}`);
    return say(bot, token, r.reply);
  }
  await bot.save();
  const user: string = event.source.userId ?? '';
  const name = await bot.line.memberName(bot.groupId, user);
  console.log(`changed ${day ?? 'check settings'}: ${before} -> ${actions.loggedSetting(bot, day)} (by ${user || '?'} ${name || '(no name)'})`);
  await say(bot, token, messages.changedBy(r.reply, name));
}
