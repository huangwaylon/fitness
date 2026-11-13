// 現在の設定 as 設定's ジムボット page reads it (config.ts): the payload checked (garbled → null), the fetch's
// outcomes (shown, hidden for an older Worker or a key it won't take, failed, unreached) and what the section shows
// after each.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchConfig, parseConfig, settle, type ConfigReply, type GymConfig } from './config.ts';

const NOW = Date.parse('2026-10-03T12:00:00+09:00');
const KEY = 'a'.repeat(64);

/** gym/test/messages.test.ts's store, as GET /gym/config answers it (gym/src/actions.ts GymConfig, all of it). */
function wire() {
  const days = [
    { day: '2026-10-03', date: '10/3（土）', rule: '⏰ 12:00〜13:00（ふだん）', from: null, soft: false },
    { day: '2026-10-04', date: '10/4（日）', rule: '🔕 通知オフ', from: null, soft: true },
    { day: '2026-10-05', date: '10/5（月）', rule: '⏰ 12:00〜14:00', from: '⏳ 10/4（日）16:00から', soft: false },
    { day: '2026-10-20', date: '10/20（火）', rule: '🔔 終日', from: null, soft: false },
    { day: '2026-10-21', date: '10/21（水）', rule: '💤 まだチェックしない（3日前から自動で12:00〜13:00をチェック）', from: '⏳ 10/21（水）09:00から', soft: true }
  ];
  const notice = '⚠️ 現在、ジムの予約サイトに接続しにくい状態です。', check = '15分ごとにチェック・前回 08:45・次回 —';
  const text = ['📋 日ごとの設定', ...days.map((d) => `・${d.date}　${d.rule}${d.from ? `　${d.from}` : ''}`), notice, check].join('\n');
  return { v: 1, now: NOW, title: '📋 日ごとの設定', days, notice, check, paused: false, intervalMin: 15, lastCheck: NOW - 3 * 3_600_000, nextCheck: null, text };
}

/** What the page keeps of it: only what it shows. */
function shown(): GymConfig {
  const { title, days, notice, check, paused } = wire();
  return { title, days, notice, check, paused };
}

describe('parseConfig', () => {
  it('keeps what the page shows, each day’s soft as the Worker says', () => {
    expect(parseConfig(JSON.parse(JSON.stringify(wire())))).toEqual(shown());
  });

  it('takes an older Worker’s days without soft as not soft (no emoji read)', () => {
    const old = { ...wire(), days: wire().days.map(({ soft: _, ...d }) => d) };
    expect(parseConfig(old)!.days.map((d) => d.soft)).toEqual([false, false, false, false, false]);
  });

  it.each([
    ['not an object', () => 'nope'],
    ['another version', () => ({ ...wire(), v: 2 })],
    ['no title', () => ({ ...wire(), title: '' })],
    ['days not a list', () => ({ ...wire(), days: {} })],
    ['a day without its rule', () => ({ ...wire(), days: [{ day: '2026-10-03', date: '10/3（土）' }] })],
    ['a bad day key', () => ({ ...wire(), days: [{ ...wire().days[0], day: 'tomorrow' }] })],
    ['a numeric ⏳', () => ({ ...wire(), days: [{ ...wire().days[0], from: 5 }] })],
    ['a soft that isn’t a boolean', () => ({ ...wire(), days: [{ ...wire().days[0], soft: 'yes' }] })],
    ['a notice that isn’t text', () => ({ ...wire(), notice: true })],
    ['no closing line', () => ({ ...wire(), check: undefined })],
    ['paused not a boolean', () => ({ ...wire(), paused: 'no' })],
    ['a proxy’s page', () => ({ ok: false, error: 'unauthorized' })]
  ])('garbled → null: %s', (_, make) => {
    expect(parseConfig(make())).toBeNull();
  });

  it('takes a missing notice or ⏳ as none', () => {
    const p: Record<string, unknown> = { ...wire(), days: [{ day: '2026-10-03', date: '10/3（土）', rule: '🔔 終日' }] };
    delete p.notice;
    expect(parseConfig(p)).toMatchObject({ notice: null, days: [{ from: null, soft: false }] });
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
    expect(await fetchConfig(undefined, 'https://gym.example', KEY)).toEqual({ ok: true, config: shown() });
    expect(f).toHaveBeenCalledWith('https://gym.example/gym/config', expect.objectContaining({ cache: 'no-store', headers: { Authorization: `Bearer ${KEY}` } }));
  });

  it('hides the section for an older Worker (404), a key it won’t take (401, 403), or no key', async () => {
    for (const s of [401, 403, 404]) {
      answer(s, 'not found');
      expect(await fetchConfig(undefined, 'https://gym.example', KEY)).toEqual({ ok: false, why: 'hide' });
    }
    const f = answer(200, wire());
    expect(await fetchConfig(undefined, 'https://gym.example', null)).toEqual({ ok: false, why: 'hide' });
    expect(await fetchConfig(undefined, '', KEY)).toEqual({ ok: false, why: 'hide' });
    expect(f).not.toHaveBeenCalled();
  });

  it('fails on a server error or garbage; unreached when fetch throws (offline, or a refused preflight)', async () => {
    answer(500, '{}');
    expect(await fetchConfig(undefined, 'https://gym.example', KEY)).toEqual({ ok: false, why: 'failed' });
    answer(200, { v: 1 });
    expect(await fetchConfig(undefined, 'https://gym.example', KEY)).toEqual({ ok: false, why: 'failed' });
    answer(200, '<html>');
    expect(await fetchConfig(undefined, 'https://gym.example', KEY)).toEqual({ ok: false, why: 'failed' });
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Load failed'); }));
    expect(await fetchConfig(undefined, 'https://gym.example', KEY)).toEqual({ ok: false, why: 'unreached' });
  });
});

describe('settle', () => {
  const good: ConfigReply = { ok: true, config: shown() };
  const no = (why: 'hide' | 'failed' | 'unreached'): ConfigReply => ({ ok: false, why });

  it('shows a good answer', () => {
    expect(settle(null, good)).toEqual({ cfg: shown(), state: 'ok' });
  });

  it('before any good answer: unreached hides (an older Worker’s refused preflight looks the same), failed offers a retry', () => {
    expect(settle(null, no('unreached'))).toEqual({ cfg: null, state: 'hidden' });
    expect(settle(null, no('hide'))).toEqual({ cfg: null, state: 'hidden' });
    expect(settle(null, no('failed'))).toEqual({ cfg: null, state: 'failed' });
  });

  it('after one: a failure keeps it under the retry row; hide drops it', () => {
    expect(settle(shown(), no('unreached'))).toEqual({ cfg: shown(), state: 'failed' });
    expect(settle(shown(), no('failed'))).toEqual({ cfg: shown(), state: 'failed' });
    expect(settle(shown(), no('hide'))).toEqual({ cfg: null, state: 'hidden' });
  });
});
