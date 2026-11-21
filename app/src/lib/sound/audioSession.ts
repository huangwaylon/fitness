// The page's audio session (WebKit's navigator.audioSession), apart from the engine: the speech test and a video set it
// with sound off, the engine never loaded (sound.svelte.ts micFocus, videoFocus).
type AudioSessionNav = Navigator & { audioSession?: { type: string } };

/** Where `navigator.audioSession` exists (WebKit), set its type and return the one it had; elsewhere null. */
function applySession(type: string): string | null {
  try {
    const nav = navigator as AudioSessionNav;
    if (!nav.audioSession) return null;
    const was = nav.audioSession.type;
    nav.audioSession.type = type;
    return was;
  } catch {
    return null; // not supported
  }
}

/** The page's audio session type: 'ambient' for the island (mixes, follows the Ring/Silent switch), 'playback' while
 *  a video has the floor (English Study: a clip plays on silent, like a video app), 'play-and-record' while the mic
 *  is open (the speech test: the only type, with 'auto', WebKit lets capture under). WebKit only; elsewhere a no-op.
 *  Returns the type it had (null: none). */
export const setAudioSession = (type: 'ambient' | 'playback' | 'play-and-record'): string | null => applySession(type);
