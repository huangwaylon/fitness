// The cut-ins' rules in sound.svelte.ts (docs/design.md#sound) against a fake engine: what plays, what's pinned, and
// how a cut-in ends (its end, its file failing, the volume at 0, stopJingle, the wasps' phases).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

class FakeEngine {
  static last: FakeEngine;
  ctx = {};
  track: string | null = null;
  pinned: string[] = [];
  onended: ((key: string) => void) | null = null;
  onfailed: ((key: string) => void) | null = null;
  onrunning: (() => void) | null = null;
  constructor() {
    FakeEngine.last = this;
  }
  gesture() {
    return 'full';
  }
  unlock() {}
  whenReady() {
    return Promise.resolve();
  }
  setLevels() {}
  resume() {}
  hush() {}
  sleep() {}
  muffle() {}
  needsUnlock() {
    return false;
  }
  play() {}
  prefetch() {}
  warm() {}
  release() {}
  stopMusic() {
    this.track = null;
  }
  pin(paths: string[]) {
    this.pinned = paths;
  }
  async setTrack(key: string | null) {
    this.track = key;
  }
  async setAmbient() {}
}

beforeEach(() => {
  vi.resetModules();
  vi.doMock('./engine.ts', () => ({ Engine: FakeEngine }));
  vi.stubGlobal('window', {});
  vi.stubGlobal('document', { hidden: false, addEventListener() {}, removeEventListener() {} });
  vi.stubGlobal('navigator', {});
});
afterEach(() => {
  vi.doUnmock('./engine.ts');
  vi.unstubAllGlobals();
});

/** Music on (from a tap): the opening theme first, as NH's title screen. */
async function musicOn() {
  const m = await import('./sound.svelte.ts');
  const { AUDIO } = await import('./manifest.ts');
  m.setSound({ music: true, volume: 0.8 });
  return { m, e: FakeEngine.last, AUDIO };
}

describe('cut-ins', () => {
  it('a cut-in asked for during the opening ends the opening (it would hide it), and plays', async () => {
    const { m, e } = await musicOn();
    expect(e.track).toBe('opening');
    expect(m.eventJingle('happy-birthday')).toBe(true);
    expect([e.track, m.sound.playing]).toEqual(['event/happy-birthday', 'happy-birthday']);
    e.onended?.('event/happy-birthday');
    expect(m.sound.playing).not.toBe('opening'); // the island's music, not the title screen again
  });

  it('a one-shot whose file fails ends like one that played: the island’s music comes back', async () => {
    const { m, e } = await musicOn();
    expect(m.eventJingle('happy-birthday')).toBe(true);
    e.onfailed?.('event/happy-birthday');
    expect(e.track).not.toBe('event/happy-birthday');
    expect(m.sound.playing).not.toBe('happy-birthday');
  });

  it('a chain pins its next (Franklin’s done after his start) beside the island’s track', async () => {
    const { m, e, AUDIO } = await musicOn();
    expect(m.eventJingle(['turkey-cooking-start', 'turkey-cooking-done'])).toBe(true);
    expect(e.pinned).toContain(AUDIO.events['turkey-cooking-done']!.file);
    e.onended?.('event/turkey-cooking-start');
    expect(e.track).toBe('event/turkey-cooking-done');
  });

  it('indoors, a cut-in pins the room’s track and the island’s', async () => {
    const { m, e, AUDIO } = await musicOn();
    m.setPlace('shop');
    expect(m.eventJingle('happy-birthday')).toBe(true);
    expect(e.pinned).toContain(AUDIO.places.shop!.file);
    expect(e.pinned.some((p) => p.startsWith('music/'))).toBe(true);
    m.setPlace(null);
  });

  it('stopJingle ends the stretch’s music early; another id leaves it', async () => {
    const { m, e } = await musicOn();
    expect(m.eventJingle('aerobics', 6000)).toBe(true);
    m.stopJingle('happy-birthday');
    expect(e.track).toBe('event/aerobics');
    m.stopJingle('aerobics');
    expect(e.track).not.toBe('event/aerobics');
  });

  it('the wasps: the chase loops in (the sting kept fetched), a sting plays Stung by Bees, a net brings the island’s music back', async () => {
    const { m, e, AUDIO } = await musicOn();
    m.waspMusic('chase');
    expect(e.track).toBe('event/bee-chase');
    expect(e.pinned).toContain(AUDIO.events['bee-stung']!.file);
    m.waspMusic('stung');
    expect(e.track).toBe('event/bee-stung');
    e.onended?.('event/bee-stung');
    expect(e.track).not.toMatch(/^event\/bee/);
    m.waspMusic('chase');
    m.waspMusic('caught');
    expect(e.track).not.toMatch(/^event\/bee/);
    m.waspMusic('stung'); // no chase on: nothing
    expect(e.track).not.toMatch(/^event\/bee/);
  });

  it('the volume at 0 ends a K.K. song (its caption with it)', async () => {
    const { m } = await musicOn();
    const { loadKK } = await import('./kk.ts');
    const song = (await loadKK()).tracks[0];
    expect(m.playKK(song.id)).toBe(true);
    expect(m.sound.kk).toEqual({ id: song.id, from: 'live' });
    expect(m.playingLabel('kk', 20)).toContain(song.ja);
    m.setSound({ volume: 0 });
    expect(m.sound.kk).toBeNull();
  });
});
