<script lang="ts">
  // One person's orchard (style guide §S.8, A5): three small fruit trees, each the official hardwood of
  // the season bearing three of ONE fruit as in NH (peach at the back, pear outside, apple inside), at
  // that fruit's ripeness stage (bud / small / nearly / ripe), and the coconut in the crown of the
  // beach palm beside them (coconuts only grow on palms). The trees stand still (v5 §6 idle budget:
  // no sway, no ripe glint). One canopy button covers the orchard: a tap shakes the tree under the finger, drops
  // two seasonal leaves and shows the detail bubble (all 4 + %); the palm crown does the same.
  // `shakeN` (bumped by idle life) shakes a tree without the bubble; `celebrate` pops + sparkles a fruit.
  import { onDestroy, untrack } from 'svelte';
  import type { FruitKey, PersonWeekView } from '#lib/types.ts';
  import type { Foliage } from '#lib/client/season.ts';
  import { FRUITS } from '#lib/config/rules.ts';
  import OfficialArt from '../OfficialArt.svelte';
  import Fx from '../Fx.svelte';
  import { ripeness } from '../FruitRing.svelte';
  import { fruitArt } from '#lib/client/assets.ts';
  import { seasonArt, treeArt } from '../art.ts';
  import { t } from '#lib/i18n/index.ts';
  import { COCONUT_POS, COCONUT_U, FRUIT_POS, FRUIT_W, OAK_AR, PALM_AR, u, type OrchardTree } from './scene.ts';

  interface Props {
    person: PersonWeekView;
    /** The orchard's trees, back to front (scene.ts ORCHARD). */
    trees: OrchardTree[];
    foliage: Foliage;
    /** The beach palm that carries this person's coconut. */
    palm: { x: number; base: number; h: number; flip: boolean };
    shakeN?: number;
    celebrate?: { fruit: FruitKey; n: number } | null;
    ontap?: () => void;
  }
  let { person, trees, foliage, palm, shakeN = 0, celebrate = null, ontap }: Props = $props();

  let open = $state(false);
  let taps = $state(0);
  let timer: ReturnType<typeof setTimeout> | null = null;
  const leafTimers = new Set<ReturnType<typeof setTimeout>>();
  onDestroy(() => {
    if (timer) clearTimeout(timer);
    for (const t of leafTimers) clearTimeout(t);
  });
  let leaves = $state<{ n: number; x: number; y: number }[]>([]);
  let leafN = 0;
  const treeEls: (HTMLElement | null)[] = $state([]);

  const w = (tr: OrchardTree) => tr.h * OAK_AR;
  const pct = (f: FruitKey) => Math.max(0, Math.min(100, Math.round(person.fruits[f].pct)));
  const label = $derived(
    `${person.villagerName}: ` + FRUITS.map((f) => t('fruit.pct', { label: t(`fruit.${f}`), pct: pct(f) })).join('、')
  );
  // The canopy button: the box around the three crowns (down to the front trees' lower canopy).
  const box = $derived.by(() => {
    const l = Math.min(...trees.map((tr) => tr.x - w(tr) / 2));
    const r = Math.max(...trees.map((tr) => tr.x + w(tr) / 2));
    const top = Math.min(...trees.map((tr) => tr.base - tr.h));
    const bottom = Math.max(...trees.map((tr) => tr.base - tr.h * 0.3));
    return { l, r, top, bottom };
  });

  function shake(i: number) {
    const el = treeEls[i];
    const tr = trees[i];
    if (!el || !tr) return;
    el.classList.remove('shaking');
    void el.offsetWidth;
    el.classList.add('shaking');
    const a = ++leafN, b = ++leafN;
    const y = tr.base - tr.h * 0.55;
    leaves = [...leaves.slice(-2), { n: a, x: tr.x - w(tr) * 0.3, y }, { n: b, x: tr.x + w(tr) * 0.28, y }];
    const lt = setTimeout(() => {
      leafTimers.delete(lt);
      leaves = leaves.filter((l) => l.n !== a && l.n !== b);
    }, 2000);
    leafTimers.add(lt);
  }

  // React to `shakeN` only (shake() reads and writes `leaves`, which must not become a dependency:
  // that re-runs the effect until Svelte throws effect_update_depth_exceeded). Idle shakes rotate
  // through the three trees.
  $effect(() => {
    const n = shakeN;
    if (n > 0) untrack(() => shake(n % trees.length));
  });

  /** The tree whose crown centre is nearest the tap (keyboard: the back tree). */
  function treeAt(e: MouseEvent): number {
    const btn = e.currentTarget as HTMLElement;
    if (!e.detail || !btn) return 0;
    const r = btn.getBoundingClientRect();
    const px = box.l + ((e.clientX - r.left) / r.width) * (box.r - box.l);
    const py = box.top + ((e.clientY - r.top) / r.height) * (box.bottom - box.top);
    let best = 0, bestD = Infinity;
    trees.forEach((tr, i) => {
      const d = (tr.x - px) ** 2 + (tr.base - tr.h * 0.6 - py) ** 2;
      // front trees paint over the back one: prefer them where they overlap
      if (d < bestD - (tr.back ? 0 : 1)) [best, bestD] = [i, d];
    });
    return best;
  }

  function tap(i: number) {
    shake(i);
    taps++;
    open = true;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => (open = false), 2600);
    ontap?.();
  }

  const leafKey = $derived(foliage === 'blossom' ? seasonArt('petal') : foliage === 'fall' ? seasonArt('maple-leaf') : foliage === 'snow' ? seasonArt('snowflake') : null);
  // coconut centre in stage units (the palm art is mirrored for the left palm)
  const palmW = $derived(palm.h * PALM_AR);
  const coco = $derived({
    x: palm.x + ((palm.flip ? 100 - COCONUT_POS[0] : COCONUT_POS[0]) / 100 - 0.5) * palmW,
    y: palm.base - palm.h + (COCONUT_POS[1] / 100) * palm.h
  });
  const backTree = $derived(trees.find((tr) => tr.back) ?? trees[0]);
</script>

{#each trees as tr, i (tr.fruit)}
  {@const fw = w(tr) * FRUIT_W}
  <div class="tree" bind:this={treeEls[i]} style:left={u(tr.x)} style:top={u(tr.base)} style:width={u(w(tr))}
    style:height={u(tr.h)} style:z-index={tr.back ? 29 : 31}
    onanimationend={(e) => e.animationName === 'if-shake' && treeEls[i]?.classList.remove('shaking')}>
    <span class="oak"><OfficialArt key={treeArt(foliage)} size={u(tr.h)} eager /></span>
    {#each FRUIT_POS as [fx, fy], k (k)}
      <span class="fruit" style:left="{fx}%" style:top="{fy}%" style:width={u(fw)}>
        {@render fruit(tr.fruit, fw, k === 2)}
      </span>
    {/each}
  </div>
{/each}
<span class="fruit coco" style:left={u(coco.x)} style:top={u(coco.y)} style:width={u(COCONUT_U)}>
  {@render fruit('coconut', COCONUT_U, true)}
</span>
<button type="button" class="canopy" style:left={u(box.l)} style:top={u(box.top)} style:width={u(box.r - box.l)}
  style:height={u(box.bottom - box.top)} aria-label={label} aria-expanded={open} onclick={(e) => tap(treeAt(e))}></button>
<button type="button" class="canopy crown" style:left={u(coco.x)} style:top={u(coco.y)} style:width={u(palmW * 0.8)} style:height={u(palm.h * 0.5)}
  aria-label="{person.villagerName}: {t('fruit.pct', { label: t('fruit.coconut'), pct: pct('coconut') })}" aria-expanded={open}
  tabindex="-1" onclick={() => tap(trees.indexOf(backTree))}></button>

{#snippet fruit(f: FruitKey, size: number, fx: boolean)}
  {@const st = ripeness(pct(f))}
  {#key st}
    <span class="f {st}">
      <OfficialArt key={fruitArt(f)} size={u(size)} eager>
        {#snippet fallback()}<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#f-{f}" /></svg>{/snippet}
      </OfficialArt>
    </span>
  {/key}
  {#if fx && celebrate?.fruit === f}
    {#key celebrate.n}<span class="fxa"><Fx kind="sparkles" spread={u(40)} /></span>{/key}
  {/if}
{/snippet}

{#each leaves as l (l.n)}
  <span class="leaf" style:left={u(l.x)} style:top={u(l.y)}>
    {#if leafKey}<OfficialArt key={leafKey} size="12px" />
    {:else}<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M2 14 Q2 3 14 2 Q13 13 2 14 Z" fill="#6ED07A" /></svg>{/if}
  </span>
{/each}

{#if open}
  {#key taps}
    <div class="detail" role="status" style:left={u(Math.min(Math.max(backTree.x, 100), 290))} style:top={u(box.top - 4)}>
      {#each FRUITS as f (f)}
        <span class="row"><OfficialArt key={fruitArt(f)} size="22px" eager /><b class="money">{pct(f)}%</b></span>
      {/each}
    </div>
  {/key}
{/if}

<style>
  .tree { position: absolute; transform-origin: 50% 100%; translate: -50% -100%; pointer-events: none; }
  .tree:global(.shaking) { animation: if-shake 480ms ease-in-out 1; }
  .oak { position: absolute; inset: 0; display: flex; justify-content: center; line-height: 0; }
  .fruit { position: absolute; aspect-ratio: 1; translate: -50% -50%; line-height: 0; }
  .fruit.coco { z-index: 46; pointer-events: none; }
  .f { display: block; transform-origin: 50% 20%; animation: if-pop 360ms var(--ease-bounce) both; }
  .f :global(.official) { filter: drop-shadow(0 0 1.5px #fff) drop-shadow(0 0 1px #fff); }
  /* stage scale via the `scale` property, so the if-pop transform can run on top of it */
  .f.bud { scale: .55; opacity: .55; }
  .f.bud :global(.official) { filter: saturate(.3) drop-shadow(0 0 1.5px #fff) drop-shadow(0 0 1px #fff); }
  .f.small { scale: .75; opacity: .8; }
  .f.small :global(.official) { filter: saturate(.7) drop-shadow(0 0 1.5px #fff) drop-shadow(0 0 1px #fff); }
  .f.nearly { scale: .9; }
  .fxa { position: absolute; left: 50%; top: 30%; width: 0; height: 0; }
  .canopy {
    position: absolute; z-index: 32; appearance: none; border: 0; background: none; padding: 0;
    cursor: pointer; border-radius: 45%; -webkit-tap-highlight-color: transparent;
  }
  .canopy.crown { z-index: 47; translate: -50% -50%; min-height: 44px; min-width: 44px; }
  .canopy:focus-visible { outline: 3px solid var(--focus); outline-offset: -4px; }
  .leaf { position: absolute; z-index: 70; line-height: 0; pointer-events: none; animation: leaf 1800ms ease-in both; }
  @keyframes leaf {
    0% { transform: translate(0, 0) rotate(0); opacity: 0; } 10% { opacity: 1; }
    40% { transform: translate(-10px, 40px) rotate(120deg); } 75% { transform: translate(8px, 80px) rotate(240deg); opacity: 1; }
    100% { transform: translate(0, 110px) rotate(320deg); opacity: 0; }
  }
  .detail {
    position: absolute; z-index: 95; translate: -50% -100%; display: grid; grid-template-columns: repeat(2, auto); gap: 4px 10px;
    background: var(--plate, #FFF9E3); border-radius: 16px; padding: 7px 12px;
    box-shadow: 0 4px 0 var(--plate-lip, #E0C48A); color: var(--plate-ink, #4A3A2C); pointer-events: none;
    transform-origin: 50% 100%; animation: if-pop 360ms var(--ease-bounce) both;
  }
  .detail::after {
    content: ''; position: absolute; left: 50%; bottom: -7px; width: 10px; height: 10px; margin-left: -5px;
    background: inherit; transform: rotate(45deg);
  }
  .row { display: inline-flex; align-items: center; gap: 4px; }
  .row b { font: 600 15px/1 var(--font-num); }
  @media (prefers-reduced-motion: reduce) {
    .tree, .tree:global(.shaking), .leaf { animation: none; }
    .f, .detail { animation: none; }
  }
</style>
