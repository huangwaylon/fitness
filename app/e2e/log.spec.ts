// The log end to end (docs/ops/observability.md): a paired phone (`?log=on`: the log is off under automation
// otherwise) throws an error; leaving the page sends it (`keepalive`) to `/log`, where the relay's real code
// (relay/src/log.ts on node:sqlite) keeps it scrubbed with the phone's role, its session and its build, beside the
// app's open and the `/api` requests' ids. With E2E_TEST_RELAY=1 (and relay/.smoke-keys) the batch goes to the test
// relay instead, and the spec reads it back with the CLI (`npm run logs -- --test --sid …`), as an investigation would.
import { expect, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { StoreCore } from '../../relay/src/store.ts';
import { LogCore } from '../../relay/src/log.ts';
import { memSql } from '../../relay/test/sqlite.ts';
import { hudMenu } from './hud.ts';

const RELAY = 'https://island-fund-relay.island-fund-relay.workers.dev';
const TEST_RELAY = 'https://island-fund-relay-test.island-fund-relay.workers.dev';
const SMOKE_KEYS = `${import.meta.dirname}/../../relay/.smoke-keys`;
const LIVE = process.env.E2E_TEST_RELAY === '1' && existsSync(SMOKE_KEYS);
const testKeyA = () => Object.fromEntries(readFileSync(SMOKE_KEYS, 'utf8').trim().split('\n').map((l) => l.split('='))).KEY_A as string;

test('a forced error reaches the log, scrubbed, with the session, the role and the build', async ({ browser }) => {
  test.setTimeout(60_000);
  const KEY_A = LIVE ? testKeyA() : 'a1'.repeat(32);
  const keys = { KEY_A, KEY_B: 'b2'.repeat(32), KEY_C: 'c3'.repeat(32) };
  const db = memSql();
  const store = new StoreCore({ sql: db.sql, tx: db.tx, keys, now: () => Date.now(), notify: () => {} });
  const logs = new LogCore({ sql: memSql().sql, tx: (fn) => fn(), keys, now: () => Date.now() });
  const batches: { s: string; key: string; es: { e: string }[] }[] = [];
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
  await context.addInitScript((key) => {
    localStorage.setItem('island.key', key);
    localStorage.setItem('e2e.render', 'none');
  }, KEY_A);
  await context.routeWebSocket(/\/room/, () => {});
  await context.route(`${RELAY}/**`, async (route) => {
    const req = route.request(), text = req.postData() ?? '';
    const cors = { 'Access-Control-Allow-Origin': '*' };
    if (new URL(req.url()).pathname === '/log') {
      batches.push(JSON.parse(text));
      if (LIVE) {
        const res = await fetch(`${TEST_RELAY}/log`, { method: 'POST', headers: { 'Content-Type': 'text/plain', Origin: 'http://localhost' }, body: text });
        return route.fulfill({ status: 200, contentType: 'application/json', headers: cors, body: await res.text() });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify(logs.ingestText(text)) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', headers: cors, body: store.handleText(text) });
  });
  const page = await context.newPage();
  await page.goto('?log=on&critter=none&visitor=none');
  await expect(hudMenu(page)).toBeVisible();
  // a bug, as the phone would meet it: thrown from a timer, its message carrying what must never be kept; then the
  // page goes (the log writes itself and sends what it has with keepalive)
  await page.evaluate((key) => new Promise<void>((done) => {
    setTimeout(() => { throw new TypeError(`forced e2e error: weight 68.4, 鮭の塩焼き, ${key}`); });
    setTimeout(() => (dispatchEvent(new PageTransitionEvent('pagehide')), done()), 50);
  }), KEY_A);
  await expect.poll(() => batches.flatMap((b) => b.es.map((e) => e.e))).toContain('js.error');
  const sid = batches.find((b) => b.es.some((e) => e.e === 'js.error'))!.s;
  type Row = { ev: string; role: string | null; sid: string | null; build: string | null; d: Record<string, unknown> };
  const read = (): Row[] => LIVE
    ? JSON.parse(execFileSync('node', ['scripts/logs.ts', '--test', '--sid', sid, '--since', '10m', '--json'], { cwd: `${import.meta.dirname}/../../relay`, encoding: 'utf8' })) as Row[]
    : logs.query({ since: 0, sid }).rows;
  const rows = read();
  const err = rows.find((r) => r.ev === 'js.error');
  const bad: string[] = [];
  if (!err) bad.push(`no js.error in ${rows.map((r) => r.ev).join(',')}`);
  else {
    if (err.role !== 'A') bad.push(`role ${err.role}`);
    if (err.d.msg !== 'TypeError: forced e#e error: weight #, …, <id>') bad.push(`msg ${String(err.d.msg)}`);
    if (!err.build) bad.push('no build');
  }
  if (!rows.some((r) => r.ev === 'app.open' && r.d.route === '/')) bad.push('no app.open');
  const all = JSON.stringify(rows);
  if (all.includes(KEY_A) || /68\.4|鮭/.test(all)) bad.push('a key or a value was kept');
  // the phone's /api requests carried this session's id and their own (the relay's req rows join them)
  if (!LIVE && !batches.every((b) => b.key === KEY_A)) bad.push('a batch without its key');
  expect(bad).toEqual([]);
  await context.close();
});
