// ことば タイル from the voiced quiz (docs/kikimimi-engine.md "ことば タイル", content/listen/README.md "Derived tiles"): every
// one-clip bank item in play that makes a fair tile (a US voice, a `tts` that reduces, 3-12 words, no digits, tagged
// with a reduction) becomes a `tile` in content/listen/s<n>-tile-bank.yaml, its stage the level's (levelRank: level 4
// もり, 6 and above やま). It plays the item's clip (`clip`, with its speaker): no new audio, so no `speaker` or `tts` of
// its own. Each run rewrites what the bank owns (clip, en, ja, tiles, scene, channel, tags) and keeps what a person
// reviewed (decoys, marks, note, ctx, why) from the file; a new tile gets defaults from the tables below, marked
// `review: true` until someone writes its help. Silent: no sound.
//   node scripts/kikimimi-tiles.ts            write the files
//   node scripts/kikimimi-tiles.ts --check    exit 1 if a file would change
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { isDialogue, levelRank, type Item, type SoundMark, type Tags } from '../src/lib/kikimimi/bank.ts';
import { BANK } from '../src/lib/kikimimi/source.ts';
import { featureSkill, tagsOf } from '../src/lib/kikimimi/tags.ts';
import clips from '../src/lib/kikimimi/clips.json' with { type: 'json' };

const DIR = join(import.meta.dirname, '../content/listen');

/** A tile's words: content.test's rule (`en` without its punctuation, case kept). */
const words = (s: string): string[] => s.replace(/[.,?!;:"“”—…]/g, ' ').split(/\s+/).filter(Boolean);
const has = (en: string, at: string) => new RegExp(`(^|[^A-Za-z'])${at.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![A-Za-z'])`, 'i').test(en);

/** The spoken shapes a mark names (written → said), tried in order over `en` and `tts`. */
const SHAPES: readonly [string, string][] = [
  ['What are you', 'whatcha'], ['What do you', 'whaddaya'], ['What did you', 'whadidja'], ["Don't you", 'dontcha'], ["Didn't you", 'didncha'],
  ["Aren't you", "aren'tcha"], ['Why did you', 'whydja'], ['going to', 'gonna'], ['want to', 'wanna'], ['got to', 'gotta'], ['have to', 'hafta'],
  ['has to', 'hasta'], ['had to', 'hadta'], ['used to', 'useta'], ['ought to', 'oughta'], ['supposed to', 'sposta'], ['Let me', 'lemme'],
  ['Give me', 'gimme'], ["don't know", 'dunno'], ['kind of', 'kinda'], ['sort of', 'sorta'], ['a lot of', 'a lotta'], ["should've", 'shoulda'],
  ["would've", 'woulda'], ["could've", 'coulda'], ["must've", 'musta'], ['must have', 'musta'], ["wouldn't have", "wouldn't've"],
  ["shouldn't have", "shouldn't've"], ["couldn't have", "couldn'ta"], ['Did you', 'didja'], ['Would you', 'wouldja'], ['Could you', 'couldja'],
  ['Do you', "d'you"], ['Have you', 'have ya'], ['him', "'im"], ['her', "'er"], ['them', "'em"]
];

/** What a Japanese ear plausibly hears instead of a tile (README "tile": weak forms, contractions, near sounds). */
const DECOY: Readonly<Record<string, string>> = {
  did: 'do', do: 'did', would: 'will', could: 'can', can: "can't", "can't": 'can', want: "won't", "won't": 'want', going: 'want',
  "should've": "shouldn't have", "would've": "wouldn't have", "could've": "couldn't have", "must've": 'must', must: 'much',
  "wouldn't": 'would', "shouldn't": 'should', "couldn't": 'could', "didn't": 'did', "aren't": 'are', "weren't": 'were', "haven't": 'have',
  "hasn't": 'has', "isn't": 'is', "don't": "won't", got: 'get', to: 'the', the: 'a', a: 'the', and: 'in', in: 'and', for: 'four', of: 'have',
  have: 'of', him: 'them', them: 'him', her: 'their', your: 'you', you: 'your', "i'd": "I'll", "i'll": "I'd", "we'll": 'we', "you'll": 'you',
  "they'll": 'there', "we're": 'were', "you're": 'your', "they're": 'there', "i've": 'I', "we've": 'we', "you've": 'you', "you'd": 'you',
  "it's": 'is', "that's": 'that', "what's": 'what', used: 'use', supposed: 'suppose', had: 'have', at: 'it', it: 'at', then: 'than',
  than: 'then', been: 'being', ten: 'then'
};

/** A decoy cased like the tile it stands for (a sentence's first word stays capitalised; "I" always). */
const cased = (d: string, tile: string) => (/^[A-Z]/.test(tile) || /^I\b/.test(d) ? d[0].toUpperCase() + d.slice(1) : d);

interface Src { it: Item; tts: string }
interface Tile {
  clip: string; en: string; ja: string; tiles: string[];
  /** Who says it and how (a comment for the reviewer: the clip's speaker and `tts`). */
  said: string; decoys: string[]; marks: SoundMark[];
  note: string; ctx?: string; why?: string; review?: boolean; scene?: string; channel?: string; tags: Tags;
}

/** The bank's one-clip items that make a fair tile, in the bank's order (a dialogue's lines aren't: listen.ts). */
function sources(): Src[] {
  const out: Src[] = [];
  for (const it of BANK) {
    const n = words(it.en).length, { tts } = it;
    if (!isDialogue(it) && it.tags && it.voice === 'us' && tts && tts !== it.en && !/\d/.test(it.en) && n >= 3 && n <= 12 && it.id in clips &&
      tagsOf(it).features.some((f) => featureSkill(f) === 'reduce')) out.push({ it, tts });
  }
  return out;
}

/** The marks over `en`: the bank's own, else the shapes `tts` says. */
function marksOf({ it: { en, marks }, tts }: Src): SoundMark[] {
  const own = (marks ?? []).filter((m) => m[0] === 'stress' ? m[1].split(' ').every((w) => has(en, w)) : has(en, m[1]));
  if (own.length) return [...own];
  const found: SoundMark[] = [];
  for (const [at, said] of SHAPES) {
    if (found.length === 3) break;
    const m = en.match(new RegExp(`(^|[^A-Za-z'])(${at.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?![A-Za-z'])`, 'i'));
    if (m && has(tts, said) && !found.some((f) => f[1].toLowerCase().includes(m[2].toLowerCase()))) found.push(['say', m[2], said]);
  }
  for (const w of words(en)) if (found.length < 3 && /ing$/.test(w) && has(tts, `${w.slice(0, -1)}'`)) found.push(['drop', w, 'g']);
  return found;
}

/** Two decoys: first for the words the marks say (the reduction itself), then the sentence's other weak words. */
function decoysOf(tiles: string[], marks: readonly SoundMark[]): string[] {
  const lower = new Set(tiles.map((t) => t.toLowerCase()));
  const marked = new Set(marks.flatMap((m) => m[1].toLowerCase().split(' ')));
  const order = [...tiles.filter((t) => marked.has(t.toLowerCase())), ...tiles.filter((t) => !marked.has(t.toLowerCase()))];
  const out: string[] = [];
  for (const t of order) {
    const d = DECOY[t.toLowerCase()];
    if (d && !lower.has(d.toLowerCase()) && !out.some((o) => o.toLowerCase() === d.toLowerCase())) out.push(cased(d, t));
    if (out.length === 2) break;
  }
  return out;
}

/** A default note (≤ 40 字): the first reduction's spoken shape. */
const noteOf = (marks: readonly SoundMark[]): string => {
  const say = marks.find((m) => m[0] === 'say') as readonly ['say', string, string] | undefined;
  return say ? `${say[2]}＝${say[1]}。弱い音を聞きのがさない` : '弱い音とつながりを聞きのがさない';
};

/** The stage file a level's tiles go to: もり (level 4, the アナウンス pack) or やま (6 and up). */
const unitOf = (lv: number) => (levelRank(lv) >= 5 ? 's3-tile-bank' : 's2-tile-bank');
const HEADERS: Readonly<Record<string, { stage: number; cando: string; title: string }>> = {
  's2-tile-bank': { stage: 3, title: 'S2 もり', cando: "クイズで 聞いた 文を、ちぢんだ 音から ことばごとに 組み立てられる" },
  's3-tile-bank': { stage: 4, title: 'S3 やま', cando: "はやい 会話の ちぢんだ 音を、ことばごとに 組み立てられる" }
};

const q = (s: string) => JSON.stringify(s);
const list = (xs: readonly string[]) => `[${xs.map(q).join(', ')}]`;
const bare = (xs: readonly string[]) => `[${xs.join(', ')}]`;
const mark = (m: SoundMark) => `[${m[0]}, ${m.slice(1).map((x) => q(x)).join(', ')}]`;

function yamlOf(unit: string, tiles: Tile[], status = 'draft'): string {
  const h = HEADERS[unit];
  const seeds = [...new Set(tiles.map((t) => t.tags.seed))].sort((a, b) => a - b);
  const count = new Map<string, number>();
  for (const t of tiles) for (const f of t.tags.features ?? []) if (featureSkill(f) === 'reduce') count.set(f, (count.get(f) ?? 0) + 1);
  const [primary, review] = [...count].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([f]) => f);
  const out = [
    `# ことば タイル ${h.title}, from the voiced quiz: written by scripts/kikimimi-tiles.ts, which keeps decoys, marks, note,`,
    '# ctx and why as reviewed and rewrites the rest from the bank. Each tile plays its bank clip (`clip`): no new audio.',
    'schema: 1', `unit: ${unit}`, 'game: tile', `stage: ${h.stage}`, 'track: life', `seeds: ${bare(seeds.map(String))}`,
    `features: { primary: ${primary}${review ? `, review: ${review}` : ''} }`, `cando: ${q(h.cando)}`, `status: ${status}`, 'items:'
  ];
  for (const t of tiles) {
    const g = t.tags;
    const tags = [`seed: ${g.seed}`, `register: ${g.register}`, `pragmatic: ${g.pragmatic}`, ...(g.conditions?.length ? [`conditions: ${bare(g.conditions)}`] : []),
      `features: ${bare(g.features ?? [])}`];
    out.push(
      '  - kind: tile', `    id: tile-${t.clip}`, `    clip: ${t.clip}`, `    en: ${q(t.en)}`, `    # ${t.said}`, `    ja: ${q(t.ja)}`,
      `    tiles: ${list(t.tiles)}`, `    decoys: ${list(t.decoys)}`, `    marks: [${t.marks.map(mark).join(', ')}]`, `    note: ${q(t.note)}`,
      ...(t.ctx ? [`    ctx: ${q(t.ctx)}`] : []), ...(t.why ? [`    why: ${q(t.why)}`] : []), ...(t.review ? ['    review: true'] : []),
      ...(t.scene ? [`    scene: ${t.scene}`] : []), ...(t.channel ? [`    channel: ${t.channel}`] : []), `    tags: { ${tags.join(', ')} }`, ''
    );
  }
  return out.join('\n').trimEnd() + '\n';
}

/** Each file's text: the bank's tiles, with the reviewed fields kept from the file. */
function tileFiles(): Map<string, string> {
  const byUnit = new Map<string, Tile[]>();
  const kept = new Map<string, Partial<Tile>>(), status = new Map<string, string>();
  for (const unit of Object.keys(HEADERS)) {
    const path = join(DIR, `${unit}.yaml`);
    if (!existsSync(path)) continue;
    const file = parse(readFileSync(path, 'utf8')) as { status?: string; items?: (Partial<Tile> & { id: string })[] };
    if (file.status) status.set(unit, file.status); // the lead's flip (draft → listened) is kept
    for (const it of file.items ?? []) kept.set(it.id, it);
  }
  for (const s of sources()) {
    const id = `tile-${s.it.id}`;
    if (id.length > 32) throw new Error(`${id}: an id is ≤ 32 characters`);
    const tiles = words(s.it.en), old = kept.get(id);
    const marks = (old?.marks as SoundMark[] | undefined) ?? marksOf(s);
    const reviewed = !!(old?.why && old.ctx && !old.review);
    const tile: Tile = {
      clip: s.it.id, en: s.it.en, said: `${s.it.speaker}: ${s.tts}`, ja: s.it.ja.split('→')[0].trim(), tiles, marks,
      decoys: old?.decoys ?? decoysOf(tiles, marks), note: old?.note ?? noteOf(marks), ctx: old?.ctx, why: old?.why, review: !reviewed,
      ...(s.it.scene && { scene: s.it.scene }), ...(s.it.channel && { channel: s.it.channel }), tags: s.it.tags as Tags
    };
    const unit = unitOf(s.it.lv);
    byUnit.set(unit, [...(byUnit.get(unit) ?? []), tile]);
  }
  return new Map([...byUnit].map(([unit, tiles]) => [unit, yamlOf(unit, tiles, status.get(unit))]));
}

if (import.meta.main) {
  const check = process.argv.includes('--check');
  let stale = 0;
  for (const [unit, text] of tileFiles()) {
    const path = join(DIR, `${unit}.yaml`), was = existsSync(path) ? readFileSync(path, 'utf8') : '';
    const n = text.match(/^ {2}- kind: tile$/gm)?.length ?? 0, todo = text.match(/^ {4}review: true$/gm)?.length ?? 0;
    console.log(`${unit}.yaml: ${n} tiles${todo ? `, ${todo} to review` : ''}${was === text ? '' : check ? ' (stale)' : ' (written)'}`);
    if (was === text) continue;
    if (check) stale++;
    else writeFileSync(path, text);
  }
  if (stale) process.exit(1);
}
