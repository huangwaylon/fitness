import { beforeEach, describe, expect, it } from 'vitest';
import type { Db } from '#lib/server/db/index.ts';
import { ledgerEntry, presenceEvent, workout } from '#lib/server/db/schema.ts';
import { setNow } from '#lib/server/clock.ts';
import { approveSpend, confirm, isPushServiceUrl, setCheckin, spendPurse } from '#lib/server/actions.ts';
import { purseBalance, settleWeek } from '#lib/server/ledger.ts';
import { HttpError } from '#lib/server/http.ts';
import { recordPresence } from '#lib/server/presence.ts';
import { getWeekView } from '#lib/server/week.ts';
import { freshDb } from '#lib/server/test-utils.ts';

let db: Db;
const code = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return e instanceof HttpError ? `${e.status}:${e.code}` : String(e);
  }
  return 'ok';
};

beforeEach(() => {
  db = freshDb();
  setNow('2026-11-10T03:00:00Z'); // Tue 12:00 JST
});

describe('check-in', () => {
  it('own habits only, within 48 h, not in a locked week', () => {
    expect(setCheckin(db, 'A', { date: '2026-11-10', habitKey: 'teishoku_lunch', done: true }).ticks).toEqual(['teishoku_lunch']);
    expect(code(() => setCheckin(db, 'A', { date: '2026-11-10', habitKey: 'snack_swap', done: true }))).toBe('422:unknown_habit');
    expect(code(() => setCheckin(db, 'A', { date: '2026-11-11', habitKey: 'teishoku_lunch', done: true }))).toBe('422:date_out_of_range');
    expect(code(() => setCheckin(db, 'A', { date: '2026-11-07', habitKey: 'teishoku_lunch', done: true }))).toBe('422:date_out_of_range');
    expect(code(() => setCheckin(db, 'A', { date: '2026-11-08', habitKey: 'teishoku_lunch', done: true }))).toBe('ok');
    settleWeek(db, '2026-11-02', 'final');
    expect(code(() => setCheckin(db, 'A', { date: '2026-11-08', habitKey: 'teishoku_lunch', done: false }))).toBe('409:week_locked');
    expect(setCheckin(db, 'A', { date: '2026-11-10', habitKey: 'teishoku_lunch', done: false }).ticks).toEqual([]);
  });
});

describe('purse', () => {
  beforeEach(() => {
    db.insert(ledgerEntry).values([
      { bucket: 'purse', person: 'A', amountYen: 3000, kind: 'earn', weekKey: '2026-11-02', idemKey: 'earn:purse:A:2026-11-02' },
      { bucket: 'purse', person: 'B', amountYen: 3000, kind: 'earn', weekKey: '2026-11-02', idemKey: 'earn:purse:B:2026-11-02' }
    ]).run();
  });

  it('small spends go through; ≥ ¥5,000 waits for the partner; balance never below 0', () => {
    expect(spendPurse(db, 'A', { label: 'カフェ', amountYen: 1000 }).status).toBe('spent');
    expect(purseBalance(db)).toBe(5000);
    const big = spendPurse(db, 'B', { label: '焼肉', amountYen: 5000 });
    expect(big.status).toBe('pending');
    expect(purseBalance(db)).toBe(5000);
    expect(code(() => approveSpend(db, 'B', big.id))).toBe('403:partner_must_approve');
    expect(approveSpend(db, 'A', big.id).status).toBe('spent');
    expect(code(() => approveSpend(db, 'A', big.id))).toBe('409:already_spent');
    expect(purseBalance(db)).toBe(0);
    expect(code(() => spendPurse(db, 'A', { label: 'x', amountYen: 1 }))).toBe('409:insufficient_purse');
  });

  it('approval re-checks the balance', () => {
    const big = spendPurse(db, 'A', { label: 'マッサージ', amountYen: 6000 });
    spendPurse(db, 'B', { label: 'カラオケ', amountYen: 2000 });
    expect(code(() => approveSpend(db, 'B', big.id))).toBe('409:insufficient_purse');
  });
});

describe('gym visits', () => {
  it('a ≥ 30 min visit with no strength workout is pending (in-app) and can be confirmed', () => {

    const arrive = recordPresence(db, 'A', { place: 'anytime', event: 'arrive', at: '2026-11-10T09:00:00Z' });
    expect(recordPresence(db, 'A', { place: 'anytime', event: 'arrive', at: '2026-11-10T09:01:00Z' }).duplicate).toBe(true);
    recordPresence(db, 'A', { place: 'anytime', event: 'leave', at: '2026-11-10T09:50:00Z' });
    expect(code(() => recordPresence(db, 'A', { place: 'pt_studio', event: 'arrive' }))).toBe('404:unknown_place');

    setNow('2026-11-10T10:05:00Z');
    expect(getWeekView(db, 'A').pending).toEqual([{ kind: 'visit', id: String(arrive.id), date: '2026-11-10', label: 'エニタイム' }]);

    confirm(db, 'A', { kind: 'visit', id: String(arrive.id), yes: true });
    expect(getWeekView(db, 'A').pending).toEqual([]);
    expect(code(() => confirm(db, 'B', { kind: 'visit', id: String(arrive.id), yes: true }))).toBe('404:not_found');
    expect(db.select().from(presenceEvent).all()).toHaveLength(2);
  });
  it('a visit overlapping a strength workout is not asked about', () => {
    recordPresence(db, 'A', { place: 'anytime', event: 'arrive', at: '2026-11-10T00:00:00Z' });
    recordPresence(db, 'A', { place: 'anytime', event: 'leave', at: '2026-11-10T01:00:00Z' });
    db.insert(workout).values({ person: 'A', extId: 'w1', localDate: '2026-11-10', type: 'Traditional Strength Training',
      startAt: '2026-11-10T09:10:00+09:00', endAt: '2026-11-10T09:50:00+09:00', durationMin: 40, avgHr: 120 }).run();
    expect(getWeekView(db, 'A').pending).toEqual([]);
  });
});

describe('push subscriptions', () => {
  it('only accept endpoints at real push services (no SSRF from the Mac)', () => {
    expect(isPushServiceUrl('https://web.push.apple.com/QGx')).toBe(true);
    expect(isPushServiceUrl('https://fcm.googleapis.com/fcm/send/x')).toBe(true);
    expect(isPushServiceUrl('https://192.168.1.1/admin')).toBe(false);
    expect(isPushServiceUrl('https://evilpush.apple.com.example/x')).toBe(false);
    expect(isPushServiceUrl('http://web.push.apple.com/x')).toBe(false);
  });
});

