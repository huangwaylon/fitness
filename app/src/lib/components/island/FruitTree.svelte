<script lang="ts">
  // One person's tree (docs/design.md "Trees"): a plain official hardwood of the season with today's four fruits in its
  // canopy, 🍐 🍑 🍒 🍎 left to right (RING_FRUITS, TREE_FRUIT). Each hangs grey at 0 and fills with colour as today's
  // amount nears its goal (fruitDay.ts greyAt). Once met it drops to the ground in front of the trunk (FRUIT_SPOTS): the
  // tree shakes, the fruit falls and bounces, a little dust, once (fruit-day in localStorage: a reload finds it lying
  // there). A tap on it picks it up (a hop, a sparkle; gone until the next Tokyo day). Picking up is cosmetic: the ベル
  // come from the goal, on read. Each met goal's flower opens in the person's bed (FlowerBeds), and with all four met
  // the canopy glints now and then like NH's money tree, so the day's progress stays after the pick-up.
  // Two buttons: the canopy (shakes the tree, drops two seasonal leaves, toggles the popup) and the fruit row (≥ 44px
  // tall: picks up the fallen fruit nearest the tap, else the same popup with the nearest fruit highlighted). The popup
  // is the one home of a person's per-fruit detail: a nameplate (whose tree), then per goal (🍎 steps first, POPUP_ORDER)
  // today's amount against the goal (met or not), ✓ once met, a ★ once at 1.5× (がんばり), and its ベル (+1, +2 with
  // its がんばり paid); then the day's がんばり (+1, +2, or +2 with 上限 when more were reached than the cap pays),
  // today's ふたりでぜんぶ (both people, all four goals: +2) and when the data last arrived. It stays until this tree is tapped again, the other tree is tapped, or a tap lands
  // elsewhere. A quick run of canopy taps (the third within 1.2 s, and each quick tap after) is NH's shake instead: the
  // popup closes, the tree rustles and `onshake` asks the scene what falls (treeShake.ts: a branch, now and then a wasp
  // nest). `shakeN` (bumped by idle life) shakes the tree without the popup; `celebrate` sparkles a fruit.
  import { onDestroy, untrack } from 'svelte';
  import type { PersonWeekView, RingFruit } from '#lib/types.ts';
  import type { Foliage } from '#lib/ui-state/season.ts';
  import { RING_FRUITS } from '#lib/config/rules.ts';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import Fx from '../characters/Fx.svelte';
  import { fruitArt, seasonArt, treeArt } from '#lib/art.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';
  import { lastSyncLine } from '#lib/i18n/format.ts';
  import { dayKey, minuteNow } from '#lib/time/clock.ts';
  import { todayPct } from './progress.ts';
  import { RULES, STRETCH } from '#lib/config/rules.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import {
    FRUIT_LEAN, FRUIT_SPOTS, FRUIT_U, JAR, OAK_AR, TREE, TREE_FRUIT, TREE_FRUIT_U, u
  } from './scene.ts';
  import { fruitDay, fruitFilter, fruitId, markDropped, markPicked, stageOf } from './fruitDay.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { shakeTap } from './treeShake.ts';

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
    /** A quick run of taps shook the tree (the scene drops what falls). */
    onshake?: () => void;
  }
  let { person, x, foliage, shakeN = 0, celebrate = null, open = false, ontoggle, onshake }: Props = $props();

  const H = TREE.h, W = TREE.h * OAK_AR, BASE = TREE.base;
  /** A hanging fruit is drawn at the ground size, scaled down (so the fall scales it up, one image). */
  const UP = TREE_FRUIT_U / FRUIT_U;
  /** The money-tree glints on a perfect day: [left, top] in % of the canopy. */
  const GLINTS: [number, number][] = [[25, 38], [52, 22], [72, 44], [44, 58]];
  const detailId = $props.id();
  let picked = $state<RingFruit | null>(null);
  let taps = $state(0);
  const timers = new Set<ReturnType<typeof setTimeout>>();
  onDestroy(() => {
    for (const id of timers) clearTimeout(id);
  });
  const later = (ms: number, f: () => void) => {
    const id = setTimeout(() => {
      timers.delete(id);
      f();
    }, ms);
    timers.add(id);
  };
  let leaves = $state<{ n: number; x: number; y: number }[]>([]);
  let leafN = 0;
  let treeEl: HTMLElement | null = $state(null);

  const ring = (f: RingFruit) => person.rings[f];
  /** The popup's rows: 🍎 steps first, then Apple's rings (the canopy and the beds keep RING_FRUITS). */
  const POPUP_ORDER: readonly RingFruit[] = ['apple', 'pear', 'peach', 'cherry'];
  /** A row's ベル: +1, +2 once its がんばり is paid (shown faded as +1 while unmet). */
  const pay = (f: RingFruit) => person.today.rings[f] || RULES.perGoal;
  /** Today's がんばり: the fruits at 1.5×, the ベル paid (at most STRETCH.cap) and whether more were reached than that. */
  const stretched = $derived(RING_FRUITS.filter((f) => ring(f).stretched).length);
  const stretchBells = $derived(Math.min(STRETCH.cap, stretched * STRETCH.perGoal));
  const stretchLine = $derived(
    stretched ? t(stretched * STRETCH.perGoal > STRETCH.cap ? 'tree.stretch.cap' : 'tree.stretch', { b: stretchBells }) : null
  );

  /** Today's amount against the goal, always (met too): 「103 / 60分」 (whole units, rounded down so a goal shows met
   *  only once it is). */
  const amount = (f: RingFruit) => t(`tree.of.${f}`, { n: formatNum(Math.floor(ring(f).today)), g: formatNum(ring(f).goal) });
  /** Today's ふたりでぜんぶ (both people's goals), from the store's view; none in the gallery. */
  const together = $derived(week.view?.together ?? null);
  const togetherLine = $derived(together ? (together.met ? t('tree.together.met', { b: RULES.together }) : t('tree.together.left', { n: together.left })) : null);
  const label = $derived(
    `${person.villagerName}: ` +
      POPUP_ORDER.map((f) => `${t(`fruit.${f}`)} ${amount(f)}${ring(f).met ? ` ✓ +${pay(f)}` : ''}${ring(f).stretched ? ' ★' : ''}`).join('、') +
      (stretchLine ? `。${stretchLine}` : '') + (togetherLine ? `。${togetherLine}` : '')
  );
  /** When this person's data last arrived (the popup's last line). Read only while the popup is open, so the minute
   *  clock ticks only then. */
  const sync = $derived(open ? lastSyncLine(person.lastSyncAt, minuteNow()) : null);
  /** The fruit row leans away from the jar (left tree left, right tree right). */
  const lean = $derived(x < JAR.x ? -FRUIT_LEAN : FRUIT_LEAN);

  /** Today (the model's Tokyo day; the gallery has no view) and this phone's record of today's fallen and picked fruit. */
  const date = $derived(week.view?.today ?? dayKey(minuteNow()));
  // svelte-ignore state_referenced_locally
  let rec = $state(fruitDay(date));
  $effect(() => {
    const d = date;
    untrack(() => {
      if (rec.date !== d) rec = fruitDay(d);
    });
  });
  /** Fruit falling right now: its drop plays once. */
  let falling = $state<RingFruit[]>([]);

  const spots = $derived(
    RING_FRUITS.map((f, i) => {
      const r = ring(f);
      const stage = stageOf(fruitId(person.person, f), r.met, rec);
      const tx = x + TREE_FRUIT[i][0], ty = BASE + TREE_FRUIT[i][1];
      const gx = x + lean + FRUIT_SPOTS[i][0], gy = BASE + FRUIT_SPOTS[i][1];
      const down = stage === 'ground' || stage === 'gone';
      return { f, i, met: r.met, stage, filter: fruitFilter(r.met ? 100 : todayPct(r)), tx, ty, gx, gy, x: down ? gx : tx, y: down ? gy : ty, down };
    })
  );
  const rowL = $derived(x + lean + FRUIT_SPOTS[0][0] - FRUIT_U);
  const rowR = $derived(x + lean + FRUIT_SPOTS[FRUIT_SPOTS.length - 1][0] + FRUIT_U);
  /** Fallen fruit, waiting to be picked up. */
  const ground = $derived(spots.filter((s) => s.stage === 'ground'));
  /** All four met today: the canopy glints (NH's money tree). */
  const allMet = $derived(spots.every((s) => s.met));

  // A newly met fruit falls: on the first render after a beat (the tree is seen first), else after its colour has
  // filled in; the tree shakes once for them all and they fall 150 ms apart. Each is marked as it falls, so a reload
  // finds it on the ground.
  let first = true;
  const queued = new Set<string>();
  $effect(() => {
    const d = date;
    const due = spots.filter((s) => s.stage === 'fall' && !queued.has(`${d}|${s.f}`)).map((s) => s.f);
    untrack(() => {
      const wait = first ? 700 : 900;
      first = false;
      if (!due.length) return;
      for (const f of due) queued.add(`${d}|${f}`);
      later(wait, () => {
        if (rec.date !== d) return;
        shake(true);
        due.forEach((f, k) => later(250 + k * 150, () => drop(d, f)));
      });
    });
  });
  function drop(d: string, f: RingFruit) {
    if (rec.date !== d) return;
    rec = markDropped(d, fruitId(person.person, f));
    falling = [...falling, f];
    cue('fruit-land');
    const s = spots.find((p) => p.f === f);
    if (s) later(290, () => addFx('puff', s.gx, s.gy + FRUIT_U * 0.4));
    later(1600, () => (falling = falling.filter((g) => g !== f)));
  }

  /** Short effects on the stage: dust where a fruit lands, sparkles where one is picked up. */
  let fx = $state<{ n: number; kind: 'puff' | 'sparkles'; x: number; y: number }[]>([]);
  let fxN = 0;
  function addFx(kind: 'puff' | 'sparkles', fxX: number, fxY: number) {
    fx = [...fx.slice(-3), { n: ++fxN, kind, x: fxX, y: fxY }];
  }
  const dropFx = (n: number) => (fx = fx.filter((e) => e.n !== n));

  /** NH's pick-up: the fruit hops up and shrinks away (an out transition: transform and opacity only). */
  function pickUp(_el: Element) {
    return {
      duration: 340,
      css: (tt: number, v: number) =>
        `transform: translateY(${(-60 * Math.sin(v * Math.PI * 0.6)).toFixed(1)}%) scale(${(1 - 0.7 * v * v).toFixed(3)}); opacity: ${Math.min(1, tt * 3).toFixed(2)}`
    };
  }
  /** Picks up a fallen fruit: gone from this phone until the next Tokyo day (no ベル: those come from the goal). */
  function collect(f: RingFruit) {
    const s = spots.find((p) => p.f === f);
    if (!s || s.stage !== 'ground') return;
    cue('fruit-pick');
    rec = markPicked(date, fruitId(person.person, f));
    addFx('sparkles', s.gx, s.gy - FRUIT_U * 0.4);
  }

  /** `sound`: a tap or a real event rustles; idle life's shake stays silent. */
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
    later(2000, () => (leaves = leaves.filter((l) => l.n !== a && l.n !== b)));
  }

  // React to `shakeN` only (shake() reads and writes `leaves`, which must not become a dependency).
  $effect(() => {
    if (shakeN > 0) untrack(() => shake());
  });

  /** A tap on the canopy (or the row with nothing to pick up): closes this tree's popup if it's open, else opens it (the
   *  canopy shakes the tree; the row highlights its nearest fruit). */
  let canopyTaps: number[] = [];
  function tap(f: RingFruit | null, canopy = f === null) {
    if (canopy) {
      const run = shakeTap(canopyTaps, Date.now());
      canopyTaps = run.taps;
      if (run.shake) {
        if (open) ontoggle?.(false);
        shake(true);
        return onshake?.();
      }
    }
    if (open) {
      cue('tick');
      return ontoggle?.(false);
    }
    if (canopy) shake(true);
    else cue('tick');
    picked = f;
    taps++;
    ontoggle?.(true);
  }

  /** A tap on the fruit row: picks up the fallen fruit nearest the tap (within 22u, or 22px on a small stage: a 44px
   *  target for a lone fruit), else opens the popup with the nearest fruit highlighted. From the keyboard: the first
   *  fallen fruit, else the popup. */
  function rowTap(e: MouseEvent) {
    const btn = e.currentTarget as HTMLElement | null;
    if (!e.detail || !btn) return ground.length ? collect(ground[0].f) : tap(null, false);
    const r = btn.getBoundingClientRect();
    const k = r.width / (rowR - rowL);
    const px = rowL + (e.clientX - r.left) / k;
    const near = <T extends { gx: number }>(list: T[]) => list.reduce((a, b) => (Math.abs(b.gx - px) < Math.abs(a.gx - px) ? b : a));
    if (ground.length) {
      const g = near(ground);
      if (Math.abs(g.gx - px) <= Math.max(22, 22 / k)) return collect(g.f);
    }
    tap(near(spots).f);
  }

  /** {@attach}: keep the popup inside the scene (8px margin) and under the HUD (its measured bottom + room for the
   *  nameplate), measured from its layout box (offsetLeft/Top ignore the pop-in transform). It always opens upwards,
   *  its tail on the tree; where the sky is short it is pushed down over the canopy, never flipped. */
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
  <span class="oak"><OfficialArt key={treeArt(foliage)} size={u(H)} priority /></span>
</div>
<button type="button" class="canopy" style:left={u(x - W / 2)} style:top={u(BASE - H)} style:width={u(W)}
  style:height={u(H * 0.62)} aria-label={label} aria-expanded={open} aria-controls={detailId} data-sfx="self" onclick={() => tap(null)}></button>

<!-- today's fruit: in the canopy (grey → colour with progress), then on the ground once met, until picked up -->
{#each spots as s (s.f)}
  {#if s.stage !== 'gone'}
    <span class="fruit" class:up={!s.down} class:drop={falling.includes(s.f)} data-fruit={s.f} data-tree={person.person} data-stage={s.stage}
      style:left={u(s.x)} style:top={u(s.y)} style:width={u(FRUIT_U)} style:--fx={u(s.tx - s.gx)} style:--fy={u(s.ty - s.gy)}
      style:--up={UP} out:pickUp>
      <span class="f" style:filter={s.filter}>
        <OfficialArt key={fruitArt(s.f)} size={u(FRUIT_U)} eager>
          {#snippet fallback()}<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#f-{s.f}" /></svg>{/snippet}
        </OfficialArt>
      </span>
      {#if celebrate?.fruit === s.f}
        {#key celebrate.n}<span class="fxa"><Fx kind="sparkles" spread={u(30)} /></span>{/key}
      {/if}
    </span>
  {/if}
{/each}
<button type="button" class="row-btn" style:left={u(rowL)} style:top={u(BASE + 12)} style:width={u(rowR - rowL)}
  aria-label={ground.length ? t(`tree.pick.${ground[0].f}`) : label} aria-expanded={open} aria-controls={detailId}
  tabindex={ground.length ? 0 : -1} data-sfx="self" onclick={rowTap}></button>

<!-- all four met: glints twinkle on the canopy in turn over a soft gold glow (NH's money tree), above the night tint -->
{#if allMet}
  <span class="glints" data-tree={person.person} aria-hidden="true" style:left={u(x - W / 2)} style:top={u(BASE - H)} style:width={u(W)}
    style:height={u(H * 0.62)} style:--g={u(24)} style:--late="{x < JAR.x ? 0 : 0.33}s">
    <span class="glow"></span>
    {#each GLINTS as [gx, gy], k (k)}
      <svg class="glint" viewBox="0 0 24 24" style:left="{gx}%" style:top="{gy}%" style:--k={k}>
        <path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z" />
      </svg>
    {/each}
  </span>
{/if}

{#each fx as e (e.n)}
  <span class="fxa at" style:left={u(e.x)} style:top={u(e.y)}><Fx kind={e.kind} spread={u(26)} ondone={() => dropFx(e.n)} /></span>
{/each}

{#each leaves as l (l.n)}
  <span class="leaf" style:left={u(l.x)} style:top={u(l.y)}>
    {#if leafKey}<OfficialArt key={leafKey} size="12px" />
    {:else}<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M2 14 Q2 3 14 2 Q13 13 2 14 Z" fill="var(--c-leaf)" /></svg>{/if}
  </span>
{/each}

{#snippet star(cls: string)}
  <svg class={cls} viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" /></svg>
{/snippet}

{#if open}
  {#key taps}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="detail" id={detailId} role="status" onpointerdown={() => cue('tick')} style:left={u(x)} style:top={u(BASE - H + 4)} {@attach keepInside}>
      <span class="plate">{person.villagerName}</span>
      {#each POPUP_ORDER as f (f)}
        {@const r = ring(f)}
        <span class="row" class:on={picked === f} data-row={f} data-stretched={r.stretched || null}>
          <span class="ic"><OfficialArt key={fruitArt(f)} size="20px" eager /></span>
          <span class="lbl">{t(`fruit.${f}`)}</span>
          <span class="amt money" class:met={r.met}>{#if r.met}<svg class="ok" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check" /></svg>{/if}{amount(f)}{#if r.stretched}{@render star('gb')}{/if}</span>
          <b class="money" class:zero={!r.met}>+{pay(f)}</b>
        </span>
      {/each}
      <!-- today's がんばり: goals at 1.5× (+1 each, at most +2 a day; 上限 when more were reached) -->
      {#if stretchLine}<span class="gbl">{@render star('gb')}{stretchLine}</span>{/if}
      <!-- today's ふたりでぜんぶ: both of us, all four goals (+2 shared) -->
      {#if togetherLine}<span class="duo" class:met={together?.met}>{@render star('')}{togetherLine}</span>{/if}
      <!-- when this person's data last arrived (it explains a low tree); a soft dot once it is SYNC_LATE_MS old -->
      {#if sync}<span class="sync" class:late={sync.late}>{sync.text}</span>{/if}
    </div>
  {/key}
{/if}

<style>
  .tree { position: absolute; z-index: var(--z-tree); transform-origin: 50% 100%; translate: -50% -100%; pointer-events: none; }
  .tree:global(.shaking) { animation: if-shake 500ms ease-in-out 1; }
  .oak { position: absolute; inset: 0; display: flex; justify-content: center; line-height: 0; }
  /* today's fruit: z above the trunk, below the villagers; in the canopy it is drawn at the ground size scaled to
     TREE_FRUIT_U (--up), so the fall grows it with one image */
  .fruit { position: absolute; z-index: var(--z-fruit); aspect-ratio: 1; translate: -50% -50%; line-height: 0; pointer-events: none; }
  .f { display: block; transform-origin: 50% 100%; transition: filter 1200ms ease; }
  .fruit.up .f { transform: scale(var(--up)); }
  /* on the ground: a soft radial contact shadow under it (0.45 of its size, +6% right and down) */
  .fruit::before {
    content: ''; position: absolute; z-index: -1; left: 11%; width: 90%; bottom: -8%; height: 26%; border-radius: 50%;
    background: radial-gradient(closest-side, var(--sh-c), transparent); pointer-events: none;
  }
  .fruit.up::before { display: none; }
  /* met: it falls from its place in the canopy (--fx, --fy) and bounces (250 ms after the shake starts; fruit-land's
     thud at 55%) */
  .fruit.drop .f { animation: fruit-drop 520ms cubic-bezier(.45, 0, .8, .6) both; }
  .fruit.drop::before { animation: shade-in 300ms 200ms both; }
  @keyframes shade-in { from { opacity: 0; } }
  @keyframes fruit-drop {
    0% { transform: translate(var(--fx), var(--fy)) scale(var(--up)); }
    55% { transform: translate(0, 0) scale(1.12, .86); animation-timing-function: ease-out; }
    72% { transform: translateY(-24%) scale(.96, 1.04); animation-timing-function: ease-in; }
    86% { transform: translateY(0) scale(1.04, .96); } 100% { transform: none; }
  }
  /* all four met: four warm glints twinkle on the canopy in turn (one every .65 s of a 2.6 s loop; the right tree
     .33 s later) over a soft gold glow, above the night tint like the fireflies */
  .glints { position: absolute; z-index: var(--z-taps); pointer-events: none; }
  .glow {
    position: absolute; inset: 4% 8% 10%; border-radius: 50%; opacity: 0;
    background: radial-gradient(closest-side, #FFE070, transparent); animation: tree-glow 2.6s ease-in-out var(--late) infinite both;
  }
  @keyframes tree-glow { 0%, 100% { opacity: 0; } 50% { opacity: .18; } }
  .glint {
    position: absolute; width: var(--g); height: var(--g); translate: -50% -50%; fill: #FFF7CF; opacity: 0;
    filter: drop-shadow(0 0 3px #FFE070) drop-shadow(0 0 1px #fff);
    animation: glint 2.6s ease-in-out calc(var(--k) * .65s + var(--late)) infinite both;
  }
  @keyframes glint {
    0% { transform: scale(0) rotate(0); opacity: 0; } 18% { transform: scale(1.15) rotate(45deg); opacity: 1; }
    30% { transform: scale(.9) rotate(60deg); opacity: 1; } 42% { transform: scale(0) rotate(90deg); opacity: 0; } 100% { transform: scale(0); opacity: 0; }
  }
  /* endless loops: they hold still under a sheet, like the sea's glints (hidden pages pause every animation) */
  :global(.if-scene[data-covered]) :is(.glint, .glow) { animation-play-state: paused; }
  .fxa { position: absolute; left: 50%; top: 30%; width: 0; height: 0; }
  .fxa.at { z-index: var(--z-fruit-row); pointer-events: none; }
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
  /* NH-style popup: a nameplate, then one row per fruit (icon · word · ✓ once met and amount / goal · +1), in shared columns
     (subgrid) so the numbers line up */
  .detail {
    position: absolute; z-index: var(--z-popup); translate: -50% -100%; display: grid; grid-template-columns: 20px auto auto auto; gap: 3px 0;
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
  /* whose tree: NH's tilted yuzu nameplate on the bubble's top edge */
  .plate {
    position: absolute; left: 10px; top: 0; translate: 0 -55%; rotate: -3deg; padding: 3px 10px; border-radius: var(--r-pill);
    background: var(--c-yuzu); color: var(--c-ink); font: 700 var(--fs-s)/1.2 var(--font-ui); box-shadow: 0 2px 0 var(--c-yuzu-lip);
    max-width: calc(100% - 20px); overflow: hidden; text-overflow: ellipsis;
  }
  .row {
    grid-column: 1 / -1; display: grid; grid-template-columns: subgrid; align-items: center; column-gap: 8px;
    padding: 3px 6px; border-radius: var(--r-chip); line-height: 1;
  }
  .row.on { background: var(--c-yuzu); }
  .ic { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; line-height: 0; }
  .lbl { font: 500 var(--fs-s)/1.2 var(--font-ui); }
  .amt { display: flex; align-items: center; justify-content: flex-end; gap: 5px; font: 700 var(--fs-s)/1.2 var(--font-num); color: var(--c-ink-soft); }
  .amt.met { color: var(--c-leaf-text); }
  .row b { font: 700 var(--fs-s)/1.2 var(--font-num); text-align: right; }
  .row b.zero { color: var(--c-ink-soft); font-weight: 500; }
  .ok { width: 18px; height: 18px; flex: none; padding: 3px; border-radius: 50%; background: var(--c-leaf); color: var(--c-ink); display: block; }
  /* がんばり: a small yuzu star after a value at 1.5×, and the day's line under the goals */
  .gb { width: 15px; height: 15px; flex: none; margin-left: -1px; fill: var(--c-yuzu-lip); filter: drop-shadow(0 1px 0 color-mix(in srgb, var(--plate-ink) 25%, transparent)); }
  .gbl {
    grid-column: 1 / -1; display: flex; align-items: center; justify-content: center; gap: 5px; margin-top: 3px; padding: 5px 8px 1px;
    border-top: 1px dashed color-mix(in srgb, var(--plate-ink) 25%, transparent); font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--plate-ink);
  }
  .gbl + .duo { border-top: 0; margin-top: 0; padding-top: 3px; }
  /* today's ふたりでぜんぶ: a star line under the goals (yuzu once both met everything) */
  .duo {
    grid-column: 1 / -1; display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 3px; padding: 5px 8px 1px;
    border-top: 1px dashed color-mix(in srgb, var(--plate-ink) 25%, transparent); font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--plate-ink);
  }
  .duo svg { width: 16px; height: 16px; flex: none; fill: color-mix(in srgb, var(--plate-ink) 30%, transparent); }
  .duo.met svg { fill: var(--c-yuzu-lip); }
  /* when the data last arrived: soft and small, under everything; the plate is cream at every time of day, so the
     soft ink is the plate's, not the theme's */
  .sync {
    grid-column: 1 / -1; display: flex; align-items: center; justify-content: center; gap: 5px; margin-top: 2px;
    font: 500 var(--fs-s)/1.2 var(--font-ui); color: var(--c-ink-soft);
  }
  .sync.late::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: color-mix(in srgb, var(--c-ink-soft) 55%, transparent); }
  /* narrow stages: the word goes (the fruit art says which), so the popup fits over its own tree */
  @container (max-width: 400px) {
    .detail { grid-template-columns: 20px auto auto; }
    .lbl { display: none; }
    .row { column-gap: 10px; }
    /* a clear gap, so the longest value (14,164 / 8,000歩) never touches its fruit */
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
    .duo, .gbl { margin-top: 2px; padding-top: 3px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .tree, .tree:global(.shaking), .leaf { animation: none; }
    .detail { animation: none; }
  }
</style>
