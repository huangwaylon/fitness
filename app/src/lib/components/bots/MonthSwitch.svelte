<script lang="ts">
  // ボット's calendar heading (docs/design.md "Bots"), ジム's and 保養所's: the section's label, the page's own bits
  // (`children`: 未保存, 選択), and 今月 · 来月 (the kit's small Segmented, `11月` · `12月`; none without `months`).
  import type { Snippet } from 'svelte';
  import Segmented from '../ui/Segmented.svelte';
  import { t } from '#lib/i18n/index.ts';
  import { monthLabel } from '#lib/i18n/format.ts';

  interface Props {
    id: string;
    title: string;
    /** `YYYY-MM` each (time/dates.ts twoMonths). */
    months: readonly string[];
    value: string;
    /** The pills' data attribute (`data-gym-month`). */
    attr: string;
    onpick: (month: string) => void;
    children?: Snippet;
  }
  let { id, title, months, value, attr, onpick, children }: Props = $props();
  const items = $derived(months.map((m) => ({ id: m, label: monthLabel(m, { year: false }) })));
</script>

<div class="mhead">
  <h3 {id} class="sec-label">{title}</h3>
  {@render children?.()}
  {#if items.length}<Segmented size="s" {items} {value} label={t('bots.cal.month')} {attr} {onpick} />{/if}
</div>

<style>
  .mhead { display: flex; align-items: center; gap: 8px; min-height: 40px; }
  .mhead h3 { flex: 1; min-width: 0; margin-top: 0; }
</style>
