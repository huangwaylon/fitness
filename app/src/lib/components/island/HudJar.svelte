<script lang="ts">
  // The jar in the HUD's top-left corner (docs/design.md "Island"): our jar drawing (Jar.svelte) standing in the sky
  // with the shared wallet's ベル written inside the glass (ごほうび's balance; 1.2k from 1,000 on), the island's one
  // doorway to the panel (on ごほうび, where today's +N is shown in full). The goals' coins fly into it (HudCoins): its
  // number holds while they are in the air and counts up as each lands, the jar squashing, and today's +N flashes
  // beside it (a yuzu bubble that fades: earnings only, never a とりけす's refund). Its label says the balance and
  // today's ベル. View-only for the guest too (its ごほうび is). Tap: a press squash, the villagers glance up at it
  // (R18), then the panel on ごほうび.
  //   <HudJar bells={view.wallet.balance} today={view.wallet.today} onopen={() => …} {later} />
  import { tick, untrack } from 'svelte';
  import { Tween } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import Jar from './Jar.svelte';
  import { coinsInFlight } from './HudCoins.svelte';
  import { walletFill } from '../wallet/fill.ts';
  import { hudGlance, react } from '../motion/director.svelte.ts';
  import { formatBells, formatNum, t } from '#lib/i18n/index.ts';

  interface Props {
    /** The shared wallet's balance. */
    bells: number;
    /** Today's ベル so far, both people (the label, and the flash as coins land). */
    today: number;
    /** The panel it opens is open (aria-expanded). */
    expanded?: boolean;
    /** Tapped (open the panel on ごほうび), after the press beat. */
    onopen?: () => void;
    /** The page's timer (cleared with the page). */
    later: (fn: () => void, ms: number) => void;
  }
  let { bells, today, expanded = false, onopen, later }: Props = $props();

  /** The ベル the jar shows: the wallet less what is still flying in (never down while coins fly; a spend at once). */
  // svelte-ignore state_referenced_locally
  let held = $state(bells);
  const shown = new Tween(untrack(() => held), { duration: 600, easing: cubicOut });
  $effect(() => {
    void bells;
    void coinsInFlight.bells;
    // after this flush: HudCoins' effect for the same sync has set what flies by then
    void tick().then(() => {
      const f = coinsInFlight.bells;
      // coins landing (less in the air than at the last look): today's ベル so far beside the jar (a refund raises the
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
  /** Today's +N beside the jar as coins land: today's ベル so far (counting up with them), held a moment, then gone
   *  (aria-hidden: the label says it). */
  let flash = $state<{ n: number; k: number } | null>(null);
  let flashK = 0;
  function showFlash(n: number) {
    if (n <= 0) return;
    const k = ++flashK;
    flash = { n, k };
    later(() => flash?.k === k && (flash = null), 1_600);
  }

  /** In the glass: the digits up to 999, then 1.2k (12k from 10,000). */
  const compact = (n: number): string => {
    const v = Math.max(0, Math.round(n));
    if (v < 1000) return formatNum(v);
    if (v < 10_000) return `${Math.floor(v / 100) / 10}k`;
    return `${Math.floor(v / 1000)}k`;
  };

  let pressed = $state(false);
  function tap() {
    pressed = false;
    hudGlance.side = 'l'; // the villagers glance up to the left, at it
    react('R18');
    later(() => onopen?.(), 90);
  }
</script>

<button type="button" class="hud-jar" class:pressed aria-label={t('island.jar', { bells: formatBells(bells), today: formatBells(today) })} aria-haspopup="dialog"
  aria-expanded={expanded} data-sfx="self" data-bells={bells} data-today={today} onclick={tap}
  onpointerdown={() => (pressed = true)} onpointerup={() => (pressed = false)} onpointerleave={() => (pressed = false)} onpointercancel={() => (pressed = false)}>
  <span class="squash" data-guard onanimationend={(e) => e.currentTarget.classList.remove('catch')}>
    <Jar fill={walletFill(held)} width="100%" />
    <b class="num" class:long={compact(shown.current).length > 3} aria-hidden="true">{compact(shown.current)}</b>
  </span>
  {#if flash}{#key flash.k}<span class="flash money" data-jar-flash aria-hidden="true">+{formatNum(flash.n)}</span>{/key}{/if}
</button>

<style>
  /* A 44px target as wide as the health button in the other corner (--hud-side); the jar drawn a little taller than
     the row, lid over its top, the glass's foot under it. */
  .hud-jar {
    --jar-w: clamp(50px, calc(6.2 * var(--vh1)), 56px);
    position: relative; flex: none; width: var(--hud-side, 56px); height: var(--hit); margin: 0; padding: 0;
    display: flex; align-items: center; justify-content: center; appearance: none; border: 0; background: none;
    cursor: pointer; font: inherit; color: var(--c-ink); -webkit-tap-highlight-color: transparent;
    touch-action: manipulation; pointer-events: auto;
  }
  .hud-jar:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; border-radius: var(--r-chip); }
  /* (a jar grown past 50px hangs a little lower: its lid never higher than a 50px one's, clear of the top blur) */
  .squash {
    position: relative; display: block; width: var(--jar-w); flex: none; transform-origin: 50% 100%;
    translate: 0 calc((var(--jar-w) - 50px) * .63);
    filter: drop-shadow(0 2px 0 rgb(0 0 0 / .14));
    transition: transform 220ms cubic-bezier(.34, 1.56, .64, 1);
  }
  .hud-jar.pressed .squash { transform: scale(.92); transition: transform 80ms var(--ease-squash); }
  /* a coin lands in it (HudCoins): the jar's small catch squash */
  .squash:global(.catch) { animation: catch 260ms var(--ease-bounce); }
  @keyframes catch { 0%, 100% { transform: none; } 40% { transform: scale(1.08, .92); } }
  /* the number in the glass (the glass spans 18–67 of the art's 68 units: its middle at 63 %), ink with a cream
     outline so it reads on the coins' honey and on the bare glass */
  .num {
    position: absolute; left: 50%; top: 64%; translate: -50% -50%; white-space: nowrap; pointer-events: none;
    font: 700 calc(var(--jar-w) * .34)/1 var(--font-num); letter-spacing: .01em; font-variant-numeric: tabular-nums;
    color: var(--c-ink); -webkit-text-stroke: 3.5px var(--c-cream); paint-order: stroke fill;
  }
  .num.long { font-size: calc(var(--jar-w) * .29); letter-spacing: 0; }
  /* today's +N as coins land: a small yuzu bubble just right of the glass (towards the sky's middle), popping in,
     rising a little, fading */
  .flash {
    position: absolute; left: calc(50% + var(--jar-w) / 2 - 2px); top: 4px; z-index: 1; pointer-events: none;
    padding: 3px 8px 2px; border-radius: var(--r-pill); white-space: nowrap;
    background: var(--c-yuzu); color: var(--c-ink); box-shadow: 0 2px 0 var(--c-yuzu-lip);
    font: 700 var(--fs-s)/1.1 var(--font-num); font-variant-numeric: tabular-nums;
    animation: flash 1.6s var(--ease-soft) both;
  }
  @keyframes flash {
    0% { opacity: 0; transform: translateY(6px) scale(.6); }
    12% { opacity: 1; transform: translateY(0) scale(1.08); }
    20%, 70% { opacity: 1; transform: translateY(0) scale(1); }
    100% { opacity: 0; transform: translateY(-8px) scale(1); }
  }
  @media (prefers-reduced-motion: reduce) {
    .flash { animation-name: flash-still; }
    @keyframes flash-still { 0% { opacity: 0; } 10%, 70% { opacity: 1; } 100% { opacity: 0; } }
  }
</style>
