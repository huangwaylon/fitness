<script lang="ts">
  // The one banner (toasts.current, ui-state/toast.svelte.ts). Rendered once: by the layout when no sheet is open, else inside the topmost open
  // sheet's <dialog> (Sheet.svelte), so its 取り消す stays tappable while a modal is up. 英語すごろく's invitation with it
  // (sugoroku/components/InviteBanner.svelte: on every screen, under a toast in the same slot).
  import Toast from './Toast.svelte';
  import InviteBanner from '#lib/sugoroku/components/InviteBanner.svelte';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
</script>

{#if toasts.current}
  {@const c = toasts.current}
  {#key c.id}<Toast text={c.text} person={c.person} npc={c.npc} reaction={c.reaction ?? 'happiness'} action={c.action} low={c.low} leaving={c.leaving}
    onhold={(on) => (on ? toasts.pause() : toasts.resume())} ondismiss={() => toasts.dismiss()} />{/key}
{/if}
<InviteBanner below={!!toasts.current && !toasts.current.action && !toasts.current.low} />
