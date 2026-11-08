<script lang="ts">
  // けんこう and ごはん in one sheet (docs/design.md "Kenkou", "Gohan"; the user, 2026-11-08): the HUD's dumbbell opens
  // it, full height, at once. Its title bar (whose data or day, the shown tab's title, ✕; ごはん's level: ‹ back to the
  // day) over the shown tab's scroller, the bottom tab bar under them (健康 · ごはん; the last one shown kept for the
  // session: healthLast's `tab`). 健康 is Health.svelte and ごはん Food.svelte, both in this chunk; ごはん is mounted the
  // first time its tab shows and kept (hidden) after, so the food's pictures and catalogue never load for 健康 alone.
  // ✕, the backdrop and Esc close it; kept mounted between openings (Sheet's `keep`: a reopening shows it at once).
  // Each opening starts 健康 at 1週 on かつどう at its top (whose data kept for the session); each time ごはん shows (an
  // opening on it, or its tab) it starts on 記録, today, the day at its top (Food's `open`: its reset, and its
  // catalogue's idle load while it shows).
  import { untrack, type Snippet } from 'svelte';
  import Sheet from '../ui/Sheet.svelte';
  import NavBar from '../ui/NavBar.svelte';
  import TabBar from '../ui/TabBar.svelte';
  import Health from './Health.svelte';
  import Food from '../food/Food.svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { last, resetHealth, type KenkouTab } from './healthLast.ts';
  import { closeGoalEdit } from './GoalEdit.svelte';

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
    { id: 'health' as const, label: t('title.health'), icon: 'activity' as const },
    { id: 'food' as const, label: t('island.food'), icon: 'utensils' as const }
  ]);

  function pick(id: KenkouTab) {
    if (id === tab) return;
    closeGoalEdit();
    tab = last.tab = id;
    if (id === 'food') foodSeen = true;
  }

  function closed() {
    if (toasts.current) toasts.dismiss();
    resetHealth();
    closeGoalEdit();
  }
  /** Its openings: Health, kept mounted between them, starts each from 1週 on かつどう at the top. */
  let opens = $state(0);
  let healthBody: HTMLElement | undefined = $state();
  let foodBody: HTMLElement | undefined = $state();

  // The popup's open and close tunes (it mounts on the first tap, already open: that is an open too).
  let wasOpen = false;
  $effect(() => {
    const o = open;
    if (o === wasOpen) return;
    wasOpen = o;
    cue(o ? 'panel-open' : 'panel-close');
    if (!o) return;
    opens = untrack(() => opens) + 1;
    queueMicrotask(() => healthBody?.scrollTo({ top: 0 }));
  });
  // ごはん shown: the day's top again (kept mounted, once the dialog shows)
  $effect(() => {
    if (food) queueMicrotask(() => foodBody?.scrollTo({ top: 0 }));
  });
</script>

<Sheet bind:open label={t('title.health')} variant="pop" onclose={closed} timed="health" keep>
  <div class="titlebar">
    {#if tab === 'food'}
      <NavBar title={foodTitle || t('island.food')} onback={back} lead={foodLead} onclose={() => (open = false)} sfx="self" />
    {:else}
      <NavBar title={t('title.health')} lead={healthLead} onclose={() => (open = false)} sfx="self" />
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
  <div class="tabs"><TabBar items={TABS} value={tab} label={t('health.tabs')} attr="kenkou-tab" onpick={pick} /></div>
</Sheet>

<style>
  /* The shown tab's one scroller (as the panel's): it bleeds 8px past the side padding so focus rings and lips are not
     clipped. */
  .body {
    flex: 1; min-height: 0; overflow: hidden auto; overscroll-behavior: contain;
    margin: 0 -8px; padding: 6px 8px calc(var(--body-pad) - var(--safe-bottom));
  }
  .body[hidden] { display: none; }
  /* the tab bar edge to edge under them (it pads the safe areas itself) */
  .tabs { flex: none; margin: 0 calc(-1 * (var(--side) + var(--safe-right))) 0 calc(-1 * (var(--side) + var(--safe-left))); }
</style>
