<script module lang="ts">
  let seq = 0;
  /** How long after a full-height sheet shows its content's own entrances are skipped (Sheet's settle). */
  const SETTLE_MS = 500;
</script>

<script lang="ts">
  // Bottom sheet on a native <dialog> (focus trap + Esc for free), opening from the thumb. One skin:
  // the chrome surface (cream; navy at night), radius 32, a lip, the one title bar (NavBar: the title centred, ✕
  // top-right; nothing advertises swipe-down), one CTA in `footer`. Backdrop tap and Esc also close.
  // `footer`: a sticky action row at the bottom, lifted above the on-screen keyboard (--kb from visualViewport).
  // Focused inputs scroll to the centre. While open, the page behind is locked (scrollLock).
  // variant="top": the island panel (the leaf menu's ベル row opens it), the screen's height (rounded at the bottom, the
  // safe area on top). It does not scroll itself: it is a flex column, and the panel puts its own title bar (with ‹) and its one
  // scrolling body (`.panel-body`) inside. variant="pop": the same full-height column (けんこう, the island's other
  // sheets). The full-height sheets open from the island at once (the user, 2026-11-08: no zoom, slide or fade, and
  // none closing): no motion of their own, and the opening finishes any their content's levels would start then
  // (settle). variant="full": the pop's column for the info sheets (docs/design.md "Unified kit": りょこう, けっこんしき, トレイル): the paper edge to
  // edge, body text in --font-body, the kit's scope (`.kit`); the sheet puts its own NavBar, one scroller and
  // a TabBar inside. The default (paper) is also the kit's form sheet: the fields, then 保存 (a leaf .btn) in `footer`;
  // `focusField` puts the keyboard up on its first field.
  // `keep`: the content stays mounted after a close (in the closed dialog: not drawn, no focus, no taps), so the next
  // opening shows it at once instead of building it again; a few at most (ui-state/keptSheets.ts: the least recently
  // opened let go, all of them on pagehide or a lost WebGL context; `keep` false while closed lets it go too). The sheet
  // resets what each opening resets itself.
  // `tunes`: its open and close tunes (panel-open / panel-close; mounted already open, on the first tap: that is an open too).
  // `timed`: its openings timed for the log (`perf.sheet`, ui-state/sheetTiming.ts).
  // A full-height sheet (top, pop, full) joins ui.up once its first frame is out: the island hides under it then.
  // A half-filled form in it (`dirty`, or one registered inside it: ui/discard.svelte.ts) makes every close ask first,
  // 「入力した内容を破棄しますか？」 [破棄する] [編集を続ける], in a paper sheet over it; a caller's own ✕ goes through `guard`.
  import { untrack, type Snippet } from 'svelte';
  import { onScrim } from './scrim.ts';
  import { ui } from '#lib/ui-state/ui.svelte.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import ToastHost from './ToastHost.svelte';
  import NavBar from './NavBar.svelte';
  import { withKeyboardInset } from './keyboardInset.svelte.ts';
  import { lockScroll } from './scrollLock.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { count, logOn } from '#lib/sync/log.ts';
  import { keyOfText } from '#lib/i18n/index.ts';
  import type { LogSheet } from '#lib/contract/log.ts';
  import { timeSheet } from '#lib/ui-state/sheetTiming.ts';
  import { keepSheet, unkeepSheet } from '#lib/ui-state/keptSheets.ts';
  import { t } from '#lib/i18n/index.ts';
  import { provideDiscard } from './discard.svelte.ts';
  import Self from './Sheet.svelte';

  interface Props {
    open: boolean;
    label: string;
    /** The title bar's title (centred). */
    title?: string;
    variant?: 'paper' | 'top' | 'pop' | 'full';
    onclose?: () => void;
    /** A backdrop tap or Esc: false keeps the sheet open (a game going asks first: ききみみ's 「やめる？」). */
    ondismiss?: () => boolean;
    children: Snippet;
    footer?: Snippet;
    /** On open, focus the first input / textarea / select (a form sheet: the keyboard comes up with it). */
    focusField?: boolean;
    /** Keep the content mounted after a close (the next opening at once). */
    keep?: boolean;
    /** Sound its open and close tunes. */
    tunes?: boolean;
    /** Time its openings for the log, by this name. */
    timed?: LogSheet;
    /** A form with input not saved (a form that is the sheet itself; forms inside it register: guardForm). */
    dirty?: () => boolean;
  }
  let { open = $bindable(), label, title, variant = 'paper', onclose, ondismiss, children, footer, focusField = false, keep = false, tunes = false, timed, dirty }: Props = $props();

  /** The forms inside it (guardForm), and the close waiting on 破棄する while the question is up. */
  const forms = new Set<() => boolean>();
  let asking = $state<(() => void) | null>(null);
  const unsaved = () => !!dirty?.() || [...forms].some((f) => f());
  provideDiscard({ form: (f) => (forms.add(f), () => void forms.delete(f)), ask: (run) => (asking = run) });
  /** Close (or anything else that throws the input away) once nothing is unsaved, else after 破棄する. */
  export function guard(run: () => void) {
    if (unsaved()) asking = run;
    else run();
  }
  function discard() {
    const run = asking;
    asking = null;
    run?.();
  }
  const cls = $derived(variant === 'full' ? 'pop full kit' : variant);
  let dlg: HTMLDialogElement | undefined = $state();
  const id = ++seq;
  /** The topmost open sheet hosts the banner. */
  const hosts = $derived(open && ui.sheets.at(-1) === id);
  /** The content is mounted while closed (`keep`, from its first opening until let go). */
  let kept = $state(false);
  $effect(() => () => unkeepSheet(id));
  // (`keep` turned off while closed, a level holding a map: let go now)
  $effect(() => {
    if (!keep && kept && !open) untrack(() => ((kept = false), unkeepSheet(id)));
  });

  $effect(() => {
    if (!open) return;
    untrack(() => {
      ui.sheets = [...ui.sheets.filter((x) => x !== id), id];
      // the log's usage counter: the sheet by its title's i18n key (never its text: sync/log.ts)
      if (logOn()) count(`sheet:${keyOfText(label) ?? 'other'}`);
    });
    return () =>
      untrack(() => {
        ui.sheets = ui.sheets.filter((x) => x !== id);
      });
  });

  $effect(() => {
    if (open) return lockScroll();
  });

  let wasOpen = false;
  $effect(() => {
    const o = open;
    if (!tunes || o === wasOpen) return;
    wasOpen = o;
    cue(o ? 'panel-open' : 'panel-close');
  });

  $effect(() => {
    if (!dlg) return;
    if (open && !dlg.open) {
      const d = dlg;
      if (timed) untrack(() => timeSheet(d, timed, kept));
      if (keep)
        untrack(() => {
          kept = true;
          keepSheet(id, () => (kept = false), () => !!dlg?.open);
        });
      dlg.showModal();
      if (variant !== 'paper') untrack(() => (settle(d), whenUp(d)));
      // the sheet itself, not the first control (no stray focus ring); showModal's own focus on that control may have
      // scrolled it (the undo banner's とりけす comes first), so start at the top
      dlg.focus({ preventScroll: true });
      dlg.scrollTop = 0;
      if (focusField) queueMicrotask(() => dlg?.querySelector<HTMLElement>('input, textarea, select')?.focus());
    } else if (!open && dlg.open) dlg.close();
  });

  /** The sheet is up once its first frame is out (in ui.up while it stays open: the island hidden under it then, not in
   *  the tap's frame, where restyling the island held up the sheet's first frame). */
  function whenUp(d: HTMLDialogElement) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (d.open && !ui.up.includes(id)) ui.up = [...ui.up, id];
    }));
  }
  /** A full-height sheet shown at rest: the slide-ins and fades its content starts as it shows (a kept page back from
   *  display: none, a first mount, a chart drawn a moment later) end at once, for SETTLE_MS; anything looping plays on. */
  function settle(d: HTMLDialogElement) {
    const done = (a: Animation) => {
      const t = a.effect?.getTiming();
      if (!a.currentTime && t && Number.isFinite(t.iterations ?? 1)) a.finish();
    };
    for (const a of d.getAnimations?.({ subtree: true }) ?? []) done(a);
    const started = (e: AnimationEvent) => {
      if (e.target instanceof Element) for (const a of e.target.getAnimations()) if ((a as CSSAnimation).animationName === e.animationName) done(a);
    };
    d.addEventListener('animationstart', started);
    setTimeout(() => d.removeEventListener('animationstart', started), SETTLE_MS);
  }
  $effect(() => {
    if (!open) untrack(() => ui.up.includes(id) && (ui.up = ui.up.filter((x) => x !== id)));
  });
  $effect(() => () => untrack(() => (ui.up = ui.up.filter((x) => x !== id))));

  /** The native close event (Esc, backdrop, ✕, or `open = false`); a late one, after the sheet was opened again at once
   *  (the event is queued: トレイル's openTrail straight after ✕), isn't a close. */
  function closed() {
    if (dlg?.open) return;
    open = false;
    onclose?.();
  }

  /** Dismissed by hand (the backdrop, Esc): Ⓑ (✕ sounds it through its data-sfx); a sheet closed by its own button
   *  (保存, 買う！) sounds that button instead. */
  function dismissed(e?: Event): boolean {
    if (ondismiss && !ondismiss()) {
      e?.preventDefault();
      return false;
    }
    if (unsaved()) {
      e?.preventDefault();
      asking = () => dlg?.close();
      return false;
    }
    cue('back');
    return true;
  }

  /** A tap on the scrim (ui/scrim.ts). */
  function backdrop(e: MouseEvent) {
    if (onScrim(e, dlg) && dismissed()) dlg?.close();
  }
</script>

<dialog bind:this={dlg} class={cls} class:toasting={hosts && !!toasts.current?.action} tabindex="-1" aria-label={label}
  onclose={closed} oncancel={dismissed} onclick={backdrop} data-sfx="self" {@attach open && withKeyboardInset}>
  {#if open || kept}
    {#if hosts}<ToastHost />{/if}
    <div class="inner">
      {#if variant === 'paper'}<div class="bar"><NavBar {title} onclose={() => guard(() => dlg?.close())} /></div>{/if}
      {@render children()}
    </div>
    {#if footer}<div class="foot">{@render footer()}</div>{/if}
    {#if asking}
      <Self bind:open={() => true, (v) => { if (!v) asking = null; }} label={t('common.discard.q')}>
        <div class="ask" data-discard-ask>
          <p>{t('common.discard.q')}</p>
          <div class="two">
            <button type="button" class="btn danger" data-sfx="undo" data-discard-yes onclick={discard}>{t('common.discard.yes')}</button>
            <button type="button" class="btn paper" data-sfx="back" data-discard-keep onclick={() => (asking = null)}>{t('common.discard.keep')}</button>
          </div>
        </div>
      </Self>
    {/if}
  {/if}
</dialog>

<style>
  dialog {
    margin: auto auto 0; padding: 0; border: 0; width: 100%; max-width: var(--col);
    max-height: calc(var(--vh-fill) - var(--ui-top) - 24px);
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
  dialog:has(> .foot) > .inner { padding-bottom: calc(8px + var(--kb, 0px)); }
  /* the title bar: 10px from the sheet's top edge, the content 8px under it; it stays put while a long sheet scrolls,
     so ✕ is always in reach (a long sheet like the menu editor would scroll it away) */
  .bar {
    position: sticky; top: 0; z-index: 3; padding: 10px 0 6px; margin-bottom: 2px;
    background: linear-gradient(var(--surface) 85%, transparent);
  }
  .foot {
    /* `bottom`, not a transform: it can never lift the row above a short sheet's top */
    position: sticky; bottom: var(--kb, 0px); z-index: 2;
    padding: 10px calc(var(--side) + var(--safe-right)) var(--pad-foot) calc(var(--side) + var(--safe-left));
    background: linear-gradient(transparent, var(--surface) 30%);
  }
  /* The top panel: paper (--surface) so its cream cards have a body; a non-scrolling flex column whose `.panel-body`
     is the one scroller. It fills the screen from the top edge (the safe area over its title bar) to the bottom edge
     (the home indicator's safe area inside its scroller's padding), so switching tabs never changes its height and no
     sliver of island shows under it; rounded at the bottom like the screen's corners. --body-pad is the scroller's
     bottom padding. */
  dialog.top, dialog.pop {
    --body-pad: calc(var(--safe-bottom) + 18px + var(--kb, 0px));
    margin: 0 auto; height: var(--vh-fill); max-height: none;
    border-radius: 0 0 var(--r-sheet) var(--r-sheet); box-shadow: var(--sh-float);
    overflow: hidden; display: none; flex-direction: column;
  }
  /* at once, no motion (the paper sheet's slide up is theirs to skip) */
  dialog.top[open], dialog.pop[open] { display: flex; animation: none; }
  /* (child combinators throughout: a sheet opened from inside the panel, BuyConfirm say, is a dialog nested in this one's
     .inner, and must not take the panel's rules) */
  dialog.top > .inner, dialog.pop > .inner {
    flex: 1; min-height: 0; display: flex; flex-direction: column;
    padding: var(--ui-top) calc(var(--side) + var(--safe-right)) 0 calc(var(--side) + var(--safe-left));
  }
  /* An undo banner is up: the last row can scroll clear of it… */
  dialog.toasting > .inner { padding-bottom: calc(var(--safe-bottom) + 96px + var(--kb, 0px)); }
  /* …and a footer's buttons (買う！, 保存) rise above it instead of sitting under it (the banner: 56px, 16px over the bottom) */
  dialog.toasting > .foot { padding-bottom: calc(var(--pad-bottom) + 16px + 56px + var(--lip-h) + 10px); }
  dialog.top.toasting > .inner, dialog.pop.toasting > .inner { padding-bottom: 0; }
  dialog.top.toasting, dialog.pop.toasting { --body-pad: calc(var(--safe-bottom) + 96px + var(--kb, 0px)); }
  /* the info sheets: the app's paper, the column edge to edge (the sheet's header and scroller pad themselves), dense
     body text in the system font (titles, labels, numbers set their own --font-ui / --font-num) */
  dialog.full { border-radius: 0; font: 400 var(--fs-body)/1.45 var(--font-body); font-variant-numeric: tabular-nums; }
  dialog.full > .inner { padding: 0; }
  @keyframes up { from { transform: translateY(100%); } to { transform: none; } }
  /* the question before throwing input away: its line, then 破棄する · 編集を続ける */
  .ask { display: grid; gap: 16px; padding: 0 0 8px; text-align: center; }
  .ask p { margin: 0; font: 700 var(--fs-talk)/1.4 var(--font-ui); }
  .two { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .two .btn { margin: 0; }
</style>
