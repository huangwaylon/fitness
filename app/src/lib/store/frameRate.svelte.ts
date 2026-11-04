// せってい → フレームレート (docs/design.md "Frame rate"): the 3D engines' full rate (the island, the rooms, the
// museum), 30 (the default: half the GPU and CPU work of 60) or 60, kept on this phone only (DEVICE.fps). `?fps=30|60`
// sets it for the tab without keeping it (the e2e pin 60: playwright.config.ts). The ambience stays at ≤ 30 and a still
// scene draws nothing, either way.
import { DEVICE, localKV, writeRaw } from '#lib/sync/storage.ts';

export type Fps = 30 | 60;
export const FPS: readonly Fps[] = [30, 60];

const parse = (v: string | null | undefined): Fps | null => (v === '30' ? 30 : v === '60' ? 60 : null);

function initial(): Fps {
  const q = typeof location === 'undefined' ? null : parse(new URLSearchParams(location.search).get('fps'));
  if (q) return q;
  try {
    return parse(localKV()?.getItem(DEVICE.fps)) ?? 30;
  } catch {
    return 30;
  }
}

export const frameRate = $state<{ fps: Fps }>({ fps: initial() });

export function setFrameRate(fps: Fps): void {
  frameRate.fps = fps;
  writeRaw(localKV(), DEVICE.fps, String(fps));
}

/** Whether a display frame at `t` (its rAF time, ms) is due at `fps` after the last drawn at `last` (0: none yet). Half
 *  a 60 Hz vsync's slack less than the interval: at 30 on a 60 Hz screen every other vsync, an even cadence (never 2-3);
 *  at 60 every one (a 120 Hz screen: every other). */
export const due = (t: number, last: number, fps: number): boolean => !last || t - last >= 1000 / fps - 6;
