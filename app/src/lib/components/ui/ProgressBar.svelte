<script lang="ts">
  // A progress bar (docs/design.md "Unified kit"): a pill of leaf on a sunk track with an inner lip, 8px (or `h`).
  // `fill` / `track`: other colours (a meter's own, a bedtime story's soft ones); `decor`: hidden from VoiceOver (its figure is
  // beside it); `empty`: nothing measured yet, an outlined track, not a 0.
  //   <ProgressBar value={12} max={35} label="12 / 35" />   <ProgressBar value={k} max={n} h={6} decor />
  let { value, max, label, h = 8, fill, track, decor = false, empty = false }: {
    value: number; max: number; label?: string; h?: number; fill?: string; track?: string; decor?: boolean; empty?: boolean;
  } = $props();
  const pct = $derived(max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0);
</script>

{#if decor}
  <span class="pbar" class:empty style:height="{h}px" style:background={track} aria-hidden="true"><i style:width="{pct}%" style:background={fill} style:box-shadow={fill && 'none'}></i></span>
{:else}
  <span class="pbar" class:empty style:height="{h}px" style:background={track} role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label}><i style:width="{pct}%" style:background={fill} style:box-shadow={fill && 'none'}></i></span>
{/if}

<style>
  .pbar { display: block; flex: 1; min-width: 0; border-radius: var(--r-pill); background: var(--ctl-off); box-shadow: inset 0 1.5px 0 color-mix(in srgb, var(--lip) 70%, transparent); overflow: hidden; }
  .pbar.empty { background: transparent; box-shadow: inset 0 0 0 1.5px var(--edge); }
  i { display: block; height: 100%; border-radius: inherit; background: var(--c-leaf); box-shadow: inset 0 -2px 0 var(--c-leaf-lip); transition: width var(--dur-base) var(--ease-soft); }
  @media (prefers-reduced-motion: reduce) { i { transition: none; } }
</style>
