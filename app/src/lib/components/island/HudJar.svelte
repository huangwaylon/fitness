<script lang="ts">
  // The jar in the HUD, beside today's ribbon: one button (44px tall, the ribbon's height), a cream pill with the jar
  // rising out of its left end, the shared wallet and a leaf "go" dot: the doorway to the wallet (ごほうび) (Jar.svelte is
  // the one jar drawing). When new ベル arrive (a sync), they fly in (CoinFlow): for each person and goal met since this
  // phone last showed it (SCENE.bellsSeen, per day), a "+1" pops over that fruit under its tree on the island and three
  // coins hop up into the jar; the number counts up as they land and the jar squashes. Anything else that raises the
  // wallet (ふたりでぜんぶ's +2) rises with a "+N" pop under the jar. It all waits while a sheet or the harvest covers the
  // scene.
  //   <Hud …>{#snippet jar()}<HudJar {view} {covered} onjar={…} {later} />{/snippet}</Hud>
  import { untrack } from 'svelte';
  import { Tween } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import type { PersonId, RingBells, WeekView } from '#lib/types.ts';
  import { RING_FRUITS } from '#lib/config/rules.ts';
  import Fx from '../characters/Fx.svelte';
  import Jar from './Jar.svelte';
  import CoinFlow, { type Flight } from './CoinFlow.svelte';
  import { walletFill } from '../wallet/fill.ts';
  import { react } from '../motion/director.svelte.ts';
  import { localKV, readJson, SCENE, writeJson } from '#lib/sync/storage.ts';
  import { formatBells, formatNum, t } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { FRUIT_LEAN, FRUIT_SPOTS } from './scene.ts';
  import { GOAL_TREES } from './world.ts';
  import { live } from './camera.svelte.ts';

  interface Props {
    view: WeekView;
    /** A sheet or the harvest covers the scene: hold the coins until it is gone. */
    covered: boolean;
    /** Tapped (go to ごほうび), after a short look-at-the-jar beat. */
    onjar?: () => void;
    /** The page's timer (cleared with the page). */
    later: (fn: () => void, ms: number) => void;
  }
  let { view, covered, onjar, later }: Props = $props();

  /** At most this many flights at once (one per person × fruit is 8). */
  const MAX_FLIGHTS = 8;

  const target = $derived(view.wallet.balance);
  // svelte-ignore state_referenced_locally
  let jarBells = $state(target);
  let flights = $state<Flight[]>([]);
  /** The island's stage on screen (px) and the jar's mouth in stage units, measured when coins take off. */
  let stage = $state<{ left: number; top: number; width: number } | null>(null);
  let mouth = $state<[number, number]>([0, 0]);
  let gain = $state<{ bells: number; n: number } | null>(null);
  let squashEl: HTMLElement | undefined = $state();
  let artEl: HTMLElement | undefined = $state();
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

  /** The stage's box and the jar's mouth (the top of the glass, under the lid) in its units; false if either is gone. */
  function measure(): boolean {
    const st = document.querySelector<HTMLElement>('.if-scene .stage')?.getBoundingClientRect();
    const jar = artEl?.getBoundingClientRect();
    if (!st?.width || !jar?.width) return false;
    const k = 390 / st.width;
    stage = { left: st.left, top: st.top, width: st.width };
    mouth = [(jar.left + jar.width / 2 - st.left) * k, (jar.top + jar.height * 0.22 - st.top) * k];
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

  // Each change of the wallet (or of today's ring ベル) once nothing covers the scene: fly what's new, show the rest.
  $effect(() => {
    const to = target;
    void view.people.A.today.rings;
    void view.people.B.today.rings;
    if (covered) return;
    untrack(() => {
      const measured = measure();
      const fresh = newFlights();
      const motion = !fresh.length || measured;
      if (!motion || to <= jarBells) {
        jarBells = to;
        flights = [];
        return;
      }
      const flying = Math.min(to - jarBells, fresh.reduce((a, f) => a + f.bells, 0));
      const rest = to - jarBells - flying;
      flights = [...flights, ...fresh];
      // the first "+N" pops: the bells jingle once for the batch (each coin then clinks as it lands, CoinFlow)
      if (fresh.length) cue('bells-arrive');
      if (rest > 0) {
        later(() => {
          // two wallet changes within 450 ms each add their rest: never past the wallet as it is now
          jarBells = Math.min(target, jarBells + rest);
          gain = { bells: rest, n: (gain?.n ?? 0) + 1 };
        }, 450);
      }
      if (!fresh.length) return;
      // the number never ends below the wallet: whatever didn't land in 4 s is added anyway
      later(() => {
        if (flights.length) {
          flights = [];
          jarBells = target;
        }
      }, 4000 + fresh.length * 320);
    });
  });

  function land(id: number) {
    const f = flights.find((x) => x.id === id);
    if (!f) return;
    flights = flights.filter((x) => x.id !== id);
    jarBells = flights.length ? Math.min(target, jarBells + f.bells) : target;
    const el = squashEl;
    if (!el) return;
    el.classList.remove('catch');
    void el.offsetWidth; // restart the catch squash
    el.classList.add('catch');
  }

  // The coin stack is drawn full and slid down by (1 − fill), so a change animates.
  const fill = $derived(walletFill(jarBells));
  // svelte-ignore state_referenced_locally
  const plate = new Tween(jarBells, { duration: 900, easing: cubicOut });
  $effect(() => {
    plate.set(jarBells, { duration: 900 });
  });
  /** Press squash (pointer down), released with a springy overshoot. */
  let pressed = $state(false);

  /** Tap: squash (pointer down, 80ms), spring back, the villagers glance up at the jar (R18) during the zoom
   *  and, 90ms later (no dead wait), the route changes: the island zooms into the jar and ごほうび grows out of it
   *  (ui-state/jarTransition.ts). */
  function tap() {
    pressed = false;
    react('R18');
    later(() => onjar?.(), 90);
  }
</script>

<button type="button" class="hud-jar" class:pressed aria-label={t('island.jar', { bells: formatBells(target) })} data-sfx="self" onclick={tap}
  onpointerdown={() => (pressed = true)} onpointerup={() => (pressed = false)} onpointerleave={() => (pressed = false)} onpointercancel={() => (pressed = false)}>
  <span class="squash" bind:this={squashEl} onanimationend={() => squashEl?.classList.remove('catch')}>
    <span class="art" bind:this={artEl}><Jar {fill} width="100%" /></span>
  </span>
  <b class="money">{formatNum(plate.current)}</b><svg class="go" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" /><path d="M6.4 4.6 L11 8 L6.4 11.4 Z" /></svg>
  {#if gain}
    {#key gain.n}
      <span class="jargain" aria-hidden="true" onanimationend={(e) => e.animationName.endsWith('gain-rise') && (gain = null)}>
        <span class="fxa"><Fx kind="sparkles" spread="40px" /></span>
        <b class="money">{formatBells(gain.bells, { signed: true })}</b>
      </span>
    {/key}
  {/if}
</button>
{#if flights.length && stage}
  <!-- the coins fly over the island's stage (its own units), up out of it into the jar -->
  <div class="flow" style:left="{stage.left}px" style:top="{stage.top}px" style:width="{stage.width}px">
    <CoinFlow {flights} to={mouth} onland={land} />
  </div>
{/if}

<style>
  /* One cream pill, the ribbon's height and lip (its sibling in the HUD row): the jar rises out of its left end, then
     the wallet and the go dot. */
  .hud-jar {
    --jar-w: clamp(36px, calc(4.6 * var(--vh1)), 42px);
    position: relative; flex: none; display: inline-flex; align-items: center; gap: 4px; height: var(--hit); margin: 0;
    padding: 0 5px 0 calc(var(--jar-w) + 10px); appearance: none; border: 0; border-radius: var(--r-pill); cursor: pointer;
    background: var(--c-cream); color: var(--c-ink); box-shadow: 0 var(--lip-h) 0 var(--c-lip); font: inherit;
    -webkit-tap-highlight-color: transparent; touch-action: manipulation; pointer-events: auto;
    transition: transform 160ms var(--ease-soft), box-shadow 160ms var(--ease-soft);
  }
  .hud-jar.pressed { transform: translateY(2px); box-shadow: 0 1px 0 var(--c-lip); }
  .hud-jar:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  /* the jar stands on the pill's bottom inner edge, its lid above the pill's top */
  .squash {
    position: absolute; left: 6px; bottom: 4px; width: var(--jar-w); display: block; transform-origin: 50% 100%;
    transition: transform 220ms cubic-bezier(.34, 1.56, .64, 1);
  }
  .art { display: block; }
  .hud-jar.pressed .squash { transform: scale(.92); transition: transform 80ms var(--ease-squash); }
  /* a coin lands: a small catch squash */
  .squash:global(.catch) { animation: catch 260ms var(--ease-bounce); }
  @keyframes catch { 0%, 100% { transform: none; } 40% { transform: scale(1.06, .94); } }
  .hud-jar > b { font: 700 clamp(1.125rem, calc(2.3 * var(--vh1)), 1.375rem)/1 var(--font-num); letter-spacing: .02em; font-variant-numeric: tabular-nums; }
  .go { width: clamp(1.25rem, 6.4vw, 1.5rem); height: auto; aspect-ratio: 1; flex: none; }
  .go circle { fill: var(--c-leaf-lip); }
  .go path { fill: var(--c-cream); }
  .flow { position: fixed; z-index: var(--z-hud); aspect-ratio: 390 / 360; container-type: inline-size; pointer-events: none; }
  /* "+N" over the pill: it rises from under the jar and fades */
  .jargain {
    position: absolute; left: calc(6px + var(--jar-w) / 2); top: 100%; translate: -50% 4px; pointer-events: none; white-space: nowrap;
    animation: gain-rise 2.4s var(--ease-soft) both; will-change: transform, opacity;
  }
  .jargain b {
    display: block; padding: 2px 10px; border-radius: 999px; font: 700 15px/1.3 var(--font-num);
    background: var(--c-cream); color: var(--c-ink); box-shadow: 0 4px 0 var(--c-lip);
  }
  .jargain .fxa { position: absolute; left: 50%; top: 0; width: 0; height: 0; }
  @keyframes gain-rise {
    0% { opacity: 0; transform: translateY(-10px) scale(.6); } 14% { opacity: 1; transform: translateY(0) scale(1.08); }
    22% { transform: scale(1); } 78% { opacity: 1; transform: translateY(4px); } 100% { opacity: 0; transform: translateY(8px); }
  }
</style>
