// The 3D pick on the phones (`?pick3d=1`, the R4 plan's step 5): each tap on the island is picked by the 3D tap areas
// too (world3d/pick3d.ts: the tap areas, and the scene's chain on the 3D boxes first), timed, and held to the DOM's answer, which the tap still goes to. Its box flashes over the
// island (green: the two agree; red: not; a ring: nothing), and at each hide one `perf.pick` event: the taps, the pick's
// ms (median, p95, max), how many disagreed and the first three disagreements as `dom/3d` kinds (no point, no id).
import { log } from '#lib/sync/log.ts';
import type { World } from '../island/camera.svelte.ts';
import { pickAt } from '../island/probe.ts';
import { boxTaps, claimAt, pick3dAt, tapsNow } from './pick3d.ts';

const FLASH_MS = 900;
const pctl = (a: readonly number[], p: number) => [...a].sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * p))];
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Watch the island's taps (on `scene`, the capture phase: before any handler acts); returns its stop (a last log). */
export function watchPicks(w: World, scene: HTMLElement): () => void {
  let ms: number[] = [], dis: string[] = [];
  const flash = (box: { left: number; top: number; width: number; height: number } | null, x: number, y: number, ok: boolean, label: string) => {
    const el = document.createElement('div'), r = box ?? { left: x - 10, top: y - 10, width: 20, height: 20 };
    el.setAttribute('aria-hidden', 'true');
    el.dataset.pick3d = ok ? 'ok' : 'off';
    el.textContent = label;
    Object.assign(el.style, {
      position: 'fixed', left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, zIndex: '2147483000', pointerEvents: 'none',
      border: `2px solid ${ok ? '#2BA84A' : '#E5484D'}`, borderRadius: box ? '6px' : '50%', boxSizing: 'border-box',
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
    const dom = claimAt(w, document, x, y, 'dom') ?? pickAt(document, x, y), p3 = c ?? p, key = (r: { kind: string; id: string } | null) => (r ? `${r.kind}:${r.id}` : '');
    const ok = key(dom) === key(p3);
    if (!ok) dis.push(`${dom?.kind ?? 'none'}/${p3?.kind ?? 'none'}`);
    flash(!c && p ? boxTaps(w, tapsNow(w), p.kind, p.id) : null, x, y, ok, p3?.kind ?? '');
  };
  const flush = () => {
    if (ms.length) log('perf.pick', { n: ms.length, med: r2(pctl(ms, 0.5)), p95: r2(pctl(ms, 0.95)), max: r2(Math.max(...ms)), dis: dis.length, d1: dis[0], d2: dis[1], d3: dis[2] });
    ms = [];
    dis = [];
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
