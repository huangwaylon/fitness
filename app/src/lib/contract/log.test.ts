// The log's schema (contract/log.ts): the registry keeps only known fields of their kinds, and the scrubbers leave
// nothing that could be a key, a health value, a name or a URL in a message or a stack.
import { describe, expect, it } from 'vitest';
import { cleanData, isLogId, isToken, logRoute, scrubMsg, scrubStack, LOG_EVENTS, type LogEventName } from './log.ts';

const KEY = '3f9a'.repeat(16);
/** What must never come out: a key (whole or a piece), health values, Japanese text, names, a URL's fragment. */
const CANARIES = [KEY, KEY.slice(0, 32), KEY.slice(0, 20), '68.4', '22.3', '8564', '鮭の塩焼き', 'Chicken salad', 'Umeko', '#key=', 'island-fund.pages.dev', 'me@example.com'];
const leaks = (s: string) => CANARIES.filter((c) => s.includes(c));

describe('scrubMsg', () => {
  it('keeps the error as its fingerprint, without data', () => {
    const cases: [string, string][] = [
      ["undefined is not an object (evaluating 'e.stats().fps')", "undefined is not an object (evaluating 'e.stats().fps')"],
      ['Unexpected token \'C\', "Chicken salad 68.4" is not valid JSON', 'Unexpected token "…", "…" is not valid JSON'],
      [`Failed to fetch https://island-fund.pages.dev/pair#key=${KEY}`, 'Failed to fetch <url>'],
      [`bad key ${KEY} for Umeko`, 'bad key <id> for Umeko'],
      ['weight 68.4 out of range on 2026-11-01', 'weight # out of range on #-#-#'],
      ['鮭の塩焼き is missing', '… is missing'],
      ['a {"steps":8564} b [1,2]', 'a {…} b {…}'],
      ['x'.repeat(300), 'x'.repeat(120).replace(/x{16,}/, '<id>').slice(0, 120)]
    ];
    const bad: string[] = [];
    for (const [i, want] of cases) if (scrubMsg(i) !== want) bad.push(`${i.slice(0, 40)} → ${scrubMsg(i)} (want ${want})`);
    expect(bad).toEqual([]);
  });

  it('never leaves a canary', () => {
    const inputs = [
      `JSON.parse: "{\\"key\\":\\"${KEY}\\",\\"weight\\":68.4}"`, `see me@example.com about 22.3 %`, `${KEY.slice(0, 20)} 8564 steps`,
      `https://island-fund.pages.dev/?demo#key=${KEY}`, `/pair#key=${KEY}`, `'Umeko' said 鮭の塩焼き`, `\`Chicken salad\``
    ];
    expect(inputs.flatMap((s) => leaks(scrubMsg(s)).map((c) => `${s} → ${c}`))).toEqual([]);
  });
});

describe('scrubStack', () => {
  it("reads Safari's and Chrome's frames as fn@file:line:col, the top four", () => {
    const safari = `stats@https://island-fund.pages.dev/_app/immutable/chunks/Island3D.BkX9a2.js:12:3456\nglobal code@https://island-fund.pages.dev/pair#key=${KEY}:1:20\n@https://x/_app/a.js?v=${KEY}:3:4\nf@x.js:1:1\ng@y.js:2:2`;
    expect(scrubStack(safari)).toBe('stats@Island3D.BkX9a2.js:12:3456\n?@pair:1:20\n?@a.js:3:4\nf@x.js:1:1');
    const chrome = `TypeError: Chicken salad 68.4\n    at Object.fps (https://h/_app/immutable/chunks/w.js:7:89)\n    at https://h/b.js:1:2`;
    expect(scrubStack(chrome)).toBe('Object.fps@w.js:7:89\n?@b.js:1:2');
    expect(leaks(scrubStack(safari) + scrubStack(chrome))).toEqual([]);
  });
});

describe('cleanData', () => {
  it('keeps only the registry’s fields, each of its kind; every canary everywhere comes out', () => {
    const bad: string[] = [];
    for (const e of Object.keys(LOG_EVENTS) as LogEventName[]) {
      const d: Record<string, unknown> = { key: KEY, weight: 68.4, name: 'Umeko', note: 'Chicken salad', [`sheet:${KEY}`]: 1, 'sheet:鮭': 2 };
      for (const k of Object.keys(LOG_EVENTS[e].f)) d[k] = k === 'msg' ? `${KEY} 68.4 鮭の塩焼き` : k === 'stack' ? `f@https://x/pair#key=${KEY}:1:2` : KEY;
      const out = JSON.stringify(cleanData(e, d));
      for (const c of leaks(out)) bad.push(`${e}: ${c} in ${out}`);
      if (/weight|name|note|"key"/.test(out)) bad.push(`${e}: unknown field kept: ${out}`);
    }
    expect(bad).toEqual([]);
  });

  it('numbers bounded and rounded, closed sets closed, counters by kind', () => {
    expect(cleanData('api.fail', { action: 'events', err: 'busy', ms: 123.456, http: Infinity, tries: '3' })).toEqual({ action: 'events', err: 'busy', ms: 123.5 });
    expect(cleanData('api.fail', { action: 'drop_table', err: 'whatever' })).toEqual({});
    expect(cleanData('use', { 'sheet:island.food': 2, 'ev:tally': 1, 'x:y': 1, 'route:/tent': 1, 'act:fish': true })).toEqual({ 'sheet:island.food': 2, 'ev:tally': 1 });
    expect(cleanData('req', { why: 'pocket short', ms: 1e12 })).toEqual({ ms: 1e7 });
  });

  it('tokens, ids and routes', () => {
    expect([isToken('tent_full'), isToken('a b'), isToken(KEY.slice(0, 16)), isToken('Island3D.BkX9a2.js')]).toEqual([true, false, false, true]);
    expect([isLogId('k2j4h5g6f7'), isLogId(KEY), isLogId('abc')]).toEqual([true, false, false]);
    expect([logRoute('/tent/x?y'), logRoute(`/pair#key=${KEY}`), logRoute('/'), logRoute('/nope')]).toEqual(['/tent', '/pair', '/', 'other']);
  });
});
