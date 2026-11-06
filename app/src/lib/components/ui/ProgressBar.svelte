<script lang="ts">
  // A progress bar (docs/design.md "Unified kit"): 8px of leaf on a sunk track with an inner lip, rounded.
  //   <ProgressBar value={12} max={35} label="12 / 35" />
  let { value, max, label }: { value: number; max: number; label?: string } = $props();
  const pct = $derived(max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0);
</script>

<div class="pbar" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label}><i style:width="{pct}%"></i></div>

<style>
  .pbar { flex: 1; min-width: 0; height: 8px; border-radius: var(--r-pill); background: var(--ctl-off); box-shadow: inset 0 1.5px 0 color-mix(in srgb, var(--lip) 70%, transparent); overflow: hidden; }
  i { display: block; height: 100%; border-radius: inherit; background: var(--c-leaf); box-shadow: inset 0 -2px 0 var(--c-leaf-lip); transition: width var(--dur-base) var(--ease-soft); }
  @media (prefers-reduced-motion: reduce) { i { transition: none; } }
</style>
