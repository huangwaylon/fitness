<script module lang="ts">
  let seq = 0;
</script>

<script lang="ts">
  // Bottom sheet on a native <dialog> (focus trap + Esc for free), opening from the thumb. One skin (v5 §4):
  // the chrome surface (cream; navy at night), radius 32, a lip, a tilted nameplate `title`, one CTA in `footer`.
  // `footer`: a sticky action row at the bottom, lifted above the on-screen keyboard (--kb from visualViewport).
  // Focused inputs scroll to the centre. While open, the page behind is locked (scrollLock, round 10 H2).
  // variant="phone": the しまフォン launcher (NookPhone screen, rounded all round, full height minus the status bar).
  // The phone itself does not scroll: it is a flex column, and the app puts its scrolling body in a
  // `.phone-body` child (round 10 architecture: fixed status row + title bar, one scroller).
  import { untrack, type Snippet } from 'svelte';
  import { t } from '#lib/i18n/index.ts';
  import { ui } from '#lib/ui-state/ui.svelte.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import ToastHost from './ToastHost.svelte';
  import { keyboardInset } from './keyboardInset.ts';
  import { lockScroll } from './scrollLock.ts';

  interface Props {
    open: boolean;
    label: string;
    /** Nameplate title (the yuzu tag). */
    title?: string;
    variant?: 'paper' | 'phone';
    onclose?: () => void;
    children: Snippet;
    footer?: Snippet;
  }
  let { open = $bindable(), label, title, variant = 'paper', onclose, children, footer }: Props = $props();
  let dlg: HTMLDialogElement | undefined = $state();
  const id = ++seq;
  /** The topmost open sheet hosts the banner (round 7 F1). */
  const hosts = $derived(open && ui.sheets.at(-1) === id);

  $effect(() => {
    if (!open) return;
    untrack(() => {
      ui.sheets = [...ui.sheets.filter((x) => x !== id), id];
    });
    return () =>
      untrack(() => {
        ui.sheets = ui.sheets.filter((x) => x !== id);
      });
  });

  $effect(() => {
    if (open) return lockScroll();
  });

  $effect(() => {
    if (!dlg) return;
    if (open && !dlg.open) {
      dlg.showModal();
      dlg.focus(); // focus the sheet itself, not the first control (no stray focus ring)
    } else if (!open && dlg.open) dlg.close();
  });

  /** The native close event (Esc, backdrop, grabber, or `open = false`). */
  function closed() {
    open = false;
    onclose?.();
  }

  function backdrop(e: MouseEvent) {
    if (e.target === dlg) dlg?.close();
  }
</script>

<dialog bind:this={dlg} class={variant} class:toasting={hosts && !!toasts.current?.action} tabindex="-1" aria-label={label}
  onclose={closed} onclick={backdrop} {@attach open && keyboardInset}>
  {#if open}
    {#if hosts}<ToastHost />{/if}
    <div class="inner">
      <button type="button" class="grabber" aria-label={t('common.close')} onclick={() => dlg?.close()}></button>
      {#if title}<h2 class="title"><span class="plate">{title}</span></h2>{/if}
      {@render children()}
    </div>
    {#if footer}<div class="foot">{@render footer()}</div>{/if}
  {/if}
</dialog>

<style>
  dialog {
    margin: auto auto 0; padding: 0; border: 0; width: 100%; max-width: var(--col);
    max-height: calc(var(--vh-fill) - var(--safe-top) - 24px);
    background: var(--surface); color: var(--text);
    border-radius: var(--r-sheet) var(--r-sheet) 0 0; box-shadow: var(--sh-float);
    /* vertical only: a stray wide child can never turn a sheet into a 2-D pan (round 10 M1) */
    overflow: hidden auto; overscroll-behavior: contain;
  }
  dialog:focus { outline: none; }
  dialog[open] { animation: up var(--dur-pop) var(--ease-soft); }
  dialog::backdrop { background: var(--scrim); }
  /* U14: the content can scroll above the keyboard too (the footer is lifted by --kb). */
  .inner { padding: 0 calc(var(--side) + var(--safe-right)) calc(var(--safe-bottom) + 18px + var(--kb, 0px)) calc(var(--side) + var(--safe-left)); }
  dialog:has(.foot) .inner { padding-bottom: calc(8px + var(--kb, 0px)); }
  /* U12: a --hit tall area around the 40×5 handle (the title margin gives back the extra 8px). */
  .grabber {
    display: block; position: relative; z-index: 1; width: 88px; height: var(--hit); margin: 0 auto -8px; border: 0; padding: 0; cursor: pointer;
    background: linear-gradient(var(--lip), var(--lip)) center / 40px 5px no-repeat; border-radius: var(--r-chip);
  }
  .grabber:focus-visible { outline: 3px solid var(--focus); outline-offset: -4px; }
  .title { display: flex; justify-content: center; margin: 2px 0 18px; }
  .foot {
    /* `bottom`, not a transform: it can never lift the row above a short sheet's top (round 10 H3) */
    position: sticky; bottom: var(--kb, 0px); z-index: 2;
    padding: 10px calc(var(--side) + var(--safe-right)) calc(var(--safe-bottom) + 12px) calc(var(--side) + var(--safe-left));
    background: linear-gradient(transparent, var(--surface) 30%);
  }
  /* The phone: paper (--surface) so its cream controls and cards have a body (sizing #1); a non-scrolling flex
     column whose `.phone-body` is the one scroller. --body-pad is that scroller's bottom padding. */
  dialog.phone {
    --body-pad: calc(22px + var(--kb, 0px));
    width: calc(100% - 16px); max-width: calc(var(--col) - 16px); margin-bottom: var(--pad-bottom);
    height: calc(var(--vh-fill) - var(--safe-top) - 12px - var(--pad-bottom)); max-height: none;
    background: var(--surface); border-radius: var(--r-sheet); box-shadow: 0 var(--lip-h) 0 var(--lip), var(--sh-float);
    overflow: hidden; display: none; flex-direction: column;
  }
  dialog.phone[open] { display: flex; }
  dialog.phone .inner {
    flex: 1; min-height: 0; display: flex; flex-direction: column;
    padding: 6px calc(18px + var(--safe-right)) 0 calc(18px + var(--safe-left));
  }
  /* An undo banner is up: the last row can scroll clear of it. */
  dialog.toasting .inner { padding-bottom: calc(var(--safe-bottom) + 96px + var(--kb, 0px)); }
  dialog.phone.toasting .inner { padding-bottom: 0; }
  dialog.phone.toasting { --body-pad: calc(96px + var(--kb, 0px)); }
  @media (max-width: 339px) { dialog.phone .inner { padding: 6px calc(12px + var(--safe-right)) 0 calc(12px + var(--safe-left)); } }
  @keyframes up {
    0% { transform: translateY(100%); }
    70% { transform: translateY(-1.5%); }
    100% { transform: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    dialog[open] { animation: none; }
  }
</style>
