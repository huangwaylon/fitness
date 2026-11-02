<script lang="ts">
  // Island care (docs/design.md "Island care"), after NH: weeds sprout on the lawn over the day (one every 30–60
  // minutes, the newest three); a tap pulls one (it pops out of the ground with a puff of earth). The rock by the hedge
  // answers a tap with a clonk (it jolts), 1 in 4 a sparkle, 1 in 8 a pill bug or a centipede crawls out from under it.
  // (Watering a flower and the next day's hybrid live with the flowers: SceneTaps, Flowers.) No ベル, no find.
  // The weeds derive from the Tokyo date (care.ts), so both phones see the same; a weed either of us pulls is gone on
  // both (the shared day's `pick`, first wins; docs/backend.md#shared-world), and the partner's pulls and rock taps play
  // here (their villager turns to it). The weeds stand on world.ts LAWN_SPOTS and the rock at world.ts ROCK, each a world node at its
  // foot. SceneTaps mounts this inside the stage and asks it about each tap after the finds (`tap`, client px).
  // Cheap: static art; one-shot Web Animations / CSS on a tap; the clock is the scene's minute tick.
  import { timers } from './timers.ts';
  import { islandSeed } from './devHooks.ts';
  import { su } from './scene.ts';
  import { useWorld } from './camera.svelte.ts';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { dayKey, jst, minuteNow } from '#lib/time/clock.ts';
  import { sceneSfx, shownNow } from './sceneTaps.ts';
  import { clearAt, guardsU, stageGeo } from './placement.ts';
  import { digSpots, findArt } from './beach.ts';
  import { ROCK, rockTap, weedsAt, type Weed } from './care.ts';
  import { take, takenOn } from './sceneDay.ts';
  import { partnerTurnTo, turnTo } from './avatar.ts';
  import { world as shared } from '#lib/store/world.svelte.ts';
  import { taken as takenBy, takenByOthers } from '#lib/sync/world-day.ts';
  import { onMount } from 'svelte';
  import { hitOf, hitSources, pick, type HitBox } from './hitbox.ts';

  interface Props {
    scene?: HTMLElement;
    enabled: () => boolean;
    /** A bug crawls out from under the rock (Critters; the rock's world x and z). */
    rockBug?: (x: number, z: number) => void;
  }
  let { scene, enabled, rockBug }: Props = $props();
  const w = useWorld();

  const seed = islandSeed();

  let pulled = $state(0);
  const clock = $derived(minuteNow());
  const date = $derived(dayKey(clock));
  const weeds = $derived.by<Weed[]>(() => {
    void pulled;
    const { hour, minute } = jst(clock);
    // what was taken today: by me (once my villager got there: this phone's own record) and by the partner (the shared day)
    const gone = date === dayKey() ? takenOn(date).union(takenByOthers(shared.day, shared.me)) : takenOn(date);
    const dug = new Set(digSpots(date, gone, seed).map((s) => `${s.x},${s.y}`));
    return weedsAt(date, (hour * 60 + minute) * 60_000, seed, dug).filter((w) => !gone.has(w.uid));
  });
  /** Only where this screen's controls leave room (measured when the camera settles, once the projector has placed
   *  everything; one off screen stays: it's checked once in view). The villagers walk about: they don't count. */
  let shown = $state<Weed[]>([]);
  $effect(() => {
    const list = weeds;
    void w.rest.z;
    void w.rest.vw;
    if (!w.rest.ready) return;
    let id = requestAnimationFrame(() => (id = requestAnimationFrame(() => {
      const g = stageGeo(scene);
      if (!g) return void (shown = []);
      // flat on the lawn: clear of the controls themselves (their 6px tap padding may run over a tuft)
      const keep = guardsU(g, -5 * g.k, (el) => !!el.closest('[data-actor]') || !shownNow(el));
      shown = list.filter((d) => {
        // anywhere it's drawn on screen, the horizon's sinking edge too (under the HUD on a short phone)
        const p = w.screenAt(d.x, d.y);
        if (!p.visible || p.sx < 0 || p.sx > w.view.vw || p.sy < 0 || p.sy > w.view.vh) return true;
        const k = w.scaleAt(d.x, d.y), [sx, sy] = w.screenU(d.x, d.y, 5);
        return clearAt(keep, sx, sy, 6 * k, 5 * k);
      });
    })));
    return () => cancelAnimationFrame(id);
  });

  /** A flourish at world (x, z = y), `lift` units up. */
  interface Fx { n: number; kind: 'pull' | 'spark' | 'strike'; x: number; y: number; lift?: number; flip?: boolean }
  let fx = $state<Fx[]>([]);
  let seq = 0;
  const { later, after, clear } = timers();
  function spawn(f: Omit<Fx, 'n'>, ms: number) {
    const n = ++seq;
    fx = [...fx.slice(-2), { ...f, n }];
    later(() => (fx = fx.filter((x) => x.n !== n)), ms);
  }
  $effect(() => clear);
  let rockEl = $state<HTMLElement>();
  // A weed that sprouts while the island is open pops up out of the lawn; the ones already there when it opens just stand.
  let opened = false;
  const seen = new Set<string>();
  const sprouts = (uid: string): boolean => {
    if (seen.has(uid)) return false;
    seen.add(uid);
    return opened;
  };
  $effect(() => {
    opened = true;
  });

  function pull(weed: Weed) {
    // first wins: claimed at the tap
    if (!shared.share({ kind: 'pick', id: weed.uid, what: 'weed', at: [Math.round(weed.x), Math.round(weed.y)] }).fresh) return;
    if ((takenBy(shared.day, weed.uid)?.who ?? shared.me) !== shared.me) return; // the partner pulled it first
    turnTo(weed.x);
    take(date, weed.uid);
    pulled++;
    sceneSfx('weed');
    spawn({ kind: 'pull', x: weed.x, y: weed.y, flip: weed.flip }, 700);
  }
  function hitRock() {
    const what = rockTap(Math.random);
    // the partner's phone: my villager strikes the rock too (a bug out from under it comes on its own: Critters)
    shared.share({ kind: 'act', act: 'rock', pt: [ROCK.x, ROCK.y] });
    turnTo(ROCK.x);
    strike(() => clonk(what));
  }
  /** A floating shovel comes down on the rock, then the clonk. */
  function strike(then: () => void) {
    spawn({ kind: 'strike', x: ROCK.x, y: ROCK.y, lift: ROCK.h * 0.5 }, 400);
    after(300, then);
  }
  function clonk(what: ReturnType<typeof rockTap>) {
    sceneSfx('clonk');
    // NH's tool strike on a rock: it squashes under the blow and bounces back
    rockEl?.animate([{ transform: 'none' }, { transform: 'scale(1.06, .94)', offset: 0.3 }, { transform: 'scale(.97, 1.04)', offset: 0.65 }, { transform: 'none' }], { duration: 280, easing: 'ease-out' });
    if (what === 'sparkle') {
      spawn({ kind: 'spark', x: ROCK.x + 6, y: ROCK.y, lift: ROCK.h }, 800);
      sceneSfx('glint');
    } else if (what === 'bug') rockBug?.(ROCK.x, ROCK.y);
  }

  // The partner's pulls and rock taps (the shared day's news): their villager turns to it and it plays where it is; the
  // weed is gone here already (the list re-derives), its puff of earth plays where it stood.
  onMount(() =>
    shared.on(({ e, live }) => {
      if (!live || !enabled()) return;
      if (e.kind === 'pick' && e.what === 'weed' && e.at) {
        const [x, z] = e.at;
        partnerTurnTo(x);
        sceneSfx('weed');
        spawn({ kind: 'pull', x, y: z }, 700);
      } else if (e.kind === 'act' && e.act === 'rock') {
        partnerTurnTo(ROCK.x);
        strike(() => clonk('clonk'));
      }
    })
  );

  /** The weeds in view and the rock with their tap boxes (hitbox.ts: what each draws, at least 44px). */
  function targets(): { box: HitBox | null; z: number; kind: string; go: () => void }[] {
    const el = (sel: string, x: number, z: number) => (w.inView(x, z, 20) ? hitOf(scene?.querySelector(sel)) : null);
    return [
      ...shown.map((it) => ({ box: el(`[data-care="weed"][data-uid="${it.uid}"]`, it.x, it.y), z: it.y, kind: 'weed', go: () => pull(it) })),
      { box: el('[data-care="rock"]', ROCK.x, ROCK.y), z: ROCK.y, kind: 'rock', go: hitRock }
    ];
  }
  $effect(() => {
    const list = () => targets().flatMap((t) => (t.box ? [{ box: t.box, kind: t.kind }] : []));
    hitSources.add(list);
    return () => void hitSources.delete(list);
  });
  /** A tap on the scene (client px), after the finds: true when the care took it (on its tap box; in front wins). */
  export function tap(px: number, py: number): boolean {
    if (!enabled()) return false;
    const best = pick(targets(), px, py);
    if (!best) return false;
    best.go();
    return true;
  }
</script>

<!-- each a world node at its foot (the anchor: a 0 × 0 point there) -->
<div class="node" aria-hidden="true" {@attach w.at({ x: ROCK.x, z: ROCK.y, h: ROCK.h })}>
  <span class="item rock" data-care="rock">
    <span bind:this={rockEl}><OfficialArt key={findArt('rock')} size={su(ROCK.h)} /></span>
  </span>
</div>
{#each shown as d (d.uid)}
  <div class="node" aria-hidden="true" {@attach w.at({ x: d.x, z: d.y, h: 14 })}>
    <span class="item weed" class:flip={d.flip} class:sprout={sprouts(d.uid)} data-care="weed" data-uid={d.uid}><i class="shade"></i>{@render tuft()}</span>
  </div>
{/each}
{#each fx as f (f.n)}
  <div class="node" aria-hidden="true" {@attach w.at({ x: f.x, z: f.y, lift: f.lift ?? 0, h: 30, dz: -2 })}>
    <span class="item fx-{f.kind}" class:flip={f.flip}>
      {#if f.kind === 'strike'}
        <span class="strike"><OfficialArt key={findArt('shovel')} size={su(26)} eager /></span>
      {:else if f.kind === 'pull'}
        <span class="up">{@render tuft()}</span>
        <i class="clod" style:--dx="-1"></i><i class="clod" style:--dx="1"></i>
      {:else}
        <svg class="glint" viewBox="0 0 24 24"><path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z" /></svg>
      {/if}
    </span>
  </div>
{/each}

<!-- NH's weeds: a chunky, rounded clump about half a tile wide: five broad blades in front (a light highlight down
     each), a darker clump behind -->
{#snippet tuft()}
  <svg viewBox="-10 -13 20 14"><path class="back" d="M-6 0 C-8 -4 -9 -7 -8.5 -9 C-6 -7 -4.5 -4 -3.5 0 Z M3.5 0 C4.5 -4 6 -7 8.5 -9 C9 -7 8 -4 6 0 Z M-2 0 C-2.5 -4 -2 -8 -1 -11 C.5 -8 1 -4 1.5 0 Z" />
    <path class="front" d="M-7 0 C-8 -3 -8 -5.5 -7 -7.5 C-5 -5.5 -3.8 -3 -3.5 0 Z M-4 0 C-4.8 -4 -4.5 -7.5 -3 -10 C-1.4 -7.5 -1 -4 -1 0 Z M-1.2 0 C-1.4 -4.5 -.6 -9 1 -12 C2.4 -9 2.6 -4.5 1.6 0 Z M1.4 0 C1.6 -4 2.6 -7 4.6 -9 C5.4 -6.5 5 -3.5 4 0 Z M3.8 0 C4.4 -3 5.6 -5 7.6 -6.4 C7.8 -4 7.2 -2 6.6 0 Z" />
    <path class="hi" d="M-5.6 -1.5 C-6 -3 -6.2 -4.4 -6.6 -5.6 M-2.6 -1.5 C-2.8 -4 -3 -6 -3 -8 M.4 -1.5 C.4 -4.5 .6 -7.5 1 -10 M3.2 -1.5 C3.4 -3.6 3.8 -5.6 4.4 -7.2" />
    <path class="base" d="M-7.5 0 C-4 1 4 1 7.5 0 Z" /></svg>
{/snippet}

<style>
  /* a world node: on the lawn among everything else by depth */
  .node { width: 0; height: 0; pointer-events: none; }
  .item { position: absolute; left: 0; top: 0; width: 0; height: 0; }
  .item > * { position: absolute; left: 0; top: 0; line-height: 0; }
  .rock > :global(*) { translate: -50% -92%; transform-origin: 50% 100%; filter: var(--leaf-tint,) drop-shadow(0 2px 1px rgba(60, 70, 40, .3)); }
  .rock :global(.official) { max-width: none; }
  .weed svg, .up svg { width: calc(24 * var(--su)); translate: -50% -92%; overflow: visible; }
  .flip svg { scale: -1 1; }
  .front { fill: #4DB04A; } .back { fill: #2F7F36; } .base { fill: #2F7F36; }
  .hi { fill: none; stroke: #8FD66A; stroke-width: .9; stroke-linecap: round; }
  /* its contact shadow on the lawn */
  .shade { display: block; width: calc(14 * var(--su)); height: calc(3 * var(--su)); translate: -50% -60%; border-radius: 50%; background: rgba(60, 70, 30, .25); }
  /* sprouting while the island is open: it pops up out of the lawn once */
  .weed.sprout svg { transform-origin: 50% 100%; animation: sprout 420ms cubic-bezier(.34, 1.56, .64, 1) both; }
  @keyframes sprout { from { transform: scale(0); } 70% { transform: scale(1.15); } to { transform: none; } }
  /* the rock: the shovel comes down on it */
  .strike { translate: -20% -95%; transform-origin: 30% 100%; animation: strike .3s cubic-bezier(.4, 0, .7, 1) both; }
  @keyframes strike { 0% { transform: rotate(-45deg) translateY(-6px); opacity: 0; } 20% { opacity: 1; } 75% { transform: rotate(6deg); opacity: 1; } 100% { transform: rotate(0); opacity: 0; } }
  /* pulled: the tuft pops up and tumbles away, two clods of earth fly */
  .up { animation: pull .65s cubic-bezier(.3, .7, .4, 1) both; }
  @keyframes pull {
    0% { transform: translate(0, 0) rotate(0); } 30% { transform: translate(0, calc(-12 * var(--su))) rotate(-10deg); opacity: 1; }
    100% { transform: translate(calc(10 * var(--su)), calc(-4 * var(--su))) rotate(70deg); opacity: 0; }
  }
  .clod {
    display: block; width: calc(3.5 * var(--su)); height: calc(3 * var(--su)); border-radius: 50%; background: #8A6238;
    animation: clod .5s cubic-bezier(.3, .8, .6, 1) both;
  }
  @keyframes clod {
    0% { transform: translate(0, 0); opacity: 0; } 15% { opacity: 1; }
    50% { transform: translate(calc(var(--dx) * 6 * var(--su)), calc(-8 * var(--su))); }
    100% { transform: translate(calc(var(--dx) * 10 * var(--su)), calc(1 * var(--su))); opacity: 0; }
  }
  .glint { width: calc(11 * var(--su)); translate: -50% -50%; fill: #FFF8D8; overflow: visible; animation: twinkle .75s ease-out both; }
  @keyframes twinkle {
    0% { transform: scale(0) rotate(0); opacity: 0; } 35% { transform: scale(1.1) rotate(45deg); opacity: 1; }
    100% { transform: scale(0) rotate(90deg); opacity: 0; }
  }
</style>
