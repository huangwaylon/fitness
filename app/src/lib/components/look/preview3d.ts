// The すがた level's live 3D preview (customization.md §3.1; docs/design.md "すがた"): the look being edited as NH's
// human player (components/player3d createPlayer), idling and blinking on a small canvas of its own, a drag turning
// it, a tap hopping it, every edit dressed on in place. Its renderer is the level's one WebGL context: the closet's
// portraits (the コーデ chips, the せってい row) are drawn through it too (player3d portrait: a render target, a
// second player kept for the shots), never another context. Frames on demand: only while the player moves (a step or
// a blink says so) or turns, at most 30 a second, none while the page is hidden; everything let go of on dispose.
import {
  Box3, DirectionalLight, Group, HemisphereLight, PerspectiveCamera, Scene, SRGBColorSpace, Vector3, WebGLRenderer
} from 'three';
import { createPlayer, portrait, type Player3D } from '../player3d/player3d.ts';
import type { PlayerLook } from '#lib/contract/look.ts';
import { drawOff } from '#lib/ui-state/testMode.ts';

export interface Preview3D {
  /** Wear a look (in place: what changed). */
  dress(look: PlayerLook): Promise<void>;
  /** A hop (the slot's tap). */
  hop(): void;
  /** Turn it by a drag's dx (CSS px). */
  turn(dx: number): void;
  /** Let go of the drag: it eases back toward facing front. */
  release(): void;
  /** A look's head as a PNG data URL (null: nothing drawn, the logic mode), through this renderer. */
  portrait(look: PlayerLook, size: number): Promise<string | null>;
  dispose(): void;
}

const DPR_MAX = 2;
const FRAME_MS = 1000 / 30;
/** Radians a CSS px of drag turns it. */
const TURN = 0.014;
/** How long (ms) it stays turned after a drag before easing back to the front. */
const BACK_MS = 2500;

/** A preview on `canvas` (its CSS size), wearing `look`; rejects if the player can't be built (keep the stand-in). */
export async function createPreview(canvas: HTMLCanvasElement, look: PlayerLook, dir: string, seed = 0): Promise<Preview3D> {
  const noDraw = drawOff();
  const renderer = new WebGLRenderer({ canvas, antialias: !noDraw, alpha: true, premultipliedAlpha: true, powerPreference: 'low-power', stencil: false });
  renderer.setPixelRatio(noDraw ? 1 : Math.min(DPR_MAX, window.devicePixelRatio || 1));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  const w = canvas.clientWidth || 96, h = canvas.clientHeight || 132;
  renderer.setSize(w, h, false);

  const scene = new Scene();
  scene.add(new HemisphereLight(0xffffff, 0x9fb0a0, 1.6));
  const sun = new DirectionalLight(0xfff2dd, 1.4);
  sun.position.set(-40, 120, 90);
  scene.add(sun);
  const camera = new PerspectiveCamera(22, w / h, 1, 4000);

  let player: Player3D;
  try {
    player = await createPlayer('look', look, dir, seed);
  } catch (e) {
    renderer.dispose();
    renderer.forceContextLoss();
    throw e;
  }
  // turned by a pivot of its own (the player's group is its animator's: a step may set its turn)
  const pivot = new Group();
  pivot.add(player.group);
  scene.add(pivot);
  player.step(0);
  player.step(1000);
  // the frame: the whole figure at rest, a little room over the head and under the feet
  const box = new Box3().setFromObject(player.group), size = box.getSize(new Vector3());
  const fh = size.y * 1.12, cy = box.min.y + size.y * 0.5;
  const fit = Math.max(fh, (size.x * 1.25) / camera.aspect);
  const d = fit / 2 / Math.tan((camera.fov / 2) * Math.PI / 180);
  camera.position.set(0, cy + d * 0.08, d);
  camera.lookAt(0, cy, 0);

  let yaw = 0, spin = 0, held = false, letGo = -1e9, dirty = true, last = 0, raf = 0, gone = false;
  function frame(t: number) {
    raf = requestAnimationFrame(frame);
    if (document.hidden || t - last < FRAME_MS) return;
    last = t;
    let moved = player.step(t);
    moved = player.blink(t) || moved;
    if (!held) {
      // let go: a flick's spin runs out, it stays turned a while (a look at the back), then eases back to the front
      if (Math.abs(spin) > 0.001) (yaw += spin), (spin *= 0.8), (letGo = t);
      else if (t - letGo < BACK_MS) spin = 0;
      else if (Math.abs(yaw) > 0.002) yaw += Math.atan2(Math.sin(-yaw), Math.cos(-yaw)) * 0.12;
      else yaw = 0;
    }
    if (pivot.rotation.y !== yaw) (pivot.rotation.y = yaw), (moved = true);
    if (!moved && !dirty) return;
    dirty = false;
    if (!noDraw) renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  // the portraits' own player (the preview's stays as it is on screen), made on the first shot
  let shooter: Promise<Player3D> | null = null;
  let queue: Promise<unknown> = Promise.resolve();

  return {
    async dress(next) {
      await player.dress(next);
      dirty = true;
    },
    hop() {
      player.act('hop');
    },
    turn(dx) {
      held = true;
      const a = dx * TURN;
      yaw += a;
      spin = a;
    },
    release() {
      held = false;
      letGo = performance.now();
    },
    portrait(l, px) {
      const run = queue.then(async () => {
        if (gone || noDraw) return null;
        shooter ??= createPlayer('look-portrait', l, dir, 0).then((p) => (p.step(0), p.step(1000), p));
        const p = await shooter;
        await p.dress(l);
        p.face(null);
        p.step(2000);
        if (gone) return null;
        const url = portrait(renderer, p, px, null).toDataURL('image/png');
        dirty = true; // the shot's render target came and went: draw the preview again
        return url;
      });
      queue = run.catch(() => null);
      return run;
    },
    dispose() {
      if (gone) return;
      gone = true;
      cancelAnimationFrame(raf);
      scene.remove(pivot);
      player.dispose();
      void shooter?.then((p) => p.dispose()).catch(() => {});
      renderer.dispose();
      renderer.forceContextLoss();
    }
  };
}
