<script lang="ts">
  // One person's tree (docs/design.md "Trees"): a plain official hardwood of the season with today's four fruits in its
  // canopy, 🍐 🍑 🍒 🍎 left to right (RING_FRUITS, TREE_FRUIT). Each hangs grey at 0 and fills with colour as today's
  // amount nears its goal (fruitDay.ts greyAt). Once met it drops to the ground in front of the trunk (FRUIT_SPOTS): the
  // tree shakes, the fruit falls and bounces, a little dust, once (fruit-day in localStorage: a reload finds it lying
  // there). A tap on it picks it up (a hop, a sparkle; gone until the next Tokyo day). Picking up is cosmetic: the ベル
  // come from the goal, on read. With all four met the canopy glints now and then like NH's money tree, so the day's progress stays after the pick-up.
  // Two buttons: the canopy (shakes the tree, drops two seasonal leaves, toggles the popup) and the fruit row (≥ 44px
  // tall: picks up the fallen fruit nearest the tap, else the same popup with the nearest fruit highlighted). The popup
  // is the one home of a person's per-fruit detail: a nameplate (whose tree), then per goal (🍎 steps first, POPUP_ORDER)
  // today's amount against the goal (met or not), ✓ once met and a 「がんばり」 chip once at 1.5× (every stretched row
  // alike, whatever the cap; no numbers on the rows), each held by a faint ghost until then (the chip's only while the
  // cap can still pay); then one ledger of the day, its zeros faint: もくひょう (+1 a goal met), がんばり (always; +1 a
  // goal at 1.5×, at most +2; 「（上限 2）」 when more were reached), this person's total (「うめの きょう +6 ベル」),
  // then ふたりでぜんぶ (both people, all four goals: +2, shared: shown in both popups, so ウェイ + うめ + ふたりでぜんぶ
  // is today's total, ごほうび's 「きょう +N ベル」) and when the data last arrived. It stays until this tree is tapped again, the other
  // tree is tapped, or a tap lands elsewhere. A quick run of canopy taps (the third within 1.2 s, and each quick tap after) is NH's shake instead: the
  // popup closes, the tree rustles and `onshake` asks the scene what falls (treeShake.ts: a branch, now and then a wasp
  // nest). `shakeN` (bumped by idle life) shakes the tree without the popup; `celebrate` sparkles a fruit.
  import { pickUp } from '../motion/transitions.ts';
  import { timers } from './timers.ts';
  import { onDestroy, onMount, untrack } from 'svelte';
  import type { PersonWeekView, RingFruit } from '#lib/types.ts';
  import type { Foliage } from '#lib/ui-state/season.ts';
  import { RING_FRUITS } from '#lib/config/rules.ts';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import Fx from '../characters/Fx.svelte';
  import { fruitArt, seasonArt, treeArt } from '#lib/art.ts';
  import { formatBells, formatNum, t } from '#lib/i18n/index.ts';
  import { lastSyncLine } from '#lib/i18n/format.ts';
  import { dayKey, minuteNow } from '#lib/time/clock.ts';
  import { todayPct } from './progress.ts';
  import { RULES, STRETCH } from '#lib/config/rules.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { FRUIT_LEAN, FRUIT_SPOTS, FRUIT_U, OAK_AR, TREE, TREE_FRUIT, TREE_FRUIT_U, u } from './scene.ts';
  import { useWorld } from './camera.svelte.ts';
  import { fruitDay, fruitFilter, fruitId, markDropped, markPicked, stageOf } from './fruitDay.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { shakeTap } from './treeShake.ts';
  import { partnerTurnTo, turnTo } from './avatar.ts';
  import { world as shared } from '#lib/store/world.svelte.ts';
  import { taken as takenBy } from '#lib/sync/world-day.ts';
  import { fx3d } from './fx3d.ts';
  import { echo3d } from './echo3d.ts';
  import { GOAL_TREES } from './world.ts';

  interface Props {
    person: PersonWeekView;
    /** The trunk's foot (world units). */
    x: number;
    z: number;
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
  let { person, x, z, foliage, shakeN = 0, celebrate = null, open = false, ontoggle, onshake }: Props = $props();

  const H = TREE.h, W = TREE.h * OAK_AR;
  const w = useWorld();
  /** The trunk and the canopy (the canopy's depth 14u nearer: a villager just in front covers the trunk, the leaves
   *  their head). */
  const TRUNK = 'polygon(29% 53%, 71% 53%, 72% 84%, 88% 89%, 88% 100%, 12% 100%, 12% 89%, 28% 84%)';
  const CANOPY = 'polygon(0 0, 100% 0, 100% 67%, 66% 67%, 66% 56%, 34% 56%, 34% 67%, 0 67%)';
  /** How far up the screen a step toward the back shows near the camera (the ground's foreshortening there): the drop
   *  starts from the canopy, drawn in the ground fruit's own frame. */
  const FORE = 0.62;
  /** A hanging fruit is drawn at the ground size, scaled down (so the fall scales it up, one image). */
  const UP = TREE_FRUIT_U / FRUIT_U;
  /** The money-tree glints on a perfect day: [left, top] in % of the canopy. */
  const GLINTS: [number, number][] = [[25, 38], [52, 22], [72, 44], [44, 58]];
  const detailId = $props.id();
  let picked = $state<RingFruit | null>(null);
  let taps = $state(0);
  const { later, clear } = timers();
  onDestroy(clear);
  let leaves = $state<{ n: number; x: number; y: number }[]>([]);
  let leafN = 0;
  let treeEl: HTMLElement | null = $state(null);
  let canopyEl: HTMLElement | null = $state(null);

  const ring = (f: RingFruit) => person.rings[f];
  /** The popup's rows: 🍎 steps first, then Apple's rings (the canopy keeps RING_FRUITS). */
  const POPUP_ORDER: readonly RingFruit[] = ['apple', 'pear', 'peach', 'cherry'];
  /** The day's ledger: goals met (+1 each), がんばり (the fruits at 1.5×, the ベル paid: at most STRETCH.cap, 上限 when
   *  more were reached than that) and this person's total (goals + がんばり; ふたりでぜんぶ is the pair's, apart). */
  const goalBells = $derived(RING_FRUITS.filter((f) => ring(f).met).length * RULES.perGoal);
  const stretched = $derived(RING_FRUITS.filter((f) => ring(f).stretched).length);
  const stretchBells = $derived(Math.min(STRETCH.cap, stretched * STRETCH.perGoal));
  const stretchKey = $derived(
    stretched ? t(stretched * STRETCH.perGoal > STRETCH.cap ? 'tree.sum.stretchCap' : 'tree.sum.stretch', { cap: STRETCH.cap }) : null
  );
  const signed = (n: number) => `+${formatNum(n)}`;

  /** Today's amount against the goal, always (met too): 「103 / 60分」 (whole units, rounded down so a goal shows met
   *  only once it is). */
  const amount = (f: RingFruit) => t(`tree.of.${f}`, { n: formatNum(Math.floor(ring(f).today)), g: formatNum(ring(f).goal) });
  /** Today's ふたりでぜんぶ (both people's goals), from the store's view; none in the gallery. */
  const together = $derived(week.view?.together ?? null);
  const totalKey = $derived(t('tree.sum.total', { name: person.villagerName }));
  const label = $derived(
    `${person.villagerName}: ` +
      POPUP_ORDER.map((f) => `${t(`fruit.${f}`)} ${amount(f)}${ring(f).met ? ' ✓' : ''}${ring(f).stretched ? ` ${t('tree.stretched')}` : ''}`).join('、') +
      `。${t('tree.sum.goals')} ${signed(goalBells)}` + (stretchKey ? `、${stretchKey} ${signed(stretchBells)}` : '') +
      `、${totalKey} ${formatBells(person.today.bells, { signed: true })}` +
      (together ? `。${together.met ? `${t('tree.together.met')} ${signed(RULES.together)}` : t('tree.together.left', { n: together.left })}` : '')
  );
  /** When this person's data last arrived (the popup's last line). Read only while the popup is open, so the minute
   *  clock ticks only then. */
  const sync = $derived(open ? lastSyncLine(person.lastSyncAt, minuteNow()) : null);
  /** The fruit row leans out from the middle (left tree left, right tree right). */
  const lean = $derived(x < 195 ? -FRUIT_LEAN : FRUIT_LEAN);

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
      // picked up by either of us today (the shared day's `fr:<person>:<fruit>`) is gone on both phones
      const id = fruitId(person.person, f), by = date === dayKey() ? takenBy(shared.day, `fr:${id}`) : null;
      // the partner's pick-up takes it at once; mine once my villager has got there (rec.picked)
      const gone = !!by && by.who !== shared.me;
      const stage = gone && r.met ? 'gone' : stageOf(id, r.met, rec);
      // hanging: [dx, up] in the canopy's frame; on the ground: its own spot (gx, gz) in front of the trunk
      const tx = TREE_FRUIT[i][0], up = TREE_FRUIT[i][1];
      const gx = x + lean + FRUIT_SPOTS[i][0], gz = z + FRUIT_SPOTS[i][1];
      const down = stage === 'ground' || stage === 'gone';
      // the canopy spot seen from the ground spot (units, its frame): the fall starts there
      const fx = x + tx - gx, fy = -up + FRUIT_SPOTS[i][1] * FORE;
      // (the 3D island's model: drained toward grey as the DOM's filter, 0 once met)
      const grey = r.met ? 0 : Math.max(0, 1 - todayPct(r) / 100) * 0.9;
      return { f, i, met: r.met, stage, filter: fruitFilter(r.met ? 100 : todayPct(r)), tx, up, gx, gz, fx, fy, down, grey };
    })
  );
  const rowL = $derived(x + lean + FRUIT_SPOTS[0][0] - FRUIT_U);
  const rowR = $derived(x + lean + FRUIT_SPOTS[FRUIT_SPOTS.length - 1][0] + FRUIT_U);
  /** The fruit row's middle in depth (its button stands there, in front of whoever stands at the trunk). */
  const rowZ = $derived(z + (FRUIT_SPOTS[0][1] + FRUIT_SPOTS[1][1]) / 2);
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
      later(() => {
        if (rec.date !== d) return;
        shake(true);
        due.forEach((f, k) => later(() => drop(d, f), 250 + k * 150));
      }, wait);
    });
  });
  function drop(d: string, f: RingFruit) {
    if (rec.date !== d) return;
    rec = markDropped(d, fruitId(person.person, f));
    falling = [...falling, f];
    cue('fruit-land');
    const s = spots.find((p) => p.f === f);
    if (s) later(() => addFx('puff', s.gx, s.gz, 0), 290);
    later(() => (falling = falling.filter((g) => g !== f)), 1600);
  }

  /** Short effects on the stage: dust where a fruit lands, sparkles where one is picked up. */
  let fx = $state<{ n: number; kind: 'puff' | 'sparkles'; x: number; z: number; lift: number; in3d: boolean }[]>([]);
  let fxN = 0;
  function addFx(kind: 'puff' | 'sparkles', fxX: number, fxZ: number, lift: number) {
    // (the 3D island draws it: fx3d.ts)
    const in3d = fx3d(kind === 'puff' ? 'dust' : 'sparkle', fxX, fxZ, lift);
    fx = [...fx.slice(-3), { n: ++fxN, kind, x: fxX, z: fxZ, lift, in3d }];
  }
  const dropFx = (n: number) => (fx = fx.filter((e) => e.n !== n));

  /** NH's pick-up: the fruit hops up and shrinks away (an out transition: transform and opacity only). */
  /** Picks up a fallen fruit: gone from this phone until the next Tokyo day (no ベル: those come from the goal). */
  function collect(f: RingFruit) {
    const s = spots.find((p) => p.f === f);
    if (!s || s.stage !== 'ground') return;
    // first wins: claimed at the tap (the partner's phone sees it picked up, by my villager)
    const sid = `fr:${fruitId(person.person, f)}`;
    if (!shared.share({ kind: 'pick', id: sid, what: `fruit:${f}`, at: [Math.round(s.gx), Math.round(s.gz)] }).fresh) return;
    // picked up where it lies, my villager turning to it (avatar.ts)
    turnTo(s.gx);
    pick(f);
  }
  function pick(f: RingFruit) {
    const s = spots.find((p) => p.f === f);
    if (!s || s.stage !== 'ground') return;
    cue('fruit-pick');
    rec = markPicked(date, fruitId(person.person, f));
    addFx('sparkles', s.gx, s.gz, FRUIT_U * 0.4);
  }

  /** `sound`: a tap or a real event rustles; idle life's shake stays silent. */
  function shake(sound = false) {
    if (!treeEl || !canopyEl) return;
    if (sound) cue('tree-shake');
    echo3d(`goal-${person.person}`, 1.8);
    for (const el of [treeEl, canopyEl]) {
      el.classList.remove('shaking');
      void el.offsetWidth;
      el.classList.add('shaking');
    }
    const a = ++leafN, b = ++leafN;
    const y = -H * 0.55;
    leaves = [...leaves.slice(-2), { n: a, x: -W * 0.3, y }, { n: b, x: W * 0.28, y }];
    later(() => (leaves = leaves.filter((l) => l.n !== a && l.n !== b)), 2000);
  }

  // The partner picks up a fallen fruit (the shared day's news, just now): their villager turns to it, it pops and is gone.
  onMount(() =>
    shared.on(({ e, live }) => {
      if (e.kind !== 'pick' || !e.id.startsWith(`fr:${person.person}:`)) return;
      const f = e.id.slice(5 + person.person.length) as RingFruit, s = spots.find((p) => p.f === f);
      if (!s || !live) return;
      partnerTurnTo(s.gx, e.who);
      cue('fruit-pick');
      addFx('sparkles', s.gx, s.gz, FRUIT_U * 0.4);
    })
  );

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

  /** {@attach}: the popup in screen space (docs/design.md "Trees"): over every tint and weather (never dimmed), in the
   *  same place whichever the camera: roughly centred, leaning away from its tree's side (the goal trees stand at the
   *  lawn's outer edges, so their canopies stay tappable beside it), in the middle of the band between the
   *  HUD and the screen's foot, always wholly in view; a tail toward the tree when the tree is above or below it on
   *  screen. Measured again as its rows come in and as the camera comes to rest (the tail follows the tree). */
  let popEl = $state<HTMLElement>();
  function keepInside(el: HTMLElement) {
    popEl = el;
    const ro = new ResizeObserver(() => fitPopup(el));
    ro.observe(el);
    fitPopup(el);
    return () => {
      ro.disconnect();
      popEl = undefined;
    };
  }
  $effect(() => {
    void w.rest.z;
    void w.rest.vh;
    if (popEl) fitPopup(popEl);
  });
  function fitPopup(el: HTMLElement) {
    const stage = el.closest('.stage');
    if (!stage) return;
    const st = stage.getBoundingClientRect();
    const wd = el.offsetWidth, h = el.offsetHeight;
    const hud = document.querySelector('.ribbon-wrap');
    // the band: 28px under the HUD (room for the nameplate) to 16px over the home indicator
    const floor = (hud ? hud.getBoundingClientRect().bottom - st.top : 88) + 28;
    const ceil = st.height - Math.max(16, parseFloat(getComputedStyle(el).getPropertyValue('--safe-b')) || 0) - 16;
    const [ax, ay] = w.clientAt(x, z, H * 0.8);
    const tx = ax - st.left, ty = ay - st.top;
    const side = tx < st.width / 2 ? -1 : 1;
    let left = Math.min(st.width - 8 - wd, Math.max(8, st.width / 2 - side * 60 - wd / 2));
    let top = Math.min(ceil - h, Math.max(floor, (floor + ceil) / 2 - h / 2));
    // the 3D island's camera shows both goal trees well inside the screen: the popup goes over their canopies when it
    // fits there (both stay tappable), else in the band as on the 2D island
    if (w.three) {
      const crown = w.clientAt(x, z, H)[1] - st.top;
      if (crown - 10 - h >= floor) top = crown - 10 - h;
      else {
        // no room: on this tree's side, clear of the other tree's canopy (its middle stays tappable)
        const [ox] = w.clientAt(x < 195 ? GOAL_TREES.B[0] : GOAL_TREES.A[0], z, H * 0.7), oc = ox - st.left;
        left = side < 0 ? Math.max(8, Math.min(left, oc - 44 - wd)) : Math.min(st.width - 8 - wd, Math.max(left, oc + 44));
      }
    }
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    // the tail: toward the tree, on the edge facing it (none while the tree is behind the popup or off screen)
    const seen = w.inView(x, z, 40);
    el.dataset.tail = !seen ? 'none' : ty > top + h ? 'down' : ty + H * 0.8 < top ? 'up' : 'none';
    el.style.setProperty('--tail', `${Math.min(wd / 2 - 16, Math.max(-wd / 2 + 16, tx - (left + wd / 2)))}px`);
  }




  const leafKey = $derived(foliage === 'blossom' ? seasonArt('petal') : foliage === 'fall' ? seasonArt('maple-leaf') : foliage === 'snow' ? seasonArt('snowflake') : null);
</script>

<!-- the tree: its trunk and its canopy, two world nodes (one art, clipped) -->
<div class="node" data-tree-node={person.person} {@attach w.at({ x, z, h: H, inv: true, model: true })}>
  <div class="tree" bind:this={treeEl} style:width={u(W)} style:height={u(H)} style:clip-path={TRUNK}
    onanimationend={(e) => e.animationName === 'if-shake' && treeEl?.classList.remove('shaking')}>
    <span class="oak"><OfficialArt key={treeArt(foliage)} size={u(H)} priority /></span>
  </div>
  <!-- the trunk and its base answer a tap as the canopy does (≥ 44px wide; one button for assistive tech: the canopy) -->
  <button type="button" class="trunk-btn" style:width="max({u(W * 0.42)}, calc(45px * var(--inv, 1)))" style:height="max({u(H * 0.5)}, calc(48px * var(--inv-y, 0)))"
    tabindex="-1" aria-hidden="true" data-sfx="self" onclick={() => tap(null)}></button>
</div>
<div class="node" {@attach w.at({ x, z, h: H, dz: -14, inv: true, model: true })}>
  <div class="tree" bind:this={canopyEl} style:width={u(W)} style:height={u(H)} style:clip-path={CANOPY}
    onanimationend={(e) => e.animationName === 'if-shake' && canopyEl?.classList.remove('shaking')}>
    <span class="oak"><OfficialArt key={treeArt(foliage)} size={u(H)} priority /></span>
  </div>
  <button type="button" class="canopy" style:left={u(-W / 2)} style:top={u(-H)} style:width={u(W)}
    style:height={u(H * 0.62)} aria-label={label} aria-expanded={open} aria-controls={detailId} data-sfx="self" onclick={() => tap(null)}></button>
  <!-- today's fruit in the canopy (grey → colour with progress) -->
  {#each spots as s (s.f)}
    {#if !s.down}
      <span class="fruit up" data-fruit={s.f} data-tree={person.person} data-stage={s.stage}
        style:left={u(s.tx)} style:top={u(-s.up)} style:width={u(FRUIT_U)} style:--up={UP}>
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
  <!-- all four met: glints twinkle on the canopy in turn over a soft gold glow (NH's money tree) -->
  {#if allMet}
    <span class="glints" data-tree={person.person} aria-hidden="true" style:left={u(-W / 2)} style:top={u(-H)} style:width={u(W)}
      style:height={u(H * 0.62)} style:--g={u(24)} style:--late="{x < 195 ? 0 : 0.33}s">
      <span class="glow"></span>
      {#each GLINTS as [gx, gy], k (k)}
        <svg class="glint" viewBox="0 0 24 24" style:left="{gx}%" style:top="{gy}%" style:--k={k}>
          <path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z" />
        </svg>
      {/each}
    </span>
  {/if}
  {#each leaves as l (l.n)}
    <span class="leaf" style:left={u(l.x)} style:top={u(l.y)}>
      {#if leafKey}<OfficialArt key={leafKey} size="12px" />
      {:else}<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M2 14 Q2 3 14 2 Q13 13 2 14 Z" fill="var(--c-leaf)" /></svg>{/if}
    </span>
  {/each}
</div>

{#if w.rest.three}
  <!-- the 3D island's fruit in the canopy (camera.svelte.ts m3): NH's model at its spot on the canopy's front, the DOM's
       art hidden; the same instance falls to its ground spot (FruitTree's own fall) -->
  {#each spots as s (s.f)}
    {#if !s.down}
      <i class="m3n" {@attach w.at({ x: x + s.tx * 1.25, z: z - 34, lift: s.up + 14, h: 4, always: true,
        m3: { key: `fruit/${s.f}`, id: `fruit-${person.person}-${s.f}`, grey: s.grey, art: () => canopyEl?.parentElement?.querySelector(`.fruit.up[data-fruit="${s.f}"]`) } })}></i>
    {/if}
  {/each}
{/if}
<!-- met: on the ground in front of the trunk (each its own node, so a villager stands among them), until picked up -->
{#each spots as s (s.f)}
  {#if s.down && s.stage !== 'gone'}
    <div class="node" {@attach w.at({ x: s.gx, z: s.gz, h: FRUIT_U, m3: { key: `fruit/${s.f}`, id: `fruit-${person.person}-${s.f}`, ms: falling.includes(s.f) ? 520 : 0 } })}>
      <span class="fruit" class:drop={falling.includes(s.f)} data-fruit={s.f} data-tree={person.person} data-stage={s.stage}
        style:width={u(FRUIT_U)} style:--fx={u(s.fx)} style:--fy={u(s.fy)} style:--up={UP} out:pickUp>
        <span class="f" style:filter={s.filter}>
          <OfficialArt key={fruitArt(s.f)} size={u(FRUIT_U)} eager>
            {#snippet fallback()}<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#f-{s.f}" /></svg>{/snippet}
          </OfficialArt>
        </span>
        {#if celebrate?.fruit === s.f}
          {#key celebrate.n}<span class="fxa"><Fx kind="sparkles" spread={u(30)} /></span>{/key}
        {/if}
      </span>
    </div>
  {/if}
{/each}
<div class="node" {@attach w.at({ x: (rowL + rowR) / 2, z: rowZ, h: 30, dz: -40, inv: true })}>
  <button type="button" class="row-btn" style:left={u(-(rowR - rowL) / 2)} style:top={u(-FRUIT_U * 0.5)} style:width={u(rowR - rowL)}
    aria-label={ground.length ? t(`tree.pick.${ground[0].f}`) : label} aria-expanded={open} aria-controls={detailId}
    tabindex={ground.length ? 0 : -1} data-sfx="self" onclick={rowTap}></button>
</div>

{#each fx as e (e.n)}
  <div class="node" {@attach w.at({ x: e.x, z: e.z, lift: e.lift, h: 30, dz: -2 })}>
    <span class="fxa at" class:in3d={e.in3d}><Fx kind={e.kind} spread={u(26)} ondone={() => dropFx(e.n)} /></span>
  </div>
{/each}

{#snippet star(cls: string)}
  <svg class={cls} viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" /></svg>
{/snippet}

{#if open}
  {#key taps}
    <!-- the popup: in screen space over everything (every tint and weather), its tail toward the tree -->
    <div class="pop">
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="detail" id={detailId} role="status" onpointerdown={() => cue('tick')} {@attach keepInside}>
      <span class="plate">{person.villagerName}</span>
      {#each POPUP_ORDER as f (f)}
        {@const r = ring(f)}
        <span class="row" class:on={picked === f} data-row={f} data-stretched={r.stretched || null}>
          <span class="ic"><OfficialArt key={fruitArt(f)} size="20px" eager /></span>
          <span class="lbl">{t(`fruit.${f}`)}</span>
          <span class="amt money" class:met={r.met}>{#if r.met}<svg class="ok" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check" /></svg>{:else}<span class="ok todo" aria-hidden="true"></span>{/if}{amount(f)}</span>
          <span class="gbc">{#if r.stretched}<span class="chip">{t('tree.stretched')}</span>{:else if stretchBells < STRETCH.cap}<span class="ghost" aria-hidden="true">{t('tree.stretched')}</span>{/if}</span>
        </span>
      {/each}
      <!-- the day's ledger: goals, がんばり (上限 when more were reached), this person's total; then ふたりでぜんぶ (shared) -->
      <span class="sum" data-sum>
        <span class="k">{t('tree.sum.goals')}</span><b class="v money" class:zero={!goalBells} data-v="goals">{signed(goalBells)}</b>
        <span class="k">{stretchKey ?? t('tree.sum.stretch')}</span><b class="v money" class:zero={!stretchBells} data-v="stretch">{signed(stretchBells)}</b>
        <span class="rule"></span>
        <span class="k tot">{totalKey}</span><b class="v money tot" class:zero={!person.today.bells} data-v="total">{formatBells(person.today.bells, { signed: true })}</b>
      </span>
      <!-- today's ふたりでぜんぶ: both of us, all four goals (+2, the pair's: in both popups, counted once in today's total) -->
      {#if together}
        <span class="duo" class:met={together.met}>{@render star('')}{#if together.met}<span class="k">{t('tree.together.met')}</span><b class="money">{signed(RULES.together)}</b><small>{t('tree.together.shared')}</small>
          {:else}{t('tree.together.left', { n: together.left })}{/if}
        </span>
      {/if}
      <!-- when this person's data last arrived (it explains a low tree); a soft dot once it is SYNC_LATE_MS old -->
      {#if sync}<span class="sync" class:late={sync.late}>{sync.text}</span>{/if}
    </div>
    </div>
  {/key}
{/if}

<style>
  .node { width: 0; height: 0; transform-origin: 0 0; will-change: transform; }
  .tree { position: absolute; left: 0; top: 0; transform-origin: 50% 100%; translate: -50% -100%; pointer-events: none; }
  .tree:global(.shaking) { animation: if-shake 500ms ease-in-out 1; }
  .oak { position: absolute; inset: 0; display: flex; justify-content: center; line-height: 0; }
  /* today's fruit: z above the trunk, below the villagers; in the canopy it is drawn at the ground size scaled to
     TREE_FRUIT_U (--up), so the fall grows it with one image */
  .fruit { position: absolute; left: 0; top: 0; aspect-ratio: 1; translate: -50% -50%; line-height: 0; pointer-events: none; }
  /* on the ground its feet are the node's: the art's middle half its size up */
  .fruit:not(.up) { translate: -50% -88%; }
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
  .glints { position: absolute; pointer-events: none; }
  .glow {
    position: absolute; inset: 4% 8% 10%; border-radius: 50%; opacity: 0;
    background: radial-gradient(closest-side, #FFE070, transparent); animation: tree-glow 2.6s ease-in-out var(--late) infinite both;
  }
  @keyframes tree-glow { 0%, 100% { opacity: 0; } 50% { opacity: .18; } }
  .glint {
    position: absolute; width: var(--g); height: var(--g); translate: -50% -50%; fill: #FFF7CF; opacity: 0;
    filter: var(--leaf-tint,) drop-shadow(0 0 3px #FFE070) drop-shadow(0 0 1px #fff);
    animation: glint 2.6s ease-in-out calc(var(--k) * .65s + var(--late)) infinite both;
  }
  @keyframes glint {
    0% { transform: scale(0) rotate(0); opacity: 0; } 18% { transform: scale(1.15) rotate(45deg); opacity: 1; }
    30% { transform: scale(.9) rotate(60deg); opacity: 1; } 42% { transform: scale(0) rotate(90deg); opacity: 0; } 100% { transform: scale(0); opacity: 0; }
  }
  /* on the 3D island the tree's node is squashed upright as the model is foreshortened (camera.svelte.ts: --inv-y over
     --inv is how much): the glints and the flourishes over it are light, not part of the tree, so they stand unsquashed,
     whole stars from the camera's steep view */
  :global(.scene[data-r3]) :is(.glint, .fxa) { scale: 1 calc(var(--inv-y, var(--inv, 1)) / var(--inv, 1)); }
  /* endless loops: they hold still under a sheet, like the sea's glints (hidden pages pause every animation) */
  :global(.if-scene[data-covered]) :is(.glint, .glow) { animation-play-state: paused; }
  .fxa { position: absolute; left: 50%; top: 30%; width: 0; height: 0; }
  .fxa.at { left: 0; top: 0; pointer-events: none; }
  .trunk-btn { left: 0; bottom: calc(-4 * var(--u)); translate: -50% 0; border-radius: 40% 40% 30% 30%; }
  .canopy, .row-btn, .trunk-btn {
    position: absolute; appearance: none; border: 0; background: none; padding: 0;
    cursor: pointer; border-radius: 45%; -webkit-tap-highlight-color: transparent;
  }
  /* the fruit row: ≥ 44px tall around the items, above the villagers' heads (z 51/52 start lower) */
  /* ≥ 44px on screen whatever the perspective (--inv: 1 / the node's scale) */
  .row-btn { translate: 0 -50%; height: max(calc(44px * var(--inv, 1)), calc(30 * 100cqw / 390)); border-radius: 22px; }
  .canopy:focus-visible, .row-btn:focus-visible { outline: 3px solid var(--focus); outline-offset: -4px; }
  .leaf { position: absolute; line-height: 0; pointer-events: none; animation: leaf 1800ms ease-in both; }
  @keyframes leaf {
    0% { transform: translate(0, 0) rotate(0); opacity: 0; } 10% { opacity: 1; }
    40% { transform: translate(-10px, 40px) rotate(120deg); } 75% { transform: translate(8px, 80px) rotate(240deg); opacity: 1; }
    100% { transform: translate(0, 110px) rotate(320deg); opacity: 0; }
  }
  /* NH-style popup: a nameplate, then one row per fruit (icon · word · ✓ once met and amount / goal · +1), in shared columns
     (subgrid) so the numbers line up */
  .pop { position: absolute; inset: 0; z-index: var(--z-popup); pointer-events: none; --safe-b: env(safe-area-inset-bottom, 0px); }
  .detail {
    position: absolute; left: 0; top: 0; display: grid; grid-template-columns: 20px auto auto auto; gap: 3px 0;
    background: var(--plate); border-radius: var(--r-btn); padding: 16px 10px 8px; white-space: nowrap;
    box-shadow: 0 4px 0 var(--plate-lip); color: var(--plate-ink);
    /* it takes the tap that lands on it (the scene's tap-away closes it), so a tap on the popup never reaches a visitor or
       the other tree drawn under it */
    pointer-events: auto; cursor: default;
    transform-origin: 50% 50%; animation: if-pop 360ms var(--ease-bounce) both;
  }
  .detail::after {
    content: ''; position: absolute; left: calc(50% + var(--tail, 0px)); bottom: -5px; width: 10px; height: 10px; margin-left: -5px;
    background: inherit; transform: rotate(45deg);
  }
  .detail:global([data-tail='up'])::after { bottom: auto; top: -5px; }
  .detail:global([data-tail='none'])::after { display: none; }
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
  .ok { width: 18px; height: 18px; flex: none; padding: 3px; border-radius: 50%; background: var(--c-leaf); color: var(--c-ink); display: block; }
  /* not met yet: the ✓'s place as a faint dashed ring, so an early morning's popup shows where the ✓ will come */
  .ok.todo {
    box-sizing: border-box; padding: 0; background: none;
    border: 1.5px dashed color-mix(in srgb, var(--plate-ink) 28%, transparent);
  }
  /* がんばり on a row (1.5×): the same small yuzu chip on every stretched row, in its own column so the values line up;
     until then a ghost of it (dashed, faint) holds the place */
  .gbc { display: flex; justify-content: flex-start; }
  .chip {
    padding: 2px 6px 3px; border-radius: var(--r-pill); background: var(--c-yuzu); color: var(--c-ink);
    font: 700 11px/1.1 var(--font-ui); box-shadow: 0 1px 0 var(--c-yuzu-lip);
  }
  .ghost {
    padding: 1px 5px 2px; border-radius: var(--r-pill); border: 1px dashed color-mix(in srgb, var(--plate-ink) 30%, transparent);
    color: color-mix(in srgb, var(--plate-ink) 38%, transparent); font: 700 11px/1.1 var(--font-ui);
  }
  /* the day's ledger: word left, ベル right; this person's total under a hairline */
  .sum {
    grid-column: 1 / -1; display: grid; grid-template-columns: 1fr auto; align-items: baseline; gap: 2px 12px;
    margin-top: 3px; padding: 5px 8px 1px; border-top: 1px dashed color-mix(in srgb, var(--plate-ink) 25%, transparent);
    font: 500 var(--fs-s)/1.2 var(--font-ui); color: var(--plate-ink);
  }
  .sum .v { font: 700 var(--fs-s)/1.2 var(--font-num); text-align: right; }
  .sum .rule { grid-column: 1 / -1; height: 1px; margin: 1px 0; background: color-mix(in srgb, var(--plate-ink) 15%, transparent); }
  .sum .tot { font-weight: 700; }
  .sum b.tot { font-size: var(--fs-body); }
  /* nothing yet: the ledger's zeros are faint, a place that fills in as the day goes */
  .sum .v.zero { color: color-mix(in srgb, var(--plate-ink) 40%, transparent); }
  /* today's ふたりでぜんぶ: the pair's line under the ledger (yuzu once both met everything; 「ふたりに」: shared) */
  .duo {
    grid-column: 1 / -1; display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 3px; padding: 5px 8px 1px;
    border-top: 1px dashed color-mix(in srgb, var(--plate-ink) 25%, transparent); font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--plate-ink);
  }
  .duo b { font-family: var(--font-num); }
  .duo small { font: 500 11px/1.1 var(--font-ui); color: var(--c-ink-soft); }
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
    .sum { row-gap: 0; }
    .sum .rule { margin: 0; }
  }
  @media (max-height: 600px) {
    .detail { padding: 13px 6px 4px; }
    .row { padding-block: 1px; }
    .duo, .sum { margin-top: 2px; padding-top: 3px; }
  }
</style>
