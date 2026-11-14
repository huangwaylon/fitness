<script lang="ts">
  // A strip of figures (docs/design.md "Unified kit"): up to 4 cells side by side, a dashed stitch between them; each
  // its icon and label over the value (Fredoka) and unit. A trail's 距離 · 標高差 · 時間, a trip's days. `dense` (a
  // bot's key row: 前回 · 次回 · 成果): the value in body type, wrapping to a second line, `sub` after it in soft
  // type (`11:54 正常`, `11/4（水）2:41` over `保留`).
  //   <StatStrip items={[{ icon: 'distance', value: '8.4', unit: 'km', label: '距離' }, …]} />
  import Icon, { type IconName } from './Icon.svelte';

  interface Item { icon?: IconName; value: string | number; unit?: string; sub?: string; label: string; id?: string }
  let { items, dense = false, attr }: { items: readonly Item[]; dense?: boolean; attr?: string } = $props();
</script>

<dl class="stats" class:dense>
  {#each items as it (it.label)}
    <div class="cell" {...attr && it.id ? { [`data-${attr}-key`]: it.id } : {}}>
      <dt>{#if it.icon}<Icon name={it.icon} size={14} />{/if}{it.label}</dt>
      <dd><b>{it.value}</b>{#if it.unit}<small>{it.unit}</small>{/if}{#if it.sub} <small class="sub">{it.sub}</small>{/if}</dd>
    </div>
  {/each}
</dl>

<style>
  .stats { display: flex; margin: 0; padding: 8px 0; }
  .cell { flex: 1 1 0; min-width: 0; display: grid; gap: 2px; justify-items: center; align-content: start; padding: 0 6px; }
  /* the stitch drawn as a repeating dash (WebKit draws a thin dashed vertical border as one dot) */
  .cell + .cell { background: linear-gradient(var(--stitch) 60%, transparent 0) 0 0 / 1.5px 6px repeat-y; }
  dt { display: inline-flex; align-items: center; gap: 3px; font: 700 var(--fs-xs)/1.2 var(--font-ui); color: var(--text-soft); white-space: nowrap; }
  dd { margin: 0; white-space: nowrap; color: var(--text); }
  b { font: 600 var(--fs-talk)/1.1 var(--font-num); font-variant-numeric: tabular-nums; }
  small { margin-left: 2px; font: 600 var(--fs-s)/1 var(--font-num); color: var(--text-soft); }
  /* dense: two lines at most, breaking between parts (after a day, before its time) */
  .dense { padding: 6px 0 0; }
  .dense .cell { padding: 0 4px; }
  .dense dd { white-space: normal; text-align: center; line-height: 1.25; text-wrap: balance; }
  .dense dd { word-break: keep-all; overflow-wrap: anywhere; }
  .dense b { font: 700 var(--fs-body)/1.25 var(--font-ui); font-variant-numeric: tabular-nums; }
  .dense .sub { display: inline-block; white-space: nowrap; margin: 0; font: 700 var(--fs-s)/1.3 var(--font-ui); }
</style>
