// What a new material needs before its first draw, done ahead over frames: its programs
// linked (KHR_parallel_shader_compile: off the main thread), each new program's first use primed (three's
// getUniforms: a sync ACTIVE_UNIFORMS read that waits for the GPU process to drain everything queued before it), and
// its textures uploaded (renderer.initTexture: the image's upload and its mipmaps), a budget a frame. Drawn at once,
// the island's ~50 models did all of it in one frame: 255-533 ms in the iOS Simulator, the island frozen as it
// appeared (~180 uploads, ~36 MB with mips, queued ahead of each program's sync read). Here each step primes first,
// with the GPU's queue near empty (the last frame's work done), then uploads up to its budget; the engine holds back
// what uses a material still waiting (engine.ts hold) and draws it all in one frame once none is.
import type { Material, Texture, WebGLRenderer } from 'three';

/** A step's uploads at most: this many pixels (the textures' own; 512² is 0.26 MPx) and this long (ms) on the main
 *  thread, and at least one. */
export const UPLOAD_PX = 1_500_000;
const UPLOAD_MS = 10;
/** A step's program primes at most this long (ms; at least one). */
const PRIME_MS = 10;
/** A material waiting longer than this (ms: a program that never reports linked) is let go of: drawn, three's own
 *  first use then, never held back for good. */
export const WAIT_MAX_MS = 3000;

type Prog = { isReady(): boolean; getUniforms(): unknown; program?: unknown };
type Props = WebGLRenderer['properties'];

/** A material's textures (its maps, a shader's uniforms'). */
export function texturesOf(m: Material): Texture[] {
  const out: Texture[] = [];
  const add = (v: unknown) => {
    if (v && (v as Texture).isTexture && !out.includes(v as Texture)) out.push(v as Texture);
  };
  for (const v of Object.values(m)) add(v);
  const u = (m as { uniforms?: Record<string, { value: unknown }> }).uniforms;
  if (u) for (const x of Object.values(u)) add(x?.value);
  return out;
}

/** A texture three would upload on its next use: its image is in (a version) and not yet on this renderer's GPU. */
function unsent(props: Props, t: Texture): boolean {
  return t.version > 0 && !(t as { isRenderTargetTexture?: boolean }).isRenderTargetTexture && (props.get(t) as { __version?: number }).__version !== t.version;
}

const pixels = (t: Texture): number => {
  const i = t.image as { width?: number; height?: number } | null;
  return Math.max(1, (i?.width ?? 1) * (i?.height ?? 1));
};

/** The materials waiting, and a step for them. */
export function createWarmup(renderer: Pick<WebGLRenderer, 'properties' | 'initTexture'>, now = () => performance.now()) {
  const props = renderer.properties;
  /** Waiting, since when (ms), its textures (read once, as it's added) and whether it's ready now (held back still
   *  till all are). */
  const waiting = new Map<Material, { at: number; texs: Texture[]; ok: boolean }>();
  /** Programs compiled ahead (what's waited for to link: a material's others, an old light setup's, aren't drawn),
   *  those not used yet (their first use to prime: every other program has had it, in a frame), and textures tried
   *  (one that won't upload is never waited for again). */
  const ahead = new WeakSet<object>(), unused = new WeakSet<object>(), tried = new WeakSet<Texture>();
  /** The programs a material's draw waits on: its current one, and those compiled ahead for it (a two-sided one's both). */
  const programs = (m: Material): Prog[] => {
    const p = props.get(m) as { programs?: Map<string, Prog>; currentProgram?: Prog };
    return [...(p.programs?.values() ?? [])].filter((x) => x === p.currentProgram || ahead.has(x));
  };
  // (none: the material was let go of meanwhile; a program deleted, likewise: nothing to wait for)
  const linked = (ps: Prog[]) => ps.every((p) => p.program === undefined || p.isReady());
  const ready = (m: Material, texs: Texture[]) => {
    const ps = programs(m);
    return linked(ps) && !ps.some((p) => unused.has(p) && p.program !== undefined) && texs.every((t) => tried.has(t) || !unsent(props, t));
  };
  return {
    /** Materials just compiled (renderer.compile's) and the programs that compile made: those not ready wait. */
    add(ms: Iterable<Material>, made: Iterable<object>) {
      for (const p of made) ahead.add(p), unused.add(p);
      const t = now();
      for (const m of ms) {
        if (waiting.has(m)) continue;
        const texs = texturesOf(m);
        if (!ready(m, texs)) waiting.set(m, { at: t, texs, ok: false });
      }
    },
    has: (m: Material) => waiting.has(m),
    size: () => waiting.size,
    clear: () => waiting.clear(),
    /** A step: the linked programs' first use, then uploads up to the budget. True: none waits now (what was held
     *  back is drawn together). */
    step(): boolean {
      let t0 = now(), any = false;
      prime: for (const m of waiting.keys()) {
        const ps = programs(m);
        if (!linked(ps)) continue;
        for (const p of ps) {
          if (!unused.has(p) || p.program === undefined) continue;
          if (any && now() - t0 > PRIME_MS) break prime;
          p.getUniforms();
          unused.delete(p);
          any = true;
        }
      }
      t0 = now();
      let px = 0;
      any = false;
      upload: for (const { texs } of waiting.values())
        for (const t of texs) {
          if (tried.has(t) || !unsent(props, t)) continue;
          if (any && (px + pixels(t) > UPLOAD_PX || now() - t0 > UPLOAD_MS)) break upload;
          renderer.initTexture(t);
          tried.add(t);
          px += pixels(t);
          any = true;
        }
      const t = now();
      let all = true;
      for (const [m, w] of waiting) all &&= (w.ok ||= ready(m, w.texs) || t - w.at > WAIT_MAX_MS);
      if (all) waiting.clear();
      return all;
    }
  };
}
