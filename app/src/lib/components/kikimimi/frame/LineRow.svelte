<script lang="ts">
  // A line on a voice game's results list (くりかえし's sentences, まねっこ's lines, ロールプレイ's key phrases): its mark
  // (○ said, × missed, – skipped, ✓ came through, ・ not seen; none: no mark), the English, its Japanese, and ▶︎ (`onhear`)
  // at its end. One card a line, as the review list's rows.
  import type { HTMLLiAttributes } from 'svelte/elements';
  import HearButton from './HearButton.svelte';

  let { sym, tone = 'soft', en, ja, onhear, hear, ...rest }: {
    sym?: string;
    /** The mark's colour: leaf, coral or the soft text. */
    tone?: 'ok' | 'miss' | 'soft';
    en: string;
    ja: string;
    onhear?: () => void;
    /** The ▶︎ button's own attributes (a spec's hook). */
    hear?: Record<string, string | number>;
  } & HTMLLiAttributes = $props();
</script>

<li class="row card" class:marked={!!sym} {...rest}>
  {#if sym}<span class="sym {tone}" aria-hidden="true">{sym}</span>{/if}
  <span class="txt"><b lang="en">{en}</b><small>{ja}</small></span>
  {#if onhear}<HearButton {...hear} onclick={onhear} />{/if}
</li>

<style>
  .row { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 10px; padding: 10px 12px; }
  .row.marked { grid-template-columns: auto minmax(0, 1fr) auto; }
  .sym { font: 700 22px/1.2 var(--font-ui); color: var(--text-soft); }
  .sym.ok { color: var(--leaf-text); }
  .sym.miss { color: var(--coral-text); }
  .txt { display: grid; gap: 2px; min-width: 0; }
  .txt b { font: 700 var(--fs-body)/1.4 var(--font-ui); color: var(--text); overflow-wrap: anywhere; }
  .txt small { font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
</style>
