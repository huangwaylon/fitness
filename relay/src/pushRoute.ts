// やること's push routes (docs/todo.md "Reminders", contract/push.ts): `POST /api/push` (the state), `/api/push/subscribe`,
// `/api/push/unsubscribe`, `/api/push/test`. Any of the three keys (Bearer: the guest's phone opts in too), CORS for
// our origins, a JSON body of at most PUSH_BODY_MAX bytes; the work is the record's object's (pusher.ts), whose answer
// is the reply: `{ok: true, push}` or `{ok: false, error}` with its status. Free of the Workers runtime
// (test/push.test.ts).
import { bearerOf, corsRoute } from './auth.ts';
import { jsonCapped } from './body.ts';
import { errName } from './log.ts';
import type { Who } from '../../app/src/lib/contract/api.ts';
import { PUSH_PATHS } from '../../app/src/lib/contract/push.ts';
import { isRec } from '../../app/src/lib/contract/guards.ts';
import type { PushAnswer } from './pusher.ts';

const PUSH_BODY_MAX = 4_096;
export type PushOp = 'state' | 'subscribe' | 'unsubscribe' | 'test';
const OPS: Record<string, PushOp> = { [PUSH_PATHS.status]: 'state', [PUSH_PATHS.subscribe]: 'subscribe', [PUSH_PATHS.unsubscribe]: 'unsubscribe', [PUSH_PATHS.test]: 'test' };

/** Whether a path is one of the push routes. */
export const isPushPath = (p: string): boolean => p in OPS;

export interface PushRouteEnv {
  allowed: string;
  roleOf(key: string): Who | null;
  /** The record's object's push op (storeObject.ts pushOp). */
  op(op: PushOp, who: Who, body: Record<string, unknown>): Promise<PushAnswer>;
}

export async function pushRoute(req: Request, path: string, env: PushRouteEnv): Promise<Response> {
  const headers = corsRoute(req, env.allowed, 'Authorization, Content-Type');
  if (headers instanceof Response) return headers;
  const json = (o: object, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...headers, 'Content-Type': 'application/json' } });
  const who = env.roleOf(bearerOf(req));
  if (!who) return json({ ok: false, error: 'unauthorized' }, 401);
  const b = await jsonCapped(req, PUSH_BODY_MAX);
  if (!b.ok) return b.why === 'too_large' ? json({ ok: false, error: 'too_large' }, 413) : json({ ok: false, error: 'bad_request' }, 400);
  if (!isRec(b.json)) return json({ ok: false, error: 'bad_request' }, 400);
  try {
    const r = await env.op(OPS[path], who, b.json);
    return r.ok ? json(r) : json({ ok: false, error: r.error }, r.status);
  } catch (e) {
    console.error('push', errName(e));
    return json({ ok: false, error: 'unavailable' }, 503);
  }
}
