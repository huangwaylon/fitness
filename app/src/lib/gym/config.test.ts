// ボット's ジム tab's calls (config.ts): GET /gym/config checked (garbled → null, an older Worker's hides the section),
// what the section shows after each outcome, and POST /gym/act (its body and headers, the answer's config, the
// refusals with the bot's hint, a 409's config, a 429's Retry-After, offline; each failure logged as gym.fail).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchConfig, parseConfig, postAct, settle, type ConfigReply, type GymConfig } from './config.ts';
import { addDays, type DayRow } from './contract.ts';

const logs = vi.hoisted(() => [] as unknown[][]);
vi.mock('#lib/sync/log.ts', () => ({ log: (...a: unknown[]) => void logs.push(a) }));

const NOW = Date.parse('2026-10-03T12:00:00+09:00');
const KEY = 'a'.repeat(64);
const URL_ = 'https://gym.example';

const row = (i: number, patch: Partial<DayRow> = {}): DayRow =>
  ({ day: addDays('2026-10-03', i), rule: null, usual: i < 4, from: null, announced: [], resettable: false, base: `b${i}`, ...patch });

/** GET /gym/config's answer (gym/src/actions.ts config): 📋's parts, the 25 rows and the rest. */
function wire(): GymConfig {
  const days = [
    { day: '2026-10-03', date: '10/3（土）', rule: '⏰ 12:00〜13:00（ふだん）', from: null, soft: false },
    { day: '2026-10-04', date: '10/4（日）', rule: '🔕 通知オフ', from: null, soft: true }
  ];
  const rows = Array.from({ length: 25 }, (_, i) => row(i));
  rows[1] = row(1, { rule: 'skip', resettable: true });
  rows[2] = row(2, { rule: ['18:00', '20:00'], from: NOW + 3_600_000, announced: ['18:30'], resettable: true });
  return {
    v: 1, now: NOW, title: '📋 日ごとの設定', days, notice: null, check: '15分ごとにチェック・前回 11:45・次回 12:15', text: '📋 …', paused: false,
    intervalMin: 15, lastCheck: NOW - 900_000, nextCheck: NOW + 900_000, rows, defaultDays: 4, intervals: [10, 15, 30, 60], checkReadyAt: null, checking: false,
    changes: [{ t: NOW - 60_000, by: 'A', who: 'ウェイ', a: 'skip', d: '2026-10-04', text: '10/4（日）🔕 通知オフ（ウェイ）' }]
  };
}

describe('parseConfig', () => {
  it('keeps it all', () => {
    expect(parseConfig(JSON.parse(JSON.stringify(wire())))).toEqual(wire());
  });

  it.each([
    ['not an object', () => 'nope'],
    ['another version', () => ({ ...wire(), v: 2 })],
    ['an older Worker’s (no rows)', () => ({ ...wire(), rows: undefined })],
    ['a row with a bad rule', () => ({ ...wire(), rows: [row(0, { rule: ['12:15', '13:00'] })] })],
    ['a row with a bad announced time', () => ({ ...wire(), rows: [row(0, { announced: ['noon'] })] })],
    ['a row with a text ⏳', () => ({ ...wire(), rows: [{ ...row(0), from: '12:00' }] })],
    ['a day without its rule', () => ({ ...wire(), days: [{ day: '2026-10-03', date: '10/3（土）' }] })],
    ['a notice that isn’t text', () => ({ ...wire(), notice: true })],
    ['paused not a boolean', () => ({ ...wire(), paused: 'no' })],
    ['a proxy’s page', () => ({ ok: false, error: 'unauthorized' })]
  ])('garbled → null: %s', (_, make) => {
    expect(parseConfig(make())).toBeNull();
  });

  it('leaves a garbled change out, and takes missing extras as their defaults', () => {
    const p = { ...wire(), changes: [{ t: 'x' }, ...wire().changes], intervals: undefined, checking: undefined, defaultDays: undefined };
    expect(parseConfig(p)).toMatchObject({ changes: wire().changes, intervals: [10, 15, 30, 60], checking: false, defaultDays: 4 });
  });
});

describe('fetchConfig', () => {
  afterEach(() => vi.unstubAllGlobals());
  const answer = (status: number, body: unknown) => {
    const f = vi.fn(async () => new Response(typeof body === 'string' ? body : JSON.stringify(body), { status }));
    vi.stubGlobal('fetch', f);
    return f;
  };

  it('asks with this phone’s key, never from a cache', async () => {
    const f = answer(200, wire());
    expect(await fetchConfig(undefined, URL_, KEY)).toEqual({ ok: true, config: wire() });
    expect(f).toHaveBeenCalledWith(`${URL_}/gym/config`, expect.objectContaining({ cache: 'no-store', headers: { Authorization: `Bearer ${KEY}` } }));
  });

  it('hides the section for an older Worker (404, or 📋’s parts without the rows), a key it won’t take (401, 403), or no key', async () => {
    for (const s of [401, 403, 404]) {
      answer(s, 'not found');
      expect(await fetchConfig(undefined, URL_, KEY)).toEqual({ ok: false, why: 'hide' });
    }
    const { rows: _, ...old } = wire();
    answer(200, old);
    expect(await fetchConfig(undefined, URL_, KEY)).toEqual({ ok: false, why: 'hide' });
    const f = answer(200, wire());
    expect(await fetchConfig(undefined, URL_, null)).toEqual({ ok: false, why: 'hide' });
    expect(await fetchConfig(undefined, '', KEY)).toEqual({ ok: false, why: 'hide' });
    expect(f).not.toHaveBeenCalled();
  });

  it('fails on a server error or garbage; unreached when fetch throws (offline, or a refused preflight)', async () => {
    answer(500, '{}');
    expect(await fetchConfig(undefined, URL_, KEY)).toEqual({ ok: false, why: 'failed' });
    answer(200, { v: 1, rows: 'x' });
    expect(await fetchConfig(undefined, URL_, KEY)).toEqual({ ok: false, why: 'failed' });
    answer(200, '<html>');
    expect(await fetchConfig(undefined, URL_, KEY)).toEqual({ ok: false, why: 'failed' });
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Load failed'); }));
    expect(await fetchConfig(undefined, URL_, KEY)).toEqual({ ok: false, why: 'unreached' });
  });
});

describe('settle', () => {
  const good: ConfigReply = { ok: true, config: wire() };
  const no = (why: 'hide' | 'failed' | 'unreached'): ConfigReply => ({ ok: false, why });

  it('shows a good answer', () => {
    expect(settle(null, good)).toEqual({ cfg: wire(), state: 'ok' });
  });

  it('before any good answer: unreached hides (an older Worker’s refused preflight looks the same), failed offers a retry', () => {
    expect(settle(null, no('unreached'))).toEqual({ cfg: null, state: 'hidden' });
    expect(settle(null, no('hide'))).toEqual({ cfg: null, state: 'hidden' });
    expect(settle(null, no('failed'))).toEqual({ cfg: null, state: 'failed' });
  });

  it('after one: a failure keeps it under the retry row; hide drops it', () => {
    expect(settle(wire(), no('unreached'))).toEqual({ cfg: wire(), state: 'failed' });
    expect(settle(wire(), no('failed'))).toEqual({ cfg: wire(), state: 'failed' });
    expect(settle(wire(), no('hide'))).toEqual({ cfg: null, state: 'hidden' });
  });
});

describe('postAct', () => {
  beforeEach(() => void logs.splice(0));
  afterEach(() => vi.unstubAllGlobals());
  const answer = (status: number, body: unknown, headers: Record<string, string> = {}) => {
    const f = vi.fn(async (_u: string, _i: RequestInit) => new Response(JSON.stringify(body), { status, headers }));
    vi.stubGlobal('fetch', f);
    return f;
  };

  it('posts the act with the key and a request id, and takes the config after it', async () => {
    const f = answer(200, { ok: true, changed: true, reply: '👍 …', config: wire() });
    expect(await postAct({ a: 'any', d: '2026-10-05', base: 'b2' }, undefined, URL_, KEY)).toEqual({ ok: true, changed: true, config: wire() });
    const [url, init] = f.mock.calls[0];
    expect(url).toBe(`${URL_}/gym/act`);
    expect(init).toMatchObject({ method: 'POST', cache: 'no-store', body: '{"a":"any","d":"2026-10-05","base":"b2"}' });
    expect(init.headers).toMatchObject({ Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', 'X-Request-Id': expect.stringMatching(/^[0-9a-f]{8}$/) });
    expect(logs).toEqual([]);
  });

  it('🔎: the lines, partial and the slots', async () => {
    const slots = [{ day: '2026-10-04', start: '12:00', end: '12:30', programs: ['training', 'x'] }];
    answer(200, { ok: true, changed: false, reply: '', config: wire(), lines: ['🟢 いま空いている枠', '10/4（日）'], partial: false, slots });
    expect(await postAct({ a: 'check' }, undefined, URL_, KEY)).toMatchObject({ ok: true, lines: ['🟢 いま空いている枠', '10/4（日）'], partial: false, slots: [{ ...slots[0], programs: ['training'] }] });
  });

  it('a refusal: the code, the bot’s hint, a 409’s config, a 429’s seconds; logged with the code and the id', async () => {
    answer(409, { ok: false, error: 'stale', hint: 'ほかの人が…', config: wire() });
    expect(await postAct({ a: 'skip', d: '2026-10-05', base: 'old' }, undefined, URL_, KEY)).toEqual({ ok: false, err: 'stale', http: 409, hint: 'ほかの人が…', config: wire() });
    answer(429, { ok: false, error: 'cooldown', hint: '⏱️ 45秒ほど…' }, { 'Retry-After': '45' });
    expect(await postAct({ a: 'check' }, undefined, URL_, KEY)).toEqual({ ok: false, err: 'cooldown', http: 429, hint: '⏱️ 45秒ほど…', retryAfter: 45 });
    answer(422, { ok: false, error: 'from_passed', hint: 'その日時はもう過ぎています。' });
    expect(await postAct({ a: 'from', d: '2026-10-03', at: '09:00' }, undefined, URL_, KEY)).toMatchObject({ ok: false, err: 'from_passed', http: 422 });
    answer(502, '<html>');
    expect(await postAct({ a: 'check' }, undefined, URL_, KEY)).toEqual({ ok: false, err: 'http', http: 502 });
    expect(logs.map(([name, f, level]) => [name, (f as { err: string }).err, (f as { rid: string }).rid.length, level])).toEqual([
      ['gym.fail', 'stale', 8, 1], ['gym.fail', 'cooldown', 8, 1], ['gym.fail', 'from_passed', 8, 1], ['gym.fail', 'http', 8, 2]
    ]);
  });

  it('offline, garbage, no key; the page’s own abort is no failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Load failed'); }));
    expect(await postAct({ a: 'pause' }, undefined, URL_, KEY)).toEqual({ ok: false, err: 'offline', http: null });
    answer(200, { ok: true });
    expect(await postAct({ a: 'pause' }, undefined, URL_, KEY)).toEqual({ ok: false, err: 'json', http: 200 });
    expect(await postAct({ a: 'pause' }, undefined, URL_, null)).toEqual({ ok: false, err: 'no_key', http: null });
    const ctl = new AbortController();
    vi.stubGlobal('fetch', vi.fn(async () => { ctl.abort(); throw new DOMException('aborted', 'AbortError'); }));
    logs.splice(0);
    await postAct({ a: 'pause' }, ctl.signal, URL_, KEY);
    expect(logs).toEqual([]);
  });
});
