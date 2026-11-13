// The ITS booker's Worker (README.md): the page's routes (a member's key, CORS for the app's origin), the runner's
// (ITS_RUNNER_TOKEN) and /health. Bodies are capped and checked here (the contract's parseSettingsInput, validate.ts);
// the record and its rules are the object's (bot.ts), one RPC per request. Every refusal logs one line with its reason
// (never a key or a token).
import { corsOf, roleOfKey } from '../../../relay/src/auth.ts';
import { parseSettingsInput, type Member } from '../../../app/src/lib/its/contract.ts';
import type { Env } from './env.ts';
import { isText, parseBookings, parseClaim, parseReport, parseRunInput } from './validate.ts';

export { ItsBot } from './bot.ts';

const MAX_BODY = 64 * 1024;
const bot = (env: Env) => env.BOT.get(env.BOT.idFromName('its'));

/** The page's routes and their one method each. */
const MEMBER_ROUTES: Record<string, string> = { '/its/status': 'GET', '/its/settings': 'PUT', '/its/run': 'POST' };
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
      if (pathname in MEMBER_ROUTES) return await member(req, env, pathname);
      if (pathname in RUNNER_ROUTES) return await runner(req, env, pathname);
      return new Response('not found', { status: 404 });
    } catch (e) {
      console.error(`its ${req.method} ${pathname} failed`, e);
      return Response.json({ ok: false, error: 'internal' }, { status: 500 });
    }
  }
} satisfies ExportedHandler<Env>;

/** One line per refusal: the status, the reason, the route; the origin when it was the cause. */
function refuse(req: Request, path: string, status: number, why: string, headers: Record<string, string> = {}, extra = ''): Response {
  console.warn(`its refused ${status} ${why} ${req.method} ${path}${extra}`);
  return Response.json({ ok: false, error: why }, { status, headers: { ...headers, 'Cache-Control': 'no-store' } });
}

/** The body as JSON, at most MAX_BODY bytes. */
async function body(req: Request): Promise<unknown> {
  if (Number(req.headers.get('Content-Length') ?? 0) > MAX_BODY) throw new Refused(413, 'too_large');
  const buf = await req.arrayBuffer();
  if (buf.byteLength > MAX_BODY) throw new Refused(413, 'too_large');
  try {
    return JSON.parse(new TextDecoder().decode(buf));
  } catch {
    throw new Refused(400, 'not_json');
  }
}

const bearer = (req: Request): string => {
  const h = req.headers.get('Authorization') ?? '';
  return h.startsWith('Bearer ') ? h.slice(7).trim() : '';
};

/** The page's routes: a member's key (KEY_A, KEY_B: the guest's is never set here, so it's refused like any other). */
async function member(req: Request, env: Env, path: string): Promise<Response> {
  const origin = req.headers.get('Origin');
  const cors = corsOf(origin, env.ALLOWED_ORIGINS ?? '');
  if (!cors) return refuse(req, path, 403, 'origin', {}, ` origin=${JSON.stringify((origin ?? '').slice(0, 100))}`);
  const method = MEMBER_ROUTES[path];
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { ...cors, 'Access-Control-Allow-Methods': method, 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Max-Age': '86400' } });
  }
  if (req.method !== method) return refuse(req, path, 405, 'method', { ...cors, Allow: method });
  const who = roleOfKey(bearer(req), { KEY_A: env.KEY_A, KEY_B: env.KEY_B });
  if (who !== 'A' && who !== 'B') return refuse(req, path, 401, 'unauthorized', cors);
  const by: Member = who;
  const headers = { ...cors, 'Cache-Control': 'private, no-store' };
  const ok = (x: unknown, status = 200) => Response.json(x, { status, headers });
  try {
    if (path === '/its/status') {
      const s = await bot(env).status();
      console.log(`its status by=${by} verdict=${s.verdict} reasons=${s.reasons.join(',') || '-'}`);
      return ok(s);
    }
    const json = await body(req);
    if (path === '/its/settings') {
      const p = parseSettingsInput(json, Date.now());
      if (!p.ok) return refuse(req, path, 400, p.error, cors, ` by=${by}`);
      const r = await bot(env).putSettings(p.value, by);
      return ok(r.status, r.ok ? 200 : 409);
    }
    const p = parseRunInput(json);
    if (!p.ok) return refuse(req, path, 400, p.error, cors, ` by=${by}`);
    return ok(await bot(env).run(p.value, by));
  } catch (e) {
    if (e instanceof Refused) return refuse(req, path, e.status, e.why, cors, ` by=${by}`);
    throw e;
  }
}

/** `Authorization: Bearer <ITS_RUNNER_TOKEN>`, compared in constant time (as SHA-256 digests, so of equal length). */
async function runnerTokenOk(token: string, expected: string | undefined): Promise<boolean> {
  if (!expected || !token) return false;
  const digest = async (s: string) => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
  const [a, b] = await Promise.all([digest(token), digest(expected)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** The runner's routes; every answer is a RunnerConfig (claim's inside its ClaimReply). No CORS: no page calls them. */
async function runner(req: Request, env: Env, path: string): Promise<Response> {
  const method = RUNNER_ROUTES[path];
  if (req.method !== method) return refuse(req, path, 405, 'method', { Allow: method });
  if (!(await runnerTokenOk(bearer(req), env.ITS_RUNNER_TOKEN))) return refuse(req, path, 401, env.ITS_RUNNER_TOKEN ? 'unauthorized' : 'no_runner_token');
  const qRun = new URL(req.url).searchParams.get('runId');
  if (qRun !== null && !(isText(qRun, 64) && /^[A-Za-z0-9._:-]+$/.test(qRun))) return refuse(req, path, 400, 'bad_run_id');
  const headers = { 'Cache-Control': 'no-store' };
  try {
    if (path === '/runner/config') return Response.json(await bot(env).config(qRun), { headers });
    const json = await body(req);
    if (path === '/runner/claim') {
      const p = parseClaim(json);
      if (!p.ok) return refuse(req, path, 400, p.error);
      return Response.json(await bot(env).claim(p.value), { headers });
    }
    if (path === '/runner/report') {
      const p = parseReport(json);
      if (!p.ok) return refuse(req, path, 400, p.error);
      return Response.json(await bot(env).report(p.value), { headers });
    }
    const p = parseBookings(json);
    if (!p.ok) return refuse(req, path, 400, p.error, {}, ` n=${Array.isArray(json) ? json.length : '-'}`);
    return Response.json(await bot(env).bookings(p.value, qRun), { headers });
  } catch (e) {
    if (e instanceof Refused) return refuse(req, path, e.status, e.why);
    throw e;
  }
}
