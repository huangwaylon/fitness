// A request's body read no further than a bound (the relay's STT upload, the bots' Workers' JSON): refused by its
// Content-Length, or (without one, or a lying one) as soon as the stream passes it, never read whole first.

/** The body's bytes (a request's, or a fetch's answer: hikeRoute.ts), at most `max` (more: null). */
export async function readCapped(req: Pick<Request, 'headers' | 'body'>, max: number): Promise<Uint8Array | null> {
  if (Number(req.headers.get('Content-Length') ?? 0) > max) return null;
  if (!req.body) return new Uint8Array(0);
  const reader = req.body.getReader(), parts: Uint8Array[] = [];
  let n = 0;
  for (let r = await reader.read(); !r.done; r = await reader.read()) {
    n += r.value.byteLength;
    if (n > max) {
      void reader.cancel().catch(() => {});
      return null;
    }
    parts.push(r.value);
  }
  const out = new Uint8Array(n);
  parts.reduce((at, p) => (out.set(p, at), at + p.byteLength), 0);
  return out;
}

/** The body as text, at most `maxChars` characters (read to 4 bytes a character at most: UTF-8's widest), or null. */
export async function textCapped(req: Request, maxChars: number): Promise<string | null> {
  const b = await readCapped(req, maxChars * 4);
  if (!b) return null;
  const text = new TextDecoder().decode(b);
  return text.length > maxChars ? null : text;
}

/** The body as JSON, at most `max` bytes, or why not. @public (gym/src, its/worker) */
export async function jsonCapped(req: Request, max: number): Promise<{ ok: true; json: unknown } | { ok: false; why: 'too_large' | 'not_json' }> {
  const b = await readCapped(req, max);
  if (!b) return { ok: false, why: 'too_large' };
  try {
    return { ok: true, json: JSON.parse(new TextDecoder().decode(b)) };
  } catch {
    return { ok: false, why: 'not_json' };
  }
}

/** A caller's X-Request-Id when `valid`, else one made up (`w-` and 8 hex): never the header as sent. @public (gym/src, its/worker) */
export const requestId = (req: Request, valid: (x: string | null) => boolean): string => {
  const sent = req.headers.get('X-Request-Id');
  return sent !== null && valid(sent) ? sent : `w-${crypto.randomUUID().slice(0, 8)}`;
};
