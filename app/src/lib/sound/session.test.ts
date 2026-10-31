// The audio session, the resume and unlock conditions, the idle suspend and the hand-off timing (session.ts), and the
// loudness gain (hourly.ts trackLevel), without an AudioContext (docs/design.md#engine-lifecycle).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  IDLE_SUSPEND_MS,
  HourClock,
  IdleTimer,
  RESUME_WINDOW_MS,
  SESSION_RELEASE_MS,
  SessionSwitch,
  canSound,
  gestureAction,
  needsFadeIn,
  needsUnlock,
  sessionType,
  wrapTarget,
  type Gesture,
  type SessionType
} from './session.ts';
import { trackLevel } from './hourly.ts';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('audio session type', () => {
  it("'playback' only while ミュージック is on; effects and voices alone are 'ambient'", () => {
    expect(sessionType(true)).toBe('playback');
    expect(sessionType(false)).toBe('ambient');
  });

  const make = () => {
    const set: SessionType[] = [];
    return { set, sw: new SessionSwitch((t) => set.push(t)) };
  };

  it('the first type applies at once, before the context exists, even when it is ambient', () => {
    const { set, sw } = make();
    sw.want(false, true);
    expect(set).toEqual(['ambient']);
  });

  it("music on: 'playback' at once (inside the tap, before the deck starts)", () => {
    const { set, sw } = make();
    sw.want(false, true);
    sw.want(true);
    expect(set).toEqual(['ambient', 'playback']);
    expect(sw.current).toBe('playback');
  });

  it("music off: back to 'ambient' only after the music's fade-out", () => {
    const { set, sw } = make();
    sw.want(true, true);
    sw.want(false);
    expect(set).toEqual(['playback']);
    vi.advanceTimersByTime(SESSION_RELEASE_MS - 1);
    expect(set).toEqual(['playback']);
    vi.advanceTimersByTime(1);
    expect(set).toEqual(['playback', 'ambient']);
  });

  it('music back on during the fade-out: the pending release is dropped, nothing changes', () => {
    const { set, sw } = make();
    sw.want(true, true);
    sw.want(false);
    vi.advanceTimersByTime(300);
    sw.want(true);
    vi.advanceTimersByTime(5000);
    expect(set).toEqual(['playback']);
  });

  it('the same type again is not re-applied', () => {
    const { set, sw } = make();
    sw.want(true, true);
    sw.want(true);
    sw.want(true);
    expect(set).toEqual(['playback']);
  });
});

describe('when a cue may sound', () => {
  it('always while running', () => {
    expect(canSound('running', Infinity)).toBe(true);
  });
  it('while a tap\'s resume settles, for at most RESUME_WINDOW_MS', () => {
    expect(canSound('suspended', 0)).toBe(true);
    expect(canSound('suspended', RESUME_WINDOW_MS - 1)).toBe(true);
    expect(canSound('suspended', RESUME_WINDOW_MS)).toBe(false);
    expect(canSound('suspended', Infinity)).toBe(false); // never resumed
  });
  it('never while interrupted (a call, Siri) or closed: nothing queues up to burst out later', () => {
    expect(canSound('interrupted', 0)).toBe(false);
    expect(canSound('closed', 0)).toBe(false);
  });
});

describe('when a tap must unlock', () => {
  const ok = { state: 'running', music: true, decksReady: true, frontStalled: false };
  it('not when running with unlocked decks and the track playing', () => {
    expect(needsUnlock(ok)).toBe(false);
  });
  it('no context, or a context that is not running', () => {
    expect(needsUnlock({ ...ok, state: null })).toBe(true);
    expect(needsUnlock({ ...ok, state: 'suspended' })).toBe(true);
    expect(needsUnlock({ ...ok, state: 'interrupted' })).toBe(true);
  });
  it('music on and the decks never played inside a gesture', () => {
    expect(needsUnlock({ ...ok, decksReady: false })).toBe(true);
  });
  it('music on and the current track paused from outside (Control Center, AirPods out)', () => {
    expect(needsUnlock({ ...ok, frontStalled: true })).toBe(true);
  });
  it('with music off, the decks do not matter', () => {
    expect(needsUnlock({ ...ok, music: false, decksReady: false, frontStalled: true })).toBe(false);
  });
});

// A tap's gestures, run through gestureAction against a small model of the browser (user report: "the
// music doesn't start until I tap something with a sound"). `activations`: the gestures the browser lets start media.
// A full unlock inside one starts the track (the deck plays inside the tap); outside one, play() is refused and the
// track waits, stalled, for the next tap. The music must start on the first tap whatever it lands on.
describe('the first tap anywhere starts the music', () => {
  type Model = { ctx: string | null; decksReady: boolean; key: boolean; playing: boolean };
  const IOS: Gesture[] = ['pointerup', 'touchend', 'click', 'keydown'];
  function run(taps: Gesture[][], activations: Gesture[] = IOS, m: Model = { ctx: null, decksReady: false, key: false, playing: false }) {
    const log: string[] = [];
    for (const tap of taps)
      for (const g of tap) {
        const act = gestureAction(g, { state: m.ctx, music: true, decksReady: m.decksReady, frontStalled: m.key && !m.playing });
        log.push(`${g}:${act}`);
        if (act === 'none') continue;
        const ok = activations.includes(g);
        if (act === 'context') {
          m.ctx ??= 'suspended';
          continue;
        }
        m.ctx = ok ? 'running' : (m.ctx ?? 'suspended');
        m.key = true; // syncMusic picks the hour's track
        if (ok) Object.assign(m, { decksReady: true, playing: true });
      }
    return { m, log };
  }
  const SCENERY: Gesture[] = ['pointerdown', 'pointerup', 'touchend']; // iOS fires no click on plain scenery
  const BUTTON: Gesture[] = [...SCENERY, 'click']; // a button with no sound of its own

  it('a tap on empty scenery (no click at all)', () => {
    const { m, log } = run([SCENERY]);
    expect(m.playing).toBe(true);
    expect(log.slice(0, 2)).toEqual(['pointerdown:context', 'pointerup:full']);
  });
  it('even if the browser honours only touchend (pointerup refused): touchend retries in the same tap', () => {
    expect(run([SCENERY], ['touchend']).m.playing).toBe(true);
  });
  it('a scroll first (its touchend is no activation), then a tap: the tap starts it', () => {
    const scroll: Gesture[] = ['pointerdown', 'touchend'];
    const first = run([scroll], ['pointerup']);
    expect(first.m.playing).toBe(false);
    expect(run([SCENERY], ['pointerup'], first.m).m.playing).toBe(true);
  });
  it('a tap on a button with no sound', () => {
    const { m, log } = run([BUTTON]);
    expect(m.playing).toBe(true);
    expect(log.at(-1)).toBe('click:none'); // already playing: the click does nothing more
  });
  it('keyboard only', () => {
    expect(run([['keydown']]).m.playing).toBe(true);
  });
  it('a play() refused outside the tap (the file arrived late) is retried by the next tap of any kind', () => {
    const m: Model = { ctx: 'running', decksReady: true, key: true, playing: false };
    expect(run([SCENERY], IOS, m).log).toEqual(['pointerdown:none', 'pointerup:full', 'touchend:none']);
    expect(m.playing).toBe(true);
  });
  it('once playing, taps do nothing', () => {
    const m: Model = { ctx: 'running', decksReady: true, key: true, playing: true };
    expect(run([BUTTON], IOS, m).log.every((l) => l.endsWith(':none'))).toBe(true);
  });
});

describe('fade back in', () => {
  it('a paused deck, or one playing at under half its level (played by iOS while hidden, gain still 0)', () => {
    expect(needsFadeIn(true, 1, 1)).toBe(true);
    expect(needsFadeIn(false, 0, 1)).toBe(true);
    expect(needsFadeIn(false, 0.3, 0.7)).toBe(true);
    expect(needsFadeIn(false, 0.7, 0.7)).toBe(false);
    expect(needsFadeIn(false, 0.4, 0.7)).toBe(false);
  });
});

describe('idle suspend', () => {
  it('fires IDLE_SUSPEND_MS after the last sound, and every sound restarts it', () => {
    const idle = vi.fn();
    const t = new IdleTimer(idle);
    t.poke();
    vi.advanceTimersByTime(IDLE_SUSPEND_MS - 1000);
    t.poke(); // another sound
    vi.advanceTimersByTime(IDLE_SUSPEND_MS - 1);
    expect(idle).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(idle).toHaveBeenCalledTimes(1);
    expect(t.armed).toBe(false);
  });
  it('cancel (hidden, or everything off) stops it', () => {
    const idle = vi.fn();
    const t = new IdleTimer(idle, 50);
    t.poke();
    expect(t.armed).toBe(true);
    t.cancel();
    vi.advanceTimersByTime(1000);
    expect(idle).not.toHaveBeenCalled();
  });
  it('is about 10 s', () => {
    expect(IDLE_SUSPEND_MS).toBe(10_000);
  });
});

describe('loop hand-off position', () => {
  it('only inside the copied tail: the incoming deck goes to the matching point of the period', () => {
    expect(wrapTarget(59.9, 60, 3)).toBeNull();
    expect(wrapTarget(60, 60, 3)).toBe(0);
    expect(wrapTarget(61.25, 60, 3)).toBeCloseTo(1.25);
    expect(wrapTarget(63, 60, 3)).toBeNull();
  });
});

describe('loudness gain', () => {
  it('dB → a linear deck level; none = 1', () => {
    expect(trackLevel(undefined)).toBe(1);
    expect(trackLevel(0)).toBe(1);
    expect(trackLevel(-6)).toBeCloseTo(0.501, 3);
    expect(trackLevel(2.7)).toBeCloseTo(1.365, 3);
  });
  it('clamped to −24…+12 dB, and junk is ignored', () => {
    expect(trackLevel(40)).toBeCloseTo(10 ** (12 / 20));
    expect(trackLevel(-90)).toBeCloseTo(10 ** (-24 / 20));
    expect(trackLevel(NaN)).toBe(1);
  });
});

describe('the hour clock (HourClock)', () => {
  const HOUR = 3_600_000;
  const make = () => {
    const calls: string[] = [];
    const c = new HourClock(
      () => new Date(),
      (at) => calls.push(`prefetch ${at.toISOString().slice(11, 16)}`),
      () => calls.push(`change ${new Date().toISOString().slice(11, 16)}`)
    );
    return { c, calls };
  };

  it('prefetches the next hour a minute before it, changes on the hour and re-arms itself', () => {
    vi.setSystemTime(new Date('2026-11-02T00:30:00Z'));
    const { c, calls } = make();
    c.start();
    vi.advanceTimersByTime(2 * HOUR);
    expect(calls).toEqual(['prefetch 01:00', 'change 01:00', 'prefetch 02:00', 'change 02:00']);
    c.stop();
  });

  it('stopped (the app hidden): nothing fetches or changes, however long; start() picks up the current hour', () => {
    vi.setSystemTime(new Date('2026-11-02T00:30:00Z'));
    const { c, calls } = make();
    c.start();
    c.stop();
    expect(c.armed).toBe(false);
    vi.advanceTimersByTime(5 * HOUR);
    expect(calls).toEqual([]);
    expect(vi.getTimerCount()).toBe(0);
    c.start();
    c.start(); // twice (visibilitychange and pageshow): still one pair of timers
    expect(vi.getTimerCount()).toBe(2);
    vi.advanceTimersByTime(HOUR);
    expect(calls).toEqual(['prefetch 06:00', 'change 06:00']);
    c.stop();
  });
});
