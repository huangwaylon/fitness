// The gym bot's Worker (README.md): LINE's webhook, handed to the bot (bot.ts), the state's import/export, the
// runner's public status (status.ts) and, for members only, 📋 設定を見る's answer (/gym/config) and the app's changes
// and 🔎 (POST /gym/act, the taps' code path: actions.ts). MODE (wrangler.toml) 'bot' hands each event to the bot;
// 'off', the stop switch, answers LINE but ignores its events, and refuses the app's acts (503 mode_off).
import { bearerOf, corsOf, preflight, roleOfKey, tokenOk } from '../../relay/src/auth.ts';
import { ACT_MAX_BYTES, ACT_STATUS, type ActError } from '../../app/src/lib/gym/contract.ts';
import { jsonCapped, requestId } from '../../relay/src/body.ts';
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

    // `Authorization: Bearer <GYM_TOKEN>`, in constant time, both sides trimmed (a pasted secret's newline)
    if (!(await tokenOk(bearerOf(req), env.GYM_TOKEN))) {
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

/** A members' route's refusal: `{ok: false, error}` with its status (the contract's ACT_STATUS), never cached, and one
 *  log line, `<op> refused <status> <error>…`: at log level the expected ones (a stranger's 401 on /gym/config, the
 *  page's own 400s on /gym/act), warn the rest. */
function refusal(op: 'config' | 'act', error: ActError, headers: Record<string, string>, extra = ''): Response {
  const status = ACT_STATUS[error];
  const quiet = op === 'config' ? error === 'unauthorized' : status === 400;
  (quiet ? console.log : console.warn)(`${op} refused ${status} ${error}${extra}`);
  return Response.json({ ok: false, error }, { status, headers: { ...headers, 'Cache-Control': 'no-store' } });
}

const originNote = (origin: string | null) => ` origin=${JSON.stringify((origin ?? '').slice(0, 100))}`;
const memberOf = (req: Request, env: Env) => {
  const who = roleOfKey(bearerOf(req), { KEY_A: env.KEY_A, KEY_B: env.KEY_B });
  return who === 'A' || who === 'B' ? who : null;
};

/** 📋 設定を見る's answer (actions.ts GymConfig), for the app: unlike /status it names the days' settings, so only a
 *  member's key (KEY_A, KEY_B: relay/src/auth.ts, as the relay checks them) from the app's origin (or no Origin: curl)
 *  reads it, never cached. One log line per request: who read it, why it was refused (refusal), or that the object
 *  failed (500, CORS kept so the page offers a retry). Never a key. */
async function config(req: Request, env: Env): Promise<Response> {
  const origin = req.headers.get('Origin');
  const cors = corsOf(origin, env.ALLOWED_ORIGINS ?? '');
  if (!cors) return refusal('config', 'origin', {}, originNote(origin));
  if (req.method === 'OPTIONS') return preflight(cors, 'GET', 'Authorization');
  if (req.method !== 'GET') return refusal('config', 'method', { ...cors, Allow: 'GET' });
  const who = memberOf(req, env);
  if (!who) return refusal('config', env.KEY_A || env.KEY_B ? 'unauthorized' : 'no_keys', cors);
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

/** POST /gym/act (the contract's ActInput): a member's key from the app's origin, as /gym/config; a JSON body of at most
 *  ACT_MAX_BYTES, read as it streams; refused 503 `mode_off` unless MODE is 'bot' (the stop switch stops the app's
 *  changes too). The bot answers (actions.ts webAct: the config after it, or the refusal with LINE's hint and its
 *  status: a 409 `stale` with the config, a 429 `cooldown` with Retry-After); CORS on every answer, the request id
 *  echoed. A refusal here logs one line (refusal, with `rid=`); the bot's refusals log in webAct. */
async function act(req: Request, env: Env): Promise<Response> {
  const origin = req.headers.get('Origin');
  const rid = requestId(req, (x) => !!x && /^[A-Za-z0-9_-]{1,40}$/.test(x));
  const cors = corsOf(origin, env.ALLOWED_ORIGINS ?? '');
  const refuse = (error: ActError, headers: Record<string, string>, extra = '') => refusal('act', error, headers, `${extra} rid=${rid}`);
  if (!cors) return refuse('origin', {}, originNote(origin));
  if (req.method === 'OPTIONS') return preflight(cors, 'POST', 'Authorization, Content-Type, X-Request-Id');
  const base = { ...cors, 'Access-Control-Expose-Headers': 'X-Request-Id, Retry-After', 'X-Request-Id': rid };
  if (req.method !== 'POST') return refuse('method', { ...base, Allow: 'POST' });
  const who = memberOf(req, env);
  if (!who) return refuse(env.KEY_A || env.KEY_B ? 'unauthorized' : 'no_keys', base);
  if (env.MODE !== 'bot') return refuse('mode_off', base, ` by=${who}`);
  const b = await jsonCapped(req, ACT_MAX_BYTES);
  if (!b.ok) return refuse(b.why, base, ` by=${who}`);
  const json = b.json;
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
