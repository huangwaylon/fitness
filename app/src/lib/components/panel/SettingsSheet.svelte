<script lang="ts">
  // せってい (docs/design.md "Settings"): the HUD's menu's せってい button opens it, full height like the island panel,
  // grown out of the button (Sheet's `pop`, as けんこう out of the dumbbell). One scroller: すがた (the look's portrait,
  // the よびな; かえる → the すがた level: the closet and the villagers, one dresser), プロフィール (せいべつ, たんじょうび, the BMI standard: ProfileSection), サウンド, ことば, きせつ (the seasonal preview), てんき (the island's: real or the game's), オフラインの地図 (the map areas saved: OfflineSection), えいご
  // ききとり (one row: あそぶ → ききみみ クイズ's sheet, its voice session started in the tap) and もようがえ (one row: はじめる);
  // the guest's the same (2026-11-06), with a line saying it's visiting.
  // Each pushes a level with ‹ (すがた's edits are sent as it's left, with a とりけす banner here);
  // ✕, the backdrop and Esc close it, and the next opening starts at its top.
  import { tick } from 'svelte';
  import Sheet from '../ui/Sheet.svelte';
  import NavBar from '../ui/NavBar.svelte';
  import LookPage from '../look/LookPage.svelte';
  import LookPortrait from '../look/LookPortrait.svelte';
  import SoundSection from './SoundSection.svelte';
  import LangSection from './LangSection.svelte';
  import SeasonSection from './SeasonSection.svelte';
  import WeatherSection from './WeatherSection.svelte';
  import ProfileSection from './ProfileSection.svelte';
  import OfflineSection from './OfflineSection.svelte';
  import { ui } from '#lib/ui-state/ui.svelte.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { resolveLook } from '#lib/villagers/look.ts';
  import { lookOf, mySavedLooks } from '#lib/store/look.ts';
  import { DEFAULT_LOOKS, playerOf, sameLook } from '#lib/contract/look.ts';
  import { ROSTER } from '#lib/villagers/roster.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { isGuest, mine } from '#lib/ui-state/viewer.ts';

  let { open = $bindable() }: { open: boolean } = $props();

  /** The levels pushed: すがた. */
  let stack = $state<'look'[]>([]);
  const push = $derived(stack.at(-1) ?? null);
  let body: HTMLElement | undefined = $state();
  let savedTop = 0;

  const view = $derived(week.view);
  const title = $derived(push ? t(`panel.${push}`) : t('title.settings'));
  /** This phone's villager (the guest's own on the guest's phone). */
  const me = $derived(view ? mine(view) : null);
  const myVillager = $derived(me ? resolveLook({ villager: me.villager, person: me.who }).id : null);
  /** The look worn (the row's portrait) and what it's called: the roster villager's name, いつもの, or the コーデ's. */
  const worn = $derived(me ? lookOf(me.who) : null);
  const wornName = $derived.by(() => {
    if (!me || !worn) return null;
    if (worn.kind === 'villager') return myVillager ? (i18n.locale === 'ja' ? ROSTER[myVillager].nameJa : ROSTER[myVillager].nameEn) : null;
    const p = playerOf(worn, me.who);
    if (me.who !== 'G' && sameLook(p, DEFAULT_LOOKS[me.who])) return t('look.usual');
    return mySavedLooks().find((s) => sameLook(s.look, p))?.name ?? null;
  });
  /** The guest's phone (docs/design.md "The guest"): a line saying it's visiting. */
  const guest = $derived(isGuest(view));

  async function go(to: 'look') {
    if (!stack.length) savedTop = body?.scrollTop ?? 0;
    stack = [...stack, to];
    await tick();
    body?.scrollTo({ top: 0 });
  }

  /** ‹: back to the list, where it was scrolled to, focus on the row it came from. */
  async function back() {
    cue('back');
    const from = push;
    stack = stack.slice(0, -1);
    await tick();
    if (!stack.length) body?.scrollTo({ top: savedTop });
    document.querySelector<HTMLElement>(`[data-push="${from}"]`)?.focus({ preventScroll: true });
  }

  /** Closing ends its banner too, and the next open starts at the top. */
  function closed() {
    if (toasts.current) toasts.dismiss();
    stack = [];
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

<Sheet bind:open label={t('title.settings')} variant="pop" onclose={closed} timed="settings">
  <div class="titlebar"><NavBar {title} onback={push ? back : null} onclose={() => (open = false)} sfx="self" /></div>
  <div class="panel-body" class:fill={push !== null} data-settings bind:this={body}>
    {#if push === 'look' && view}
      <div class="page"><LookPage {view} /></div>
    {:else if !push && view && me && worn}
      <section class="sec" aria-labelledby="sec-look">
        <h2 id="sec-look" class="sec-label">{t('panel.look')}</h2>
        <div class="prow static me" data-look-row={worn.kind}>
          <LookPortrait who={me.who} look={worn} size={48} />
          <span class="prl">{me.villagerName}{#if wornName}<small data-look-worn>{wornName}</small>{/if}</span>
          <button type="button" class="btn small paper" data-push="look" data-sfx="page" onclick={() => go('look')}>{t('panel.change')}</button>
        </div>
        {#if guest}<p class="guest" data-guest-note>{t('guest.note')}</p>{/if}
      </section>
      <section class="sec" aria-labelledby="sec-profile" data-profile-section><h2 id="sec-profile" class="sec-label">{t('panel.profile')}</h2><ProfileSection {view} /></section>
      <section class="sec" aria-labelledby="sec-sound"><h2 id="sec-sound" class="sec-label">{t('panel.sound')}</h2><SoundSection /></section>
      <section class="sec" aria-labelledby="sec-lang"><h2 id="sec-lang" class="sec-label">{t('panel.lang')}</h2><LangSection /></section>
      <section class="sec" aria-labelledby="sec-season"><h2 id="sec-season" class="sec-label">{t('panel.season')}</h2><SeasonSection {view} /></section>
      <section class="sec" aria-labelledby="sec-weather" data-weather-section><h2 id="sec-weather" class="sec-label">{t('panel.weather')}</h2><WeatherSection /></section>
      <section class="sec" aria-labelledby="sec-offline" data-offline-section><h2 id="sec-offline" class="sec-label">{t('panel.offline')}</h2><OfflineSection /></section>
      <div class="prow static decor">
        <span class="prl">{t('panel.decor')}</span>
        <button type="button" class="btn small paper" data-decor-start data-sfx="open" onclick={() => ((ui.decorating = true), (open = false))}>{t('panel.decorStart')}</button>
      </div>
      {#if week.demo}<span class="demo">{t('demo.badge')}</span>{/if}
    {/if}
  </div>
</Sheet>

<style>
  /* The one scroller. It bleeds 8px past the side padding so focus rings and lips are not clipped by its overflow. */
  .panel-body {
    flex: 1; min-height: 0; overflow: hidden auto; overscroll-behavior: contain;
    margin: 0 -8px; padding: 6px 8px var(--body-pad); display: flex; flex-direction: column; gap: 14px;
  }
  .panel-body > :global(*) { flex: none; }
  /* すがた pins its stage and tabs and scrolls its own panel (to the bottom edge): the body holds still */
  .panel-body.fill { overflow: hidden; padding-bottom: 0; }
  .panel-body.fill > .page { flex: 1; min-height: 0; }
  /* a pushed level slides in from the right (design.md "Navigation") */
  .page { display: flex; flex-direction: column; gap: 14px; animation: slide 240ms cubic-bezier(.2, .8, .2, 1); }
  @keyframes slide { from { opacity: 0; transform: translateX(24%); } to { opacity: 1; transform: none; } }

  /* one section per topic: a small heading over its rows */
  .sec { display: grid; gap: 8px; }
  .me .prl small { display: block; margin-top: 2px; font-size: var(--fs-s); color: var(--text-soft); }
  .me .btn, .decor .btn { flex: none; }
  .guest { margin: 6px 4px 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); line-height: var(--lh); }
  .demo { align-self: center; background: var(--c-yuzu); color: var(--c-ink); border-radius: var(--r-chip); padding: 4px 10px; font: 700 var(--fs-s)/1 var(--font-ui); }

  /* Rows shared by the sections (ことば, サウンド, てんき). */
  .panel-body :global(.prows) { display: grid; gap: 10px; }
  .panel-body :global(.prow) {
    appearance: none; cursor: pointer; display: flex; align-items: center; gap: 10px; min-height: 52px; padding: 8px 12px;
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
