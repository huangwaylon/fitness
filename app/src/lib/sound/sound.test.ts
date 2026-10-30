// Settings persistence, the audio manifest (and that every file it names is on disk), the placeholder renders and
// the dialogue blips (sound.md §4, §8, §9, §10).
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import raw from '../../../static/audio/manifest.json';
import { DEFAULT_SOUND, loadSound, sanitize, saveSound, silent } from './settings.ts';
import { AUDIO, hasMusic, parseManifest } from './manifest.ts';
import { DEVICE, type KV } from '#lib/sync/storage.ts';
import { durationOf, render } from './synth.ts';
import { SOUND_IDS } from './ids.ts';
import { BLIP_EVERY, MAX_BLIPS, blipPlan } from './dialogue.ts';
import { semitones } from './mix.ts';

const memory = (init: Record<string, string> = {}): KV & { data: Record<string, string> } => {
  const data = { ...init };
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v), removeItem: (k) => void delete data[k] };
};

describe('settings', () => {
  it('start all OFF', () => {
    expect(loadSound(memory())).toEqual({ music: false, sfx: false, voice: false, volume: 0.8 });
    expect(silent(DEFAULT_SOUND)).toBe(true);
  });
  it('persist in the storage registry key and read back', () => {
    const kv = memory();
    expect(saveSound(kv, { music: true, sfx: false, voice: true, volume: 0.5 })).toBe(true);
    expect(Object.keys(kv.data)).toEqual([DEVICE.sound]);
    expect(loadSound(kv)).toEqual({ music: true, sfx: false, voice: true, volume: 0.5 });
  });
  it('anything malformed falls back to the default, the volume is clamped', () => {
    expect(loadSound(memory({ [DEVICE.sound]: '{nope' }))).toEqual(DEFAULT_SOUND);
    expect(sanitize({ music: 'yes', sfx: true, volume: 7 })).toEqual({ music: false, sfx: true, voice: false, volume: 1 });
    expect(sanitize({ volume: -1 }).volume).toBe(0);
    expect(sanitize({ volume: NaN }).volume).toBe(0.8);
    expect(sanitize(null)).toEqual(DEFAULT_SOUND);
  });
  it('a full or blocked store still applies for the session (false = not kept)', () => {
    const full: KV = { getItem: () => null, setItem: () => { throw Object.assign(new Error(), { name: 'QuotaExceededError' }); }, removeItem: () => {} };
    expect(saveSound(full, { ...DEFAULT_SOUND, sfx: true })).toBe(false);
    expect(saveSound(null, DEFAULT_SOUND)).toBe(false);
  });
  it('silent when every kind is off or the volume is 0', () => {
    expect(silent({ ...DEFAULT_SOUND, sfx: true })).toBe(false);
    expect(silent({ ...DEFAULT_SOUND, sfx: true, volume: 0 })).toBe(true);
  });
});

describe('audio manifest (static/audio/manifest.json)', () => {
  const STATIC = join(import.meta.dirname, '../../../static/audio');
  it('parses cleanly: no unknown ids, hours or weathers', () => {
    expect(parseManifest(raw).problems).toEqual([]);
  });
  it('every file it names exists, and the music stays small (≤ 1 MB a track, ≤ 20 MB in all)', () => {
    const paths = [
      ...Object.values(AUDIO.sfx),
      ...Object.values(AUDIO.ambient),
      ...Object.values(AUDIO.music).flatMap((h) => Object.values(h ?? {}).map((t) => t!.file)),
      ...(AUDIO.opening ? [AUDIO.opening] : [])
    ] as string[];
    const missing = paths.filter((p) => !existsSync(join(STATIC, p)));
    expect(missing).toEqual([]);
    const sizes = paths.filter((p) => p.startsWith('music/')).map((p) => statSync(join(STATIC, p)).size);
    for (const s of sizes) expect(s).toBeLessThan(1024 * 1024);
    expect(sizes.reduce((a, b) => a + b, 0)).toBeLessThan(20 * 1024 * 1024);
  });
  it('has all 24 sunny hours, each with a loop start, plus the opening', () => {
    const sunny = AUDIO.music.sunny ?? {};
    expect(Object.keys(sunny).sort()).toEqual(Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0')));
    for (const t of Object.values(sunny)) expect(t!.start).toBeGreaterThanOrEqual(0);
    expect(hasMusic()).toBe(true);
    expect(AUDIO.opening).toBe('music/opening.m4a');
  });
  it('drops what it cannot use and says so', () => {
    const { manifest, problems } = parseManifest({
      sfx: { coin: 'sfx/coin.m4a', nope: 'x.m4a', pop: 3 },
      music: { sunny: { '07': 'music/a.m4a', '24': 'music/b.m4a', '08': { file: 'music/c.m4a', start: 12.5 } }, fog: {} },
      ambient: { waves: 'ambient/waves.m4a', traffic: 'x' },
      opening: 4
    });
    expect(manifest).toEqual({
      sfx: { coin: 'sfx/coin.m4a' },
      opening: null,
      music: { sunny: { '07': { file: 'music/a.m4a', start: 0 }, '08': { file: 'music/c.m4a', start: 12.5 } } },
      ambient: { waves: 'ambient/waves.m4a' }
    });
    expect(problems).toEqual(['sfx.nope', 'sfx.pop', 'music.sunny.24', 'music.fog', 'ambient.traffic', 'opening']);
  });
  it('an empty or broken manifest is just silence', () => {
    expect(parseManifest(null)).toEqual({ manifest: { sfx: {}, opening: null, music: {}, ambient: {} }, problems: [] });
  });
});

describe('placeholder effects (synth.ts)', () => {
  it('every sound renders: short, finite, peaking at 0.8, silent at the very end', () => {
    for (const id of SOUND_IDS) {
      const x = render(id, 22050);
      expect(x.length).toBe(Math.ceil(durationOf(id) * 22050));
      expect(durationOf(id)).toBeLessThan(id === 'chime' || id === 'fanfare' ? 2.5 : 1);
      let peak = 0;
      for (const v of x) {
        expect(Number.isFinite(v)).toBe(true);
        peak = Math.max(peak, Math.abs(v));
      }
      expect(peak).toBeCloseTo(0.8, 2);
      expect(Math.abs(x[x.length - 1])).toBeLessThan(1e-6);
    }
  });
  it('is deterministic (the same noise every time)', () => {
    expect(render('rustle', 8000)).toEqual(render('rustle', 8000));
  });
  it('UI ticks are short; the jingles are the long ones', () => {
    expect(durationOf('cursor')).toBeLessThan(0.1);
    expect(durationOf('confirm')).toBeLessThan(0.4);
    expect(durationOf('fanfare')).toBeGreaterThan(1);
  });
});

describe('dialogue blips', () => {
  const line = (s: string) => [...s].map((ch, i) => ({ ch, at: i * 33 }));
  it('every other spoken glyph, punctuation and spaces silent', () => {
    const p = blipPlan(line('こんにちは、しずえです。'));
    // 9 spoken glyphs → 5 blips (the 1st, 3rd, 5th…)
    expect(p.times).toHaveLength(5);
    expect(p.times[0]).toBe(0);
    expect(p.times[1]).toBeCloseTo(0.066);
    expect(BLIP_EVERY).toBe(2);
  });
  it('the same glyph always gets the same pitch, within ±3 semitones', () => {
    const a = blipPlan(line('あいうえお')).rates;
    expect(blipPlan(line('あいうえお')).rates).toEqual(a);
    for (const r of a) {
      expect(r).toBeGreaterThanOrEqual(semitones(-3) - 1e-9);
      expect(r).toBeLessThanOrEqual(semitones(3) + 1e-9);
    }
  });
  it('a question rises at the end', () => {
    const flat = blipPlan(line('筋トレでしたか')).rates;
    const ask = blipPlan(line('筋トレでしたか？')).rates;
    expect(ask.at(-1)).toBeCloseTo(flat.at(-1)! * semitones(4));
    expect(ask[0]).toBe(flat[0]);
  });
  it('a long line goes quiet after the cap', () => {
    expect(blipPlan(line('あ'.repeat(500))).times).toHaveLength(MAX_BLIPS);
    expect(blipPlan([])).toEqual({ times: [], rates: [] });
  });
});
