<script lang="ts">
  // 今週と 先週 (けんこう's first card, for the trainer at a glance): per person, me first, one row per metric in the app's
  // order and 体重: this week's daily average so far (its finished days with data), last week's, the change (% for
  // activity, kg for weight) and the goal days (met / days with data). Calendar weeks Mon–Sun, as everywhere in the app
  // (the Wednesday lock is the economy's only). Independent of the period below: always this week and last.
  import type { PersonId } from '#lib/types.ts';
  import { METRICS, METRIC_FRUIT, weekCompare, type HealthSeries, type Metric } from '#lib/model/health.ts';
  import { fruitArt } from '#lib/art.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';
  import { md } from '#lib/i18n/format.ts';
  import Avatar from '../characters/Avatar.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { pctText } from './fmt.ts';

  interface Props {
    hs: HealthSeries;
    order: PersonId[];
    names: Record<PersonId, string>;
    villagers: Record<PersonId, string | null>;
  }
  let { hs, order, names, villagers }: Props = $props();
  const rows = $derived(order.map((p) => ({ p, w: weekCompare(hs, p) })));
  const w0 = $derived(rows[0].w);
  const span = (r: { from: string; to: string }) => t('kiroku.range', { a: md(r.from), b: md(r.to) });
  const num = (v: number | null) => (v === null ? '–' : formatNum(Math.floor(v)));
  const arrow = (c: number) => (c > 0.005 ? '↑' : c < -0.005 ? '↓' : '→');
  const unit = (m: Metric) => t(`health.u.${m}`);
  /** `−1.5` / `+0.2` / `±0.0` (the row says kg). */
  const kgSigned = (d: number) => `${d < 0 ? '−' : d > 0 ? '+' : '±'}${Math.abs(d).toFixed(1)}`;
</script>

<section class="card wk" aria-labelledby="wk-h">
  <header>
    <h3 id="wk-h">{t('health.week.title')}</h3>
    <p class="span">{t('health.week.spans', { cur: span(w0.cur), prev: span(w0.prev) })}</p>
  </header>
  {#each rows as { p, w } (p)}
    <div class="pb" data-person={p}>
      <p class="ph" id="wk-{p}"><span class="who"><Avatar person={p} villager={villagers[p]} size={24} /><i class="sw p{p}" aria-hidden="true"></i></span>{names[p]}</p>
      <table aria-labelledby="wk-{p}">
        <colgroup><col class="c-l" /><col class="c-n" /><col class="c-n" /><col class="c-c" /><col class="c-g" /></colgroup>
        <thead>
          <tr>
            <td></td>
            <th scope="col">{t('health.week.cur', { n: w.elapsed })}</th>
            <th scope="col">{t('health.week.prev')}</th>
            <th scope="col">{t('health.week.change')}</th>
            <th scope="col">{t('goal.title')}</th>
          </tr>
        </thead>
        <tbody>
          {#each METRICS as m (m)}
            {@const r = w.metrics[m]}
            <tr data-metric={m}>
              <th scope="row"><span class="mh"><OfficialArt key={fruitArt(METRIC_FRUIT[m])} size={18} /><span>{t(`fruit.${METRIC_FRUIT[m]}`)}<small>{unit(m)}</small></span></span></th>
              <td class="money cur">{num(r.cur.avg)}</td>
              <td class="money soft">{num(r.prev.avg)}</td>
              <td class="money chg">{#if r.change === null}–{:else}<span aria-hidden="true">{arrow(r.change)}</span>{pctText(r.change)}{/if}</td>
              <td class="money soft">{r.cur.days ? `${r.cur.met}/${r.cur.days}` : '–'}</td>
            </tr>
          {/each}
          <tr data-metric="weight">
            <th scope="row"><span class="mh"><svg class="scale" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-scale" /></svg><span>{t('goal.weight')}<small>kg</small></span></span></th>
            <td class="money cur">{w.weight.cur === null ? '–' : w.weight.cur.toFixed(1)}</td>
            <td class="money soft">{w.weight.prev === null ? '–' : w.weight.prev.toFixed(1)}</td>
            <td class="money chg">{w.weight.diff === null ? '–' : kgSigned(w.weight.diff)}</td>
            <td class="money soft">–</td>
          </tr>
        </tbody>
      </table>
    </div>
  {/each}
  <p class="foot">{t('health.week.foot')}</p>
</section>

<style>
  .wk { display: grid; gap: 8px; padding: 12px 12px 10px; }
  header { display: grid; gap: 2px; padding: 0 2px; }
  h3 { margin: 0; font-size: var(--fs-talk); font-weight: 700; }
  .span { margin: 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); font-variant-numeric: tabular-nums; }
  .pb + .pb { padding-top: 6px; border-top: 1px dashed color-mix(in srgb, var(--lip) 70%, transparent); }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .ph { margin: 0; display: flex; align-items: center; gap: 8px; padding: 2px 2px 2px; font-size: var(--fs-body); font-weight: 700; }
  /* the label column takes what the numbers leave: 37 · 17 · 15 · 20 · 11 % */
  .c-l { width: 37%; }
  .c-n { width: 16%; }
  .c-c { width: 20%; }
  .c-g { width: 11%; }
  .who { position: relative; display: inline-flex; padding-bottom: 5px; }
  .sw { position: absolute; left: 3px; right: 3px; bottom: 0; height: 4px; border-radius: 2px; }
  .sw.pA { background: var(--person-a); }
  .sw.pB { background: var(--person-b); }
  thead th { font-size: var(--fs-xs); font-weight: 700; color: var(--text-soft); text-align: right; padding: 0 2px 3px; white-space: nowrap; }
  tbody tr + tr { border-top: 1px dashed color-mix(in srgb, var(--lip) 55%, transparent); }
  tbody th { text-align: left; font-weight: 700; padding: 5px 0; }
  .mh { display: flex; align-items: center; gap: 5px; min-width: 0; }
  .mh > span { display: grid; font-size: var(--fs-s); line-height: 1.15; min-width: 0; white-space: nowrap; }
  .mh small { font-size: var(--fs-xs); color: var(--text-soft); }
  .mh :global(img), .scale { flex: none; }
  .scale { width: 18px; height: 18px; color: var(--text-soft); }
  td { text-align: right; font-size: var(--fs-s); padding: 5px 2px; white-space: nowrap; }
  td.cur { font-size: var(--fs-body); }
  td.soft { color: var(--text-soft); }
  .foot { margin: 0 2px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); line-height: var(--lh); }
</style>
