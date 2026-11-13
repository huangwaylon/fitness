// The its-bot Worker as the specs answer it (its.spec, bots.spec): the contract's example status moved to the pinned
// time, and its CORS.
import example from '../../its/contract-example.json' with { type: 'json' };
import type { ItsStatus } from '../src/lib/its/contract.ts';
import { ROSTER } from '../src/lib/its/roster.ts';

export const ORIGIN = 'https://its-bot.island-fund-relay.workers.dev';
const HEADERS = 'Authorization, Content-Type, X-Request-Id';
export const cors = (allow = HEADERS) => ({ 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, PUT, POST', 'Access-Control-Allow-Headers': allow });

export type Status = ItsStatus;

/** The contract's example status with its times moved to `now` (its stays, the 21st and 22nd, still ahead), from a
 *  runner that reports settingsAt; with an allow-list (every roster name but the skipped) unless `legacy` (a Worker
 *  from before it). */
export function payload(now: number, legacy = false): Status {
  const s = structuredClone(example.status) as ItsStatus;
  const dt = now - s.now;
  const r = s.runner!;
  const search = ROSTER.map((h) => h.name).filter((n) => !s.settings.skip.includes(n));
  return {
    ...s, now, settings: { ...s.settings, updatedAt: s.settings.updatedAt! + dt, ...(legacy ? {} : { search }) },
    runner: { ...r, settingsAt: s.settings.updatedAt! + dt, startedAt: r.startedAt + dt, deadline: r.deadline! + dt, lastScanAt: r.lastScanAt! + dt, lastOkAt: r.lastOkAt! + dt, lastSeen: r.lastSeen + dt,
      solves: { ...r.solves, lastOkAt: r.solves.lastOkAt! + dt }, lastError: { ...r.lastError!, at: r.lastError!.at + dt } },
    bookings: s.bookings.map((b) => ({ ...b, at: b.at + dt })),
    events: s.events.map((e) => ({ ...e, t: e.t + dt })),
    control: s.control && { ...s.control, at: s.control.at + dt },
    lastPreflight: s.lastPreflight! + dt
  };
}
