// The count race's screen plumbing (なかま分け Sort.svelte, 数字キャッチ Numbers.svelte; mini/race.ts): the seat's count
// (from 0 for each new seat at the phone), sent once as the time is up (`over`: the first counts); online, the count
// to the others as a `mini` frame `<tag><n>`, at most one a second; and the team's total so far (each seat's count
// in, else its last frame, mine as it is). Called in a component's script with its props as getters (each effect
// follows only what it reads).
import type { Who } from '#lib/types.ts';
import type { Play } from '../../mini/types.ts';
import type { RaceState } from '../../mini/race.ts';

interface RaceProps {
  s: RaceState;
  seat: Who | null;
  over: boolean;
  play: (p: Play, who?: Who) => void;
  views: Partial<Record<Who, string>>;
  onview?: (v: string) => void;
}

export function raceView(tag: 'so' | 'nu', p: Readonly<RaceProps>): { readonly count: number; add: () => void; readonly team: number } {
  let count = $state(0);
  let sentFor: Who | null = null;
  $effect(() => {
    void p.seat;
    count = 0;
    sentFor = null;
  });
  $effect(() => {
    const seat = p.seat;
    if (!p.over || !seat || sentFor === seat || p.s.counts[seat] !== undefined) return;
    sentFor = seat;
    p.play({ n: count }, seat);
  });
  let lastSent = 0, timer: ReturnType<typeof setTimeout> | undefined;
  $effect(() => {
    const n = count, onview = p.onview;
    if (!onview || !p.seat) return;
    const wait = Math.max(0, lastSent + 1000 - performance.now());
    clearTimeout(timer);
    timer = setTimeout(() => ((lastSent = performance.now()), onview(`${tag}${n}`)), wait);
  });
  $effect(() => () => clearTimeout(timer));
  const frame = new RegExp(`^${tag}(\\d+)$`);
  const team = $derived.by(() => {
    const { s, seat, views } = p;
    return s.seats.reduce((n, x) => {
      if (s.counts[x.who] !== undefined) return n + s.counts[x.who]!;
      if (x.who === seat) return n + count;
      const m = frame.exec(views[x.who] ?? '');
      return n + (m ? Number(m[1]) : 0);
    }, 0);
  });
  return {
    get count() {
      return count;
    },
    add: () => void count++,
    get team() {
      return team;
    }
  };
}
