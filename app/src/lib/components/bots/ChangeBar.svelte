<script lang="ts" module>
  /** A part: its id (the data-* value), its fill (leaf, yuzu, hatched, sunk and outlined), its word and count. */
  export interface ChangeSeg { id: string; tone: 'leaf' | 'yuzu' | 'hatch' | 'sunk'; label: string; n: number }
</script>

<script lang="ts">
  // The bots' thin segmented bar (docs/design.md "Bots"; the dataviz one): 8px, round ends, 2px gaps, each part as wide
  // as its count (an empty one left out of the bar), then the legend: each part's swatch, word and count (1,200;
  // never colour alone). 保養所's night (its searched facilities by why, inside the night's button: hidden from VoiceOver, the
  // button says it) and メニュー's 最新の更新 (one image with `label`: 「最新の更新：追加12、値の変更38、終了3、削除0」).
  // `attr`: the page's data-* prefix (data-its-seg="check").
  import { formatNum } from '#lib/i18n/index.ts';

  let { segs, attr, label }: { segs: readonly ChangeSeg[]; attr: string; label?: string } = $props();
  const data = (v: string) => ({ [`data-${attr}-seg`]: v });
</script>

{#snippet body()}
  <span class="bar" aria-hidden="true">{#each segs.filter((s) => s.n > 0) as s (s.id)}<i class="seg {s.tone}" style:flex-grow={s.n}></i>{/each}</span>
  <span class="legend" aria-hidden="true">{#each segs as s (s.id)}<span {...data(s.id)}><i class="seg {s.tone}"></i>{s.label} {formatNum(s.n)}</span>{/each}</span>
{/snippet}

{#if label}
  <div class="changes" role="img" aria-label={label}>{@render body()}</div>
{:else}
  {@render body()}
{/if}

<style>
  .changes { display: grid; gap: 8px; }
  .bar { display: flex; gap: 2px; height: 8px; border-radius: 4px; overflow: hidden; }
  .bar .seg { flex: 1 1 0; min-width: 3px; border-radius: 1px; }
  .seg { display: inline-block; background: var(--ctl-off); box-shadow: inset 0 0 0 1px var(--edge); }
  .seg.leaf { background: var(--c-leaf); box-shadow: none; }
  .seg.yuzu { background: var(--c-yuzu); box-shadow: none; }
  .seg.hatch { background: repeating-linear-gradient(45deg, var(--text-soft) 0 1.5px, var(--ctl-off) 1.5px 4.5px); box-shadow: none; }
  .legend { display: flex; flex-wrap: wrap; gap: 2px 12px; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .legend > span { display: inline-flex; align-items: center; gap: 4px; font-variant-numeric: tabular-nums; }
  .legend .seg { width: 12px; height: 8px; border-radius: 2px; flex: none; }
</style>
