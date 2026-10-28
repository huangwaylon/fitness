<script lang="ts">
  // Bottom sheet on a native <dialog> (focus trap + Esc for free). Opens from the thumb.
  import type { Snippet } from 'svelte';
  import { t } from '#lib/i18n/index.ts';

  interface Props {
    open: boolean;
    label: string;
    onclose?: () => void;
    children: Snippet;
  }
  let { open = $bindable(), label, onclose, children }: Props = $props();
  let dlg: HTMLDialogElement | undefined = $state();

  $effect(() => {
    if (!dlg) return;
    if (open && !dlg.open) {
      dlg.showModal();
      dlg.focus(); // focus the sheet itself, not the first control (no stray focus ring)
    }
    else if (!open && dlg.open) dlg.close();
  });

  function closed() {
    if (open) {
      open = false;
      onclose?.();
    }
  }

  function backdrop(e: MouseEvent) {
    if (e.target === dlg) dlg?.close();
  }
</script>

<dialog bind:this={dlg} tabindex="-1" aria-label={label} onclose={closed} onclick={backdrop}>
  {#if open}
    <div class="inner">
      <button type="button" class="grabber" aria-label={t('common.close')} onclick={() => dlg?.close()}></button>
      {@render children()}
    </div>
  {/if}
</dialog>

<style>
  dialog {
    margin: auto auto 0; padding: 0; border: 0; width: 100%; max-width: var(--col); max-height: 88dvh;
    background: var(--bg); color: var(--text); border-radius: 34px 34px 0 0;
    box-shadow: 0 -10px 40px rgba(31, 42, 68, .3); overflow: auto; overscroll-behavior: contain;
  }
  dialog:focus { outline: none; }
  dialog[open] { animation: up var(--dur-base) var(--ease-soft); }
  dialog::backdrop { background: rgba(31, 42, 68, .45); }
  .inner { padding: 6px calc(20px + var(--safe-right)) calc(var(--safe-bottom) + 18px) calc(20px + var(--safe-left)); }
  .grabber {
    display: block; width: 88px; height: 24px; margin: 0 auto 6px; border: 0; padding: 0; cursor: pointer;
    background: linear-gradient(var(--sand-deep), var(--sand-deep)) center / 44px 5px no-repeat; border-radius: 12px;
  }
  @keyframes up { from { transform: translateY(40px); opacity: 0; } to { transform: none; opacity: 1; } }
</style>
