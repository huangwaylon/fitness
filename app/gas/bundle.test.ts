// The committed app/apps-script/Code.js is what gets pasted into Apps Script: prove it is current, has the
// top-level entry point Apps Script needs, and actually works when run as a plain global script.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import { bundle, buildHash, OUT_FILE } from './build.ts';
import { makeGas } from './fakes.ts';

const code = readFileSync(OUT_FILE, 'utf8');

describe('apps-script/Code.js', () => {
  it('is up to date with app/gas (run `npm run gas:build`)', () => {
    expect(code).toBe(bundle());
  });

  it('has a top-level doPost, onEdit and resync, and no doGet, imports or exports', () => {
    expect(code).toMatch(/^function doPost\(e\) \{$/m);
    expect(code).toMatch(/^function onEdit\(e\) \{$/m);
    expect(code).toMatch(/^function resync\(\) \{$/m);
    expect(code).not.toMatch(/function doGet/);
    expect(code).not.toMatch(/^\s*(import|export)\s/m);
    expect(code).not.toMatch(/\brequire\(/);
  });

  it('the manifest pins the current-sheet-only scope and the anonymous web app', () => {
    const manifest = JSON.parse(readFileSync(new URL('../apps-script/appsscript.json', import.meta.url), 'utf8'));
    expect(manifest).toEqual({
      runtimeVersion: 'V8',
      timeZone: 'Asia/Tokyo',
      exceptionLogging: 'STACKDRIVER',
      oauthScopes: ['https://www.googleapis.com/auth/spreadsheets.currentonly'],
      webapp: { executeAs: 'USER_DEPLOYING', access: 'ANYONE_ANONYMOUS' }
    });
  });

  it('runs in a bare V8 context with the fakes: ingest, dedupe, snapshot, garbage', () => {
    const gas = makeGas();
    const ctx = vm.createContext({ ...gas.globals, console });
    vm.runInContext(code, ctx, { filename: 'Code.js' });
    const call = (body: unknown) =>
      JSON.parse(ctx.doPost({ postData: { contents: typeof body === 'string' ? body : JSON.stringify(body) } }).text);
    const key = 'a'.repeat(64);
    const body = { key, action: 'ingest', dates: 'Sep 28, 2026 at 7:11 AM\nSep 29, 2026 at 7:55 AM', steps: '855\n9106', exercise_minutes: '0\n23' };
    expect(call(body)).toEqual({ ok: true, metrics: 4, workouts: 0 });
    expect(call(body)).toEqual({ ok: true, metrics: 0, workouts: 0 });
    const snap = call({ key, action: 'snapshot' });
    expect(snap.rows.metrics.map((r: unknown[]) => r.slice(1))).toEqual([
      ['A', '2026-09-28', 'steps', 855], ['A', '2026-09-29', 'steps', 9106],
      ['A', '2026-09-28', 'exercise_min', 0], ['A', '2026-09-29', 'exercise_min', 23]
    ]);
    expect(call('{oops')).toEqual({ ok: false, error: 'bad_request' });
    expect(JSON.parse(ctx.doPost(undefined).text)).toEqual({ ok: false, error: 'bad_request' });
    expect(call({ key: 'b'.repeat(64), action: 'whoami' })).toEqual({ ok: true, me: 'B', build: buildHash() });
    expect(call({ action: 'health' })).toEqual({ ok: true, build: buildHash() });
    expect(buildHash()).toMatch(/^[0-9a-f]{12}$/);
    expect(call({ key, action: 'snapshot' }).rev).toEqual(expect.any(String));
    expect(() => ctx.onEdit(undefined)).not.toThrow();
    expect(typeof ctx.resync).toBe('function');
  });
});
