<script lang="ts">
  // The editor's 3D view of the layout (docs/island-layout.md "The editor"): the very ground and models the island
  // draws (world3d/terrain.ts buildGround, world3d/objects.ts placeObjects, world3d/things.ts), in its own small
  // scene: `orbit` (drag to turn, wheel to zoom, right-drag to pan, flat) or `phone` (NH's island camera: a long lens,
  // high, the rolling log bending the far ground away; the wheel scrolls along the island). A layout change rebuilds
  // only the chunks and models that changed.
  import { onMount } from 'svelte';
  import type { Layout } from '#lib/layout/model.ts';
  import { diffLayouts } from '#lib/layout/diff.ts';
  import type { Look } from '../world3d/terrain.ts';
  import type { Season } from '#lib/ui-state/theme.svelte.ts';

  let { layout, mode = 'orbit', look = 'summer', camZ = $bindable(300), ontime }: {
    layout: Layout;
    mode?: 'orbit' | 'phone';
    look?: Look;
    camZ?: number;
    ontime?: (ms: { build: number; update?: number }) => void;
  } = $props();

  let canvas = $state<HTMLCanvasElement>();
  let failed = $state(false);
  let api: { set(l: Layout): void; look(l: Look): void; mode(m: 'orbit' | 'phone'): void; cam(z: number): void } | null = null;

  const seasonOf = (l: Look): Season => (l === 'spring-petals' ? 'spring' : l === 'autumn-leaves' ? 'autumn' : l);

  onMount(() => {
    let gone = false, stop = () => {};
    void Promise.all([import('three'), import('three/examples/jsm/controls/OrbitControls.js'), import('../world3d/terrain.ts'), import('../world3d/objects.ts'), import('../world3d/things.ts'), import('../world3d/bend.ts'), import('../world3d/water.ts'), import('../world3d/home.ts')]).then(
      ([T, { OrbitControls }, { buildGround }, { placeObjects, homePlaces }, { createThings }, { bendU, bend }, { waterU, waterFog }, { buildHome }]) => {
        if (gone || !canvas) return;
        let renderer: InstanceType<typeof T.WebGLRenderer>;
        try {
          renderer = new T.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
        } catch (e) {
          console.warn('preview', e);
          failed = true;
          return;
        }
        renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
        renderer.outputColorSpace = T.SRGBColorSpace;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = T.PCFSoftShadowMap;
        const scene = new T.Scene();
        scene.background = new T.Color(0x9fd8fb);
        const fog = new T.Fog(0xd7f0ff, 1400, 4200);
        scene.fog = fog;
        const hemi = new T.HemisphereLight(0xffffff, 0xe6efd4, 3.0);
        const sun = new T.DirectionalLight(0xfff3df, 1.5);
        sun.castShadow = true;
        sun.shadow.mapSize.set(2048, 2048);
        sun.shadow.bias = -0.0006;
        sun.shadow.normalBias = 1.2;
        Object.assign(sun.shadow.camera, { left: -700, right: 700, top: 900, bottom: -900, near: 10, far: 3000 });
        scene.add(hemi, sun, sun.target);
        const camera = new T.PerspectiveCamera(30, 1, 10, 9000);
        const controls = new OrbitControls(camera, canvas);
        controls.enableDamping = true;
        // ?eye=x,y,z&at=x,y,z (world: z into the island) for a close look
        const q = new URLSearchParams(location.search);
        const v3 = (k: string, d: number[]) => (q.get(k)?.split(',').map(Number).filter(Number.isFinite).length === 3 ? q.get(k)!.split(',').map(Number) : d);
        const [ax, ay, az] = v3('at', [210, 0, 560]), [ex, ey, ez] = v3('eye', [210, 1500, -600]);
        controls.target.set(ax, ay, -az);
        camera.position.set(ex, ey, -ez);
        controls.update();

        const t0 = performance.now();
        let cur = layout;
        const ground = buildGround(cur, { renderer, look });
        scene.add(ground.group);
        let dirty = true;
        const things = createThings(scene, ground.heightAt, () => (dirty = true));
        things.tod(0, 0.32);
        const day = () => ({ season: seasonOf(look), foliage: look === 'autumn-leaves' ? 'fall' : look === 'spring-petals' ? 'blossom' : 'summer', month: new Date().getMonth() + 1, fruit: true });
        void things.place(placeObjects(cur, day()).insts);
        void ground.ready.then(() => (dirty = true));
        // the homes from NH's parts: rebuilt when a style or a spot changes
        const homes = new Map<string, { sig: string; g: InstanceType<typeof T.Group> | null }>();
        function placeHomes(l: typeof cur) {
          const want = homePlaces(l);
          for (const [id, h] of homes) if (!want.some((p) => p.id === id)) {
            if (h.g) scene.remove(h.g);
            homes.delete(id);
          }
          for (const p of want) {
            const sig = JSON.stringify(p);
            const had = homes.get(p.id);
            if (had?.sig === sig) continue;
            const entry = { sig, g: null as InstanceType<typeof T.Group> | null };
            homes.set(p.id, entry);
            void buildHome(p.style).then((g) => {
              if (!g || homes.get(p.id) !== entry) return;
              if (had?.g) scene.remove(had.g);
              g.traverse((n) => {
                const mm = (n as InstanceType<typeof T.Mesh>).material;
                if (mm && !Array.isArray(mm)) bend(mm);
              });
              g.position.set(p.x, ground.heightAt(p.x, p.z), -p.z);
              g.rotation.y = p.yaw;
              entry.g = g;
              scene.add(g);
              dirty = true;
            });
          }
        }
        placeHomes(cur);
        ontime?.({ build: performance.now() - t0 });

        let m: 'orbit' | 'phone' = mode;
        const PITCH = (58 * Math.PI) / 180;
        let D = 1700;
        function aim() {
          if (m === 'orbit') {
            bendU.uBendR.value = 3e5;
            controls.enabled = true;
            cull();
            fog.near = 1e5;
            fog.far = 2e5;
            return;
          }
          fog.near = 1400 * 1.25;
          fog.far = 1400 * 3.2;
          controls.enabled = false;
          bendU.uBendR.value = 1300;
          bendU.uBendZ.value = -camZ;
          camera.position.set(195, D * Math.sin(PITCH), -camZ + D * Math.cos(PITCH));
          camera.lookAt(195, 0, -camZ);
          sun.position.set(195 - 0.55 * 700, 700, -camZ - 120 + 0.75 * 700);
          sun.target.position.set(195, 0, -camZ - 120);
          sun.target.updateMatrixWorld();
          cull();
        }
        /** The bands in reach (engine.ts's rule: the bend drops the far ones behind the horizon); all in orbit. */
        function cull() {
          for (const b of ground.chunks()) {
            const on = m === 'orbit' || (b.z1 > camZ - 700 && b.z0 < camZ + 1500);
            for (const mesh of b.meshes) mesh.visible = on;
          }
        }
        function resize() {
          const r = canvas!.getBoundingClientRect();
          renderer.setSize(r.width, r.height, false);
          camera.aspect = r.width / Math.max(1, r.height);
          // the phone's lens (engine.ts's): 30° high, as far back as puts 420u of island across the screen at the pivot
          D = 420 / (2 * Math.tan((15 * Math.PI) / 180) * camera.aspect);
          camera.updateProjectionMatrix();
          aim();
          dirty = true;
        }
        const ro = new ResizeObserver(resize);
        ro.observe(canvas);
        resize();
        aim();
        sun.position.set(-200, 900, 400);
        sun.target.position.set(210, 0, -560);
        sun.target.updateMatrixWorld();
        controls.addEventListener('change', () => (dirty = true));
        const onWheel = (e: WheelEvent) => {
          if (m !== 'phone') return;
          e.preventDefault();
          camZ = Math.max(-60, Math.min(1260, camZ - e.deltaY * 0.8));
          aim();
          dirty = true;
        };
        canvas.addEventListener('wheel', onWheel, { passive: false });

        let raf = 0;
        const frame = (t: number) => {
          raf = requestAnimationFrame(frame);
          waterU.uTime.value = (t / 1000) % 3600;
          if (m === 'orbit') controls.update();
          waterFog(fog);
          things.frame(t);
          renderer.render(scene, camera);
          (window as unknown as { __preview?: { frame(): void } }).__preview?.frame();
          dirty = false;
        };
        raf = requestAnimationFrame(frame);
        api = {
          set(l: Layout) {
            if (l === cur) return;
            const t1 = performance.now();
            const d = diffLayouts(cur, l);
            cur = l;
            if (d.chunks.length) ground.rebuild(l, d.chunks);
            else if (d.objects.add.length || d.objects.move.length || d.objects.remove.length) ground.rebuild(l, []);
            void things.place(placeObjects(l, day()).insts);
            placeHomes(l);
            ontime?.({ build: 0, update: performance.now() - t1 });
            dirty = true;
          },
          look(l: Look) {
            ground.look(l);
            void things.place(placeObjects(cur, day()).insts);
          },
          mode(mm) {
            m = mm;
            resize();
            aim();
          },
          cam(z: number) {
            camZ = z;
            aim();
          }
        };
        let frames = 0, last = performance.now(), fps = 0;
        const info = () => ({ calls: renderer.info.render.calls, tris: renderer.info.render.triangles, textures: renderer.info.memory.textures, geometries: renderer.info.memory.geometries, fps });
        (window as unknown as { __preview?: unknown }).__preview = { homes: () => [...homes.values()].filter((h) => h.g).length, pending: () => things.pending(), ready: () => ground.ready, dirty: () => dirty, info, frame: () => { frames++; const t = performance.now(); if (t - last > 1000) { fps = Math.round((frames * 1000) / (t - last)); frames = 0; last = t; } } };
        stop = () => {
          cancelAnimationFrame(raf);
          ro.disconnect();
          canvas?.removeEventListener('wheel', onWheel);
          controls.dispose();
          things.dispose();
          ground.dispose();
          renderer.dispose();
          bendU.uBendR.value = 1300;
        };
      },
      (e) => {
        console.warn('preview', e);
        failed = true;
      }
    );
    return () => {
      gone = true;
      stop();
      api = null;
    };
  });

  $effect(() => {
    const l = layout;
    api?.set(l);
  });
  $effect(() => {
    const l = look;
    api?.look(l);
  });
  $effect(() => {
    const m = mode;
    api?.mode(m);
  });
</script>

<div class="preview" data-preview={mode}>
  <canvas bind:this={canvas}></canvas>
  {#if failed}<p class="fail">WebGL could not start.</p>{/if}
</div>

<style>
  .preview { position: relative; width: 100%; height: 100%; background: #9fd8fb; }
  canvas { display: block; width: 100%; height: 100%; }
  .fail { position: absolute; inset: 45% 0 auto; text-align: center; color: #fff; font-weight: 700; }
</style>
