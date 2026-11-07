<script lang="ts">
  // まねっこ's two melody lines (docs/kikimimi-mic.md §2.1 step 4): the villager's (thick, leaf) and mine (coral) on one
  // time axis from each one's first sound, in semitones from each speaker's own middle (a low voice and a high one
  // compare fairly), the syllables as dots on both, the line's words under theirs at their times (words.json, the
  // karaoke's). Only the tracks (lib/mic/prosody.ts: pitch and loudness per 10 ms) come here, never the voice. SVG.
  import { FRAME_S, type Track } from '#lib/mic/prosody.ts';
  import { t } from '#lib/i18n/index.ts';

  let { ref, you = null, words = [] }: {
    ref: Track;
    you?: Track | null;
    /** The line's words and when each starts (s from the clip's start). */
    words?: readonly { w: string; t: number }[];
  } = $props();

  const W = 320, H = 112, PAD = 8, SPAN = 12;
  /** The axis: the longer of the two spans (frames). */
  const len = $derived(Math.max(1, ref.b - ref.a, you ? you.b - you.a : 0));
  const x = (k: number) => (k / len) * W;
  const y = (st: number) => H / 2 - (Math.max(-SPAN, Math.min(SPAN, st)) / SPAN) * (H / 2 - PAD);

  /** A track's voiced runs as one path (every other frame), and its syllables' dots. */
  function draw(tr: Track): { d: string; dots: { cx: number; cy: number }[] } {
    let d = '', on = false;
    for (let k = tr.a; k < tr.b; k += 2) {
      const v = tr.st[k];
      if (Number.isNaN(v)) {
        on = false;
        continue;
      }
      d += `${on ? 'L' : 'M'}${x(k - tr.a).toFixed(1)} ${y(v).toFixed(1)}`;
      on = true;
    }
    const dots = tr.nuclei.flatMap((k) => {
      const near = [0, -1, 1, -2, 2, -3, 3].map((o) => k + o).find((j) => j >= 0 && j < tr.st.length && !Number.isNaN(tr.st[j]));
      return near === undefined ? [] : [{ cx: x(k - tr.a), cy: y(tr.st[near]) }];
    });
    return { d, dots };
  }
  const theirs = $derived(draw(ref));
  const mine = $derived(you ? draw(you) : null);
  /** About a word's width, as a share of the axis (13 px letters on a ~320 px card), and the rows the words share. */
  const wide = (w: string) => ((w.length * 7.6 + 6) / 320) * 100;
  const ROWS = 3;
  /** Each word at its start on the axis (%), in the first row with room there (else pushed right on the emptiest). */
  const placed = $derived.by(() => {
    const ends = Array<number>(ROWS).fill(-Infinity);
    return words.map((w) => {
      const at = Math.max(0, Math.min(100, ((w.t / FRAME_S - ref.a) / len) * 100));
      let row = ends.findIndex((e) => e <= at);
      if (row < 0) row = ends.indexOf(Math.min(...ends));
      const x = Math.min(100 - wide(w.w), Math.max(at, ends[row]));
      ends[row] = x + wide(w.w);
      return { w: w.w, at: Math.max(0, x), row };
    });
  });
</script>

<figure class="contour" data-mane-contour={you ? 'both' : 'ref'} aria-label={t('kiki.mane.contour')}>
  <svg viewBox="0 0 {W} {H}" preserveAspectRatio="none" aria-hidden="true">
    <line class="mid" x1="0" x2={W} y1={H / 2} y2={H / 2} />
    <path class="ref" d={theirs.d} />
    {#each theirs.dots as p, i (i)}<circle class="ref-dot" cx={p.cx} cy={p.cy} r="4" />{/each}
    {#if mine}
      <path class="you" d={mine.d} />
      {#each mine.dots as p, i (i)}<circle class="you-dot" cx={p.cx} cy={p.cy} r="3" />{/each}
    {/if}
  </svg>
  {#if placed.length}
    <div class="words" lang="en" aria-hidden="true">
      {#each placed as p, i (i)}<span style:left="{p.at}%" style:top="{p.row * 18}px">{p.w}</span>{/each}
    </div>
  {/if}
  <figcaption class="legend">
    <span class="key ref-key">{t('kiki.mane.legend.ref')}</span>
    {#if you}<span class="key you-key">{t('kiki.mane.legend.you')}</span>{/if}
  </figcaption>
</figure>

<style>
  .contour { margin: 0; display: grid; gap: 4px; padding: 10px 12px 8px; border-radius: var(--r-card); background: var(--card); box-shadow: inset 0 0 0 2px var(--edge); }
  svg { width: 100%; height: 112px; overflow: visible; }
  .mid { stroke: var(--edge); stroke-width: 1; stroke-dasharray: 3 5; vector-effect: non-scaling-stroke; }
  path { fill: none; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
  .ref { stroke: var(--c-leaf); stroke-width: 7; opacity: .9; }
  .ref-dot { fill: var(--c-leaf-edge); }
  .you { stroke: var(--c-coral); stroke-width: 3.5; }
  .you-dot { fill: var(--coral-text); }
  .words { position: relative; height: 54px; font: 700 var(--fs-s)/1 var(--font-ui); color: var(--text-soft); }
  .words span { position: absolute; top: 0; white-space: nowrap; }
  .legend { display: flex; gap: 14px; justify-content: flex-end; font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); }
  .key::before { content: ''; display: inline-block; width: 16px; height: 4px; margin-right: 6px; vertical-align: middle; border-radius: 2px; }
  .ref-key::before { height: 6px; background: var(--c-leaf); }
  .you-key::before { background: var(--c-coral); }
</style>
