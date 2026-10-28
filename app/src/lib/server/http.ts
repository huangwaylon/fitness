// JSON helpers: error responses, size-capped body reading, zod validation.
import type { z } from 'zod';

export const BODY_CAP = { ingest: 20 * 1024 * 1024, default: 64 * 1024 } as const;

export class HttpError extends Error {
  status: number;
  code: string;
  extra: Record<string, unknown>;
  constructor(status: number, code: string, extra: Record<string, unknown> = {}) {
    super(code);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers }
  });
}

export function errorJson(status: number, code: string, extra: Record<string, unknown> = {}): Response {
  return json({ error: code, ...extra }, status);
}

/** Read the body as text, aborting once it exceeds `cap` bytes. */
export async function readText(request: Request, cap: number = BODY_CAP.default): Promise<string> {
  const len = Number(request.headers.get('content-length') ?? '0');
  if (len > cap) throw new HttpError(413, 'payload_too_large');
  if (!request.body) return '';
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > cap) {
      await reader.cancel();
      throw new HttpError(413, 'payload_too_large');
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export async function readJson<S extends z.ZodType>(request: Request, schema: S, cap: number = BODY_CAP.default): Promise<z.infer<S>> {
  const text = await readText(request, cap);
  let raw: unknown;
  try {
    raw = text ? JSON.parse(text) : {};
  } catch {
    throw new HttpError(400, 'invalid_json');
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw new HttpError(400, 'invalid_body', { issues: parsed.error.issues.map((i) => i.path.join('.') || '(root)') });
  return parsed.data;
}

/** Wrap a route handler so HttpErrors become JSON and unknown errors become a bare 500. */
export function handle<E>(fn: (event: E) => Promise<Response> | Response): (event: E) => Promise<Response> {
  return async (event) => {
    try {
      return await fn(event);
    } catch (e) {
      if (e instanceof HttpError) return errorJson(e.status, e.code, e.extra);
      console.error('[api] unhandled', e instanceof Error ? e.message : e);
      return errorJson(500, 'internal');
    }
  };
}

export function requirePerson(locals: { person: 'A' | 'B' | null }): 'A' | 'B' {
  if (!locals.person) throw new HttpError(401, 'unauthorized');
  return locals.person;
}
