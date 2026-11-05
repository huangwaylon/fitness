// Settings persistence, the audio manifest (and that every file it names is on disk) and the placeholder renders
// (docs/design.md#audio-files, #sound-settings).
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import raw from '../../../static/audio/manifest.json';
import { DEFAULT_SOUND, loadSound, sanitize, saveSound, silent } from './settings.ts';
import { AUDIO, hasMusic, parseManifest } from './manifest.ts';
import { DEVICE, type KV } from '#lib/sync/storage.ts';
import { durationOf, render } from './synth.ts';
import { SOUND_IDS } from './ids.ts';

const memory = (init: Record<string, string> = {}): KV & { data: Record<string, string> } => {
  const data = { ...init };
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v), removeItem: (k) => void delete data[k] };
};

describe('settings', () => {
  it('start all OFF', () => {
    expect(loadSound(memory())).toEqual({ music: false, sfx: false, volume: 0.8 });
    expect(silent(DEFAULT_SOUND)).toBe(true);
  });
  it('persist in the storage registry key and read back', () => {
    const kv = memory();
    expect(saveSound(kv, { music: true, sfx: false, volume: 0.5 })).toBe(true);
    expect(Object.keys(kv.data)).toEqual([DEVICE.sound]);
    expect(loadSound(kv)).toEqual({ music: true, sfx: false, volume: 0.5 });
  });
  it('anything malformed falls back to the default, the volume is clamped', () => {
    expect(loadSound(memory({ [DEVICE.sound]: '{nope' }))).toEqual(DEFAULT_SOUND);
    expect(sanitize({ music: 'yes', sfx: true, volume: 7 })).toEqual({ music: false, sfx: true, volume: 1 });
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
  it('every file it names exists, and the music stays small (≤ 1 MB a looped track, ≤ 1.2 MB a K.K. song, ≤ 20 MB and ≤ 12 MB in all)', () => {
    const paths = [
      ...Object.values(AUDIO.sfx),
      ...Object.values(AUDIO.ambient),
      ...Object.values(AUDIO.music).flatMap((h) => Object.values(h ?? {}).map((t) => t!.file)),
      ...(AUDIO.opening ? [AUDIO.opening.file] : []),
      ...Object.values(AUDIO.events).map((t) => t!.file),
      ...Object.values(AUDIO.places).map((t) => t!.file),
      ...AUDIO.kk.map((k) => k.file)
    ] as string[];
    const missing = paths.filter((p) => !existsSync(join(STATIC, p)));
    expect(missing).toEqual([]);
    const sizes = paths.filter((p) => p.startsWith('music/')).map((p) => statSync(join(STATIC, p)).size);
    for (const s of sizes) expect(s).toBeLessThan(1024 * 1024);
    expect(sizes.reduce((a, b) => a + b, 0)).toBeLessThan(20 * 1024 * 1024);
    const kk = paths.filter((p) => p.startsWith('kk/')).map((p) => statSync(join(STATIC, p)).size);
    for (const s of kk) expect(s).toBeLessThan(1.2 * 1024 * 1024);
    expect(kk.reduce((a, b) => a + b, 0)).toBeLessThan(12 * 1024 * 1024);
    // and every audio file on disk is named (nothing ships unused)
    const onDisk = readdirSync(STATIC, { recursive: true, withFileTypes: true })
      .filter((d) => d.isFile() && d.name !== 'manifest.json')
      .map((d) => relative(STATIC, join(d.parentPath, d.name)));
    expect(onDisk.filter((p) => !paths.includes(p))).toEqual([]);
  });
  it('has all 24 sunny hours, each with a loop start, a period end and a loudness gain, plus the opening', () => {
    const sunny = AUDIO.music.sunny ?? {};
    expect(Object.keys(sunny).sort()).toEqual(Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0')));
    for (const t of Object.values(sunny)) {
      expect(t!.start).toBeGreaterThanOrEqual(0);
      expect(t!.end).toBeGreaterThan(t!.start);
      // normalised to about −16 LUFS: no track is cut or boosted by more than the script's limits
      expect(t!.gain).toBeGreaterThanOrEqual(-12);
      expect(t!.gain).toBeLessThanOrEqual(6);
    }
    expect(hasMusic()).toBe(true);
    expect(AUDIO.opening).toMatchObject({ file: 'music/opening.m4a', start: 0 });
    expect(AUDIO.opening!.gain).toBeLessThan(0); // the loudest file: turned down
  });
  it('drops what it cannot use and says so', () => {
    const { manifest, problems } = parseManifest({
      sfx: { coin: 'sfx/coin.m4a', nope: 'x.m4a', pop: 3 },
      music: {
        sunny: {
          '07': { file: 'music/a.m4a' },
          '24': 'music/b.m4a',
          '08': { file: 'music/c.m4a', start: 12.5 },
          '09': { file: 'music/d.m4a', start: 3, end: 60, gain: -2.5 },
          '10': { file: 'music/e.m4a', start: 30, end: 20, gain: 'loud' }
        },
        fog: {}
      },
      ambient: { waves: 'ambient/waves.m4a', traffic: 'x' },
      events: { halloween: { file: 'music/h.m4a', start: 2, end: 80, gain: -1 }, easter: 'music/e.m4a' },
      kk: [{ id: 'kk-a', ja: 'あ', en: 'A', file: 'kk/a.m4a', start: 5 }, { id: 'kk-b', file: 'kk/b.m4a' }, { id: 'kk-a', ja: 'あ', en: 'A', file: 'kk/a2.m4a' }],
      opening: 4
    });
    expect(manifest).toEqual({
      sfx: { coin: 'sfx/coin.m4a' },
      opening: null,
      music: {
        sunny: {
          '07': { file: 'music/a.m4a', start: 0 },
          '08': { file: 'music/c.m4a', start: 12.5 },
          '09': { file: 'music/d.m4a', start: 3, end: 60, gain: -2.5 },
          // an end before the start falls back to <audio loop>; a gain that isn't a number to 0 dB
          '10': { file: 'music/e.m4a', start: 30 }
        }
      },
      ambient: { waves: 'ambient/waves.m4a' },
      events: { halloween: { file: 'music/h.m4a', start: 2, end: 80, gain: -1 } },
      places: {},
      kk: [{ id: 'kk-a', ja: 'あ', en: 'A', file: 'kk/a.m4a', start: 0 }]
    });
    expect(problems).toEqual(['sfx.nope', 'sfx.pop', 'music.sunny.24', 'music.fog', 'ambient.traffic', 'opening', 'events.easter', 'kk.1', 'kk.2']);
  });
  it('an empty or broken manifest is just silence', () => {
    expect(parseManifest(null)).toEqual({ manifest: { sfx: {}, opening: null, music: {}, ambient: {}, events: {}, places: {}, kk: [] }, problems: [] });
  });
});

describe('placeholder effects (synth.ts)', () => {
  it('every sound renders: short, finite, peaking at 0.8, silent at the very end', () => {
    for (const id of SOUND_IDS) {
      const x = render(id, 22050);
      expect(x.length).toBe(Math.ceil(durationOf(id) * 22050));
      expect(durationOf(id)).toBeLessThan(id === 'stretch-song' ? 6.5 : id === 'music-box' ? 4.5 : id === 'chime' || id === 'fanfare' ? 2.5 : 1);
      // one expect per sound, not per sample (a slow runner timed out on ~10^6 of them)
      let peak = 0, finite = true;
      for (const v of x) {
        if (!Number.isFinite(v)) finite = false;
        else if (Math.abs(v) > peak) peak = Math.abs(v);
      }
      expect(finite, id).toBe(true);
      expect(peak, id).toBeCloseTo(0.8, 2);
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

describe('the opening in the manifest', () => {
  it('an entry with a gain; it always plays from 0', () => {
    expect(parseManifest({ opening: { file: 'music/o.m4a', start: 9, gain: -5.3 } }).manifest.opening).toEqual({ file: 'music/o.m4a', start: 0, gain: -5.3 });
  });
});
