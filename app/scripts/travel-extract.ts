// One-off: the りょこう trip data (docs/travel.md "Content") from the old travel-plans site. Reads its index.html (the
// source of truth there: every day card, logistics card, campsite and packing row, with the other language in
// data-en / data-ja), its map tables (.map/build.py, .map/nz.py: the stops' times and coordinates, Okinawa's camp /
// nature / food candidates) and the OSRM legs (.map/legs.json, .map/nz_legs.json, gitignored there), and writes
//   src/lib/travel/trips/{okinawa,seattle,nz}.ts   (all the content; committed, then edited by hand from here on)
//   static/travel/<trip>/…webp                       (the photos, re-encoded: WebP ≤ 720 px wide)
//   ~/Documents/island-backups/trip-notes.json       (mode 600: the private values, never the repo)
//   ~/Documents/island-backups/trip-notes.load.json  (mode 600: the same as trip_note rows for relay/scripts/record.ts load)
// The private values (booking references, ticket and itinerary numbers, the travellers' names, the Evertrail
// onboarding URL) are found by their context, never written here, and replaced by {p:key} tokens; the script prints
// only their keys. It was run once (2026-11-06); the trip modules are the source now, so don't run it again over
// edits made to them.
// Usage (from app/): node scripts/travel-extract.ts [--src ~/Documents/other/travel-plans] [--no-photos]
import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import type { Camp, Card, Chip, Day, DayRow, Hike, L, Leg, Link, PackCat, Photo, Place, Row, Section, Stat, Trip, TripId } from '../src/lib/travel/types.ts';

const APP = join(import.meta.dirname, '..');
const argAt = process.argv.indexOf('--src');
const SRC = argAt > 0 ? process.argv[argAt + 1] : join(homedir(), 'Documents', 'other', 'travel-plans');
const PHOTOS = !process.argv.includes('--no-photos');
const BACKUPS = join(homedir(), 'Documents', 'island-backups');

// ---- a small HTML tree (the source is regular, hand-written markup) ---------------------------------------------------

interface El { tag: string; attrs: Record<string, string>; kids: Node[]; parent?: El }
type Node = El | string;
const VOID = new Set(['img', 'input', 'br', 'meta', 'link', 'hr', 'source']);
const ENT: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", deg: '°', harr: '↔', rarr: '→', larr: '←', ldquo: '“', rdquo: '”',
  lsquo: '‘', rsquo: '’', mdash: '—', ndash: '–', middot: '·', yen: '¥', times: '×', nbsp: '\u00a0'
};
function decode(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    const v = ENT[e];
    if (v === undefined) throw new Error(`unknown entity ${m}`);
    return v;
  });
}
function parseAttrs(s: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of s.matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) out[m[1]] = decode(m[2] ?? m[3] ?? m[4] ?? '');
  return out;
}
function parse(html: string): El {
  const root: El = { tag: '#root', attrs: {}, kids: [] };
  let cur = root;
  let at = 0;
  for (const m of html.matchAll(/<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w-]*)((?:\s+[\w:-]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>/g)) {
    if (m.index > at) cur.kids.push(html.slice(at, m.index));
    at = m.index + m[0].length;
    if (m[0].startsWith('<!--')) continue;
    const tag = m[2].toLowerCase();
    if (m[1]) {
      let e: El | undefined = cur;
      while (e && e.tag !== tag) e = e.parent;
      if (!e?.parent) throw new Error(`stray </${tag}>`);
      cur = e.parent;
      continue;
    }
    const el: El = { tag, attrs: parseAttrs(m[3]), kids: [], parent: cur };
    cur.kids.push(el);
    if (!m[4] && !VOID.has(tag)) cur = el;
  }
  if (at < html.length) cur.kids.push(html.slice(at));
  return root;
}
const isEl = (n: Node): n is El => typeof n !== 'string';
const has = (e: El, c: string) => (e.attrs.class ?? '').split(/\s+/).includes(c);
const els = (e: El) => e.kids.filter(isEl);
function all(e: El, pred: (x: El) => boolean, out: El[] = []): El[] {
  for (const k of els(e)) {
    if (pred(k)) out.push(k);
    all(k, pred, out);
  }
  return out;
}
function one(e: El, pred: (x: El) => boolean, what: string): El {
  const r = all(e, pred);
  if (r.length !== 1) throw new Error(`${what}: ${r.length} found`);
  return r[0];
}
const first = (e: El, pred: (x: El) => boolean): El | undefined => all(e, pred)[0];
const byClass = (c: string) => (x: El) => has(x, c);
const iconOf = (e: El): string => {
  const u = first(e, (x) => x.tag === 'use');
  return (u?.attrs.href ?? '').replace(/^#i-/, '');
};

// ---- text: markup → a string with tokens ------------------------------------------------------------------------------

const CJK = /[\u3000-\u30ff\u3400-\u9fff\uff00-\uffef]/;
/** Collapse the source's line-wrapped whitespace: a wrap next to Japanese goes (but beside a dash or a dot, which
 *  the source spaces), any other run is one space. */
function tidy(s: string): string {
  return s
    .replace(/\s*\n\s*/g, (m, i: number, all: string) => {
      const a = all[i - 1] ?? '', b = all[i + m.length] ?? '';
      return /[—–·→↔×]/.test(a + b) || !(CJK.test(a) || CJK.test(b)) ? ' ' : '';
    })
    .replace(/[ \t\u00a0]+/g, ' ')
    .trim();
}
function measure(e: El): string {
  const v = e.attrs['data-metric'];
  const m = /^([\d,.]+) (km|m|°C)$/.exec(v ?? '');
  if (!m) throw new Error(`span.u: ${v}`);
  const n = Number(m[1].replace(/,/g, ''));
  return `{${m[2] === '°C' ? 'c' : m[2]}:${n}}`;
}
function text(nodes: Node[]): string {
  let s = '';
  for (const n of nodes) {
    if (!isEl(n)) s += decode(n);
    else if (n.tag === 'span' && has(n, 'u')) s += measure(n);
    else if (n.tag === 'svg') s += ''; // an inline icon (Seattle's sunset glyph): the text reads the same without it
    else if (n.tag === 'small') throw new Error('a <small> where the text is not split');
    else if (n.tag === 'span' && has(n, 'sr')) s += '';
    else s += text(n.kids);
  }
  return s;
}
/** The nodes before the first <small> and that small's nodes. */
function splitSmall(nodes: Node[]): [Node[], Node[] | null] {
  const i = nodes.findIndex((n) => isEl(n) && n.tag === 'small');
  if (i < 0) return [nodes, null];
  if (nodes.slice(i + 1).some((n) => isEl(n) || n.trim())) throw new Error('text after a <small>');
  return [nodes.slice(0, i), (nodes[i] as El).kids];
}

let LANG: 'ja' | 'en' = 'ja';
/** An element's two sides: the markup's and its data-en / data-ja (or the guide's language only). */
function sides(e: El): { ja?: Node[]; en?: Node[] } {
  if (e.attrs['data-en'] !== undefined) return { ja: e.kids, en: parse(e.attrs['data-en']).kids };
  if (e.attrs['data-ja'] !== undefined) return { en: e.kids, ja: parse(e.attrs['data-ja']).kids };
  return { [LANG]: e.kids };
}
function pair(f: (n: Node[]) => string, s: { ja?: Node[]; en?: Node[] }): L {
  const out: L = {};
  for (const k of ['ja', 'en'] as const) {
    const n = s[k];
    if (!n) continue;
    const t = tidy(f(n));
    if (t) out[k] = t;
  }
  return out;
}
const lOf = (e: El): L => pair(text, sides(e));
/** A line and its small print. */
function lineOf(e: El): { text: L; note?: L } {
  const s = sides(e);
  const t = pair((n) => text(splitSmall(n)[0]), s);
  const note = pair((n) => {
    const sm = splitSmall(n)[1];
    return sm ? text(sm) : '';
  }, s);
  return { text: t, ...(Object.keys(note).length ? { note } : {}) };
}
const emptyL = (l: L) => !l.ja && !l.en;

// ---- photos ----------------------------------------------------------------------------------------------------------

const photoSizes = new Map<string, { w: number; h: number; bytes: number }>();
function size(file: string): { w: number; h: number } {
  const out = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', file], { encoding: 'utf8' });
  return { w: Number(/pixelWidth: (\d+)/.exec(out)?.[1]), h: Number(/pixelHeight: (\d+)/.exec(out)?.[1]) };
}
/** images/<path> → travel/<trip>/<name>.webp, re-encoded once. */
function photo(trip: TripId, srcRel: string, name: string, alt?: L, caption?: L): Photo {
  const rel = `travel/${trip}/${name}.webp`;
  const out = join(APP, 'static', rel);
  if (!photoSizes.has(rel)) {
    const inFile = join(SRC, srcRel);
    if (PHOTOS || !existsSync(out)) {
      mkdirSync(dirname(out), { recursive: true });
      const { w } = size(inFile);
      execFileSync('cwebp', ['-quiet', '-q', '80', '-m', '6', '-sharp_yuv', '-metadata', 'none', ...(w > 720 ? ['-resize', '720', '0'] : []), inFile, '-o', out]);
    }
    photoSizes.set(rel, { ...size(out), bytes: readFileSync(out).length });
  }
  const { w, h } = photoSizes.get(rel)!;
  return { src: rel, w, h, ...(alt && !emptyL(alt) ? { alt } : {}), ...(caption && !emptyL(caption) ? { caption } : {}) };
}
const stem = (src: string) => src.replace(/^.*\//, '').replace(/\.\w+$/, '');

// ---- a card's content, in order ---------------------------------------------------------------------------------------

interface Content {
  rows?: Row[]; sections: Section[]; stats: Stat[]; links: Link[]; desc?: L; photo?: Photo; chips: Chip[];
  diff?: { level: Hike['level']; where: L };
}
function content(trip: TripId, c: El, firstTlIsRows: boolean, photoName: (src: string) => string): Content {
  const out: Content = { sections: [], stats: [], links: [], chips: [] };
  let head: L | undefined;
  for (const e of els(c)) {
    if (e.tag === 'div' && has(e, 'subhead')) {
      if (head) throw new Error(`subhead with nothing under it: ${JSON.stringify(head)}`);
      head = lOf(e);
    } else if (e.tag === 'ul') {
      const kind = has(e, 'tl') ? 'tl' : 'bul';
      const rows: Row[] = els(e).map((li) => {
        if (kind === 'bul') return lineOf(li);
        const t = tidy(text(one(li, byClass('time'), 'time').kids));
        return { t, ...lineOf(one(li, byClass('txt'), 'txt')) };
      });
      if (kind === 'tl' && firstTlIsRows && !out.rows && !head) out.rows = rows;
      else out.sections.push({ ...(head ? { head } : {}), kind, rows });
      head = undefined;
    } else if (e.tag === 'figure') {
      if (head?.en === 'Hike details') head = undefined; // the hike block's own heading (the UI draws the hike)
      const img = one(e, (x) => x.tag === 'img', 'img');
      const cap = first(e, (x) => x.tag === 'figcaption');
      out.photo = photo(trip, img.attrs.src, photoName(img.attrs.src), img.attrs.alt ? { [LANG]: img.attrs.alt } : undefined, cap ? lOf(cap) : undefined);
    } else if (e.tag === 'div' && has(e, 'diff-row')) {
      const d = one(e, byClass('diff'), 'diff');
      const level = (['mod', 'hard', 'epic'] as const).find((l) => has(d, l));
      if (!level) throw new Error('diff level');
      out.diff = { level, where: lOf(one(e, byClass('where'), 'where')) };
    } else if (e.tag === 'div' && has(e, 'stat-grid')) {
      for (const s of els(e)) out.stats.push({ k: lOf(one(s, byClass('k'), 'k')), v: lOf(one(s, byClass('v'), 'v')) });
    } else if (e.tag === 'a' && has(e, 'outlink')) {
      const lab = first(e, (x) => x.tag === 'span' && (x.attrs['data-en'] !== undefined || x.attrs['data-ja'] !== undefined));
      out.links.push({ label: lab ? lOf(lab) : { [LANG]: tidy(text(e.kids)) }, href: e.attrs.href });
    } else if (e.tag === 'p' && has(e, 'desc')) {
      out.desc = lOf(e);
    } else if (e.tag === 'div' && has(e, 'chips')) {
      for (const ch of els(e)) out.chips.push({ text: lOf(ch), ...(has(ch, 'pick') ? { pick: true as const } : {}) });
    } else throw new Error(`unknown content <${e.tag} class="${e.attrs.class}">`);
  }
  if (head) throw new Error(`trailing subhead ${JSON.stringify(head)}`);
  return out;
}
function summary(d: El): { icon: string; title: L; sub?: L; dom?: number } {
  const s = one(d, (x) => x.tag === 'summary', 'summary');
  const sub = first(s, byClass('sub2'));
  const chip = first(s, byClass('lead-chip'));
  return {
    icon: iconOf(one(s, byClass('gly'), 'gly')),
    title: lOf(one(s, byClass('t'), 't')),
    ...(sub ? { sub: lOf(sub) } : {}),
    ...(chip ? { dom: Number(text(one(chip, byClass('d'), 'd').kids)) } : {})
  };
}
const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ---- the map tables (python literals) ---------------------------------------------------------------------------------

const PYSTR = String.raw`'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"`;
const pyStr = (s: string) => s.slice(1, -1).replace(/\\(.)/g, '$1');
const NUM = String.raw`-?\d+\.\d+`;
function block(py: string, name: string): string {
  const i = py.search(new RegExp(`^${name}\\s*=`, 'm'));
  if (i < 0) throw new Error(`no ${name}`);
  const eq = py.indexOf('=', i);
  const open = eq + 1 + py.slice(eq + 1).search(/[{[(]/);
  const o = py[open], c = o === '{' ? '}' : o === '[' ? ']' : ')';
  let depth = 0;
  for (let k = open; k < py.length; k++) {
    if (py[k] === o) depth++;
    else if (py[k] === c && --depth === 0) return py.slice(open, k + 1);
  }
  throw new Error(`unclosed ${name}`);
}
interface Stop { t: string; ja: string; en: string; lat: number; lon: number }
/** DAYS = {1: [(t, a, b, lat, lon) | (t,) + CONST, …], …}; `order` which of a/b is ja. */
function pyDays(py: string, order: 'ja-en' | 'en-ja'): Map<number, Stop[]> {
  const consts = new Map<string, [string, string, number, number]>();
  for (const m of py.matchAll(new RegExp(String.raw`^([A-Z]+)\s*=\s*\((${PYSTR}),\s*(${PYSTR}),\s*(${NUM}),\s*(${NUM})\)`, 'gm')))
    consts.set(m[1], [pyStr(m[2]), pyStr(m[3]), Number(m[4]), Number(m[5])]);
  const days = new Map<number, Stop[]>();
  const src = block(py, 'DAYS');
  for (const dm of src.matchAll(/(\d+)\s*:\s*\[([\s\S]*?)\]\s*(?:,|\})/g)) {
    const stops: Stop[] = [];
    for (const m of dm[2].matchAll(new RegExp(String.raw`\(('\d\d:\d\d'),\)\s*\+\s*([A-Z]+)|\(('\d\d:\d\d'),\s*(${PYSTR}),\s*(${PYSTR}),\s*(${NUM}),\s*(${NUM})\)`, 'g'))) {
      const [a, b, lat, lon] = m[2] ? consts.get(m[2])! : [pyStr(m[4]), pyStr(m[5]), Number(m[6]), Number(m[7])];
      const [ja, en] = order === 'ja-en' ? [a, b] : [b, a];
      stops.push({ t: pyStr(m[1] ?? m[3]), ja, en, lat, lon });
    }
    days.set(Number(dm[1]), stops);
  }
  return days;
}
function pyKinds(py: string): Map<string, Leg['mode']> {
  const out = new Map<string, Leg['mode']>();
  for (const m of block(py, 'KIND').matchAll(/\((\d+),\s*(\d+)\)\s*:\s*'(\w+)'/g)) out.set(`${m[1]}-${m[2]}`, m[3] as Leg['mode']);
  return out;
}
function pyList(py: string, name: string): { ja: string; en: string; lat: number; lon: number }[] {
  return [...block(py, name).matchAll(new RegExp(String.raw`\((${PYSTR}),\s*(${PYSTR}),\s*(${NUM}),\s*(${NUM})\)`, 'g'))].map((m) => ({ ja: pyStr(m[1]), en: pyStr(m[2]), lat: Number(m[3]), lon: Number(m[4]) }));
}
const mins = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));

// ---- the legs' lines -------------------------------------------------------------------------------------------------

/** Douglas-Peucker in local metres (equirectangular about the line's first point), iterative. */
function simplify(pts: [number, number][], tolM: number): [number, number][] {
  if (pts.length < 3) return pts;
  const k = Math.cos((pts[0][1] * Math.PI) / 180);
  const xy = pts.map(([lon, lat]) => [lon * 111_320 * k, lat * 110_574]);
  const keep = new Array<boolean>(pts.length).fill(false);
  keep[0] = keep[pts.length - 1] = true;
  const stack: [number, number][] = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const [x1, y1] = xy[a], [x2, y2] = xy[b];
    const dx = x2 - x1, dy = y2 - y1, n = Math.hypot(dx, dy);
    let mi = -1, md = 0;
    for (let i = a + 1; i < b; i++) {
      const [x, y] = xy[i];
      const d = n ? Math.abs(dy * (x - x1) - dx * (y - y1)) / n : Math.hypot(x - x1, y - y1);
      if (d > md) { mi = i; md = d; }
    }
    if (md > tolM) { keep[mi] = true; stack.push([a, mi], [mi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
const r5 = (n: number) => Math.round(n * 1e5) / 1e5;
const ll = (lat: number, lon: number): [number, number] => [r5(lon), r5(lat)];
function haversineM(a: [number, number], b: [number, number]): number {
  const R = 6_371_000, toR = Math.PI / 180;
  const dLat = (b[1] - a[1]) * toR, dLon = (b[0] - a[0]) * toR;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * toR) * Math.cos(b[1] * toR) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// ---- one guide -------------------------------------------------------------------------------------------------------

interface Meta { id: TripId; lang: 'ja' | 'en'; start: string; end: string; tz: string; dayColors: string[]; bbox: Trip['bbox']; prefix: string; hero: string; cover: string }
const META: Meta[] = [
  { id: 'okinawa', lang: 'ja', start: '2026-10-10', end: '2026-10-12', tz: 'Asia/Tokyo', dayColors: ['#0e7b8b', '#e2593a', '#b87d17'], bbox: [127.586, 26.055, 128.374, 26.895], prefix: 'ok', hero: 'images/okinawa-hero.jpg', cover: 'images/covers/okinawa.jpg' },
  // (no map in the old guide: the box is the hikes' country, Seattle to Paradise and Leavenworth)
  { id: 'seattle', lang: 'en', start: '2026-07-02', end: '2026-07-19', tz: 'America/Los_Angeles', dayColors: [], bbox: [-122.45, 46.75, -120.6, 48.15], prefix: 'se', hero: 'images/mount-rainier.jpg', cover: 'images/covers/seattle.jpg' },
  { id: 'nz', lang: 'en', start: '2027-02-11', end: '2027-02-16', tz: 'Pacific/Auckland', dayColors: ['#1f6fe0', '#e0453f', '#00996f', '#e07c00', '#8a3fd6', '#0aa2bd'], bbox: [172.4, -40.45, 178.9, -34.3], prefix: 'nz', hero: 'images/nz-hero.jpg', cover: 'images/covers/nz.jpg' }
];

/** A day's rows on the eve (the NZ flight out, Feb 10) or past midnight (the flight home, Feb 17). */
function offsets(rows: DayRow[]): void {
  const ts = rows.map((r) => /(\d{1,2}):(\d{2})/.exec(r.t)).map((m) => (m ? Number(m[1]) * 60 + Number(m[2]) : null));
  const known = ts.flatMap((t, i) => (t === null ? [] : [{ t, i }]));
  if (known.length >= 2 && known[0].t > known[1].t + 360) rows[known[0].i].dd = -1;
  let plus = false;
  for (let k = 2; k < known.length; k++) {
    if (!plus && known[k].t < known[k - 1].t) plus = true;
    if (plus) rows[known[k].i].dd = 1;
  }
}

function guide(root: El, m: Meta): Trip {
  LANG = m.lang;
  const g = one(root, (x) => x.tag === 'article' && x.attrs['data-guide'] === m.id, m.id);
  const ym = g.attrs['data-month'];
  const itin = one(g, byClass('v-itinerary'), 'itinerary');
  const hero = one(itin, (x) => x.tag === 'header', 'hero');
  const footer = first(itin, byClass('footer'));

  // the map's stops, from the generator's table, checked against the stop lists in the page
  const py = m.id === 'okinawa' ? readFileSync(join(SRC, '.map/build.py'), 'utf8') : m.id === 'nz' ? readFileSync(join(SRC, '.map/nz.py'), 'utf8') : '';
  const stops = py ? pyDays(py, m.id === 'okinawa' ? 'ja-en' : 'en-ja') : new Map<number, Stop[]>();
  const places: Place[] = [];
  for (const [d, list] of stops) {
    const ul = one(g, (x) => x.tag === 'ul' && has(x, 'stoplist') && x.attrs['data-day'] === String(d), `stoplist ${d}`);
    const lis = els(ul);
    if (lis.length !== list.length) throw new Error(`${m.id} day ${d}: ${lis.length} listed, ${list.length} in the table`);
    list.forEach((s, i) => {
      const li = lis[i];
      const name = lOf(one(li, byClass('txt'), 'txt'));
      if (li.attrs['data-min'] !== String(mins(s.t)) || name.ja !== s.ja || name.en !== s.en) throw new Error(`${m.id} d${d} stop ${i}: page and table differ`);
      places.push({ id: `s${d}-${i}`, kind: 'stop', name: { ja: s.ja, en: s.en }, lat: s.lat, lon: s.lon, day: d, i, min: mins(s.t) });
    });
  }

  // days
  const days: Day[] = els(one(itin, (x) => has(x, 'spine') && has(x, 'days'), 'days')).map((d, n) => {
    const s = summary(d);
    const kind: Day['kind'] = has(d, 'hike') ? 'hike' : has(d, 'travel') ? 'travel' : 'day';
    const c = content(m.id, one(d, byClass('content'), 'content'), true, stem);
    const date = `${ym}-${String(s.dom).padStart(2, '0')}`;
    const dayStops = stops.get(n + 1) ?? [];
    const rows: DayRow[] = (c.rows ?? []).map((r) => {
      const at = dayStops.findIndex((st) => st.t === r.t);
      return { t: r.t ?? '', text: r.text, ...(r.note ? { note: r.note } : {}), ...(at >= 0 ? { place: `s${n + 1}-${at}` } : {}) };
    });
    offsets(rows);
    let hike: Hike | undefined;
    if (kind === 'hike') {
      const st = (k: string) => {
        const v = c.stats.find((x) => x.k.en === k)?.v;
        if (!v) throw new Error(`${m.id} day ${n + 1}: no ${k}`);
        return v;
      };
      const num = (v: L, u: string) => Number(new RegExp(`^\\{${u}:([\\d.]+)\\}$`).exec(v.en ?? '')?.[1] ?? NaN);
      const link = c.links.find((l) => l.href.includes('/gpx/'));
      hike = {
        level: c.diff!.level, km: num(st('Distance'), 'km'), gainM: num(st('Elevation gain'), 'm'), route: st('Route'), drive: st('Drive time'),
        time: st('Hike time'), pass: st('Pass required'), where: c.photo?.caption ?? c.diff!.where, ...(link ? { gpx: link.href } : {})
      };
      c.stats = [];
      c.links = c.links.filter((l) => l !== link);
    }
    if (c.stats.length || c.chips.length) throw new Error(`${m.id} day ${n + 1}: stats or chips on a day`);
    return {
      n: n + 1, date, kind, icon: s.icon, title: s.title, ...(s.sub ? { sub: s.sub } : {}), rows,
      ...(c.sections.length ? { sections: c.sections } : {}), ...(c.links.length ? { links: c.links } : {}),
      ...(c.desc ? { note: c.desc } : {}), ...(c.photo ? { photo: c.photo } : {}), ...(hike ? { hike } : {})
    };
  });

  // logistics
  const spines = all(itin, (x) => has(x, 'spine') && !has(x, 'days'));
  const logistics: Card[] = spines.flatMap((sp) => els(sp)).map((d) => {
    const s = summary(d);
    const c = content(m.id, one(d, byClass('content'), 'content'), false, stem);
    return {
      id: slug(s.title.en ?? ''), icon: s.icon, title: s.title, ...(s.sub ? { sub: s.sub } : {}), ...(c.desc ? { desc: c.desc } : {}),
      ...(c.photo ? { photo: c.photo } : {}), ...(c.stats.length ? { stats: c.stats } : {}), ...(c.sections.length ? { sections: c.sections } : {}),
      ...(c.links.length ? { links: c.links } : {})
    };
  });

  // campsites
  const campView = first(g, byClass('v-camps'));
  let camps: Camp[] | undefined;
  if (campView) {
    camps = els(one(campView, byClass('camp-list'), 'camp-list')).map((d) => {
      const s = summary(d);
      const c = content(m.id, one(d, byClass('content'), 'content'), false, (src) => `camps/${stem(src)}`);
      const id = stem(c.photo!.src);
      const stat = (k: string) => c.stats.find((x) => x.k.en === k)!.v;
      const from = /^(\d+) min · \{km:([\d.]+)\}$/.exec(stat('From office').en ?? '');
      if (!from) throw new Error(`camp ${id}: From office`);
      return {
        id, place: id, name: s.title, sub: s.sub!, type: has(d, 'paid') ? 'paid' : 'wild', beach: has(d, 'f-beach'), toilet: has(d, 'f-toilet'),
        shower: has(d, 'f-shower'), photo: c.photo!, desc: c.desc!, chips: c.chips, fromMin: Number(from[1]), fromKm: Number(from[2]), fee: stat('Fee'),
        maps: c.links[0].href
      };
    });
    const table = pyList(py, 'CAMPS');
    for (const t of table) {
      const camp = camps.find((x) => x.id === slug(t.en));
      if (!camp) throw new Error(`camp pin ${t.en} has no card`);
      places.push({ id: camp.id, kind: 'camp', name: { ja: t.ja, en: t.en }, lat: t.lat, lon: t.lon, link: camp.maps });
    }
    for (const t of pyList(py, 'NATURE')) places.push({ id: `n-${slug(t.en)}`, kind: 'nature', name: { ja: t.ja, en: t.en }, lat: t.lat, lon: t.lon });
    for (const t of pyList(py, 'FOOD')) places.push({ id: `f-${slug(t.en)}`, kind: 'food', name: { ja: t.ja, en: t.en }, lat: t.lat, lon: t.lon });
  }

  // legs
  const legs: Leg[] = [];
  if (py) {
    const kinds = pyKinds(py);
    const osrm = JSON.parse(readFileSync(join(SRC, m.id === 'okinawa' ? '.map/legs.json' : '.map/nz_legs.json'), 'utf8')) as Record<string, { t: number; km: number; geom: [number, number][] }>;
    const pt = (d: number, i: number) => { const p = places.find((x) => x.id === `s${d}-${i}`)!; return ll(p.lat, p.lon); };
    const straight = (d: number, i: number, from: number, to: number, mode: Leg['mode']): Leg => ({ day: d, i, from: `s${d}-${from}`, to: `s${d}-${to}`, mode, line: [pt(d, from), pt(d, to)] });
    const routed = (d: number, i: number, from: number, key: string, mode: Leg['mode']): Leg => {
      const o = osrm[key];
      if (!o) throw new Error(`${m.id}: no OSRM leg ${key}`);
      return { day: d, i, from: `s${d}-${from}`, to: `s${d}-${i}`, mode, min: o.t, km: o.km, line: simplify(o.geom.map(([la, lo]) => ll(la, lo)), 5) };
    };
    for (const [d, list] of stops) {
      for (let i = 1; i < list.length; i++) {
        const mode = kinds.get(`${d}-${i}`) ?? 'drive';
        if (m.id === 'okinawa' && d === 2 && i === 3) {
          // Minna → Ufuya: the boat back to the shop, then the drive from it (build.py draws the same two)
          legs.push(straight(d, i, 2, 1, 'boat'), routed(d, i, 1, 'd2-2', 'drive'));
        } else if (mode === 'walk' || mode === 'boat') legs.push(straight(d, i, i - 1, i, mode));
        else legs.push(routed(d, i, i - 1, `d${d}-${i - 1}`, mode));
      }
    }
    for (const l of legs) {
      for (const [end, id] of [[l.line[0], l.from], [l.line[l.line.length - 1], l.to]] as const) {
        const p = places.find((x) => x.id === id)!;
        if (haversineM(end, ll(p.lat, p.lon)) > 400) throw new Error(`${m.id} leg d${l.day} → ${l.i}: ends ${Math.round(haversineM(end, ll(p.lat, p.lon)))} m from ${id}`);
      }
    }
  }

  // packing
  const cats: PackCat[] = els(one(g, byClass('packlist'), 'packlist')).map((grp, ci) => {
    const lab = one(grp, byClass('glabel'), 'glabel');
    const items = all(grp, byClass('checkrow')).map((row) => {
      const id = /^\w+-packing-(\d+)-(\d+)$/.exec(row.attrs.for)!;
      if (Number(id[1]) !== ci) throw new Error(`packing ${row.attrs.for} under cat ${ci}`);
      const ctxt = one(row, byClass('ctxt'), 'ctxt');
      const [own, small] = splitSmall(ctxt.kids);
      const textSides = ctxt.attrs['data-en'] !== undefined ? { ja: own, en: parse(ctxt.attrs['data-en']).kids } : ctxt.attrs['data-ja'] !== undefined ? { en: own, ja: parse(ctxt.attrs['data-ja']).kids } : { [LANG]: own };
      const sm = small ? (ctxt.kids.find((k) => isEl(k) && k.tag === 'small') as El) : null;
      return { id: `${m.prefix}-${id[1]}-${id[2]}`, text: pair(text, textSides), ...(sm ? { note: lOf(sm) } : {}) };
    });
    return { id: `${m.prefix}-${ci}`, name: lOf(one(lab, byClass('gname'), 'gname')), icon: iconOf(one(lab, byClass('gicon'), 'gicon')), items };
  });

  const campsIntro = campView ? lOf(one(campView, byClass('intro'), 'intro')) : undefined;
  const campsFoot = campView ? lOf(one(campView, byClass('footer'), 'footer')) : undefined;
  return {
    id: m.id, lang: m.lang, title: lOf(one(hero, (x) => x.tag === 'h1', 'h1')), eyebrow: lOf(one(hero, byClass('eyebrow'), 'eyebrow')),
    sub: lOf(one(hero, byClass('sub'), 'sub')), start: m.start, end: m.end, tz: m.tz, cover: photo(m.id, m.cover, 'cover'), hero: photo(m.id, m.hero, 'hero'),
    dayColors: m.dayColors, bbox: m.bbox, days, logistics, ...(camps ? { camps, campsIntro, campsFoot } : {}), places, legs, packing: { cats },
    ...(footer ? { foot: lOf(footer) } : {})
  };
}

// ---- private values: found by context, replaced by {p:key} -----------------------------------------------------------

function strings(v: unknown, f: (s: string) => string): unknown {
  if (typeof v === 'string') return f(v);
  if (Array.isArray(v)) return v.map((x) => strings(x, f));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, strings(x, f)]));
  return v;
}
const travellers = new Map<string, string>();
function privates(t: Trip): Record<string, string> {
  const found: Record<string, string> = {};
  const add = (key: string, value: string) => {
    if (found[key] && found[key] !== value) throw new Error(`${t.id}: two values for ${key}`);
    found[key] = value;
  };
  strings(t, (s) => {
    for (const m of s.matchAll(/(?:ticket|航空券番号) (\d{10,16})\b/g)) add('ticket', m[1]);
    for (const m of s.matchAll(/(?:\bref|[Bb]ooking|confirmation|予約番号) (#?)([A-Z0-9]{5,8})(?![A-Za-z0-9])/g)) add(m[1] ? 'carRef' : 'flightRef', m[2]);
    for (const m of s.matchAll(/(?:itinerary|旅程番号) (\d{10,})\b/g)) add('expediaRef', m[1]);
    if (/^https:\/\/evertrail-onboarding\./.test(s)) add('onboardingUrl', s);
    return s;
  });
  // the travellers, named in the flights card: the booking's small print, the passport line
  const NAME = /^[A-Z][a-z]+ [A-Z][a-z]+$/;
  for (const r of t.logistics.find((c) => c.id === 'flights')?.sections?.flatMap((s) => s.rows) ?? []) {
    const names = /passports/.test(r.note?.en ?? '') ? (r.text.en ?? '').split(' · ') : /^Booking /.test(r.text.en ?? '') ? [(r.note?.en ?? '').split(' · ')[0]] : [];
    for (const n of names.filter((x) => NAME.test(x))) {
      if (!travellers.has(n)) travellers.set(n, `traveller${travellers.size + 1}`);
      add(travellers.get(n)!, n);
    }
  }
  return found;
}
function redact(t: Trip, found: Record<string, string>): Trip {
  const pairs = Object.entries(found).sort((a, b) => b[1].length - a[1].length);
  return strings(t, (s) => pairs.reduce((acc, [k, v]) => acc.split(v).join(`{p:${k}}`), s)) as Trip;
}

// ---- source fixes (the old page's own slips) --------------------------------------------------------------------------

function fixes(t: Trip): Trip {
  return strings(t, (s) => {
    // a mangled ハ in the NZ day 6 row (three U+FFFD in the page): ハーバーブリッジ
    const f = s.replace(/\uFFFD+ーバーブリッジ/g, 'ハーバーブリッジ');
    if (f.includes('\uFFFD')) throw new Error(`a broken character: ${f}`);
    return f;
  }) as Trip;
}

// ---- output ----------------------------------------------------------------------------------------------------------

const KEY = /^[A-Za-z_$][\w$]*$/;
function inline(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(inline).join(', ')}]`;
  if (v && typeof v === 'object') return `{ ${Object.entries(v).map(([k, x]) => `${KEY.test(k) ? k : JSON.stringify(k)}: ${inline(x)}`).join(', ')} }`;
  return JSON.stringify(v);
}
function ser(v: unknown, ind: string, key = ''): string {
  const one = inline(v);
  if (!v || typeof v !== 'object' || ind.length + key.length + one.length <= 116) return one;
  const next = `${ind}  `;
  // a place or a leg a line (a leg's points dense), packing items and chips likewise
  if (Array.isArray(v) && key === 'legs') return `[\n${v.map((x) => `${next}{ ${Object.entries(x as object).map(([k, y]) => `${k}: ${k === 'line' ? JSON.stringify(y) : inline(y)}`).join(', ')} }`).join(',\n')}\n${ind}]`;
  if (Array.isArray(v) && ['places', 'items', 'chips'].includes(key)) return `[\n${v.map((x) => `${next}${inline(x)}`).join(',\n')}\n${ind}]`;
  if (Array.isArray(v)) return `[\n${v.map((x) => `${next}${ser(x, next)}`).join(',\n')}\n${ind}]`;
  return `{\n${Object.entries(v).map(([k, x]) => `${next}${KEY.test(k) ? k : JSON.stringify(k)}: ${ser(x, next, k)}`).join(',\n')}\n${ind}}`;
}

function main() {
  const html = readFileSync(join(SRC, 'index.html'), 'utf8');
  const root = parse(html.slice(html.indexOf('<main'), html.indexOf('</main>') + 7));
  const notes: Record<string, Record<string, string>> = {};
  const outDir = join(APP, 'src', 'lib', 'travel', 'trips');
  mkdirSync(outDir, { recursive: true });
  for (const m of META) {
    let t = fixes(guide(root, m));
    const found = privates(t);
    t = redact(t, found);
    const body = ser(t, '');
    for (const v of Object.values(found)) if (body.includes(v)) throw new Error(`${m.id}: a private value is still in the data`);
    notes[m.id] = found;
    const file = join(outDir, `${m.id}.ts`);
    writeFileSync(file, `// The ${m.id} guide (docs/travel.md "Content"), generated once by scripts/travel-extract.ts from the old travel-plans\n// site (index.html, the .map tables and OSRM legs), then the source: edit here. Private values are {p:key} tokens\n// (the trip note on the relay).\nimport type { Trip } from '../types.ts';\n\nexport const ${m.id}: Trip = ${body};\n`);
    console.log(`${m.id}: ${t.days.length} days, ${t.places.length} places, ${t.legs.length} legs, ${t.packing.cats.reduce((n, c) => n + c.items.length, 0)} packing items, ${(readFileSync(file).length / 1024).toFixed(1)} KB; private keys ${Object.keys(found).join(', ') || 'none'}`);
  }
  // the private values, outside the repo
  mkdirSync(BACKUPS, { recursive: true });
  const notesFile = join(BACKUPS, 'trip-notes.json');
  writeFileSync(notesFile, `${JSON.stringify(notes, null, 2)}\n`, { mode: 0o600 });
  chmodSync(notesFile, 0o600);
  const now = Date.now();
  const iso = new Date(now).toISOString();
  const events = Object.entries(notes).filter(([, v]) => Object.keys(v).length).map(([trip, v]) => [iso, 'A', `tn-${trip}-${now.toString(36)}`, 'trip_note', JSON.stringify({ trip, at: now, v })]);
  const loadFile = join(BACKUPS, 'trip-notes.load.json');
  writeFileSync(loadFile, `${JSON.stringify({ rows: { events } }, null, 1)}\n`, { mode: 0o600 });
  chmodSync(loadFile, 0o600);
  const bytes = [...photoSizes.values()].reduce((n, p) => n + p.bytes, 0);
  console.log(`photos: ${photoSizes.size} files, ${(bytes / 1048576).toFixed(2)} MB; notes: ${notesFile}, ${loadFile}`);
}

main();
