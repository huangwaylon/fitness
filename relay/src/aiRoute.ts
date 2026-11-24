// The Workers AI routes' shared opening (`/stt` sttRoute.ts, `/grade` gradeRoute.ts): CORS and the method (auth.ts
// corsRoute), the off switch or no binding (503), any of the three keys (else 401), then the route's body
// with a `done` that answers and logs the route's one event. Only a person's calls are logged (a stranger's flood
// never spends the log's requests); a refusal by the cap is level 1, any other failure 2.
import { bearerOf, corsRoute } from './auth.ts';
import type { RelayEvent } from './log.ts';
import type { Who } from '../../app/src/lib/contract/api.ts';

export interface AiEnv<A> {
  allowed: string;
  off: boolean;
  /** The key's owner (auth.ts keyOwner), or null. */
  roleOf(key: string): Who | null;
  /** One of the role's calls today (log.ts spend), or false when spent. */
  spend(role: Who): Promise<boolean>;
  ai: A | undefined;
  log(evs: RelayEvent[]): void;
  now(): number;
}

type AiErr = 'off' | 'too_large' | 'bad_request' | 'capped' | 'ai';

export interface AiCall<A> {
  ai: A;
  role: Who;
  /** The answer (`body`, else `{ok: false, error}`), its status, and the route's log event with `d` and the time. */
  done(status: number, d: Record<string, unknown>, err?: AiErr, body?: object): Response;
  /** A bare 204, unlogged (/stt's warm-up: an empty body). */
  warm(): Response;
}

export async function aiRoute<A>(req: Request, env: AiEnv<A>, event: 'stt' | 'grade', body: (c: AiCall<A>) => Promise<Response>): Promise<Response> {
  const headers = corsRoute(req, env.allowed, 'Authorization, Content-Type');
  if (headers instanceof Response) return headers;
  const json = (o: object, status: number) => new Response(JSON.stringify(o), { status, headers: { ...headers, 'Content-Type': 'application/json' } });
  const ai = env.ai;
  if (env.off || !ai) return json({ ok: false, error: 'off' }, 503);
  const role = env.roleOf(bearerOf(req));
  if (!role) return json({ ok: false, error: 'unauthorized' }, 401);
  const t0 = env.now();
  return body({
    ai,
    role,
    done: (status, d, err, out = { ok: false, error: err }) => {
      env.log([{ e: event, l: err && err !== 'capped' ? 2 : 1, role, d: { ms: env.now() - t0, ...d, ok: !err, ...(err ? { err } : {}) } }]);
      return json(out, status);
    },
    warm: () => new Response(null, { status: 204, headers })
  });
}
