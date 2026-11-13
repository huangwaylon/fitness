// The receiving side of Web Push, for the tests: decrypting as a browser does (RFC 8291), a phone's subscription keys,
// a VAPID pair, and a fake push service that checks a request as Apple's does (the VAPID JWT verified with the key it
// names, its audience and expiry; aes128gcm; TTL, Urgency, Topic) and decrypts the message with the phone's keys.
import { b64url, ecdhWith, unb64url, type Vapid } from '../src/webpush.ts';

/** Decrypt as the browser would (RFC 8291 from the receiving side), to round-trip our own messages. */
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
  if (plain.at(-1) !== 2) throw new Error('not the last record');   // RFC 8188's delimiter
  return new TextDecoder().decode(plain.slice(0, -1));
}

/** A fresh VAPID pair, as scripts/vapid-keys.ts makes one, with its public CryptoKey. */
export async function vapidPair(subject = 'https://island-fund.pages.dev'): Promise<Vapid & { key: CryptoKey }> {
  const kp = (await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])) as CryptoKeyPair;
  const publicKey = b64url(new Uint8Array((await crypto.subtle.exportKey('raw', kp.publicKey)) as ArrayBuffer));
  return { publicKey, privateKey: ((await crypto.subtle.exportKey('jwk', kp.privateKey)) as JsonWebKey).d!, subject, key: kp.publicKey };
}

/** A phone's subscription keys (what PushManager makes): an ECDH pair and a 16-byte auth secret. */
export async function phoneKeys() {
  const kp = (await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])) as CryptoKeyPair;
  const pub = new Uint8Array((await crypto.subtle.exportKey('raw', kp.publicKey)) as ArrayBuffer);
  const d = unb64url(((await crypto.subtle.exportKey('jwk', kp.privateKey)) as JsonWebKey).d!);
  const auth = crypto.getRandomValues(new Uint8Array(16));
  return { p256dh: b64url(pub), auth: b64url(auth), pub, d, authBytes: auth };
}

export type Phone = Awaited<ReturnType<typeof phoneKeys>> & { endpoint: string };

/** What the fake push service took: per request, the endpoint, the headers it checked, the JWT's claims, the message. */
interface Delivered { endpoint: string; ttl: number; urgency: string | null; topic: string | null; claims: { aud: string; exp: number; sub: string }; message: unknown }

/** A push service at `https://<host>/…` for these phones: answers `answer(endpoint)` (201 by default) to a request
 *  whose VAPID JWT verifies with `vapidPublic` (else 403 BadJwtToken, as Apple does), whose audience is the origin and
 *  whose expiry is within a day; the body decrypted with the phone's keys. */
export function fakePushService(vapidPublic: string, phones: Phone[], answer: (endpoint: string) => Response | Promise<Response> = () => new Response(null, { status: 201 })) {
  const delivered: Delivered[] = [];
  const refused: string[] = [];
  const no = (reason: string, status = 400) => {
    refused.push(reason);
    return new Response(JSON.stringify({ reason }), { status });
  };
  const fetch = async (req: Request): Promise<Response> => {
    const phone = phones.find((p) => p.endpoint === req.url);
    if (!phone) return no('NotFound', 404);
    const m = /^vapid t=([\w-]+)\.([\w-]+)\.([\w-]+), k=([\w-]+)$/.exec(req.headers.get('Authorization') ?? '');
    if (!m || m[4] !== vapidPublic) return no('BadJwtToken', 403);
    const key = await crypto.subtle.importKey('raw', unb64url(m[4]), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, unb64url(m[3]), new TextEncoder().encode(`${m[1]}.${m[2]}`));
    const claims = JSON.parse(new TextDecoder().decode(unb64url(m[2])));
    const now = Date.now() / 1000;
    if (!ok || claims.aud !== new URL(req.url).origin || !(claims.exp > now && claims.exp <= now + 24 * 3600) || !/^(mailto:|https:)/.test(claims.sub)) return no('BadJwtToken', 403);
    if (req.headers.get('Content-Encoding') !== 'aes128gcm' || !/^\d+$/.test(req.headers.get('TTL') ?? '')) return no('BadRequest');
    const text = await decrypt(new Uint8Array(await req.arrayBuffer()), phone.pub, phone.d, phone.authBytes);
    delivered.push({ endpoint: req.url, ttl: Number(req.headers.get('TTL')), urgency: req.headers.get('Urgency'), topic: req.headers.get('Topic'), claims, message: JSON.parse(text) });
    return answer(req.url);
  };
  return { fetch, delivered, refused };
}
