// くりかえし チャレンジ's lane (round/registry.ts, its own chunk): a run at the player's level (the mode page's
// おまかせ), its sentences picked one by one as I say them (GameDef.next over the level's voiced items, numbered as the
// tournament's: taikai/source.ts TAIKAI_IDS), its deck the ids so far. Solo, nothing on the wire; my row is minutes only
// (record: none, so the recorder keeps a mic game's answerless row: nothing heard or counted is in it). Its round and results are its own pages
// (components/kikimimi/kuri/views.ts).
import type { Item, Level } from '../../bank.ts';
import { clipDur } from '../../clips.ts';
import { itemOf, levelItems, loaded, type Unit } from '../../pool.ts';
import type { Lane } from '../../round/registry.ts';
import { quizOpts, type QuizOpts } from '../quiz/def.ts';
import { PLAY_UNKNOWN } from '../quiz/kinds.ts';
import { TAIKAI_IDS } from '../taikai/source.ts';
import { eligible, kuriGame, kuriNext, syllables, type KuriItem, type KuriRound, type KuriSource } from './def.ts';

const levelOf = (o: readonly number[]): Level => (quizOpts.decode(o)?.lv ?? 1) as Level;
const ms = (id: string): number | undefined => {
  const s = clipDur(id);
  return s === undefined ? undefined : Math.round(s * 1000);
};

/** A level's sentences the run can draw (its chunk loaded), by level. */
const POOLS = new Map<Level, KuriItem[]>();
function poolOf(lv: Level): KuriItem[] {
  if (!loaded(lv)) return [];
  let p = POOLS.get(lv);
  if (!p) {
    p = levelItems(lv).flatMap((it) => {
      const n = TAIKAI_IDS.num(it.id);
      return n !== undefined && eligible(it) && clipDur(it.id) !== undefined ? [{ n, syl: syllables(it.en) }] : [];
    });
    POOLS.set(lv, p);
  }
  return p;
}

/** The items of a deck's ids (in their order; one not loaded is left out). */
const itemsOfIds = (ids: readonly number[]): Item[] => ids.flatMap((n) => {
  const e = TAIKAI_IDS.entry(n), it = e && itemOf(e.id);
  return it ? [it] : [];
});

const source: KuriSource = {
  rounds: (_seed, _o, ids) => itemsOfIds(ids).map((it): KuriRound => ({ kind: 'kuri', id: it.id, play: ms(it.id) ?? PLAY_UNKNOWN })),
  next: (seed, o: QuizOpts, done) =>
    kuriNext(seed, done.map((d) => ({ ...d, n: TAIKAI_IDS.num(d.id) ?? -1 })), poolOf(o.lv as Level))
};

export const lane: Lane<QuizOpts> = {
  id: 'kuri',
  def: () => kuriGame(source),
  chunks: ({ o }): Unit[] => [levelOf(o)],
  deal: (d) => itemsOfIds(d.ids ?? []),
  byIds: true,
  // (minutes only: the recorder keeps the row without answers)
  record: () => [],
  title: { game: 'kiki.mode.kuri' }
};
