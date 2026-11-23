// The banner's store (toast.svelte.ts) on Svelte's client runtime: a show() from inside an effect must not make that
// effect depend on the banner it sets (6ea052b56's wait-for-the-undo check read `current`, and an effect that showed a
// notice looped to effect_update_depth_exceeded: Kit's error page on a phone). vitest compiles .svelte.ts files for the
// server (no effects run), so the module is compiled for the client here, as hiking/map/feed.test.ts does.
import { afterAll, describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { compileModule } from 'svelte/compiler';
import { transformWithOxc } from 'vite';
import type { Toasts as ToastsT } from './toast.svelte.ts';

type Client = { effect_root(fn: () => void): () => void; user_effect(fn: () => void): void; flush(): void; state(v: unknown): unknown; get(s: unknown): unknown; set(s: unknown, v: unknown): void };
const runtime = pathToFileURL(createRequire(import.meta.url).resolve('svelte/internal/client')).href;
const dir = mkdtempSync(join(tmpdir(), 'toasts-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));
const src = readFileSync(new URL('./toast.svelte.ts', import.meta.url), 'utf8');
const js = (await transformWithOxc(src, 'toast.svelte.ts', { lang: 'ts' })).code;
writeFileSync(join(dir, 'toast.mjs'), compileModule(js, { generate: 'client', filename: 'toast.svelte.js' }).js.code.replaceAll("'svelte/internal/client'", JSON.stringify(runtime)).replace(/from ["']svelte["']/g, `from ${JSON.stringify(runtime)}`));
const [{ Toasts }, $] = (await Promise.all([import(/* @vite-ignore */ pathToFileURL(join(dir, 'toast.mjs')).href), import(/* @vite-ignore */ runtime)])) as [{ Toasts: typeof ToastsT }, Client];

describe('the banner from an effect', () => {
  it('a show() inside an effect runs it once, an undo showing or not (no loop on the banner it sets)', () => {
    const t = new Toasts();
    const tick = $.state(0);
    let runs = 0;
    const stop = $.effect_root(() => {
      $.user_effect(() => {
        $.get(tick);
        runs++;
        t.show(`notice ${runs}`);
      });
    });
    $.flush();
    expect([runs, t.current?.text]).toEqual([1, 'notice 1']);
    // an undo showing: the effect's notice waits for it, and the effect still runs once a change
    t.show('undo', 4000, { action: { label: '取り消す', run: () => {} } });
    $.set(tick, 1);
    $.flush();
    expect([runs, t.current?.text]).toEqual([2, 'undo']);
    stop();
  });
});
