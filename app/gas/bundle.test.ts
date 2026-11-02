// The committed app/apps-script/Code.js is what Apps Script runs: prove it is current, has the top-level entry point
// Apps Script needs, and actually works when run as a plain global script.
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

  it('has a top-level doPost, and no doGet, imports or exports', () => {
    expect(code).toMatch(/^function doPost\(e\) \{$/m);
    expect(code).not.toMatch(/function doGet/);
    expect(code).not.toMatch(/^\s*(import|export)\s/m);
    expect(code).not.toMatch(/\brequire\(/);
  });

  it('the manifest pins the current-sheet-only and external-request scopes and the anonymous web app', () => {
    const manifest = JSON.parse(readFileSync(new URL('../apps-script/appsscript.json', import.meta.url), 'utf8'));
    expect(manifest).toEqual({
      runtimeVersion: 'V8',
      timeZone: 'Asia/Tokyo',
      exceptionLogging: 'STACKDRIVER',
      oauthScopes: ['https://www.googleapis.com/auth/spreadsheets.currentonly', 'https://www.googleapis.com/auth/script.external_request'],
      webapp: { executeAs: 'USER_DEPLOYING', access: 'ANYONE_ANONYMOUS' }
    });
  });

  it('runs in a bare V8 context with the fakes: health, the forward, garbage', () => {
    const gas = makeGas();
    const ctx = vm.createContext({ ...gas.globals, console });
    vm.runInContext(code, ctx, { filename: 'Code.js' });
    const call = (body: unknown) =>
      JSON.parse(ctx.doPost({ postData: { contents: typeof body === 'string' ? body : JSON.stringify(body) } }).text);
    const key = 'a'.repeat(64);
    expect(call({ key, action: 'snapshot' })).toEqual({ ok: true, echo: { key, action: 'snapshot' } });
    expect(call('{oops')).toEqual({ ok: false, error: 'bad_request' });
    expect(JSON.parse(ctx.doPost(undefined).text)).toEqual({ ok: false, error: 'bad_request' });
    expect(call({ action: 'health' })).toEqual({ ok: true, build: buildHash() });
    expect(buildHash()).toMatch(/^[0-9a-f]{12}$/);
    expect(code.split('\n')[2]).toBe(`// build: ${buildHash()}`); // what the health monitor compares against (docs/ops/runbook.md §3)
  });
});
