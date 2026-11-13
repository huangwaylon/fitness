// The gym bot's Worker (README.md): LINE's webhook, handed to the bot (bot.ts), the state's import/export, the
// runner's public status (status.ts) and, for members only, 📋 設定を見る's answer (/gym/config). MODE (wrangler.toml)
// 'bot' hands each event to the bot; 'off', the stop switch, answers LINE but ignores its events.
import { corsOf, roleOfKey } from '../../relay/src/auth.ts';
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
 *  reads it, never cached. One log line per request: who read it, or why it was refused (never a key). */
async function config(req: Request, env: Env): Promise<Response> {
  const origin = req.headers.get('Origin');
  const cors = corsOf(origin, env.ALLOWED_ORIGINS ?? '');
  const refuse = (status: number, why: string, headers: Record<string, string> = {}, extra = '') => {
    console.warn(`config refused ${status} ${why}${extra}`);
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
  const answer = await bot(env).getConfig();
  console.log(`config read by=${who}`);
  return Response.json(answer, { headers: { ...cors, 'Cache-Control': 'private, no-store' } });
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
