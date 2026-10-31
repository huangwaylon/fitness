<script module lang="ts">
  let seq = 0;
</script>

<script lang="ts">
  // Bottom sheet on a native <dialog> (focus trap + Esc for free), opening from the thumb. One skin:
  // the chrome surface (cream; navy at night), radius 32, a lip, the one title bar (NavBar: the title centred, ✕
  // top-right; nothing advertises swipe-down), one CTA in `footer`. Backdrop tap and Esc also close.
  // `footer`: a sticky action row at the bottom, lifted above the on-screen keyboard (--kb from visualViewport).
  // Focused inputs scroll to the centre. While open, the page behind is locked (scrollLock).
  // variant="top": the island panel, sliding down from under the ribbon (rounded at the bottom, the safe area on top).
  // It does not scroll itself: it is a flex column, and the panel puts its own title bar (with ‹) and its one
  // scrolling body (`.panel-body`) inside.
  import { untrack, type Snippet } from 'svelte';
  import { ui } from '#lib/ui-state/ui.svelte.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import ToastHost from './ToastHost.svelte';
  import NavBar from './NavBar.svelte';
  import { keyboardInset } from './keyboardInset.ts';
  import { lockScroll } from './scrollLock.ts';
  import { cue } from '#lib/sound/cues.ts';

  interface Props {
    open: boolean;
    label: string;
    /** The title bar's title (centred). */
    title?: string;
    variant?: 'paper' | 'top';
    onclose?: () => void;
    children: Snippet;
    footer?: Snippet;
  }
  let { open = $bindable(), label, title, variant = 'paper', onclose, children, footer }: Props = $props();
  let dlg: HTMLDialogElement | undefined = $state();
  const id = ++seq;
  /** The topmost open sheet hosts the banner. */
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
      // the sheet itself, not the first control (no stray focus ring); showModal's own focus on that control may have
      // scrolled it (the undo banner's とりけす comes first), so start at the top
      dlg.focus({ preventScroll: true });
      dlg.scrollTop = 0;
    } else if (!open && dlg.open) dlg.close();
  });

  /** The native close event (Esc, backdrop, ✕, or `open = false`). */
  function closed() {
    open = false;
    onclose?.();
  }

  /** Dismissed by hand (the backdrop, Esc): Ⓑ (✕ sounds it through its data-sfx); a sheet closed by its own button
   *  (保存, 買う！) sounds that button instead. */
  function dismissed() {
    cue('back');
  }

  function backdrop(e: MouseEvent) {
    if (e.target !== dlg) return;
    dismissed();
    dlg?.close();
  }
</script>

<dialog bind:this={dlg} class={variant} class:toasting={hosts && !!toasts.current?.action} tabindex="-1" aria-label={label}
  onclose={closed} oncancel={dismissed} onclick={backdrop} data-sfx="self" {@attach open && keyboardInset}>
  {#if open}
    {#if hosts}<ToastHost />{/if}
    <div class="inner">
      {#if variant !== 'top'}<div class="bar"><NavBar {title} onclose={() => dlg?.close()} /></div>{/if}
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
    /* vertical only: a stray wide child can never turn a sheet into a 2-D pan */
    overflow: hidden auto; overscroll-behavior: contain;
  }
  dialog:focus { outline: none; }
  /* the one sheet motion (design.md "Navigation"): up in 240ms, ease-out, no overshoot */
  dialog[open] { animation: up 240ms cubic-bezier(.2, .8, .2, 1); }
  dialog::backdrop { background: var(--scrim); }
  /* The content can scroll above the keyboard too (the footer is lifted by --kb). */
  .inner { padding: 0 calc(var(--side) + var(--safe-right)) calc(var(--safe-bottom) + 18px + var(--kb, 0px)) calc(var(--side) + var(--safe-left)); }
  dialog:has(.foot) .inner { padding-bottom: calc(8px + var(--kb, 0px)); }
  /* the title bar: 14px from the sheet's top edge, the content 10px under it; it stays put while a long sheet scrolls,
     so ✕ is always in reach (a long sheet like the menu editor would scroll it away) */
  .bar {
    position: sticky; top: 0; z-index: 3; padding: 14px 0 8px; margin-bottom: 2px;
    background: linear-gradient(var(--surface) 85%, transparent);
  }
  .foot {
    /* `bottom`, not a transform: it can never lift the row above a short sheet's top */
    position: sticky; bottom: var(--kb, 0px); z-index: 2;
    padding: 10px calc(var(--side) + var(--safe-right)) calc(var(--safe-bottom) + 12px) calc(var(--side) + var(--safe-left));
    background: linear-gradient(transparent, var(--surface) 30%);
  }
  /* The top panel: paper (--surface) so its cream cards have a body; a non-scrolling flex column whose `.panel-body`
     is the one scroller. It hangs from the top edge: the safe area over its title bar, rounded at the bottom, and it
     stops 24px above the screen's bottom so the island still peeks out under it. --body-pad is the scroller's bottom
     padding. */
  dialog.top {
    --body-pad: calc(18px + var(--kb, 0px));
    margin: 0 auto auto; max-height: calc(var(--vh-fill) - var(--safe-bottom) - 24px);
    border-radius: 0 0 var(--r-sheet) var(--r-sheet); box-shadow: 0 var(--lip-h) 0 var(--lip), var(--sh-float);
    overflow: hidden; display: none; flex-direction: column;
  }
  dialog.top[open] { display: flex; animation-name: down; }
  dialog.top .inner {
    flex: 1; min-height: 0; display: flex; flex-direction: column;
    padding: calc(var(--safe-top) + 8px) calc(var(--side) + var(--safe-right)) 0 calc(var(--side) + var(--safe-left));
  }
  /* An undo banner is up: the last row can scroll clear of it… */
  dialog.toasting .inner { padding-bottom: calc(var(--safe-bottom) + 96px + var(--kb, 0px)); }
  /* …and a footer's buttons (買う！, 保存) rise above it instead of sitting under it (the banner: 56px, 16px over the bottom) */
  dialog.toasting .foot { padding-bottom: calc(var(--pad-bottom) + 16px + 56px + var(--lip-h) + 10px); }
  dialog.top.toasting .inner { padding-bottom: 0; }
  dialog.top.toasting { --body-pad: calc(96px + var(--kb, 0px)); }
  @keyframes down { from { transform: translateY(-100%); } to { transform: none; } }
  @keyframes up { from { transform: translateY(100%); } to { transform: none; } }
  @media (prefers-reduced-motion: reduce) {
    dialog[open] { animation: none; }
  }
</style>
