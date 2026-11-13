// `GET /food/kalori` (docs/backend.md "Kalori"): Kalori's chain menus for the members' food search, from Workers KV
// (`FOOD`), never in git or on Pages (docs/food-data.md#kalori). Free of the Workers runtime, so it is unit-testable
// (test/food-route.test.ts).
// - Auth: a member's key in `Authorization: Bearer <key>`; the guest's is refused (403), so one key fewer holds the data.
//   CORS for our origins, preflight answered (Authorization and If-None-Match aren't simple headers).
// - KV: `kalori` the file (its metadata `{v}`), `kalori:v` its version (scripts/kalori-put.sh writes both). The ETag is
//   the version: a revalidation reads the version key only, never the 9 MB value.
// - `Cache-Control: private, no-cache`: a phone keeps it and asks again with If-None-Match; no shared cache keeps it.
import { bearerOf, corsOf, preflight } from './auth.ts';
import type { Who } from '../../app/src/lib/contract/api.ts';

export const KALORI_KEY = 'kalori';
export const KALORI_V = 'kalori:v';

/** What the route needs of the KV namespace (a KVNamespace satisfies it). */
export interface FoodKv {
  get(key: string, type: 'text'): Promise<string | null>;
  getWithMetadata<M>(key: string, type: 'stream'): Promise<{ value: ReadableStream | null; metadata: M | null }>;
}

export interface FoodEnv {
  allowed: string;
  /** The key's owner (auth.ts keyOwner), or null. */
  roleOf(key: string): Who | null;
  kv: FoodKv | undefined;
}

/** Whether an If-None-Match header names this ETag (a list, weak or `*`). */
function matches(inm: string | null, etag: string): boolean {
  if (!inm) return false;
  return inm.split(',').map((t) => t.trim().replace(/^W\//, '')).some((t) => t === etag || t === '*');
}

export async function foodRoute(req: Request, env: FoodEnv): Promise<Response> {
  const cors = corsOf(req.headers.get('Origin'), env.allowed);
  if (!cors) return new Response('forbidden', { status: 403 });
  const err = (error: string, status: number) => Response.json({ ok: false, error }, { status, headers: { ...cors, 'Cache-Control': 'no-store' } });
  if (req.method === 'OPTIONS') return preflight(cors, 'GET', 'Authorization, If-None-Match');
  if (req.method !== 'GET') return new Response('method not allowed', { status: 405, headers: { ...cors, Allow: 'GET' } });
  const role = env.roleOf(bearerOf(req));
  if (!role) return err('unauthorized', 401);
  if (role === 'G') return err('forbidden', 403);
  const v = env.kv ? await env.kv.get(KALORI_V, 'text') : null;
  if (!env.kv || !v) return err('no_data', 404);
  const headers = { ...cors, 'Cache-Control': 'private, no-cache', 'Access-Control-Expose-Headers': 'ETag' };
  if (matches(req.headers.get('If-None-Match'), `"${v}"`)) return new Response(null, { status: 304, headers: { ...headers, ETag: `"${v}"` } });
  const { value, metadata } = await env.kv.getWithMetadata<{ v?: string }>(KALORI_KEY, 'stream');
  if (!value) return err('no_data', 404);
  // the file's own version (a read between an upload's two puts still names what it sends)
  return new Response(value, { headers: { ...headers, ETag: `"${metadata?.v ?? v}"`, 'Content-Type': 'application/json; charset=utf-8' } });
}
