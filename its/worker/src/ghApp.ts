// A GitHub App's installation token for a Worker (its/README.md "GitHub App"): a short-lived token of the App's own
// identity (its own rate limit, not a person's 5,000/h), narrowed per caller to the repositories and permissions it
// needs. Self-contained (WebCrypto and fetch only, no import): the relay keeps a copy for its backup.
//
// The JWT: RS256 over {iat: now − 60 s, exp: now + 9 min, iss: the App's ID}, signed with the App's private key as a
// PKCS#8 PEM (GitHub hands out PKCS#1: `openssl pkcs8 -topk8 -nocrypt`). The token: POST
// /app/installations/{id}/access_tokens {repositories, permissions}, 1 h, kept until MARGIN_MS before it expires, in
// memory (this isolate) and in a TokenStore (a Durable Object's storage: a cold isolate doesn't mint again). Errors
// are GhAppError (code + HTTP status, never a body). ghAuth: the App's token, else null.

export type GhAppErrorCode = 'mint_failed' | 'install_missing' | 'key_bad';

/** A mint that failed: `code` and GitHub's HTTP status (0: no answer, or no request: key_bad). Never a body or a key. */
export class GhAppError extends Error {
  constructor(readonly code: GhAppErrorCode, readonly status: number) {
    super(`${code} status=${status}`);
    this.name = 'GhAppError';
  }
}

/** The secrets: the App's ID (or client ID), its installation's ID, its private key (PKCS#8 PEM). */
export interface GhAppConfig { appId?: string; installationId?: string; key?: string }
/** What the token may touch: repository names (the installation's owner) and permissions, e.g. {actions: 'write'}. */
export interface Narrowing { repositories: string[]; permissions: Record<string, 'read' | 'write'> }
export interface GhToken { token: string; expiresAt: number }
/** A token for a call and whose it is (the App's: the records' `by`, where an older `pat` may remain). */
export interface GhAuth { token: string; by: 'app' }
/** Where a token outlives the isolate (one value; `k` says which App, installation and narrowing it is for). */
export interface TokenStore { get(): Promise<unknown>; put(v: { k: string } & GhToken): Promise<void> }

const API = 'https://api.github.com';
/** A token is used until this long before it expires (GitHub's last 5 min: a call in flight still carries a live one). */
export const MARGIN_MS = 5 * 60_000;
const TIMEOUT_MS = 10_000;
const UA = 'gh-app-token (huangwaylon/fitness)';

/** The App's three secrets are all set. */
export const appConfigured = (c: GhAppConfig): boolean => !!(c.appId?.trim() && c.installationId?.trim() && c.key?.trim());

const b64url = (bytes: Uint8Array): string => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64urlJson = (x: unknown): string => b64url(new TextEncoder().encode(JSON.stringify(x)));

/** The PKCS#8 PEM's key for RS256, or key_bad (PKCS#1's "RSA PRIVATE KEY" included: convert it first). */
async function importKey(pem: string): Promise<CryptoKey> {
  const m = /-----BEGIN PRIVATE KEY-----([\s\S]+?)-----END PRIVATE KEY-----/.exec(pem);
  if (!m) throw new GhAppError('key_bad', 0);
  try {
    const der = Uint8Array.from(atob(m[1].replace(/\s+/g, '')), (c) => c.charCodeAt(0));
    return await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  } catch {
    throw new GhAppError('key_bad', 0);
  }
}

/** The App's JWT at `now` (ms): iat 60 s back (GitHub's clock may lag), exp 9 min on (GitHub's cap is 10). */
export async function appJwt(appId: string, pem: string, now: number): Promise<string> {
  const key = await importKey(pem);
  const t = Math.floor(now / 1000);
  const id = appId.trim();
  const head = `${b64urlJson({ alg: 'RS256', typ: 'JWT' })}.${b64urlJson({ iat: t - 60, exp: t + 540, iss: /^\d+$/.test(id) ? Number(id) : id })}`;
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(head));
  return `${head}.${b64url(new Uint8Array(sig))}`;
}

/** The access_tokens request's body: only these repositories, only these permissions. */
export const narrowBody = (n: Narrowing): string => JSON.stringify({ repositories: n.repositories, permissions: n.permissions });

export const tokenUrl = (installationId: string) => `${API}/app/installations/${encodeURIComponent(installationId.trim())}/access_tokens`;

/** A new installation token: 201 → the token; 404 → install_missing (the installation's ID, or the App uninstalled);
 *  any other answer (401: the JWT refused, the ID or key wrong; 422: the narrowing asks more than the App has; a 201
 *  without a token) or none → mint_failed. */
export async function mintToken(c: GhAppConfig, n: Narrowing, now: number, f: typeof fetch = fetch): Promise<GhToken> {
  if (!appConfigured(c)) throw new GhAppError('key_bad', 0);
  const jwt = await appJwt(c.appId!, c.key!, now);
  let res: Response;
  try {
    res = await f(tokenUrl(c.installationId!), {
      method: 'POST',
      headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json', 'User-Agent': UA, 'X-GitHub-Api-Version': '2022-11-28' },
      body: narrowBody(n),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new GhAppError('mint_failed', 0);
  }
  if (res.status === 404) throw new GhAppError('install_missing', 404);
  if (res.status !== 201) throw new GhAppError('mint_failed', res.status);
  const body = (await res.json().catch(() => null)) as { token?: unknown; expires_at?: unknown } | null;
  const expiresAt = typeof body?.expires_at === 'string' ? Date.parse(body.expires_at) : NaN;
  if (typeof body?.token !== 'string' || !body.token || !Number.isFinite(expiresAt)) throw new GhAppError('mint_failed', 201);
  return { token: body.token, expiresAt };
}

const memo = new Map<string, GhToken>();
const minting = new Map<string, Promise<GhToken>>();
/** Forget the isolate's tokens (tests; a token GitHub refused). The store's is replaced at the next mint. */
export function forgetTokens(): void {
  memo.clear();
  minting.clear();
}

const usable = (t: GhToken | undefined, now: number): t is GhToken => !!t && t.expiresAt - MARGIN_MS > now;

/** The installation token for `n`: the isolate's, else the store's, else a new one (one mint at a time per key; put
 *  in both). A store that fails is only skipped. Throws GhAppError. */
export const keyOf = (c: GhAppConfig, n: Narrowing) => `${c.appId?.trim()}:${c.installationId?.trim()}:${narrowBody(n)}`;

export async function appToken(c: GhAppConfig, n: Narrowing, opts: { now: number; store?: TokenStore; fetch?: typeof fetch }): Promise<GhToken> {
  const k = keyOf(c, n);
  const had = memo.get(k);
  if (usable(had, opts.now)) return had;
  const saved = (await opts.store?.get().catch(() => undefined)) as ({ k?: unknown } & Partial<GhToken>) | undefined;
  if (saved?.k === k && typeof saved.token === 'string' && typeof saved.expiresAt === 'number' && usable(saved as GhToken, opts.now)) {
    const t = { token: saved.token, expiresAt: saved.expiresAt };
    memo.set(k, t);
    return t;
  }
  let p = minting.get(k);
  if (!p) {
    p = (async () => {
      const t = await mintToken(c, n, opts.now, opts.fetch);
      memo.set(k, t);
      await opts.store?.put({ k, ...t }).catch(() => {});
      return t;
    })();
    minting.set(k, p);
    void p.finally(() => minting.delete(k)).catch(() => {});
  }
  return p;
}

/** A token GitHub refused on a call (401: the App suspended, its permissions changed): forgotten in this isolate and
 *  in the store, so the next appToken mints a new one. */
export async function dropToken(c: GhAppConfig, n: Narrowing, store?: TokenStore): Promise<void> {
  memo.delete(keyOf(c, n));
  await store?.put({ k: '', token: '', expiresAt: 0 }).catch(() => {});
}

/** The token for a call: the App's when its secrets are set and the mint works, else null. A failed mint is one warn
 *  line (`gh-app mint failed code=… status=…`) and `onFail`'s (the relay's backup line: appErr, appHttp); never throws. */
export async function ghAuth(c: GhAppConfig, n: Narrowing, opts: { now: number; store?: TokenStore; fetch?: typeof fetch; onFail?: (e: GhAppError) => void }): Promise<GhAuth | null> {
  if (appConfigured(c)) {
    try {
      return { token: (await appToken(c, n, opts)).token, by: 'app' };
    } catch (e) {
      const err = e instanceof GhAppError ? e : new GhAppError('mint_failed', 0);
      console.warn(`gh-app mint failed code=${err.code} status=${err.status}`);
      opts.onFail?.(err);
    }
  }
  return null;
}
