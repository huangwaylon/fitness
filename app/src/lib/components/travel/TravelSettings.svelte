<script lang="ts">
  // 旅行's 設定 tab (docs/design.md §Trips): 単位, this phone's km | mi (units.ts), also 登山's distances and the
  // guides' m → ft and °C → °F (text.ts).
  import Segmented from '../ui/Segmented.svelte';
  import { t } from '#lib/i18n/index.ts';
  import { UNITS, setUnits, units } from './units.ts';
</script>

<div class="settings" data-travel-settings>
  <section class="sec" aria-labelledby="tv-units">
    <h3 id="tv-units" class="sec-label">{t('travel.units')}</h3>
    <div class="card box">
      <Segmented size="m" items={UNITS.map((u) => ({ id: u, label: u }))} value={units.current} label="km / mi" attr="units" onpick={setUnits} />
      <p class="sub">{t('travel.unitsSub')}</p>
    </div>
  </section>
</div>

<style>
  .settings { display: grid; gap: 16px; padding: 6px 12px 24px; }
  .sec { display: grid; gap: 8px; }
  .box { display: grid; gap: 10px; padding: 14px; }
  .sub { margin: 0 4px; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
</style>
