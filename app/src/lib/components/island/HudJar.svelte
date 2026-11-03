<script lang="ts">
  // The jar in the HUD, left of today's ribbon (docs/design.md "Island"): our jar drawing (Jar.svelte) standing in the
  // sky with the shared wallet's ベル written inside the glass (ごほうび's balance; 1.2k from 1,000 on), the doorway to
  // ごほうび. The goals' coins fly into it (HudCoins): its number holds while they are in the air and counts up as each
  // lands, the jar squashing. View-only for the guest too (its ごほうび is). Tap: a press squash, the villagers glance up
  // at it (R18), then the panel on ごほうび.
  //   <HudJar bells={view.wallet.balance} onopen={() => …} {later} />
  import { tick, untrack } from 'svelte';
  import { Tween } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import Jar from './Jar.svelte';
  import { coinsInFlight } from './HudCoins.svelte';
  import { walletFill } from '../wallet/fill.ts';
  import { react } from '../motion/director.svelte.ts';
  import { formatBells, formatNum, t } from '#lib/i18n/index.ts';

  interface Props {
    /** The shared wallet's balance. */
    bells: number;
    /** Tapped (open the panel on ごほうび), after the press beat. */
    onopen?: () => void;
    /** The page's timer (cleared with the page). */
    later: (fn: () => void, ms: number) => void;
  }
  let { bells, onopen, later }: Props = $props();

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
      const to = f > 0 ? Math.max(held, bells - f) : bells;
      if (to === held) return;
      shown.set(to, { duration: to > held ? 600 : 0 });
      held = to;
    });
  });

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
    react('R18');
    later(() => onopen?.(), 90);
  }
</script>

<button type="button" class="hud-jar" class:pressed aria-label={t('island.jar', { bells: formatBells(bells) })} aria-haspopup="dialog" data-sfx="self"
  data-bells={bells} onclick={tap}
  onpointerdown={() => (pressed = true)} onpointerup={() => (pressed = false)} onpointerleave={() => (pressed = false)} onpointercancel={() => (pressed = false)}>
  <span class="squash" onanimationend={(e) => e.currentTarget.classList.remove('catch')}>
    <Jar fill={walletFill(held)} width="100%" />
    <b class="num" class:long={compact(shown.current).length > 3} aria-hidden="true">{compact(shown.current)}</b>
  </span>
</button>

<style>
  /* A 44px target as wide as the health button (the ribbon stays centred between the two); the jar drawn a little
     taller than the row, lid over its top, the glass's foot under it. */
  .hud-jar {
    --jar-w: clamp(44px, calc(5.6 * var(--vh1)), 50px);
    position: relative; flex: none; width: var(--hud-side, 56px); height: var(--hit); margin: 0; padding: 0;
    display: flex; align-items: center; justify-content: center; appearance: none; border: 0; background: none;
    cursor: pointer; font: inherit; color: var(--c-ink); -webkit-tap-highlight-color: transparent;
    touch-action: manipulation; pointer-events: auto;
  }
  .hud-jar:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; border-radius: var(--r-chip); }
  .squash {
    position: relative; display: block; width: var(--jar-w); flex: none; transform-origin: 50% 100%;
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
</style>
