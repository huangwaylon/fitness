<script lang="ts">
  // The farm menu (docs/farming.md "Playing"): a round cream disc at the island's bottom left, the say button's
  // mirror, NH's seed bag in it. A tap unfolds two cream pills upward, left-aligned (the disc turns yuzu):
  // 「たね」 with what I plant next and how many (the picker, FarmPicker: a pick kept on this phone and worn on the
  // disc) and 「はたけ」 (the 畑 sheet). It folds as the leaf menu does:
  // a second tap, a tap anywhere else, Esc, a pick, a sheet opening. IslandScene places and hides it with the say button.
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { seedKey } from '#lib/contract/farm.ts';
  import { shopView } from '#lib/model/shop.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { seed } from '#lib/store/farm.svelte.ts';
  import { ui } from '#lib/ui-state/ui.svelte.ts';
  import { sheetTap } from '#lib/ui-state/sheetTiming.ts';
  import { react } from '../motion/director.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import { closePicker, farmUi, openPicker } from './farmUi.svelte.ts';
  import { farmSheet } from '../farm/open.svelte.ts';
  import FarmPicker from './FarmPicker.svelte';

  let open = $state(false);
  let root: HTMLElement | undefined = $state();
  let toggleEl: HTMLButtonElement | undefined = $state();

  const pocket = $derived(week.model ? shopView(week.model.state, week.model.me).pocket : new Map<string, number>());
  /** What I hold to plant next (its crop's own art: the starts' seedling is one for all six). */
  const picked = $derived(seed.pick ? { ...seed.pick, n: pocket.get(seedKey(seed.pick.c, seed.pick.src)) ?? 0 } : null);
  // a sheet opening folds it
  $effect(() => {
    if (ui.sheets.length) open = false;
  });
  // open: a tap outside folds it (capture: the tap itself goes on), Esc too
  $effect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => {
      if (!(e.target instanceof Node) || !root?.contains(e.target)) open = false;
    };
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      open = false;
      toggleEl?.focus({ preventScroll: true });
    };
    document.addEventListener('pointerdown', down, true);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('pointerdown', down, true);
      document.removeEventListener('keydown', key);
    };
  });

  function choose(go: () => void) {
    react('R18');
    open = false;
    go();
  }
</script>

<div class="farm-menu" class:open bind:this={root}>
  {#if farmUi.picker}<FarmPicker />{/if}
  <div class="items" role="group" aria-label={t('world.farm.open')} inert={!open}>
    <button type="button" class="item" data-farm-seed data-sfx="open" aria-haspopup="dialog" onclick={() => choose(() => openPicker())}>
      <span class="ic">{#if picked}<OfficialArt key="finds/{picked.c}" size={28} />{:else}<OfficialArt key="finds/seed-bag" size={28} />{/if}</span>
      <span class="lbl">{t('world.farm.seed')}</span>
      {#if picked}<b class="n" data-farm-seed-n>{picked.n}</b>{/if}
    </button>
    <button type="button" class="item" data-farm-field aria-haspopup="dialog" data-sfx="self" onpointerdown={() => void farmSheet.prefetch()} onclick={() => choose(() => (sheetTap(), farmSheet.show()))}>
      <span class="ic"><OfficialArt key="finds/tomato" size={28} /></span>
      <span class="lbl">{t('world.farm.field')}</span>
    </button>
  </div>
  <button type="button" class="toggle" bind:this={toggleEl} aria-label={t('world.farm.open')} aria-expanded={open} data-farm-open
    data-sfx={open ? 'toggle-off' : 'toggle-on'} onclick={() => { open = !open; closePicker(); }}>
    <span class="bag"><OfficialArt key={picked?.n ? `finds/${picked.c}` : 'finds/seed-bag'} size={24} eager /></span>
  </button>
</div>

<style>
  /* the disc: the say button's mirror (44 px to the thumb, 36 px drawn, the cream lip); open, NH's yellow */
  .farm-menu { position: relative; width: var(--hit, 44px); height: var(--hit, 44px); }
  .toggle {
    appearance: none; border: 0; margin: 0; padding: 0; width: var(--hit, 44px); height: var(--hit, 44px); display: grid; place-items: center;
    background: none; cursor: pointer; position: relative; -webkit-tap-highlight-color: transparent; touch-action: manipulation;
  }
  .toggle::before {
    content: ''; position: absolute; left: 4px; top: 4px; width: 36px; height: 36px; border-radius: 50%;
    background: color-mix(in srgb, var(--c-cream, #FFF9E3) 90%, transparent); box-shadow: 0 3px 0 rgba(150, 110, 70, .28), 0 2px 8px rgba(60, 40, 20, .12);
    transition: background-color 180ms, translate .12s;
  }
  .open .toggle::before { background: var(--c-yuzu); box-shadow: 0 3px 0 var(--c-yuzu-lip); }
  .toggle:active::before { translate: 0 2px; }
  .toggle:focus-visible { outline: none; }
  .toggle:focus-visible::before { outline: 3px solid var(--focus); outline-offset: 2px; }
  .bag { position: relative; line-height: 0; pointer-events: none; }

  /* the pills: a column standing on the disc, left-aligned to its left edge; folded, hidden and inert */
  .items { position: absolute; left: 0; bottom: calc(100% + 10px); display: grid; gap: 10px; width: max-content; pointer-events: none; }
  .item {
    display: flex; align-items: center; gap: 8px; height: var(--hit, 44px); margin: 0; padding: 0 14px 0 6px;
    appearance: none; border: 0; border-radius: var(--r-pill); cursor: pointer; white-space: nowrap;
    background: var(--c-cream); color: var(--c-ink); box-shadow: 0 var(--lip-h) 0 var(--c-lip), 0 6px 14px rgb(60 40 20 / .14);
    font: 700 var(--fs-body)/1 var(--font-ui); -webkit-tap-highlight-color: transparent; touch-action: manipulation;
    opacity: 0; visibility: hidden; transform: scale(0); transition: opacity 100ms linear, visibility 0s linear 100ms, transform 0s linear 100ms;
  }
  .open .item { opacity: 1; visibility: visible; transform: none; pointer-events: auto; transition: none; }
  .open .item:active { transform: translateY(2px) scale(.97); box-shadow: 0 2px 0 var(--c-lip); }
  .item:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .ic { flex: none; width: 32px; height: 32px; display: grid; place-items: center; line-height: 0; }
  .n { font: 700 var(--fs-s)/1 var(--font-num); font-variant-numeric: tabular-nums; }

</style>
