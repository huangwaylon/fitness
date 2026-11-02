<script lang="ts">
  // The 3D island POC (/world3d, /tmp/world3d/design.md): the whole island in three.js, NH's way. Not linked from the
  // app; the live island is untouched. three.js and the engine come in their own chunk once this screen opens. A tap
  // on empty ground walks my villager there (nav.ts, as today); a tap on a tree, a rock or a thing jiggles it where it
  // stands, on a villager hops it; the tent's door walks up to it. The finger pans (with a fling) and pinches; nothing
  // else moves the camera. ?t=day|dusk|night, ?stats (the measurements and toggles), ?dpr=, ?cap=30, ?water=0,
  // ?shadows=1, ?aa=0, ?R=, ?pitch=, ?cam=<z>.
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import type { WeekView } from '#lib/types.ts';
  import { art, artUrl, villagerArt } from '#lib/art.ts';
  import { resolveLook } from '#lib/villagers/look.ts';
  import { theme } from '#lib/ui-state/theme.svelte.ts';
  import { asset } from '$app/paths';
  import { HOMES } from '../island/world.ts';
  import { nav, doorOf } from '../island/nav.ts';
  import { planTap } from '../island/tapWalk.ts';
  import TERRAIN from '../island/terrain.json' with { type: 'json' };
  import { layout } from './layout3d.ts';
  import type { Hit, Look, Options, Stats, Tod, Who, World3D } from './engine.ts';

  let { view }: { view: WeekView } = $props();

  const q = new URLSearchParams(location.search);
  const num = (k: string) => (q.get(k) !== null && q.get(k) !== '' && Number.isFinite(Number(q.get(k))) ? Number(q.get(k)) : null);
  const showStats = q.has('stats');
  // svelte-ignore state_referenced_locally
  const me: Who = view.me === 'B' ? 'B' : 'A';
  const todOf = (t: string): Tod => (t === 'night' ? 'night' : t === 'dusk' || t === 'dawn' ? 'dusk' : 'day');
  let tod = $state<Tod>(todOf(q.get('t') ?? theme.tod));

  let canvas = $state<HTMLCanvasElement>();
  let eng: World3D | null = null;
  let failed = $state(false);
  let loaded = $state(false);
  let stats = $state<Stats | null>(null);
  let opt = $state<Options>({
    dpr: num('dpr') ?? Math.min(2, window.devicePixelRatio || 1),
    water: q.get('water') !== '0',
    shadows: q.get('shadows') === '1',
    cap: num('cap') === 30 ? 30 : 60
  });

  function lookOf(who: Who): Look | null {
    const p = view.people[who];
    const l = resolveLook({ villager: p?.villager, person: who });
    const key = villagerArt(l.id);
    const a = art(key), url = artUrl(key);
    return a && url ? { url, aspect: a.w / a.h, looksRight: l.looksRight, noMirror: l.noMirror } : null;
  }
  /** The ground's look (WorldGround's rule): the season's, the petals' or the fallen leaves' weeks. */
  function groundUrls(): string[] {
    const T = TERRAIN as { chunks: number; seasons: string[]; bytes?: Record<string, number[]> };
    const look = theme.season === 'spring' && theme.foliage === 'blossom' ? 'spring-petals' : theme.season === 'autumn' && theme.foliage === 'fall' ? 'autumn-leaves' : theme.season;
    const ss = T.seasons.includes(look) ? look : theme.season;
    return Array.from({ length: T.chunks }, (_, c) => `${asset(`terrain/${ss}/${c}.webp` as Parameters<typeof asset>[0])}?v=${T.bytes?.[ss]?.[c] ?? 0}`);
  }

  // ---- the finger: one pointer pans (a fling on release), two pinch; a short still press is a tap ----
  const pts = new Map<number, { x: number; y: number; t: number }>();
  let down: { x: number; y: number; t: number; moved: boolean } | null = null;
  let pinch = 0;
  let trail: { x: number; y: number; t: number }[] = [];
  function onDown(e: PointerEvent) {
    canvas?.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY, t: e.timeStamp });
    if (pts.size === 1) {
      down = { x: e.clientX, y: e.clientY, t: e.timeStamp, moved: false };
      trail = [{ x: e.clientX, y: e.clientY, t: e.timeStamp }];
    } else if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      pinch = Math.hypot(a.x - b.x, a.y - b.y);
      if (down) down.moved = true;
    }
    eng?.touching(true);
  }
  function onMove(e: PointerEvent) {
    const p = pts.get(e.pointerId);
    if (!p || !eng) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;
    p.t = e.timeStamp;
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch > 0 && d > 0) eng.zoom(d / pinch);
      pinch = d;
      return;
    }
    if (down && !down.moved && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 8) return;
    if (down) down.moved = true;
    eng.pan(dx, dy);
    trail.push({ x: e.clientX, y: e.clientY, t: e.timeStamp });
    while (trail.length > 2 && trail[0].t < e.timeStamp - 100) trail.shift();
  }
  function onUp(e: PointerEvent) {
    const had = pts.size;
    pts.delete(e.pointerId);
    if (!eng) return;
    if (had === 1 && down) {
      if (!down.moved && e.timeStamp - down.t < 500) tap(e.clientX, e.clientY);
      else if (trail.length > 1) {
        const a = trail[0], b = trail[trail.length - 1], dt = Math.max(1, b.t - a.t);
        if (e.timeStamp - b.t < 80) eng.fling((b.x - a.x) / dt, (b.y - a.y) / dt);
      }
      down = null;
    }
    if (pts.size < 2) pinch = 0;
    if (!pts.size) eng.touching(false);
  }

  const g = nav();
  function tap(cx: number, cy: number) {
    if (!eng) return;
    const h: Hit | null = eng.hit(cx, cy);
    if (!h) return;
    if (h.kind === 'villager') return eng.hop(h.who);
    if (h.kind === 'thing') {
      // the tent's door: walk up to it (the one interactable that walks first)
      if (h.tap === 'tent') {
        const from = eng.at(me);
        const plan = from && planTap(g, from, ...doorOf('campsite'));
        if (plan) {
          const ms = eng.walk(me, plan.pts);
          setTimeout(() => eng?.hop(me), ms + 40);
        }
        return;
      }
      return eng.jiggle(h.id);
    }
    const from = eng.at(me);
    if (!from) return;
    const plan = planTap(g, from, h.x, h.z);
    if (plan) eng.walk(me, plan.pts);
  }

  function setOpt(o: Partial<Options>) {
    opt = { ...opt, ...o };
    eng?.options(o);
  }
  function setTod(t: Tod) {
    tod = t;
    eng?.tod(t);
  }

  onMount(() => {
    if (!canvas) return;
    let ro: ResizeObserver | null = null, tick: ReturnType<typeof setInterval> | null = null;
    let gone = false;
    void import('./engine.ts').then(({ createWorld }) => {
      if (gone || !canvas) return;
      let e: World3D;
      try {
        e = createWorld(canvas, { ...opt, aa: q.get('aa') !== '0', R: num('R') ?? undefined, pitch: num('pitch') ?? undefined });
      } catch (err) {
        console.warn('world3d', err);
        failed = true;
        return;
      }
      eng = e;
      e.tod(tod);
      e.ground(groundUrls());
      const now = new Date();
      void e.place(layout(theme.season, theme.foliage, now.getMonth() + 1)).then(() => (loaded = true));
      for (const who of ['A', 'B'] as const) e.villager(who, lookOf(who), HOMES[who]);
      const cam = num('cam');
      if (cam !== null) e.go(cam, num('zoom') ?? undefined);
      ro = new ResizeObserver(() => e.resize());
      ro.observe(canvas);
      if (showStats) tick = setInterval(() => (stats = e.stats()), 500);
      (window as unknown as { __w3d?: unknown }).__w3d = {
        stats: () => e.stats(), view: () => e.view(), go: (z: number, k?: number) => e.go(z, k), at: (w: Who) => e.at(w), put: (w: Who, x: number, z: number) => e.put(w, [x, z]),
        client: (x: number, y: number, z: number) => e.client(x, y, z), hit: (x: number, y: number) => e.hit(x, y),
        tod: (t: Tod) => setTod(t), options: (o: Partial<Options>) => setOpt(o), pan: (dx: number, dy: number) => e.pan(dx, dy),
        fling: (vx: number, vy: number) => e.fling(vx, vy), zoom: (f: number) => e.zoom(f), loaded: () => loaded, tap: (x: number, y: number) => tap(x, y)
      };
    }, (err) => {
      console.warn('world3d', err);
      failed = true;
    });
    return () => {
      gone = true;
      ro?.disconnect();
      if (tick) clearInterval(tick);
      eng?.dispose();
      eng = null;
      delete (window as unknown as { __w3d?: unknown }).__w3d;
    };
  });

  const f1 = (n: number) => n.toFixed(1);
  const homeHref = resolve('/') + location.search.replace(/([?&])(stats|t|dpr|cap|water|shadows|aa|R|cam|zoom)(=[^&]*)?/g, '$1').replace(/[?&]+$/, '');
</script>

<svelte:head>
  <meta name="robots" content="noindex,nofollow" />
  <title>3D island POC</title>
</svelte:head>

<div class="w3d" data-tod={tod}>
  <canvas bind:this={canvas} data-w3d onpointerdown={onDown} onpointermove={onMove} onpointerup={onUp} onpointercancel={onUp}></canvas>
  <a class="back" href={homeHref} data-sveltekit-reload data-sfx="back">‹ 島へ</a>
  <div class="tods" role="group" aria-label="time of day">
    {#each ['day', 'dusk', 'night'] as const as t (t)}
      <button type="button" data-sfx="tick" aria-pressed={tod === t} onclick={() => setTod(t)}>{t === 'day' ? 'ひる' : t === 'dusk' ? 'ゆう' : 'よる'}</button>
    {/each}
  </div>
  {#if failed}<p class="fail">WebGL could not start.</p>{/if}
  {#if !loaded && !failed}<p class="loading">…</p>{/if}
  {#if showStats && stats}
    <div class="stats" data-stats>
      <div><b>{stats.fps}</b> fps · cpu {f1(stats.cpu[0])}/{f1(stats.cpu[1])} ms · gap {f1(stats.gap[0])}/{f1(stats.gap[1])} ms</div>
      <div>calls {stats.calls} · tris {(stats.tris / 1000).toFixed(0)}k · tex {stats.textures} · geo {stats.geometries}</div>
      <div>dpr {stats.dpr} · heap {stats.heap === null ? 'n/a' : `${stats.heap.toFixed(0)} MB`} · z {stats.camZ.toFixed(0)} · zoom {stats.zoom.toFixed(2)}{stats.loading ? ` · loading ${stats.loading}` : ''}</div>
      <div class="row">
        {#each [1, 1.5, 2] as d (d)}<button type="button" data-sfx="tick" aria-pressed={opt.dpr === d} onclick={() => setOpt({ dpr: d })}>dpr {d}</button>{/each}
      </div>
      <div class="row">
        <button type="button" data-sfx="tick" aria-pressed={opt.water} onclick={() => setOpt({ water: !opt.water })}>water {opt.water ? 'on' : 'off'}</button>
        <button type="button" data-sfx="tick" aria-pressed={opt.shadows} onclick={() => setOpt({ shadows: !opt.shadows })}>shadows {opt.shadows ? 'on' : 'off'}</button>
        <button type="button" data-sfx="tick" aria-pressed={opt.cap === 30} onclick={() => setOpt({ cap: opt.cap === 30 ? 60 : 30 })}>cap {opt.cap}</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .w3d { position: fixed; inset: 0; background: #9fd8fb; overscroll-behavior: none; touch-action: none; user-select: none; -webkit-user-select: none; }
  canvas { display: block; width: 100%; height: 100%; touch-action: none; }
  .back {
    position: absolute; left: calc(var(--side, 12px)); top: calc(var(--safe-top, 0px) + 10px);
    padding: 8px 14px; border-radius: 999px; background: rgba(255, 249, 227, 0.92); color: #6b5a3e;
    font-weight: 700; text-decoration: none; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }
  .tods { position: absolute; right: 12px; top: calc(var(--safe-top, 0px) + 10px); display: flex; gap: 4px; }
  .tods button, .stats button {
    border: 0; border-radius: 999px; padding: 7px 11px; background: rgba(255, 249, 227, 0.9); color: #6b5a3e; font: inherit; font-weight: 700; font-size: 13px;
  }
  .tods button[aria-pressed='true'], .stats button[aria-pressed='true'] { background: #f7c948; color: #4a3a1f; }
  .stats {
    position: absolute; left: 8px; right: 8px; bottom: calc(var(--safe-bottom, 0px) + 8px); padding: 8px 10px; border-radius: 12px;
    background: rgba(20, 24, 32, 0.72); color: #fff; font: 12px/1.45 ui-monospace, Menlo, monospace; display: grid; gap: 2px;
  }
  .stats .row { display: flex; gap: 6px; margin-top: 4px; }
  .stats button { padding: 5px 9px; font-size: 12px; }
  .fail, .loading { position: absolute; inset: 45% 0 auto; text-align: center; color: #fff; font-weight: 700; text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4); }
</style>
