<script lang="ts">
  // Bottom sheet on a native <dialog> (focus trap + Esc for free), opening from the thumb (style guide §4, §R.3).
  // `footer`: a sticky action row at the bottom, lifted above the on-screen keyboard (--kb from visualViewport).
  // Focused inputs scroll to the centre. variant="phone": the しまフォン launcher (NookPhone screen,
  // rounded all round, full height minus the status bar).
  import type { Snippet } from 'svelte';
  import { t } from '#lib/i18n/index.ts';

  interface Props {
    open: boolean;
    label: string;
    variant?: 'paper' | 'phone';
    onclose?: () => void;
    children: Snippet;
    footer?: Snippet;
  }
  let { open = $bindable(), label, variant = 'paper', onclose, children, footer }: Props = $props();
  let dlg: HTMLDialogElement | undefined = $state();
  let kb = $state(0);

  $effect(() => {
    if (!dlg) return;
    if (open && !dlg.open) {
      dlg.showModal();
      dlg.focus(); // focus the sheet itself, not the first control (no stray focus ring)
    } else if (!open && dlg.open) dlg.close();
  });

  // Keyboard height while open: innerHeight − visualViewport.height − offsetTop.
  $effect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    if (!open || !vv) return;
    const update = () => (kb = Math.max(0, Math.round(innerHeight - vv.height - vv.offsetTop)));
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      kb = 0;
    };
  });

  function focusin(e: FocusEvent) {
    const el = e.target as HTMLElement;
    if (!el.matches('input, textarea, select')) return;
    const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    setTimeout(() => el.scrollIntoView({ block: 'center', behavior }), 300);
  }

  /** The native close event (Esc, backdrop, grabber, or `open = false`). */
  function closed() {
    open = false;
    onclose?.();
  }

  function backdrop(e: MouseEvent) {
    if (e.target === dlg) dlg?.close();
  }
</script>

<dialog bind:this={dlg} class={variant} tabindex="-1" aria-label={label} style:--kb="{kb}px"
  onclose={closed} onclick={backdrop} onfocusin={focusin}>
  {#if open}
    <div class="inner">
      <button type="button" class="grabber" aria-label={t('common.close')} onclick={() => dlg?.close()}></button>
      {@render children()}
    </div>
    {#if footer}<div class="foot">{@render footer()}</div>{/if}
  {/if}
</dialog>

<style>
  dialog {
    margin: auto auto 0; padding: 0; border: 0; width: 100%; max-width: var(--col);
    max-height: calc(100dvh - var(--safe-top) - 24px);
    background: var(--pat-dots), var(--surface); color: var(--text);
    border-radius: var(--r-lg) var(--r-lg) 0 0; border-top: var(--bw) solid var(--edge);
    box-shadow: 0 -10px 40px rgba(40, 50, 110, .25); overflow: auto; overscroll-behavior: contain;
  }
  dialog:focus { outline: none; }
  dialog[open] { animation: up var(--dur-pop) var(--ease-soft); }
  dialog::backdrop { background: rgba(51, 65, 122, .4); }
  /* U14: the content can scroll above the keyboard too (the footer is lifted by --kb). */
  .inner { padding: 0 calc(var(--side) + var(--safe-right)) calc(var(--safe-bottom) + 18px + var(--kb, 0px)) calc(var(--side) + var(--safe-left)); }
  dialog:has(.foot) .inner { padding-bottom: calc(8px + var(--kb, 0px)); }
  /* U12: a 44px-tall hit area around the 40×5 handle. */
  .grabber {
    display: block; width: 88px; height: 44px; margin: 0 auto -6px; border: 0; padding: 0; cursor: pointer;
    background: linear-gradient(var(--stitch), var(--stitch)) center / 40px 5px no-repeat; border-radius: 12px;
  }
  .grabber:focus-visible { outline: 3px solid var(--focus); outline-offset: -4px; }
  .foot {
    position: sticky; bottom: 0; z-index: 2; transform: translateY(calc(-1 * var(--kb)));
    padding: 10px calc(var(--side) + var(--safe-right)) calc(var(--safe-bottom) + 12px) calc(var(--side) + var(--safe-left));
    background: linear-gradient(transparent, var(--surface) 30%);
  }
  dialog.phone {
    width: calc(100% - 16px); max-width: calc(var(--col) - 16px); margin-bottom: max(var(--safe-bottom), 8px);
    height: calc(100dvh - var(--safe-top) - 12px - max(var(--safe-bottom), 8px)); max-height: none;
    background: var(--pat-dots), var(--phone-bg); border: 3px solid var(--phone-edge); border-radius: var(--r-phone);
    box-shadow: var(--sh-float), inset 0 3px 0 rgba(255, 255, 255, .5);
  }
  dialog.phone .inner { padding: 6px 18px 22px; }
  @media (max-width: 339px) { dialog.phone .inner { padding: 6px 12px 18px; } }
  @keyframes up {
    0% { transform: translateY(100%); }
    70% { transform: translateY(-1.5%); }
    100% { transform: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    dialog[open] { animation: none; }
  }
</style>
