// SoundLine's karaoke (docs/kikimimi.md "Visuals"): the word being said while a clip plays, from its words' starts
// (clips.ts wordTimes: [start…, end] in seconds) and when it started on the relay's clock. A frame loop runs only while
// it plays; `at` changes only when the word does. Called in a component's script (it owns an $effect).

/** The word being said: -1 before the first, past the last `times.length` (every word said); null when not playing. */
export function karaoke(o: { from: () => number | null; times: () => readonly number[]; clock: () => number }): { readonly at: number | null } {
  let at = $state<number | null>(null);
  $effect(() => {
    const start = o.from(), ts = o.times();
    if (start === null) {
      at = null;
      return;
    }
    // the word kept here, never read back from `at`: the first frame runs inside this effect, and reading the state it
    // writes would make the effect depend on it (each write re-running it: an update loop)
    let raf = 0, cur: number | null | undefined;
    const show = (w: number | null) => {
      if (w !== cur) at = cur = w;
    };
    const tick = () => {
      const s = (o.clock() - start) / 1000;
      if (s >= ts.at(-1)! + 0.3) return show(null);
      let k = -1;
      while (k + 1 < ts.length - 1 && ts[k + 1] <= s) k++;
      show(s >= ts.at(-1)! ? ts.length : k);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  });
  return {
    get at() {
      return at;
    }
  };
}
