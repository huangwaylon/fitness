<script lang="ts">
  // One fruit's weekly progress (style guide v3 §A): the official inventory icon.
  //   ring (default): our conic progress ring, the fruit in the centre growing 0.7 → 1 with pct.
  //   onTree: the fruit hangs on an island tree (no ring); it ripens (grows, fills in) with pct and
  //           sparkles when full. Tap either → the detail chip.
  // Below 25% the fruit shows at 55% opacity.
  import type { FruitKey, FruitView } from '#lib/types.ts';
  import OfficialArt from './OfficialArt.svelte';
  import { fruitArt } from '#lib/client/assets.ts';
  import { t } from '#lib/i18n/index.ts';

  interface Props {
    fruit: FruitKey;
    view: FruitView;
    /** CSS size of the tap target, e.g. '56px' or '11.8cqw' (min 44px). */
    size?: string;
    /** Show the % under the ring. */
    showPct?: boolean;
    /** Hanging on an island tree. */
    onTree?: boolean;
    eager?: boolean;
  }
  let { fruit, view, size = '56px', showPct = false, onTree = false, eager = false }: Props = $props();

  let open = $state(false);
  let timer: ReturnType<typeof setTimeout> | null = null;

  const pct = $derived(Math.max(0, Math.min(100, Math.round(view.pct))));
  const full = $derived(pct >= 100);
  const label = $derived(
    view.actual !== undefined && view.target !== undefined
      ? t(`fruit.${fruit}.detail`, { actual: fmt(view.actual), target: fmt(view.target) })
      : t('fruit.pct', { label: t(`fruit.${fruit}`), pct })
  );

  function fmt(n: number): string {
    return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, '');
  }

  function toggle(e: Event) {
    e.stopPropagation();
    open = !open;
    if (timer) clearTimeout(timer);
    if (open) timer = setTimeout(() => (open = false), 2600);
  }
</script>

<span class="wrap" style:--size={size}>
  <button
    type="button"
    class="fr"
    class:full
    class:tree={onTree}
    class:unripe={pct < 25}
    style:--p={pct}
    style:--ripe={pct / 100}
    style:--c="var(--f-{fruit})"
    aria-label={label}
    aria-expanded={open}
    onclick={toggle}
  >
    <span class="fruit">
      <OfficialArt key={fruitArt(fruit)} size="100%" {eager}>
        {#snippet fallback()}<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#f-{fruit}" /></svg>{/snippet}
      </OfficialArt>
    </span>
  </button>
  {#if open}
    <span class="tip" role="status">{label}</span>
  {/if}
  {#if showPct}<span class="pct money">{pct}%</span>{/if}
</span>

<style>
  .wrap { position: relative; display: inline-flex; flex-direction: column; align-items: center; gap: 4px; }
  .fr {
    appearance: none; border: 0; padding: 0; cursor: pointer; -webkit-tap-highlight-color: transparent;
    width: var(--size); height: var(--size); min-width: 44px; min-height: 44px; border-radius: 50%;
    background: conic-gradient(var(--c) calc(var(--p) * 1%), var(--ring-track) 0);
    display: grid; place-items: center; position: relative;
    transition: transform var(--dur-quick) var(--ease-bounce);
    animation: pop var(--dur-slow) var(--ease-bounce) both;
  }
  .fr:active { transform: scale(.94); }
  .fr::before { content: ''; position: absolute; inset: 9%; border-radius: 50%; background: var(--surface); }
  .fruit {
    position: relative; display: grid; place-items: center; width: 68%; height: 68%;
    transform: scale(calc(.7 + var(--ripe) * .3));
    transition: transform var(--dur-slow) var(--ease-bounce), opacity var(--dur-slow) var(--ease-soft);
  }
  .fruit :global(img), .fruit :global(svg) { width: 100%; height: 100%; }
  .unripe .fruit { opacity: .55; }
  .fr.full { box-shadow: 0 0 0 3px var(--sun); }
  .fr.full::after {
    content: ''; position: absolute; top: -4px; right: -2px; width: 14px; height: 14px; background: var(--sun);
    clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
  }

  /* Hanging on a tree: no ring, a soft shadow on the canopy, a sparkle when ripe. */
  .fr.tree { background: none; border-radius: 40%; }
  .fr.tree::before { display: none; }
  .fr.tree .fruit { width: 80%; height: 80%; transform-origin: 50% 10%; }
  .fr.tree.full { box-shadow: none; }
  .fr.tree.full::after {
    top: 2%; right: 4%; width: 30%; height: 30%; background: #FFF6C9;
    animation: twinkle 2.4s var(--ease-idle) infinite;
  }

  .tip {
    position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%); z-index: 20;
    background: var(--ink); color: var(--cream); font-weight: 700; font-size: var(--fs-caption);
    padding: 6px 10px; border-radius: 10px; white-space: nowrap; pointer-events: none;
    animation: drop var(--dur-base) var(--ease-bounce) both;
  }
  .tip::after {
    content: ''; position: absolute; left: 50%; bottom: -6px; margin-left: -6px;
    border: 6px solid transparent; border-bottom: 0; border-top-color: var(--ink);
  }
  .pct { font-size: 1rem; color: var(--text); }
  @media (prefers-reduced-motion: reduce) { .fr.tree.full::after { animation: none; } }
</style>
