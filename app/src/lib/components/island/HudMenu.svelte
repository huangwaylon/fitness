<script lang="ts">
  // The HUD menu, the cluster's right end (docs/design.md "Island"): a small round cream button with NH's leaf (the
  // toggle; aria-expanded) that drops seven pills down under it, right-aligned, one after the other on a small spring:
  // 「ベル 121」 (the shared wallet's balance, no icon: the number is the picture) → the panel (ごほうび), ずかん (NH's
  // agrias butterfly), ききみみ with its small えいご (しずえ's head: ききみみ's sheet opened here, the voice session begun in the
  // tap itself; 「さそわれています！」 on it, and a dot on the leaf, while someone's invite is live), りょこう (Orville's
  // head: the trips' sheet, travel/open.svelte.ts), けっこんしき (パニエル's
  // head: the wedding board, its sheet opened here: components/wedding), トレイル (a mountain: the hiking trails,
  // hiking/open.svelte.ts) and せってい (a gear);
  // no かいがら: the shop is the building. Folded by default: the sky keeps only the dumbbell, the bowl and the leaf.
  // It folds again on a second tap of the leaf, a tap anywhere else (that tap still goes where it was aimed), Esc, a
  // sheet opening, or a pick (a pill: a press squash, the villagers glance up at it (R18), then its sheet grows out of
  // it, Sheet's `pop`). Folded, the pills are hidden and inert (no taps, no focus, out of placement.ts' guards).
  // The goals' coins fly into it (HudCoins): into the leaf while it's folded, into the ベル row's number while it's
  // open; the number holds while they are in the air and counts up as each lands, and today's +N flashes by where
  // they land (a yuzu bubble that fades: earnings only, never a とりけす's refund).
  //   <HudMenu bells={…} today={…} expanded={panelOpen} onbells={() => …} onzukan={() => …} onsettings={() => …} {later} />
  import { tick, untrack } from 'svelte';
  import { Tween } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import Host from '../characters/Host.svelte';
  import { invitedNow, openQuiz, wakeQuizVoice } from '../kikimimi/invite.svelte.ts';
  import { trips } from '../travel/open.svelte.ts';
  import { weddingSheet } from '../wedding/open.svelte.ts';
  import { openTrails } from '../hiking/open.svelte.ts';
  import { coinsInFlight } from './HudCoins.svelte';
  import { react } from '../motion/director.svelte.ts';
  import { popFrom } from './popFrom.ts';
  import { ui } from '#lib/ui-state/ui.svelte.ts';
  import { formatBells, formatNum, t } from '#lib/i18n/index.ts';

  interface Props {
    /** The shared wallet's balance (the ベル row's number). */
    bells: number;
    /** Today's ベル so far, both people (the ベル row's label, and the flash as coins land). */
    today: number;
    /** The panel the ベル row opens is open (its aria-expanded). */
    expanded?: boolean;
    /** The ベル row picked (open the panel on ごほうび), after the press beat. */
    onbells?: () => void;
    /** ずかん picked (open the ずかん), after the press beat. */
    onzukan?: () => void;
    /** せってい picked (open せってい), after the press beat. */
    onsettings?: () => void;
    /** The page's timer (cleared with the page). */
    later: (fn: () => void, ms: number) => void;
  }
  let { bells, today, expanded = false, onbells, onzukan, onsettings, later }: Props = $props();

  let open = $state(false);
  /** Someone's ききみみ invite is live. */
  const invited = $derived(invitedNow());
  let root: HTMLElement | undefined = $state();
  let toggleEl: HTMLButtonElement | undefined = $state();

  // a sheet opening (the panel, けんこう, a tree's …) or もようがえ folds it
  $effect(() => {
    if (ui.sheets.length || ui.decorating) open = false;
  });

  // open: a tap outside folds it (capture, so it folds whatever the tap lands on; the tap itself goes on), Esc too
  $effect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => {
      if (!(e.target instanceof Node) || !root?.contains(e.target)) open = false;
    };
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      open = false;
      toggleEl?.focus({ preventScroll: true });
    };
    document.addEventListener('pointerdown', down, true);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('pointerdown', down, true);
      document.removeEventListener('keydown', key);
    };
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
          // (nowhere, or still on the closed dialog: WebKit leaves it there a moment before dropping it to the body)
          const lost = !a || a === document.body || !!a.closest('dialog:not([open])') || !!root?.contains(a);
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

  function pick(e: MouseEvent, go: (() => void) | undefined) {
    const el = e.currentTarget as HTMLElement;
    popFrom(el.querySelector('.ic') ?? el);
    react('R18');
    open = false;
    refocus = true;
    later(() => go?.(), 90);
  }

  /** The ベル the row shows: the wallet less what is still flying in (never down while coins fly; a spend at once). */
  // svelte-ignore state_referenced_locally
  let held = $state(bells);
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

{#snippet plus()}
  {#if flash}{#key flash.k}<span class="flash money" data-bells-flash aria-hidden="true">+{formatNum(flash.n)}</span>{/key}{/if}
{/snippet}

<div class="hud-menu" class:open bind:this={root}>
  <button type="button" class="more" bind:this={toggleEl} aria-label={t('island.menu')} aria-expanded={open} aria-controls="hud-menu-items"
    data-hud-menu data-sfx={open ? 'toggle-off' : 'toggle-on'} onclick={() => (open = !open)}>
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
    {#if invited && !open}<span class="dot" data-hud-invited aria-hidden="true"></span>{/if}
  </button>
  {#if !open}{@render plus()}{/if}
  <div class="items" id="hud-menu-items" role="group" aria-label={t('island.menu')} inert={!open}>
    <button type="button" class="item bells" style="--i: 0" data-hud-bells data-bells={bells} data-today={today} aria-haspopup="dialog" aria-expanded={expanded}
      aria-label={t('island.bells', { bells: formatBells(bells), today: formatBells(today) })} data-sfx="self" onclick={(e) => pick(e, onbells)}>
      <span class="lbl" aria-hidden="true">{t('island.bellsRow')}</span>
      <b class="num money" aria-hidden="true" onanimationend={(e) => e.currentTarget.classList.remove('catch')}>{formatNum(Math.round(shown.current))}</b>
      {#if open}{@render plus()}{/if}
    </button>
    <button type="button" class="item" style="--i: 1" data-hud-zukan aria-haspopup="dialog" data-sfx="self" onclick={(e) => pick(e, onzukan)}>
      <span class="lbl">{t('zukan.title')}</span>
      <span class="ic"><OfficialArt key="critters/agrias-butterfly" size={30} eager /></span>
    </button>
    <!-- the voice session begins in the tap itself (iOS: the clips play with the silent switch on), the sheet after the beat -->
    <button type="button" class="item" style="--i: 2" data-hud-kikimimi aria-haspopup="dialog" data-sfx="self"
      onclick={(e) => (wakeQuizVoice(), pick(e, () => openQuiz()))}>
      <span class="lbl">{t('panel.kikimimi')}{#if invited}<small class="invited" data-hud-kikimimi-invited>{t('panel.kikimimiInvited')}</small>{:else}<small class="sub">{t('panel.kikimimiSub')}</small>{/if}</span>
      <span class="ic"><Host head size={30} animate={false} eager /></span>
    </button>
    <!-- りょこう: the trips (Orville's head on the pill only) -->
    <button type="button" class="item" style="--i: 3" data-hud-travel aria-haspopup="dialog" data-sfx="self" onclick={(e) => pick(e, () => trips.show())}>
      <span class="lbl">{t('panel.travel')}</span>
      <span class="ic"><OfficialArt key="villagers/orville-icon" size={30} eager /></span>
    </button>
    <!-- けっこんしき: the wedding board (Harvey's head on the pill only) -->
    <button type="button" class="item" style="--i: 4" data-hud-wedding aria-haspopup="dialog" data-sfx="self" onclick={(e) => pick(e, () => weddingSheet.show())}>
      <span class="lbl">{t('panel.wedding')}</span>
      <span class="ic"><OfficialArt key="villagers/harvey-icon" size={30} eager /></span>
    </button>
    <!-- トレイル: the hiking trails (no mountain in NH's art: drawn in the gear's soft brown, its snow cream) -->
    <button type="button" class="item" style="--i: 5" data-hud-hiking aria-haspopup="dialog" data-sfx="self" onclick={(e) => pick(e, openTrails)}>
      <span class="lbl">{t('panel.hiking')}</span>
      <span class="ic">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path class="gear" d="M1.8 20.2 8.6 8.4c.4-.7 1.4-.7 1.8 0l2.3 4 2.2-3.2c.4-.6 1.3-.6 1.7 0l5.6 8.4c.5.7 0 1.6-.8 1.6H2.7c-.8 0-1.3-.9-.9-1.6Z" /><path class="snow" d="M7.1 11 8.6 8.4c.4-.7 1.4-.7 1.8 0L12 11.2l-1.6 1-1-1.1-1 1.2Z" /></svg>
      </span>
    </button>
    <button type="button" class="item" style="--i: 6" data-hud-settings aria-haspopup="dialog" data-sfx="self" onclick={(e) => pick(e, onsettings)}>
      <span class="lbl">{t('island.settings')}</span>
      <span class="ic">
        <!-- a gear in the say button's soft brown (no settings icon in NH's art) -->
        <svg viewBox="0 0 24 24" aria-hidden="true"><path class="gear" d="M10.3 2.6h3.4l.5 2.6c.6.2 1.2.5 1.7.9l2.5-.9 1.7 2.9-2 1.7c.1.6.1 1.3 0 1.9l2 1.7-1.7 2.9-2.5-.9c-.5.4-1.1.7-1.7.9l-.5 2.6h-3.4l-.5-2.6c-.6-.2-1.2-.5-1.7-.9l-2.5.9-1.7-2.9 2-1.7c-.1-.6-.1-1.3 0-1.9l-2-1.7 1.7-2.9 2.5.9c.5-.4 1.1-.7 1.7-.9z" transform="translate(0 1)" /><circle cx="12" cy="13" r="3.2" /></svg>
      </span>
    </button>
  </div>
</div>

<style>
  /* The toggle: 44px to the thumb, a 40px cream disc with the cream lip to the eye (the bowl's and the dumbbell's
     cream), NH's leaf in it. Open: the disc NH's yellow, the leaf tipped as if it flicked the menu down. */
  .hud-menu { position: relative; flex: none; width: var(--hit); height: var(--hit); }
  .more {
    position: relative; width: var(--hit); height: var(--hit); margin: 0; padding: 0; display: grid; place-items: center;
    appearance: none; border: 0; background: none; cursor: pointer; color: var(--c-ink);
    -webkit-tap-highlight-color: transparent; touch-action: manipulation;
  }
  .more::before {
    content: ''; position: absolute; inset: 2px 2px 4px; border-radius: 50%; background: var(--c-cream);
    box-shadow: 0 var(--lip-h) 0 var(--c-lip); transition: background-color 180ms var(--ease-soft), translate 120ms, box-shadow 120ms;
  }
  .more:active::before { translate: 0 2px; box-shadow: 0 2px 0 var(--c-lip); }
  .open .more::before { background: var(--c-yuzu); box-shadow: 0 var(--lip-h) 0 var(--c-yuzu-lip); }
  .more:focus-visible { outline: none; }
  .more:focus-visible::before { outline: 3px solid var(--focus); outline-offset: 2px; }
  .leaf {
    position: relative; width: 26px; height: 26px; margin-top: -2px; display: flex; pointer-events: none;
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
     cream pill with the lip, its name and its icon (the ベル row: its name and its number). They drop out of the leaf
     one after the other on a small spring (NH's bounce), and fold back up into it quicker, the last first; all as wide
     as the longest (the name left, the icon or number right); folded they are hidden (visibility, after the fold). */
  .items {
    position: absolute; right: 0; top: calc(100% + 8px); display: grid; gap: 10px; width: max-content;
    pointer-events: none;
  }
  .item {
    --n: 7;
    position: relative; display: flex; align-items: center; justify-content: space-between; gap: 10px; height: var(--hit); margin: 0; padding: 0 4px 0 14px;
    appearance: none; border: 0; border-radius: var(--r-pill); cursor: pointer; white-space: nowrap;
    background: var(--c-cream); color: var(--c-ink); box-shadow: 0 var(--lip-h) 0 var(--c-lip), 0 6px 14px rgb(60 40 20 / .14);
    font: 700 var(--fs-body)/1 var(--font-ui); -webkit-tap-highlight-color: transparent; touch-action: manipulation;
    transform-origin: calc(100% - 22px) -30px;
    opacity: 0; visibility: hidden; transform: translateY(calc(-14px - var(--i) * 40px)) scale(.4);
    transition: transform 160ms var(--ease-squash) calc((var(--n) - 1 - var(--i)) * 30ms), opacity 120ms linear calc((var(--n) - 1 - var(--i)) * 30ms),
      visibility 0s linear calc((var(--n) - 1) * 30ms + 160ms);
  }
  .open .item {
    opacity: 1; visibility: visible; transform: none; pointer-events: auto;
    transition: transform 380ms var(--ease-bounce) calc(var(--i) * 55ms), opacity 140ms linear calc(var(--i) * 55ms), visibility 0s;
  }
  .open .item:active { transform: translateY(2px) scale(.97); box-shadow: 0 2px 0 var(--c-lip); transition: transform 80ms var(--ease-squash), box-shadow 80ms; }
  .item:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .lbl { letter-spacing: .02em; }
  .invited, .sub { display: block; margin-top: 3px; font-size: var(--fs-xs); color: var(--c-coral-text); }
  .sub { color: var(--text-soft); }
  /* an invite waiting (the leaf folded): a small coral dot on its rim */
  .dot {
    position: absolute; top: 3px; right: 3px; width: 10px; height: 10px; border-radius: 50%; pointer-events: none;
    background: var(--c-coral); box-shadow: 0 0 0 2px var(--c-cream);
  }
  .ic { flex: none; width: 36px; height: 36px; display: grid; place-items: center; line-height: 0; }
  .ic svg { width: 26px; height: 26px; }
  .gear { fill: #A88B68; }
  .snow { fill: var(--c-cream); }
  circle { fill: var(--c-cream); }
  /* the ベル row: no icon; the balance where the others' icons are, in the money font, centred in the icons' column */
  .bells { padding-right: 14px; }
  .num { display: inline-block; font: 700 var(--fs-talk)/1 var(--font-num); font-variant-numeric: tabular-nums; letter-spacing: .01em; transform-origin: 50% 70%; }

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

  /* reduced motion: no drop, no tip: the pills fade in and out where they stand, the flash only fades */
  @media (prefers-reduced-motion: reduce) {
    .leaf, .open .leaf { transform: none; transition: none; }
    .item { transform: none; transition: opacity 120ms linear, visibility 0s linear 120ms; }
    .open .item { transform: none; transition: opacity 120ms linear, visibility 0s; }
    .flash { animation-name: flash-still; }
    @keyframes flash-still { 0% { opacity: 0; } 10%, 70% { opacity: 1; } 100% { opacity: 0; } }
  }
</style>
