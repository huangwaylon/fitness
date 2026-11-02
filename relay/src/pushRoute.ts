// The /push/* endpoints (docs/backend.md#notifications), free of the Workers runtime so they are unit-testable: the
// page origin, the size, the body's shape and the person key are checked here; the room (the Durable Object, which
// keeps the subscriptions) does the rest. A text/plain JSON POST with the key in the body: a simple request, so no
// preflight, and no key in a URL or a header a log might keep.
import type { Member as Who } from '../../app/src/lib/sync/live-protocol.ts';
import { PUSH_MAX_BYTES, PUSH_PATHS, parseGoal, parseSubscribe, parseUnsubscribe, type GoalOutcome, type GoalReq, type PushLang, type PushSub } from '../../app/src/lib/sync/push-protocol.ts';
import { keyOwner, originAllowed, type Keys } from './auth.ts';

/** What the room does for the endpoints (the Durable Object's RPC methods). */
export interface PushRoom {
  pushSubscribe(who: Who, sub: PushSub, lang: PushLang): Promise<void> | void;
  pushUnsubscribe(who: Who, endpoint: string): Promise<void> | void;
  pushGoal(who: Who, r: Omit<GoalReq, 'key'>): Promise<{ outcome: GoalOutcome; sent: number }>;
}

export const isPushPath = (path: string): boolean => (Object.values(PUSH_PATHS) as string[]).includes(path);

/** Handle a request to one of PUSH_PATHS. */
export async function pushRoute(req: Request, path: string, keys: Keys, allowed: string, room: () => PushRoom): Promise<Response> {
  const origin = req.headers.get('Origin');
  if (!originAllowed(origin, allowed)) return new Response('forbidden', { status: 403 });
  const cors = { 'Access-Control-Allow-Origin': origin!, Vary: 'Origin', 'Cache-Control': 'no-store' };
  const reply = (status: number, body?: object) =>
    body ? Response.json(body, { status, headers: cors }) : new Response(null, { status, headers: cors });
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { ...cors, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' } });
  }
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405, headers: { ...cors, Allow: 'POST' } });
  if (Number(req.headers.get('Content-Length') ?? 0) > PUSH_MAX_BYTES) return reply(413, { ok: false, error: 'too_large' });
  const raw = await req.text();
  if (raw.length > PUSH_MAX_BYTES) return reply(413, { ok: false, error: 'too_large' });
  const parsed = path === PUSH_PATHS.subscribe ? parseSubscribe(raw) : path === PUSH_PATHS.unsubscribe ? parseUnsubscribe(raw) : parseGoal(raw);
  if (!parsed) return reply(400, { ok: false, error: 'bad_request' });
  const who = keyOwner(parsed.key, keys);
  if (!who) return reply(401, { ok: false, error: 'unauthorized' });
  // the guest gets no notifications and reports no goals (docs/backend.md#the-guest)
  if (who === 'G') return reply(403, { ok: false, error: 'forbidden' });
  const r = room();
  if ('sub' in parsed) {
    await r.pushSubscribe(who, parsed.sub, parsed.lang);
    return reply(200, { ok: true });
  }
  if ('endpoint' in parsed) {
    await r.pushUnsubscribe(who, parsed.endpoint);
    return reply(200, { ok: true });
  }
  const { key: _key, ...goal } = parsed;
  return reply(200, { ok: true, ...(await r.pushGoal(who, goal)) });
}
