<script lang="ts">
  // One person's tree (round 6, faithful to AC; ADR 0021): a plain official hardwood of the season (an AC tree bears one
  // kind of fruit, so this one bears none), with today's fruit lying on the ground in front of the trunk, the way NH
  // drops fruit around a shaken tree: per ring fruit 0–3 items = thirds of today's goal (scene.ts fruitCount),
  // 🍑 🍐 🍒 🍎 🥥 left to right (RING_FRUITS). A kind with nothing yet shows one faint item where it will fall. When a
  // kind earns an item (new data from the Watch), the tree shakes (±4°, 3 swings, 500ms) and the new item drops in with
  // a bounce. Narrow stages (< 360px) show one item per kind, sized by its count. The tree stands still otherwise
  // (v5 §6 idle budget).
  // Two buttons: the canopy (shakes the tree, drops two seasonal leaves, toggles the popup) and the fruit row (≥ 44px
  // tall, same popup with the nearest fruit highlighted). The popup is the one home of a person's per-fruit detail
  // (round 17 IA §3.1): a nameplate (whose tree), then per fruit today / goal, today's ベル and the week's badge pips
  // (●●●○○ = 3 of 5 days; ✓ once the badge is met). It stays until this tree is tapped again, the other tree is
  // tapped, or a tap lands elsewhere. `shakeN` (bumped by idle life) shakes the tree without the popup; `celebrate`
  // pops + sparkles a fruit.
  import { onDestroy, untrack } from 'svelte';
  import type { PersonWeekView, RingFruit } from '#lib/types.ts';
  import type { Foliage } from '#lib/ui-state/season.ts';
  import { RING_FRUITS } from '#lib/config/rules.ts';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import Fx from '../characters/Fx.svelte';
  import { fruitArt, seasonArt, treeArt } from '#lib/art.ts';
  import { formatBells, formatNum, t } from '#lib/i18n/index.ts';
  import { todayAmount, todayPct } from './progress.ts';
  import { FRUIT_LEAN, FRUIT_SPOTS, FRUIT_U, JAR, OAK_AR, PILE, TREE, fruitCount, u } from './scene.ts';
  import { cue } from '#lib/sound/cues.ts';

  interface Props {
    person: PersonWeekView;
    /** Trunk centre in stage units. */
    x: number;
    foliage: Foliage;
    shakeN?: number;
    celebrate?: { fruit: RingFruit; n: number } | null;
    /** This tree's detail popup is the open one (the scene keeps at most one; it closes it when covered or tapped away). */
    open?: boolean;
    /** A tap on this tree: open its popup (true) or close it (false). */
    ontoggle?: (open: boolean) => void;
  }
  let { person, x, foliage, shakeN = 0, celebrate = null, open = false, ontoggle }: Props = $props();

  const H = TREE.h, W = TREE.h * OAK_AR, BASE = TREE.base;
  const detailId = $props.id();
  let picked = $state<RingFruit | null>(null);
  let taps = $state(0);
  const leafTimers = new Set<ReturnType<typeof setTimeout>>();
  onDestroy(() => {
    for (const t of leafTimers) clearTimeout(t);
  });
  let leaves = $state<{ n: number; x: number; y: number }[]>([]);
  let leafN = 0;
  let treeEl: HTMLElement | null = $state(null);

  const ring = (f: RingFruit) => person.rings[f];
  const amount = (f: RingFruit) => todayAmount(f, ring(f));
  /** The week's pips: one per badge day, filled up to the days met so far. */
  const pips = (f: RingFruit) => Array.from({ length: ring(f).weekGoalDays }, (_, i) => i < ring(f).weekDays);
  const label = $derived(
    `${person.villagerName}: ` +
      RING_FRUITS.map((f) => {
        const r = ring(f);
        const bells = r.todayBells > 0 ? formatBells(r.todayBells, { signed: true }) : '';
        return `${t(`fruit.${f}`)} ${amount(f)} ${bells} ${t('tree.week', { d: Math.min(r.weekDays, r.weekGoalDays), w: r.weekGoalDays })}${r.badge ? ' ✓' : ''}`;
      }).join('、')
  );
  /** The fruit row leans away from the jar (left tree left, right tree right). */
  const lean = $derived(x < JAR.x ? -FRUIT_LEAN : FRUIT_LEAN);
  const spots = $derived(RING_FRUITS.map((f, i) => ({ f, n: fruitCount(todayPct(ring(f))), x: x + lean + FRUIT_SPOTS[i][0], y: BASE + FRUIT_SPOTS[i][1] })));
  const rowL = $derived(Math.min(...spots.map((s) => s.x)) - FRUIT_U);
  const rowR = $derived(Math.max(...spots.map((s) => s.x)) + FRUIT_U);

  // A newly earned item drops in (never on the first render) and the tree shakes once for it.
  let ready = false;
  let prevN = '';
  $effect(() => {
    const key = spots.map((s) => s.n).join();
    untrack(() => {
      const before = prevN.split(',').map(Number);
      if (ready && spots.some((s, i) => s.n > (before[i] ?? 0))) shake(true);
      prevN = key;
      ready = true;
    });
  });
  /** {@attach}: items that mount after the first render fall in from the canopy (and thud as they land). */
  const dropIn = (el: HTMLElement) => {
    if (!ready) return;
    el.classList.add('drop');
    cue('fruit-land');
  };

  /** `sound`: a tap or a real event rustles; idle life's shake stays silent (round 14 review). */
  function shake(sound = false) {
    const el = treeEl;
    if (!el) return;
    if (sound) cue('tree-shake');
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
    if (shakeN > 0) untrack(() => shake());
  });

  /** A tap on the canopy or the fruit row: closes this tree's popup if it's open, else shakes (canopy) and opens it. */
  function tap(f: RingFruit | null) {
    if (open) {
      cue('tick');
      return ontoggle?.(false);
    }
    if (!f) shake(true);
    else cue('tick'); // the fruit row: no shake, just its popup
    picked = f;
    taps++;
    ontoggle?.(true);
  }

  /** The fruit nearest the tap along the row (keyboard: none highlighted). */
  function fruitAt(e: MouseEvent): RingFruit | null {
    const btn = e.currentTarget as HTMLElement;
    if (!e.detail || !btn) return null;
    const r = btn.getBoundingClientRect();
    const px = rowL + ((e.clientX - r.left) / r.width) * (rowR - rowL);
    let best = spots[0];
    for (const s of spots) if (Math.abs(s.x - px) < Math.abs(best.x - px)) best = s;
    return best.f;
  }

  /** {@attach}: keep the popup inside the scene (8px margin) and under the HUD and its 44px ribbon (≈ 112px, + the nameplate), measured from
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
    const dy = Math.max(0, sc.top + 128 - top);
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
  style:height={u(H * 0.62)} aria-label={label} aria-expanded={open} aria-controls={detailId} data-sfx="self" onclick={() => tap(null)}></button>

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
  aria-label={label} aria-expanded={open} aria-controls={detailId} tabindex="-1" data-sfx="self" onclick={(e) => tap(fruitAt(e))}></button>

{#each leaves as l (l.n)}
  <span class="leaf" style:left={u(l.x)} style:top={u(l.y)}>
    {#if leafKey}<OfficialArt key={leafKey} size="12px" />
    {:else}<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M2 14 Q2 3 14 2 Q13 13 2 14 Z" fill="var(--c-leaf)" /></svg>{/if}
  </span>
{/each}

{#if open}
  {#key taps}
    <div class="detail" id={detailId} role="status" style:left={u(x)} style:top={u(BASE - H + 4)} {@attach keepInside}>
      <span class="plate">{person.villagerName}</span>
      <span class="row hd" aria-hidden="true"><span></span><span class="lbl"></span><span>{t('tree.today')}</span><span>{t('bells.unit')}</span><span>{t('tree.thisWeek')}</span></span>
      {#each RING_FRUITS as f (f)}
        {@const r = ring(f)}
        <span class="row" class:on={picked === f}>
          <span class="ic"><OfficialArt key={fruitArt(f)} size="20px" eager /></span>
          <span class="lbl">{t(`fruit.${f}`)}</span>
          <span class="amt money" class:met={r.met}>{amount(f)}</span>
          <b class="money" class:zero={!r.todayBells}>{r.todayBells > 0 ? `+${formatNum(r.todayBells)}` : '—'}</b>
          <span class="pips" class:badge={r.badge}>{#if r.badge}<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check" /></svg>{:else}{#each pips(f) as on, i (i)}<i class:on></i>{/each}{/if}</span>
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
  .fruit.ghost::before { display: none; }
  /* nothing earned yet: a small flat silhouette where it will fall, like NH's catalogue "not yet" (round 16 #19: a
     faded copy read as grey pebbles) */
  .fruit.ghost .f { scale: .7; opacity: .2; }
  .fruit.ghost :global(.official) { filter: brightness(0); }
  /* a newly earned item falls from the canopy and bounces (250ms after the shake starts) */
  .f:global(.drop) { animation: fruit-drop 520ms cubic-bezier(.3, 0, .5, 1) both; }
  @keyframes fruit-drop {
    0% { transform: translateY(-260%); opacity: 0; } 15% { opacity: 1; }
    55% { transform: translateY(0) scale(1.12, .86); } 72% { transform: translateY(-30%) scale(.96, 1.04); }
    86% { transform: translateY(0) scale(1.04, .96); } 100% { transform: none; }
  }
  /* narrow stages: one item per kind, sized by its count (readable at 320; five kinds at 22u pitch leave room for
     ×1.25 at most) */
  @container (max-width: 359px) {
    .fruit.k1, .fruit.k2 { display: none; }
    .fruit.ghost .f { scale: .85; }
    .fruit.n1 .f { scale: 1; } .fruit.n2 .f { scale: 1.12; } .fruit.n3 .f { scale: 1.25; }
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
  /* NH-style popup: a nameplate, a faint column head, then one row per fruit (icon · word · today/goal · ベル · the
     week's pips), in shared columns (subgrid) so the numbers line up */
  .detail {
    position: absolute; z-index: 95; translate: -50% -100%; display: grid; grid-template-columns: 20px auto auto auto auto; gap: 3px 0;
    background: var(--plate); border-radius: var(--r-btn); padding: 16px 10px 8px; white-space: nowrap;
    box-shadow: 0 4px 0 var(--plate-lip); color: var(--plate-ink); pointer-events: none;
    transform-origin: 50% 100%; animation: if-pop 360ms var(--ease-bounce) both;
  }
  .detail::after {
    content: ''; position: absolute; left: calc(50% + var(--tail, 0px)); bottom: -5px; width: 10px; height: 10px; margin-left: -5px;
    background: inherit; transform: rotate(45deg);
  }
  /* whose tree (round 16 #15): NH's tilted yuzu nameplate on the bubble's top edge */
  .plate {
    position: absolute; left: 10px; top: 0; translate: 0 -55%; rotate: -3deg; padding: 3px 10px; border-radius: var(--r-pill);
    background: var(--c-yuzu); color: var(--c-ink); font: 700 var(--fs-s)/1.2 var(--font-ui); box-shadow: 0 2px 0 var(--c-yuzu-lip);
    max-width: calc(100% - 20px); overflow: hidden; text-overflow: ellipsis;
  }
  .row {
    grid-column: 1 / -1; display: grid; grid-template-columns: subgrid; align-items: center; column-gap: 8px;
    padding: 3px 6px; border-radius: var(--r-chip); line-height: 1;
  }
  .row.hd { padding-block: 0 1px; font: 700 var(--fs-xs)/1.2 var(--font-ui); color: var(--c-ink-soft); }
  .row.hd > :nth-child(n + 3) { text-align: right; }
  .row.hd > :last-child { text-align: left; }
  .row.on { background: var(--c-yuzu); }
  .ic { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; line-height: 0; }
  .lbl { font: 500 var(--fs-s)/1.2 var(--font-ui); }
  .amt { font: 700 var(--fs-s)/1.2 var(--font-num); text-align: right; color: var(--c-ink-soft); }
  .amt.met { color: var(--c-leaf-text); }
  .row b { font: 700 var(--fs-s)/1.2 var(--font-num); text-align: right; }
  .row b.zero { color: var(--c-ink-soft); font-weight: 500; }
  /* the week toward the badge: one pip per day needed, filled per day met; a ✓ disc once the badge is met */
  .pips { display: flex; gap: 2px; align-items: center; min-width: 38px; }
  .pips i { width: 6px; height: 6px; border-radius: 50%; background: color-mix(in srgb, var(--plate-ink) 22%, transparent); }
  .pips i.on { background: var(--c-leaf-edge); }
  .pips.badge svg { width: 16px; height: 16px; padding: 2px; border-radius: 50%; background: var(--c-leaf); color: var(--c-ink); }
  /* narrow stages: the word goes (the fruit art says which), so the popup fits over its own tree (sizing #10) */
  @container (max-width: 359px) {
    .detail { grid-template-columns: 20px auto auto auto; }
    .lbl { display: none; }
    .row { column-gap: 10px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .tree, .tree:global(.shaking), .leaf { animation: none; }
    .f:global(.drop), .detail { animation: none; }
  }
</style>
