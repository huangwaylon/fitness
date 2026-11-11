<script lang="ts">
  // The farm button (docs/farming.md "Playing"): a cream 「はたけ」 pill at the island's bottom left, the say button's
  // mirror, NH's seedling on it. One tap opens the 畑 sheet (its batch 収穫 / 水やり / 植える and the map). Two badges: what
  // I hold to plant (its crop's own art, top left: the pick kept on this phone, so a stale one shows) and my ripe
  // plants (yuzu, top right, when any). Shown while I have a plot or a plant stands on any field (one I can water);
  // IslandScene places and hides it with the say button.
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { seedKey } from '#lib/contract/farm.ts';
  import { layoutPlots } from '#lib/layout/field.ts';
  import { shopView } from '#lib/model/shop.ts';
  import { layout as layoutStore } from '#lib/store/layout.svelte.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { seed } from '#lib/store/farm.svelte.ts';
  import { sheetTap } from '#lib/ui-state/sheetTiming.ts';
  import { react } from '../motion/director.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import { farmSheet } from '../farm/open.svelte.ts';
  import { harvestOps } from '../farm/sheet.ts';
  import { site } from './site.svelte.ts';
  import { farmToday } from './farm.ts';
  import { islandDay } from './ambientClock.ts';

  const m = $derived(week.model);
  const date = $derived(week.view?.today ?? islandDay());
  const plots = $derived((void site.rev, layoutPlots(site.layout ?? layoutStore.current)));
  const today = $derived(m ? farmToday(m.state, date) : null);
  const shown = $derived(!!m && !!today && plots.some((p) => p.who === m.me || today.farm.plots.has(p.p)));
  /** My ripe plants (the sheet's 収穫's count). */
  const ripe = $derived(m && today ? harvestOps(today.farm, m.me, date, today.watered).length : 0);
  /** What I hold to plant, while I have any of it. */
  const held = $derived.by(() => {
    if (!m || !seed.pick) return null;
    return (shopView(m.state, m.me).pocket.get(seedKey(seed.pick.c, seed.pick.src)) ?? 0) > 0 ? seed.pick.c : null;
  });

  function open() {
    react('R18');
    sheetTap();
    farmSheet.show();
  }
</script>

{#if shown}
  <button type="button" class="farm-btn" data-farm-open data-sfx="self" aria-haspopup="dialog" aria-label={t('world.farm.open')}
    onpointerdown={() => void farmSheet.prefetch()} onclick={open}>
    <span class="ic"><OfficialArt key="finds/tomato-start" size={28} eager /></span>
    <span class="lbl" aria-hidden="true">{t('world.farm.field')}</span>
    {#if held}<span class="held" data-farm-held={held}><OfficialArt key="finds/{held}" size={18} /></span>{/if}
    {#if ripe}<b class="ripe" data-farm-ripe>{ripe}</b>{/if}
  </button>
{/if}

<style>
  /* the pill: 44 high to the thumb, the say button's cream and lip */
  .farm-btn {
    position: relative; display: flex; align-items: center; gap: 6px; height: var(--hit, 44px); margin: 0; padding: 0 14px 0 6px;
    appearance: none; border: 0; border-radius: var(--r-pill); cursor: pointer; white-space: nowrap;
    background: color-mix(in srgb, var(--c-cream, #FFF9E3) 92%, transparent); color: var(--c-ink);
    box-shadow: 0 var(--lip-h) 0 var(--c-lip), 0 4px 10px rgb(60 40 20 / .14);
    font: 700 var(--fs-body)/1 var(--font-ui); -webkit-tap-highlight-color: transparent; touch-action: manipulation;
  }
  .farm-btn:active { translate: 0 2px; box-shadow: 0 2px 0 var(--c-lip); }
  .farm-btn:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .ic { flex: none; width: 32px; height: 32px; display: grid; place-items: center; line-height: 0; }
  /* the badges on the pill's corners */
  .held {
    position: absolute; left: -4px; top: -8px; width: 24px; height: 24px; display: grid; place-items: center; line-height: 0;
    border-radius: 50%; background: var(--c-cream); box-shadow: 0 1px 3px rgb(60 40 20 / .25);
  }
  .ripe {
    position: absolute; right: -6px; top: -8px; min-width: 22px; height: 22px; padding: 0 6px; display: grid; place-items: center;
    border-radius: 11px; background: var(--c-yuzu); color: var(--c-ink); box-shadow: 0 1px 0 var(--c-yuzu-lip);
    font: 700 var(--fs-xs)/1 var(--font-num); font-variant-numeric: tabular-nums;
  }
</style>
