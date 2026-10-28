import { beforeEach, describe, expect, it } from 'vitest';
import type { Db } from '#lib/server/db/index.ts';
import { ledgerEntry, presenceEvent, pushSubscription, workout } from '#lib/server/db/schema.ts';
import { setNow } from '#lib/server/clock.ts';
import { approveSpend, confirm, isPushServiceUrl, setCheckin, setCozyDay, setPromise, spendPurse } from '#lib/server/actions.ts';
import { purseBalance, settleWeek } from '#lib/server/ledger.ts';
import { HttpError } from '#lib/server/http.ts';
import { recordPresence, promptRecentVisits } from '#lib/server/presence.ts';
import { forcePushEnabled, setSender } from '#lib/server/push.ts';
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

describe('cozy days', () => {
  const on = (who: 'A' | 'B', date: string, at: string) => {
    setNow(at);
    return code(() => setCozyDay(db, who, { date, on: true }));
  };
  it('only today or yesterday', () => {
    expect(code(() => setCozyDay(db, 'A', { date: '2026-11-10', on: true }))).toBe('ok');
    expect(code(() => setCozyDay(db, 'A', { date: '2026-11-09', on: true }))).toBe('ok');
    expect(code(() => setCozyDay(db, 'A', { date: '2026-11-08', on: true }))).toBe('422:date_out_of_range');
    expect(code(() => setCozyDay(db, 'A', { date: '2026-11-11', on: true }))).toBe('422:date_out_of_range');
  });
  it('max 3 per Mon–Sun week, 4 per calendar month (a week spanning two months is still capped)', () => {
    // Week Mar 29–Apr 4 2027 spans two months: 3 in March would allow 4 more in April under a month-only cap.
    expect(on('A', '2027-03-29', '2027-03-29T03:00:00Z')).toBe('ok');
    expect(on('A', '2027-03-30', '2027-03-30T03:00:00Z')).toBe('ok');
    expect(on('A', '2027-03-31', '2027-03-31T03:00:00Z')).toBe('ok');
    expect(on('A', '2027-04-01', '2027-04-01T03:00:00Z')).toBe('409:cozy_week_cap');
    expect(on('B', '2027-04-01', '2027-04-01T03:00:00Z')).toBe('ok'); // per person
    for (const d of ['2027-04-05', '2027-04-06', '2027-04-07']) expect(on('A', d, `${d}T03:00:00Z`)).toBe('ok');
    expect(on('A', '2027-04-12', '2027-04-12T03:00:00Z')).toBe('ok'); // 4th in April
    expect(on('A', '2027-04-13', '2027-04-13T03:00:00Z')).toBe('409:cozy_month_cap');
  });
  it("can't be set on a day that already has training", () => {
    db.insert(workout).values({ person: 'A', extId: 'w1', localDate: '2026-11-09', type: 'Traditional Strength Training',
      startAt: '2026-11-09T09:00:00+09:00', endAt: '2026-11-09T10:00:00+09:00', durationMin: 60, avgHr: 120 }).run();
    expect(code(() => setCozyDay(db, 'A', { date: '2026-11-09', on: true }))).toBe('409:cozy_already_active');
  });
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

describe('promise target week', () => {
  it('this week normally, next week once Sunday harvest started', () => {
    expect(setPromise(db, 'A', { daysMask: 0b0010101, kind: 'gym' }).weekKey).toBe('2026-11-09');
    setNow('2026-11-15T10:45:00Z'); // Sun 19:45 JST
    expect(setPromise(db, 'A', { daysMask: 2, kind: 'gym' }).weekKey).toBe('2026-11-16');
  });
});

describe('gym visits', () => {
  it('a ≥ 30 min visit with no strength workout is pending, prompts once, and can be confirmed', async () => {
    const sent: string[] = [];
    forcePushEnabled(true);
    setSender(async (_s, payload) => { sent.push(payload); return { statusCode: 201 }; });
    db.insert(pushSubscription).values({ person: 'A', deviceId: 1, endpoint: 'https://push.example/1', keysJson: '{"p256dh":"x","auth":"y"}' }).run();

    const arrive = recordPresence(db, 'A', { place: 'anytime', event: 'arrive', at: '2026-11-10T09:00:00Z' });
    expect(recordPresence(db, 'A', { place: 'anytime', event: 'arrive', at: '2026-11-10T09:01:00Z' }).duplicate).toBe(true);
    recordPresence(db, 'A', { place: 'anytime', event: 'leave', at: '2026-11-10T09:50:00Z' });
    expect(code(() => recordPresence(db, 'A', { place: 'pt_studio', event: 'arrive' }))).toBe('404:unknown_place');

    setNow('2026-11-10T10:05:00Z');
    expect(getWeekView(db, 'A').pending).toEqual([{ kind: 'visit', id: String(arrive.id), date: '2026-11-10', label: 'エニタイム' }]);
    expect(await promptRecentVisits(db)).toBe(1);
    expect(await promptRecentVisits(db)).toBe(0);
    expect(JSON.parse(sent[0])).toMatchObject({ kind: 'visit', body: '筋トレとして記録する?' });

    confirm(db, 'A', { kind: 'visit', id: String(arrive.id), yes: true });
    expect(getWeekView(db, 'A').pending).toEqual([]);
    expect(code(() => confirm(db, 'B', { kind: 'visit', id: String(arrive.id), yes: true }))).toBe('404:not_found');
    expect(db.select().from(presenceEvent).all()).toHaveLength(2);
    forcePushEnabled(false);
    setSender(null);
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

