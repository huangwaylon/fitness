import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Db } from '#lib/server/db/index.ts';
import { checkin, pushSubscription, rawPayload } from '#lib/server/db/schema.ts';
import { setNow } from '#lib/server/clock.ts';
import { forcePushEnabled, setSender } from '#lib/server/push.ts';
import { settleWeek } from '#lib/server/ledger.ts';
import { pruneRawBodies, runReminders } from '#lib/server/jobs.ts';
import { freshDb } from '#lib/server/test-utils.ts';

let db: Db;
let sent: { person: string; kind: string }[];

beforeEach(() => {
  db = freshDb();
  sent = [];
  forcePushEnabled(true);
  setSender(async (sub, payload) => {
    sent.push({ person: sub.endpoint.endsWith('/A') ? 'A' : 'B', kind: JSON.parse(payload).kind });
    return { statusCode: 201 };
  });
  for (const p of ['A', 'B'] as const) {
    db.insert(pushSubscription).values({ person: p, deviceId: 1, endpoint: `https://push.example/${p}`, keysJson: '{"p256dh":"x","auth":"y"}' }).run();
  }
});
afterEach(() => {
  forcePushEnabled(false);
  setSender(null);
  setNow(null);
});

const at = async (iso: string) => {
  setNow(iso);
  await runReminders(db);
};

describe('one push per person per day, by priority', () => {
  it('Sunday harvest wins over the check-in reminder', async () => {
    await at('2026-11-08T10:30:00Z'); // Sun 19:30 JST
    settleWeek(db, '2026-11-02', 'provisional');
    await at('2026-11-08T10:31:00Z');
    await at('2026-11-08T11:05:00Z'); // 20:05: check-in time, but today's slot is used
    expect(sent).toEqual([{ person: 'A', kind: 'harvest' }, { person: 'B', kind: 'harvest' }]);
  });
  it('weekday 20:00: check-in only for people who have not ticked yet', async () => {
    db.insert(checkin).values({ person: 'B', localDate: '2026-11-10', habitKey: 'eat_lunch' }).run();
    await at('2026-11-10T10:59:00Z'); // 19:59: too early
    await at('2026-11-10T11:00:00Z');
    expect(sent).toEqual([{ person: 'A', kind: 'checkin' }]);
  });
  it('nothing between 22:00 and 07:00', async () => {
    await at('2026-11-10T13:30:00Z'); // 22:30 JST
    expect(sent).toEqual([]);
  });
  it('no eating reminder over 正月', async () => {
    await at('2026-12-30T11:00:00Z');
    expect(sent).toEqual([]);
  });
});

describe('raw payload pruning', () => {
  it('empties bodies older than 90 days and keeps the rows', () => {
    for (const receivedAt of ['2026-07-01T00:00:00Z', '2026-10-01T00:00:00Z']) {
      db.insert(rawPayload).values({ person: 'A', source: 'shortcut', receivedAt, bodyGz: 'H4sI', parseStatus: 'ok' }).run();
    }
    expect(pruneRawBodies(db, new Date('2026-10-28T00:00:00Z'))).toBe(1);
    expect(db.select().from(rawPayload).all().map((r) => r.bodyGz)).toEqual(['', 'H4sI']);
    expect(pruneRawBodies(db, new Date('2026-10-28T00:00:00Z'))).toBe(0);
  });
});
