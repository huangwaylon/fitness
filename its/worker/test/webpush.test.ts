// Web Push's sender (src/webpush.ts): RFC 8291's message encryption against its Appendix A vector byte for byte and
// decrypted back from the receiving side, RFC 8292's VAPID JWT verified with the public key, the request's headers
// (TTL, Urgency, Topic), the plaintext bound, and the imported key and per-audience JWT kept for reuse.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MAX_PLAINTEXT, b64url, encryptPush, pushRequest, senderKeys, unb64url, vapidAuth } from '../src/webpush.ts';
import { decrypt, vapidPair } from './pushKit.ts';

// RFC 8291 Appendix A ("Intermediate Values for Encryption").
const V = {
  plaintext: 'V2hlbiBJIGdyb3cgdXAsIEkgd2FudCB0byBiZSBhIHdhdGVybWVsb24',
  asPrivate: 'yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw',
  asPublic: 'BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8',
  uaPrivate: 'q1dXpw3UpT5VOmu_cf_v6ih07Aems3njxI-JWgLcM94',
  uaPublic: 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4',
  salt: 'DGv6ra1nlYgDCS1FRnbzlw',
  auth: 'BTBZMqHH6r4Tts7J_aSIgg',
  body:
    'DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN'
};

describe('RFC 8291 message encryption', () => {
  it('reproduces the RFC test vector byte for byte', async () => {
    const sender = await senderKeys(unb64url(V.asPublic), unb64url(V.asPrivate));
    const body = await encryptPush(unb64url(V.plaintext), unb64url(V.uaPublic), unb64url(V.auth), { salt: unb64url(V.salt), sender });
    expect(b64url(body)).toBe(V.body);
  });

  it('decrypts back on the receiving side with fresh salt and keys, and never repeats a ciphertext', async () => {
    const msg = '{"v":1,"kind":"goal","name":"うめ","date":"2026-11-01","lang":"ja"}';
    const a = await encryptPush(new Uint8Array(new TextEncoder().encode(msg)), unb64url(V.uaPublic), unb64url(V.auth));
    const b = await encryptPush(new Uint8Array(new TextEncoder().encode(msg)), unb64url(V.uaPublic), unb64url(V.auth));
    expect(b64url(a)).not.toBe(b64url(b));
    expect(new DataView(a.buffer).getUint32(16)).toBe(4096);
    expect(await decrypt(a, unb64url(V.uaPublic), unb64url(V.uaPrivate), unb64url(V.auth))).toBe(msg);
  });

  it('refuses a bad auth secret or key', async () => {
    await expect(encryptPush(new Uint8Array(1), unb64url(V.uaPublic), new Uint8Array(15))).rejects.toThrow();
    await expect(encryptPush(new Uint8Array(1), new Uint8Array(64), unb64url(V.auth))).rejects.toThrow();
  });
});

describe('VAPID (RFC 8292)', () => {
  it('signs an ES256 JWT for the endpoint origin that verifies with the public key', async () => {
    const kp = (await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])) as CryptoKeyPair;
    const pub = new Uint8Array((await crypto.subtle.exportKey('raw', kp.publicKey)) as ArrayBuffer);
    const d = ((await crypto.subtle.exportKey('jwk', kp.privateKey)) as JsonWebKey).d!;
    const v = { publicKey: b64url(pub), privateKey: d, subject: 'https://huangwaylon.github.io/fitness/' };
    const now = 1_800_000_000_000;
    const h = await vapidAuth('https://web.push.apple.com/QGuQyavXutnMH4/abc', v, now);
    const m = /^vapid t=([\w-]+)\.([\w-]+)\.([\w-]+), k=([\w-]+)$/.exec(h)!;
    expect(m).toBeTruthy();
    expect(m[4]).toBe(v.publicKey);
    const json = (s: string) => JSON.parse(new TextDecoder().decode(unb64url(s)));
    expect(json(m[1])).toEqual({ typ: 'JWT', alg: 'ES256' });
    expect(json(m[2])).toEqual({ aud: 'https://web.push.apple.com', exp: now / 1000 + 12 * 3600, sub: v.subject });
    const ok = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, kp.publicKey, unb64url(m[3]), new TextEncoder().encode(`${m[1]}.${m[2]}`));
    expect(ok).toBe(true);
  });

  it('builds the push request: encrypted body, aes128gcm, TTL, urgency', async () => {
    const kp = (await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign'])) as CryptoKeyPair;
    const v = { publicKey: b64url(new Uint8Array((await crypto.subtle.exportKey('raw', kp.publicKey)) as ArrayBuffer)), privateKey: ((await crypto.subtle.exportKey('jwk', kp.privateKey)) as JsonWebKey).d!, subject: 'mailto:x@example.com' };
    const req = await pushRequest({ endpoint: 'https://fcm.googleapis.com/fcm/send/abc', p256dh: V.uaPublic, auth: V.auth }, 'hi', v, Date.now(), { ttl: 3600 });
    expect(req.method).toBe('POST');
    expect(req.headers.get('Content-Encoding')).toBe('aes128gcm');
    expect(req.headers.get('TTL')).toBe('3600');
    expect(req.headers.get('Urgency')).toBe('normal');
    expect(req.headers.get('Topic')).toBeNull();
    expect(req.headers.get('Authorization')).toMatch(/^vapid t=/);
    const body = new Uint8Array(await req.arrayBuffer());
    expect(await decrypt(body, unb64url(V.uaPublic), unb64url(V.uaPrivate), unb64url(V.auth))).toBe('hi');
  });
});

describe('the push request’s options and bounds', () => {
  afterEach(() => vi.restoreAllMocks());
  const sub = { endpoint: 'https://web.push.apple.com/QGuQyavXutnMH4/abc', p256dh: V.uaPublic, auth: V.auth };

  it('sends Urgency and Topic when given, the TTL as whole seconds (never below 0)', async () => {
    const v = await vapidPair();
    const req = await pushRequest(sub, 'hi', v, Date.now(), { ttl: 1799.6, urgency: 'high', topic: 'abcdefghijklmnopqrstuvwxyz012345' });
    expect([req.headers.get('TTL'), req.headers.get('Urgency'), req.headers.get('Topic')]).toEqual(['1800', 'high', 'abcdefghijklmnopqrstuvwxyz012345']);
    expect((await pushRequest(sub, 'hi', v, Date.now(), { ttl: -5 })).headers.get('TTL')).toBe('0');
  });

  it('refuses a Topic that isn’t 1–32 base64url characters', async () => {
    const v = await vapidPair();
    await expect(pushRequest(sub, 'hi', v, Date.now(), { ttl: 60, topic: 'a'.repeat(33) })).rejects.toThrow(/topic/);
    await expect(pushRequest(sub, 'hi', v, Date.now(), { ttl: 60, topic: 'a b' })).rejects.toThrow(/topic/);
  });

  it('refuses a plaintext over MAX_PLAINTEXT bytes (UTF-8), takes one at the bound', async () => {
    const v = await vapidPair();
    expect(MAX_PLAINTEXT).toBe(3000);
    await expect(pushRequest(sub, 'あ'.repeat(1001), v, Date.now(), { ttl: 60 })).rejects.toThrow(/payload_too_large/);
    const req = await pushRequest(sub, 'a'.repeat(MAX_PLAINTEXT), v, Date.now(), { ttl: 60 });
    expect(await decrypt(new Uint8Array(await req.arrayBuffer()), unb64url(V.uaPublic), unb64url(V.uaPrivate), unb64url(V.auth))).toHaveLength(MAX_PLAINTEXT);
  });

  it('imports the VAPID key once and reuses an audience’s JWT for an hour, a new one after (and per audience, per key)', async () => {
    const v = await vapidPair();
    const imports = vi.spyOn(crypto.subtle, 'importKey');
    const signs = vi.spyOn(crypto.subtle, 'sign');
    const now = 1_800_000_000_000;
    const a = await vapidAuth('https://web.push.apple.com/x', v, now);
    const b = await vapidAuth('https://web.push.apple.com/y', v, now + 59 * 60_000);
    expect(b).toBe(a);
    const ecdsa = () => imports.mock.calls.filter((c) => (c[2] as { name?: string }).name === 'ECDSA').length;
    expect(ecdsa()).toBe(1);
    expect(signs).toHaveBeenCalledTimes(1);
    const other = await vapidAuth('https://fcm.googleapis.com/fcm/send/z', v, now + 60_000);
    expect(other).not.toBe(a);
    const later = await vapidAuth('https://web.push.apple.com/x', v, now + 61 * 60_000);
    expect(later).not.toBe(a);
    const exp = (h: string) => JSON.parse(new TextDecoder().decode(unb64url(h.split('.')[1]))).exp;
    expect(exp(later)).toBe((now + 61 * 60_000) / 1000 + 12 * 3600);
    expect(ecdsa()).toBe(1);
    const v2 = await vapidPair();
    const rotated = await vapidAuth('https://web.push.apple.com/x', v2, now + 61 * 60_000);
    expect(rotated).toContain(`k=${v2.publicKey}`);
    expect(ecdsa()).toBe(2);
  });
});
