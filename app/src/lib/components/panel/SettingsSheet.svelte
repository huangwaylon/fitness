<script lang="ts">
  // せってい (docs/design.md "Settings"): the HUD's menu's せってい button opens it, full height like the island panel,
  // grown out of the button (Sheet's `pop`, as けんこう out of the dumbbell). One scroller: むらびと (かえる → the
  // picker), サウンド, ことば, きせつ (the seasonal preview), てんき (the island's: real or the game's), フレームレート, つうしん (not
  // the guest's), もようがえ (one row: はじめる; not
  // the guest's) and あそびかた (くわしく → the guide).
  // The picker and the guide push a level with ‹; ✕, the backdrop and Esc close it, and the next opening starts at
  // its top.
  import { tick } from 'svelte';
  import Sheet from '../ui/Sheet.svelte';
  import NavBar from '../ui/NavBar.svelte';
  import Avatar from '../characters/Avatar.svelte';
  import VillagerPicker from './VillagerPicker.svelte';
  import HelpGuide from './HelpGuide.svelte';
  import SoundSection from './SoundSection.svelte';
  import LangSection from './LangSection.svelte';
  import SeasonSection from './SeasonSection.svelte';
  import WeatherSection from './WeatherSection.svelte';
  import FpsSection from './FpsSection.svelte';
  import SyncSection from './SyncSection.svelte';
  import { ui } from '#lib/ui-state/ui.svelte.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { resolveLook } from '#lib/villagers/look.ts';
  import { ROSTER } from '#lib/villagers/roster.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { isGuest, mine } from '#lib/ui-state/viewer.ts';

  let { open = $bindable() }: { open: boolean } = $props();

  /** A level of its own: the villager picker or the full guide. */
  let push = $state<'villager' | 'help' | null>(null);
  let body: HTMLElement | undefined = $state();
  let savedTop = 0;

  const view = $derived(week.view);
  const title = $derived(push ? t(`panel.${push}`) : t('island.settings'));
  /** This phone's villager (the guest's own on the guest's phone). */
  const me = $derived(view ? mine(view) : null);
  const myLook = $derived(me ? resolveLook({ villager: me.villager, person: me.who }).id : null);
  /** The guest's phone (docs/design.md "The guest"): no もようがえ, no つうしん. */
  const guest = $derived(isGuest(view));

  async function go(to: 'villager' | 'help') {
    savedTop = body?.scrollTop ?? 0;
    push = to;
    await tick();
    body?.scrollTo({ top: 0 });
  }

  /** ‹: back to the list, where it was scrolled to, focus on the row it came from. */
  async function back() {
    cue('back');
    const from = push;
    push = null;
    await tick();
    body?.scrollTo({ top: savedTop });
    document.querySelector<HTMLElement>(`[data-push="${from}"]`)?.focus({ preventScroll: true });
  }

  /** Closing ends its banner too, and the next open starts at the top. */
  function closed() {
    if (toasts.current) toasts.dismiss();
    push = null;
  }

  // Its open and close tunes (it mounts on the first tap, already open: that is an open too).
  let wasOpen = false;
  $effect(() => {
    const o = open;
    if (o === wasOpen) return;
    wasOpen = o;
    cue(o ? 'panel-open' : 'panel-close');
  });
</script>

<Sheet bind:open label={t('island.settings')} variant="pop" onclose={closed}>
  <div class="titlebar"><NavBar {title} onback={push ? back : null} onclose={() => (open = false)} sfx="self" /></div>
  <div class="panel-body" class:fill={push === 'villager'} data-settings bind:this={body}>
    {#if push === 'villager' && view}
      <div class="page"><VillagerPicker {view} /></div>
    {:else if push === 'help' && view}
      <div class="page"><HelpGuide {view} /></div>
    {:else if view && me}
      <section class="sec" aria-labelledby="sec-villager">
        <h2 id="sec-villager" class="sec-label">{t('panel.villager')}</h2>
        <div class="prow static me">
          <Avatar person={me.who} villager={me.villager} size={48} />
          <span class="prl">{me.villagerName}{#if myLook}<small>{i18n.locale === 'ja' ? ROSTER[myLook].nameJa : ROSTER[myLook].nameEn}</small>{/if}</span>
          <button type="button" class="btn small paper" data-push="villager" data-sfx="page" onclick={() => go('villager')}>{t('panel.change')}</button>
        </div>
        {#if guest}<p class="guest" data-guest-note>{t('guest.note')}</p>{/if}
      </section>
      <section class="sec" aria-labelledby="sec-sound"><h2 id="sec-sound" class="sec-label">{t('panel.sound')}</h2><SoundSection /></section>
      <section class="sec" aria-labelledby="sec-lang"><h2 id="sec-lang" class="sec-label">{t('panel.lang')}</h2><LangSection /></section>
      <section class="sec" aria-labelledby="sec-season"><h2 id="sec-season" class="sec-label">{t('panel.season')}</h2><SeasonSection {view} /></section>
      <section class="sec" aria-labelledby="sec-weather" data-weather-section><h2 id="sec-weather" class="sec-label">{t('panel.weather')}</h2><WeatherSection {guest} /></section>
      <section class="sec" aria-labelledby="sec-fps"><h2 id="sec-fps" class="sec-label">{t('panel.fps')}</h2><FpsSection /></section>
      {#if !guest}<section class="sec" aria-labelledby="sec-sync"><h2 id="sec-sync" class="sec-label">{t('panel.sync')}</h2><SyncSection {view} /></section>{/if}
      {#if !guest}
        <div class="prow static decor">
          <span class="prl">{t('panel.decor')}</span>
          <button type="button" class="btn small paper" data-decor-start data-sfx="open" onclick={() => ((ui.decorating = true), (open = false))}>{t('panel.decorStart')}</button>
        </div>
      {/if}
      <section class="sec" aria-labelledby="sec-help">
        <h2 id="sec-help" class="sec-label">{t('panel.help')}</h2>
        <div class="card help">
          <p>{t('panel.helpSummary')}</p>
          <button type="button" class="btn small paper" data-push="help" data-sfx="page" onclick={() => go('help')}>{t('panel.more')}</button>
        </div>
      </section>
      {#if week.demo}<span class="demo">{t('demo.badge')}</span>{/if}
    {/if}
  </div>
</Sheet>

<style>
  .titlebar { flex: none; position: relative; z-index: 2; margin-bottom: 4px; }
  /* rows scrolling up fade out under the title bar instead of being cut at a hard edge */
  .titlebar::after {
    content: ''; position: absolute; left: -8px; right: -8px; top: 100%; height: 14px; pointer-events: none;
    background: linear-gradient(var(--surface), transparent);
  }
  /* The one scroller. It bleeds 8px past the side padding so focus rings and lips are not clipped by its overflow. */
  .panel-body {
    flex: 1; min-height: 0; overflow: hidden auto; overscroll-behavior: contain;
    margin: 0 -8px; padding: 6px 8px var(--body-pad); display: flex; flex-direction: column; gap: 14px;
  }
  .panel-body > :global(*) { flex: none; }
  /* the villager picker pins its head and scrolls its own grid (to the bottom edge): the body holds still */
  .panel-body.fill { overflow: hidden; padding-bottom: 0; }
  .panel-body.fill > .page { flex: 1; min-height: 0; }
  /* a pushed level slides in from the right (design.md "Navigation") */
  .page { display: flex; flex-direction: column; gap: 14px; animation: slide 240ms cubic-bezier(.2, .8, .2, 1); }
  @keyframes slide { from { opacity: 0; transform: translateX(24%); } to { opacity: 1; transform: none; } }

  /* one section per topic: a small heading over its rows */
  .sec { display: grid; gap: 8px; }
  .me .prl small { display: block; margin-top: 2px; font-size: var(--fs-s); color: var(--text-soft); }
  .me .btn, .decor .btn { flex: none; }
  .help { display: grid; gap: 10px; padding: 14px 16px; }
  .help p { margin: 0; font-weight: 700; line-height: 1.5; }
  .help .btn { justify-self: end; }
  .guest { margin: 6px 4px 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); line-height: var(--lh); }
  .demo { align-self: center; background: var(--c-yuzu); color: var(--c-ink); border-radius: var(--r-chip); padding: 4px 10px; font: 700 var(--fs-s)/1 var(--font-ui); }

  /* Rows shared by the sections (ことば, つうしん, サウンド, むらびと). */
  .panel-body :global(.prows) { display: grid; gap: 10px; }
  .panel-body :global(.prow) {
    appearance: none; cursor: pointer; display: flex; align-items: center; gap: 12px; min-height: 60px; padding: 8px 16px;
    border-radius: var(--r-card); border: 0; background: var(--ctl); color: var(--text);
    box-shadow: var(--sh-ctl); text-align: left; width: 100%; font: inherit;
  }
  .panel-body :global(.prow:not(.static):active) { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  /* a static row is information, not a control: the soft card lip, no edge */
  .panel-body :global(.prow.static) { box-shadow: var(--sh-lip); background: var(--card); cursor: default; }
  /* the chosen row: NH's yellow highlight */
  .panel-body :global(.prow[aria-checked='true']) { background: var(--ctl-sel); color: var(--c-ink); }
  .panel-body :global(.prl) { flex: 1; min-width: 0; font-weight: 700; font-size: var(--fs-body); text-wrap: balance; line-height: 1.3; }
</style>
