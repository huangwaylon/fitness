// Thin JSON fetch helpers for the Island Fund API (session cookie auth).

export interface ApiResult<T = unknown> {
  ok: boolean;
  status: number;
  data: T | null;
  /** Network failure (no response at all). */
  offline?: boolean;
}

export class Unauthorized extends Error {
  constructor() {
    super('unauthorized');
  }
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

export async function getJSON<T>(path: string): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, { credentials: 'same-origin', headers: { accept: 'application/json' } });
    return { ok: res.ok, status: res.status, data: await parse<T>(res) };
  } catch {
    return { ok: false, status: 0, data: null, offline: true };
  }
}

export async function postJSON<T = unknown>(path: string, body?: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: body === undefined ? '{}' : JSON.stringify(body)
    });
    return { ok: res.ok, status: res.status, data: await parse<T>(res) };
  } catch {
    return { ok: false, status: 0, data: null, offline: true };
  }
}
