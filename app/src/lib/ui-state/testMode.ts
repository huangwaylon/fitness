// Test-time switches (docs/ops/test-strategy.md "Logic mode"). The e2e's logic tier runs the whole game (the island's
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
