// The GitHub App's installation token (src/ghApp.ts): the JWT (verified with a key made here, never a real one), the
// narrowed request, the cache (memory, then the store, until 5 min before expiry), ghAuth's null and each error.
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { appJwt, appToken, forgetTokens, ghAuth, GhAppError, MARGIN_MS, mintToken, narrowBody, tokenUrl, type GhAppConfig, type Narrowing } from '../src/ghApp.ts';
import { testKey } from './ghKey.ts';

const NOW = Date.parse('2026-11-24T05:00:00Z');
const N: Narrowing = { repositories: ['fitness'], permissions: { actions: 'write' } };
let pem: string;
let pub: CryptoKey;
let cfg: GhAppConfig;

const unb64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const json = (s: string) => JSON.parse(new TextDecoder().decode(unb64url(s)));

beforeAll(async () => {
  ({ pem, pub } = await testKey());
});

/** GitHub's access_tokens: 201 with a token expiring in 1 h, each call counted. */
const minted = (status = 201, body: unknown = { token: 'ghs_test', expires_at: new Date(NOW + 3_600_000).toISOString() }) =>
  vi.fn(async (_u: string, _i?: RequestInit) => (status === 201 ? Response.json(body, { status }) : new Response('{"message":"x"}', { status })));

/** A TokenStore over a variable. */
const store = () => {
  const s = { v: undefined as unknown, puts: 0, get: async () => s.v, put: async (v: unknown) => void ((s.v = v), s.puts++) };
  return s;
};

beforeEach(() => {
  forgetTokens();
  cfg = { appId: '123456', installationId: '987', key: pem };
});
afterEach(() => vi.restoreAllMocks());

describe('the JWT', () => {
  it('RS256, iat 60 s back, exp 9 min on, iss the App ID; its signature verifies with the public half', async () => {
    const jwt = await appJwt('123456', pem, NOW + 400);
    const [h, p, sig] = jwt.split('.');
    expect(json(h)).toEqual({ alg: 'RS256', typ: 'JWT' });
    expect(json(p)).toEqual({ iat: NOW / 1000 - 60, exp: NOW / 1000 + 540, iss: 123456 });
    expect(await crypto.subtle.verify('RSASSA-PKCS1-v1_5', pub, unb64url(sig), new TextEncoder().encode(`${h}.${p}`))).toBe(true);
    // a client ID stays a string
    expect(json((await appJwt('Iv23liAbc', pem, NOW)).split('.')[1]).iss).toBe('Iv23liAbc');
  });

  it('key_bad: not PEM, PKCS#1 (GitHub’s download, unconverted), a broken body', async () => {
    for (const k of ['nope', pem.replace(/PRIVATE KEY/g, 'RSA PRIVATE KEY'), '-----BEGIN PRIVATE KEY-----\nAAAA\n-----END PRIVATE KEY-----']) {
      await expect(appJwt('1', k, NOW)).rejects.toMatchObject({ name: 'GhAppError', code: 'key_bad', status: 0 });
    }
  });
});

describe('the mint', () => {
  it('POSTs the narrowed body to the installation’s access_tokens with the JWT', async () => {
    const f = minted();
    expect(await mintToken(cfg, N, NOW, f as never)).toEqual({ token: 'ghs_test', expiresAt: NOW + 3_600_000 });
    const [url, init] = f.mock.calls[0];
    expect(url).toBe('https://api.github.com/app/installations/987/access_tokens');
    expect(url).toBe(tokenUrl('987'));
    expect(init!.method).toBe('POST');
    expect(JSON.parse(String(init!.body))).toEqual({ repositories: ['fitness'], permissions: { actions: 'write' } });
    expect(init!.body).toBe(narrowBody(N));
    const auth = (init!.headers as Record<string, string>).Authorization;
    expect(auth).toMatch(/^Bearer [\w-]+\.[\w-]+\.[\w-]+$/);
    expect(json(auth.split(' ')[1].split('.')[1]).iss).toBe(123456);
  });

  it('install_missing on 404; mint_failed on 401, 422, no answer, a 201 without a token; codes only', async () => {
    const cases: [typeof fetch, string, number][] = [
      [minted(404) as never, 'install_missing', 404],
      [minted(401) as never, 'mint_failed', 401],
      [minted(422) as never, 'mint_failed', 422],
      [(async () => { throw new TypeError('down'); }) as never, 'mint_failed', 0],
      [minted(201, { expires_at: 'x' }) as never, 'mint_failed', 201],
    ];
    for (const [f, code, status] of cases) {
      const e = await mintToken(cfg, N, NOW, f).catch((x: unknown) => x);
      expect(e).toBeInstanceOf(GhAppError);
      expect(e).toMatchObject({ code, status, message: `${code} status=${status}` });
    }
  });
});

describe('the cache', () => {
  it('one mint per isolate until 5 min before expiry; a cold isolate reads the store; then a new one', async () => {
    const f = minted(), s = store();
    const get = (now: number) => appToken(cfg, N, { now, store: s, fetch: f as never });
    expect((await get(NOW)).token).toBe('ghs_test');
    expect((await get(NOW + 30 * 60_000)).token).toBe('ghs_test');
    expect([f.mock.calls.length, s.puts]).toEqual([1, 1]);
    expect(s.v).toMatchObject({ token: 'ghs_test', expiresAt: NOW + 3_600_000 });
    forgetTokens();   // a cold isolate
    expect((await get(NOW + 40 * 60_000)).token).toBe('ghs_test');
    expect(f.mock.calls.length).toBe(1);
    await get(NOW + 3_600_000 - MARGIN_MS);   // inside the margin: minted again
    expect([f.mock.calls.length, s.puts]).toEqual([2, 2]);
  });

  it('concurrent asks mint once; another narrowing or installation is another token; a failing store is skipped', async () => {
    const f = minted();
    const broken = { get: async () => { throw new Error('x'); }, put: async () => { throw new Error('x'); } };
    await Promise.all([1, 2, 3].map(() => appToken(cfg, N, { now: NOW, store: broken, fetch: f as never })));
    expect(f.mock.calls.length).toBe(1);
    await appToken(cfg, { repositories: ['fitness-archive'], permissions: { contents: 'write' } }, { now: NOW, fetch: f as never });
    await appToken({ ...cfg, installationId: '988' }, N, { now: NOW, fetch: f as never });
    expect(f.mock.calls.length).toBe(3);
  });

  it('a stored token for another key or expiring is not used', async () => {
    const f = minted(), s = store();
    s.v = { k: 'other', token: 'old', expiresAt: NOW + 3_600_000 };
    expect((await appToken(cfg, N, { now: NOW, store: s, fetch: f as never })).token).toBe('ghs_test');
    forgetTokens();
    s.v = { ...(s.v as object), token: 'old', expiresAt: NOW + MARGIN_MS };
    expect((await appToken(cfg, N, { now: NOW, store: s, fetch: f as never })).token).toBe('ghs_test');
    expect(f.mock.calls.length).toBe(2);
  });
});

describe('ghAuth: the App’s token, else null', () => {
  it('the App’s token when set', async () => {
    expect(await ghAuth(cfg, N, { now: NOW, fetch: minted() as never })).toEqual({ token: 'ghs_test', by: 'app' });
  });

  it('the App not (fully) set: null, nothing asked', async () => {
    const f = minted();
    expect(await ghAuth({ ...cfg, key: undefined }, N, { now: NOW, fetch: f as never })).toBeNull();
    expect(await ghAuth({ key: ' ' }, N, { now: NOW, fetch: f as never })).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });

  it('a failed mint: one warn line (codes only), null', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await ghAuth(cfg, N, { now: NOW, fetch: minted(404) as never })).toBeNull();
    expect(await ghAuth({ ...cfg, key: 'junk' }, N, { now: NOW, fetch: minted() as never })).toBeNull();
    expect(warn.mock.calls).toEqual([['gh-app mint failed code=install_missing status=404'], ['gh-app mint failed code=key_bad status=0']]);
  });
});
