// Test-time switches (docs/ops/testing.md "Logic mode"). The e2e's logic tier runs the whole game (the island's
// and the rooms' gameplay, their 3D engines' frames, cameras, projections and tap areas) without drawing a pixel: no
// WebGL draw calls, so CI's software GL (SwiftShader) costs nothing and a frame takes a millisecond, not seconds.
// Set by `localStorage['e2e.render'] = 'none'` (playwright.config.ts's logic project, E2E_RENDER=none; it survives a
// navigation, which the query string doesn't) or `?render=none` with the dev hooks on (`?demo`). A live phone never
// sets either.

const has = (k: string): string | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(k);
  } catch {
    return null;
  }
};

/** Whether the 3D engines skip drawing (their scenes, frames, cameras and hooks all run as ever). `e2e.render` `map`:
 *  they skip it, but the maps are made (`mapStub`), for a spec about a map whose island needn't draw. */
export function drawOff(): boolean {
  if (typeof location === 'undefined') return false;
  const r = has('e2e.render');
  if (r === 'none' || r === 'map') return true;
  const q = new URLSearchParams(location.search);
  return q.get('render') === 'none' && (import.meta.env.DEV || q.has('demo'));
}

/** Whether the e2e's and the console's window hooks are put up (window.__tent, __shop, __museum, __world, the
 *  engines' debug maps): a dev build, `?demo`, or the logic tier. Never on a live phone: a hook holds its engine. */
export function testHooks(): boolean {
  return import.meta.env.DEV || (typeof location !== 'undefined' && new URLSearchParams(location.search).has('demo')) || drawOff();
}

/** Whether a trip's or a trail's map is its logic-tier stub (pins as buttons, no MapLibre): drawing off, but for
 *  `e2e.render` `map`. */
export const mapStub = (): boolean => drawOff() && has('e2e.render') !== 'map';

/** Whether three checks each shader program as it links (renderer.debug.checkShaderErrors): a sync readback of the
 *  link status and the info logs, per program, on the first frames. In development and the demo (the e2e's builds:
 *  world3d.spec's render tier fails on a THREE error), never on a live phone. `?checks=0` turns them off (the perf
 *  scripts' timing runs: docs/ops/perf.md "Measuring", ~350 ms of sync readbacks a launch in the iOS Simulator). */
export function shaderChecks(): boolean {
  if (typeof location !== 'undefined' && new URLSearchParams(location.search).get('checks') === '0') return false;
  return import.meta.env.DEV || (typeof location !== 'undefined' && new URLSearchParams(location.search).has('demo'));
}
