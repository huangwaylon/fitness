// The draft listening content (app/content/listen/*.yaml, docs/kikimimi-framework.md §8, content/listen/README.md):
// every unit parses and holds together before the compiler (increment 9) exists. Required fields per kind, speakers
// in the roster with a cast voice (the unit's `cast`, else bank4.ts CAST) of their gender, `tts` free of digits, notes
// ≤ 40 字, ids unique across units, every answer in range. scripts/listen/schema.ts takes these rules over in 9b.
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { ROSTER } from '#lib/villagers/roster.ts';
import { CHANNELS, SCENE_IDS } from './bank.ts';
import { CAST } from './bank4.ts';
import { CAST_IDS } from './speech.ts';

const DIR = new URL('../../../content/listen/', import.meta.url);
const FILES = readdirSync(DIR).filter((f) => f.endsWith('.yaml')).sort();

const GAMES = ['quiz', 'ladder', 'tile', 'call', 'tachi', 'news', 'long', 'serial'];
const KINDS = ['tile', 'call', 'tachi'];
const TRACKS = ['life', 'people', 'work', 'broadcast'];
const STATUSES = ['draft', 'voiced', 'listened'];
const REGISTERS = ['service', 'colleague', 'boss', 'friend', 'partner', 'neighbour', 'stranger', 'official', 'broadcast'];
const PRAGMATICS = ['literal', 'indirect', 'refusal', 'hedge', 'understatement', 'sarcasm', 'humour', 'formula', 'ritual', 'attitude', 'deception'];
/** bank.ts Tags conditions, plus the drafts' new ones (README "Vocabulary"). */
const CONDITIONS = ['phone', 'voicemail', 'pa', 'video', 'cafe', 'station', 'desk', 'signal', 'street', 'train', 'party'];
/** bank.ts Feature, plus the drafts' new ones (README "Vocabulary"). */
const FEATURES = ['contraction', 'weak-form', 'flap', 'yod', 'gonna', 'wanna', 'gotta', 'lemme', 'dunno', 'kinda', 'can-cant',
  't-glottal', 'teen-ty', 'self-repair', 'numbers', 'ellipsis', 'idiom', 'intonation', 'l-r', 'vowel', 'b-v', 'th', 'sh-s', 'f-h',
  'ending', 'katakana', 'contrast', 'clock',
  'linking', 'h-drop', 'chain', 'elision', 'assimilation', 'overlap', 'filler', 'stress'];
const ME = 'me';

type Obj = Record<string, unknown>;
interface Unit extends Obj { unit: string; seeds: number[]; cast?: Record<string, string>; items: Obj[] }

const units: { file: string; u: Unit }[] = FILES.map((file) => ({ file, u: parse(readFileSync(new URL(file, DIR), 'utf8')) as Unit }));

const isStr = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const isInt = (v: unknown, lo: number, hi: number): v is number => Number.isInteger(v) && (v as number) >= lo && (v as number) <= hi;
const strs = (v: unknown): v is string[] => Array.isArray(v) && v.every(isStr);
const chars = (s: string) => [...s].length;
const words = (s: string) => s.replace(/[.,?!;:"“”—…]/g, ' ').split(/\s+/).filter(Boolean).join(' ');
const hasWords = (en: string, at: string) => new RegExp(`(^|[^A-Za-z'])${at.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![A-Za-z'])`).test(en);

/** Problems in one unit (empty: fine). */
function lint({ file, u }: { file: string; u: Unit }): string[] {
  const bad: string[] = [];
  const at = (where: string, msg: string) => bad.push(`${file} ${where}: ${msg}`);
  if (u.schema !== 1) at('header', 'schema must be 1');
  if (!/^[a-z0-9-]{1,12}$/.test(u.unit) || `${u.unit}.yaml` !== file) at('header', `unit "${u.unit}" must match the file name and [a-z0-9-]{1,12}`);
  if (!GAMES.includes(u.game as string)) at('header', `game ${u.game}`);
  if (!isInt(u.stage, 1, 5)) at('header', `stage ${u.stage}`);
  if (!TRACKS.includes(u.track as string)) at('header', `track ${u.track}`);
  if (!Array.isArray(u.seeds) || !u.seeds.length || !u.seeds.every((s) => isInt(s, 1, 66))) at('header', 'seeds: 1-66');
  const f = u.features as Obj | undefined;
  if (!f || !FEATURES.includes(f.primary as string) || (f.review !== undefined && !FEATURES.includes(f.review as string))) at('header', 'features');
  if (!isStr(u.cando)) at('header', 'cando');
  if (!STATUSES.includes(u.status as string)) at('header', `status ${u.status}`);
  for (const [who, c] of Object.entries(u.cast ?? {})) {
    if (who !== ME && !(who in ROSTER)) at('cast', `${who} isn't in the roster`);
    if (!(CAST_IDS as readonly string[]).includes(c)) at('cast', `${who}: ${c} isn't a cast voice`);
  }
  if (!Array.isArray(u.items) || !u.items.length) at('header', 'no items');

  const voice = (who: string): string | undefined => u.cast?.[who] ?? CAST[who as keyof typeof CAST];
  /** A speaker: in the roster (or `me` where allowed), with a voice of their gender. */
  const speaker = (where: string, who: unknown, me = false) => {
    if (!isStr(who)) return at(where, 'no speaker');
    if (who === ME) return me ? (voice(ME) ? undefined : at(where, 'a `me` line needs cast.me in the header')) : at(where, '`me` only speaks in calls');
    if (!(who in ROSTER)) return at(where, `${who} isn't in the roster`);
    const v = voice(who);
    if (!v) return at(where, `${who} has no cast voice (bank4.ts CAST or the unit's cast)`);
    if (v.split('-')[1][0] !== ROSTER[who as keyof typeof ROSTER].gender) at(where, `${who}'s voice ${v} is the wrong gender`);
  };
  const spoken = (where: string, o: Obj) => {
    if (!isStr(o.en)) at(where, 'en');
    if (!isStr(o.ja)) at(where, 'ja');
    if (o.tts !== undefined && (!isStr(o.tts) || /\d/.test(o.tts))) at(where, `tts must be a string without digits: ${o.tts}`);
    if (isStr(o.en) && /\d/.test(o.en) && o.tts === undefined) at(where, 'en has digits, so it needs a tts spelled out');
  };
  /** Distinct voices for distinct speakers in one item (else nobody can tell them apart). */
  const distinct = (where: string, whos: string[]) => {
    const vs = [...new Set(whos)].map(voice);
    if (new Set(vs).size !== vs.length) at(where, `two speakers share a voice (${vs.join(', ')})`);
  };

  for (const [n, it] of (u.items ?? []).entries()) {
    const where = `item ${n} ${it.id ?? ''}`;
    if (!isStr(it.id) || !/^[a-z0-9][a-z0-9-]{0,31}$/.test(it.id)) at(where, 'id');
    if (!KINDS.includes(it.kind as string)) at(where, `kind ${it.kind}`);
    if (!isStr(it.note)) at(where, 'note');
    else if (chars(it.note) > 40) at(where, `note is ${chars(it.note)} 字 (≤ 40)`);
    if (it.scene !== undefined && !(SCENE_IDS as readonly string[]).includes(it.scene as string)) at(where, `scene ${it.scene}`);
    if (it.channel !== undefined && !(CHANNELS as readonly string[]).includes(it.channel as string)) at(where, `channel ${it.channel}`);
    const t = it.tags as Obj | undefined;
    if (!t) at(where, 'tags');
    else {
      if (!isInt(t.seed, 1, 66) || !u.seeds.includes(t.seed)) at(where, `tags.seed ${t.seed} must be one of the unit's seeds`);
      if (!REGISTERS.includes(t.register as string)) at(where, `register ${t.register}`);
      if (!PRAGMATICS.includes(t.pragmatic as string)) at(where, `pragmatic ${t.pragmatic}`);
      if (t.conditions !== undefined && !(strs(t.conditions) && t.conditions.every((c) => CONDITIONS.includes(c)))) at(where, `conditions ${t.conditions}`);
      if (!strs(t.features) || !t.features.length || !t.features.every((x) => FEATURES.includes(x))) at(where, `features ${t.features}`);
    }

    if (it.kind === 'tile') {
      speaker(where, it.speaker);
      spoken(where, it);
      if (!isStr(it.tts) || it.tts === it.en) at(where, 'a tile needs a tts that shows the spoken shape');
      if (!strs(it.tiles) || it.tiles.length < 3 || it.tiles.length > 12) at(where, 'tiles: 3-12');
      else if (isStr(it.en) && it.tiles.join(' ') !== words(it.en)) at(where, `tiles don't rebuild en: "${it.tiles.join(' ')}" vs "${words(it.en)}"`);
      if (!strs(it.decoys) || it.decoys.length < 1 || it.decoys.length > 4) at(where, 'decoys: 1-4');
      else if (strs(it.tiles)) {
        const lower = it.tiles.map((x) => x.toLowerCase());
        for (const d of it.decoys) if (lower.includes(d.toLowerCase())) at(where, `decoy "${d}" is also a tile`);
      }
      for (const m of (it.marks ?? []) as unknown[][]) {
        const ok = Array.isArray(m) && ['say', 'link', 'drop', 'stress'].includes(m[0] as string) && isStr(m[1]) &&
          (m[0] === 'link' || m[0] === 'stress' || isStr(m[2])) && isStr(it.en) &&
          (m[0] === 'stress' ? (m[1] as string).split(' ').every((w) => hasWords(it.en as string, w)) : hasWords(it.en, m[1] as string));
        if (!ok) at(where, `mark ${JSON.stringify(m)} (its words must be in en)`);
      }
    }

    if (it.kind === 'call') {
      const lines = (it.lines ?? []) as Obj[];
      if (!Array.isArray(it.lines) || lines.length < 4) at(where, 'a call needs ≥ 4 lines');
      lines.forEach((l, i) => { speaker(`${where} line ${i}`, l.who, true); spoken(`${where} line ${i}`, l); });
      distinct(where, lines.map((l) => l.who as string));
      if (!lines.some((l) => l.repair === true)) at(where, 'a call needs a `repair: true` line (the change or correction)');
      const half = it.half as unknown[];
      if (!Array.isArray(half) || half.length !== lines.length || !half.every((h) => h === 0 || h === 1) || !half.includes(0) || !half.includes(1))
        at(where, 'half: one 0/1 per line, both roles used');
      const memo = it.memo as Obj[];
      if (!Array.isArray(memo) || memo.length < 1 || memo.length > 2) at(where, 'memo: 1-2 rounds');
      for (const [r, round] of (memo ?? []).entries()) {
        const slots = round.slots as Obj[];
        if (!Array.isArray(slots) || slots.length < 1 || slots.length > 12) { at(where, `memo ${r}: 1-12 slots`); continue; }
        for (const [s, slot] of slots.entries()) {
          const ok = isStr(slot.ask) && strs(slot.options) && slot.options.length >= 2 && slot.options.length <= 6 &&
            new Set(slot.options).size === slot.options.length && isInt(slot.answer, 0, slot.options.length - 1);
          if (!ok) at(where, `memo ${r} slot ${s}: ask, 2-6 distinct options, answer in range`);
        }
      }
    }

    if (it.kind === 'tachi') {
      const lines = (it.lines ?? []) as Obj[];
      if (!Array.isArray(it.lines) || lines.length < 6) at(where, 'a tachi needs ≥ 6 lines');
      lines.forEach((l, i) => {
        speaker(`${where} line ${i}`, l.who);
        spoken(`${where} line ${i}`, l);
        if (typeof l.at !== 'number' || l.at < -1.5 || l.at > 3 || (i === 0 && l.at !== 0)) at(`${where} line ${i}`, `at ${l.at} (the first 0; then -1.5…3 s)`);
      });
      if (!lines.some((l) => typeof l.at === 'number' && l.at < 0)) at(where, 'no overlap: give some line a negative `at`');
      const who = [...new Set(lines.map((l) => l.who as string))];
      if (who.length !== 3) at(where, `three speakers, not ${who.length}`);
      distinct(where, who);
      const rounds = (it.rounds ?? []) as Obj[];
      if (rounds.map((r) => r.type).join() !== 'opinions,changed,plan') at(where, 'rounds: opinions, changed, plan');
      const [op, ch, plan] = rounds;
      if (op && !(strs(op.claims) && op.claims.length === 3 && strs(op.answer) && op.answer.length === 3 && new Set(op.answer).size === 3 && op.answer.every((a) => who.includes(a))))
        at(where, 'opinions: 3 claims, the answer one speaker each');
      if (ch && !(isStr(ch.answer) && who.includes(ch.answer))) at(where, 'changed: a speaker');
      if (plan && !(isStr(plan.ask) && isStr(plan.ja) && strs(plan.choices) && plan.choices.length >= 3 && plan.choices.length <= 4 && isInt(plan.answer, 0, plan.choices.length - 1)))
        at(where, 'plan: ask, ja, 3-4 choices, answer in range');
    }
  }
  return bad;
}

describe('listen content (drafts)', () => {
  it('has units', () => expect(units.length).toBeGreaterThan(0));
  for (const unit of units) it(`${unit.file} is well formed`, () => expect(lint(unit)).toEqual([]));
  it('ids are unique across units', () => {
    const seen = new Map<string, string>();
    const dup: string[] = [];
    for (const { file, u } of units) for (const it of u.items ?? []) {
      const id = it.id as string;
      if (seen.has(id)) dup.push(`${id} (${seen.get(id)}, ${file})`);
      seen.set(id, file);
    }
    expect(dup).toEqual([]);
  });
  it('catches the mistakes it is for', () => {
    const u = {
      schema: 1, unit: 'x-bad', game: 'tile', stage: 2, track: 'life', seeds: [1], features: { primary: 'gonna' }, cando: 'x', status: 'draft',
      items: [{ kind: 'tile', id: 'x', speaker: 'nobody', en: 'It is 5.', tts: 'It is 5.', ja: 'x', tiles: ['It', 'is'], decoys: ['It'],
        note: 'あ'.repeat(41), tags: { seed: 2, register: 'friend', pragmatic: 'literal', features: ['gonna'] } }]
    } as unknown as Unit;
    const bad = lint({ file: 'x-bad.yaml', u }).join('\n');
    for (const want of ['roster', 'without digits', '41 字', 'tags.seed', 'tiles: 3-12', 'decoy "It"']) expect(bad).toContain(want);
  });
});
