// TrailMap's props into its engine (feed.svelte.ts): whichever comes first, the engine or the track, the track is
// drawn; each prop moves only its own part of the map. On Svelte's client runtime: vitest compiles .svelte.ts files for
// the server (no effects run), so the module is compiled for the client here (as kikimimi/scene/karaoke.test.ts).
import { afterAll, describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { compileModule } from 'svelte/compiler';
import { transformWithOxc } from 'vite';
import type { EngineFeed } from './feed.svelte.ts';
import type { Engine, Fix } from './engine.ts';
import type { Prepared } from '#lib/hiking/track.ts';

type Client = { effect_root(fn: () => void): () => void; flush(): void; state(v: unknown): unknown; get(s: unknown): unknown; set(s: unknown, v: unknown): void };
const runtime = createRequire(import.meta.url).resolve('svelte/internal/client');
const dir = mkdtempSync(join(tmpdir(), 'trail-feed-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));
const src = readFileSync(new URL('./feed.svelte.ts', import.meta.url), 'utf8');
const js = (await transformWithOxc(src, 'feed.svelte.ts', { lang: 'ts' })).code;
writeFileSync(join(dir, 'feed.mjs'), compileModule(js, { generate: 'client', filename: 'feed.svelte.js' }).js.code.replaceAll("'svelte/internal/client'", JSON.stringify(pathToFileURL(runtime).href)));
const [{ EngineFeed: Feed }, $] = (await Promise.all([import(/* @vite-ignore */ pathToFileURL(join(dir, 'feed.mjs')).href), import(/* @vite-ignore */ pathToFileURL(runtime).href)])) as [{ EngineFeed: typeof EngineFeed }, Client];
const flushSync = () => $.flush();

const PREP = { pts: [[0, 0, 0], [1, 1, 1]] } as unknown as Prepared;

function fakeEngine() {
  const calls: string[] = [];
  const engine: Engine = {
    setTrack: (p) => calls.push(`track ${p ? 'set' : 'none'}`),
    setScrub: (p) => calls.push(`scrub ${p ? 'set' : 'none'}`),
    setFix: (f, fly) => calls.push(`fix ${f ? 'set' : 'none'}${fly ? ' fly' : ''}`),
    fit: (b, t) => calls.push(`fit ${b} ${t}`),
    zoom: () => {},
    state: () => ({ track: 0, scrub: 0, box: null }),
    destroy: () => {}
  };
  return { engine, calls };
}

type Props = { prep: Prepared | null; scrub: Fix | null; fix: Fix | null; bottom: number; top: number };
function setup() {
  const st = { prep: $.state(null), scrub: $.state(null), fix: $.state(null), bottom: $.state(200), top: $.state(150) };
  const props = new Proxy({} as Props, { get: (_, k: keyof Props) => $.get(st[k]), set: (_, k: keyof Props, v) => ($.set(st[k], v), true) });
  let feed!: EngineFeed;
  const stop = $.effect_root(() => {
    feed = new Feed({
      get prep() { return props.prep; },
      get scrub() { return props.scrub; },
      get fix() { return props.fix; },
      get bottom() { return props.bottom; },
      get top() { return props.top; }
    });
  });
  flushSync();
  return { props, feed, stop };
}

describe('EngineFeed', () => {
  it('draws a track that comes after the engine (a second trail: the map chunk already loaded)', () => {
    const { props, feed, stop } = setup();
    const { engine, calls } = fakeEngine();
    feed.engine = engine;
    flushSync();
    expect(calls).toEqual(['track none', 'scrub none', 'fix none', 'fit 200 150']);
    calls.length = 0;
    props.prep = PREP;
    flushSync();
    expect(calls).toEqual(['track set']);
    stop();
  });

  it('draws a track that came before the engine (the first trail)', () => {
    const { props, feed, stop } = setup();
    props.prep = PREP;
    flushSync();
    const { engine, calls } = fakeEngine();
    feed.engine = engine;
    flushSync();
    expect(calls).toContain('track set');
    stop();
  });

  it('a scrub moves the dot alone (the track not redrawn: its redraw refits the camera); the locate button flies once', () => {
    const { props, feed, stop } = setup();
    const { engine, calls } = fakeEngine();
    props.prep = PREP;
    feed.engine = engine;
    flushSync();
    calls.length = 0;
    props.scrub = { lon: 0.5, lat: 0.5 };
    flushSync();
    expect(calls).toEqual(['scrub set']);
    calls.length = 0;
    feed.flyNext = true;
    props.fix = { lon: 0, lat: 0 };
    flushSync();
    props.fix = { lon: 0.1, lat: 0 };
    flushSync();
    expect(calls).toEqual(['fix set fly', 'fix set']);
    stop();
  });

  it('nothing reaches an engine gone with its view', () => {
    const { props, feed, stop } = setup();
    const { engine, calls } = fakeEngine();
    feed.engine = engine;
    flushSync();
    feed.engine = null;
    calls.length = 0;
    props.prep = PREP;
    flushSync();
    expect(calls).toEqual([]);
    stop();
  });
});
