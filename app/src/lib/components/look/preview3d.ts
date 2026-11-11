// The すがた level's live 3D preview (docs/players.md "The stage"; docs/design.md "すがた"): the look being edited as NH's
// human player (components/player3d createPlayer), idling and blinking on a canvas of its own (the stage's size), a drag turning
// it, a tap hopping it, every edit dressed on in place. Its renderer is the level's one WebGL context: the closet's
// portraits (the コーデ chips, the せってい row) are drawn through it too (player3d portrait: a render target, a
// second player kept for the shots), never another context. Frames on demand: only while the player moves (a step or
// a blink says so) or turns, at most 30 a second, none while the page is hidden or the canvas is (pause: a villager's
// look); at rest no frame is even asked for till its next blink (a timer); everything let go of on dispose
// (world3d/stage.ts: one renderer lifecycle).
import { Box3, DirectionalLight, Group, HemisphereLight, PerspectiveCamera, Scene, Vector3 } from 'three';
import { createPlayer, createShooter } from '../player3d/player3d.ts';
import type { PlayerLook } from '#lib/contract/look.ts';
import { createStage } from '../world3d/stage.ts';
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
  /** Not on screen (a villager's look shows its card): no frames till it's back. */
  pause(on: boolean): void;
  /** A look's head as a PNG data URL (null: nothing drawn, the logic mode), through this renderer. */
  portrait(look: PlayerLook, size: number): Promise<string | null>;
  dispose(): void;
}

/** Radians a CSS px of drag turns it. */
const TURN = 0.014;
/** How long (ms) it stays turned after a drag before easing back to the front. */
const BACK_MS = 2500;

/** A preview on `canvas` (its CSS size), wearing `look`; rejects if the player can't be built (keep the stand-in). */
export async function createPreview(canvas: HTMLCanvasElement, look: PlayerLook, dir: string, seed = 0): Promise<Preview3D> {
  // (the player first: its renderer only once there's something to draw, none made and let go of if it can't be built)
  const player = await createPlayer('look', look, dir, seed);
  const scene = new Scene();
  scene.add(new HemisphereLight(0xffffff, 0x9fb0a0, 1.6));
  const sun = new DirectionalLight(0xfff2dd, 1.4);
  sun.position.set(-40, 120, 90);
  scene.add(sun);
  const camera = new PerspectiveCamera(22, 1, 1, 4000);
  // turned by a pivot of its own (the player's group is its animator's: a step may set its turn)
  const pivot = new Group();
  pivot.add(player.group);
  scene.add(pivot);
  player.step(0);
  player.step(1000);
  // the frame: the whole figure at rest, a little room over the head and under the feet; again whenever the canvas's
  // CSS box changes size (the stage's width; its compact states are a transform, not a resize), never a new renderer
  const box = new Box3().setFromObject(player.group), size = box.getSize(new Vector3());
  const fh = size.y * 1.12, cy = box.min.y + size.y * 0.5;
  function frameTo(nw: number, nh: number) {
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
    const fit = Math.max(fh, (size.x * 1.25) / camera.aspect);
    const d = fit / 2 / Math.tan((camera.fov / 2) * Math.PI / 180);
    camera.position.set(0, cy + d * 0.08, d);
    camera.lookAt(0, cy, 0);
    dirty = true;
  }

  let yaw = 0, spin = 0, held = false, letGo = -1e9, dirty = true, paused = false, gone = false;
  /** A frame: drawn if anything changed; the next wanted at once while it moves on its own (a step's crossfade or a hop,
   *  a spin, the ease back) or is held, else at its next blink (or the end of its stay turned): an idle すがた wakes
   *  for its blinks only. */
  function frame(t: number): number {
    if (paused) return Infinity;
    const stepping = player.step(t);
    let moved = player.blink(t) || stepping;
    let wait = Infinity;
    if (!held) {
      // let go: a flick's spin runs out, it stays turned a while (a look at the back), then eases back to the front
      if (Math.abs(spin) > 0.001) (yaw += spin), (spin *= 0.8), (letGo = t);
      else if (t - letGo < BACK_MS) {
        spin = 0;
        if (yaw !== 0) wait = letGo + BACK_MS - t;
      } else if (Math.abs(yaw) > 0.002) yaw += Math.atan2(Math.sin(-yaw), Math.cos(-yaw)) * 0.12;
      else yaw = 0;
    }
    if (pivot.rotation.y !== yaw) (pivot.rotation.y = yaw), (moved = true);
    if (moved || dirty) {
      dirty = false;
      if (!stage.noDraw) stage.renderer.render(scene, camera);
    }
    const easing = !held && (Math.abs(spin) > 0.001 || (wait === Infinity && yaw !== 0));
    return stepping || held || easing ? 0 : Math.min(wait, player.nextBlink(t));
  }
  let stage: ReturnType<typeof createStage>;
  try {
    stage = createStage(canvas, { antialias: true, alpha: true, power: 'low-power', at: [96, 132] }, frame, frameTo);
  } catch (e) {
    player.dispose();
    throw e;
  }

  // the portraits' own player (the preview's stays as it is on screen), made on the first shot, one shot at a time
  const shooter = createShooter('look-portrait', dir);
  let queue: Promise<unknown> = Promise.resolve();
  const redraw = () => ((dirty = true), stage.kick());

  return {
    async dress(next) {
      await player.dress(next);
      redraw();
    },
    hop() {
      player.act('hop');
      stage.kick();
    },
    turn(dx) {
      held = true;
      const a = dx * TURN;
      yaw += a;
      spin = a;
      stage.kick();
    },
    release() {
      held = false;
      letGo = performance.now();
      stage.kick();
    },
    pause(on) {
      paused = on;
      if (!on) redraw();
    },
    portrait(l, px) {
      const run = queue.then(async () => {
        if (gone || drawOff()) return null;
        const url = await shooter.shoot(stage.renderer, l, px, () => gone);
        // (the shot's render target came and went: draw the preview again)
        if (url) redraw();
        return url;
      });
      queue = run.catch(() => null);
      return run;
    },
    dispose() {
      if (gone) return;
      gone = true;
      scene.remove(pivot);
      player.dispose();
      shooter.dispose();
      stage.dispose([scene]);
    }
  };
}
