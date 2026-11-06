// The cut-ins' rules in sound.svelte.ts (docs/design.md#sound) against a fake engine: what plays, what's pinned, and
// how a cut-in ends (its end, its file failing, the volume at 0, the wasps' phases). The shared stages in what plays.
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
  pause() {}
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
  /** The track as asked for (a stage's `from`). */
  tr: { file: string; from?: number } | null = null;
  async setTrack(key: string | null, tr: { file: string; from?: number } | null) {
    this.track = key;
    this.tr = tr;
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

describe('a song picked, a song heard', () => {
  it('wantMusic turns ミュージック on (a pick wants to hear it); musicHeard: on, not muted, unlocked (KKSlider’s 🔇)', async () => {
    const m = await import('./sound.svelte.ts');
    expect(m.sound.settings.music).toBe(false);
    m.wantMusic();
    expect(m.sound.settings.music).toBe(true);
    m.sound.unlocked = false;
    expect(m.musicHeard()).toBe(false);
    m.sound.unlocked = true;
    expect(m.musicHeard()).toBe(true);
    m.setSound({ volume: 0 });
    expect(m.musicHeard()).toBe(false);
    m.setSound({ volume: 0.5, music: false });
    expect(m.musicHeard()).toBe(false);
  });
});

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

});

describe('the shared stages (stage.svelte.ts) in what plays', () => {
  beforeEach(() => vi.stubGlobal('window', { addEventListener() {}, removeEventListener() {} }));
  it('the stage where I am plays over the island’s from where its song is; 音量 0 keeps it; ended here: the island’s', async () => {
    const { m, e } = await musicOn();
    const stop = m.startSound({ muffled: () => false });
    m.setSound({ music: true, volume: 0.8 }); // (startSound read the settings: off)
    e.onended?.('opening');
    const st = await import('./stage.svelte.ts');
    const song = (await (await import('./kk.ts')).loadKK()).tracks[0];
    st.bindStage({ send: () => true, serverNow: () => Date.now() + 2000, me: () => 'A' }); // the relay 2 s ahead
    const leave = st.enterStage('isl');
    const at = Date.now() + 2000 - 30_000; // 30 s in
    st.hear({ v: 3, kind: 'music', src: 'isl', at, song: song.id, ms: 120_000, who: 'B', t: at });
    expect(e.track).toBe(`st/isl/${song.id}/${at}`);
    expect(e.tr?.from).toBe(at - 2000); // position 0 on this device's clock
    expect(e.tr?.file).toBe(song.file);
    expect([m.sound.playing, m.playingLabel('kk', 20)]).toEqual(['kk', expect.stringContaining(song.ja)]);
    // 音量 0: nothing heard, the record plays on (back up: from where it is then)
    m.setSound({ volume: 0 });
    m.setSound({ volume: 0.8 });
    expect(e.track).toBe(`st/isl/${song.id}/${at}`);
    e.onended?.(`st/isl/${song.id}/${at}`); // its file shorter than its record: the island's till it ends
    expect(e.track).not.toMatch(/^st\//);
    leave();
    stop();
  });

  it('a room’s stereo is heard only in its room, its piece standing', async () => {
    const { m, e } = await musicOn();
    const stop = m.startSound({ muffled: () => false });
    m.setSound({ music: true, volume: 0.8 }); // (startSound read the settings: off)
    e.onended?.('opening');
    const st = await import('./stage.svelte.ts');
    const song = (await (await import('./kk.ts')).loadKK()).tracks[0];
    st.bindStage({ send: () => true, serverNow: () => Date.now(), me: () => 'A' });
    let stands = true;
    const outside = st.enterStage('isl');
    st.request('t', song.id, { pc: 'dabc123' });
    expect(e.track).not.toMatch(/^st\//); // on the island: not heard
    outside();
    const inside = st.enterStage('t', (s) => stands && s.pc === 'dabc123');
    expect(e.track).toMatch(new RegExp(`^st/t/${song.id}/`));
    expect(e.tr?.file).toMatch(/^kk\/(aircheck\/)?/);
    stands = false; // put away mid-song: silent, nothing sent
    st.restage();
    expect(e.track).not.toMatch(/^st\//);
    inside();
    stop();
  });
});
