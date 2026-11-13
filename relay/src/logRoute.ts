// The log's HTTP side and the relay's sink (docs/ops/observability.md), free of the Workers runtime so it is
// unit-testable:
// - `POST /log`: a phone's batch (contract/log.ts LogBatch, text/plain JSON: a simple request, sent with `keepalive`).
//   The key is checked here, before any request to the object (a stranger's flood never spends the account's Durable
//   Object requests), and a role whose day is capped is answered here until midnight UTC. `LOG_OFF=1`: acknowledged,
//   nothing kept (the off switch).
// - `GET /health/log`: the log's health for the alert (log.ts stats), only with `Authorization: Bearer <HEALTH_TOKEN>`
//   (a secret the health workflow holds: it reads counts, nothing else).
// - `relaySink`: the relay's own events to the object, best effort, never in a reply's path; once the relay's day is
//   capped it stops sending until midnight (per isolate).
import { bearerOf, corsOf, preflight, tokenOk } from './auth.ts';
import { LOG_BODY_MAX } from '../../app/src/lib/contract/log.ts';
import { errName, type RelayEvent } from './log.ts';
import type { Who } from '../../app/src/lib/contract/api.ts';

export interface LogRoom {
  ingest(text: string): Promise<Record<string, unknown>> | Record<string, unknown>;
  add(evs: RelayEvent[]): Promise<{ ok: true; kept: number; closed?: number }> | { ok: true; kept: number; closed?: number };
  stats(): Promise<Record<string, unknown>> | Record<string, unknown>;
}

export interface LogEnv {
  allowed: string;
  off: boolean;
  /** The key's owner (auth.ts keyOwner), or null. */
  roleOf(key: unknown): Who | null;
  now(): number;
}

/** Per isolate: when each role's (and the relay's) capped day ends. */
const closed = new Map<string, number>();
/** Tests: forget the caps learnt. */
export const resetLogRoute = (): void => closed.clear();

const MAX_CHARS = LOG_BODY_MAX * 2;

export async function logRoute(req: Request, env: LogEnv, log: () => LogRoom): Promise<Response> {
  const cors = corsOf(req.headers.get('Origin'), env.allowed);
  if (!cors) return new Response('forbidden', { status: 403 });
  const headers = { ...cors, 'Cache-Control': 'no-store' };
  const json = (o: object) => new Response(JSON.stringify(o), { headers: { ...headers, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return preflight(headers, 'POST', 'Content-Type');
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405, headers: { ...headers, Allow: 'POST' } });
  if (Number(req.headers.get('Content-Length') ?? 0) > MAX_CHARS * 4) return json({ ok: false, error: 'too_large' });
  const text = await req.text();
  if (text.length > MAX_CHARS) return json({ ok: false, error: 'too_large' });
  if (env.off) return json({ ok: true, off: true });
  let body: { key?: unknown; es?: unknown } | null;
  try {
    body = JSON.parse(text) as { key?: unknown; es?: unknown } | null;
  } catch {
    return json({ ok: false, error: 'bad_request' });
  }
  const role = env.roleOf(body?.key);
  if (!role) return json({ ok: false, error: 'unauthorized' });
  // a capped day: only a batch with an error goes on (errors have their own cap)
  const until = closed.get(role) ?? 0;
  const errors = Array.isArray(body?.es) && body.es.some((e) => (e as { l?: unknown } | null)?.l === 3);
  if (until > env.now() && !errors) return json({ ok: true, kept: 0, closed: until });
  try {
    const r = await log().ingest(text);
    if (typeof r.closed === 'number') closed.set(role, r.closed);
    return json(r);
  } catch (e) {
    console.error('log', errName(e));
    return json({ ok: false, error: 'unavailable' });
  }
}

/** `GET /health/log` with the health token: the log's counts (log.ts stats); without it, 404 (as if there were none). */
export async function logHealthRoute(req: Request, token: string | undefined, log: () => LogRoom): Promise<Response> {
  // (a short secret is none: under 32 characters it could be guessed)
  if ((token?.trim().length ?? 0) < 32 || !(await tokenOk(bearerOf(req), token))) return new Response('not found', { status: 404 });
  try {
    return Response.json(await log().stats(), { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return Response.json({ ok: false, error: 'unavailable', name: errName(e) }, { status: 503 });
  }
}

/** The relay's events to the log, in the background (`waitUntil`); once its day is capped, only errors. */
export function relaySink(log: () => LogRoom, waitUntil: (p: Promise<unknown>) => void, now: () => number): (evs: RelayEvent[]) => void {
  return (all) => {
    // a capped day still takes errors (their own cap, the object's)
    const evs = (closed.get('relay') ?? 0) > now() ? all.filter((e) => e.l === 3) : all;
    if (!evs.length) return;
    waitUntil(
      Promise.resolve()
        .then(() => log().add(evs))
        .then((r) => void (typeof r.closed === 'number' && closed.set('relay', r.closed)), (e) => console.warn('log', errName(e)))
    );
  };
}
