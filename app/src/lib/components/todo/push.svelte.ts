// やること's reminders on this phone (docs/todo.md "Reminders"): its switch 「この端末に通知」 (off by default, per phone:
// DEVICE.todoPush) over the phone's one Web Push subscription (lib/push/phone.ts, shared with 保養所's 通知: turning this
// off keeps the browser's subscription while that is on), handed to the relay (contract/push.ts PUSH_PATHS, any of the
// three keys: the guest too; every route a POST). The relay's push state (POST /api/push: its VAPID key, who has a live subscription: the
// form's 「うめ：端末の通知がオフ」) is read when the sheet opens and kept here (pushState), its POSTs' answers update it.
// A call never throws (lib/keyed.ts: its `keyed.fail`); the browser's failures are phone.ts' `todo.phone`.
import { PUSH_PATHS, type PushEndpointInput, type PushStatus, type PushSubscribeInput, type TodoPushLang } from '#lib/contract/push.ts';
import { isRec } from '#lib/contract/guards.ts';
import { keyed } from '#lib/keyed.ts';
import { pushClient, type PushAnswer } from '#lib/push/phone.ts';
import { getKey } from '#lib/sync/storage.ts';
import { relayUrl } from '#lib/sync/transport.ts';

/** An answer waited for this long at most. */
const ANSWER_MS = 10_000;

/** The relay's push state as last read (null: not yet, or the relay has none). */
export const pushState = $state<{ status: PushStatus | null }>({ status: null });

const statusOf = (x: unknown): PushStatus | null => {
  if (!isRec(x) || !isRec(x.push)) return null;
  const p = x.push, s = isRec(p.subs) ? p.subs : {};
  if (p.vapidPublic !== null && typeof p.vapidPublic !== 'string') return null;
  return { vapidPublic: p.vapidPublic, on: p.on === true, subs: { A: s.A === true, B: s.B === true, G: s.G === true } };
};

type Answer = PushAnswer & { status?: PushStatus };
async function call(path: string, body: PushSubscribeInput | Partial<PushEndpointInput>): Promise<Answer> {
  const r = await keyed(relayUrl(path), getKey(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }, ANSWER_MS);
  const j: unknown = await r.res?.json().catch(() => null);
  if (!r.ok) return { ok: false, http: r.res?.status ?? null, err: isRec(j) && typeof j.error === 'string' ? j.error : r.why };
  const status = statusOf(j);
  if (!status) return { ok: false, http: r.res.status, err: 'bad_reply' };
  pushState.status = status;
  return { ok: true, status };
}

/** The relay can't take a subscription yet (no routes deployed, no VAPID key): 準備中. */
const notReady = (r: PushAnswer) => !r.ok && ((r.http === 404 && r.err !== 'not_subscribed') || r.http === 503 || r.err === 'push_off');

/** The switch (phone.ts pushClient): on, enable (from the tap), disable, refresh, test. */
export const todoPush = pushClient<TodoPushLang>('todo', () => (route, body) => call(PUSH_PATHS[route], body as PushSubscribeInput | PushEndpointInput), notReady);

/** The relay's push state read (POST /api/push, with this phone's endpoint when it's on) into pushState; null when it
 *  can't be read. */
export async function readPushState(): Promise<PushStatus | null> {
  const r = await call(PUSH_PATHS.status, todoPush.endpoint() ? { endpoint: todoPush.endpoint() } : {});
  return r.ok ? (r.status ?? null) : null;
}
