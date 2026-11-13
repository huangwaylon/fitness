// Every WebGL surface's one lifecycle (docs/design.md "Frame rate"): the island, the tent, the museum, すがた, the home
// picker and the editor's preview make their renderer with makeRenderer() and let go of it with endRenderer(). A small
// one (すがた, the home picker) draws through createStage(): frames on demand, at most 30 a second, none while the page
// is hidden, its canvas's CSS size followed.
//
// Why endRenderer disposes WHITE (blank.ts): three adds a dispose listener to each texture a renderer uploads, and that
// listener holds the renderer (its context, its canvas and, through it, its page's DOM) till the texture is disposed.
// WHITE is page-wide, on most materials: a renderer gone without it disposed stayed alive for the page's life (すがた:
// one context and ~700 DOM nodes a visit). Disposing it is safe: a live renderer that draws it uploads it again. The same
// for three's one geometry of every Sprite (Sprite.js `_geometry`: the museum's emote bubbles and NEW tags, the bug
// garden's, the tent's): each renderer that drew a sprite stayed alive through its dispose listener (the museum: one
// more context a visit, leaks.spec).
import { SRGBColorSpace, Sprite, WebGLRenderer, type Object3D } from 'three';
import { WHITE } from './blank.ts';
import { releaseAll, type Res } from './release.ts';
import { pacer } from './pace.ts';
import { drawOff, shaderChecks } from '#lib/ui-state/testMode.ts';
import { FPS } from '#lib/store/frameRate.ts';
import { ktx2Default } from './ktx2.ts';
import { log } from '#lib/sync/log.ts';
import { lazyBones } from './bones.ts';

/** The pixel ratio at most (an iPhone's 3 costs too much for what it adds), and while a gesture moves the camera. */
const DPR_MAX = 2;
/** three's page-wide geometry of every Sprite (it makes one, the first Sprite's, and shares it). */
const SPRITE_GEO = new Sprite().geometry;
export const DPR_MOVING = 1.5;

interface RendererOpts {
  /** MSAA (never in the logic mode). */
  antialias?: boolean;
  /** A see-through canvas (cleared to transparent): the page shows behind it. */
  alpha?: boolean;
  power?: WebGLPowerPreference;
  /** The pixel ratio (default the device's, at most DPR_MAX; 1 in the logic mode). */
  dpr?: number;
}

/** No WebGL context on the canvas (makeRenderer): none on the device, or one refused for now (under load, WebKit gives
 *  one back a moment later), not a bug in what's built on it. */
export class NoWebGL extends Error {
  override name = 'NoWebGL';
}

/** A renderer on `canvas`, set up as every surface's is (throws NoWebGL if a context can't be had). `noDraw`: the e2e's
 *  logic mode (testMode.ts): its frames run, nothing is drawn. */
export function makeRenderer(canvas: HTMLCanvasElement, o: RendererOpts = {}): { renderer: WebGLRenderer; noDraw: boolean; dpr: number } {
  const noDraw = drawOff();
  // (a still skeleton's bone texture not sent again each frame: bones.ts)
  lazyBones();
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: !!o.antialias && !noDraw, alpha: !!o.alpha, premultipliedAlpha: true, powerPreference: o.power ?? 'high-performance', stencil: false });
  } catch (err) {
    throw new NoWebGL(err instanceof Error ? err.message : String(err), { cause: err });
  }
  // (no per-program link check on a live phone: testMode.ts shaderChecks)
  renderer.debug.checkShaderErrors = shaderChecks();
  const dpr = noDraw ? 1 : (o.dpr ?? Math.min(DPR_MAX, window.devicePixelRatio || 1));
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = SRGBColorSpace;
  if (o.alpha) renderer.setClearColor(0x000000, 0);
  ktx2Default(renderer);
  return { renderer, noDraw, dpr };
}

/** A lost context on `canvas` (the phone reclaiming the GPU, a backgrounded page under memory pressure) kept for three
 *  to restore what it can, and logged both ways (gl.lost, by `where`: how often iOS takes a surface's memory back);
 *  `restored()` once it's back (what three can't upload again made again, a frame asked for). The unwatch. */
export function watchContext(canvas: HTMLCanvasElement, where: 'island' | 'tent' | 'other', restored: () => void): () => void {
  const onLost = (e: Event) => {
    e.preventDefault();
    log('gl.lost', { where, restored: false }, 2);
  };
  const onRestored = () => {
    log('gl.lost', { where, restored: true });
    restored();
  };
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);
  return () => {
    canvas.removeEventListener('webglcontextlost', onLost);
    canvas.removeEventListener('webglcontextrestored', onRestored);
  };
}

/** A renderer let go of: what's under `roots` (and `also`: drawn, since taken out) disposed, WHITE's and the sprites'
 *  geometry's listeners, then the renderer and its context (the GPU's memory back now, not at the context's collection). */
export function endRenderer(renderer: WebGLRenderer, roots: Object3D[] = [], also: Iterable<Res> = []) {
  releaseAll(roots, also);
  WHITE.dispose();
  SPRITE_GEO.dispose();
  renderer.dispose();
  renderer.forceContextLoss();
}

export interface Stage {
  renderer: WebGLRenderer;
  noDraw: boolean;
  /** A frame asked for (a change from outside). */
  kick(): void;
  /** Everything let go of (endRenderer's `roots` and `also`). */
  dispose(roots?: Object3D[], also?: Iterable<Res>): void;
}

/** A small surface's frames on `canvas`: `frame(t)` runs at most FPS times a second while the page is in front, and says
 *  when it wants the next (ms from now, a timer till then: 0 the next at the cap, Infinity none till a kick); `size(w, h)` with the
 *  canvas's CSS size (the renderer's already set), at the start and whenever it changes, a frame then (`at`: the size
 *  till it's laid out). */
export function createStage(canvas: HTMLCanvasElement, o: RendererOpts & { at?: [number, number] }, frame: (t: number) => number, size: (w: number, h: number) => void): Stage {
  const { renderer, noDraw } = makeRenderer(canvas, o);
  let gone = false;
  const pace = pacer((t) => {
    // (hidden: none till it's back, onVis)
    if (gone || document.hidden || !pace.due(t, FPS)) return;
    const next = frame(t);
    if (next <= 0) pace.kick();
    else if (next < Infinity) pace.later(1000 / next);
  });
  let cw = 0, ch = 0;
  const fit = (w = Math.round(canvas.clientWidth), h = Math.round(canvas.clientHeight)) => {
    if (w < 8 || h < 8 || (w === cw && h === ch)) return false;
    cw = w;
    ch = h;
    renderer.setSize(w, h, false);
    size(w, h);
    return true;
  };
  const resized = new ResizeObserver(() => void (fit() && pace.kick()));
  resized.observe(canvas);
  if (!fit()) fit(...(o.at ?? [300, 150]));
  const onVis = () => void (document.hidden || pace.kick());
  document.addEventListener('visibilitychange', onVis);
  pace.kick();
  return {
    renderer,
    noDraw,
    kick: () => void (gone || pace.kick()),
    dispose(roots, also) {
      if (gone) return;
      gone = true;
      pace.stop();
      resized.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      endRenderer(renderer, roots, also);
    }
  };
}
