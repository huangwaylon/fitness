<script lang="ts">
  // The trip map on its own (routes/dev/map): the sample Okinawa trip with the controls the trip sheet will have (the
  // day chips, the candidate layers, the language), to judge the style on a phone and for the map's specs. `?day=`,
  // `?sel=`, `?lang=en`, `?layers=camp,food` set where it starts.
  import TripMap from './TripMap.svelte';
  import { SAMPLE_COLORS, SAMPLE_LEGS, SAMPLE_PLACES } from './sample.ts';
  import { dayColor, LAYERS, nameOf, type Day, type Layer, type Locale } from './types.ts';

  const q = new URLSearchParams(location.search);
  let day = $state<Day>(q.get('day') && q.get('day') !== 'all' ? Number(q.get('day')) : 'all');
  let selected = $state<string | undefined>(q.get('sel') ?? undefined);
  let locale = $state<Locale>(q.get('lang') === 'en' ? 'en' : 'ja');
  const on = new Set((q.get('layers') ?? '').split(','));
  let layers = $state<Partial<Record<Layer, boolean>>>(Object.fromEntries(LAYERS.map((l) => [l, on.has(l)])));
  const LAYER_NAME = { camp: { ja: 'キャンプ', en: 'Camp' }, nature: { ja: 'しぜん', en: 'Nature' }, food: { ja: 'たべもの', en: 'Food' } } as const;
  const picked = $derived(SAMPLE_PLACES.find((p) => p.id === selected));
</script>

<div class="dev">
  <div class="map"><TripMap places={SAMPLE_PLACES} legs={SAMPLE_LEGS} dayColors={SAMPLE_COLORS} {day} {selected} {layers} {locale} onselect={(id) => (selected = id)} /></div>
  <div class="bar">
    <div class="chips" role="group" aria-label="day">
      {#each ['all', 1, 2, 3] as const as d (d)}
        <button type="button" class="chip" data-day-chip={d} data-sfx="tick" aria-pressed={day === d} style:--dc={d === 'all' ? null : dayColor(SAMPLE_COLORS, d)}
          onclick={() => ((day = d), (selected = undefined))}>{d === 'all' ? (locale === 'ja' ? 'ぜんぶ' : 'All') : `${d}${locale === 'ja' ? 'にちめ' : ''}`}</button>
      {/each}
    </div>
    <div class="chips" role="group" aria-label="layers">
      {#each LAYERS as l (l)}
        <button type="button" class="chip" data-layer-chip={l} data-sfx="tick" aria-pressed={!!layers[l]} onclick={() => (layers = { ...layers, [l]: !layers[l] })}>{LAYER_NAME[l][locale]}</button>
      {/each}
      <button type="button" class="chip" data-lang-chip data-sfx="tick" onclick={() => (locale = locale === 'ja' ? 'en' : 'ja')}>{locale === 'ja' ? 'EN' : 'にほんご'}</button>
    </div>
    <p class="picked" data-picked={selected ?? ''}>{picked ? nameOf(picked.name, locale) : ''}</p>
  </div>
</div>

<style>
  .dev { position: fixed; inset: 0; display: flex; flex-direction: column; background: var(--bg); }
  .map { flex: 1; min-height: 0; position: relative; }
  .bar { padding: 10px var(--side) var(--pad-foot); display: grid; gap: 8px; }
  .chip[style*='--dc'] { box-shadow: inset 0 0 0 2px var(--dc), 0 var(--lip-h) 0 var(--dc); }
  .picked { margin: 0; min-height: 1.4em; font: 700 var(--fs-body) / 1.4 var(--font-ui); color: var(--text); }
</style>
