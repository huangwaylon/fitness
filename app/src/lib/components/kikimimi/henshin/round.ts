// 音の へんしん's round on this phone (HenshinPlay, HenshinResults): my round of a card at my ear, the three takes of a
// phrase to compare (はっきり the careful `<id>-c`, ふつう the natural `<id>`, 速く `<id>-f`), and whether I answer the
// dictation with tiles (this phone's choice, DEVICE.kikiTiles). Over games/henshin/def.ts. Its pages' strings come in
// with it (i18n/kiki-henshin.ts: kikimimi/ may not import i18n).
import '#lib/i18n/kiki-henshin.ts';
import type { Item } from '#lib/kikimimi/bank.ts';
import type { QuizView } from '#lib/kikimimi/games/quiz/view.ts';
import { henshinOpts, henshinRounds, type HenshinCard, type HenshinRound } from '#lib/kikimimi/games/henshin/def.ts';
import { DEVICE, localKV } from '#lib/sync/storage.ts';

/** My round of a card (my ear: the game's options as I play them). */
export function roundFor(v: Pick<QuizView, 'o' | 'seed'>, c: HenshinCard): HenshinRound | null {
  const o = henshinOpts.decode(v.o);
  return o ? henshinRounds([c], v.seed, o, () => 0)[0] : null;
}

/** A phrase's takes, slowest first: its card as each plays (the same text and marks, another clip). */
export const TAKES = [['slow', '-c'], ['natural', ''], ['fast', '-f']] as const;
export const takeOf = (it: Item, suffix: string): Item => ({ ...it, id: `${it.id}${suffix}` });

/** This phone answers the dictation with tiles (else the keyboard). */
export function tilesOn(): boolean {
  try {
    return localKV()?.getItem(DEVICE.kikiTiles) === '1';
  } catch {
    return false;
  }
}
export function keepTiles(on: boolean): void {
  try {
    if (on) localKV()?.setItem(DEVICE.kikiTiles, '1');
    else localKV()?.removeItem(DEVICE.kikiTiles);
  } catch {
    /* storage refused */
  }
}
