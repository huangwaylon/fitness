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
  }
  let { fruit, view, size = '46px', showPct = false }: Props = $props();

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
    style:--p={pct}
    style:--c="var(--f-{fruit})"
    aria-label={label}
    aria-expanded={open}
    onclick={toggle}
  >
    <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#f-{fruit}" /></svg>
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
