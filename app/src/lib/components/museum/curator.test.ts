import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Box3, Matrix4, Mesh, Vector3, type SkinnedMesh } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { AT, mind, RANGE, S, type Mind } from './curator.ts';
import { rigOf } from '../villager3d/rig.ts';
import type { Pose } from '../villager3d/poses.ts';
import { DESK, type Pt } from './plan.ts';

/** The museum camera's pitch (engine.ts PITCH, degrees). */
const PITCH = 47;

/** Steps `m` from t over ms at 30 a second, my villager at `me`; each step's check. */
function run(m: Mind, t: number, ms: number, me: Pt | null, each?: (t: number) => void): number {
  const end = t + ms;
  for (; t < end; t += 33) {
    m.step(t, 33, me);
    each?.(t);
  }
  return t;
}

describe('the curator (フータ): his mind', () => {
  it('breathes and looks about while alone, in one pose rewritten in place', () => {
    const m = mind(1), arrays = Object.values(m.pose.j);
    const ys: number[] = [], yaws: number[] = [];
    run(m, 0, 8000, null, () => (ys.push(m.pose.y), yaws.push(m.pose.j.Head![1])));
    expect(m.doing).toBe('idle');
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(0.15);
    expect(Math.max(...yaws) - Math.min(...yaws)).toBeGreaterThan(0.1);
    for (const v of [...ys, ...yaws]) expect(Number.isFinite(v)).toBe(true);
    expect(Object.values(m.pose.j)).toEqual(arrays);
    Object.values(m.pose.j).forEach((v, i) => expect(v).toBe(arrays[i]));
  });

  it('turns his head to my villager in front of the desk', () => {
    const m = mind(2);
    let t = run(m, 0, 1500, [30, -10]);
    expect(m.doing).toBe('look');
    expect(m.pose.j.Head![1]).toBeGreaterThan(0.2);
    t = run(m, t, 1500, [-30, -10]);
    expect(m.pose.j.Head![1]).toBeLessThan(-0.2);
    // (behind him or far off: not watched)
    run(m, t, 300, [0, 200]);
    expect(m.doing).toBe('idle');
  });

  it('nods off on his own while alone: a yawn, his head drooping to one side, eyes shut; my villager coming up wakes him with a start', () => {
    const m = mind(3);
    let dozed = -1;
    let t = run(m, 0, 40_000, null, (at) => {
      if (dozed < 0 && m.doing === 'doze') dozed = at;
    });
    expect(dozed).toBeGreaterThan(10_000);
    const n = mind(4);
    t = run(n, 0, 1000, null);
    n.doze(t);
    let opened = 0;
    t = run(n, t, 2000, null, () => (opened = Math.max(opened, n.pose.j.Mouth![0])));
    expect(opened).toBeGreaterThan(0.6);
    t = run(n, t, 2500, null);
    expect(n.doing).toBe('doze');
    expect(n.face).toBe('sleepy');
    expect(n.pose.j.Head![2]).toBeGreaterThan(0.1);
    t = run(n, t, 100, [0, -10]);
    expect(n.doing).toBe('look');
    expect(n.face).toBe('surprised');
    run(n, t, 1500, [0, -10]);
    expect(n.face).not.toBe('sleepy');
  });

  it('perks up when talked to: a hop, a wing raised as he explains, his beak moving while his line types; quiet after', () => {
    const m = mind(5);
    let t = run(m, 0, 1000, [0, -10]);
    const rest = { y: m.pose.y, l: m.pose.j.Arm_1_L![2], r: m.pose.j.Arm_1_R![2] };
    m.talk(t, 40);
    expect(m.doing).toBe('talk');
    let hop = 0, beak = 0, wing = 0;
    t = run(m, t, 1300, [0, -10], () => {
      hop = Math.max(hop, m.pose.y - rest.y);
      beak = Math.max(beak, m.pose.j.Mouth![0]);
      wing = Math.max(wing, Math.abs(m.pose.j.Arm_1_L![2] - rest.l), Math.abs(m.pose.j.Arm_1_R![2] - rest.r));
    });
    expect(hop).toBeGreaterThan(0.4);
    expect(beak).toBeGreaterThan(0.3);
    expect(wing).toBeGreaterThan(0.5);
    // the line typed: the beak still, the wing up till the balloon goes
    let moved = 0;
    t = run(m, t, 1000, [0, -10], () => (moved = Math.max(moved, m.pose.j.Mouth![0])));
    expect(moved).toBe(0);
    expect(m.doing).toBe('talk');
    m.quiet(t);
    t = run(m, t, 2000, [0, -10]);
    expect(m.doing).toBe('look');
    expect(Math.abs(m.pose.j.Arm_1_R![2] - rest.r)).toBeLessThan(0.15);
  });

  it('wakes when talked to while dozing', () => {
    const m = mind(6);
    let t = run(m, 0, 500, null);
    m.doze(t);
    t = run(m, t, 4000, null);
    m.talk(t, 20);
    run(m, t, 200, [0, -10]);
    expect(m.doing).toBe('talk');
    expect(m.face).toBe('surprised');
  });

  it('settles (he may hold his pose) once nothing of his moves but his breath: not while he talks, dozes or turns', () => {
    const m = mind(8);
    let t = run(m, 0, 300, [0, -10]);
    m.talk(t, 20);
    let talking = false;
    t = run(m, t, 1500, [0, -10], () => (talking ||= m.settled()));
    expect(talking).toBe(false);
    m.quiet(t);
    let at = -1;
    t = run(m, t, 12_000, [0, -10], (x) => at < 0 && m.settled() && (at = x));
    expect(at).toBeGreaterThan(0);
    m.doze(t);
    let dozing = false;
    t = run(m, t, 3000, null, () => (dozing ||= m.settled()));
    expect(dozing).toBe(false);
    // (resumed after a hold: nothing of his own due at once)
    const n = mind(9);
    t = run(n, 0, 2000, null);
    n.resume(t + 60_000);
    run(n, t + 60_000, 1000, null);
    expect(n.doing).toBe('idle');
  });
});

/** Every pose he takes, sampled (copies): alone for minutes (glances, every gesture, dozing off with its yawn, waking),
 *  watching my villager, talked to on either side (the wing alternates), woken by a talk, a talk cut short. */
function poses(): { what: string; p: Pose }[] {
  const out: { what: string; p: Pose }[] = [];
  const keep = (what: string, m: Mind) => out.push({ what, p: { ...m.pose, j: Object.fromEntries(Object.entries(m.pose.j).map(([k, v]) => [k, [...v]])) } });
  for (const seed of [1, 2, 3, 7, 11, 23]) {
    const m = mind(seed);
    let t = run(m, 0, 150_000, null, (at) => at % 99 === 0 && keep(`alone ${seed} ${m.doing} @${at}`, m));
    t = run(m, t, 20_000, [25, -15], (at) => at % 99 === 0 && keep(`watching ${seed} @${at}`, m));
    for (let k = 0; k < 4; k++) {
      m.talk(t, 30 + 40 * k);
      t = run(m, t, 4000, [-20, -10], (at) => at % 66 === 0 && keep(`talk ${seed}.${k} @${at}`, m));
      m.quiet(t);
      t = run(m, t, 3000, [-20, -10], (at) => at % 66 === 0 && keep(`after talk ${seed}.${k} @${at}`, m));
    }
    m.doze(t);
    t = run(m, t, 5000, null, (at) => at % 66 === 0 && keep(`doze ${seed} @${at}`, m));
    m.talk(t, 50);
    run(m, t, 3000, [0, -10], (at) => at % 66 === 0 && keep(`woken by a talk ${seed} @${at}`, m));
  }
  return out;
}

describe('the curator (フータ): his joints and his model', () => {
  const all = poses();
  // (his model parsed once, in the hook: its ~1 s isn't charged to the first test's 5 s)
  let m: Model;
  beforeAll(async () => {
    m = await model();
  });

  it('keeps every joint he poses within its natural range, in every mood', () => {
    expect(all.length).toBeGreaterThan(5000);
    const seen = new Set<string>();
    // (failures collected, one expect: an expect per angle is ~300k calls, past the timeout on a CI runner)
    const fails: string[] = [];
    for (const { what, p } of all) {
      for (const [n, v] of Object.entries(p.j)) {
        const r = RANGE[n as keyof typeof RANGE];
        if (!r) fails.push(`${n} is not one of his posed joints`);
        else v!.forEach((a, k) => {
          if (!(a >= r[k][0] - 1e-9 && a <= r[k][1] + 1e-9)) fails.push(`${what}: ${n}[${k}] = ${a}`);
        });
      }
      seen.add(what.split(' ')[0]);
    }
    expect(fails.slice(0, 10)).toEqual([]);
    // (every mood sampled: alone covers the gestures and the doze)
    expect([...seen]).toEqual(expect.arrayContaining(['alone', 'watching', 'talk', 'after', 'doze', 'woken']));
    expect(all.some(({ what }) => what.includes(' doze '))).toBe(true);
  });

  it('keeps his model whole in every pose: no vertex flung off, no strip stretched, no wing turned edge-on (a needle)', async () => {
    const fails: string[] = [];
    const before = { needle: m.needle(m.rest), stretch: 0 };
    for (const { what, p } of all.filter((_, i) => i % 7 === 0)) {
      const s = m.shape(p);
      if (s.out > 0) fails.push(`${what}: ${s.out} vertices off his body (${s.far.toFixed(1)} past)`);
      if (s.stretch > STRETCH * m.height) fails.push(`${what}: an edge stretched ${s.stretch.toFixed(2)} (${m.height.toFixed(1)} tall)`);
      if (s.needle < NEEDLE) fails.push(`${what}: a wing edge-on, ${s.needle.toFixed(3)} as wide as long`);
    }
    expect(fails.slice(0, 10)).toEqual([]);
    expect(before.needle).toBeGreaterThan(NEEDLE);
    // (the test sees the needle: a9e29ce7's "wing to his chin", swung forward and folded about y)
    const chin: Pose = { j: { Arm_1_L: [0, 0, -1.22], Arm_1_R: [-0.9, 0.2, 0.7], Arm_2_R: [0, 1.3, 0] }, y: 0, sq: 1, pitch: 0 };
    expect(m.shape(chin).needle).toBeLessThan(NEEDLE);
  });

  it('stands clear of his desk in every pose: no vertex of his in its box (the bob, the doze, the hop, the wings)', async () => {
    const fails: string[] = [];
    // (every 8th sampled pose, a different set from the shape's: ~700 poses of his ~2900 vertices skinned, ~0.6 s)
    for (const { what, p } of all.filter((_, i) => i % 8 === 3)) {
      const d = m.inDesk(p);
      if (d.n) fails.push(`${what}: ${d.n} vertices in the desk (${d.deep.toFixed(2)} deep)`);
    }
    expect(fails.slice(0, 10)).toEqual([]);
    // (the test sees the clip: stood 2 behind the desk's back, as he was, his belly is through its top)
    expect(m.inDesk(m.rest, [AT[0], DESK.z0 - 2]).n).toBeGreaterThan(100);
  });
});

/** How far clear of the desk he keeps (world units: no face of his near its top's or its back's). */
const DESK_CLEAR = 0.25;

/** A wing's silhouette from the museum's camera (engine.ts PITCH, from the front) is at least this wide for its length:
 *  hanging 0.21–0.26, raised 0.55–0.65; a9e29ce7's wing to his chin 0.16 (the needle). */
const NEEDLE = 0.18;
/** No edge of his mesh grows by more than this of his height (his head turned stretches the back of his neck: 0.05;
 *  turned 1.1, a9e29ce7's, 0.09). */
const STRETCH = 0.08;

type Model = Awaited<ReturnType<typeof model>>;

/** His model (static/room/villagers3d/blathers.glb, its textures dropped: node has no images), on its rig. */
async function model() {
  await MeshoptDecoder.ready;
  const b = readFileSync(join(import.meta.dirname, '../../../../static/room/villagers3d/blathers.glb'));
  const jl = b.readUInt32LE(12), j = JSON.parse(b.subarray(20, 20 + jl).toString());
  delete j.textures;
  delete j.images;
  delete j.samplers;
  for (const mat of j.materials) delete mat.pbrMetallicRoughness?.baseColorTexture;
  j.extensionsUsed = j.extensionsUsed.filter((e: string) => !/texture/.test(e));
  const json = Buffer.from(JSON.stringify(j).padEnd(Math.ceil(JSON.stringify(j).length / 4) * 4, ' '));
  const rest0 = b.subarray(20 + jl), head = Buffer.alloc(20);
  head.write('glTF', 0);
  head.writeUInt32LE(2, 4);
  head.writeUInt32LE(20 + json.length + rest0.length, 8);
  head.writeUInt32LE(json.length, 12);
  head.write('JSON', 16);
  const glb = Buffer.concat([head, json, rest0]);
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const g = await loader.parseAsync(glb.buffer.slice(glb.byteOffset, glb.byteOffset + glb.byteLength), '');
  const root = g.scene, rig = rigOf(root);
  const meshes: SkinnedMesh[] = [];
  root.traverse((n) => (n as SkinnedMesh).isSkinnedMesh && meshes.push(n as SkinnedMesh));
  const v = new Vector3(), base = new Vector3(), t3 = new Vector3();
  // SkinnedMesh.getVertexPosition's skinning, its bone matrices (bone world × bone inverse) multiplied once a pose instead
  // of once a vertex and influence: the same products, the same sums, in the same order (the same floats)
  const boneM = meshes.map((s) => s.skeleton.bones.map(() => new Matrix4()));
  const skinPose = () => meshes.forEach((s, k) => s.skeleton.bones.forEach((bn, i) => boneM[k][i].multiplyMatrices(bn.matrixWorld, s.skeleton.boneInverses[i])));
  const at3 = (k: number, i: number, to: Vector3) => {
    const s = meshes[k], ji = s.geometry.attributes.skinIndex, jw = s.geometry.attributes.skinWeight;
    Mesh.prototype.getVertexPosition.call(s, i, base); // (its morphs, none posed)
    base.applyMatrix4(s.bindMatrix);
    to.set(0, 0, 0);
    for (let c = 0; c < 4; c++) {
      const wt = jw.getComponent(i, c);
      if (wt !== 0) to.addScaledVector(t3.copy(base).applyMatrix4(boneM[k][ji.getComponent(i, c)]), wt);
    }
    return to.applyMatrix4(s.bindMatrixInverse).applyMatrix4(s.matrixWorld);
  };
  /** Every vertex posed, world space, xyz packed: one array a mesh, rewritten each call. */
  const buf = meshes.map((s) => new Float64Array(3 * s.geometry.attributes.position.count));
  const posed = (p: Pose) => {
    rig.apply(p);
    root.updateMatrixWorld(true);
    skinPose();
    meshes.forEach((s, k) => {
      const o = buf[k];
      for (let i = 0; i < s.geometry.attributes.position.count; i++) (at3(k, i, v), (o[3 * i] = v.x), (o[3 * i + 1] = v.y), (o[3 * i + 2] = v.z));
    });
    return buf;
  };
  const dist = (a: Float64Array, i: number, c: Float64Array, j: number) =>
    Math.sqrt((a[3 * i] - c[3 * j]) ** 2 + (a[3 * i + 1] - c[3 * j + 1]) ** 2 + (a[3 * i + 2] - c[3 * j + 2]) ** 2);
  // his body at rest (NH's T, its wings out: its tips the farthest from his middle): a vertex further from his middle than
  // a tip by a tenth of his height is flung off (a raised wing's tip may well stand over his tufts)
  const bind = posed({ j: {}, y: 0, sq: 1, pitch: 0 }).map((a) => a.slice());
  const box = new Box3();
  for (const ps of bind) for (let i = 0; i < ps.length; i += 3) box.expandByPoint(v.fromArray(ps, i));
  const height = box.max.y - box.min.y, mid = box.getCenter(new Vector3()), m3 = new Float64Array(mid.toArray());
  let reach = 0;
  for (const ps of bind) for (let i = 0; i < ps.length / 3; i++) reach = Math.max(reach, dist(ps, i, m3, 0));
  reach += 0.1 * height;
  // each mesh's edges, once each (a triangle's three; an edge two triangles share counted once), and their bind lengths
  const edges = meshes.map((s, k) => {
    const ix = s.geometry.index!.array, seen = new Set<number>(), n = s.geometry.attributes.position.count, ab: number[] = [];
    for (let i = 0; i < ix.length; i += 3)
      for (let e = 0; e < 3; e++) {
        const a = ix[i + e], c = ix[i + ((e + 1) % 3)], key = Math.min(a, c) * n + Math.max(a, c);
        if (!seen.has(key)) (seen.add(key), ab.push(a, c));
      }
    const pairs = Uint32Array.from(ab), len = new Float64Array(pairs.length / 2);
    for (let e = 0; e < len.length; e++) len[e] = dist(bind[k], pairs[2 * e], bind[k], pairs[2 * e + 1]);
    return { pairs, len };
  });
  // each wing's outer half (its vertices mostly on Arm_2_L/R and their helpers)
  const wings = (['L', 'R'] as const).map((side) => {
    const body = meshes.findIndex((s) => (s.material as { name: string }).name === 'mBody'), s = meshes[body];
    const ji = s.geometry.attributes.skinIndex, jw = s.geometry.attributes.skinWeight, ids: number[] = [];
    for (let i = 0; i < ji.count; i++) {
      let k = 0;
      for (let c = 0; c < 4; c++) if (new RegExp(`^Arm_2_${side}`).test(s.skeleton.bones[ji.getComponent(i, c)].name)) k += jw.getComponent(i, c);
      if (k > 0.5) ids.push(i);
    }
    return { body, ids };
  });
  const el = (PITCH * Math.PI) / 180, up = new Vector3(0, Math.cos(el), -Math.sin(el));
  /** The narrowest wing's silhouette, its width over its length (the 2D spread's minor over major axis). */
  const needleOf = (ps: Float64Array[]) => Math.min(...wings.map(({ body, ids }) => {
    const q = ps[body], pts = ids.map((i) => [q[3 * i], q[3 * i] * up.x + q[3 * i + 1] * up.y + q[3 * i + 2] * up.z]);
    const mx = pts.reduce((a, q) => a + q[0], 0) / pts.length, my = pts.reduce((a, q) => a + q[1], 0) / pts.length;
    let xx = 0, yy = 0, xy = 0;
    for (const [x, y] of pts) (xx += (x - mx) ** 2), (yy += (y - my) ** 2), (xy += (x - mx) * (y - my));
    const tr = xx + yy, d = Math.sqrt(Math.max(0, (tr * tr) / 4 - (xx * yy - xy * xy)));
    return Math.sqrt((tr / 2 - d) / (tr / 2 + d));
  }));
  const rest: Pose = { j: { Arm_1_L: [0, 0, -1.22], Arm_1_R: [0, 0, 1.22] }, y: 0, sq: 1, pitch: 0 };
  // the desk's box, grown by DESK_CLEAR
  const dx0 = DESK.x0 - DESK_CLEAR, dx1 = DESK.x1 + DESK_CLEAR, dz0 = DESK.z0 - DESK_CLEAR, dz1 = DESK.z1 + DESK_CLEAR, dy1 = DESK.h + DESK_CLEAR;
  return {
    height, rest,
    /** His vertices inside the desk's box with him standing at `at` in pose p (villager3d's placing: his scale S, the
     *  pose's lift p.y and its squash p.sq, its volume kept), and the deepest of them past the box's back face or top. */
    inDesk(p: Pose, at: Pt = AT) {
      rig.apply(p);
      root.updateMatrixWorld(true);
      skinPose();
      const k = S / Math.sqrt(p.sq);
      let n = 0, deep = 0;
      for (let m = 0; m < meshes.length; m++)
        for (let i = 0; i < meshes[m].geometry.attributes.position.count; i++) {
          at3(m, i, v);
          const x = at[0] + k * v.x, y = S * (v.y * p.sq + p.y), z = at[1] + k * v.z;
          if (x > dx0 && x < dx1 && z > dz0 && z < dz1 && y < dy1) (n++, (deep = Math.max(deep, Math.min(z - dz0, dy1 - y))));
        }
      return { n, deep };
    },
    needle: (p: Pose) => needleOf(posed(p)),
    shape(p: Pose) {
      const ps = posed(p);
      let out = 0, far = 0, stretch = 0;
      ps.forEach((q, k) => {
        for (let i = 0; i < q.length / 3; i++) {
          const d = dist(q, i, m3, 0);
          if (d > reach) (out++, (far = Math.max(far, d - reach)));
        }
        const { pairs, len } = edges[k];
        for (let e = 0; e < len.length; e++) stretch = Math.max(stretch, dist(q, pairs[2 * e], q, pairs[2 * e + 1]) - len[e]);
      });
      return { out, far, stretch, needle: needleOf(ps) };
    }
  };
}
