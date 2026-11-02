// The old /push/* routes answer 410 Gone (relay/src/pushGone.ts): an app build from before notifications were removed
// fails quietly.
import { describe, expect, it } from 'vitest';
import { isOldPushPath, pushGone } from '../src/pushGone.ts';

const ORIGIN = 'https://huangwaylon.github.io';
const req = (method: string, origin: string | null = ORIGIN) =>
  new Request('https://relay.test/push/goal', { method, headers: origin ? { Origin: origin } : {}, ...(method === 'POST' ? { body: '{"key":"x"}' } : {}) });

describe('the old /push/* routes', () => {
  it('are the three old paths (and anything under /push)', () => {
    expect(['/push/subscribe', '/push/unsubscribe', '/push/goal', '/push'].every(isOldPushPath)).toBe(true);
    expect(['/room', '/api', '/notify', '/pushy', '/health'].some(isOldPushPath)).toBe(false);
  });

  it('a POST from the page gets 410 with CORS, so the old app reads it and gives up', async () => {
    const res = pushGone(req('POST'), ORIGIN);
    expect(res.status).toBe(410);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
    expect(await res.json()).toEqual({ ok: false, error: 'gone' });
  });

  it('a preflight is answered; a foreign origin gets no CORS', () => {
    expect(pushGone(req('OPTIONS'), ORIGIN).status).toBe(204);
    const foreign = pushGone(req('POST', 'https://evil.example'), ORIGIN);
    expect(foreign.status).toBe(410);
    expect(foreign.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });
});
