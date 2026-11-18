// 英語すごろく's board in 3D (docs/sugoroku.md "The board"): the island (scenery.ts) with the route's stepping stones,
// the players as their own characters (person3d: their human player or their villager, as the rooms draw them) standing
// on their stones and hopping stone to stone, a die tossed and settling on its face (die.ts), and a fixed 3/4 camera
// that eases after the player in focus down the long board, framing the part of the canvas the screen's overlays leave
// (setInsets: the canvas full-bleed, never resized by a phase; plan.ts visibleOf, cameraFor). Plain three.js on one canvas (its own screen: one WebGL
// context at a time on an iPhone); the pure part is plan.ts. Kept minimal (2026-11-18: the island-model version was too heavy).
// Drawn on demand (world3d/stage.ts createStage, at most FPS a second): every frame while something moves (a hop, the
// die, the camera, an action), at rest only a blink's frame, nothing while paused. In the logic mode (testMode.ts
// drawOff) the frames run and nothing is drawn, and no model is loaded (each player its stand-in pawn).
import {
  AmbientLight, CapsuleGeometry, Color, DirectionalLight, Fog, Group, HemisphereLight, Mesh, MeshLambertMaterial, PerspectiveCamera, Quaternion, Scene, SphereGeometry, Vector3
} from 'three';
import type { Look } from '#lib/contract/look.ts';
import type { Who } from '#lib/types.ts';
import { staticUrl } from '#lib/staticUrl.ts';
import { testHooks } from '#lib/ui-state/testMode.ts';
import { createStage, watchContext } from '#lib/components/world3d/stage.ts';
import { person3, type Dirs, type Person3 } from '#lib/components/person3d/person3d.ts';
import type { Villager3D } from '#lib/components/villager3d/villager3d.ts';
import { ACTION_MS } from '#lib/components/villager3d/poses.ts';
import { buildIsland } from './scenery.ts';
import type { Board } from '#lib/sugoroku/board.ts';
import { buildDie } from './die.ts';
import { DIE_SIZE, FOV, HOP_MS, PERSON_H, ROLL_MS, cameraFor, forkAim, hopAt, hopsOf, restOf, slotOf, stoneAt, topOf, tumbleAt, visibleOf } from './plan.ts';

/** A seat at the table: who, the look they wear (store/look.ts lookOf), their villager pref (the `villager` pref:
 *  drawn for a villager look). @public (the game sheet, once wired) */
export interface BoardPerson { who: Who; look: Look; villager?: string | null }
export type Celebration = 'joy' | 'small' | 'sad-free';

export interface Board3DOpts {
  /** Where the models are (default the site's room/villagers3d/ and room/player/). */
  dirs?: Dirs;
  /** The canvas's size till it's laid out (CSS px). */
  at?: [number, number];
}

export interface Board3D {
  /** The players in turn order (k = the index): a seat whose who and look stay keeps its model and its stone; a new one
   *  stands on ふりだし. */
  setPlayers(people: readonly BoardPerson[]): void;
  /** Player k put on a space at once (a walk under way ends there). */
  place(k: number, space: number): void;
  /** Player k hops along `path` (the board's spaces in order, board.ts pathOf: the fork's branch already in it), HOP_MS
   *  a stone; resolves on the last. */
  walk(k: number, path: readonly number[]): Promise<void>;
  /** Player k's reaction: `joy` two hops and a beaming face, `small` a hop and a smile, `sad-free` a wave and a smile
   *  (a miss is never sad: docs/sugoroku.md "The 3D board"). */
  celebrate(k: number, kind: Celebration): void;
  /** The camera eases to follow player k. */
  focus(k: number): void;
  /** The die tossed beside the player in focus, landing on `n` (1–6) after ROLL_MS; it rests there till the next walk. */
  roll(n: number): Promise<void>;
  /** The canvas's CSS size read again (its ResizeObserver does this too). */
  resize(): void;
  /** What the overlays cover of the canvas (CSS px from its top and bottom): the camera frames the part between
   *  (plan.ts visibleOf), easing there; the canvas itself stays the size it is. */
  setInsets(top: number, bottom: number): void;
  /** A fork's choice on: the camera between the two ways, wider. */
  setFork(on: boolean): void;
  /** No frames (under a sheet, the turn's English full screen): a walk or roll under way finishes at once. */
  pause(): void;
  resume(): void;
  /** The space player k stands on (where its walk ends, while it walks). */
  at(k: number): number;
  dispose(): void;
}

interface Seat {
  who: Who;
  person: Person3;
  /** Its stand-in till the model's in (and in the logic mode). */
  pawn: Group;
  v3: Villager3D | null;
  space: number;
  /** Where it's drawn (world) and its facing. */
  x: number; y: number; z: number; yaw: number;
  walk: { hops: { a: number; b: number }[]; t0: number; done: () => void } | null;
  /** A face held till this time (ms; a celebration's). */
  faceTill: number;
}

const PAWN_COLOUR: Record<Who, number> = { A: 0x4f9be0, B: 0xf08aa0, G: 0xcdb4f2 };
/** A model's scale: NH's villager is 80u tall in its own group (villager3d VILLAGER_S). */
const V3_SCALE = PERSON_H / 80;
/** The camera's ease (ms to close ~63 % of the way). */
const CAM_TAU = 220;

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

export function createBoard3D(canvas: HTMLCanvasElement, board: Board, opts: Board3DOpts = {}): Board3D {
  const dirs: Dirs = opts.dirs ?? { villagers: staticUrl('room/villagers3d/'), player: staticUrl('room/player/') };
  const scene = new Scene();
  const sky = new Color(0xbfe6f4);
  scene.background = sky;
  scene.fog = new Fog(sky, 900, 1700);
  // NH's warm day: a sky-and-grass fill, a low warm sun from the left behind the camera, a touch of ambient
  scene.add(new HemisphereLight(0xfff6e2, 0x9ac276, 1.5));
  const sun = new DirectionalLight(0xfff0d6, 1.7);
  sun.position.set(-120, 260, 160);
  scene.add(sun, new AmbientLight(0xffe8cc, 0.25));
  scene.add(buildIsland(board));
  const die = buildDie();
  scene.add(die.group);
  const camera = new PerspectiveCamera(FOV, 1, 10, 2400);

  const seats: Seat[] = [];
  let focusK = 0, paused = false, gone = false, lastT = 0, camSet = false;
  const camPos = new Vector3(), camAt = new Vector3();
  /** The canvas's CSS size; the overlays' insets wanted, and as eased so far (the camera's ease). */
  let cw = opts.at?.[0] ?? 300, ch = opts.at?.[1] ?? 150, fork = false, insetSet = false;
  const inset = { top: 0, bottom: 0 }, insetNow = { top: 0, bottom: 0 }, view = { w: 0, h: 0, top: -1, hv: 0 };
  /** The projection for the visible part (the canvas drawn whole, framed by the part between the overlays). */
  function frameView() {
    const v = visibleOf(ch, insetNow.top, insetNow.bottom);
    if (view.w === cw && view.h === ch && Math.abs(view.top - v.top) < 0.05 && Math.abs(view.hv - v.hv) < 0.05) return;
    Object.assign(view, { w: cw, h: ch }, v);
    camera.aspect = cw / v.hv;
    camera.setViewOffset(cw, v.hv, 0, -v.top, cw, ch);
    camera.updateProjectionMatrix();
  }
  /** Whether the scene as it stands has been drawn (a change from outside clears it: one frame then). */
  let drawn = false, frames = 0;
  const redraw = () => {
    drawn = false;
    stage.kick();
  };
  const hooked = testHooks();
  let roll: { t0: number; n: number; rest: Quaternion; axis: Vector3; from: Vector3; to: Vector3; done: () => void } | null = null;

  // (kept light for an iPhone: 1.5× pixels, not 2–3×; the board's few flat shapes need no more)
  const stage = createStage(canvas, { antialias: true, dpr: Math.min(1.5, globalThis.devicePixelRatio || 1), power: 'default', at: opts.at }, frame, (w, h) => {
    (cw = w), (ch = h);
    frameView();
  });
  const { renderer, noDraw } = stage;
  // a lost context (iOS taking the GPU's memory back under pressure): logged both ways (gl.lost), three restores what it
  // can and the board is drawn again once it's back (Board3D falls back to the 2D map if it never comes)
  const unwatchGL = watchContext(canvas, 'sugoroku', redraw);

  // ---- the people ----
  const pawnBody = new CapsuleGeometry(5, 9, 4, 10).translate(0, 9.5, 0), pawnHead = new SphereGeometry(5.5, 14, 10).translate(0, 22, 0);
  const pawnMats = new Map<Who, MeshLambertMaterial>(), skin = new MeshLambertMaterial({ color: 0xffe2c4 });
  function pawnOf(who: Who): Group {
    let m = pawnMats.get(who);
    if (!m) pawnMats.set(who, (m = new MeshLambertMaterial({ color: PAWN_COLOUR[who] })));
    const g = new Group();
    g.add(new Mesh(pawnBody, m), new Mesh(pawnHead, skin));
    return g;
  }
  function dropModel(s: Seat) {
    if (s.v3) (scene.remove(s.v3.group), s.v3.dispose(), (s.v3 = null));
  }
  function loadModel(k: number, s: Seat) {
    if (noDraw || !s.person.has3d) return;
    const p = s.person.create(s.who.charCodeAt(0) * 0.7 + k);
    void p?.then((v) => {
      if (gone || seats[k] !== s) return v.dispose();
      dropModel(s);
      s.v3 = v;
      v.group.scale.setScalar(V3_SCALE);
      v.lift(0.32);
      scene.add(v.group);
      s.pawn.visible = false;
      redraw();
    }, () => {});
  }
  function removeSeat(s: Seat) {
    s.walk?.done();
    dropModel(s);
    scene.remove(s.pawn);
  }
  /** Each standing seat's spot on its stone, side by side with whoever shares it. */
  function settle() {
    const by = new Map<number, Seat[]>();
    for (const s of seats) if (!s.walk) by.set(s.space, [...(by.get(s.space) ?? []), s]);
    for (const [space, list] of by) list.forEach((s, n) => {
      const [x, z] = stoneAt(board, space), [dx, dz] = slotOf(n, list.length);
      s.x = x + dx;
      s.z = z + dz;
      s.y = topOf(board, space);
    });
  }
  function finishWalk(s: Seat) {
    const w = s.walk;
    if (!w) return;
    s.walk = null;
    s.space = w.hops.at(-1)?.b ?? s.space;
    s.v3?.set('idle');
    settle();
    w.done();
  }
  function finishRoll() {
    if (!roll) return;
    const r = roll;
    roll = null;
    die.cube.quaternion.copy(r.rest);
    die.cube.position.y = DIE_SIZE / 2;
    die.group.position.copy(r.to);
    r.done();
  }

  // ---- the frame ----
  const tmp = new Vector3();
  function frame(t: number): number {
    if (gone || paused) return Infinity;
    const dt = lastT ? Math.min(100, t - lastT) : 16;
    lastT = t;
    let moving = false;
    for (const s of seats) {
      let moved = 0;
      if (s.walk) {
        const w = s.walk, i = Math.max(0, Math.floor((t - w.t0) / HOP_MS));
        if (i >= w.hops.length) finishWalk(s);
        else {
          const h = w.hops[i], p = hopAt(board, h.a, h.b, (t - w.t0 - i * HOP_MS) / HOP_MS);
          moved = Math.hypot(p.x - s.x, p.z - s.z);
          s.x = p.x;
          s.y = p.y;
          s.z = p.z;
          s.yaw += wrap(p.yaw - s.yaw) * Math.min(1, dt / 60);
          moving = true;
        }
      }
      // at rest it turns back to face the camera
      if (!s.walk && Math.abs(wrap(s.yaw)) > 0.01) {
        s.yaw -= wrap(s.yaw) * Math.min(1, dt / 120);
        moving = true;
      }
      for (const g of [s.pawn, s.v3?.group]) if (g) (g.position.set(s.x, s.y, s.z), (g.rotation.y = s.yaw));
      if (s.faceTill && t >= s.faceTill) (s.faceTill = 0, s.v3?.face(null));
      // (the legs' stride at a steady pace whatever the hop's length: a step a stone)
      if (s.v3 && s.v3.step(t, s.walk ? (200 * dt) / 1000 : moved, s.walk ? 200 : 0)) moving = true;
    }
    if (roll) {
      const u = (t - roll.t0) / ROLL_MS;
      if (u >= 1) finishRoll();
      else {
        const { q, h, d } = tumbleAt(u, roll.rest, roll.axis, die.cube.quaternion);
        die.cube.quaternion.copy(q);
        die.group.position.lerpVectors(roll.from, roll.to, d);
        die.cube.position.y = DIE_SIZE / 2 + h;
        die.shadow.scale.setScalar(1 / (1 + h / 30));
        moving = true;
      }
    }
    // the camera after the player in focus (a fork's choice: between the ways), framed by the part the overlays leave
    const k = camSet ? 1 - Math.exp(-dt / CAM_TAU) : 1;
    for (const e of ['top', 'bottom'] as const) {
      if (Math.abs(inset[e] - insetNow[e]) > 0.5) (insetNow[e] += (inset[e] - insetNow[e]) * k), (moving = true);
      else insetNow[e] = inset[e];
    }
    frameView();
    const f = seats[focusK], aim = fork && f && board.forks.includes(f.space) ? forkAim(board, f.space) : null;
    const want = aim ? cameraFor(board, aim.x, aim.z, camera.aspect, aim.wide) : cameraFor(board, f ? f.x : 0, f ? f.z : stoneAt(board, 0)[1], camera.aspect);
    tmp.set(...want.pos);
    camSet = true;
    if (camPos.distanceToSquared(tmp) > 0.01) moving = true;
    camPos.lerp(tmp, k);
    camAt.lerp(tmp.set(...want.at), k);
    camera.position.copy(camPos);
    camera.lookAt(camAt);
    let blinked = false;
    if (!moving) for (const s of seats) if (s.v3?.blink(t)) blinked = true;
    if (!noDraw && (moving || blinked || !drawn)) {
      renderer.render(scene, camera);
      drawn = true;
      frames++;
    }
    if (moving) return 0;
    let next = Infinity;
    for (const s of seats) if (s.v3) next = Math.min(next, s.v3.nextBlink(t));
    for (const s of seats) if (s.faceTill) next = Math.min(next, s.faceTill - t);
    return Math.max(16, next);
  }
  const api: Board3D = {
    setPlayers(people) {
      people.forEach((p, k) => {
        const person = person3(p.who, p.look, p.villager, dirs), was = seats[k];
        if (was && was.who === p.who && was.person.key === person.key) return;
        if (was && was.who === p.who) {
          // a new look: the model swapped where it stands
          was.person = person;
          was.pawn.visible = !was.v3;
          loadModel(k, was);
          return;
        }
        if (was) removeSeat(was);
        const pawn = pawnOf(p.who);
        scene.add(pawn);
        const s: Seat = { who: p.who, person, pawn, v3: null, space: was?.space ?? 0, x: 0, y: 0, z: 0, yaw: 0, walk: null, faceTill: 0 };
        seats[k] = s;
        loadModel(k, s);
      });
      for (const s of seats.splice(people.length)) removeSeat(s);
      focusK = Math.min(focusK, Math.max(0, seats.length - 1));
      settle();
      redraw();
    },
    place(k, space) {
      const s = seats[k];
      if (!s) return;
      if (s.walk) finishWalk(s);
      s.space = space;
      settle();
      redraw();
    },
    walk(k, path) {
      const s = seats[k];
      if (!s) return Promise.resolve();
      if (s.walk) finishWalk(s);
      const hops = hopsOf(board, s.space, path);
      if (!hops.length) return Promise.resolve();
      die.group.visible = false;
      return new Promise<void>((done) => {
        s.walk = { hops, t0: performance.now(), done };
        s.v3?.set('walk');
        settle();
        if (paused) finishWalk(s);
        stage.kick();
      });
    },
    celebrate(k, kind) {
      const s = seats[k];
      if (!s?.v3) return;
      const [a, face] = kind === 'joy' ? (['jump', 'joy'] as const) : kind === 'small' ? (['hop', 'happy'] as const) : (['wave', 'happy'] as const);
      s.v3.act(a);
      s.v3.face(face);
      s.faceTill = performance.now() + ACTION_MS[a] + 300;
      stage.kick();
    },
    focus(k) {
      if (!seats[k]) return;
      focusK = k;
      stage.kick();
    },
    roll(n) {
      finishRoll();
      const f = seats[focusK];
      const [x, z] = f ? [f.x, f.z] : stoneAt(board, 0);
      // (beside the player on the screen's middle side, toward the camera; tossed in from the camera's side)
      const side = x < 0 ? 1 : -1;
      const to = new Vector3(x + side * 24, 0, z + 16), from = new Vector3(x + side * 60, 0, z + 70);
      const yaw = Math.random() * Math.PI * 2, axis = new Vector3(Math.random() - 0.5, 0, -1).normalize();
      die.group.visible = true;
      die.group.position.copy(from);
      return new Promise<void>((done) => {
        roll = { t0: performance.now(), n, rest: restOf(n, yaw), axis, from, to, done };
        if (paused) finishRoll();
        stage.kick();
      });
    },
    resize() {
      const w = Math.round(canvas.clientWidth), h = Math.round(canvas.clientHeight);
      if (w < 8 || h < 8) return;
      renderer.setSize(w, h, false);
      (cw = w), (ch = h);
      frameView();
      redraw();
    },
    setInsets(top, bottom) {
      if (top === inset.top && bottom === inset.bottom) return;
      inset.top = top;
      inset.bottom = bottom;
      // (the first: at once, not eased in from nothing)
      if (!insetSet) Object.assign(insetNow, inset), (insetSet = true), (camSet = false), frameView();
      stage.kick();
    },
    setFork(on) {
      if (fork === on) return;
      fork = on;
      stage.kick();
    },
    pause() {
      paused = true;
      for (const s of seats) finishWalk(s);
      finishRoll();
    },
    resume() {
      if (!paused) return;
      paused = false;
      lastT = 0;
      redraw();
    },
    at: (k) => {
      const s = seats[k];
      return s ? (s.walk?.hops.at(-1)?.b ?? s.space) : 0;
    },
    dispose() {
      if (gone) return;
      for (const s of seats) (s.walk?.done(), (s.walk = null));
      roll?.done();
      roll = null;
      gone = true;
      unwatchGL();
      if (hooked) delete (window as { __sugoroku3d?: unknown }).__sugoroku3d;
      // (the models' shared resources released off this renderer too, then each model let go of: villager3d's cache)
      stage.dispose([scene], [pawnBody, pawnHead, skin, ...pawnMats.values()]);
      for (const s of seats) s.v3?.dispose();
      seats.length = 0;
    }
  };

  // the e2e's and the console's look (testMode.ts testHooks: never on a live phone)
  if (hooked) {
    (window as { __sugoroku3d?: unknown }).__sugoroku3d = {
      at: (k: number) => api.at(k),
      models: () => seats.map((s) => (s.v3 ? s.person.key : null)),
      busy: () => !!roll || seats.some((s) => s.walk),
      frames: () => frames,
      framed: () => ({ w: view.w, h: view.h, top: view.top, hv: view.hv }),
      calls: () => renderer.info.render.calls
    };
  }
  return api;
}
