// The 3D pick on the phones (the pick3d switch, on by default since the R4 plan's step 6): each tap on the island is
// picked by the 3D tap areas (world3d/pick3d.ts: the tap areas, and the scene's chain on the 3D boxes first: what the
// canvas router acts on) and timed. At each hide one `perf.pick` event: the taps and the pick's ms (median, p95, max);
// the DOM island it was held to is gone (R4 step 8: no `dis`). With `?pick3d=1` its box flashes over the island too
// (a ring: nothing).
import { log } from '#lib/sync/log.ts';
import type { World } from '../island/camera.svelte.ts';
import { boxTaps, claimAt, pick3dAt, tapsNow } from './pick3d.ts';

const FLASH_MS = 900;
const pctl = (a: readonly number[], p: number) => [...a].sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * p))];
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Watch the island's taps (on `scene`, the capture phase: before any handler acts); returns its stop (a last log). */
export function watchPicks(w: World, scene: HTMLElement, show: boolean): () => void {
  let ms: number[] = [];
  const flash = (box: { left: number; top: number; width: number; height: number } | null, x: number, y: number, label: string) => {
    const el = document.createElement('div'), r = box ?? { left: x - 10, top: y - 10, width: 20, height: 20 };
    el.setAttribute('aria-hidden', 'true');
    el.dataset.pick3d = 'ok';
    el.textContent = label;
    Object.assign(el.style, {
      position: 'fixed', left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, zIndex: '2147483000', pointerEvents: 'none',
      border: '2px solid #2BA84A', borderRadius: box ? '6px' : '50%', boxSizing: 'border-box',
      font: '600 10px/1 system-ui', color: '#fff', textShadow: '0 0 2px #000', padding: '2px', transition: `opacity ${FLASH_MS}ms ease-in`
    });
    document.body.appendChild(el);
    requestAnimationFrame(() => (el.style.opacity = '0'));
    setTimeout(() => el.remove(), FLASH_MS + 50);
  };
  const onTap = (e: MouseEvent) => {
    if (e.button > 0) return;
    // (the scene's chain first, a figure before the control or scenery under it: what the tap goes to)
    const t0 = performance.now(), x = e.clientX, y = e.clientY, p = pick3dAt(w, document, x, y), c = claimAt(w, document, x, y, '3d');
    ms.push(performance.now() - t0);
    if (show) flash(!c && p ? boxTaps(w, tapsNow(w), p.kind, p.id) : null, x, y, (c ?? p)?.kind ?? '');
  };
  const flush = () => {
    if (ms.length) log('perf.pick', { n: ms.length, med: r2(pctl(ms, 0.5)), p95: r2(pctl(ms, 0.95)), max: r2(Math.max(...ms)) });
    ms = [];
  };
  const onHide = () => document.hidden && flush();
  scene.addEventListener('click', onTap, true);
  document.addEventListener('visibilitychange', onHide);
  return () => {
    scene.removeEventListener('click', onTap, true);
    document.removeEventListener('visibilitychange', onHide);
    flush();
  };
}
