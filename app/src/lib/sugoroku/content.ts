// The game's written content in one load (docs/sugoroku.md): the words, the lines and みんなで！'s data, their own lazy
// chunks (the `sg` group). The play screen, the menu's running-game card and the invitation's check all ask here, so
// they behave the same: a failure is tried once more after RETRY_MS while the phone is online (a request dropped on a
// flaky network), and a second failure is the caller's (the play screen's もう一度). Kept once it loads.
import { once } from '#lib/once.ts';
import { loadWords, type Words } from './words.ts';
import { loadSentences, type Line } from './sentences.ts';
import { loadMiniData, type MiniData } from './mini/data.ts';

export const RETRY_MS = 1000;

/** `load`, and once more after `wait` ms if it failed while `online()`. Each loader forgets a failure (once.ts), so the
 *  second try fetches again. */
export async function retryOnce<T>(load: () => Promise<T>, wait = RETRY_MS, online = () => navigator.onLine): Promise<T> {
  try {
    return await load();
  } catch (e) {
    if (!online()) throw e;
    await new Promise((r) => setTimeout(r, wait));
    return load();
  }
}

export interface Content {
  words: Words;
  lines: readonly Line[];
  mini: MiniData;
}

export const loadContent: () => Promise<Content> = once(() =>
  retryOnce(() => Promise.all([loadWords(), loadSentences(), loadMiniData()]).then(([words, lines, mini]) => ({ words, lines, mini }))));
