<script module lang="ts">
  export type Tab = 'kiroku' | 'rewards';
</script>

<script lang="ts">
  // The island panel: tap the HUD's jar → it slides down from the top with the ベル, in two tabs pinned under the
  // title bar (design.md "Panel"): きろく (the ベル ledger) and ごほうび (the wallet: the jar, today's ベル, the shop, the
  // buys; the panel opens on it). A week or a day push a level with ‹ in the title bar; ✕, the backdrop and Esc close
  // it. けんこう is the HUD's dumbbell's popup (the goals under its charts), the ずかん and せってい the HUD menu's
  // (HudMenu), and per-fruit detail lives in the tree popups (one home per datum).
  import Sheet from '../ui/Sheet.svelte';
  import NavBar from '../ui/NavBar.svelte';
  import Kiroku from '../kiroku/Kiroku.svelte';
  import Wallet from '../wallet/Wallet.svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { mine } from '#lib/ui-state/viewer.ts';

  let { open = $bindable() }: { open: boolean } = $props();
  /** The tab every opening shows: ごほうび, the jar's (from the HUD's jar or the old /jar link). */
  const START: Tab = 'rewards';

  let kiroku: { back: () => boolean } | undefined = $state();
  /** How deep きろく is (0 = its first screen): the tabs show only at the very top. */
  let kirokuLevel = $state(0);
  let body: HTMLElement | undefined = $state();
  /** Every opening starts on ごほうび: closing resets it, opening sets it again. */
  let tab = $state<Tab>(START);
  function pick(to: Tab) {
    if (to === tab) return;
    tab = to;
    body?.scrollTo({ top: 0 });
  }

  const view = $derived(week.view);
  const deep = $derived(kirokuLevel > 0);
  /** This phone's person (the guest's own on the guest's phone). */
  const me = $derived(view ? mine(view) : null);

  /** ‹: one level up in きろく. */
  function back() {
    cue('back');
    kiroku?.back();
  }

  /** Closing ends its banner too, and the next open starts at the top, on ごほうび (the sheet unmounts its body). */
  function closed() {
    if (toasts.current) toasts.dismiss();
    kirokuLevel = 0;
    tab = START;
  }

  // The panel's open and close tunes. It mounts on the first tap of the jar (Hud), already open: that is an open too.
  let wasOpen = false;
  $effect(() => {
    const o = open;
    if (o === wasOpen) return;
    wasOpen = o;
    if (o) tab = START;
    cue(o ? 'panel-open' : 'panel-close');
  });
</script>

<Sheet bind:open label={t('panel.title')} variant="top" onclose={closed}>
  <div class="titlebar"><NavBar title={t('panel.title')} onback={deep ? back : null} onclose={() => (open = false)} sfx="self" /></div>
  {#if !deep}
    <!-- A segmented switch (toggle buttons), pinned under the title bar while the tab scrolls -->
    <div class="tabs" role="group" aria-label={t('panel.title')}>
      {#each ['kiroku', 'rewards'] as const as id (id)}
        <button type="button" class="tab" aria-pressed={tab === id} data-tab={id} data-sfx={tab === id ? 'none' : 'tick'} onclick={() => pick(id)}>{t(`panel.tab.${id}`)}</button>
      {/each}
    </div>
  {/if}

  <div class="panel-body" bind:this={body}>
    {#if view && me && tab === 'kiroku'}
      <Kiroku bind:this={kiroku} bind:level={kirokuLevel} />
    {:else if view && me}
      <Wallet />
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
    appearance: none; border: 0; cursor: pointer; min-height: var(--hit); flex: 1 1 0; min-width: 0; max-width: 150px; padding: 0 10px; border-radius: var(--r-pill);
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
</style>
