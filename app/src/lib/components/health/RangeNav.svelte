<script lang="ts">
  // The sticky ‹ range › きょう row (けんこう's, ごはん's day and its グラフ): it stays at the top of the panel while the
  // cards scroll under it. The middle (the range, the day) is the caller's, styled there; `end` after きょう (ごはん's
  // グラフ: its period).
  import type { Snippet } from 'svelte';

  interface Props {
    /** ‹ and ›'s accessible names. */
    earlier: string;
    later: string;
    today: string;
    /** Whether ‹ / › have anything to show (null: ‹ always does, no aria-disabled). */
    canBack?: boolean | null;
    canOn: boolean;
    /** Already on today (きょう disabled). */
    atToday: boolean;
    onback: () => void;
    onon: () => void;
    ontoday: () => void;
    children: Snippet;
    end?: Snippet;
  }
  let { earlier, later, today, canBack = null, canOn, atToday, onback, onon, ontoday, children, end }: Props = $props();
</script>

<div class="nav">
  <button type="button" class="nb" data-nav="back" aria-label={earlier} aria-disabled={canBack === null ? undefined : !canBack} data-sfx="tick" onclick={onback}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 L8 12 L15 19" /></svg>
  </button>
  {@render children()}
  <button type="button" class="nb" data-nav="on" aria-label={later} aria-disabled={!canOn} data-sfx="tick" onclick={onon}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5 L16 12 L9 19" /></svg>
  </button>
  <button type="button" class="nb today" data-nav="today" aria-disabled={atToday} data-sfx="tick" onclick={ontoday}>{today}</button>
  {@render end?.()}
</div>

<style>
  .nav {
    position: sticky; top: -6px; z-index: 2; display: flex; align-items: center; gap: 8px; min-width: 0;
    margin: 0 -8px; padding: 2px 8px 4px; background: var(--surface);
  }
  .nav::after { content: ''; position: absolute; left: 0; right: 0; top: 100%; height: 12px; pointer-events: none; background: linear-gradient(var(--surface), transparent); }
  /* the kit's control (docs/design.md "Sizes"): drawn at 32px in the 44px hit, the small edge */
  .nb {
    appearance: none; border: 0; cursor: pointer; flex: none; position: relative; min-width: var(--hit); height: var(--hit); padding: 0 12px;
    border-radius: var(--r-pill); display: inline-flex; align-items: center; justify-content: center; background: none; isolation: isolate;
    font: 700 var(--fs-s)/1 var(--font-ui); color: var(--text);
  }
  .nb::before { content: ''; position: absolute; z-index: -1; inset: 6px 0; border-radius: inherit; background: var(--ctl); box-shadow: var(--sh-ctl); }
  .nb:not(.today)::before { inset: 6px; }
  .nb svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
  .nb:active:not([aria-disabled='true'])::before { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  /* (off: greyed out, never a filled chip: on today 今日 read as picked, the night's sunk fill a selection) */
  .nb[aria-disabled='true'] { color: var(--text-soft); cursor: default; opacity: .45; }
  .nb[aria-disabled='true']::before { box-shadow: var(--sh-ctl); }
</style>
