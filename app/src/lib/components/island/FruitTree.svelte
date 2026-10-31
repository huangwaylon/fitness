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
  // (●●●○○ = 3 of 5 days; ✓ once the badge is met). Under the 🥥 row, two check chips きのう / きょう turn this
  // person's gym day on or off with one tap (`gym_set`, ADR 0023: a forgotten arrival or a false one; held 5 s with
  // とりけす like every edit; a locked week's chip shows 🔒). It stays until this tree is tapped again, the other tree is
  // tapped, or a tap lands elsewhere (a chip keeps it open). `shakeN` (bumped by idle life) shakes the tree without the popup; `celebrate`
  // pops + sparkles a fruit.
  import { onDestroy, untrack } from 'svelte';
  import type { PersonWeekView, RingFruit } from '#lib/types.ts';
  import type { Foliage } from '#lib/ui-state/season.ts';
  import { RING_FRUITS } from '#lib/config/rules.ts';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import Fx from '../characters/Fx.svelte';
  import Glyph from '../kiroku/Glyph.svelte';
  import { fruitArt, seasonArt, treeArt } from '#lib/art.ts';
  import { formatBells, formatNum, t } from '#lib/i18n/index.ts';
  import { todayAmount, todayPct } from './progress.ts';
  import { FRUIT_LEAN, FRUIT_SPOTS, FRUIT_U, JAR, OAK_AR, PILE, TREE, fruitCount, u } from './scene.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { gymChips, type GymChip } from '#lib/model/gym.ts';
  import { EDIT_CUTOFF_MS, setGym, undoBanner } from '#lib/store/actions.ts';

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
    /** The popup's gym chips can edit (the live island; never the gallery's thumbnails). */
    editable?: boolean;
  }
  let { person, x, foliage, shakeN = 0, celebrate = null, open = false, ontoggle, editable = false }: Props = $props();

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

  /** Yesterday's and today's 🥥 (only while the popup is open), and whether each can still change. */
  const gym = $derived.by(() => {
    const m = open && editable ? week.model : null;
    if (!m) return null;
    return gymChips(m.state, person.person, m.now).map((c) => ({ ...c, can: c.open && m.now < c.lockAt - EDIT_CUTOFF_MS }));
  });
  function toggleGym(c: GymChip & { can: boolean }) {
    if (!c.can) return;
    const mine = person.person === week.view?.me;
    const day = `${mine ? '' : `${person.villagerName} `}${t(`tree.${c.which}`)}`;
    undoBanner(t(c.on ? 'kiroku.savedGymOff' : 'kiroku.savedGymOn', { day }), setGym(person.person, c.date, !c.on));
  }
  const amount = (f: RingFruit) => todayAmount(f, ring(f));
  /** The one nudge (v2 milestones, docs/reviews/round-19/milestones-contract.md): 「あと 8分で +45」 for the tapped fruit,
   *  else for the fruit nearest its next step (by share of the goal). None in a v1 week or once every step is reached. */
  const next = $derived.by((): { f: RingFruit; text: string } | null => {
    const open = RING_FRUITS.filter((f) => ring(f).nextAt != null && ring(f).nextGain != null);
    if (!open.length) return null;
    const gap = (f: RingFruit) => (ring(f).nextAt! - ring(f).today) / (ring(f).goal || 1);
    const f = picked && open.includes(picked) ? picked : open.reduce((a, b) => (gap(b) < gap(a) ? b : a));
    const r = ring(f);
    return { f, text: t(`tree.next.${f}`, { n: formatNum(Math.max(1, Math.ceil(r.nextAt! - r.today))), b: formatNum(r.nextGain!) }) };
  });
  const label = $derived(
    `${person.villagerName}: ` +
      RING_FRUITS.map((f) => {
        const r = ring(f);
        const bells = r.todayBells > 0 ? formatBells(r.todayBells, { signed: true }) : '';
        return `${t(`fruit.${f}`)} ${amount(f)} ${bells} ${t('tree.week', { d: Math.min(r.weekDays, r.weekGoalDays), w: r.weekGoalDays })}${r.badge ? ' ✓' : ''}`;
      }).join('、') + (next ? `。${next.text}` : '')
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

  /** {@attach}: keep the popup inside the scene (8px margin) and under the HUD (its measured bottom + room for the
   *  nameplate), measured from its layout box (offsetLeft/Top ignore the pop-in transform). It always opens upwards,
   *  its tail on the tree (round 20, user); where the sky is short it is pushed down over the canopy, never flipped. */
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
    const hud = document.querySelector('.ribbon-wrap');
    const floor = hud ? hud.getBoundingClientRect().bottom + 16 : sc.top + 88;
    el.style.marginLeft = `${dx}px`;
    el.style.marginTop = `${Math.max(0, floor - top)}px`;
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
      style:z-index={py > 0 ? 'calc(var(--z-fruit) + 1)' : 'var(--z-fruit)'}>
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
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="detail" id={detailId} role="status" onpointerdown={() => cue('tick')} style:left={u(x)} style:top={u(BASE - H + 4)} {@attach keepInside}>
      <span class="plate">{person.villagerName}</span>
      <span class="row hd" aria-hidden="true"><span></span><span class="lbl"></span><span>{t('tree.today')}</span><span></span><span>{t('bells.unit')}</span><span>{t('tree.thisWeek')}</span></span>
      {#each RING_FRUITS as f (f)}
        {@const r = ring(f)}
        <span class="row" class:on={picked === f}>
          <span class="ic"><OfficialArt key={fruitArt(f)} size="20px" eager /></span>
          <span class="lbl">{t(`fruit.${f}`)}</span>
          <span class="amt money" class:met={r.met}>{amount(f)}</span>
          <!-- today's milestones (v2): four pips filling up toward the goal -->
          <span class="steps">{#if r.milestone !== undefined}{#each [1, 2, 3, 4] as k (k)}<i class:on={k <= r.milestone}></i>{/each}{/if}</span>
          <b class="money" class:zero={!r.todayBells}>{r.todayBells > 0 ? `+${formatNum(r.todayBells)}` : '—'}</b>
          <!-- the week toward the badge: days met / days needed, a ✓ disc once it's earned -->
          <span class="wk money" class:badge={r.badge}>{#if r.badge}<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check" /></svg>{:else}{Math.min(r.weekDays, r.weekGoalDays)}/{r.weekGoalDays}{/if}</span>
        </span>
        {#if f === 'coconut' && gym}
          <!-- the gym row's quick fix: yesterday / today, one tap each (a chip tap keeps the popup open: IslandScene) -->
          <span class="gym" role="group" aria-label={t('kiroku.gym')}>
            {#each gym as c (c.date)}
              <button type="button" class="gym-chip" aria-pressed={c.on} aria-disabled={c.can ? undefined : 'true'} data-sfx={c.on ? 'toggle-off' : 'toggle-on'}
                data-day={c.which} aria-label={t('tree.gymChip', { name: person.villagerName, day: t(`tree.${c.which}`) })}
                onpointerdown={(e) => e.stopPropagation()} onclick={() => toggleGym(c)}>
                <span class="box" aria-hidden="true">{#if !c.can}<Glyph kind="lock" size={14} />{:else if c.on}<svg viewBox="0 0 24 24"><use href="#i-check" /></svg>{/if}</span>{t(`tree.${c.which}`)}
              </button>
            {/each}
          </span>
        {/if}
      {/each}
      {#if next}<span class="next"><OfficialArt key={fruitArt(next.f)} size="16px" eager />{next.text}</span>{/if}
    </div>
  {/key}
{/if}

<style>
  .tree { position: absolute; z-index: var(--z-tree); transform-origin: 50% 100%; translate: -50% -100%; pointer-events: none; }
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
    position: absolute; z-index: var(--z-canopy); appearance: none; border: 0; background: none; padding: 0;
    cursor: pointer; border-radius: 45%; -webkit-tap-highlight-color: transparent;
  }
  /* the fruit row: ≥ 44px tall around the items, above the villagers' heads (z 51/52 start lower) */
  .row-btn { z-index: var(--z-fruit-row); translate: 0 -50%; height: max(44px, calc(30 * 100cqw / 390)); border-radius: 22px; }
  .canopy:focus-visible, .row-btn:focus-visible { outline: 3px solid var(--focus); outline-offset: -4px; }
  .leaf { position: absolute; z-index: var(--z-leaf); line-height: 0; pointer-events: none; animation: leaf 1800ms ease-in both; }
  @keyframes leaf {
    0% { transform: translate(0, 0) rotate(0); opacity: 0; } 10% { opacity: 1; }
    40% { transform: translate(-10px, 40px) rotate(120deg); } 75% { transform: translate(8px, 80px) rotate(240deg); opacity: 1; }
    100% { transform: translate(0, 110px) rotate(320deg); opacity: 0; }
  }
  /* NH-style popup: a nameplate, a faint column head, then one row per fruit (icon · word · today/goal · ベル · the
     week's pips), in shared columns (subgrid) so the numbers line up */
  .detail {
    position: absolute; z-index: var(--z-popup); translate: -50% -100%; display: grid; grid-template-columns: 20px auto auto auto auto auto; gap: 3px 0;
    background: var(--plate); border-radius: var(--r-btn); padding: 16px 10px 8px; white-space: nowrap;
    box-shadow: 0 4px 0 var(--plate-lip); color: var(--plate-ink);
    /* it takes the tap that lands on it (the scene's tap-away closes it), so a tap on the popup never reaches the jar or
       the other tree drawn under it (at 320 it covers the jar's lid) */
    pointer-events: auto; cursor: default;
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
  /* today's milestones: four small pips (yuzu = reached), one per 25% of the goal */
  .steps { display: flex; gap: 2px; align-items: center; }
  .steps i { width: 6px; height: 6px; border-radius: 50%; background: color-mix(in srgb, var(--plate-ink) 22%, transparent); }
  .steps i.on { background: var(--c-yuzu-lip); }
  /* the week toward the badge: 「2/5」 days, or a ✓ disc once the badge is earned */
  .wk { font: 700 var(--fs-xs)/1 var(--font-num); color: var(--c-ink-soft); min-width: 22px; text-align: left; }
  .wk.badge svg { width: 16px; height: 16px; padding: 2px; border-radius: 50%; background: var(--c-leaf); color: var(--c-ink); display: block; }
  /* the 🥥 row's two check chips (きのう / きょう): ≥ 44px tall, a box that fills leaf green with ✓ when it is a gym day */
  .gym { grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 6px; padding: 0 2px 2px; }
  .gym-chip {
    appearance: none; border: 0; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; min-height: 44px; min-width: 44px;
    padding: 0 12px 0 8px; border-radius: var(--r-pill); font: 700 var(--fs-s)/1 var(--font-ui); color: var(--plate-ink);
    background: color-mix(in srgb, var(--plate-ink) 8%, transparent); -webkit-tap-highlight-color: transparent;
  }
  .gym-chip .box {
    width: 20px; height: 20px; flex: none; border-radius: 6px; display: grid; place-items: center; line-height: 0;
    box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--plate-ink) 40%, transparent);
  }
  .gym-chip .box svg { width: 14px; height: 14px; }
  .gym-chip[aria-pressed='true'] { background: color-mix(in srgb, var(--c-leaf) 30%, transparent); }
  .gym-chip[aria-pressed='true'] .box { background: var(--c-leaf); color: var(--c-ink); box-shadow: none; }
  .gym-chip[aria-disabled='true'] { cursor: default; opacity: .6; }
  .gym-chip[aria-disabled='true'] .box { box-shadow: none; color: var(--c-ink-soft); }
  .gym-chip:active:not([aria-disabled='true']) { transform: translateY(1px); }
  .gym-chip:focus-visible { outline: 3px solid var(--focus); outline-offset: 1px; }
  /* the one nudge: what the next step pays */
  .next {
    grid-column: 1 / -1; display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 3px; padding: 5px 8px 1px;
    border-top: 1px dashed color-mix(in srgb, var(--plate-ink) 25%, transparent); font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--plate-ink);
  }
  /* narrow stages: the word goes (the fruit art says which), so the popup fits over its own tree (sizing #10) */
  @container (max-width: 400px) {
    .detail { grid-template-columns: 20px auto auto auto auto; }
    .lbl { display: none; }
    .row { column-gap: 10px; }
    /* the longest value (2,384/8,000歩) ran into its fruit (1px); keep a clear gap (round 21) */
    .amt { padding-left: 4px; }
  }
  /* short screens: tighter rows, so the popup covers less of the canopy when the sky is short (keepInside) */
  @media (max-height: 700px) {
    .detail { gap: 0; padding: 14px 8px 6px; }
    .row { padding-block: 2px; }
  }
  @media (max-height: 600px) {
    .detail { padding: 13px 6px 4px; }
    .row { padding-block: 1px; }
    .next { margin-top: 2px; padding-top: 3px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .tree, .tree:global(.shaking), .leaf { animation: none; }
    .f:global(.drop), .detail { animation: none; }
  }
</style>
