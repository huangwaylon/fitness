// ききみみ's units, the もり re-tag dry run (docs/curriculum-units.md §7, §8 step U1; the engineering review's
// "Migration"): drafts もり's unit manifests over the bank's existing items, from the content audit's classification
// (/tmp/audit/classified.json and items.json, docs/reviews/2026-11-06-content-coverage-audit.md: each item's domain,
// second domains and functions) when it's there, else from the items' own tags (the scenario seed's domain, the
// features). Each level-4 item goes to the unit it fits best (its seed, its domain, its functions, its features, the
// unit's words), at most one home; the rest stay level-only. For each unit: its items, a draft of its lessons, the
// candidate key phrases (recurring chunks across its items, with how often the bank says them and in how many voices)
// and the top-up it needs (new items, and phrase uses). The drafts go through units.ts checkUnits (not the can-do,
// which a person writes; wave 1's are read from docs/curriculum-units.md §12).
//   A dry run: it writes the report (docs/reviews/2026-11-06-mori-retag-dry-run.md) and, with --out <dir>, the draft
// manifests there (never app/content/units: a person edits them first). Silent: no sound.
//   node scripts/kikimimi-units-dry-run.ts [--out /tmp/kikimimi-units-draft]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse, stringify } from 'yaml';
import { isDialogue, type Item } from '../src/lib/kikimimi/bank.ts';
import { LADDERS } from '../src/lib/kikimimi/ladders.ts';
import { BANK } from '../src/lib/kikimimi/source.ts';
import { checkUnits, type UnitManifest } from '../src/lib/kikimimi/units.ts';

const AUDIT = '/tmp/audit';
const REPORT = join(import.meta.dirname, '../../docs/reviews/2026-11-06-mori-retag-dry-run.md');
/** The level whose items もり's units are cut from (level 4 「かわ・もり」: bank4, dialogues, もり's two sets). */
const LEVEL = 4;
/** A unit's size (curriculum review P1-5: about 24 short items), and the new items a re-tagged unit needs (plan §7). */
const TARGET = 24;
const TOP_UP_MIN = 10;
const TOP_UP_MAX = 15;
const MIN_SCORE = 3;

type Dom = UnitManifest['domain'];

/** The audit's 18 domains onto the plan's 9 (plan §1). */
const AUDIT_DOMAIN: Readonly<Record<string, Dom | null>> = {
  work: 'shigoto', 'travel & transport': 'tabi', 'friends & social': 'tomodachi', 'dating & family': 'tomodachi', health: 'karada', emergencies: 'karada',
  services: 'kaimono', 'money & banking': 'kaimono', 'shopping & returns': 'kaimono', 'food & restaurants': 'tabemono', 'daily life': 'ie', tech: 'ie',
  places: 'machi', 'hobbies & entertainment': 'machi', 'weather & seasons': 'machi', 'events & celebrations': 'ibento', 'news & media': null, academic: null, other: null
};

/** A seed's domain (curriculum §5.5's groups), for the fallback without the audit. */
const seedDomain = (seed: number | undefined): Dom | null =>
  seed === undefined ? null : seed <= 12 ? 'tabi' : seed <= 20 ? 'karada' : seed <= 29 ? 'kaimono' : seed <= 37 ? 'ie' : seed <= 47 ? 'shigoto' : seed <= 58 ? 'tomodachi' : null;

interface Plan {
  id: string;
  name: string;
  domain: Dom;
  also?: NonNullable<UnitManifest['also']>;
  host: string;
  scene: string;
  sound: string;
  seeds: number[];
  /** The audit's domains that count toward it. */
  doms?: string[];
  fns?: string[];
  features?: string[];
  words?: string[];
  /** Wave 1 (plan §9). */
  wave1?: boolean;
}

/** もり's 14 units (plan §7: もり 14): wave 1's three, and re-tags of the situations the level-4 items already cover.
 *  The heavy ones are split: meetings apart from client calls, refunds apart from phone support. That makes 8 domains
 *  of 9; まち is tr-guide's `also` for now. もり's glue anchors are かわ's wave-1 glue units (ききかえす, でんわを おえる),
 *  reused for review. The self-correction can-do (curriculum §3) is a sound feature across units, not a unit. */
const PLAN: Plan[] = [
  { id: 'tr-hotel', name: 'ホテルで こまった', domain: 'tabi', host: 'diana', scene: 'lobby', sound: 'contrast', seeds: [3], words: ['hotel', 'room', 'check in', 'checkout', 'suite', 'reception', 'lift', 'key card', 'towel'], wave1: true },
  { id: 'tr-guide', name: 'ともだちを あんない', domain: 'tabi', also: ['machi'], host: 'gulliver', scene: 'street', sound: 'assimilation', seeds: [58, 12], doms: ['places', 'hobbies & entertainment'], words: ['tokyo', 'shibuya', 'shinjuku', 'exit', 'ramen', 'temple', 'show you around', 'museum', 'neighbourhood'], wave1: true },
  { id: 'tr-train', name: 'でんしゃが とまった', domain: 'tabi', host: 'coco', scene: 'platform', sound: 'stress', seeds: [1, 2, 4, 5, 6, 8, 10, 11], words: ['train', 'platform', 'flight', 'gate', 'bus', 'taxi', 'luggage', 'delayed', 'boarding'] },
  { id: 'wk-chat', name: 'しごとの ざつだん', domain: 'shigoto', host: 'raymond', scene: 'office', sound: 'filler', seeds: [38], fns: ['small-talk openers/closers', 'greeting'], words: ['weekend', 'lunch', 'coffee', 'how was', 'grab'], wave1: true },
  { id: 'wk-meeting', name: 'かいぎに ついていく', domain: 'shigoto', host: 'marshal', scene: 'office', sound: 'intonation', seeds: [39, 40, 43, 44], doms: ['work'], words: ['meeting', 'deadline', 'on mute', 'agenda', 'update', 'stand-up'] },
  { id: 'wk-client', name: 'とりひきさきと はなす', domain: 'shigoto', host: 'julian', scene: 'office', sound: 'self-repair', seeds: [41, 42, 45, 46], words: ['client', 'interview', 'feedback', 'proposal', 'contract', 'budget', 'scope'] },
  { id: 'sh-refund', name: 'へんぴんする', domain: 'kaimono', host: 'tom-nook', scene: 'shop', sound: 'contrast', seeds: [24, 26], doms: ['shopping & returns'], words: ['refund', 'receipt', 'exchange', 'store credit', 'return'] },
  { id: 'sh-support', name: 'サポートに でんわ', domain: 'kaimono', host: 'julian', scene: 'living', sound: 'chain', seeds: [21, 22, 23, 25, 28, 29], doms: ['services', 'money & banking'], words: ['account', 'card', 'bank', 'support', 'engineer', 'installation', 'subscription'] },
  { id: 'fd-bill', name: 'みせで たべる', domain: 'tabemono', host: 'sherb', scene: 'cafe', sound: 'h-drop', seeds: [27, 50], doms: ['food & restaurants'], words: ['table', 'menu', 'bill', 'order', 'reservation', 'restaurant', 'dessert'] },
  { id: 'fr-invite', name: 'さそいを ことわる', domain: 'tomodachi', host: 'judy', scene: 'street', sound: 'intonation', seeds: [36, 48, 49, 56], fns: ['inviting', 'accepting/declining'], words: ['tonight', 'make it', 'come along', 'rain check', 'free on'] },
  { id: 'fr-vent', name: 'ともだちの ぐち', domain: 'tomodachi', host: 'whitney', scene: 'cafe', sound: 'dunno', seeds: [52, 53, 57], doms: ['friends & social', 'dating & family'] },
  { id: 'hm-landlord', name: 'へやの トラブル', domain: 'ie', host: 'harvey', scene: 'door', sound: 'kinda', seeds: [30, 31, 32, 33, 34, 35, 37], doms: ['daily life', 'tech'], words: ['landlord', 'leak', 'neighbour', 'plumber', 'parcel', 'rent', 'flat', 'wi-fi'] },
  { id: 'hl-clinic', name: 'びょういんで', domain: 'karada', host: 'pashmina', scene: 'pharmacy', sound: 'lemme', seeds: [13, 14, 15, 16, 17, 18, 20], doms: ['health', 'emergencies'], words: ['doctor', 'pharmacy', 'appointment', 'tablets', 'symptoms', 'prescription'] },
  { id: 'ev-party', name: 'パーティーで', domain: 'ibento', host: 'audie', scene: 'living', sound: 'chain', seeds: [54], doms: ['events & celebrations'], words: ['birthday', 'wedding', 'party', 'surprise', 'cake', 'anniversary', 'toast'] }
];

const PLAN_DOC = join(import.meta.dirname, '../../docs/curriculum-units.md');

/** A wave-1 unit as docs/curriculum-units.md §12 drafts it. */
export interface Wave1 {
  unit: string;
  name: string;
  stage: UnitManifest['stage'];
  domain: UnitManifest['domain'];
  also?: UnitManifest['also'];
  cando: UnitManifest['cando'];
}

/** Wave 1's can-dos: the YAML block of docs/curriculum-units.md §12, the one place they're written. */
export function wave1(doc = readFileSync(PLAN_DOC, 'utf8')): Wave1[] {
  const block = /^## 12\. [^\n]*\n[\s\S]*?```yaml\n([\s\S]*?)```/m.exec(doc);
  if (!block) throw new Error('kikimimi-units-dry-run: no YAML block under docs/curriculum-units.md §12');
  return parse(block[1]) as Wave1[];
}
const TODO_CANDO: UnitManifest['cando'] = { who: '（だれ）', does: '（なにを する）', cond: '（どんな じょうけんで）', catch: '（なにが）', en: 'I can follow TODO someone doing something, under some condition, and catch TODO.' };

// ---- the audit, or the items' own tags ---------------------------------------------------------------------------------

interface Class {
  dom: string | null;
  dom2: string[];
  fn: string[];
}

function classes(audit: string): { by: Map<string, Class>; source: string } {
  const file = join(audit, 'classified.json');
  if (existsSync(file)) {
    const rows = JSON.parse(readFileSync(file, 'utf8')) as { id: string; dom: string; dom2: string[]; fn: string[] }[];
    return { by: new Map(rows.map((r) => [r.id, { dom: r.dom, dom2: r.dom2 ?? [], fn: r.fn ?? [] }])), source: 'the audit (/tmp/audit/classified.json)' };
  }
  return { by: new Map(), source: "the items' own tags (no /tmp/audit: the seed's domain, the features)" };
}

const words = (s: string): string => ` ${s.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9' ,-]+/g, ' ').replace(/\s+/g, ' ').trim()} `;
const textOf = (it: Item): string => (isDialogue(it) ? it.lines.map((l) => l.en).join(' ') : it.en);
const voicesOf = (it: Item): string[] => (isDialogue(it) ? it.lines.map((l) => l.cast) : [it.cast ?? `${it.voice}:${it.speaker}`]);

/** How well an item fits a unit (0: not at all). */
function score(it: Item, p: Plan, c: Class | undefined): number {
  let s = 0;
  const seed = it.tags?.seed;
  if (seed !== undefined && p.seeds.includes(seed)) s += 3;
  const dom = c?.dom ?? null;
  if (dom && p.doms?.includes(dom)) s += 2;
  else if (c ? dom && AUDIT_DOMAIN[dom] === p.domain : seedDomain(seed) === p.domain) s += 1;
  if (c?.dom2.some((d) => p.doms?.includes(d) || AUDIT_DOMAIN[d] === p.domain)) s += 1;
  if (c?.fn.some((f) => p.fns?.includes(f))) s += 2;
  if (it.tags?.features?.some((f) => p.features?.includes(f))) s += 2;
  const t = words(textOf(it));
  s += Math.min(3, (p.words ?? []).filter((w) => t.includes(w.toLowerCase())).length);
  return s;
}

// ---- phrases -----------------------------------------------------------------------------------------------------------

const STOP = new Set(('a an the and or but so to of in on at for with by from is are was were be been am i you he she it we they me him her us them my your his its our their this that these those there here ' +
  "do does did have has had not no yes oh okay ok just it's i'm you're that's don't can will would could should what when where who how if then than as up out about all").split(' '));

/** Words a chunk doesn't start or end on (a chunk is "in a minute", never "a minute" or "for a small"). */
const EDGE = new Set('a an the to of in on at for with by from my your his her our their and or but'.split(' '));

/** Recurring chunks across a unit's items: 2-4 words, not all function words, not starting or ending on an article or
 *  a preposition, in ≥ 2 items; longest first among equals. */
function candidates(items: readonly Item[]): { en: string; items: string[] }[] {
  const seen = new Map<string, Set<string>>();
  for (const it of items) {
    const toks = words(textOf(it)).replace(/[,]/g, ' ').trim().split(/\s+/).filter((w) => w && !/\d/.test(w));
    for (let n = 2; n <= 4; n++)
      for (let i = 0; i + n <= toks.length; i++) {
        const g = toks.slice(i, i + n);
        if (g.every((w) => STOP.has(w)) || EDGE.has(g[0]) || EDGE.has(g[n - 1])) continue;
        const k = g.join(' ');
        (seen.get(k) ?? seen.set(k, new Set()).get(k)!).add(it.id);
      }
  }
  const all = [...seen].filter(([, s]) => s.size >= 2).map(([en, s]) => ({ en, items: [...s] }));
  all.sort((a, b) => b.items.length - a.items.length || b.en.split(' ').length - a.en.split(' ').length || (a.en < b.en ? -1 : 1));
  const out: { en: string; items: string[] }[] = [];
  for (const c of all) {
    if (out.some((o) => ` ${o.en} `.includes(` ${c.en} `) && o.items.length >= c.items.length)) continue;
    out.push(c);
    if (out.length >= 8) break;
  }
  return out;
}

/** Where the bank says a phrase: items and voices. */
function heardIn(en: string): { items: number; voices: number } {
  const hits = BANK.filter((it) => words(textOf(it)).replace(/[,]/g, ' ').includes(` ${en} `));
  return { items: hits.length, voices: new Set(hits.flatMap(voicesOf)).size };
}

// ---- the lessons' draft ----------------------------------------------------------------------------------------------

/** であい: a dialogue first and 5 more; チェック: 6 held out (the last, ≥ 2 voices where the items allow); ばめん: the
 *  rest, topped up from であい to 6. */
function lessons(items: readonly Item[]): { deai: string[]; bamen: string[]; check: string[] } {
  const dialogues = items.filter((it) => isDialogue(it)), singles = items.filter((it) => !isDialogue(it));
  const order = [...dialogues.slice(0, 1), ...singles, ...dialogues.slice(1)];
  const check = order.slice(-6), rest = order.slice(0, Math.max(0, order.length - 6));
  const deai = rest.slice(0, 6), bamen = rest.slice(6);
  for (const it of deai) if (bamen.length < 6 && !bamen.includes(it)) bamen.push(it);
  return { deai: deai.map((it) => it.id), bamen: bamen.map((it) => it.id), check: check.map((it) => it.id) };
}

// ---- the run -----------------------------------------------------------------------------------------------------------

/** The report (markdown), and with `out` the drafts written there; `audit` the audit's folder (missing: the items' tags). */
export function run(out?: string, audit = AUDIT): string {
  const { by, source } = classes(audit);
  const candos = new Map(wave1().map((w) => [w.unit, w.cando]));
  const pool = BANK.filter((it) => it.lv === LEVEL);
  const home = new Map<string, Plan>(), unassigned: Item[] = [];
  for (const it of pool) {
    const scored = PLAN.map((p) => ({ p, s: score(it, p, by.get(it.id)) })).sort((a, b) => b.s - a.s);
    if (scored[0].s >= MIN_SCORE) home.set(it.id, scored[0].p);
    else unassigned.push(it);
  }
  const rows: string[] = [], sections: string[] = [], manifests: UnitManifest[] = [];
  let topUps = 0;
  for (const p of PLAN) {
    const items = pool.filter((it) => home.get(it.id) === p);
    const cands = candidates(items).map((c) => ({ ...c, bank: heardIn(c.en) }));
    const ph = cands.slice(0, 8);
    const phraseTopUp = ph.reduce((n, c) => n + Math.max(0, 3 - c.bank.items) + (c.bank.voices < 2 ? 1 : 0), 0);
    const topUp = Math.min(TOP_UP_MAX, Math.max(TOP_UP_MIN, TARGET - items.length));
    const ls = lessons(items);
    topUps += topUp;
    const m: UnitManifest = {
      schema: 1, unit: p.id, name: p.name, stage: 'mori', domain: p.domain, ...(p.also && { also: p.also }), host: p.host, scene: p.scene, sound: p.sound,
      cando: candos.get(p.id) ?? TODO_CANDO, status: 'draft',
      ph: ph.map((c, i) => ({ id: `ph-${p.id.slice(3)}-${i + 1}`, en: c.en, register: 'friend' as const, scene: p.scene, trap: '（わな）' })),
      lessons: { v: 1, ...ls }
    };
    manifests.push(m);
    const dialogues = items.filter((it) => isDialogue(it)).length;
    rows.push(`| ${p.id} | ${p.name} | ${p.domain}${p.also ? ` (+${p.also.join(', ')})` : ''} | ${p.wave1 ? '1' : ''} | ${items.length} (${dialogues}) | ${ph.length} | ${phraseTopUp} | ${topUp} |`);
    const list = items.map((it) => `  - \`${it.id}\` ${it.type}, ${it.speaker}: ${(isDialogue(it) ? it.lines[0].en + ' …' : it.en).replace(/\|/g, '/').slice(0, 90)}`);
    const phraseRows = ph.map((c) => `  - "${c.en}": ${c.items.length} items here; the bank ${c.bank.items} items, ${c.bank.voices} voices${c.bank.items < 3 || c.bank.voices < 2 ? ' (needs top-up)' : ''}`);
    sections.push([
      `### ${p.id} 「${p.name}」 (${p.domain}${p.wave1 ? ', wave 1' : ''})`,
      '',
      `- **Seeds:** ${p.seeds.join(', ') || 'none (by function and feature)'}; host ${p.host}; scene ${p.scene}; sound ${p.sound}.`,
      `- **Items (${items.length}, ${dialogues} dialogues):**`,
      ...(list.length ? list : ['  - none: a new unit']),
      `- **Candidate phrases** (recurring chunks; a person picks 6-10 and writes their register and trap):`,
      ...(phraseRows.length ? phraseRows : ['  - none recur: all to write']),
      `- **Top-up:** ${topUp} new items (to about ${TARGET}, at least ${TOP_UP_MIN}), and ${phraseTopUp} phrase uses to reach 3 items by 2 voices for the candidates.`,
      `- **Lessons, drafted:** であい ${ls.deai.length}, ばめん ${ls.bamen.length}, チェック ${ls.check.length}${items.length < 12 ? " (too few items to hold 6 out: the top-up first)" : items.length > TARGET + 6 ? `; over ${TARGET + 6} items: split it, or leave the weakest fits level-only` : ""}.`,
      ''
    ].join('\n'));
  }
  const check = checkUnits(manifests, BANK, LADDERS);
  const byUnit = (id: string, xs: string[]) => xs.filter((x) => x.startsWith(`${id}:`)).length;
  const notes = PLAN.map((p) => `| ${p.id} | ${byUnit(p.id, check.errors)} | ${byUnit(p.id, check.warnings)} |`);
  const assigned = pool.length - unassigned.length;
  const cov = check.coverage.get('mori')!;
  const report = [
    '# もり re-tag: dry run (2026-11-06)',
    '',
    'Generated by `node app/scripts/kikimimi-units-dry-run.ts` (docs/curriculum-units.md §7, §8 U1, §11). It drafts もり\'s 14 unit manifests over the level-4 items. Nothing is committed under app/content/units: a person edits the drafts first (can-dos, phrases with register and trap, lesson order), then the top-up is written.',
    '',
    `- **Classification:** ${source}. An item goes to the unit it fits best: its seed +3, its domain +2 (the unit's own) or +1 (the unit's tag), a second domain +1, a function +2, a feature +2, the unit's words up to +3. It needs at least ${MIN_SCORE}. Each item has one home.`,
    `- **Pool:** level ${LEVEL}'s ${pool.length} items (bank4, dialogues, もり's two sets). **${assigned} assigned, ${unassigned.length} stay level-only.** The YAML drafts (tile, call, たちぎき) aren't in the bank yet and aren't used.`,
    `- **Coverage:** ${Object.keys(cov.domains).length} of 9 domains, no glue unit of its own (もり reuses かわ's ききかえす and でんわを おえる). まち is tr-guide's \`also\` only, so a new まち unit would make 9. The biggest domain is ${Object.entries(cov.domains).sort((a, b) => b[1]! - a[1]!)[0].join(' with ')} of ${cov.units} units (the cap is 25 %).`,
    `- **Top-up in all:** ${topUps} new items for the 14 units.`,
    '',
    '| unit | name | domain | wave | items (dialogues) | phrases | phrase top-up | item top-up |',
    '|---|---|---|---|---|---|---|---|',
    ...rows,
    '',
    '## The checker on the drafts (units.ts checkUnits; can-dos aside)',
    '',
    'The drafts are all `draft`, so the phrase and coverage rules only warn. The errors (listed below) are the recipe\'s: a unit with no dialogue for であい, or a チェック in one voice. Each is a unit with too few items, so the top-up comes first.',
    '',
    '| unit | errors | warnings |',
    '|---|---|---|',
    ...notes,
    '',
    ...(check.errors.length ? ['Errors:', '', ...check.errors.map((e) => `- ${e}`), ''] : []),
    '## Each unit',
    '',
    ...sections,
    `## Level-only (${unassigned.length})`,
    '',
    'These stay in the level quiz, ひとこと クイズ and the other quick modes (plan §7). A person may still move some into units by hand.',
    '',
    ...unassigned.map((it) => `- \`${it.id}\` (${it.type}, seed ${it.tags?.seed ?? '-'}, ${by.get(it.id)?.dom ?? seedDomain(it.tags?.seed) ?? '-'}): ${(isDialogue(it) ? it.lines[0].en + ' …' : it.en).replace(/\|/g, '/').slice(0, 80)}`),
    ''
  ].join('\n');
  if (out) {
    mkdirSync(out, { recursive: true });
    for (const m of manifests) writeFileSync(join(out, `${m.unit}.yaml`), `# A draft from scripts/kikimimi-units-dry-run.ts: edit before it goes to app/content/units.\n${stringify(m)}`);
  }
  return report;
}

if (import.meta.main) {
  const i = process.argv.indexOf('--out');
  writeFileSync(REPORT, run(i > 0 ? process.argv[i + 1] : undefined));
  console.log(`wrote ${REPORT}`);
}
