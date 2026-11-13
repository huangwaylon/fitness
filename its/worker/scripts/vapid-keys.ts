// A new VAPID key pair for Web Push (README "Push"): prints the public key as `VAPID_PUBLIC=…` (wrangler.toml's var; the
// page reads it from the status) and writes the private scalar, never printed, to a new file of mode 600.
//   npm run vapid:keys -- ~/.config/its-bot/vapid-private
// Then: npx wrangler secret put VAPID_PRIVATE < that file. The file must not exist yet (no pair overwritten by mistake).
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { b64url } from '../src/webpush.ts';

/** A P-256 pair: the uncompressed public point (65 bytes) and the private scalar (32), base64url. */
export async function newVapidPair(): Promise<{ publicKey: string; privateKey: string }> {
  const kp = (await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])) as CryptoKeyPair;
  const publicKey = b64url(new Uint8Array((await crypto.subtle.exportKey('raw', kp.publicKey)) as ArrayBuffer));
  const privateKey = ((await crypto.subtle.exportKey('jwk', kp.privateKey)) as JsonWebKey).d!;
  return { publicKey, privateKey };
}

/** Writes the private part to `path` (created, mode 600; refused if it exists) and answers the line to print. */
export async function writeVapidPair(path: string): Promise<string> {
  const { publicKey, privateKey } = await newVapidPair();
  writeFileSync(path, `${privateKey}\n`, { mode: 0o600, flag: 'wx' });
  return `VAPID_PUBLIC=${publicKey}`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const path = process.argv[2];
  if (!path) {
    console.error('usage: npm run vapid:keys -- <file for the private key (created, mode 600)>');
    process.exit(2);
  }
  writeVapidPair(resolve(path)).then(
    (line) => console.log(`${line}\n(private key written to ${resolve(path)}; npx wrangler secret put VAPID_PRIVATE < it)`),
    (e) => {
      console.error(`vapid-keys: ${e instanceof Error ? e.message : e}`);
      process.exit(1);
    },
  );
}
