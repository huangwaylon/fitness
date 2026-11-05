<script lang="ts">
  // The editor's 3D view of the layout (docs/island-layout.md "The editor"): the very ground and models the island
  // draws, in its own small scene: the ground (world3d/terrain.ts buildGround), placeObjects' instances as the island
  // has them today (world3d/objects.ts, drawCheck.ts previewDay: the scenery's swaps, the fixed decor's pieces; the
  // bulletin board, the island's DOM node's model), the homes, bridges, stairs and ponds (world3d/built.ts, the
  // island's own createBuilt) and K.K. on his stool (the island's villagers' code, slot `kk`, his model loaded once
  // there's a stool). `orbit` (drag to turn, wheel or a pinch to zoom; right-drag, shift-drag, space-drag or two
  // fingers to pan) or `phone` (NH's island camera: a long lens, high, the rolling log bending the far ground away; a
  // drag on open ground or the wheel moves it, a pinch or ctrl-wheel zooms). Panning stays over the island; ⌖ puts the
  // camera back where it started; nothing moves it but a hand. A layout change rebuilds only the chunks and models that
  // changed; a frame is drawn only when something changed (an edit, the camera, a model in, a wobble), never on a
  // timer.
  import { onMount } from 'svelte';
  import { asset } from '$app/paths';
  import type { Layout } from '#lib/layout/model.ts';
  import { diffLayouts } from '#lib/layout/diff.ts';
  import { lookOf, type Look } from '../world3d/groundLook.ts';
  import { theme } from '#lib/ui-state/theme.svelte.ts';
  import { drawOff } from '#lib/ui-state/testMode.ts';
  import type { EditStage } from '../layoutEdit/IslandEdit.svelte';
  import type { Material, Mesh, Object3D } from 'three';

  let { layout, mode = 'orbit', look, camZ = $bindable(300), stage = $bindable() }: {
    layout: Layout;
    mode?: 'orbit' | 'phone';
    /** The ground's look (none: today's, as the island's: the theme's season and foliage). */
    look?: Look;
    camZ?: number;
    /** The phone view's stage for the island's もようがえ (layoutEdit/IslandEdit.svelte). */
    stage?: EditStage;
  } = $props();
  const lookNow = $derived<Look>(look ?? lookOf(theme.season, theme.foliage));
  let wrapEl = $state<HTMLDivElement>();

  let canvas = $state<HTMLCanvasElement>();
  let failed = $state(false);
  let api: { set(l: Layout): void; look(l: Look): void; mode(m: 'orbit' | 'phone'): void; recentre(): void } | null = null;

  onMount(() => {
    let gone = false, stop = () => {};
    const camZ0 = camZ;
    void Promise.all([import('../world3d/threePreview.ts'), import('three/examples/jsm/controls/OrbitControls.js'), import('../world3d/terrain.ts'), import('../world3d/objects.ts'), import('../world3d/things.ts'), import('../world3d/bend.ts'), import('../world3d/water.ts'), import('../world3d/home.ts'), import('../world3d/built.ts'), import('../world3d/release.ts'), import('../world3d/drawCheck.ts'), import('../island/kkSlider.ts'), import('../island/devHooks.ts'), import('#lib/time/clock.ts'), import('#lib/layout/model.ts'), import('../rooms/gesture.ts'), import('./previewCam.ts')]).then(
      ([T, { OrbitControls }, { buildGround }, { placeObjects }, { createThings }, { bendU, bend, bendPoint, unbendRay }, { waterU, waterFog }, { homeTod }, { createBuilt, builtObject }, { releaseAll, resourcesOf }, { previewDay }, KK, { hookOneOf, islandSeed }, { dayKey, jst, now }, { extentOf }, { gestures }, C]) => {
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
        // (the shadow map redrawn only with a frame that has a change: kick())
        renderer.shadowMap.autoUpdate = false;
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
        // (where ⌖ puts it back)
        controls.saveState();

        // a frame when something changed, then as long as something still moves (the controls' damping, a wobble,
        // K.K. settling onto his stool): never on a timer
        let raf = 0, dirty = true, frames = 0;
        // (the e2e's logic mode: nothing drawn)
        const off = drawOff();
        const kick = () => {
          dirty = true;
          if (!raf && !gone) raf = requestAnimationFrame(frame);
        };

        let cur = layout;
        // the island's look today (the theme's season), its pieces at this hour
        let lk: Look = lookNow;
        const day = () => {
          const season = lk === 'spring-petals' ? 'spring' : lk === 'autumn-leaves' ? 'autumn' : lk;
          const foliage = lk === 'autumn-leaves' ? 'fall' : lk === 'spring-petals' ? 'blossom' : theme.foliage;
          const d = now();
          return previewDay(cur, { season, foliage, month: d.getMonth() + 1, date: dayKey(d), hour: jst(d).hour, seed: islandSeed() });
        };
        const ground = buildGround(cur, { renderer, look: lk, stairs: false });
        scene.add(ground.group);
        const things = createThings(scene, ground.heightAt, kick);
        things.tod(0, 0.32);
        void things.place(placeObjects(cur, day()).insts);
        void ground.ready.then(kick);
        // the homes, bridges, stairs and ponds: the island's own (built.ts); a replaced or removed one's resources (the
        // models' cache's) let go of with the rest at the end
        const gone3: ReturnType<typeof resourcesOf> = new Set();
        const groups = new Map<string, Object3D>();
        let heldId: string | null = null;
        const built = createBuilt((id, g, at) => {
          const was = groups.get(id);
          if (was) {
            scene.remove(was);
            resourcesOf(was, gone3);
            groups.delete(id);
          }
          if (g && at) {
            g.traverse((n) => {
              const mm = (n as Mesh).material;
              for (const m of mm ? ([] as Material[]).concat(mm) : []) bend(m);
            });
            g.position.set(at.x, at.y ?? ground.heightAt(at.x, at.z), -at.z);
            g.rotation.y = at.yaw;
            g.visible = builtObject(id) !== heldId;
            groups.set(id, g);
            scene.add(g);
          }
          kick();
        }, (id, g) => {
          // (a home lit as the island's by day)
          if (id.startsWith('home:')) homeTod(g, 0, 0.32);
        });
        built.sync(cur, ground.heightAt);

        // ---- K.K. on his stool: the island's villagers' code (slot `kk`), loaded once there's a stool ----
        type Vil = import('../world3d/villagers.ts').Villagers3;
        type Spec = import('../world3d/villagers.ts').VSpec;
        let vil: Vil | null = null, vilLoading = false;
        const kkSpec: Spec = {
          slot: 'kk', id: 'kk-slider', x: 0, z: 0, y: 0, walking: false, face: 'home', side: 'left', asleep: false, prone: false, seat: KK.KK_SEAT, yaw: 0, lift: 0,
          motion: null, motionN: 0, emote: null, stung: false, shown: true, hat: null, tool: null, away: false
        };
        let kkOn = false;
        function placeKK(l: Layout) {
          const s = KK.kkSpot(l);
          kkOn = !!s;
          if (!s) return kick();
          const j = jst(now());
          Object.assign(kkSpec, { x: s.x, z: s.z, y: ground.feet(s.x, s.z), yaw: s.yaw, asleep: (hookOneOf('kk', KK.KK_MODES) ?? KK.kkMode(j.weekday, j.hour)) === 'asleep', shown: s.id !== heldId });
          if (!vil && !vilLoading) {
            vilLoading = true;
            void import('../world3d/villagers.ts').then(({ createVillagers }) => {
              if (gone) return;
              vil = createVillagers((o) => {
                o.traverse((n) => {
                  const mm = (n as Mesh).material;
                  for (const m of mm ? ([] as Material[]).concat(mm) : []) bend(m);
                  n.frustumCulled = false;
                });
                scene.add(o);
                kick();
                return () => (scene.remove(o), kick());
              }, asset('room/villagers3d/' as Parameters<typeof asset>[0]), kick);
              vil.lift(0.32);
              kick();
            }, (e) => console.warn('preview: K.K.', e));
          }
          kick();
        }
        placeKK(cur);

        // ---- the camera ----
        let m: 'orbit' | 'phone' = mode;
        const PITCH = (58 * Math.PI) / 180;
        /** The phone view's camera: its spot along the island (camZ), across it, and its zoom. */
        let camX = C.MID_X, zoom = 1, D = 1700;
        const bounds = () => C.panBounds(extentOf(cur));
        function aim() {
          if (m === 'orbit') {
            bendU.uBendR.value = 3e5;
            controls.enabled = true;
            cull();
            fog.near = 1e5;
            fog.far = 2e5;
            return;
          }
          const b = bounds();
          camZ = C.clamp(camZ, C.Z_MIN, C.Z_MAX);
          camX = C.clamp(camX, b.x0, b.x1);
          zoom = C.clamp(zoom, C.ZOOM_MIN, C.ZOOM_MAX);
          fog.near = 1400 * 1.25;
          fog.far = 1400 * 3.2;
          controls.enabled = false;
          bendU.uBendR.value = 1300;
          bendU.uBendZ.value = -camZ;
          const d = D / zoom;
          camera.position.set(camX, d * Math.sin(PITCH), -camZ + d * Math.cos(PITCH));
          camera.lookAt(camX, 0, -camZ);
          sun.position.set(camX - 0.55 * 700, 700, -camZ - 120 + 0.75 * 700);
          sun.target.position.set(camX, 0, -camZ - 120);
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
          kick();
        }
        const ro = new ResizeObserver(resize);
        ro.observe(canvas);
        resize();
        aim();
        sun.position.set(-200, 900, 400);
        sun.target.position.set(210, 0, -560);
        sun.target.updateMatrixWorld();
        // orbit: the pan kept over the island (the camera moved with its target)
        const was = new T.Vector3();
        // (the damping's leftover pan and turn: dropped at an edge and on ⌖, so it doesn't push on for seconds)
        const inertia = controls as unknown as { _panOffset: InstanceType<typeof T.Vector3>; _sphericalDelta: { set(r: number, p: number, t: number): void } };
        controls.addEventListener('change', () => {
          const t = controls.target, b = bounds();
          was.copy(t);
          t.set(C.clamp(t.x, b.x0, b.x1), C.clamp(t.y, -40, 400), -C.clamp(-t.z, b.z0, b.z1));
          if (!was.equals(t)) {
            camera.position.add(was.subVectors(t, was));
            inertia._panOffset?.set(0, 0, 0);
          }
          kick();
        });
        // space held: a left drag pans (the plan's way); shift / ctrl / ⌘ and a right drag pan already (OrbitControls)
        const typing = (e: KeyboardEvent) => (e.target as HTMLElement | null)?.closest?.('input, textarea, select, [contenteditable]');
        const onKey = (e: KeyboardEvent) => {
          if (e.code !== 'Space' || typing(e)) return;
          controls.mouseButtons.LEFT = e.type === 'keydown' ? T.MOUSE.PAN : T.MOUSE.ROTATE;
        };
        const onBlur = () => (controls.mouseButtons.LEFT = T.MOUSE.ROTATE);
        window.addEventListener('keydown', onKey);
        window.addEventListener('keyup', onKey);
        window.addEventListener('blur', onBlur);
        /** The phone view moved by a hand: `dx`, `dy` px the ground follows the finger, `k` its zoom's ratio. */
        function move(dx: number, dy: number, k = 1) {
          const r = canvas!.getBoundingClientRect();
          const [mx, mz] = C.panBy(dx, dy, r.width, zoom, PITCH);
          camX -= mx;
          camZ += mz;
          zoom *= k;
          aim();
          kick();
        }
        const onWheel = (e: WheelEvent) => {
          if (m !== 'phone') return;
          e.preventDefault();
          // (a trackpad's pinch is a ctrl-wheel)
          if (e.ctrlKey) move(0, 0, Math.exp(-e.deltaY * 0.01));
          else {
            camX += e.deltaX * 0.8 * (420 / Math.max(1, canvas!.getBoundingClientRect().width)) / zoom;
            camZ -= e.deltaY * 0.8;
            aim();
            kick();
          }
        };
        canvas.addEventListener('wheel', onWheel, { passive: false });
        // the phone view's fingers (rooms/gesture.ts's rule): a drag on open ground pans, two fingers pinch (and pan
        // along the island with their middle); a piece under the finger is IslandEdit's (it takes the press first)
        const g = gestures({ tap() {}, start() {}, end() {}, drag: (dx, dy) => move(dx, dy), pinch: (k, dy) => move(0, dy, k) });
        const ptr = (f: (e: PointerEvent) => void) => (e: PointerEvent) => {
          if (m !== 'phone') return;
          f(e);
        };
        const onDown = ptr((e) => (canvas!.setPointerCapture?.(e.pointerId), g.down(e)));
        const onMove = ptr((e) => g.move(e)), onUp = ptr((e) => g.up(e)), onCancel = ptr((e) => g.cancel(e));
        canvas.addEventListener('pointerdown', onDown);
        canvas.addEventListener('pointermove', onMove);
        canvas.addEventListener('pointerup', onUp);
        canvas.addEventListener('pointercancel', onCancel);

        function frame(t: number) {
          raf = 0;
          let more = false;
          if (m === 'orbit' && controls.update()) more = true;
          if (things.frame(t)) more = true;
          if (vil && vil.frame(t, kkOn ? [kkSpec] : [], false).moving) more = true;
          if (dirty || more) {
            waterU.uTime.value = (t / 1000) % 3600;
            waterFog(fog);
            renderer.shadowMap.needsUpdate = true;
            // (the e2e's logic mode: the frame's work done, nothing drawn: CI's software GL took seconds a frame)
            if (!off) renderer.render(scene, camera);
            frames++;
            dirty = false;
          }
          if (more) kick();
        }
        kick();
        // the e2e's view of it: the frames drawn, the camera, the groups built and K.K.
        const hook = {
          frames: () => frames,
          cam: () => (m === 'orbit' ? { mode: m, x: controls.target.x, z: -controls.target.z, zoom: 1 } : { mode: m, x: camX, z: camZ, zoom }),
          groups: () => [...groups.keys()],
          kk: () => (kkOn ? { x: kkSpec.x, z: kkSpec.z, yaw: kkSpec.yaw ?? 0, shown: kkSpec.shown, model: !!vil } : null)
        };
        window.__preview3d = hook;
        api = {
          set(l: Layout) {
            if (l === cur) return;
            const d = diffLayouts(cur, l);
            cur = l;
            if (d.chunks.length) ground.rebuild(l, d.chunks);
            else if (d.objects.add.length || d.objects.move.length || d.objects.remove.length) ground.rebuild(l, []);
            void things.place(placeObjects(l, day()).insts);
            built.sync(l, ground.heightAt);
            placeKK(l);
            if (m === 'phone') aim();
            kick();
          },
          look(l: Look) {
            if (l === lk) return;
            lk = l;
            ground.look(l);
            void things.place(placeObjects(cur, day()).insts);
            kick();
          },
          mode(mm) {
            m = mm;
            resize();
            aim();
            kick();
          },
          recentre() {
            if (m === 'orbit') {
              inertia._panOffset?.set(0, 0, 0);
              inertia._sphericalDelta?.set(0, 0, 0);
              controls.reset();
            }
            else {
              camX = C.MID_X;
              zoom = 1;
              camZ = camZ0;
              aim();
            }
            kick();
          }
        };
        // the stage: world ⇄ px through the camera and the bend (engine.ts's at / groundAt), what's held hidden
        const pv = new T.Vector3();
        stage = {
          host: wrapEl!,
          pans: true,
          toScreen(x: number, z: number, lift = 0) {
            const [bx, by, bz] = bendPoint(x, ground.feet(x, z) + lift, -z, bendU.uBendZ.value, bendU.uBendR.value);
            pv.set(bx, by, bz).project(camera);
            if (pv.z > 1) return null;
            const r = canvas!.getBoundingClientRect();
            return [((pv.x + 1) / 2) * r.width, ((1 - pv.y) / 2) * r.height];
          },
          toGround(sx: number, sy: number) {
            const r = canvas!.getBoundingClientRect();
            pv.set((sx / r.width) * 2 - 1, -(sy / r.height) * 2 + 1, 0.5).unproject(camera);
            const o = camera.position, d = pv.sub(o).normalize();
            let h = 3, hit: [number, number] | null = null;
            for (let i = 0; i < 3; i++) {
              const p = unbendRay([o.x, o.y, o.z], [d.x, d.y, d.z], h, bendU.uBendZ.value, bendU.uBendR.value);
              if (!p) return hit;
              hit = [p[0], -p[1]];
              h = Math.max(-2, ground.heightAt(hit[0], hit[1]));
            }
            return hit;
          },
          size: () => {
            const r = canvas!.getBoundingClientRect();
            return [r.width, r.height];
          },
          hide(id: string | null) {
            for (const [gid, gr] of groups) gr.visible = builtObject(gid) !== id;
            if (heldId && heldId !== id) things.over(heldId, null);
            heldId = id;
            if (id) things.over(id, { hidden: true });
            // (K.K. goes with his stool while it's held, and sits on it again where it's put down)
            kkSpec.shown = !id || KK.kkSpot(cur)?.id !== id;
            kick();
          }
        };
        stop = () => {
          if (raf) cancelAnimationFrame(raf);
          raf = 0;
          ro.disconnect();
          canvas?.removeEventListener('wheel', onWheel);
          canvas?.removeEventListener('pointerdown', onDown);
          canvas?.removeEventListener('pointermove', onMove);
          canvas?.removeEventListener('pointerup', onUp);
          canvas?.removeEventListener('pointercancel', onCancel);
          window.removeEventListener('keydown', onKey);
          window.removeEventListener('keyup', onKey);
          window.removeEventListener('blur', onBlur);
          g.reset(true);
          // (OrbitControls r170 takes its keydown listener off the canvas's root node, by now not the document: the
          // page's canvas is gone first, so the listener and with it the controls, the canvas and its context stayed)
          document.removeEventListener('keydown', (controls as unknown as { _interceptControlDown: EventListener })._interceptControlDown, { capture: true });
          controls.dispose();
          built.stop();
          if (window.__preview3d === hook) delete window.__preview3d;
          vil?.dispose();
          vil = null;
          things.dispose();
          ground.dispose();
          // the cached homes', bridges' and ponds' resources let go of on this renderer (their listeners kept it
          // alive), the shadow map, then the context
          releaseAll([scene], gone3);
          sun.shadow.dispose();
          renderer.dispose();
          renderer.forceContextLoss();
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
    const l = lookNow;
    api?.look(l);
  });
  $effect(() => {
    const m = mode;
    api?.mode(m);
  });
</script>

<div class="preview" data-preview={mode}>
  <!-- the stage's host (IslandEdit's presses come through it); ⌖ beside it, not a press on the island -->
  <div class="stage" bind:this={wrapEl}><canvas bind:this={canvas}></canvas></div>
  {#if failed}<p class="fail">WebGL could not start.</p>{/if}
  <button type="button" class="recentre" data-recentre title="まんなかに もどす" aria-label="まんなかに もどす" onclick={() => api?.recentre()}>⌖</button>
</div>

<style>
  .preview { position: relative; width: 100%; height: 100%; background: #9fd8fb; }
  .stage { position: absolute; inset: 0; }
  canvas { display: block; width: 100%; height: 100%; touch-action: none; }
  .fail { position: absolute; inset: 45% 0 auto; text-align: center; color: #fff; font-weight: 700; }
  .recentre {
    position: absolute; right: 8px; top: calc(8px + env(safe-area-inset-top, 0px)); z-index: 2;
    width: 36px; height: 36px; border-radius: 50%; border: 2px solid var(--c-lip, #c9b48a);
    background: rgba(255, 252, 240, 0.92); color: #6b5a3a; font-size: 20px; line-height: 1; cursor: pointer;
  }
</style>
