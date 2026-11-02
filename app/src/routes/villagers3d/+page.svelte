<script lang="ts">
  // The 3D villagers POC (/villagers3d, unlinked, noindex): NH's villager models with procedural motion
  // (lib/components/villager3d) on the 3D island (world3d/engine.ts: its ground, its models, its camera and its finger,
  // unchanged), to judge on the phone before the island's cards make way for them. ウェイ's and うめ's villagers (the
  // record's picks) and the guest's, any villager by the picker. Tap the ground: the chosen one runs there (the
  // island's own walk: nav.ts, 200 u/s). The buttons: the states (idle, sit on the bench, lie or nap in the hammock,
  // doze), the actions (hop, wave, high five, surprise, sting) and the faces; the time of day.
  //   ?a= ?b= ?g=   a roster id for each (else the record's picks, else the defaults)
  //   ?tod=day|dusk|night   ?stats: FPS, frame time, draw calls, triangles, the motion's own JS per frame
  import { onMount } from 'svelte';
  import { asset } from '$app/paths';
  import { week } from '#lib/store/week.svelte.ts';
  import { theme } from '#lib/ui-state/theme.svelte.ts';
  import { resolveLook } from '#lib/villagers/look.ts';
  import { ROSTER, ROSTER_IDS } from '#lib/villagers/roster.ts';
  import { SPECIES } from '#lib/villagers/species.ts';
  import { DECOR_SLOTS, HOMES, SHORE_Z } from '#lib/components/island/world.ts';
  import { walkNav } from '#lib/components/island/nav.ts';
  import { planTap } from '#lib/components/island/tapWalk.ts';
  import { SPEED } from '#lib/components/island/walkGraph.ts';
  import TERRAIN from '#lib/components/island/terrain.json' with { type: 'json' };
  import { has3d, ids3d, url3d } from '#lib/components/villager3d/manifest.ts';
  import { seatOf, type Action, type Pose, type State } from '#lib/components/villager3d/poses.ts';
  import type { Face } from '#lib/components/villager3d/faces.ts';
  import type { Villager3D } from '#lib/components/villager3d/villager3d.ts';

  type Slot = 'A' | 'B' | 'G';
  type Tod = 'day' | 'dusk' | 'night';
  type Pt = readonly [number, number];

  const q = new URLSearchParams(location.search);
  const showStats = q.has('stats');
  const people = week.view?.people;
  const pick = (s: Slot): string => {
    const asked = q.get(s.toLowerCase());
    const rec = s === 'G' ? week.view?.guest.villager : people?.[s].villager;
    const id = resolveLook({ villager: asked ?? rec ?? null, person: s }).id;
    return has3d(id) ? id : resolveLook({ villager: null, person: s }).id;
  };
  const nameOf = (s: Slot) => (s === 'G' ? week.view?.guest.villagerName : people?.[s].villagerName) ?? ({ A: 'ウェイ', B: 'うめ', G: 'おきゃくさん' } as const)[s];

  let canvas = $state<HTMLCanvasElement>();
  let sceneEl = $state<HTMLElement>();
  let failed = $state(false);
  let ready = $state(false);
  let sel = $state<Slot>('A');
  let ids = $state<Record<Slot, string>>({ A: pick('A'), B: pick('B'), G: pick('G') });
  let tod = $state<Tod>((['day', 'dusk', 'night'] as const).find((t) => t === q.get('tod')) ?? (theme.tod === 'night' ? 'night' : theme.tod === 'dusk' || theme.tod === 'dawn' ? 'dusk' : 'day'));
  let stats = $state('');
  let api: {
    swap(s: Slot, id: string): Promise<void>;
    state(s: Slot, st: State): void;
    act(s: Slot, a: Action): void;
    face(s: Slot, f: Face | null): void;
    tod(t: Tod): void;
  } | null = null;

  // the picker: every villager with a model, the special characters first, then by species
  const options = ROSTER_IDS.filter((id) => has3d(id)).map((id) => {
    const r = ROSTER[id];
    return { id, label: `${r.nameJa} · ${r.nameEn}`, group: r.special ? 'とくべつ' : SPECIES[r.species!][0] };
  });
  const groups = [...new Set(options.map((o) => o.group))];
  const count3d = ids3d().length;

  const STATES: [State, string][] = [['idle', 'たつ'], ['sit', 'すわる'], ['lie', 'ねころぶ'], ['nap', 'ねる'], ['doze', 'いねむり']];
  const ACTIONS: [Action, string][] = [['hop', 'ぴょん'], ['wave', 'てをふる'], ['highfive', 'ハイタッチ'], ['surprise', 'びっくり'], ['sting', 'はちにさされた']];
  const FACE_BTNS: [Face | null, string][] = [[null, 'ふつう'], ['happy', 'うれしい'], ['joy', 'わーい'], ['surprised', 'おどろき'], ['sad', 'かなしい'], ['cross', 'おこる'], ['sleepy', 'ねむい']];

  /** The sky behind the canvas (the island's own is the DOM's: engine.ts TOD's fog colours, a little deeper). */
  const SKY: Record<Tod, string> = { day: '#9fd8fb', dusk: '#f2b996', night: '#1d2c57' };
  /** The lift (engine.ts TOD): the self-light the island's models have at each time of day. */
  const LIFT: Record<Tod, number> = { day: 0.32, dusk: 0.22, night: 0.08 };

  onMount(() => {
    let gone = false, stop = () => {};
    void Promise.all([
      import('#lib/components/world3d/engine.ts'), import('#lib/components/world3d/ground.ts'), import('#lib/components/world3d/layout3d.ts'),
      import('#lib/components/world3d/gestures.ts'), import('#lib/components/villager3d/villager3d.ts'), import('#lib/components/world3d/bend.ts'),
      import('three')
    ]).then(([{ createIsland }, { WORLD_GROUND }, { island }, { attachGestures }, { createVillager, VILLAGER_S }, { bend }, { Object3D }]) => {
      if (gone || !canvas || !sceneEl) return;
      let e: ReturnType<typeof createIsland>;
      try {
        e = createIsland(canvas, WORLD_GROUND, { dpr: Math.min(2, devicePixelRatio || 1), water: q.get('water') !== '0', shadows: q.get('shadows') !== '0', cap: 60 });
      } catch (err) {
        console.warn('villagers3d', err);
        failed = true;
        return;
      }
      const eng = e;
      const T = TERRAIN as { chunks: number; seasons: string[]; bytes?: Record<string, number[]> };
      const season = theme.season, foliage = theme.foliage;
      const look = season === 'spring' && foliage === 'blossom' ? 'spring-petals' : season === 'autumn' && foliage === 'fall' ? 'autumn-leaves' : season;
      const ss = T.seasons.includes(look) ? look : season;
      eng.groundLook(Array.from({ length: T.chunks }, (_, c) => `${asset(`terrain/${ss}/${c}.webp` as Parameters<typeof asset>[0])}?v=${T.bytes?.[ss]?.[c] ?? 0}`));
      // The villagers in the engine's scene: engine.ts (the integration lead's, untouched here) has no way in for a
      // free-moving object but a rider on a model's instance (things.attach: the board's face's way), so they ride the
      // bridge's under a holder that undoes the bridge's placement: world space inside it.
      const holder = new Object3D(), world = new Object3D();
      holder.add(world);
      world.matrixAutoUpdate = false;
      const unride = () => world.matrix.copy(holder.matrix).invert();
      void eng.place(island({ season, foliage, month: new Date().getMonth() + 1 }).insts).then(() => {
        eng.things.attach('bridge', holder);
        unride();
      });
      eng.tod(tod);
      // まえ, where the three stand (the shore a little under the screen's middle)
      eng.setLimits(SHORE_Z + 60, 1150);
      eng.go(Number(q.get('cam') ?? 170));

      // ---- the villagers ----
      interface Walker { v: Villager3D | null; id: string; x: number; z: number; yaw: number; rest: number; path: Pt[]; then: State | null; lift: number; off: () => void }
      const START: Record<Slot, Pt> = { A: [HOMES.A[0] + 10, 190], B: [HOMES.B[0] - 10, 190], G: [195, 240] };
      const W: Record<Slot, Walker> = {
        A: { v: null, id: '', x: START.A[0], z: START.A[1], yaw: 0, rest: 0, path: [], then: null, lift: 0, off: () => {} },
        B: { v: null, id: '', x: START.B[0], z: START.B[1], yaw: 0, rest: 0, path: [], then: null, lift: 0, off: () => {} },
        G: { v: null, id: '', x: START.G[0], z: START.G[1], yaw: 0, rest: 0, path: [], then: null, lift: 0, off: () => {} }
      };
      const dir = asset('room/villagers3d/' as Parameters<typeof asset>[0]);
      const seq: Record<Slot, number> = { A: 0, B: 0, G: 0 };
      async function swap(s: Slot, id: string) {
        const w = W[s], url = url3d(id, dir);
        if (!url) return;
        const n = ++seq[s];
        const v = await createVillager(id, url, { A: 0, B: 1.7, G: 3.1 }[s]);
        // (a newer pick for the slot came first: this one's late)
        if (gone || n !== seq[s]) return v.dispose();
        const keep = w.v?.state() ?? 'idle';
        w.off();
        w.v?.dispose();
        w.v = v;
        w.id = id;
        v.lift(LIFT[tod]);
        v.group.traverse((n) => {
          const m = (n as { material?: import('three').Material | import('three').Material[] }).material;
          for (const x of m ? (Array.isArray(m) ? m : [m]) : []) bend(x);
          n.frustumCulled = false;
        });
        world.add(v.group);
        w.off = () => v.group.removeFromParent();
        v.set(keep === 'walk' ? 'idle' : keep);
        eng.kick();
      }
      const feet = (x: number, z: number) => WORLD_GROUND.feet(x, z);

      /** Walk a villager to (x, z) by the island's way (nav.ts), then settle into `then`. */
      function walkTo(s: Slot, x: number, z: number, then: State | null = null): boolean {
        const w = W[s];
        const p = planTap(walkNav(), [w.x, w.z], x, z);
        if (!p) return false;
        // (up from a seat first: in front of it)
        if (w.lift) w.z = Math.min(w.z, (w.rest ? hammock.z : bench.z) - 22);
        w.path = [...p.pts];
        w.then = then;
        w.lift = 0;
        w.rest = 0;
        w.v?.set('walk');
        eng.kick();
        return true;
      }
      // the seats: the bench at まえ (NH's park bench, 3u a model unit: its seat BENCH_SEAT up, over its middle; two to
      // it), the hammock at おく (its cloth HAMMOCK_BED up; lying along it)
      const bench = DECOR_SLOTS.find((d) => d.id === 'bench-mae')!, hammock = DECOR_SLOTS.find((d) => d.id === 'hammock')!;
      const BENCH_SEAT = 13, BENCH_BACK = 2, HAMMOCK_BED = 10;
      const SEAT_X: Record<Slot, number> = { A: bench.x - 13, B: bench.x + 13, G: bench.x };
      /** Settle onto the seat (its hips on it, its feet hanging in front) or into the hammock, or back on its feet. */
      function settle(s: Slot, st: State) {
        const w = W[s], v = w.v;
        if (!v) return;
        if (st === 'sit') {
          w.x = SEAT_X[s];
          w.z = bench.z + BENCH_BACK;
          w.lift = BENCH_SEAT - seatOf(v.rig.body) * VILLAGER_S;
          w.rest = 0;
        } else if ((st === 'lie' || st === 'nap') && !inHammock(s)) {
          w.x = hammock.x;
          w.z = hammock.z;
          w.lift = HAMMOCK_BED;
          w.rest = Math.PI / 2;
        } else if (st === 'lie' || st === 'nap') {
          // (someone's in the hammock already: on the grass where it stands)
          w.lift = 0;
          w.rest = Math.PI / 2;
        } else {
          w.lift = 0;
          w.rest = 0;
        }
        v.set(st);
      }
      /** Someone else is in the hammock. */
      const inHammock = (s: Slot) => (['A', 'B', 'G'] as const).some((o) => o !== s && W[o].lift === HAMMOCK_BED && W[o].x === hammock.x && W[o].z === hammock.z);
      function state(s: Slot, st: State) {
        const w = W[s];
        const near = (x: number, z: number, r: number) => Math.hypot(w.x - x, w.z - z) < r;
        if (st === 'sit' || st === 'lie' || st === 'nap') {
          const [x, z] = st === 'sit' ? [SEAT_X[s], bench.z - 22] : [hammock.x, hammock.z - 26];
          // there already: sit down (or lie down) at once; else walk up to it first (in front of it)
          if (near(SEAT_X[s], bench.z, 30) && st === 'sit') return settle(s, st);
          if ((near(hammock.x, hammock.z, 40) || inHammock(s)) && st !== 'sit') return settle(s, st);
          if (!walkTo(s, x, z, st)) settle(s, st);
          return;
        }
        // up again from the seat: in front of it
        if (w.lift) {
          w.z = Math.min(w.z, (w.rest ? hammock.z : bench.z) - 22);
        }
        w.path = [];
        settle(s, st);
      }

      // ---- the frame: walking, turning, posing ----
      let last = 0, animMs: number[] = [];
      eng.onFrame((t) => {
        const dt = last ? Math.min(50, t - last) : 16;
        last = t;
        const t0 = performance.now();
        unride();
        world.matrixWorldNeedsUpdate = true;
        for (const s of ['A', 'B', 'G'] as const) {
          const w = W[s], v = w.v;
          if (!v) continue;
          let moved = 0;
          if (w.path.length) {
            let left = (SPEED.run * dt) / 1000;
            while (left > 0 && w.path.length) {
              const [tx, tz] = w.path[0];
              const dx = tx - w.x, dz = tz - w.z, d = Math.hypot(dx, dz);
              if (d <= left) {
                w.x = tx;
                w.z = tz;
                left -= d;
                moved += d;
                w.path.shift();
              } else {
                w.x += (dx / d) * left;
                w.z += (dz / d) * left;
                moved += left;
                left = 0;
              }
              // facing the way (three's: the island's z runs into the screen)
              if (d > 0.01) w.yaw = turn(w.yaw, Math.atan2(dx, -dz), dt, 14);
            }
            if (!w.path.length) {
              const st = w.then ?? 'idle';
              w.then = null;
              settle(s, st);
            }
          } else {
            // standing, sitting or lying: turned to face the camera, as NH's villagers do when there's nothing to watch
            w.yaw = turn(w.yaw, w.rest, dt, v.state() === 'idle' ? 3 : 10);
          }
          v.group.position.set(w.x, feet(w.x, w.z) + w.lift, -w.z);
          v.group.rotation.y = w.yaw;
          v.step(t, moved, w.path.length ? SPEED.run : 0);
        }
        animMs.push(performance.now() - t0);
        if (animMs.length > 120) animMs.shift();
        return true;
      });
      const turn = (a: number, b: number, dt: number, k: number) => {
        let d = b - a;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        return a + d * Math.min(1, (k * dt) / 1000);
      };

      // ---- the finger: the island's (one scrolls, two pinch); a tap on the ground walks the chosen one ----
      const offG = attachGestures(sceneEl, eng, { enabled: () => true, top: () => sceneEl!.getBoundingClientRect().top });
      const onClick = (ev: MouseEvent) => {
        const r = canvas!.getBoundingClientRect();
        const g = eng.groundAt(ev.clientX - r.left, ev.clientY - r.top);
        if (g) walkTo(sel, g.x, g.z);
      };
      sceneEl.addEventListener('click', onClick);
      const ro = new ResizeObserver(() => eng.resize());
      ro.observe(canvas);

      api = {
        swap, state,
        act: (s, a) => W[s].v?.act(a),
        face: (s, f) => W[s].v?.face(f),
        tod(t) {
          eng.tod(t);
          for (const w of Object.values(W)) w.v?.lift(LIFT[t]);
        }
      };
      void Promise.all((['A', 'B', 'G'] as const).map((s) => swap(s, ids[s]))).then(() => (ready = true), (err) => {
        console.warn('villagers3d', err);
        failed = true;
      });

      let statsT = 0;
      const tick = () => {
        if (gone) return;
        const st = eng.stats();
        const a = [...animMs].sort((x, y) => x - y);
        stats = `${st.fps} fps · cpu ${st.cpu[0].toFixed(1)}/${st.cpu[1].toFixed(1)} ms · gap ${st.gap[0].toFixed(1)}/${st.gap[1].toFixed(1)} ms\n${st.calls} calls · ${(st.tris / 1000).toFixed(1)}k tris · dpr ${st.dpr}\nmotion ${(a[a.length >> 1] ?? 0).toFixed(2)}/${(a[Math.floor(a.length * 0.95)] ?? 0).toFixed(2)} ms (3 villagers)`;
        statsT = window.setTimeout(tick, 500);
      };
      if (showStats) tick();

      const Wn = window as unknown as { __villagers3d?: unknown };
      Wn.__villagers3d = {
        ready: () => ready && !eng.stats().loading,
        ids: () => ({ A: W.A.id, B: W.B.id, G: W.G.id }),
        pos: (s: Slot) => [W[s].x, W[s].z],
        state: (s: Slot) => W[s].v?.state() ?? null,
        walking: (s: Slot) => W[s].path.length > 0,
        walkTo: (s: Slot, x: number, z: number) => walkTo(s, x, z),
        client: (x: number, z: number, lift = 0) => {
          const p = eng.at(x, z, lift), r = canvas!.getBoundingClientRect();
          return [r.left + p.sx, r.top + p.sy];
        },
        stats: () => ({ ...eng.stats(), anim: [...animMs] }),
        view: () => eng.view(),
        go: (z: number, k?: number) => eng.go(z, k),
        /** A close look at one (the screenshots'): the engine's focus, nearer and lower than the board's. */
        focus: (s: Slot, zoom = 6, pitch = 18) => eng.focusOn({ x: W[s].x, z: W[s].z, lift: 40 }, { zoom, pitch, ms: 1 }),
        restore: () => eng.restore(1),
        hold: (s: Slot, p: Pose | null) => W[s].v?.hold(p),
        /** Where some bones are (model units, the villager's own frame: x its left, y up, z its front), as posed now. */
        bones: (s: Slot, names: string[]) => {
          const v = W[s].v;
          if (!v) return null;
          v.group.updateMatrixWorld(true);
          const inv = v.group.matrixWorld.clone().invert();
          const out: Record<string, number[]> = {};
          v.group.traverse((n) => {
            if (names.includes(n.name) && !out[n.name]) {
              const p = n.getWorldPosition(n.position.clone()).applyMatrix4(inv).divideScalar(VILLAGER_S);
              out[n.name] = p.toArray().map((x) => +x.toFixed(2));
            }
          });
          return out;
        }
      };
      stop = () => {
        clearTimeout(statsT);
        sceneEl?.removeEventListener('click', onClick);
        offG();
        ro.disconnect();
        eng.onFrame(null);
        for (const w of Object.values(W)) {
          w.off();
          w.v?.dispose();
        }
        eng.things.attach('bridge', null);
        eng.dispose();
        delete Wn.__villagers3d;
      };
    }, (err) => {
      console.warn('villagers3d', err);
      failed = true;
    });
    return () => {
      gone = true;
      stop();
      api = null;
    };
  });

  function choose(id: string) {
    ids[sel] = id;
    void api?.swap(sel, id);
  }
  function setTod(t: Tod) {
    tod = t;
    api?.tod(t);
  }
</script>

<svelte:head>
  <meta name="robots" content="noindex,nofollow" />
  <title>3D じゅうにん (POC)</title>
</svelte:head>

<div class="poc" data-v3d-ready={ready || undefined} style:background={SKY[tod]}>
  <div class="scene" bind:this={sceneEl}>
    <canvas bind:this={canvas}></canvas>
  </div>
  {#if failed}<p class="fail">WebGL could not start.</p>{/if}
  {#if showStats}<pre class="stats" data-stats>{stats}</pre>{/if}

  <div class="panel" data-nopan>
    <div class="row who" role="radiogroup" aria-label="だれ">
      {#each ['A', 'B', 'G'] as const as s (s)}
        <button type="button" data-sfx="tick" role="radio" aria-checked={sel === s} class:on={sel === s} data-slot={s} onclick={() => (sel = s)}>
          {nameOf(s)}<small>{ROSTER[ids[s] as keyof typeof ROSTER]?.nameJa ?? ids[s]}</small>
        </button>
      {/each}
      <select data-sfx="tick" aria-label="じゅうにん" value={ids[sel]} onchange={(ev) => choose((ev.currentTarget as HTMLSelectElement).value)} data-picker>
        {#each groups as g (g)}
          <optgroup label={g}>
            {#each options.filter((o) => o.group === g) as o (o.id)}<option value={o.id}>{o.label}</option>{/each}
          </optgroup>
        {/each}
      </select>
    </div>
    <div class="row">
      {#each STATES as [st, label] (st)}<button type="button" data-sfx="tick" data-state={st} onclick={() => api?.state(sel, st)}>{label}</button>{/each}
    </div>
    <div class="row">
      {#each ACTIONS as [a, label] (a)}<button type="button" data-sfx="tick" data-action={a} onclick={() => api?.act(sel, a)}>{label}</button>{/each}
    </div>
    <div class="row">
      {#each FACE_BTNS as [f, label] (label)}<button type="button" data-sfx="tick" data-face={f ?? 'neutral'} onclick={() => api?.face(sel, f)}>{label}</button>{/each}
    </div>
    <div class="row">
      {#each ['day', 'dusk', 'night'] as const as t (t)}
        <button type="button" data-sfx="tick" class:on={tod === t} data-tod={t} onclick={() => setTod(t)}>{({ day: 'ひる', dusk: 'ゆうがた', night: 'よる' } as const)[t]}</button>
      {/each}
      <span class="note">{count3d} にん · じめんをタップであるく</span>
    </div>
  </div>
</div>

<style>
  .poc { position: fixed; inset: 0; background: #9fd8fb; overflow: hidden; touch-action: none; }
  .scene { position: absolute; inset: 0; }
  canvas { display: block; width: 100%; height: 100%; }
  .fail { position: absolute; inset: 40% 0 auto; text-align: center; color: #fff; font-weight: 700; }
  .stats {
    position: absolute; top: calc(env(safe-area-inset-top) + 6px); left: 6px; margin: 0; padding: 4px 6px; border-radius: 6px;
    background: rgb(0 0 0 / 0.55); color: #fff; font: 600 11px/1.35 ui-monospace, monospace; pointer-events: none; white-space: pre;
  }
  .panel {
    position: absolute; left: 0; right: 0; bottom: 0; padding: 5px 0 calc(env(safe-area-inset-bottom) + 5px);
    background: rgb(255 249 227 / 0.9); display: grid; gap: 4px; font-size: 11px;
  }
  /* one line each, scrolled sideways when it's longer than the phone */
  .row { display: flex; gap: 4px; align-items: center; overflow-x: auto; padding: 0 6px; scrollbar-width: none; }
  .row::-webkit-scrollbar { display: none; }
  button {
    flex: none; border: 0; border-radius: 999px; padding: 5px 8px; background: #fff; color: #5c4a32; font: inherit; font-weight: 700;
    box-shadow: 0 1px 0 rgb(0 0 0 / 0.12);
  }
  button.on { background: #7fcf8c; color: #fff; }
  .who button { display: grid; line-height: 1.1; padding: 4px 10px; }
  .who small { font-weight: 600; opacity: 0.8; font-size: 10px; }
  select { flex: 1; min-width: 110px; font-family: inherit; font-size: 16px; padding: 5px; border-radius: 8px; border: 1px solid #d9c9a3; background: #fff; }
  .note { flex: none; margin-left: auto; color: #8a7556; font-size: 10px; }
</style>
