<script lang="ts">
  // The tent's inside (docs/design.md "The tent"): NH's largest room in 3D, behind its door on the island. The room
  // (engine.ts, three.js) comes in its own chunk once the screen opens; until its first frame the door's black covers
  // it (ui-state/doorTransition.ts). A tap on the floor walks my villager there (round the furniture); a tap on a piece
  // of furniture acts where I stand (my villager turns to it, it jiggles, a lamp turns on or off); the doormat or
  // ‹ しまへ goes back out. Nothing gives ベル.
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import NavButton from '../ui/NavButton.svelte';
  import type { WeekView } from '#lib/types.ts';
  import { t } from '#lib/i18n/index.ts';
  import { art, artUrl, villagerArt } from '#lib/art.ts';
  import { resolveLook } from '#lib/villagers/look.ts';
  import { theme } from '#lib/ui-state/theme.svelte.ts';
  import { doorReady, provideDoor } from '#lib/ui-state/doorTransition.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { DEFAULT_FLOOR, DEFAULT_WALL, ITEMS } from './items.ts';
  import { DOOR_IN, HALF, walkPath, type Spot } from './grid.ts';
  import type { Look, Tent, Who } from './engine.ts';

  let { view }: { view: WeekView } = $props();

  let canvas = $state<HTMLCanvasElement>();
  let tent: Tent | null = null;
  let failed = $state(false);
  const me = $derived(view.me);

  /** What stands in the room (phase 1: nothing yet). */
  const spots: Spot[] = [];

  function lookOf(who: Who): Look | null {
    const p = view.people[who];
    const l = resolveLook({ villager: p.villager, person: who });
    const key = villagerArt(l.id);
    const a = art(key), url = artUrl(key);
    return a && url ? { url, aspect: a.w / a.h, looksRight: l.looksRight, noMirror: l.noMirror } : null;
  }
  const nightOf = (tod: string) => (tod === 'night' ? 1 : tod === 'dusk' ? 0.55 : tod === 'dawn' ? 0.3 : 0);

  // ---- taps: a short press that didn't move ----
  let down: { x: number; y: number; t: number; id: number } | null = null;
  function onDown(e: PointerEvent) {
    down = { x: e.clientX, y: e.clientY, t: Date.now(), id: e.pointerId };
  }
  function onUp(e: PointerEvent) {
    const d = down;
    down = null;
    if (!d || d.id !== e.pointerId || Date.now() - d.t > 700 || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 12) return;
    tap(e.clientX, e.clientY);
  }
  function tap(cx: number, cy: number) {
    if (!tent) return;
    const h = tent.hit(cx, cy);
    if (!h) return;
    if (h.kind === 'door') return leave();
    if (h.kind === 'villager') {
      tent.hop(h.who);
      cue('villager-tap');
      return;
    }
    if (h.kind === 'piece') {
      // in place: my villager turns to it, it answers where it stands
      const at = centreOfPiece(h.id);
      if (at) tent.face(me, at);
      tent.bump(h.id);
      if (tent.toggle(h.id)) cue('toggle-on');
      else cue('scene-decor');
      return;
    }
    walkTo([h.x, h.z]);
  }
  function centreOfPiece(_id: string): [number, number] | null {
    return null;
  }
  function walkTo(to: [number, number]) {
    if (!tent) return;
    const from = tent.at(me);
    if (!from) return;
    const pts = walkPath(spots, from, to);
    if (pts.length) tent.walk(me, pts);
  }

  function leave() {
    cue('scene-bench');
    void goto(resolve('/') + location.search);
  }

  onMount(() => {
    let alive = true;
    const offDoor = provideDoor(() => (tent ? (([x, y]) => ({ x, y }))(tent.client(0, 0, HALF - 2)) : null));
    void import('./engine.ts').then(
      ({ createTent }) => {
        if (!alive || !canvas) return;
        tent = createTent(canvas);
        tent.resize(insets());
        tent.surfaces(DEFAULT_WALL, DEFAULT_FLOOR);
        tent.night(nightOf(theme.tod));
        for (const who of ['A', 'B'] as const) if (who === me) tent.villager(who, lookOf(who));
        // in at the door, a few steps into the room
        tent.put(me, DOOR_IN, me === 'A' ? 1 : -1);
        tent.walk(me, [[me === 'A' ? -7 : 7, 22]]);
        void tent.ready.then(() => alive && doorReady());
        hooks();
      },
      () => {
        failed = true;
        doorReady();
      }
    );
    const ro = new ResizeObserver(() => tent?.resize(insets()));
    if (canvas) ro.observe(canvas);
    return () => {
      alive = false;
      ro.disconnect();
      offDoor();
      tent?.dispose();
      tent = null;
      delete (window as unknown as { __tent?: unknown }).__tent;
    };
  });
  $effect(() => tent?.night(nightOf(theme.tod)));

  let top = $state<HTMLElement>();
  let foot = $state<HTMLElement>();
  /** What covers the canvas at its top (the back button) and foot (the controls): the room fits between. */
  function insets() {
    const r = canvas?.getBoundingClientRect();
    if (!r) return { top: 0, bottom: 0 };
    const tb = top?.getBoundingClientRect(), fb = foot?.getBoundingClientRect();
    return { top: tb ? Math.max(0, tb.bottom - r.top) : 0, bottom: fb ? Math.max(0, r.bottom - fb.top) : 0 };
  }

  /** The e2e's and the console's hooks (dev builds and ?demo). */
  function hooks() {
    if (!import.meta.env.DEV && !new URLSearchParams(location.search).has('demo')) return;
    (window as unknown as { __tent?: unknown }).__tent = {
      stats: () => tent?.stats(),
      loading: () => tent?.loading() ?? 0,
      mine: () => tent?.at(me),
      at: (who: Who) => tent?.at(who),
      walking: (who: Who) => tent?.walking(who),
      /** A model point's client px. */
      px: (x: number, z: number, y = 0) => tent?.client(x, y, z),
      items: () => Object.keys(ITEMS).length,
      /** Stand these pieces in the room (a look at the models). */
      show: (list: { id: string; item: string; x: number; z: number; f: 0 | 1 | 2 | 3 }[]) => tent?.pieces(list)
    };
  }
</script>

<main class="tent" data-tent>
  <h1 class="sr-only">{t('tent.title')}</h1>
  <canvas bind:this={canvas} class="room" data-room onpointerdown={onDown} onpointerup={onUp} onpointercancel={() => (down = null)}
    aria-label={t('tent.room')}></canvas>
  <div class="top" bind:this={top}>
    <NavButton kind="back" text={t('tent.back')} onclick={leave} sfx="self" />
  </div>
  <div class="foot" bind:this={foot}>
  </div>
  {#if failed}<p class="fail" role="alert">{t('tent.failed')}</p>{/if}
</main>

<style>
  .tent { position: relative; max-width: var(--col); margin: 0 auto; height: var(--vh-fill); overflow: hidden; background: #2a1f17; touch-action: none; }
  .room { position: absolute; inset: 0; width: 100%; height: 100%; display: block; touch-action: none; -webkit-tap-highlight-color: transparent; }
  .top { position: absolute; left: calc(var(--side) + var(--safe-left)); top: calc(var(--safe-top) + 8px); z-index: 2; }
  .foot {
    position: absolute; left: 0; right: 0; bottom: 0; z-index: 2; display: flex; justify-content: center; gap: 10px;
    padding: 0 12px calc(var(--safe-bottom, 0px) + 12px); pointer-events: none;
  }
  .fail { position: absolute; left: 16px; right: 16px; top: 40%; text-align: center; color: #F5E4BC; font-weight: 700; }
</style>
