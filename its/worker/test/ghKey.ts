// A throwaway RSA key pair made per test run (never a real App key): its private half as the PKCS#8 PEM a GitHub App's
// secret holds, its public half to verify a JWT with.
export async function testKey(): Promise<{ pem: string; pub: CryptoKey }> {
  const pair = (await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify'])) as CryptoKeyPair;
  const der = new Uint8Array((await crypto.subtle.exportKey('pkcs8', pair.privateKey)) as ArrayBuffer);
  const pem = `-----BEGIN PRIVATE KEY-----\n${btoa(String.fromCharCode(...der)).replace(/.{64}/g, '$&\n')}\n-----END PRIVATE KEY-----\n`;
  return { pem, pub: pair.publicKey };
}
