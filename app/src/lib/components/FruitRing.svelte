<script lang="ts">
  // One fruit's weekly progress (design.md §A): the official inventory icon.
  //   ring (default): our conic progress ring with the fruit in the centre.
  //   onTree: the fruit hangs on an island tree (no ring). Tap either → the detail chip
  //           (a cream bubble; on a tree it sits above the whole canopy, U13).
  // The fruit shows its ripeness stage: bud (grey, 0.55) · small (desaturated, 0.75) · nearly (0.9) ·
  // ripe (full colour + sparkle).
  import type { FruitKey, FruitView } from '#lib/types.ts';
  import OfficialArt from './OfficialArt.svelte';
  import { fruitArt } from '#lib/art.ts';
  import { ripeness } from './ripeness.ts';
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
  const stage = $derived(ripeness(pct));
  const label = $derived(t(`fruit.${fruit}.detail`, { actual: fmt(view.actual), target: fmt(view.target) }));

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

<span class="wrap" class:tree={onTree} style:--size={size}>
  <button
    type="button"
    class="fr {stage}"
    class:tree={onTree}
    style:--p={pct}
    style:--c={stage === 'ripe' ? 'var(--c-yuzu)' : 'var(--c-leaf)'}
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
    background: conic-gradient(var(--c) calc(var(--p) * 1%), color-mix(in srgb, var(--c-lip) 50%, transparent) 0);
    display: grid; place-items: center; position: relative;
    transition: transform var(--dur-quick) var(--ease-bounce);
    animation: pop var(--dur-slow) var(--ease-bounce) both;
  }
  .fr:active { transform: scale(.94); }
  .fr::before { content: ''; position: absolute; inset: 9%; border-radius: 50%; background: var(--c-cream); }
  .fruit {
    position: relative; display: grid; place-items: center; width: 68%; height: 68%;
    transition: transform var(--dur-slow) var(--ease-bounce), opacity var(--dur-slow) var(--ease-soft), filter var(--dur-slow);
  }
  .fruit :global(img), .fruit :global(svg) { width: 100%; height: 100%; }
  .bud .fruit { transform: scale(.55); opacity: .55; filter: saturate(.3); }
  .small .fruit { transform: scale(.75); opacity: .8; filter: saturate(.7); }
  .nearly .fruit { transform: scale(.9); }
  .fr.ripe { box-shadow: 0 0 0 3px var(--c-yuzu); }
  .fr.ripe::after {
    content: ''; position: absolute; top: -4px; right: -2px; width: 14px; height: 14px; background: var(--c-yuzu);
    clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
  }

  /* Hanging on a tree: no ring, a sparkle when ripe. */
  .fr.tree { background: none; border-radius: 40%; }
  .fr.tree::before { display: none; }
  .fr.tree .fruit { width: 88%; height: 88%; transform-origin: 50% 10%; }
  .fr.tree.ripe { box-shadow: none; }
  .fr.tree.ripe::after {
    top: 0; right: 0; width: 34%; height: 34%; background: #FFF6C9;
    filter: drop-shadow(0 0 2px #fff); animation: twinkle 2.4s var(--ease-idle) infinite;
  }
  @keyframes pop { 0% { transform: scale(0); } 100% { transform: scale(1); } }
  @keyframes twinkle { 0%,100% { opacity: .3; } 50% { opacity: 1; } }

  /* Detail chip: a cream speech bubble. On a tree, .wrap is static, so the chip anchors to the
     whole fruit grid and floats above the canopy instead of covering the neighbouring fruit. */
  .wrap.tree { position: static; }
  .tip {
    position: absolute; bottom: calc(100% + 8px); left: 50%; translate: -50% 0; z-index: 20;
    background: var(--c-cream); color: var(--c-ink); font-weight: 700; font-size: var(--fs-s);
    padding: 7px 12px; border-radius: var(--r-chip); white-space: nowrap; pointer-events: none;
    box-shadow: 0 var(--lip-h) 0 var(--c-lip);
    animation: if-pop var(--dur-base) var(--ease-bounce) both;
  }
  .tip::after {
    content: ''; position: absolute; left: 50%; bottom: -6px; margin-left: -6px;
    border: 6px solid transparent; border-bottom: 0; border-top-color: var(--c-cream);
  }
  .wrap.tree .tip { bottom: calc(100% + 4px); }
  .pct { font-size: var(--fs-body); color: inherit; }
  @media (prefers-reduced-motion: reduce) { .fr.tree.ripe::after { animation: none; } }
</style>
