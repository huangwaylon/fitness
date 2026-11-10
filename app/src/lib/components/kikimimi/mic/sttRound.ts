// A mic round's recogniser (KuriPlay, RolePlay, PairPlay, MicAnswer): the recogniser's module loaded lazily (the mic
// core's chunk), this phone's recogniser made ready, and let go when the round's page goes (whisper's Worker ends:
// lib/mic/stt.ts release). One way for every mic page.
import type { Recogniser } from '#lib/mic/stt.ts';

export function sttRound(load: () => Promise<typeof import('#lib/mic/stt.ts')> = () => import('#lib/mic/stt.ts')) {
  const stt = load();
  let released = false;
  return {
    /** This phone's recogniser, ready; null: none can run here (or it wouldn't load), or the page has gone (one still
     *  being made then is disposed, never readied: no Worker or model loaded for a page that left). */
    ready: (): Promise<Recogniser | null> =>
      stt.then(async ({ recogniser }) => {
        const r = await recogniser();
        if (released) {
          r?.dispose();
          return null;
        }
        return r && (await r.ready()) && !released ? r : null;
      }).catch(() => null),
    /** The recogniser let go (the page's onDestroy). */
    release: (): void => {
      released = true;
      void stt.then((m) => m.release(), () => {});
    }
  };
}
