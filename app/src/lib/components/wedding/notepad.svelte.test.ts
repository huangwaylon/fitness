// けっこんしき's メモ pick (components/wedding/notepad.svelte.ts): これに する waits out its とりけす banner, then saves
// from the version held when it was picked, even if the other phone settled the crossing meanwhile.
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fake = vi.hoisted(() => ({
  conflict: null as { current: { md: string; at: number }; other: { md: string; at: number } } | null,
  saves: [] as [string, number | null | undefined][]
}));
vi.mock('./board.svelte.ts', () => ({
  board: {
    get conflict() {
      return fake.conflict;
    },
    saveNote: (md: string, from?: number | null) => (fake.saves.push([md, from]), true)
  }
}));
vi.mock('#lib/ui-state/toast.svelte.ts', () => ({ toasts: { show: vi.fn() } }));

const { pick, pad, flush } = await import('./notepad.svelte.ts');

beforeEach(() => {
  vi.useFakeTimers();
  fake.saves = [];
  fake.conflict = { current: { md: 'mine', at: 20 }, other: { md: 'theirs', at: 10 } };
});

describe('pick', () => {
  it('saves after its banner, from the held version', () => {
    pick('theirs');
    expect(pad.picked).toBe('theirs');
    expect(fake.saves).toEqual([]);
    vi.advanceTimersByTime(5000);
    expect(fake.saves).toEqual([['theirs', 20]]);
    expect(pad.picked).toBeNull();
  });

  it('the other phone settles the crossing during とりけす: the pick is still saved, from the version it was made on', () => {
    pick('theirs');
    fake.conflict = null; // (their save from the held one: settled, a new note)
    vi.advanceTimersByTime(5000);
    expect(fake.saves).toEqual([['theirs', 20]]);
  });

  it('the sheet closing saves a waiting pick at once; no crossing, nothing to pick', () => {
    pick('mine');
    flush();
    expect(fake.saves).toEqual([['mine', 20]]);
    fake.conflict = null;
    pick('x');
    expect(pad.picked).toBeNull();
    vi.advanceTimersByTime(5000);
    expect(fake.saves).toHaveLength(1);
  });
});
