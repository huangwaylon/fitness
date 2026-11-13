// Shared test helpers: a fake Durable Object state (a key-value map that counts its calls), a real ItsBot over it, an
// Env around that, and requests to the Worker (src/index.ts) as the page and the runner make them. The clock is the
// tests' (vi.setSystemTime); fetch (GitHub's dispatch) is stubbed per test.
import { vi } from 'vitest';
import example from '../../contract-example.json';
import type { RunnerReport } from '../../../app/src/lib/its/contract.ts';
import { ItsBot } from '../src/bot.ts';
import type { Env } from '../src/env.ts';
import worker from '../src/index.ts';

export const KEY_A = 'a'.repeat(64);
export const KEY_B = 'b'.repeat(64);
export const GUEST = 'c'.repeat(64);
export const RUNNER = 'runner-token';
export const ORIGIN = 'https://island-fund.pages.dev';
/** The example's clock: 2026-11-13 13:10:20 in Tokyo (its status's `now`). */
export const NOW = example.status.now;
export const MIN = 60_000;

/** A Durable Object's storage: a map, with each call counted (`ops`) and each key written counted (`rows`), and the
 *  alarm's times as set (`alarms`; the tests call `alarm()` themselves). */
export function fakeState(kv = new Map<string, unknown>()) {
  const count = { gets: 0, puts: 0, rows: 0 };
  const alarms: number[] = [];
  let loading: Promise<unknown> = Promise.resolve();
  const storage = {
    get: async (keys: string[]) => {
      count.gets++;
      return new Map(keys.filter((k) => kv.has(k)).map((k) => [k, structuredClone(kv.get(k))]));
    },
    put: async (entries: Record<string, unknown>) => {
      count.puts++;
      for (const [k, v] of Object.entries(entries)) { count.rows++; kv.set(k, structuredClone(v)); }
    },
    setAlarm: async (t: number) => void alarms.push(t),
  };
  const ctx = { storage, blockConcurrencyWhile: (fn: () => Promise<unknown>) => (loading = fn()) };
  return { ctx, kv, count, alarms, loaded: () => loading };
}

export type State = ReturnType<typeof fakeState>;

export const envOf = (bot: ItsBot, extra: Partial<Env> = {}): Env => ({
  MODE: 'on',
  ALLOWED_ORIGINS: ORIGIN,
  KEY_A, KEY_B,
  ITS_RUNNER_TOKEN: RUNNER,
  BOT: { idFromName: (n: string) => n, get: () => bot },
  ...extra,
}) as unknown as Env;

/** A bot over `state` (a fresh object: as after an eviction), loaded. */
export async function start(state: State, env: Partial<Env> = {}): Promise<ItsBot> {
  const b = new ItsBot(state.ctx as never, { MODE: 'on', ...env } as Env);
  await state.loaded();
  return b;
}

/** The Worker, as a request from anywhere. */
export const call = (env: Env, path: string, init: RequestInit = {}) => worker.fetch(new Request(`https://its.example${path}`, init), env);

/** As the page: a member's key from the app's origin. */
export const page = (env: Env, path: string, init: RequestInit & { key?: string } = {}) =>
  call(env, path, { ...init, headers: { Origin: ORIGIN, Authorization: `Bearer ${init.key ?? KEY_A}`, ...(init.headers as object) } });

/** As the runner: its token, a JSON body. */
export const asRunner = (env: Env, path: string, body?: unknown, token = RUNNER) =>
  call(env, path, body === undefined ? { headers: { Authorization: `Bearer ${token}` } } : { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });

/** The example's report, with changes. */
export const report = (x: Partial<RunnerReport> = {}): RunnerReport => ({ ...structuredClone(example.report), events: [], seen: [], scansLog: [], ...x }) as RunnerReport;

/** Logs silenced, kept for the tests that read them. */
export function quiet() {
  return { debug: vi.spyOn(console, 'debug').mockImplementation(() => {}), log: vi.spyOn(console, 'log').mockImplementation(() => {}), warn: vi.spyOn(console, 'warn').mockImplementation(() => {}), error: vi.spyOn(console, 'error').mockImplementation(() => {}) };
}
