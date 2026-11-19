// The three Durable Objects by name (one instance each) and the relay's log sink over the log's.
import type { Env } from './index.ts';
import { relaySink } from './logRoute.ts';
import type { RelayEvent } from './log.ts';

/** The record (storeObject.ts). */
export const record = (env: Pick<Env, 'STORE'>) => env.STORE.get(env.STORE.idFromName('record'));
/** The island room (index.ts IslandRoom). */
export const room = (env: Pick<Env, 'ROOM'>) => env.ROOM.get(env.ROOM.idFromName('island'));
/** The log (logObject.ts). */
export const logDo = (env: Pick<Env, 'LOG'>) => env.LOG.get(env.LOG.idFromName('log'));

/** The relay's events to the log (logRoute.ts relaySink: best effort, in the background); none with the off switch. */
export function sinkOf(env: Pick<Env, 'LOG' | 'LOG_OFF'>, waitUntil: (p: Promise<unknown>) => void): (evs: RelayEvent[]) => void {
  if (env.LOG_OFF === '1') return () => {};
  return relaySink(() => logDo(env), waitUntil, Date.now);
}
