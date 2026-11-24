// The launch's GPU programs linked ahead: the programs the last launch's models, villagers and cards needed (their
// final GLSL, as the GPU was given it, and three's cache key for each) kept in IndexedDB, and at the next launch made
// again right after the island's first frame, before those models are in: their links run on the GPU's threads
// (KHR_parallel_shader_compile) while the models load, and a model's material, compiled when it lands, finds its
// program in three's cache already linked (three looks a program up by its key: WebGLPrograms acquireProgram). The
// phones' launches waited ~90 ms on those links after the models were in (perf.boot msLink, 11-24).
// Each kept program is made as three makes a raw shader's (WebGLProgram, the constructor of a program three made: it
// isn't exported), from its source with three's own `#version` and SHADER_TYPE/SHADER_NAME lines taken out (it puts
// them back): the same shader text, those two defines moved up. A key's source is the same whenever three meets that
// key within a build (three's own premise), so the set is kept per build: a deploy's first launch links as before and
// keeps its own. Never needed: no IndexedDB, another build's, anything odd read back, a program that doesn't link
// (dropped: three makes its own), and the launch goes as before.
import type { WebGLRenderer } from 'three';
import { quiet } from '#lib/quiet.ts';

/** A program kept: three's cache key and the GPU's vertex and fragment source. */
export interface ProgRec { k: string; v: string; f: string }
/** three's WebGLProgram, the parts used here. */
export interface Prog {
  cacheKey: string;
  usedTimes: number;
  program?: WebGLProgram;
  vertexShader: WebGLShader;
  fragmentShader: WebGLShader;
  isReady(): boolean;
  getUniforms(): unknown;
  destroy(): void;
}
/** The parameters three's WebGLProgram reads for a raw shader. */
export interface RawParams {
  isRawShaderMaterial: true;
  glslVersion: string | null;
  shaderType: string;
  shaderName: string;
  defines: Record<string, never>;
  vertexShader: string;
  fragmentShader: string;
  rendererExtensionParallelShaderCompile: boolean;
}

const DB_NAME = 'island-progs', STORE = 'progs', REC = 'last';
/** The build's (a deploy's own set); the dev server keeps none (its code changes under the same name). */
const PROGS_BUILD = import.meta.env.DEV ? '' : typeof __APP_BUILD__ === 'string' ? __APP_BUILD__ : '';
/** At most this many programs kept (the launch made ~20; a runaway set isn't linked whole at the next one). */
export const PROGS_MAX = 48;

let idb: IDBFactory | null = typeof indexedDB !== 'undefined' ? indexedDB : null;
let db: Promise<IDBDatabase | null> | null = null;

/** Tests: swap IndexedDB (`fake-indexeddb`). */
export function configureProgCache(o: { indexedDB: IDBFactory | null }): void {
  idb = o.indexedDB;
  db = null;
}

function open(): Promise<IDBDatabase | null> {
  db ??= new Promise<IDBDatabase | null>((ok) => {
    if (!idb) return ok(null);
    try {
      const r = idb.open(DB_NAME, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE);
      r.onsuccess = () => {
        const d = r.result;
        d.onversionchange = () => (d.close(), (db = null));
        ok(d);
      };
      r.onerror = r.onblocked = () => ok(null);
    } catch {
      ok(null);
    }
  });
  return db;
}

const isRec = (r: unknown): r is ProgRec => {
  const x = r as ProgRec | null;
  return !!x && typeof x.k === 'string' && typeof x.v === 'string' && typeof x.f === 'string' && !!x.k && !!x.v && !!x.f;
};

/** The set kept for `build`, or null (none, another build's, an error, anything odd). Never rejects. */
export async function readProgs(build = PROGS_BUILD): Promise<ProgRec[] | null> {
  if (!build) return null;
  try {
    const d = await quiet(open(), 'progs.idb', null);
    if (!d) return null;
    const rec = await new Promise<unknown>((ok) => {
      const r = d.transaction(STORE, 'readonly').objectStore(STORE).get(REC);
      r.onsuccess = () => ok(r.result);
      r.onerror = () => ok(null);
    });
    const { build: b, progs } = (rec ?? {}) as { build?: unknown; progs?: unknown };
    return b === build && Array.isArray(progs) && progs.length <= PROGS_MAX && progs.every(isRec) ? progs : null;
  } catch {
    return null;
  }
}

/** Keep `progs` as `build`'s set (the one record: the last launch's). Never rejects. */
export async function writeProgs(progs: readonly ProgRec[], build = PROGS_BUILD): Promise<void> {
  if (!build || !progs.length) return;
  const d = await quiet(open(), 'progs.idb', null);
  if (!d) return;
  await new Promise<void>((ok) => {
    try {
      const t = d.transaction(STORE, 'readwrite');
      t.objectStore(STORE).put({ build, progs: progs.slice(0, PROGS_MAX) }, REC);
      t.oncomplete = t.onerror = t.onabort = () => ok();
    } catch {
      ok();
    }
  });
}

/** A program as kept: its key and the sources the GPU was given; null once deleted or unreadable. */
export function recOf(gl: Pick<WebGL2RenderingContext, 'getShaderSource'>, p: Prog): ProgRec | null {
  if (!p.program) return null;
  const v = gl.getShaderSource(p.vertexShader), f = gl.getShaderSource(p.fragmentShader);
  return v && f ? { k: p.cacheKey, v, f } : null;
}

const VERSION = /^#version ([^\n]*)\n/;
/** A source split as three's raw shader puts one together: its `#version` (or null), its SHADER_TYPE and SHADER_NAME,
 *  and the rest (those lines out); null without both defines. */
export function splitSource(src: string): { version: string | null; type: string; name: string; body: string } | null {
  const vm = VERSION.exec(src), version = vm ? vm[1] : null;
  const lines = (vm ? src.slice(vm[0].length) : src).split('\n');
  const ti = lines.findIndex((l) => l.startsWith('#define SHADER_TYPE ')), ni = lines.findIndex((l) => l.startsWith('#define SHADER_NAME '));
  if (ti < 0 || ni < 0) return null;
  const type = lines[ti].slice('#define SHADER_TYPE '.length), name = lines[ni].slice('#define SHADER_NAME '.length);
  return { version, type, name, body: lines.filter((_, i) => i !== ti && i !== ni).join('\n') };
}

/** The parameters that make `r`'s program again as three's raw shader (both sources of one version, type and name),
 *  or null. */
export function rawParams(r: ProgRec, parallel = true): RawParams | null {
  const v = splitSource(r.v), f = splitSource(r.f);
  if (!v || !f || v.version !== f.version || v.type !== f.type || v.name !== f.name) return null;
  return { isRawShaderMaterial: true, glslVersion: v.version, shaderType: v.type, shaderName: v.name, defines: {}, vertexShader: v.body, fragmentShader: f.body, rendererExtensionParallelShaderCompile: parallel };
}

/** What three's WebGLProgram compiles for a raw shader of these parameters (r170: its `#version`, then the two
 *  defines, then the source; no defines of its own, the includes and light counts long resolved): the tests'. */
export function rawGlsl(p: RawParams, which: 'vertexShader' | 'fragmentShader'): string {
  return `${p.glslVersion ? `#version ${p.glslVersion}\n` : ''}#define SHADER_TYPE ${p.shaderType}\n#define SHADER_NAME ${p.shaderName}\n${p[which]}`;
}

/** No binding states for a program made here before its first draw (three's, released with a program, are its
 *  geometries' and go with them). */
const NO_STATES = { releaseStatesOfProgram() {} };

/** Each of `recs` not in three's cache made now (its link started), in it as three's own (renderer.info.programs is
 *  its list): those made. None when three has no program yet to take the constructor from. */
export function preLink(renderer: WebGLRenderer, recs: readonly ProgRec[], parallel: boolean): Prog[] {
  const list = renderer.info.programs as unknown as Prog[] | null;
  if (!list?.length) return [];
  const Make = list[0].constructor as new (r: WebGLRenderer, key: string, p: RawParams, b: typeof NO_STATES) => Prog;
  const have = new Set(list.map((p) => p.cacheKey)), made: Prog[] = [];
  for (const r of recs) {
    if (have.has(r.k)) continue;
    const p = rawParams(r, parallel);
    if (!p) continue;
    try {
      const prog = new Make(renderer, r.k, p, NO_STATES);
      list.push(prog);
      made.push(prog);
      have.add(r.k);
    } catch {
      // (three's own is made at its first use)
    }
  }
  return made;
}

/** A program made here let go of: out of three's list and deleted, when no material took it (a program that failed to
 *  link, one the launch didn't need); else handed to its materials (three deletes it once they're gone). */
export function letGo(renderer: WebGLRenderer, p: Prog): void {
  const list = renderer.info.programs as unknown as Prog[] | null;
  if (p.usedTimes > 1) return void p.usedTimes--;
  const i = list?.indexOf(p) ?? -1;
  if (i < 0) return;
  list!.splice(i, 1);
  p.destroy();
}

/** A step's first uses at most this long (ms; at least one), a step every STEP_MS, for at most WAIT_MS. */
const PRIME_MS = 6, STEP_MS = 16, WAIT_MS = 3000;
/** The programs made ahead primed as they link: three's first use (its uniforms read: a sync GPU read that waits for
 *  the GPU's queue, done here with it near empty, not in the frame the models appear), PRIME_MS a step; one that
 *  failed to link let go of (three makes its own, its error its own). The cancel. */
export function primeAhead(renderer: WebGLRenderer, ps: readonly Prog[], now = () => performance.now()): () => void {
  const gl = renderer.getContext(), left = new Set(ps), t0 = now();
  let t: ReturnType<typeof setTimeout> | undefined;
  const step = () => {
    const s = now();
    for (const p of left) {
      if (!p.program) {
        left.delete(p);
        continue;
      }
      if (!p.isReady()) continue;
      if (now() - s > PRIME_MS) break;
      left.delete(p);
      if (gl.getProgramParameter(p.program, gl.LINK_STATUS)) p.getUniforms();
      else letGo(renderer, p);
    }
    if (left.size && now() - t0 < WAIT_MS) t = setTimeout(step, STEP_MS);
  };
  t = setTimeout(step, STEP_MS);
  return () => clearTimeout(t);
}
