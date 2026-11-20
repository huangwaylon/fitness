// The visitor's read (sync/shareRead.ts): the body is the token alone (and `self` when paired), never a key; text/plain
// with no credentials; the relay's replies read through contract/share.ts; a 429 is busy; a network failure, a timeout
// or an answer not ours is offline (the page's もう一度).
import { describe, expect, it, vi } from 'vitest';
import { shareRead } from './shareRead.ts';

const T = 'abcdefghijklmnopqrstuv';
const URL = 'https://relay.test/share';
const answer = (body: unknown, status = 200) => vi.fn(async (_u: RequestInfo | URL, _i?: RequestInit) => new Response(JSON.stringify(body), { status }));

describe('shareRead', () => {
  it('posts the token as text/plain, no key, no credentials; `self` only when paired', async () => {
    const f = answer({ ok: true, kind: 'trip', ref: 'nz', exp: '2027-11-20T00:00:00.000Z', data: {} });
    expect(await shareRead(T, false, f, URL)).toEqual({ ok: true, kind: 'trip', ref: 'nz', exp: '2027-11-20T00:00:00.000Z', data: {} });
    const [u, init] = f.mock.calls[0];
    expect(u).toBe(URL);
    expect(init?.method).toBe('POST');
    expect((init?.headers as Record<string, string>)['Content-Type']).toMatch(/^text\/plain/);
    expect(init?.credentials).toBe('omit');
    expect(JSON.parse(String(init?.body))).toEqual({ t: T });
    expect(String(init?.body)).not.toContain('a'.repeat(32));
    await shareRead(T, true, f, URL);
    expect(JSON.parse(String(f.mock.calls[1][1]?.body))).toEqual({ t: T, self: true });
  });
  it('gone (off / expired), busy (the reply or a 429)', async () => {
    expect(await shareRead(T, false, answer({ ok: false, error: 'gone', why: 'off' }), URL)).toEqual({ ok: false, error: 'gone', why: 'off' });
    expect(await shareRead(T, false, answer({ ok: false, error: 'gone', why: 'expired', exp: 'e' }), URL)).toEqual({ ok: false, error: 'gone', why: 'expired', exp: 'e' });
    expect(await shareRead(T, false, answer({ ok: false, error: 'busy' }, 429), URL)).toEqual({ ok: false, error: 'busy' });
    expect(await shareRead(T, false, answer('<html>', 429), URL)).toEqual({ ok: false, error: 'busy' });
  });
  it('offline: a network failure, an answer not ours, a ref not a trip, no relay', async () => {
    const off = { ok: false, error: 'offline' };
    expect(await shareRead(T, false, vi.fn(async () => { throw new TypeError('Failed to fetch'); }), URL)).toEqual(off);
    expect(await shareRead(T, false, vi.fn(async () => new Response('<html>bad gateway</html>', { status: 502 })), URL)).toEqual(off);
    expect(await shareRead(T, false, answer({ ok: true, kind: 'trip', ref: 'mars', exp: 'e', data: {} }), URL)).toEqual(off);
    expect(await shareRead(T, false, answer({}), '')).toEqual(off);
  });
});
