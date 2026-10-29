<script lang="ts">
  // Balloon present (design.md §S.4): ours (a balloon + string) carrying the official present,
  // drifting left → right across the sky in 26 s, bobbing ±6px. Tap (48×56 target) → pop: a confetti
  // burst and the present drops behind the hedge. No text. The parent mounts it when one is due.
  import { onDestroy } from 'svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import Fx from '../characters/Fx.svelte';
  import { t } from '#lib/i18n/index.ts';

  interface Props {
    ondone?: () => void;
  }
  let { ondone }: Props = $props();
  const COLOURS = ['#FF6B6B', '#FFD84D', '#6FCFF6'];
  const colour = COLOURS[Math.floor(Math.random() * COLOURS.length)];
  let popped = $state(false);
  let el = $state<HTMLElement | null>(null);
  let at = $state<{ x: number; y: number } | null>(null);

  function pop() {
    if (popped || !el) return;
    const r = el.getBoundingClientRect();
    const p = el.offsetParent?.getBoundingClientRect();
    at = { x: r.left - (p?.left ?? 0) + r.width / 2, y: r.top - (p?.top ?? 0) + 14 };
    popped = true;
    doneTimer = setTimeout(() => ondone?.(), 1700);
  }
  let doneTimer: ReturnType<typeof setTimeout> | null = null;
  onDestroy(() => doneTimer && clearTimeout(doneTimer));
</script>

{#if !popped}
  <div class="fly" bind:this={el} onanimationend={(e) => e.target === el && ondone?.()}>
    <button type="button" class="balloon" aria-label={t('island.balloon')} onclick={pop}>
      <span class="bob">
        <svg viewBox="0 0 22 48" width="22" height="48" aria-hidden="true">
          <path d="M11 29 Q9 36 12 40 Q14 44 11 48" fill="none" stroke="#8A7A66" stroke-width="1" />
          <ellipse cx="11" cy="14" rx="11" ry="14" fill={colour} />
          <path d="M9 27.5 L11 30 L13 27.5 Z" fill={colour} />
          <ellipse cx="7" cy="8" rx="2.6" ry="4.2" fill="#fff" opacity=".55" transform="rotate(-20 7 8)" />
        </svg>
        <span class="gift"><OfficialArt key="deco/present" size="20px" /></span>
      </span>
    </button>
  </div>
{:else if at}
  <span class="boom" style:left="{at.x}px" style:top="{at.y}px"><Fx kind="confetti" /></span>
  <span class="drop" style:left="{at.x}px" style:top="{at.y + 30}px"><OfficialArt key="deco/present" size="20px" /></span>
{/if}

<style>
  .fly { position: absolute; z-index: 3; left: 0; top: 36%; animation: across 26s linear both; }
  @keyframes across { from { transform: translateX(-60px); } to { transform: translateX(calc(100cqw + 20px)); } }
  .balloon {
    appearance: none; border: 0; background: none; padding: 0; cursor: pointer; width: 48px; height: 72px;
    display: grid; justify-items: center; -webkit-tap-highlight-color: transparent;
  }
  .bob { display: grid; justify-items: center; animation: bob 2.6s var(--ease-idle) infinite alternate; }
  @keyframes bob { from { transform: translateY(-6px); } to { transform: translateY(6px); } }
  .gift { margin-top: -4px; line-height: 0; }
  .boom { position: absolute; z-index: 4; width: 0; height: 0; }
  .drop { position: absolute; z-index: 3; translate: -50% 0; animation: drop 1.4s ease-in both; }
  @keyframes drop { 0% { transform: none; opacity: 1; } 70% { opacity: 1; } 100% { transform: translateY(120px) rotate(40deg); opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { .fly { display: none; } }
</style>
