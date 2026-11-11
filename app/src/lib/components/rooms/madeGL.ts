// A room's engine (the tent's, the homes', the shop's, the museum's) made on its canvas: a throw is in IslandLog
// (js.error), and a WebGL context refused (world3d/stage.ts NoWebGL: WebKit under load, or a few rooms' contexts at
// once, gives one back a moment later) is asked for once more, as the island's mount does (world3d/Island3D.svelte).
// By name, not instanceof: the screens load before three (their engines' chunks).
import { logError } from '#lib/sync/log.ts';

/** The second ask's wait (ms). */
const AGAIN_MS = 1000;

/** `make()`, or once more AGAIN_MS after a refused context while `open()` (the room still shown); rejects with what
 *  it threw otherwise (the room's failure). */
export async function madeGL<E>(make: () => E, open: () => boolean): Promise<E> {
  const tryMake = () => {
    try {
      return make();
    } catch (err) {
      logError('error', err);
      throw err;
    }
  };
  try {
    return tryMake();
  } catch (err) {
    if ((err as Error | null)?.name !== 'NoWebGL') throw err;
    await new Promise((ok) => setTimeout(ok, AGAIN_MS));
    if (!open()) throw err;
    return tryMake();
  }
}
