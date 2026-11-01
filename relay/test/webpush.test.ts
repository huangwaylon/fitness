import { describe, expect, it } from 'vitest';
import { b64url, ecdhWith, encryptPush, senderKeys, unb64url, vapidAuth, pushRequest } from '../src/webpush.ts';

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

/** Decrypt as the browser would (RFC 8291 from the receiving side), to round-trip our own messages. */
async function decrypt(body: Uint8Array<ArrayBuffer>, uaPublic: Uint8Array<ArrayBuffer>, uaPrivate: Uint8Array, auth: Uint8Array<ArrayBuffer>): Promise<string> {
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
    const req = await pushRequest({ endpoint: 'https://fcm.googleapis.com/fcm/send/abc', p256dh: V.uaPublic, auth: V.auth }, 'hi', v, Date.now(), 3600);
    expect(req.method).toBe('POST');
    expect(req.headers.get('Content-Encoding')).toBe('aes128gcm');
    expect(req.headers.get('TTL')).toBe('3600');
    expect(req.headers.get('Authorization')).toMatch(/^vapid t=/);
    const body = new Uint8Array(await req.arrayBuffer());
    expect(await decrypt(body, unb64url(V.uaPublic), unb64url(V.uaPrivate), unb64url(V.auth))).toBe('hi');
  });
});
