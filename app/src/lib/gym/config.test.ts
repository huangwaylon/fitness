// 現在の設定 as 設定's ジムボット page reads it (config.ts): the payload checked (garbled → null), the fetch's
// outcomes (shown, hidden for an older Worker or a key it won't take, failed) and the rows.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { configRows, fetchConfig, parseConfig, type GymConfig } from './config.ts';

const NOW = Date.parse('2026-10-03T12:00:00+09:00');
const KEY = 'a'.repeat(64);

/** gym/test/messages.test.ts's store, as GET /gym/config answers it. */
function payload(): GymConfig {
  const days = [
    { day: '2026-10-03', date: '10/3（土）', rule: '⏰ 12:00〜13:00（ふだん）', from: null },
    { day: '2026-10-04', date: '10/4（日）', rule: '🔕 通知オフ', from: null },
    { day: '2026-10-05', date: '10/5（月）', rule: '⏰ 12:00〜14:00', from: '⏳ 10/4（日）16:00から' },
    { day: '2026-10-20', date: '10/20（火）', rule: '🔔 終日', from: null },
    { day: '2026-10-21', date: '10/21（水）', rule: '💤 まだチェックしない（3日前から自動で12:00〜13:00をチェック）', from: '⏳ 10/21（水）09:00から' }
  ];
  const notice = '⚠️ 現在、ジムの予約サイトに接続しにくい状態です。', check = '15分ごとにチェック・前回 08:45・次回 —';
  const text = ['📋 日ごとの設定', ...days.map((d) => `・${d.date}　${d.rule}${d.from ? `　${d.from}` : ''}`), notice, check].join('\n');
  return { v: 1, now: NOW, title: '📋 日ごとの設定', days, notice, check, paused: false, intervalMin: 15, lastCheck: NOW - 3 * 3_600_000, nextCheck: null, text };
}

describe('parseConfig', () => {
  it('reads an answer as it is', () => {
    expect(parseConfig(JSON.parse(JSON.stringify(payload())))).toEqual(payload());
  });

  it.each([
    ['not an object', () => 'nope'],
    ['another version', () => ({ ...payload(), v: 2 })],
    ['no title', () => ({ ...payload(), title: '' })],
    ['days not a list', () => ({ ...payload(), days: {} })],
    ['a day without its rule', () => ({ ...payload(), days: [{ day: '2026-10-03', date: '10/3（土）' }] })],
    ['a bad day key', () => ({ ...payload(), days: [{ ...payload().days[0], day: 'tomorrow' }] })],
    ['a numeric ⏳', () => ({ ...payload(), days: [{ ...payload().days[0], from: 5 }] })],
    ['a notice that isn’t text', () => ({ ...payload(), notice: true })],
    ['no closing line', () => ({ ...payload(), check: undefined })],
    ['paused not a boolean', () => ({ ...payload(), paused: 'no' })],
    ['no text', () => ({ ...payload(), text: null })],
    ['a proxy’s page', () => ({ ok: false, error: 'unauthorized' })]
  ])('garbled → null: %s', (_, make) => {
    expect(parseConfig(make())).toBeNull();
  });

  it('takes a missing notice or ⏳ as none, and times that aren’t numbers as unknown', () => {
    const p: Record<string, unknown> = { ...payload(), days: [{ day: '2026-10-03', date: '10/3（土）', rule: '🔔 終日' }], lastCheck: 'x' };
    delete p.notice;
    expect(parseConfig(p)).toMatchObject({ notice: null, lastCheck: null, days: [{ from: null }] });
  });
});

describe('configRows', () => {
  it('keeps the bot’s words, 🔕 and 💤 soft', () => {
    const rows = configRows(payload());
    expect(rows.map((r) => [r.date, r.rule, r.from, r.soft])).toEqual([
      ['10/3（土）', '⏰ 12:00〜13:00（ふだん）', null, false],
      ['10/4（日）', '🔕 通知オフ', null, true],
      ['10/5（月）', '⏰ 12:00〜14:00', '⏳ 10/4（日）16:00から', false],
      ['10/20（火）', '🔔 終日', null, false],
      ['10/21（水）', '💤 まだチェックしない（3日前から自動で12:00〜13:00をチェック）', '⏳ 10/21（水）09:00から', true]
    ]);
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
    const f = answer(200, payload());
    expect(await fetchConfig(undefined, 'https://gym.example', KEY)).toEqual({ ok: true, config: payload() });
    expect(f).toHaveBeenCalledWith('https://gym.example/gym/config', expect.objectContaining({ cache: 'no-store', headers: { Authorization: `Bearer ${KEY}` } }));
  });

  it('hides the section for an older Worker (404), a key it won’t take (401, 403), or no key', async () => {
    for (const s of [401, 403, 404]) {
      answer(s, 'not found');
      expect(await fetchConfig(undefined, 'https://gym.example', KEY)).toEqual({ ok: false, why: 'hide' });
    }
    const f = answer(200, payload());
    expect(await fetchConfig(undefined, 'https://gym.example', null)).toEqual({ ok: false, why: 'hide' });
    expect(await fetchConfig(undefined, '', KEY)).toEqual({ ok: false, why: 'hide' });
    expect(f).not.toHaveBeenCalled();
  });

  it('fails (a retry offered) on a server error, garbage or no network', async () => {
    answer(500, '{}');
    expect(await fetchConfig(undefined, 'https://gym.example', KEY)).toEqual({ ok: false, why: 'failed' });
    answer(200, { v: 1 });
    expect(await fetchConfig(undefined, 'https://gym.example', KEY)).toEqual({ ok: false, why: 'failed' });
    answer(200, '<html>');
    expect(await fetchConfig(undefined, 'https://gym.example', KEY)).toEqual({ ok: false, why: 'failed' });
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline'); }));
    expect(await fetchConfig(undefined, 'https://gym.example', KEY)).toEqual({ ok: false, why: 'failed' });
  });
});
