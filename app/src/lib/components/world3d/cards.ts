// The 3D island's billboards (docs/design.md "World"): a villager with no NH model (or while its model loads: their
// official renders, as the tent draws them), and anything whose NH model hasn't landed yet (today's art on a card). The
// visitors are never cards: NH's models only (world3d/villagers.ts). Each is a card standing at its
// feet, leaning back a little with the camera's pitch (all the way would cut its head into what stands behind it),
// stretched up so it shows as tall as the 2D island draws it (the island's overlays, a balloon or a 「！」, sit on its
// head), alpha-tested and depth-tested, with a soft blob shadow. Textures are shared by URL.
import {
  CanvasTexture, CircleGeometry, DoubleSide, Mesh, MeshBasicMaterial, MeshDepthMaterial, PlaneGeometry, RGBADepthPacking,
  SRGBColorSpace, TextureLoader, type Scene, type Texture
} from 'three';
import { bend } from './bend.ts';

export interface CardSpec {
  url: string;
  /** Width over height of the art. */
  aspect: number;
  /** Its height (u). */
  h: number;
  x: number;
  z: number;
  /** Units above the ground (a hop, a flight). */
  lift?: number;
  /** Mirrored. */
  flip?: boolean;
  hidden?: boolean;
  /** A squash and stretch (+: wider and shorter), and a tilt (radians, about its feet). */
  squash?: number;
  tilt?: number;
  /** Its blob shadow's radius (u; none: 0). */
  shadow?: number;
  /** Untinted by the time of day (a light). */
  lit?: boolean;
  /** The art's foot is this share of its height above the image's bottom (a render with a margin). */
  foot?: number;
  opacity?: number;
  /** The figure's box in the image (a padded render: art.ts's box), as shares [x, y, w, h] from its top-left. */
  crop?: readonly [number, number, number, number];
  /** Where its feet are across the art (a share from its left; default the middle). */
  ax?: number;
  /** It casts a real shadow (a still thing: the shadow map redraws when it changes); else its blob only. */
  cast?: boolean;
}

export interface Cards {
  set(id: string, spec: CardSpec | null): void;
  /** Place every card for this camera: `lean` (its pitch's share), and how tall a card shows there (screen px of its
   *  height per world unit over the px a unit across): it's stretched by the inverse. */
  frame(lean: number, stretch: (x: number, y: number, z: number, lean: number) => number, feet: (x: number, z: number) => number): boolean;
  /** A tap's jiggle (a squash and a sway, as a model's wobble): true if there's such a card. */
  jiggle(id: string, strength?: number): boolean;
  tint(hex: number): void;
  pending(): number;
  dispose(): void;
}

/** NH's soft round shadow under a thing (a card's; the balloon's, world3d/balloon3d.ts). */
export function softDisc(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const r = g.createRadialGradient(32, 32, 2, 32, 32, 31);
  r.addColorStop(0, 'rgba(30,40,20,0.42)');
  r.addColorStop(1, 'rgba(30,40,20,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** `changed(shadows)`: draw again (and the shadow map, when a caster changed). */
export function createCards(scene: Scene, changed: (shadows: boolean) => void): Cards {
  const loader = new TextureLoader();
  const texs = new Map<string, { t: Promise<Texture | null>; got: Texture | null; n: number }>();
  let pending = 0, tintHex = 0xffffff, disposed = false;
  const tex = (url: string) => {
    let e = texs.get(url);
    if (!e) {
      pending++;
      const entry: { t: Promise<Texture | null>; got: Texture | null; n: number } = { t: Promise.resolve(null), got: null, n: 0 };
      entry.t = loader.loadAsync(url).then((t) => {
        pending--;
        t.colorSpace = SRGBColorSpace;
        t.anisotropy = 4;
        entry.got = t;
        return t;
      }, () => (pending--, null));
      texs.set(url, (e = entry));
    }
    e.n++;
    return e;
  };
  const release = (url: string) => {
    const e = texs.get(url);
    if (!e || --e.n > 0) return;
    texs.delete(url);
    void e.t.then((t) => t?.dispose());
  };
  const cardGeo = new PlaneGeometry(1, 1).translate(0, 0.5, 0);
  const disc = softDisc();
  const shadowGeo = new CircleGeometry(1, 20).rotateX(-Math.PI / 2);
  const shadowMat = bend(new MeshBasicMaterial({ map: disc, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
  interface Card {
    spec: CardSpec;
    mesh: Mesh;
    mat: MeshBasicMaterial;
    depth: MeshDepthMaterial;
    shadow: Mesh;
    own?: Texture;
  }
  const cards = new Map<string, Card>();

  function set(id: string, spec: CardSpec | null) {
    const was = cards.get(id);
    if (was && (!spec || spec.url !== was.spec.url || String(spec.crop) !== String(was.spec.crop))) {
      scene.remove(was.mesh, was.shadow);
      was.mat.dispose();
      was.depth.dispose();
      was.own?.dispose();
      release(was.spec.url);
      cards.delete(id);
    }
    if (!spec) return changed(!!was?.spec.cast);
    const have = cards.get(id);
    if (have) {
      const cast = !!have.spec.cast || !!spec.cast;
      have.spec = spec;
      have.mesh.castShadow = !!spec.cast;
      return changed(cast);
    }
    const mat = bend(new MeshBasicMaterial({ alphaTest: 0.5, side: DoubleSide, color: spec.lit ? 0xffffff : tintHex, transparent: spec.opacity !== undefined }));
    mat.visible = false;
    const depth = new MeshDepthMaterial({ depthPacking: RGBADepthPacking, alphaTest: 0.5 }); // (flat: things.ts)
    const mesh = new Mesh(cardGeo, mat);
    mesh.frustumCulled = false;
    mesh.castShadow = !!spec.cast;
    mesh.customDepthMaterial = depth;
    mesh.renderOrder = 5;
    const shadow = new Mesh(shadowGeo, shadowMat);
    shadow.frustumCulled = false;
    shadow.renderOrder = 4;
    const c: Card = { spec, mesh, mat, depth, shadow };
    cards.set(id, c);
    scene.add(mesh, shadow);
    const e = tex(spec.url);
    // a cropped figure: its own copy of the texture (the image itself shared) shifted to the box
    const use = (t: Texture) => {
      const crop = spec.crop;
      let m = t;
      if (crop) {
        m = t.clone();
        m.repeat.set(crop[2], crop[3]);
        m.offset.set(crop[0], 1 - crop[1] - crop[3]);
        c.own = m;
      }
      mat.map = depth.map = m;
      mat.visible = true;
      mat.needsUpdate = depth.needsUpdate = true;
    };
    if (e.got) use(e.got);
    else void e.t.then((t) => {
      if (disposed || cards.get(id) !== c || !t) return;
      use(t);
      changed(!!c.spec.cast);
    });
    changed(!!spec.cast);
  }

  const jigs = new Map<string, { t0: number; k: number }>();
  const JIG_MS = 520;
  function frame(lean: number, stretch: (x: number, y: number, z: number, lean: number) => number, feet: (x: number, z: number) => number): boolean {
    const t = performance.now();
    let more = false;
    for (const [id, j] of jigs) if (t - j.t0 >= JIG_MS || !cards.has(id)) jigs.delete(id);
    for (const [id, c] of cards) {
      const s = c.spec, on = !s.hidden && !!c.mat.map;
      c.mesh.visible = on;
      c.shadow.visible = on && !!s.shadow;
      if (!on) continue;
      const gy = feet(s.x, s.z), y = gy + (s.lift ?? 0);
      const k = stretch(s.x, y, s.z, lean);
      const j = jigs.get(id), jk = j ? (t - j.t0) / JIG_MS : 1, je = j ? (1 - jk) * j.k : 0;
      if (j) more = true;
      const sq = (s.squash ?? 0) + Math.sin(jk * Math.PI * 3) * 0.07 * je;
      const w = s.h * s.aspect * (1 + sq), h = s.h * (1 - sq) * k;
      c.mesh.position.set(s.x + (0.5 - (s.ax ?? 0.5)) * w * (s.flip ? -1 : 1), y - (s.foot ?? 0) * h, -s.z);
      c.mesh.rotation.set(-lean, 0, (s.tilt ?? 0) + Math.sin(jk * Math.PI * 4) * 0.07 * je, 'XZY');
      c.mesh.scale.set(s.flip ? -w : w, h, 1);
      if (s.opacity !== undefined) c.mat.opacity = s.opacity;
      if (s.shadow) {
        const r = s.shadow * (1 - Math.min(0.35, (s.lift ?? 0) / 50));
        c.shadow.position.set(s.x, gy + 0.4, -s.z);
        c.shadow.scale.set(r, 1, r * 0.62);
      }
    }
    return more;
  }

  return {
    set,
    frame,
    jiggle(id, k = 1) {
      if (!cards.has(id)) return false;
      jigs.set(id, { t0: performance.now(), k });
      changed(false);
      return true;
    },
    tint(hex) {
      tintHex = hex;
      for (const c of cards.values()) if (!c.spec.lit) c.mat.color.set(hex);
    },
    pending: () => pending,
    dispose() {
      disposed = true;
      for (const id of [...cards.keys()]) set(id, null);
      cardGeo.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      disc.dispose();
      for (const e of texs.values()) void e.t.then((t) => t?.dispose());
      texs.clear();
    }
  };
}
