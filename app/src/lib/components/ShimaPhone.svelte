<script lang="ts">
  // しまフォン launcher (v5 §4): a NookPhone-screen sheet with a status row (time · leaf · デモ in demo),
  // the title and a 3-column grid of squircle app tiles: official NookPhone tiles (passport, rescue) or
  // official glyphs on our tile colours. Each app slides in from the right inside the phone, with a ‹ back.
  // Apps: help, villager (+ name), language, sync. (No privacy settings: both players see everything; no alerts.)
  import { tick as nextTick, untrack } from 'svelte';
  import Sheet from './Sheet.svelte';
  import OfficialArt from './OfficialArt.svelte';
  import LeafCoin from './LeafCoin.svelte';
  import HelpApp from './phone/HelpApp.svelte';
  import VillagerApp from './phone/VillagerApp.svelte';
  import LangApp from './phone/LangApp.svelte';
  import SyncApp from './phone/SyncApp.svelte';
  import type { KirokuEntry } from './kiroku/Kiroku.svelte';
  import { week } from '#lib/client/week.svelte.ts';
  import { ui } from '#lib/client/ui.svelte.ts';
  import { toasts } from '#lib/client/toast.svelte.ts';
  import { minuteNow } from './motion/clock.ts';
  import { clockTime } from '#lib/i18n/format.ts';
  import { t } from '#lib/i18n/index.ts';

  type AppId = 'kiroku' | 'help' | 'villager' | 'lang' | 'sync';
  let { open = $bindable() }: { open: boolean } = $props();

  // `tile`: a full official NookPhone tile. Otherwise `glyph` (official) sits on our `fill`.
  const APPS: { id: AppId; tile?: string; glyph?: string; fill?: string }[] = [
    // NH's Nook Miles app is the "what you did" log with stamp cards: きろく sits on its tile, first.
    { id: 'kiroku', tile: 'phone/miles' },
    { id: 'help', glyph: 'phone/glyph-help', fill: 'var(--c-yuzu)' },
    { id: 'villager', tile: 'phone/passport' },
    { id: 'lang', glyph: 'phone/glyph-chat', fill: 'var(--c-mint)' },
    { id: 'sync', tile: 'phone/rescue' }
  ];

  let app = $state<AppId | null>(null);
  /** きろく is loaded the first time it opens, so the island doesn't pay for it up front (round 7 L1). */
  let kirokuMod: Promise<typeof import('./kiroku/Kiroku.svelte')> | null = null;
  const loadKiroku = () => (kirokuMod ??= import('./kiroku/Kiroku.svelte'));
  let kiroku: { back: () => boolean } | undefined = $state();
  let entry = $state<KirokuEntry | null>(null);

  const view = $derived(week.view);
  const title = $derived(app ? t(`phone.app.${app}`) : t('phone.name'));

  const clock = $derived(clockTime(minuteNow()));

  /** U15: もどる puts focus back on the app tile it came from. */
  async function back() {
    if (app === 'kiroku' && kiroku?.back()) return;
    const from = app;
    app = null;
    await nextTick();
    document.querySelector<HTMLElement>(`.app[data-app="${from}"]`)?.focus();
  }

  /** Closing the phone ends its banner too (round 7 F2), and the next open starts on the home screen. */
  function closed() {
    if (toasts.current) toasts.dismiss();
    app = null;
    entry = null;
  }

  // A shortcut (score ribbon, jar total) opens straight into きろく.
  $effect(() => {
    const e = ui.phoneEntry;
    if (!open || !e) return;
    untrack(() => {
      entry = { ...e };
      app = 'kiroku';
      ui.phoneEntry = null;
    });
  });
</script>

<Sheet bind:open label={t('phone.name')} variant="phone" onclose={closed}>
  <div class="status" aria-hidden="true">
    <span class="money">{clock}</span>
    <LeafCoin kind="leaf" size={16} />
    <span class="demo-wrap">{#if week.demo}<span class="demo">{t('demo.badge')}</span>{/if}</span>
  </div>

  <div class="titlebar">
    {#if app}
      <button type="button" class="back icon-btn" aria-label={t('common.back')} onclick={back}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-back" /></svg>
      </button>
    {/if}
    <h2>{title}</h2>
    <!-- U12: a visible 44px close on the phone, not only the grabber -->
    <button type="button" class="close icon-btn" aria-label={t('common.close')} onclick={() => (open = false)}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-close" /></svg>
    </button>
  </div>

  {#if !app}
    <div class="grid">
      {#each APPS as a, i (a.id)}
        <button type="button" class="app" data-app={a.id} style:animation-delay="{i * 40}ms" onclick={() => (app = a.id)}>
          <span class="tile" class:full={!!a.tile} style:--fill={a.fill ?? 'var(--c-mint)'}>
            <OfficialArt key={a.tile ?? a.glyph} size={a.tile ? '100%' : '69%'} eager>
              {#snippet fallback()}<span class="fb"></span>{/snippet}
            </OfficialArt>
          </span>
          <span class="lbl">{t(`phone.app.${a.id}`)}</span>
        </button>
      {/each}
    </div>
  {:else}
    <div class="page">
      {#if app === 'kiroku'}
        {#await loadKiroku() then { default: Kiroku }}<Kiroku bind:this={kiroku} {entry} />{/await}
      {:else if app === 'help' && view}
        <HelpApp {view} />
      {:else if app === 'villager' && view}
        <VillagerApp {view} />
      {:else if app === 'lang'}
        <LangApp />
      {:else if app === 'sync' && view}
        <SyncApp {view} />
      {/if}
    </div>
  {/if}
</Sheet>

<style>
  .status {
    display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; margin: -4px 4px 4px;
    font: 700 var(--fs-body)/1 var(--font-num); color: var(--text);
  }
  .demo-wrap { justify-self: end; }
  .demo { background: var(--c-yuzu); color: var(--c-ink); border-radius: var(--r-chip); padding: 4px 8px; font: 700 var(--fs-s)/1 var(--font-ui); }
  .titlebar { position: relative; display: flex; justify-content: center; align-items: center; min-height: 48px; margin-bottom: 14px; }
  .titlebar h2 { font-size: var(--fs-title); text-align: center; }
  .back { position: absolute; left: 0; top: 2px; }
  .back svg { width: 22px; height: 22px; }
  .close { position: absolute; right: 0; top: 2px; }
  .close svg { width: 20px; height: 20px; }
  .titlebar h2 { padding: 0 48px; }

  .grid {
    display: grid; grid-template-columns: repeat(3, minmax(var(--tile), 1fr)); justify-items: center;
    gap: calc(var(--tile-gap) + 4px) var(--tile-gap); padding: 10px 0 18px;
  }
  .app {
    appearance: none; background: none; border: 0; padding: 0; cursor: pointer; display: grid; justify-items: center; gap: 8px;
    min-width: var(--tile); animation: if-pop var(--dur-pop) var(--ease-bounce) both; border-radius: var(--r-btn); color: var(--text);
  }
  .tile {
    width: var(--tile); height: var(--tile); border-radius: var(--r-tile); background: var(--fill); display: grid; place-items: center; overflow: hidden;
    box-shadow: 0 4px 0 color-mix(in srgb, var(--fill) 85%, #000 15%);
    transition: transform var(--dur-base) var(--ease-bounce);
  }
  /* Official full tiles bring their own squircle and colour. */
  .tile.full { background: none; box-shadow: none; filter: drop-shadow(0 4px 0 rgba(74, 58, 44, .2)); }
  .fb { width: 50%; height: 50%; border-radius: 30%; background: rgba(255, 255, 255, .6); }
  .app:active .tile { transform: translateY(2px) scale(1.08, .9); transition-duration: var(--dur-tap); }
  .lbl { font: 700 var(--fs-s)/1.1 var(--font-ui); white-space: nowrap; }

  .page { display: grid; gap: 14px; animation: slide var(--dur-base) var(--ease-soft); }
  @keyframes slide { from { opacity: 0; transform: translateX(40%); } to { opacity: 1; transform: none; } }

  /* Rows shared by the ことば and 通信 apps. */
  .page :global(.prows) { display: grid; gap: 10px; }
  .page :global(.prow) {
    appearance: none; cursor: pointer; display: flex; align-items: center; gap: 12px; min-height: 60px; padding: 8px 16px;
    border-radius: var(--r-card); border: 0; background: var(--surface); color: var(--text);
    box-shadow: var(--sh-lip); text-align: left; width: 100%; font: inherit;
  }
  .page :global(.prow:not(.static):active) { transform: translateY(2px); box-shadow: 0 1px 0 var(--lip); }
  .page :global(.prow.static) { cursor: default; }
  .page :global(.prl) { flex: 1; min-width: 0; font-weight: 700; font-size: var(--fs-body); word-break: auto-phrase; text-wrap: balance; line-height: 1.3; }
</style>
