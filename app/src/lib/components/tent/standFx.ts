// The uses stood at, what moves besides the user (docs/design.md "The gym": Stood at): the prop in the hands (the cook's
// pot or kettle, the hammer, the book, a drink, the camera, the phone, a dart, the cue, a ball: world3d/heldProps.ts,
// placed each frame at the hands as benchBar.ts heldAt places a held piece; the hammer and the dart along the arm), the
// cook's steam and the sizzle of its tosses, the hammer's sparks, a drink's pour, the camera's flash, a dart flying to the
// board and stuck there, a ball shot at the hoop, kicked into the goal, a ball piece kicked away rolling and back. The
// synced uses' (a seat's: every phone the same, off the wall clock and the user's seed, as its pose) draw on the use's
// own ambient frames; a one-off (this phone's) asks for the full rate while it lasts. Nothing goes over the relay.
import {
  Box3, BoxGeometry, BufferGeometry, CanvasTexture, Float32BufferAttribute, Group, Matrix4, Mesh, MeshBasicMaterial, MeshLambertMaterial, PlaneGeometry, Points,
  PointsMaterial, Quaternion, SRGBColorSpace, Vector3, AdditiveBlending, type Camera, type Object3D
} from 'three';
import { clamp01, smooth01 } from '#lib/math.ts';
import { heldAt, type Held } from '../world3d/benchBar.ts';
import { ACT_PIECES, PROPS, STAND_PIECES, type PropName } from '../world3d/heldProps.ts';
import { ACTS, heldIn, hitAt, isStandUse, tossAt, type Act, type Once } from '../villager3d/poses-stand.ts';
import type { Villager3D } from '../villager3d/villager3d.ts';

/** Someone on a piece stood at (its seat's use), and their seed (poses' cyc: the pose's phase, so the fx's). */
export interface StandOn {
  key: string;
  v: Villager3D | null;
  id: string;
  use?: string;
  seed: number;
}
/** A one-off playing (engine.ts act): who, at what piece, which, since when (now's clock). */
export interface ActOn {
  key: string;
  v: Villager3D | null;
  id: string;
  act: Once;
  t0: number;
}
interface Drawn {
  item: string;
  root: Object3D;
  body: Object3D | null;
}

export interface StandFx {
  /** One frame (`t` now's clock, `wall` the loops' clock: villager3d/loopClock.ts). True while a one-off's own motion
   *  wants the full rate (a dart or a ball in the air, a ball rolling). */
  step(on: readonly StandOn[], acts: readonly ActOn[], piece: (id: string) => Drawn | null, t: number, wall: number): boolean;
  /** The e2e's: the prop in `key`'s hands (null: none), whether it's drawn there, and the fx shown at a piece. */
  state(key: string, id?: string): { prop: PropName | null; held: boolean; fx: string[] };
  dispose(): void;
}

/** A dart's flight, a ball's to the hoop and down through it, kicked into the goal; a ball piece's roll away, a wait,
 *  its roll back (ms). */
const FLY = { dart: 260, shoot: 720, drop: 420, goal: 600, roll: 700, wait: 450, back: 1000 } as const;
/** How far a kicked ball rolls (model units); a dart stays in the board this long after the throw's end (ms). */
const ROLL = 22, STUCK_MS = 1600;
/** A hash of i in 0…1 (the particles' own offsets: the same each frame). */
const h1 = (i: number) => ((Math.sin(i * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1;

let puffTex: CanvasTexture | null = null;
const puff = () => {
  if (puffTex) return puffTex;
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const g = c.getContext('2d')!, gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 32, 32);
  puffTex = new CanvasTexture(c);
  puffTex.colorSpace = SRGBColorSpace;
  return puffTex;
};

/** The props built in code (a few boxes each, their foot's middle at 0, y up, x across): the hammer (a handle, a
 *  head), a dart (along z, its point at +z), the cue (along x, its tip at +x). */
function built(b: 'hammer' | 'dart' | 'cue'): Object3D {
  const g = new Group(), wood = new MeshLambertMaterial({ color: 0xa0703f }), metal = new MeshLambertMaterial({ color: 0x8c949c });
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, m: MeshLambertMaterial) => {
    const mesh = new Mesh(new BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z);
    g.add(mesh);
  };
  if (b === 'hammer') {
    box(0.42, 3.4, 0.42, 0, 1.7, 0, wood);
    box(0.8, 0.8, 1.9, 0, 3.3, 0.2, metal);
  } else if (b === 'dart') {
    box(0.18, 0.18, 1.8, 0, 0, 0, metal);
    box(0.06, 0.6, 0.6, 0, 0, -0.9, new MeshLambertMaterial({ color: 0xd8473d }));
  } else {
    box(18, 0.32, 0.32, 0, 0, 0, wood);
    box(0.8, 0.36, 0.36, 9.2, 0, 0, new MeshLambertMaterial({ color: 0xf2efe6 }));
  }
  return g;
}

/** Points of `n` puffs (a colour, a size), drawn over the room. */
function cloud(n: number, color: number, size: number): Points {
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute('color', new Float32BufferAttribute(new Float32Array(n * 4), 4));
  const p = new Points(g, new PointsMaterial({ map: puff(), size, transparent: true, depthWrite: false, vertexColors: true, color, sizeAttenuation: true }));
  p.frustumCulled = false;
  p.renderOrder = 3;
  return p;
}

export function createStandFx(scene: Object3D, camera: Camera, load: (code: string) => Promise<{ scene: Object3D } | null>, dirty: () => void): StandFx {
  /** The props' models (one load each), and each user's prop as drawn. */
  const models = new Map<PropName, Object3D | null>();
  const props = new Map<string, { name: PropName; obj: Object3D }>();
  /** The particles by piece and kind ("<id>:steam"), and which were shown this frame. */
  const clouds = new Map<string, Points>();
  /** A one-off's own motion after its moment (a dart's, a ball's: its own object; a ball piece's roll), by user. */
  const shots = new Map<string, { id: string; act: Act; t0: number; from: Vector3 | null; obj: Object3D | null; dir: Vector3 | null }>();
  let flash: Mesh | null = null;
  const boxes = new Map<string, Box3>();
  const l = new Vector3(), r = new Vector3(), head = new Vector3(), fwd = new Vector3(), m4 = new Matrix4(), v = new Vector3(), w = new Vector3();
  const q = new Quaternion(), side = new Vector3(), up = new Vector3(0, 1, 0), arm = new Vector3(), ax = new Vector3(), ay = new Vector3(), az = new Vector3();

  const modelOf = (name: PropName): Object3D | null => {
    if (models.has(name)) return models.get(name)!;
    const p = PROPS[name];
    if ('b' in p) {
      models.set(name, built(p.b));
      return models.get(name)!;
    }
    models.set(name, null);
    void load(p.m).then((g) => {
      if (g) (models.set(name, g.scene), dirty());
    });
    return null;
  };
  const objOf = (name: PropName): Object3D | null => {
    const m = modelOf(name);
    if (!m) return null;
    const o = m.clone(true);
    o.matrixAutoUpdate = false;
    o.traverse((n) => void ((n as Mesh).isMesh && ((n as Mesh).castShadow = false)));
    return o;
  };
  /** The hands, the head and the forward of a villager now (false: no model). */
  const handsOf = (vv: Villager3D | null): boolean => {
    if (!vv || !vv.hands(l, r)) return false;
    const hb = vv.head();
    if (hb) hb.getWorldPosition(head);
    else head.set((l.x + r.x) / 2, (l.y + r.y) / 2 + 5, (l.z + r.z) / 2);
    fwd.set(Math.sin(vv.group.rotation.y), 0, Math.cos(vv.group.rotation.y));
    return true;
  };
  /** A prop along the right arm (the hammer's handle across it, raised; the dart along it): from the shoulder (below the
   *  head, out to the right) to the hand. */
  const alongArm = (out: Matrix4, vv: Villager3D, h: Held, tilt: number) => {
    const feet = vv.group.getWorldPosition(w), tall = head.y - feet.y;
    side.crossVectors(fwd, up).normalize();
    arm.copy(head).addScaledVector(up, -0.5 * tall).addScaledVector(side, 0.12 * tall);
    arm.subVectors(r, arm).normalize();
    // (in the plane of the arm and the side: the arm's direction turned up by `tilt`)
    ax.copy(side);
    ay.copy(arm).applyAxisAngle(side, -tilt);
    az.crossVectors(ax, ay).normalize();
    ay.crossVectors(az, ax).normalize();
    q.setFromRotationMatrix(m4.makeBasis(ax, ay, az));
    out.compose(r, q, v.setScalar(h.scale)).multiply(m4.makeTranslation(-h.grip[0], -h.grip[1], -h.grip[2]));
  };
  const place = (key: string, name: PropName, vv: Villager3D) => {
    let p = props.get(key);
    if (p && p.name !== name) (p.obj.removeFromParent(), props.delete(key), (p = undefined));
    if (!p) {
      const obj = objOf(name);
      if (!obj) return;
      p = { name, obj };
      props.set(key, p);
      scene.add(obj);
      dirty();
    }
    const h = PROPS[name] as Held;
    if (name === 'hammer') alongArm(p.obj.matrix, vv, h, 1.25);
    else if (name === 'dart') alongArm(p.obj.matrix, vv, h, Math.PI / 2);
    else heldAt(p.obj.matrix, p.obj.matrix, h, l, r, head, fwd, 1);
    p.obj.matrixWorldNeedsUpdate = true;
  };
  const boxOf = (id: string, d: Drawn): Box3 => {
    let b = boxes.get(id);
    if (!b) {
      d.root.updateMatrixWorld(true);
      b = new Box3().setFromObject(d.body ?? d.root);
      if (d.body) boxes.set(id, b);
    }
    return b;
  };
  /** A piece's front (its root's +z) in the room. */
  const frontOf = (d: Drawn, out: Vector3) => out.set(Math.sin(d.root.rotation.y), 0, Math.cos(d.root.rotation.y));
  const cloudAt = (key: string, n: number, color: number, size: number, shown: Set<string>): Points => {
    let c = clouds.get(key);
    if (!c) {
      c = cloud(n, color, size);
      scene.add(c);
      clouds.set(key, c);
    }
    c.visible = true;
    shown.add(key);
    return c;
  };
  /** Each puff of a cloud: its spot and its alpha. */
  const fill = (c: Points, f: (i: number, n: number, out: Vector3) => number) => {
    const pos = c.geometry.getAttribute('position') as Float32BufferAttribute, col = c.geometry.getAttribute('color') as Float32BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const a = f(i, pos.count, v);
      pos.setXYZ(i, v.x, v.y, v.z);
      col.setXYZW(i, 1, 1, 1, a);
    }
    pos.needsUpdate = col.needsUpdate = true;
  };
  /** A point on an arc from a to b, k of the way, `lift` over the straight line at its middle. */
  const arc = (out: Vector3, a: Vector3, b: Vector3, k: number, lift: number) => out.lerpVectors(a, b, k).setY(a.y + (b.y - a.y) * k + 4 * lift * k * (1 - k));

  return {
    step(on, acts, piece, t, wall) {
      let moving = false;
      const want = new Map<string, { name: PropName; v: Villager3D }>(), shown = new Set<string>();
      // the synced uses: their props, the cook's steam and sizzle, the hammer's sparks
      for (const o of on) {
        if (!isStandUse(o.use)) continue;
        const d = piece(o.id), spec = d && STAND_PIECES[d.item];
        if (!d || !spec) continue;
        const has = handsOf(o.v);
        if (spec.prop && has) want.set(o.key, { name: spec.prop, v: o.v! });
        const b = boxOf(o.id, d);
        if (o.use === 'cook') {
          const cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2, top = b.max.y, wx = (b.max.x - b.min.x) * 0.2, wz = (b.max.z - b.min.z) * 0.2;
          fill(cloudAt(`${o.id}:steam`, 8, 0xffffff, 9, shown), (i, n, out) => {
            const k = (wall / 2400 + i / n) % 1;
            out.set(cx + (h1(i) - 0.5) * 2 * wx + Math.sin(wall / 800 + i) * 0.5 * k, top + 0.5 + 8 * k, cz + (h1(i + 5) - 0.5) * 2 * wz);
            return 0.5 * Math.sin(Math.PI * k);
          });
          const toss = tossAt(wall, o.seed);
          if (toss > 0.05 && has) {
            fill(cloudAt(`${o.id}:sizzle`, 6, 0xffa040, 1.6, shown), (i, _n, out) => {
              const a = h1(i + 3) * Math.PI * 2;
              out.set((l.x + r.x) / 2 + Math.cos(a) * 1.4, (l.y + r.y) / 2 + 1 + toss * (2 + 2 * h1(i)), (l.z + r.z) / 2 + Math.sin(a) * 1.4);
              return toss;
            });
          }
        }
        if (o.use === 'hammer' && has && hitAt(wall, o.seed, 0.16)) {
          const p = props.get(o.key);
          if (p) {
            w.setFromMatrixPosition(p.obj.matrix);
            fill(cloudAt(`${o.id}:sparks`, 6, 0xffe08a, 1.3, shown), (i, _n, out) => {
              const a = h1(i + 7) * Math.PI * 2;
              out.set(w.x + Math.cos(a) * (0.8 + h1(i)), w.y + 0.5 + h1(i + 2) * 1.5, w.z + Math.sin(a) * (0.8 + h1(i)));
              return 0.9;
            });
          }
        }
      }
      // the one-offs: their props till let go of, then their own flight
      for (const a of acts) {
        const d = piece(a.id), spec = d && (ACT_PIECES[d.item] ?? STAND_PIECES[d.item]);
        if (!d || !spec) continue;
        const u = t - a.t0, has = handsOf(a.v);
        if (spec.prop && has && heldIn(a.act, u)) want.set(a.key, { name: spec.prop, v: a.v! });
        const s = shots.get(a.key);
        if ((!s || s.t0 !== a.t0) && (a.act === 'dart' || a.act === 'shoot' || a.act === 'kick') && u >= ACTS[a.act].at) {
          // let go of: its own object from the hands (a ball piece kicked: the piece itself, from where it stands)
          const held = props.get(a.key);
          const from = held ? new Vector3().setFromMatrixPosition(held.obj.matrix) : a.v ? a.v.group.getWorldPosition(new Vector3()) : null;
          let obj: Object3D | null = null;
          if (spec.prop && a.act !== 'kick') {
            obj = held?.obj ?? null;
            if (held) props.delete(a.key);
          } else if (spec.prop) {
            obj = objOf(spec.prop);
            if (obj) scene.add(obj);
          }
          const dir = a.v ? d.root.getWorldPosition(new Vector3()).sub(a.v.group.getWorldPosition(new Vector3())).setY(0).normalize() : null;
          if (s?.obj && s.obj !== obj) s.obj.removeFromParent();
          shots.set(a.key, { id: a.id, act: a.act, t0: a.t0, from, obj, dir });
        }
        if (a.act === 'sip' && u > 250 && u < 1300 && has) {
          const b = boxOf(a.id, d);
          frontOf(d, w);
          const sx = (b.min.x + b.max.x) / 2 + w.x * (b.max.x - b.min.x) * 0.3, sz = (b.min.z + b.max.z) / 2 + w.z * (b.max.z - b.min.z) * 0.3, sy = b.min.y + (b.max.y - b.min.y) * 0.7;
          fill(cloudAt(`${a.id}:pour`, 8, 0xc8a070, 1.1, shown), (i, n, out) => {
            const k = (u / 300 + i / n) % 1;
            out.set(sx + (r.x - sx) * k, sy + (r.y + 0.6 - sy) * k * k, sz + (r.z - sz) * k);
            return 0.85;
          });
        }
        if (a.act === 'photo' && Math.abs(u - ACTS.photo.at) < 140) {
          const p = props.get(a.key);
          if (p) {
            flash ??= new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: puff(), color: 0xffffff, transparent: true, depthWrite: false, blending: AdditiveBlending }));
            if (!flash.parent) scene.add(flash);
            flash.position.setFromMatrixPosition(p.obj.matrix).addScaledVector(fwd, 2).addScaledVector(up, 1);
            flash.quaternion.copy(camera.quaternion);
            flash.scale.setScalar(9 * (1 - Math.abs(u - ACTS.photo.at) / 140));
            flash.visible = true;
            shown.add('flash');
          }
        }
        moving = true;
      }
      // the flights after the moment: a dart to the board (stuck), a ball to the hoop and down through it, into the goal,
      // a ball piece away and back
      for (const [key, s] of shots) {
        const d = piece(s.id), u = t - s.t0 - ACTS[s.act].at, end = ACTS[s.act].ms - ACTS[s.act].at;
        if (!d || !s.from) {
          s.obj?.removeFromParent();
          shots.delete(key);
          continue;
        }
        const b = boxOf(s.id, d);
        frontOf(d, w);
        const cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2, H = b.max.y - b.min.y, dx = b.max.x - b.min.x, dz = b.max.z - b.min.z;
        let done = false;
        if (s.act === 'dart' && s.obj) {
          const tgt = new Vector3(cx + w.x * dx * 0.5, b.min.y + 0.72 * H, cz + w.z * dz * 0.5), k = clamp01(u / FLY.dart);
          arc(v, s.from, tgt, k, 0.6);
          s.obj.matrix.setPosition(v);
          s.obj.matrixWorldNeedsUpdate = true;
          done = u > end + STUCK_MS;
        } else if (s.act === 'shoot' && s.obj) {
          const rim = new Vector3(cx + w.x * dx * 0.22, b.min.y + 0.78 * H, cz + w.z * dz * 0.22);
          if (u < FLY.shoot) arc(v, s.from, rim, u / FLY.shoot, 6);
          else v.copy(rim).setY(rim.y - (rim.y - b.min.y - 2) * smooth01(clamp01((u - FLY.shoot) / FLY.drop)));
          s.obj.matrix.setPosition(v);
          s.obj.matrixWorldNeedsUpdate = true;
          done = u > FLY.shoot + FLY.drop + 500;
        } else if (s.act === 'kick' && s.obj) {
          const goal = new Vector3(cx - w.x * dz * 0.15, b.min.y + 0.3 * H, cz - w.z * dz * 0.15);
          arc(v, s.from.clone().addScaledVector(s.dir ?? w, 3).setY(b.min.y + 1.5), goal, clamp01(u / FLY.goal), 3);
          s.obj.matrix.setPosition(v);
          s.obj.matrixWorldNeedsUpdate = true;
          done = u > FLY.goal + 900;
        } else if (s.act === 'kick' && d.body && s.dir) {
          // the ball piece itself rolls off along the kick and comes back (its body in its root's frame)
          const out = u < FLY.roll ? 1 - (1 - u / FLY.roll) ** 2 : u < FLY.roll + FLY.wait ? 1 : 1 - smooth01(clamp01((u - FLY.roll - FLY.wait) / FLY.back));
          const ry = d.root.rotation.y, lx = s.dir.x * Math.cos(ry) - s.dir.z * Math.sin(ry), lz = s.dir.x * Math.sin(ry) + s.dir.z * Math.cos(ry);
          d.body.position.set(lx * ROLL * out, 0, lz * ROLL * out);
          d.body.rotation.set(lz * out * (ROLL / 2.6), 0, -lx * out * (ROLL / 2.6));
          done = u > FLY.roll + FLY.wait + FLY.back;
          if (done) (d.body.position.set(0, 0, 0), d.body.rotation.set(0, 0, 0));
        } else done = true;
        if (done) {
          s.obj?.removeFromParent();
          shots.delete(key);
          dirty();
        } else moving = true;
      }
      // the props: placed, or gone
      for (const [key, x] of want) place(key, x.name, x.v);
      for (const [key, p] of props) if (!want.has(key)) (p.obj.removeFromParent(), props.delete(key), dirty());
      for (const [key, c] of clouds) if (!shown.has(key)) c.visible = false;
      if (flash && !shown.has('flash')) flash.visible = false;
      return moving;
    },
    state(key, id) {
      const p = props.get(key);
      const fx = id ? [...clouds].filter(([k, c]) => c.visible && k.startsWith(`${id}:`)).map(([k]) => k.slice(id.length + 1)) : [];
      if (flash?.visible) fx.push('flash');
      if ([...shots.values()].some((s) => s.id === id)) fx.push('flying');
      return { prop: p?.name ?? null, held: !!p?.obj.parent, fx };
    },
    dispose() {
      for (const p of props.values()) p.obj.removeFromParent();
      for (const s of shots.values()) s.obj?.removeFromParent();
      for (const c of clouds.values()) {
        c.removeFromParent();
        c.geometry.dispose();
        (c.material as PointsMaterial).dispose();
      }
      flash?.removeFromParent();
      props.clear();
      clouds.clear();
      shots.clear();
    }
  };
}
