<script lang="ts" module>
  import type { Component } from 'svelte';
  /** A lasting banner in the toasts' slot (英語すごろく's invitation: the root layout binds it, so the kit imports no
   *  feature), under a toast shown there (`below`). */
  let lasting = $state<Component<{ below?: boolean }> | null>(null);
  export const hostBanner = (c: Component<{ below?: boolean }>): void => void (lasting = c);
</script>

<script lang="ts">
  // The one banner (toasts.current, ui-state/toast.svelte.ts). Rendered once: by the layout when no sheet is open, else inside the topmost open
  // sheet's <dialog> (Sheet.svelte), so its 取り消す stays tappable while a modal is up. A lasting banner with it
  // (hostBanner: on every screen, under a toast in the same slot).
  import Toast from './Toast.svelte';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
</script>

{#if toasts.current}
  {@const c = toasts.current}
  {#key c.id}<Toast text={c.text} person={c.person} npc={c.npc} reaction={c.reaction ?? 'happiness'} action={c.action} low={c.low} leaving={c.leaving}
    onhold={(on) => (on ? toasts.pause() : toasts.resume())} ondismiss={() => toasts.dismiss()} />{/key}
{/if}
{#if lasting}
  {@const Lasting = lasting}
  <Lasting below={!!toasts.current && !toasts.current.action && !toasts.current.low} />
{/if}
