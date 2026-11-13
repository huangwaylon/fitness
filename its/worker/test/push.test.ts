// Web Push (src/push.ts rules, src/bot.ts's subscriptions, outbox and alarm, src/index.ts's /its/push/* routes): which
// endpoints and keys are stored, what a report's new events push (the FINAL rules: a hold the bot confirms, a hold that
// needs a person while it lasts, 予約確定), the messages in both languages, each push service answer's handling, the
// status's counts, the logs (never an endpoint, a key or a message), and one end to end: a phone subscribed through the
// route, a runner's hold and human_needed, the alarm, and a fake push service that verifies the VAPID JWT and decrypts.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import example from '../../contract-example.json';
import {
  DEFAULT_SETTINGS, HUMAN_NEEDED_DETAILS, MAYBE_FILED_DETAILS, NOT_BOOKED_DETAILS, PUSH_HOSTS, PUSH_SUBS_PER_MEMBER, PUSH_TEST_EVERY_SEC, tokyoTime,
  type BookingEntry, type BookingInput, type EventInput, type ItsEvent, type ItsPushPayload, type ItsPushStatus, type ItsSettings, type ItsSettingsInput, type ItsStatus,
} from '../../../app/src/lib/its/contract.ts';
import type { ItsBot } from '../src/bot.ts';
import type { Env } from '../src/env.ts';
import {
  CONFIRMED_TTL_MS, MIN_LEFT_MS, dayLabel, endpointOk, keysOk, noticesFor, outcomeOf, payloadOf, reasonOf, retryAt, topicOf,
  vapidOf, type PushJob,
} from '../src/push.ts';
import { HOLD_MS } from '../src/rules.ts';
import { KEY_A, KEY_B, MIN, NOW, ORIGIN, RUNNER, asRunner, envOf, fakeState, page, quiet, report, start, type State } from './fakeBot.ts';
import { fakePushService, phoneKeys, vapidPair, type Phone } from './pushKit.ts';

const HOST = 'push.example.test';
const RUN = '19283746';
/** The vector's subscription keys (RFC 8291 Appendix A): a valid point and auth. */
const UA = { p256dh: 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4', auth: 'BTBZMqHH6r4Tts7J_aSIgg' };
/** A stay the bot confirms (≥ 11 days away) and one it doesn't (9 days). */
const FAR = '2026-11-28';
const NEAR = '2026-11-22';
const HOTEL = 'NAGU 勝浦';

describe('push.ts: what may be stored', () => {
  it('an endpoint: https on an allowed host exactly, the default port, no userinfo, IP or fragment, ≤ 512', () => {
    const ok = (s: unknown) => endpointOk(s, PUSH_HOSTS);
    expect(ok('https://web.push.apple.com/QGuQyavXutnMH4hx')).toBe(true);
    expect(ok('https://fcm.googleapis.com/fcm/send/abc:def')).toBe(true);
    // URL's normal form: the host lower-cased, an explicit :443 the default port
    expect(ok('https://WEB.PUSH.APPLE.COM/x')).toBe(true);
    expect(ok('https://web.push.apple.com:443/x')).toBe(true);
    for (const bad of [
      'http://web.push.apple.com/x', 'https://web.push.apple.com:8443/x', 'https://u:p@web.push.apple.com/x', 'https://evil.web.push.apple.com/x',
      'https://web.push.apple.com.evil.example/x', 'https://127.0.0.1/x', 'https://[::1]/x', 'https://localhost/x', 'https://updates.push.services.mozilla.com/x',
      'https://web.push.apple.com./x', 'https://web.push.apple.com:443./x', 'https://xn--wb-uga.push.apple.com/x', 'https://wéb.push.apple.com/x',
      `https://web.push.apple.com/${'a'.repeat(500)}`, 'https://web.push.apple.com/x#f', 'https://web.push.apple.com/ x', 'not a url', 5, null,
    ]) expect(ok(bad), String(bad)).toBe(false);
    // the allow-list is injected (tests: a fake push service), never widened by an env flag
    expect(endpointOk(`https://${HOST}/p/1`, [HOST])).toBe(true);
    expect(endpointOk(`https://${HOST}/p/1`, PUSH_HOSTS)).toBe(false);
  });

  it('keys: p256dh a point on P-256, auth 16 bytes', async () => {
    expect(await keysOk(UA.p256dh, UA.auth)).toBe(true);
    const off = `${UA.p256dh.slice(0, 40)}${UA.p256dh[40] === 'A' ? 'B' : 'A'}${UA.p256dh.slice(41)}`;   // y no longer on the curve
    expect(await keysOk(off, UA.auth)).toBe(false);
    expect(await keysOk(`C${UA.p256dh.slice(1)}`, UA.auth)).toBe(false);   // not uncompressed
    expect(await keysOk(UA.p256dh, 'BTBZMqHH6r4Tts7J_aSI')).toBe(false);
    expect(await keysOk(UA.p256dh.slice(0, 86), UA.auth)).toBe(false);
    expect(await keysOk(UA.p256dh, `${UA.auth.slice(0, 21)}+`)).toBe(false);
  });

  it('the VAPID pair: a placeholder or a missing secret is push off', async () => {
    const v = await vapidPair();
    expect(vapidOf(v.publicKey, v.privateKey)).toEqual({ publicKey: v.publicKey, privateKey: v.privateKey, subject: 'https://island-fund.pages.dev' });
    expect(vapidOf(` ${v.publicKey}\n`, `${v.privateKey}\n`)?.publicKey).toBe(v.publicKey);
    expect(vapidOf('REPLACE_AT_DEPLOY', v.privateKey)).toBeNull();
    expect(vapidOf(v.publicKey, undefined)).toBeNull();
    expect(vapidOf(undefined, v.privateKey)).toBeNull();
  });
});

describe('push.ts: the messages', () => {
  it('dates and times in Tokyo, both languages', () => {
    expect([dayLabel('2026-11-22', 'ja'), dayLabel('2026-11-22', 'en')]).toEqual(['11/22(日)', 'Sun 22 Nov']);
    expect(tokyoTime(Date.UTC(2026, 10, 13, 7, 5))).toBe('16:05');
    expect(tokyoTime(Date.UTC(2026, 10, 13, 15, 30))).toBe('00:30');
  });

  it('each kind’s title and body, a stay’s tag', () => {
    const exp = Date.UTC(2026, 10, 13, 7, 5);
    const at = { id: 'r:1', date: '2026-11-22', hotel: HOTEL };
    const p = (x: object, lang: 'ja' | 'en' = 'ja') => payloadOf({ kind: 'hold', ...at, ...x } as never, lang, 'T');
    expect(p({ kind: 'hold', expiresAt: exp })).toEqual({ v: 1, kind: 'hold', id: 'r:1', tag: 'T', title: '仮押さえしました', body: 'NAGU 勝浦・11/22(日)・自動で確定します', open: 'its', date: '2026-11-22', hotel: HOTEL, expiresAt: exp });
    expect(p({ kind: 'human_needed', expiresAt: exp })).toMatchObject({ title: '仮押さえ・要対応', body: 'NAGU 勝浦・11/22(日)・16:05ごろまでにメールから申込' });
    expect(p({ kind: 'confirmed', number: 'A1234567' })).toMatchObject({ title: '予約が確定しました', body: 'NAGU 勝浦・11/22(日)・申込受付番号 A1234567', number: 'A1234567' });
    expect(p({ kind: 'confirmed' })).toMatchObject({ body: 'NAGU 勝浦・11/22(日)' });
    expect(p({ kind: 'hold', expiresAt: exp }, 'en')).toMatchObject({ title: 'Room held', body: 'NAGU 勝浦 · Sun 22 Nov · confirming automatically' });
    expect(p({ kind: 'human_needed', expiresAt: exp }, 'en')).toMatchObject({ title: 'Room held: action needed', body: 'NAGU 勝浦 · Sun 22 Nov · apply from the email by about 16:05' });
    expect(p({ kind: 'confirmed', number: 'A1234567' }, 'en')).toMatchObject({ title: 'Booking confirmed', body: 'NAGU 勝浦 · Sun 22 Nov · ref. A1234567' });
    expect(payloadOf({ kind: 'test', id: 'test' }, 'ja', 'its-test')).toEqual({ v: 1, kind: 'test', id: 'test', tag: 'its-test', title: 'テスト通知', body: '保養所ボットの通知はこの端末に届きます', open: 'its' });
  });

  it('the example’s payload is what the Worker writes', async () => {
    const x = example.pushPayload as ItsPushPayload;
    expect(payloadOf({ kind: x.kind, id: x.id, date: x.date, hotel: x.hotel, expiresAt: x.expiresAt }, 'ja', await topicOf(x.date!, x.hotel!))).toEqual(x);
  });

  it('a stay’s topic: 32 base64url characters, the same for the same stay only', async () => {
    const t = await topicOf('2026-11-22', HOTEL);
    expect(t).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(await topicOf('2026-11-22', HOTEL)).toBe(t);
    expect(await topicOf('2026-11-21', HOTEL)).not.toBe(t);
    expect(await topicOf('2026-11-22', 'ホテル')).not.toBe(t);
  });
});

describe('push.ts: what a report’s events push', () => {
  const settings = (autoConfirm: boolean): ItsSettings => ({ ...DEFAULT_SETTINGS, autoConfirm });
  const e = (kind: ItsEvent['kind'], seq: number, x: Partial<ItsEvent> = {}): ItsEvent => ({ runId: RUN, seq, t: NOW, kind, date: FAR, hotel: HOTEL, ...x });
  const run = (added: ItsEvent[], x: { auto?: boolean; events?: ItsEvent[]; bookings?: BookingEntry[]; done?: string[]; now?: number } = {}) =>
    noticesFor(added, { settings: settings(x.auto ?? true), bookings: x.bookings ?? [], events: [...(x.events ?? []), ...added], done: x.done ?? [] }, x.now ?? NOW);

  it('a hold the bot will confirm: normal, till the hold lapses', () => {
    expect(run([e('hold', 1)]).notices).toEqual([{ kind: 'hold', id: `${RUN}:1`, date: FAR, hotel: HOTEL, urgency: 'normal', until: NOW + HOLD_MS, expiresAt: NOW + HOLD_MS }]);
  });

  it('a hold it won’t (auto-confirm off, or a stay nearer than 11 days): nothing; its human_needed: high, till the hold lapses', () => {
    expect(run([e('hold', 1)], { auto: false })).toMatchObject({ notices: [], skipped: [{ why: 'manual' }] });
    expect(run([e('hold', 1, { date: NEAR })])).toMatchObject({ notices: [], skipped: [{ why: 'manual' }] });
    const hold = e('hold', 1, { date: NEAR, t: NOW - 10 * MIN });
    const r = run([e('human_needed', 2, { date: NEAR, detail: 'near_date' })], { events: [hold] });
    expect(r.notices).toEqual([{ kind: 'human_needed', id: `${RUN}:2`, date: NEAR, hotel: HOTEL, urgency: 'high', until: hold.t + HOLD_MS, expiresAt: hold.t + HOLD_MS }]);
    // the hold's booking (receive time) counts as well: the earliest one
    const r2 = noticesFor([e('human_needed', 2, { date: NEAR, detail: 'auto_off' })], { settings: settings(false), bookings: [{ id: 'x', kind: 'hold', date: NEAR, hotel: 'NAGU　勝浦', at: NOW - 12 * MIN, runId: RUN }], events: [hold], done: [] }, NOW);
    expect(r2.notices[0].expiresAt).toBe(NOW - 12 * MIN + HOLD_MS);
  });

  it('human_needed: every code the runner sends for a waiting hold (its README’s list), only while the hold lasts, skipped with ≤ 120 s left', () => {
    const hold = e('hold', 1, { t: NOW - 10 * MIN });
    const push = (detail: string | undefined) => run([e('human_needed', 2, { detail })], { events: [hold] });
    // the round-2 runner's codes: the old leg_* / near_date list missed most of these
    const waiting = HUMAN_NEEDED_DETAILS.filter((d) => !NOT_BOOKED_DETAILS.includes(d) && !MAYBE_FILED_DETAILS.includes(d));
    expect(waiting).toEqual(expect.arrayContaining(['unmapped', 'fill_rejected', 'confirming_unacked', 'lease_stale', 'browser_busy', 'bad_booking', 'id_conflict']));
    for (const detail of [...waiting, 'queue_failed', 'apply_page_500', undefined]) {
      expect(push(detail).notices.map((n) => [n.kind, n.urgency]), String(detail)).toEqual([['human_needed', 'high']]);
    }
    // a definite non-booking, or a hold nobody wants (not_wanted: the date or facility was dropped mid-chain): no push
    expect(waiting).not.toContain('not_wanted');
    for (const detail of ['room_taken', 'hold_expired', 'not_wanted']) {
      expect(push(detail), detail).toEqual({ notices: [], skipped: [{ kind: 'human_needed', id: `${RUN}:2`, why: 'not_booked' }], done: [] });
    }
    expect(run([e('human_needed', 2, { detail: 'no_mail' })]).skipped).toEqual([{ kind: 'human_needed', id: `${RUN}:2`, why: 'no_hold' }]);
    const old = e('hold', 1, { t: NOW - HOLD_MS + MIN_LEFT_MS });
    expect(run([e('human_needed', 2, { detail: 'no_mail' })], { events: [old] }).skipped).toEqual([{ kind: 'human_needed', id: `${RUN}:2`, why: 'expired', left: 120 }]);
    const lapsed = e('hold', 1, { t: NOW - HOLD_MS });
    expect(run([e('human_needed', 2, { detail: 'no_mail' })], { events: [lapsed] }).skipped[0].why).toBe('no_hold');
  });

  it('a leg that may have filed (submit_unknown, no_completion): its own message, high, a day, with or without a live hold', () => {
    for (const detail of MAYBE_FILED_DETAILS) {
      const r = run([e('human_needed', 2, { detail })]);
      expect(r.notices, detail).toEqual([{ kind: 'maybe_filed', id: `${RUN}:2`, date: FAR, hotel: HOTEL, urgency: 'high', until: NOW + CONFIRMED_TTL_MS }]);
    }
    const at = { id: 'r:2', date: '2026-11-22', hotel: HOTEL };
    expect(payloadOf({ kind: 'maybe_filed', ...at }, 'ja', 'T')).toMatchObject({ title: '仮押さえ・要確認', body: 'NAGU 勝浦・11/22(日)・申込済みの可能性：メールとサイトで確認' });
    expect(payloadOf({ kind: 'maybe_filed', ...at }, 'en', 'T')).toMatchObject({ title: 'Room held: check', body: 'NAGU 勝浦 · Sun 22 Nov · may already be booked: check the email and the site' });
  });

  it('never “apply by mail” when the application may be filed: chrome_*, link_used, or an open confirming whatever the detail', () => {
    const hold = e('hold', 1, { t: NOW - 10 * MIN });
    const maybe = { kind: 'maybe_filed', id: `${RUN}:2`, date: FAR, hotel: HOTEL, urgency: 'high', until: NOW + CONFIRMED_TTL_MS };
    // by detail: Chrome failing mid-leg (the runner can't always tell 申込する was pressed), the mail's link already used
    for (const detail of ['chrome_x', 'chrome_runtimeerror', 'link_used']) {
      expect(run([e('human_needed', 2, { detail })], { events: [hold] }).notices, detail).toEqual([maybe]);
      expect(run([e('human_needed', 2, { detail })]).notices, `${detail}, no live hold`).toEqual([maybe]);
    }
    // a leg in flight for the stay (a confirming, no later confirmed / failed): whatever the detail
    const b = (kind: BookingEntry['kind'], at: number, x: Partial<BookingEntry> = {}): BookingEntry => ({ id: `${RUN}:${at}`, kind, date: FAR, hotel: 'NAGU　勝浦', at, runId: RUN, ...x });
    const open = [b('hold', NOW - 10 * MIN), b('confirming', NOW - 9 * MIN)];
    for (const detail of ['run_ended', 'near_date', 'lease_stale', 'room_taken', 'hold_expired', undefined]) {
      expect(run([e('human_needed', 2, { detail })], { events: [hold], bookings: open }).notices, String(detail)).toEqual([maybe]);
    }
    expect(run([e('human_needed', 2, { detail: 'run_ended' })], { bookings: open }).notices).toEqual([maybe]);   // the hold lapsed: still
    // settled (a later failed or confirmed), another stay's, or none: 要対応 while the hold lasts
    const near = (bookings: BookingEntry[]) => run([e('human_needed', 2, { detail: 'near_date' })], { events: [hold], bookings }).notices.map((n) => n.kind);
    expect(near([...open, b('failed', NOW - 8 * MIN)])).toEqual(['human_needed']);
    expect(near([...open, b('confirmed', NOW - 8 * MIN, { number: 'A1' })])).toEqual(['human_needed']);
    expect(near([b('confirming', NOW - 9 * MIN, { date: NEAR }), b('confirming', NOW - 9 * MIN, { hotel: 'ホテル' })])).toEqual(['human_needed']);
    expect(near([b('failed', NOW - 9 * MIN), b('confirming', NOW - 8 * MIN)])).toEqual(['maybe_filed']);   // a failed before it settles nothing
    expect(near([])).toEqual(['human_needed']);
    expect(run([e('human_needed', 2, { detail: 'room_taken' })], { events: [hold] }).notices).toEqual([]);
  });

  it('confirmed: normal, a day, the 申込受付番号', () => {
    expect(run([e('confirmed', 3, { detail: 'A1234567' })]).notices).toEqual([{ kind: 'confirmed', id: `${RUN}:3`, date: FAR, hotel: HOTEL, urgency: 'normal', until: NOW + CONFIRMED_TTL_MS, number: 'A1234567' }]);
  });

  it('once per hold and per 予約確定 (another run reporting it again pushes nothing); the rest never', () => {
    const first = run([e('hold', 1), e('confirmed', 2)]);
    expect(first.notices).toHaveLength(2);
    const again = run([e('hold', 1, { runId: 'other' }), e('confirmed', 2, { runId: 'other' })], { done: first.done });
    expect(again).toMatchObject({ notices: [], skipped: [{ why: 'done' }, { why: 'done' }] });
    expect(run(['available', 'ban', 'run_end', 'error', 'solve_failed', 'filtered'].map((k, i) => e(k as ItsEvent['kind'], i + 1)))).toEqual({ notices: [], skipped: [], done: [] });
    expect(run([e('hold', 1, { date: undefined })]).notices).toEqual([]);
  });

  it('outcomes and retries: backoff from 30 s, Retry-After, never past the TTL', () => {
    expect([201, 202, 404, 410, 401, 403, 400, 413, 429, 500, 503, 0, 418].map(outcomeOf)).toEqual(['ok', 'ok', 'gone', 'gone', 'config', 'config', 'bug', 'bug', 'retry', 'retry', 'retry', 'retry', 'bug']);
    expect(reasonOf('{"reason":"BadJwtToken"}')).toBe('BadJwtToken');
    expect(reasonOf('<html>https://web.push.apple.com/secret</html>')).toBeUndefined();
    const job = { tries: 0, until: NOW + 10 * MIN } as PushJob;
    expect(retryAt(job, NOW, null)).toBe(NOW + 30_000);
    expect(retryAt({ ...job, tries: 3 }, NOW, null)).toBe(NOW + 240_000);
    expect(retryAt({ ...job, tries: 9, until: NOW + 3600_000 }, NOW, null)).toBe(NOW + 15 * MIN);
    expect(retryAt(job, NOW, 120)).toBe(NOW + 120_000);
    expect(retryAt({ ...job, tries: 5 }, NOW, null)).toBeNull();   // 16 min > the 10 left
  });
});

// ---- The object and the routes ----

let state: State;
let bot: ItsBot;
let env: Env;
let logs: ReturnType<typeof quiet>;
let vapid: Awaited<ReturnType<typeof vapidPair>>;
let phones: Phone[];
let service: ReturnType<typeof fakePushService>;
let answers: Map<string, () => Response>;

const phone = async (n: number): Promise<Phone> => ({ ...(await phoneKeys()), endpoint: `https://${HOST}/p/${n}` });
const subBody = (p: Phone, lang = 'ja') => ({ endpoint: p.endpoint, keys: { p256dh: p.p256dh, auth: p.auth }, lang });
const post = (path: string, body: unknown, key = KEY_A) => page(env, path, { method: 'POST', body: JSON.stringify(body), key });
const subscribe = async (p: Phone, key = KEY_A, lang = 'ja') => {
  const r = await post('/its/push/subscribe', subBody(p, lang), key);
  expect(r.status, await r.clone().text()).toBe(200);
  return read(r);
};
const status = async (): Promise<ItsStatus> => (await page(env, '/its/status')).json();
const read = async (r: Response) => (await r.json()) as { ok: boolean; error?: string; push: ItsPushStatus };
const settingsInput = (x: Partial<ItsSettingsInput> = {}): ItsSettingsInput => ({ ...example.settingsInput, dates: [NEAR, FAR], baseUpdatedAt: null, ...x }) as ItsSettingsInput;
const ev = (seq: number, kind: EventInput['kind'], x: Partial<EventInput> = {}): EventInput => ({ seq, kind, date: FAR, hotel: HOTEL, ...x });
const holdBooking = (seq: number, date = FAR): BookingInput => ({ id: `${RUN}:${seq}`, kind: 'hold', date, hotel: HOTEL, runId: RUN });
const allLogs = () => [logs.debug, logs.log, logs.warn, logs.error].flatMap((m) => m.mock.calls.map((c) => c.map(String).join(' '))).join('\n');
const jobs = () => bot.rec.pushq;

async function fresh(extra: Partial<Env> = {}) {
  state = fakeState();
  const e = { VAPID_PUBLIC: vapid.publicKey, VAPID_PRIVATE: vapid.privateKey, ...extra };
  bot = await start(state, e);
  env = envOf(bot, e);
  service = fakePushService(vapid.publicKey, phones, (ep) => answers.get(ep)?.() ?? new Response(null, { status: 201 }));
  bot.pushDeps = { hosts: [HOST], fetch: service.fetch };
}

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  logs = quiet();
  vapid = await vapidPair();
  phones = await Promise.all([1, 2, 3, 4, 5, 6].map(phone));
  answers = new Map();
  await fresh();
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('POST /its/push/subscribe, /unsubscribe', () => {
  it('stores a member’s phone and answers the push status; the status counts per member and names the key', async () => {
    expect(await subscribe(phones[0])).toEqual({ ok: true, push: { A: 1, B: 0, vapidPublic: vapid.publicKey, lastSentAt: null, lastOutcome: null } });
    await subscribe(phones[1], KEY_B, 'en');
    expect((await status()).push).toEqual({ A: 1, B: 1, vapidPublic: vapid.publicKey, lastSentAt: null, lastOutcome: null });
    expect(bot.rec.subs.map((s) => [s.who, s.lang, s.at])).toEqual([['A', 'ja', NOW], ['B', 'en', NOW]]);
    expect(state.kv.get('subs')).toEqual(bot.rec.subs);   // persisted
    expect(allLogs()).toMatch(/its push subscribe by=A ep=[0-9a-f]{6} lang=ja subs=A1\/B0 moved=0 replaced=0 rid=/);
  });

  it('an endpoint is unique: subscribing it again refreshes it, from the other member moves it', async () => {
    await subscribe(phones[0]);
    vi.setSystemTime(NOW + MIN);
    await subscribe(phones[0]);
    expect(bot.rec.subs.map((s) => [s.who, s.at])).toEqual([['A', NOW + MIN]]);
    const r = await subscribe(phones[0], KEY_B);
    expect(r.push).toMatchObject({ A: 0, B: 1 });
    expect(allLogs()).toContain('moved=1');
  });

  it(`at most ${PUSH_SUBS_PER_MEMBER} per member: another replaces the least recently refreshed`, async () => {
    for (const [i, p] of phones.slice(0, 5).entries()) {
      vi.setSystemTime(NOW + i * MIN);
      await subscribe(p);
    }
    expect(bot.rec.subs.map((s) => s.endpoint)).toEqual(phones.slice(1, 5).map((p) => p.endpoint));
    await subscribe(phones[5], KEY_B);
    expect((await status()).push).toMatchObject({ A: 4, B: 1 });
  });

  it('a phone not refreshed in 30 days is dropped (and not counted)', async () => {
    await subscribe(phones[0]);
    vi.setSystemTime(NOW + 29 * 86_400_000);
    await subscribe(phones[1]);
    vi.setSystemTime(NOW + 30 * 86_400_000);
    expect((await status()).push?.A).toBe(1);
    await subscribe(phones[2]);
    expect(bot.rec.subs.map((s) => s.endpoint)).toEqual([phones[1].endpoint, phones[2].endpoint]);
  });

  it('refuses a bad endpoint, keys or lang (400), the guest and no key (401), another origin (403), a GET (405); push off (503)', async () => {
    const p = phones[0];
    const refused = async (body: unknown, code: number, error: string, key = KEY_A) => {
      const r = await post('/its/push/subscribe', body, key);
      expect([r.status, (await read(r)).error], JSON.stringify(body)).toEqual([code, error]);
    };
    await refused({ ...subBody(p), endpoint: 'https://web.push.apple.com/x' }, 400, 'bad_push_endpoint');   // not this test's allow-list
    await refused({ ...subBody(p), endpoint: `http://${HOST}/p/1` }, 400, 'bad_push_endpoint');
    await refused({ ...subBody(p), endpoint: 7 }, 400, 'bad_push_endpoint');
    await refused({ ...subBody(p), keys: { p256dh: p.p256dh.slice(0, 80), auth: p.auth } }, 400, 'bad_push_keys');
    await refused({ ...subBody(p), keys: { p256dh: p.p256dh } }, 400, 'bad_push_keys');
    await refused({ ...subBody(p), lang: 'fr' }, 400, 'bad_push_lang');
    await refused(subBody(p), 401, 'unauthorized', 'c'.repeat(64));
    const other = await page(env, '/its/push/subscribe', { method: 'POST', body: JSON.stringify(subBody(p)), headers: { Origin: 'https://evil.example' } });
    expect(other.status).toBe(403);
    expect((await page(env, '/its/push/subscribe')).status).toBe(405);
    const pre = await page(env, '/its/push/test', { method: 'OPTIONS' });
    expect([pre.status, pre.headers.get('Access-Control-Allow-Methods'), pre.headers.get('Access-Control-Allow-Origin')]).toEqual([204, 'POST', ORIGIN]);
    expect(bot.rec.subs).toEqual([]);
    await fresh({ VAPID_PUBLIC: 'REPLACE_AT_DEPLOY' });
    await refused(subBody(p), 503, 'push_off');
    expect((await status()).push).toEqual({ A: 0, B: 0, vapidPublic: null, lastSentAt: null, lastOutcome: null });
    expect(allLogs()).toContain('its refused status=400 why=bad_push_endpoint method=POST path=/its/push/subscribe by=A');
  });

  it('unsubscribe forgets the caller’s own (and its queued pushes) only', async () => {
    await subscribe(phones[0]);
    await subscribe(phones[1], KEY_B);
    const theirs = await post('/its/push/unsubscribe', { endpoint: phones[1].endpoint });
    expect([theirs.status, (await read(theirs)).push]).toEqual([200, expect.objectContaining({ A: 1, B: 1 })]);
    const mine = await post('/its/push/unsubscribe', { endpoint: phones[0].endpoint });
    expect((await read(mine)).push).toMatchObject({ A: 0, B: 1 });
    expect((await post('/its/push/unsubscribe', { endpoint: phones[0].endpoint })).status).toBe(200);   // again: ok
    expect((await post('/its/push/unsubscribe', {})).status).toBe(400);
    expect(allLogs()).toMatch(/its push unsubscribe by=A ep=[0-9a-f]{6} removed=1/);
  });
});

describe('a report’s events, the outbox and the alarm', () => {
  beforeEach(async () => {
    await bot.putSettings(settingsInput({ autoConfirm: true }), 'A', 'r-test');
    await bot.claim({ runId: RUN, host: 'actions' });
    await subscribe(phones[0]);
    await subscribe(phones[1], KEY_B, 'en');
  });

  it('a hold the bot confirms: queued for each phone in the report’s one put, the alarm set; sent by the alarm', async () => {
    const puts = state.count.puts;
    await bot.report(report({ events: [ev(1, 'hold')] }));
    expect(state.count.puts - puts).toBe(1);
    expect(jobs().map((j) => [j.kind, j.urgency, j.until])).toEqual([['hold', 'normal', NOW + HOLD_MS], ['hold', 'normal', NOW + HOLD_MS]]);
    expect(state.kv.get('pushq')).toEqual(jobs());
    expect(state.alarms).toEqual([NOW]);
    // a retried report adds nothing
    await bot.report(report({ events: [ev(1, 'hold')] }));
    expect(jobs()).toHaveLength(2);
    vi.setSystemTime(NOW + 1000);
    await bot.alarm();
    expect(jobs()).toEqual([]);
    expect(service.delivered.map((d) => [d.urgency, d.ttl, (d.message as ItsPushPayload).title]).sort()).toEqual([['normal', 1799, 'Room held'], ['normal', 1799, '仮押さえしました']]);
    expect((await status()).push).toMatchObject({ lastSentAt: NOW + 1000, lastOutcome: { at: NOW + 1000, kind: 'hold', code: 'ok', status: 201 } });
    expect(bot.rec.subs.every((s) => s.lastOk === NOW + 1000)).toBe(true);
  });

  it('a near stay’s hold pushes once, by its human_needed (high, till the hold lapses); 予約確定 replaces it (same Topic)', async () => {
    await bot.bookings([holdBooking(1, NEAR)], RUN);
    await bot.report(report({ events: [ev(1, 'hold', { date: NEAR }), ev(2, 'human_needed', { date: NEAR, detail: 'near_date' })] }));
    expect(jobs().map((j) => j.kind)).toEqual(['human_needed', 'human_needed']);
    await bot.alarm();
    vi.setSystemTime(NOW + 20 * MIN);
    await bot.report(report({ events: [ev(3, 'confirmed', { date: NEAR, detail: 'A1234567' })] }));
    await bot.alarm();
    // per phone (both are sent to concurrently, so their order within an alarm isn't fixed): the ja phone's two
    const ja = service.delivered.filter((d) => /[\u3040-\u30ff\u4e00-\u9fff]/.test((d.message as ItsPushPayload).title));
    const [hn, conf] = [ja.find((d) => (d.message as ItsPushPayload).kind === 'human_needed')!, ja.find((d) => (d.message as ItsPushPayload).kind === 'confirmed')!];
    expect(service.delivered).toHaveLength(4);
    expect([hn.urgency, hn.ttl, conf.urgency, conf.ttl]).toEqual(['high', 1800, 'normal', 86400]);
    expect(hn.topic).toBe(await topicOf(NEAR, HOTEL));
    expect(conf.topic).toBe(hn.topic);
    expect((conf.message as ItsPushPayload)).toMatchObject({ kind: 'confirmed', tag: hn.topic, body: 'NAGU 勝浦・11/22(日)・申込受付番号 A1234567' });
    expect(allLogs()).toContain(`its push skip manual kind=hold id=${RUN}:1`);
  });

  it('human_needed with ≤ 120 s of the hold left: skipped and logged', async () => {
    await bot.bookings([holdBooking(1, NEAR)], RUN);
    vi.setSystemTime(NOW + HOLD_MS - MIN_LEFT_MS + 1000);
    await bot.report(report({ events: [ev(2, 'human_needed', { date: NEAR, detail: 'no_mail' })] }));
    expect(jobs()).toEqual([]);
    expect(state.alarms).toEqual([]);
    expect(allLogs()).toContain(`its push skip expired kind=human_needed id=${RUN}:2 left=119s`);
  });

  it('404/410: the subscription deleted; 401/403: kept, not retried, Apple’s reason in the log and the status; 400/413: dropped as a bug', async () => {
    answers.set(phones[0].endpoint, () => new Response(null, { status: 410 }));
    answers.set(phones[1].endpoint, () => new Response('{"reason":"BadJwtToken"}', { status: 403 }));
    await bot.report(report({ events: [ev(1, 'hold')] }));
    await bot.alarm();
    expect(bot.rec.subs.map((s) => [s.who, s.fails])).toEqual([['B', 1]]);
    expect(jobs()).toEqual([]);
    expect(logs.error.mock.calls.flat().join('\n')).toMatch(/its push kind=hold id=19283746:1 ep=[0-9a-f]{6} who=B status=403 ms=\d+ outcome=config reason=BadJwtToken/);
    expect((await status()).push?.lastOutcome).toEqual({ at: NOW, kind: 'hold', code: 'config', status: 403, reason: 'BadJwtToken' });
    answers.set(phones[1].endpoint, () => new Response(null, { status: 413 }));
    await bot.report(report({ events: [ev(2, 'confirmed', { detail: 'A1' })] }));
    await bot.alarm();
    expect(jobs()).toEqual([]);
    expect((await status()).push?.lastOutcome).toMatchObject({ code: 'bug', status: 413 });
  });

  it('429/5xx/no answer: kept with a backoff and the alarm set again, until its TTL; then given up', async () => {
    let n = 0;
    answers.set(phones[0].endpoint, () => (n++ < 1 ? new Response(null, { status: 503 }) : new Response(null, { status: 201 })));
    service = fakePushService(vapid.publicKey, phones, (ep) => answers.get(ep)?.() ?? new Response(null, { status: 201 }));
    const net = vi.fn(async (req: Request) => (req.url === phones[1].endpoint ? Promise.reject(new TypeError('network')) : service.fetch(req)));
    bot.pushDeps = { hosts: [HOST], fetch: net };
    await bot.report(report({ events: [ev(1, 'hold')] }));
    await bot.alarm();
    expect(jobs().map((j) => [j.tries, j.next])).toEqual([[1, NOW + 30_000], [1, NOW + 30_000]]);
    expect(state.alarms.at(-1)).toBe(NOW + 30_000);
    vi.setSystemTime(NOW + 10_000);
    await bot.alarm();   // nothing due yet
    expect(net).toHaveBeenCalledTimes(2);
    vi.setSystemTime(NOW + 30_000);
    await bot.alarm();
    expect(jobs().map((j) => j.ep)).toEqual([bot.rec.subs[1].ep]);   // phone 0 ok now; phone 1 still unreachable
    for (let t = 1; t < 10 && jobs().length; t++) {
      vi.setSystemTime(jobs()[0].next);
      await bot.alarm();
    }
    expect(jobs()).toEqual([]);
    expect(allLogs()).toMatch(/its push gave_up kind=hold id=19283746:1 ep=[0-9a-f]{6} tries=\d/);
    expect(Math.max(...net.mock.calls.map(() => Date.now()))).toBeLessThan(NOW + HOLD_MS);
  });

  it('never fails the runner’s report: an alarm that can’t be set, a queue that throws (and the report never waits for a push: the alarm sends)', async () => {
    (state.ctx.storage as { setAlarm: unknown }).setAlarm = async () => { throw new Error('alarm down'); };
    const c = await bot.report(report({ events: [ev(1, 'hold')] }));
    expect(c.ackSeq).toBe(1);
    expect(jobs()).toHaveLength(2);
    expect(allLogs()).toContain('its push alarm failed err=');
    bot.rec.subs = null as never;   // jobsFor throws
    const r = await asRunner(env, '/runner/report', report({ events: [ev(2, 'confirmed')] }), RUNNER);
    expect(r.status).toBe(200);
    expect(bot.rec.events.important.some((e) => e.kind === 'confirmed')).toBe(true);
    expect(allLogs()).toContain('its push queue failed err=');
  });

  it('without the VAPID key: nothing queued (logged)', async () => {
    (bot as unknown as { env: Env }).env.VAPID_PRIVATE = undefined;
    await bot.report(report({ events: [ev(1, 'hold')] }));
    expect(jobs()).toEqual([]);
    expect(allLogs()).toContain('its push skip no_vapid notices=1');
  });

  it('a queued push whose subscription went, or with the VAPID key removed since: dropped, and logged', async () => {
    await bot.report(report({ events: [ev(1, 'hold')] }));
    const [a, b] = jobs();
    bot.rec.subs = bot.rec.subs.filter((s) => s.ep !== a.ep);
    await bot.alarm();
    expect(jobs()).toEqual([]);
    expect(allLogs()).toContain(`its push dropped why=no_sub kind=hold id=${RUN}:1 ep=${a.ep.slice(0, 6)}`);
    expect(service.delivered).toHaveLength(1);
    await bot.report(report({ events: [ev(2, 'confirmed', { detail: 'A1' })] }));
    expect(jobs()).toHaveLength(1);
    (bot as unknown as { env: Env }).env.VAPID_PRIVATE = undefined;
    await bot.alarm();
    expect(jobs()).toEqual([]);
    expect(allLogs()).toContain(`its push dropped why=no_vapid kind=confirmed id=${RUN}:2 ep=${b.ep.slice(0, 6)}`);
    expect(service.delivered).toHaveLength(1);
  });

  it('logs no endpoint, key or message text', async () => {
    await bot.report(report({ events: [ev(1, 'hold'), ev(2, 'confirmed', { detail: 'A1234567' })] }));
    answers.set(phones[1].endpoint, () => new Response('{"reason":"BadJwtToken"}', { status: 403 }));
    await bot.alarm();
    await post('/its/push/test', { endpoint: phones[0].endpoint });
    const all = allLogs();
    for (const p of phones.slice(0, 2)) for (const s of [p.endpoint, p.p256dh, p.auth, '/p/']) expect(all).not.toContain(s);
    for (const s of ['自動で確定します', 'Room held', 'テスト通知', vapid.privateKey]) expect(all).not.toContain(s);
  });
});

describe('POST /its/push/test', () => {
  beforeEach(async () => {
    await subscribe(phones[0]);
    await subscribe(phones[1], KEY_B);
  });

  it('pushes to the caller’s endpoint only, now, the outcome in the answer', async () => {
    const r = await post('/its/push/test', { endpoint: phones[0].endpoint });
    expect(r.status).toBe(200);
    expect((await read(r)).push.lastOutcome).toEqual({ at: NOW, kind: 'test', code: 'ok', status: 201 });
    expect(service.delivered.map((d) => [d.endpoint, d.urgency, (d.message as ItsPushPayload).kind, d.topic])).toEqual([[phones[0].endpoint, 'high', 'test', null]]);
    const theirs = await post('/its/push/test', { endpoint: phones[1].endpoint });
    expect([theirs.status, (await read(theirs)).error]).toEqual([404, 'not_subscribed']);
    expect((await post('/its/push/test', { endpoint: phones[3].endpoint })).status).toBe(404);
    expect(service.delivered).toHaveLength(1);
  });

  it(`one per ${PUSH_TEST_EVERY_SEC} s per endpoint (429), no daily cap`, async () => {
    const gap = PUSH_TEST_EVERY_SEC * 1000;
    expect((await post('/its/push/test', { endpoint: phones[0].endpoint })).status).toBe(200);
    vi.setSystemTime(NOW + gap - 1000);
    const r = await post('/its/push/test', { endpoint: phones[0].endpoint });
    expect([r.status, (await read(r)).error]).toEqual([429, 'rate_limited']);
    // the subscription keeps the last test's time only; subscribing again keeps it
    expect(bot.rec.subs.find((s) => s.who === 'A')).toMatchObject({ lastTest: NOW });
    expect(bot.rec.subs.some((s) => 'tests' in s)).toBe(false);
    await subscribe(phones[0]);
    expect((await post('/its/push/test', { endpoint: phones[0].endpoint })).status).toBe(429);
    expect((await post('/its/push/test', { endpoint: phones[1].endpoint }, KEY_B)).status).toBe(200);   // another endpoint
    // 40 in a row, each a gap apart: all sent (no daily cap)
    for (let i = 1; i <= 40; i++) {
      vi.setSystemTime(NOW + i * gap);
      expect((await post('/its/push/test', { endpoint: phones[0].endpoint })).status, String(i)).toBe(200);
    }
    expect(allLogs()).toContain('its push test refused rate_limited by=A');
  });
});

describe('end to end: a phone, a runner’s hold that needs a person, the alarm, a push service', () => {
  it('the push service verifies the VAPID JWT and the phone decrypts 「仮押さえ・要対応」 with its deadline', async () => {
    // the phone, through the page's route
    await page(env, '/its/settings', { method: 'PUT', body: JSON.stringify(settingsInput()) });
    await subscribe(phones[0]);
    await subscribe(phones[1], KEY_B, 'en');
    // the runner: claims, files the hold, reports it and the human_needed (auto-confirm off)
    expect((await asRunner(env, '/runner/claim', { runId: RUN, host: 'actions' })).status).toBe(200);
    expect((await asRunner(env, `/runner/bookings?runId=${RUN}`, [holdBooking(3, NEAR)])).status).toBe(200);
    vi.setSystemTime(NOW + 1000);
    const r = await asRunner(env, '/runner/report', report({ events: [ev(3, 'hold', { date: NEAR }), ev(4, 'human_needed', { date: NEAR, detail: 'auto_off' })] }));
    expect(r.status).toBe(200);
    expect(state.alarms).toEqual([NOW + 1000]);
    vi.setSystemTime(NOW + 2000);
    await bot.alarm();
    expect(service.refused).toEqual([]);
    const deadline = tokyoTime(NOW + HOLD_MS);
    const topic = await topicOf(NEAR, HOTEL);
    // both phones are sent to concurrently: their order at the push service is not fixed (it varied under load)
    const byPhone = [...service.delivered].sort((x, y) => phones.findIndex((p) => p.endpoint === x.endpoint) - phones.findIndex((p) => p.endpoint === y.endpoint));
    expect(byPhone).toEqual([
      {
        endpoint: phones[0].endpoint, ttl: 1798, urgency: 'high', topic,
        claims: { aud: `https://${HOST}`, exp: Math.floor((NOW + 2000) / 1000) + 12 * 3600, sub: 'https://island-fund.pages.dev' },
        message: { v: 1, kind: 'human_needed', id: `${RUN}:4`, tag: topic, title: '仮押さえ・要対応', body: `NAGU 勝浦・11/22(日)・${deadline}ごろまでにメールから申込`, open: 'its', date: NEAR, hotel: HOTEL, expiresAt: NOW + HOLD_MS },
      },
      expect.objectContaining({ endpoint: phones[1].endpoint, message: expect.objectContaining({ title: 'Room held: action needed', body: `NAGU 勝浦 · Sun 22 Nov · apply from the email by about ${deadline}` }) }),
    ]);
    expect((await status()).push).toEqual({ A: 1, B: 1, vapidPublic: vapid.publicKey, lastSentAt: NOW + 2000, lastOutcome: { at: NOW + 2000, kind: 'human_needed', code: 'ok', status: 201 } });
    // the example's status.push (statusNewer) is this shape
    const types = (o: object): unknown => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v && typeof v === 'object' ? types(v) : typeof v]));
    expect(types((await status()).push!)).toEqual(types(example.statusNewer.push));
    // a key the service doesn't know (a rotation not yet deployed to it): Apple's 403 BadJwtToken
    const stranger = fakePushService((await vapidPair()).publicKey, phones);
    bot.pushDeps = { hosts: [HOST], fetch: stranger.fetch };
    vi.setSystemTime(NOW + 31 * 1000);
    expect((await post('/its/push/test', { endpoint: phones[0].endpoint })).status).toBe(200);
    expect(stranger.refused).toEqual(['BadJwtToken']);
    expect((await status()).push?.lastOutcome).toMatchObject({ kind: 'test', code: 'config', status: 403, reason: 'BadJwtToken' });
  });
});
