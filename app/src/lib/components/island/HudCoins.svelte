<script lang="ts">
  // Today's new ベル flying into the HUD's ribbon (「きょう +6 ベル」, the day's total for both of us): when a sync
  // brings goals met since this phone last showed them (SCENE.bellsSeen, per day), a "+1" pops over that fruit under
  // its tree on the island and three coins hop up into the ribbon (CoinFlow); its number squashes as each flight
  // lands (the count-up is Hud's). It all waits while a sheet, the panel or the harvest covers the scene.
  //   <HudCoins {view} {covered} {later} />
  import { untrack } from 'svelte';
  import type { PersonId, RingBells, WeekView } from '#lib/types.ts';
  import { RING_FRUITS } from '#lib/config/rules.ts';
  import CoinFlow, { type Flight } from './CoinFlow.svelte';
  import { localKV, readJson, SCENE, writeJson } from '#lib/sync/storage.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { FRUIT_LEAN, FRUIT_SPOTS } from './scene.ts';
  import { GOAL_TREES } from './world.ts';
  import { live } from './camera.svelte.ts';

  interface Props {
    view: WeekView;
    /** A sheet or the harvest covers the scene: hold the coins until it is gone. */
    covered: boolean;
    /** The page's timer (cleared with the page). */
    later: (fn: () => void, ms: number) => void;
  }
  let { view, covered, later }: Props = $props();

  /** At most this many flights at once (one per person × fruit is 8). */
  const MAX_FLIGHTS = 8;

  let flights = $state<Flight[]>([]);
  /** The island's stage on screen (px) and the ribbon's middle in stage units, measured when coins take off. */
  let stage = $state<{ left: number; top: number; width: number } | null>(null);
  let mouth = $state<[number, number]>([0, 0]);
  let flightN = 0;

  type Seen = { date: string; parts: Record<PersonId, Partial<RingBells>> };
  const zero = (): Partial<RingBells> => ({});
  /** Where a person's fallen fruit lies (world units: the tree's trunk, the row leaning out from the island's middle
   *  like FruitTree's), on screen in stage units; off screen (the camera elsewhere) the coins rise from the screen's
   *  foot under it. */
  const fruitAt = (p: PersonId, i: number): [number, number] => {
    const [tx, tz] = GOAL_TREES[p];
    const x = tx + (tx < 195 ? -FRUIT_LEAN : FRUIT_LEAN) + FRUIT_SPOTS[i][0], z = tz + FRUIT_SPOTS[i][1];
    const w = live(), k = stage ? 390 / stage.width : 1;
    if (!w) return [x, 600];
    const [sx, sy] = w.screenU(x, z);
    return [sx, Math.min(sy, w.view.vh * k)];
  };

  const ribbon = () => document.querySelector<HTMLElement>('.ribbon-wrap .ribbon');

  /** The stage's box and the ribbon's number in its units; false if either is gone. */
  function measure(): boolean {
    const st = document.querySelector<HTMLElement>('.if-scene .stage')?.getBoundingClientRect();
    const rb = ribbon()?.querySelector('b')?.getBoundingClientRect();
    if (!st?.width || !rb?.width) return false;
    const k = 390 / st.width;
    stage = { left: st.left, top: st.top, width: st.width };
    mouth = [(rb.left + rb.width / 2 - st.left) * k, (rb.top + rb.height / 2 - st.top) * k];
    return true;
  }

  /** New earnings since this phone last showed them → flights (and the seen marks move up to now). */
  function newFlights(): Flight[] {
    const kv = localKV();
    const seen = readJson<Seen>(kv, SCENE.bellsSeen);
    const base = seen && seen.date === view.today ? seen.parts : { A: zero(), B: zero() };
    const now: Record<PersonId, RingBells> = { A: { ...view.people.A.today.rings }, B: { ...view.people.B.today.rings } };
    writeJson(kv, SCENE.bellsSeen, { date: view.today, parts: now } satisfies Seen);
    const out: Flight[] = [];
    for (const p of [view.me, view.partner]) {
      RING_FRUITS.forEach((f, i) => {
        const d = now[p][f] - (base[p]?.[f] ?? 0);
        if (d > 0 && out.length < MAX_FLIGHTS) {
          out.push({ id: ++flightN, from: fruitAt(p, i), bells: d, delay: out.length * 320 });
        }
      });
    }
    return out;
  }

  // Each change of today's ring ベル once nothing covers the scene: fly what's new.
  $effect(() => {
    void view.people.A.today.rings;
    void view.people.B.today.rings;
    if (covered) return;
    untrack(() => {
      const measured = measure();
      const fresh = newFlights();
      if (!fresh.length || !measured) return;
      flights = [...flights, ...fresh];
      // the first "+N" pops: the bells jingle once for the batch (each coin then clinks as it lands, CoinFlow)
      cue('bells-arrive');
      // whatever didn't land in 4 s is let go
      later(() => (flights = []), 4000 + fresh.length * 320);
    });
  });

  function land(id: number) {
    flights = flights.filter((x) => x.id !== id);
    const el = ribbon()?.querySelector('b');
    if (!el) return;
    el.classList.remove('catch');
    void el.offsetWidth; // restart the catch squash
    el.classList.add('catch');
    el.addEventListener('animationend', () => el.classList.remove('catch'), { once: true });
  }
</script>

{#if flights.length && stage}
  <!-- the coins fly over the island's stage (its own units), up out of it into the ribbon -->
  <div class="flow" style:left="{stage.left}px" style:top="{stage.top}px" style:width="{stage.width}px">
    <CoinFlow {flights} to={mouth} onland={land} />
  </div>
{/if}

<style>
  .flow { position: fixed; z-index: var(--z-hud); aspect-ratio: 390 / 360; container-type: inline-size; pointer-events: none; }
</style>
