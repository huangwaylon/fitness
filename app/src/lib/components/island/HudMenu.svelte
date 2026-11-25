<script lang="ts">
  // The HUD menu, the cluster's right end (docs/design.md "Island" Menu): a 44px cream disc with NH's leaf (the toggle;
  // aria-expanded) that drops a cream card under it: a fixed grid of coloured tiles (ui-state/menuGrid.ts, the user's
  // B1 of 2026-11-25), the same for everyone, three rows under small labels: 毎日 (やること, 英語, ベル), お出かけ (旅行,
  // 地図, 登山), ほか (結婚式, ボット, 設定). Each tile its own hue (tokens.css --tile-*), a white line icon, its name
  // under it in kanji. ベル (my wallet; the guest's 0) shows its number under its name and opens the panel
  // (ごほうび); ボット (a phone with a bot, the guest's too) carries the worst bot's 「!」 while one needs a person (every bot
  // read as the menu unfolds: bots/summary.svelte.ts); 英語 a calm dot while today's study isn't done. No todo count:
  // the HUD's own todo disc has it.
  // Folded by default; it folds again on a second tap of the leaf, a tap anywhere else (that tap still goes where it
  // was aimed), Esc, a sheet opening, or a pick (a press squash, the villagers glance up at it (R18), its sheet opens at
  // once, its chunk fetched from the touch-down). Folded, the card is hidden and inert. Shown at once, folded in a
  // quick fade; nothing runs per frame.
  // The goals' coins fly into the leaf while it's folded, into ベル's number while it's open; the number holds while
  // they are in the air and counts up as each lands, today's +N flashing by where they land (earnings only).
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
  import { week } from '#lib/store/week.svelte.ts';
  import { localDateAt } from '#lib/time/dates.ts';
  import { englishDue } from '#lib/english/due.ts';
  import { coinsInFlight } from './HudCoins.svelte';
  import { react } from '../motion/director.svelte.ts';
  import { prefetchSheet, type SheetChunk } from './sheetChunks.ts';
  import { sheetTap } from '#lib/ui-state/sheetTiming.ts';
  import { ui } from '#lib/ui-state/ui.svelte.ts';
  import { formatBells, formatNum, t } from '#lib/i18n/index.ts';
  import { GROUP_LABEL, MENU_LABEL, menuGrid, type MenuItem } from '#lib/ui-state/menuGrid.ts';
  import { dismiss } from '../ui/dismiss.ts';

  interface Props {
    /** My wallet's balance (ベル's number; the guest's 0). */
    bells: number;
    /** Today's ベル so far, both people (ベル's label, and the flash as coins land). */
    today: number;
    /** The panel ベル opens is open (its aria-expanded). */
    expanded?: boolean;
    /** ベル picked (open the panel on ごほうび), at once. */
    onbells?: () => void;
    /** 設定 picked (open 設定), at once. */
    onsettings?: () => void;
    /** The page's timer (cleared with the page). */
    later: (fn: () => void, ms: number) => void;
  }
  let { bells, today, expanded = false, onbells, onsettings, later }: Props = $props();

  let open = $state(false);
  let root: HTMLElement | undefined = $state();
  let toggleEl: HTMLButtonElement | undefined = $state();

  /** The bots this phone has (none: demo mode, no ボット tile). */
  const bots = $derived(botTabs());
  const grid = $derived(menuGrid(bots.length > 0));
  // unfolded: every bot's dot read (each at most once a minute)
  $effect(() => {
    if (open) for (const k of bots) untrack(() => void refresh(k, 'bg'));
  });
  /** ボット's 「!」: the worst bot's, only while one needs a person (coral if any is failing, else yuzu). */
  const botsLook = $derived(worstOf(bots));
  const botsDot = $derived(botsLook ? (botsLook.tone === 'bad' ? 'bad' : 'warn') : null);
  /** 英語's dot (lib/english/due.ts): a calm leaf one while today's study isn't done and the week isn't at 3 days. */
  const englishDot = $derived.by(() => {
    const m = week.model;
    return !!m && englishDue(m.state.listen ?? [], m.me, localDateAt(m.now));
  });

  // a sheet opening (the panel, けんこう, a tree's …) or もようがえ folds it
  $effect(() => {
    if (ui.sheets.length) open = false;
  });

  // The tile goes inert as it folds, so the sheet it opened gives the focus back to nothing on close (the page's body:
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
          // (nowhere, or still on the closed dialog: WebKit leaves it there a moment before dropping it to the body; or a
          // folded tile)
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

  /** Each tile's sheet (its chunk is named by its id; ベル's is the panel's). */
  const OPEN: Record<MenuItem, () => void> = {
    todo: () => todoSheet.show(), english: () => english.show(), bells: () => onbells?.(), travel: () => trips.show(), places: () => placesSheet.show(),
    hiking: openTrails, wedding: () => weddingSheet.show(), bots: () => botsSheet.show(), settings: () => onsettings?.()
  };
  const CHUNK: Record<MenuItem, SheetChunk> = { todo: 'todo', english: 'english', bells: 'panel', travel: 'travel', places: 'places', hiking: 'hiking', wedding: 'wedding', bots: 'bots', settings: 'settings' };

  /** A tile touched down: its sheet's chunk on its way before the tap lands. */
  const ahead = (k: SheetChunk) => void prefetchSheet(k);

  function pick(id: MenuItem) {
    react('R18');
    open = false;
    refocus = true;
    sheetTap();
    OPEN[id]();
  }

  /** The ベル the tile shows: the wallet less what is still flying in (never down while coins fly; a spend at once). */
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
   *  ベル tile's label says it). */
  let flash = $state<{ n: number; k: number } | null>(null);
  let flashK = 0;
  function showFlash(n: number) {
    if (n <= 0) return;
    const k = ++flashK;
    flash = { n, k };
    later(() => flash?.k === k && (flash = null), 1_600);
  }
</script>

{#snippet icon(id: MenuItem)}
  <!-- a 24-grid line icon, 2px strokes, round ends (white; ink on ベル's gold) -->
  <svg viewBox="0 0 24 24" aria-hidden="true">
    {#if id === 'todo'}
      <rect x="4" y="3" width="16" height="18" rx="3" /><path d="m7.5 9.2 1.6 1.6 2.6-2.8M7.5 15.2l1.6 1.6 2.6-2.8M14.5 9.8h2.5M14.5 15.8h2.5" />
    {:else if id === 'english'}
      <path d="M5.5 4h13A2.5 2.5 0 0 1 21 6.5v8a2.5 2.5 0 0 1-2.5 2.5H12l-5 4v-4H5.5A2.5 2.5 0 0 1 3 14.5v-8A2.5 2.5 0 0 1 5.5 4Z" /><path d="m9 14 3-7 3 7M10.2 11.4h3.6" />
    {:else if id === 'bells'}
      <path d="M9 3h6l-1.6 3.6h-2.8Z" /><path d="M12 6.8c4.6 0 8 4.1 8 8.1 0 3.6-3 5.6-8 5.6s-8-2-8-5.6c0-4 3.4-8.1 8-8.1Z" /><path d="M12 10.5c-1.5 0-2.4 1.2-2.4 2.6v1.6l-1 1.1h6.8l-1-1.1v-1.6c0-1.4-.9-2.6-2.4-2.6ZM11 17.6h2" />
    {:else if id === 'travel'}
      <path d="M12 2.8c.9 0 1.5.8 1.5 1.8v4.7l7 4.2v2l-7-2.2v4.4l2 1.6V21l-3.5-1-3.5 1v-1.7l2-1.6v-4.4l-7 2.2v-2l7-4.2V4.6c0-1 .6-1.8 1.5-1.8Z" />
    {:else if id === 'places'}
      <path d="M12 21s-7-6.1-7-11.4a7 7 0 0 1 14 0C19 14.9 12 21 12 21Z" /><circle cx="12" cy="9.6" r="2.6" />
    {:else if id === 'hiking'}
      <path d="M2.5 19.5 9 8.5l3.6 6.1 2.6-3.6 6.3 8.5Z" /><path d="m6.6 12.6 1.5 1 1.1-1 1.2 1" />
    {:else if id === 'wedding'}
      <path d="M12 20s-8-4.8-8-10.6A4.4 4.4 0 0 1 8.4 5 4.6 4.6 0 0 1 12 6.9 4.6 4.6 0 0 1 15.6 5 4.4 4.4 0 0 1 20 9.4C20 15.2 12 20 12 20Z" />
    {:else if id === 'bots'}
      <rect x="5" y="8" width="14" height="11" rx="3.2" /><path d="M12 8V5.4M3 12.2v3.6M21 12.2v3.6M10 16h4" /><circle cx="12" cy="4.2" r="1.2" /><circle class="eye" cx="9.4" cy="12.6" r="1.1" /><circle class="eye" cx="14.6" cy="12.6" r="1.1" />
    {:else}
      <path d="M10.3 2.6h3.4l.5 2.6c.6.2 1.2.5 1.7.9l2.5-.9 1.7 2.9-2 1.7c.1.6.1 1.3 0 1.9l2 1.7-1.7 2.9-2.5-.9c-.5.4-1.1.7-1.7.9l-.5 2.6h-3.4l-.5-2.6c-.6-.2-1.2-.5-1.7-.9l-2.5.9-1.7-2.9 2-1.7c-.1-.6-.1-1.3 0-1.9l-2-1.7 1.7-2.9 2.5.9c.5-.4 1.1-.7 1.7-.9Z" transform="translate(0 -1)" /><circle cx="12" cy="12" r="3" />
    {/if}
  </svg>
{/snippet}

{#snippet plus()}
  {#if flash}{#key flash.k}<span class="flash money" data-bells-flash aria-hidden="true">+{formatNum(flash.n)}</span>{/key}{/if}
{/snippet}

<!-- open: a tap outside folds it (the tap itself goes on), Esc too, the leaf focused -->
<div class="hud-menu" class:open bind:this={root} {@attach open && dismiss(() => (open = false), { onesc: () => toggleEl?.focus({ preventScroll: true }) })}>
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
  </button>
  {#if !open}{@render plus()}{/if}
  <div class="items" id="hud-menu-items" role="group" aria-label={t('island.menu')} inert={!open}>
    {#each grid as g (g.id)}
      <p class="grp" id="hud-menu-{g.id}" aria-hidden="true">{t(GROUP_LABEL[g.id])}</p>
      <div class="row" role="group" aria-labelledby="hud-menu-{g.id}" data-menu-group={g.id}>
        {#each g.items as id (id)}
          {#if id === 'bells'}
            <button type="button" class="tile" style:--hue="var(--tile-bells)" data-hud-bells data-menu-tile="bells" data-bells={bells} data-today={today}
              aria-haspopup="dialog" aria-expanded={expanded}
              aria-label={t('island.bells', { bells: formatBells(bells), today: formatBells(today) })}
              data-sfx="self" onpointerdown={() => ahead('panel')} onclick={() => pick(id)}>
              <span class="ic ink">{@render icon(id)}</span>
              <span class="lbl" aria-hidden="true">{t(MENU_LABEL.bells)}</span>
              <b class="sub num money" aria-hidden="true" onanimationend={(e) => e.currentTarget.classList.remove('catch')}>{formatNum(Math.round(shown.current))}</b>
              {#if open}{@render plus()}{/if}
            </button>
          {:else}
            <button type="button" class="tile" style:--hue="var(--tile-{id})" {...{ [`data-hud-${id}`]: '' }} data-menu-tile={id} aria-haspopup="dialog"
              data-sfx="self" onpointerdown={() => ahead(CHUNK[id])} onclick={() => pick(id)}>
              <span class="ic">
                {@render icon(id)}
                {#if id === 'bots' && botsDot}<span class="badge" data-hud-bots-dot data-tone={botsDot}><StatusDot tone={botsDot} look size={22} /></span>{/if}
                {#if id === 'english' && englishDot}<span class="badge dot" data-hud-english-dot><StatusDot tone="good" size={14} /></span>{/if}
              </span>
              <span class="lbl">{#if id === 'bots' && botsDot}<span aria-hidden="true">{t(MENU_LABEL.bots)}</span><span class="sr-only">{t('bots.say', { bot: t(MENU_LABEL.bots), word: t('bots.attention') })}</span>{:else}{t(MENU_LABEL[id])}{/if}</span>
            </button>
          {/if}
        {/each}
      </div>
    {/each}
  </div>
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
  /* a coin lands in it (HudCoins): the leaf's (or, open, ベル's number's) small catch squash */
  .leaf:global(.catch), .num:global(.catch) { animation: catch 260ms var(--ease-bounce); }
  @keyframes catch { 0%, 100% { transform: none; } 40% { transform: scale(1.14, .86); } }

  /* The card: hanging under the leaf, 12px in from the screen's sides (the safe areas'), its tip under the leaf; out of
     flow (the row's box, which the 3D island measures, stays the row). Shown at once on a tap (the user: a drop was too
     slow), folded in a quick fade; folded it is hidden and takes no room or taps (visibility and scale(0) after the
     fade). Always cream: the chrome never follows the clock. */
  .items {
    --w: min(400px, calc(100vw - 24px - var(--safe-left) - var(--safe-right)));
    position: absolute; right: calc(12px + var(--safe-right) - max(14px, var(--safe-right))); top: calc(100% + 12px); width: var(--w); box-sizing: border-box;
    padding: 4px 10px 10px; border-radius: 30px; background: var(--c-cream);
    box-shadow: 0 var(--lip-h) 0 var(--c-lip), 0 14px 34px rgb(60 40 20 / .24);
    opacity: 0; visibility: hidden; transform: scale(0); transform-origin: calc(100% - 24px) 0;
    transition: opacity 100ms linear, visibility 0s linear 100ms, transform 0s linear 100ms;
  }
  .items::before { content: ''; position: absolute; top: -6px; right: 17px; width: 14px; height: 14px; background: var(--c-cream); rotate: 45deg; border-radius: 3px 0 0 0; }
  .open .items { opacity: 1; visibility: visible; transform: none; transition: none; }
  /* a row's label: small, soft, a thin rule after it */
  .grp {
    display: flex; align-items: center; gap: 8px; margin: 10px 8px 0;
    font: 700 var(--fs-s)/1 var(--font-ui); color: var(--c-ink-soft); letter-spacing: .08em;
  }
  .grp::after { content: ''; flex: 1; height: 2px; border-radius: 2px; background: color-mix(in srgb, var(--c-lip) 45%, transparent); }
  .row { display: grid; grid-template-columns: repeat(3, 1fr); }
  /* a tile: the whole cell is the target (≥ 44px each way), its icon a 56px squircle in its hue with a soft lip, the
     name under it */
  .tile {
    position: relative; display: grid; justify-items: center; align-content: start; gap: 6px; min-height: 96px; margin: 0; padding: 8px 2px 6px;
    appearance: none; border: 0; border-radius: 20px; background: none; color: var(--c-ink); cursor: pointer;
    -webkit-tap-highlight-color: transparent; touch-action: manipulation; -webkit-touch-callout: none;
  }
  .tile:active { background: color-mix(in srgb, var(--c-lip) 25%, transparent); }
  .tile:active .ic { transform: translateY(2px) scale(.95); box-shadow: inset 0 -2px 0 rgb(0 0 0 / .14); transition: transform 80ms var(--ease-squash), box-shadow 80ms; }
  .tile:focus-visible { outline: 3px solid var(--focus); outline-offset: -3px; }
  .ic {
    position: relative; width: 56px; height: 56px; border-radius: 30%; display: grid; place-items: center; line-height: 0;
    background: var(--hue); color: #fff; box-shadow: inset 0 -3px 0 rgb(0 0 0 / .14), 0 2px 0 rgb(74 58 44 / .18);
  }
  .ic.ink { color: var(--c-ink); }
  .ic svg { width: 32px; height: 32px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .ic .eye { fill: currentColor; stroke: none; }
  .lbl { font: 700 var(--fs-body)/1.1 var(--font-ui); letter-spacing: .02em; white-space: nowrap; }
  /* ベル's number under its name (the money font) */
  .sub { margin-top: -3px; font: 700 var(--fs-s)/1.15 var(--font-num); font-variant-numeric: tabular-nums; color: var(--c-ink-soft); }
  .num { display: inline-block; transform-origin: 50% 70%; }
  /* a tile's badge, on the icon's corner, ringed in the card's cream: ボット's 「!」, 英語's dot */
  .badge { position: absolute; top: -5px; right: -5px; display: flex; line-height: 0; pointer-events: none; --plate: var(--c-cream); }
  .badge.dot { top: -2px; right: -2px; }

  /* today's +N as coins land: a small yuzu bubble just under the leaf (folded), right-aligned to the screen's side, or
     over ベル's tile (open), popping in, rising a little, fading */
  .flash {
    position: absolute; right: 0; top: calc(100% + 10px); z-index: 1; pointer-events: none;
    padding: 3px 8px 2px; border-radius: var(--r-pill); white-space: nowrap;
    background: var(--c-yuzu); color: var(--c-ink); box-shadow: 0 2px 0 var(--c-yuzu-lip);
    font: 700 var(--fs-s)/1.1 var(--font-num); font-variant-numeric: tabular-nums;
    animation: flash 1.6s var(--ease-soft) both;
  }
  .tile .flash { right: 6px; top: 2px; }
  @keyframes flash {
    0% { opacity: 0; transform: translateY(6px) scale(.6); }
    12% { opacity: 1; transform: translateY(0) scale(1.08); }
    20%, 70% { opacity: 1; transform: translateY(0) scale(1); }
    100% { opacity: 0; transform: translateY(-8px) scale(1); }
  }

</style>
