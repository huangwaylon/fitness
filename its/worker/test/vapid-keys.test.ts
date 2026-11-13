// scripts/vapid-keys.ts: a pair the Worker signs with and a push service verifies, the private part only in a new
// 600 file, never in what it prints.
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { writeVapidPair } from '../scripts/vapid-keys.ts';
import { vapidOf } from '../src/push.ts';
import { unb64url, vapidAuth } from '../src/webpush.ts';

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe('npm run vapid:keys', () => {
  it('prints VAPID_PUBLIC, writes the private scalar to a new 600 file, and the pair signs a JWT that verifies', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'vapid-'));
    dirs.push(dir);
    const file = join(dir, 'vapid-private');
    const line = await writeVapidPair(file);
    const pub = /^VAPID_PUBLIC=([A-Za-z0-9_-]{87})$/.exec(line)![1];
    const priv = readFileSync(file, 'utf8');
    expect(statSync(file).mode & 0o777).toBe(0o600);
    expect(line).not.toContain(priv.trim());
    const v = vapidOf(pub, priv)!;
    expect(v).not.toBeNull();
    const h = await vapidAuth('https://web.push.apple.com/x', v, Date.now());
    const [, t, k] = /^vapid t=([\w.-]+), k=([\w-]+)$/.exec(h)!;
    const [head, claims, sig] = t.split('.');
    const key = await crypto.subtle.importKey('raw', unb64url(k), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    expect(await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, unb64url(sig), new TextEncoder().encode(`${head}.${claims}`))).toBe(true);
    await expect(writeVapidPair(file)).rejects.toThrow(/EEXIST/);   // never overwrites a pair
  });
});
