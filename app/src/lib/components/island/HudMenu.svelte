<script lang="ts">
  // The HUD menu, the cluster's right end (docs/design.md "Island"): a small round cream button with NH's leaf (the
  // toggle; aria-expanded) that drops its pills down under it, right-aligned, kanji on them (easier to read than spaced
  // kana); above 設定 (last) in each person's own order (ベル first by default), less the ones they hid (`pref menuOrder`,
  // `pref menuHidden`: store/menu.ts), by default:
  // 「ベル 121」 (my wallet's balance, the guest's both, no icon: the number is the picture) → the panel (ごほうび) (ずかん is
  // 設定's: its last section), 旅行 (Orville's head: the trips' sheet, travel/open.svelte.ts), 結婚式 (パニエル's head:
  // the wedding board, its sheet opened here: components/wedding), トレイル (a mountain: the hiking trails,
  // hiking/open.svelte.ts), 地図 (a pin: 保存した場所, places/open.svelte.ts), 英語 (English Study's sheet, lib/english), ボット (a robot's head: the bots'
  // sheet, members only; the worst of the bots' dots while one needs a person, a coral or yuzu 「!」, never a green
  // one; every bot read as the menu unfolds: bots/summary.svelte.ts) and 設定 (a gear);
  // no かいがら: the shop is the building. Folded by default: the sky keeps only the dumbbell, the bowl and the leaf.
  // Open, left of the pills: やること's 今日・明日 panel (todo/DuePanel.svelte, its chunk fetched as the leaf is touched;
  // never in edit mode or with やること's pill hidden; nothing due, nothing drawn).
  // It folds again on a second tap of the leaf, a tap anywhere else (that tap still goes where it was aimed), Esc, a
  // sheet opening, or a pick (a pill: a press squash, the villagers glance up at it (R18), and its sheet opens at once;
  // its chunk fetched from the pill's touch-down). Folded, the pills are hidden and inert (no taps, no focus, out of placement.ts' guards).
  // Edit mode (the menu's own editor): a pill held 500 ms (not moved 10 px) enters it,
  // and that pill never opens (its click swallowed); the same finger then drags it (a movable one). In it the movable
  // pills jiggle with a ⊖ (a tap hides it) or, hidden and dimmed, a ⊕ (a tap shows it again; ベル has neither: never
  // hidden); a drag moves one anywhere above 設定 (fixed, taking no tap), each drop sent; ↑ / ↓ on a focused pill move
  // it too; 元に戻す (once off the default; 取り消す on its banner) and 完了 under 設定. 完了, a tap outside, Esc or the leaf leave it. A plain tap
  // stays instant: the hold only arms a timer. No haptics.
  // The goals' coins fly into it (HudCoins): into the leaf while it's folded, into the ベル row's number (wherever it
  // sits) while it's open; the number holds while they are in the air and counts up as each lands, and today's +N flashes by where
  // they land (a yuzu bubble that fades: earnings only, never a とりけす's refund).
  //   <HudMenu bells={…} today={…} expanded={panelOpen} onbells={() => …} onsettings={() => …} {later} />
  import { tick, untrack } from 'svelte';
  import { Tween } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { english } from '#lib/english/open.svelte.ts';
  import { trips } from '../travel/open.svelte.ts';
  import { weddingSheet } from '../wedding/open.svelte.ts';
  import { todoSheet } from '../todo/open.svelte.ts';
  import { openTrails } from '../hiking/open.svelte.ts';
  import { placesSheet } from '../places/open.svelte.ts';
  import { botTabs, botsSheet } from '../bots/open.svelte.ts';
  import { refresh, worstOf } from '../bots/summary.svelte.ts';
  import StatusDot from '../bots/StatusDot.svelte';
  import { coinsInFlight } from './HudCoins.svelte';
  import { react } from '../motion/director.svelte.ts';
  import { prefetchSheet, type SheetChunk } from './sheetChunks.ts';
  import { sheetTap } from '#lib/ui-state/sheetTiming.ts';
  import { ui } from '#lib/ui-state/ui.svelte.ts';
  import { formatBells, formatNum, t } from '#lib/i18n/index.ts';
  import { myMenuHidden, myMenuOrder, resetMenu, setMenuHidden, setMenuOrder } from '#lib/store/menu.ts';
  import { undoBanner } from '#lib/store/actions.ts';
  import { MENU_LABEL, menuDefaults, moved } from '#lib/ui-state/menuOrder.ts';
  import { cue } from '#lib/sound/cues.ts';
  import type { MenuId } from '#lib/contract/menu.ts';
  import { dismiss } from '../ui/dismiss.ts';
  import type DuePanelT from '../todo/DuePanel.svelte';
  import { chunkUnreachable } from '#lib/ui-state/lazySheet.svelte.ts';
  import { online } from '#lib/ui-state/online.svelte.ts';

  interface Props {
    /** My wallet's balance, the guest's both members' (the ベル row's number). */
    bells: number;
    /** The guest's: each member's wallet, by name (the row shows them, not their sum). */
    each?: readonly { name: string; bells: number }[];
    /** Today's ベル so far, both people (the ベル row's label, and the flash as coins land). */
    today: number;
    /** The panel the ベル row opens is open (its aria-expanded). */
    expanded?: boolean;
    /** The ベル row picked (open the panel on ごほうび), at once. */
    onbells?: () => void;
    /** せってい picked (open せってい), at once. */
    onsettings?: () => void;
    /** The page's timer (cleared with the page). */
    later: (fn: () => void, ms: number) => void;
  }
  let { bells, each, today, expanded = false, onbells, onsettings, later }: Props = $props();

  let open = $state(false);
  /** Edit mode (a long press). */
  let editing = $state(false);
  /** A polite line for VoiceOver: edit mode entered, a pill moved (「旅行：2番目」). */
  let said = $state('');
  let root: HTMLElement | undefined = $state();
  let toggleEl: HTMLButtonElement | undefined = $state();
  let itemsEl: HTMLElement | undefined = $state();

  /** やること's 今日・明日 panel: its chunk (on the leaf's touch-down), and the room left of the pills (their column's
   *  left edge and height, measured while open). Offline with no worker to serve it, not asked for (chunkUnreachable:
   *  WebKit's kept failure would take the sheets sharing its files with it); open, it is once back online. */
  let DuePanel = $state<typeof DuePanelT | null>(null);
  const loadDue = () => void (DuePanel || chunkUnreachable() || import('../todo/DuePanel.svelte').then((m) => (DuePanel = m.default), () => {}));
  let dueBox = $state<{ left: number; h: number } | null>(null);
  // (asked again as the phone comes back online)
  $effect(() => void (open && (online.current, untrack(loadDue))));
  $effect(() => {
    const el = itemsEl;
    if (!open || !el) return;
    const measure = () => (dueBox = { left: el.getBoundingClientRect().left, h: el.offsetHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  });

  /** The bots this phone has (none: demo mode, no ボット pill). */
  const bots = $derived(botTabs());
  // unfolded: every bot's dot read (each at most once a minute)
  $effect(() => {
    if (open) for (const k of bots) untrack(() => void refresh(k, 'bg'));
  });
  /** ボット's dot: the worst bot's, only while one needs a person (coral if any is failing, else yuzu). */
  const botsLook = $derived(worstOf(bots));
  const botsDot = $derived(botsLook ? (botsLook.tone === 'bad' ? 'bad' : 'warn') : null);
  /** The movable pills in this person's order, hidden ones too (ボット among them only on a phone with a bot). */
  const order = $derived(myMenuOrder(bots.length > 0));
  const hidden = $derived(myMenuHidden(bots.length > 0));
  /** The pills drawn: every movable one while editing (the hidden ones dimmed), else the shown ones. */
  const pillIds = $derived(editing ? order : order.filter((id) => !hidden.has(id)));
  const isDefault = $derived(!hidden.size && order.join() === menuDefaults(bots.length > 0).join());

  // a sheet opening (the panel, けんこう, a tree's …) or もようがえ folds it
  $effect(() => {
    if (ui.sheets.length) open = false;
  });
  // folded: out of edit mode
  $effect(() => {
    if (!open) stopEditing();
  });


  // The pill goes inert as it folds, so the sheet it opened gives the focus back to nothing on close (the page's body:
  // a keyboard or VoiceOver user would start again from the top): once that sheet is gone, the leaf takes it. Not by
  // focusing the leaf before the sheet opens: the dialog would give it back by its own focusing steps, which scroll,
  // while the page is still scroll-locked (Chromium then shifted the HUD under the next tap).
  let refocus = false;
  let armed = false;
  $effect(() => {
    const n = ui.sheets.length;
    untrack(() => {
      if (n) {
        armed ||= refocus;
        refocus = false;
      } else if (armed) {
        armed = false;
        // (a beat after the dialog has closed: the sheet leaves the list before its dialog closes, behind a modal the
        // leaf is inert, and WebKit settles the dialog's own focus return after its close event; `close` doesn't
        // bubble, so a capture listener)
        const focus = () => {
          const a = document.activeElement;
          // (nowhere, or still on the closed dialog: WebKit leaves it there a moment before dropping it to the body; a
          // pill while editing is a place of its own)
          const lost = !a || a === document.body || !!a.closest('dialog:not([open])') || (!editing && !!root?.contains(a));
          if (lost && !document.querySelector('dialog[open]')) toggleEl?.focus({ preventScroll: true });
        };
        const back = () => {
          if (document.querySelector('dialog[open]')) return;
          document.removeEventListener('close', back, true);
          later(focus, 0);
        };
        document.addEventListener('close', back, true);
        later(back, 0);
      }
    });
  });

  function pick(go: (() => void) | undefined) {
    if (swallow || editing) return void (swallow = false);
    react('R18');
    open = false;
    refocus = true;
    sheetTap();
    go?.();
  }

  function startEditing() {
    if (editing) return;
    editing = true;
    cue('toggle-on');
    said = t('island.menuEditing');
  }
  function stopEditing() {
    clearPress();
    drag = null;
    editing = false;
  }

  // The long press: held 500 ms without moving 10 px; its click then swallowed (a new press forgets a swallow whose
  // click never came). A movable pill, once held (or touched while editing), follows the finger.
  let press: { x: number; y: number; timer: ReturnType<typeof setTimeout> } | null = null;
  let swallow = false;
  $effect(() => () => clearPress());
  function clearPress() {
    if (press) clearTimeout(press.timer);
    press = null;
  }
  /** The pill being dragged: its index, the finger's y where it sits at rest (its centre plus where it was held), how
   *  far it has gone, the pills' pitch (px), whether it moved past a tap's slop. */
  let drag = $state<{ from: number; y0: number; dy: number; pitch: number; pointer: number; moved: boolean } | null>(null);
  let settle = $state(false);
  /** Where the dragged pill would drop. */
  const to = $derived(drag ? Math.max(0, Math.min(order.length - 1, drag.from + Math.round(drag.dy / drag.pitch))) : -1);
  /** How far pill `i` sits from its place while a drag is on. */
  function shift(i: number): number {
    if (!drag) return 0;
    if (i === drag.from) return drag.dy;
    if (drag.from < to && i > drag.from && i <= to) return -drag.pitch;
    if (drag.from > to && i >= to && i < drag.from) return drag.pitch;
    return 0;
  }

  /** The finger down on a pill (its pointerId), till it lifts. */
  let downOn: number | null = null;
  function down(e: PointerEvent, id: MenuId | null) {
    swallow = false;
    if (e.button > 0 || drag) return;
    downOn = e.pointerId;
    const el = e.currentTarget as HTMLElement, y = e.clientY, pointer = e.pointerId;
    const lift = async () => {
      const i = id ? order.indexOf(id) : -1;
      if (i < 0) return;
      const at = el.getBoundingClientRect(), off = y - (at.top + at.height / 2);
      // (entering edit mode shows the hidden pills: this one may have moved; its rest is measured after that)
      await tick();
      const pills = [...(root?.querySelectorAll<HTMLElement>('[data-menu-pill]') ?? [])];
      if (downOn !== pointer || pills.length < 2 || !el.isConnected) return;
      const r = el.getBoundingClientRect();
      try {
        el.setPointerCapture(pointer);
      } catch {
        /* (a pointer the browser doesn't track: its events still come to this pill) */
      }
      drag = { from: i, y0: r.top + r.height / 2 + off, dy: 0, pitch: pills[1].getBoundingClientRect().top - pills[0].getBoundingClientRect().top, pointer, moved: false };
    };
    if (editing) return void lift();
    clearPress();
    press = { x: e.clientX, y, timer: setTimeout(() => {
      press = null;
      swallow = true;
      startEditing();
      void lift();
    }, 500) };
  }
  function move(e: PointerEvent) {
    if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 10) clearPress();
    if (!drag || e.pointerId !== drag.pointer) return;
    const dy = e.clientY - drag.y0;
    if (Math.abs(dy) > 6) drag.moved = true;
    // (held inside the movable pills: never past 設定)
    drag.dy = Math.max(-drag.from * drag.pitch, Math.min((order.length - 1 - drag.from) * drag.pitch, dy));
  }
  function up(e: PointerEvent) {
    clearPress();
    if (downOn === e.pointerId) downOn = null;
    if (!drag || e.pointerId !== drag.pointer) return;
    const { from, moved: went } = drag, at = to;
    // (the frame after a drop: the pills take their new places without sliding there again)
    settle = true;
    drag = null;
    requestAnimationFrame(() => requestAnimationFrame(() => (settle = false)));
    if (!went) return;
    swallow = true;
    if (at !== from) put(from, at);
  }
  function put(from: number, at: number) {
    const id = order[from];
    setMenuOrder(moved(order, from, at), bots.length > 0);
    cue('tick');
    said = t('island.menuMoved', { name: t(MENU_LABEL[id]), n: at + 1 });
  }
  /** A movable pill tapped: its sheet, or while editing ⊖ / ⊕ (hide or show it; ベル never hides). */
  function tapPill(id: MenuId) {
    if (swallow) return void (swallow = false);
    if (!editing) return pick(OPEN[id]);
    if (id === 'bells') return;
    const hide = !hidden.has(id);
    setMenuHidden(id, hide);
    cue(hide ? 'toggle-off' : 'toggle-on');
  }
  /** ↑ / ↓ on a focused pill while editing: it moves one place (the focus stays on it). */
  function key(e: KeyboardEvent, id: MenuId) {
    const by = e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0, i = order.indexOf(id);
    if (!editing || !by || i + by < 0 || i + by >= order.length) return;
    e.preventDefault();
    put(i, i + by);
    void tick().then(() => root?.querySelector<HTMLElement>(`[data-hud-${id}]`)?.focus({ preventScroll: true }));
  }
  function reset() {
    undoBanner(t('island.menuResetDone'), resetMenu());
    said = '';
  }

  /** Each movable pill's sheet (its chunk is named by its id; ベル's is the panel's). */
  const OPEN: Record<MenuId, () => void> = { bells: () => onbells?.(), travel: () => trips.show(), wedding: () => weddingSheet.show(), hiking: openTrails, places: () => placesSheet.show(), english: () => english.show(), bots: () => botsSheet.show(), todo: () => todoSheet.show() };

  /** A pill touched down: its sheet's chunk on its way before the tap lands. */
  const ahead = (k: SheetChunk) => void prefetchSheet(k);

  /** The ベル the row shows: the wallet less what is still flying in (never down while coins fly; a spend at once). */
  let held = $state(untrack(() => bells));
  const shown = new Tween(untrack(() => held), { duration: 600, easing: cubicOut });
  $effect(() => {
    void bells;
    void coinsInFlight.bells;
    // after this flush: HudCoins' effect for the same sync has set what flies by then
    void tick().then(() => {
      const f = coinsInFlight.bells;
      // coins landing (less in the air than at the last look): today's ベル so far by the leaf (a refund raises the
      // wallet with nothing in flight: no flash)
      if (f < flying) showFlash(Math.max(0, today - f));
      flying = f;
      const to = f > 0 ? Math.max(held, bells - f) : bells;
      if (to === held) return;
      shown.set(to, { duration: to > held ? 600 : 0 });
      held = to;
    });
  });

  /** What was in the air at the last look (a rise after that is coins landing). */
  let flying = 0;
  /** Today's +N as coins land: today's ベル so far (counting up with them), held a moment, then gone (aria-hidden: the
   *  ベル row's label says it). */
  let flash = $state<{ n: number; k: number } | null>(null);
  let flashK = 0;
  function showFlash(n: number) {
    if (n <= 0) return;
    const k = ++flashK;
    flash = { n, k };
    later(() => flash?.k === k && (flash = null), 1_600);
  }
</script>

{#snippet icon(id: MenuId)}
  {#if id === 'travel'}
    <!-- 旅行: a plane in the gear's soft brown, a cream windscreen -->
    <svg viewBox="0 0 24 24" aria-hidden="true"><path class="gear" d="M21.5 16.2v-2.1l-8-5V3.6a1.6 1.6 0 0 0-3.2 0v5.5l-8 5v2.1l8-2.5v5.4l-2 1.5v1.6l3.6-1 3.6 1v-1.6l-2-1.5v-5.4z" /><path class="snow" d="M11.9 4.2a.8.8 0 0 1 .8.8v3.4a.8.8 0 0 1-1.6 0V5a.8.8 0 0 1 .8-.8Z" /></svg>
  {:else if id === 'wedding'}
    <!-- 結婚式: a heart in the gear's soft brown, its shine cream -->
    <svg viewBox="0 0 24 24" aria-hidden="true"><path class="gear" d="m12 21.4-1.5-1.3C5.4 15.4 2 12.3 2 8.5 2 5.4 4.4 3 7.5 3c1.7 0 3.4.8 4.5 2.1C13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.5c0 3.8-3.4 6.9-8.5 11.6z" /><ellipse class="snow" cx="7.2" cy="8.4" rx="1.9" ry="2.8" transform="rotate(-35 7.2 8.4)" /></svg>
  {:else if id === 'hiking'}
    <!-- トレイル: a mountain (none in NH's art) in the gear's soft brown, its snow cream -->
    <svg viewBox="0 0 24 24" aria-hidden="true"><path class="gear" d="M1.8 20.2 8.6 8.4c.4-.7 1.4-.7 1.8 0l2.3 4 2.2-3.2c.4-.6 1.3-.6 1.7 0l5.6 8.4c.5.7 0 1.6-.8 1.6H2.7c-.8 0-1.3-.9-.9-1.6Z" /><path class="snow" d="M7.1 11 8.6 8.4c.4-.7 1.4-.7 1.8 0L12 11.2l-1.6 1-1-1.1-1 1.2Z" /></svg>
  {:else if id === 'places'}
    <!-- 地図: a map pin in the gear's soft brown, its hole cream -->
    <svg viewBox="0 0 24 24" aria-hidden="true"><path class="gear" d="M12 1.8a8 8 0 0 1 8 8c0 5.4-5.6 10.6-7.1 11.9a1.4 1.4 0 0 1-1.8 0C9.6 20.4 4 15.2 4 9.8a8 8 0 0 1 8-8Z" /><circle class="snow" cx="12" cy="9.8" r="3.1" /></svg>
  {:else if id === 'english'}
    <!-- 英語: a speech balloon in the gear's soft brown, three cream dots -->
    <svg viewBox="0 0 24 24" aria-hidden="true"><path class="gear" d="M4.6 3.4h14.8A2.6 2.6 0 0 1 22 6v8.6a2.6 2.6 0 0 1-2.6 2.6H11.2l-5 4.1v-4.1H4.6A2.6 2.6 0 0 1 2 14.6V6a2.6 2.6 0 0 1 2.6-2.6Z" /><circle cx="7.6" cy="10.3" r="1.5" /><circle cx="12" cy="10.3" r="1.5" /><circle cx="16.4" cy="10.3" r="1.5" /></svg>
  {:else if id === 'todo'}
    <!-- やること: a checklist in the gear's soft brown, its ticks and lines cream -->
    <svg viewBox="0 0 24 24" aria-hidden="true"><rect class="gear" x="3" y="2.6" width="18" height="18.8" rx="3.2" /><path class="snow" d="m5.8 9.4 1.3-1.3 1.1 1.1 2.5-2.5 1.3 1.3-3.8 3.8ZM5.8 16.2l1.3-1.3 1.1 1.1 2.5-2.5 1.3 1.3-3.8 3.8Z" /><rect class="snow" x="12.8" y="8" width="5.6" height="2" rx="1" /><rect class="snow" x="12.8" y="14.8" width="5.6" height="2" rx="1" /></svg>
  {:else}
    <!-- ボット: a robot's head in the gear's soft brown, its eyes and mouth cream -->
    <svg viewBox="0 0 24 24" aria-hidden="true"><path class="gear" d="M11.2 3.2h1.6v3.4h-1.6zM12 .6a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4ZM8.4 6.2h7.2a4.4 4.4 0 0 1 4.4 4.4v5.8a4.4 4.4 0 0 1-4.4 4.4H8.4A4.4 4.4 0 0 1 4 16.4v-5.8a4.4 4.4 0 0 1 4.4-4.4ZM1.6 11.6a1 1 0 0 1 1-1H3.4v5.6H2.6a1 1 0 0 1-1-1ZM20.6 10.6h.8a1 1 0 0 1 1 1v3.6a1 1 0 0 1-1 1h-.8Z" /><circle cx="9" cy="12.4" r="1.8" /><circle cx="15" cy="12.4" r="1.8" /><path class="snow" d="M9.6 16.4h4.8a.8.8 0 0 1 0 1.6H9.6a.8.8 0 0 1 0-1.6Z" /></svg>
  {/if}
{/snippet}

{#snippet plus()}
  {#if flash}{#key flash.k}<span class="flash money" data-bells-flash aria-hidden="true">+{formatNum(flash.n)}</span>{/key}{/if}
{/snippet}

<!-- open: a tap outside folds it (it folds whatever the tap lands on; the tap itself goes on), Esc too, the leaf focused;
     while editing, a tap outside or Esc only leaves edit mode (元に戻す's 取り消す on its banner doesn't) -->
<div class="hud-menu" class:open class:editing class:settle bind:this={root}
  {@attach open && dismiss(() => (editing ? stopEditing() : (open = false)), { inside: editing ? '.hud-menu, [data-toast-act]' : undefined, onesc: () => toggleEl?.focus({ preventScroll: true }) })}>
  <button type="button" class="more" bind:this={toggleEl} aria-label={t('island.menu')} aria-expanded={open} aria-controls="hud-menu-items"
    data-hud-menu data-sfx={open ? 'toggle-off' : 'toggle-on'} onpointerdown={loadDue} onclick={() => (open = !open)}>
    <span class="leaf" data-guard onanimationend={(e) => e.currentTarget.classList.remove('catch')}>
      <!-- NH's leaf mark, drawn (NH's art has no flat one): two greens either side of the vein, the stem curled -->
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <g transform="rotate(32 16 15)">
          <path d="M16 25.6c.1 2.4-.9 4.1-2.7 4.4-1.3.2-2-.9-1.2-1.6" fill="none" stroke="#2F7D2B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M16 1.6C24.6 4.6 29.4 12.2 26.4 19.4 24.4 24 20 26.4 16 26.4S7.6 24 5.6 19.4C2.6 12.2 7.4 4.6 16 1.6Z" fill="#43A83B" />
          <path d="M16 1.6C7.4 4.6 2.6 12.2 5.6 19.4 7.6 24 12 26.4 16 26.4 14 18.4 14.2 9.6 16 1.6Z" fill="#94D550" />
          <path d="M16 25.4C14.6 18.6 14.6 11.6 16.3 5" fill="none" stroke="#F0FAD2" stroke-width="1.4" stroke-linecap="round" />
          <path d="M16 1.6C24.6 4.6 29.4 12.2 26.4 19.4 24.4 24 20 26.4 16 26.4S7.6 24 5.6 19.4C2.6 12.2 7.4 4.6 16 1.6Z" fill="none" stroke="#2F7D2B" stroke-width="1.5" stroke-linejoin="round" />
          <ellipse cx="9.6" cy="11.4" rx="1.4" ry="3.2" transform="rotate(20 9.6 11.4)" fill="#fff" opacity=".6" />
        </g>
      </svg>
    </span>
  </button>
  {#if !open}{@render plus()}{/if}
  <div class="items" id="hud-menu-items" role="group" aria-label={t('island.menu')} inert={!open} data-menu-editing={editing || undefined} bind:this={itemsEl}>
    {#each pillIds as id, i (id)}
      {#if id === 'bells'}
        <!-- ベル: the wallet (the coins land on its number), moved like the others but never hidden: no ⊖ -->
        <button type="button" class="item bells" class:lift={drag?.from === i} data-hud-bells data-menu-pill="bells" data-bells={bells} data-today={today}
          aria-haspopup={editing ? undefined : 'dialog'} aria-expanded={editing ? undefined : expanded}
          aria-label={editing ? t('island.bellsRow') : t('island.bells', { bells: each ? each.map((e) => `${e.name} ${formatBells(e.bells)}`).join('、') : formatBells(bells), today: formatBells(today) })}
          aria-describedby={editing ? 'hud-menu-edit-hint' : undefined}
          style:translate={drag ? `0 ${shift(i)}px` : null} style:--i={i}
          data-sfx="self" onpointerdown={(e) => (ahead('panel'), down(e, id))} onpointermove={move} onpointerup={up} onpointercancel={up}
          oncontextmenu={(e) => e.preventDefault()} onkeydown={(e) => key(e, id)} onclick={() => tapPill(id)}>
          <span class="lbl" aria-hidden="true">{t('island.bellsRow')}</span>
          {#if each}
            <!-- the guest's: the two wallets as ごほうび shows them, never their sum -->
            <span class="each" aria-hidden="true" data-hud-bells-each>{#each each as e, j (e.name)}{#if j}<span class="dot-sep">·</span>{/if}<span class="who">{e.name}</span><b class="num money">{formatNum(e.bells)}</b>{/each}</span>
          {:else}
            <b class="num money" aria-hidden="true" onanimationend={(e) => e.currentTarget.classList.remove('catch')}>{formatNum(Math.round(shown.current))}</b>
          {/if}
          {#if open}{@render plus()}{/if}
        </button>
      {:else}
      {@const off = hidden.has(id)}
      <button type="button" class="item" class:off={editing && off} class:lift={drag?.from === i} {...{ [`data-hud-${id}`]: '' }} data-menu-pill={id}
        data-menu-hidden={(editing && off) || undefined} aria-haspopup={editing ? undefined : 'dialog'}
        aria-label={editing ? t(off ? 'island.menuShow' : 'island.menuHide', { name: t(MENU_LABEL[id]) }) : undefined}
        aria-describedby={editing ? 'hud-menu-edit-hint' : undefined}
        style:translate={drag ? `0 ${shift(i)}px` : null} style:--i={i}
        data-sfx="self" onpointerdown={(e) => (editing || ahead(id), down(e, id))} onpointermove={move} onpointerup={up} onpointercancel={up}
        oncontextmenu={(e) => e.preventDefault()} onkeydown={(e) => key(e, id)} onclick={() => tapPill(id)}>
        <span class="lbl">{#if id === 'bots' && botsDot && !editing}<span aria-hidden="true">{t(MENU_LABEL.bots)}</span><span class="sr-only">{t('bots.say', { bot: t(MENU_LABEL.bots), word: t('bots.attention') })}</span>{:else}{t(MENU_LABEL[id])}{/if}</span>
        <span class="ic">
          {@render icon(id)}
          {#if id === 'bots' && botsDot && !editing}<span class="pill-dot" data-hud-bots-dot data-tone={botsDot}><StatusDot tone={botsDot} look /></span>{/if}
        </span>
        {#if editing}
          <!-- ⊖: a tap hides it; ⊕: shows it again -->
          <span class="badge" class:show={off} aria-hidden="true"><svg viewBox="0 0 20 20"><path d={off ? 'M5 10h10M10 5v10' : 'M5 10h10'} /></svg></span>
        {/if}
      </button>
      {/if}
    {/each}
    <button type="button" class="item" data-hud-settings aria-haspopup={editing ? undefined : 'dialog'} aria-disabled={editing || undefined} data-sfx="self"
      onpointerdown={(e) => (ahead('settings'), down(e, null))} onpointermove={move} onpointerup={up} onpointercancel={up} oncontextmenu={(e) => e.preventDefault()}
      onclick={() => pick(onsettings)}>
      <span class="lbl">{t('island.settings')}</span>
      <span class="ic">
        <!-- a gear in the say button's soft brown (no settings icon in NH's art) -->
        <svg viewBox="0 0 24 24" aria-hidden="true"><path class="gear" d="M10.3 2.6h3.4l.5 2.6c.6.2 1.2.5 1.7.9l2.5-.9 1.7 2.9-2 1.7c.1.6.1 1.3 0 1.9l2 1.7-1.7 2.9-2.5-.9c-.5.4-1.1.7-1.7.9l-.5 2.6h-3.4l-.5-2.6c-.6-.2-1.2-.5-1.7-.9l-2.5.9-1.7-2.9 2-1.7c-.1-.6-.1-1.3 0-1.9l-2-1.7 1.7-2.9 2.5.9c.5-.4 1.1-.7 1.7-.9z" transform="translate(0 1)" /><circle cx="12" cy="13" r="3.2" /></svg>
      </span>
    </button>
    {#if editing}
      <!-- edit mode's foot: 元に戻す (only off the default) and 完了 -->
      <div class="edit-foot">
        {#if !isDefault}<button type="button" class="chip-btn" data-menu-reset data-sfx="tick" onclick={reset}>{t('island.menuReset')}</button>{/if}
        <button type="button" class="chip-btn done" data-menu-done data-sfx="toggle-off" onclick={stopEditing}>{t('island.menuDone')}</button>
      </div>
      <p class="sr-only" id="hud-menu-edit-hint">{t('island.menuEditHint')}</p>
    {/if}
    {#if open && !editing && DuePanel && dueBox && pillIds.includes('todo')}
      <DuePanel maxH={dueBox.h} width="calc({dueBox.left - 12}px - max(14px, var(--safe-left)))" onopen={pick} />
    {/if}
  </div>
  <p class="sr-only" aria-live="polite">{said}</p>
</div>

<style>
  /* The toggle: a 44px cream disc with the cream lip, the dumbbell pill's full height (the dumbbell's
     cream), NH's leaf in it. Open: the disc NH's yellow, the leaf tipped as if it flicked the menu down. */
  .hud-menu { position: relative; flex: none; width: var(--hit); height: var(--hit); }
  .more {
    position: relative; width: var(--hit); height: var(--hit); margin: 0; padding: 0; display: grid; place-items: center;
    appearance: none; border: 0; background: none; cursor: pointer; color: var(--c-ink);
    -webkit-tap-highlight-color: transparent; touch-action: manipulation;
  }
  .more::before {
    content: ''; position: absolute; inset: 0; border-radius: 50%; background: var(--c-cream);
    box-shadow: 0 var(--lip-h) 0 var(--c-lip); transition: background-color 180ms var(--ease-soft), translate 120ms, box-shadow 120ms;
  }
  .more:active::before { translate: 0 2px; box-shadow: 0 2px 0 var(--c-lip); }
  .open .more::before { background: var(--c-yuzu); box-shadow: 0 var(--lip-h) 0 var(--c-yuzu-lip); }
  .more:focus-visible { outline: none; }
  .more:focus-visible::before { outline: 3px solid var(--focus); outline-offset: 2px; }
  .leaf {
    position: relative; width: 28px; height: 28px; display: flex; pointer-events: none;
    filter: drop-shadow(0 1px 0 rgb(0 0 0 / .12)); transition: transform 320ms var(--ease-bounce);
  }
  .leaf svg { width: 100%; height: 100%; }
  .more:active .leaf { transform: scale(.88); transition-duration: 80ms; }
  .open .leaf { transform: rotate(-40deg) scale(1.06); }
  /* a coin lands in it (HudCoins): the leaf's (or, open, the ベル number's) small catch squash */
  .leaf:global(.catch), .num:global(.catch) { animation: catch 260ms var(--ease-bounce); }
  @keyframes catch { 0%, 100% { transform: none; } 40% { transform: scale(1.14, .86); } }

  /* The pills: a column hanging under the toggle, right-aligned to its right edge (the screen's side: the sky under
     the cluster; the row's box, which the 3D island measures, stays the row: the column is out of flow), each a 44px
     cream pill with the lip, its name and its icon (the ベル row: its name and its number). They show at once on a tap
     (the user: the drop was too slow) and fold away in a quick fade; all as wide as the longest (the name left, the
     icon or number right); folded they are hidden and take no room (visibility and scale(0), after the fade:
     the say picker and the balloons keep clear of the shown pills only). */
  .items {
    position: absolute; right: 0; top: calc(100% + 8px); display: grid; gap: 10px; width: max-content;
    pointer-events: none;
  }
  .item {
    position: relative; display: flex; align-items: center; justify-content: space-between; gap: 10px; height: var(--hit); margin: 0; padding: 0 4px 0 14px;
    appearance: none; border: 0; border-radius: var(--r-pill); cursor: pointer; white-space: nowrap;
    background: var(--c-cream); color: var(--c-ink); box-shadow: 0 var(--lip-h) 0 var(--c-lip), 0 6px 14px rgb(60 40 20 / .14);
    font: 700 var(--fs-body)/1 var(--font-ui); -webkit-tap-highlight-color: transparent;
    /* (none: a held pill's drag never scrolls or zooms anything; a tap is still a click) */
    touch-action: none; -webkit-touch-callout: none;
    opacity: 0; visibility: hidden; transform: scale(0);
    transition: opacity 100ms linear, visibility 0s linear 100ms, transform 0s linear 100ms;
  }
  .open .item { opacity: 1; visibility: visible; transform: none; pointer-events: auto; transition: none; }
  .open .item:active { transform: translateY(2px) scale(.97); box-shadow: 0 2px 0 var(--c-lip); transition: transform 80ms var(--ease-squash), box-shadow 80ms; }
  .lbl { letter-spacing: .02em; }

  /* Edit mode: the movable pills jiggle (iOS's home screen; each a beat apart), a ⊖ on the corner (a coral disc) or,
     hidden, sunk and dimmed with a dashed edge and a ⊕ (the leaf's); 設定 holds still, soft (fixed); the dragged one lifts
     over the others and follows the finger (no easing), the others stepping aside. A drag is `translate`, the jiggle
     `rotate`: the press squash's `transform` stays its own. */
  .editing .item:active { transform: none; box-shadow: 0 var(--lip-h) 0 var(--c-lip), 0 6px 14px rgb(60 40 20 / .14); }
  .editing .item[data-menu-pill] { animation: jiggle 280ms ease-in-out infinite alternate; animation-delay: calc(var(--i) * -70ms); transition: translate 160ms var(--ease-soft); }
  .editing .item[aria-disabled] .lbl { opacity: .6; }
  .settle .item[data-menu-pill] { transition: none; }
  @keyframes jiggle { from { rotate: -1.4deg; } to { rotate: 1.4deg; } }
  .editing .item.off { background: color-mix(in srgb, var(--c-cream) 70%, var(--c-lip)); box-shadow: none; outline: 2px dashed var(--c-lip); outline-offset: -2px; }
  .editing .item.off :is(.lbl, .ic) { opacity: .45; }
  .editing .item.lift { z-index: 2; animation: none; scale: 1.05; transition: none; box-shadow: 0 var(--lip-h) 0 var(--c-lip), 0 12px 24px rgb(60 40 20 / .28); }
  .badge {
    position: absolute; left: -7px; top: -7px; width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center;
    background: var(--c-coral); box-shadow: 0 2px 0 var(--c-coral-text), 0 0 0 2px var(--c-cream); pointer-events: none;
  }
  .badge.show { background: var(--c-leaf); box-shadow: 0 2px 0 var(--c-leaf-edge), 0 0 0 2px var(--c-cream); }
  .badge svg { width: 14px; height: 14px; fill: none; stroke: var(--c-cream); stroke-width: 3; stroke-linecap: round; }
  /* (contain: its row, 元に戻す + 完了, never sizes the column: wider than the pills, it spills left, the pills stay put) */
  .edit-foot { display: flex; justify-content: flex-end; gap: 8px; margin-top: 2px; pointer-events: auto; contain: inline-size; }
  .chip-btn {
    height: var(--hit); padding: 0 16px; margin: 0; appearance: none; border: 0; border-radius: var(--r-pill); cursor: pointer; white-space: nowrap;
    background: var(--c-cream); color: var(--c-ink); box-shadow: 0 var(--lip-h) 0 var(--c-lip), 0 6px 14px rgb(60 40 20 / .14);
    font: 700 var(--fs-body)/1 var(--font-ui); -webkit-tap-highlight-color: transparent;
  }
  .chip-btn.done { background: var(--c-yuzu); box-shadow: 0 var(--lip-h) 0 var(--c-yuzu-lip), 0 6px 14px rgb(60 40 20 / .14); }
  .chip-btn:active { translate: 0 2px; box-shadow: 0 2px 0 var(--c-lip); }
  .chip-btn.done:active { box-shadow: 0 2px 0 var(--c-yuzu-lip); }
  .ic { position: relative; flex: none; width: 36px; height: 36px; display: grid; place-items: center; line-height: 0; }
  /* ボット's: a bot needs a person (bots/StatusDot, ringed in the pill's cream) */
  .pill-dot { position: absolute; top: 0; right: 0; display: flex; line-height: 0; pointer-events: none; --plate: var(--c-cream); }
  .ic svg { width: 26px; height: 26px; }
  .gear { fill: #A88B68; }
  .snow { fill: var(--c-cream); }
  circle { fill: var(--c-cream); }
  /* the ベル row: no icon; the balance where the others' icons are, in the money font, centred in the icons' column */
  .bells { padding-right: 14px; }
  .num { display: inline-block; font: 700 var(--fs-talk)/1 var(--font-num); font-variant-numeric: tabular-nums; letter-spacing: .01em; transform-origin: 50% 70%; }
  .each { display: inline-flex; align-items: baseline; gap: 4px; white-space: nowrap; }
  .each .who { font-size: var(--fs-s); }
  .each .dot-sep { margin: 0 2px; opacity: .6; }

  /* today's +N as coins land: a small yuzu bubble just under the leaf (folded), right-aligned to the screen's side, or
     left of the ベル row (open), popping in, rising a little, fading */
  .flash {
    position: absolute; right: 0; top: calc(100% + 10px); z-index: 1; pointer-events: none;
    padding: 3px 8px 2px; border-radius: var(--r-pill); white-space: nowrap;
    background: var(--c-yuzu); color: var(--c-ink); box-shadow: 0 2px 0 var(--c-yuzu-lip);
    font: 700 var(--fs-s)/1.1 var(--font-num); font-variant-numeric: tabular-nums;
    animation: flash 1.6s var(--ease-soft) both;
  }
  .bells .flash { right: calc(100% + 8px); top: 50%; margin-top: -10px; }
  @keyframes flash {
    0% { opacity: 0; transform: translateY(6px) scale(.6); }
    12% { opacity: 1; transform: translateY(0) scale(1.08); }
    20%, 70% { opacity: 1; transform: translateY(0) scale(1); }
    100% { opacity: 0; transform: translateY(-8px) scale(1); }
  }

</style>
