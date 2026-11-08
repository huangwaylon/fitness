// ききみみ's audio session in sound.svelte.ts (docs/kikimimi-mic.md "Audio session") against a fake engine and a fake WebKit
// `navigator.audioSession`: a game sets 'playback', the mic 'play-and-record' over it and back, and the type from
// before comes back once both are over, in either order; the music held ducked and the context awake while the mic is
// open.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

class FakeEngine {
  static last: FakeEngine;
  ctx = { state: 'running', addEventListener() {} };
  awake = false;
  ducked = false;
  onended = null;
  onfailed = null;
  onrunning = null;
  constructor() {
    FakeEngine.last = this;
  }
  wakeVoice() {
    return true;
  }
  holdAwake(on: boolean) {
    this.awake = on;
  }
  holdDuck(on: boolean) {
    this.ducked = on;
  }
  clearVoice() {
    this.ducked = false;
  }
  setLevels() {}
  sleep() {}
  resume() {}
  hush() {}
  muffle() {}
  pin() {}
  stopMusic() {}
  release() {}
  async setTrack() {}
  async setAmbient() {}
}

let nav: { audioSession: { type: string } };
beforeEach(() => {
  vi.resetModules();
  nav = { audioSession: { type: 'auto' } };
  vi.doMock('./engine.ts', () => ({
    Engine: FakeEngine,
    applySession(type: string) {
      const was = nav.audioSession.type;
      nav.audioSession.type = type;
      return was;
    }
  }));
  vi.stubGlobal('window', {});
  vi.stubGlobal('document', { hidden: false, addEventListener() {}, removeEventListener() {} });
  vi.stubGlobal('navigator', nav);
});
afterEach(() => {
  vi.doUnmock('./engine.ts');
  vi.unstubAllGlobals();
});

describe('micSession', () => {
  it('in a game: playback → play-and-record → playback, then the type from before', async () => {
    const m = await import('./sound.svelte.ts');
    m.voiceSession(true);
    expect(nav.audioSession.type).toBe('playback');
    expect(m.audioCtx()).toBe(FakeEngine.last.ctx);
    m.micSession(true);
    expect(nav.audioSession.type).toBe('play-and-record');
    expect(FakeEngine.last).toMatchObject({ awake: true, ducked: true });
    m.micSession(false);
    expect(nav.audioSession.type).toBe('playback');
    expect(FakeEngine.last).toMatchObject({ awake: true, ducked: false });
    m.voiceSession(false);
    expect(nav.audioSession.type).toBe('auto');
    expect(FakeEngine.last.awake).toBe(false);
  });
  it('alone (せってい’s check): play-and-record, then back; twice on is once', async () => {
    const m = await import('./sound.svelte.ts');
    m.audioCtx();
    m.micSession(true);
    m.micSession(true);
    expect(nav.audioSession.type).toBe('play-and-record');
    m.micSession(false);
    expect(nav.audioSession.type).toBe('auto');
    expect(FakeEngine.last).toMatchObject({ awake: false, ducked: false });
  });
  it('the game over while the mic is open: the mic keeps its type; closing it brings the first back', async () => {
    const m = await import('./sound.svelte.ts');
    m.voiceSession(true);
    m.micSession(true);
    m.voiceSession(false);
    expect(nav.audioSession.type).toBe('play-and-record');
    expect(FakeEngine.last.awake).toBe(true);
    m.micSession(false);
    expect(nav.audioSession.type).toBe('auto');
  });
});
