<script lang="ts">
  // 畑 (docs/farming.md "Playing"): my plants by where they are (収穫できる, 育成中 with the days left, 空き区画), today's
  // harvest and what it fetches, my plants against the cap, the partner's and the guest's folded, the rule and where
  // the starts are sold. Kanji (a sheet's copy). Read-only: a plot's tap on the island does the farming.
  import '#lib/i18n/catch.ts'; // the crops' names (their own catalog, out of the island's first load)
  import Sheet from '../ui/Sheet.svelte';
  import NavBar from '../ui/NavBar.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { FARM, cropKey, plantsOf, stageOf, yieldOf, type Plot } from '#lib/contract/farm.ts';
  import { sellPrice } from '#lib/contract/shop.ts';
  import { dayNum } from '#lib/contract/tokyo.ts';
  import { layoutPlots } from '#lib/layout/field.ts';
  import { layout as layoutStore } from '#lib/store/layout.svelte.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { site } from '../island/site.svelte.ts';
  import { farmToday } from '../island/farm.ts';
  import { islandDay } from '../island/ambientClock.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';
  import type { Who } from '#lib/types.ts';

  let { open = $bindable() }: { open: boolean } = $props();

  const m = $derived(week.model);
  const date = $derived(week.view?.today ?? islandDay());
  const names = $derived<Record<Who, string>>({ A: week.view?.people.A.villagerName ?? 'A', B: week.view?.people.B.villagerName ?? 'B', G: week.view?.guest.villagerName ?? 'G' });
  const view = $derived.by(() => {
    if (!m) return null;
    const { farm, watered } = farmToday(m.state, date);
    const rows = (who: Who) => [...farm.plots].filter(([, pl]) => pl.who === who).map(([p, pl]) => row(p, pl, watered)).sort((a, b) => a.left - b.left || a.c.localeCompare(b.c));
    const plots = layoutPlots(site.layout ?? layoutStore.current);
    const empty = plots.filter((x) => x.who === m.me && !farm.plots.has(x.p)).length;
    return { mine: rows(m.me), others: (['A', 'B', 'G'] as const).filter((w) => w !== m.me).map((w) => ({ who: w, rows: rows(w) })).filter((o) => o.rows.length), empty, n: plantsOf(farm, m.me) };
  });
  function row(p: string, pl: Plot, watered: (p: string, d: string) => boolean) {
    const left = Math.max(0, dayNum(pl.from) - dayNum(date));
    return { p, c: pl.c, left, ripe: stageOf(pl, date) === 3, wet: watered(p, date), n: yieldOf(p, pl, watered) };
  }
  const ripe = $derived(view?.mine.filter((r) => r.ripe) ?? []);
  const growing = $derived(view?.mine.filter((r) => !r.ripe) ?? []);
  const harvestN = $derived(ripe.reduce((a, r) => a + r.n, 0));
  const harvestV = $derived(ripe.reduce((a, r) => a + r.n * (sellPrice(cropKey(r.c)) ?? 0), 0));
  const crop = (c: string) => t(`beach.name.${c}`);
</script>

<Sheet bind:open tunes label={t('farm.title')} variant="pop">
  <div class="titlebar"><NavBar title={t('farm.title')} onclose={() => (open = false)} sfx="self" /></div>
  <div class="fs-body" data-farm-sheet>
    {#if view}
      <section class="card sum">
        <p data-farm-today>{t('farm.today', { n: ripe.length, max: harvestN, shells: formatNum(harvestV) })}</p>
        <p class="cap" data-farm-count>{t('farm.count', { n: view.n, cap: FARM.cap })}</p>
      </section>
      {#each [{ k: 'ripe', rows: ripe }, { k: 'growing', rows: growing }] as g (g.k)}
        {#if g.rows.length}
          <h3 class="h">{t(`farm.${g.k}`)}</h3>
          <ul class="list" data-farm-group={g.k}>
            {#each g.rows as r (r.p)}
              <li class="row" data-farm-row={r.p} data-wet={r.wet || undefined}>
                <OfficialArt key="finds/{r.c}" size={30} />
                <span class="nm">{crop(r.c)}</span>
                <span class="meta">
                  {#if !r.ripe}<span>{t('farm.left', { n: r.left })}</span>{/if}
                  {#if r.wet}<span class="wet">{t('farm.watered')}</span>{/if}
                  <span>{t(r.ripe ? 'farm.yield' : 'farm.expect', { n: r.n })}</span>
                </span>
              </li>
            {/each}
          </ul>
        {/if}
      {/each}
      <h3 class="h">{t('farm.empty')}</h3>
      <p class="note" data-farm-empty>{view.empty ? t('farm.emptyN', { n: view.empty }) : t('farm.noField')}</p>
      {#each view.others as o (o.who)}
        <details class="others">
          <summary>{t('farm.whose', { who: names[o.who], n: o.rows.length })}</summary>
          <ul class="list">
            {#each o.rows as r (r.p)}
              <li class="row" data-farm-row={r.p} data-wet={r.wet || undefined}><OfficialArt key="finds/{r.c}" size={26} /><span class="nm">{crop(r.c)}</span><span class="meta">{#if r.ripe}{t('farm.ripe')}{:else}{t('farm.left', { n: r.left })}{/if}{#if r.wet}<span class="wet">{t('farm.watered')}</span>{/if}</span></li>
            {/each}
          </ul>
        </details>
      {/each}
      <p class="note">{t('farm.rule')}</p>
      <p class="note">{t('farm.shop')}</p>
    {/if}
  </div>
</Sheet>

<style>
  .fs-body { flex: 1; min-height: 0; overflow: hidden auto; overscroll-behavior: contain; margin: 0 -8px; padding: 6px 8px var(--body-pad); display: grid; gap: 10px; align-content: start; }
  .card { padding: 12px 14px; border-radius: var(--r-card, 18px); background: var(--card); color: var(--text); }
  .sum p { margin: 0; font: 700 var(--fs-body)/1.5 var(--font-ui); }
  .sum .cap { font-weight: 600; color: var(--text-soft); }
  .h { margin: 6px 2px 0; font: 700 var(--fs-s)/1.3 var(--font-ui); }
  .list { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
  .row { display: flex; align-items: center; gap: 10px; padding: 6px 10px; border-radius: 12px; background: var(--card); color: var(--text); line-height: 0; }
  .nm { font: 700 var(--fs-body)/1.2 var(--font-ui); }
  .meta { margin-left: auto; display: flex; gap: 8px; font: 600 var(--fs-s)/1.2 var(--font-ui); }
  .wet { color: var(--text-soft); }
  .note { margin: 0 2px; font: 500 var(--fs-s)/1.5 var(--font-ui); }
  .others summary { cursor: pointer; font: 700 var(--fs-s)/2 var(--font-ui); }
</style>
