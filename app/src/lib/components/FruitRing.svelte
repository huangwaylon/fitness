<script lang="ts">
  import type { FruitKey, FruitView } from '#lib/types.ts';
  import { t } from '#lib/i18n/index.ts';

  interface Props {
    fruit: FruitKey;
    view: FruitView;
    /** CSS size, e.g. '46px' or '11.8cqw'. */
    size?: string;
    /** Show the % under the ring (Us page). */
    showPct?: boolean;
    /** Hanging on an island tree: a leaf on top, and the fruit ripens (grows, colours in) with pct. */
    onTree?: boolean;
  }
  let { fruit, view, size = '46px', showPct = false, onTree = false }: Props = $props();

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
    style:--p={pct}
    style:--ripe={pct / 100}
    style:--c="var(--f-{fruit})"
    aria-label={label}
    aria-expanded={open}
    onclick={toggle}
  >
    <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#f-{fruit}" /></svg>
    {#if onTree}
      <svg class="stem" viewBox="0 0 16 10" aria-hidden="true">
        <path d="M8 9 Q9 3 15 2 Q12.6 8.6 8 9 Z" fill="#7BC67E" stroke="#4A3A2C" stroke-width="1.3" stroke-linejoin="round" />
        <path d="M8 9.4 V5.4" stroke="#8A5A3B" stroke-width="1.6" stroke-linecap="round" />
      </svg>
    {/if}
  </button>
  {#if open}
    <span class="tip" role="status">{label}</span>
  {/if}
  {#if showPct}<span class="pct money">{pct}%</span>{/if}
</span>

<style>
  .wrap { position: relative; display: inline-flex; flex-direction: column; align-items: center; gap: 4px; }
  .fr {
    appearance: none; border: 0; padding: 0; cursor: pointer;
    width: var(--size); height: var(--size); min-width: 44px; min-height: 44px; border-radius: 50%;
    background: conic-gradient(var(--c) calc(var(--p) * 1%), var(--ring-track) 0);
    display: grid; place-items: center; position: relative;
    transition: transform var(--dur-quick) var(--ease-bounce);
    animation: pop var(--dur-slow) var(--ease-bounce) both;
  }
  .fr:active { transform: scale(.94); }
  .fr::before { content: ''; position: absolute; inset: 9%; border-radius: 50%; background: var(--surface); }
  .fr svg { position: relative; width: 60%; height: 60%; }
  /* On the tree: a cream bubble on a branch; the fruit grows and colours in as it ripens. */
  .fr.tree { box-shadow: 0 3px 0 rgba(46, 80, 40, .28); }
  .fr.tree::before { background: var(--bubble); }
  .fr.tree svg:first-child {
    transform: scale(calc(.62 + var(--ripe) * .38));
    filter: saturate(calc(.25 + var(--ripe) * .75)) brightness(calc(1.12 - var(--ripe) * .12));
    transition: transform var(--dur-slow) var(--ease-bounce), filter var(--dur-slow) var(--ease-soft);
  }
  .fr.tree .stem { position: absolute; top: -18%; left: 50%; width: 38%; height: 24%; transform: translateX(-30%); }
  .fr.tree.full { box-shadow: 0 0 0 3px var(--sun), 0 3px 0 rgba(46, 80, 40, .28); }
  .fr.full { box-shadow: 0 0 0 3px var(--sun); }
  .fr.full::after {
    content: ''; position: absolute; top: -4px; right: -2px; width: 14px; height: 14px; background: var(--sun);
    clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
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
</style>
