// The bots' Workers' body cap (src/body.ts, gym/ and its/worker): JSON at most `max` bytes, refused by its
// Content-Length or as soon as a stream passes it; a caller's request id only when valid.
import { describe, expect, it } from 'vitest';
import { jsonCapped, requestId } from '../src/body.ts';

const post = (body: BodyInit, h: Record<string, string> = {}) => new Request('https://bot/act', { method: 'POST', body, headers: h });

describe('jsonCapped', () => {
  it('reads JSON within the bound; not JSON, or over it by Content-Length, is refused', async () => {
    expect(await jsonCapped(post('{"a":1}'), 16)).toEqual({ ok: true, json: { a: 1 } });
    expect(await jsonCapped(post('{"a":'), 16)).toEqual({ ok: false, why: 'not_json' });
    expect(await jsonCapped(post('{"a":1}', { 'Content-Length': '99' }), 16)).toEqual({ ok: false, why: 'too_large' });
  });

  it('a body with no Content-Length (streamed) is read no further than the bound', async () => {
    let pulled = 0;
    const body = new ReadableStream<Uint8Array>({ pull: (c) => void (pulled++ < 100 ? c.enqueue(new Uint8Array(10).fill(32)) : c.close()) });
    const req = new Request('https://bot/act', { method: 'POST', body, duplex: 'half' } as RequestInit);
    expect(await jsonCapped(req, 50)).toEqual({ ok: false, why: 'too_large' });
    expect(pulled).toBeLessThan(10);
  });
});

describe('requestId', () => {
  it('the caller’s when valid, else a made-up one', () => {
    const ok = (x: string | null) => x === 'r1';
    expect(requestId(new Request('https://bot/', { headers: { 'X-Request-Id': 'r1' } }), ok)).toBe('r1');
    expect(requestId(new Request('https://bot/', { headers: { 'X-Request-Id': '<x>' } }), ok)).toMatch(/^w-[0-9a-f]{8}$/);
  });
});
