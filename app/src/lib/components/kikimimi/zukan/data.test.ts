// ずかん's sample: a tab switch (stop) while a clip is still loading means it never starts.
import { describe, expect, it, vi } from 'vitest';
const played: unknown[] = [];
vi.mock('#lib/sound/sound.svelte.ts', () => ({ playVoice: (b: unknown) => (played.push(b), { stop() {} }) }));
let land: (b: unknown) => void = () => {};
vi.mock('../packs.ts', () => ({ voiceClip: () => new Promise((r) => (land = r)) }));
import { ZukanData } from './data.svelte.ts';

describe('ずかん samples', () => {
  it('stop() while the clip loads: nothing sounds', async () => {
    const d = new ZukanData();
    const p = d.play('c1', 'v:a');
    d.stop();
    land({ duration: 1 });
    expect({ ok: await p, played: played.length, sounding: d.sounding }).toEqual({ ok: false, played: 0, sounding: null });
  });
  it('else it sounds', async () => {
    const d = new ZukanData();
    const p = d.play('c1', 'v:a');
    land({ duration: 1 });
    expect({ ok: await p, played: played.length, sounding: d.sounding }).toEqual({ ok: true, played: 1, sounding: 'v:a' });
    d.dispose();
  });
});
