<script lang="ts">
  // A strip of figures (docs/design.md "Unified kit"): up to 4 cells side by side, a dashed stitch between them; each
  // its icon and label over the value (Fredoka) and unit. A trail's 距離 · 標高差 · 時間, a trip's days.
  //   <StatStrip items={[{ icon: 'distance', value: '8.4', unit: 'km', label: '距離' }, …]} />
  import Icon, { type IconName } from './Icon.svelte';

  let { items }: { items: readonly { icon?: IconName; value: string | number; unit?: string; label: string }[] } = $props();
</script>

<dl class="stats">
  {#each items as it (it.label)}
    <div class="cell">
      <dt>{#if it.icon}<Icon name={it.icon} size={14} />{/if}{it.label}</dt>
      <dd><b>{it.value}</b>{#if it.unit}<small>{it.unit}</small>{/if}</dd>
    </div>
  {/each}
</dl>

<style>
  .stats { display: flex; margin: 0; padding: 8px 0; }
  .cell { flex: 1 1 0; min-width: 0; display: grid; gap: 2px; justify-items: center; padding: 0 6px; position: relative; }
  .cell + .cell::before { content: ''; position: absolute; left: 0; top: 4px; bottom: 4px; border-left: 1.5px dashed var(--stitch); }
  dt { display: inline-flex; align-items: center; gap: 3px; font: 700 var(--fs-xs)/1.2 var(--font-ui); color: var(--text-soft); white-space: nowrap; }
  dd { margin: 0; white-space: nowrap; color: var(--text); }
  b { font: 600 var(--fs-talk)/1.1 var(--font-num); font-variant-numeric: tabular-nums; }
  small { margin-left: 2px; font: 600 var(--fs-s)/1 var(--font-num); color: var(--text-soft); }
</style>
