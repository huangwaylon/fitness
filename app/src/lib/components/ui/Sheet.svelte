<script module lang="ts">
  let seq = 0;
</script>

<script lang="ts">
  // Bottom sheet on a native <dialog> (focus trap + Esc for free), opening from the thumb. One skin (v5 §4):
  // the chrome surface (cream; navy at night), radius 32, a lip, the one title bar (NavBar: the title centred, ✕
  // top-right; nothing advertises swipe-down, user 2026-10-30), one CTA in `footer`. Backdrop tap and Esc also close.
  // `footer`: a sticky action row at the bottom, lifted above the on-screen keyboard (--kb from visualViewport).
  // Focused inputs scroll to the centre. While open, the page behind is locked (scrollLock, round 10 H2).
  // variant="phone": the しまフォン launcher (NookPhone screen, rounded all round, full height minus the status bar).
  // The phone itself does not scroll: it is a flex column, and the app puts its scrolling body in a
  // `.phone-body` child (round 10 architecture: fixed status row + title bar, one scroller).
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

  /** Dismissed by hand (the backdrop, Esc): Ⓑ (✕ sounds it through its data-sfx). The phone plays its own put-away
   *  tune (ShimaPhone), and a sheet closed by its own button (保存, 買う！) sounds that button instead. */
  function dismissed() {
    if (variant !== 'phone') cue('back');
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
      {#if variant !== 'phone'}<div class="bar"><NavBar {title} onclose={() => dlg?.close()} /></div>{/if}
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
  /* the one sheet motion (design.md "Navigation"): up in 240ms, ease-out, no overshoot */
  dialog[open] { animation: up 240ms cubic-bezier(.2, .8, .2, 1); }
  dialog::backdrop { background: var(--scrim); }
  /* U14: the content can scroll above the keyboard too (the footer is lifted by --kb). */
  .inner { padding: 0 calc(var(--side) + var(--safe-right)) calc(var(--safe-bottom) + 18px + var(--kb, 0px)) calc(var(--side) + var(--safe-left)); }
  dialog:has(.foot) .inner { padding-bottom: calc(8px + var(--kb, 0px)); }
  /* the title bar: 14px from the sheet's top edge, the content 10px under it; it stays put while a long sheet scrolls,
     so ✕ is always in reach (round 19: the menu editor scrolled it away) */
  .bar {
    position: sticky; top: 0; z-index: 3; padding: 14px 0 8px; margin-bottom: 2px;
    background: linear-gradient(var(--surface) 85%, transparent);
  }
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
    /* 14px over the title bar, as on a paper sheet: ✕ and ‹ sit 18px from the phone's top and its side (round 21: 10 / 18) */
    padding: 14px calc(18px + var(--safe-right)) 0 calc(18px + var(--safe-left));
  }
  /* An undo banner is up: the last row can scroll clear of it. */
  dialog.toasting .inner { padding-bottom: calc(var(--safe-bottom) + 96px + var(--kb, 0px)); }
  /* …and a footer's buttons (買う！, 保存) rise above it instead of sitting under it (the banner: 56px, 16px over the bottom) */
  dialog.toasting .foot { padding-bottom: calc(var(--pad-bottom) + 16px + 56px + var(--lip-h) + 10px); }
  dialog.phone.toasting .inner { padding-bottom: 0; }
  dialog.phone.toasting { --body-pad: calc(96px + var(--kb, 0px)); }
  @media (max-width: 339px) { dialog.phone .inner { padding: 14px calc(12px + var(--safe-right)) 0 calc(12px + var(--safe-left)); } }
  @keyframes up { from { transform: translateY(100%); } to { transform: none; } }
  @media (prefers-reduced-motion: reduce) {
    dialog[open] { animation: none; }
  }
</style>
