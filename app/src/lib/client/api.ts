// Thin JSON fetch helpers for the Island Fund API.
// Same origin (the Mac serves the UI): the HttpOnly session cookie. GitHub Pages build: the API is another origin
// (VITE_API_BASE), where Safari drops cross-site cookies, so the session is a bearer token kept in localStorage.

const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '');
const crossOrigin = API_BASE !== '';
const SESSION_KEY = 'island.session';

export function setSession(token: string | null | undefined): void {
  if (!crossOrigin) return;
  if (token) localStorage.setItem(SESSION_KEY, token);
  else localStorage.removeItem(SESSION_KEY);
}

function headers(extra: Record<string, string>): Record<string, string> {
  const token = crossOrigin ? localStorage.getItem(SESSION_KEY) : null;
  return token ? { ...extra, authorization: `Bearer ${token}` } : extra;
}

export interface ApiResult<T = unknown> {
  ok: boolean;
  status: number;
  data: T | null;
  /** Network failure (no response at all). */
  offline?: boolean;
}

async function parse<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function call<T>(path: string, init: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(API_BASE + path, { ...init, credentials: crossOrigin ? 'omit' : 'same-origin' });
    if (res.status === 401) setSession(null);
    return { ok: res.ok, status: res.status, data: await parse<T>(res) };
  } catch {
    return { ok: false, status: 0, data: null, offline: true };
  }
}

export function getJSON<T>(path: string): Promise<ApiResult<T>> {
  return call<T>(path, { headers: headers({ accept: 'application/json' }) });
}

export function postJSON<T = unknown>(path: string, body?: unknown): Promise<ApiResult<T>> {
  return call<T>(path, {
    method: 'POST',
    headers: headers({ 'content-type': 'application/json', accept: 'application/json' }),
    body: body === undefined ? '{}' : JSON.stringify(body)
  });
}
