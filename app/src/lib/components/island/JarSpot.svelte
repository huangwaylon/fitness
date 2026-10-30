<script lang="ts">
  // The island's jar + its ベル nameplate: one button (≥ 64px), the doorway to ふたりの壺 (v5 §5; Jar.svelte is the one jar
  // drawing). The plate shows both pots together (おやつ + 旅). When new ベル arrive (a sync, a check-in), they fly
  // in (CoinFlow): for each person and fruit that earned more than this phone last showed (SCENE.bellsSeen, per day),
  // a "+N" pops over that fruit under its tree and three coins hop into the jar; the plate counts up as they land and
  // the jar squashes. Anything else that raises the pots (the Sunday bonus) rises with a "+N" pop over the jar.
  // It all waits while a sheet or the harvest covers the scene. Reduced motion: no flight, the plate just changes.
  import { untrack } from 'svelte';
  import { Tween } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import type { FruitBells, PersonId, WeekView } from '#lib/types.ts';
  import { FRUITS } from '#lib/config/rules.ts';
  import Fx from '../characters/Fx.svelte';
  import Jar from './Jar.svelte';
  import CoinFlow, { type Flight } from './CoinFlow.svelte';
  import { potFill } from '../pots/flow.ts';
  import { react } from '../motion/director.svelte.ts';
  import { reducedMotion } from '../../time/clock.ts';
  import { localKV, readJson, SCENE, writeJson } from '#lib/sync/storage.ts';
  import { formatBells, t } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { FRUIT_SPOTS, JAR, TREE, u } from './scene.ts';

  interface Props {
    view: WeekView;
    /** Interactive (false for gallery thumbnails). */
    live: boolean;
    /** A sheet or the harvest covers the scene: hold the coins until it is gone. */
    covered: boolean;
    /** Tapped (go to ふたりの壺), after a short look-at-the-jar beat. */
    onjar?: () => void;
    /** The scene's timer (cleared with the scene). */
    later: (fn: () => void, ms: number) => void;
  }
  let { view, live, covered, onjar, later }: Props = $props();

  /** Jar art: JAR.w wide (viewBox 54 × 68); the button's top sits that far above the base. */
  const JAR_H = (JAR.w * 68) / 54;
  const MOUTH: [number, number] = [JAR.x, JAR.base - JAR_H + 10];
  /** At most this many flights at once (one per person × fruit is 8). */
  const MAX_FLIGHTS = 8;

  const target = $derived(view.pots.treat.balance + view.pots.trip.balance);
  // svelte-ignore state_referenced_locally
  let jarBells = $state(target);
  let flights = $state<Flight[]>([]);
  let gain = $state<{ bells: number; n: number } | null>(null);
  let squashEl: HTMLElement | undefined = $state();
  let flightN = 0;

  type Seen = { date: string; parts: Record<PersonId, FruitBells> };
  const zero = (): FruitBells => ({ peach: 0, coconut: 0, apple: 0, pear: 0 });
  const slotX = (p: PersonId) => TREE.x[p === view.me ? 'A' : 'B'];

  /** New earnings since this phone last showed them → flights (and the seen marks move up to now). */
  function newFlights(): Flight[] {
    const kv = localKV();
    const seen = readJson<Seen>(kv, SCENE.bellsSeen);
    const base = seen && seen.date === view.today ? seen.parts : { A: zero(), B: zero() };
    const now: Record<PersonId, FruitBells> = { A: { ...view.people.A.today.parts }, B: { ...view.people.B.today.parts } };
    writeJson(kv, SCENE.bellsSeen, { date: view.today, parts: now } satisfies Seen);
    const out: Flight[] = [];
    for (const p of [view.me, view.partner]) {
      FRUITS.forEach((f, i) => {
        const d = now[p][f] - (base[p]?.[f] ?? 0);
        if (d > 0 && out.length < MAX_FLIGHTS) {
          out.push({ id: ++flightN, from: [slotX(p) + FRUIT_SPOTS[i][0], TREE.base + FRUIT_SPOTS[i][1]], bells: d, delay: out.length * 320 });
        }
      });
    }
    return out;
  }

  // Each change of the pots (or of today's parts) once nothing covers the scene: fly what's new, show the rest.
  $effect(() => {
    const to = target;
    void view.people.A.today.parts;
    void view.people.B.today.parts;
    if (covered) return;
    untrack(() => {
      const motion = live && !reducedMotion();
      const fresh = live ? newFlights() : [];
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
          jarBells += rest;
          gain = { bells: rest, n: (gain?.n ?? 0) + 1 };
        }, 450);
      }
      if (!fresh.length) return;
      // the plate never ends below the pots: whatever didn't land in 4 s is added anyway
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
  const fill = $derived(potFill(jarBells));
  // svelte-ignore state_referenced_locally
  const plate = new Tween(jarBells, { duration: 900, easing: cubicOut });
  $effect(() => {
    plate.set(jarBells, { duration: live && !reducedMotion() ? 900 : 0 });
  });
  /** Press squash on the jar (pointer down), released with a springy overshoot. */
  let pressed = $state(false);

  /** Tap: squash (pointer down, 80ms), spring back, the villagers glance at the jar (R18) during the morph
   *  and, 90ms later (no dead wait), the route changes: the page zooms about the jar (ui-state/jarTransition.ts)
   *  and this jar morphs into the ふたりの壺 hero jar (<Jar name="jar">). */
  function tap() {
    pressed = false;
    if (live && !reducedMotion()) {
      react('R18');
      later(() => onjar?.(), 90);
    } else onjar?.();
  }
</script>

<button type="button" class="jar" class:pressed style:left={u(JAR.x)} style:top={u(JAR.base - JAR_H)} disabled={!live}
  aria-label={t('island.jar', { bells: formatBells(target) })} onclick={tap}
  onpointerdown={() => live && (pressed = true)} onpointerup={() => (pressed = false)} onpointerleave={() => (pressed = false)} onpointercancel={() => (pressed = false)}>
  <span class="squash" bind:this={squashEl} onanimationend={() => squashEl?.classList.remove('catch')}><Jar {fill} width={u(JAR.w)} name={live ? 'jar' : undefined} /></span>
  <span class="jar-plate"><b class="money">{formatBells(plate.current)}</b><svg class="go" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" /><path d="M6.4 4.6 L11 8 L6.4 11.4 Z" /></svg></span>
</button>
{#if flights.length}<CoinFlow {flights} to={MOUTH} onland={land} />{/if}
{#if gain}
  {#key gain.n}
    <span class="jargain" style:left={u(JAR.x)} style:top={u(JAR.base - JAR_H - 4)} aria-hidden="true"
      onanimationend={(e) => e.animationName.endsWith('gain-rise') && (gain = null)}>
      <span class="fxa"><Fx kind="sparkles" spread={u(46)} /></span>
      <b class="money">{formatBells(gain.bells, { signed: true })}</b>
    </span>
  {/key}
{/if}

<style>
  /* jar + plate: one button (≥ 64px), anchored at the jar's base; the plate hangs just below it */
  .jar {
    /* above the time-of-day tint: the jar and its plate stay game-object bright (v5 §5) */
    position: absolute; z-index: 81; translate: -50% 0; display: flex; flex-direction: column; align-items: center;
    min-width: 64px; min-height: 64px; padding: 0 6px; margin: 0; appearance: none; background: none; border: 0;
    border-radius: 24px; cursor: pointer; color: inherit; -webkit-tap-highlight-color: transparent; touch-action: manipulation;
  }
  .jar:disabled { cursor: default; }
  /* press squash from the base, released with a springy overshoot (mobile-game feel) */
  .squash { display: block; transform-origin: 50% 100%; transition: transform 220ms cubic-bezier(.34, 1.56, .64, 1); }
  .jar.pressed .squash { transform: scale(.92); transition: transform 80ms var(--ease-squash); }
  /* a coin lands: a small catch squash */
  .squash:global(.catch) { animation: catch 260ms var(--ease-bounce); }
  @keyframes catch { 0%, 100% { transform: none; } 40% { transform: scale(1.06, .94); } }
  .jar.pressed .jar-plate { transform: translateY(2px); box-shadow: 0 1px 0 var(--plate-lip); }
  /* the ベル nameplate: the scene's only label (v5 §3), cream pill with a 4px lip and a leaf "go" dot */
  .jar-plate {
    display: inline-flex; align-items: center; gap: 4px; margin-top: -2px; padding: 3px 4px 3px 10px; border-radius: var(--r-pill);
    background: var(--plate); color: var(--plate-ink); box-shadow: 0 4px 0 var(--plate-lip); white-space: nowrap;
    transition: transform 160ms var(--ease-soft), box-shadow 160ms var(--ease-soft); font-variant-numeric: tabular-nums;
    /* a game object on the stage: sized in stage units (14u), 13–16px (sizing #6, T5) */
    font-size: clamp(13px, calc(14 * 100cqw / 390), 16px);
  }
  .jar-plate b { font: 700 1em/1.25 var(--font-num); letter-spacing: .02em; }
  .go { width: 1.2em; height: 1.2em; flex: none; }
  .go circle { fill: var(--c-leaf-lip); }
  .go path { fill: var(--c-cream); }
  .jargain {
    position: absolute; z-index: 92; translate: -50% -100%; pointer-events: none; white-space: nowrap;
    animation: gain-rise 2.4s var(--ease-soft) both; will-change: transform, opacity;
  }
  .jargain b {
    display: block; padding: 2px 10px; border-radius: 999px; font: 700 15px/1.3 var(--font-num);
    background: var(--plate); color: var(--plate-ink); box-shadow: 0 4px 0 var(--plate-lip);
  }
  .jargain .fxa { position: absolute; left: 50%; top: 100%; width: 0; height: 0; }
  @keyframes gain-rise {
    0% { opacity: 0; transform: translateY(10px) scale(.6); } 14% { opacity: 1; transform: translateY(0) scale(1.08); }
    22% { transform: scale(1); } 78% { opacity: 1; transform: translateY(-8px); } 100% { opacity: 0; transform: translateY(-14px); }
  }
  @media (prefers-reduced-motion: reduce) { .squash, .jar-plate { transition: none; } .jar.pressed .squash, .squash:global(.catch) { transform: none; animation: none; } }

  .jar:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
</style>
