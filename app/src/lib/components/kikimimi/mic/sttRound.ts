// A mic round's recogniser (KuriPlay, RolePlay, PairPlay, MicAnswer): the recogniser's module loaded lazily (the mic
// core's chunk), this phone's recogniser made ready, and let go when the round's page goes (whisper's Worker ends:
// lib/mic/stt.ts release). One way for every mic page.
import type { Recogniser } from '#lib/mic/stt.ts';

export function sttRound() {
  const stt = import('#lib/mic/stt.ts');
  return {
    /** The module (its level01 and the like), once loaded. */
    stt,
    /** This phone's recogniser, ready; null: none can run here (or it wouldn't load). */
    ready: (): Promise<Recogniser | null> =>
      stt.then(async ({ recogniser }) => {
        const r = await recogniser();
        return r && (await r.ready()) ? r : null;
      }).catch(() => null),
    /** The recogniser let go (the page's onDestroy). */
    release: (): void => void stt.then((m) => m.release(), () => {})
  };
}
