// The signed `/admin` requests of the relay's tools (record.ts, logs.ts): the relay, the two person keys, the signature.
// Keys from the environment (KEY_A, KEY_B), else a KEY=value file: KEYS_FILE, else the test relay's
// `relay/.smoke-keys` (--test) or ~/.config/island-fund/keys (production). With --test the file comes first (this Mac's
// shell exports the production keys: the test relay answered `unauthorized`). Never printed.
// PLACES_KEY in the environment signs the places ops (src/sign.ts PLACES_OPS) instead, without the member keys: the
// places pull on GitHub's runners holds only that one (.github/workflows/places-pull.yml).
import { createHmac } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { PLACES_LABEL, PLACES_OPS, SIGN_LABEL, SIG_HEADER, TIME_HEADER } from '../src/sign.ts';

export const TEST = process.argv.includes('--test');
/** RELAY_ORIGIN: another relay (the restore drill's `wrangler dev`, http://127.0.0.1:<port>), with KEYS_FILE its keys. */
export const RELAY = process.env.RELAY_ORIGIN?.replace(/\/$/, '') ?? (TEST ? 'https://island-fund-relay-test.island-fund-relay.workers.dev' : 'https://island-fund-relay.island-fund-relay.workers.dev');

function keysFile(): string | null {
  if (process.env.KEYS_FILE) return process.env.KEYS_FILE;
  const f = TEST ? `${import.meta.dirname}/../.smoke-keys` : `${homedir()}/.config/island-fund/keys`;
  return existsSync(f) ? f : null;
}

/** The two members' keys (lower case), or exit. */
function keys(): { a: string; b: string } {
  const file = TEST || !process.env.KEY_A || !process.env.KEY_B ? keysFile() : null;
  const fileKeys: Record<string, string> = file
    ? Object.fromEntries(readFileSync(file, 'utf8').trim().split('\n').map((l) => l.split('=') as [string, string]))
    : {};
  const a = ((TEST && fileKeys.KEY_A) || process.env.KEY_A || fileKeys.KEY_A)?.trim().toLowerCase() ?? '';
  const b = ((TEST && fileKeys.KEY_B) || process.env.KEY_B || fileKeys.KEY_B)?.trim().toLowerCase() ?? '';
  if (!a || !b) {
    console.error('set KEY_A and KEY_B in the environment, or KEYS_FILE');
    process.exit(1);
  }
  return { a, b };
}

let secret: string | null = null;
function secretOf(): string {
  if (secret) return secret;
  const { a, b } = keys();
  return (secret = createHmac('sha256', `${a}:${b}`).update(SIGN_LABEL).digest('hex'));
}

/** The places secret (src/sign.ts placesSecret) from PLACES_KEY in the environment, or null. */
function placesSecretOf(): string | null {
  const k = process.env.PLACES_KEY?.trim().toLowerCase();
  return k ? createHmac('sha256', k).update(PLACES_LABEL).digest('hex') : null;
}

/** An `/api` request as member A (a review's own writes, its reads: relay/scripts/flags.ts), its JSON reply. */
export async function asMember(body: object): Promise<Record<string, unknown>> {
  const res = await fetch(`${RELAY}/api`, { method: 'POST', body: JSON.stringify({ key: keys().a, ...body }), headers: { 'Content-Type': 'text/plain' } });
  if (!res.ok) throw new Error(`/api: ${res.status}`);
  return (await res.json()) as Record<string, unknown>;
}

/** A signed POST to the record's /admin. */
export async function signed(body: object): Promise<Record<string, unknown>> {
  const text = JSON.stringify(body);
  const t = String(Date.now());
  const op = (body as { op?: unknown }).op;
  const key = (typeof op === 'string' && PLACES_OPS.includes(op) && placesSecretOf()) || secretOf();
  const res = await fetch(`${RELAY}/admin`, {
    method: 'POST', body: text,
    headers: { [TIME_HEADER]: t, [SIG_HEADER]: createHmac('sha256', key).update(`${t}.${text}`).digest('hex') }
  });
  if (!res.ok) throw new Error(`/admin: ${res.status} ${await res.text()}`);
  return (await res.json()) as Record<string, unknown>;
}
