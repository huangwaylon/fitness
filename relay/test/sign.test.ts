import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { PLACES_LABEL, SIGN_LABEL, SIGN_WINDOW_MS, adminSecret, adminSig, placesSecret, verifyAdmin } from '../src/sign.ts';

const KEY_A = 'a1'.repeat(16);
const KEY_B = 'b2'.repeat(16);
const keys = { KEY_A, KEY_B };
const body = JSON.stringify({ what: 'ingest', who: 'A', at: '2026-11-01T01:02:03.456Z', rev: 'mhf0a1b2c3' });
const now = 1_793_000_000_000;
const hex = (key: string, msg: string) => createHmac('sha256', key).update(msg).digest('hex');

describe('the admin secret', () => {
  it('is HMAC-SHA256 of the label under "keyA:keyB" (what relay/scripts/admin.ts computes)', async () => {
    expect(await adminSecret(keys)).toBe(hex(`${KEY_A}:${KEY_B}`, SIGN_LABEL));
    expect(await adminSecret({ KEY_A: ` ${KEY_A.toUpperCase()}\n`, KEY_B })).toBe(await adminSecret(keys));
  });

  it('needs both keys', async () => {
    expect(await adminSecret({ KEY_A })).toBeNull();
    expect(await adminSecret({ KEY_A: '', KEY_B })).toBeNull();
  });
});

describe('a signed /admin request', () => {
  const signed = async (t: number, b = body, k: { KEY_A: string; KEY_B: string } = keys) => adminSig((await adminSecret(k))!, String(t), b);

  it('is accepted within the window', async () => {
    expect(await verifyAdmin(keys, String(now), await signed(now), body, now)).toBe('admin');
    expect(await verifyAdmin(keys, String(now), await signed(now), body, now + SIGN_WINDOW_MS)).toBe('admin');
    expect(hex((await adminSecret(keys))!, `${now}.${body}`)).toBe(await signed(now));
  });

  it('is refused when old, early, tampered, signed with other keys, or malformed', async () => {
    const sig = await signed(now);
    expect(await verifyAdmin(keys, String(now), sig, body, now + SIGN_WINDOW_MS + 1)).toBeNull();
    expect(await verifyAdmin(keys, String(now), sig, body, now - SIGN_WINDOW_MS - 1)).toBeNull();
    expect(await verifyAdmin(keys, String(now), sig, body.replace('"A"', '"B"'), now)).toBeNull();
    expect(await verifyAdmin(keys, String(now + 1), sig, body, now)).toBeNull();
    expect(await verifyAdmin(keys, String(now), await signed(now, body, { KEY_A, KEY_B: 'c3'.repeat(16) }), body, now)).toBeNull();
    expect(await verifyAdmin(keys, null, sig, body, now)).toBeNull();
    expect(await verifyAdmin(keys, String(now), null, body, now)).toBeNull();
    expect(await verifyAdmin(keys, 'soon', sig, body, now)).toBeNull();
    expect(await verifyAdmin(keys, String(now), sig.toUpperCase(), body, now)).toBeNull();
    expect(await verifyAdmin({ KEY_A }, String(now), sig, body, now)).toBeNull();
  });
});

describe('the places secret (PLACES_KEY)', () => {
  const PLACES_KEY = 'd4'.repeat(32);
  const all = { ...keys, PLACES_KEY };

  it('is HMAC-SHA256 of its own label under PLACES_KEY (what relay/scripts/admin.ts computes); off when unset or short', async () => {
    expect(await placesSecret(all)).toBe(hex(PLACES_KEY, PLACES_LABEL));
    expect(await placesSecret({ PLACES_KEY: ` ${PLACES_KEY.toUpperCase()}\n` })).toBe(await placesSecret(all));
    expect(await placesSecret(keys)).toBeNull();
    expect(await placesSecret({ PLACES_KEY: '' })).toBeNull();
    expect(await placesSecret({ PLACES_KEY: 'd4'.repeat(15) })).toBeNull();
  });

  it("signs as `places`, never as `admin`; refused when unset, stale or tampered", async () => {
    const sig = await adminSig((await placesSecret(all))!, String(now), body);
    expect(await verifyAdmin(all, String(now), sig, body, now)).toBe('places');
    expect(await verifyAdmin({ PLACES_KEY }, String(now), sig, body, now)).toBe('places');
    expect(await verifyAdmin(keys, String(now), sig, body, now)).toBeNull();
    expect(await verifyAdmin(all, String(now), sig, body, now + SIGN_WINDOW_MS + 1)).toBeNull();
    expect(await verifyAdmin(all, String(now), sig, body.replace('"A"', '"B"'), now)).toBeNull();
    // the member keys' signature is still `admin` with PLACES_KEY set
    expect(await verifyAdmin(all, String(now), await adminSig((await adminSecret(keys))!, String(now), body), body, now)).toBe('admin');
  });
});
