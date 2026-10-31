<script lang="ts">
  // しまフォン launcher: a NookPhone-screen sheet: the title bar and a 3-column grid of squircle app tiles: official NookPhone tiles (passport, rescue) or
  // official glyphs on our tile colours. Each app slides in from the right inside the phone, with a ‹ back.
  // The title bar stays put; only `.phone-body` (home grid or the app) scrolls.
  // Apps: help, villager (+ name), language, sync, sound. (No privacy settings: both players see everything; no alerts.)
  // Sounds (docs/design.md "Cues"): the phone opens and closes with its own little tune, an app opens with a pop,
  // ‹ back is the cancel tone.
  import { tick as nextTick, untrack } from 'svelte';
  import Sheet from '../ui/Sheet.svelte';
  import NavBar from '../ui/NavBar.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import type { KirokuEntry } from '../kiroku/Kiroku.svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { ui } from '#lib/ui-state/ui.svelte.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { lazy } from '#lib/ui-state/reload.ts';
  import { t } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';

  type AppId = 'kiroku' | 'help' | 'villager' | 'lang' | 'sync' | 'sound';
  let { open = $bindable() }: { open: boolean } = $props();

  // `tile`: a full official NookPhone tile (`fill` = its own background). Otherwise `glyph` (official) sits on our `fill`.
  const APPS: { id: AppId; tile?: string; glyph?: string; fill?: string }[] = [
    // NH's Nook Miles app is the "what you did" log with stamp cards: きろく sits on its tile, first.
    { id: 'kiroku', tile: 'phone/miles', fill: '#8B97EB' },
    { id: 'help', glyph: 'phone/glyph-help', fill: 'var(--c-yuzu)' },
    { id: 'villager', tile: 'phone/passport', fill: '#76D787' },
    { id: 'lang', glyph: 'phone/glyph-chat', fill: 'var(--c-mint)' },
    { id: 'sync', tile: 'phone/rescue', fill: '#FD5967' },
    // NH has no sound settings on its phone (only the console's volume): our own note glyph on a leaf tile
    { id: 'sound', glyph: 'i-note', fill: 'var(--c-leaf)' }
  ];

  let app = $state<AppId | null>(null);
  /** Every app is its own chunk, loaded the first time it opens, so the island doesn't pay for them up front. */
  const LOAD = {
    kiroku: lazy(() => import('../kiroku/Kiroku.svelte')),
    help: lazy(() => import('./HelpApp.svelte')),
    villager: lazy(() => import('./VillagerApp.svelte')),
    lang: lazy(() => import('./LangApp.svelte')),
    sync: lazy(() => import('./SyncApp.svelte')),
    sound: lazy(() => import('./SoundApp.svelte'))
  };
  let kiroku: { back: () => boolean } | undefined = $state();
  let entry = $state<KirokuEntry | null>(null);

  const view = $derived(week.view);
  const title = $derived(app ? t(`phone.app.${app}`) : t('phone.name'));

  /** もどる puts focus back on the app tile it came from. */
  async function back() {
    cue('back');
    if (app === 'kiroku' && kiroku?.back()) return;
    const from = app;
    app = null;
    await nextTick();
    document.querySelector<HTMLElement>(`.app[data-app="${from}"]`)?.focus();
  }

  /** Closing the phone ends its banner too, and the next open starts on the home screen. */
  function closed() {
    if (toasts.current) toasts.dismiss();
    app = null;
    entry = null;
  }

  // The phone's open and close tunes (not on the first render).
  let wasOpen = untrack(() => open);
  $effect(() => {
    const o = open;
    if (o === wasOpen) return;
    wasOpen = o;
    cue(o ? 'phone-open' : 'phone-close');
  });

  /** Open an app (a pop, as NH's app icons do). */
  function launch(id: AppId) {
    cue('phone-app');
    app = id;
  }

  // A shortcut (today's ベル ribbon, jar total) opens straight into きろく.
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

{#snippet fail()}<p class="fail" role="status">{t('state.error')}</p>{/snippet}

<Sheet bind:open label={t('phone.name')} variant="phone" onclose={closed}>
  <!-- the one title bar: ‹ back to the previous level (an app → home, a きろく level → the one above), ✕ closes the phone -->
  <div class="titlebar"><NavBar {title} onback={app ? back : null} onclose={() => (open = false)} sfx="self" /></div>

  <div class="phone-body">
  {#if !app}
    <div class="grid">
      {#each APPS as a, i (a.id)}
        <button type="button" class="app" data-app={a.id} data-sfx="self" style:animation-delay="{i * 40}ms" onclick={() => launch(a.id)}>
          <span class="tile" class:full={!!a.tile} style:--fill={a.fill ?? 'var(--c-mint)'}>
            {#if a.glyph?.startsWith('i-')}
              <svg class="own" viewBox="0 0 24 24" aria-hidden="true"><use href="#{a.glyph}" /></svg>
            {:else}
              <OfficialArt key={a.tile ?? a.glyph} size={a.tile ? 'calc(var(--tile) * 1.04)' : 'calc(var(--tile) * .69)'} eager>
                {#snippet fallback()}<span class="fb"></span>{/snippet}
              </OfficialArt>
            {/if}
          </span>
          <span class="lbl">{t(`phone.app.${a.id}`)}</span>
        </button>
      {/each}
    </div>
    {#if week.demo}<span class="demo">{t('demo.badge')}</span>{/if}
  {:else}
    <div class="page">
      {#if app === 'kiroku'}
        {#await LOAD.kiroku() then { default: Kiroku }}<Kiroku bind:this={kiroku} {entry} />{:catch}{@render fail()}{/await}
      {:else if app === 'help' && view}
        {#await LOAD.help() then { default: HelpApp }}<HelpApp {view} />{:catch}{@render fail()}{/await}
      {:else if app === 'villager' && view}
        {#await LOAD.villager() then { default: VillagerApp }}<VillagerApp {view} />{:catch}{@render fail()}{/await}
      {:else if app === 'lang'}
        {#await LOAD.lang() then { default: LangApp }}<LangApp />{:catch}{@render fail()}{/await}
      {:else if app === 'sync' && view}
        {#await LOAD.sync() then { default: SyncApp }}<SyncApp {view} />{:catch}{@render fail()}{/await}
      {:else if app === 'sound'}
        {#await LOAD.sound() then { default: SoundApp }}<SoundApp />{:catch}{@render fail()}{/await}
      {/if}
    </div>
  {/if}
  </div>
</Sheet>

<style>
  /* demo mode: a small yuzu chip under the home grid */
  .demo { align-self: center; background: var(--c-yuzu); color: var(--c-ink); border-radius: var(--r-chip); padding: 4px 10px; font: 700 var(--fs-s)/1 var(--font-ui); }
  .fail { margin: 24px 0; text-align: center; font-weight: 700; color: var(--text-soft); }
  .titlebar { flex: none; position: relative; z-index: 1; margin-bottom: 8px; }
  /* the paper sheet's fade under the title bar: rows scrolling up fade out instead of being cut at a hard edge;
     at the top it covers only the 14px gap above the first row */
  .titlebar::after {
    content: ''; position: absolute; left: -8px; right: -8px; top: 100%; height: 14px; pointer-events: none;
    background: linear-gradient(var(--surface), transparent);
  }

  /* Home: six tiles in two rows, centred a little above the middle of the phone (not in the top
     third of an empty screen); the row gap grows with the phone's height. */
  .grid {
    display: grid; grid-template-columns: repeat(3, minmax(var(--tile), 1fr)); justify-items: center;
    gap: clamp(calc(var(--tile-gap) + 4px), calc(5 * var(--vh1)), 48px) var(--tile-gap); padding: 10px 0 18px;
    margin: auto 0; translate: 0 -6%;
  }
  .app {
    appearance: none; background: none; border: 0; padding: 0; cursor: pointer; display: grid; justify-items: center; gap: 8px;
    min-width: var(--tile); animation: if-pop var(--dur-pop) var(--ease-bounce) both; border-radius: var(--r-btn); color: var(--text);
  }
  /* Every tile is the same squircle: its fill, the edge (2px outline + 4px lip in a darker
     shade of the fill) and the glyph inside. The official full tiles (きろく, 村人, つうしん) are drawn a touch larger
     than the squircle on their own background colour, so their baked-in rounded edges are cropped away. */
  .tile {
    --tile-edge: color-mix(in srgb, var(--fill) 68%, #4A3A2C);
    position: relative; width: var(--tile); height: var(--tile); border-radius: var(--r-tile); background: var(--fill);
    display: grid; place-items: center; overflow: hidden; box-shadow: 0 var(--lip-h) 0 var(--tile-edge);
    transition: transform var(--dur-base) var(--ease-bounce);
  }
  .tile::after { content: ''; position: absolute; inset: 0; border-radius: inherit; box-shadow: inset 0 0 0 2px var(--tile-edge); pointer-events: none; }
  .tile.full :global(.official) { max-width: none; flex: none; }
  .fb { width: 50%; height: 50%; border-radius: 30%; background: rgba(255, 255, 255, .6); }
  /* our own glyph (the sound tile): white like NH's app glyphs, with a soft drop */
  .own { width: 62%; height: 62%; color: #fff; filter: drop-shadow(0 2px 0 rgba(47, 138, 63, .45)); }
  .app:active .tile { transform: translateY(2px) scale(1.08, .9); transition-duration: var(--dur-tap); }
  .lbl { font: 700 clamp(var(--fs-s), calc(var(--tile) / 5.5), var(--fs-body))/1.1 var(--font-ui); white-space: nowrap; }

  /* The one scroller. It bleeds 8px past the phone's side padding so
     focus rings and lips are not clipped by its overflow. A screen that fills the phone (the NumberPad) is
     stretched to the body's height, so its keys sit at the bottom with no magic number. */
  .phone-body {
    flex: 1; min-height: 0; overflow: hidden auto; overscroll-behavior: contain;
    margin: 0 -8px; padding: 6px 8px var(--body-pad); display: flex; flex-direction: column;
  }
  .phone-body > * { flex: none; }
  .phone-body > .page:has(:global(.atm)) { flex: 1 0 auto; }
  .phone-body > .page:has(:global(.atm)) > :global(*) { flex: 1 0 auto; }
  /* the one push motion (design.md "Navigation"): the new level slides in from the right in 240ms */
  .page { display: flex; flex-direction: column; gap: 14px; animation: slide 240ms cubic-bezier(.2, .8, .2, 1); }
  @keyframes slide { from { opacity: 0; transform: translateX(24%); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) { .page { animation: none; } }

  /* Rows shared by the ことば and 通信 apps. */
  .page :global(.prows) { display: grid; gap: 10px; }
  .page :global(.prow) {
    appearance: none; cursor: pointer; display: flex; align-items: center; gap: 12px; min-height: 60px; padding: 8px 16px;
    border-radius: var(--r-card); border: 0; background: var(--ctl); color: var(--text);
    box-shadow: var(--sh-ctl); text-align: left; width: 100%; font: inherit;
  }
  .page :global(.prow:not(.static):active) { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  /* a static row is information, not a control: the soft card lip, no edge */
  .page :global(.prow.static) { box-shadow: var(--sh-lip); background: var(--card); }
  /* the chosen row: NH's yellow highlight */
  .page :global(.prow[aria-checked='true']) { background: var(--ctl-sel); color: var(--c-ink); }
  .page :global(.prow.static) { cursor: default; }
  .page :global(.prl) { flex: 1; min-width: 0; font-weight: 700; font-size: var(--fs-body); text-wrap: balance; line-height: 1.3; }
</style>
