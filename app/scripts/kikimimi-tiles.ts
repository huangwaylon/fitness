// ことば タイル from the voiced quiz (docs/kikimimi-engine.md "ことば タイル", content/listen/README.md "Derived tiles"): the
// one-clip bank items from もり up that make a fair tile (a US voice, 3-12 words, no digits), either said reduced and
// tagged so (音の へんしん's phrases aside) or picked here (PLAIN: ordinary speech, most of the game), less the RETIRED,
// become `tile`s in content/listen/s<n>-tile-bank.yaml at the level's stage (levelRank: levels 4-5 もり, 6 and up やま).
// It plays the item's clip (`clip`, with its speaker): no new audio, no `speaker` or `tts` of its own; its `en` is the
// item's as said (listen.ts asSaid: gonna, wanna, gotta, Why'd). Each run rewrites what the bank owns (clip, en, ja,
// scene, channel, tags; tiles unless a person merged some) and keeps what a person reviewed (decoys, marks, note, ctx,
// why); a new tile gets defaults from the tables below, marked `review: true` until someone writes its help. Silent.
//   node scripts/kikimimi-tiles.ts            write the files
//   node scripts/kikimimi-tiles.ts --check    exit 1 if a file would change
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { isDialogue, levelRank, type Item, type SoundMark, type Tags } from '../src/lib/kikimimi/bank.ts';
import { BANK } from '../src/lib/kikimimi/source.ts';
import { featureSkill, tagsOf } from '../src/lib/kikimimi/tags.ts';
import { TRIO, asSaid } from '../src/lib/kikimimi/listen.ts';
import clips from '../src/lib/kikimimi/clips.json' with { type: 'json' };

const DIR = join(import.meta.dirname, '../content/listen');

/** A tile's words: content.test's rule (`en` without its punctuation, case kept). */
const words = (s: string): string[] => s.replace(/[.,?!;:"“”—…]/g, ' ').split(/\s+/).filter(Boolean);
const has = (en: string, at: string) => new RegExp(`(^|[^A-Za-z'])${at.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![A-Za-z'])`, 'i').test(en);

/** Plain clips taken as tiles (ordinary speech at natural speed, one sound trap each, one order): most of a stage's
 *  sentences, so the reductions stay under the stage caps (listen.ts REDUCED_CAP). */
const PLAIN: ReadonlySet<string> = new Set([
  // もり
  'w4-cant-uk', 'w4-can-us', 'w4-id-ill', 'w4-youll-need', 'w4-better', 'ml-w-wont', 'ml-w-hadnt', 'ml-w-cant-au', 'ml-w-walk-through',
  'ml-r-drink', 'ml-r-residence-card', 'ml-r-four-hour', 'r4-room-ready', 'r4-come-up', 'r4-ginza', 'm4-see-what', 'mw-bring-anything', 'mw-owe-you',
  // やま
  'ya-r-care-less', 'ya-m-floats', 'ya-m-horses', 'ya-m-thanks-heaps', 'ya-m-steep', 'ya-m-pinch-salt', 'ya-m-pigs-fly', 'ya-m-accountant',
  'ya-m-yeah-nah', 'ya-n-years', 'ya-n-age', 'yb-get-noticed', 'yb-whos-owning', 'yb-table-it', 'yb-sign-today', 'ho-not-unlikely',
  'ho-hardly-begun', 'ho-tall-poppy', 'ho-lose-story', 'ho-make-sense', 'ho-few-economists', 'ho-theyd-pay', 'ho-remains-seen',
  'vy-m-on-paper', 'vy-m-assume-alive', 'hs-contraction-book-now', 'hs-contraction-rather-train', 'hs-contraction-see-gate'
]);
/** Bank items never taken again (their tiles retired: a word the clip swallows, a chain, a near-duplicate, off-register). */
const RETIRED: ReadonlySet<string> = new Set([
  'w4-didja', 'w4-dunno', 'ml-w-didncha', 'ml-w-musta', 'ml-w-whaddaya', 'ml-w-arentcha', 'mw-whaddaya', 'mw-youd-better', 'mw-ya-gonna',
  'mw-havent-got', 'vm-w-shoulda-surprise', 'vm-w-couldnta', 'ya-w-whaddaya', 'ya-w-ida', 'ya-w-sorta', 'ya-w-whatcha', 'ya-w-dontcha',
  'ya-w-couldja', 'ya-w-sposta', 'yb-might-as-well'
]);

/** What a Japanese ear plausibly hears instead of a tile (README "tile": weak forms, contractions, near sounds). */
const DECOY: Readonly<Record<string, string>> = {
  did: 'do', do: 'did', would: 'will', could: 'can', can: "can't", "can't": 'can', want: "won't", "won't": 'want',
  gonna: 'wanna', wanna: 'gonna', gotta: 'got', "should've": "shouldn't have", "would've": "wouldn't have", "could've": "couldn't have",
  "must've": 'must', must: 'much',
  "wouldn't": 'would', "shouldn't": 'should', "couldn't": 'could', "didn't": 'did', "aren't": 'are', "weren't": 'were', "haven't": 'have',
  "hasn't": 'has', "isn't": 'is', "don't": "won't", got: 'get', to: 'the', the: 'a', a: 'the', and: 'in', in: 'and', for: 'four', of: 'have',
  have: 'of', him: 'them', them: 'him', your: 'you', you: 'your', "i'd": "I'll", "i'll": "I'd", "we'll": 'we', "you'll": 'you',
  "they'll": 'they', "we're": 'were', "you're": 'you', "they're": 'they', "i've": 'I', "we've": 'we', "you've": 'you', "you'd": 'you',
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
    const n = words(it.en).length, tts = it.tts ?? it.en;
    const reduced = tts !== it.en && tagsOf(it).features.some((f) => featureSkill(f) === 'reduce');
    if (!isDialogue(it) && it.tags && it.voice === 'us' && it.lv >= 4 && !/\d/.test(it.en) && n >= 3 && n <= 12 && it.id in clips &&
      ((reduced && !it.hs) || PLAIN.has(it.id)) && !RETIRED.has(it.id)) out.push({ it, tts });
  }
  return out;
}

/** The marks over the tile's `en`: the bank's own that land (link, drop, stress: a `say` only glosses the trio), then
 *  the trio's gloss and the g the clip drops. */
function marksOf({ it: { marks }, tts }: Src, en: string): SoundMark[] {
  const found: SoundMark[] = (marks ?? []).filter((m) => m[0] !== 'say' && (m[0] === 'stress' ? m[1].split(' ').every((w) => has(en, w)) : has(en, m[1])));
  for (const [w, full] of TRIO) if (has(en, w)) found.push(['say', w, full]);
  for (const w of words(en)) if (found.length < 3 && /ing$/.test(w) && has(tts, `${w.slice(0, -1)}'`) && !found.some((m) => m[1] === w)) found.push(['drop', w, 'g']);
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

/** A default note (≤ 40 字): the trio's gloss, else the trap its first decoy sets. */
const noteOf = (marks: readonly SoundMark[], tiles: readonly string[], decoys: readonly string[]): string => {
  const say = marks.find((m) => m[0] === 'say') as readonly ['say', string, string] | undefined;
  const d = decoys[0], t = d && tiles.find((w) => DECOY[w.toLowerCase()]?.toLowerCase() === d.toLowerCase());
  return say ? `${say[1]}＝${say[2]}` : t ? `${t} と ${d} を聞き分ける` : '短く弱い音を聞きのがさない';
};

/** The stage file a level's tiles go to: もり (levels 4 and 5, the アナウンス pack) or やま (6 and up). */
const unitOf = (lv: number) => (levelRank(lv) >= 5 ? 's3-tile-bank' : 's2-tile-bank');
const HEADERS: Readonly<Record<string, { stage: number; cando: string; title: string }>> = {
  's2-tile-bank': { stage: 3, title: 'S2 もり', cando: "クイズで 聞いた 文を、ふつうの 速さの 音から ことばごとに 組み立てられる" },
  's3-tile-bank': { stage: 4, title: 'S3 やま', cando: "はやい 会話の 文を、つながった 音から ことばごとに 組み立てられる" }
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
    const en = asSaid(s.it.en, s.tts), old = kept.get(id);
    const tiles = (old?.tiles as string[] | undefined)?.join(' ') === words(en).join(' ') ? old!.tiles! : words(en);
    const marks = (old?.marks as SoundMark[] | undefined) ?? marksOf(s, en), decoys = old?.decoys ?? decoysOf(tiles, marks);
    const reviewed = !!(old?.why && old.ctx && !old.review);
    const tile: Tile = {
      clip: s.it.id, en, said: `${s.it.speaker}: ${s.tts}`, ja: s.it.ja.split('→')[0].trim(), tiles, marks,
      decoys, note: old?.note ?? noteOf(marks, tiles, decoys), ctx: old?.ctx, why: old?.why, review: !reviewed,
      ...(s.it.scene && { scene: s.it.scene }), ...(s.it.channel && { channel: s.it.channel }),
      // (the bank's features, else the tile's own as reviewed: a plain item may have none)
      tags: { ...s.it.tags, features: s.it.tags?.features?.length ? s.it.tags.features : (old?.tags?.features ?? []) } as Tags
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
