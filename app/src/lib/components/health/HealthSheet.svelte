<script lang="ts">
  // The health popup (docs/design.md "Kenkou"): the HUD's dumbbell opens it, full height like the island panel, but
  // grown out of the button (Sheet's `pop`: a live CSS zoom about the dumbbell, no View Transition). Its title bar
  // (けんこう, ✕) over one scroller holding けんこう (Health.svelte, its own chunk with its strings). ✕, the backdrop
  // and Esc close it; the next opening starts at 1週 on かつどう (whose data is kept for the session).
  import Sheet from '../ui/Sheet.svelte';
  import NavBar from '../ui/NavBar.svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { resetHealth } from './healthLast.ts';

  let { open = $bindable() }: { open: boolean } = $props();
  /** けんこう's code: its own chunk, fetched on the first opening. */
  let healthChunk: Promise<typeof import('./Health.svelte')> | null = null;
  const loadHealth = () => (healthChunk ??= import('./Health.svelte'));

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

<Sheet bind:open label={t('island.health')} variant="pop" onclose={closed}>
  <div class="titlebar"><NavBar title={t('island.health')} onclose={() => (open = false)} sfx="self" /></div>
  <div class="hs-body" data-health-sheet>
    {#if week.view}
      {#await loadHealth() then { default: Health }}<Health />{/await}
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
  /* The one scroller (as the panel's): it bleeds 8px past the side padding so focus rings and lips are not clipped. */
  .hs-body {
    flex: 1; min-height: 0; overflow: hidden auto; overscroll-behavior: contain;
    margin: 0 -8px; padding: 6px 8px var(--body-pad);
  }
</style>
