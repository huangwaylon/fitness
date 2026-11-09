// The mic modes' metas (docs/kikimimi-mic.md "Where they show"; round/registry.ts's lines bring them, catalog.ts addMode), each
// shown only while this phone could play it (its gate): the mic on in せってい. まねっこ and はつおん on the 声に出す
// shelf; くりかえし there too, and only with a recogniser that can run here (the tests' stub; Safari's only where it
// exists: for 自動 and サーバー that is known only when a take starts, and the round says so in Japanese if not);
// ロールプレイ on no shelf, only in the みんなで picker (it needs two; the invitee's phone asks at さんか: joining is
// consenting). Eager (the sheet's chunk) and tiny: each game itself is its lane's chunk.
import { DEVICE, localKV, readJson } from '../../sync/storage.ts';
import type { ModeMeta } from '../catalog.ts';

/** The mic's choices on this phone (lib/mic/pick.ts MicPrefs; kikimimi/ may not import mic/). */
const prefs = () => readJson<{ on?: unknown; be?: unknown }>(localKV(), DEVICE.mic);
/** The mic is on on this phone (せってい › マイク). */
const micOn = (): boolean => prefs()?.on === true;

/** The tests' recogniser is on (lib/mic/pick.ts stubbed). */
function stubbed(): boolean {
  try {
    return localKV()?.getItem(DEVICE.sttStub) != null;
  } catch {
    return false;
  }
}

/** くりかえし's gate: the mic on and a recogniser that can run here. */
function kuriGate(): boolean {
  const p = prefs();
  return p?.on === true && (stubbed() || p.be !== 'webkit' || (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window));
}

export const MANE_MODE: ModeMeta = { id: 'mane', group: 'koe', icon: '🦜', mins: 2, qs: 4, coop: false, game: 'mane', requires: 'mic', gate: micOn };
export const KURI_MODE: ModeMeta = { id: 'kuri', group: 'koe', icon: '🗣️', mins: 3, qs: 8, coop: false, game: 'kuri', requires: 'mic', gate: kuriGate };
export const ROLE_MODE: ModeMeta = { id: 'role', group: 'together', icon: '🎭', mins: 3, qs: 0, coop: true, game: 'role', requires: 'mic', gate: micOn };
/** 音の へんしん (docs/kikimimi.md "音の へんしん"): the daily connected-speech drill, on さくっと; no ばしょ (its phrases are
 *  their own level, today's phenomenon the place). */
export const HENSHIN_MODE: ModeMeta = { id: 'henshin', group: 'quick', icon: '🔗', mins: 4, qs: 8, coop: true, game: 'henshin' };
export const PAIR_MODE: ModeMeta = { id: 'pair', group: 'koe', icon: '👄', mins: 2, qs: 8, coop: true, game: 'pair', requires: 'mic', gate: micOn };
