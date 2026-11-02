// The web app since step 5 (docs/backend.md#the-record): the forward to the relay's record and the export from it,
// on the fakes of the Apps Script services (fakes.ts).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHmac } from 'node:crypto';
import { ABOUT_TAB, doPost, EXPORT_WINDOW_MS, MAX_BODY_CHARS, RECORD_API_URL } from './main.ts';
import { install, makeGas, type Gas } from './fakes.ts';

const KEY_A = 'a'.repeat(64);
const KEY_B = 'b'.repeat(64);

let gas: Gas;
beforeEach(() => {
  gas = makeGas();
  install(gas);
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-02T03:00:00.000Z'));
});
afterEach(() => vi.useRealTimers());

const raw = (contents: unknown) => JSON.parse((doPost(contents as never) as unknown as { text: string }).text);
const post = (body: unknown) => raw({ postData: { contents: typeof body === 'string' ? body : JSON.stringify(body) } });

describe('never throws, never reads the query string', () => {
  it('answers garbage with JSON', () => {
    const cases: unknown[] = [undefined, null, {}, { postData: {} }, { postData: { contents: '' } }, { postData: { contents: 5 } }];
    for (const c of cases) expect(raw(c), JSON.stringify(c)).toEqual({ ok: false, error: 'bad_request' });
    for (const s of ['{not json', 'null', '"str"', '[1,2]', '42']) expect(post(s), s).toEqual({ ok: false, error: 'bad_request' });
    expect(post({ pad: 'x'.repeat(MAX_BODY_CHARS) })).toEqual({ ok: false, error: 'too_large' });
  });

  it('never reads e.parameter', () => {
    const e = { postData: { contents: JSON.stringify({ action: 'health' }) } };
    Object.defineProperty(e, 'parameter', { get() { throw new Error('doPost read e.parameter'); } });
    expect(raw(e)).toEqual({ ok: true, build: 'dev' });
  });

  it('replies are JSON-typed', () => {
    const out = doPost({ postData: { contents: '{"action":"health"}' } }) as unknown as { mime: string };
    expect(out.mime).toBe('application/json');
  });
});

describe('health', () => {
  it('keyless {"action":"health"} answers the build without Properties, the sheet or the relay', () => {
    expect(post({ action: 'health' })).toEqual({ ok: true, build: 'dev' });
    expect(gas.state.propReads).toBe(0);
    expect(gas.sheets.size).toBe(0);
    expect(gas.state.fetches).toEqual([]);
  });
});

describe('the forward to the relay’s record', () => {
  it('hands every other request on as it came, as ASCII, and its reply back as it is', () => {
    const body = { key: KEY_A, action: 'event', id: 'e1', type: 'pref', data: { key: 'villagerName', value: 'うめ' } };
    expect(post(body)).toEqual({ ok: true, echo: body });
    const f = gas.state.fetches.at(-1)!;
    expect(f.url).toBe(RECORD_API_URL);
    expect(/^[\x20-\x7e]*$/.test(f.payload)).toBe(true);
    const shortcut = { action: 'ingest', key: KEY_B, dates: 'Oct 2, 2026 at 7:25 AM', steps: '5' };
    expect(post(shortcut)).toEqual({ ok: true, echo: shortcut });
    expect(post({ key: KEY_A, action: 'export' })).toMatchObject({ ok: true, echo: { action: 'export' } }); // with a key: not the relay's
    expect(gas.sheets.size).toBe(0); // nothing written here
    expect(gas.state.propReads).toBe(0);
  });

  it('a refusal comes back as the record gave it; an outage (an HTTP error, garbage, a throw) is unavailable', () => {
    gas.state.record = () => ({ status: 200, text: '{"ok":false,"error":"unauthorized"}' });
    expect(post({ key: 'f'.repeat(64), action: 'whoami' })).toEqual({ ok: false, error: 'unauthorized' });
    gas.state.record = () => ({ status: 502, text: '<html>' });
    expect(post({ key: KEY_A, action: 'snapshot' })).toEqual({ ok: false, error: 'unavailable', detail: 'record 502' });
    gas.state.record = () => ({ status: 200, text: 'nope' });
    expect(post({ key: KEY_A, action: 'snapshot' })).toEqual({ ok: false, error: 'unavailable' });
    gas.state.relay = 'denied';
    expect(post({ key: KEY_A, action: 'snapshot' })).toEqual({ ok: false, error: 'unavailable' });
  });
});

describe('the export from the record', () => {
  const secret = createHmac('sha256', `${KEY_A}:${KEY_B}`).update('island-relay-notify/1').digest('hex');
  const rows = {
    metrics: [['2026-11-01T00:00:00.000Z', 'A', '2026-11-01', 'steps', 5000], ['2026-11-01T00:00:00.000Z', 'A', '2026-11-01', 'weight', 68.4]],
    events: [['2026-11-01T01:00:00.000Z', 'B', 'n1', 'pref', '{"key":"villagerName","value":"うめ"}']],
    uploads: [['2026-11-01T00:00:00.000Z', 'A', 'ok', 2264, ' | dates:text[32]']]
  };
  const exp = (r: object = { rows, rev: 'e1', upto: '2026-11-01T01:00:00.000Z', at: '2026-11-02T03:00:00.000Z' }, t = String(Date.now()), key = secret) => {
    const data = JSON.stringify(r);
    return post({ action: 'export', t, sig: createHmac('sha256', key).update(`${t}.${data}`).digest('hex'), data });
  };
  const tab = (n: string) => gas.sheets.get(n)!;

  it('rewrites every tab with its header and the rows, dates as text, and says it is a read-only export', () => {
    expect(exp()).toEqual({ ok: true, written: { metrics: 2, events: 1, uploads: 1 } });
    expect(tab('metrics').rows).toEqual([['at', 'person', 'date', 'metric', 'value'], ...rows.metrics]); // the date stays text
    expect(tab('events').rows).toEqual([['at', 'person', 'id', 'type', 'data'], ...rows.events]);
    expect(tab('metrics').frozen).toBe(1);
    expect(tab('metrics').notes.get('1:1')).toMatch(/one-way export/);
    expect(tab(ABOUT_TAB).rows.slice(0, 2).map((r) => r[0])).toEqual([expect.stringMatching(/never reach the app/), expect.stringMatching(/読み取り専用/)]);
    expect(tab(ABOUT_TAB).rows.at(-1)).toEqual(['rows', 'metrics 2, events 1, uploads 1']);
    // a hand edit and rows the record no longer has: gone at the next export
    tab('events').rows.push(['x', 'A', 'typed', 'pref', '{}']);
    expect(exp({ rows: { ...rows, events: [] } })).toMatchObject({ ok: true, written: { events: 0 } });
    expect(tab('events').rows).toEqual([['at', 'person', 'id', 'type', 'data']]);
    expect(gas.state.lockHeld).toBe(false);
  });

  it('grows a tab past its rows', () => {
    const many = Array.from({ length: 1500 }, (_, i) => [`2026-11-01T00:00:${String(i % 60).padStart(2, '0')}.000Z`, 'A', '2026-11-01', 'steps', i]);
    expect(exp({ rows: { ...rows, metrics: many } })).toMatchObject({ ok: true, written: { metrics: 1500 } });
    expect(tab('metrics').data()).toHaveLength(1500);
  });

  it('refuses an export not signed by the relay, or signed too long ago; and a bad body', () => {
    expect(exp(undefined, undefined, 'wrong')).toEqual({ ok: false, error: 'unauthorized' });
    expect(exp(undefined, String(Date.now() - EXPORT_WINDOW_MS - 1))).toEqual({ ok: false, error: 'unauthorized' });
    expect(post({ action: 'export', t: String(Date.now()), sig: 'x', data: '{}' })).toEqual({ ok: false, error: 'unauthorized' });
    expect(exp({ rows: { metrics: 'x' } })).toEqual({ ok: false, error: 'bad_request' });
    expect(gas.sheets.size).toBe(0);
  });

  it('busy while another export holds the lock; a failing spreadsheet is unavailable, the lock released', () => {
    gas.state.lockAvailable = false;
    expect(exp()).toEqual({ ok: false, error: 'busy' });
    gas.state.lockAvailable = true;
    gas.state.spreadsheetThrows = true;
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(exp()).toEqual({ ok: false, error: 'unavailable' });
    expect(gas.state.lockHeld).toBe(false);
  });
});
