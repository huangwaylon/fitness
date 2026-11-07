// しずえの ニュース as a GameDef (docs/curriculum-wave2.md §2.5): one bulletin a day from the news files (content/listen/
// news-a.yaml, news-b.yaml; pool.ts listenOf), picked by the date (the lobby's seed is the Tokyo day: lane.ts) among
// those of its season, a weekday's only on that day. しずえ reads it as one sequence of clips: an island or seasonal
// item, a Tokyo-life one, today's real weather (weather.ts, the host's, in the options) and the sign-off. Then the
// questions, answers after the play: the gist (the first round, its clip the bulletin), a detail, and 「傘は いる？」
// (only with the weather). Pure.
//
// Tiers per player on the same audio (GameDef.tier, ことば タイル's tierAt): easy, each question offers the answer and its
// trap only; else all four choices. Co-op: everyone answers every question, the team's count the questions both got
// (the session's `team.all`).
import type { ListenRow } from '../../../contract/listen.ts';
import type { CastId, Item, Level, Line, Tags } from '../../bank.ts';
import { PLACES } from '../../catalog.ts';
import { WEEKDAYS, newsLines, type ListenItem, type ListenPart, type WxSentence } from '../../listen.ts';
import type { AnswerValue, GameDef, Round } from '../../round/types.ts';
import { PLAY_UNKNOWN } from '../quiz/kinds.ts';
import { listenGame, listenOpts, listenRecord, tierAt, type ListenOpts, type ListenRules, type ListenSource } from '../listened.ts';
import { tailKeys, umbrella, wxBytes, wxOfBytes, type NewsWx } from './weather.ts';

type NewsYaml = Extract<ListenItem, { kind: 'news' }>;
/** A question: the gist, the detail, the umbrella. */
type NewsQ = 'gist' | 'detail' | 'kasa';
/** The voice that reads the news (the files' cast.isabelle). */
const READER: CastId = 'us-f4';
/** The answer window's extra for the questions (ms): their choices are English sentences. */
const READ_MS = 5000;

/** Its options: a listening game's (the place's level, こたえる じかん, the host's ear) and today's weather (the host's).
 *  The wire's 4 ints: the weather's sky byte rides the ear's (×4), its high the fourth. */
export interface NewsOpts extends ListenOpts {
  wx: NewsWx | null;
}
export const newsOpts = {
  encode: (o: NewsOpts): number[] => {
    const [lv, ti, ear] = listenOpts.encode(o), [sky, hi] = wxBytes(o.wx);
    return [lv, ti, ear + 4 * sky, hi];
  },
  decode: (a: readonly number[]): NewsOpts | null => {
    const [lv, ti = 0, packed = 1, hi = 0] = a;
    const base = Number.isInteger(packed) && packed >= 0 ? listenOpts.decode([lv, ti, packed % 4]) : null, wx = wxOfBytes(Math.floor(packed / 4), hi);
    return base && wx !== undefined ? { ...base, wx } : null;
  }
};

/** A bulletin's part as heard (its replay chip): which, and its lines' places in the bulletin's [from, to). */
export interface NewsSeg {
  topic: 'island' | 'season' | 'tokyo' | 'weather';
  from: number;
  to: number;
}
/** A dealt round, as the sheet's game holds it: the gist's Item is the bulletin (its lines its clips, the weather's
 *  and the sign-off's their own: Line.clip); the detail (`<id>-d`) and the umbrella (`<id>-kasa`) have no clip. */
export interface NewsCard extends Item {
  quietReveal: true;
  news: {
    q: NewsQ;
    /** The bulletin's id (its first card's). */
    of: string;
    /** The real trap (the easy tier's other choice). */
    trap: number;
    /** The question (UI copy; the gist's and the umbrella's are the game's). */
    ask?: string;
    segs: readonly NewsSeg[];
  };
}

/** A Tokyo day's season and weekday (the seed: days since the epoch). */
export function dayOf(day: number): { season: NewsYaml['season']; weekday: (typeof WEEKDAYS)[number] } {
  const d = new Date(day * 86_400_000), m = d.getUTCMonth();
  return { season: m >= 2 && m <= 4 ? 'spring' : m >= 5 && m <= 7 ? 'summer' : m >= 8 && m <= 10 ? 'autumn' : 'winter', weekday: WEEKDAYS[d.getUTCDay()] };
}

/** The day's bulletin: those of its season (or any), a weekday's only on that day, in id order, the day's turn. */
export function bulletinOf(day: number, all: readonly NewsYaml[]): NewsYaml | undefined {
  const { season, weekday } = dayOf(day), byId = [...all].sort((a, b) => (a.id < b.id ? -1 : 1));
  const ok = byId.filter((b) => (b.season === season || b.season === 'any') && (!b.weekday || b.weekday === weekday));
  const pool = ok.length ? ok : byId;
  return pool[((day % pool.length) + pool.length) % pool.length];
}

/** A deck's cards from its files' parts: the day's bulletin (`seed` the Tokyo day), its weather tail by `wx` and the
 *  sign-off, its two or three questions. None without a bulletin. */
export function newsDeal(seed: number, parts: readonly ListenPart[], wx: NewsWx | null): NewsCard[] {
  const items = parts.flatMap((p) => p.items.map((it) => ({ it, stage: p.stage })));
  const b = bulletinOf(seed, items.flatMap(({ it }) => (it.kind === 'news' ? [it] : [])));
  if (!b) return [];
  const stage = items.find(({ it }) => it === b)!.stage;
  const said = new Map((items.find(({ it }) => it.kind === 'weather')?.it as { sentences?: WxSentence[] } | undefined)?.sentences?.map((x) => [x.key, x]));
  const tail = tailKeys(wx).flatMap((k) => (said.has(k) ? [said.get(k)!] : []));
  const line = (x: { en: string; ja: string; clip?: string }): Line => ({ who: 'isabelle', cast: READER, en: x.en, ja: x.ja, ...(x.clip && { clip: x.clip }) });
  const lines = [...newsLines(b).map(line), ...tail.map(line)];
  let at = 0;
  const segs: NewsSeg[] = b.segments.map((s) => ({ topic: s.topic, from: at, to: (at += s.lines.length) }));
  if (wx && tail.length > 1) segs.push({ topic: 'weather', from: at, to: at + tail.length - 1 });
  const base = {
    lv: PLACES[stage - 1]?.lvs[0] as Level, type: 'gist' as const, ja: '', speaker: 'isabelle' as const, voice: 'us' as const, note: b.note,
    tags: b.tags as Tags, quietReveal: true as const, ...(b.ctx && { ctx: b.ctx }), ...(b.scene && { scene: b.scene })
  };
  const ask = (q: NewsQ, id: string, x: { choices: readonly string[]; answer: number; trap: number; cja?: readonly string[]; why?: string; ask?: string }): NewsCard => ({
    ...base, id, en: lines.map((l) => l.en).join(' '), choices: x.choices, answer: x.answer, ...(x.cja && { cja: x.cja }), ...(x.why && { why: x.why }),
    news: { q, of: b.id, trap: x.trap, ...(x.ask && { ask: x.ask }), segs }
  });
  const kasa = wx && said.get(`sky-${wx.sky}`);
  return [
    { ...ask('gist', b.id, b.gist), lines },
    ask('detail', `${b.id}-d`, b.detail),
    ...(wx && kasa ? [ask('kasa', `${b.id}-kasa`, { choices: ['Yes, take one.', "No, you won't need one."], answer: umbrella(wx) ? 0 : 1, trap: umbrella(wx) ? 1 : 0, cja: ['いる', 'いらない'], ...(kasa.why && { why: kasa.why }) })] : [])
  ];
}

// ---------- rounds and grading ----------

/** A round: its card's id (the row's), question, the choices shown (their authored places), the right one, its play
 *  (the gist's: the bulletin's length, ms; the others 0). */
export interface NewsRound extends Round {
  kind: 'news';
  q: NewsQ;
  shown: readonly number[];
  answer: number;
  play: number;
}

/** The choices a card shows at a tier: easy the answer and its trap (in their order), else all. */
export const shownOf = (c: Pick<NewsCard, 'choices' | 'answer' | 'news'>, easy: boolean): number[] =>
  c.choices.map((_, k) => k).filter((k) => !easy || k === c.answer || k === c.news.trap);

/** A deck's rounds at an ear (`playMs`: the bulletin's length, unknown: undefined). */
export const newsRounds = (cards: readonly NewsCard[], o: Pick<ListenOpts, 'lv' | 'ear'>, playMs: (c: NewsCard) => number | undefined): NewsRound[] => {
  const easy = tierAt(o.ear, o.lv) === 'easy';
  return cards.map((c) => ({
    kind: 'news', id: c.id, q: c.news.q, shown: shownOf(c, easy), answer: c.answer,
    play: c.news.q === 'gist' ? (playMs(c) ?? PLAY_UNKNOWN * (c.lines?.length ?? 1)) : 0
  }));
};

/** しずえの ニュース's rules (games/listened.ts): the bulletin plays before the gist, the others have no play; the answer a
 *  choice shown, its authored place the row's `pick`. */
export const NEWS: ListenRules<NewsCard, NewsRound> = {
  id: 'news',
  rounds: (cards, _seed, o, playMs) => newsRounds(cards, o, playMs),
  timing: (r, answer, w) => (r?.play ? { lead: w.lead, play: r.play, answer: answer + READ_MS } : { lead: 0, play: 0, answer: answer + READ_MS }),
  valid: (r, a) => typeof a === 'number' && r.shown.includes(a),
  ok: (r, a) => a === r.answer,
  pick: (_r, a) => a as number
};

/** The game: a listening game's, with the weather in its options (and kept when a player's tier is set). */
export function newsGame(src: ListenSource<NewsCard>): GameDef<NewsOpts> {
  const g = listenGame(NEWS, src);
  return { ...g, opts: newsOpts, tier: { of: (o) => o.ear, with: (o, tr) => ({ ...o, ...g.tier!.with(o, tr) }) } };
}

/** My answers of a game as its `listen` row's: my choice as `pick`. */
export const newsRecord = (rounds: readonly NewsRound[], answers: readonly (AnswerValue | null)[], had: readonly boolean[], rp: readonly number[], done: boolean): ListenRow['r'] =>
  listenRecord(NEWS, rounds, answers, had, rp, done);
