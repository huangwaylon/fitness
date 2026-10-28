// Request guard used by hooks.server.ts: authentication, CSRF origin check, rate limits, body caps, security headers.
import { createHash } from 'node:crypto';
import type { Db } from '#lib/server/db/index.ts';
import {
  SESSION_COOKIE, SESSION_MAX_AGE_S, bearerFrom, devDevice, devPerson, findDevice, sha256, touchDevice,
  type AuthedDevice, type DeviceKind
} from '#lib/server/auth.ts';
import { LIMITS, hit } from '#lib/server/ratelimit.ts';
import { allowedOrigins } from '#lib/server/cors.ts';
import { BODY_CAP, errorJson } from '#lib/server/http.ts';

/** The subset of SvelteKit's RequestEvent the guard needs (keeps it testable without the framework). */
export interface GuardEvent {
  request: Request;
  url: URL;
  locals: { person: 'A' | 'B' | null; deviceId: number | null };
  cookies: {
    get(name: string): string | undefined;
    set(name: string, value: string, opts: Record<string, unknown> & { path: string }): void;
  };
  getClientAddress(): string;
}

export interface GuardOptions { db: () => Db; dev?: boolean }

type Zone = 'ingest' | 'presence' | 'pair' | 'api' | 'page';

function zoneOf(path: string): Zone {
  if (path.startsWith('/ingest/')) return 'ingest';
  if (path === '/api/presence') return 'presence';
  if (path === '/api/pair') return 'pair';
  if (path === '/api' || path.startsWith('/api/')) return 'api';
  return 'page';
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function clientIp(event: GuardEvent): string {
  try {
    return event.getClientAddress();
  } catch {
    return 'unknown';
  }
}

export const sessionCookieOptions = {
  path: '/', httpOnly: true, secure: true, sameSite: 'strict' as const, maxAge: SESSION_MAX_AGE_S
};

const unauthorized = () => errorJson(401, 'unauthorized');

/** Authenticate + authorize. Returns a Response to short-circuit, or null to continue. */
export async function guard(event: GuardEvent, opts: GuardOptions): Promise<Response | null> {
  const { request, url, locals } = event;
  locals.person = null;
  locals.deviceId = null;
  // Classify on the decoded path: SvelteKit matches routes after decoding, so `/%61pi/…` must not skip the guard.
  let path: string;
  try {
    path = decodeURIComponent(url.pathname);
  } catch {
    return errorJson(400, 'bad_path');
  }
  const zone = zoneOf(path);
  const method = request.method.toUpperCase();
  const ip = clientIp(event);

  // Body caps (the streaming cap is enforced again in readText for chunked bodies).
  const len = Number(request.headers.get('content-length') ?? '0');
  if (len > (zone === 'ingest' ? BODY_CAP.ingest : BODY_CAP.default)) return errorJson(413, 'payload_too_large');

  if (zone === 'page') {
    const dev = cookieDevice(event, opts);
    if (dev) setLocals(event, dev);
    return null;
  }

  if (zone === 'ingest' || zone === 'presence') {
    // Machine endpoints: bearer token only, never the cookie.
    let token = bearerFrom(request.headers.get('authorization'));
    if (!token && zone === 'presence' && method === 'POST') token = await tokenFromBody(request);
    const limitKey = token ? `tok:${sha256(token).slice(0, 16)}` : `ip:${ip}`;
    if (!hit(`${zone}:${limitKey}`, zone === 'ingest' ? LIMITS.ingest : LIMITS.api)) return errorJson(429, 'rate_limited');
    // The phone's Shortcuts token covers both Health sync and the gym Arrive/Leave Shortcuts.
    const kinds: DeviceKind[] = ['shortcut'];
    let dev = token ? findDevice(opts.db(), token, kinds) : null;
    if (!dev && !token && opts.dev) {
      const p = devPerson();
      if (p) dev = devDevice(opts.db(), p);
    }
    if (!dev) return unauthorized();
    touchDevice(opts.db(), dev.id);
    setLocals(event, dev);
    return null;
  }

  if (zone === 'pair') {
    if (method !== 'POST') return null; // let the route 405
    if (!hit(`pair:${ip}`, LIMITS.pair)) return errorJson(429, 'rate_limited');
    if (!originOk(event)) return errorJson(403, 'bad_origin');
    return null;
  }

  // Other /api/*: session cookie or pwa bearer session (+ Origin check on unsafe methods). Authenticate first, then rate-limit per
  // device: behind Funnel every request shares one IP, so an IP limit would let strangers lock both of us out.
  // The GitHub Pages UI can't use the cookie (cross-site), so it sends its pairing session as a bearer token.
  // Only 'pwa' sessions count here; the phone's Shortcuts tokens never open /api/*.
  const auth = request.headers.get('authorization');
  let dev: AuthedDevice | null;
  if (auth) {
    const token = bearerFrom(auth);
    dev = token ? findDevice(opts.db(), token, ['pwa']) : null;
    if (dev) touchDevice(opts.db(), dev.id);
  } else {
    dev = cookieDevice(event, opts, { refresh: false });
  }
  if (!dev) return hit(`api:anon:${ip}`, LIMITS.api) ? unauthorized() : errorJson(429, 'rate_limited');
  if (!hit(`api:dev:${dev.id}`, LIMITS.api)) return errorJson(429, 'rate_limited');
  if (!SAFE_METHODS.has(method) && !originOk(event)) return errorJson(403, 'bad_origin');
  setLocals(event, dev);
  return null;
}

function setLocals(event: GuardEvent, dev: AuthedDevice) {
  event.locals.person = dev.person;
  event.locals.deviceId = dev.id;
}

function originOk(event: GuardEvent): boolean {
  const origin = event.request.headers.get('origin');
  return origin !== null && (origin === event.url.origin || allowedOrigins().has(origin));
}

function cookieDevice(event: GuardEvent, opts: GuardOptions, { refresh = true } = {}): AuthedDevice | null {
  const secret = event.cookies.get(SESSION_COOKIE);
  const db = opts.db();
  if (secret) {
    const dev = findDevice(db, secret, ['pwa']);
    if (dev) {
      // Rolling cookie: re-issue on page loads so a device used daily never hits the 1-year expiry.
      if (refresh) event.cookies.set(SESSION_COOKIE, secret, sessionCookieOptions);
      touchDevice(db, dev.id);
      return dev;
    }
  }
  const p = opts.dev ? devPerson() : null;
  return p ? devDevice(db, p) : null;
}

async function tokenFromBody(request: Request): Promise<string | null> {
  try {
    const text = await request.clone().text();
    if (text.length > BODY_CAP.default) return null;
    const body = JSON.parse(text) as { token?: unknown };
    return typeof body?.token === 'string' ? body.token : null;
  } catch {
    return null;
  }
}

// ---- Security headers ----

const BASE_HEADERS: Record<string, string> = {
  'strict-transport-security': 'max-age=31536000',
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'cross-origin-opener-policy': 'same-origin'
};

function csp(scriptHashes: string[]): string {
  return [
    "default-src 'self'",
    `script-src 'self'${scriptHashes.map((h) => ` '${h}'`).join('')}`,
    "style-src 'self' 'unsafe-inline'", // Svelte transitions inject <style> at runtime
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "manifest-src 'self'",
    "worker-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ].join('; ');
}

const INLINE_SCRIPT = /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi;

/** Add security headers. For HTML, hash SvelteKit's inline bootstrap scripts into script-src (unless the app set its own CSP). */
export async function secureResponse(response: Response, opts: { dev?: boolean } = {}): Promise<Response> {
  let res = response;
  const type = res.headers.get('content-type') ?? '';
  let policy: string | null = null;
  if (!opts.dev && !res.headers.has('content-security-policy')) {
    if (type.includes('text/html') && res.body) {
      const html = await res.text();
      const hashes = [...html.matchAll(INLINE_SCRIPT)]
        .map((m) => m[1])
        .filter((s) => s.trim().length > 0)
        .map((s) => `sha256-${createHash('sha256').update(s, 'utf8').digest('base64')}`);
      policy = csp(hashes);
      res = new Response(html, { status: res.status, statusText: res.statusText, headers: new Headers(res.headers) });
    } else {
      policy = csp([]);
    }
  }
  try {
    for (const [k, v] of Object.entries(BASE_HEADERS)) if (!res.headers.has(k)) res.headers.set(k, v);
    if (policy) res.headers.set('content-security-policy', policy);
  } catch {
    // Immutable headers (e.g. a fetched Response): copy.
    const headers = new Headers(res.headers);
    for (const [k, v] of Object.entries(BASE_HEADERS)) if (!headers.has(k)) headers.set(k, v);
    if (policy) headers.set('content-security-policy', policy);
    res = new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  }
  return res;
}
