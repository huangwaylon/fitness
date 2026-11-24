// A throwaway RSA key pair made per test run (never a real App key): its private half as the PKCS#8 PEM a GitHub App's
// secret holds, its public half to verify a JWT with. And its-bot's App identity for the tests that only need one: the
// three secrets and its token as a mint left it in the object's storage (no mint asked of the stubbed fetch).
import { GH_NARROW } from '../src/env.ts';
import { keyOf } from '../src/ghApp.ts';

export async function testKey(): Promise<{ pem: string; pub: CryptoKey }> {
  const pair = (await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify'])) as CryptoKeyPair;
  const der = new Uint8Array((await crypto.subtle.exportKey('pkcs8', pair.privateKey)) as ArrayBuffer);
  const pem = `-----BEGIN PRIVATE KEY-----\n${btoa(String.fromCharCode(...der)).replace(/.{64}/g, '$&\n')}\n-----END PRIVATE KEY-----\n`;
  return { pem, pub: pair.publicKey };
}

/** its-bot's App secrets (the key never read: appToken finds seedToken's token first). */
export const APP = { GH_APP_ID: '123', GH_APP_INSTALLATION_ID: '456', GH_APP_KEY_ITS: 'test-app-key' };
/** No GitHub identity (the App's key unset). */
export const NO_APP = { GH_APP_KEY_ITS: undefined };

/** APP's installation token in a bot's storage (bot.ts GH_TOKEN_KEY, ghApp.ts TokenStore) as a mint left it: `token`,
 *  good for 30 days from `now`. Set on the map itself: no storage call counted. */
export function seedToken(kv: Map<string, unknown>, now: number, token = 'gh-token'): void {
  const c = { appId: APP.GH_APP_ID, installationId: APP.GH_APP_INSTALLATION_ID, key: APP.GH_APP_KEY_ITS };
  kv.set('ghtoken', { k: keyOf(c, GH_NARROW), token, expiresAt: now + 30 * 86_400_000 });
}
