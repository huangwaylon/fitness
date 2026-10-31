<script lang="ts">
  // The one banner (toasts.current, ui-state/toast.svelte.ts). Rendered once: by the layout when no sheet is open, else inside the topmost open
  // sheet's <dialog> (Sheet.svelte), so its 取り消す stays tappable while a modal is up.
  import Toast from './Toast.svelte';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
</script>

{#if toasts.current}
  {@const c = toasts.current}
  {#key c.id}<Toast text={c.text} person={c.person} reaction={c.reaction ?? 'happiness'} action={c.action} leaving={c.leaving}
    onhold={(on) => (on ? toasts.pause() : toasts.resume())} ondismiss={() => toasts.dismiss()} />{/key}
{/if}
