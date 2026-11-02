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
  Texture, TextureLoader, Vector2, Vector3, WebGLRenderer
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
/** …and while the camera moves (a gesture under way). */
const DPR_MOVING = 1.5;
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
  /** How high it stands (a surface's top: a small thing on a table). */
  y?: number;
  /** A light's switch (1 on, 0 off; none: on, as it came). */
  l?: 0 | 1;
}
/** A villager sitting or lying: where (model units), how high, and the piece's front (it faces that way). */
export interface Pose {
  at: Pt;
  y: number;
  lie: boolean;
  front: Pt;
}
export interface Ghost {
  item: string;
  x: number;
  z: number;
  f: Facing;
  ok: boolean;
  /** On a surface: how high. */
  y?: number;
  /** What stands on it (a table carried with its things): each one's slot and facing on it. */
  kids?: readonly { item: string; x: number; z: number; f: Facing }[];
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
  /** Hide these pieces where they stand (the one I'm moving, the ones the partner holds). */
  hide(ids: readonly string[]): void;
  /** What the partner holds, where their finger has it (model units, the piece's middle): lifted, eased there. */
  held(list: readonly { id: string; item: string; x: number; z: number; f: Facing }[]): void;
  /** The piece under client px, a rug too (the edit mode's pick), furniture first. */
  pick(cx: number, cy: number): string | null;
  ghost(g: Ghost | null): void;
  /** The edit mode's grid on the floor. */
  grid(on: boolean): void;
  /** A piece jiggles where it stands (a tap). */
  bump(id: string): void;
  /** NH's room light switch (off: the room's own light goes down). */
  room(on: boolean): void;
  /** A villager sits or lies (null: it stands where it is). */
  pose(who: Who, p: Pose | null): void;
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
  /** Turn the camera round the room's middle and tilt it (radians), zoom it (a factor: > 1 nearer); all clamped. */
  orbit(dAz: number, dPitch: number): void;
  zoom(f: number): void;
  /** Back to NH's view (eased); whether it's there. */
  resetView(): void;
  isDefault(): boolean;
  /** A gesture under way (a lighter pixel ratio while the camera moves). */
  moving(on: boolean): void;
  /** Where the floor's middle and the usable band's middle are on screen (client px). */
  centre(): { at: [number, number]; band: [number, number] };
  /** What a tap at client px hits, in front first. */
  hit(cx: number, cy: number): Hit | null;
  /** The floor point under client px (model units), or null off the floor. */
  floorAt(cx: number, cy: number): [number, number] | null;
  /** A model point's client px (the e2e and the overlays). */
  client(x: number, y: number, z: number): [number, number];
  /** Pieces still loading. */
  loading(): number;
  /** Frames drawn, and the last frame's draw calls and triangles (the e2e's budget). */
  stats(): { frames: number; calls: number; tris: number; dpr: number; cost: number[] };
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
  const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
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

  // ---- the room: the floor on its base and four walls (the front one with the door), each with its cut top; a wall
  //      between the camera and the room is cut away (NH's Happy Home Paradise), so the room shows from any side ----
  const tex = new TextureLoader();
  const floorMat = new MeshStandardMaterial({ color: 0xd8c4a0, roughness: 0.95 });
  const wallMat = new MeshStandardMaterial({ color: 0xe8dcc6, roughness: 1 });
  const floor = new Mesh(new PlaneGeometry(ROOM * TILE, ROOM * TILE), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  const trimMat = new MeshStandardMaterial({ color: 0x5b4330, roughness: 1 });
  const capMat = new MeshStandardMaterial({ color: 0xf1e6cf, roughness: 1 });
  const T = 2;
  const L = ROOM * TILE;
  /** A wall's face from u0 to u1 along it and y0 to y1 up, its UVs the wallpaper's (two tiles across, the wall's height). */
  const wallFace = (u0: number, u1: number, y0: number, y1: number) => {
    const g = new PlaneGeometry(u1 - u0, y1 - y0);
    g.translate((u0 + u1) / 2, (y0 + y1) / 2, 0);
    const p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + HALF) / (2 * TILE), p.getY(i) / WALL_H);
    return g;
  };
  interface Wall {
    g: Group;
    /** Its outward normal (x, z): cut away when the camera is out on that side. */
    n: [number, number];
  }
  const walls: Wall[] = [];
  /** A wall along u (−HALF…HALF), facing in; `door`: the front one's opening (two tiles wide, three high). */
  function wall(n: [number, number], door = false): Wall {
    const g = new Group();
    const faces = door ? [wallFace(-HALF, -TILE, 0, WALL_H), wallFace(TILE, HALF, 0, WALL_H), wallFace(-TILE, TILE, 30, WALL_H)] : [wallFace(-HALF, HALF, 0, WALL_H)];
    for (const f of faces) {
      const m = new Mesh(f, wallMat);
      m.receiveShadow = true;
      g.add(m);
    }
    // its cut top and the dark frame just outside it (a hair off: their faces never fight the wallpaper's)
    const top = new Mesh(new BoxGeometry(L + T * 2, 1, T), capMat);
    top.position.set(0, WALL_H + 0.5, -T / 2 - 0.15);
    const back = new Mesh(new BoxGeometry(L + T * 2, WALL_H, T), trimMat);
    back.position.set(0, WALL_H / 2, -T / 2 - 0.15);
    g.add(top, back);
    // placed on its side of the room, turned to face in
    g.position.set(-n[0] * -HALF, 0, -n[1] * -HALF);
    g.rotation.y = Math.atan2(-n[0], -n[1]);
    const w = { g, n };
    walls.push(w);
    scene.add(g);
    return w;
  }
  wall([0, -1]);
  wall([-1, 0]);
  wall([1, 0]);
  wall([0, 1], true);
  const base = new Mesh(new BoxGeometry(L + T * 2 + 0.6, 4, L + T * 2 + 0.6), trimMat);
  base.position.set(0, -2.01, 0);
  const mat = new Mesh(new PlaneGeometry(18, 6.5), new MeshStandardMaterial({ map: matTexture(), transparent: true, roughness: 1 }));
  mat.rotation.x = -Math.PI / 2;
  mat.position.set(0, 0.06, HALF - 3.6);
  mat.receiveShadow = true;
  mat.renderOrder = 1;
  scene.add(floor, base, mat);
  /** The walls between the camera and the room go (its side's outward normal toward the camera). */
  function cutaway() {
    const cx = Math.sin(view.az), cz = Math.cos(view.az);
    for (const w of walls) w.g.visible = w.n[0] * cx + w.n[1] * cz < 0.25;
  }

  function surfaces(wallCode: string, fl: string) {
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
    // a wallpaper's tiling is in the walls' UVs; a floor is four tiles each way
    if (wallCode !== cur.wall) void load(wallUrl((cur.wall = wallCode)), wallMat, 1, 1);
    if (fl !== cur.floor) void load(floorUrl((cur.floor = fl)), floorMat, ROOM / 4, ROOM / 4);
  }
  const cur = { wall: '', floor: '' };

  // ---- the grid (edit mode) ----
  const gridLines = (() => {
    const v: number[] = [];
    for (let i = 0; i <= ROOM; i++) {
      const p = -HALF + i * TILE;
      v.push(p, 0.4, -HALF, p, 0.4, HALF, -HALF, 0.4, p, HALF, 0.4, p);
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
  /** Pieces not drawn where they stand: the one I'm moving, the ones the partner holds. */
  let hidden = new Set<string>();
  let pending = 0;
  const placeRoot = (root: Group, s: Spot & { y?: number }, lift = 0) => {
    const [cx, cz] = centreOf(s);
    root.position.set(cx, (s.y ?? 0) + lift, cz);
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
      root.visible = !hidden.has(s.id);
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
  function hide(ids: readonly string[]) {
    hidden = new Set(ids);
    for (const [id, l] of live) l.root.visible = !hidden.has(id);
    lights();
    shadowsDirty = true;
    invalidate();
  }

  // ---- what the partner holds: lifted where their finger has it, a soft yellow footprint, eased between updates ----
  interface Held {
    item: string;
    root: Group;
    ring: LineSegments;
    to: [number, number];
    at: [number, number];
    f: Facing;
    t: number;
  }
  const heldBy = new Map<string, Held>();
  const heldMat = new LineBasicMaterial({ color: 0xffd84d, transparent: true, opacity: 0.95, depthWrite: false });
  const rect = (w: number, d: number) => {
    const hw = (w * TILE) / 2 - 0.4, hd = (d * TILE) / 2 - 0.4, y = 0.6;
    return new BufferGeometry().setAttribute('position', new Float32BufferAttribute([
      -hw, y, -hd, hw, y, -hd, hw, y, -hd, hw, y, hd, hw, y, hd, -hw, y, hd, -hw, y, hd, -hw, y, -hd
    ], 3));
  };
  function held(list: readonly { id: string; item: string; x: number; z: number; f: Facing }[]) {
    const ids = new Set(list.map((h) => h.id));
    for (const [id, h] of heldBy) if (!ids.has(id) || h.item !== list.find((x) => x.id === id)?.item) {
      scene.remove(h.root, h.ring);
      h.ring.geometry.dispose();
      heldBy.delete(id);
    }
    for (const x of list) {
      let h = heldBy.get(x.id);
      if (!h) {
        const root = new Group();
        const [w, d] = footprint(x.item, x.f);
        const ring = new LineSegments(rect(w, d), heldMat);
        ring.renderOrder = 4;
        // from where the piece stands (or straight where the finger is, a new one)
        const from = live.get(x.id)?.root.position;
        h = { item: x.item, root, ring, to: [x.x, x.z], at: from ? [from.x, from.z] : [x.x, x.z], f: x.f, t: now() };
        heldBy.set(x.id, h);
        scene.add(root, ring);
        const hh = h;
        void model(x.item).then((g) => {
          if (!g || disposed || heldBy.get(x.id) !== hh) return;
          root.add(g.scene.clone(true));
          invalidate();
        });
      }
      if (h.f !== x.f) {
        const [w, d] = footprint(x.item, x.f);
        h.ring.geometry.dispose();
        h.ring.geometry = rect(w, d);
      }
      h.to = [x.x, x.z];
      h.f = x.f;
    }
    invalidate();
  }

  // ---- the ghost: what's held, lifted, its footprint green or red ----
  const ghostRoot = new Group();
  // (over a rug: rugs sit a little over the floor, drawn nearer by their polygon offset)
  const footMat = new MeshBasicMaterial({ color: 0x78dc78, transparent: true, opacity: 0.5, depthWrite: false, side: DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8 });
  const foot = new Mesh(new PlaneGeometry(1, 1), footMat);
  foot.rotation.x = -Math.PI / 2;
  foot.renderOrder = 3;
  const ring = new LineSegments(new BufferGeometry(), new LineBasicMaterial({ color: 0xffffff }));
  ring.renderOrder = 4;
  scene.add(ghostRoot, foot, ring);
  foot.visible = ring.visible = false;
  let ghostKey = '';
  let ghostBody: Object3D | null = null;
  let ghostT = 0, ghostY = 0, ghostKidsKey = '[]';
  const ghostKids = new Group();
  ghostRoot.add(ghostKids);
  let ghostTurn: { from: number; to: number; t0: number } | null = null;
  function ghost(g: Ghost | null) {
    foot.visible = ring.visible = ghostRoot.visible = !!g;
    if (!g) {
      ghostKey = '';
      ghostKidsKey = '[]';
      ghostKids.clear();
      if (ghostBody) ghostRoot.remove(ghostBody);
      ghostBody = null;
      invalidate();
      return;
    }
    const [w, d] = footprint(g.item, g.f);
    const [cx, cz] = centreOf(g);
    foot.scale.set(w * TILE - 0.8, d * TILE - 0.8, 1);
    foot.position.set(cx, (g.y ?? 0) + 0.5, cz);
    footMat.color.set(g.ok ? 0x78dc78 : 0xf05a50);
    const hw = (w * TILE) / 2 - 0.4, hd = (d * TILE) / 2 - 0.4, y = 0.6;
    ring.geometry.dispose();
    ring.geometry = new BufferGeometry().setAttribute('position', new Float32BufferAttribute([
      -hw, y, -hd, hw, y, -hd, hw, y, -hd, hw, y, hd, hw, y, hd, -hw, y, hd, -hw, y, hd, -hw, y, -hd
    ], 3));
    ring.position.set(cx, g.y ?? 0, cz);
    const was = ghostRoot.rotation.y, same = ghostKey === g.item;
    placeRoot(ghostRoot, g, 3);
    ghostY = g.y ?? 0;
    // its things ride with it, each on its slot (the table's own frame: they turn with it)
    const kidsKey = JSON.stringify(g.kids ?? []);
    if (kidsKey !== ghostKidsKey) {
      ghostKidsKey = kidsKey;
      ghostKids.clear();
      const m = ITEMS[g.item], w = m?.w ?? 1, d = m?.d ?? 1, h = m?.h ?? 0;
      for (const k of g.kids ?? []) {
        const holder = new Group();
        holder.position.set((k.x + 0.5 - w / 2) * TILE, h, (k.z + 0.5 - d / 2) * TILE);
        holder.rotation.y = (k.f * Math.PI) / 2;
        ghostKids.add(holder);
        void model(k.item).then((mm) => {
          if (mm && !disposed && ghostKids.children.includes(holder)) (holder.add(mm.scene.clone(true)), invalidate());
        });
      }
    }
    // a quarter turn eases round (the shortest way), the footprint already where it lands
    const to = ghostRoot.rotation.y;
    if (same && Math.abs(Math.atan2(Math.sin(to - was), Math.cos(to - was))) > 0.01) {
      ghostTurn = { from: was, to: was + Math.atan2(Math.sin(to - was), Math.cos(to - was)), t0: now() };
      ghostRoot.rotation.y = was;
    }
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
  /** NH's room light switch: off, the room's own light goes down (the lamps that are on light it). */
  let roomOn = true;
  function lights() {
    // a light glows while it's switched on (NH's lamps: at any hour); in the dark (night, or the room's light off) the
    // ones on light the room round them (a few point lights: the phone's budget)
    const dark = nightN > 0.5 || !roomOn;
    const lamps = [...live.values()].filter((l) => ITEMS[l.spot.item]?.lt && l.root.visible).map((l) => {
      const on = (l.spot.l ?? 1) === 1;
      for (const m of l.lit) m.emissiveIntensity = on ? 1.4 : 0;
      return { l, on };
    }).filter((x) => x.on);
    lamps.sort((a, b) => a.l.root.position.length() - b.l.root.position.length());
    pointLights.forEach((p, i) => {
      const x = dark ? lamps[i] : undefined;
      p.intensity = x ? 900 : 0;
      if (x) p.position.set(x.l.root.position.x, (ITEMS[x.l.spot.item]?.h ?? 8) * 0.8 + 2, x.l.root.position.z);
    });
  }
  function room(on: boolean) {
    roomOn = on;
    night(nightN);
  }
  function night(n: number) {
    nightN = Math.max(0, Math.min(1, n));
    const k = nightN, dim = roomOn ? 1 : 0.32;
    hemi.intensity = (1.5 - 0.75 * k) * dim;
    hemi.color.set(0xfff3dc).lerp(new Color(0xc9c4e8), k * 0.6);
    key.intensity = (2.1 - 1.3 * k) * dim;
    key.color.set(0xfff0d6).lerp(new Color(0xffd29a), k);
    amb.intensity = (0.35 - 0.1 * k) * (roomOn ? 1 : 0.6);
    fill.intensity = (0.9 - 0.4 * k) * dim;
    for (const v of villagers.values()) v.mat.color.set(0xffffff).lerp(new Color(0xd8cfe8), k * 0.35);
    lights();
    invalidate();
  }

  // ---- the villagers: billboards of their renders standing at their feet, turned to the camera about the up axis
  //      only (and leaning back a little toward it, so a steep view doesn't squash them), cut out by alpha (depth
  //      sorted with the furniture: behind a table it hides them, in front of it they cover it), a soft round shadow ----
  interface Walker {
    look: Look;
    card: Mesh;
    mat: MeshBasicMaterial;
    shadow: Mesh;
    pos: [number, number];
    /** -1 left, 1 right. */
    face: number;
    path: { from: [number, number]; pts: Pt[]; t0: number; ms: number; lens: number[]; total: number } | null;
    hop: number;
    /** Sitting or lying (a walk stands it up). */
    pose: Pose | null;
    /** The render's alpha, small (a tap hits the villager, not the clear around it). */
    alpha: { w: number; h: number; a: Uint8ClampedArray } | null;
  }
  const villagers = new Map<Who, Walker>();
  const disc = softDisc();
  const cardGeo = new PlaneGeometry(1, 1).translate(0, 0.5, 0);
  const shadowGeo = new CircleGeometry(4.2, 24);
  const shadowMat = new MeshBasicMaterial({ map: disc, transparent: true, depthWrite: false });
  function villager(who: Who, look: Look | null) {
    const was = villagers.get(who);
    if (was && (!look || was.look.url !== look.url)) {
      scene.remove(was.card, was.shadow);
      was.mat.map?.dispose();
      was.mat.dispose();
      villagers.delete(who);
    }
    if (!look || villagers.has(who)) return invalidate();
    const mat = new MeshBasicMaterial({ alphaTest: 0.5, side: DoubleSide });
    mat.visible = false;
    const card = new Mesh(cardGeo, mat);
    card.rotation.order = 'YXZ';
    card.userData.who = who;
    const shadow = new Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.renderOrder = 2;
    const w: Walker = { look, card, mat, shadow, pos: [who === 'A' ? -6 : 6, 20], face: who === 'A' ? 1 : -1, path: null, hop: 0, alpha: null, pose: null };
    villagers.set(who, w);
    scene.add(card, shadow);
    tex.loadAsync(look.url).then((t) => {
      if (disposed || villagers.get(who) !== w) return t.dispose();
      t.colorSpace = SRGBColorSpace;
      mat.map = t;
      mat.visible = true;
      mat.needsUpdate = true;
      const img = t.image as CanvasImageSource & { width: number; height: number };
      const ah = 48, aw = Math.max(1, Math.round((ah * img.width) / img.height));
      const c = document.createElement('canvas');
      c.width = aw;
      c.height = ah;
      const g = c.getContext('2d', { willReadFrequently: true });
      if (g) {
        g.drawImage(img, 0, 0, aw, ah);
        const d = g.getImageData(0, 0, aw, ah).data, a = new Uint8ClampedArray(aw * ah);
        for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 3];
        w.alpha = { w: aw, h: ah, a };
      }
      night(nightN);
      place(w);
      invalidate();
    }, () => {});
    place(w);
  }
  function setFace(w: Walker, face: number) {
    w.face = face;
  }
  /** As drawn the render looks left (most) or right; mirrored to face the other way (never a no-mirror one). The
   *  facing is on screen: left and right as the camera sees them. */
  function place(w: Walker, bob = 0, squash = 0) {
    const P = w.pose;
    // seated, it faces the piece's front as the camera sees it
    if (P) w.face = screenSide(P.front[0], P.front[1]) || w.face;
    const flip = !w.look.noMirror && (w.face > 0) !== w.look.looksRight;
    if (P) {
      // the renders have no sitting or lying art: sitting, the billboard sinks into the seat to the hips, a little
      // shorter; lying, it lies back along the bed, its head toward the bed's back, facing up at the camera
      w.card.position.set(P.at[0], P.lie ? P.y + 0.3 : P.y - VILLAGER_H * 0.22, P.at[1]);
      w.card.rotation.set(P.lie ? -Math.PI / 2 + 0.35 : view.pitch * 0.45, view.az, 0);
      w.card.scale.set(VILLAGER_H * w.look.aspect * (flip ? -1 : 1), VILLAGER_H * (P.lie ? 0.95 : 0.92), 1);
      w.shadow.visible = false;
      return;
    }
    w.shadow.visible = true;
    w.card.position.set(w.pos[0], bob, w.pos[1]);
    w.card.rotation.set(view.pitch * 0.45, view.az, 0);
    w.card.scale.set(VILLAGER_H * w.look.aspect * (flip ? -1 : 1) * (1 + squash), VILLAGER_H * (1 - squash), 1);
    w.shadow.position.set(w.pos[0], 0.1, w.pos[1]);
    const s = 1 - Math.min(0.3, bob / 8);
    w.shadow.scale.set(s, s, s);
  }
  function pose(who: Who, p: Pose | null) {
    const w = villagers.get(who);
    if (!w) return;
    w.pose = p;
    if (p) {
      w.path = null;
      w.pos = [p.at[0], p.at[1]];
    }
    place(w);
    invalidate();
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
    w.pose = null;
    w.path = { from, pts: [...pts], t0: now() - (o.ago ?? 0), ms: Math.max(1, ms), lens, total };
    invalidate();
    return ms;
  }
  /** Where a walk has a villager by now, and which way it's heading (null: over). */
  function along(w: Walker, t: number): { p: [number, number]; d: [number, number]; done: boolean } {
    const P = w.path!;
    const k = Math.min(1, (t - P.t0) / P.ms);
    let d = k * P.total, a: Pt = P.from;
    for (let i = 0; i < P.pts.length; i++) {
      const b = P.pts[i];
      if (d <= P.lens[i] || i === P.pts.length - 1) {
        const f = P.lens[i] ? Math.min(1, d / P.lens[i]) : 1;
        return { p: [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f], d: [b[0] - a[0], b[1] - a[1]], done: k >= 1 };
      }
      d -= P.lens[i];
      a = b;
    }
    return { p: [P.from[0], P.from[1]], d: [0, 0], done: true };
  }
  /** Left (-1) or right (1) on screen for a heading (x, z) in the room, as the camera now looks. */
  const screenSide = (dx: number, dz: number) => {
    const s = dx * Math.cos(view.az) - dz * Math.sin(view.az);
    return Math.abs(s) < 0.3 ? 0 : s > 0 ? 1 : -1;
  };
  function face(who: Who, toward: Pt) {
    const w = villagers.get(who);
    if (!w) return;
    const s = screenSide(toward[0] - w.pos[0], toward[1] - w.pos[1]);
    if (!s) return;
    setFace(w, s);
    place(w);
    invalidate();
  }
  function hop(who: Who) {
    const w = villagers.get(who);
    if (!w) return;
    w.hop = now();
    invalidate();
  }

  // ---- the camera: NH's room camera to start with (the whole room in view, its floor's middle at the middle of
  //      what the controls leave of the screen), then the player's to turn round that middle, tilt and zoom, within
  //      limits (the walls never clip: the near ones cut away); the limits are soft under a pinch and eased back to ----
  const DEF = { az: 0, pitch: (PITCH * Math.PI) / 180, k: 1 };
  const PITCH_MIN = (28 * Math.PI) / 180, PITCH_MAX = (78 * Math.PI) / 180;
  /** Zoom (× the fitted distance): in to about two and a half tiles across, out to a little past the whole room. */
  const K_MIN = 0.3, K_MAX = 1.6;
  const view = { ...DEF };
  /** What the camera turns round and looks at: the floor's middle. */
  const target = new Vector3(0, 0, 0);
  /** The default view's distance (fitted to the screen) and the vertical offset (px) that puts the target at the
   *  middle of the usable band; eased to when the band changes (the edit tray opening). */
  let baseD = 300, shiftY = 0;
  let framing: { from: [number, number]; to: [number, number]; t0: number } | null = null;
  let easing: { from: typeof DEF; t0: number; to?: typeof DEF } | null = null;
  function aim() {
    // a corner-on view of the square room is wider than a side-on one: the camera steps back to keep it in
    const corner = Math.abs(Math.cos(view.az)) + Math.abs(Math.sin(view.az));
    const d = baseD * view.k * (1 + (corner - 1) * 0.85);
    camera.position.set(
      target.x + Math.sin(view.az) * Math.cos(view.pitch) * d,
      target.y + Math.sin(view.pitch) * d,
      target.z + Math.cos(view.az) * Math.cos(view.pitch) * d
    );
    camera.lookAt(target);
    camera.updateMatrixWorld(true);
    // near enough to see one piece well: the near plane comes in with it
    const near = Math.max(1, d * 0.05);
    if (Math.abs(camera.near - near) > 0.5) {
      camera.near = near;
      camera.updateProjectionMatrix();
    }
    cutaway();
    for (const w of villagers.values()) place(w);
  }
  const offset = () => {
    const W = canvas.clientWidth || 1, H = canvas.clientHeight || 1;
    camera.setViewOffset(W, H, 0, shiftY, W, H);
    camera.updateProjectionMatrix();
  };
  /** The distance and offset for this screen and these insets (the default view), without moving the camera. */
  function framingFor(): [number, number] {
    const W = canvas.clientWidth || 1, H = canvas.clientHeight || 1;
    camera.aspect = W / H;
    const corners = [
      [-HALF - 2, 0, HALF + 2], [HALF + 2, 0, HALF + 2], [-HALF - 2, WALL_H + 1, -HALF - 2], [HALF + 2, WALL_H + 1, -HALF - 2],
      [-HALF - 2, WALL_H + 1, HALF], [HALF + 2, WALL_H + 1, HALF], [0, -4, HALF + 2]
    ].map(([x, y, z]) => new Vector3(x, y, z));
    const bandH = Math.max(0.3 * H, H - insets.top - insets.bottom);
    const was = { ...view, baseD, shiftY };
    camera.clearViewOffset();
    Object.assign(view, DEF);
    // the target projects to the canvas's middle (no offset); the room must fit within half the band either side of it
    const fits = (D: number) => {
      baseD = D;
      aim();
      camera.updateProjectionMatrix();
      let x = 0, y = 0;
      for (const c of corners) {
        const p = c.clone().project(camera);
        x = Math.max(x, Math.abs(p.x));
        y = Math.max(y, Math.abs(p.y));
      }
      return x <= 0.95 && y <= (bandH / H) * 0.96;
    };
    let lo = 40, hi = 2000;
    for (let i = 0; i < 32; i++) {
      const D = (lo + hi) / 2;
      if (fits(D)) hi = D;
      else lo = D;
    }
    // the band's middle (px from the top) is where the target goes: the view moves by the difference from the canvas's
    const mid = insets.top + bandH / 2;
    const out: [number, number] = [hi, H / 2 - mid];
    Object.assign(view, { az: was.az, pitch: was.pitch, k: was.k });
    baseD = was.baseD;
    shiftY = was.shiftY;
    return out;
  }
  let fitted = false;
  /** Refit (`ease`: to the new framing over a moment, as when the edit tray opens). */
  function fit(ease = false) {
    const W = canvas.clientWidth || 1, H = canvas.clientHeight || 1;
    renderer.setSize(W, H, false);
    const to = framingFor();
    if (ease && fitted) framing = { from: [baseD, shiftY], to, t0: now() };
    else [baseD, shiftY] = to;
    fitted = true;
    offset();
    aim();
    shadowsDirty = true;
    invalidate();
  }
  function resize(i?: Insets) {
    const changed = !!i && (i.top !== insets.top || i.bottom !== insets.bottom);
    if (i) insets = i;
    fit(changed);
  }
  /** Inside the limits, or a little past them under a finger (a soft give, eased back when it lets go). */
  const soft = (v: number, lo: number, hi: number, give: number) =>
    v < lo ? lo - give * (1 - Math.exp(-(lo - v) / give)) : v > hi ? hi + give * (1 - Math.exp(-(v - hi) / give)) : v;
  const clampView = (hard = false) => {
    view.pitch = hard ? Math.min(PITCH_MAX, Math.max(PITCH_MIN, view.pitch)) : soft(view.pitch, PITCH_MIN, PITCH_MAX, 0.06);
    view.k = hard ? Math.min(K_MAX, Math.max(K_MIN, view.k)) : soft(view.k, K_MIN, K_MAX, 0.06);
    view.az = Math.atan2(Math.sin(view.az), Math.cos(view.az));
  };
  function orbit(dAz: number, dPitch: number) {
    easing = null;
    view.az += dAz;
    view.pitch += dPitch;
    clampView();
    aim();
    invalidate();
  }
  function zoom(f: number) {
    easing = null;
    view.k /= f;
    clampView();
    aim();
    invalidate();
  }
  /** Back inside the limits, eased (a pinch let go past one). */
  function settle() {
    const want = { ...view };
    const k0 = view.k, p0 = view.pitch;
    Object.assign(want, { k: Math.min(K_MAX, Math.max(K_MIN, k0)), pitch: Math.min(PITCH_MAX, Math.max(PITCH_MIN, p0)) });
    if (want.k === k0 && want.pitch === p0) return;
    easing = { from: { ...view }, t0: now(), to: want };
    invalidate();
  }
  /** Back to NH's view, eased (the shortest way round). */
  function resetView() {
    easing = { from: { ...view }, t0: now() };
    invalidate();
  }
  const isDefault = () => Math.abs(view.az) < 0.02 && Math.abs(view.pitch - DEF.pitch) < 0.02 && Math.abs(view.k - 1) < 0.02;
  /** A gesture under way: a lighter pixel ratio while the camera moves, the full one when it rests. */
  let movingNow = false, restTimer: ReturnType<typeof setTimeout> | undefined;
  function moving(on: boolean) {
    clearTimeout(restTimer);
    if (on && !movingNow) {
      movingNow = true;
      renderer.setPixelRatio(Math.min(DPR_MOVING, dpr));
      fit();
    } else if (!on) {
      settle();
      if (movingNow) restTimer = setTimeout(() => {
        movingNow = false;
        renderer.setPixelRatio(dpr);
        fit();
      }, 160);
    }
  }
  /** Where the floor's middle is on screen and where the usable band's middle is (client px: the e2e's check). */
  function centre(): { at: [number, number]; band: [number, number] } {
    const r = canvas.getBoundingClientRect();
    const H = canvas.clientHeight || 1;
    const bandH = Math.max(0.3 * H, H - insets.top - insets.bottom);
    return { at: client(target.x, target.y, target.z), band: [r.left + r.width / 2, r.top + insets.top + bandH / 2] };
  }

  // ---- taps ----
  const ray = new Raycaster();
  const ndc = new Vector2();
  const ground = new Plane(new Vector3(0, 1, 0), 0);
  const toNdc = (cx: number, cy: number) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    // what changed since the last frame (a piece just placed, a frame not drawn yet) is where it is
    scene.updateMatrixWorld();
    ray.setFromCamera(ndc, camera);
  };
  function floorAt(cx: number, cy: number): [number, number] | null {
    toNdc(cx, cy);
    const p = ray.ray.intersectPlane(ground, new Vector3());
    if (!p || Math.abs(p.x) > HALF || Math.abs(p.z) > HALF) return null;
    return [p.x, p.z];
  }
  function pick(cx: number, cy: number): string | null {
    toNdc(cx, cy);
    let rug: string | null = null;
    for (const h of ray.intersectObjects([...live.values()].filter((l) => l.root.visible).map((l) => l.root), true)) {
      const id = h.object.userData.id as string | undefined;
      if (!id) continue;
      if (!ITEMS[live.get(id)?.spot.item ?? '']?.rug) return id;
      rug ??= id;
    }
    return rug ?? onTiles(cx, cy);
  }
  /** The piece whose tiles are under client px (a tap between a model's legs, a piece still popping in): furniture
   *  before a rug. */
  function onTiles(cx: number, cy: number): string | null {
    const p = floorAt(cx, cy);
    if (!p) return null;
    const tx = Math.floor((p[0] + HALF) / TILE), tz = Math.floor((p[1] + HALF) / TILE);
    let rug: string | null = null;
    // what stands highest first: a lamp on a table before the table
    for (const l of [...live.values()].sort((a, b) => (b.spot.y ?? 0) - (a.spot.y ?? 0))) {
      if (!l.root.visible) continue;
      const [w, d] = footprint(l.spot.item, l.spot.f);
      if (tx < l.spot.x || tz < l.spot.z || tx >= l.spot.x + w || tz >= l.spot.z + d) continue;
      if (!ITEMS[l.spot.item]?.rug) return l.spot.id;
      rug ??= l.spot.id;
    }
    return rug;
  }
  function hit(cx: number, cy: number): Hit | null {
    toNdc(cx, cy);
    const objs: Object3D[] = [...[...villagers.values()].map((v) => v.card), ...[...live.values()].filter((l) => l.root.visible).map((l) => l.root), mat];
    for (const h of ray.intersectObjects(objs, true)) {
      if (h.object === mat) return { kind: 'door' };
      if (h.object.userData.who) {
        // only where the render is drawn (a little grown: a 44 px finger)
        const w = villagers.get(h.object.userData.who as Who);
        if (w?.alpha && h.uv) {
          const { w: aw, h: ah, a } = w.alpha;
          const u = h.uv.x;
          const px = Math.round(u * (aw - 1)), py = Math.round((1 - h.uv.y) * (ah - 1));
          let solid = false;
          for (let dy = -3; dy <= 3 && !solid; dy++) for (let dx = -3; dx <= 3 && !solid; dx++) {
            const x = px + dx, y = py + dy;
            if (x >= 0 && y >= 0 && x < aw && y < ah && a[y * aw + x] > 40) solid = true;
          }
          if (!solid) continue;
        }
        return { kind: 'villager', who: h.object.userData.who as Who };
      }
      const id = h.object.userData.id as string | undefined;
      if (id && !ITEMS[live.get(id)?.spot.item ?? '']?.rug) return { kind: 'piece', id };
      if (id) {
        // a rug is floor to walk on (but a piece of its own in the edit mode: the screen asks pick() for that)
        const p = floorAt(cx, cy);
        return p ? { kind: 'floor', x: p[0], z: p[1] } : null;
      }
    }
    // a tap on a piece's own tiles (between its legs, or before its model is in) is the piece
    const on = onTiles(cx, cy);
    if (on && !ITEMS[live.get(on)?.spot.item ?? '']?.rug) return { kind: 'piece', id: on };
    const p = floorAt(cx, cy);
    return p ? { kind: 'floor', x: p[0], z: p[1] } : null;
  }
  function client(x: number, y: number, z: number): [number, number] {
    const p = new Vector3(x, y, z).project(camera), r = canvas.getBoundingClientRect();
    return [r.left + ((p.x + 1) / 2) * r.width, r.top + ((1 - p.y) / 2) * r.height];
  }

  // ---- the frames: on demand ----
  let raf = 0, frames = 0, disposed = false, shadowsDirty = true;
  const cost: number[] = [];
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
    for (const h of heldBy.values()) {
      // eased toward the latest spot heard (updates come ~10 a second): a glide, not a jump
      const dt = Math.min(100, t - h.t);
      h.t = t;
      const k = 1 - Math.exp(-dt / 70);
      h.at = [h.at[0] + (h.to[0] - h.at[0]) * k, h.at[1] + (h.to[1] - h.at[1]) * k];
      h.root.position.set(h.at[0], 3 + Math.sin(t / 260) * 0.6, h.at[1]);
      h.root.rotation.y = (h.f * Math.PI) / 2;
      h.ring.position.set(h.to[0], 0, h.to[1]);
      more = true;
    }
    if (ghostTurn) {
      const k = Math.min(1, (t - ghostTurn.t0) / 160);
      ghostRoot.rotation.y = ghostTurn.from + (ghostTurn.to - ghostTurn.from) * ease(k);
      if (k >= 1) ghostTurn = null;
      else more = true;
    }
    if (ghostBody) {
      const k = Math.min(1, (t - ghostT) / POP_MS);
      ghostRoot.position.y = ghostY + 3 + Math.sin(k * Math.PI) * 2.5;
      if (k < 1) more = true;
    }
    if (framing) {
      // to the new framing (the edit tray opening or closing): the room glides to the middle of what's left
      const k = Math.min(1, (t - framing.t0) / 320), e = ease(k);
      baseD = framing.from[0] + (framing.to[0] - framing.from[0]) * e;
      shiftY = framing.from[1] + (framing.to[1] - framing.from[1]) * e;
      offset();
      aim();
      if (k >= 1) framing = null;
      else more = true;
    }
    if (easing) {
      // back to NH's view, or back inside the limits
      const k = Math.min(1, (t - easing.t0) / (easing.to ? 240 : 420)), e = ease(k), f = easing.from, to = easing.to ?? DEF;
      const dAz = Math.atan2(Math.sin(to.az - f.az), Math.cos(to.az - f.az));
      view.az = f.az + dAz * e;
      view.pitch = f.pitch + (to.pitch - f.pitch) * e;
      view.k = f.k + (to.k - f.k) * e;
      aim();
      if (k >= 1) easing = null;
      else more = true;
    }
    for (const w of villagers.values()) {
      let bob = 0, squash = 0;
      if (w.path) {
        const a = along(w, t);
        w.pos = a.p;
        const side = screenSide(a.d[0], a.d[1]);
        if (side) setFace(w, side);
        if (a.done) w.path = null;
        else {
          // NH's trot: a bob a step and a little squash as each foot lands (the renders have no walk frames)
          const ph = ((t - w.path.t0) / 1000) * Math.PI * 4.2;
          bob = Math.abs(Math.sin(ph)) * 0.9;
          squash = Math.max(0, Math.cos(ph * 2)) * 0.04;
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
      place(w, bob, squash);
    }
    if (shadowsDirty) {
      renderer.shadowMap.needsUpdate = true;
      shadowsDirty = false;
    }
    // pieces still popping change their shadows
    if (more && [...live.values()].some((l) => l.pop || l.bump)) shadowsDirty = true;
    renderer.render(scene, camera);
    // the frame's own cost (the CPU side: three's work and the GL calls), for the budget checks
    cost.push(now() - t);
    if (cost.length > 600) cost.shift();
    frames++;
    if (frames === 1) readyFn();
    if (more) invalidate();
  }

  fit();
  night(0);

  return {
    resize, surfaces, pieces, hide, held, pick, ghost, grid, bump, room, pose, night, villager,
    at: (who) => (villagers.get(who)?.pos.slice() as [number, number] | undefined) ?? null,
    put(who, p, f) {
      const w = villagers.get(who);
      if (!w) return;
      w.path = null;
      w.pose = null;
      w.pos = [p[0], p[1]];
      if (f) setFace(w, f);
      place(w);
      invalidate();
    },
    walk, walking: (who) => !!villagers.get(who)?.path, face, hop, hit, floorAt, client, orbit, zoom, resetView, isDefault, moving, centre,
    loading: () => pending,
    stats: () => ({ frames, calls: renderer.info.render.calls, tris: renderer.info.render.triangles, dpr: renderer.getPixelRatio(), cost: cost.slice() }),
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
