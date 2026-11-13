// Web Push's sender (src/webpush.ts): RFC 8291's message encryption against its Appendix A vector byte for byte and
// decrypted back from the receiving side, RFC 8292's VAPID JWT verified with the public key, the request's headers
// (TTL, Urgency, Topic), the plaintext bound, and the imported key and per-audience JWT kept for reuse.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MAX_PLAINTEXT, b64url, ecdhWith, encryptPush, pushRequest, senderKeys, unb64url, vapidAuth, type Vapid } from '../src/webpush.ts';

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

/** Decrypt as the browser would (exported for the push tests' fake push service) (RFC 8291 from the receiving side), to round-trip our own messages. */
export async function decrypt(body: Uint8Array<ArrayBuffer>, uaPublic: Uint8Array<ArrayBuffer>, uaPrivate: Uint8Array, auth: Uint8Array<ArrayBuffer>): Promise<string> {
  const salt = body.slice(0, 16);
  const idlen = body[20];
  const asPub = body.slice(21, 21 + idlen);
  const sealed = body.slice(21 + idlen);
  const jwk = (pub: Uint8Array, d?: Uint8Array): JsonWebKey => ({ kty: 'EC', crv: 'P-256', x: b64url(pub.slice(1, 33)), y: b64url(pub.slice(33)), ...(d ? { d: b64url(d) } : {}) });
  const priv = await crypto.subtle.importKey('jwk', jwk(uaPublic, uaPrivate), { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
  const pub = await crypto.subtle.importKey('jwk', jwk(asPub), { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits(ecdhWith(pub), priv, 256));
  const h = async (k: Uint8Array<ArrayBuffer>, d: Uint8Array<ArrayBuffer>) =>
    new Uint8Array(await crypto.subtle.sign('HMAC', await crypto.subtle.importKey('raw', k, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']), d));
  const cat = (...p: Uint8Array[]) => {
    const o = new Uint8Array(p.reduce((n, x) => n + x.length, 0));
    let i = 0;
    for (const x of p) (o.set(x, i), (i += x.length));
    return o;
  };
  const te = new TextEncoder();
  const ikm = await h(await h(auth, ecdh), cat(te.encode('WebPush: info\0'), uaPublic, asPub, new Uint8Array([1])));
  const prk = await h(salt, ikm);
  const cek = (await h(prk, cat(te.encode('Content-Encoding: aes128gcm\0'), new Uint8Array([1])))).slice(0, 16);
  const nonce = (await h(prk, cat(te.encode('Content-Encoding: nonce\0'), new Uint8Array([1])))).slice(0, 12);
  const key = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['decrypt']);
  const plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce }, key, sealed));
  expect(plain.at(-1)).toBe(2); // the last record's delimiter
  return new TextDecoder().decode(plain.slice(0, -1));
}

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

/** A fresh VAPID pair, as scripts/vapid-keys.ts makes one. */
export async function vapidPair(subject = 'https://island-fund.pages.dev'): Promise<Vapid & { key: CryptoKey }> {
  const kp = (await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])) as CryptoKeyPair;
  const publicKey = b64url(new Uint8Array((await crypto.subtle.exportKey('raw', kp.publicKey)) as ArrayBuffer));
  return { publicKey, privateKey: ((await crypto.subtle.exportKey('jwk', kp.privateKey)) as JsonWebKey).d!, subject, key: kp.publicKey };
}

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
