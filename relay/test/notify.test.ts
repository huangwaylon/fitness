import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { NOTIFY_LABEL, NOTIFY_WINDOW_MS, notifySecret, notifySig, twice, verifyNotify } from '../src/notify.ts';

const KEY_A = 'a1'.repeat(16);
const KEY_B = 'b2'.repeat(16);
const keys = { KEY_A, KEY_B };
const body = JSON.stringify({ what: 'ingest', who: 'A', at: '2026-11-01T01:02:03.456Z', rev: 'mhf0a1b2c3' });
const now = 1_793_000_000_000;
const hex = (key: string, msg: string) => createHmac('sha256', key).update(msg).digest('hex');

describe('the notify secret', () => {
  it('is HMAC-SHA256 of the label under "keyA:keyB" (what relay/scripts/admin.ts computes)', async () => {
    expect(await notifySecret(keys)).toBe(hex(`${KEY_A}:${KEY_B}`, NOTIFY_LABEL));
    expect(await notifySecret({ KEY_A: ` ${KEY_A.toUpperCase()}\n`, KEY_B })).toBe(await notifySecret(keys));
  });

  it('needs both keys', async () => {
    expect(await notifySecret({ KEY_A })).toBeNull();
    expect(await notifySecret({ KEY_A: '', KEY_B })).toBeNull();
  });
});

describe('a signed notify', () => {
  const signed = async (t: number, b = body, k: { KEY_A: string; KEY_B: string } = keys) => notifySig((await notifySecret(k))!, String(t), b);

  it('is accepted within the window', async () => {
    expect(await verifyNotify(keys, String(now), await signed(now), body, now)).toBe(true);
    expect(await verifyNotify(keys, String(now), await signed(now), body, now + NOTIFY_WINDOW_MS)).toBe(true);
    expect(hex((await notifySecret(keys))!, `${now}.${body}`)).toBe(await signed(now));
  });

  it('is refused when old, early, tampered, signed with other keys, or malformed', async () => {
    const sig = await signed(now);
    expect(await verifyNotify(keys, String(now), sig, body, now + NOTIFY_WINDOW_MS + 1)).toBe(false);
    expect(await verifyNotify(keys, String(now), sig, body, now - NOTIFY_WINDOW_MS - 1)).toBe(false);
    expect(await verifyNotify(keys, String(now), sig, body.replace('"A"', '"B"'), now)).toBe(false);
    expect(await verifyNotify(keys, String(now + 1), sig, body, now)).toBe(false);
    expect(await verifyNotify(keys, String(now), await signed(now, body, { KEY_A, KEY_B: 'c3'.repeat(16) }), body, now)).toBe(false);
    expect(await verifyNotify(keys, null, sig, body, now)).toBe(false);
    expect(await verifyNotify(keys, String(now), null, body, now)).toBe(false);
    expect(await verifyNotify(keys, 'soon', sig, body, now)).toBe(false);
    expect(await verifyNotify(keys, String(now), sig.toUpperCase(), body, now)).toBe(false);
    expect(await verifyNotify({ KEY_A }, String(now), sig, body, now)).toBe(false);
  });
});

describe('twice', () => {
  it('tries a failed call once more, then gives up with its error', async () => {
    let n = 0;
    expect(await twice(async () => (++n === 1 ? Promise.reject(new Error('reset')) : 'ok'))).toBe('ok');
    expect(n).toBe(2);
    n = 0;
    await expect(twice(async () => (++n, Promise.reject(new Error(`no ${n}`))))).rejects.toThrow('no 2');
  });
});
