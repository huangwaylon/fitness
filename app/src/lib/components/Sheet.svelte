<script lang="ts">
  // Bottom sheet on a native <dialog> (focus trap + Esc for free). Opens from the thumb (§4.6).
  // variant="phone": the しまフォン launcher shape (rounded all round, floating above the home bar).
  import type { Snippet } from 'svelte';
  import { t } from '#lib/i18n/index.ts';

  interface Props {
    open: boolean;
    label: string;
    variant?: 'paper' | 'phone';
    onclose?: () => void;
    children: Snippet;
  }
  let { open = $bindable(), label, variant = 'paper', onclose, children }: Props = $props();
  let dlg: HTMLDialogElement | undefined = $state();

  $effect(() => {
    if (!dlg) return;
    if (open && !dlg.open) {
      dlg.showModal();
      dlg.focus(); // focus the sheet itself, not the first control (no stray focus ring)
    } else if (!open && dlg.open) dlg.close();
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

<dialog bind:this={dlg} class={variant} tabindex="-1" aria-label={label} onclose={closed} onclick={backdrop}>
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
    background: var(--pat-dots), var(--surface); color: var(--text);
    border-radius: var(--r-lg) var(--r-lg) 0 0; border-top: var(--bw) solid var(--edge);
    box-shadow: 0 -10px 40px rgba(31, 42, 68, .3); overflow: auto; overscroll-behavior: contain;
  }
  dialog:focus { outline: none; }
  dialog[open] { animation: up var(--dur-pop) var(--ease-soft); }
  dialog::backdrop { background: rgba(31, 42, 68, .45); }
  .inner { padding: 6px calc(20px + var(--safe-right)) calc(var(--safe-bottom) + 18px) calc(20px + var(--safe-left)); }
  .grabber {
    display: block; width: 88px; height: 24px; margin: 0 auto 6px; border: 0; padding: 0; cursor: pointer;
    background: linear-gradient(var(--stitch), var(--stitch)) center / 40px 5px no-repeat; border-radius: 12px;
  }
  dialog.phone {
    width: calc(100% - 24px); max-width: calc(var(--col) - 24px); margin-bottom: calc(var(--safe-bottom) + 10px);
    background: var(--phone-bg); border: 3px solid var(--phone-edge); border-radius: var(--r-phone);
    box-shadow: var(--sh-float), inset 0 3px 0 rgba(255, 255, 255, .5); min-height: min(480px, 80dvh);
  }
  dialog.phone .inner { padding: 6px 20px 22px; }
  @keyframes up {
    0% { transform: translateY(100%); }
    70% { transform: translateY(-1.5%); }
    100% { transform: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    dialog[open] { animation: none; }
  }
</style>
