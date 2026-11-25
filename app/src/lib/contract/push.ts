// やること's reminders by Web Push (docs/todo.md "Reminders", docs/backend.md "Push"): the relay's routes, their bodies
// and replies, and the message a phone's service worker receives. The relay signs with the same VAPID pair as its-bot
// (one subscription per phone serves both: its/README.md "Keys"). Every route takes any of the three keys (Bearer:
// members and the guest), all POST with a JSON body, CORS for our origins. Pure types and constants.
import type { Who } from '../types.ts';

export const PUSH_PATHS = { status: '/api/push', subscribe: '/api/push/subscribe', unsubscribe: '/api/push/unsubscribe', test: '/api/push/test' } as const;

export type TodoPushLang = 'ja' | 'en';

/** Who has at least one live subscription (subscribed or refreshed within the last 30 days, not refused by its push
 *  service): the form's 「うめ：この端末は通知オフ」. Never an endpoint or its hash. */
export type PushPresence = Record<Who, boolean>;

/** The push state as each route answers it: the VAPID public key (the applicationServerKey: an uncompressed P-256
 *  point, base64url; null: push is off on the relay), whether the endpoint sent is the caller's live subscription
 *  (`on`; false without one), and the presence. */
export interface PushStatus { vapidPublic: string | null; on: boolean; subs: PushPresence }

/** `POST /api/push/subscribe`: the PushSubscription's `toJSON()` endpoint and keys, and the language its reminders are
 *  written in. Stored (or refreshed: the app does it weekly) for the caller; an endpoint another person had moves to
 *  the caller; at most 5 per person (a sixth replaces the least recently refreshed). Refused: 400 bad_push_endpoint
 *  (not https on Apple's or FCM's push host, a port, userinfo, past 512 characters), bad_push_keys, bad_push_lang;
 *  503 push_off. */
export interface PushSubscribeInput { endpoint: string; keys: { p256dh: string; auth: string }; lang: TodoPushLang }
/** `POST /api/push/unsubscribe` (forgotten if it is the caller's: ok either way) and `POST /api/push/test` (a test
 *  notification to it now, if it is the caller's: else 404 not_subscribed; 429 rate_limited within 5 s; 502
 *  push_failed when its push service refused it, `gone` dropped it). */
export interface PushEndpointInput { endpoint: string }

/** `POST /api/push` (the state; body `{endpoint?}`: `on` for it) and every route's 200. A refusal is `{ok: false,
 *  error}` with its status (400 bad_request / a code above, 401 unauthorized, 404, 405, 413 too_large, 429, 502, 503
 *  push_off / unavailable). */
export interface PushReply { ok: true; push: PushStatus }

/** The decrypted message (JSON). Title and body are written by the relay in the subscription's language: title the
 *  item's text, body `{when}` (e.g. 「明日 9:30」); `tag` the item's id (a re-fire after an edit replaces the shown
 *  one; `todo-test` for a test); `open` where a tap goes (やること, the item flashed). */
export interface TodoPushPayload {
  v: 1;
  kind: 'todo' | 'test';
  title: string;
  body: string;
  tag: string;
  open: { to: 'todo'; item?: string };
}
