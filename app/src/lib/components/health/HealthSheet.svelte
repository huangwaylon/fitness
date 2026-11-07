<script lang="ts">
  // The health popup (docs/design.md "Kenkou"): the HUD's dumbbell opens it, full height like the island panel, but
  // grown out of the button (Sheet's `pop`: a live CSS zoom about the dumbbell, no View Transition). Its title bar
  // (whose data, けんこう, ✕) over one scroller holding けんこう (Health.svelte, in this chunk: the
  // first frame of the zoom has it). ✕, the backdrop and Esc close it; the next opening starts at 1週 on かつどう (whose data is kept for
  // the session).
  import type { Snippet } from 'svelte';
  import Sheet from '../ui/Sheet.svelte';
  import NavBar from '../ui/NavBar.svelte';
  import Health from './Health.svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { resetHealth } from './healthLast.ts';

  let { open = $bindable() }: { open: boolean } = $props();
  /** Whose data's pill (Health's), left of the title. */
  let lead = $state<Snippet | null>(null);

  function closed() {
    if (toasts.current) toasts.dismiss();
    resetHealth();
  }

  // The popup's open and close tunes (it mounts on the first tap, already open: that is an open too).
  let wasOpen = false;
  $effect(() => {
    const o = open;
    if (o === wasOpen) return;
    wasOpen = o;
    cue(o ? 'panel-open' : 'panel-close');
  });
</script>

<Sheet bind:open label={t('title.health')} variant="pop" onclose={closed} timed="health">
  <div class="titlebar"><NavBar title={t('title.health')} {lead} onclose={() => (open = false)} sfx="self" /></div>
  <div class="hs-body" data-health-sheet>
    {#if week.view}
      <Health bind:lead />
    {/if}
  </div>
</Sheet>

<style>
  /* The one scroller (as the panel's): it bleeds 8px past the side padding so focus rings and lips are not clipped. */
  .hs-body {
    flex: 1; min-height: 0; overflow: hidden auto; overscroll-behavior: contain;
    margin: 0 -8px; padding: 6px 8px var(--body-pad);
  }
</style>
