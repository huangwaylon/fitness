// Pure, dependency-free parser of the iOS Shortcuts health body (ADR 0015, sheets-architecture.md §3). It runs in
// three places: the Apps Script web app (bundled by esbuild into apps-script/Code.js), the browser, and Node tests.
// So: no zod, no Node APIs, no `crypto`, no TextEncoder, no Intl; only plain ES2019.
//
// It is a port of server/ingest/shortcut.ts + workout-names.ts. Accepted shapes:
//   - daily form:  {"dates": "Sep 28, 2026 at 7:11 AM\n…", "steps": "855\n…", "exercise_minutes": "0\n…"}
//   - series form: {"steps": {"values": […], "starts": […], "sources": […]}, "exercise": {…}}
//   - simple form: {"date": "2026-10-28", "steps": "12\n3\n27"}
//   - days form:   {"days": [{"date": "2026-10-28", "steps": 8123, "exerciseMin": 34}]}
//   - workouts:    {"workouts": {"types": […], "starts": […], "ends": […], "avgHrs": […]}} or an array of objects
// Every list may be a JSON array or newline-joined text (Shortcuts' Dictionary fields typed as Text).
import { toLocalDate } from '../scoring/dates.ts';

export type MetricKey = 'steps' | 'exercise_min';

export interface ParsedMetric { date: string; metric: MetricKey; value: number }
export interface ParsedWorkout {
  /** `workoutKey(type, start)`: stable across re-sends and phone-language switches. */
  id: string;
  date: string;
  type: string;
  start: string;
  end: string;
  durationMin: number;
  avgHr: number | null;
}
export interface ParsedBody {
  metrics: ParsedMetric[];
  workouts: ParsedWorkout[];
  /** Items dropped because a value or date was unreadable. */
  skipped: number;
  /** Non-ASCII workout names with no alias yet (worth adding to ALIASES). */
  unknownTypes: string[];
}

/** Thrown for a body with the wrong shape; the message says what to fix in the Shortcut. */
export class ShapeError extends Error {}

// ---------------------------------------------------------------- numbers and dates

/** "8,123", "8123 歩", 8123 → 8123; null if there's no number. */
export function looseNumber(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  const m = v.replace(/[,，\s]/g, '').match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

const MONTHS: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const pad = (n: number | string) => String(n).padStart(2, '0');

/** Shortcuts' default date text (when no Format Date step is used): English or Japanese locale. */
function shortcutsDefaultDate(v: string): string | null {
  const hm = (h: string, m: string, sec: string | undefined, ap: string | undefined) => {
    let hour = Number(h);
    const a = ap ? ap.toLowerCase() : undefined;
    if (a === 'pm' || a === '午後') hour = hour % 12 + 12;
    if (a === 'am' || a === '午前') hour = hour % 12;
    return `${pad(hour)}:${m}:${sec ?? '00'}`;
  };
  // "Oct 28, 2026 at 8:10 AM" / "October 28, 2026 at 8:10:05 PM" / "Oct 28, 2026"
  let m = v.match(/^([A-Za-z]{3})[a-z]*\.? (\d{1,2}), (\d{4})(?:,? (?:at )?(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp][Mm])?)?$/);
  if (m && MONTHS[m[1].toLowerCase()]) {
    const t = m[4] ? hm(m[4], m[5], m[6], m[7]) : '00:00:00';
    return `${m[3]}-${pad(MONTHS[m[1].toLowerCase()])}-${pad(m[2])}T${t}+09:00`;
  }
  // "28 Oct 2026 at 08:10"
  m = v.match(/^(\d{1,2}) ([A-Za-z]{3})[a-z]* (\d{4})(?:,? (?:at )?(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp][Mm])?)?$/);
  if (m && MONTHS[m[2].toLowerCase()]) {
    const t = m[4] ? hm(m[4], m[5], m[6], m[7]) : '00:00:00';
    return `${m[3]}-${pad(MONTHS[m[2].toLowerCase()])}-${pad(m[1])}T${t}+09:00`;
  }
  // "2026年10月28日 8:10" / "2026年10月28日 午後8:10"
  m = v.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日(?:\s*(午前|午後)?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (m) {
    const t = m[5] ? hm(m[5], m[6], m[7], m[4]) : '00:00:00';
    return `${m[1]}-${pad(m[2])}-${pad(m[3])}T${t}+09:00`;
  }
  return null;
}

/** `2026-11-02 07:00:00 +0900`, ISO 8601, or a bare date → ISO 8601 with offset (no offset → Tokyo); null if unparseable. */
export function toIsoDate(s: string): string | null {
  const m = s.trim().match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)(?:\.\d+)?\s*(Z|[+-]\d{2}:?\d{2})?$/);
  if (m) {
    const time = m[2].length === 5 ? `${m[2]}:00` : m[2];
    let off = m[3] ?? '+09:00';
    if (off !== 'Z' && !off.includes(':')) off = `${off.slice(0, 3)}:${off.slice(3)}`;
    const iso = `${m[1]}T${time}${off}`;
    return Number.isNaN(Date.parse(iso)) ? null : iso;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s.trim())) return `${s.trim()}T00:00:00+09:00`;
  return null;
}

/** ISO 8601, `2026-10-28 07:05:00 +0900`, `2026/10/28 7:05`, or Shortcuts' default text (no offset → Tokyo). */
export function looseDate(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const native = shortcutsDefaultDate(v.trim().replace(/\u202f|\u00a0/g, ' '));
  if (native) return native;
  let s = v.trim().replace(/\//g, '-');
  s = s.replace(/^(\d{4})-(\d{1,2})-(\d{1,2})/, (_, y, mo, d) => `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`);
  s = s.replace(/([ T])(\d):/, '$10$2:');
  return toIsoDate(s);
}

// ---------------------------------------------------------------- workout names and ids

/** Japanese (and alternate English) display names → canonical English names. Unknown names pass through. */
const ALIASES: Record<string, string> = {
  // Strength
  '伝統的な筋力トレーニング': 'Traditional Strength Training',
  '筋力トレーニング': 'Traditional Strength Training',
  '機能的な筋力トレーニング': 'Functional Strength Training',
  'コアトレーニング': 'Core Training',
  'ピラティス': 'Pilates',
  'ヨガ': 'Yoga',
  '高強度インターバルトレーニング': 'High Intensity Interval Training',
  'HIIT': 'High Intensity Interval Training',
  'ミックスカーディオ': 'Mixed Cardio',
  'クロストレーニング': 'Cross Training',
  // Walking / hiking (kept for readable labels)
  'ウォーキング': 'Walking',
  '屋外ウォーキング': 'Outdoor Walk',
  '室内ウォーキング': 'Indoor Walk',
  'ハイキング': 'Hiking',
  // Common others (kept for readable labels)
  'ランニング': 'Running',
  '屋外ランニング': 'Outdoor Run',
  '室内ランニング': 'Indoor Run',
  'サイクリング': 'Cycling',
  '水泳': 'Swimming',
  'ダンス': 'Dance',
  'エリプティカル': 'Elliptical',
  'ローイング': 'Rowing'
};

export function canonicalWorkoutType(name: string): string {
  const n = name.trim().replace(/\s+/g, ' ');
  return ALIASES[n] ?? ALIASES[n.replace(/\s*[（(].*[)）]\s*$/, '')] ?? n;
}

/** True if we have no mapping for a non-ASCII name. */
export function isUnknownLocalisedType(name: string): boolean {
  return /[^\x00-\x7F]/.test(name) && canonicalWorkoutType(name) === name.trim().replace(/\s+/g, ' ');
}

/**
 * Stable workout id: `w:` + the first 24 hex chars of SHA-256(`<canonical type>|<start minute, UTC ISO>`).
 *
 * Why SHA-256 in plain JS rather than FNV: it is byte-for-byte the id the Mac server computed with node:crypto
 * (server/ingest/workout-names.ts), so migrated workouts and their `confirm` events keep their ids, and 96 bits
 * makes collisions a non-issue. It only needs to be deterministic, and this runs identically in Apps Script V8,
 * browsers and Node (no crypto API, no TextEncoder).
 */
export function workoutKey(type: string, startIso: string): string {
  const minute = new Date(Math.floor(Date.parse(startIso) / 60000) * 60000).toISOString();
  return `w:${sha256Hex(`${canonicalWorkoutType(type)}|${minute}`).slice(0, 24)}`;
}

function utf8(s: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < s.length; i++) {
    let c = s.charCodeAt(i);
    if (c >= 0xd800 && c < 0xdc00 && i + 1 < s.length) {
      const d = s.charCodeAt(i + 1);
      if (d >= 0xdc00 && d < 0xe000) { c = 0x10000 + ((c - 0xd800) << 10) + (d - 0xdc00); i++; }
    }
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return out;
}

const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01,
  0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
  0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08,
  0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
];

/** SHA-256 of a string's UTF-8 bytes, lowercase hex (FIPS 180-4). */
export function sha256Hex(s: string): string {
  const bytes = utf8(s);
  const bitLen = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  // 64-bit big-endian length; inputs here are far below 2^32 bits.
  bytes.push(0, 0, 0, 0, (bitLen >>> 24) & 255, (bitLen >>> 16) & 255, (bitLen >>> 8) & 255, bitLen & 255);
  const h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const w = new Array<number>(64);
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  for (let off = 0; off < bytes.length; off += 64) {
    for (let i = 0; i < 16; i++) {
      const j = off + i * 4;
      w[i] = (bytes[j] << 24) | (bytes[j + 1] << 16) | (bytes[j + 2] << 8) | bytes[j + 3];
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i++) {
      const t1 = (hh + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    h[0] = (h[0] + a) | 0; h[1] = (h[1] + b) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0;
    h[4] = (h[4] + e) | 0; h[5] = (h[5] + f) | 0; h[6] = (h[6] + g) | 0; h[7] = (h[7] + hh) | 0;
  }
  return h.map((x) => (x >>> 0).toString(16).padStart(8, '0')).join('');
}

// ---------------------------------------------------------------- body shapes

const SHAPE_HINT = 'steps must be {"values": [...], "starts": [...], "sources": [...]} with one start date per value';

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Shortcuts turns a list into newline-joined text when a Dictionary field is typed as Text: accept both. */
const splitLines = (v: unknown): unknown => (typeof v === 'string' ? (v.trim() === '' ? [] : v.split(/\r?\n/)) : v);

/** A list field: array, newline text, or missing (→ []). Anything else is a shape error. */
function list(v: unknown, path: string): unknown[] {
  if (v === undefined || v === null) return [];
  const l = splitLines(v);
  if (!Array.isArray(l)) throw new ShapeError(`unexpected shape: ${path}: expected a list`);
  return l;
}

interface Series { values: unknown[]; starts: unknown[]; sources?: unknown[] }

function series(v: unknown, path: string): Series | undefined {
  if (v === undefined) return undefined;
  if (!isRec(v)) throw new ShapeError(`unexpected shape: ${path}: expected an object`);
  return {
    values: list(v.values, `${path}.values`),
    starts: list(v.starts, `${path}.starts`),
    sources: v.sources === undefined ? undefined : list(v.sources, `${path}.sources`)
  };
}

/**
 * Per-day total of raw samples. The Watch and the iPhone both record steps, so summing everything double-counts;
 * Health merges them, but Shortcuts returns raw samples. Approximation: total per source, then take the larger.
 */
function dailyTotals(s: Series, onSkip: () => void): Map<string, number> {
  const bySource = new Map<string, number>();
  if (s.values.length > 0 && s.starts.length !== s.values.length) {
    throw new ShapeError(`got ${s.values.length} values but ${s.starts.length} start dates: ${SHAPE_HINT}`);
  }
  for (let i = 0; i < s.values.length; i++) {
    const v = looseNumber(s.values[i]);
    const iso = looseDate(s.starts[i]);
    if (v === null || !iso) { onSkip(); continue; }
    const k = `${toLocalDate(iso)}|${String(s.sources?.[i] ?? '')}`;
    bySource.set(k, (bySource.get(k) ?? 0) + v);
  }
  const out = new Map<string, number>();
  for (const [k, v] of bySource) {
    const date = k.slice(0, 10);
    out.set(date, Math.max(out.get(date) ?? 0, v));
  }
  return out;
}

/** Parse a Shortcut body (already JSON-parsed). Throws ShapeError when nothing usable or the shape is wrong. */
export function parseShortcut(raw: unknown): ParsedBody {
  if (!isRec(raw)) throw new ShapeError('unexpected shape: body: expected an object');
  let r: Rec = { ...raw };
  // Accept the obvious spellings for exercise minutes.
  if (r.exercise === undefined) {
    const alias = ['exercise_minutes', 'exerciseMinutes', 'exercise_min', 'exerciseMin'].find((k) => r[k] !== undefined);
    if (alias) r.exercise = r[alias];
  }
  // Simple form: {"date": "2026-10-28", "steps": "12\n3\n…"}: every value belongs to that one day.
  const day = typeof r.date === 'string' ? looseDate(r.date) : null;
  if (day) {
    for (const k of ['steps', 'exercise']) {
      if (typeof r[k] === 'string' || Array.isArray(r[k])) {
        const values = splitLines(r[k]) as unknown[];
        r[k] = { values, starts: values.map(() => day) };
      }
    }
  }
  // Daily form: {"dates": [...], "steps": [...], "exercise"?: [...]}, parallel lists. Same-date values are added.
  if (r.dates !== undefined) {
    const dates = splitLines(r.dates);
    if (Array.isArray(dates)) {
      r = { ...r };
      for (const k of ['steps', 'exercise']) {
        const values = splitLines(r[k]);
        if (Array.isArray(values)) r[k] = { values, starts: dates };
      }
    }
  }
  for (const k of ['steps', 'exercise']) {
    const v = r[k];
    if (typeof v === 'string' || Array.isArray(v)) {
      throw new ShapeError(`${k} has values but no start dates: add "date": "YYYY-MM-DD" for one day, or ${SHAPE_HINT.replace('steps', k)}`);
    }
  }
  const steps = series(r.steps, 'steps');
  const exercise = series(r.exercise, 'exercise');
  if (r.days !== undefined && !Array.isArray(r.days)) throw new ShapeError('unexpected shape: days: expected a list');
  const days = r.days as unknown[] | undefined;
  const w = r.workouts;
  if (w !== undefined && !Array.isArray(w) && !isRec(w)) throw new ShapeError('unexpected shape: workouts: expected a list or an object');
  if (!steps && !exercise && !days && w === undefined) throw new ShapeError('no steps, exercise, days or workouts');

  let skipped = 0;
  const skip = () => void skipped++;
  const metrics: ParsedMetric[] = [];
  const round = (v: number) => Math.round(v * 100) / 100;
  for (const [key, s] of [['steps', steps], ['exercise_min', exercise]] as const) {
    if (!s) continue;
    for (const [date, v] of dailyTotals(s, skip)) metrics.push({ date, metric: key, value: round(v) });
  }
  for (const d of days ?? []) {
    const date = isRec(d) ? looseDate(d.date) : null;
    if (!isRec(d) || !date) { skip(); continue; }
    const localDate = date.slice(0, 10);
    const st = looseNumber(d.steps);
    const ex = looseNumber(d.exerciseMin);
    if (st !== null) metrics.push({ date: localDate, metric: 'steps', value: round(st) });
    if (ex !== null) metrics.push({ date: localDate, metric: 'exercise_min', value: round(ex) });
  }

  let items: { type: unknown; start: unknown; end: unknown; avgHr?: unknown }[] = [];
  if (Array.isArray(w)) {
    items = w.map((x) => (isRec(x) ? { type: x.type, start: x.start, end: x.end, avgHr: x.avgHr } : { type: null, start: null, end: null }));
  } else if (isRec(w)) {
    const starts = list(w.starts, 'workouts.starts');
    const ends = list(w.ends, 'workouts.ends');
    const hrs = list(w.avgHrs, 'workouts.avgHrs');
    items = list(w.types, 'workouts.types').map((type, i) => ({ type, start: starts[i], end: ends[i], avgHr: hrs[i] }));
  }
  const workouts: ParsedWorkout[] = [];
  const unknownTypes: string[] = [];
  for (const it of items) {
    const start = looseDate(it.start);
    const end = looseDate(it.end);
    if (typeof it.type !== 'string' || it.type.trim() === '' || !start || !end || Date.parse(end) < Date.parse(start)) { skip(); continue; }
    if (isUnknownLocalisedType(it.type) && !unknownTypes.includes(it.type.trim())) unknownTypes.push(it.type.trim());
    const type = canonicalWorkoutType(it.type);
    workouts.push({
      id: workoutKey(type, start), date: toLocalDate(start), type, start, end,
      durationMin: Math.round(((Date.parse(end) - Date.parse(start)) / 60000) * 10) / 10,
      avgHr: looseNumber(it.avgHr)
    });
  }
  return { metrics, workouts, skipped, unknownTypes };
}
