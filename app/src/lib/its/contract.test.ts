// The ITS contract's validation and its parity with the runner (its/norm-cases.json, its/contract-example.json:
// the Python tests read the same files).
import { describe, expect, it } from 'vitest';
import norm from '../../../../its/norm-cases.json';
import example from '../../../../its/contract-example.json';
import {
  MAX_NAME, MAX_SEARCH, MAX_SITE_NAME, PUSH_HOSTS, PUSH_LANGS, PUSH_MAX_ENDPOINT, PUSH_ROUTES, daysUntil, isDate, isId, isName, normName,
  parseSettingsInput, tokyoToday, type ItsPushPayload, type ItsPushStatus, type PushSubscribeInput,
} from './contract.ts';

// 2026-11-13 12:00 JST
const NOW = Date.parse('2026-11-13T03:00:00Z');

describe('normName', () => {
  it('agrees with the runner on every case it can see (no HTML entities in typed names)', () => {
    for (const c of norm.cases.filter((x) => !x.entities)) expect(normName(c.in), c.why).toBe(c.out);
  });
});

describe('dates in Tokyo', () => {
  it('counts from Tokyo’s day, not UTC’s', () => {
    // 2026-11-13 23:30 UTC is already the 14th in Tokyo
    const late = Date.parse('2026-11-13T23:30:00Z');
    expect(tokyoToday(late)).toBe('2026-11-14');
    expect(daysUntil('2026-11-24', late)).toBe(10);
    expect(daysUntil('2026-11-24', NOW)).toBe(11);
  });
  it('accepts real calendar dates only', () => {
    expect(isDate('2026-02-28')).toBe(true);
    expect(isDate('2026-02-30')).toBe(false);
    expect(isDate('2026-2-3')).toBe(false);
  });
});

describe('parseSettingsInput', () => {
  const base = example.settingsInput;

  it('accepts the shared example', () => {
    expect(parseSettingsInput(base, NOW)).toEqual({ ok: true, value: base });
  });

  it('sorts and de-duplicates dates, refuses past and far ones', () => {
    const r = parseSettingsInput({ ...base, dates: ['2026-11-22', '2026-11-21', '2026-11-22'] }, NOW);
    expect(r.ok && r.value.dates).toEqual(['2026-11-21', '2026-11-22']);
    expect(parseSettingsInput({ ...base, dates: ['2026-11-12'] }, NOW)).toEqual({ ok: false, error: 'past_date' });
    expect(parseSettingsInput({ ...base, dates: ['2028-01-01'] }, NOW)).toEqual({ ok: false, error: 'far_date' });
    expect(parseSettingsInput({ ...base, dates: ['2026-11-13'] }, NOW).ok).toBe(true);   // tonight
  });

  it('de-duplicates names by normName and lets skipping win over priority', () => {
    const r = parseSettingsInput({ ...base, skip: ['NAGU 勝浦', 'ＮＡＧＵ　勝浦'], priority: ['nagu勝浦', 'リソル'] }, NOW);
    expect(r.ok && r.value.skip).toEqual(['NAGU 勝浦']);
    expect(r.ok && r.value.priority).toEqual(['リソル']);
  });

  it('takes the allow-list as sent (trimmed, de-duplicated by normName, a skipped name kept: skip wins at match time)', () => {
    const r = parseSettingsInput({ ...base, skip: ['NAGU 勝浦'], search: [' NAGU  勝浦 ', 'ＮＡＧＵ　勝浦', 'リソル'] }, NOW);
    expect(r.ok && r.value.search).toEqual(['NAGU 勝浦', 'リソル']);
    expect(parseSettingsInput({ ...base, search: [] }, NOW)).toMatchObject({ ok: true, value: { search: [] } });   // searches nothing
  });

  it('an older page’s body (no search) has none: the Worker keeps the saved list', () => {
    const r = parseSettingsInput({ ...base, search: undefined }, NOW);
    expect(r.ok && 'search' in r.value).toBe(false);
  });

  it('caps the allow-list at MAX_SEARCH site names', () => {
    const many = (n: number) => Array.from({ length: n }, (_, i) => `施設${i}`);
    expect(parseSettingsInput({ ...base, search: many(MAX_SEARCH) }, NOW).ok).toBe(true);
    expect(parseSettingsInput({ ...base, search: many(MAX_SEARCH + 1) }, NOW)).toEqual({ ok: false, error: 'bad_hotels' });
    expect(parseSettingsInput({ ...base, search: ['あ'.repeat(MAX_SITE_NAME)] }, NOW).ok).toBe(true);
    expect(parseSettingsInput({ ...base, search: ['あ'.repeat(MAX_SITE_NAME + 1)] }, NOW)).toEqual({ ok: false, error: 'bad_hotels' });
    expect(parseSettingsInput({ ...base, search: ['a\u202eb'] }, NOW)).toEqual({ ok: false, error: 'bad_hotels' });
    expect(parseSettingsInput({ ...base, search: 'NAGU' }, NOW)).toEqual({ ok: false, error: 'bad_hotels' });
    expect(parseSettingsInput({ ...base, search: null }, NOW)).toEqual({ ok: false, error: 'bad_hotels' });
  });

  it('refuses control and bidi characters, bad intervals, guests and shapes', () => {
    expect(parseSettingsInput({ ...base, skip: ['a\u202eb'] }, NOW)).toEqual({ ok: false, error: 'bad_hotels' });
    expect(parseSettingsInput({ ...base, skip: ['a\nb'] }, NOW)).toEqual({ ok: false, error: 'bad_hotels' });
    expect(parseSettingsInput({ ...base, intervalSec: 10 }, NOW)).toEqual({ ok: false, error: 'bad_interval' });
    expect(parseSettingsInput({ ...base, guests: 0 }, NOW)).toEqual({ ok: false, error: 'bad_guests' });
    expect(parseSettingsInput({ ...base, autoConfirm: 'yes' }, NOW)).toEqual({ ok: false, error: 'bad_shape' });
    expect(parseSettingsInput([], NOW)).toEqual({ ok: false, error: 'bad_shape' });
  });
});

describe('isName and isId (the Worker’s checks, the runner mirrors them)', () => {
  it('names: non-empty, capped, no control or bidi character', () => {
    expect(isName('NAGU 勝浦')).toBe(true);
    expect(isName('')).toBe(false);
    expect(isName('a\u202eb')).toBe(false);
    expect(isName('a\tb')).toBe(false);
    expect(isName('x'.repeat(MAX_NAME))).toBe(true);
    expect(isName('x'.repeat(MAX_NAME + 1))).toBe(false);
    expect(isName('x'.repeat(MAX_SITE_NAME), MAX_SITE_NAME)).toBe(true);
    expect(isName(5)).toBe(false);
  });
  it('ids: a run id on Actions (run-attempt), a booking id, a local id', () => {
    for (const ok of ['19283746-2', '19283746-2:3', 'mbp2.local_1']) expect(isId(ok), ok).toBe(true);
    for (const bad of ['', 'a b', 'x'.repeat(65), 'a/b', 7]) expect(isId(bad), String(bad)).toBe(false);
  });
  it('a skipped name may be a site’s long one; a priority substring may not', () => {
    const long = 'あ'.repeat(MAX_NAME + 1);
    expect(parseSettingsInput({ ...example.settingsInput, skip: [long] }, NOW).ok).toBe(true);
    expect(parseSettingsInput({ ...example.settingsInput, skip: ['あ'.repeat(MAX_SITE_NAME + 1)] }, NOW)).toEqual({ ok: false, error: 'bad_hotels' });
    expect(parseSettingsInput({ ...example.settingsInput, priority: [long] }, NOW)).toEqual({ ok: false, error: 'bad_hotels' });
  });
});

describe('push (the page reads the Worker’s, the service worker its message)', () => {
  it('the example’s status.push, inputs and message have the contract’s fields', () => {
    const push: ItsPushStatus = example.statusNewer.push as ItsPushStatus;
    expect(Object.keys(push).sort()).toEqual(['A', 'B', 'lastOutcome', 'lastSentAt', 'vapidPublic']);
    expect(push.vapidPublic).toMatch(/^B[A-Za-z0-9_-]{86}$/);   // 65 bytes, uncompressed
    const sub: PushSubscribeInput = example.pushSubscribeInput as PushSubscribeInput;
    expect(PUSH_HOSTS).toContain(new URL(sub.endpoint).hostname);
    expect(sub.endpoint.length).toBeLessThanOrEqual(PUSH_MAX_ENDPOINT);
    expect(PUSH_LANGS).toContain(sub.lang);
    expect(example.pushEndpointInput).toEqual({ endpoint: sub.endpoint });
    const msg: ItsPushPayload = example.pushPayload as ItsPushPayload;
    expect(msg).toMatchObject({ v: 1, kind: 'human_needed', open: 'its' });
    expect(new TextEncoder().encode(JSON.stringify(msg)).length).toBeLessThan(3000);
    expect(Object.values(PUSH_ROUTES)).toEqual(['/its/push/subscribe', '/its/push/unsubscribe', '/its/push/test']);
  });
});
