<script lang="ts">
  // One person's tree (docs/design.md "Trees"): a plain official hardwood of the season with today's four fruits in its
  // canopy, 🍐 🍑 🍒 🍎 left to right (RING_FRUITS, TREE_FRUIT). Each hangs grey at 0 and fills with colour as today's
  // amount nears its goal (fruitDay.ts greyAt). Once met it drops to the ground in front of the trunk (FRUIT_SPOTS): the
  // tree shakes, the fruit falls and bounces, a little dust, once (fruit-day in localStorage: a reload finds it lying
  // there). The tree's owner's tap picks it up (a hop, a sparkle; gone until the next Tokyo day) into their pocket (the
  // shop buys it, 60 かいがら, never ベル: the ベル come from the goal, on read); anyone else's tap opens the popup. With
  // all four met a gold fruit falls too (150 かいがら: fruitDay.ts) and the canopy glints now and then like NH's money
  // tree, so the day's progress stays after the pick-up.
  // Two tap areas (things3 Tap3, the canvas router's: no DOM on the island, R4 step 7; the tree, its fruit, the leaves
  // and the sparkles are the 3D island's): the canopy and trunk (shakes the tree, drops two seasonal leaves, toggles the
  // popup) and the fruit row (≥ 44px tall: picks up the fallen fruit nearest the tap, else the same popup with the
  // nearest fruit highlighted). The popup (an overlay over the canvas)
  // is the one home of a person's per-fruit detail: a nameplate (whose tree, and when their data last arrived), then per
  // goal (🍎 steps first, POPUP_ORDER) a cell of a 2 × 2: its fruit, its mark (progress.ts goalMark: a dashed ring, ✓
  // once met, a yuzu star with 「+2」 once its がんばり pays) and today's amount over 「/ the goal」; then the daily checks
  // (顔 / HIIT / Core: model/checks.ts, my own tree's each a tap), the day's meals (朝 / 昼 / 夜, ✓ once logged:
  // mealChecks.ts) and P · F · C against that person's goals (mealChecks.ts pfcMarks): three rows on one grid, the
  // meals row and P · F · C each wholly a button → ごはん on that day (health/open.svelte.ts). No ベル: the rows say
  // what was earned. It stays until this tree is tapped again, the other tree is tapped,
  // or a tap lands outside it (IslandScene). A quick run of canopy taps (the third within 1.2 s, and each quick tap after; the trunk's and the fruit row's off a
  // fallen fruit count too: the row lies over the trunk's base) is NH's shake instead: the
  // popup closes, the tree rustles and `onshake` asks the scene what falls (treeShake.ts: a branch, now and then a wasp
  // nest). `shakeN` (bumped by idle life) shakes the tree without the popup; `celebrate` sparkles a fruit.
  import { timers } from './timers.ts';
  import { onDestroy, onMount, untrack } from 'svelte';
  import type { PersonWeekView, RingFruit } from '#lib/types.ts';
  import type { Foliage } from '#lib/ui-state/season.ts';
  import { RING_FRUITS, GOALS_SHOWN } from '#lib/config/rules.ts';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import Fx from '../characters/Fx.svelte';
  import { fruitArt } from '#lib/art.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';
  import { lastSyncLine } from '#lib/i18n/format.ts';
  import { minuteNow } from '#lib/time/clock.ts';
  import { islandDay } from './ambientClock.ts';
  import { goalMark, todayPct } from '#lib/world/progress.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { FRUIT_SPOTS, fruitLean, FRUIT_U, OAK_AR, TREE, TREE_FRUIT } from './scene.ts';
  import { useWorld } from './camera.svelte.ts';
  import { tap as tap3, thing, things3, type Tap3 } from '../world3d/things3.ts';
  import { GOLD_ART, fruitDay, fruitGoods, fruitId, fruitMet, greyAt, markDropped, markPicked, stageOf, type TreeFruit } from '#lib/world/fruitDay.ts';
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
  import { askActivity, askFood } from '../health/open.svelte.ts';
  import type { Metric } from '#lib/model/health.ts';
  import { prefetchSheet } from './sheetChunks.ts';
  import { sheetTap } from '#lib/ui-state/sheetTiming.ts';
  import { CHECK_KINDS, type CheckKind } from '#lib/contract/checks.ts';
  import { allChecked, dayChecks, FACE_VIDEO, toggleValue } from '#lib/model/checks.ts';
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
  /** The gold fruit (all four met): [dx, up] in the canopy, its middle top, and [dx, dz] on the ground, in front of
   *  the four (fruitDay.ts). */
  const GOLD_UP: [number, number] = [0, 76], GOLD_SPOT: [number, number] = [0, -30];
  /** The tree's fruit, the gold one last (drawn only once met). */
  const FRUITS: readonly TreeFruit[] = [...RING_FRUITS, 'gold'];
  const modelOf = (f: TreeFruit) => (f === 'gold' ? GOLD_ART : `fruit/${f}`);
  /** The money-tree glints on a perfect day: [left, top] in % of the canopy (its top 62 %). */
  const GLINTS: [number, number][] = [[25, 38], [52, 22], [72, 44], [44, 58]];
  /** がんばり's mark: a 12-point seal (its shape, not only its colour, tells it from the ✓'s round). */
  const STAR = 'M12 0L14.59 2.34L18 1.61L19.07 4.93L22.39 6L21.66 9.41L24 12L21.66 14.59L22.39 18L19.07 19.07L18 22.39L14.59 21.66L12 24L9.41 21.66L6 22.39L4.93 19.07L1.61 18L2.34 14.59L0 12L2.34 9.41L1.61 6L4.93 4.93L6 1.61L9.41 2.34Z';
  let picked = $state<RingFruit | null>(null);
  let taps = $state(0);
  const { later, clear } = timers();
  onDestroy(clear);

  const ring = (f: RingFruit) => person.rings[f];
  /** The popup's rows: 🍎 steps first, then Apple's rings (the canopy keeps RING_FRUITS). */
  const POPUP_ORDER: readonly RingFruit[] = GOALS_SHOWN;
  /** Today's amount (whole units, rounded down so a goal shows met only once it is) and 「/ the goal」 under it. */
  const today = (f: RingFruit) => formatNum(Math.floor(ring(f).today));
  const goalOf = (f: RingFruit) => t(`tree.of.${f}`, { g: formatNum(ring(f).goal) });
  /** A goal's mark (progress.ts goalMark) from the day's ベル on it (ringBells: 2 once its がんばり is paid). */
  const mark = (f: RingFruit) => goalMark(ring(f), person.today.rings[f]);
  const markText = (f: RingFruit) => {
    const m = mark(f);
    return m.kind === 'todo' ? '' : m.kind === 'met' ? ' ✓' : ` ${t('tree.stretched', { n: m.bells })}`;
  };
  const cellLabel = (f: RingFruit) => `${t(`fruit.${f}`)} ${today(f)} ${goalOf(f)}${markText(f)}`;
  /** When this person's data last arrived (on the nameplate, after the name). Read only while the popup is open, so the minute
   *  clock ticks only then. */
  const sync = $derived(open ? lastSyncLine(person.lastSyncAt, minuteNow()) : null);
  /** Today's 朝 / 昼 / 夜 in this person's meal log (mealChecks.ts; everyone's meals are seen by all three, the guest
   *  too: contract/guest.ts), read only while the popup is open; none in the gallery (no model). */
  const meals = $derived(open && week.model && week.view ? mealsLogged(week.model.state, person.person, week.view.today) : null);
  /** This phone's person's own tree: its checks are taps, its ごはん row logs; anyone else's shows the day (read-only). */
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
  /** A row item's place on the rows' grid (.rows): its label's track and its status's, column `i` of three. */
  const col = (i: number) => `${i + 1}`;
  /** The meals row's name: what a tap does, then each meal's state. */
  const mealsAria = $derived(meals ? `${t(mine ? 'tree.meals.logLabel' : 'tree.meals.seeLabel', { name: person.villagerName })}: ${MAIN_MEALS.map((m) => t(meals[m] ? 'tree.meal.logged' : 'tree.meal.empty', { meal: t(`tree.meal.${m}`) })).join('、')}` : '');
  /** The meals row's and P · F · C's button: けんこう and ごはん's sheet on ごはん, today, on this tree's person's day
   *  (health/open.svelte.ts). Buttons in the popup: a tap never walks the player (SceneTaps) nor closes it. */
  function toFood() {
    sheetTap();
    askFood(person.person);
  }
  /** A goal's cell (not its mark): 健康's 活動 at that goal's card, this tree's person's. */
  const METRIC_OF: Record<RingFruit, Metric> = { apple: 'steps', pear: 'move', peach: 'exercise', cherry: 'stand' };
  function toActivity(f: RingFruit) {
    sheetTap();
    askActivity(person.person, METRIC_OF[f]);
  }
  /** Today's daily checks (docs/design.md "Daily checks": 顔, HIIT, Core; model/checks.ts), read only while the popup
   *  is open; seen by all three (activity, not からだ), set only on my own tree. */
  const checks = $derived(open && week.model && week.view ? dayChecks(week.model.state, person.person, week.view.today) : null);
  const checksAll = $derived(checks ? allChecked(checks) : false);
  /** Bumped as my tap completes all three (the third tick): sparkles on that pill (RULES.checks ベル, 0 for now:
   *  nothing else). */
  let checksDone = $state(0);
  let doneOn = $state<CheckKind | null>(null);
  /** A tap on one of my checks: flips it; ticking 顔 opens its video (FACE_VIDEO). */
  function toggleCheck(k: CheckKind) {
    if (!checks || !mine || !week.view) return;
    const c = checks[k], next = !c.done;
    // ticking 顔 opens its video, straight from the tap (iOS blocks a later open); un-ticking only un-ticks
    if (k === 'face' && next) window.open(FACE_VIDEO, '_blank', 'noopener');
    if (!setCheck(week.view.today, k, toggleValue(c))) return;
    const all = CHECK_KINDS.every((j) => (j === k ? next : checks[j].done));
    cue(all ? 'emote-joy' : next ? 'toggle-on' : 'toggle-off');
    if (all) (doneOn = k), checksDone++;
  }
  const checkLabel = (k: CheckKind) => t(checks![k].done ? 'tree.check.on' : 'tree.check.off', { item: t(`tree.check.${k}`) });
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
      // (its model drained toward grey, 0 once met; the e2e's grey: greyAt)
      const grey = met ? 0 : Math.max(0, 1 - pct / 100) * 0.9, greyE2e = greyAt(met ? 100 : pct);
      // (the gold one hangs only once met, as it falls)
      const shown = f !== 'gold' || met;
      // where its model is: in the canopy's front, else on its ground spot
      const at: [number, number, number] = down ? [gx, gz, 0] : [x + tx * 1.25, z - 34, up + 14];
      return { f, i, met, stage, gx, gz, down, grey, greyE2e, shown, at };
    })
  );
  const rowL = $derived(x + lean + off[0] + FRUIT_SPOTS[0][0] - FRUIT_U);
  const rowR = $derived(x + lean + off[0] + FRUIT_SPOTS[FRUIT_SPOTS.length - 1][0] + FRUIT_U);
  /** The fruit row's middle in depth (its button stands there, in front of whoever stands at the trunk). */
  const rowZ = $derived(z + off[1] + (FRUIT_SPOTS[0][1] + FRUIT_SPOTS[1][1]) / 2);
  /** Its tap areas (things3 Tap3: the 3D pick's and the canvas router's, world3d/pick3d.ts), as its buttons: the trunk
   *  and its base (≥ 45 × 48 px), the canopy, the fruit row (≥ 44 px tall, a pill). */
  const taps3 = $derived.by((): Tap3[] => {
    const id = person.person, goal = () => tap(null);
    return [
      { kind: 'goal', id, part: 'trunk', x, z, h: H, model: true, l: -W * 0.21, r: W * 0.21, b: -4, t: H * 0.5 - 4, min: [45, 48, 'bottom'], round: [0.4, 0.3], act: goal },
      { kind: 'goal', id, part: 'canopy', x, z, h: H, dz: -14, model: true, l: -W / 2, r: W / 2, b: H * 0.38, t: H, round: [0.45, 0.45], act: goal },
      { kind: 'row', id, x: (rowL + rowR) / 2, z: rowZ, h: 30, dz: -40, l: -(rowR - rowL) / 2, r: (rowR - rowL) / 2, b: FRUIT_U / 2 - 15, t: FRUIT_U / 2 + 15, min: [0, 44, 'mid'], radius: 22,
        act: (px, _py, a) => rowAt(px, a.l, a.r) }
    ];
  });
  /** Fallen fruit, waiting to be picked up (by the tree's owner alone: `pickable`). */
  const ground = $derived(spots.filter((s) => s.stage === 'ground'));
  const pickable = $derived(week.view?.viewer === person.person ? ground : []);
  /** All four met today: the canopy glints (NH's money tree). */
  const allMet = $derived(RING_FRUITS.every((f) => ring(f).met));
  // ... in 3D (fx3d 'glint', 24 u: R4 step 7, the 2D glints over the canvas ported): one of the four every .65 s in turn
  // (the right tree .33 s later), only on screen while the page shows; the e2e's goal().glints (things3 probe)
  $effect(() => {
    if (!allMet) return;
    const t0 = performance.now() + (x < site.midX ? 0 : 330);
    let k = -1;
    const id = setInterval(() => {
      const n = Math.floor((performance.now() - t0) / 650);
      if (n <= k) return;
      k = n;
      const [gx, gy] = GLINTS[((n % GLINTS.length) + GLINTS.length) % GLINTS.length];
      if (!document.hidden && w.inView(x, z, 40)) fx3d('glint', x + (gx / 100 - 0.5) * W, z - 4, H * (1 - (0.62 * gy) / 100), { size: 3 });
    }, 100);
    return () => clearInterval(id);
  });
  // the e2e's row (things3 probe goal:<tree>): its popup open, the glints, and each fruit shown (its stage, up in the
  // canopy or down, its drop playing, its grey: greyAt), `id3` its model's (Island3D's box('fruit'))
  $effect(() => {
    const r = things3(w), key = `goal:${person.person}`;
    const row = () => ({
      open, glints: allMet,
      fruit: spots.filter((s) => s.shown && s.stage !== 'gone').map((s) => ({ f: s.f, stage: s.stage, up: !s.down, dropping: falling.includes(s.f), grey: s.greyE2e, id3: fruitId3(s.f), at: s.at }))
    });
    r.probes.set(key, row);
    return () => void (r.probes.get(key) === row && r.probes.delete(key));
  });

  // ---- on the island (things3: the 3D island draws them): the tree's tap areas, its fruit in the canopy (NH's model on
  // the canopy's front, greyed by progress) and, once met, the same instance on its ground spot (its fall: `ms`) ----
  const fruitId3 = (f: TreeFruit) => `fruit-${person.person}-${f}`;
  $effect(() => {
    const list = taps3;
    return untrack(() => tap3(w, list)());
  });
  $effect(() => {
    const list = spots.filter((s) => s.shown && s.stage !== 'gone'), drop = falling;
    return untrack(() => {
      const offs = list.map((s) => {
        const [tx, tz, lift] = s.at, m3 = { key: modelOf(s.f), id: fruitId3(s.f) };
        return s.down
          ? thing(w, { x: tx, z: tz, h: FRUIT_U, m3: { ...m3, ms: drop.includes(s.f) ? 520 : 0 } })()
          : thing(w, { x: tx, z: tz, lift, h: 4, always: true, m3: { ...m3, grey: s.grey } })();
      });
      return () => offs.forEach((off) => off());
    });
  });
  // a fruit's celebration (idle life's): sparkles on it
  $effect(() => {
    const c = celebrate;
    if (!c?.n) return;
    untrack(() => {
      const s = spots.find((p) => p.f === c.fruit && p.shown && p.stage !== 'gone');
      if (s) fx3d('sparkle', s.at[0], s.at[1], s.at[2] + FRUIT_U * 0.4);
    });
  });

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
    // (a little dust where it lands)
    if (s) later(() => fx3d('dust', s.gx, s.gz), 290);
    later(() => (falling = falling.filter((g) => g !== f)), 1600);
  }

  /** NH's pick-up: the fruit's model hops up, shrinking, and is gone with a sparkle (340 ms). */
  let hops = 0;
  function picked3(s: { f: TreeFruit; gx: number; gz: number }) {
    const t0 = performance.now(), MS = 340, k = () => Math.min(1, (performance.now() - t0) / MS);
    const off = thing(w, { x: s.gx, z: s.gz, h: 30, live: () => [s.gx, s.gz, 18 * Math.sin(k() * Math.PI * 0.6)], m3: { key: modelOf(s.f), id: `fruit-hop-${person.person}-${++hops}`, get size() { return 1 - 0.7 * k() ** 2; } } })();
    const moving = w.moveStart('present');
    later(() => (off(), moving()), MS);
    fx3d('sparkle', s.gx, s.gz, FRUIT_U * 0.4);
  }

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
    picked3(s);
    recordGoods(fruitGoods(f), `pick:${sid}`);
  }

  /** `sound`: a tap or a real event rustles; idle life's shake stays silent. */
  function shake(sound = false) {
    if (sound) cue('tree-shake');
    echo3d(`goal-${person.person}`, 1.8);
    // the season's leaves (a petal, a maple leaf, a snowflake; else green) fall from either side of the canopy's front
    const v = foliage === 'blossom' ? 'petal' : foliage === 'fall' ? 'maple-leaf' : foliage === 'snow' ? 'snowflake' : undefined;
    for (const dx of [-W * 0.3, W * 0.28]) fx3d('leaves', x + dx, z - 40, H * 0.5, { v });
  }

  // The partner picks up a fallen fruit (the shared day's news, just now): their villager turns to it, it pops and is gone.
  onMount(() =>
    shared.on(({ e, live }) => {
      if (e.kind !== 'pick' || !e.id.startsWith(`fr:${person.person}:`)) return;
      const f = e.id.slice(5 + person.person.length) as TreeFruit, s = spots.find((p) => p.f === f);
      if (!s || !live) return;
      partnerTurnTo(s.gx, e.who);
      cue('fruit-pick');
      picked3(s);
    })
  );

  // React to `shakeN` only.
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

  /** A tap on the fruit row at client x, the row from l to r on screen: the fallen fruit nearest it (within 22u, or
   *  22px on a small stage: a 44px target for a lone fruit) picked up, else the tree's tap with the nearest fruit
   *  highlighted (counting toward a shake). */
  function rowAt(cx: number, l: number, r: number) {
    const k = (r - l) / (rowR - rowL);
    const px = rowL + (cx - l) / k;
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

</script>

{#if open}
  {#key taps}
    <!-- the popup: in screen space over everything (every tint and weather), its tail toward the tree -->
    <div class="pop">
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="detail" data-tree-pop role="status" onpointerdown={() => cue('tick')} {@attach keepInside}>
      <!-- whose tree, then when their data last arrived (it explains a low tree; a soft dot once it is SYNC_LATE_MS old) -->
      <span class="plate"><span class="nm">{person.villagerName}</span>{#if sync}<span class="sync" class:late={sync.late} role="img" aria-label={sync.text} data-sync>{sync.short}</span>{/if}</span>
      <!-- the four goals, a 2 × 2 (🍎 🍐 / 🍑 🍒): the fruit, its mark (a dashed ring; ✓ once met; a yuzu star with
           +N, the day's ベル on it, once its がんばり pays) and today's amount over 「/ the goal」 -->
      <span class="goals">
        {#each POPUP_ORDER as f (f)}
          {@const r = ring(f)}
          {@const m = mark(f)}
          <button type="button" class="cell" class:on={picked === f} data-row={f} data-mark={m.kind} data-stretched={r.stretched || null} data-sfx="self"
            aria-label={cellLabel(f)} aria-haspopup="dialog" onpointerdown={(e) => (e.stopPropagation(), void prefetchSheet('health'))} onclick={() => toActivity(f)}>
            <span class="ic"><OfficialArt key={fruitArt(f)} size="20px" eager /></span>
            <!-- the mark: its own 44px box, a tap on it does nothing (only the rest of the cell opens 活動) -->
            <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
            <span class="ck" aria-hidden="true" data-sfx="self" onpointerdown={(e) => (e.stopPropagation(), cue('tick'))} onclick={(e) => e.stopPropagation()}>{#if m.kind === 'stretch'}<span class="ok star"><svg viewBox="-1 -1 26 26"><path d={STAR} /></svg><span class="bn">+{m.bells}</span></span>{:else if m.kind === 'met'}<svg class="ok" viewBox="0 0 24 24"><use href="#i-check" /></svg>{:else}<span class="ok todo"></span>{/if}</span>
            <span class="amt money" class:met={r.met}><span class="n">{today(f)}</span><span class="of">{goalOf(f)}</span></span>
          </button>
        {/each}
      </span>
      <!-- three rows on one grid (docs/design.md "Trees"): 顔 / HIIT / Core, 朝 / 昼 / 夜, P · F · C, each item a label then
           its status in the same three columns, on the 2 × 2's left edge; every row 44px tall, 4px apart -->
      {#if checks || meals || pfc}
        <span class="rows">
          <!-- today's daily checks: each its own tap on my tree; the third tick sparkles -->
          {#if checks}
            <span class="row" data-checks data-all={checksAll || null}>
              <span class="sr-only">{t('tree.checks')}</span>
              {#each CHECK_KINDS as k, i (k)}
                {@const c = checks[k]}
                <svelte:element this={mine ? 'button' : 'span'} role={mine ? undefined : 'img'} type={mine ? 'button' : undefined} class="it" class:tap={mine} style:grid-column={col(i)}
                  data-check={k} data-done={c.done || null} data-sfx={mine ? 'self' : undefined}
                  aria-pressed={mine ? c.done : undefined} aria-label={checkLabel(k)}
                  onpointerdown={mine ? (e: PointerEvent) => e.stopPropagation() : undefined} onclick={mine ? () => toggleCheck(k) : undefined}>
                  <span class="lb" aria-hidden="true">{t(`tree.check.${k}`)}</span>
                  <span class="mk" aria-hidden="true">{#if c.done}<svg class="ok" viewBox="0 0 24 24"><use href="#i-check" /></svg>{:else}<span class="ok todo"></span>{/if}</span>
                  {#key checksDone}{#if checksDone && checksAll && doneOn === k}<span class="fxa"><Fx kind="sparkles" spread="26px" /></span>{/if}{/key}
                </svelte:element>
              {/each}
            </span>
          {/if}
          <!-- today's meals in the meal log, each ✓ once anything is logged in it (a snack doesn't count); the whole row
               ごはん's button on that day (きろく on my tree, a look on anyone else's) -->
          {#if meals}
            <button type="button" class="row tap" data-meals data-tree-food={person.person} data-sfx="self" aria-label={mealsAria} aria-haspopup="dialog"
              onpointerdown={(e) => (e.stopPropagation(), void prefetchSheet('health'))} onclick={toFood}>
              {#each MAIN_MEALS as m, i (m)}
                <span class="it" style:grid-column={col(i)} data-meal={m} data-logged={meals[m] || null}>
                  <span class="lb">{t(`tree.meal.${m}`)}</span>
                  <span class="mk">{#if meals[m]}<svg class="ok" viewBox="0 0 24 24"><use href="#i-check" /></svg>{:else}<span class="ok todo"></span>{/if}</span>
                </span>
              {/each}
            </button>
          {/if}
          <!-- today's P · F · C against the goals: a bar each (0 → 150 %, the goal a tick at ⅔; leaf once met, coral past a
               ceiling), grams where there's no goal; the whole row ごはん's button, as the meals row -->
          {#if pfc}
            <button type="button" class="row tap" data-tree-pfc={person.person} data-sfx="self" aria-label={pfcAria} aria-haspopup="dialog"
              onpointerdown={(e) => (e.stopPropagation(), void prefetchSheet('health'))} onclick={toFood}>
              {#each pfc as m, i (m.k)}
                <span class="it" style:grid-column={col(i)} data-pfc={m.k} data-state={m.state} data-pct={m.pct}>
                  <span class="lb" aria-hidden="true">{m.k === 'fa' ? 'F' : m.k.toUpperCase()}</span>
                  <span class="v" aria-hidden="true">
                    {#if m.goal === null}<i class="tr empty"></i>
                    {:else}<i class="tr"><i class="fl" style:width="{Math.min(PFC_SPAN, m.pct ?? 0) / PFC_SPAN * 100}%"></i><i class="tk"></i></i>{/if}
                    <span class="st">
                      {#if m.left !== null}<span class="left" class:met={!m.left} data-left={m.left}>{#if m.left}{t('tree.pfc.left', { n: formatNum(m.left) })}{:else}<svg viewBox="0 0 24 24"><use href="#i-check" /></svg>{/if}</span>
                      {:else}<span class="g">{formatNum(Math.round(m.g))}g</span>{/if}
                    </span>
                  </span>
                </span>
              {/each}
            </button>
          {/if}
        </span>
      {/if}
    </div>
    </div>
  {/key}
{/if}

<style>
  .fxa { position: absolute; left: 50%; top: 30%; width: 0; height: 0; }
  /* NH-style popup: a nameplate, the four goals as a 2 × 2 (fruit · mark · amount over 「/ the goal」), then the daily
     checks, the meals and P · F · C on one three-column grid from the fruit's left edge (.rows). Each
     control a ≥ 44px box (--hit), 8px or more from the next, so a thumb lands on one */
  .pop { position: absolute; inset: 0; z-index: var(--z-popup); pointer-events: none; --safe-b: var(--safe-bottom); }
  .detail {
    position: absolute; left: 0; top: 0; display: flex; flex-direction: column;
    background: var(--plate); border-radius: var(--r-btn); padding: 16px 8px 8px; white-space: nowrap;
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
  /* (16px between the two columns, 12px between the rows: the cells' boxes, so the art sits further apart still) */
  .goals { display: grid; grid-template-columns: repeat(2, auto); gap: 12px 16px; margin-bottom: 4px; }
  /* a goal's cell: a button (→ 活動) but for its mark, a 44px box of its own that takes its taps (nothing happens) */
  .cell {
    appearance: none; margin: 0; border: 0; background: none; color: inherit; font: inherit; text-align: left; cursor: pointer;
    display: grid; grid-template-columns: 20px calc(var(--hit) - 2px) auto; align-items: center; min-height: var(--hit);
    padding: 0 4px 0 2px; border-radius: var(--r-chip); -webkit-tap-highlight-color: transparent; touch-action: manipulation;
  }
  .cell.on { background: var(--c-yuzu); }
  .cell:active { background: color-mix(in srgb, var(--plate-ink) 8%, transparent); }
  .cell:focus-visible { outline: 3px solid var(--focus); outline-offset: -2px; }
  .ic { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; line-height: 0; }
  .ck { display: flex; align-items: center; justify-content: center; width: var(--hit); height: var(--hit); margin-left: -2px; cursor: default; }
  /* (its 44px box reaches 2px back over the fruit, on top: 9px from the fruit to the ring and 15px on to the value's box,
     the star 3px less each side; the cell narrow enough for the other tree's middle to stay clear at 375) */
  /* today's amount, bold, over 「/ the goal」 in a smaller soft line (both right-aligned, tabular) */
  .amt { margin-left: 4px; display: flex; flex-direction: column; align-items: flex-end; font-variant-numeric: tabular-nums; color: var(--c-ink-soft); }
  .amt .n { font: 700 var(--fs-body)/1.1 var(--font-num); }
  /* (the plate's soft ink, ≥ 4.5:1 on its cream day and night) */
  .amt .of { font: 600 var(--fs-s)/1.2 var(--font-num); color: var(--c-ink-soft); }
  .amt.met .n { color: var(--c-leaf-text); }
  .ok { width: 22px; height: 22px; flex: none; padding: 4px; border-radius: 50%; background: var(--c-leaf); color: var(--c-ink); display: block; }
  /* not met yet: the ✓'s place as a faint dashed ring, so an early morning's popup shows where the ✓ will come */
  .ok.todo {
    box-sizing: border-box; padding: 0; background: none;
    border: 1.5px dashed color-mix(in srgb, var(--plate-ink) 28%, transparent);
  }
  /* がんばり paid: a yuzu seal, a bolder ink-lipped edge, its ベル (+2) in ink: shape, number and colour each tell it
     from the round green ✓ */
  .ok.star { position: relative; width: 28px; height: 28px; padding: 0; background: none; border-radius: 0; }
  .star svg { position: absolute; inset: 0; width: 100%; height: 100%; fill: var(--c-yuzu); stroke: var(--c-yuzu-lip); stroke-width: 1.6; stroke-linejoin: round; }
  .star .bn { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font: 800 var(--fs-s)/1 var(--font-num); color: var(--c-ink); letter-spacing: -.04em; }
  /* the three rows: one grid (each row a subgrid of it), its own 3 × 3 (not the 2 × 2's edges), even 12px side margins inside the popup's padding; three equal columns
     of a label track (13px bold, soft ink, right-aligned against its status) and a status track (the goals' ring / ✓ at
     18px, a P · F · C bar, grams or 「あと Ng」 in the same type), so every status of a column starts on one line; spacers ≥ 8px between
     the columns; every row a 44px box with the cells' padding, 4px apart */
  /* (a status track at least 25px: a one-character label's 19 and it make a check's 44px box) */
  .rows { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); column-gap: 8px; row-gap: 4px; margin: 4px 12px 0; width: 0; min-width: calc(100% - 24px); /* (the 2 × 2 sizes the popup, not the widest item × 3) */ }
  .row {
    grid-column: 1 / -1; display: grid; grid-template-columns: subgrid; align-items: center; min-height: var(--hit); padding: 0;
    position: relative; appearance: none; margin: 0; border: 0; background: none; color: inherit; font: inherit; text-align: left;
    border-radius: var(--r-chip); -webkit-tap-highlight-color: transparent; touch-action: manipulation;
  }
  .row.tap { cursor: pointer; }
  .row.tap:active { background: color-mix(in srgb, var(--plate-ink) 8%, transparent); }
  .row.tap:focus-visible, .it.tap:focus-visible { outline: 3px solid var(--focus); outline-offset: -2px; }
  .it {
    position: relative; appearance: none; margin: 0; padding: 0; border: 0; background: none; color: inherit; font: inherit; text-align: left;
    display: grid; grid-template-columns: auto auto; justify-content: center; column-gap: 6px; align-items: center; min-width: var(--hit); min-height: var(--hit);
    -webkit-tap-highlight-color: transparent; touch-action: manipulation;
  }
  /* a bar over its 「あと Ng」, so a P item fits a third of the row */
  .v { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  /* line 2 of a P · F · C cell: one 18px line (the ✓'s height), so the bars and the statuses each sit on one y across P, F, C */
  .st { display: flex; align-items: center; justify-content: center; height: 18px; }
  /* my checks: each its own box, its column's width (≥ 44px, ≥ 8px from the next: the spacer) */
  button.it { border-radius: var(--r-chip); cursor: pointer; }
  .it.tap:active .mk { transform: scale(.88); }
  .lb { justify-self: center; font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--c-ink-soft); }
  /* (P · F · C's letter on its status line, the bar above them: not floating between the bar and the grams) */
  .it[data-pfc] { align-content: center; align-items: end; }
  .it[data-pfc] .lb { line-height: 18px; }
  .mk { position: relative; justify-self: center; line-height: 0; transition: transform 120ms var(--ease-soft); }
  .mk .ok { width: 18px; height: 18px; padding: 3px; }
  .it[data-done] .lb, .it[data-logged] .lb { color: var(--c-leaf-text); }
  /* P · F · C: 0 to 150 % of the goal, the goal a tick at two thirds: soft ink while under, leaf once met, coral past a
     ceiling (the plate is cream at every time of day, so its own inks) */
  .g, .left { flex: none; font: 700 var(--fs-s)/1 var(--font-num); color: var(--plate-ink); }
  .g { color: var(--c-ink-soft); }
  .left svg { display: block; width: 18px; height: 18px; padding: 3px; border-radius: 50%; background: var(--c-leaf); color: var(--c-ink); }
  .tr { position: relative; flex: none; width: 36px; height: 7px; border-radius: 4px; background: color-mix(in srgb, var(--plate-ink) 14%, transparent); }
  /* no goal: an empty dotted track, no fill and no tick, so the bars still line up without implying a goal */
  .tr.empty { background: none; border: 1.5px dotted color-mix(in srgb, var(--plate-ink) 35%, transparent); box-sizing: border-box; }
  .fl { position: absolute; left: 0; top: 0; bottom: 0; border-radius: inherit; background: color-mix(in srgb, var(--plate-ink) 45%, transparent); }
  .it[data-state='met'] .fl { background: var(--c-leaf); }
  .it[data-state='over'] .fl { background: var(--c-coral); }
  .it[data-state='over'] .lb { color: var(--c-coral-text); }
  .tk { position: absolute; left: calc(200% / 3); top: -3px; bottom: -3px; width: 2px; margin-left: -1px; border-radius: 1px; background: var(--plate-ink); }
  /* when the data last arrived: on the plate after the name, lighter; the plate is yuzu at every time of day, so the
     ink's (≥ 7:1 on it), never the theme's soft text */
  .nm { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .sync { flex: none; display: inline-flex; align-items: center; gap: 4px; font: 500 13px/1.2 var(--font-ui); color: var(--c-ink); }
  .sync.late::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--c-ink); opacity: .55; }
  /* short screens: tighter, so the popup covers less of the canopy when the sky is short (keepInside); the boxes stay 44px */
  /* narrow stages (320): 20px narrower, so the popup leaves the other tree's middle tappable */
  @media (max-height: 700px) {
    .detail { padding: 14px 8px 6px; }
    .goals { column-gap: 12px; margin-bottom: 0; }
  }
  @media (max-width: 340px) {
    .detail { padding-inline: 4px; }
    .cell, .row { padding-inline: 0; }
    .goals { gap: 8px; }
    .ck { margin-left: -8px; }
    .cell { grid-template-columns: 20px calc(var(--hit) - 8px) auto; }
    .amt { margin-left: 0; }
    .tr { width: 28px; }
  }
</style>
