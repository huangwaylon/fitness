// The island's first drag a load, for the log (`perf.drag`, docs/ops/observability.md): the pixel ratio swapped down as
// the camera starts moving and back once it's still (engine.ts light: setSize makes the canvas's buffers again, its
// MSAA's too), each swap's own ms and the CPU of its first frame drawn, against a frame's usual CPU. Once a load: what
// the phones' A/B of `?dprmove=` (no swap) and `?shadow=` is decided on. No three.js.
import { log } from '#lib/sync/log.ts';

let sent = false;

interface DragSource {
  stats(): { cpu: [number, number]; dpr: number; shadowSize: number };
}

/** The engine's onSwap: logs the first swap down and back a load. `move`: the pixel ratio while moving. */
export function watchDrag(o: DragSource, move: number): (on: boolean, setMs: number, frameMs: number) => void {
  let down: [number, number] | null = null;
  return (on, setMs, frameMs) => {
    if (sent) return;
    if (on) return void (down = [setMs, frameMs]);
    if (!down) return;
    sent = true;
    const s = o.stats(), r = (n: number) => Math.round(n * 10) / 10;
    log('perf.drag', { onSet: r(down[0]), onFrame: r(down[1]), offSet: r(setMs), offFrame: r(frameMs), cpu: r(s.cpu[0]), dpr: s.dpr, move, sm: s.shadowSize });
  };
}
