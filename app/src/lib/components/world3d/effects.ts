// The 3D island's effects (docs/design.md "World: in 3D"): NH's little flourishes as small meshes in world space, depth
// tested with everything (a tree in front hides a sparkle): a tap's dust and splash, a bush's falling leaves, a
// campfire's sparks, a watering's drops, the sparkles of a pick-up, the 「！」 of a bite. Each a few particles of the
// fx/* models (static/room/world3d/fx: flat ones turned to the camera), unlit (they're light), fading, gone in a second.
// The DOM island spawns them where it spawned its own (island/fx3d.ts), whose art then goes invisible.
import {
  Color, DoubleSide, Mesh, MeshBasicMaterial, Quaternion, type BufferGeometry, type Camera, type MeshStandardMaterial, type Scene, type Texture
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { bend } from './bend.ts';
import { MODELS } from './models3d.ts';

export type FxKind = 'dust' | 'sand' | 'snow' | 'splash' | 'ripple' | 'sparkle' | 'sparks' | 'bang' | 'leaves' | 'drops' | 'hearts';
export interface FxOpts {
  /** A season's leaf for `leaves` (maple-leaf, petal, snowflake) or a tint (#rrggbb). */
  v?: string;
  /** How long a held one (the 「！」) stays (ms). */
  ms?: number;
  /** Bigger or smaller than NH's (1). */
  size?: number;
}

interface Part {
  mesh: Mesh;
  mat: MeshBasicMaterial;
  t0: number;
  life: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  /** Fall (u/s²: a leaf's slow drift), spin (rad/s), its scale over its life, and whether it faces the camera. */
  g: number;
  spin: number;
  s0: number;
  s1: number;
  face: boolean;
  /** Flat on the ground (a ripple). */
  flat: boolean;
  sway: number;
}

export interface Effects {
  spawn(kind: FxKind, x: number, z: number, lift?: number, o?: FxOpts): void;
  /** One frame: true while any plays. */
  frame(t: number, camera: Camera): boolean;
  count(): number;
  dispose(): void;
}

const MODEL: Record<string, string> = {
  dust: 'fx/dust', splash: 'fx/splash', ripple: 'fx/ripple', sparkle: 'fx/sparkle', bang: 'fx/bang',
  'maple-leaf': 'fx/maple-leaf', petal: 'fx/petal', snowflake: 'fx/snowflake'
};
/** World units a model unit (assets.json's `s` for each). */
const SCALE: Record<string, number> = { dust: 7.3, splash: 11.25, ripple: 9, sparkle: 6, bang: 13.5, 'maple-leaf': 2.3, petal: 3.1, snowflake: 2.3 };
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export function createEffects(scene: Scene, ground: (x: number, z: number) => number): Effects {
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const base = new URL(`room/world3d/`, new URL(document.baseURI)).href;
  const got = new Map<string, Promise<{ geo: BufferGeometry; map: Texture | null; color: Color } | null>>();
  const load = (name: string) => {
    let p = got.get(name);
    if (!p) {
      const m = MODEL[name];
      p = loader.loadAsync(`${base}${m}.glb?v=${MODELS[m]?.v ?? 0}`).then((g) => {
        let out: { geo: BufferGeometry; map: Texture | null; color: Color } | null = null;
        g.scene.updateMatrixWorld(true);
        g.scene.traverse((n) => {
          const mesh = n as Mesh;
          if (out || !mesh.isMesh) return;
          const s = mesh.material as MeshStandardMaterial;
          out = { geo: mesh.geometry.clone().applyMatrix4(mesh.matrixWorld), map: s.map, color: s.color.clone() };
        });
        return out;
      }, () => null);
      got.set(name, p);
    }
    return p;
  };
  const parts: Part[] = [];
  let disposed = false;
  const q = new Quaternion();

  /** One particle of a model: from (x, y, z) with a velocity, living `life` ms, scaled s0 → s1. */
  function part(name: string, x: number, y: number, z: number, p: Partial<Part> & { tint?: string; life: number }) {
    void load(name).then((m) => {
      if (!m || disposed) return;
      const mat = bend(new MeshBasicMaterial({ map: m.map, color: p.tint ? new Color(p.tint) : m.color, transparent: true, depthWrite: false, side: DoubleSide, alphaTest: 0.02 }));
      const mesh = new Mesh(m.geo, mat);
      mesh.frustumCulled = false;
      mesh.renderOrder = 7;
      scene.add(mesh);
      const k = SCALE[name] ?? 5;
      parts.push({
        mesh, mat, t0: performance.now(), life: p.life, x, y, z, vx: p.vx ?? 0, vy: p.vy ?? 0, vz: p.vz ?? 0, g: p.g ?? 0, spin: p.spin ?? 0,
        s0: (p.s0 ?? 1) * k, s1: (p.s1 ?? 1) * k, face: p.face ?? true, flat: p.flat ?? false, sway: p.sway ?? 0
      });
    });
  }

  function spawn(kind: FxKind, x: number, z: number, lift = 0, o: FxOpts = {}) {
    const y = ground(x, z) + lift, k = o.size ?? 1;
    switch (kind) {
      case 'dust': case 'sand': case 'snow': {
        const tint = kind === 'sand' ? '#efe0b8' : kind === 'snow' ? '#ffffff' : o.v;
        for (let i = 0; i < 3; i++) {
          const a = (i - 1) * 1.1 + rnd(-0.2, 0.2);
          part('dust', x + Math.sin(a) * 4 * k, y + 1, z - Math.cos(a) * 2 * k, { life: 520, vx: Math.sin(a) * 16 * k, vy: 9, vz: -Math.cos(a) * 5, s0: 0.35 * k, s1: 0.85 * k, tint, face: false });
        }
        return;
      }
      case 'splash': {
        part('splash', x, y + 0.5, z, { life: 460, s0: 0.4 * k, s1: 1 * k, vy: 6, face: false });
        part('ripple', x, y + 0.3, z, { life: 800, s0: 0.3 * k, s1: 1.4 * k, face: false, flat: true });
        return;
      }
      case 'ripple':
        part('ripple', x, y + 0.3, z, { life: 800, s0: 0.3 * k, s1: 1.4 * k, face: false, flat: true });
        return;
      case 'sparkle': case 'hearts': {
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * Math.PI * 2 + rnd(0, 1);
          part('sparkle', x + Math.cos(a) * 5 * k, y + 6 * k, z, { life: 640, vx: Math.cos(a) * 14 * k, vy: 18 + Math.sin(a) * 6, s0: 0.25 * k, s1: 0.9 * k, spin: rnd(-3, 3), tint: kind === 'hearts' ? '#ff8fb1' : o.v });
        }
        return;
      }
      case 'sparks': {
        for (let i = 0; i < 5; i++)
          part('sparkle', x + rnd(-5, 5), y + rnd(2, 8), z, { life: rnd(500, 800), vx: rnd(-8, 8), vy: rnd(22, 38), s0: 0.3, s1: 0.1, tint: '#ffb04a', spin: rnd(-4, 4) });
        return;
      }
      case 'bang':
        part('bang', x, y + 8, z, { life: o.ms ?? 900, s0: 0.75 * k, s1: 0.75 * k, face: true });
        return;
      case 'leaves': {
        const leaf = o.v && MODEL[o.v] ? o.v : 'maple-leaf';
        const tint = o.v && MODEL[o.v] ? undefined : '#6cbf4a';
        for (let i = 0; i < 3; i++)
          part(leaf, x + (i - 1) * 9 + rnd(-2, 2), y, z + rnd(-3, 3), { life: rnd(900, 1300), vx: rnd(-6, 6), vy: rnd(-4, 4), g: -26, spin: rnd(-3, 3), sway: rnd(6, 10), tint, face: true });
        return;
      }
      case 'drops': {
        for (let i = 0; i < 5; i++)
          part('splash', x + rnd(-6, 6), y + rnd(14, 20), z + rnd(-3, 3), { life: 520, vy: -10, g: -60, s0: 0.18, s1: 0.12, face: false, tint: '#9fd8ff' });
        return;
      }
    }
  }

  function frame(t: number, camera: Camera): boolean {
    camera.getWorldQuaternion(q);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i], age = t - p.t0, k = age / p.life;
      if (k >= 1 || age < 0) {
        if (k >= 1) {
          scene.remove(p.mesh);
          p.mat.dispose();
          parts.splice(i, 1);
        }
        continue;
      }
      const s = (age / 1000);
      const px = p.x + p.vx * s + (p.sway ? Math.sin(age / 180) * p.sway : 0), py = p.y + p.vy * s + 0.5 * p.g * s * s, pz = p.z + p.vz * s;
      p.mesh.position.set(px, py, -pz);
      const sc = p.s0 + (p.s1 - p.s0) * Math.sin(Math.min(1, k * 1.4) * Math.PI * 0.5);
      p.mesh.scale.setScalar(sc);
      if (p.face) {
        p.mesh.quaternion.copy(q);
        if (p.spin) p.mesh.rotateZ(p.spin * s);
      } else if (p.spin) p.mesh.rotation.set(0, p.spin * s, 0);
      // in quickly, out at the end
      p.mat.opacity = Math.min(1, k * 6) * (k > 0.6 ? (1 - k) / 0.4 : 1);
    }
    return parts.length > 0;
  }

  return {
    spawn, frame,
    count: () => parts.length,
    dispose() {
      disposed = true;
      for (const p of parts) {
        scene.remove(p.mesh);
        p.mat.dispose();
      }
      parts.length = 0;
      void Promise.all(got.values()).then((ms) => ms.forEach((m) => m?.geo.dispose()));
    }
  };
}
