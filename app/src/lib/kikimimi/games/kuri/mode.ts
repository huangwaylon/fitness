// くりかえし チャレンジ's mode on the 声に出す shelf (docs/kikimimi-mic.md §2.6; round/registry.ts's line brings it,
// catalog.ts addMode): solo, needs the mic, and shown only while this phone could play it (gate): the mic on in
// せってい and a recogniser that can run here (the tests' stub; Safari's only where it exists). For 自動 and サーバー
// that is known only when a take starts (the model on the phone, the relay paired): the round says so in Japanese if
// not. Eager (the sheet's chunk) and tiny: the game itself is its lane's chunk.
import { DEVICE, localKV, readJson } from '../../../sync/storage.ts';
import type { ModeMeta } from '../../catalog.ts';

function kuriGate(): boolean {
  const kv = localKV();
  const p = readJson<{ on?: unknown; be?: unknown }>(kv, DEVICE.mic);
  if (p?.on !== true) return false;
  let stub = false;
  try {
    stub = kv?.getItem('e2e.stt') != null;
  } catch {
    // (no storage: no stub)
  }
  return stub || p.be !== 'webkit' || (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window);
}

export const KURI_MODE: ModeMeta = { id: 'kuri', group: 'koe', icon: '🗣️', mins: 3, qs: 8, coop: false, game: 'kuri', requires: 'mic', gate: kuriGate };
