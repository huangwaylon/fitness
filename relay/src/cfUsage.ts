// ボット → Jobs' Cloudflare free tier (docs/bots.md "Jobs", docs/ops/observability.md "The rows-read budget"): the
// account's use today of the Free plan's daily limits, for `GET /jobs`'s `usage` (contract: app/src/lib/contract/jobs.ts
// Usage). One GraphQL Analytics query (a subrequest, the secret CF_ANALYTICS_TOKEN: Account Analytics read), kept in
// the isolate's memory USAGE_TTL_MS (a failure FAIL_TTL_MS), each request reading its own (never awaiting another
// request's: a cancelled one's read never settles, and every later /jobs in the isolate would hang on it). Never a
// Durable Object: no rows, so
// it still answers when the objects are over quota. (No Cache API: the relay is on workers.dev, where it keeps nothing.)
// - Logged: `cf.usage` when its state changes in an isolate (failing: warn, well again: info); `no_token` never (the
//   test copy has none: the page says so).
// Free of the Workers runtime (test/cfUsage.test.ts).
import { FREE_LIMITS, type Usage, type UsageKey, type UsageLimit } from '../../app/src/lib/contract/jobs.ts';
import { isNum, isRec } from '../../app/src/lib/contract/guards.ts';
import type { RelayEvent } from './log.ts';

/** The account (wrangler.toml's account_id: not a secret). */
export const CF_ACCOUNT = '984dde81c150a207305c312cde950046';
const GQL = 'https://api.cloudflare.com/client/v4/graphql';
export const USAGE_TTL_MS = 10 * 60_000;
export const FAIL_TTL_MS = 2 * 60_000;
const USAGE_TIMEOUT_MS = 3_000;
/** The Durable Object namespaces by id (their REST list needs Workers read, which the token lacks); the rest `other`. */
const NAMESPACES: Record<string, string> = {
  '1dd1879eca0f431ba7e426980e30d8c8': 'relay/IslandRoom',
  bb910334c3bb4e2b8d01b978a20d0e3a: 'relay/IslandStore',
  '00608bdb2bda463e95a73e6501078f04': 'relay/IslandLog',
  dabdf9dec9244cfdab1eca75eb1422d2: 'test/IslandRoom',
  '463d2de8c7234f269fbc37b7df750831': 'test/IslandStore',
  e5d2f9a0aef84ed28ceba648c38e1aa1: 'test/IslandLog',
  '4a0493d96950436ca3ddff70ce3edae1': 'gym-bot/GymBot',
  ecde9f53efea4d93b9e181aeaa714e01: 'its-bot/ItsBot'
};
/** The Workers' names, shorter (the rest as Cloudflare names them). */
const SCRIPTS: Record<string, string> = { 'island-fund-relay': 'relay', 'island-fund-relay-test': 'test' };

/** The query for a UTC day: Workers' requests by script, Durable Objects' rows by namespace, their requests by namespace. */
export const usageQuery = (day: string): string => `{ viewer { accounts(filter:{accountTag:"${CF_ACCOUNT}"}) {
 w: workersInvocationsAdaptive(limit:50, filter:{date:"${day}"}) { sum { requests } dimensions { scriptName } }
 d: durableObjectsPeriodicGroups(limit:50, filter:{date:"${day}"}) { sum { rowsRead rowsWritten } dimensions { namespaceId } }
 r: durableObjectsInvocationsAdaptiveGroups(limit:50, filter:{date:"${day}"}) { sum { requests } dimensions { namespaceId } } } } }`;

type Row = { sum: Record<string, unknown>; dimensions: Record<string, unknown> };
const rows = (x: unknown): Row[] | null => (Array.isArray(x) ? x.filter((r): r is Row => isRec(r) && isRec(r.sum) && isRec(r.dimensions)) : null);

/** A limit from rows: each row's `field` summed by its name (`dim` mapped by `names`, else `other` or the raw name). */
function limitOf(k: UsageKey, rs: Row[], field: string, dim: string, names: Record<string, string>, raw: boolean): UsageLimit {
  const by = new Map<string, number>();
  for (const r of rs) {
    const n = r.sum[field];
    if (!isNum(n) || n <= 0) continue;
    const id = String(r.dimensions[dim] ?? '');
    const name = names[id] ?? (raw && id ? id.slice(0, 40) : 'other');
    by.set(name, (by.get(name) ?? 0) + n);
  }
  const list = [...by].map(([name, n]) => ({ name, n })).sort((a, b) => b.n - a.n);
  return { k, used: list.reduce((a, b) => a + b.n, 0), max: FREE_LIMITS[k], by: list };
}

/** GraphQL's reply as the limits (rows read, written, DO requests, Worker requests), or why not (`gql`, `shape`). */
export function parseUsageReply(x: unknown): { limits: UsageLimit[] } | { err: string } {
  if (!isRec(x)) return { err: 'shape' };
  if (Array.isArray(x.errors) && x.errors.length) return { err: 'gql' };
  const acct = isRec(x.data) && isRec(x.data.viewer) && Array.isArray(x.data.viewer.accounts) ? x.data.viewer.accounts[0] : null;
  if (!isRec(acct)) return { err: 'shape' };
  const w = rows(acct.w), d = rows(acct.d), r = rows(acct.r);
  if (!w || !d || !r) return { err: 'shape' };
  return {
    limits: [
      limitOf('doRead', d, 'rowsRead', 'namespaceId', NAMESPACES, false),
      limitOf('doWrite', d, 'rowsWritten', 'namespaceId', NAMESPACES, false),
      limitOf('doReq', r, 'requests', 'namespaceId', NAMESPACES, false),
      limitOf('wReq', w, 'requests', 'scriptName', SCRIPTS, true)
    ]
  };
}

export interface UsageDeps {
  now(): number;
  fetch: typeof fetch;
  /** CF_ANALYTICS_TOKEN (unset: `no_token`, Cloudflare never asked). */
  token: string | undefined;
  log?: (e: RelayEvent) => void;
  timeoutMs?: number;
}

/** An isolate's copy: the last answer and until when it holds, the last good one (its day), the state last logged
 *  (null: well). */
export interface UsageCache { u: Usage | null; until: number; good: Usage | null; logged: string | null }
export const newUsageCache = (): UsageCache => ({ u: null, until: 0, good: null, logged: null });
/** The isolate's own. */
export const USAGE_CACHE = newUsageCache();

/** Cloudflare asked once, within the timeout: the day's limits, or why not (the day's last good limits kept). Never throws. */
async function readOnce(c: UsageCache, d: UsageDeps): Promise<Usage> {
  const t0 = d.now(), day = new Date(t0).toISOString().slice(0, 10);
  let err: string;
  if (!d.token) err = 'no_token';
  else {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), d.timeoutMs ?? USAGE_TIMEOUT_MS);
    try {
      const res = await d.fetch(GQL, {
        method: 'POST', signal: ac.signal,
        headers: { Authorization: `Bearer ${d.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: usageQuery(day) })
      });
      if (!res.ok) err = `http_${res.status}`;
      else {
        const p = parseUsageReply(await res.json());
        if ('limits' in p) {
          const u: Usage = { at: t0, day, limits: p.limits, err: null };
          if (c.logged !== null) d.log?.({ e: 'cf.usage', l: 1, d: { ok: true, ms: d.now() - t0 } });
          c.logged = null;
          c.good = u;
          return u;
        }
        err = p.err;
      }
    } catch {
      err = ac.signal.aborted ? 'timeout' : 'fetch';
    } finally {
      clearTimeout(timer);
    }
  }
  if (err !== 'no_token' && c.logged !== err) d.log?.({ e: 'cf.usage', l: 2, d: { ok: false, why: err, ms: d.now() - t0 } });
  c.logged = err === 'no_token' ? c.logged : err;
  const good = c.good?.day === day ? c.good : null;
  return { at: good?.at ?? t0, day: good?.day ?? null, limits: good?.limits ?? [], err };
}

/** The day's use: the isolate's copy while it holds (USAGE_TTL_MS; a failure FAIL_TTL_MS), else read (two requests at
 *  once both read: rare, one page's). */
export async function cfUsage(c: UsageCache, d: UsageDeps): Promise<Usage> {
  // (a copy from the UTC day before never outlives midnight: the limits reset)
  if (c.u && d.now() < c.until && (!c.u.day || c.u.day === new Date(d.now()).toISOString().slice(0, 10))) return c.u;
  const u = await readOnce(c, d);
  c.u = u;
  c.until = d.now() + (u.err ? FAIL_TTL_MS : USAGE_TTL_MS);
  return u;
}
