<script lang="ts">
  // One person's tree (round 6, faithful to AC): a plain official hardwood of the season (an AC tree
  // bears one kind of fruit, so this one bears none), with the week's fruit lying on the ground in front
  // of the trunk, the way NH drops fruit around a shaken tree: per kind 0–3 items = thirds of that kind's
  // target (scene.ts fruitCount), 🍑 🥥 🍎 🍐 left to right. A kind with nothing yet shows one faded item
  // where it will fall. When a kind earns an item (a check-in), the tree shakes (±4°, 3 swings, 500ms)
  // and the new item drops in with a bounce; all three = a sparkle. Narrow stages (< 360px) show one item
  // per kind, sized by its count. The tree stands still otherwise (v5 §6 idle budget).
  // Two buttons: the canopy (shakes the tree, drops two seasonal leaves, shows the detail bubble with
  // all four %) and the fruit row (≥ 44px tall, same bubble with the nearest fruit highlighted).
  // `shakeN` (bumped by idle life) shakes the tree without the bubble; `celebrate` pops + sparkles a fruit.
  import { onDestroy, untrack } from 'svelte';
  import type { FruitKey, PersonWeekView } from '#lib/types.ts';
  import type { Foliage } from '#lib/ui-state/season.ts';
  import { FRUITS } from '#lib/config/rules.ts';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import Fx from '../characters/Fx.svelte';
    import { fruitArt } from '#lib/art.ts';
  import { seasonArt, treeArt } from '#lib/art.ts';
  import { t } from '#lib/i18n/index.ts';
  import { FRUIT_SPOTS, FRUIT_U, OAK_AR, PILE, TREE, fruitCount, u } from './scene.ts';

  interface Props {
    person: PersonWeekView;
    /** Trunk centre in stage units. */
    x: number;
    foliage: Foliage;
    shakeN?: number;
    celebrate?: { fruit: FruitKey; n: number } | null;
    /** A sheet or the harvest covers the scene: the popup closes (it never shows behind a sheet). */
    covered?: boolean;
  }
  let { person, x, foliage, shakeN = 0, celebrate = null, covered = false }: Props = $props();

  const H = TREE.h, W = TREE.h * OAK_AR, BASE = TREE.base;
  let open = $state(false);
  let picked = $state<FruitKey | null>(null);
  let taps = $state(0);
  let timer: ReturnType<typeof setTimeout> | null = null;
  const leafTimers = new Set<ReturnType<typeof setTimeout>>();
  onDestroy(() => {
    if (timer) clearTimeout(timer);
    for (const t of leafTimers) clearTimeout(t);
  });
  let leaves = $state<{ n: number; x: number; y: number }[]>([]);
  let leafN = 0;
  let treeEl: HTMLElement | null = $state(null);

  const pct = (f: FruitKey) => Math.max(0, Math.min(100, Math.round(person.fruits[f].pct)));
  const label = $derived(
    `${person.villagerName}: ` + FRUITS.map((f) => t('fruit.pct', { label: t(`fruit.${f}`), pct: pct(f) })).join('、')
  );
  const spots = $derived(FRUITS.map((f, i) => ({ f, n: fruitCount(pct(f)), x: x + FRUIT_SPOTS[i][0], y: BASE + FRUIT_SPOTS[i][1] })));
  const rowL = $derived(Math.min(...spots.map((s) => s.x)) - FRUIT_U);
  const rowR = $derived(Math.max(...spots.map((s) => s.x)) + FRUIT_U);

  // A newly earned item drops in (never on the first render) and the tree shakes once for it.
  let ready = false;
  let prevN = '';
  $effect(() => {
    const key = spots.map((s) => s.n).join();
    untrack(() => {
      const before = prevN.split(',').map(Number);
      if (ready && spots.some((s, i) => s.n > (before[i] ?? 0))) shake();
      prevN = key;
      ready = true;
    });
  });
  /** {@attach}: items that mount after the first render fall in from the canopy. */
  const dropIn = (el: HTMLElement) => {
    if (ready) el.classList.add('drop');
  };

  function shake() {
    const el = treeEl;
    if (!el) return;
    el.classList.remove('shaking');
    void el.offsetWidth;
    el.classList.add('shaking');
    const a = ++leafN, b = ++leafN;
    const y = BASE - H * 0.55;
    leaves = [...leaves.slice(-2), { n: a, x: x - W * 0.3, y }, { n: b, x: x + W * 0.28, y }];
    const lt = setTimeout(() => {
      leafTimers.delete(lt);
      leaves = leaves.filter((l) => l.n !== a && l.n !== b);
    }, 2000);
    leafTimers.add(lt);
  }

  // React to `shakeN` only (shake() reads and writes `leaves`, which must not become a dependency).
  $effect(() => {
    if (shakeN > 0) untrack(shake);
  });

  $effect(() => {
    if (covered) open = false;
  });

  function tap(f: FruitKey | null) {
    if (!f) shake();
    picked = f;
    taps++;
    open = true;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => (open = false), 2600);
  }

  /** The fruit nearest the tap along the row (keyboard: none highlighted). */
  function fruitAt(e: MouseEvent): FruitKey | null {
    const btn = e.currentTarget as HTMLElement;
    if (!e.detail || !btn) return null;
    const r = btn.getBoundingClientRect();
    const px = rowL + ((e.clientX - r.left) / r.width) * (rowR - rowL);
    let best = spots[0];
    for (const s of spots) if (Math.abs(s.x - px) < Math.abs(best.x - px)) best = s;
    return best.f;
  }

  /** {@attach}: keep the popup inside the scene (8px margin) and under the HUD and its 44px ribbon (≈ 112px), measured from
   *  its layout box (offsetLeft/Top ignore the pop-in transform). The tail stays on the tree. */
  function keepInside(el: HTMLElement) {
    const scene = el.closest('.scene');
    const stage = el.offsetParent as HTMLElement | null;
    if (!scene || !stage) return;
    const sc = scene.getBoundingClientRect(), st = stage.getBoundingClientRect();
    const w = el.offsetWidth, h = el.offsetHeight;
    const left = st.left + el.offsetLeft - w / 2, top = st.top + el.offsetTop - h;
    let dx = 0;
    if (left < sc.left + 8) dx = sc.left + 8 - left;
    else if (left + w > sc.right - 8) dx = sc.right - 8 - (left + w);
    const dy = Math.max(0, sc.top + 112 - top);
    el.style.marginLeft = `${dx}px`;
    el.style.marginTop = `${dy}px`;
    el.style.setProperty('--tail', `${-dx}px`);
  }

  const leafKey = $derived(foliage === 'blossom' ? seasonArt('petal') : foliage === 'fall' ? seasonArt('maple-leaf') : foliage === 'snow' ? seasonArt('snowflake') : null);
</script>

<div class="tree" bind:this={treeEl} style:left={u(x)} style:top={u(BASE)} style:width={u(W)} style:height={u(H)}
  onanimationend={(e) => e.animationName === 'if-shake' && treeEl?.classList.remove('shaking')}>
  <span class="oak"><OfficialArt key={treeArt(foliage)} size={u(H)} eager /></span>
</div>
<button type="button" class="canopy" style:left={u(x - W / 2)} style:top={u(BASE - H)} style:width={u(W)}
  style:height={u(H * 0.62)} aria-label={label} aria-expanded={open} onclick={() => tap(null)}></button>

{#each spots as s (s.f)}
  {#each PILE.slice(0, Math.max(1, s.n)) as [px, py], k (k)}
    <span class="fruit k{k} n{s.n}" class:ghost={s.n === 0} style:left={u(s.x + px)} style:top={u(s.y + py)} style:width={u(FRUIT_U)}
      style:z-index={33 + (py > 0 ? 1 : 0)}>
      <span class="f" {@attach dropIn}>
        <OfficialArt key={fruitArt(s.f)} size={u(FRUIT_U)} eager>
          {#snippet fallback()}<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#f-{s.f}" /></svg>{/snippet}
        </OfficialArt>
      </span>
      {#if k === 0 && celebrate?.fruit === s.f}
        {#key celebrate.n}<span class="fxa"><Fx kind="sparkles" spread={u(30)} /></span>{/key}
      {/if}
    </span>
  {/each}
{/each}
<button type="button" class="row-btn" style:left={u(rowL)} style:top={u(BASE + 8)} style:width={u(rowR - rowL)}
  aria-label={label} aria-expanded={open} tabindex="-1" onclick={(e) => tap(fruitAt(e))}></button>

{#each leaves as l (l.n)}
  <span class="leaf" style:left={u(l.x)} style:top={u(l.y)}>
    {#if leafKey}<OfficialArt key={leafKey} size="12px" />
    {:else}<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M2 14 Q2 3 14 2 Q13 13 2 14 Z" fill="var(--c-leaf)" /></svg>{/if}
  </span>
{/each}

{#if open}
  {#key taps}
    <div class="detail" role="status" style:left={u(x)} style:top={u(BASE - H + 4)} {@attach keepInside}>
      {#each FRUITS as f (f)}
        <span class="row" class:on={picked === f}>
          <span class="ic"><OfficialArt key={fruitArt(f)} size="20px" eager /></span>
          <span class="lbl">{t(`fruit.${f}`)}</span>
          <b class="money">{pct(f)}%</b>
        </span>
      {/each}
    </div>
  {/key}
{/if}

<style>
  .tree { position: absolute; z-index: 30; transform-origin: 50% 100%; translate: -50% -100%; pointer-events: none; }
  .tree:global(.shaking) { animation: if-shake 500ms ease-in-out 1; }
  .oak { position: absolute; inset: 0; display: flex; justify-content: center; line-height: 0; }
  /* fruit items lie on the ground (z above the trunk, below the villagers) */
  .fruit { position: absolute; aspect-ratio: 1; translate: -50% -50%; line-height: 0; pointer-events: none; }
  .f { display: block; transform-origin: 50% 100%; }
  /* round 7: a soft radial contact shadow under each item (0.45 of its size, +6% right and down) */
  .fruit::before {
    content: ''; position: absolute; z-index: -1; left: 11%; width: 90%; bottom: -8%; height: 26%; border-radius: 50%;
    background: radial-gradient(closest-side, var(--sh-c), transparent); pointer-events: none;
  }
  .fruit.ghost::before { opacity: .4; }
  /* nothing earned yet: one faded, smaller item where it will fall */
  .fruit.ghost .f { scale: .7; opacity: .4; }
  .fruit.ghost :global(.official) { filter: saturate(0); }
  /* a newly earned item falls from the canopy and bounces (250ms after the shake starts) */
  .f:global(.drop) { animation: fruit-drop 520ms cubic-bezier(.3, 0, .5, 1) both; }
  @keyframes fruit-drop {
    0% { transform: translateY(-260%); opacity: 0; } 15% { opacity: 1; }
    55% { transform: translateY(0) scale(1.12, .86); } 72% { transform: translateY(-30%) scale(.96, 1.04); }
    86% { transform: translateY(0) scale(1.04, .96); } 100% { transform: none; }
  }
  /* narrow stages: one item per kind, sized by its count (readable at 320) */
  @container (max-width: 359px) {
    .fruit.k1, .fruit.k2 { display: none; }
    .fruit.ghost .f { scale: 1; }
    .fruit.n1 .f { scale: 1.15; } .fruit.n2 .f { scale: 1.3; } .fruit.n3 .f { scale: 1.5; }
  }
  .fxa { position: absolute; left: 50%; top: 30%; width: 0; height: 0; }
  .canopy, .row-btn {
    position: absolute; z-index: 32; appearance: none; border: 0; background: none; padding: 0;
    cursor: pointer; border-radius: 45%; -webkit-tap-highlight-color: transparent;
  }
  /* the fruit row: ≥ 44px tall around the items, above the villagers' heads (z 51/52 start lower) */
  .row-btn { z-index: 34; translate: 0 -50%; height: max(44px, calc(30 * 100cqw / 390)); border-radius: 22px; }
  .canopy:focus-visible, .row-btn:focus-visible { outline: 3px solid var(--focus); outline-offset: -4px; }
  .leaf { position: absolute; z-index: 70; line-height: 0; pointer-events: none; animation: leaf 1800ms ease-in both; }
  @keyframes leaf {
    0% { transform: translate(0, 0) rotate(0); opacity: 0; } 10% { opacity: 1; }
    40% { transform: translate(-10px, 40px) rotate(120deg); } 75% { transform: translate(8px, 80px) rotate(240deg); opacity: 1; }
    100% { transform: translate(0, 110px) rotate(320deg); opacity: 0; }
  }
  /* NH-style popup: a 2 × 2 grid of rows (icon · label · %), fixed columns so text and icons never overlap */
  .detail {
    position: absolute; z-index: 95; translate: -50% -100%; display: grid; grid-template-columns: repeat(2, auto); gap: 4px 8px;
    background: var(--plate); border-radius: var(--r-btn); padding: 8px 10px; white-space: nowrap;
    box-shadow: 0 4px 0 var(--plate-lip); color: var(--plate-ink); pointer-events: none;
    transform-origin: 50% 100%; animation: if-pop 360ms var(--ease-bounce) both;
  }
  .detail::after {
    content: ''; position: absolute; left: calc(50% + var(--tail, 0px)); bottom: -5px; width: 10px; height: 10px; margin-left: -5px;
    background: inherit; transform: rotate(45deg);
  }
  .row {
    display: grid; grid-template-columns: 20px auto 3.2em; align-items: center; gap: 6px;
    padding: 2px 6px; border-radius: var(--r-chip); line-height: 1;
  }
  .row.on { background: var(--c-yuzu); }
  .ic { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; line-height: 0; }
  .lbl { font: 500 var(--fs-s)/1.2 var(--font-ui); }
  /* narrow stages: one column (≈ 160px), so the popup fits over its own tree (sizing #10) */
  @container (max-width: 359px) { .detail { grid-template-columns: auto; } }
  .row b { font: 700 var(--fs-s)/1.2 var(--font-num); text-align: right; }
  @media (prefers-reduced-motion: reduce) {
    .tree, .tree:global(.shaking), .leaf { animation: none; }
    .f:global(.drop), .detail { animation: none; }
  }
</style>
