<script lang="ts">
  // One fruit tree (style guide §S.8): the official hardwood of the season carrying the four official
  // fruit at their ripeness stage (bud / small / nearly / ripe + glint). Sways gently; a tap on the
  // canopy shakes it, drops two seasonal leaves and shows the fruit detail bubble (icons + %).
  // `shakeN` (bumped by idle life) shakes it without the bubble; `celebrate` pops + sparkles a fruit.
  import { untrack } from 'svelte';
  import type { FruitKey, PersonWeekView } from '#lib/types.ts';
  import type { Season } from '#lib/client/theme.svelte.ts';
  import { FRUITS } from '#lib/config/rules.ts';
  import OfficialArt from '../OfficialArt.svelte';
  import Fx from '../Fx.svelte';
  import { ripeness } from '../FruitRing.svelte';
  import { fruitArt } from '#lib/client/assets.ts';
  import { seasonArt, treeArt } from '../art.ts';
  import { t } from '#lib/i18n/index.ts';
  import { FRUIT_POS, FRUIT_U, TREE, u } from './scene.ts';

  interface Props {
    person: PersonWeekView;
    x: number;
    season: Season;
    /** Sway phase offset (s). */
    delay?: number;
    shakeN?: number;
    celebrate?: { fruit: FruitKey; n: number } | null;
    ontap?: () => void;
  }
  let { person, x, season, delay = 0, shakeN = 0, celebrate = null, ontap }: Props = $props();

  let open = $state(false);
  let taps = $state(0);
  let timer: ReturnType<typeof setTimeout> | null = null;
  let leaves = $state<number[]>([]);
  let leafN = 0;
  let treeEl = $state<HTMLElement | null>(null);

  const pct = (f: FruitKey) => Math.max(0, Math.min(100, Math.round(person.fruits[f].pct)));
  const label = $derived(
    `${person.villagerName}: ` + FRUITS.map((f) => t('fruit.pct', { label: t(`fruit.${f}`), pct: pct(f) })).join('、')
  );

  function shake() {
    if (!treeEl) return;
    treeEl.classList.remove('shaking');
    void treeEl.offsetWidth;
    treeEl.classList.add('shaking');
    const a = ++leafN, b = ++leafN;
    leaves = [...leaves.slice(-2), a, b];
    setTimeout(() => (leaves = leaves.filter((n) => n !== a && n !== b)), 2000);
  }

  // React to `shakeN` only: shake() reads and writes `leaves`, which must not become a dependency
  // (that re-runs the effect until Svelte throws effect_update_depth_exceeded).
  $effect(() => {
    if (shakeN > 0) untrack(shake);
  });

  function tap() {
    shake();
    taps++;
    open = true;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => (open = false), 2600);
    ontap?.();
  }

  const leafKey = $derived(season === 'spring' ? seasonArt('petal') : season === 'autumn' ? seasonArt('maple-leaf') : season === 'winter' ? seasonArt('snowflake') : null);
</script>

<div class="tree" bind:this={treeEl} style:left={u(x)} style:top={u(TREE.base)} style:width={u(TREE.w)} style:height={u(TREE.h)}
  style:--delay="{delay}s" onanimationend={(e) => e.animationName === 'if-shake' && treeEl?.classList.remove('shaking')}>
  <span class="oak"><OfficialArt key={treeArt(season)} size={u(TREE.h)} eager /></span>
  {#each FRUITS as f (f)}
    {@const st = ripeness(pct(f))}
    <span class="fruit" style:left="{FRUIT_POS[f][0]}%" style:top="{FRUIT_POS[f][1]}%" style:width={u(FRUIT_U)}>
      {#key st}
        <span class="f {st}">
          <OfficialArt key={fruitArt(f)} size={u(FRUIT_U)} eager>
            {#snippet fallback()}<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#f-{f}" /></svg>{/snippet}
          </OfficialArt>
        </span>
      {/key}
      {#if st === 'ripe'}<svg class="glint" viewBox="0 0 24 24" aria-hidden="true" style:animation-delay="{(FRUITS.indexOf(f) * 0.9 + delay).toFixed(1)}s"><path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z" /></svg>{/if}
      {#if celebrate?.fruit === f}
        {#key celebrate.n}<span class="fxa"><Fx kind="sparkles" spread={u(40)} /></span>{/key}
      {/if}
    </span>
  {/each}
</div>
<button type="button" class="canopy" style:left={u(x)} style:top={u(TREE.base - TREE.h)} style:width={u(TREE.w)} style:height={u(TREE.h * 0.66)}
  aria-label={label} aria-expanded={open} onclick={tap}></button>

{#each leaves as n (n)}
  <span class="leaf" style:left={u(x + (n % 2 ? -26 : 22))} style:top={u(TREE.base - TREE.h * 0.55)}>
    {#if leafKey}<OfficialArt key={leafKey} size="12px" />
    {:else}<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M2 14 Q2 3 14 2 Q13 13 2 14 Z" fill="#6ED07A" stroke="#3E8E3A" stroke-width="1" /></svg>{/if}
  </span>
{/each}

{#if open}
  {#key taps}
    <div class="detail" role="status" style:left={u(Math.min(Math.max(x, 100), 290))} style:top={u(TREE.base - TREE.h - 4)}>
      {#each FRUITS as f (f)}
        <span class="row"><OfficialArt key={fruitArt(f)} size="22px" eager /><b class="money">{pct(f)}%</b></span>
      {/each}
    </div>
  {/key}
{/if}

<style>
  .tree {
    position: absolute; z-index: 30; transform-origin: 50% 100%; translate: -50% -100%;
    animation: if-sway 5s var(--ease-idle) infinite; animation-delay: var(--delay); pointer-events: none;
  }
  .tree:global(.shaking) { animation: if-shake 480ms ease-in-out 1; }
  .oak { position: absolute; inset: 0; display: flex; justify-content: center; line-height: 0; }
  .fruit { position: absolute; aspect-ratio: 1; translate: -50% -50%; line-height: 0; }
  .f { display: block; transform-origin: 50% 20%; animation: if-pop 360ms var(--ease-bounce) both; }
  .f :global(.official) { filter: drop-shadow(0 0 1.5px #fff); }
  /* stage scale via the `scale` property, so the if-pop transform can run on top of it */
  .f.bud { scale: .55; opacity: .55; }
  .f.bud :global(.official) { filter: saturate(.3) drop-shadow(0 0 1.5px #fff); }
  .f.small { scale: .75; opacity: .8; }
  .f.small :global(.official) { filter: saturate(.7) drop-shadow(0 0 1.5px #fff); }
  .f.nearly { scale: .9; }
  .glint {
    position: absolute; right: -8%; top: -8%; width: 40%; fill: #fff; filter: drop-shadow(0 0 2px #FFF6C9);
    animation: glint 4s ease-in-out infinite; transform: scale(0);
  }
  @keyframes glint { 0%, 85%, 100% { transform: scale(0); opacity: 0; } 92.5% { transform: scale(1); opacity: 1; } }
  .fxa { position: absolute; left: 50%; top: 30%; width: 0; height: 0; }
  .canopy {
    position: absolute; z-index: 32; translate: -50% 0; appearance: none; border: 0; background: none; padding: 0;
    cursor: pointer; border-radius: 45%; -webkit-tap-highlight-color: transparent;
  }
  .canopy:focus-visible { outline: 3px solid var(--focus); outline-offset: -4px; }
  .leaf { position: absolute; z-index: 70; line-height: 0; pointer-events: none; animation: leaf 1800ms ease-in both; }
  @keyframes leaf {
    0% { transform: translate(0, 0) rotate(0); opacity: 0; } 10% { opacity: 1; }
    40% { transform: translate(-10px, 40px) rotate(120deg); } 75% { transform: translate(8px, 80px) rotate(240deg); opacity: 1; }
    100% { transform: translate(0, 110px) rotate(320deg); opacity: 0; }
  }
  .detail {
    position: absolute; z-index: 95; translate: -50% -100%; display: grid; grid-template-columns: repeat(2, auto); gap: 4px 10px;
    background: var(--c-bubble, #FFFCEB); border: 2px solid #EADBB8; border-radius: 16px; padding: 7px 12px;
    box-shadow: 0 3px 0 rgba(74, 58, 44, .12); color: var(--c-ink); pointer-events: none;
    transform-origin: 50% 100%; animation: if-pop 360ms var(--ease-bounce) both;
  }
  .detail::after {
    content: ''; position: absolute; left: 50%; bottom: -7px; width: 10px; height: 10px; margin-left: -5px;
    background: inherit; border: inherit; border-top: 0; border-left: 0; transform: rotate(45deg);
  }
  .row { display: inline-flex; align-items: center; gap: 4px; }
  .row b { font: 600 15px/1 var(--font-num); }
  @media (prefers-reduced-motion: reduce) {
    .tree, .tree:global(.shaking), .glint, .leaf { animation: none; }
    .glint { transform: scale(.8); opacity: .9; }
    .f, .detail { animation: none; }
  }
</style>
