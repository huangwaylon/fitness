// The signed `/admin` requests of the relay's tools (record.ts, logs.ts): the relay, the two person keys, the signature.
// Keys from the environment (KEY_A, KEY_B), else a KEY=value file: KEYS_FILE, else the test relay's
// `relay/.smoke-keys` (--test) or ~/.config/island-fund/keys (production). Never printed.
import { createHmac } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { NOTIFY_LABEL, SIG_HEADER, TIME_HEADER } from '../src/notify.ts';

export const TEST = process.argv.includes('--test');
export const RELAY = TEST ? 'https://island-fund-relay-test.island-fund-relay.workers.dev' : 'https://island-fund-relay.island-fund-relay.workers.dev';

function keysFile(): string | null {
  if (process.env.KEYS_FILE) return process.env.KEYS_FILE;
  const f = TEST ? `${import.meta.dirname}/../.smoke-keys` : `${homedir()}/.config/island-fund/keys`;
  return existsSync(f) ? f : null;
}

let secret: string | null = null;
function secretOf(): string {
  if (secret) return secret;
  const file = !process.env.KEY_A || !process.env.KEY_B ? keysFile() : null;
  const fileKeys: Record<string, string> = file
    ? Object.fromEntries(readFileSync(file, 'utf8').trim().split('\n').map((l) => l.split('=') as [string, string]))
    : {};
  const a = (process.env.KEY_A ?? fileKeys.KEY_A)?.trim().toLowerCase() ?? '';
  const b = (process.env.KEY_B ?? fileKeys.KEY_B)?.trim().toLowerCase() ?? '';
  if (!a || !b) {
    console.error('set KEY_A and KEY_B in the environment, or KEYS_FILE');
    process.exit(1);
  }
  return (secret = createHmac('sha256', `${a}:${b}`).update(NOTIFY_LABEL).digest('hex'));
}

/** A signed POST to the record's /admin. */
export async function signed(body: object): Promise<Record<string, unknown>> {
  const text = JSON.stringify(body);
  const t = String(Date.now());
  const res = await fetch(`${RELAY}/admin`, {
    method: 'POST', body: text,
    headers: { [TIME_HEADER]: t, [SIG_HEADER]: createHmac('sha256', secretOf()).update(`${t}.${text}`).digest('hex') }
  });
  if (!res.ok) throw new Error(`/admin: ${res.status} ${await res.text()}`);
  return (await res.json()) as Record<string, unknown>;
}
