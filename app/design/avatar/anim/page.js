// @ts-nocheck -- a plain browser module, not part of the app's build.
// The animator's GIF page (anim/gifs.ts drives it through render/harness.ts): A and B side by side (render/player.js's
// loadPlayer, the tech artist's assembler), moved by the app's own villager3d poses.ts (base states, actions, the
// crossfade and the action blend, as villager3d.ts step() does) through anim/player-rig.js, faces through faces.ts
// (eyeAt/mouthAt, blinking) mapped onto the player's eye and mouth frames. One frame at a time back to Node as a PNG.
import * as THREE from 'three';
import { loadPlayer, boxOf } from '/player.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { ACTION_MS, FADE_MS, action, base, mix, over, strideOf } from '/v3d/poses.ts';
import { FACES, eyeAt, mouthAt } from '/v3d/faces.ts';

let PR = null;
const VILLAGER_S = 5.4;
let W = 1120, H = 840;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: false });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0, ...o });

const gltf = new GLTFLoader();
gltf.setMeshoptDecoder(MeshoptDecoder);
const tools = {};
async function tool(name) {
  if (!tools[name]) tools[name] = gltf.loadAsync(`/glb/${name}.glb`).then((g) => {
    g.scene.traverse((n) => { if (n.isMesh) { n.castShadow = true; n.frustumCulled = false; } });
    return g.scene;
  });
  return (await tools[name]).clone();
}

window.init = async () => { PR = await import('/anim/player-rig.js'); return true; };

const P = {};
/** Each outfit loaded once: { p (loadPlayer's), rig (player-rig's), group, inner }. */
window.load = async (key, o, files) => {
  const p = await loadPlayer(o, files);
  p.root.traverse((n) => { if (n.isMesh) { n.castShadow = !n.material?.transparent; n.frustumCulled = false; } });
  const rig = PR.playerRig(p, o.rigTune ?? {});
  const inner = new THREE.Group(); inner.add(p.root);
  const group = new THREE.Group(); group.add(inner);
  P[key] = { p, rig, inner, group, faceKey: '' };
  return { body: rig.body, joints: rig.joints, longSkirt: rig.longSkirt };
};

// ---- the stage --------------------------------------------------------------------------------------------------------
let scene, cam, clip, lineObjs = [];
function stage() {
  const s = new THREE.Scene();
  s.background = new THREE.Color('#d5ebe2');
  s.add(new THREE.HemisphereLight(0xfffaf0, 0xb8c8c0, 1.8));
  const key = new THREE.DirectionalLight(0xfff1dc, 1.5);
  key.position.set(-8, 20, 14);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 4;
  key.shadow.bias = -0.0005;
  Object.assign(key.shadow.camera, { left: -22, right: 22, top: 22, bottom: -12, near: 0.5, far: 80 });
  s.add(key);
  const fill = new THREE.DirectionalLight(0xdfe9ff, 0.55); fill.position.set(10, 6, 8); s.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 0.35); rim.position.set(0, 8, -12); s.add(rim);
  return s;
}
/** A ground with stripes across the walk (they scroll by the distance walked: a foot that slides shows against them). */
function ground(s, walk) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#bfdcae'; g.fillRect(0, 0, 256, 256);
  if (walk) { g.fillStyle = '#a9cc96'; g.fillRect(0, 0, 256, 32); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10, 10);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(80, 80).rotateX(-Math.PI / 2), std({ map: t }));
  m.receiveShadow = true;
  s.add(m);
  return t;
}
const box = (w, h, dp, color, x, y, z) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, dp), std({ color }));
  m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m;
};
/** A seat whose top is at `top` (model units), its back behind (z −) when `back`. */
function seatProp(s, top, x, back, w = 7) {
  const g = new THREE.Group();
  g.add(box(w, 0.6, 3.2, 0x9a6a44, 0, top - 0.3, 0));
  for (const sx of [-1, 1]) g.add(box(0.6, top - 0.6, 2.6, 0x7d5434, sx * (w / 2 - 0.6), (top - 0.6) / 2, 0));
  if (back) g.add(box(w, 4, 0.5, 0x8a5c3a, 0, top + 2, -1.75));
  g.position.x = x;
  s.add(g);
}
function bedProp(s, top, x, len = 19, pillowZ = -13) {
  const g = new THREE.Group();
  g.add(box(7, top, len, 0xc9a77a, 0, top / 2, -len / 2 + 1.5));
  g.add(box(6.6, 0.5, len - 0.6, 0xf3efe6, 0, top + 0.25, -len / 2 + 1.5));
  g.add(box(5, 1.0, 4.5, 0xffffff, 0, top + 1.0, pillowZ));
  g.position.x = x;
  s.add(g);
  return top + 0.5;
}
function water(s) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(80, 40).rotateX(-Math.PI / 2), std({ color: 0x6fb7d6, roughness: 0.4 }));
  m.position.set(0, 0.05, 32); m.receiveShadow = true; s.add(m);
}

// ---- one clip -----------------------------------------------------------------------------------------------------------
/** spec: { name, state, action, actAt, prev, dur, fps, speed (u/s, walking), seat: { top, back } | lie: { top } |
 *  prone, tool: 'rod'|'net', hat, face (a FACES key: held), faces (a list cycled: the face sheet), yaw, pitch, who } */
window.setup = async (spec) => {
  scene = stage();
  const walkTex = ground(scene, !!spec.speed);
  const who = spec.who ?? ['a', 'b'];
  const gap = spec.gap ?? 11;
  // side by side; or B a step behind (side views: no overlap); or one behind the other (lying along x)
  const xs = who.length === 1 ? [0] : spec.layout === 'z' ? [0, 0] : [-gap / 2, gap / 2];
  const zs = who.length === 1 ? [0] : spec.layout === 'z' ? [gap / 2, -gap / 2] : spec.layout === 'stagger' ? [0, spec.ahead ?? 6] : [0, 0];
  if (spec.fish) water(scene);
  const actors = [];
  for (let i = 0; i < who.length; i++) {
    const a = P[who[i]];
    const x = xs[i];
    a.group.position.set(x, 0, zs[i]);
    a.group.rotation.set(0, spec.turn ?? 0, 0);
    a.inner.position.set(0, 0, 0); a.inner.rotation.set(0, 0, 0); a.inner.scale.setScalar(1);
    scene.add(a.group);
    const b = a.rig.body;
    let seatH, lieTop;
    if (spec.seat) {
      seatProp(scene, spec.seat.top, x, spec.seat.back);
      // villager3d onSeat: the hips' joint SINK over the seat's top, a back's depth out from its back
      const sink = spec.seat.sink ?? 0.55;
      a.group.position.y = spec.seat.top + sink - b.hip;
      a.group.position.z = spec.seat.back ? Math.min(b.back * 0.8, 3.2 * 0.55) - 1.5 : 0;
      seatH = spec.seat.top + sink;
    }
    if (spec.lie) {
      lieTop = bedProp(scene, spec.lie.top, x, 19, 1.5 - b.tall * 0.8);
      // villager3d onSeat (lying): the feet's end the pivot, lifted by the back's depth
      a.group.position.y = lieTop + (spec.villagerLift ? b.back * 0.85 : b.torsoBack * 0.9);
      a.group.position.z = 1.5;
    }
    // held things
    if (a.held) { a.held.removeFromParent(); a.held = null; }
    if (a.hat) { a.hat.removeFromParent(); a.hat = null; }
    if (spec.tool) a.held = await grip(a, await tool(spec.tool), spec);
    if (spec.hat) a.hat = await wear(a, await tool(spec.hat));
    if (!a.lump) {
      // villager3d's sting lump, its size and height; villager3d puts it over the viewer's-left eye (the character's
      // right: eye box min x + 27 %) while the sting raises the left hand: here on the hand's side (max x − 27 %)
      const eb = a.rig.eyeBox, w = eb.max.x - eb.min.x;
      const at = new THREE.Vector3(spec.villagerLump ? eb.min.x + 0.27 * w : eb.max.x - 0.27 * w, (eb.min.y + eb.max.y) / 2, eb.max.z + 0.05 * w);
      const head = a.rig.bone('Head');
      a.lump = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), std({ color: 0xf2a6b6, emissive: 0xf2a6b6, emissiveIntensity: 0.25 }));
      const r = 0.2 * w; a.lump.scale.set(r, r * 0.85, r * 0.6);
      a.lump.position.copy(a.rig.eyeToHead(at));
      a.lump.visible = false; head.add(a.lump);
    }
    actors.push({ a, seatH, phase: 0, seed: i * 3 + 1 });
  }
  // the fishing line (rod tip → float)
  lineObjs.forEach((l) => l.removeFromParent()); lineObjs = [];
  clip = { spec, actors, walkTex, dist: 0 };
  // the frame: a camera on the union of every frame's box (a pass over the clip at 8 fps)
  const bb = new THREE.Box3();
  const n = Math.max(2, Math.round((spec.dur / 1000) * 8));
  for (let k = 0; k <= n; k++) { await pose((spec.dur * k) / n, true); for (const x of actors) bb.union(boxOf(x.a.group)); }
  if (spec.seat || spec.lie) bb.expandByPoint(new THREE.Vector3(0, 0, 0));
  bb.min.y = Math.min(bb.min.y, 0);
  const c = bb.getCenter(new THREE.Vector3()), sz = bb.getSize(new THREE.Vector3());
  if (spec.focus === 'face') {
    // the heads only
    c.y = bb.max.y - 4.6; sz.set(sz.x, 9.5, sz.z);
  }
  const yaw = spec.yaw ?? -0.35, pitch = spec.pitch ?? 0.12, fov = 24;
  cam = new THREE.PerspectiveCamera(fov, W / H, 0.1, 500);
  const fit = spec.fill ?? 0.84;
  const r = Math.max(sz.y / fit / 2 / Math.tan((fov / 2) * Math.PI / 180), (Math.max(sz.x, sz.z) * 1.0) / fit / 2 / Math.tan((fov / 2) * Math.PI / 180) / (W / H)) + Math.max(sz.x, sz.z) * 0.3;
  cam.position.set(c.x + r * Math.sin(yaw) * Math.cos(pitch), c.y + r * Math.sin(pitch), c.z + r * Math.cos(yaw) * Math.cos(pitch));
  cam.lookAt(c);
  return { frames: Math.round((spec.dur / 1000) * (spec.fps ?? 25)), box: [bb.min.toArray(), bb.max.toArray()] };
};

/** Carrying a tool over the shoulder (a proposed hold: villager3d only ever grips the rod, turned for the fishing
 *  pose): the right hand up at the chest, the elbow bent, so the pole rides up over the right shoulder. */
function carry(p, t = 0) {
  const bob = 0.03 * Math.sin(t / 500);
  p.j.Arm_1_R = [-0.55 + bob, 0.15, 0.62];
  p.j.Arm_2_R = [0, 1.25, 0];
  p.j.Hand_R = [0, 0, 0];
  return p;
}

/** The action playing at t and how far in (ms), or null: the spec's one, or the last started of its sequence. */
function actionAt(spec, t) {
  const seq = spec.actions ?? (spec.action ? [[spec.action, spec.actAt ?? 0]] : []);
  for (let i = seq.length - 1; i >= 0; i--) {
    const [a, at] = seq[i], u = t - at;
    if (u >= 0) return u < ACTION_MS[a] ? { a, u } : null;
  }
  return null;
}
/** The pull-up's rep (Island3D.svelte pullLift: 9 u twice in PULL_MS 4200), in model units. */
function pullLift(t) {
  const k = (t % 4200) / 4200, up = (a, b, c, d) => (k < a || k > d ? 0 : k < b ? (k - a) / (b - a) : k <= c ? 1 : (d - k) / (d - c));
  return (9 / VILLAGER_S) * Math.max(up(0, 0.08, 0.16, 0.24), up(0.32, 0.4, 0.48, 0.56));
}
/** A proposed talk: the mouth through the player's open frames on a syllable beat (the app has no talk face). */
const TALK = [0, 1, 5, 1, 0, 8, 1, 0, 5, 7];

/** The face for the clip at t (villager3d faceOf): an action's, a state's, the spec's. → [face, villager eye, mouth] */
function faceAt(spec, t, seed) {
  let f = spec.face ?? null;
  if (spec.faces) { const k = Math.floor(t / spec.faceMs); f = spec.faces[k % spec.faces.length]; }
  if (f === 'blink') return ['blink', 14, 0];
  const act = actionAt(spec, t);
  if (!f && act) f = act.a === 'sting' ? 'sting' : act.a === 'surprise' ? 'surprised' : ['hop', 'highfive', 'wave'].includes(act.a) ? 'happy' : null;
  if (!f) f = ['nap', 'doze', 'prone'].includes(spec.state) ? 'sleepy' : 'neutral';
  const tt = t + (spec.blinkAt ?? 0);
  if (spec.talk) return ['talk', eyeAt('neutral', tt, seed), -1 - TALK[Math.floor(t / 120) % TALK.length]];
  // (the face sheet holds each expression still: its blink is its own entry)
  if (spec.faces) return [f, FACES[f][0], mouthAt(f, tt)];
  return [f, eyeAt(f, tt, seed), mouthAt(f, tt)];
}

/** Every actor posed at t (ms): villager3d step()'s pose, body and face. */
async function pose(t, quick = false) {
  const { spec, actors } = clip;
  const dt = 1000 / (spec.fps ?? 25);
  for (const x of actors) {
    const { a } = x;
    const o = { phase: 0, speed: spec.speed ?? 0, body: a.rig.body, seed: x.seed, seatH: x.seatH, back: !!spec.seat?.back };
    // the walk: phase = distance / stride (villager3d: moved / (strideOf(speed) * VILLAGER_S))
    o.phase = ((spec.speed ?? 0) * (t / 1000)) / (strideOf(spec.speed ?? 0) * VILLAGER_S);
    const tt = t + (spec.t0 ?? 0);
    let p = base(spec.state, tt, o);
    if (spec.prev) {
      const k = Math.min(1, (t - (spec.prevUntil ?? 0)) / (spec.fadeMs ?? FADE_MS));
      if (t < (spec.prevUntil ?? 0)) p = base(spec.prev, tt, o);
      else if (k < 1) p = mix(base(spec.prev, tt, o), p, k);
    }
    const act = actionAt(spec, t);
    if (act) { const r = spec.villagerActions ? action(act.a, act.u) : PR.playerAction(a.rig, action, act.a, act.u); p = over(p, r.p, r.w); }
    if (spec.carry) p = carry(p, t);
    a.rig.apply(p, { pitch: p.pitch });
    // the body: squashed (its volume kept), pitched, lifted (villager3d step())
    const sq = p.sq;
    a.inner.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
    a.inner.rotation.x = p.pitch;
    const b = a.rig.body;
    if (spec.lie || spec.seat) a.inner.position.set(0, spec.seat ? 0 : 0, 0);
    else {
      const back = p.pitch < 0 ? -Math.sin(p.pitch) : 0, front = p.pitch > 0 ? Math.sin(p.pitch) : 0;
      a.inner.position.y = p.y + back * 2.2 + front * (spec.villagerLift ? b.front * 0.85 : b.torsoFront * 0.9) + (spec.liftRep ? pullLift(t) : 0);
      a.inner.position.z = back * 6.5 - front * b.tall * 0.5;
    }
    // face down on the ground: its lowest point on the ground (whatever touches first: the cheek, the chest, the toes)
    if (!spec.lie && !spec.seat && p.pitch > 0.5 && !spec.villagerLift) {
      a.group.updateMatrixWorld(true);
      a.inner.position.y += 0.05 - lowest(a.p.root);
    }
    if (a.held && spec.tool === 'tools/rod') orient(a, spec);
    if (!quick) {
      const [f, eye, mouth] = faceAt(spec, t, x.seed);
      a.lump.visible = f === 'sting';
      const [pe, pm] = PR.playerFace(eye, mouth, a.p.outfit.mouthFrame ?? 0, f);
      const k = `${pe}/${pm}`;
      if (a.faceKey !== k) { await a.p.setFace(pe, pm); a.faceKey = k; }
    }
  }
  clip.walkTex.offset.y = -(((spec.speed ?? 0) / VILLAGER_S) * (t / 1000)) / 8;
}

/** The lowest point (world y) of what's drawn, as posed (every 4th vertex). */
function lowest(obj) {
  let y = Infinity;
  const v = new THREE.Vector3();
  obj.traverse((n) => {
    if (!n.isSkinnedMesh || !n.visible) return;
    const p = n.geometry.attributes.position;
    for (let i = 0; i < p.count; i += 4) { v.fromBufferAttribute(p, i); n.applyBoneTransform(i, v); v.applyMatrix4(n.matrixWorld); if (v.y < y) y = v.y; }
  });
  return y;
}

// ---- held things (villager3d grip/aim/wear, as they are) ---------------------------------------------------------------
async function grip(a, obj, spec) {
  const hand = a.rig.bone('Hand_R');
  obj.position.set(0, 0, 0); obj.quaternion.identity(); obj.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(obj, true);
  const tip = new THREE.Vector3((b.min.x + b.max.x) / 2, b.min.y, (b.min.z + b.max.z) / 2);
  // villager3d grip(): turned in the hand so that in the fishing pose it points out in front and up (spec.gripPose,
  // gripWant: a proposed hold for another tool, e.g. the net upright at the side in idle)
  const gp = base(spec.gripPose ?? 'fish', 0, { phase: 0, speed: 0, body: a.rig.body, seed: 0 });
  a.rig.apply(spec.carry ? carry(gp) : gp);
  a.p.root.updateMatrixWorld(true);
  const handQ = a.p.root.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(hand.getWorldQuaternion(new THREE.Quaternion()));
  const want = new THREE.Vector3(...(spec.gripWant ?? [-0.2, 1.1, 1])).normalize();
  obj.quaternion.copy(handQ.invert().multiply(new THREE.Quaternion().setFromUnitVectors(tip.clone().normalize(), want)));
  const hs = hand.getWorldScale(new THREE.Vector3()).divide(a.p.root.getWorldScale(new THREE.Vector3()));
  obj.scale.divide(hs);
  hand.add(obj);
  obj.userData.tip = tip; obj.userData.q = obj.quaternion.clone();
  return obj;
}
const aimH = new THREE.Vector3(), aimV = new THREE.Vector3(), aimQ = new THREE.Quaternion();
function orient(a, spec) {
  const hand = a.rig.bone('Hand_R'), obj = a.held;
  clip.actors.forEach((x) => x.a.group.updateMatrixWorld(true));
  if (spec.aim === false) { obj.quaternion.copy(obj.userData.q); return; }
  hand.getWorldPosition(aimH);
  const at = new THREE.Vector3(a.group.position.x - 1, 0, a.group.position.z + 26);
  aimV.set(at.x - aimH.x, 0, at.z - aimH.z);
  const D = aimV.length(), L = obj.userData.tip.length();
  const up = Math.min((75 * Math.PI) / 180, Math.max((40 * Math.PI) / 180, Math.acos(Math.min(1, (0.7 * D) / L))));
  aimV.normalize().multiplyScalar(Math.cos(up)).setY(Math.sin(up));
  aimQ.setFromUnitVectors(aimH.copy(obj.userData.tip).normalize(), aimV);
  obj.quaternion.copy(hand.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(aimQ));
}
async function wear(a, obj) {
  // villager3d wear(): on the head bone, upright as the head is at rest, its base on the head's top (sunk 12 %)
  const head = a.rig.bone('Head');
  a.rig.apply({ j: {}, y: 0, sq: 1, pitch: 0 });
  a.p.root.updateMatrixWorld(true);
  const top = boxOf(a.p.root).max.y, hp = new THREE.Vector3().setFromMatrixPosition(head.matrixWorld);
  const m = head.matrixWorld.clone().invert().multiply(new THREE.Matrix4().makeTranslation(hp.x, top - (top - hp.y) * 0.12, hp.z));
  obj.matrixAutoUpdate = false;
  obj.matrix.copy(m);
  head.add(obj);
  return obj;
}

function drawLine(a) {
  if (!a.held) return;
  const tip = a.held.userData.tip.clone().applyMatrix4(a.held.matrixWorld);
  const at = new THREE.Vector3(a.group.position.x - 1, 0.1, a.group.position.z + 26);
  const g = new THREE.BufferGeometry().setFromPoints([tip, at]);
  const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xffffff }));
  scene.add(l); lineObjs.push(l);
  const f = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 8), std({ color: 0xe8483c })); f.position.copy(at); scene.add(f); lineObjs.push(f);
}

window.frame = async (t, label) => {
  await pose(t);
  lineObjs.forEach((l) => l.removeFromParent()); lineObjs = [];
  if (clip.spec.tool === 'tools/rod' && clip.spec.line !== false) for (const x of clip.actors) { x.a.group.updateMatrixWorld(true); drawLine(x.a); }
  renderer.render(scene, cam);
  if (!label) return renderer.domElement.toDataURL('image/png');
  // a caption (the face sheet's: the expression and the frames)
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.drawImage(renderer.domElement, 0, 0);
  const lines = typeof label === 'string' ? [label] : faceLabel(t);
  g.font = 'bold 34px -apple-system, Helvetica, sans-serif';
  g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillRect(0, H - 22 - 44 * lines.length, W, 22 + 44 * lines.length);
  g.fillStyle = '#223';
  lines.forEach((s, i) => g.fillText(s, 24, H - 22 - 44 * (lines.length - 1 - i)));
  return c.toDataURL('image/png');
};
function faceLabel(t) {
  const x = clip.actors[0];
  const [f, eye, mouth] = faceAt(clip.spec, t, x.seed);
  const b = clip.actors[1]?.a;
  const [pe, pm] = PR.playerFace(eye, mouth, x.a.p.outfit.mouthFrame ?? 0, f);
  const pmB = b ? PR.playerFace(eye, mouth, b.p.outfit.mouthFrame ?? 0, f)[1] : pm;
  const dead = f === 'joy' || f === 'cross' ? '  [never used by the app]' : '';
  return [`${f}${dead}`, `villager eye ${eye} mouth ${mouth}  ->  player eye .${pe}  mouth .${pm}${pmB !== pm ? ` (B .${pmB})` : ''}`];
}

/** A labelled grid of PNGs (the contact sheet). */
window.grid = async (items, cols, cw, ch) => {
  const rows = Math.ceil(items.length / cols);
  const c = document.createElement('canvas'); c.width = cols * cw; c.height = rows * (ch + 26);
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < items.length; i++) {
    const im = new Image(); im.src = items[i].png; await im.decode();
    const x = (i % cols) * cw, y = Math.floor(i / cols) * (ch + 26);
    g.drawImage(im, x, y, cw, ch);
    g.fillStyle = items[i].bad ? '#b3261e' : '#111'; g.font = 'bold 15px -apple-system, Helvetica, sans-serif';
    g.fillText(items[i].label, x + 6, y + ch + 18);
  }
  return c.toDataURL('image/png');
};
/** Raw frames sheet: every eye and mouth frame of an outfit on its face, still (to read the frames' meanings). */
window.rawFaces = async (key) => {
  const a = P[key];
  clip = { spec: { state: 'idle', dur: 1, face: 'neutral' }, actors: [{ a, seed: 0 }], walkTex: new THREE.Texture(), dist: 0 };
  scene = stage(); ground(scene, false); scene.add(a.group);
  a.group.position.set(0, 0, 0); a.group.rotation.set(0, 0, 0);
  a.rig.apply(base('idle', 0, { phase: 0, speed: 0, body: a.rig.body, seed: 0 }));
  a.group.updateMatrixWorld(true);
  const bb = boxOf(a.group);
  const c = new THREE.Vector3(0, bb.max.y - 4.3, 0);
  cam = new THREE.PerspectiveCamera(24, W / H, 0.1, 500);
  cam.position.set(c.x, c.y + 0.4, 21); cam.lookAt(c.x, c.y + 0.3, c.z);
  const out = [];
  for (let i = 0; i < 16; i++) { await a.p.setFace(i, 0); renderer.render(scene, cam); out.push({ png: renderer.domElement.toDataURL('image/png'), label: `eye .${i}` }); }
  for (let i = 0; i < 9; i++) { await a.p.setFace(0, i); renderer.render(scene, cam); out.push({ png: renderer.domElement.toDataURL('image/png'), label: `mouth .${i}` }); }
  a.faceKey = '';
  return out;
};
window.ready = true;
