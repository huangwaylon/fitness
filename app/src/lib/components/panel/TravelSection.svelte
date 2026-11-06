<script lang="ts">
  // せってい → りょこう (docs/travel.md "Units"): the guides' distances in km or miles, kept on this phone only
  // (components/travel/units.ts).
  import Segmented from '../ui/Segmented.svelte';
  import { UNITS, setUnits, units } from '../travel/units.ts';
  import { t } from '#lib/i18n/index.ts';

  const items = UNITS.map((u) => ({ id: u, label: u }));
</script>

<div class="prows">
  <div class="prow static">
    <span class="prl">{t('panel.units')}</span>
    <div class="seg"><Segmented {items} value={units.current} label={t('panel.units')} attr="units" onpick={setUnits} /></div>
  </div>
</div>

<style>
  .seg { flex: none; width: 152px; font-family: var(--font-num); }
  .seg :global(.sb) { font-family: var(--font-num); }
</style>
