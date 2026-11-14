// The ITS booker's Worker (README.md): the page's routes (a member's key, CORS for the app's origin; /its/push/* too), the runner's
// (ITS_RUNNER_TOKEN), /health and /health/its (ITS_HEALTH_TOKEN: codes only, for alerting); the cron's watchdog
// (wrangler.toml [triggers], the object's watch). Bodies are capped and checked
// here (the contract's parseSettingsInput, validate.ts); the record and its rules are the object's (bot.ts), one RPC per
// request. Every refusal logs one line with its reason (never a key or a token); a page's request carries its
// X-Request-Id (or one made up) in its lines and its answer.
import { bearerOf, corsOf, preflight, roleOfKey, tokenOk } from '../../../relay/src/auth.ts';
import { LIMITS, PUSH_ROUTES, isId, parseSettingsInput, type Member } from '../../../app/src/lib/its/contract.ts';
import { isRec } from '../../../app/src/lib/contract/guards.ts';
import type { PushAnswer } from './bot.ts';
import type { Env } from './env.ts';
import { parseBookings, parseClaim, parsePushEndpoint, parsePushSubscribe, parseReport, parseRunInput } from './validate.ts';

export { ItsBot } from './bot.ts';

const bot = (env: Env) => env.BOT.get(env.BOT.idFromName('its'));

/** The page's routes and their one method each. */
const MEMBER_ROUTES: Record<string, string> = {
  '/its/status': 'GET', '/its/settings': 'PUT', '/its/run': 'POST',
  [PUSH_ROUTES.subscribe]: 'POST', [PUSH_ROUTES.unsubscribe]: 'POST', [PUSH_ROUTES.test]: 'POST',
};
const RUNNER_ROUTES: Record<string, string> = { '/runner/config': 'GET', '/runner/claim': 'POST', '/runner/report': 'POST', '/runner/bookings': 'POST' };

class Refused extends Error {
  constructor(readonly status: number, readonly why: string) {
    super(why);
  }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(req.url);
    try {
      if (pathname === '/health') return Response.json({ ok: true, mode: env.MODE, sha: env.COMMIT ?? null });
      if (pathname === '/health/its') return await health(req, env, pathname);
      if (pathname in MEMBER_ROUTES) return await member(req, env, pathname);
      if (pathname in RUNNER_ROUTES) return await runner(req, env, pathname);
      return new Response('not found', { status: 404 });
    } catch (e) {
      console.error(`its request failed method=${req.method} path=${pathname} err=${errName(e)}`, e);
      return Response.json({ ok: false, error: 'internal' }, { status: 500 });
    }
  },

  /** Every 5 min: the watchdog (bot.ts watch). A throw is logged; the next tick tries again. */
  async scheduled(_c: ScheduledController, env: Env): Promise<void> {
    try {
      await bot(env).watch();
    } catch (e) {
      console.error(`its watchdog failed err=${errName(e)}`, e);
    }
  }
} satisfies ExportedHandler<Env>;

/** An exception's name for a log line (`err=`): never its message (it may quote a body). */
const errName = (e: unknown): string => (e instanceof Error ? e.name : 'error');

/** One line per refusal: the status, the reason, the route; the origin when it was the cause, the run on the runner's. */
function refuse(req: Request, path: string, status: number, why: string, headers: Record<string, string> = {}, extra = ''): Response {
  console.warn(`its refused status=${status} why=${why} method=${req.method} path=${path}${extra}`);
  return Response.json({ ok: false, error: why }, { status, headers: { ...headers, 'Cache-Control': 'no-store' } });
}

/** The body as JSON, at most LIMITS.body bytes: refused by its Content-Length, or (without one, or a lying one) as soon
 *  as the stream passes the bound, never read whole first. */
async function body(req: Request): Promise<unknown> {
  if (Number(req.headers.get('Content-Length') ?? 0) > LIMITS.body) throw new Refused(413, 'too_large');
  const chunks: Uint8Array[] = [];
  let n = 0;
  const reader = req.body?.getReader();
  for (let r = await reader?.read(); r && !r.done; r = await reader!.read()) {
    n += r.value.byteLength;
    if (n > LIMITS.body) {
      await reader!.cancel();
      throw new Refused(413, 'too_large');
    }
    chunks.push(r.value);
  }
  const buf = new Uint8Array(n);
  chunks.reduce((at, c) => (buf.set(c, at), at + c.byteLength), 0);
  try {
    return JSON.parse(new TextDecoder().decode(buf));
  } catch {
    throw new Refused(400, 'not_json');
  }
}

/** The page's request id: its X-Request-Id when shaped as an id (the contract's isId), else one made up (`w-` and 8 hex),
 *  never the header as sent. */
const requestId = (req: Request): string => {
  const sent = req.headers.get('X-Request-Id');
  return isId(sent) ? sent : `w-${crypto.randomUUID().slice(0, 8)}`;
};

/** The page's routes: a member's key (KEY_A, KEY_B: the guest's is never set here, so it's refused like any other). */
async function member(req: Request, env: Env, path: string): Promise<Response> {
  const origin = req.headers.get('Origin');
  const rid = requestId(req);
  const cors = corsOf(origin, env.ALLOWED_ORIGINS ?? '');
  if (!cors) return refuse(req, path, 403, 'origin', { 'X-Request-Id': rid }, ` origin=${JSON.stringify((origin ?? '').slice(0, 100))} rid=${rid}`);
  const method = MEMBER_ROUTES[path];
  if (req.method === 'OPTIONS') {
    return preflight(cors, method, 'Authorization, Content-Type, X-Request-Id');
  }
  const base = { ...cors, 'Access-Control-Expose-Headers': 'X-Request-Id', 'X-Request-Id': rid };
  if (req.method !== method) return refuse(req, path, 405, 'method', { ...base, Allow: method }, ` rid=${rid}`);
  const who = roleOfKey(bearerOf(req), { KEY_A: env.KEY_A, KEY_B: env.KEY_B });
  if (who !== 'A' && who !== 'B') return refuse(req, path, 401, 'unauthorized', base, ` rid=${rid}`);
  const by: Member = who;
  const headers = { ...base, 'Cache-Control': 'private, no-store' };
  const ok = (x: unknown, status = 200) => Response.json(x, { status, headers });
  try {
    if (path === '/its/status') {
      const s = await bot(env).status();
      // the page polls: debug, not info (Workers Logs keeps it, filterable by level)
      console.debug(`its status by=${by} verdict=${s.verdict} reasons=${s.reasons.join(',') || '-'} rid=${rid}`);
      return ok(s);
    }
    const json = await body(req);
    if (path === '/its/settings') {
      const p = parseSettingsInput(json, Date.now());
      if (!p.ok) return refuse(req, path, 400, p.error, base, ` by=${by} rid=${rid}`);
      const r = await bot(env).putSettings(p.value, by, rid);
      return ok(r.status, r.ok ? 200 : 409);
    }
    if (path.startsWith('/its/push/')) {
      const pushed = (r: PushAnswer) => (r.ok ? ok(r) : refuse(req, path, r.status, r.error, base, ` by=${by} rid=${rid}`));
      if (path === PUSH_ROUTES.subscribe) {
        const p = parsePushSubscribe(json);
        if (!p.ok) return refuse(req, path, 400, p.error, base, ` by=${by} rid=${rid}`);
        return pushed(await bot(env).subscribe(p.value, by, rid));
      }
      const p = parsePushEndpoint(json);
      if (!p.ok) return refuse(req, path, 400, p.error, base, ` by=${by} rid=${rid}`);
      const b = bot(env);
      return pushed(path === PUSH_ROUTES.unsubscribe ? await b.unsubscribe(p.value, by, rid) : await b.testPush(p.value, by, rid));
    }
    const p = parseRunInput(json);
    if (!p.ok) return refuse(req, path, 400, p.error, base, ` by=${by} rid=${rid}`);
    return ok(await bot(env).run(p.value, by, rid));
  } catch (e) {
    if (e instanceof Refused) return refuse(req, path, e.status, e.why, base, ` by=${by} rid=${rid}`);
    throw e;
  }
}

/** `GET /health/its` (`Authorization: Bearer <ITS_HEALTH_TOKEN>`): the verdict, reasons, ages and counts (ItsHealth),
 *  for the alerting workflow of a public repo: no date, facility or name. No CORS: no page calls it. */
async function health(req: Request, env: Env, path: string): Promise<Response> {
  if (req.method !== 'GET') return refuse(req, path, 405, 'method', { Allow: 'GET' });
  if (!(await tokenOk(bearerOf(req), env.ITS_HEALTH_TOKEN))) return refuse(req, path, 401, env.ITS_HEALTH_TOKEN?.trim() ? 'unauthorized' : 'no_health_token');
  return Response.json(await bot(env).health(), { headers: { 'Cache-Control': 'no-store' } });
}

/** The runner's routes; every answer is a RunnerConfig (claim's inside its ClaimReply). No CORS: no page calls them. */
async function runner(req: Request, env: Env, path: string): Promise<Response> {
  const method = RUNNER_ROUTES[path];
  if (req.method !== method) return refuse(req, path, 405, 'method', { Allow: method });
  if (!(await tokenOk(bearerOf(req), env.ITS_RUNNER_TOKEN))) return refuse(req, path, 401, env.ITS_RUNNER_TOKEN?.trim() ? 'unauthorized' : 'no_runner_token');
  const qRun = new URL(req.url).searchParams.get('runId');
  if (qRun !== null && !isId(qRun)) return refuse(req, path, 400, 'bad_run_id', {}, ' run=-');
  const headers = { 'Cache-Control': 'no-store' };
  // the asking run, for the refusal's line: ?runId=, else the body's runId (claim, report) when it is an id
  let run = qRun ?? '-';
  const no = (status: number, why: string, extra = '') => refuse(req, path, status, why, {}, ` run=${run}${extra}`);
  try {
    if (path === '/runner/config') return Response.json(await bot(env).config(qRun), { headers });
    const json = await body(req);
    if (qRun === null && isRec(json) && isId(json.runId)) run = json.runId;
    if (path === '/runner/claim') {
      const p = parseClaim(json);
      if (!p.ok) return no(400, p.error);
      return Response.json(await bot(env).claim(p.value), { headers });
    }
    if (path === '/runner/report') {
      const p = parseReport(json);
      if (!p.ok) return no(400, p.error);
      return Response.json(await bot(env).report(p.value), { headers });
    }
    const p = parseBookings(json);
    if (!p.ok) return no(400, p.error, ` n=${Array.isArray(json) ? json.length : '-'}`);
    const r = await bot(env).bookings(p.value, qRun);
    return r.ok ? Response.json(r.config, { headers }) : no(r.status, r.error, ` n=${p.value.length}`);
  } catch (e) {
    if (e instanceof Refused) return no(e.status, e.why);
    throw e;
  }
}
