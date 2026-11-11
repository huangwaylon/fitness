// The docs' pointers resolve (verify's `docs` step; README.md "Docs" is the index):
//   - in README.md and docs/**.md, every relative link's file exists and its #anchor is a heading or an <a id>;
//   - every backticked repo path there (`app/src/lib/x.ts`, `lib/x.ts`, `e2e/y.ts` …) exists under one of ROOTS;
//   - in the code (and the docs' own prose), every `docs/<name>.md` named exists, and its #anchor, "Heading" or
//     §N / §Name is in it; so does a doc's `[x](y.md) "Heading"` and bare `y.md "Heading"`, and a `design/….md` named;
//   - every doc keeps to its size budget (BUDGET_KB; README + docs/ together TOTAL_KB): a doc grows only on purpose.
//   It also warns (never fails) on what bloats a doc: a date or "the user" (history is git's, a rule needs neither) and
//   a line over LONG characters. Every tracked .md is checked (README.md, docs/, app/content, app/design, app/scripts).
//   node scripts/docs-check.ts   (from app/; prints each broken pointer and warning, exits 1 if anything is broken)
import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

/** GitHub's heading anchor: lower case, formatting and punctuation dropped, spaces to dashes. */
export function slug(text: string): string {
  return plain(text).toLowerCase().replace(/[^\p{L}\p{N}\p{M} _-]/gu, '').replace(/ /g, '-');
}

function plain(text: string): string {
  return text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[`*]/g, '').replace(/<[^>]+>/g, '').trim();
}

/** A doc's headings (text) and anchors (their slugs, -1/-2 for repeats, and every <a id>/<a name>). */
export function outline(md: string): { headings: string[]; anchors: Set<string>; labels: string[] } {
  const headings: string[] = [];
  const anchors = new Set<string>();
  const seen = new Map<string, number>();
  let fence = false;
  for (const line of md.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence;
    if (fence) continue;
    const h = /^#{1,6}\s+(.*?)\s*#*\s*$/.exec(line);
    if (h) {
      headings.push(plain(h[1]));
      const s = slug(h[1]);
      const n = seen.get(s) ?? 0;
      seen.set(s, n + 1);
      anchors.add(n ? `${s}-${n}` : s);
    }
    for (const a of line.matchAll(/<a\s+(?:id|name)="([^"]+)"/g)) anchors.add(a[1]);
  }
  // bold run-in labels (`**Mic modes.** …`), which the code cites by name too
  const labels = [...md.matchAll(/\*\*([^*\n]{2,80})\*\*/g)].map((m) => plain(m[1]));
  return { headings, anchors, labels };
}

const norm = (s: string) => s.toLowerCase().replace(/[“”"'’`*]/g, '').replace(/\s+/g, ' ').replace(/[.:,;]+$/, '').trim();

/** Does a cited name ("The guest", "Weather: rain", §Trips, §2.4) name a heading or a bold label of the doc? */
export function names(md: string, cited: string): boolean {
  const o = outline(md);
  const c = norm(cited).replace(/^(\d+(\.\d+)*)-[\d.]+$/, '$1'); // §2.1-2.3: §2.1
  if (!c) return true;
  if (/^\d+(\.\d+)*[a-z]?$/.test(c)) {
    // §2.4: a numbered heading ("## 2.4 Scoring", "### §2.4", "## 2. Goals")
    return o.headings.some((h) => new RegExp(`^(§\\s?)?${c.replace(/\./g, '\\.')}(\\.|\\s|$|[):])`).test(norm(h)));
  }
  const hit = (t: string) => {
    const n = norm(t).replace(/^(§\s?)?\d+(\.\d+)*[a-z]?\.?\s+/, '');
    // a whole-word prefix of it ("The guest" of "The guest player"), or it then a subsection ("World: lights")
    const pre = (a: string) => a === c || (a.startsWith(c) && /^[\s:,(—–-]/.test(a.slice(c.length))) || c.startsWith(`${a}:`);
    return pre(n) || pre(norm(t));
  };
  return o.headings.some(hit) || o.labels.some(hit) || o.anchors.has(slug(cited));
}

/** Where a backticked path may live: the repo, app/, its src/lib, relay/ and so on. */
const ROOTS = ['', 'app', 'app/src', 'app/src/lib', 'app/src/lib/components', 'app/src/routes', 'app/static', 'relay', 'relay/src', 'food-data', 'docs'];

/** A backticked token that reads as a repo path (has a slash and a file extension or a trailing slash, no placeholders). */
export function isPath(tok: string): boolean {
  if (/[<>*{}$…|~ ]|\.\.\.|^\/|^_app\/|^https?:|^[a-z]+:\/\/|^@|^-/.test(tok)) return false;
  if (!/^[\w.@[\]()+-]+(\/[\w.@[\]()+-]+)+\/?$/.test(tok)) return false;
  return /\/$/.test(tok) || /\.(ts|js|mjs|svelte|md|json|ya?ml|py|css|html|toml|wav|mp3|m4a|glb|png|webp|svg|txt|csv|sh)$/.test(tok);
}

export type Problem = { file: string; line: number; msg: string };

/** The broken links and paths in one doc. `exists(repoPath)`, `read(repoPath)` see the repo; a leading `*` + `/a/b.ts` asks
 *  whether some tracked file or directory ends in /a/b.ts (a doc may name a file from its own folder: `hub/Week.svelte`);
 *  `ignored(path)`, whether git ignores it (a doc may name a gitignored folder). */
export function checkDoc(file: string, md: string, exists: (p: string) => boolean, read: (p: string) => string | null, ignored = (_p: string) => false): Problem[] {
  const out: Problem[] = [];
  const dir = dirname(file);
  let fence = false;
  md.split('\n').forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence;
    if (fence) return;
    const at = (msg: string) => out.push({ file, line: i + 1, msg });
    const text = line.replace(/`[^`]*`/g, (m) => (m.includes('](') ? m : '``'));
    for (const m of text.matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
      const href = m[1];
      if (/^[a-z]+:/i.test(href)) continue;
      const [p, anchor] = href.split('#') as [string, string | undefined];
      const target = p ? join(dir, decodeURIComponent(p)) : file;
      if (p && !exists(target)) { at(`link to ${href}: no ${target}`); continue; }
      if (anchor && target.endsWith('.md')) {
        const body = read(target);
        if (body !== null && !outline(body).anchors.has(decodeURIComponent(anchor))) at(`link to ${href}: no #${anchor} in ${target}`);
      }
    }
    checkHeadings(file, text, at, exists, read);
    for (const m of line.matchAll(/`([^`\n]+)`/g)) {
      const tok = m[1].replace(/^\.\//, '').replace(/:\d+(-\d+)?$/, '').replace(/[#?].*$/, '');
      if (!isPath(tok)) continue;
      const clean = tok.replace(/\/$/, '');
      if (!ROOTS.some((r) => exists(r ? `${r}/${clean}` : clean)) && !exists(join(dir, clean)) && !exists(`*/${clean}`) && !ROOTS.some((r) => ignored(r ? `${r}/${clean}` : clean))) at(`path \`${tok}\` not found`);
    }
  });
  return out;
}

/** The headings a doc's prose names after a link or a bare file name: `[x](y.md) "Heading"`, `y.md "Heading"`. */
function checkHeadings(file: string, line: string, at: (msg: string) => void, exists: (p: string) => boolean, read: (p: string) => string | null): void {
  const dir = dirname(file);
  const cite = (name: string, heading: string) => {
    const target = join(dir, name), body = exists(target) ? read(target) : null;
    if (body !== null && !names(body, heading)) at(`${name} "${heading}": no such heading in ${target}`);
  };
  for (const m of line.matchAll(/\]\(([^)\s#:]+\.md)\)\s*["“]([^"”\n]+)["”]/g)) cite(decodeURIComponent(m[1]), m[2]);
  for (const m of line.matchAll(/(?<![\w/.\-\[(])([\w-]+\.md)\s+["“]([^"”\n]+)["”]/g)) cite(m[1], m[2]);
}

/** Per doc, the most it may weigh (KB of UTF-8); a doc not named gets DEFAULT_KB. README.md + docs/ together: TOTAL_KB. */
const BUDGET_KB: Record<string, number> = { 'docs/design.md': 100 };
const DEFAULT_KB = 45, TOTAL_KB = 500;
/** A line longer than this (characters) is a warning: wrap prose at ~120. */
export const LONG = 400;

/** What bloats a doc (warnings, never a failure): a date or "the user" outside a fence (history belongs in git, a rule
 *  needs neither), a line over LONG characters. */
export function lint(file: string, md: string): Problem[] {
  const out: Problem[] = [];
  let fence = false;
  md.split('\n').forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence;
    if (fence) return;
    const at = (msg: string) => out.push({ file, line: i + 1, msg });
    const date = /\b20\d\d-\d\d-\d\d\b/.exec(line.replace(/`[^`]*`/g, ''));
    if (date) at(`a date (${date[0]}): history belongs in git`);
    if (/\bthe user\b/i.test(line)) at('"the user": say the rule, not who asked');
    const n = [...line].length;
    if (n > LONG) at(`a line of ${n} characters (wrap at ~120)`);
  });
  return out;
}

/** The broken doc pointers in one code file: `docs/<name>.md`, with its #anchor, "Heading" or §Section. */
export function checkCode(file: string, src: string, read: (p: string) => string | null): Problem[] {
  const out: Problem[] = [];
  const lines = src.split('\n');
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/(?<![\w/.-])docs\/([\w./-]+?\.md)(?:#([\w\p{L}\p{N}-]+)|\s*(?:"([^"\n]+)"|“([^”\n]+)”|§\s?([\w.-]*\w)))?/gu)) {
      const path = `docs/${m[1]}`;
      const at = (msg: string) => out.push({ file, line: i + 1, msg });
      const body = read(path);
      if (body === null) { at(`${path}: no such doc`); continue; }
      if (m[2] && !outline(body).anchors.has(m[2])) at(`${path}#${m[2]}: no such anchor`);
      // (a pointer at a line's end, its heading wrapped onto the next, past the comment's `//` or `*`)
      const wrapped = !m[2] && !m[3] && !m[4] && !m[5] && /^[\s,;:]*$/.test(line.slice(m.index + m[0].length))
        ? (lines[i + 1] ?? '').replace(/^\s*(?:\/\/|\*|#|<!--)?\s*/, '').match(/^(?:"([^"\n]+)"|“([^”\n]+)”|§\s?([\w.-]*\w))/u)
        : null;
      const name = m[3] ?? m[4] ?? m[5] ?? wrapped?.[1] ?? wrapped?.[2] ?? wrapped?.[3];
      if (name && !names(body, name)) at(`${path} ${m[5] ?? wrapped?.[3] ? '§' : ''}"${name}": no such heading`);
    }
    // a design note named by path (app/design/…: the avatar's were folded into docs/players.md)
    if (!file.endsWith('.md')) for (const m of line.matchAll(/(?<![\w/.-])(?:app\/)?(design\/[\w./-]+?\.md)\b/g)) {
      if (read(`app/${m[1]}`) === null) out.push({ file, line: i + 1, msg: `app/${m[1]}: no such note` });
    }
  });
  return out;
}

function walk(dir: string, keep: (p: string) => boolean, acc: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    if (n === 'node_modules' || n.startsWith('.') || n === 'build' || n === 'build-pages' || n === 'static') continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, keep, acc);
    else if (keep(p)) acc.push(p);
  }
  return acc;
}

if (import.meta.filename === realpathSync(process.argv[1])) {
  const repo = resolve('..');
  const rel = (p: string) => relative(repo, p);
  const tracked = spawnSync('git', ['ls-files'], { cwd: repo, encoding: 'utf8' }).stdout.split('\n');
  const tails = new Set<string>();
  for (const f of tracked) {
    const parts = f.split('/');
    for (let i = 1; i < parts.length; i++) for (let j = i + 1; j <= parts.length; j++) tails.add(parts.slice(i, j).join('/'));
  }
  // a gitignored path (`food-data/raw/`) is fine: asked only of what's found nowhere else
  const ignored = (p: string) => [p, `${p}/`].some((q) => spawnSync('git', ['check-ignore', '-q', q], { cwd: repo }).status === 0);
  // (a tracked file or folder counts though not checked out: docs.yml's sparse checkout leaves out app/static)
  const paths = new Set<string>();
  for (const f of tracked) {
    const parts = f.split('/');
    for (let i = 1; i <= parts.length; i++) paths.add(parts.slice(0, i).join('/'));
  }
  const exists = (p: string) => (p.startsWith('*/') ? tails.has(p.slice(2)) : existsSync(join(repo, p)) || paths.has(p.replace(/\/+$/, '')));
  const cache = new Map<string, string | null>();
  const read = (p: string) => {
    if (!cache.has(p)) cache.set(p, existsSync(join(repo, p)) && statSync(join(repo, p)).isFile() ? readFileSync(join(repo, p), 'utf8') : null);
    return cache.get(p)!;
  };
  const docs = tracked.filter((f) => f.endsWith('.md') && existsSync(join(repo, f)));
  const src = /\.(ts|js|svelte|py|ya?ml|css|html)$/;
  const code = ['app/src', 'app/scripts', 'app/e2e', 'app/content', 'relay/src', 'relay/scripts', 'relay/test', 'food-data/scripts', '.github']
    .filter(exists)
    .flatMap((d) => walk(join(repo, d), (p) => src.test(p) && !p.endsWith('docs-check.test.ts')).map(rel)) // (its fixtures)
    .concat(readdirSync(join(repo, 'app')).filter((n) => src.test(n)).map((n) => `app/${n}`));
  const problems = [...docs.flatMap((f) => [...checkDoc(f, read(f)!, exists, read, ignored), ...checkCode(f, read(f)!, read)]), ...code.flatMap((f) => checkCode(f, read(f)!, read))];
  // the budgets
  const kb = (f: string) => Buffer.byteLength(read(f)!, 'utf8') / 1024;
  for (const f of docs) {
    const max = BUDGET_KB[f] ?? DEFAULT_KB;
    if (kb(f) > max) problems.push({ file: f, line: 1, msg: `${kb(f).toFixed(1)} KB, over its ${max} KB budget (BUDGET_KB): cut, don't raise` });
  }
  const total = docs.filter((f) => f === 'README.md' || f.startsWith('docs/')).reduce((s, f) => s + kb(f), 0);
  if (total > TOTAL_KB) problems.push({ file: 'docs/', line: 1, msg: `README + docs/ ${total.toFixed(0)} KB, over TOTAL_KB ${TOTAL_KB}` });
  const warnings = docs.flatMap((f) => lint(f, read(f)!));
  for (const p of warnings) console.log(`${p.file}:${p.line}  warn: ${p.msg}`);
  for (const p of problems) console.log(`${p.file}:${p.line}  ${p.msg}`);
  const sum = `${docs.length} docs, ${code.length} code files, README + docs/ ${total.toFixed(0)} KB; ${warnings.length} warnings`;
  console.log(problems.length ? `docs-check: ${problems.length} broken (${sum})` : `docs-check: ok (${sum})`);
  process.exit(problems.length ? 1 : 0);
}
