// The gym bot's Worker (README.md): LINE's webhook, handed to the bot (bot.ts), the state's import/export, the
// runner's public status (status.ts) and, for members only, 📋 設定を見る's answer (/gym/config) and the app's changes
// and 🔎 (POST /gym/act, the taps' code path: actions.ts). MODE (wrangler.toml) 'bot' hands each event to the bot;
// 'off', the stop switch, answers LINE but ignores its events.
import { corsOf, roleOfKey } from '../../relay/src/auth.ts';
import { ACT_MAX_BYTES, ACT_STATUS, type ActError } from '../../app/src/lib/gym/contract.ts';
import type { Env } from './env.ts';
import { signatureOk } from './line.ts';
import type { GymStatus } from './status.ts';

export { GymBot } from './bot.ts';

const bot = (env: Env) => env.BOT.get(env.BOT.idFromName('gym'));

export default {
  /** The hourly cron (wrangler.toml): restarts the checks if their alarm chain ever broke, which otherwise only a tap
   *  or /gym/state would (status.ts `no_alarm`). Nothing when an alarm is set, MODE is off or checks are stopped. */
  async scheduled(_controller: ScheduledController, env: Env): Promise<void> {
    await bot(env).ensureAlarm();
  },
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(req.url);
    if (pathname === '/health') return Response.json({ ok: true, mode: env.MODE, sha: env.COMMIT ?? null });
    if (pathname === '/status') return status(env);
    if (pathname === '/gym/config') return config(req, env);
    if (pathname === '/gym/act') return act(req, env);
    if (pathname === '/line/webhook' && req.method === 'POST') return webhook(req, env, ctx);
    if (pathname !== '/gym/state') return new Response('not found', { status: 404 });

    if (!(await tokenOk(req.headers.get('Authorization'), env.GYM_TOKEN))) {
      return new Response('unauthorized', { status: 401 });
    }
    if (req.method === 'GET') return Response.json(await bot(env).getState());
    if (req.method !== 'PUT') return new Response('method not allowed', { status: 405, headers: { Allow: 'GET, PUT' } });
    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return Response.json({ ok: false, error: 'not JSON' }, { status: 400 });
    }
    const r = await bot(env).putState(json);
    return Response.json(r, { status: r.ok ? 200 : 400 });
  }
} satisfies ExportedHandler<Env>;

/** /status's answer as the bot last gave it (per isolate), and how long that holds: an anonymous URL, so a flood
 *  spends Worker requests, not the object's (workers.dev has no Cache API). */
let statusSeen: { at: number; status: GymStatus } | null = null;
const STATUS_MS = 60_000;

/** The runner's health, for the app (status.ts): public and harmless by construction, so any origin may read it. */
async function status(env: Env): Promise<Response> {
  const now = Date.now();
  if (!statusSeen || now - statusSeen.at > STATUS_MS) statusSeen = { at: now, status: await bot(env).getStatus() };
  return Response.json(statusSeen.status, { headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'max-age=30' } });
}

/** 📋 設定を見る's answer (actions.ts GymConfig), for the app: unlike /status it names the days' settings, so only a
 *  member's key (KEY_A, KEY_B: relay/src/auth.ts, as the relay checks them) from the app's origin (or no Origin: curl)
 *  reads it, never cached. One log line per request: who read it, why it was refused (a stranger's 401 at log level,
 *  the rest warn), or that the object failed (500, CORS kept so the page offers a retry). Never a key. */
async function config(req: Request, env: Env): Promise<Response> {
  const origin = req.headers.get('Origin');
  const cors = corsOf(origin, env.ALLOWED_ORIGINS ?? '');
  const refuse = (status: number, why: string, headers: Record<string, string> = {}, extra = '') => {
    (why === 'unauthorized' ? console.log : console.warn)(`config refused ${status} ${why}${extra}`);
    return Response.json({ ok: false, error: why }, { status, headers: { ...headers, 'Cache-Control': 'no-store' } });
  };
  if (!cors) return refuse(403, 'origin', {}, ` origin=${JSON.stringify((origin ?? '').slice(0, 100))}`);
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { ...cors, 'Access-Control-Allow-Methods': 'GET', 'Access-Control-Allow-Headers': 'Authorization', 'Access-Control-Max-Age': '86400' } });
  }
  if (req.method !== 'GET') return refuse(405, 'method', { ...cors, Allow: 'GET' });
  const auth = req.headers.get('Authorization') ?? '';
  const who = roleOfKey(auth.startsWith('Bearer ') ? auth.slice(7).trim() : '', { KEY_A: env.KEY_A, KEY_B: env.KEY_B });
  if (who !== 'A' && who !== 'B') return refuse(401, env.KEY_A || env.KEY_B ? 'unauthorized' : 'no_keys', cors);
  let answer;
  try {
    answer = await bot(env).getConfig();
  } catch (e) {
    console.error(`config failed ${e instanceof Error ? e.name : typeof e}`);
    return Response.json({ ok: false, error: 'failed' }, { status: 500, headers: { ...cors, 'Cache-Control': 'no-store' } });
  }
  console.log(`config read by=${who}`);
  return Response.json(answer, { headers: { ...cors, 'Cache-Control': 'private, no-store' } });
}

/** The app's request id: its X-Request-Id when it is a short token, else one made up (`w-` and 8 hex), never the
 *  header as sent (it goes in the log). */
const requestId = (req: Request): string => {
  const sent = req.headers.get('X-Request-Id');
  return sent && /^[A-Za-z0-9_-]{1,40}$/.test(sent) ? sent : `w-${crypto.randomUUID().slice(0, 8)}`;
};

/** POST /gym/act (the contract's ActInput): a member's key from the app's origin, as /gym/config; a JSON body of at most
 *  ACT_MAX_BYTES, read as it streams. The bot answers (actions.ts webAct: the config after it, or the refusal with
 *  LINE's hint and its status: a 409 `stale` with the config, a 429 `cooldown` with Retry-After); CORS on every
 *  answer, the request id echoed. A refusal here logs one line: at log level the page's own (400), warn the rest
 *  (401, 403, 405, 413); the bot's refusals log in webAct. */
async function act(req: Request, env: Env): Promise<Response> {
  const origin = req.headers.get('Origin');
  const rid = requestId(req);
  const cors = corsOf(origin, env.ALLOWED_ORIGINS ?? '');
  const refuse = (error: ActError, headers: Record<string, string>, extra = '') => {
    const status = ACT_STATUS[error];
    (status === 400 ? console.log : console.warn)(`act refused ${status} ${error}${extra} rid=${rid}`);
    return Response.json({ ok: false, error }, { status, headers: { ...headers, 'Cache-Control': 'no-store' } });
  };
  if (!cors) return refuse('origin', {}, ` origin=${JSON.stringify((origin ?? '').slice(0, 100))}`);
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { ...cors, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Request-Id', 'Access-Control-Max-Age': '86400' } });
  }
  const base = { ...cors, 'Access-Control-Expose-Headers': 'X-Request-Id, Retry-After', 'X-Request-Id': rid };
  if (req.method !== 'POST') return refuse('method', { ...base, Allow: 'POST' });
  const auth = req.headers.get('Authorization') ?? '';
  const who = roleOfKey(auth.startsWith('Bearer ') ? auth.slice(7).trim() : '', { KEY_A: env.KEY_A, KEY_B: env.KEY_B });
  if (who !== 'A' && who !== 'B') return refuse(env.KEY_A || env.KEY_B ? 'unauthorized' : 'no_keys', base);
  const json = await body(req);
  if (json === TOO_LARGE) return refuse('too_large', base, ` by=${who}`);
  if (json === NOT_JSON) return refuse('not_json', base, ` by=${who}`);
  let r;
  try {
    r = await bot(env).act(json, who, rid);
  } catch (e) {
    console.error(`act failed ${e instanceof Error ? e.name : typeof e} rid=${rid}`);
    return Response.json({ ok: false, error: 'failed' }, { status: 500, headers: { ...base, 'Cache-Control': 'no-store' } });
  }
  const headers: Record<string, string> = { ...base, 'Cache-Control': 'private, no-store' };
  if (r.retryAfter) headers['Retry-After'] = String(r.retryAfter);
  return Response.json(r.body, { status: r.status, headers });
}

const TOO_LARGE = Symbol('too large');
const NOT_JSON = Symbol('not JSON');

/** The body as JSON, at most ACT_MAX_BYTES: refused by its Content-Length, or (without one, or a lying one) as soon as
 *  the stream passes the bound, never read whole first. */
async function body(req: Request): Promise<unknown> {
  if (Number(req.headers.get('Content-Length') ?? 0) > ACT_MAX_BYTES) return TOO_LARGE;
  const chunks: Uint8Array[] = [];
  let n = 0;
  const reader = req.body?.getReader();
  for (let r = await reader?.read(); r && !r.done; r = await reader!.read()) {
    n += r.value.byteLength;
    if (n > ACT_MAX_BYTES) {
      await reader!.cancel();
      return TOO_LARGE;
    }
    chunks.push(r.value);
  }
  const buf = new Uint8Array(n);
  chunks.reduce((at, c) => (buf.set(c, at), at + c.byteLength), 0);
  try {
    return JSON.parse(new TextDecoder().decode(buf));
  } catch {
    return NOT_JSON;
  }
}

/** LINE's webhook: answered 200 at once (LINE retries or gives up on a slow one), the events handled after. */
async function webhook(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const body = await req.text();
  const signature = req.headers.get('X-Line-Signature');
  if (!signature || !(await signatureOk(env.LINE_CHANNEL_SECRET, body, signature))) {
    console.warn('ignored a webhook request with a bad signature');
    return new Response('bad signature', { status: 403 });
  }
  const events: Record<string, unknown>[] = JSON.parse(body).events ?? [];
  if (env.MODE !== 'bot') {
    if (events.length) console.warn(`ignored ${events.length} LINE events (MODE ${env.MODE})`);
  } else {
    for (const event of events) ctx.waitUntil(bot(env).handle(event).catch((e) => console.error('LINE event failed', e)));
  }
  return new Response('ok');
}

/** The `Authorization: Bearer <GYM_TOKEN>` header, compared in constant time (as SHA-256 digests, so of equal length). */
async function tokenOk(header: string | null, token: string): Promise<boolean> {
  if (!token || !header) return false;
  const digest = async (s: string) => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
  const [a, b] = await Promise.all([digest(header), digest(`Bearer ${token}`)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
