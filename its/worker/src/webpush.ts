// Web Push with nothing but WebCrypto (runs on Workers and in Node's vitest alike): the message encryption of RFC 8291
// (aes128gcm content coding, RFC 8188: one record) and the VAPID authorization of RFC 8292 (an ES256 JWT). No library:
// the whole of it is a few HMACs, one ECDH, one AES-GCM and one ECDSA signature, checked against RFC 8291's test
// vector (test/webpush.test.ts). With RFC 8030's Urgency and Topic, a plaintext bound, the VAPID key imported once per
// isolate and each audience's JWT reused for an hour.

const enc = new TextEncoder();

export function b64url(b: Uint8Array): string {
  let s = '';
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function unb64url(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function concat(...parts: Uint8Array[]): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

async function hmac(key: Uint8Array<ArrayBuffer>, data: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, data));
}

/** An uncompressed P-256 point (65 bytes, 0x04 ‖ x ‖ y) and its private scalar as a JWK. */
function jwk(pub: Uint8Array, d?: Uint8Array): JsonWebKey {
  if (pub.length !== 65 || pub[0] !== 4) throw new Error('not an uncompressed P-256 key');
  return { kty: 'EC', crv: 'P-256', x: b64url(pub.slice(1, 33)), y: b64url(pub.slice(33)), ...(d ? { d: b64url(d) } : {}), ext: true };
}

/** ECDH's algorithm with the peer's key. The standard member is `public` (what workerd, browsers and Node read);
 *  workers-types spells it `$public`. */
export const ecdhWith = (peer: CryptoKey) => ({ name: 'ECDH', public: peer }) as unknown as SubtleCryptoDeriveKeyAlgorithm;

/** An ECDH key pair for one message: generated, or given (the test vector's). */
export interface SenderKeys {
  pub: Uint8Array<ArrayBuffer>;
  priv: CryptoKey;
}

async function newSenderKeys(): Promise<SenderKeys> {
  const kp = (await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])) as CryptoKeyPair;
  return { pub: new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey) as ArrayBuffer), priv: kp.privateKey };
}

/** Sender keys from a raw public key and private scalar (tests: RFC 8291's vector). */
export async function senderKeys(pub: Uint8Array<ArrayBuffer>, d: Uint8Array): Promise<SenderKeys> {
  const priv = await crypto.subtle.importKey('jwk', jwk(pub, d), { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
  return { pub, priv };
}

/** The record size written in the header (the whole message is one record, far below it). */
const RS = 4096;

/**
 * RFC 8291 §3–4: encrypt `plaintext` for the subscription's `p256dh` (65-byte point) and `auth` (16 bytes). Returns the
 * request body: salt(16) ‖ rs(4) ‖ idlen(1) ‖ keyid (the sender's public key) ‖ AES-128-GCM(plaintext ‖ 0x02).
 * `salt` and `sender` are fixed only by tests.
 */
export async function encryptPush(
  plaintext: Uint8Array<ArrayBuffer>,
  p256dh: Uint8Array<ArrayBuffer>,
  auth: Uint8Array<ArrayBuffer>,
  opts: { salt?: Uint8Array<ArrayBuffer>; sender?: SenderKeys } = {}
): Promise<Uint8Array<ArrayBuffer>> {
  if (auth.length !== 16) throw new Error('auth secret must be 16 bytes');
  const salt = opts.salt ?? crypto.getRandomValues(new Uint8Array(16));
  const as = opts.sender ?? (await newSenderKeys());
  const ua = await crypto.subtle.importKey('jwk', jwk(p256dh), { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits(ecdhWith(ua), as.priv, 256));
  // §3.4: IKM = HKDF(salt = auth, ikm = ecdh, info = "WebPush: info" ‖ 0 ‖ ua_public ‖ as_public, 32)
  const prkKey = await hmac(auth, ecdh);
  const ikm = await hmac(prkKey, concat(enc.encode('WebPush: info\0'), p256dh, as.pub, new Uint8Array([1])));
  // RFC 8188 §2.2–2.3: CEK and nonce from HKDF(salt, IKM)
  const prk = await hmac(salt, ikm);
  const cek = (await hmac(prk, concat(enc.encode('Content-Encoding: aes128gcm\0'), new Uint8Array([1])))).slice(0, 16);
  const nonce = (await hmac(prk, concat(enc.encode('Content-Encoding: nonce\0'), new Uint8Array([1])))).slice(0, 12);
  const key = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const sealed = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, concat(plaintext, new Uint8Array([2]))));
  const header = new Uint8Array(21);
  new DataView(header.buffer).setUint32(16, RS);
  header.set(salt, 0);
  header[20] = as.pub.length;
  return concat(header, as.pub, sealed);
}

/** The VAPID key pair: the public key as the app's applicationServerKey (65 bytes, base64url) and its private scalar. */
export interface Vapid {
  publicKey: string;
  privateKey: string;
  /** `mailto:` or an https URL the push service can reach us at. */
  subject: string;
}

/** A VAPID JWT lives at most a day (RFC 8292 §2); ours 12 hours, reused for an hour per audience (a push service takes
 *  the same one again: one signature an hour, not one a message). */
const JWT_TTL_S = 12 * 3600;
const JWT_REUSE_MS = 3600_000;

/** The imported signing key per key pair: an isolate imports it once; a rotated pair is a new entry. */
const signingKeys = new Map<string, Promise<CryptoKey>>();
/** The JWT per key, audience and subject, with when it was made. */
const jwts = new Map<string, { at: number; header: string }>();

function signingKey(v: Vapid): Promise<CryptoKey> {
  const id = `${v.publicKey}|${v.privateKey}`;
  let k = signingKeys.get(id);
  if (!k) {
    k = crypto.subtle.importKey('jwk', jwk(unb64url(v.publicKey), unb64url(v.privateKey)), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
    k.catch(() => signingKeys.delete(id));   // a bad key isn't kept: the next push tries again (and fails the same way)
    signingKeys.set(id, k);
  }
  return k;
}

/** RFC 8292: the Authorization header for a push to `endpoint`, signed with the VAPID key, valid from `now` (ms). */
export async function vapidAuth(endpoint: string, v: Vapid, now: number): Promise<string> {
  const aud = new URL(endpoint).origin;
  const id = `${v.publicKey}|${aud}|${v.subject}`;
  const kept = jwts.get(id);
  if (kept && now >= kept.at && now - kept.at < JWT_REUSE_MS) return kept.header;
  const key = await signingKey(v);
  const part = (o: object) => b64url(enc.encode(JSON.stringify(o)));
  const unsigned = `${part({ typ: 'JWT', alg: 'ES256' })}.${part({ aud, exp: Math.floor(now / 1000) + JWT_TTL_S, sub: v.subject })}`;
  // WebCrypto's ECDSA signature is already JWS's r ‖ s (IEEE P1363), 64 bytes
  const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(unsigned)));
  const header = `vapid t=${unsigned}.${b64url(sig)}, k=${v.publicKey}`;
  jwts.set(id, { at: now, header });
  return header;
}

/** The plaintext's bound in bytes: a push service takes 4096 bytes of body, less the header (86), the tag and the
 *  delimiter; this leaves room and keeps a message short. */
export const MAX_PLAINTEXT = 3000;

/** RFC 8030 §5.2–5.4: how long the push service may hold it for an offline phone (s, rounded up), how soon to wake the
 *  phone, and a replacement key (base64url, ≤ 32 characters): a newer push with the same Topic replaces one not yet
 *  delivered. */
export interface PushOptions {
  ttl: number;
  urgency?: 'very-low' | 'low' | 'normal' | 'high';
  topic?: string;
}

/** The whole push request for one subscription. Throws on a plaintext over MAX_PLAINTEXT (`payload_too_large`), a bad
 *  topic or key: a bug of the caller's, never sent. */
export async function pushRequest(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  v: Vapid,
  now: number,
  opts: PushOptions
): Promise<Request> {
  const plain = new Uint8Array(enc.encode(payload));
  if (plain.length > MAX_PLAINTEXT) throw new RangeError(`payload_too_large (${plain.length} bytes)`);
  if (opts.topic !== undefined && !/^[A-Za-z0-9_-]{1,32}$/.test(opts.topic)) throw new RangeError('bad topic');
  const body = await encryptPush(plain, unb64url(sub.p256dh), unb64url(sub.auth));
  return new Request(sub.endpoint, {
    method: 'POST',
    headers: {
      Authorization: await vapidAuth(sub.endpoint, v, now),
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: String(Math.max(0, Math.ceil(opts.ttl))),
      Urgency: opts.urgency ?? 'normal',
      ...(opts.topic !== undefined && { Topic: opts.topic }),
    },
    body
  });
}
