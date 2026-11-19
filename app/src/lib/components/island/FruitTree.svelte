<script lang="ts">
  // One person's tree (docs/design.md "Trees"): a plain official hardwood of the season with today's four fruits in its
  // canopy, 🍐 🍑 🍒 🍎 left to right (RING_FRUITS, TREE_FRUIT). Each hangs grey at 0 and fills with colour as today's
  // amount nears its goal (fruitDay.ts greyAt). Once met it drops to the ground in front of the trunk (FRUIT_SPOTS): the
  // tree shakes, the fruit falls and bounces, a little dust, once (fruit-day in localStorage: a reload finds it lying
  // there). The tree's owner's tap picks it up (a hop, a sparkle; gone until the next Tokyo day) into their pocket (the
  // shop buys it, 60 かいがら, never ベル: the ベル come from the goal, on read); anyone else's tap opens the popup. With
  // all four met a gold fruit falls too (150 かいがら: fruitDay.ts) and the canopy glints now and then like NH's money
  // tree, so the day's progress stays after the pick-up.
  // Two buttons: the canopy (shakes the tree, drops two seasonal leaves, toggles the popup) and the fruit row (≥ 44px
  // tall: picks up the fallen fruit nearest the tap, else the same popup with the nearest fruit highlighted). The popup
  // is the one home of a person's per-fruit detail: a nameplate (whose tree, and when their data last arrived), then per
  // goal (🍎 steps first, POPUP_ORDER) today's amount against the goal (met or not), ✓ once met and a 「がんばり」 chip once at 1.5× (every stretched row
  // alike, whatever the cap; no numbers on the rows), each held by a faint ghost until then (the chip's only while the
  // cap can still pay); then the daily checks (顔 / HIIT / Core and ぜんぶ: model/checks.ts, my own tree's tappable); then
  // the day's meals (朝 / 昼 / 夜, ✓ once logged: mealChecks.ts) and under them P · F · C against that person's goals
  // (mealChecks.ts pfcMarks), each with its button → ごはん on that day (health/open.svelte.ts). No ベル: the rows say
  // what was earned. It stays until this tree is tapped again, the other tree is tapped,
  // or a tap lands outside it (IslandScene). A quick run of canopy taps (the third within 1.2 s, and each quick tap after; the trunk's and the fruit row's off a
  // fallen fruit count too: the row lies over the trunk's base) is NH's shake instead: the
  // popup closes, the tree rustles and `onshake` asks the scene what falls (treeShake.ts: a branch, now and then a wasp
  // nest). `shakeN` (bumped by idle life) shakes the tree without the popup; `celebrate` sparkles a fruit.
  import { pickUp } from '../motion/transitions.ts';
  import { holdLoop } from './clouds.ts';
  import { timers } from './timers.ts';
  import { onDestroy, onMount, untrack } from 'svelte';
  import type { PersonWeekView, RingFruit } from '#lib/types.ts';
  import type { Foliage } from '#lib/ui-state/season.ts';
  import { RING_FRUITS, GOALS_SHOWN } from '#lib/config/rules.ts';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import Fx from '../characters/Fx.svelte';
  import { fruitArt, seasonArt, treeArt } from '#lib/art.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';
  import { lastSyncLine } from '#lib/i18n/format.ts';
  import { minuteNow } from '#lib/time/clock.ts';
  import { islandDay } from './ambientClock.ts';
  import { todayPct } from '#lib/world/progress.ts';
  import { STRETCH } from '#lib/config/rules.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { FRUIT_SPOTS, fruitLean, FRUIT_U, OAK_AR, TREE, TREE_FRUIT, TREE_FRUIT_U, u } from './scene.ts';
  import { useWorld } from './camera.svelte.ts';
  import { GOLD_ART, fruitDay, fruitFilter, fruitGoods, fruitId, fruitMet, markDropped, markPicked, stageOf, type TreeFruit } from '#lib/world/fruitDay.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { shakeTap } from './treeShake.ts';
  import { partnerTurnTo, turnTo } from './avatar.ts';
  import { world as shared } from '#lib/store/world.svelte.ts';
  import { taken as takenBy } from '#lib/sync/world-day.ts';
  import { fx3d } from '#lib/world/fx3d.ts';
  import { echo3d } from './echo3d.ts';
  import { GOAL_TREES, offBuildingsAt } from '#lib/world/world.ts';
  import { site } from './site.svelte.ts';
  import { recordGoods } from '#lib/store/actions.ts';
  import { MAIN_MEALS, mealsLogged, pfcToday, type PfcMark } from '#lib/world/mealChecks.ts';
  import { setGoal } from '#lib/model/food.ts';
  import { askFood } from '../health/open.svelte.ts';
  import { prefetchSheet } from './sheetChunks.ts';
  import { sheetTap } from '#lib/ui-state/sheetTiming.ts';
  import { CHECK_KINDS, type CheckKind } from '#lib/contract/checks.ts';
  import { allChecked, allValues, dayChecks, FACE_VIDEO, toggleValue } from '#lib/model/checks.ts';
  import { setCheck } from '#lib/store/actions.ts';

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
    /** A quick run of taps shook the tree (the scene drops what falls; `fruitDown`: a fruit lies under it, so nothing). */
    onshake?: (fruitDown: boolean) => void;
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
  /** The gold fruit (all four met): [dx, up] in the canopy, its middle top, and [dx, dz] on the ground, in front of
   *  the four (fruitDay.ts). */
  const GOLD_UP: [number, number] = [0, 76], GOLD_SPOT: [number, number] = [0, -30];
  /** The tree's fruit, the gold one last (drawn only once met). */
  const FRUITS: readonly TreeFruit[] = [...RING_FRUITS, 'gold'];
  const artOf = (f: TreeFruit) => (f === 'gold' ? GOLD_ART : fruitArt(f));
  const modelOf = (f: TreeFruit) => (f === 'gold' ? GOLD_ART : `fruit/${f}`);
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
  const POPUP_ORDER: readonly RingFruit[] = GOALS_SHOWN;
  /** The がんばり the day can still pay (its ghosts show only while it can: at most STRETCH.cap). */
  const stretchBells = $derived(Math.min(STRETCH.cap, RING_FRUITS.filter((f) => ring(f).stretched).length * STRETCH.perGoal));

  /** Today's amount against the goal, always (met too): 「103 / 60分」 (whole units, rounded down so a goal shows met
   *  only once it is). */
  const amount = (f: RingFruit) => t(`tree.of.${f}`, { n: formatNum(Math.floor(ring(f).today)), g: formatNum(ring(f).goal) });
  const label = $derived(
    `${person.villagerName}: ` +
      POPUP_ORDER.map((f) => `${t(`fruit.${f}`)} ${amount(f)}${ring(f).met ? ' ✓' : ''}${ring(f).stretched ? ` ${t('tree.stretched')}` : ''}`).join('、')
  );
  /** When this person's data last arrived (on the nameplate, after the name). Read only while the popup is open, so the minute
   *  clock ticks only then. */
  const sync = $derived(open ? lastSyncLine(person.lastSyncAt, minuteNow()) : null);
  /** Today's 朝 / 昼 / 夜 in this person's meal log (mealChecks.ts; everyone's meals are seen by all three, the guest
   *  too: contract/guest.ts), read only while the popup is open; none in the gallery (no model). */
  const meals = $derived(open && week.model && week.view ? mealsLogged(week.model.state, person.person, week.view.today) : null);
  /** This phone's person's own tree: its ごはん button logs (きろく); anyone else's shows the day (みる: read-only). */
  const mine = $derived(week.view?.viewer === person.person);
  /** Today's P · F · C against this person's goals as they set them (`proteinGoal`, `fatGoal`, `carbsGoal`: model/food.ts
   *  setGoal; never a default, so never the weight-based protein one and the same on every phone, the guest's too), read
   *  only while the popup is open. */
  const pfc = $derived.by(() => {
    if (!open || !week.model || !week.view) return null;
    const s = week.model.state, who = person.person;
    return pfcToday(s, who, week.view.today, { p: setGoal(s, who, 'p'), fa: setGoal(s, who, 'fa'), c: setGoal(s, who, 'c') });
  });
  const pfcLabel = (m: PfcMark) =>
    t(m.goal === null ? 'tree.pfc.noGoal' : `tree.pfc.${m.state}`, { what: t(`tree.pfc.${m.k}`), g: formatNum(Math.round(m.g)), goal: formatNum(m.goal ?? 0), pct: m.pct ?? 0 }) +
    (m.left ? ` ${t('tree.pfc.left', { n: formatNum(m.left) })}` : '');
  const pfcAria = $derived(pfc ? `${t('tree.pfc.label', { name: person.villagerName })}: ${pfc.map(pfcLabel).join('、')}` : '');
  /** The share of a bar the fill takes: the track is 0 to 150 % of the goal, the goal's tick at two thirds. */
  const PFC_SPAN = 150;
  /** The meals row's and P · F · C's button: けんこう and ごはん's sheet on ごはん, today, on this tree's person's day
   *  (health/open.svelte.ts). Buttons in the popup: a tap never walks the player (SceneTaps) nor closes it. */
  function toFood() {
    sheetTap();
    askFood(person.person);
  }
  /** Today's daily checks (docs/design.md "Daily checks": 顔, HIIT, Core; model/checks.ts), read only while the popup
   *  is open; seen by all three (activity, not からだ), set only on my own tree. */
  const checks = $derived(open && week.model && week.view ? dayChecks(week.model.state, person.person, week.view.today) : null);
  const checksAll = $derived(checks ? allChecked(checks) : false);
  /** Bumped as my tap completes all three: the chip's sparkles (RULES.checks ベル, 0 for now: nothing else). */
  let checksDone = $state(0);
  /** A tap on one of my checks: flips it (a flip back to what the workouts say hands it back to them); ticking 顔 opens
   *  its video (FACE_VIDEO). */
  function toggleCheck(k: CheckKind) {
    if (!checks || !mine || !week.view) return;
    const c = checks[k], next = !c.done;
    // ticking 顔 opens its video, straight from the tap (iOS blocks a later open); un-ticking only un-ticks
    if (k === 'face' && next) window.open(FACE_VIDEO, '_blank', 'noopener');
    if (!setCheck(week.view.today, k, toggleValue(c))) return;
    const all = CHECK_KINDS.every((j) => (j === k ? next : checks[j].done));
    cue(all ? 'emote-joy' : next ? 'toggle-on' : 'toggle-off');
    if (all) checksDone++;
  }
  /** A tap on my ぜんぶ: every check done (no video: ぜんぶ says it's done already), or, all three done, none. */
  function toggleAll() {
    if (!checks || !mine || !week.view) return;
    const on = !checksAll, today = week.view.today;
    if (!allValues(checks, on).every(([k, v]) => setCheck(today, k, v))) return;
    cue(on ? 'emote-joy' : 'toggle-off');
    if (on) checksDone++;
  }
  const checkLabel = (k: CheckKind) => {
    const c = checks![k], item = t(`tree.check.${k}`);
    return t(c.done ? (c.auto && !c.manual ? 'tree.check.auto' : 'tree.check.on') : c.auto ? 'tree.check.unset' : 'tree.check.off', { item });
  };
  /** The fruit row leans out from the island's middle (left tree left, right tree right). */
  const lean = $derived(fruitLean(x, site.midX));
  /** The fruit row's offset off a building's ground, moved as one (world.ts offBuildingsAt round its middle, its whole
   *  width: a goal tree just behind a building or beside its door), [0, 0] almost always; the same on every phone. */
  const off = $derived.by(() => {
    void site.rev;
    const mx = x + lean, mz = z + (FRUIT_SPOTS[0][1] + FRUIT_SPOTS[1][1]) / 2;
    const [ox, oz] = offBuildingsAt(mx, mz, FRUIT_SPOTS[FRUIT_SPOTS.length - 1][0] + FRUIT_U / 2);
    return [ox - mx, oz - mz] as const;
  });

  /** Today (the model's Tokyo day; the gallery has no view) and this phone's record of today's fallen and picked fruit. */
  const date = $derived(week.view?.today ?? islandDay());
  /** (read again for each new day; a pick or a drop replaces it) */
  let rec = $derived(fruitDay(date));
  /** Fruit falling right now: its drop plays once. */
  let falling = $state<TreeFruit[]>([]);

  const spots = $derived(
    FRUITS.map((f, i) => {
      const met = fruitMet(f, (g) => ring(g).met), pct = f === 'gold' ? 100 : todayPct(ring(f));
      // picked up today by the tree's owner (the shared day's `fr:<person>:<fruit>`: pickMaySend) is gone on every phone
      const id = fruitId(person.person, f), by = date === islandDay() ? takenBy(shared.day, `fr:${id}`) : null;
      // anyone's pick-up takes it at once, mine too (a phone that lost its own record, rec, gets my claim back in the
      // relay's replay: a claim can't be made twice, so a fruit kept on the ground for it could never be picked up)
      const gone = !!by;
      const stage = gone && met ? 'gone' : stageOf(id, met, rec);
      // hanging: [dx, up] in the canopy's frame; on the ground: its own spot (gx, gz) in front of the trunk
      const [tx, up] = TREE_FRUIT[i] ?? GOLD_UP, spot = FRUIT_SPOTS[i] ?? GOLD_SPOT;
      const gx = x + lean + spot[0] + off[0], gz = z + spot[1] + off[1];
      const down = stage === 'ground' || stage === 'gone';
      // the canopy spot seen from the ground spot (units, its frame): the fall starts there
      const fx = x + tx - gx, fy = -up + spot[1] * FORE;
      // (the 3D island's model: drained toward grey as the DOM's filter, 0 once met)
      const grey = met ? 0 : Math.max(0, 1 - pct / 100) * 0.9;
      // (the gold one hangs only once met, as it falls)
      const shown = f !== 'gold' || met;
      return { f, i, met, stage, filter: fruitFilter(met ? 100 : pct), tx, up, gx, gz, fx, fy, down, grey, shown };
    })
  );
  const rowL = $derived(x + lean + off[0] + FRUIT_SPOTS[0][0] - FRUIT_U);
  const rowR = $derived(x + lean + off[0] + FRUIT_SPOTS[FRUIT_SPOTS.length - 1][0] + FRUIT_U);
  /** The fruit row's middle in depth (its button stands there, in front of whoever stands at the trunk). */
  const rowZ = $derived(z + off[1] + (FRUIT_SPOTS[0][1] + FRUIT_SPOTS[1][1]) / 2);
  /** Fallen fruit, waiting to be picked up (by the tree's owner alone: `pickable`). */
  const ground = $derived(spots.filter((s) => s.stage === 'ground'));
  const pickable = $derived(week.view?.viewer === person.person ? ground : []);
  /** All four met today: the canopy glints (NH's money tree). */
  const allMet = $derived(RING_FRUITS.every((f) => ring(f).met));

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
  function drop(d: string, f: TreeFruit) {
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
  /** Picks up a fallen fruit of my tree: gone from this phone until the next Tokyo day, into my pocket to sell at the
   *  shop (fruitDay.ts fruitGoods; no ベル: those come from the goal). */
  function collect(f: TreeFruit) {
    const s = pickable.find((p) => p.f === f);
    if (!s) return;
    // first wins: claimed at the tap (the partner's phone sees it picked up, by my villager)
    const sid = `fr:${fruitId(person.person, f)}`;
    if (!shared.share({ kind: 'pick', id: sid, what: `fruit:${f}`, at: [Math.round(s.gx), Math.round(s.gz)] }).fresh) return;
    // picked up where it lies, my villager turning to it (avatar.ts); into my pocket (the shop's くだもの)
    turnTo(s.gx);
    cue('fruit-pick');
    rec = markPicked(date, fruitId(person.person, f));
    addFx('sparkles', s.gx, s.gz, FRUIT_U * 0.4);
    recordGoods(fruitGoods(f), `pick:${sid}`);
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
      const f = e.id.slice(5 + person.person.length) as TreeFruit, s = spots.find((p) => p.f === f);
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
   *  canopy shakes the tree; the row highlights its nearest fruit). `run`: it counts toward a quick run's shake (the
   *  canopy's, the trunk's, and the row's off a fallen fruit: the row lies over the trunk's base). */
  let canopyTaps: number[] = [];
  function tap(f: RingFruit | null, canopy = f === null, run = canopy) {
    if (run) {
      const r = shakeTap(canopyTaps, Date.now());
      canopyTaps = r.taps;
      if (r.shake) {
        if (open) ontoggle?.(false);
        shake(true);
        return onshake?.(ground.length > 0);
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
    if (!e.detail || !btn) return pickable.length ? collect(pickable[0].f) : tap(null, false);
    const r = btn.getBoundingClientRect();
    const k = r.width / (rowR - rowL);
    const px = rowL + (e.clientX - r.left) / k;
    const near = <T extends { gx: number }>(list: T[]) => list.reduce((a, b) => (Math.abs(b.gx - px) < Math.abs(a.gx - px) ? b : a));
    if (pickable.length) {
      const g = near(pickable);
      if (Math.abs(g.gx - px) <= Math.max(22, 22 / k)) return collect(g.f);
    }
    // (off a fruit, or another's: over the trunk's base, so it counts toward a shake as the trunk's own tap would)
    tap(near(spots.slice(0, RING_FRUITS.length)).f as RingFruit, false, true);
  }

  /** {@attach}: the popup in screen space (docs/design.md "Trees"): over every tint and weather (never dimmed), in the
   *  same place whichever the camera: over its own tree, as far as the screen's edges allow (the other tree's canopy
   *  stays tappable), above the canopies when they leave room, else in the middle of the band between the
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
    // over its own tree (the user: not above the other one), as far as the screen's edges allow
    let left = Math.min(st.width - 8 - wd, Math.max(8, tx - wd / 2));
    let top = Math.min(ceil - h, Math.max(floor, (floor + ceil) / 2 - h / 2));
    // the 3D island's camera shows both goal trees well inside the screen: the popup goes over their canopies when it
    // fits there (both stay tappable), else in the band
    if (w.three) {
      const crown = w.clientAt(x, z, H)[1] - st.top;
      if (crown - 10 - h >= floor) top = crown - 10 - h;
      else {
        // no room: on this tree's side, clear of the other tree's canopy (its middle stays tappable)
        const [ox] = w.clientAt(x < site.midX ? GOAL_TREES.B[0] : GOAL_TREES.A[0], z, H * 0.7), oc = ox - st.left;
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
    {#if !s.down && s.shown}
      <span class="fruit up" data-fruit={s.f} data-tree={person.person} data-stage={s.stage}
        style:left={u(s.tx)} style:top={u(-s.up)} style:width={u(FRUIT_U)} style:--up={UP}>
        <span class="f" style:filter={s.filter}>
          <OfficialArt key={artOf(s.f)} size={u(FRUIT_U)} eager>
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
      style:height={u(H * 0.62)} style:--g={u(24)} style:--late="{x < site.midX ? 0 : 0.33}s">
      <span class="glow" {@attach holdLoop}></span>
      {#each GLINTS as [gx, gy], k (k)}
        <svg class="glint" {@attach holdLoop} viewBox="0 0 24 24" style:left="{gx}%" style:top="{gy}%" style:--k={k}>
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
    {#if !s.down && s.shown}
      <i class="m3n" {@attach w.at({ bare: true, x: x + s.tx * 1.25, z: z - 34, lift: s.up + 14, h: 4, always: true,
        m3: { key: modelOf(s.f), id: `fruit-${person.person}-${s.f}`, grey: s.grey, art: () => canopyEl?.parentElement?.querySelector(`.fruit.up[data-fruit="${s.f}"]`) } })}></i>
    {/if}
  {/each}
{/if}
<!-- met: on the ground in front of the trunk (each its own node, so a villager stands among them), until picked up -->
{#each spots as s (s.f)}
  {#if s.down && s.stage !== 'gone'}
    <div class="node" {@attach w.at({ x: s.gx, z: s.gz, h: FRUIT_U, m3: { key: modelOf(s.f), id: `fruit-${person.person}-${s.f}`, ms: falling.includes(s.f) ? 520 : 0 } })}>
      <span class="fruit" class:drop={falling.includes(s.f)} data-fruit={s.f} data-tree={person.person} data-stage={s.stage}
        style:width={u(FRUIT_U)} style:--fx={u(s.fx)} style:--fy={u(s.fy)} style:--up={UP} out:pickUp>
        <span class="f" style:filter={s.filter}>
          <OfficialArt key={artOf(s.f)} size={u(FRUIT_U)} eager>
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
    aria-label={pickable.length ? t(`tree.pick.${pickable[0].f}`) : label} aria-expanded={open} aria-controls={detailId}
    tabindex={pickable.length ? 0 : -1} data-sfx="self" data-tree-row={person.person} onclick={rowTap}></button>
</div>

{#each fx as e (e.n)}
  <div class="node" {@attach w.at({ x: e.x, z: e.z, lift: e.lift, h: 30, dz: -2 })}>
    <span class="fxa at" class:in3d={e.in3d}><Fx kind={e.kind} spread={u(26)} ondone={() => dropFx(e.n)} /></span>
  </div>
{/each}

{#if open}
  {#key taps}
    <!-- the popup: in screen space over everything (every tint and weather), its tail toward the tree -->
    <div class="pop">
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="detail" id={detailId} data-tree-pop role="status" onpointerdown={() => cue('tick')} {@attach keepInside}>
      <!-- whose tree, then when their data last arrived (it explains a low tree; a soft dot once it is SYNC_LATE_MS old) -->
      <span class="plate"><span class="nm">{person.villagerName}</span>{#if sync}<span class="sync" class:late={sync.late} role="img" aria-label={sync.text} data-sync>{sync.short}</span>{/if}</span>
      {#each POPUP_ORDER as f (f)}
        {@const r = ring(f)}
        <span class="row" class:on={picked === f} data-row={f} data-stretched={r.stretched || null}>
          <span class="ic"><OfficialArt key={fruitArt(f)} size="20px" eager /></span>
          <span class="lbl">{t(`fruit.${f}`)}</span>
          <span class="ck">{#if r.met}<svg class="ok" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check" /></svg>{:else}<span class="ok todo" aria-hidden="true"></span>{/if}</span>
          <span class="amt money" class:met={r.met}>{amount(f)}</span>
          <span class="gbc">{#if r.stretched}<span class="chip">{t('tree.stretched')}</span>{:else if stretchBells < STRETCH.cap}<span class="ghost" aria-hidden="true">{t('tree.stretched')}</span>{/if}</span>
        </span>
      {/each}
      <!-- today's daily checks: 顔, HIIT, Core as pills (HIIT and Core from the day's workouts, a dot; my tap overrides either way) -->
      {#if checks}
        <span class="row checks" data-checks>
          <span class="ic"><OfficialArt key="finds/coconut" size="20px" eager /></span>
          <span class="lbl">{t('tree.checks')}</span>
          <span class="mls">
            {#each CHECK_KINDS as k (k)}
              {@const c = checks[k]}
              <svelte:element this={mine ? 'button' : 'span'} role={mine ? undefined : 'img'} type={mine ? 'button' : undefined} class="pill" class:on={c.done} class:tap={mine}
                data-check={k} data-done={c.done || null} data-src={c.manual ? 'hand' : c.auto ? 'workout' : null} data-sfx={mine ? 'self' : undefined}
                aria-pressed={mine ? c.done : undefined} aria-label={checkLabel(k)}
                onpointerdown={mine ? (e: PointerEvent) => e.stopPropagation() : undefined} onclick={mine ? () => toggleCheck(k) : undefined}>
                {t(`tree.check.${k}`)}{#if c.auto}<i class="src" class:off={!c.done} aria-hidden="true"></i>{/if}
              </svelte:element>
            {/each}
          </span>
          <span class="gbc">
            {#if mine}
              <button type="button" class={checksAll ? 'chip all tap' : 'ghost all tap'} data-check-all data-done={checksAll || null} data-sfx="self" aria-pressed={checksAll}
                aria-label={t(checksAll ? 'tree.check.allLabel' : 'tree.check.allDo')} onpointerdown={(e) => e.stopPropagation()} onclick={toggleAll}
                >{t('tree.checks.all')}{#key checksDone}{#if checksDone && checksAll}<span class="fxa"><Fx kind="sparkles" spread="26px" /></span>{/if}{/key}</button>
            {:else if checksAll}<span class="chip all" data-check-all data-done role="img" aria-label={t('tree.check.allLabel')}>{t('tree.checks.all')}</span>
            {:else}<span class="ghost" data-check-all aria-hidden="true">{t('tree.checks.all')}</span>{/if}
          </span>
        </span>
      {/if}
      <!-- today's meals in the meal log: 朝 / 昼 / 夜, each ✓ once anything is logged in it (a snack doesn't count) -->
      {#if meals}
        <span class="row meals" data-meals>
          <span class="ic"><OfficialArt key="items/dinner" size="20px" eager /></span>
          <span class="lbl">{t('tree.meals')}</span>
          <span class="mls">
            {#each MAIN_MEALS as m (m)}
              <span class="ml" class:on={meals[m]} data-meal={m} data-logged={meals[m] || null}
                aria-label={t(meals[m] ? 'tree.meal.logged' : 'tree.meal.empty', { meal: t(`tree.meal.${m}`) })}>
                {#if meals[m]}<svg class="ok" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check" /></svg>{:else}<span class="ok todo" aria-hidden="true"></span>{/if}<span aria-hidden="true">{t(`tree.meal.${m}`)}</span>
              </span>
            {/each}
          </span>
          <span class="gbc">
            <button type="button" class="go" class:see={!mine} data-tree-food={person.person} data-sfx="self" aria-label={t(mine ? 'tree.meals.logLabel' : 'tree.meals.seeLabel', { name: person.villagerName })}
              aria-haspopup="dialog" onpointerdown={(e) => (e.stopPropagation(), void prefetchSheet('health'))} onclick={toFood}>{t(mine ? 'tree.meals.log' : 'tree.meals.see')}</button>
          </span>
        </span>
      {/if}
      <!-- today's P · F · C against the goals: a bar each (0 → 150 %, the goal a tick at ⅔; leaf once met, coral past a
           ceiling), grams where there's no goal; the whole row ごはん's button, as the meals row's -->
      {#if pfc}
        <button type="button" class="row pfc" data-tree-pfc={person.person} data-sfx="self" aria-label={pfcAria} aria-haspopup="dialog"
          onpointerdown={(e) => (e.stopPropagation(), void prefetchSheet('health'))} onclick={toFood}>
          <span class="lbl">{t('tree.pfc')}</span>
          <span class="nbs">
            {#each pfc as m (m.k)}
              <span class="nb" data-pfc={m.k} data-state={m.state} data-pct={m.pct}>
                <span class="ltr" aria-hidden="true">{m.k === 'fa' ? 'F' : m.k.toUpperCase()}</span>
                {#if m.goal === null}<span class="g" aria-hidden="true">{formatNum(Math.round(m.g))}g</span>
                {:else}<i class="tr" aria-hidden="true"><i class="fl" style:width="{Math.min(PFC_SPAN, m.pct ?? 0) / PFC_SPAN * 100}%"></i><i class="tk"></i></i>{/if}
                {#if m.left !== null}<span class="left" class:met={!m.left} data-left={m.left} aria-hidden="true">{#if m.left}{t('tree.pfc.left', { n: formatNum(m.left) })}{:else}<svg viewBox="0 0 24 24"><use href="#i-check" /></svg>{/if}</span>{/if}
              </span>
            {/each}
          </span>
        </button>
      {/if}
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
  /* NH-style popup: a nameplate, then one row per fruit in shared columns (subgrid): icon · word · ✓ · amount / goal
     (right-aligned, tabular) · がんばり; the daily checks, the meals and P · F · C on the same grid (from the ✓ column,
     the buttons in がんばり's), so every left and right edge lines up */
  .pop { position: absolute; inset: 0; z-index: var(--z-popup); pointer-events: none; --safe-b: var(--safe-bottom); }
  .detail {
    position: absolute; left: 0; top: 0; display: grid; grid-template-columns: 20px auto 18px auto auto; gap: 3px 8px;
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
  /* whose tree: NH's yuzu nameplate on the bubble's top edge, straight */
  .plate {
    position: absolute; left: 10px; top: 0; translate: 0 -55%; padding: 3px 10px; border-radius: var(--r-pill);
    background: var(--c-yuzu); color: var(--c-ink); font: 700 var(--fs-s)/1.2 var(--font-ui); box-shadow: 0 2px 0 var(--c-yuzu-lip);
    max-width: calc(100% - 20px); display: flex; align-items: baseline; gap: 8px; white-space: nowrap;
  }
  .row {
    grid-column: 1 / -1; display: grid; grid-template-columns: subgrid; align-items: center;
    padding: 3px 6px; border-radius: var(--r-chip); line-height: 1;
  }
  .row.on { background: var(--c-yuzu); }
  .ic { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; line-height: 0; }
  .lbl { font: 500 var(--fs-s)/1.2 var(--font-ui); }
  .ck { display: flex; }
  .amt { text-align: right; font: 700 var(--fs-s)/1.2 var(--font-num); font-variant-numeric: tabular-nums; color: var(--c-ink-soft); }
  .amt.met { color: var(--c-leaf-text); }
  .ok { width: 18px; height: 18px; flex: none; padding: 3px; border-radius: 50%; background: var(--c-leaf); color: var(--c-ink); display: block; }
  /* not met yet: the ✓'s place as a faint dashed ring, so an early morning's popup shows where the ✓ will come */
  .ok.todo {
    box-sizing: border-box; padding: 0; background: none;
    border: 1.5px dashed color-mix(in srgb, var(--plate-ink) 28%, transparent);
  }
  /* がんばり on a row (1.5×): the same small yuzu chip on every stretched row, in its own column so the values line up;
     until then a ghost of it (dashed, faint) holds the place */
  .gbc { display: flex; }
  .chip, .ghost, .go { flex: 1; box-sizing: border-box; padding: 3px 8px; border-radius: var(--r-pill); text-align: center; font: 700 13px/1.1 var(--font-ui); }
  .chip { background: var(--c-yuzu); color: var(--c-ink); box-shadow: 0 1px 0 var(--c-yuzu-lip); }
  .ghost { padding: 2px 7px; border: 1px dashed color-mix(in srgb, var(--plate-ink) 30%, transparent); color: color-mix(in srgb, var(--plate-ink) 38%, transparent); }
  /* the meals row's ごはん button: the column's pill, raised; leaf (the kit's action) on my own tree, the cream card on
     anyone else's (a look only); its tap area 44px tall over the rows around it */
  .go {
    --lip: var(--c-leaf-edge);
    position: relative; appearance: none; margin: 0; border: 0; cursor: pointer; background: var(--c-leaf); color: var(--c-ink);
    box-shadow: 0 2px 0 var(--lip); -webkit-tap-highlight-color: transparent; touch-action: manipulation;
    transition: transform 120ms var(--ease-soft), box-shadow 120ms var(--ease-soft);
  }
  .go::after { content: ''; position: absolute; left: -4px; right: -4px; top: 50%; height: var(--hit); translate: 0 -50%; }
  .go.see { --lip: var(--c-edge); background: var(--c-card); }
  .go:active { transform: translateY(2px); box-shadow: 0 0 0 var(--lip); }
  .go:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  /* today's meals: the goal rows' ✓ and dashed ring, one per meal, each with its 朝 / 昼 / 夜 (display only) */
  .mls { grid-column: 3 / -2; display: flex; align-items: center; gap: 8px; }
  .ml { display: inline-flex; align-items: center; gap: 3px; font: 700 var(--fs-s)/1.2 var(--font-ui); color: color-mix(in srgb, var(--plate-ink) 55%, transparent); }
  .ml.on { color: var(--c-leaf-text); }
  /* today's daily checks: pills, dashed until done, leaf once done (the ✓'s colours); mine are buttons, 44px tall tap
     areas over the rows around */
  .pill {
    position: relative; appearance: none; margin: 0; padding: 2px 7px; border-radius: var(--r-pill); background: none;
    border: 1.5px dashed color-mix(in srgb, var(--plate-ink) 28%, transparent); color: color-mix(in srgb, var(--plate-ink) 55%, transparent);
    font: 700 var(--fs-s)/1.2 var(--font-ui); -webkit-tap-highlight-color: transparent; touch-action: manipulation;
    transition: transform 120ms var(--ease-soft);
  }
  .pill.on { border: 1.5px solid var(--c-leaf); background: var(--c-leaf); color: var(--c-ink); }
  .pill.tap { cursor: pointer; }
  .pill.tap::after { content: ''; position: absolute; left: -3px; right: -3px; top: 50%; height: var(--hit); translate: 0 -50%; }
  .pill.tap:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .pill.tap:active { transform: scale(.92); }
  /* Health's workout says done: a small dot at the pill's top right (faint once unset by hand) */
  .src { position: absolute; right: -2px; top: -2px; width: 7px; height: 7px; border-radius: 50%; background: var(--c-leaf-text); box-shadow: 0 0 0 1.5px var(--plate); }
  .src.off { background: color-mix(in srgb, var(--plate-ink) 35%, transparent); }
  .checks .mls { gap: 5px; }
  .chip.all { position: relative; min-height: 0; }  /* (theme.css .chip: a 32px choice) */
  /* ぜんぶ on my tree: a button (the chip or its ghost), a 44px tall tap area over the rows around */
  .all.tap { position: relative; appearance: none; margin: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; touch-action: manipulation; transition: transform 120ms var(--ease-soft); }
  .all.tap::after { content: ''; position: absolute; left: -4px; right: -4px; top: 50%; height: var(--hit); translate: 0 -50%; }
  .all.tap:active { transform: scale(.94); }
  .all.tap:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .ghost.all.tap { background: none; }
  /* today's P · F · C: the meals row's second line, the whole row ごはん's button (its tap area 44px tall: it and the
     meals row's button open the same day); a bar each, 0 to 150 % of the goal, the goal a tick at two thirds: soft ink
     while under, leaf once met, coral past a ceiling; the plate is cream at every time of day, so its own inks */
  .pfc {
    position: relative; appearance: none; margin: 0; border: 0; background: none; color: inherit; font: inherit; text-align: left;
    cursor: pointer; -webkit-tap-highlight-color: transparent; touch-action: manipulation;
  }
  .pfc::after { content: ''; position: absolute; left: 0; right: 0; top: 50%; height: var(--hit); translate: 0 -50%; }
  .pfc:active { background: color-mix(in srgb, var(--plate-ink) 8%, transparent); }
  .pfc:focus-visible { outline: 3px solid var(--focus); outline-offset: 0; }
  .pfc .lbl { grid-column: 2; }
  .nbs { grid-column: 3 / -1; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
  /* protein with its goal: 「あと 42g」 after the bar, so its cell takes two shares */
  .nbs:has([data-left]) { grid-template-columns: minmax(0, 2fr) repeat(2, minmax(0, 1fr)); }
  .left { flex: none; font: 700 13px/1 var(--font-ui); color: var(--plate-ink); }
  .left svg { display: block; width: 16px; height: 16px; padding: 2px; border-radius: 50%; background: color-mix(in srgb, var(--c-leaf) 55%, transparent); color: var(--c-ink); }
  .nb { display: flex; align-items: center; gap: 4px; min-width: 0; }
  .ltr { font: 700 13px/1 var(--font-num); color: color-mix(in srgb, var(--plate-ink) 70%, transparent); }
  .nb .g { font: 700 13px/1 var(--font-num); color: color-mix(in srgb, var(--plate-ink) 55%, transparent); }
  .tr { position: relative; flex: 1; height: 7px; border-radius: 4px; background: color-mix(in srgb, var(--plate-ink) 14%, transparent); }
  .fl { position: absolute; left: 0; top: 0; bottom: 0; border-radius: inherit; background: color-mix(in srgb, var(--plate-ink) 45%, transparent); }
  .nb[data-state='met'] .fl { background: var(--c-leaf); }
  .nb[data-state='over'] .fl { background: var(--c-coral); }
  .nb[data-state='over'] .ltr { color: var(--c-coral-text); }
  .tk { position: absolute; left: calc(200% / 3); top: -3px; bottom: -3px; width: 2px; margin-left: -1px; border-radius: 1px; background: var(--plate-ink); }
  /* when the data last arrived: on the plate after the name, lighter; the plate is yuzu at every time of day, so the
     ink's (≥ 7:1 on it), never the theme's soft text */
  .nm { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .sync { flex: none; display: inline-flex; align-items: center; gap: 4px; font: 500 13px/1.2 var(--font-ui); color: var(--c-ink); }
  .sync.late::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--c-ink); opacity: .55; }
  /* phone stages (iPhone 15/16 and their Pro sizes, to 440): the word goes (the fruit art says which), so the popup fits
     over its own tree, clear of the other's middle */
  @container (max-width: 440px) {
    .detail { grid-template-columns: 20px 18px auto auto; column-gap: 10px; }
    .lbl { display: none; }
    .mls { grid-column: 2 / -2; }
    .nbs { grid-column: 2 / -1; }
  }
  /* short screens: tighter rows, so the popup covers less of the canopy when the sky is short (keepInside) */
  @media (max-height: 700px) {
    .detail { row-gap: 0; padding: 14px 8px 6px; }
    .row { padding-block: 2px; }
  }
  @media (max-height: 600px) {
    .detail { padding: 13px 6px 4px; }
    /* (the 4 goals, daily checks, meals and P · F · C: 16px marks and no row padding, so the popup still fits over the
       canopies) */
    .row { padding-block: 0; }
    .detail { grid-template-columns: 16px 16px auto auto; }
    .ic, .ic :global(*) { width: 16px; height: 16px; }
    .ok { width: 16px; height: 16px; padding: 2px; }
  }
</style>
