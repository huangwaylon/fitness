// 英語すごろく's game on this phone (docs/sugoroku.md "Saving"): saved after every step, so a game closed half-way
// resumes (続きから); an unreadable or older save reads as none.
import { DEVICE, localKV, readJson, remove, writeJson } from '#lib/sync/storage.ts';
import { isGame, type Game } from './game.ts';

export function loadGame(): Game | null {
  const g = readJson<unknown>(localKV(), DEVICE.sugoroku);
  return isGame(g) && g.phase.k !== 'end' ? g : null;
}
export const saveGame = (g: Game): boolean => writeJson(localKV(), DEVICE.sugoroku, g);
export const clearGame = (): void => remove(localKV(), DEVICE.sugoroku);
