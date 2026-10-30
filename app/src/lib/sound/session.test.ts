// The audio session, the resume and unlock conditions, the idle suspend and the hand-off timing (session.ts), and the
// loudness gain (hourly.ts trackLevel), without an AudioContext (sound.md §11).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  IDLE_SUSPEND_MS,
  IdleTimer,
  RESUME_WINDOW_MS,
  SESSION_RELEASE_MS,
  SessionSwitch,
  canSound,
  needsFadeIn,
  needsUnlock,
  sessionType,
  wrapTarget,
  type SessionType
} from './session.ts';
import { trackLevel } from './hourly.ts';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('audio session type (round 16 H2, option A)', () => {
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

describe('when a cue may sound (round 16 M2)', () => {
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

describe('when a tap must unlock (round 16 M1)', () => {
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

describe('fade back in (round 16 H1)', () => {
  it('a paused deck, or one playing at under half its level (played by iOS while hidden, gain still 0)', () => {
    expect(needsFadeIn(true, 1, 1)).toBe(true);
    expect(needsFadeIn(false, 0, 1)).toBe(true);
    expect(needsFadeIn(false, 0.3, 0.7)).toBe(true);
    expect(needsFadeIn(false, 0.7, 0.7)).toBe(false);
    expect(needsFadeIn(false, 0.4, 0.7)).toBe(false);
  });
});

describe('idle suspend (round 16 M3)', () => {
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

describe('loudness gain (round 16 M5)', () => {
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
