import { describe, expect, it, vi } from 'vitest';
import { cleanData } from '#lib/contract/log.ts';
import { bootReport, createBootClock, lateModels, modelFetches, shellFrom, swState, watchBoot } from './boot.ts';

describe('the launch clock (perf.boot)', () => {
  it('times the first frame, the models in, the island whole and the frames meanwhile', () => {
    const c = createBootClock(1000);
    c.mount(200);
    c.tick(250);
    c.frame(290, 300, 'link');
    c.tick(301);
    c.loaded(500);
    // (a frame begun before the models were in isn't theirs)
    c.frame(490, 520, 'link');
    c.tick(521);
    c.frame(530, 570, 'models');
    c.tick(571);
    c.frame(580, 610, null);
    c.tick(611);
    expect(c.marks()).toMatchObject({ mount: 200, first: 300, loaded: 500, shown: 610, appear: 40, steps: 2, draw: 40, long: 220 });
    // (the steps by what held them: models loading 530 → 580, then whole)
    expect(c.marks()).toMatchObject({ sLink: 0, msLink: 0, sModels: 1, msModels: 50, sCards: 0, stepMs: 70 });
    expect(c.done()).toBe(false);
    // the follow-up frames count toward the longest, not the appearing
    c.frame(700, 790, null);
    c.tick(800);
    c.tick(1611);
    expect(c.done()).toBe(true);
    expect(c.marks()).toMatchObject({ draw: 90, appear: 40, long: 811 });
    // done: nothing more counts
    c.frame(2000, 2500, null);
    expect(c.marks().draw).toBe(90);
  });

  it('a page hidden meanwhile spoils the launch (never done)', () => {
    const c = createBootClock(100);
    c.frame(0, 10, null);
    c.loaded(20);
    c.frame(30, 40, null);
    c.tick(50, true);
    c.tick(500);
    expect(c.spoiled()).toBe(true);
    expect(c.done()).toBe(false);
  });

  it('the watch asks for no more frames once the island is paused before it stood whole (a sheet over it)', () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (f: FrameRequestCallback) => frames.push(f));
    vi.stubGlobal('cancelAnimationFrame', () => {});
    vi.stubGlobal('document', { hidden: false, addEventListener() {}, removeEventListener() {} });
    try {
      let paused = false;
      const w = watchBoot(() => ({ progs: 1, fieldsMs: 0, fields: 'cache' }), () => paused);
      w!.clock.frame(0, 10, 'link');
      w!.clock.loaded(20);
      frames.shift()!(16);
      frames.shift()!(33);
      expect(frames).toHaveLength(1);
      paused = true;
      frames.shift()!(50);
      expect(frames).toHaveLength(0);
      expect(w!.clock.spoiled()).toBe(true);
      expect(bootReport()).toBeNull();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('after the launch, the first return is watched (perf.back), none after it', () => {
    vi.stubGlobal('requestAnimationFrame', () => 1);
    vi.stubGlobal('cancelAnimationFrame', () => {});
    vi.stubGlobal('document', { hidden: false, addEventListener() {}, removeEventListener() {} });
    try {
      const x = () => ({ progs: 1, fieldsMs: 0, fields: 'cache' as const });
      // (the launch this one's, or the test above's)
      const got = [0, 1, 2].map(() => watchBoot(x, () => false)).map((w) => (w ? (w.back ? 'back' : 'launch') : null));
      expect([['launch', 'back', null], ['back', null, null]]).toContainEqual(got);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('counts the models from the network, and reads the service worker', () => {
    expect(modelFetches([
      { name: 'https://x/room/world3d/tree.glb?v=3', transferSize: 0 },
      { name: 'https://x/room/world3d/deco/lamp.glb?v=1', transferSize: 812 },
      { name: 'https://x/_app/immutable/chunk.js', transferSize: 900 }
    ])).toEqual({ n: 2, net: 1 });
    expect(swState(undefined)).toBe('no');
    expect(swState({ serviceWorker: { controller: null } } as unknown as Navigator)).toBe('none');
    expect(swState({ serviceWorker: { controller: {} } } as unknown as Navigator)).toBe('ctl');
  });

  it('the models in after loaded up to shown, and the last by name', () => {
    const ins = [['oak-fall', 300], ['finds/clam', 520], ['room:outdoor-a-very-long-catalogue-piece-name-x', 610], ['critters/bugs/ant', 900]] as const;
    expect(lateModels(ins, 500, 700)).toEqual({ late: 2, lastM: 'room:outdoor-a-very-long-catalogue-piece' });
    expect(lateModels(ins, 950, 1000)).toEqual({ late: 0 });
  });

  it('the log keeps every field of the report, numbers and closed sets only', () => {
    const r = { mount: 210, first: 300, loaded: 560, shown: 1100, long: 340, draw: 330, appear: 330, steps: 3, progs: 49, fieldsMs: 80, fields: 'worker', sw: 'ctl', warm: true, net: 0, sLink: 1, msLink: 40, sModels: 1, msModels: 300, sCards: 0, msCards: 0, stepMs: 25, late: 3, lastM: 'finds/message-bottle' };
    expect(cleanData('perf.boot', r)).toEqual(r);
    expect(cleanData('perf.boot', { fields: 'somewhere', sw: 'yes', shown: '1100' })).toEqual({});
  });
});

describe('where the launch\'s page came from (perf.boot shell)', () => {
  const nav = (st: { name: string; description: string; duration?: number }[]) => [{ serverTiming: st.map((t) => ({ duration: 0, ...t })) } as unknown as PerformanceEntry];
  it('the worker\'s Server-Timing `shell` and its race\'s ms; none without it (a first visit)', () => {
    expect(shellFrom(nav([{ name: 'shell', description: 'net', duration: 183.4 }]))).toEqual({ shell: 'net', raceMs: 183 });
    expect(shellFrom(nav([{ name: 'cdn', description: 'x' }, { name: 'shell', description: 'same', duration: 90 }]))).toEqual({ shell: 'same', raceMs: 90 });
    expect(shellFrom(nav([{ name: 'shell', description: 'skip' }]))).toEqual({ shell: 'skip', raceMs: 0 });
    expect(shellFrom(nav([]))).toEqual({});
    expect(shellFrom([])).toEqual({});
    expect(shellFrom(nav([{ name: 'shell', description: 'other' }]))).toEqual({});
    expect(cleanData('perf.boot', { shell: 'same', raceMs: 12 })).toEqual({ shell: 'same', raceMs: 12 });
  });
});
