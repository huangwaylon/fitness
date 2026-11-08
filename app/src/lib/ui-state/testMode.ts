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

/** Whether the 3D engines skip drawing (their scenes, frames, cameras and hooks all run as ever). */
export function drawOff(): boolean {
  if (typeof location === 'undefined') return false;
  if (has('e2e.render') === 'none') return true;
  const q = new URLSearchParams(location.search);
  return q.get('render') === 'none' && (import.meta.env.DEV || q.has('demo'));
}

/** Whether three checks each shader program as it links (renderer.debug.checkShaderErrors): a sync readback of the
 *  link status and the info logs, per program, on the first frames. In development and the demo (the e2e's builds:
 *  world3d.spec's render tier fails on a THREE error), never on a live phone. `?checks=0` turns them off (the perf
 *  scripts' timing runs: docs/ops/perf.md "Measuring", ~350 ms of sync readbacks a launch in the iOS Simulator). */
export function shaderChecks(): boolean {
  if (typeof location !== 'undefined' && new URLSearchParams(location.search).get('checks') === '0') return false;
  return import.meta.env.DEV || (typeof location !== 'undefined' && new URLSearchParams(location.search).has('demo'));
}
