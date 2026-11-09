<script lang="ts">
  // けんこう and ごはん in one sheet (docs/design.md "Kenkou", "Gohan"; the user, 2026-11-08): the HUD's dumbbell opens
  // it, full height, at once. Its title bar over the shown tab's scroller: whose (one pick for both tabs, the avatar
  // alone: whose.svelte.ts), the page switch 健康 | ごはん in the title's place (KenkouSwitch; the last one shown kept
  // for the session: healthLast's `tab`), ✕; on ごはん's levels ‹, the level's title and ✕ (no switch). 健康 is Health.svelte and ごはん Food.svelte, both in this chunk; ごはん is mounted the
  // first time its tab shows and kept (hidden) after, so the food's pictures and catalogue never load for 健康 alone.
  // ✕, the backdrop and Esc close it (ごはん's editor changed: they ask first; the switch is never shown over an editor); kept mounted between openings (Sheet's `keep`: a reopening shows it at once).
  // Each opening starts 健康 at 1週 on かつどう at its top (whose data kept for the session); each time ごはん shows (an
  // opening on it, or its tab) it starts on 記録, today, the day at its top (Food's `open`: its reset, and its
  // catalogue's idle load while it shows). A tree popup's ごはん button (open.svelte.ts askFood) opens it on ごはん, today, on the
  // tree's owner's day (the one whose).
  import { untrack, type Snippet } from 'svelte';
  import Sheet from '../ui/Sheet.svelte';
  import NavBar from '../ui/NavBar.svelte';
  import KenkouSwitch from './KenkouSwitch.svelte';
  import Health from './Health.svelte';
  import Food from '../food/Food.svelte';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import { last, resetHealth, type KenkouTab } from './healthLast.ts';
  import { closeGoalEdit } from './GoalEdit.svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { pickWhose } from './whose.svelte.ts';
  import { kenkou } from './open.svelte.ts';

  let { open = $bindable() }: { open: boolean } = $props();
  let tab = $state<KenkouTab>(last.tab);
  /** ごはん has shown once (mounted from then on). */
  let foodSeen = $state(last.tab === 'food');
  const food = $derived(open && tab === 'food');

  /** Whose data's pill (Health's), whose day's (Food's), left of the title. */
  let healthLead = $state<Snippet | null>(null);
  let foodLead = $state<Snippet | null>(null);
  /** ごはん's open level's title and ‹ (set by Food: search, an amount, the goal). */
  let foodTitle = $state('');
  let back = $state<(() => void) | null>(null);

  const TABS = $derived([
    { id: 'health' as const, label: t('title.health'), art: 'items/dumbbell', wide: true },
    { id: 'food' as const, label: t('island.food'), art: 'items/dinner' }
  ]);

  /** The sheet (its `guard`: ごはん's editor changed, ✕ asks first). */
  let sheet: ReturnType<typeof Sheet> | undefined = $state();
  function pick(id: KenkouTab) {
    if (id === tab) return;
    closeGoalEdit();
    tab = last.tab = id;
    if (id === 'food') foodSeen = true;
  }
  const close = () => (sheet ? sheet.guard(() => (open = false)) : (open = false));

  // a tree's ask (on its mount too: the ask that mounts it)
  $effect.pre(() => {
    const ask = kenkou.ask;
    if (ask) untrack(() => (pick('food'), pickWhose(ask.arg)));
  });

  function closed() {
    if (toasts.current) toasts.dismiss();
    resetHealth();
    closeGoalEdit();
  }
  /** Its openings: Health, kept mounted between them, starts each from 1週 on かつどう at the top. */
  let opens = $state(0);
  let healthBody: HTMLElement | undefined = $state();
  let foodBody: HTMLElement | undefined = $state();

  // Each opening: counted, at the top.
  $effect(() => {
    if (!open) return;
    opens = untrack(() => opens) + 1;
    queueMicrotask(() => healthBody?.scrollTo({ top: 0 }));
  });
  // ごはん shown: the day's top again (kept mounted, once the dialog shows)
  $effect(() => {
    if (food) queueMicrotask(() => foodBody?.scrollTo({ top: 0 }));
  });
</script>

{#snippet pages()}<KenkouSwitch items={TABS} value={tab} label={t('health.tabs')} onpick={pick} />{/snippet}

<Sheet bind:this={sheet} bind:open tunes label={t('title.health')} variant="pop" onclose={closed} timed="health" keep>
  <div class="titlebar">
    {#if tab === 'food' && back}
      <NavBar title={foodTitle} onback={back} onclose={close} sfx="self" />
    {:else}
      <NavBar title={tab === 'food' ? t('island.food') : t('title.health')} lead={tab === 'food' ? foodLead : healthLead} middle={pages} onclose={close} sfx="self" />
    {/if}
  </div>
  <div class="body" data-health-sheet bind:this={healthBody} hidden={tab !== 'health'}>
    {#if week.view}
      <Health bind:lead={healthLead} {opens} />
    {/if}
  </div>
  {#if foodSeen}
    <div class="body" data-food-sheet bind:this={foodBody} hidden={tab !== 'food'}>
      {#if week.view}
        <Food bind:title={foodTitle} bind:back bind:lead={foodLead} open={food} />
      {/if}
    </div>
  {/if}
</Sheet>

<style>
  /* The shown tab's one scroller (as the panel's): it bleeds 8px past the side padding so focus rings and lips are not
     clipped. Both tabs' spacing: --kk-gap between rows and cards, --kk-row a control row's height (健康's 活動 · 体 with
     its period, ごはん's 記録 · グラフ), so their range rows sit at one height. */
  .body {
    --kk-gap: 12px; --kk-row: var(--hit);
    flex: 1; min-height: 0; overflow: hidden auto; overscroll-behavior: contain;
    margin: 0 -8px; padding: 6px 8px var(--body-pad);
  }
  .body[hidden] { display: none; }
</style>
