// The おやすみ ものがたり serials (app/content/listen/story/*.yaml, docs/curriculum.md §7.1, docs/kikimimi-framework.md
// §8 `serial`, content/listen/README.md "Stories"): every chapter holds together before the story game exists. Speakers
// are the narrator (the file's cast.narrator) or roster villagers, all with US voices of their gender and distinct
// within a chapter; `tts` free of digits; every segment 3-12 s at a bedtime pace (by word count) and every chapter
// 3-5 minutes; 5-8 glossed phrases each, heard in the chapter, ids unique across stories and units; ids unique across
// all listening content; the morning-after prediction well formed. Then as voiced and compiled (story.ts): a clip per
// segment in its speaker's voice, a chunk per chapter with its index line, the clips in their chapter's own packs.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { ROSTER } from '#lib/villagers/roster.ts';
import { REGISTERS, SCENE_IDS } from './bank.ts';
import { CAST } from './cast.ts';
import { CAST_IDS, castOf, spokenText } from './speech.ts';
import { clipAt } from './clips.ts';
import { wordSpans } from './marks.ts';
import { PART_MAX, compile, readPacks, readStories } from './compile.ts';
import { PACK_MAX, clipPlaces, packFile } from './packing.ts';
import { INDEX, loadChapter } from './pool.ts';
import { chapterPart, chapters, segmentClip, storyItems, type Chapter } from './story.ts';
import { CLIPS, WORDS } from './testdata.ts';

const LISTEN = new URL('../../../content/listen/', import.meta.url);
const DIR = new URL('story/', LISTEN);
const UNITS = new URL('../../../content/units/', import.meta.url);
const yamls = (dir: URL) => readdirSync(dir).filter((f) => f.endsWith('.yaml')).sort();

const NARRATOR = 'narrator';
/** Words per segment: 3-12 s at a bedtime pace of ~140 words a minute (2.3 words/s), a period's pause included. */
const SEG_WORDS = [6, 28] as const;
/** Words per chapter: 3-5 minutes of audio at that pace. */
const CHAPTER_WORDS = [450, 700] as const;
const PHRASES = [5, 8] as const;

type Obj = Record<string, unknown>;
interface Story extends Obj { unit: string; cast?: Record<string, string>; items: Obj[] }

const isStr = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const isInt = (v: unknown, lo: number, hi: number): v is number => Number.isInteger(v) && (v as number) >= lo && (v as number) <= hi;
const strs = (v: unknown): v is string[] => Array.isArray(v) && v.every(isStr);
/** Spoken words in a line (punctuation dropped). */
const wordCount = (s: string) => s.replace(/[.,?!;:"“”—…]/g, ' ').split(/\s+/).filter(Boolean).length;

const stories: { file: string; u: Story }[] = yamls(DIR).map((file) => ({ file, u: parse(readFileSync(new URL(file, DIR), 'utf8')) as Story }));

/** Problems in one serial (empty: fine). */
function lint({ file, u }: { file: string; u: Story }): string[] {
  const bad: string[] = [];
  const at = (where: string, msg: string) => bad.push(`${file} ${where}: ${msg}`);
  if (u.schema !== 1) at('header', 'schema must be 1');
  if (!/^[a-z0-9-]{1,12}$/.test(u.unit) || `${u.unit}.yaml` !== file) at('header', `unit "${u.unit}" must match the file name and [a-z0-9-]{1,12}`);
  if (u.game !== 'serial') at('header', `game ${u.game} (a story is a serial)`);
  if (!isInt(u.stage, 1, 5)) at('header', `stage ${u.stage}`);
  if (!['life', 'people', 'work', 'broadcast'].includes(u.track as string)) at('header', `track ${u.track}`);
  if (!Array.isArray(u.seeds) || !u.seeds.length || !u.seeds.every((s) => isInt(s, 1, 66))) at('header', 'seeds: 1-66');
  for (const k of ['name', 'cando']) if (!isStr(u[k])) at('header', k);
  if (!['draft', 'voiced', 'listened'].includes(u.status as string)) at('header', `status ${u.status}`);
  if (!(u.host as string in ROSTER)) at('header', `host ${u.host} isn't in the roster`);
  for (const [who, c] of Object.entries(u.cast ?? {})) {
    if (who !== NARRATOR && !(who in ROSTER)) at('cast', `${who} isn't in the roster`);
    if (!(CAST_IDS as readonly string[]).includes(c)) at('cast', `${who}: ${c} isn't a cast voice`);
  }
  if (!u.cast?.[NARRATOR]) at('cast', 'a story needs cast.narrator');
  if (!Array.isArray(u.items) || !u.items.length) at('header', 'no chapters');

  const voice = (who: string): string | undefined => u.cast?.[who] ?? CAST[who as keyof typeof CAST];
  for (const [n, ch] of (u.items ?? []).entries()) {
    const where = `chapter ${n + 1} ${ch.id ?? ''}`;
    if (ch.kind !== 'serial') at(where, `kind ${ch.kind}`);
    if (!isStr(ch.id) || !/^serial-[a-z0-9-]{1,25}$/.test(ch.id)) at(where, 'id: serial-…, ≤ 32 characters');
    if (ch.chapter !== n + 1) at(where, `chapter ${ch.chapter} (chapters count from 1, in order)`);
    for (const k of ['title', 'line', 'ja']) if (!isStr(ch[k])) at(where, k);
    if (isStr(ch.title) && /\d/.test(ch.title)) at(where, 'title: no digits (the narrator may read it)');
    if (ch.scene !== undefined && !(SCENE_IDS as readonly string[]).includes(ch.scene as string)) at(where, `scene ${ch.scene}`);

    const segs = (ch.segments ?? []) as Obj[];
    if (!Array.isArray(ch.segments) || !segs.length) { at(where, 'no segments'); continue; }
    const voices = new Map<string, string>();
    let total = 0;
    for (const [i, s] of segs.entries()) {
      const sw = `${where} segment ${i}`;
      const who = s.who as string;
      if (who !== NARRATOR && !(who in ROSTER)) at(sw, `${who} isn't the narrator or in the roster`);
      const v = voice(who);
      if (!v) at(sw, `${who} has no cast voice`);
      else {
        if (!v.startsWith('us-')) at(sw, `${who}'s voice ${v} isn't American`);
        if (who !== NARRATOR && who in ROSTER && v.split('-')[1][0] !== ROSTER[who as keyof typeof ROSTER].gender) at(sw, `${who}'s voice ${v} is the wrong gender`);
        voices.set(who, v);
      }
      if (!isStr(s.en)) { at(sw, 'en'); continue; }
      if (/\d/.test(s.en)) at(sw, 'en: numbers in words in a story (the narrator reads en)');
      if (s.tts !== undefined && (!isStr(s.tts) || /\d/.test(s.tts) || s.tts === s.en)) at(sw, `tts must differ from en and have no digits: ${s.tts}`);
      const w = wordCount(s.en);
      total += w;
      if (w < SEG_WORDS[0] || w > SEG_WORDS[1]) at(sw, `${w} words (${SEG_WORDS.join('-')}: 3-12 s): ${s.en}`);
    }
    const vs = [...voices.values()];
    if (new Set(vs).size !== vs.length) at(where, `two speakers share a voice (${[...voices].map(([w, v]) => `${w} ${v}`).join(', ')})`);
    if (![...voices.keys()].some((w) => w !== NARRATOR)) at(where, 'no villager speaks');
    if (total < CHAPTER_WORDS[0] || total > CHAPTER_WORDS[1]) at(where, `${total} words (${CHAPTER_WORDS.join('-')}: 3-5 minutes)`);

    const text = segs.map((s) => s.en).join(' ');
    const ph = (ch.ph ?? []) as Obj[];
    if (!Array.isArray(ch.ph) || ph.length < PHRASES[0] || ph.length > PHRASES[1]) at(where, `ph: ${PHRASES.join('-')} phrases`);
    for (const p of ph) {
      const pw = `${where} ${p.id}`;
      if (!isStr(p.id) || !/^ph-[a-z0-9-]{1,29}$/.test(p.id)) at(pw, 'phrase id: ph-…');
      for (const k of ['en', 'ja', 'scene', 'trap']) if (!isStr(p[k])) at(pw, k);
      if (!(REGISTERS as readonly unknown[]).includes(p.register)) at(pw, `register ${p.register}`);
      const re = isStr(p.match) ? new RegExp(p.match, 'i') : isStr(p.en) ? new RegExp(p.en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;
      if (re && !re.test(text)) at(pw, `"${p.match ?? p.en}" isn't heard in the chapter`);
    }

    const pr = ch.predict as Obj | undefined;
    if (pr !== undefined && !(isStr(pr.ask) && isStr(pr.ja) && strs(pr.choices) && pr.choices.length === 3 &&
      new Set(pr.choices).size === 3 && isInt(pr.answer, 0, 2))) at(where, 'predict: ask, ja, 3 distinct choices, answer in range');
  }
  return bad;
}

describe('おやすみ ものがたり (story drafts)', () => {
  it('has stories', () => expect(stories.length).toBeGreaterThan(0));
  for (const story of stories) it(`${story.file} is well formed`, () => expect(lint(story)).toEqual([]));

  it('ids are unique across stories and the listening units', () => {
    const seen = new Map<string, string>();
    const dup: string[] = [];
    const add = (id: unknown, file: string) => {
      if (seen.has(id as string)) dup.push(`${id} (${seen.get(id as string)}, ${file})`);
      seen.set(id as string, file);
    };
    for (const f of yamls(LISTEN)) for (const it of (parse(readFileSync(new URL(f, LISTEN), 'utf8')) as Story).items ?? []) add(it.id, f);
    for (const { file, u } of stories) for (const ch of u.items ?? []) add(ch.id, file);
    expect(dup).toEqual([]);
  });

  it('phrase ids are unique across stories and units', () => {
    const seen = new Map<string, string>();
    const dup: string[] = [];
    const add = (ph: unknown, file: string) => {
      for (const p of (ph ?? []) as Obj[]) {
        if (seen.has(p.id as string)) dup.push(`${p.id} (${seen.get(p.id as string)}, ${file})`);
        seen.set(p.id as string, file);
      }
    };
    for (const f of yamls(UNITS)) add((parse(readFileSync(new URL(f, UNITS), 'utf8')) as Obj).ph, f);
    for (const { file, u } of stories) for (const ch of u.items ?? []) add(ch.ph, file);
    expect(dup).toEqual([]);
  });

  it('catches the mistakes it is for', () => {
    const seg = (who: string, en: string, tts?: string) => ({ who, en, tts });
    const u = {
      schema: 1, unit: 'x-bad', game: 'serial', stage: 3, track: 'life', seeds: [66], name: 'x', cando: 'x', status: 'draft', host: 'pekoe',
      cast: { narrator: 'uk-f1' },
      items: [{
        kind: 'serial', id: 'serial-x', chapter: 2, title: 'x', line: 'x', ja: 'x',
        segments: [seg('narrator', 'Short.'), seg('nobody', 'A line from somebody who is not on the island.'),
          seg('pekoe', 'I am going to open it at eight tomorrow.', 'I\'m gonna open it at 8 tomorrow.'), seg('maple', 'A line from Maple, who shares a voice with Pekoe.')],
        ph: [{ id: 'ph-x', en: 'not in the text', ja: 'x', register: 'friend', scene: 'x', trap: 'x' }],
        predict: { ask: 'x', ja: 'x', choices: ['a', 'b'], answer: 3 }
      }]
    } as unknown as Story;
    const bad = lint({ file: 'x-bad.yaml', u }).join('\n');
    for (const want of ['isn\'t American', 'chapter 2', 'roster', 'no digits', '1 words', 'share a voice', 'ph: 5-8', 'isn\'t heard', 'predict', 'words (450-700'])
      expect(bad).toContain(want);
  });
});

describe('おやすみ ものがたり (voiced and compiled)', () => {
  const sources = readStories();
  const items = storyItems(sources);
  const files = compile(CLIPS, WORDS);
  const packs = readPacks(), places = clipPlaces(packs);

  it('every segment is a clip of its own (`<chapter>-<n>`), in the narrator’s voice or the villager’s, spoken as `tts` or `en`', () => {
    expect(sources.map((s) => s.unit)).toEqual(stories.map(({ u }) => u.unit));
    const want = sources.flatMap((s) => s.items.flatMap((ch) => ch.segments.map((seg, n) => ({ id: segmentClip(ch.id, n), seg, s }))));
    expect(items.map((it) => it.id)).toEqual(want.map((w) => w.id));
    expect(new Set(items.map((it) => it.id)).size).toBe(items.length);
    expect(want[0].id).toBe('serial-cafe-1-1');
    for (const [k, it] of items.entries()) {
      const { seg, s } = want[k];
      expect(castOf(it), it.id).toBe(seg.who === NARRATOR ? s.cast[NARRATOR] : s.cast[seg.who] ?? CAST[seg.who as keyof typeof CAST]);
      expect(spokenText(it)).toBe(seg.tts ?? seg.en);
      expect(it.lv, 'no slow take, no level-1 tempo').toBeGreaterThan(2);
      expect(it.cond).toBeUndefined();
    }
  });

  it('each chapter compiles into a chunk of its own (`<unit>-<chapter>`, under budget) and a line in the index', () => {
    for (const s of sources) {
      const entry = INDEX.stories[s.unit];
      expect([entry.name, entry.host, entry.status]).toEqual([s.name, s.host, s.status]);
      for (const [i, ch] of chapters(s).entries()) {
        const part = chapterPart(s.unit, ch.chapter), file = files.get(`parts/${part}.json`)!;
        expect(file, part).toBeDefined();
        expect(gzipSync(file).length, part).toBeLessThanOrEqual(PART_MAX);
        const chunk = JSON.parse(file) as { story: Chapter; clips: Record<string, unknown>; words: Record<string, unknown> };
        expect(chunk.story).toEqual(ch);
        expect(ch.ja && ch.line && ch.title).toBeTruthy();
        expect(!!ch.predict, part).toBe(i < s.items.length - 1);
        for (const p of ch.ph) expect(p.in.length, `${part} ${p.id}`).toBeGreaterThan(0);
        const ids = ch.segments.map((seg) => seg.clip);
        const cs = ids.every((id) => CLIPS[id]) ? Math.round(ids.reduce((n, id) => n + CLIPS[id].dur, 0) * 100) : 0;
        expect(entry.chapters[i].slice(0, 6)).toEqual([part, ch.id, ch.title, ch.line, ids.length, cs]);
        expect(Object.keys(chunk.clips)).toEqual(ids.filter((id) => CLIPS[id]));
      }
    }
  });

  it('a voiced chapter has every clip, its word timings, and its own packs (each ≤ 1.2 MB, no slow takes)', () => {
    for (const s of sources)
      for (const ch of chapters(s)) {
        const ids = ch.segments.map((seg) => seg.clip), part = chapterPart(s.unit, ch.chapter);
        if (!ids.some((id) => CLIPS[id])) continue;
        for (const [n, id] of ids.entries()) {
          const c = CLIPS[id];
          expect(c, id).toBeDefined();
          expect(c.dur, id).toBeGreaterThan(1);
          expect(c.dur, `${id}: 3-12 s a segment, at most 14`).toBeLessThan(14);
          expect(c.slow, id).toBeUndefined();
          expect(WORDS[id]?.[0], `${id}: npm run audio:kikimimi-words`).toBe(c.hash);
          expect(WORDS[id].length, id).toBe(wordSpans(ch.segments[n].en).length + 2);
          const at = places.normal.get(id)!;
          expect(at[0], id).toMatch(new RegExp(`^${part}(-\\d+)?\\.[0-9a-f]{8}$`));
          expect(places.slow.has(id)).toBe(false);
        }
        for (const [name, e] of Object.entries(packs).filter(([name]) => name === part || name.startsWith(`${part}-`))) {
          expect(e.clips.every(([id]) => ids.includes(id)), name).toBe(true);
          expect(statSync(new URL(`../../../static/audio/listen/${packFile(name, e)}`, import.meta.url)).size, name).toBeLessThanOrEqual(PACK_MAX);
        }
      }
  });

  it('a chapter loads alone, with its clips placed in their packs', async () => {
    const [part] = INDEX.stories['st-johnny'].chapters[0];
    const ch = await loadChapter(part);
    expect(ch.id).toBe('serial-johnny-1');
    for (const seg of ch.segments) expect(!!clipAt(seg.clip), seg.clip).toBe(seg.clip in CLIPS);
    await expect(loadChapter('lv1')).rejects.toThrow(/isn't a story chapter/);
  });
});
