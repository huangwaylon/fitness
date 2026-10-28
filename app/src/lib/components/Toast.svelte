<script lang="ts">
  // Toast in the top layer (popover), so it sits above an open sheet's scrim. Isabelle's head by
  // default; a partner's action (high-five) shows that partner's villager instead (U6).
  import type { PersonId } from '#lib/types.ts';
  import Host from './Host.svelte';
  import Villager from './Villager.svelte';

  /** `second`: another toast is up, so sit one row lower instead of on top of it. */
  let { text, person, second = false }: { text: string; person?: PersonId; second?: boolean } = $props();

  function topLayer(node: HTMLElement) {
    try {
      node.showPopover?.();
    } catch {
      /* no popover support: stays a fixed element */
    }
  }
</script>

<div class="toast" class:second role="status" popover="manual" use:topLayer>
  {#if person}<Villager {person} size={32} head animate={false} eager />{:else}<Host head size={32} animate={false} eager />{/if}{text}
</div>

<style>
  .toast {
    position: fixed; inset: auto 0; margin: 0 auto; width: max-content; max-width: calc(100vw - 48px);
    top: calc(var(--safe-top) + 12px); padding: 12px 20px 12px 12px; border-radius: var(--r-bubble); z-index: 90; overflow: visible;
    background: var(--toast-bg); color: var(--c-ink-talk); border: 0; box-shadow: 0 4px 0 var(--c-paper-2), var(--sh-float);
    font-weight: 700; font-size: var(--fs-body-lg); animation: if-pop var(--dur-pop) var(--ease-bounce) both;
    display: flex; align-items: center; gap: 10px;
  }
  .toast:popover-open { inset: auto 0; top: calc(var(--safe-top) + 12px); }
  .toast.second, .toast.second:popover-open { top: calc(var(--safe-top) + 76px); }
</style>
