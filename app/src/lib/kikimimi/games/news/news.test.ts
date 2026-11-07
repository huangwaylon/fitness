// しずえの ニュース (games/news/): the weather from the relay's timeline (the day's sky, fog, the high, the alerts and the
// umbrella, its two option bytes), the weather sentences (the 56 clips A3 voices) and the news files' checks with their
// help as if listened, the day's bulletin (season, weekday), the cards with and without the weather, the rounds at each
// ear, grading and the row, and a co-op game over two phones on the `play` wire (round/session.ts).
import { beforeAll, describe, expect, it } from 'vitest';
import type { Who } from '../../../types.ts';
import type { Wx } from '../../../contract/live-protocol.ts';
import { ITEM_ID_RE } from '../../../contract/listen.ts';
import { readListen } from '../../compile.ts';
import { INDEX, listenOf, load, type Unit } from '../../pool.ts';
import { checkListen, listenClipItems, listenClipIds, wxSentences, type ListenItem, type ListenPart } from '../../listen.ts';
import { RoundSession, WINDOWS } from '../../round/session.ts';
import { registry } from '../../round/registry.ts';
import { playIn, playOut, type PlayIn, type RoundOut } from '../../round/wire.ts';
import { filesOf, listenRecord, rawOf } from '../listened.ts';
import { alertsOf, newsWxOf, skyOf, tailKeys, umbrella, wxBytes, wxOfBytes, type NewsWx } from './weather.ts';
import { NEWS, bulletinOf, dayOf, newsDeal, newsGame, newsOpts, newsRounds, shownOf } from './def.ts';

const FILES = ['news-a', 'news-b'];
const parts = (): ListenPart[] => FILES.map((u) => listenOf(u)!);
beforeAll(() => load(...(FILES as Unit[])));

const H = 3600_000;
/** 2026-11-07 (a Saturday), 07:00 in Tokyo. */
const MORNING = Date.UTC(2026, 10, 6, 22);
/** A timeline from 12 hours before `now`, its letters by Tokyo hour. */
function wxAt(now: number, letter: (hour: number) => string, o: Partial<Wx> = {}): Wx {
  const h0 = Math.floor(now / H) - 12;
  const s = Array.from({ length: 48 }, (_, i) => letter((h0 + i + 9) % 24)).join('');
  return { h0, s, at: now, src: 'om', rev: 1, hi: [Math.floor((now + 9 * H) / 86_400_000), 18], ...o };
}
const RAIN: NewsWx = { sky: 'rain', fog: false, hi: 23 };
/** The Tokyo day of a date (yyyy, m from 1, d). */
const day = (y: number, m: number, d: number) => Date.UTC(y, m - 1, d) / 86_400_000;

describe('しずえの ニュース: the weather', () => {
  it('the day’s sky from its hours', () => {
    expect([skyOf(['c', 'c', 'c', 'o']), skyOf(['c', 'o', 'o', 'c']), skyOf(['o', 'o', 'o', 'c'])]).toEqual(['sunny', 'partly', 'cloudy']);
    expect([skyOf(['c', 'c', 'c', 'r', 'r']), skyOf(['r', 'r', 'c', 'c', 'c']), skyOf(['r', 'r', 'r', 'r', 'c']), skyOf(['c', 'r', 'c'])]).toEqual(['later', 'clearing', 'rain', 'rain']);
    expect([skyOf(['c', 'h', 'c']), skyOf(['r', 's', 'h'])]).toEqual(['storm', 'snow']);
  });

  it('from the relay’s timeline: 06:00 (or now) to 21:00, after 18:00 the next six; the high only today’s; stale none', () => {
    const pm = wxAt(MORNING, (h) => (h >= 15 ? 'r' : 'c'));
    expect(newsWxOf(pm, MORNING)).toEqual({ sky: 'later', fog: false, hi: 18 });
    expect(newsWxOf(pm, MORNING + 9 * H)?.sky).toBe('rain'); // (16:00: the rest of the day)
    expect(newsWxOf(pm, MORNING + 13 * H)?.sky).toBe('rain'); // (20:00: the next six hours)
    expect(newsWxOf({ ...pm, hi: [1, 18] }, MORNING)?.hi).toBeNull();
    expect(newsWxOf({ ...pm, hi: undefined }, MORNING)?.hi).toBeNull();
    expect(newsWxOf({ ...pm, at: MORNING - 37 * H }, MORNING)).toBeNull();
    expect(newsWxOf(null, MORNING)).toBeNull();
    const fog = wxAt(MORNING, () => 'o', { fx: [19, 20] });
    expect(newsWxOf(fog, MORNING)).toMatchObject({ sky: 'cloudy', fog: true });
  });

  it('the alerts (at most two), the umbrella, the sentences read; the option bytes round trip', () => {
    expect(alertsOf({ sky: 'storm', fog: true, hi: 36 })).toEqual(['storm', 'heat']);
    expect([alertsOf({ sky: 'sunny', fog: true, hi: 31 }), alertsOf({ sky: 'snow', fog: false, hi: 1 }), alertsOf({ sky: 'partly', fog: false, hi: 20 })]).toEqual([['fog', 'hot'], ['snow', 'cold'], []]);
    expect([umbrella(RAIN), umbrella({ ...RAIN, sky: 'clearing' }), umbrella({ ...RAIN, sky: 'cloudy' })]).toEqual([true, true, false]);
    expect(tailKeys({ sky: 'snow', fog: false, hi: -2 })).toEqual(['sky-snow', 'hi-m2', 'alert-snow', 'alert-cold', 'end']);
    expect([tailKeys({ ...RAIN, hi: null }), tailKeys(null)]).toEqual([['sky-rain', 'end'], ['end']]);
    for (const w of [RAIN, { sky: 'snow', fog: true, hi: -2 }, { sky: 'sunny', fog: false, hi: 38 }, { sky: 'partly', fog: true, hi: null }, null] as const) {
      const [a, b] = wxBytes(w);
      expect(Math.max(a * 4 + 3, b)).toBeLessThanOrEqual(255);
      expect(wxOfBytes(a, b)).toEqual(w);
    }
    expect([wxOfBytes(9, 0), wxOfBytes(0, 5), wxOfBytes(1, 99)]).toEqual([undefined, undefined, undefined]);
  });
});

describe('しずえの ニュース: the content', () => {
  const sources = readListen().filter((s) => FILES.includes(s.file.replace(/\.yaml$/, '')));
  const items = (): ListenItem[] => sources.flatMap((s) => (s.raw as { items: ListenItem[] }).items);

  it('30 bulletins (15 a file, every season, each weekday once) that check with their help as if listened', () => {
    for (const s of sources) expect(checkListen({ ...s, raw: { ...(s.raw as object), status: 'listened' } })).toEqual([]);
    const news = items().flatMap((it) => (it.kind === 'news' ? [it] : []));
    expect(news).toHaveLength(30);
    expect(['spring', 'summer', 'autumn', 'winter', 'any'].map((s) => news.filter((b) => b.season === s).length)).toEqual([5, 5, 5, 5, 10]);
    expect(news.flatMap((b) => (b.weekday ? [b.weekday] : [])).sort()).toEqual(['fri', 'mon', 'sat', 'sun', 'thu', 'tue', 'wed']);
    for (const b of news) expect(`${b.id}-kasa`).toMatch(ITEM_ID_RE);
  });

  it('the weather sentences: 56 clips, the high in Celsius (shown as a figure, spoken in words; one degree)', () => {
    const wx = items().find((it) => it.kind === 'weather')!;
    const all = wxSentences(wx as Parameters<typeof wxSentences>[0]);
    expect(all).toHaveLength(8 + 41 + 6 + 1);
    const by = new Map(all.map((x) => [x.key, x]));
    expect(by.get('hi-23')).toMatchObject({ clip: 'news-wx-hi-23', en: 'Look for a high of 23 degrees.', tts: 'Look for a high of twenty-three degrees.', ja: '最高気温は23度の予想です。' });
    expect([by.get('hi-1')!.tts, by.get('hi-0')!.tts, by.get('hi-m2')!.en, by.get('hi-m2')!.tts]).toEqual(['Look for a high of one degree.', 'Look for a high of zero degrees.', 'Look for a high of minus 2 degrees.', 'Look for a high of minus two degrees.']);
    for (const x of all) expect(x.tts ?? x.en).not.toMatch(/\d/);
  });

  it('A3’s clips: every line of every bulletin and every weather sentence, in しずえ’s voice', () => {
    const spoken = sources.flatMap((s) => listenClipItems(s.raw));
    const lines = items().flatMap((it) => (it.kind === 'news' ? it.segments.flatMap((s) => s.lines) : []));
    expect(spoken.map((c) => c.id)).toEqual(items().flatMap(listenClipIds));
    expect(spoken).toHaveLength(lines.length + 56);
    expect(new Set(spoken.map((c) => `${c.speaker}:${c.cast}`))).toEqual(new Set(['isabelle:us-f4']));
  });
});

describe('しずえの ニュース: the deal', () => {
  it('only listened files, at their place (やま)', () => {
    expect(filesOf('news', 6, { 'news-a': ['news', 4, 'listened'], 'news-b': ['news', 4, 'draft'] })).toEqual(['news-a']);
    expect(filesOf('news', 6, INDEX.listen)).toEqual(['news-a', 'news-b']); // (this build: both listened since A3)
  });

  it('one bulletin a day: of its season or any, a weekday’s only on that day', () => {
    const all = parts().flatMap((p) => p.items.flatMap((it) => (it.kind === 'news' ? [it] : [])));
    expect([dayOf(day(2026, 4, 1)), dayOf(day(2026, 11, 7)), dayOf(day(2027, 1, 20))]).toEqual([{ season: 'spring', weekday: 'wed' }, { season: 'autumn', weekday: 'sat' }, { season: 'winter', weekday: 'wed' }]);
    for (let d = day(2026, 1, 1); d < day(2027, 1, 1); d++) {
      const b = bulletinOf(d, all)!, { season, weekday } = dayOf(d);
      expect([season, 'any']).toContain(b.season);
      if (b.weekday) expect(b.weekday).toBe(weekday);
    }
    expect(bulletinOf(day(2026, 11, 7), all)).toBe(bulletinOf(day(2026, 11, 7), [...all].reverse()));
    expect(new Set(Array.from({ length: 30 }, (_, k) => bulletinOf(day(2026, 10, 1) + k, all)!.id)).size).toBeGreaterThan(10);
  });

  it('the cards: the bulletin with its weather and sign-off, the detail, the umbrella; no weather: no umbrella, the sign-off only', () => {
    const d = day(2026, 11, 7), cards = newsDeal(d, parts(), RAIN), b = cards[0];
    expect(cards.map((c) => c.news.q)).toEqual(['gist', 'detail', 'kasa']);
    expect(cards.map((c) => c.id)).toEqual([b.id, `${b.id}-d`, `${b.id}-kasa`]);
    const clips = b.lines!.map((l) => l.clip);
    expect(clips.slice(-3)).toEqual(['news-wx-sky-rain', 'news-wx-hi-23', 'news-wx-end']);
    expect(clips.slice(0, 2)).toEqual([`${b.id}-1`, `${b.id}-2`]);
    expect(b.news.segs.map((s) => s.topic)).toEqual([expect.stringMatching(/^(island|season)$/), 'tokyo', 'weather']);
    expect(b.news.segs.at(-1)).toEqual({ topic: 'weather', from: clips.length - 3, to: clips.length - 1 });
    expect(cards[2]).toMatchObject({ answer: 0, choices: ['Yes, take one.', "No, you won't need one."], cja: ['いる', 'いらない'] });
    expect(cards[2].why).toBeTruthy();
    expect(newsDeal(d, parts(), { sky: 'sunny', fog: false, hi: 20 })[2].answer).toBe(1);
    const dry = newsDeal(d, parts(), null);
    expect(dry.map((c) => c.news.q)).toEqual(['gist', 'detail']);
    expect(dry[0].lines!.at(-1)!.clip).toBe('news-wx-end');
    expect(dry[0].news.segs.map((s) => s.topic)).not.toContain('weather');
    expect(newsDeal(d, parts(), RAIN)).toEqual(cards);
  });
});

describe('しずえの ニュース: rounds and grading', () => {
  const cards = () => newsDeal(day(2026, 11, 7), parts(), RAIN);

  it('the bulletin plays before the gist; easy offers the answer and its trap; the options carry the weather', () => {
    const rs = newsRounds(cards(), { lv: 6, ear: 3 }, () => 64_000);
    expect(rs.map((r) => [r.q, r.play, r.shown.length])).toEqual([['gist', 64_000, 4], ['detail', 0, 4], ['kasa', 0, 2]]);
    const easy = newsRounds(cards(), { lv: 6, ear: 1 }, () => undefined);
    expect(easy.map((r) => r.shown.length)).toEqual([2, 2, 2]);
    for (const [k, c] of cards().entries()) {
      expect(easy[k].shown).toEqual(shownOf(c, true));
      expect(easy[k].shown).toContain(c.answer);
    }
    const o = { lv: 6 as const, timer: 30 as const, ear: 2, wx: { sky: 'later' as const, fog: true, hi: -2 } };
    expect(newsOpts.decode(newsOpts.encode(o))).toEqual(o);
    expect(newsOpts.decode(newsOpts.encode({ ...o, wx: null }))).toEqual({ ...o, wx: null });
    const deck = newsGame({ cards: () => cards(), playMs: () => 64_000 }).deck(1, { ...o, ear: 3 }, { w: WINDOWS, enc: [] });
    expect([deck.count, deck.timing(0).play, deck.timing(1).play]).toEqual([3, 64_000, 0]);
  });

  it('a choice shown is valid, the authored one right; my row: each round, my choice as the pick', () => {
    const rs = newsRounds(cards(), { lv: 6, ear: 1 }, () => 1000), r = rs[0];
    const hidden = [0, 1, 2, 3].find((k) => !r.shown.includes(k))!;
    expect([NEWS.valid(r, r.answer), NEWS.valid(r, hidden), NEWS.valid(r, [1])]).toEqual([true, false, false]);
    expect([NEWS.ok(r, r.answer), NEWS.ok(r, r.shown.find((k) => k !== r.answer)!)]).toEqual([true, false]);
    const wrong = rs[1].shown.find((k) => k !== rs[1].answer)!;
    expect(listenRecord(NEWS, rs, [r.answer, wrong, null], [true, true, true], [1, 0, 0], true)).toEqual([[r.id, 1, r.answer, 1], [rs[1].id, 0, wrong, 0], [rs[2].id, 0, -1, 0]]);
    expect(rawOf({ k: r.answer })).toBe(r.answer);
  });
});

describe('しずえの ニュース: a co-op game over two phones', () => {
  const T0 = Date.UTC(2026, 10, 7, 3);
  const src = { cards: (seed: number) => newsDeal(seed, parts(), RAIN), playMs: () => 2000, cv: () => 'abc123' };

  it('both answer every question; the team has one when both are right, the same on both phones', () => {
    let n = 0;
    const random = () => ((n = (n * 9301 + 49297) % 233280) / 233280);
    const make = (me: Who) => new RoundSession({ me, defs: registry([newsGame(src)]), random, seedFor: () => day(2026, 11, 7) });
    const s = { A: make('A'), B: make('B') };
    type P = keyof typeof s;
    const deliver = (from: P, out: RoundOut[], now: number) => {
      for (const m of out) {
        const p = playOut(m)!;
        const to: P = from === 'A' ? 'B' : 'A';
        deliver(to, s[to].receive(playIn({ ...p, v: 3, who: from, t: now } as PlayIn)!, now), now);
      }
    };
    const act = (w: P, f: (x: RoundSession) => RoundOut[], now = T0) => deliver(w, f(s[w]), now);
    s.A.presence(['B'], T0);
    s.B.presence(['A'], T0);
    act('A', (x) => x.open({ gm: 'news', o: newsOpts.encode({ lv: 6, timer: 30, ear: 3, wx: RAIN }) }, T0));
    act('A', (x) => x.invite(T0));
    act('B', (x) => x.join(T0, undefined, 1));
    act('A', (x) => x.go(T0));
    const cards = src.cards(s.A.view(T0).seed);
    expect(s.B.view(T0)).toMatchObject({ gm: 'news', tiers: { A: 3, B: 1 } });
    let t = T0 + WINDOWS.countdown;
    for (let i = 0; i < cards.length; i++) {
      const at = t + (i ? 0 : WINDOWS.lead + 2000) + 10, c = cards[i];
      expect(s.A.view(at)).toMatchObject({ phase: 'answer', i });
      const bWrong = i === 1 ? shownOf(c, true).find((k) => k !== c.answer)! : c.answer;
      act('A', (x) => x.answer(c.answer, 0, at), at);
      act('B', (x) => x.answer(bWrong, 0, at), at);
      expect(s.A.view(at).phase).toBe('reveal');
      act('A', (x) => x.next(at + 1), at + 1);
      t = at + 1;
    }
    const A = s.A.view(t + 1), B = s.B.view(t + 1);
    expect([A.phase, B.phase]).toEqual(['results', 'results']);
    expect(A.team).toEqual(B.team);
    expect(A.team).toMatchObject({ right: cards.length, all: cards.length - 1 });
  });
});
