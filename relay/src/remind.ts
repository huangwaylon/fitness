// やること's reminders, the pure part (docs/todo.md "Reminders"): which items have one and when it fires (contract/
// todoDue.ts fireAt), the message in each language, a failed push's next try. The sending, the subscriptions and the
// ledger are pusher.ts's; the alarm is the record's object's (storeObject.ts). Tokyo times throughout.
import type { Who } from '../../app/src/lib/contract/api.ts';
import type { TodoListView } from '../../app/src/lib/contract/todo.ts';
import { dayOf, dueOf, fireAt, LATE_MS, type Rem } from '../../app/src/lib/contract/todoDue.ts';
import { clockAt, localDateAt } from '../../app/src/lib/contract/tokyo.ts';
import type { TodoPushLang, TodoPushPayload } from '../../app/src/lib/contract/push.ts';

/** One standing, not-done item's reminder. */
export interface Reminder {
  id: string;
  list: string;
  listTitle: string;
  text: string;
  due: string;
  rem: Rem;
  to: Who[];
  fire: number;
}

/** Every reminder an item not done holds now (a list's removal took its items: todoLists hides them). */
export function remindersOf(lists: TodoListView[]): Reminder[] {
  const out: Reminder[] = [];
  for (const l of lists) for (const it of l.items) {
    if (it.done || !it.due || !it.rem || !it.to) continue;
    const fire = fireAt(it.due, it.rem);
    if (fire !== null) out.push({ id: it.id, list: l.id, listTitle: l.title, text: it.text, due: it.due, rem: it.rem, to: it.to, fire });
  }
  return out;
}

/** Whether a reminder is still to send at `now`: not more than LATE_MS past its minute. */
export const inWindow = (fire: number, now: number): boolean => now - fire <= LATE_MS;

/** A push's next try after its `tries`th failure (30 s, doubling), or null: it would be past LATE_MS late. */
export function retryAt(fire: number, tries: number, now: number): number | null {
  const next = now + 30_000 * 2 ** Math.max(0, tries - 1);
  return inWindow(fire, next) ? next : null;
}

const WD_JA = ['日', '月', '火', '水', '木', '金', '土'];
const WD_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** `9:30` (the app's clock: no leading zero on the hour). */
const hm = (t: string): string => t.replace(/^0(\d)/, '$1');

/** When the item is due, from the reminder's minute: 「今日 15:00」 · 「明日」 · 「明日 9:30」 · 「11/24（月）」 ·
 *  「15:00（10分後）」 (b10/b60 on the same day). */
export function whenOf(due: string, rem: Rem, fire: number, lang: TodoPushLang): string {
  const d = dueOf(due)!;
  const day = dayOf(due, localDateAt(fire));
  const dt = new Date(`${d.date}T00:00:00Z`);
  const ja = lang === 'ja';
  const label = day === 'today' ? (ja ? '今日' : 'Today') : day === 'tomorrow' ? (ja ? '明日' : 'Tomorrow')
    : ja ? `${dt.getUTCMonth() + 1}/${dt.getUTCDate()}（${WD_JA[dt.getUTCDay()]}）` : `${WD_EN[dt.getUTCDay()]} ${dt.getUTCDate()} ${MON_EN[dt.getUTCMonth()]}`;
  if (d.time === null) return label;
  const t = hm(d.time);
  if ((rem === 'b10' || rem === 'b60') && day === 'today') {
    return ja ? `${t}（${rem === 'b10' ? '10分後' : '1時間後'}）` : `${t} (in ${rem === 'b10' ? '10 min' : '1 h'})`;
  }
  return `${label} ${t}`;
}

const TITLE_MAX = 80;
const cut = (s: string, n: number): string => ([...s].length > n ? `${[...s].slice(0, n - 1).join('')}…` : s);

/** The decrypted message for one reminder, in the subscription's language (never logged). */
export function payloadOf(r: Reminder, lang: TodoPushLang): TodoPushPayload {
  return {
    v: 1, kind: 'todo', title: cut(r.text, TITLE_MAX), body: `${whenOf(r.due, r.rem, r.fire, lang)} · ${r.listTitle}`, tag: r.id,
    open: { to: 'todo', list: r.list, item: r.id }
  };
}

/** The test notification's message. */
export function testPayloadOf(lang: TodoPushLang, now: number): TodoPushPayload {
  return lang === 'ja'
    ? { v: 1, kind: 'test', title: 'テスト通知', body: `やることの通知はこの端末に届きます（${clockAt(now)}）`, tag: 'todo-test', open: { to: 'todo' } }
    : { v: 1, kind: 'test', title: 'Test notification', body: `To-do reminders reach this device (${clockAt(now)})`, tag: 'todo-test', open: { to: 'todo' } };
}
