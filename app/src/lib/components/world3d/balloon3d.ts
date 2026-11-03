// The balloon present in 3D (docs/design.md "Balloon"): NH's balloon and the present on its string flying across the
// island in world space (island/balloonFlight.ts: its lane, its bob and sway, the present's pendulum), the string a
// thin line from the knot, and NH's soft blob shadow on the ground right under it (no shadow map: the map isn't
// redrawn for a flier, a stale real shadow would stay behind). Bent with the island like everything else (engine.ts
// add). Shot down, both models go at once: the present that falls is SceneTaps' (its own model on its arc).
import {
  BufferGeometry, CircleGeometry, Color, Float32BufferAttribute, Group, Line, LineBasicMaterial, Mesh, MeshBasicMaterial,
  MeshLambertMaterial, type MeshStandardMaterial, type Object3D
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { keyModel, MODELS } from './models3d.ts';
import { softDisc } from './cards.ts';
import { bend } from './bend.ts';
import { RIG, flying, rigAt } from '../island/balloonFlight.ts';

export interface Balloon3 {
  /** Place it for the flight now (none, or shot down: hidden). */
  frame(now: number): void;
  /** It flies now (its frames: the ambience's, a slow drift). */
  shown(): boolean;
  /** The time of day's self-light (Island3D's LIFT). */
  lift(l: number): void;
  /** The e2e's: what's drawn, in world space (z into the island), or null when nothing is. */
  state(): { model: string; balloon: number[]; gift: number[]; shadow: number[]; loaded: boolean } | null;
  dispose(): void;
}

/** The blob's radius on the ground (u). */
const BLOB = 13;
const STRING_N = 6;

export function createBalloon3(add: (o: Object3D) => () => void, heightOf: (x: number, z: number) => number, kick: () => void): Balloon3 {
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const base = new URL('room/world3d/', new URL(document.baseURI)).href;
  let liftL = 0.32, disposed = false;
  const mats: MeshLambertMaterial[] = [];
  /** A model (once per art key), its materials the island's soft Lambert, set in a holder so its bottom is at the
   *  holder's origin (the balloon's knot; the present hangs from its top: `top`), `h` u tall. */
  const models = new Map<string, Promise<Object3D | null>>();
  function model(key: string, h: number, top: boolean): Promise<Object3D | null> {
    let p = models.get(key);
    if (!p) {
      const a = keyModel(key), b = a ? MODELS[a.m] : null;
      p = !a || !b ? Promise.resolve(null) : loader.loadAsync(`${base}${a.m}.glb?v=${b.v ?? 0}`).then((g) => {
        g.scene.traverse((n) => {
          const m = n as Mesh;
          if (!m.isMesh) return;
          const s0 = m.material as MeshStandardMaterial;
          const mat = new MeshLambertMaterial({ map: s0.map, color: s0.color, alphaTest: s0.alphaTest, side: s0.side, emissive: s0.map ? new Color(0xffffff) : s0.color.clone(), emissiveMap: s0.map, emissiveIntensity: liftL });
          mats.push(mat);
          // (in after the group was added: bent here, as engine.ts add() bends what's in it then)
          m.material = bend(mat);
          m.castShadow = false;
          m.frustumCulled = false;
        });
        const s = h / (b.max[1] - b.min[1]), holder = new Group();
        g.scene.scale.setScalar(s);
        g.scene.position.y = (top ? -b.max[1] : -b.min[1]) * s;
        holder.add(g.scene);
        return holder;
      }, () => null);
      models.set(key, p);
    }
    return p;
  }

  const root = new Group();
  root.visible = false;
  const balloonAt = new Group(), giftAt = new Group();
  const stringGeo = new BufferGeometry().setAttribute('position', new Float32BufferAttribute(new Float32Array(STRING_N * 3), 3));
  const stringMat = new LineBasicMaterial({ color: 0x9a8a72, transparent: true, opacity: 0.9 });
  const string = new Line(stringGeo, stringMat);
  const disc = softDisc();
  const blobGeo = new CircleGeometry(1, 24).rotateX(-Math.PI / 2);
  const blobMat = new MeshBasicMaterial({ map: disc, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  const blob = new Mesh(blobGeo, blobMat);
  blob.renderOrder = 4;
  root.add(balloonAt, giftAt, string, blob);
  const off = add(root);

  /** The models in now (the balloon's colour), and the one asked for. */
  let want = '', have = '';
  let last: ReturnType<Balloon3['state']> = null;
  function dress(key: string) {
    if (key === want) return;
    want = key;
    balloonAt.clear();
    giftAt.clear();
    have = '';
    void Promise.all([model(key, RIG.balloon, false), model('deco/present', RIG.gift, true)]).then(([b, g]) => {
      if (disposed || want !== key) return;
      if (b) balloonAt.add(b);
      if (g) giftAt.add(g);
      have = key;
      kick();
    });
  }

  return {
    frame(now) {
      const fl = flying(now);
      root.visible = !!fl && !fl.popped;
      if (!fl || fl.popped) {
        last = null;
        return;
      }
      dress(fl.model);
      const r = rigAt(fl.f, fl.age), [kx, ky, kz] = r.knot, [gx, gy, gz] = r.gift;
      // three's z runs out of the screen: world z into the island is three's −z; a lean to +x is a turn about −z
      balloonAt.position.set(kx, ky, -kz);
      balloonAt.rotation.z = -r.lean;
      giftAt.position.set(gx, gy, -gz);
      giftAt.rotation.z = -r.swing;
      const pos = stringGeo.getAttribute('position') as Float32BufferAttribute;
      for (let i = 0; i < STRING_N; i++) {
        const k = i / (STRING_N - 1), wob = Math.sin(k * Math.PI) * 0.8;
        pos.setXYZ(i, kx + (gx - kx) * k + wob, ky + (gy - ky) * k, -(kz + (gz - kz) * k));
      }
      pos.needsUpdate = true;
      const fy = heightOf(kx, kz);
      blob.position.set(kx, fy + 0.4, -kz);
      blob.scale.set(BLOB, 1, BLOB * 0.8);
      last = { model: fl.model, balloon: [...r.balloon], gift: [...r.gift], shadow: [kx, fy, kz], loaded: have === fl.model };
    },
    lift(l) {
      liftL = l;
      for (const m of mats) m.emissiveIntensity = l;
    },
    shown: () => root.visible,
    state: () => last,
    dispose() {
      disposed = true;
      off();
      stringGeo.dispose();
      stringMat.dispose();
      blobGeo.dispose();
      blobMat.dispose();
      disc.dispose();
      for (const m of mats) m.dispose();
    }
  };
}
