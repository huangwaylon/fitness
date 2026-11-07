<script lang="ts">
  // The meal log's popup (docs/design.md "Gohan"): the HUD's bowl opens it, full height like the health popup and
  // grown out of the button the same way (Sheet's `pop`). Its title bar (whose day, ごはん, ✕; or the level's: ‹ back to the day)
  // over one scroller holding ごはん (Food.svelte, in this chunk: the first frame of the zoom has it, never popping in
  // mid-zoom; the food data still loads on use). ✕, the backdrop and Esc close it; kept mounted between openings
  // (Sheet's `keep`: a reopening shows it at once), each still starting on きろく, today, the day at its top (whose day
  // kept for the session: Food's reset()).
  import type { Snippet } from 'svelte';
  import Sheet from '../ui/Sheet.svelte';
  import NavBar from '../ui/NavBar.svelte';
  import Food from './Food.svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { closeGoalEdit } from '../health/GoalEdit.svelte';

  let { open = $bindable() }: { open: boolean } = $props();
  /** The open level's title and ‹ (set by Food: search, an amount, the goal). */
  let title = $state('');
  let back = $state<(() => void) | null>(null);
  /** Whose day's pill (Food's), left of the title on the top level. */
  let lead = $state<Snippet | null>(null);

  function closed() {
    if (toasts.current) toasts.dismiss();
    title = '';
    back = null;
    closeGoalEdit();
  }
  let body: HTMLElement | undefined = $state();

  // The popup's open and close tunes (it mounts on the first tap, already open: that is an open too).
  let wasOpen = false;
  $effect(() => {
    const o = open;
    if (o === wasOpen) return;
    wasOpen = o;
    cue(o ? 'panel-open' : 'panel-close');
    // (kept mounted: the day's top again, once the dialog shows)
    if (o) queueMicrotask(() => body?.scrollTo({ top: 0 }));
  });
</script>

<Sheet bind:open label={t('island.food')} variant="pop" onclose={closed} timed="food" keep>
  <div class="titlebar"><NavBar title={title || t('island.food')} onback={back} {lead} onclose={() => (open = false)} sfx="self" /></div>
  <div class="fs-body" data-food-sheet bind:this={body}>
    {#if week.view}
      <Food bind:title bind:back bind:lead {open} />
    {/if}
  </div>
</Sheet>

<style>
  /* The one scroller (as the health popup's): it bleeds 8px past the side padding so focus rings and lips show. */
  .fs-body {
    flex: 1; min-height: 0; overflow: hidden auto; overscroll-behavior: contain;
    margin: 0 -8px; padding: 6px 8px var(--body-pad);
  }
</style>
