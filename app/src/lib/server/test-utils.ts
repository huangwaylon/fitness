// Shared helpers for server tests (not a test file itself).
import { openDb, setDb, type Db } from '#lib/server/db/index.ts';
import { setNow } from '#lib/server/clock.ts';
import { resetRateLimits } from '#lib/server/ratelimit.ts';
import type { GuardEvent } from '#lib/server/guard.ts';

export function freshDb(): Db {
  delete process.env.DEV_PERSON;
  resetRateLimits();
  setNow(null);
  const db = openDb(':memory:');
  setDb(db);
  return db;
}

export const ORIGIN = 'https://island.example.ts.net';

export function fakeEvent(path: string, init: { method?: string; headers?: Record<string, string>; cookie?: string; body?: string; ip?: string } = {}): GuardEvent & { jar: Map<string, string> } {
  const url = new URL(ORIGIN + path);
  const jar = new Map<string, string>();
  if (init.cookie) jar.set('__Host-session', init.cookie);
  return {
    request: new Request(url, { method: init.method ?? 'GET', headers: init.headers, body: init.body }),
    url,
    locals: { person: null, deviceId: null },
    cookies: { get: (n) => jar.get(n), set: (n, v) => void jar.set(n, v) },
    getClientAddress: () => init.ip ?? '203.0.113.7',
    jar
  };
}

import { checkin, dailyMetric } from '#lib/server/db/schema.ts';
import { targetsFor, weekDays } from '#lib/scoring/index.ts';

/** Fill a week with daily steps/exercise and `ticksPerDay` habit ticks for the first `days` days. */
export function seedWeek(db: Db, person: 'A' | 'B', weekKey: string, o: { steps: number; exerciseMin: number; ticksPerDay?: number; days?: number }) {
  const habits = targetsFor(person, weekKey).habits;
  for (const date of weekDays(weekKey).slice(0, o.days ?? 7)) {
    for (const [metric, value] of [['steps', o.steps], ['exercise_min', o.exerciseMin]] as const) {
      db.insert(dailyMetric).values({ person, localDate: date, metric, value })
        .onConflictDoUpdate({ target: [dailyMetric.person, dailyMetric.localDate, dailyMetric.metric], set: { value } }).run();
    }
    for (const h of habits.slice(0, o.ticksPerDay ?? 0)) db.insert(checkin).values({ person, localDate: date, habitKey: h }).onConflictDoNothing().run();
  }
}
