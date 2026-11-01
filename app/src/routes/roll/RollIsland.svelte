<script lang="ts">
  // The rolling-log spike (route /roll; /tmp/rolling-log/research.md, option A): the island bent over a log in 2D
  // DOM. A native vertical scroller is the camera (overscroll contained, the document never scrolls): one camZ from
  // scrollTop, read in a passive scroll listener, applied in one rAF: each ground band's translateY + scale (the
  // cylinder made of 2D transforms, 1px overlap), each sprite's translate + scale at its feet (always upright), its
  // fade near the horizon and its sink behind it. Only what is in the window is written; nothing runs when still
  // (the walker, when walking, is the one rAF). Sky, haze and HUD sit outside the curved layer.
  // Params (query): R (units, else auto: the horizon at `sky` of the height), tilt (°), bands, curve
  // (cylinder | parabola), persp, sky (0…1), snap (proximity | mandatory | none), cam (start camZ), still (walker
  // paused), perf (the overlay).
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import { artUrl } from '#lib/art.ts';
  import {
    ROLL_DEFAULTS, band, camAt, horizonAhead, horizonUp, project, quadMatrix, radiusFor, scrollFor, sinkBelow, zIndexAt, type Curve, type RollParams
  } from '#lib/components/island/roll.ts';
  import RollGround from './RollGround.svelte';
  import { CAM_BACK, CAM_HOME, LOOP, THINGS, WALKER, WALK_SPEED, ZMAX, widthOf, type Thing } from './world.ts';

  const q = page.url.searchParams;
  const num = (k: string, d: number) => (q.has(k) && Number.isFinite(Number(q.get(k))) ? Number(q.get(k)) : d);
  const curve: Curve = q.get('curve') === 'parabola' ? 'parabola' : 'cylinder';
  const P: RollParams = {
    ...ROLL_DEFAULTS, curve, tilt: num('tilt', ROLL_DEFAULTS.tilt), bands: Math.round(num('bands', ROLL_DEFAULTS.bands)),
    persp: q.get('persp') === 'off' ? Infinity : num('persp', ROLL_DEFAULTS.persp)
  };
  const fixedR = q.has('R') ? num('R', ROLL_DEFAULTS.R) : null;
  const PIVOT = 0.72, SKY = num('sky', 0.16);
  const showPerf = q.has('perf');
  const snap = q.get('snap') ?? 'proximity';
  const BAND_D = ZMAX / P.bands;
  const GROUND_X0 = -200, GROUND_W = 790;
  /** RollGround's plan of the island, <use>d by every band. */
  const GROUND_REF = '#roll-ground';
  const bands = Array.from({ length: P.bands }, (_, i) => i).reverse(); // far first: a nearer band paints over its 1px overlap

  interface Sprite { t: Thing; src: string; w: number; parts: { name: string; clip?: string; dz: number }[] }
  /** ?x2: every thing twice (a copy nudged aside), for the 2× sprite-count measurement. */
  const things: Thing[] = q.has('x2') ? [...THINGS, ...THINGS.map((t) => ({ ...t, id: `${t.id}-2`, x: ((t.x + 150) % 400) - 5, z: t.z + 37 }))] : THINGS;
  const sprites: Sprite[] = things.flatMap((t) => {
    const src = artUrl(t.key);
    return src ? [{ t, src, w: widthOf(t.key, t.h), parts: t.parts.map((p) => ({ name: p.name, clip: p.clip, dz: p.dz ?? 0 })) }] : [];
  });
  const walkerSrc = artUrl(WALKER.key)!;
  const walkerW = widthOf(WALKER.key, WALKER.h);

  let root = $state<HTMLElement>();
  let scroller = $state<HTMLElement>();
  let vh = $state(844), vw = $state(390), s = $state(1), horizonPx = $state(0), trackH = $state(2000);
  let walking = $state(!q.has('still'));
  let taps = $state<string[]>([]);
  let perfText = $state('');

  // ---- the hot path: plain variables, no reactivity ----
  interface Node { el: HTMLElement; x: number; z: number; lift: number; h: number; shown: boolean; tf: string; op: string; clip: string; zi: number }
  let nodes: Node[] = [];
  let bandEls: HTMLElement[] = [];
  let bandState: { shown: boolean; tf: string }[] = [];
  let walkerEl: HTMLElement | null = null, walkerImg: HTMLElement | null = null, shadowEl: HTMLElement | null = null;
  const walker = { x: LOOP[0][0], z: LOOP[0][1], seg: 0, t: 0, face: 1, tf: '', st: '', zi: 0, shown: false, op: '', clip: '', el: null as unknown as HTMLElement };
  let pivotPx = 0, camZ = CAM_HOME, lastCam = NaN, raf = 0, lastTs = 0;
  // perf
  let updated = 0, frames: number[] = [], flingFrames: number[] = [], flingUpdates: number[] = [], lastScrollAt = 0, flingTimer = 0;
  let longTasks = 0, flingLong = 0, lastOverlay = 0, maxUpdated = 0;
  const stats = { flings: [] as { frames: number; p95: number; max: number; over33: number; long: number; maxUpdated: number; meanUpdated: number }[] };

  function measure() {
    if (!scroller) return;
    vw = scroller.clientWidth;
    vh = scroller.clientHeight;
    s = vw / 390;
    const hU = vh / s;
    P.R = fixedR ?? Math.round(radiusFor((PIVOT - SKY) * hU, P.tilt, P.curve));
    pivotPx = vh * PIVOT;
    horizonPx = pivotPx - horizonUp(P) * s;
    trackH = vh + (CAM_BACK - CAM_HOME) * s;
  }

  function hide(n: { el: HTMLElement; shown: boolean }) {
    if (!n.shown) return;
    n.el.style.display = 'none';
    n.shown = false;
  }
  function show(n: { el: HTMLElement; shown: boolean }) {
    if (n.shown) return;
    n.el.style.display = '';
    n.shown = true;
  }

  /** One sprite part: its feet projected, upright, scaled; faded and sunk near the horizon. */
  function place(n: { el: HTMLElement; shown: boolean; tf: string; op: string; clip: string }, x: number, z: number, lift: number, h: number): void {
    const pr = project(x, z, camZ, P);
    const py = pivotPx + pr.y * s - lift * pr.scale * s;
    const sink = sinkBelow(pr, P);
    if (!pr.visible || pr.fade <= 0.01 || py - h * s * pr.scale > vh + 2 || sink >= h + lift) return hide(n);
    show(n);
    const tf = `translate(${(vw / 2 + pr.x * s).toFixed(1)}px,${py.toFixed(1)}px) translate(-50%,-100%) scale(${pr.scale.toFixed(4)})`;
    if (tf !== n.tf) {
      n.el.style.transform = n.tf = tf;
      updated++;
    }
    const op = pr.fade < 1 ? pr.fade.toFixed(2) : '';
    if (op !== n.op) n.el.style.opacity = n.op = op;
    const cut = sink - lift;
    const clip = cut > 0.3 ? `inset(0 0 ${(cut * s).toFixed(1)}px 0)` : '';
    if (clip !== n.clip) n.el.style.clipPath = n.clip = clip;
  }

  function placeBands() {
    const W = GROUND_W * s, H = BAND_D * s;
    for (let i = 0; i < P.bands; i++) {
      const el = bandEls[i], st = bandState[i];
      if (!el) continue;
      const b = band(i * BAND_D, (i + 1) * BAND_D, camZ, P);
      const y0 = pivotPx + b.y * s, top = y0 - b.span * s;
      if (!b.visible || top > vh + 1 || y0 < horizonPx - 2) {
        if (st.shown) { el.style.display = 'none'; st.shown = false; }
        continue;
      }
      if (!st.shown) { el.style.display = ''; st.shown = true; }
      // a trapezoid from the near edge's perspective to the far edge's, 1px taller to overlap the band behind
      const xc = vw / 2 + (GROUND_X0 + GROUND_W / 2 - P.cx) * s, hn = (W / 2) * b.scaleNear, hf = (W / 2) * b.scaleFar;
      const m = quadMatrix(W, H, [xc - hf, top - 1, xc + hf, top - 1, xc + hn, y0, xc - hn, y0]);
      const tf = `matrix3d(${m.map((v) => +v.toFixed(6)).join(',')})`;
      if (tf !== st.tf) {
        el.style.transform = st.tf = tf;
        updated++;
      }
    }
  }

  function stepWalker(dt: number) {
    let left = (WALK_SPEED * dt) / 1000;
    while (left > 0) {
      const a = LOOP[walker.seg], b = LOOP[(walker.seg + 1) % LOOP.length];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const rest = len * (1 - walker.t);
      if (left < rest) {
        walker.t += left / len;
        left = 0;
      } else {
        left -= rest;
        walker.seg = (walker.seg + 1) % LOOP.length;
        walker.t = 0;
      }
      const dx = b[0] - a[0];
      if (Math.abs(dx) > 4) walker.face = dx > 0 ? 1 : -1;
    }
    const a = LOOP[walker.seg], b = LOOP[(walker.seg + 1) % LOOP.length];
    walker.x = a[0] + (b[0] - a[0]) * walker.t;
    walker.z = a[1] + (b[1] - a[1]) * walker.t;
  }

  function placeWalker() {
    if (!walkerEl || !shadowEl || !walkerImg) return;
    const zi = zIndexAt(walker.z, walker.x, ZMAX);
    if (zi !== walker.zi) walkerEl.style.zIndex = String((walker.zi = zi));
    place(walker, walker.x, walker.z, 0, WALKER.h);
    walkerImg.classList.toggle('flip', walker.face < 0);
    // its blob shadow lies on the ground: flattened by the ground's foreshortening there
    const pr = project(walker.x, walker.z, camZ, P);
    const st = `translate(${(vw / 2 + pr.x * s).toFixed(1)}px,${(pivotPx + pr.y * s).toFixed(1)}px) translate(-50%,-50%) scale(${pr.scale.toFixed(4)},${(pr.scale * pr.ground).toFixed(4)})`;
    if (st !== walker.st) {
      shadowEl.style.transform = walker.st = st;
      updated++;
    }
    shadowEl.style.opacity = walker.shown ? walker.op || '1' : '0';
  }

  function tick(ts: number) {
    raf = 0;
    updated = 0;
    if (!scroller) return;
    // frame gaps only count between consecutive ticks (an idle stretch in between is no frame)
    const gap = lastTs ? ts - lastTs : 0, contiguous = gap > 0 && gap < 150;
    const dt = contiguous ? Math.min(50, gap) : 16;
    const moving = ts - lastScrollAt < 250;
    if (contiguous && moving) frames.push(gap);
    lastTs = ts;
    camZ = camAt(scroller.scrollTop, CAM_HOME, CAM_BACK, s);
    if (camZ !== lastCam) {
      lastCam = camZ;
      placeBands();
      const zLo = camZ - (vh - pivotPx) / s - 140, zHi = camZ + horizonAhead(P) + P.R * 0.45;
      for (const n of nodes) {
        if (n.z < zLo || n.z > zHi) hide(n);
        else place(n, n.x, n.z, n.lift, n.h);
      }
    }
    if (walking) stepWalker(dt);
    placeWalker();
    if (moving && contiguous) {
      flingFrames.push(gap);
      flingUpdates.push(updated);
      maxUpdated = Math.max(maxUpdated, updated);
    }
    if (showPerf && ts - lastOverlay > 300) {
      lastOverlay = ts;
      const recent = frames.slice(-60);
      const fps = recent.length ? 1000 / (recent.reduce((a, b) => a + b, 0) / recent.length) : 0;
      writePerf(moving ? `${fps.toFixed(0)} fps · ${updated} writes` : null);
    }
    if (walking) raf = requestAnimationFrame(tick);
  }

  function writePerf(live: string | null) {
    const f = stats.flings.at(-1);
    perfText = [
      live ?? (walking ? 'walking (1 rAF)' : 'still: no rAF'),
      f ? `last fling: ${f.frames} fr · p95 ${f.p95.toFixed(1)} · max ${f.max.toFixed(1)} ms · >33: ${f.over33} · long ${f.long}` : 'fling to measure',
      f ? `writes/frame: mean ${f.meanUpdated.toFixed(0)} · max ${f.maxUpdated}` : '',
      `R ${P.R} · tilt ${P.tilt}° · ${P.bands} bands · ${P.curve}`
    ].filter(Boolean).join('\n');
  }

  function endFling() {
    flingTimer = 0;
    if (flingFrames.length > 2) {
      const d = flingFrames.slice(1).sort((a, b) => a - b);
      stats.flings.push({
        frames: d.length, p95: d[Math.min(d.length - 1, Math.floor(d.length * 0.95))], max: d[d.length - 1], over33: d.filter((x) => x > 33.4).length,
        long: longTasks - flingLong, maxUpdated, meanUpdated: flingUpdates.reduce((a, b) => a + b, 0) / flingUpdates.length
      });
      if (showPerf) writePerf(null);
    }
    flingFrames = [];
    flingUpdates = [];
    maxUpdated = 0;
    frames = [];
  }

  function onScroll() {
    const now = performance.now();
    if (!flingTimer) flingLong = longTasks;
    else clearTimeout(flingTimer);
    flingTimer = window.setTimeout(endFling, 220);
    lastScrollAt = now;
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function kick() {
    lastCam = NaN;
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function goTo(z: number) {
    scroller?.scrollTo({ top: scrollFor(z, CAM_BACK, s), behavior: 'smooth' });
  }

  function onTap(e: MouseEvent) {
    const hit = (e.target as Element).closest<HTMLElement>('[data-id]');
    if (!hit) return;
    const id = hit.dataset.id!;
    taps = [...taps.slice(-4), `${id}${hit.dataset.part && hit.dataset.part !== 'body' ? ' (' + hit.dataset.part + ')' : ''}`];
    const art = hit.querySelector('img') ?? hit;
    art.classList.remove('flash');
    void (art as HTMLElement).offsetWidth;
    art.classList.add('flash');
  }

  $effect(() => {
    if (walking && !raf) kick();
  });

  onMount(() => {
    const html = document.documentElement;
    const prev = [html.style.overflow, document.body.style.overflow];
    html.style.overflow = document.body.style.overflow = 'hidden';
    nodes = [...root!.querySelectorAll<HTMLElement>('.spr[data-z]')].map((el) => ({
      el, x: Number(el.dataset.x), z: Number(el.dataset.z), lift: Number(el.dataset.lift), h: Number(el.dataset.h),
      shown: true, tf: '', op: '', clip: '', zi: 0
    }));
    bandEls = [...root!.querySelectorAll<HTMLElement>('.band')].sort((a, b) => Number(a.dataset.i) - Number(b.dataset.i));
    bandState = bandEls.map(() => ({ shown: true, tf: '' }));
    walkerEl = root!.querySelector('.walker');
    walkerImg = walkerEl?.querySelector('img') ?? null;
    shadowEl = root!.querySelector('.shadow');
    walker.el = walkerEl!;
    walker.shown = true;
    measure();
    const start = num('cam', CAM_HOME);
    camZ = start;
    requestAnimationFrame(() => {
      scroller!.scrollTop = scrollFor(start, CAM_BACK, s);
      kick();
    });
    const ro = new ResizeObserver(() => {
      const keep = camZ;
      measure();
      requestAnimationFrame(() => {
        scroller!.scrollTop = scrollFor(keep, CAM_BACK, s);
        for (const n of nodes) n.tf = '';
        kick();
      });
    });
    ro.observe(scroller!);
    // taps on the sprites (their buttons carry the sound): one delegated listener
    const stage = root!.querySelector<HTMLElement>('.stage')!;
    stage.addEventListener('click', onTap);
    let po: PerformanceObserver | null = null;
    try {
      po = new PerformanceObserver((l) => (longTasks += l.getEntries().length));
      po.observe({ type: 'longtask', buffered: false });
    } catch {
      po = null; // Safari has no longtask entries
    }
    // e2e and the console: read the state, pin the walker, take the numbers
    (window as unknown as { __roll: unknown }).__roll = {
      P, stats, taps: () => taps,
      cam: () => camZ,
      horizon: () => horizonPx,
      setWalker(x: number, z: number) {
        walking = false;
        walker.x = x;
        walker.z = z;
        kick();
      },
      walk(on: boolean) {
        walking = on;
      },
      idle: () => raf === 0
    };
    return () => {
      html.style.overflow = prev[0];
      document.body.style.overflow = prev[1];
      ro.disconnect();
      stage.removeEventListener('click', onTap);
      po?.disconnect();
      if (raf) cancelAnimationFrame(raf);
      if (flingTimer) clearTimeout(flingTimer);
    };
  });
</script>

<RollGround />

<div class="roll" bind:this={root} style:--u="{s}px" style:--horizon="{horizonPx}px" data-curve={P.curve}>
  <div class="sky" aria-hidden="true"></div>
  <div class="scroller" bind:this={scroller} onscroll={onScroll} style:scroll-snap-type={snap === 'none' ? 'none' : `y ${snap}`} data-roll-scroller>
    <div class="track" style:height="{trackH}px">
      <div class="snap" style:top="0" data-snap="back"></div>
      <div class="snap end" style:bottom="0" data-snap="home"></div>
      <div class="stage" style:height="{vh}px">
        <div class="ground" aria-hidden="true">
          {#each bands as i (i)}
            <svg class="band" data-i={i} viewBox="{GROUND_X0} {ZMAX - (i + 1) * BAND_D} {GROUND_W} {BAND_D}" preserveAspectRatio="none"
              style:width="calc({GROUND_W} * var(--u))" style:height="calc({BAND_D} * var(--u))"><use href={GROUND_REF} /></svg>
          {/each}
        </div>
        <div class="haze" aria-hidden="true"></div>
        <span class="shadow" aria-hidden="true" style:width="calc({WALKER.shadow[0] * 2} * var(--u))" style:height="calc({WALKER.shadow[1] * 2} * var(--u))"></span>
        {#each sprites as { t, src, w, parts } (t.id)}
          {#each parts as part (part.name)}
            <div class="spr" data-z={t.z + part.dz} data-x={t.x} data-lift={t.lift ?? 0} data-h={t.h} data-kind={t.kind}
              style:z-index={zIndexAt(t.z + part.dz, t.x, ZMAX)} style:width="calc({w} * var(--u))" style:height="calc({t.h} * var(--u))">
              <button type="button" class="hit" data-sfx="tick" data-id={t.id} data-part={part.name} style:clip-path={part.clip} aria-label={t.id}>
                <img {src} alt="" class:flip={t.flip} class:bob={t.kind === 'critter'} draggable="false" decoding="async" />
              </button>
            </div>
          {/each}
        {/each}
        <div class="spr walker" data-walker style:width="calc({walkerW} * var(--u))" style:height="calc({WALKER.h} * var(--u))">
          <button type="button" class="hit" data-sfx="tick" data-id={WALKER.id} data-part="body" aria-label={WALKER.id}>
            <img src={walkerSrc} alt="" class:walking draggable="false" />
          </button>
        </div>
      </div>
    </div>
  </div>

  <header class="hud">
    <a class="pill" href={resolve('/')} data-sveltekit-reload data-sfx="back">‹ 島へ</a>
    <span class="title">ころがる島 <small>試作</small></span>
    <span class="row">
      <button type="button" class="pill" onclick={() => goTo(CAM_HOME)} data-sfx="page">まえ</button>
      <button type="button" class="pill" onclick={() => goTo(CAM_BACK)} data-sfx="page">おく</button>
      <button type="button" class="pill" aria-pressed={walking} data-sfx={walking ? 'toggle-off' : 'toggle-on'} onclick={() => (walking = !walking)}>{walking ? 'あるく ⏸' : 'あるく ▶'}</button>
    </span>
  </header>
  {#if taps.length}<p class="taps" data-taps>{taps.at(-1)}</p>{/if}
  {#if showPerf}<pre class="perf" data-perf>{perfText || 'fling to measure'}</pre>{/if}
</div>

<style>
  .roll {
    position: fixed; inset: 0; overflow: hidden; background: #3D8FE2; touch-action: pan-y;
    -webkit-user-select: none; user-select: none; -webkit-touch-callout: none;
  }
  /* the sky: NH's clear day, paler and hazier toward the horizon */
  .sky {
    position: absolute; inset: 0 0 auto; height: calc(var(--horizon) + 4px);
    background: linear-gradient(to bottom, #6CC4F4 0%, #9AD8F7 55%, #D4F1FB 92%, #E9F8FC 100%);
  }
  .scroller {
    position: absolute; inset: 0; overflow-y: auto; overflow-x: hidden; overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch; scrollbar-width: none;
  }
  .scroller::-webkit-scrollbar { display: none; }
  .track { position: relative; }
  .snap { position: absolute; left: 0; width: 1px; height: 1px; scroll-snap-align: start; pointer-events: none; }
  .snap.end { scroll-snap-align: end; }
  .stage { position: sticky; top: 0; overflow: hidden; pointer-events: none; contain: layout paint; }
  .ground { position: absolute; inset: 0; z-index: 0; }
  .band { position: absolute; left: 0; top: 0; display: block; transform-origin: 0 0; will-change: transform; overflow: hidden; }
  /* a little haze where the ground meets the sky */
  .haze {
    position: absolute; left: 0; right: 0; top: calc(var(--horizon) - 2px); height: 46px; z-index: 2;
    background: linear-gradient(to bottom, rgba(233, 248, 252, .95), rgba(233, 248, 252, .45) 45%, rgba(233, 248, 252, 0));
  }
  .shadow {
    position: absolute; left: 0; top: 0; z-index: 3; border-radius: 50%; will-change: transform;
    background: radial-gradient(closest-side, rgba(34, 74, 28, .36) 40%, rgba(34, 74, 28, 0));
  }
  .spr { position: absolute; left: 0; top: 0; transform-origin: 50% 100%; will-change: transform; pointer-events: none; }
  .hit {
    display: block; width: 100%; height: 100%; padding: 0; margin: 0; border: 0; background: none; pointer-events: auto;
    -webkit-tap-highlight-color: transparent; cursor: pointer;
  }
  .hit img { display: block; width: 100%; height: 100%; pointer-events: none; transform-origin: 50% 100%; }
  img.flip { scale: -1 1; }
  img.walking { animation: roll-walk .42s ease-in-out infinite; }
  img.bob { animation: roll-bob 2.4s ease-in-out infinite; }
  .hit :global(img.flash) { animation: roll-flash .5s ease-out; }
  @keyframes roll-walk { 0%, 100% { translate: 0 0; rotate: -2deg; } 50% { translate: 0 -4%; rotate: 2deg; } }
  @keyframes roll-bob { 0%, 100% { translate: 0 0; } 50% { translate: 0 -12%; } }
  @keyframes roll-flash { 0% { filter: brightness(1.8) drop-shadow(0 0 6px #fff); transform: scale(1.12); } 100% { filter: none; transform: none; } }

  .hud {
    position: absolute; left: 0; right: 0; top: 0; z-index: 10; display: flex; flex-wrap: wrap; align-items: center; gap: 6px 8px;
    padding: calc(var(--safe-top, 0px) + 10px) 12px 0; pointer-events: none; font-family: var(--font-ui);
  }
  .hud > * { pointer-events: auto; }
  .title { font-weight: 800; color: #3B2F22; font-size: 15px; text-shadow: 0 1px 0 rgba(255, 255, 255, .7); }
  .title small { font-size: 11px; color: #6B5A45; }
  .row { display: flex; gap: 6px; margin-left: auto; }
  .pill {
    min-height: 36px; padding: 0 12px; border: 0; border-radius: 18px; background: #FFF9E3; color: #3B2F22; font: inherit;
    font-weight: 800; font-size: 13px; display: inline-flex; align-items: center; text-decoration: none;
    box-shadow: 0 3px 0 rgba(120, 90, 50, .35);
  }
  .pill[aria-pressed='false'] { background: #EADFC6; }
  .taps {
    position: absolute; left: 50%; bottom: calc(env(safe-area-inset-bottom, 0px) + 14px); translate: -50% 0; z-index: 10; margin: 0;
    padding: 6px 12px; border-radius: 14px; background: rgba(255, 249, 227, .94); color: #3B2F22; font: 700 13px var(--font-ui);
    pointer-events: none;
  }
  .perf {
    position: absolute; left: 8px; bottom: calc(env(safe-area-inset-bottom, 0px) + 54px); z-index: 10; margin: 0; padding: 6px 8px;
    border-radius: 8px; background: rgba(20, 20, 30, .72); color: #CFFFCF; font: 10.5px/1.35 ui-monospace, Menlo, monospace;
    white-space: pre; pointer-events: none;
  }
  @media (max-width: 359px) {
    .hud { flex-wrap: nowrap; gap: 4px; padding-left: 8px; padding-right: 8px; }
    .title { display: none; }
    .pill { padding: 0 10px; }
  }
</style>
