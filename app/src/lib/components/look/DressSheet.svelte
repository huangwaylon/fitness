<script lang="ts">
  // すがた from a room (docs/design.md "The tent": dress up): a mirror, a rack, a mannequin or a clothes wardrobe,
  // looked into, opens the dresser (look/LookPage) as せってい's 姿 level does, the guest's too, in a pop sheet of its
  // own (its own chunk, with the dresser's). ‹, ✕, the backdrop and Esc close it, back in the room; the look is sent as
  // the level is left (LookPage's own).
  import Sheet from '../ui/Sheet.svelte';
  import NavBar from '../ui/NavBar.svelte';
  import LookPage from '../look/LookPage.svelte';
  import type { WeekView } from '#lib/types.ts';
  import { t } from '#lib/i18n/index.ts';

  let { open = $bindable(), view }: { open: boolean; view: WeekView } = $props();
</script>

<Sheet bind:open tunes label={t('panel.look')} variant="pop" timed="settings" name="dress">
  <div class="titlebar"><NavBar title={t('panel.look')} onback={() => (open = false)} onclose={() => (open = false)} /></div>
  <div class="body" data-dress-sheet>
    {#if open}<div class="page"><LookPage {view} /></div>{/if}
  </div>
</Sheet>

<style>
  /* as せってい's 姿 level: the dresser pins its stage and tabs and scrolls its own panel to the bottom edge */
  .body { flex: 1; min-height: 0; overflow: hidden; margin: 0 -8px; padding: 6px 8px 0; display: flex; flex-direction: column; }
  .page { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 14px; }
</style>
