// SoundLine's karaoke (karaoke.svelte.ts) on Svelte's client runtime with a fake frame clock: vitest compiles .svelte.ts
// files for the server (no effects run), so this test compiles the module for the client itself and drives its frames.
// The case that looped (effect_update_depth_exceeded): a frame landing past the clip's end + 0.3 s while it still
// plays, as a dialogue's `talk` moves on exactly LINE_GAP after a line's end.
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { compileModule } from 'svelte/compiler';
import { transformWithOxc } from 'vite';

type Karaoke = typeof import('./karaoke.svelte.ts').karaoke;
type Client = { effect_root(fn: () => void): () => void; flush(): void; state(v: unknown): unknown; get(s: unknown): unknown; set(s: unknown, v: unknown): void };

const runtime = createRequire(import.meta.url).resolve('svelte/internal/client');
const dir = mkdtempSync(join(tmpdir(), 'kiki-karaoke-'));
async function load(): Promise<{ karaoke: Karaoke; $: Client }> {
  const src = readFileSync(new URL('./karaoke.svelte.ts', import.meta.url), 'utf8');
  const js = (await transformWithOxc(src, 'karaoke.svelte.ts', { lang: 'ts' })).code;
  const out = compileModule(js, { generate: 'client', filename: 'karaoke.svelte.js' }).js.code.replaceAll("'svelte/internal/client'", JSON.stringify(pathToFileURL(runtime).href));
  const file = join(dir, 'karaoke.mjs');
  writeFileSync(file, out);
  const [mod, $] = await Promise.all([import(/* @vite-ignore */ pathToFileURL(file).href), import(/* @vite-ignore */ pathToFileURL(runtime).href)]);
  return { karaoke: mod.karaoke, $ };
}

/** Frames by hand: each `frame()` runs the callbacks asked for since the last. */
function frames() {
  let queue: FrameRequestCallback[] = [];
  vi.stubGlobal('requestAnimationFrame', (f: FrameRequestCallback) => (queue.push(f), queue.length));
  vi.stubGlobal('cancelAnimationFrame', () => void (queue = []));
  return {
    frame: () => {
      const q = queue;
      queue = [];
      for (const f of q) f(0);
    },
    get pending() {
      return queue.length;
    }
  };
}

afterEach(() => vi.unstubAllGlobals());
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe('karaoke: the word being said', () => {
  it('follows the words, then stops at the end + 0.3 s with every word said, its loop gone (no update loop)', async () => {
    const { karaoke, $ } = await load();
    const f = frames();
    let now = 10_000;
    const from = $.state(null);
    const times = [0, 0.5, 1.0]; // two words, the clip's end
    let k!: { readonly at: number | null };
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const stop = $.effect_root(() => {
      k = karaoke({ from: () => $.get(from) as number | null, times: () => times, clock: () => now });
    });
    $.flush();
    expect(k.at).toBeNull();
    $.set(from, now);
    $.flush();
    expect(k.at).toBe(0);
    now += 600;
    f.frame();
    $.flush();
    expect(k.at).toBe(1);
    now += 450; // 1.05 s: past the end, every word said
    f.frame();
    $.flush();
    expect(k.at).toBe(3);
    now += 300; // 1.35 s ≥ the end + 0.3 while `from` is still set: done
    expect(() => {
      f.frame();
      $.flush();
    }).not.toThrow();
    expect(k.at).toBeNull();
    expect(f.pending).toBe(0);
    expect(errors).not.toHaveBeenCalled();
    stop();
  });
});
