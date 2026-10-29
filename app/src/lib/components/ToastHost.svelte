<script lang="ts">
  // The store's banner (week.toast). Rendered once: by the layout when no sheet is open, else inside the topmost open
  // sheet's <dialog> (Sheet.svelte), so its 取り消す stays tappable while a modal is up (round 7 F1).
  import Toast from './Toast.svelte';
  import { week } from '#lib/client/week.svelte.ts';
</script>

{#if week.toast}
  {#key week.toast.id}<Toast text={week.toast.text} reaction={week.toast.reaction ?? 'happiness'} action={week.toast.action} leaving={week.toast.leaving}
    onhold={(on) => (on ? week.pauseToast() : week.resumeToast())} ondismiss={() => week.dismissToast()} />{/key}
{/if}
