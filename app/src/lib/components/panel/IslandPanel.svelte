<script module lang="ts">
  type Tab = 'kiroku' | 'health' | 'settings';
  /** The last tab, for this session (a reload opens on きろく again). */
  let lastTab: Tab = 'kiroku';
</script>

<script lang="ts">
  // The island panel: tap today's ベル ribbon → it slides down from the top with everything that isn't on the island
  // itself, in three tabs pinned under the title bar (design.md "Panel"): きろく (the ベル ledger, then the goals),
  // けんこう (the Health data over time, its own chunk loaded with the tab) and せってい (むらびと, サウンド, ことば,
  // つうしん, あそびかた). A few things push a level with ‹ in the title
  // bar (a week, a day, the villager picker, the full guide); ✕, the backdrop and Esc close it. The wallet stays on the
  // jar and per-fruit detail in the tree popups (one home per datum).
  import { tick } from 'svelte';
  import Sheet from '../ui/Sheet.svelte';
  import NavBar from '../ui/NavBar.svelte';
  import Avatar from '../characters/Avatar.svelte';
  import Kiroku from '../kiroku/Kiroku.svelte';
  import VillagerPicker from './VillagerPicker.svelte';
  import HelpGuide from './HelpGuide.svelte';
  import SoundSection from './SoundSection.svelte';
  import LangSection from './LangSection.svelte';
  import SyncSection from './SyncSection.svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { resolveLook } from '#lib/villagers/look.ts';
  import { ROSTER } from '#lib/villagers/roster.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';

  let { open = $bindable() }: { open: boolean } = $props();

  /** A level of the panel's own (きろく keeps its own levels: week → day, the weight trend, a goal). */
  let push = $state<'villager' | 'help' | null>(null);
  let kiroku: { back: () => boolean } | undefined = $state();
  /** How deep きろく is (0 = its first screen): the other sections show only at the very top. */
  let kirokuLevel = $state(0);
  let body: HTMLElement | undefined = $state();
  let savedTop = 0;
  let tab = $state<Tab>(lastTab);
  /** けんこう's code: its own chunk, fetched when the tab is first shown. */
  let healthTab: Promise<typeof import('../health/Health.svelte')> | null = null;
  const loadHealth = () => (healthTab ??= import('../health/Health.svelte'));
  function pick(to: Tab) {
    if (to === tab) return;
    tab = lastTab = to;
    body?.scrollTo({ top: 0 });
  }

  const view = $derived(week.view);
  const deep = $derived(push !== null || kirokuLevel > 0);
  const title = $derived(push ? t(`panel.${push}`) : t('panel.title'));
  const me = $derived(view ? view.people[view.me] : null);
  const myLook = $derived(view && me ? resolveLook({ villager: me.villager, person: view.me }).id : null);

  async function go(to: 'villager' | 'help') {
    savedTop = body?.scrollTop ?? 0;
    push = to;
    await tick();
    body?.scrollTo({ top: 0 });
  }

  /** ‹: one level up (a pushed screen of the panel, else きろく's own), then focus back where it came from. */
  async function back() {
    cue('back');
    if (push) {
      const from = push;
      push = null;
      await tick();
      body?.scrollTo({ top: savedTop });
      document.querySelector<HTMLElement>(`[data-push="${from}"]`)?.focus({ preventScroll: true });
      return;
    }
    kiroku?.back();
  }

  /** Closing ends its banner too, and the next open starts at the top. */
  function closed() {
    if (toasts.current) toasts.dismiss();
    push = null;
    kirokuLevel = 0;
  }

  // The panel's open and close tunes. It mounts on the first tap of the ribbon (Hud), already open: that is an open too.
  let wasOpen = false;
  $effect(() => {
    const o = open;
    if (o === wasOpen) return;
    wasOpen = o;
    cue(o ? 'phone-open' : 'phone-close');
  });
</script>

<Sheet bind:open label={t('panel.title')} variant="top" onclose={closed}>
  <div class="titlebar"><NavBar {title} onback={deep ? back : null} onclose={() => (open = false)} sfx="self" /></div>
  {#if !deep}
    <!-- A segmented switch (toggle buttons), pinned under the title bar while the tab scrolls -->
    <div class="tabs" role="group" aria-label={t('panel.title')}>
      {#each ['kiroku', 'health', 'settings'] as const as id (id)}
        <button type="button" class="tab" aria-pressed={tab === id} data-tab={id} data-sfx={tab === id ? 'none' : 'tick'} onclick={() => pick(id)}>{t(`panel.tab.${id}`)}</button>
      {/each}
    </div>
  {/if}

  <div class="panel-body" class:fill={push === 'villager'} bind:this={body}>
    {#if push === 'villager' && view}
      <div class="page"><VillagerPicker {view} /></div>
    {:else if push === 'help' && view}
      <div class="page"><HelpGuide {view} /></div>
    {:else if view && me && tab === 'kiroku'}
      <Kiroku bind:this={kiroku} bind:level={kirokuLevel} />
    {:else if view && me && tab === 'health'}
      {#await loadHealth() then { default: Health }}<Health />{/await}
    {:else if view && me}
      <section class="sec" aria-labelledby="sec-villager">
        <h2 id="sec-villager">{t('panel.villager')}</h2>
        <div class="prow static me">
          <Avatar person={view.me} villager={me.villager} size={48} />
          <span class="prl">{me.villagerName}{#if myLook}<small>{i18n.locale === 'ja' ? ROSTER[myLook].nameJa : ROSTER[myLook].nameEn}</small>{/if}</span>
          <button type="button" class="btn small paper" data-push="villager" data-sfx="page" onclick={() => go('villager')}>{t('panel.change')}</button>
        </div>
      </section>
      <section class="sec" aria-labelledby="sec-sound"><h2 id="sec-sound">{t('panel.sound')}</h2><SoundSection /></section>
      <section class="sec" aria-labelledby="sec-lang"><h2 id="sec-lang">{t('panel.lang')}</h2><LangSection /></section>
      <section class="sec" aria-labelledby="sec-sync"><h2 id="sec-sync">{t('panel.sync')}</h2><SyncSection {view} /></section>
      <section class="sec" aria-labelledby="sec-help">
        <h2 id="sec-help">{t('panel.help')}</h2>
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
  /* rows scrolling up fade out under the title bar (or the tabs) instead of being cut at a hard edge */
  .titlebar:not(:has(+ .tabs))::after, .tabs::after {
    content: ''; position: absolute; left: -8px; right: -8px; top: 100%; height: 14px; pointer-events: none;
    background: linear-gradient(var(--surface), transparent);
  }
  /* the two tabs, pinned under the title bar (outside the scroller): NH's yellow for the one shown, the edge tier */
  /* the row holds the tabs' 4px lip (and a focus ring's 3px) inside its own box: the fade under it starts below the lip */
  .tabs { flex: none; position: relative; z-index: 1; display: flex; gap: 8px; justify-content: center; padding: 0 0 calc(var(--lip-h) + 4px); }
  .tab {
    appearance: none; border: 0; cursor: pointer; min-height: var(--hit); flex: 1 1 0; min-width: 0; max-width: 132px; padding: 0 10px; border-radius: var(--r-pill);
    white-space: nowrap;
    font: 700 var(--fs-body)/1 var(--font-ui); color: var(--text); background: var(--ctl); box-shadow: var(--sh-ctl);
  }
  .tab[aria-pressed='true'] { background: var(--ctl-sel); color: var(--c-ink); box-shadow: inset 0 0 0 2px var(--c-edge), 0 var(--lip-h) 0 var(--c-edge); }
  .tab:active { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
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
  @media (prefers-reduced-motion: reduce) { .page { animation: none; } }

  /* one section per topic: a small heading over its rows */
  .sec { display: grid; gap: 8px; }
  .sec h2 { margin: 6px 2px 0; font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); letter-spacing: .04em; }
  .me .prl small { display: block; margin-top: 2px; font-size: var(--fs-s); color: var(--text-soft); }
  .me .btn { flex: none; }
  .help { display: grid; gap: 10px; padding: 14px 16px; }
  .help p { margin: 0; font-weight: 700; line-height: 1.5; }
  .help .btn { justify-self: end; }
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
