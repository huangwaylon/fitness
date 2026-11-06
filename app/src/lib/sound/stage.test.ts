// The shared music stages (docs/sound-sync.md): last writer wins by (at, who), a record ends by itself, a tap always
// replaces what plays, and how far in a song is goes by the relay's clock.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Intent, MusicRec } from '#lib/contract/live-protocol.ts';
import { acked, bindStage, cutInOf, cutInSong, enterStage, hear, hush, live, onStage, request, resetStage, stage } from './stage.svelte.ts';

const T0 = Date.UTC(2026, 10, 6, 11);
let sent: Intent[];
let offset: number;
let changes: number;

const rec = (o: Partial<MusicRec>): MusicRec => ({ v: 3, kind: 'music', src: 'isl', at: T0, song: 'kk-march', ms: 120_000, who: 'B', t: T0, ...o }) as MusicRec;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(T0);
  resetStage();
  sent = [];
  offset = 0;
  changes = 0;
  bindStage({ send: (i) => (sent.push(i), true), serverNow: () => Date.now() + offset, me: () => 'A' });
  onStage(() => changes++);
});
afterEach(() => {
  resetStage();
  vi.useRealTimers();
});

describe('the stage', () => {
  it('an island cut-in is its ev- song, the rest K.K.’s', () => {
    expect(cutInSong('aerobics')).toBe('ev-aerobics');
    expect(cutInOf('ev-happy-birthday')).toBe('happy-birthday');
    expect(cutInOf(cutInSong('aerobics'))).toBe('aerobics');
    expect(cutInOf('kk-march')).toBeNull();
  });

  it('a request plays at once here and goes to the room with its length; hush stops it for everyone', () => {
    request('isl', 'kk-march', { ms: 90_000 });
    expect(live('isl')).toMatchObject({ song: 'kk-march', at: T0, ms: 90_000, who: 'A', elapsedMs: 0 });
    expect(sent).toEqual([{ kind: 'music', src: 'isl', at: T0, song: 'kk-march', ms: 90_000 }]);
    expect(changes).toBe(1);
    vi.advanceTimersByTime(1000);
    hush('isl');
    expect(live('isl')).toBeNull();
    expect(sent[1]).toEqual({ kind: 'music', src: 'isl', at: T0 + 1000 });
  });

  it('last writer wins by (at, who): an older record changes nothing, a tie goes to the later who', () => {
    hear(rec({ at: T0 }));
    hear(rec({ at: T0 - 5, song: 'kk-waltz', who: 'G' }));
    expect(live('isl')?.song).toBe('kk-march');
    hear(rec({ at: T0, song: 'kk-waltz', who: 'G' }));
    expect(live('isl')?.song).toBe('kk-waltz');
    hear(rec({ at: T0, song: 'kk-swing', who: 'A' }));
    expect(live('isl')?.song).toBe('kk-waltz');
    // a stop beats an older start heard late (a resend)
    hear(rec({ at: T0 + 10, song: undefined, ms: undefined }));
    hear(rec({ at: T0 + 5, song: 'kk-jazz' }));
    expect(live('isl')).toBeNull();
  });

  it('a tap replaces what plays even when this phone’s clock is behind the record', () => {
    hear(rec({ at: T0 + 3000 }));
    request('isl', 'kk-waltz', { ms: 1000 });
    expect(live('isl', T0 + 3001)?.song).toBe('kk-waltz');
    expect((sent[0] as { at: number }).at).toBe(T0 + 3001);
  });

  it('ends by itself: the record goes at its end, a change told, nothing sent', () => {
    hear(rec({ ms: 60_000 }));
    changes = 0;
    vi.advanceTimersByTime(59_000);
    expect(live('isl')?.elapsedMs).toBe(59_000);
    vi.advanceTimersByTime(1100);
    expect(live('isl')).toBeNull();
    expect(stage.on.isl).toBeUndefined();
    expect(changes).toBe(1);
    expect(sent).toEqual([]);
  });

  it('how far in goes by the relay’s clock (this device 4 s behind it)', () => {
    offset = 4000;
    hear(rec({ at: T0 - 10_000 }));
    expect(live('isl')?.elapsedMs).toBe(14_000);
  });

  it('one already over is never taken', () => {
    hear(rec({ at: T0 - 200_000 }));
    expect(stage.on.isl).toBeUndefined();
    expect(changes).toBe(0);
  });

  it('copies the room’s clamp of my own record (its at over 5 s off)', () => {
    offset = -60_000; // a clock a minute behind
    request('isl', 'kk-march', { ms: 120_000 });
    acked(sent[0], true, T0);
    expect(stage.on.isl?.at).toBe(T0);
    acked({ kind: 'music', src: 'isl', at: 1 }, true, T0 + 50); // not mine any more: nothing
    expect(stage.on.isl?.at).toBe(T0);
  });

  it('where I am: entering tells, leaving clears only my own place', () => {
    const leaveIsl = enterStage('isl');
    const leaveT = enterStage('t');
    leaveIsl(); // the island page unmounting after the tent's room came
    expect(stage.here).toBe('t');
    leaveT();
    expect(stage.here).toBeNull();
    // a room mounted again before the last one's leaving (the same stage): still in it
    const first = enterStage('t');
    const again = enterStage('t');
    first();
    expect(stage.here).toBe('t');
    again();
    expect(stage.here).toBeNull();
  });
});
