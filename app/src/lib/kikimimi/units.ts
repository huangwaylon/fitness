// ききみみ's units (docs/curriculum-units.md, §10's amendments; the engineering review's manifest overlay): a unit is a
// manifest, `app/content/units/<id>.yaml`, over the bank's items. It references existing item ids (kept where they are,
// each keeping its `lv`, so the level quizzes and their decks never change) and defines only its new items, inline, in
// the bank's item shape. This file reads and checks the manifests (one at a time, then all of them against the bank:
// homes, references, phrases, recycling, coverage) and is what compile.ts turns into the units' index entries and
// chunks. Pure: no files (compile.ts reads them), no audio.
import { ROSTER } from '#lib/villagers/roster.ts';
import { CHANNELS, DIALOGUE_TYPES, SCENE_IDS, clipIds, isDialogue, levelRank, type Feature, type Item, type ItemType, type Tags } from './bank.ts';
import type { Ladder } from './ladder.ts';
import { CAST_IDS } from './speech.ts';
import { LESSONS, LESSON_QS, STAGES, type Stage } from './stages.ts';

export { LESSONS, LESSON_QS, STAGES, type Stage } from './stages.ts';

/** The nine domains (plan §1: ともだち, いえ, たべもの, かいもの, たび, しごと, イベント, まち, からだ), a tag on each unit; `glue` the anchor units (introducing, inviting, asking for
 *  clarification, ending a conversation) that open each stage and count toward no domain. */
export const DOMAINS = ['tomodachi', 'ie', 'tabemono', 'kaimono', 'tabi', 'shigoto', 'ibento', 'machi', 'karada'] as const;
type Domain = (typeof DOMAINS)[number];

type Lesson = (typeof LESSONS)[number];
const CORE: readonly Lesson[] = ['deai', 'bamen', 'check'];
/** The lesson recipes this build knows (plan §3: the version on the recipe; v1 the interim チェック, a mixed check on
 *  held-out items behind a "phone errand" card, until ようじ でんわ and たちぎき are built). */
const RECIPES = [1] as const;

const REGISTERS: readonly Tags['register'][] = ['service', 'colleague', 'boss', 'friend', 'partner', 'neighbour', 'stranger', 'official', 'broadcast'];
const ITEM_TYPES: readonly ItemType[] = ['pic', 'word', 'num', 'reply', 'mean', 'gist', 'next'];
const STATUSES = ['draft', 'voiced', 'listened'] as const;
type Status = (typeof STATUSES)[number];

/** A unit's id: `<domain2>-<slug>`, ≤ 12 (the `listen` row's `u`), never a stage (so a unit can move). */
const UNIT_ID_RE = /^[a-z]{2}-[a-z0-9-]{1,9}$/;
const ITEM_ID_RE = /^[a-z0-9][a-z0-9-]{0,31}$/;
const PHRASE_ID_RE = /^ph-[a-z0-9-]{1,29}$/;
const SCENE_RE = /^[a-z][a-z0-9-]{0,15}$/;
/** The can-do's English (curriculum review P0-3): "I can follow [who] [function] [condition] and catch [information]". */
const CANDO_EN_RE = /^I can follow .{8,}, and (catch|tell) .{4,}\.$/;
const NAME_MAX = 12;
/** The can-do's one line (the unit page, a stop on しまの みち, a lesson's intro card): kana with spaces, ≤ 25 characters. */
export const SHORT_MAX = 25;
const NOTE_MAX = 40;

/** A key phrase (plan §2): its id, the words, when to use it (register), the scene, and the trap a Japanese speaker
 *  falls into; `match` a regex over an item's English when the words alone don't find it (inflections). */
interface Phrase {
  id: string;
  en: string;
  ja?: string;
  register: Tags['register'];
  scene: string;
  trap: string;
  match?: string;
}

/** The can-do (plan §2's template, from the CEFR Companion Volume's listening scales): 「[who]が [does]のを [cond]
 *  きいて、[catch]が わかる」, and its English. */
export interface CanDo {
  who: string;
  does: string;
  cond: string;
  catch: string;
  /** The one line: 「ホテルの もんだいを ききとれる」 (required past draft). */
  short?: string;
  en: string;
}

/** An easier or harder choice set for an item, played by one player's tier on the same audio (plan §4, §10). */
interface ChoiceSet {
  choices: string[];
  answer: number;
}

export interface UnitManifest {
  schema: 1;
  unit: string;
  /** The unit's name: a can-do verb, ≤ 12 characters, never 「レッスン」 (plan §2). */
  name: string;
  stage: Stage;
  domain: Domain | 'glue';
  /** Other domains it touches (the filter chips; coverage counts `domain` only). */
  also?: Domain[];
  host: string;
  scene: string;
  sound: Feature | string;
  cando: CanDo;
  status: Status;
  ph: Phrase[];
  /** Existing items its lessons reuse without making this unit their home (review). */
  review?: string[];
  /** Its new items, in the bank's shape. */
  items?: Item[];
  lessons: { v: number } & Partial<Record<Lesson, string[]>>;
  tiers?: Record<string, { easy?: ChoiceSet; hard?: ChoiceSet }>;
}

interface Problems {
  errors: string[];
  warnings: string[];
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const isInt = (v: unknown, lo: number, hi: number): v is number => Number.isInteger(v) && (v as number) >= lo && (v as number) <= hi;
const strs = (v: unknown): v is string[] => Array.isArray(v) && v.every(isStr);
const chars = (s: string): number => [...s].length;
const KEYS = new Set(['schema', 'unit', 'name', 'stage', 'domain', 'also', 'host', 'scene', 'sound', 'cando', 'status', 'ph', 'review', 'items', 'lessons', 'tiers']);

/** The can-do as one Japanese sentence. */
export const candoText = (c: CanDo): string => `${c.who}が ${c.does}のを ${c.cond} きいて、${c.catch}が わかる`;

/** Problems with a can-do against the template (empty: fine). */
export function candoProblems(c: unknown): string[] {
  if (!isObj(c)) return ['cando: {who, does, cond, catch, en}'];
  const bad: string[] = [];
  for (const k of ['who', 'does', 'cond', 'catch'] as const) {
    const v = c[k];
    if (!isStr(v)) bad.push(`cando.${k}: missing`);
    else if (chars(v) > 30) bad.push(`cando.${k}: over 30 characters`);
  }
  if (isStr(c.who) && /が$/.test(c.who)) bad.push('cando.who: the template adds が');
  if (isStr(c.does) && /のを$/.test(c.does)) bad.push('cando.does: the template adds のを');
  if (isStr(c.cond) && /きいて$/.test(c.cond)) bad.push('cando.cond: the template adds きいて');
  if (isStr(c.catch) && /(が|わかる)$/.test(c.catch)) bad.push('cando.catch: the template adds が わかる');
  if (!isStr(c.en) || !CANDO_EN_RE.test(c.en)) bad.push('cando.en: "I can follow [who] [doing what] [how heard], and catch [what]."');
  if (c.short !== undefined && (!isStr(c.short) || chars(c.short.trim()) > SHORT_MAX || /[\n。、]/.test(c.short))) bad.push(`cando.short: one line, ≤ ${SHORT_MAX} characters, no 。 or 、`);
  for (const k of Object.keys(c)) if (!['who', 'does', 'cond', 'catch', 'short', 'en'].includes(k)) bad.push(`cando: unknown key ${k}`);
  return bad;
}

/** Problems with an inline item, in the bank's shape (the checks bank.test makes of the TS banks that can be made
 *  without its clip). */
function itemProblems(it: unknown): string[] {
  if (!isObj(it)) return ['not an item'];
  const bad: string[] = [];
  const id = isStr(it.id) ? it.id : '?';
  const at = (msg: string) => bad.push(`item ${id}: ${msg}`);
  if (!isStr(it.id) || !ITEM_ID_RE.test(it.id)) at('id: [a-z0-9][a-z0-9-]{0,31}');
  if (!isInt(it.lv, 1, 8)) at('lv: 1-8');
  if (!ITEM_TYPES.includes(it.type as ItemType)) at(`type ${String(it.type)}`);
  if (!isStr(it.en) || !isStr(it.ja)) at('en and ja');
  if (!isStr(it.speaker) || !(it.speaker in ROSTER)) at(`speaker ${String(it.speaker)} isn't in the roster`);
  if (!['us', 'uk', 'au'].includes(it.voice as string)) at('voice: us | uk | au');
  if (it.cast !== undefined && !(CAST_IDS as readonly unknown[]).includes(it.cast)) at(`cast ${String(it.cast)}`);
  if (!strs(it.choices) || it.choices.length < 2 || it.choices.length > 4 || new Set(it.choices).size !== it.choices.length) at('choices: 2-4, distinct');
  else if (!isInt(it.answer, 0, it.choices.length - 1)) at('answer out of range');
  if (it.tts !== undefined && (!isStr(it.tts) || /\d/.test(it.tts))) at('tts: no digits');
  if (isStr(it.en) && /\d/.test(it.en) && it.tts === undefined && !isDialogue(it as Pick<Item, 'lines'>)) at('a digit in en needs a tts');
  if (it.note !== undefined && (!isStr(it.note) || chars(it.note) > NOTE_MAX)) at(`note ≤ ${NOTE_MAX} characters`);
  if (it.type === 'word' && (!isStr(it.focus) || !isStr(it.en) || !it.en.includes(it.focus))) at('a word item’s focus is in en');
  if (it.scene !== undefined && !(SCENE_IDS as readonly unknown[]).includes(it.scene)) at(`scene ${String(it.scene)}`);
  if (it.channel !== undefined && !(CHANNELS as readonly unknown[]).includes(it.channel)) at(`channel ${String(it.channel)}`);
  const dialogue = DIALOGUE_TYPES.includes(it.type as ItemType);
  if (dialogue !== Array.isArray(it.lines)) at(dialogue ? 'a dialogue needs lines' : 'lines are for gist and next only');
  if (Array.isArray(it.lines)) {
    if (it.lines.length < 2 || it.lines.length > 8) at('lines: 2-8');
    it.lines.forEach((l: unknown, n) => {
      if (!isObj(l) || !isStr(l.who) || !(l.who in ROSTER) || !isStr(l.en) || !isStr(l.ja) || !(CAST_IDS as readonly unknown[]).includes(l.cast)) at(`line ${n + 1}: {who, cast, en, ja}`);
      else if (/\d/.test(l.en) && l.tts === undefined) at(`line ${n + 1}: a digit in en needs a tts`);
      else if (l.tts !== undefined && (!isStr(l.tts) || /\d/.test(l.tts))) at(`line ${n + 1}: tts: no digits`);
    });
  }
  return bad;
}

const choiceSetOk = (s: unknown): boolean => isObj(s) && strs(s.choices) && s.choices.length >= 2 && s.choices.length <= 4 &&
  new Set(s.choices).size === s.choices.length && isInt(s.answer, 0, s.choices.length - 1) && Object.keys(s).every((k) => k === 'choices' || k === 'answer');

/** A manifest as parsed (YAML), checked on its own; `file` its file name (`<unit>.yaml`). The checks against the bank
 *  and the other units are `checkUnits`'. */
export function manifestOf(raw: unknown, file: string): { unit: UnitManifest | null; errors: string[] } {
  const errors: string[] = [];
  const at = (msg: string) => errors.push(`${file}: ${msg}`);
  if (!isObj(raw)) return { unit: null, errors: [`${file}: not a unit`] };
  for (const k of Object.keys(raw)) if (!KEYS.has(k)) at(`unknown key ${k}`);
  if (raw.schema !== 1) at('schema must be 1');
  if (!isStr(raw.unit) || !UNIT_ID_RE.test(raw.unit) || `${raw.unit}.yaml` !== file) at(`unit "${String(raw.unit)}": <domain2>-<slug> (≤ 12), the file's name`);
  if (!isStr(raw.name) || chars(raw.name) > NAME_MAX || /レッスン/.test(raw.name)) at(`name: a can-do verb, ≤ ${NAME_MAX} characters, never レッスン`);
  if (!isStr(raw.stage) || !(raw.stage in STAGES)) at(`stage ${String(raw.stage)}: ${Object.keys(STAGES).join(' | ')}`);
  if (raw.domain !== 'glue' && !(DOMAINS as readonly unknown[]).includes(raw.domain)) at(`domain ${String(raw.domain)}: glue | ${DOMAINS.join(' | ')}`);
  if (raw.also !== undefined && (!Array.isArray(raw.also) || !raw.also.every((d) => (DOMAINS as readonly unknown[]).includes(d) && d !== raw.domain))) at('also: other domains');
  if (!isStr(raw.host) || !(raw.host in ROSTER)) at(`host ${String(raw.host)} isn't in the roster`);
  if (!isStr(raw.scene) || !SCENE_RE.test(raw.scene)) at('scene: [a-z][a-z0-9-]{0,15}');
  const stage = STAGES[raw.stage as Stage];
  if (stage && !(stage.sounds as readonly unknown[]).includes(raw.sound)) at(`sound ${String(raw.sound)}: one of ${raw.stage}'s (${stage.sounds.join(', ')})`);
  for (const p of candoProblems(raw.cando)) at(p);
  if (!(STATUSES as readonly unknown[]).includes(raw.status)) at(`status: ${STATUSES.join(' | ')}`);
  if (raw.status !== 'draft' && isObj(raw.cando) && raw.cando.short === undefined) at(`cando.short: the one line, required once ${String(raw.status)}`);
  // phrases
  if (!Array.isArray(raw.ph) || raw.ph.length < 1 || raw.ph.length > 10) at('ph: 1-10 key phrases (6-10 once written)');
  const phIds = new Set<string>();
  for (const p of Array.isArray(raw.ph) ? raw.ph : []) {
    const id = isObj(p) && isStr(p.id) ? p.id : '?';
    if (!isObj(p) || !PHRASE_ID_RE.test(id)) at(`phrase ${id}: id ph-[a-z0-9-]`);
    else {
      if (phIds.has(id)) at(`phrase ${id}: twice`);
      phIds.add(id);
      if (!isStr(p.en)) at(`phrase ${id}: en`);
      if (!REGISTERS.includes(p.register as Tags['register'])) at(`phrase ${id}: register ${String(p.register)}`);
      if (!isStr(p.scene)) at(`phrase ${id}: scene`);
      if (!isStr(p.trap) || chars(p.trap) > NOTE_MAX) at(`phrase ${id}: trap (≤ ${NOTE_MAX} characters)`);
      if (p.ja !== undefined && !isStr(p.ja)) at(`phrase ${id}: ja`);
      if (p.match !== undefined) {
        try {
          new RegExp(String(p.match), 'i');
        } catch {
          at(`phrase ${id}: match isn't a regex`);
        }
      }
      for (const k of Object.keys(p)) if (!['id', 'en', 'ja', 'register', 'scene', 'trap', 'match'].includes(k)) at(`phrase ${id}: unknown key ${k}`);
    }
  }
  // items
  if (raw.items !== undefined && !Array.isArray(raw.items)) at('items: a list');
  for (const it of Array.isArray(raw.items) ? raw.items : []) for (const p of itemProblems(it)) at(p);
  if (raw.review !== undefined && !strs(raw.review)) at('review: item ids');
  // lessons
  const ls = raw.lessons;
  if (!isObj(ls)) at('lessons: {v, deai, bamen, check, oto?, jissen?}');
  else {
    if (!(RECIPES as readonly unknown[]).includes(ls.v)) at(`lessons.v ${String(ls.v)}: a recipe this build knows (${RECIPES.join(', ')})`);
    for (const k of Object.keys(ls)) if (k !== 'v' && !(LESSONS as readonly string[]).includes(k)) at(`lessons: unknown lesson ${k}`);
    for (const l of LESSONS) {
      const ids = ls[l];
      if (ids === undefined) {
        if (CORE.includes(l)) at(`lessons.${l}: a core lesson`);
        continue;
      }
      if (!strs(ids) || ids.length < LESSON_QS) at(`lessons.${l}: at least ${LESSON_QS} item ids (one 6-question game)`);
      else if (new Set(ids).size !== ids.length) at(`lessons.${l}: an id twice`);
    }
  }
  if (raw.tiers !== undefined) {
    if (!isObj(raw.tiers)) at('tiers: {itemId: {easy?, hard?}}');
    else for (const [id, t] of Object.entries(raw.tiers)) {
      if (!isObj(t) || Object.keys(t).some((k) => k !== 'easy' && k !== 'hard') || (!t.easy && !t.hard)) at(`tiers.${id}: {easy?, hard?}`);
      else for (const k of ['easy', 'hard'] as const) if (t[k] !== undefined && !choiceSetOk(t[k])) at(`tiers.${id}.${k}: {choices (2-4, distinct), answer}`);
    }
  }
  return { unit: errors.length ? null : (raw as unknown as UnitManifest), errors };
}

// ---- all the units against the bank ---------------------------------------------------------------------------------

/** A phrase's words as matched (case, punctuation and curly quotes aside). */
const norm = (s: string): string => ` ${s.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim()} `;

/** An item's lines with their voices: a dialogue's each, else the item's own (a voice: its cast, else accent and
 *  speaker). */
const spoken = (it: Item): { en: string; voice: string }[] =>
  isDialogue(it) ? it.lines.map((l) => ({ en: l.en, voice: l.cast })) : [{ en: it.en, voice: it.cast ?? `${it.voice}:${it.speaker}` }];

/** Whether a phrase is heard in a line. */
const hears = (p: Phrase, en: string): boolean => (p.match ? new RegExp(p.match, 'i').test(en) : norm(en).includes(norm(p.en)));

export interface UnitsCheck extends Problems {
  /** Each item's home unit (its lessons' items not under `review`, and its own). */
  home: Map<string, string>;
  /** Each phrase's items (the bank's and the units' own) and voices. */
  phraseIn: Map<string, { items: string[]; voices: string[] }>;
  /** Each unit's items carrying a phrase from a lower stage or the stage's anchor units, of its lesson items. */
  recycled: Map<string, { n: number; of: number }>;
  /** Per stage: units, by domain (glue apart). */
  coverage: Map<Stage, { units: number; glue: number; domains: Partial<Record<Domain, number>> }>;
}

/** Units planned per stage (plan §7): coverage warns till a stage has them, then fails. */
export const PLANNED: Readonly<Record<Stage, number>> = { hama: 3, kawa: 10, mori: 14, yama: 14, hoshi: 10 };
/** Wave 1 (plan §9, §10): recycling warns till this many units are past draft, then fails. */
export const WAVE1 = 7;
/** Coverage (plan §1): at least this many domains per stage, none over this share. */
const MIN_DOMAINS = 7;
const MAX_SHARE = 0.25;
/** Recycling (§10): at least this share of a unit's items reuse a lower stage's or an anchor's phrase. */
const MIN_RECYCLED = 0.2;
/** A phrase (§10): in at least this many items, spoken by at least this many voices. */
const PHRASE_ITEMS = 3;
const PHRASE_VOICES = 2;

/** Every unit's lesson items in order, each once. */
export const lessonIds = (u: UnitManifest): string[] => [...new Set(LESSONS.flatMap((l) => u.lessons[l] ?? []))];

/**
 * The units together, against the bank (`bank`, every item as authored) and the ladders: ids unique, every reference
 * found, ≤ 1 home per item, the stage's band, the lesson recipe (であい has a dialogue, チェック held out with ≥ 2
 * voices, おと on words), the tiers on the unit's own items, every clip of a unit past draft (`clips`), the phrases (each in ≥ 3 items by ≥ 2 voices: an error past
 * draft, a warning before), recycling (≥ 20 %: a warning till wave 1 is past draft) and coverage (≥ 7 of 9 domains a
 * stage, none over 25 %: a warning till the stage has its planned units).
 */
export function checkUnits(units: readonly UnitManifest[], bank: readonly Item[], ladders: readonly Ladder[] = [], clips?: Readonly<Record<string, unknown>>): UnitsCheck {
  const errors: string[] = [], warnings: string[] = [];
  const BANK_IDS = new Map(bank.map((it) => [it.id, it]));
  const LADDER_IDS = new Map(ladders.map((l) => [l.id, l]));
  const RUNG_IDS = new Set(ladders.flatMap((l) => l.rungs.map((r) => r.id)));
  const own = new Map<string, Item>(), ownBy = new Map<string, string>();
  const ids = new Set<string>();
  for (const u of units) {
    if (ids.has(u.unit)) errors.push(`${u.unit}: a unit twice`);
    ids.add(u.unit);
    for (const it of u.items ?? []) {
      if (BANK_IDS.has(it.id) || LADDER_IDS.has(it.id) || RUNG_IDS.has(it.id) || own.has(it.id)) errors.push(`${u.unit}: item ${it.id}: the id is taken${ownBy.has(it.id) ? ` (${ownBy.get(it.id)})` : ''}`);
      own.set(it.id, it);
      ownBy.set(it.id, u.unit);
    }
  }
  const itemFor = (id: string): Item | undefined => own.get(id) ?? BANK_IDS.get(id);
  // phrases: unique across units, where each is defined
  const phrases = new Map<string, { p: Phrase; unit: UnitManifest }>();
  for (const u of units) for (const p of u.ph) {
    if (phrases.has(p.id)) errors.push(`${u.unit}: phrase ${p.id}: defined in ${phrases.get(p.id)!.unit.unit} too`);
    else phrases.set(p.id, { p, unit: u });
  }
  // homes, references, band, the recipe, the tiers
  const home = new Map<string, string>();
  for (const u of units) {
    const at = (msg: string) => errors.push(`${u.unit}: ${msg}`);
    const review = new Set(u.review ?? []);
    const all = lessonIds(u);
    const rank = STAGES[u.stage].rank;
    for (const id of review) if (!all.includes(id)) at(`review ${id}: in no lesson`);
    for (const id of review) if (ownBy.get(id) === u.unit) at(`review ${id}: the unit's own item`);
    for (const it of u.items ?? []) if (!all.includes(it.id)) warnings.push(`${u.unit}: item ${it.id}: in no lesson`);
    for (const l of LESSONS) for (const id of u.lessons[l] ?? []) {
      if (l === 'jissen' && LADDER_IDS.has(id)) continue;
      const it = itemFor(id);
      if (!it) {
        at(`lessons.${l}: ${id} isn't an item${RUNG_IDS.has(id) ? ' (a rung: name its ladder)' : ''}`);
        continue;
      }
      if (Math.abs(levelRank(it.lv) - rank) > 1) at(`lessons.${l}: ${id} (level ${it.lv}) is more than a step from ${u.stage}`);
    }
    for (const id of all) {
      if (review.has(id) || LADDER_IDS.has(id) || !itemFor(id)) continue;
      const was = home.get(id);
      if (was && was !== u.unit) at(`${id}: its home is ${was} already (list it under review)`);
      else home.set(id, u.unit);
    }
    const items = (l: Lesson) => (u.lessons[l] ?? []).map(itemFor).filter((it): it is Item => !!it);
    if (u.lessons.deai && !items('deai').some((it) => isDialogue(it))) at('lessons.deai: needs a model dialogue (gist or next)');
    const check = u.lessons.check ?? [];
    for (const id of check) if (u.lessons.deai?.includes(id) || u.lessons.bamen?.includes(id)) at(`lessons.check: ${id} is in であい or ばめん (the check is held out)`);
    if (new Set(items('check').flatMap((it) => spoken(it).map((s) => s.voice))).size < 2) at('lessons.check: at least 2 voices');
    if (u.lessons.oto && items('oto').filter((it) => it.type === 'word' || !!it.focus).length * 2 < items('oto').length) at('lessons.oto: mostly word items (chunks in connected speech)');
    for (const id of Object.keys(u.tiers ?? {})) {
      const it = itemFor(id);
      if (!all.includes(id) || !it) at(`tiers.${id}: not one of the unit's lesson items`);
      else if (it.type === 'pic') at(`tiers.${id}: a pic item's choices are pictures`);
    }
    if (clips && u.status !== 'draft')
      for (const id of all) {
        const it = itemFor(id);
        if (it && !clipIds(it).every((c) => c in clips)) at(`${id}: no clip, but the unit is ${u.status}`);
      }
  }
  // phrases: where heard (every item in the bank and the units), by how many voices
  const heard: Item[] = [...bank, ...own.values()];
  const phraseIn = new Map<string, { items: string[]; voices: string[] }>();
  const itemPhrases = new Map<string, Set<string>>();
  for (const [id, { p, unit }] of phrases) {
    const inItems: string[] = [], voices = new Set<string>();
    for (const it of heard) {
      const lines = spoken(it).filter((s) => hears(p, s.en));
      if (!lines.length) continue;
      inItems.push(it.id);
      for (const s of lines) voices.add(s.voice);
      (itemPhrases.get(it.id) ?? itemPhrases.set(it.id, new Set()).get(it.id)!).add(id);
    }
    phraseIn.set(id, { items: inItems, voices: [...voices] });
    if (inItems.length < PHRASE_ITEMS || voices.size < PHRASE_VOICES) {
      const msg = `${unit.unit}: phrase ${id} is in ${inItems.length} items by ${voices.size} voices (needs ${PHRASE_ITEMS} by ${PHRASE_VOICES})`;
      (unit.status === 'draft' ? warnings : errors).push(msg);
    }
  }
  // recycling: a lower stage's phrases, or the stage's anchors' (another unit's)
  const past = units.filter((u) => u.status !== 'draft').length;
  const recycled = new Map<string, { n: number; of: number }>();
  for (const u of units) {
    const rank = STAGES[u.stage].rank;
    const sources = new Set([...phrases].filter(([, { unit }]) => unit !== u && (STAGES[unit.stage].rank < rank || (unit.stage === u.stage && unit.domain === 'glue'))).map(([id]) => id));
    const all = lessonIds(u).filter((id) => itemFor(id));
    const n = all.filter((id) => [...(itemPhrases.get(id) ?? [])].some((p) => sources.has(p))).length;
    recycled.set(u.unit, { n, of: all.length });
    if (all.length && n < MIN_RECYCLED * all.length) {
      const msg = `${u.unit}: ${n} of ${all.length} items reuse a lower stage's or an anchor's phrase (needs ${Math.round(MIN_RECYCLED * 100)} %)`;
      (past >= WAVE1 && sources.size ? errors : warnings).push(msg);
    }
  }
  // coverage per stage
  const coverage: UnitsCheck['coverage'] = new Map();
  for (const u of units) {
    const c = coverage.get(u.stage) ?? coverage.set(u.stage, { units: 0, glue: 0, domains: {} }).get(u.stage)!;
    if (u.domain === 'glue') c.glue++;
    else (c.units++, (c.domains[u.domain] = (c.domains[u.domain] ?? 0) + 1));
  }
  for (const [stage, c] of coverage) {
    const out = c.units + c.glue >= PLANNED[stage] ? errors : warnings;
    const n = Object.keys(c.domains).length;
    if (n < MIN_DOMAINS) out.push(`${stage}: ${n} of 9 domains (needs ${MIN_DOMAINS})`);
    for (const [d, k] of Object.entries(c.domains)) if (k! > MAX_SHARE * c.units && c.units >= 4) out.push(`${stage}: ${d} is ${k} of ${c.units} units (over ${MAX_SHARE * 100} %)`);
  }
  return { errors, warnings, home, phraseIn, recycled, coverage };
}
