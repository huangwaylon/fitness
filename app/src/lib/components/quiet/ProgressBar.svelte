<script lang="ts">
  // A thin progress bar (docs/design.md "Quiet sheets"): 4px, the accent on a hairline track.
  //   <ProgressBar value={12} max={35} label="12 / 35" />
  let { value, max, label }: { value: number; max: number; label?: string } = $props();
  const pct = $derived(max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0);
</script>

<div class="q-bar" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label}><i style:width="{pct}%"></i></div>

<style>
  .q-bar { flex: 1; min-width: 0; height: 4px; border-radius: 2px; background: var(--q-hairline); overflow: hidden; }
  i { display: block; height: 100%; border-radius: 2px; background: var(--q-accent); transition: width 240ms cubic-bezier(.2, .8, .2, 1); }
</style>
