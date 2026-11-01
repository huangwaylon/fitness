// The tent's room in 3D (docs/design.md "The tent"): three.js, loaded only when the tent opens (its own chunk). NH's
// largest room (8 × 8 tiles, grid.ts) under NH's fixed, slightly top-down room camera and a warm interior light: the
// floor and three walls in NH's wallpaper and flooring, the furniture as the glTFs scripts/room-models.ts made, the
// villagers as billboards of their official renders (no 3D villagers: the 417 villagers' models would be far too much
// to ship), each with a soft round shadow. Drawn on demand: a frame only when something changed or moves (a walk, a
// piece popping in, a jiggle), nothing while still. Plain TS; the screen (TentRoom.svelte) drives it.
import {
  AmbientLight, BoxGeometry, CanvasTexture, CircleGeometry, Color, DirectionalLight, DoubleSide, Group, HemisphereLight,
  LineBasicMaterial, LineSegments, BufferGeometry, Float32BufferAttribute, Material, Mesh, MeshBasicMaterial, MeshStandardMaterial,
  Object3D, PCFSoftShadowMap, PerspectiveCamera, Plane, PlaneGeometry, PointLight, Raycaster, RepeatWrapping, Scene, SRGBColorSpace,
  Sprite, SpriteMaterial, Texture, TextureLoader, Vector2, Vector3, WebGLRenderer
} from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { HALF, ROOM, TILE, centreOf, type Facing, type Pt, type Spot } from './grid.ts';
import { footprint, floorUrl, ITEMS, modelUrl, wallUrl } from './items.ts';

/** The walls' height (RoomMdlWall: 40 model units, four tiles). */
const WALL_H = 40;
/** A villager's height in the room (model units: a little over a tile and a half, NH's proportions against its beds). */
export const VILLAGER_H = 16;
/** Walking pace (model units a second: about three tiles). */
export const PACE = 30;
/** Camera: degrees down from the horizontal and the lens (NH's room camera: steep, a long lens). */
const PITCH = 47;
const FOV = 32;
/** The device pixel ratio's cap (an iPhone's 3 costs too much for what it adds). */
const DPR_MAX = 2;
/** How many lamps light the room at night (a point light each, nearest the middle first). */
const LIGHTS_MAX = 4;

export type Who = 'A' | 'B';
export interface Look {
  /** The render's URL and its aspect (width / height). */
  url: string;
  aspect: number;
  /** The render looks toward the viewer's right as drawn; never mirror it (a logo on the outfit). */
  looksRight: boolean;
  noMirror: boolean;
}
export type Hit = { kind: 'piece'; id: string } | { kind: 'villager'; who: Who } | { kind: 'door' } | { kind: 'floor'; x: number; z: number };
export interface Placed extends Spot {
  id: string;
}
export interface Ghost {
  item: string;
  x: number;
  z: number;
  f: Facing;
  ok: boolean;
}
export interface Insets {
  /** What covers the canvas at its top and foot (px): the room fits between. */
  top: number;
  bottom: number;
}

export interface Tent {
  /** The canvas's size changed (or what covers it). */
  resize(insets?: Insets): void;
  surfaces(wall: string, floor: string): void;
  /** What stands in the room (by id: new ones load and pop in, gone ones go, moved ones move). */
  pieces(list: readonly Placed[]): void;
  /** Hide one piece (the one being moved), or none. */
  hide(id: string | null): void;
  ghost(g: Ghost | null): void;
  /** The edit mode's grid on the floor. */
  grid(on: boolean): void;
  /** A piece jiggles where it stands (a tap). */
  bump(id: string): void;
  /** A lamp's light, on or off (a tap); the night lights it. */
  toggle(id: string): boolean;
  /** 0 day … 1 night: the light, and the lamps on. */
  night(n: number): void;
  villager(who: Who, look: Look | null): void;
  /** Where a villager stands now (model units). */
  at(who: Who): [number, number] | null;
  /** Put a villager at a point, facing left (-1) or right (1). */
  put(who: Who, p: Pt, face?: number): void;
  /** Walk a villager along `pts` from `from` (its spot now when left out), starting `ago` ms ago, at PACE. Returns
   *  the walk's length (ms). */
  walk(who: Who, pts: readonly Pt[], o?: { from?: Pt; ago?: number; ms?: number }): number;
  walking(who: Who): boolean;
  /** A villager turns toward a point (left or right) or hops (a tap on it). */
  face(who: Who, toward: Pt): void;
  hop(who: Who): void;
  /** What a tap at client px hits, in front first. */
  hit(cx: number, cy: number): Hit | null;
  /** The floor point under client px (model units), or null off the floor. */
  floorAt(cx: number, cy: number): [number, number] | null;
  /** A model point's client px (the e2e and the overlays). */
  client(x: number, y: number, z: number): [number, number];
  /** Pieces still loading. */
  loading(): number;
  /** Frames drawn, and the last frame's draw calls and triangles (the e2e's budget). */
  stats(): { frames: number; calls: number; tris: number; dpr: number };
  /** The first frame was drawn (the room on screen). */
  ready: Promise<void>;
  dispose(): void;
}

const now = () => performance.now();
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

function softDisc(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const r = g.createRadialGradient(32, 32, 2, 32, 32, 31);
  r.addColorStop(0, 'rgba(40,25,10,0.42)');
  r.addColorStop(1, 'rgba(40,25,10,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** NH's doormat at the door: a woven mat, its stripes. */
function matTexture(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 48;
  const g = c.getContext('2d')!;
  g.fillStyle = '#B98A55';
  g.beginPath();
  g.roundRect(2, 2, 124, 44, 12);
  g.fill();
  g.strokeStyle = '#8E6236';
  g.lineWidth = 3;
  for (let x = 14; x < 120; x += 10) {
    g.beginPath();
    g.moveTo(x, 9);
    g.lineTo(x, 39);
    g.stroke();
  }
  g.strokeStyle = '#E9D2A8';
  g.lineWidth = 4;
  g.beginPath();
  g.roundRect(6, 6, 116, 36, 9);
  g.stroke();
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

export function createTent(canvas: HTMLCanvasElement): Tent {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  const dpr = Math.min(DPR_MAX, window.devicePixelRatio || 1);
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;

  const scene = new Scene();
  scene.background = new Color(0x2a1f17);
  const camera = new PerspectiveCamera(FOV, 1, 10, 2000);
  let insets: Insets = { top: 0, bottom: 0 };

  // the warm interior light: a soft sky over a warm floor bounce, the key from the upper front left with soft shadows
  const hemi = new HemisphereLight(0xfff3dc, 0x9a7656, 1.5);
  const key = new DirectionalLight(0xfff0d6, 2.1);
  key.position.set(-34, 90, 60);
  key.target.position.set(0, 0, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 10, far: 220 });
  key.shadow.bias = -0.0006;
  key.shadow.normalBias = 0.4;
  const amb = new AmbientLight(0xffe8cc, 0.35);
  // a soft fill from the camera's side, so the back wall and the fronts of things aren't in the dark
  const fill = new DirectionalLight(0xfff4e6, 0.9);
  fill.position.set(10, 50, 140);
  scene.add(hemi, key, key.target, amb, fill);

  // ---- the room: floor, three walls, their tops, the floor's front edge, the doormat ----
  const tex = new TextureLoader();
  const floorMat = new MeshStandardMaterial({ color: 0xd8c4a0, roughness: 0.95 });
  const wallMat = new MeshStandardMaterial({ color: 0xe8dcc6, roughness: 1 });
  const floor = new Mesh(new PlaneGeometry(ROOM * TILE, ROOM * TILE), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  const back = new Mesh(new PlaneGeometry(ROOM * TILE, WALL_H), wallMat);
  back.position.set(0, WALL_H / 2, -HALF);
  const left = new Mesh(new PlaneGeometry(ROOM * TILE, WALL_H), wallMat);
  left.rotation.y = Math.PI / 2;
  left.position.set(-HALF, WALL_H / 2, 0);
  const right = new Mesh(new PlaneGeometry(ROOM * TILE, WALL_H), wallMat);
  right.rotation.y = -Math.PI / 2;
  right.position.set(HALF, WALL_H / 2, 0);
  for (const w of [back, left, right]) w.receiveShadow = true;
  // the walls' cut tops and the floor's front edge (NH's dark outer frame), and the step down at the door
  const trimMat = new MeshStandardMaterial({ color: 0x5b4330, roughness: 1 });
  const capMat = new MeshStandardMaterial({ color: 0xf1e6cf, roughness: 1 });
  const T = 2;
  const caps = new Group();
  const cap = (w: number, d: number, x: number, z: number) => {
    const m = new Mesh(new BoxGeometry(w, 1, d), capMat);
    m.position.set(x, WALL_H + 0.5, z);
    const s = new Mesh(new BoxGeometry(w, WALL_H, d), trimMat);
    s.position.set(x, WALL_H / 2, z);
    caps.add(m, s);
  };
  // (a hair outside the walls: their faces never fight the wallpaper's)
  const O = T / 2 + 0.15;
  cap(ROOM * TILE + T * 2 + 0.3, T, 0, -HALF - O);
  cap(T, ROOM * TILE + T, -HALF - O, -T / 2);
  cap(T, ROOM * TILE + T, HALF + O, -T / 2);
  const edge = new Mesh(new BoxGeometry(ROOM * TILE + T * 2, 4, T), trimMat);
  edge.position.set(0, -2, HALF + T / 2);
  const mat = new Mesh(new PlaneGeometry(18, 6.5), new MeshStandardMaterial({ map: matTexture(), transparent: true, roughness: 1 }));
  mat.rotation.x = -Math.PI / 2;
  mat.position.set(0, 0.06, HALF - 3.6);
  mat.receiveShadow = true;
  mat.renderOrder = 1;
  scene.add(floor, back, left, right, caps, edge, mat);

  function surfaces(wall: string, fl: string) {
    const load = (url: string, m: MeshStandardMaterial, rx: number, ry: number) =>
      tex.loadAsync(url).then((t) => {
        if (disposed) return t.dispose();
        t.colorSpace = SRGBColorSpace;
        t.wrapS = t.wrapT = RepeatWrapping;
        t.repeat.set(rx, ry);
        t.anisotropy = 4;
        m.map?.dispose();
        m.map = t;
        m.color.set(0xffffff);
        m.needsUpdate = true;
        shadowsDirty = true;
        invalidate();
      }, () => {});
    // a wallpaper is two tiles across and the wall's height, a floor four tiles each way
    if (wall !== cur.wall) void load(wallUrl((cur.wall = wall)), wallMat, (ROOM * TILE) / (2 * TILE), 1);
    if (fl !== cur.floor) void load(floorUrl((cur.floor = fl)), floorMat, ROOM / 4, ROOM / 4);
  }
  const cur = { wall: '', floor: '' };

  // ---- the grid (edit mode) ----
  const gridLines = (() => {
    const v: number[] = [];
    for (let i = 0; i <= ROOM; i++) {
      const p = -HALF + i * TILE;
      v.push(p, 0.08, -HALF, p, 0.08, HALF, -HALF, 0.08, p, HALF, 0.08, p);
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(v, 3));
    const l = new LineSegments(g, new LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45, depthWrite: false }));
    l.visible = false;
    l.renderOrder = 2;
    return l;
  })();
  scene.add(gridLines);

  // ---- the furniture ----
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const models = new Map<string, Promise<GLTF | null>>();
  const model = (code: string) => {
    let p = models.get(code);
    if (!p) {
      p = loader.loadAsync(modelUrl(code)).then((g) => {
        g.scene.traverse((n) => {
          const m = n as Mesh;
          if (!m.isMesh) return;
          m.castShadow = !ITEMS[code]?.rug;
          m.receiveShadow = true;
          const ms = (Array.isArray(m.material) ? m.material : [m.material]) as MeshStandardMaterial[];
          for (const x of ms) {
            if (x.emissiveMap) x.emissiveIntensity = 0;
            // a rug lies on the floor: drawn over it, never fighting it
            if (ITEMS[code]?.rug) Object.assign(x, { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
          }
        });
        return g;
      }, (e: unknown) => {
        console.warn('tent: model', code, e);
        models.delete(code);
        return null;
      });
      models.set(code, p);
    }
    return p;
  };
  interface Live {
    spot: Placed;
    root: Group;
    body: Object3D | null;
    pop: number;
    bump: number;
    on: boolean | null;
    lit: MeshStandardMaterial[];
  }
  const live = new Map<string, Live>();
  let hidden: string | null = null;
  let pending = 0;
  const placeRoot = (root: Group, s: Spot, lift = 0) => {
    const [cx, cz] = centreOf(s);
    root.position.set(cx, lift, cz);
    root.rotation.y = (s.f * Math.PI) / 2;
  };
  function pieces(list: readonly Placed[]) {
    const ids = new Set(list.map((p) => p.id));
    for (const [id, l] of live) if (!ids.has(id)) {
      scene.remove(l.root);
      for (const m of l.lit) m.dispose();
      live.delete(id);
    }
    for (const s of list) {
      const was = live.get(s.id);
      if (was && was.spot.item === s.item) {
        was.spot = s;
        placeRoot(was.root, s);
        continue;
      }
      if (was) {
        scene.remove(was.root);
        live.delete(s.id);
      }
      const root = new Group();
      root.userData.id = s.id;
      placeRoot(root, s);
      root.visible = hidden !== s.id;
      const l: Live = { spot: s, root, body: null, pop: 0, bump: 0, on: null, lit: [] };
      live.set(s.id, l);
      scene.add(root);
      pending++;
      void model(s.item).then((g) => {
        pending--;
        if (disposed || live.get(s.id) !== l || !g) return;
        const body = g.scene.clone(true);
        // a lamp's own material, so one lamp turns on or off alone
        if (ITEMS[s.item]?.lit) body.traverse((n) => {
          const m = n as Mesh;
          if (!m.isMesh) return;
          const x = m.material as MeshStandardMaterial;
          if (x.emissiveMap) {
            const c = x.clone();
            l.lit.push(c);
            m.material = c;
          }
        });
        body.traverse((n) => (n.userData.id = s.id));
        l.body = body;
        l.pop = now();
        root.add(body);
        lights();
        shadowsDirty = true;
        invalidate();
      });
    }
    lights();
    shadowsDirty = true;
    invalidate();
  }
  function hide(id: string | null) {
    if (hidden) {
      const l = live.get(hidden);
      if (l) l.root.visible = true;
    }
    hidden = id;
    const l = id && live.get(id);
    if (l) l.root.visible = false;
    shadowsDirty = true;
    invalidate();
  }

  // ---- the ghost: what's held, lifted, its footprint green or red ----
  const ghostRoot = new Group();
  const footMat = new MeshBasicMaterial({ color: 0x78dc78, transparent: true, opacity: 0.45, depthWrite: false, side: DoubleSide });
  const foot = new Mesh(new PlaneGeometry(1, 1), footMat);
  foot.rotation.x = -Math.PI / 2;
  foot.renderOrder = 3;
  const ring = new LineSegments(new BufferGeometry(), new LineBasicMaterial({ color: 0xffffff }));
  ring.renderOrder = 4;
  scene.add(ghostRoot, foot, ring);
  foot.visible = ring.visible = false;
  let ghostKey = '';
  let ghostBody: Object3D | null = null;
  let ghostT = 0;
  function ghost(g: Ghost | null) {
    foot.visible = ring.visible = ghostRoot.visible = !!g;
    if (!g) {
      ghostKey = '';
      if (ghostBody) ghostRoot.remove(ghostBody);
      ghostBody = null;
      invalidate();
      return;
    }
    const [w, d] = footprint(g.item, g.f);
    const [cx, cz] = centreOf(g);
    foot.scale.set(w * TILE - 0.8, d * TILE - 0.8, 1);
    foot.position.set(cx, 0.12, cz);
    footMat.color.set(g.ok ? 0x78dc78 : 0xf05a50);
    const hw = (w * TILE) / 2 - 0.4, hd = (d * TILE) / 2 - 0.4, y = 0.14;
    ring.geometry.dispose();
    ring.geometry = new BufferGeometry().setAttribute('position', new Float32BufferAttribute([
      -hw, y, -hd, hw, y, -hd, hw, y, -hd, hw, y, hd, hw, y, hd, -hw, y, hd, -hw, y, hd, -hw, y, -hd
    ], 3));
    ring.position.set(cx, 0, cz);
    placeRoot(ghostRoot, g, 3);
    if (ghostKey !== g.item) {
      ghostKey = g.item;
      if (ghostBody) ghostRoot.remove(ghostBody);
      ghostBody = null;
      ghostT = now();
      void model(g.item).then((m) => {
        if (!m || disposed || ghostKey !== g.item) return;
        ghostBody = m.scene.clone(true);
        ghostBody.traverse((n) => (n.userData.ghost = true));
        ghostRoot.add(ghostBody);
        ghostT = now();
        invalidate();
      });
    }
    invalidate();
  }
  function grid(on: boolean) {
    gridLines.visible = on;
    invalidate();
  }
  function bump(id: string) {
    const l = live.get(id);
    if (!l) return;
    l.bump = now();
    invalidate();
  }

  // ---- night: dimmer, warmer, and the lamps lit ----
  let nightN = 0;
  const pointLights: PointLight[] = [];
  for (let i = 0; i < LIGHTS_MAX; i++) {
    const p = new PointLight(0xffc27a, 0, 42, 1.6);
    pointLights.push(p);
    scene.add(p);
  }
  function lights() {
    const lamps = [...live.values()].filter((l) => l.lit.length && l.root.visible).map((l) => {
      const on = l.on ?? nightN > 0.5;
      for (const m of l.lit) m.emissiveIntensity = on ? 1.4 : 0;
      return { l, on };
    }).filter((x) => x.on);
    lamps.sort((a, b) => a.l.root.position.length() - b.l.root.position.length());
    pointLights.forEach((p, i) => {
      const x = lamps[i];
      p.intensity = x ? 900 : 0;
      if (x) p.position.set(x.l.root.position.x, (ITEMS[x.l.spot.item]?.h ?? 8) * 0.8 + 2, x.l.root.position.z);
    });
  }
  function toggle(id: string): boolean {
    const l = live.get(id);
    if (!l?.lit.length) return false;
    l.on = !(l.on ?? nightN > 0.5);
    lights();
    invalidate();
    return true;
  }
  function night(n: number) {
    nightN = Math.max(0, Math.min(1, n));
    const k = nightN;
    hemi.intensity = 1.5 - 0.75 * k;
    hemi.color.set(0xfff3dc).lerp(new Color(0xc9c4e8), k * 0.6);
    key.intensity = 2.1 - 1.3 * k;
    key.color.set(0xfff0d6).lerp(new Color(0xffd29a), k);
    amb.intensity = 0.35 - 0.1 * k;
    fill.intensity = 0.9 - 0.4 * k;
    for (const v of villagers.values()) v.mat.color.set(0xffffff).lerp(new Color(0xd8cfe8), k * 0.35);
    lights();
    invalidate();
  }

  // ---- the villagers ----
  interface Walker {
    look: Look;
    sprite: Sprite;
    mat: SpriteMaterial;
    shadow: Mesh;
    pos: [number, number];
    /** -1 left, 1 right. */
    face: number;
    path: { from: [number, number]; pts: Pt[]; t0: number; ms: number; lens: number[]; total: number } | null;
    hop: number;
  }
  const villagers = new Map<Who, Walker>();
  const disc = softDisc();
  function villager(who: Who, look: Look | null) {
    const was = villagers.get(who);
    if (was && (!look || was.look.url !== look.url)) {
      scene.remove(was.sprite, was.shadow);
      was.mat.map?.dispose();
      was.mat.dispose();
      villagers.delete(who);
    }
    if (!look || villagers.has(who)) return invalidate();
    const mat = new SpriteMaterial({ alphaTest: 0.5, transparent: false });
    const sprite = new Sprite(mat);
    sprite.center.set(0.5, 0.02);
    sprite.scale.set(VILLAGER_H * look.aspect, VILLAGER_H, 1);
    sprite.userData.who = who;
    sprite.renderOrder = 5;
    const shadow = new Mesh(new CircleGeometry(4.2, 24), new MeshBasicMaterial({ map: disc, transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.renderOrder = 2;
    const w: Walker = { look, sprite, mat, shadow, pos: [who === 'A' ? -6 : 6, 20], face: who === 'A' ? 1 : -1, path: null, hop: 0 };
    villagers.set(who, w);
    scene.add(sprite, shadow);
    tex.loadAsync(look.url).then((t) => {
      if (disposed || villagers.get(who) !== w) return t.dispose();
      t.colorSpace = SRGBColorSpace;
      mat.map = t;
      mat.needsUpdate = true;
      setFace(w, w.face);
      night(nightN);
    }, () => {});
    place(w);
  }
  function setFace(w: Walker, face: number) {
    w.face = face;
    const t = w.mat.map;
    if (!t) return;
    // as drawn the render looks left (most) or right; mirror it to face the other way (never a no-mirror one)
    const flip = !w.look.noMirror && (face > 0) !== w.look.looksRight;
    t.repeat.x = flip ? -1 : 1;
    t.offset.x = flip ? 1 : 0;
    t.wrapS = RepeatWrapping;
    t.needsUpdate = true;
  }
  function place(w: Walker, bob = 0) {
    w.sprite.position.set(w.pos[0], bob, w.pos[1]);
    w.shadow.position.set(w.pos[0], 0.1, w.pos[1]);
    const s = 1 - Math.min(0.3, bob / 8);
    w.shadow.scale.set(s, s, s);
  }
  function walkLens(from: Pt, pts: readonly Pt[]) {
    const lens: number[] = [];
    let a = from, total = 0;
    for (const p of pts) {
      const l = Math.hypot(p[0] - a[0], p[1] - a[1]);
      lens.push(l);
      total += l;
      a = p;
    }
    return { lens, total };
  }
  function walk(who: Who, pts: readonly Pt[], o: { from?: Pt; ago?: number; ms?: number } = {}): number {
    const w = villagers.get(who);
    if (!w || !pts.length) return 0;
    const from: [number, number] = o.from ? [o.from[0], o.from[1]] : [...w.pos];
    const { lens, total } = walkLens(from, pts);
    const ms = o.ms ?? (total / PACE) * 1000;
    w.path = { from, pts: [...pts], t0: now() - (o.ago ?? 0), ms: Math.max(1, ms), lens, total };
    invalidate();
    return ms;
  }
  /** Where a walk has a villager by now, and which way it's heading (null: over). */
  function along(w: Walker, t: number): { p: [number, number]; dx: number; done: boolean } {
    const P = w.path!;
    const k = Math.min(1, (t - P.t0) / P.ms);
    let d = k * P.total, a: Pt = P.from;
    for (let i = 0; i < P.pts.length; i++) {
      const b = P.pts[i];
      if (d <= P.lens[i] || i === P.pts.length - 1) {
        const f = P.lens[i] ? Math.min(1, d / P.lens[i]) : 1;
        return { p: [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f], dx: b[0] - a[0], done: k >= 1 };
      }
      d -= P.lens[i];
      a = b;
    }
    return { p: [P.from[0], P.from[1]], dx: 0, done: true };
  }
  function face(who: Who, toward: Pt) {
    const w = villagers.get(who);
    if (!w || Math.abs(toward[0] - w.pos[0]) < 0.5) return;
    setFace(w, toward[0] > w.pos[0] ? 1 : -1);
    invalidate();
  }
  function hop(who: Who) {
    const w = villagers.get(who);
    if (!w) return;
    w.hop = now();
    invalidate();
  }

  // ---- the camera: fixed, the whole room in view between what covers the canvas ----
  function fit() {
    const W = canvas.clientWidth || 1, H = canvas.clientHeight || 1;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    const pitch = (PITCH * Math.PI) / 180;
    const target = new Vector3(0, 6, 4);
    const dir = new Vector3(0, Math.sin(pitch), Math.cos(pitch));
    const corners = [
      [-HALF - 2, 0, HALF + 2], [HALF + 2, 0, HALF + 2], [-HALF - 2, WALL_H + 1, -HALF - 2], [HALF + 2, WALL_H + 1, -HALF - 2],
      [-HALF - 2, WALL_H + 1, HALF], [HALF + 2, WALL_H + 1, HALF], [0, -4, HALF + 2]
    ].map(([x, y, z]) => new Vector3(x, y, z));
    const band = Math.max(0.3, (H - insets.top - insets.bottom) / H);
    camera.clearViewOffset();
    const box = (D: number) => {
      camera.position.copy(target).addScaledVector(dir, D);
      camera.lookAt(target);
      camera.updateMatrixWorld(true);
      camera.updateProjectionMatrix();
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (const c of corners) {
        const p = c.clone().project(camera);
        x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y);
      }
      return { x0, x1, y0, y1 };
    };
    // the nearest camera that keeps the room within the width (a margin) and the band's height
    let lo = 60, hi = 1500;
    for (let i = 0; i < 30; i++) {
      const D = (lo + hi) / 2, b = box(D);
      if (b.x1 - b.x0 <= 1.9 && b.y1 - b.y0 <= 2 * band * 0.96) hi = D;
      else lo = D;
    }
    const b = box(hi);
    // the room's middle in the middle of the band
    const mid = ((b.y0 + b.y1) / 2 + 1) / 2; // 0 foot … 1 top, of the canvas
    const want = 1 - (insets.top + (H - insets.top - insets.bottom) / 2) / H;
    camera.setViewOffset(W, H, 0, (want - mid) * H, W, H);
    camera.updateProjectionMatrix();
    shadowsDirty = true;
    invalidate();
  }
  function resize(i?: Insets) {
    if (i) insets = i;
    fit();
  }

  // ---- taps ----
  const ray = new Raycaster();
  const ndc = new Vector2();
  const ground = new Plane(new Vector3(0, 1, 0), 0);
  const toNdc = (cx: number, cy: number) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
  };
  function floorAt(cx: number, cy: number): [number, number] | null {
    toNdc(cx, cy);
    const p = ray.ray.intersectPlane(ground, new Vector3());
    if (!p || Math.abs(p.x) > HALF || Math.abs(p.z) > HALF) return null;
    return [p.x, p.z];
  }
  function hit(cx: number, cy: number): Hit | null {
    toNdc(cx, cy);
    const objs: Object3D[] = [...[...villagers.values()].map((v) => v.sprite), ...[...live.values()].filter((l) => l.root.visible).map((l) => l.root), mat];
    for (const h of ray.intersectObjects(objs, true)) {
      if (h.object === mat) return { kind: 'door' };
      if (h.object.userData.who) return { kind: 'villager', who: h.object.userData.who as Who };
      const id = h.object.userData.id as string | undefined;
      if (id && !ITEMS[live.get(id)?.spot.item ?? '']?.rug) return { kind: 'piece', id };
      if (id) {
        // a rug is floor to walk on (but a piece of its own in the edit mode: the screen asks pick() for that)
        const p = floorAt(cx, cy);
        return p ? { kind: 'floor', x: p[0], z: p[1] } : null;
      }
    }
    const p = floorAt(cx, cy);
    return p ? { kind: 'floor', x: p[0], z: p[1] } : null;
  }
  function client(x: number, y: number, z: number): [number, number] {
    const p = new Vector3(x, y, z).project(camera), r = canvas.getBoundingClientRect();
    return [r.left + ((p.x + 1) / 2) * r.width, r.top + ((1 - p.y) / 2) * r.height];
  }

  // ---- the frames: on demand ----
  let raf = 0, frames = 0, disposed = false, shadowsDirty = true;
  let readyFn: () => void = () => {};
  const ready = new Promise<void>((r) => (readyFn = r));
  function invalidate() {
    if (!raf && !disposed) raf = requestAnimationFrame(frame);
  }
  const POP_MS = 320, BUMP_MS = 360, HOP_MS = 420;
  function frame() {
    raf = 0;
    if (disposed) return;
    const t = now();
    let more = false;
    for (const l of live.values()) {
      if (!l.body) continue;
      let sx = 1, sy = 1;
      if (l.pop) {
        const k = (t - l.pop) / POP_MS;
        if (k >= 1) l.pop = 0;
        else {
          // a little overshoot: popping in
          const e = 1 + Math.sin(k * Math.PI) * 0.12 * (1 - k);
          sx = sy = 0.7 + 0.3 * ease(k);
          sy *= e;
          more = true;
        }
      }
      if (l.bump) {
        const k = (t - l.bump) / BUMP_MS;
        if (k >= 1) l.bump = 0;
        else {
          const s = Math.sin(k * Math.PI * 3) * 0.07 * (1 - k);
          sx *= 1 + s;
          sy *= 1 - s;
          more = true;
        }
      }
      l.body.scale.set(sx, sy, sx);
    }
    if (ghostBody) {
      const k = Math.min(1, (t - ghostT) / POP_MS);
      ghostRoot.position.y = 3 + Math.sin(k * Math.PI) * 2.5;
      if (k < 1) more = true;
    }
    for (const w of villagers.values()) {
      let bob = 0;
      if (w.path) {
        const a = along(w, t);
        w.pos = a.p;
        if (Math.abs(a.dx) > 0.3) setFace(w, a.dx > 0 ? 1 : -1);
        if (a.done) w.path = null;
        else {
          bob = Math.abs(Math.sin(((t - w.path.t0) / 1000) * Math.PI * 4.2)) * 0.9;
          more = true;
        }
      }
      if (w.hop) {
        const k = (t - w.hop) / HOP_MS;
        if (k >= 1) w.hop = 0;
        else {
          bob += Math.sin(k * Math.PI) * 3.2;
          more = true;
        }
      }
      place(w, bob);
    }
    if (shadowsDirty) {
      renderer.shadowMap.needsUpdate = true;
      shadowsDirty = false;
    }
    // pieces still popping change their shadows
    if (more && [...live.values()].some((l) => l.pop || l.bump)) shadowsDirty = true;
    renderer.render(scene, camera);
    frames++;
    if (frames === 1) readyFn();
    if (more) invalidate();
  }

  fit();
  night(0);

  return {
    resize, surfaces, pieces, hide, ghost, grid, bump, toggle, night, villager,
    at: (who) => (villagers.get(who)?.pos.slice() as [number, number] | undefined) ?? null,
    put(who, p, f) {
      const w = villagers.get(who);
      if (!w) return;
      w.path = null;
      w.pos = [p[0], p[1]];
      if (f) setFace(w, f);
      place(w);
      invalidate();
    },
    walk, walking: (who) => !!villagers.get(who)?.path, face, hop, hit, floorAt, client,
    loading: () => pending,
    stats: () => ({ frames, calls: renderer.info.render.calls, tris: renderer.info.render.triangles, dpr }),
    ready,
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      const seen = new Set<object>();
      const free = (o: Object3D) => o.traverse((n) => {
        const m = n as Mesh;
        if (m.geometry && !seen.has(m.geometry)) (seen.add(m.geometry), m.geometry.dispose());
        const ms = (m.material ? (Array.isArray(m.material) ? m.material : [m.material]) : []) as Material[];
        for (const x of ms) {
          if (seen.has(x)) continue;
          seen.add(x);
          for (const v of Object.values(x)) if (v instanceof Texture && !seen.has(v)) (seen.add(v), v.dispose());
          x.dispose();
        }
      });
      free(scene);
      void Promise.all(models.values()).then((gs) => gs.forEach((g) => g && free(g.scene)));
      disc.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      live.clear();
      villagers.clear();
    }
  };
}
