<script lang="ts">
  // The Island scene (mockup screen 1): sky, sea, island, two trees with four fruit rings each,
  // two villagers, the jar sign and two big scores. Everything scales with the container width (cqw).
  import type { FruitKey } from '#lib/types.ts';
  import type { WeekView } from '#lib/types.ts';
  import FruitRing from './FruitRing.svelte';
  import { t, formatYen } from '#lib/i18n/index.ts';
  import { theme } from '#lib/client/theme.svelte.ts';

  interface Props {
    view: WeekView;
    onhighfive?: () => void;
  }
  let { view, onhighfive }: Props = $props();

  const FRUITS: FruitKey[] = ['peach', 'coconut', 'apple', 'pear'];
  const me = $derived(view.people[view.me]);
  const partner = $derived(view.people[view.partner]);
  const night = $derived(theme.night);
  const species = (p: { person: string; villagerSpecies?: string | null }) =>
    (p.villagerSpecies ?? (p.person === 'A' ? 'dog' : 'cat')) === 'dog' ? '#v-bean' : '#v-mochi';

  let hearts = $state<number[]>([]);
  function highFive() {
    const id = Date.now();
    hearts = [...hearts, id];
    setTimeout(() => (hearts = hearts.filter((h) => h !== id)), 1400);
    onhighfive?.();
  }
</script>

<div class="scene" class:night>
  <svg class="art" viewBox="0 0 390 540" aria-hidden="true">
    <defs>
      <linearGradient id="isl-sky" x1="0" y1="0" x2="0" y2="1">
        {#if night}
          <stop offset="0" stop-color="#16203A" /><stop offset="1" stop-color="#2B3A5C" />
        {:else}
          <stop offset="0" stop-color="#9BD8F5" /><stop offset="1" stop-color="#DDF2FB" />
        {/if}
      </linearGradient>
    </defs>
    <rect width="390" height="540" fill="url(#isl-sky)" />
    {#if night}
      <g class="stars" fill="#fff">
        <circle cx="40" cy="80" r="1.6" /><circle cx="120" cy="56" r="1.2" style="animation-delay:.8s" />
        <circle cx="250" cy="70" r="1.4" style="animation-delay:1.6s" /><circle cx="300" cy="140" r="1.2" style="animation-delay:.4s" />
        <circle cx="20" cy="170" r="1.3" style="animation-delay:1.1s" /><circle cx="200" cy="120" r="1" style="animation-delay:2s" />
      </g>
      <circle cx="336" cy="96" r="32" fill="#F6E7B0" opacity=".12" />
      <path d="M340 74 a22 22 0 1 0 18 32 a18 18 0 1 1 -18 -32z" fill="#F6E7B0" />
    {:else}
      <circle cx="336" cy="96" r="20" fill="#FFE59A" /><circle cx="336" cy="96" r="30" fill="#FFE59A" opacity=".35" />
      <g class="cloud" fill="#fff" opacity=".95"><ellipse cx="60" cy="110" rx="34" ry="13" /><ellipse cx="80" cy="102" rx="20" ry="12" /></g>
    {/if}
    <rect y="330" width="390" height="210" fill={night ? '#2B3A5C' : '#8FD3F4'} />
    <path d="M20 350 q10 -6 20 0 M330 356 q10 -6 20 0 M30 520 q10 -6 20 0 M340 522 q10 -6 20 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity={night ? 0.3 : 0.8} />
    <ellipse cx="195" cy="440" rx="190" ry="78" fill={night ? '#4A5E8A' : '#E9D8B4'} stroke={night ? '#3B4C72' : '#D4BC8E'} stroke-width="3" />
    <ellipse cx="195" cy="424" rx="170" ry="62" fill={night ? '#3E6B52' : '#7BC67E'} />
    <g>
      <circle cx="150" cy="470" r="4" fill="#F28BA8" /><circle cx="240" cy="474" r="4" fill="#FFD66B" />
      <circle cx="60" cy="430" r="4" fill="#fff" /><circle cx="330" cy="428" r="4" fill="#F28BA8" />
    </g>
    <g class="trees">
      <g class="sway"><use href="#tree" x="10" y="150" width="180" height="250" /></g>
      <g class="sway" style="animation-delay:-2s"><use href="#tree" x="200" y="150" width="180" height="250" /></g>
    </g>
    <g class="breathe"><use href={species(me)} x="52" y="372" width="62" height="62" /></g>
    <g class="breathe" style="animation-delay:-1.2s"><use href={species(partner)} x="276" y="370" width="64" height="64" /></g>
    <use href="#jar" x="168" y="372" width="54" height="66" />
  </svg>

  <button type="button" class="hf" aria-label={t('island.highfive', { name: partner.villagerName })} onclick={highFive}></button>
  {#each hearts as h (h)}
    <svg class="heart" viewBox="0 0 24 24" aria-hidden="true" style="color:#F28BA8"><use href="#i-heart" /></svg>
  {/each}

  <div class="treefr mine">
    {#each FRUITS as f (f)}<FruitRing fruit={f} view={me.fruits[f]} size="11.8cqw" />{/each}
  </div>
  <div class="treefr theirs">
    {#each FRUITS as f (f)}<FruitRing fruit={f} view={partner.fruits[f]} size="11.8cqw" />{/each}
  </div>

  <div class="score left" aria-label={t('island.score', { name: me.villagerName, score: me.score })}>
    <span class="big">{me.score}<small>/100</small></span>
  </div>
  <div class="score right" aria-label={t('island.score', { name: partner.villagerName, score: partner.score })}>
    <span class="big">{partner.score}<small>/100</small></span>
  </div>
  <div class="jarsign money" aria-label={t('island.jar', { yen: formatYen(view.jar.totalYen) })}>{formatYen(view.jar.totalYen)}</div>
</div>

<style>
  .scene { position: relative; width: 100%; aspect-ratio: 390 / 540; container-type: inline-size; }
  .art { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
  .sway { transform-origin: 50% 100%; transform-box: fill-box; animation: sway 5s ease-in-out infinite; }
  .breathe { transform-origin: 50% 100%; transform-box: fill-box; animation: breathe 3.2s ease-in-out infinite; }
  .cloud { animation: drift 30s linear infinite; }
  .stars circle { animation: twinkle 3s ease-in-out infinite; }
  .night .trees { filter: brightness(.78) saturate(.85); }

  .treefr {
    position: absolute; z-index: 4; top: 47.2cqw; display: grid; grid-template-columns: repeat(2, 11.8cqw);
    gap: 2.05cqw; justify-items: center;
  }
  .treefr.mine { left: 12.8cqw; }
  .treefr.theirs { left: 61.5cqw; }

  .hf {
    position: absolute; z-index: 3; left: 51.3cqw; top: 38.5cqw; width: 46.2cqw; height: 74cqw;
    appearance: none; background: transparent; border: 0; border-radius: 40% 40% 20% 20%; cursor: pointer;
  }
  .hf:active { background: rgba(255, 255, 255, .12); }
  .heart {
    position: absolute; z-index: 6; left: 70cqw; top: 40cqw; width: 12cqw; height: 12cqw; pointer-events: none;
    animation: floatUp 1.4s var(--ease-soft) forwards;
  }

  .score { position: absolute; z-index: 5; top: 115.9cqw; width: 38.5cqw; text-align: center; color: var(--ink); }
  .night .score { color: var(--night-ink); }
  .score.left { left: 2.05cqw; }
  .score.right { right: 2.05cqw; }
  .score .big { font-size: min(2.6rem, 10.7cqw); font-weight: 700; }
  .score small { font-size: min(1rem, 4.1cqw); color: var(--ink-faint); font-weight: 600; }
  .night .score small { color: var(--night-ink-soft); }

  .jarsign {
    position: absolute; z-index: 5; top: 114.9cqw; left: 50%; transform: translateX(-50%);
    background: var(--paper); color: var(--ink); border: 2px solid var(--bark); border-radius: var(--r-sm);
    padding: 4px 10px; font-size: min(1.05rem, 4.3cqw); box-shadow: 0 3px 0 var(--sand-deep); white-space: nowrap;
  }
</style>
