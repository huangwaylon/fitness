// すうじ ラッシュ's content (docs/kikimimi-engine.md "すうじ ラッシュ", content/listen/README.md "rush"): seeded frames (a setting's
// line with its number, by a customer, with or without a self-correction) expanded into content/listen/s1-rush.yaml
// (かわ) and s2-rush.yaml (もり). Each frame is an order said the American way at one of six counters (a café, a
// konbini, a ticket window, a deli on a trip, a taxi stand, a pharmacy); each item one customer's 1-2 lines, one clip,
// and the ticket's four chips: the right number, the one said before a self-correction, another number heard in the
// line, a sound trap (teen / -ty, two digits swapped) or a near value. About a third of the items correct themselves,
// at random. The Japanese (`ja`, `ctx`, `cja`, `why`, `note`) comes from the frame. Deterministic (a seed per file):
// the same frames give the same files, so the ids stay. Silent: nothing is voiced (audio batch A3 speaks the files'
// clips: `--clips` lists them).
//   node scripts/kikimimi-rush.ts            write the files
//   node scripts/kikimimi-rush.ts --check    exit 1 if a file would change
//   node scripts/kikimimi-rush.ts --clips    the clip ids to voice, one a line (A3: --only '^rush-')
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { mulberry32, fnv1a, shuffle } from '../src/lib/random.ts';
import { numberWords, ordinalWords, sayNumbers } from '../src/lib/kikimimi/speech.ts';

const DIR = join(import.meta.dirname, '../content/listen');

// ---------- numbers: as written, as said, as the ticket shows them ----------

type Kind = 'qty' | 'yen' | 'usd' | 'time' | 'num' | 'date' | 'mins' | 'age' | 'digits';
const WORDS_UP_TO = 10;
const ONE = ['oh', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const hm = (t: number) => [Math.floor(t / 60), t % 60] as const;
const comma = (n: number) => n.toLocaleString('en-US');

/** A value in a line: `en` as shown at the reveal (small counts in words, else digits), `tts` as said. */
function said(k: Kind, v: number): { en: string; tts: string } {
  switch (k) {
    case 'qty': case 'mins': case 'age': case 'num':
      return { en: k !== 'num' && v <= WORDS_UP_TO ? numberWords(v) : String(v), tts: numberWords(v) };
    case 'yen':
      return { en: `${comma(v)} yen`, tts: `${numberWords(v)} yen` };
    case 'usd': {
      const d = Math.floor(v / 100), c = v % 100;
      return { en: c ? `$${d}.${String(c).padStart(2, '0')}` : `$${d}`, tts: c ? `${numberWords(d)} ${c < 10 ? `oh ${ONE[c]}` : numberWords(c)}` : `${numberWords(d)} dollars` };
    }
    case 'time': {
      const [h, m] = hm(v), en = `${h}:${String(m).padStart(2, '0')}`;
      return { en, tts: sayNumbers(en) };
    }
    case 'date':
      return { en: `${v}${v % 10 === 1 && v !== 11 ? 'st' : v % 10 === 2 && v !== 12 ? 'nd' : v % 10 === 3 && v !== 13 ? 'rd' : 'th'}`, tts: ordinalWords(v) };
    case 'digits':
      return { en: String(v).padStart(4, '0'), tts: [...String(v).padStart(4, '0')].map((d) => ONE[+d]).join(' ') };
  }
}

/** A value as the ticket shows it (`chip`, UI copy) and read in Japanese (`ja`: no Latin letters). */
function shown(k: Kind, v: number, unit = ''): { chip: string; ja: string } {
  switch (k) {
    case 'yen': return { chip: `${comma(v)}円`, ja: `${comma(v)}円` };
    case 'usd': {
      const d = Math.floor(v / 100), c = v % 100;
      return { chip: c ? `$${d}.${String(c).padStart(2, '0')}` : `$${d}`, ja: c ? `${d}ドル${c}セント` : `${d}ドル` };
    }
    case 'time': {
      const [h, m] = hm(v);
      return { chip: `${h}:${String(m).padStart(2, '0')}`, ja: m ? `${h}時${m}分` : `${h}時` };
    }
    case 'date': return { chip: `${unit}${v}日`, ja: `${unit}${v}日` };
    case 'mins': return { chip: `${v}分`, ja: `${v}分` };
    case 'age': return { chip: `${v}歳`, ja: `${v}歳` };
    case 'digits': return { chip: String(v).padStart(4, '0'), ja: String(v).padStart(4, '0') };
    default: return { chip: `${v}${unit}`, ja: `${v}${unit}` };
  }
}

const ok = (k: Kind, v: number): boolean => {
  if (!Number.isInteger(v) || v <= 0) return false;
  if (k === 'time') { const [h, m] = hm(v); return h >= 1 && h <= 12 && m < 60; }
  if (k === 'date') return v <= 31;
  if (k === 'digits') return v >= 1000 && v <= 9999;
  if (k === 'qty' || k === 'age') return v <= 99;
  if (k === 'yen') return v % 10 === 0;
  return true;
};

/** -teen ↔ -ty (14 ↔ 40), or null. */
const tt = (x: number): number | null => (x >= 13 && x <= 19 ? (x - 10) * 10 : x >= 30 && x <= 90 && x % 10 === 0 ? x / 10 + 10 : null);

/** The value's teen / -ty twin (a count's, a time's minutes, a price's dollars or last two digits), or null. */
function twin(k: Kind, v: number): number | null {
  if (k === 'time') { const [h, m] = hm(v), t = tt(m); return t !== null && t < 60 ? h * 60 + t : null; }
  if (k === 'usd') { const d = Math.floor(v / 100), t = tt(d); return t === null ? null : t * 100 + (v % 100); }
  if (k === 'yen') { const t = tt(v % 100); return t === null || v < 1000 ? null : v - (v % 100) + t; }
  if (k === 'digits') return null;
  const t = tt(v);
  return t !== null && ok(k, t) ? t : null;
}

/** Two neighbouring digits swapped (1,450 → 1,540; 4718 → 4178), none of them a leading zero. */
function swaps(k: Kind, v: number): number[] {
  if (k !== 'yen' && k !== 'digits' && k !== 'usd') return [];
  const ds = String(v), out: number[] = [];
  for (let j = 0; j + 1 < ds.length; j++) {
    if (ds[j] === ds[j + 1] || (j === 0 && ds[1] === '0')) continue;
    const s = ds.slice(0, j) + ds[j + 1] + ds[j] + ds.slice(j + 2);
    if (ok(k, +s)) out.push(+s);
  }
  return out;
}

/** Values close to v that an ear could take it for, or a hurried glance at the ticket. */
function near(k: Kind, v: number): number[] {
  const steps: Record<Kind, number[]> = {
    qty: [1, -1, 2, 10], num: [1, -1, 10, -10], mins: [5, -5, 10], age: [1, -1, 10], date: [1, -1, 10, -10],
    yen: [100, -100, 1000, 50], usd: [100, -100, 50, 1000], time: [15, -15, 30, 60, -60], digits: [1, 10, -10, 100]
  };
  return steps[k].map((d) => v + d).filter((x) => ok(k, x));
}

// ---------- the frames ----------

type Setting = 'cafe' | 'konbini' | 'ticket' | 'deli' | 'taxi' | 'pharmacy';
interface SettingInfo {
  ctx: string;
  scene?: string;
  conditions?: string[];
  seed: number;
  /** Ways a customer opens (en, ja), the empty one included. */
  hi: readonly (readonly [string, string])[];
}
const SETTINGS: Readonly<Record<Setting, SettingInfo>> = {
  cafe: { ctx: 'カフェのカウンターで注文を受けています', scene: 'cafe', conditions: ['cafe'], seed: 51,
    hi: [['Hi! ', 'こんにちは。'], ['Morning! ', 'おはようございます。'], ['Hey there. ', 'どうも。'], ['', '']] },
  konbini: { ctx: 'コンビニのレジに、お客さんが来ました', conditions: ['cafe'], seed: 24,
    hi: [['Hi. ', 'こんにちは。'], ['Excuse me. ', 'すみません。'], ['Um, hi. ', 'あの、こんにちは。'], ['', '']] },
  ticket: { ctx: '駅のきっぷ売り場の窓口です', scene: 'platform', conditions: ['station'], seed: 5,
    hi: [['Hi. ', 'こんにちは。'], ['Excuse me. ', 'すみません。'], ['Good morning. ', 'おはようございます。'], ['', '']] },
  deli: { ctx: '旅行先のアメリカのデリで注文を受けます', scene: 'cafe', conditions: ['cafe'], seed: 27,
    hi: [['Hi! ', 'こんにちは。'], ["Hey, how's it going? ", 'やあ、調子どう？'], ['So, um, ', 'ええと、'], ['', '']] },
  taxi: { ctx: 'タクシー乗り場の受付で、行き先を聞きます', scene: 'street', seed: 4,
    hi: [['Hi. ', 'こんにちは。'], ['Excuse me. ', 'すみません。'], ['Hi, sorry. ', 'すみません、'], ['', '']] },
  pharmacy: { ctx: '薬局のカウンターで、薬を渡す係です', scene: 'pharmacy', seed: 13,
    hi: [['Hi. ', 'こんにちは。'], ['Hello. ', 'こんにちは。'], ['Hi there. ', 'どうも。'], ['', '']] }
};

/** The correction cues (en said, its Japanese gloss for 解説). */
type Cue = readonly [en: string, ja: string];
const CUES = {
  makeThat: ['make that', 'やっぱり〜に'], mean: ['I mean', 'つまり〜'], sorry: ['sorry', 'ごめん、〜'], noWait: ['no, wait', 'いや、待って'],
  actually: ['actually', 'やっぱり'], scratch: ['scratch that', '今のはなし'], hangOn: ['hang on', 'ちょっと待って'], didISay: ['did I say', '〜って言った？'],
  makeIt: ['make it', 'やっぱり〜に'], oh: ['oh', 'あ、〜'], neverMind: ['never mind', 'やっぱりいい'], except: ['except', '〜をのぞいて']
} as const satisfies Record<string, Cue>;

/** A frame: one setting's order with its number (`n`, the ticket's answer), as said plain (`en`) and with a slip first
 *  (`fix`: `w` said, then corrected to `n`), and another number in the line (`o`, a distractor when of the same kind). */
interface Frame {
  id: string;
  at: Setting;
  kind: Kind;
  /** The ticket's unit (a count's 杯, a number's 番, a date's month). */
  unit?: string;
  /** What the ticket asks (UI copy: kanji, spaces between phrases). */
  ask: string;
  ctx?: string;
  /** The values n is drawn from. */
  pool: readonly number[];
  /** Another number said in the line, from n (its kind: `okind`, else the frame's), and whether the line corrects itself. */
  o?: (n: number, r: () => number, fixed: boolean) => number;
  okind?: Kind;
  /** o's unit when it's of another kind (a count's 人). */
  ounit?: string;
  /** The values a slip or a distractor is drawn from, in place of the near ones (sizes, card amounts). */
  alts?: readonly number[];
  /** What o is, in Japanese, for 解説 ("大人の 人数"). */
  oja?: string;
  en: (n: string, o: string, x: Said) => string;
  fix: (w: string, n: string, o: string, x: Said) => string;
  cue: Cue;
  ja: (n: string, o: string, x: Said) => string;
  jaFix: (w: string, n: string, o: string, x: Said) => string;
  // ---- はまべ, やま and ほし (HAMA, YAMA, HOSHI below); KAWA and MORI use none of these ----
  /** How a value is put in words, when not as written ("a quarter to six", "half a dozen"); undefined: as written. */
  say?: (v: number, k: Kind) => { en: string; tts: string } | undefined;
  /** The values n is drawn from when the line corrects itself (ほし: the sum works out either way). */
  poolFix?: readonly number[];
  /** The value said before the correction, when it follows from n (half of "double that"), not a near value. */
  slip?: (n: number, o: number | undefined) => number;
  /** The ticket's other chips, in order, before the near values (the numbers said, a sum misheard). */
  chips?: (n: number, o: number | undefined, w: number | undefined) => readonly number[];
  /** 解説 (≤ 90 字), from the ticket's values in Japanese (w '' without a correction), when the frame's trick needs saying. */
  why?: (n: string, o: string, w: string, x: Said) => string;
  /** The note (≤ 40 字), when the frame's trick needs saying. */
  note?: string | ((fixed: boolean) => string);
  /** Features beyond the numbers (an idiom: a dozen; ellipsis: a four for now). */
  feat?: readonly string[];
}

/** A line's values as numbers, and a value said as the line says it (en, tts) or as the ticket reads it (ja). */
interface Said {
  n: number;
  o: number;
  w: number;
  say: (v: number, k?: Kind) => string;
}

const pick = <T,>(xs: readonly T[], r: () => number): T => xs[Math.floor(r() * xs.length)];
const T = (h: number, m: number) => h * 60 + m;
const times = (...hm: [number, number][]) => hm.map(([h, m]) => T(h, m));
const TEENS = [13, 14, 15, 16, 17, 18, 19];

/** かわ (S1): one number a line, short orders, plain corrections. */
const KAWA: readonly Frame[] = [
  // the café
  { id: 'latte', at: 'cafe', kind: 'qty', unit: '杯', ask: 'アイスラテは 何杯？', pool: [2, 3, 4, 5, 6],
    en: (n) => `Can I get ${n} iced lattes, please?`, fix: (w, n) => `Can I get ${w} iced lattes? Oh, actually, make that ${n}.`, cue: CUES.makeThat,
    ja: (n) => `アイスラテを${n}ください。`, jaFix: (w, n) => `アイスラテを${w}…あ、やっぱり${n}で。` },
  { id: 'table', at: 'cafe', kind: 'num', unit: '番', ask: 'テーブルは 何番？', pool: [...TEENS, 30, 40, 50],
    en: (n) => `We're at table ${n}. Could we get some more water?`, fix: (w, n) => `We're at table ${w}. Sorry, I mean ${n}. Could we get some more water?`, cue: CUES.mean,
    ja: (n) => `${n}テーブルです。お水をもう少しもらえますか？`, jaFix: (w, n) => `${w}テーブル…いえ、${n}です。お水をもう少しもらえますか？` },
  { id: 'cake', at: 'cafe', kind: 'time', ask: 'ケーキの 受け取りは 何時？', pool: times([2, 15], [3, 30], [4, 15], [5, 40], [6, 15], [11, 30], [1, 45], [3, 50]),
    en: (n) => `I'd like to order a birthday cake. Can I pick it up at ${n} tomorrow?`, fix: (w, n) => `I'd like to order a birthday cake. Can I pick it up at ${w} tomorrow? No, wait. ${n}. I work till five.`, cue: CUES.noWait,
    ja: (n) => `誕生日ケーキを注文したいんです。明日の${n}に受け取れますか？`, jaFix: (w, n) => `誕生日ケーキを注文したいんです。明日の${w}に…いや、待って、${n}で。5時まで仕事なので。` },
  { id: 'scones', at: 'cafe', kind: 'qty', unit: '個', ask: 'スコーンは いくつ？', pool: [...TEENS, 20, 30, 40],
    en: (n) => `Could I get ${n} scones to go? They're for the whole office.`, fix: (w, n) => `Could I get ${w} scones to go? Sorry, ${n}. They're for the whole office.`, cue: CUES.sorry,
    ja: (n) => `スコーンを${n}、持ち帰りでもらえますか？職場のみんなの分なんです。`, jaFix: (w, n) => `スコーンを${w}…ごめんなさい、${n}で。持ち帰りで、職場のみんなの分です。` },
  { id: 'bread', at: 'cafe', kind: 'yen', ask: 'バナナブレッドは いくら？', pool: [380, 420, 450, 480, 520, 550],
    en: (n) => `The banana bread is ${n}, right? I'll take a slice.`, fix: (w, n) => `The banana bread is ${w}, right? Oh, ${n}. Sorry, I read it wrong. I'll take a slice.`, cue: CUES.sorry,
    ja: (n) => `バナナブレッドは${n}ですよね？1切れください。`, jaFix: (w, n) => `バナナブレッドは${w}ですよね？あ、${n}か。見間違えました。1切れください。` },
  // the konbini
  { id: 'stamps', at: 'konbini', kind: 'qty', unit: '枚', ask: '切手は 何枚？', pool: [2, 3, 5, 6, 10, 15, 50],
    en: (n) => `Can I get ${n} stamps for postcards?`, fix: (w, n) => `Can I get ${w} stamps for postcards? Actually, make that ${n}.`, cue: CUES.makeThat,
    ja: (n) => `はがき用の切手を${n}ください。`, jaFix: (w, n) => `はがき用の切手を${w}…やっぱり${n}にします。` },
  { id: 'bill', at: 'konbini', kind: 'yen', ask: '支払いは いくら？', pool: [2760, 3480, 4150, 5300, 6840, 1980, 4620],
    en: (n) => `I'd like to pay this bill. It's ${n}.`, fix: (w, n) => `I'd like to pay this bill. It's ${w}. Oh, no, ${n}. Sorry.`, cue: CUES.sorry,
    ja: (n) => `この請求書を払いたいんです。${n}です。`, jaFix: (w, n) => `この請求書を払いたいんです。${w}…あ、違う、${n}です。すみません。` },
  { id: 'copies', at: 'konbini', kind: 'qty', unit: '枚', ask: 'コピーは 何枚？', pool: [...TEENS, 30, 40, 50],
    en: (n) => `I need ${n} copies of this. Black and white is fine.`, fix: (w, n) => `I need ${w} copies of this. Hang on, ${n}. Black and white is fine.`, cue: CUES.hangOn,
    ja: (n) => `これを${n}コピーしたいです。白黒でいいです。`, jaFix: (w, n) => `これを${w}…ちょっと待って、${n}コピーです。白黒でいいです。` },
  { id: 'card', alts: [1000, 1500, 2000, 3000, 5000, 10000, 15000], at: 'konbini', kind: 'yen', ask: 'カードは いくら分？', pool: [1500, 3000, 5000, 10000, 2000, 1000],
    en: (n) => `Can I get one of those gift cards? ${n}, please.`, fix: (w, n) => `Can I get one of those gift cards? ${w}. Actually, let's do ${n}.`, cue: CUES.actually,
    ja: (n) => `そのギフトカードを1枚ください。${n}分で。`, jaFix: (w, n) => `そのギフトカードを1枚ください。${w}…やっぱり${n}分にします。` },
  { id: 'parcel', at: 'konbini', kind: 'date', unit: '', ask: '何日に 届けたい？', pool: [3, 13, 14, 15, 16, 20, 23, 30],
    en: (n) => `I'm sending this box to my mom. Can it get there by the ${n}?`, fix: (w, n) => `I'm sending this box to my mom. Can it get there by the ${w}? No, wait, the ${n}. Her birthday's the ${n}.`, cue: CUES.noWait,
    ja: (n) => `母にこの箱を送りたいんです。${n}までに届きますか？`, jaFix: (w, n) => `母にこの箱を送りたいんです。${w}までに…いや、${n}です。誕生日が${n}なので。` },
  // the ticket window
  { id: 'nikko', at: 'ticket', kind: 'time', ask: '何時の 電車？', pool: times([7, 40], [8, 15], [9, 30], [10, 50], [11, 15], [1, 40], [2, 30]),
    en: (n) => `Two tickets for the ${n} to Nikko, please.`, fix: (w, n) => `Two tickets for the ${w} to Nikko, please. Oh, sorry, the ${n}.`, cue: CUES.sorry,
    ja: (n) => `日光行き、${n}の電車を2枚ください。`, jaFix: (w, n) => `日光行き、${w}の…あ、すみません、${n}の電車を2枚ください。` },
  { id: 'adults', at: 'ticket', kind: 'qty', unit: '人', ask: '大人は 何人？', pool: [2, 3, 4, 5], o: () => 1, oja: '子どもの数',
    en: (n, o) => `${cap(n)} adults and ${o} child to Kamakura, please.`, fix: (w, n, o) => `${cap(w)} adults and ${o} child to Kamakura, please. Actually, make that ${n} adults.`, cue: CUES.makeThat,
    ja: (n, o) => `鎌倉まで、大人${n}と子ども${o}でお願いします。`, jaFix: (w, n, o) => `鎌倉まで、大人${w}と子ども${o}…やっぱり大人は${n}で。` },
  { id: 'track', at: 'ticket', kind: 'num', unit: '番線', ask: '何番線？', pool: [3, 4, 5, 13, 14, 15, 16],
    en: (n) => `Is the train to Odawara still on track ${n}?`, fix: (w, n) => `Is the train to Odawara still on track ${w}? I mean track ${n}.`, cue: CUES.mean,
    ja: (n) => `小田原行きはまだ${n}ですか？`, jaFix: (w, n) => `小田原行きはまだ${w}…いや、${n}ですか？` },
  { id: 'car', at: 'ticket', kind: 'num', unit: '号車', ask: '何号車？', pool: [3, 5, 7, 8, 13, 14, 15, 16],
    en: (n) => `Could I get a window seat? In car ${n}, if you have one.`, fix: (w, n) => `Could I get a window seat? In car ${w}. No, wait, car ${n}, if you have one.`, cue: CUES.noWait,
    ja: (n) => `窓側の席はありますか？できれば${n}で。`, jaFix: (w, n) => `窓側の席はありますか？${w}…いや、できれば${n}で。` },
  { id: 'osaka', at: 'ticket', kind: 'date', ask: '帰りは 何日？', pool: [4, 13, 14, 15, 17, 19, 21, 30],
    en: (n) => `A round trip to Osaka, please. Coming back on the ${n}.`, fix: (w, n) => `A round trip to Osaka, please. Coming back on the ${w}. Oh, actually, the ${n}.`, cue: CUES.actually,
    ja: (n) => `大阪まで往復でお願いします。帰りは${n}です。`, jaFix: (w, n) => `大阪まで往復でお願いします。帰りは${w}…あ、やっぱり${n}です。` },
  // the deli, on a trip
  { id: 'menu', at: 'deli', kind: 'num', unit: '番', ask: 'メニューの 何番？', pool: [...TEENS, 30, 40, 50],
    en: (n) => `I'll have the number ${n}, the turkey club.`, fix: (w, n) => `I'll have the number ${w}. Oh, sorry, the number ${n}, the turkey club.`, cue: CUES.sorry,
    ja: (n) => `${n}の、ターキークラブをください。`, jaFix: (w, n) => `${w}…あ、ごめん、${n}のターキークラブで。` },
  { id: 'bagels', at: 'deli', kind: 'qty', unit: '個', ask: 'ベーグルは いくつ？', pool: [3, 4, 5, 6, 8],
    en: (n) => `Can I get ${n} everything bagels?`, fix: (w, n) => `Can I get ${w} everything bagels? Actually, make that ${n}.`, cue: CUES.makeThat,
    ja: (n) => `エブリシングベーグルを${n}ください。`, jaFix: (w, n) => `エブリシングベーグルを${w}…やっぱり${n}で。` },
  { id: 'soup', at: 'deli', kind: 'usd', ask: 'スープは いくら？', pool: [650, 725, 850, 1350, 1450, 1625],
    en: (n) => `The soup's ${n}, right? Okay, I'll take a large.`, fix: (w, n) => `The soup's ${w}, right? Oh, ${n}. Okay, I'll take a large.`, cue: CUES.sorry,
    ja: (n) => `スープは${n}だよね？じゃあLサイズで。`, jaFix: (w, n) => `スープは${w}だよね？あ、${n}か。じゃあLサイズで。` },
  { id: 'pickup', at: 'deli', kind: 'time', ask: '受け取りは 何時？', pool: times([11, 30], [12, 15], [12, 40], [1, 15], [5, 30], [6, 15]),
    en: (n) => `I called in an order for pickup at ${n}. The name's Lee.`, fix: (w, n) => `I called in an order for pickup at ${w}. I mean ${n}. The name's Lee.`, cue: CUES.mean,
    ja: (n) => `${n}受け取りで電話注文した、リーです。`, jaFix: (w, n) => `${w}…いや、${n}受け取りで電話注文した、リーです。` },
  { id: 'platter', at: 'deli', kind: 'qty', unit: '人分', ask: '何人分？', pool: [...TEENS, 30, 40],
    en: (n) => `We need a party platter for ${n} people on Saturday.`, fix: (w, n) => `We need a party platter for ${w} people on Saturday. Sorry, ${n}.`, cue: CUES.sorry,
    ja: (n) => `土曜日に、${n}のパーティー用の盛り合わせがほしいんです。`, jaFix: (w, n) => `土曜日に、${w}…すみません、${n}のパーティー用の盛り合わせを。` },
  // the taxi stand
  { id: 'cash', alts: [1000, 1500, 2000, 2500, 3000, 4000, 5000, 10000], at: 'taxi', kind: 'yen', ask: '手持ちは いくら？', pool: [2000, 2500, 3000, 4000, 5000],
    en: (n) => `How much is it to Roppongi? I only have ${n} on me.`, fix: (w, n) => `How much is it to Roppongi? I only have ${w} on me. Oh, wait, ${n}.`, cue: CUES.noWait,
    ja: (n) => `六本木までいくらですか？手持ちが${n}しかなくて。`, jaFix: (w, n) => `六本木までいくらですか？手持ちが${w}…あ、待って、${n}しかなくて。` },
  { id: 'station', at: 'taxi', kind: 'time', ask: '何時までに 着きたい？', pool: times([6, 15], [6, 40], [7, 30], [8, 15], [9, 50], [4, 30]),
    en: (n) => `I need to be at Tokyo Station by ${n}. Is that okay?`, fix: (w, n) => `I need to be at Tokyo Station by ${w}. No, sorry, ${n}. Is that okay?`, cue: CUES.sorry,
    ja: (n) => `${n}までに東京駅に着きたいんですが、大丈夫ですか？`, jaFix: (w, n) => `${w}までに…いえ、${n}までに東京駅に着きたいんですが、大丈夫ですか？` },
  { id: 'people', at: 'taxi', kind: 'qty', unit: '人', ask: '何人？', pool: [3, 4, 5, 6],
    en: (n) => `There are ${n} of us, plus a stroller. Do you have a bigger car?`, fix: (w, n) => `There are ${w} of us, plus a stroller. Hang on, ${n}. Do you have a bigger car?`, cue: CUES.hangOn,
    ja: (n) => `${n}で、ベビーカーもあります。大きめの車はありますか？`, jaFix: (w, n) => `${w}…ちょっと待って、${n}で、ベビーカーもあります。大きめの車はありますか？` },
  { id: 'gate', at: 'taxi', kind: 'num', unit: '番ゲート', ask: '何番 ゲート？', pool: [...TEENS, 30, 40, 50],
    en: (n) => `Can you drop us at gate ${n} of the stadium?`, fix: (w, n) => `Can you drop us at gate ${w} of the stadium? Sorry, gate ${n}.`, cue: CUES.sorry,
    ja: (n) => `スタジアムの${n}で降ろしてもらえますか？`, jaFix: (w, n) => `スタジアムの${w}…すみません、${n}で降ろしてもらえますか？` },
  { id: 'book', at: 'taxi', kind: 'time', ask: '予約は 何時？', pool: times([5, 30], [5, 45], [6, 15], [6, 50], [7, 15], [4, 40]),
    en: (n) => `Can I book a taxi for ${n} tomorrow morning?`, fix: (w, n) => `Can I book a taxi for ${w} tomorrow morning? Actually, ${n}. Just to be safe.`, cue: CUES.actually,
    ja: (n) => `明日の朝${n}にタクシーを予約できますか？`, jaFix: (w, n) => `明日の朝${w}に…やっぱり${n}にタクシーを予約できますか？念のため。` },
  // the pharmacy
  { id: 'ready', at: 'pharmacy', kind: 'time', ask: '何時に できる 予定？', pool: times([3, 15], [3, 50], [4, 30], [4, 40], [5, 15], [2, 30]),
    en: (n) => `Hi, the doctor said my prescription would be ready at ${n}.`, fix: (w, n) => `The doctor said my prescription would be ready at ${w}. Oh, wait, it was ${n}.`, cue: CUES.noWait,
    ja: (n) => `お医者さんが、処方薬は${n}にできると言っていました。`, jaFix: (w, n) => `お医者さんが、処方薬は${w}に…あ、待って、${n}だったかな。` },
  { id: 'birthday', at: 'pharmacy', kind: 'date', unit: '3月', ask: '生年月日は 3月 何日？', pool: [3, 13, 14, 15, 16, 23, 30],
    en: (n) => `Sure. My date of birth is March ${n}.`, fix: (w, n) => `Sure. My date of birth is March ${w}. Sorry, March ${n}.`, cue: CUES.sorry,
    ja: (n) => `はい、生年月日は${n}です。`, jaFix: (w, n) => `はい、生年月日は${w}…すみません、${n}です。` },
  { id: 'supply', alts: [7, 14, 15, 28, 30, 40, 50, 60, 90], at: 'pharmacy', kind: 'qty', unit: '日分', ask: '何日分？', pool: [14, 15, 28, 30, 60, 90],
    en: (n) => `It should be a ${n}-day supply, right?`, fix: (w, n) => `It should be a ${w}-day supply, right? No, wait, ${n} days.`, cue: CUES.noWait,
    ja: (n) => `${n}の薬のはずですよね？`, jaFix: (w, n) => `${w}…いや、待って、${n}の薬のはずですよね？` },
  { id: 'tablets', alts: [1, 2, 3, 4, 6], at: 'pharmacy', kind: 'qty', unit: '錠', ask: '1日 何錠？', pool: [1, 2, 3, 4],
    en: (n) => `So I take ${n} a day, right?`, fix: (w, n) => `So I take ${w} a day, right? Oh, ${n}. I mixed it up.`, cue: CUES.sorry,
    ja: (n) => `じゃあ、1日${n}飲めばいいんですよね？`, jaFix: (w, n) => `じゃあ、1日${w}…あ、${n}ですね。勘違いしてました。` },
  { id: 'copay', at: 'pharmacy', kind: 'yen', ask: '支払いは いくら？', pool: [860, 1240, 1380, 1520, 2140, 940],
    en: (n) => `It's ${n} with my insurance? Great, thanks.`, fix: (w, n) => `It's ${w} with my insurance? Oh, ${n}. Even better. Thanks.`, cue: CUES.sorry,
    ja: (n) => `保険を使って${n}ですか？よかった、ありがとう。`, jaFix: (w, n) => `保険を使って${w}…あ、${n}ですか。もっといいですね。ありがとう。` }
];

/** もり (S2): longer lines, two numbers where one is asked, casual corrections. */
const MORI: readonly Frame[] = [
  // the café
  { id: 'capps', at: 'cafe', kind: 'qty', unit: '杯', ask: 'カプチーノは 何杯？', pool: [2, 3, 4, 5], o: (n, r) => pick([1, 2, 3, 4, 5].filter((x) => x !== n), r), oja: 'ラテの数',
    en: (n, o) => `Can I get ${o} lattes and ${n} cappuccinos? The cappuccinos are for my coworkers.`, fix: (w, n, o) => `Can I get ${o} lattes and ${w} cappuccinos? Wait, scratch that, ${n} cappuccinos.`, cue: CUES.scratch,
    ja: (n, o) => `ラテ${o}とカプチーノ${n}ください。カプチーノは同僚の分です。`, jaFix: (w, n, o) => `ラテ${o}とカプチーノ${w}…いや、今のはなし、カプチーノは${n}で。` },
  { id: 'checkin', at: 'cafe', kind: 'num', unit: '番', ask: 'テーブルは 何番？', pool: [...TEENS, 30, 40, 50], o: () => 20, okind: 'mins',
    en: (n, o) => `Hey, um, we ordered about ${o} minutes ago. Table ${n}? Just checking.`, fix: (w, n, o) => `Hey, um, we ordered about ${o} minutes ago. Table ${w}. Wait, no, we moved. Table ${n}.`, cue: CUES.noWait,
    ja: (n, o) => `あの、${o}くらい前に注文したんですけど。${n}テーブルです。念のため。`, jaFix: (w, n, o) => `あの、${o}くらい前に注文したんですけど。${w}…いや、席を移ったんだ。${n}テーブルです。` },
  { id: 'resv', ounit: '人', at: 'cafe', kind: 'time', ask: '予約は 何時？', pool: times([6, 30], [6, 45], [7, 15], [7, 50], [8, 15], [12, 30]), o: (_n, r) => pick([4, 5, 6, 8], r), okind: 'qty',
    en: (n, o) => `I'm gonna need a table for ${o} at ${n} tonight, under Tanaka.`, fix: (w, n, o) => `I'm gonna need a table for ${o} at ${w} tonight. Actually, can we do ${n}? Under Tanaka.`, cue: CUES.actually,
    ja: (n, o) => `今夜${n}に${o}で席をお願いしたいんです。田中で。`, jaFix: (w, n, o) => `今夜${w}に${o}で…やっぱり${n}にできますか？田中で。` },
  { id: 'beans', alts: [150, 200, 250, 300, 500], at: 'cafe', kind: 'num', unit: 'グラム', ask: '豆は 何グラム？', pool: [150, 200, 250, 300, 500],
    en: (n) => `I'll take a bag of the house blend, too. The ${n}-gram one.`, fix: (w, n) => `I'll take a bag of the house blend, too. The ${w}-gram one. Hmm, no, let's do ${n}.`, cue: CUES.noWait,
    ja: (n) => `ハウスブレンドの豆も1袋ください。${n}のを。`, jaFix: (w, n) => `ハウスブレンドの豆も1袋ください。${w}の…うーん、やっぱり${n}で。` },
  { id: 'lunch', at: 'cafe', kind: 'yen', ask: 'ランチセットは いくら？', pool: [980, 1150, 1280, 1350, 1480, 1650], o: (n) => n + 200,
    oja: 'ドリンク付きの値段', en: (n, o) => `The lunch set's ${n}, and it's ${o} with a drink? Okay, just the set, then.`, fix: (w, n, o) => `The lunch set's ${w}... oh, no, ${n}. I misread it. And ${o} with a drink? Okay, just the set.`, cue: CUES.sorry,
    ja: (n, o) => `ランチセットは${n}で、ドリンク付きだと${o}？じゃあセットだけで。`, jaFix: (w, n, o) => `ランチセットは${w}…あ、違う、${n}か。見間違えた。ドリンク付きで${o}？じゃあセットだけで。` },
  // the konbini
  { id: 'track4', at: 'konbini', kind: 'digits', ask: '番号の 下4けたは？', pool: [4718, 3062, 8154, 2749, 5306, 7193, 6480],
    en: (n) => `I'm here to pick up a package. The tracking number ends in ${n}.`, fix: (w, n) => `I'm here to pick up a package. The tracking number ends in ${w}. Sorry, lemme check. ${n}.`, cue: CUES.sorry,
    ja: (n) => `荷物を受け取りに来ました。追跡番号の下4けたは${n}です。`, jaFix: (w, n) => `荷物を受け取りに来ました。追跡番号の下4けたは${w}…すみません、確認します。${n}です。` },
  { id: 'suica', alts: [1000, 1500, 2000, 3000, 4000, 5000, 10000], at: 'konbini', kind: 'yen', ask: 'チャージは いくら？', pool: [1500, 2000, 3000, 5000, 4000],
    en: (n) => `Could I put ${n} on my Suica card? And can I get a receipt?`, fix: (w, n) => `Could I put ${w} on my Suica card? Actually, let's do ${n}. And can I get a receipt?`, cue: CUES.actually,
    ja: (n) => `Suicaに${n}チャージできますか？レシートもください。`, jaFix: (w, n) => `Suicaに${w}…やっぱり${n}チャージで。レシートもください。` },
  { id: 'bento', at: 'konbini', kind: 'qty', unit: '個', ask: 'お弁当は いくつ？', pool: [2, 3, 4, 5, 6], o: (_n, r) => pick([480, 550, 598, 650], r), okind: 'yen',
    en: (n, o) => `Do you have ${n} more of the ${o.replace(' yen', '-yen')} bentos? The chicken ones?`, fix: (w, n, o) => `Do you have ${w} more of the ${o.replace(' yen', '-yen')} bentos? Hang on, my boss said ${n}. The chicken ones?`, cue: CUES.hangOn,
    ja: (n, o) => `${o}のお弁当、あと${n}ありますか？チキンのです。`, jaFix: (w, n, o) => `${o}のお弁当、あと${w}…待って、上司は${n}って。チキンのです。` },
  { id: 'concert', at: 'konbini', kind: 'date', ask: '第一希望は 何日？', pool: [13, 14, 15, 16, 21, 22], o: (n) => n + 2, oja: '第二希望の日',
    en: (n, o) => `I wanna print a concert ticket. I'd like the ${n}, but if that's sold out, the ${o} works too.`, fix: (w, n, o) => `I wanna print a concert ticket. I'd like the ${w}. No, sorry, the ${n}. If that's sold out, the ${o} works.`, cue: CUES.sorry,
    ja: (n, o) => `コンサートのチケットを発券したいんです。${n}がいいけど、売り切れなら${o}でも。`, jaFix: (w, n, o) => `コンサートのチケットを発券したいんです。${w}…いや、${n}がいいです。売り切れなら${o}で。` },
  { id: 'cod', at: 'konbini', kind: 'yen', ask: '代金は いくら？', pool: [3240, 4380, 5160, 2870, 6430],
    en: (n) => `I'm paying for an online order. It says ${n}, cash.`, fix: (w, n) => `I'm paying for an online order. It says ${w}. Wait, did I say ${w}? It's ${n}.`, cue: CUES.didISay,
    ja: (n) => `ネット注文の支払いです。${n}、現金で。`, jaFix: (w, n) => `ネット注文の支払いです。${w}…あれ、${w}って言った？${n}です。` },
  // the ticket window
  { id: 'hakone', at: 'ticket', kind: 'time', ask: '第一希望は 何時？', pool: times([8, 15], [8, 40], [9, 15], [9, 50], [10, 30], [1, 15]), o: (n) => n + 30, oja: '満席のときの時間',
    en: (n, o) => `Two adults on the ${n} to Hakone, please. If it's full, the ${o} works too.`, fix: (w, n, o) => `Two adults on the ${w} to Hakone. Oh, no, the ${n}. If it's full, the ${o} works too.`, cue: CUES.noWait,
    ja: (n, o) => `箱根行き、${n}の電車に大人2枚。満席なら${o}でもいいです。`, jaFix: (w, n, o) => `箱根行き、${w}の…いや、${n}の電車に大人2枚。満席なら${o}でも。` },
  { id: 'kids', at: 'ticket', kind: 'qty', unit: '人', ask: '子どもは 何人？', pool: [2, 3, 4, 5], o: (n, r) => pick([2, 3, 4].filter((x) => x !== n), r), oja: '大人の数',
    en: (n, o) => `${cap(o)} adults and ${n} kids, please. The kids are all under twelve.`, fix: (w, n, o) => `${cap(o)} adults and ${w} kids, please. No, wait, ${n} kids. They're all under twelve.`, cue: CUES.noWait,
    ja: (n, o) => `大人${o}、子ども${n}でお願いします。子どもは全員12歳未満です。`, jaFix: (w, n, o) => `大人${o}、子ども${w}…いや、待って、子どもは${n}。全員12歳未満です。` },
  { id: 'lasttrain', at: 'ticket', kind: 'time', ask: '最終は 何時？', pool: times([11, 15], [11, 40], [10, 50], [12, 15], [11, 30]),
    en: (n) => `What time's the last train back? Is it ${n}? I don't wanna miss it.`, fix: (w, n) => `What time's the last train back? Is it ${w}? Oh, it says ${n} up there. Okay.`, cue: CUES.sorry,
    ja: (n) => `帰りの終電は何時ですか？${n}ですか？乗り遅れたくなくて。`, jaFix: (w, n) => `帰りの終電は何時ですか？${w}？あ、あそこに${n}って書いてある。了解です。` },
  { id: 'show', at: 'ticket', kind: 'qty', unit: '枚', ask: 'チケットは 何枚？', pool: [2, 3, 4, 5, 6], o: (_n, r) => pick(times([2, 30], [4, 15], [6, 40], [7, 30]), r), okind: 'time',
    en: (n, o) => `We need ${n} tickets for the ${o} show at the planetarium.`, fix: (w, n, o) => `We need ${w} tickets for the ${o} show at the planetarium. Actually, make it ${n}. My sister's coming.`, cue: CUES.makeThat,
    ja: (n, o) => `プラネタリウムの${o}の回を${n}ください。`, jaFix: (w, n, o) => `プラネタリウムの${o}の回を${w}…やっぱり${n}で。姉も来るので。` },
  { id: 'return', at: 'ticket', kind: 'date', ask: '帰りは 何日？', pool: [13, 14, 15, 16, 18, 20], o: (n) => n - 4, oja: '行きの日',
    en: (n, o) => `A round trip to Kanazawa. Going out on the ${o}, coming back on the ${n}.`, fix: (w, n, o) => `A round trip to Kanazawa. Going out on the ${o}, coming back on the ${w}. Sorry, the ${n}.`, cue: CUES.sorry,
    ja: (n, o) => `金沢まで往復で。行きは${o}、帰りは${n}です。`, jaFix: (w, n, o) => `金沢まで往復で。行きは${o}、帰りは${w}…すみません、${n}です。` },
  // the deli, on a trip
  { id: 'twenty', at: 'deli', kind: 'usd', ask: '合計は いくら？', pool: [1350, 1475, 1625, 1740, 1899, 1590], o: () => 2000, oja: '出したお札',
    en: (n) => `So that's ${n}? Here's a twenty. Keep the change.`, fix: (w, n) => `So that's ${w}? Oh, ${n}. Here's a twenty. Keep the change.`, cue: CUES.sorry,
    ja: (n) => `じゃあ${n}だね？20ドル札で。おつりはいいよ。`, jaFix: (w, n) => `じゃあ${w}？あ、${n}か。20ドル札で。おつりはいいよ。` },
  { id: 'onions', at: 'deli', kind: 'num', unit: '番', ask: '玉ねぎ抜きは 何番？', pool: [4, 5, 7, 8, 9, 12], o: (n, r) => pick([3, 6, 10, 11, 14].filter((x) => x !== n), r), oja: 'もう1つの注文',
    en: (n, o) => `Can I get a number ${o} and a number ${n}? And no onions on the ${n}, please.`, fix: (w, n, o) => `Can I get a number ${o} and a number ${w}? Scratch that, a number ${n}. No onions on the ${n}, please.`, cue: CUES.scratch,
    ja: (n, o) => `${o}と${n}をください。${n}は玉ねぎ抜きで。`, jaFix: (w, n, o) => `${o}と${w}…今のなし、${n}で。${n}は玉ねぎ抜きで。` },
  { id: 'sliced', at: 'deli', kind: 'qty', unit: '個', ask: 'スライスは いくつ？', pool: [3, 4, 5, 6], o: () => 12, oja: '全部の数（1ダース）',
    en: (n) => `A dozen bagels, please, and could you slice ${n} of them?`, fix: (w, n) => `A dozen bagels, please, and could you slice ${w} of them? Actually, make that ${n}.`, cue: CUES.makeThat,
    ja: (n) => `ベーグルを1ダース、そのうち${n}はスライスしてもらえますか？`, jaFix: (w, n) => `ベーグルを1ダース、そのうち${w}…やっぱり${n}をスライスしてもらえますか？` },
  { id: 'kim', at: 'deli', kind: 'time', ask: '受け取りは 何時？', pool: times([12, 15], [12, 30], [12, 50], [1, 15], [5, 40], [6, 15]),
    en: (n) => `I've got an order under Kim for pickup at ${n}. Is it ready yet?`, fix: (w, n) => `I've got an order under Kim for pickup at ${w}. Wait, did I say ${w}? I meant ${n}. Is it ready?`, cue: CUES.didISay,
    ja: (n) => `キムで、${n}受け取りの注文があるんだけど。もうできてる？`, jaFix: (w, n) => `キムで、${w}…あれ、${w}って言った？${n}受け取りの注文です。できてる？` },
  { id: 'large', at: 'deli', kind: 'usd', ask: 'Lサイズは いくら？', pool: [850, 925, 1350, 1450, 1575], o: (n) => n - 200, oja: 'Mサイズの値段',
    en: (n, o) => `The large is ${n} and the medium's ${o}, right? I'll do the large.`, fix: (w, n, o) => `The large is ${w}... no, ${n}, and the medium's ${o}, right? I'll do the large.`, cue: CUES.noWait,
    ja: (n, o) => `Lが${n}で、Mが${o}だよね？Lにする。`, jaFix: (w, n, o) => `Lが${w}…いや、${n}で、Mが${o}だよね？Lにする。` },
  // the taxi stand
  { id: 'shibuya', alts: [1000, 1500, 2000, 2500, 3000, 4000, 5000], at: 'taxi', kind: 'yen', ask: '現金は いくら ある？', pool: [2000, 3000, 4000, 2500], o: (n) => n + 1000, oja: '渋谷までの運賃の目安',
    en: (n, o) => `It's about ${o} to Shibuya, right? I've only got ${n} in cash. Can I pay the rest by card?`, fix: (w, n, o) => `It's about ${o} to Shibuya, right? I've only got ${w}, hang on, ${n} in cash. Can I pay the rest by card?`, cue: CUES.hangOn,
    ja: (n, o) => `渋谷まで${o}くらいですよね？現金が${n}しかないんです。残りはカードでいいですか？`, jaFix: (w, n, o) => `渋谷まで${o}くらいですよね？現金が${w}…待って、${n}しかないんです。残りはカードで？` },
  { id: 'haneda', at: 'taxi', kind: 'time', ask: '何時までに 羽田？', pool: times([5, 30], [6, 15], [6, 40], [7, 15], [7, 50]), o: (n) => n + 90, oja: '飛行機の時間',
    en: (n, o) => `We need to be at Haneda by ${n}. Our flight's at ${o}.`, fix: (w, n, o) => `We need to be at Haneda by ${w}. No, actually, ${n}. Our flight's at ${o}.`, cue: CUES.actually,
    ja: (n, o) => `${n}までに羽田に着かないと。飛行機は${o}なんです。`, jaFix: (w, n, o) => `${w}までに…いや、やっぱり${n}までに羽田に。飛行機は${o}なんです。` },
  { id: 'stop', at: 'taxi', kind: 'mins', ask: '寄り道は 何分？', pool: [5, 10, 13, 14, 15, 20, 30],
    en: (n) => `Could we stop at a pharmacy on the way? It'll take ${n} minutes, tops.`, fix: (w, n) => `Could we stop at a pharmacy on the way? It'll take ${w}, I mean ${n} minutes, tops.`, cue: CUES.mean,
    ja: (n) => `途中で薬局に寄ってもらえますか？長くても${n}です。`, jaFix: (w, n) => `途中で薬局に寄ってもらえますか？${w}…いや、長くても${n}です。` },
  { id: 'exit', at: 'taxi', kind: 'num', unit: '番ゲート', ask: '何番 ゲート？', pool: [...TEENS, 30, 40, 50],
    en: (n) => `Not the main entrance. Gate ${n}. My friends are waiting at gate ${n}.`, fix: (w, n) => `Not the main entrance. Gate ${w}. Oh, sorry, ${n}. My friends are waiting at gate ${n}.`, cue: CUES.sorry,
    ja: (n) => `正面入口じゃなくて${n}です。友だちが${n}で待ってるので。`, jaFix: (w, n) => `正面入口じゃなくて${w}…あ、すみません、${n}です。友だちがそこで待ってるので。` },
  { id: 'airport', at: 'taxi', kind: 'time', ask: '迎えは 何時？', pool: times([4, 50], [5, 15], [5, 40], [6, 15], [6, 30]), o: (_n, r) => pick([13, 14, 15, 16], r), okind: 'date',
    en: (n, o) => `Can I book a car for ${n} on the ${o}? It's for the airport.`, fix: (w, n, o) => `Can I book a car for ${w} on the ${o}? Scratch that, ${n}. It's for the airport.`, cue: CUES.scratch,
    ja: (n, o) => `${o}の${n}に車を予約できますか？空港に行くんです。`, jaFix: (w, n, o) => `${o}の${w}に…今のなし、${n}に。空港に行くんです。` },
  // the pharmacy
  { id: 'mom', at: 'pharmacy', kind: 'date', unit: '11月', ask: '母の 誕生日は 11月 何日？', pool: [3, 13, 14, 15, 16, 30],
    en: (n) => `I'm picking up for my mom. Her birthday's November ${n}, 1954.`, fix: (w, n) => `I'm picking up for my mom. Her birthday's November ${w}... no, wait, the ${n}, 1954.`, cue: CUES.noWait,
    ja: (n) => `母の薬を受け取りに来ました。誕生日は1954年11月${n}です。`, jaFix: (w, n) => `母の薬を受け取りに来ました。誕生日は${w}…いや、待って、1954年${n}です。` },
  { id: 'morning', at: 'pharmacy', kind: 'qty', unit: '錠', ask: '朝は 何錠？', pool: [1, 2, 3], o: (n) => (n === 1 ? 2 : 1), oja: '夜の数',
    en: (n, o) => `The doctor said ${n} in the morning and ${o} at night. Is that what the label says?`, fix: (w, n, o) => `The doctor said ${w} in the morning. Wait, no, ${n} in the morning and ${o} at night. Is that right?`, cue: CUES.noWait,
    ja: (n, o) => `お医者さんは朝${n}、夜${o}って言ってました。ラベルもそうなってますか？`, jaFix: (w, n, o) => `お医者さんは朝${w}…いや、朝${n}、夜${o}って。合ってますか？` },
  { id: 'lasttime', at: 'pharmacy', kind: 'yen', ask: '今日の 支払いは？', pool: [1240, 1380, 1460, 1720, 980], o: (n) => n + 300, oja: '前回の値段',
    en: (n, o) => `It's ${n} today? Last time it was ${o}. Did something change?`, fix: (w, n, o) => `It's ${w} today? Oh, ${n}, sorry. Last time it was ${o}. Did something change?`, cue: CUES.sorry,
    ja: (n, o) => `今日は${n}ですか？前は${o}でした。何か変わったんですか？`, jaFix: (w, n, o) => `今日は${w}？あ、${n}か、すみません。前は${o}でした。何か変わったんですか？` },
  { id: 'trip', at: 'pharmacy', kind: 'qty', unit: '日分', ask: '何日分？', pool: [14, 30, 60, 90], o: (n, r) => pick([10, 16, 20, 40].filter((x) => x !== n), r), oja: '旅行の日数',
    en: (n, o) => `It's a ${n}-day supply, right? I'm traveling for ${o} days, so I just wanna be sure.`, fix: (w, n, o) => `It's a ${w}-day supply, right? Oh, ${n}. I'm traveling for ${o} days, so I just wanna be sure.`, cue: CUES.sorry,
    ja: (n, o) => `${n}ですよね？${o.replace('分', '間')}旅行するので、確かめたくて。`, jaFix: (w, n, o) => `${w}ですよね？あ、${n}か。${o.replace('分', '間')}旅行するので、確かめたくて。` },
  { id: 'son', at: 'pharmacy', kind: 'age', ask: '息子さんは 何歳？', pool: [3, 4, 6, 7, 13, 14, 15],
    en: (n) => `It's for my son. He's ${n}. Is the children's dose okay for him?`, fix: (w, n) => `It's for my son. He's ${w}. Sorry, ${n}. Is the children's dose okay for him?`, cue: CUES.sorry,
    ja: (n) => `息子の薬です。${n}です。子ども用の量で大丈夫ですか？`, jaFix: (w, n) => `息子の薬です。${w}…すみません、${n}です。子ども用の量で大丈夫ですか？` }
];

// ---------- はまべ, やま, ほし ----------

/** A clock time the way it's often said: "a quarter after six", "half past six", "a quarter to seven" (all: also "ten
 *  after", "twenty to"…); undefined at other minutes (said as written). */
function clock(v: number, all = false): { en: string; tts: string } | undefined {
  const [h, m] = hm(v), now = numberWords(h), next = numberWords((h % 12) + 1);
  const quarter: Record<number, string> = { 15: `a quarter after ${now}`, 30: `half past ${now}`, 45: `a quarter to ${next}` };
  const more: Record<number, string> = { 10: `ten after ${now}`, 20: `twenty after ${now}`, 40: `twenty to ${next}`, 50: `ten to ${next}` };
  const w = quarter[m] ?? (all ? more[m] : undefined);
  return w ? { en: w, tts: w } : undefined;
}
const byClock = (v: number, k: Kind) => (k === 'time' ? clock(v) : undefined);
const byClockAll = (v: number, k: Kind) => (k === 'time' ? clock(v, true) : undefined);
/** A clock time in English for 解説: as the line says it. */
const clockEn = (v: number, all = false) => clock(v, all)?.en ?? said('time', v).en;
/** A count by the dozen, and its Japanese. */
const DOZEN: Readonly<Record<number, readonly [string, string]>> = {
  6: ['half a dozen', '半ダース'], 12: ['a dozen', '1ダース'], 13: ["a baker's dozen", '13個'], 18: ['a dozen and a half', '1ダース半'],
  24: ['two dozen', '2ダース'], 36: ['three dozen', '3ダース']
};
const byDozen = (v: number, k: Kind) => (k === 'qty' && DOZEN[v] ? { en: DOZEN[v][0], tts: DOZEN[v][0] } : undefined);
const dozJa = (v: number, ja: string) => DOZEN[v]?.[1] ?? ja;
const CLOCK_NOTE = 'quarter は15分。to は「前」、after は「過ぎ」';
/** The kids' ages on a fare (ほし zfares) by how many are twelve or older, three pairs each. */
const FARE_AGES: readonly (readonly [number, number][])[] = [[[7, 10], [8, 11], [6, 9]], [[10, 13], [11, 14], [9, 15]], [[12, 15], [13, 16], [14, 17]]];
const MINS: Readonly<Record<number, string>> = { 15: 'a quarter of an hour', 30: 'half an hour', 45: 'three quarters of an hour', 90: 'an hour and a half' };

/** はまべ (S0): one number a line, said clearly in a short order; about one in five corrects itself, plainly. */
const HAMA: readonly Frame[] = [
  // the café
  { id: 'hcoffee', at: 'cafe', kind: 'qty', unit: '杯', ask: 'コーヒーは 何杯？', pool: [2, 3, 4, 5, 6],
    en: (n) => `${cap(n)} small coffees, please.`, fix: (w, n) => `${cap(w)} small coffees, please. Oh, sorry, ${n}.`, cue: CUES.sorry,
    ja: (n) => `コーヒーのSを${n}ください。`, jaFix: (w, n) => `コーヒーのSを${w}…あ、すみません、${n}で。` },
  { id: 'hmuffins', at: 'cafe', kind: 'qty', unit: '個', ask: 'マフィンは いくつ？', pool: [2, 3, 4, 5, 6, 8],
    en: (n) => `Can I have ${n} blueberry muffins?`, fix: (w, n) => `Can I have ${w} blueberry muffins? No, wait, ${n}.`, cue: CUES.noWait,
    ja: (n) => `ブルーベリーマフィンを${n}もらえますか？`, jaFix: (w, n) => `ブルーベリーマフィンを${w}…いや、待って、${n}で。` },
  { id: 'hcheesecake', at: 'cafe', kind: 'yen', ask: 'チーズケーキは いくら？', pool: [380, 420, 450, 480, 520, 560],
    en: (n) => `How much is the cheesecake? Oh, ${n}. I'll have that.`, fix: (w, n) => `How much is the cheesecake? Oh, ${w}. No, wait, ${n}. I'll have that.`, cue: CUES.noWait,
    ja: (n) => `チーズケーキはいくらですか？あ、${n}。それをください。`, jaFix: (w, n) => `チーズケーキはいくらですか？あ、${w}。いや、${n}だ。それをください。` },
  { id: 'horder', at: 'cafe', kind: 'num', unit: '番', ask: '注文番号は？', pool: [...TEENS, 30, 40, 50],
    en: (n) => `My order number is ${n}.`, fix: (w, n) => `My order number is ${w}. Sorry, I mean ${n}.`, cue: CUES.mean,
    ja: (n) => `注文番号は${n}です。`, jaFix: (w, n) => `注文番号は${w}…すみません、${n}です。` },
  { id: 'hclose', at: 'cafe', kind: 'time', ask: '何時に 閉まる？', pool: times([8, 30], [9, 15], [9, 30], [9, 40], [10, 15], [7, 30]),
    en: (n) => `Do you close at ${n} today?`, fix: (w, n) => `Do you close at ${w} today? Oh, sorry, ${n}. I read the sign wrong.`, cue: CUES.sorry,
    ja: (n) => `今日は${n}閉店ですか？`, jaFix: (w, n) => `今日は${w}閉店ですか？あ、すみません、${n}ですね。看板を読み間違えました。` },
  // the konbini
  { id: 'hriceballs', at: 'konbini', kind: 'qty', unit: '個', ask: 'おにぎりは いくつ？', pool: [2, 3, 4, 5, 6],
    en: (n) => `${cap(n)} rice balls, please. The salmon ones.`, fix: (w, n) => `${cap(w)} rice balls, please. Sorry, ${n}. The salmon ones.`, cue: CUES.sorry,
    ja: (n) => `おにぎりを${n}ください。鮭のを。`, jaFix: (w, n) => `おにぎりを${w}…すみません、${n}で。鮭のを。` },
  { id: 'humbrella', at: 'konbini', kind: 'yen', ask: '傘は いくら？', pool: [500, 600, 700, 800, 900, 1200],
    en: (n) => `Is this umbrella ${n}? I'll take it.`, fix: (w, n) => `Is this umbrella ${w}? Oh, no, ${n}. I'll take it.`, cue: CUES.noWait,
    ja: (n) => `この傘は${n}ですか？これにします。`, jaFix: (w, n) => `この傘は${w}…あ、違う、${n}か。これにします。` },
  { id: 'hprints', at: 'konbini', kind: 'qty', unit: '枚', ask: '写真は 何枚？', pool: [...TEENS, 30, 40, 50],
    en: (n) => `I'd like to print ${n} photos.`, fix: (w, n) => `I'd like to print ${w} photos. Sorry, ${n}.`, cue: CUES.sorry,
    ja: (n) => `写真を${n}印刷したいです。`, jaFix: (w, n) => `写真を${w}…すみません、${n}印刷したいです。` },
  { id: 'hchicken', at: 'konbini', kind: 'qty', unit: '個', ask: 'チキンは いくつ？', pool: [2, 3, 4, 5, 6],
    en: (n) => `Can I get ${n} pieces of fried chicken?`, fix: (w, n) => `Can I get ${w} pieces of fried chicken? No, wait, ${n}.`, cue: CUES.noWait,
    ja: (n) => `フライドチキンを${n}ください。`, jaFix: (w, n) => `フライドチキンを${w}…いや、待って、${n}で。` },
  { id: 'hpickup', at: 'konbini', kind: 'digits', ask: '受け取り番号は？', pool: [2741, 3058, 4162, 5390, 6827, 7415, 8203],
    en: (n) => `I'm here for a package. The number is ${n}.`, fix: (w, n) => `I'm here for a package. The number is ${w}. Oh, sorry, ${n}.`, cue: CUES.sorry,
    ja: (n) => `荷物を受け取りに来ました。番号は${n}です。`, jaFix: (w, n) => `荷物を受け取りに来ました。番号は${w}…あ、すみません、${n}です。` },
  // the ticket window
  { id: 'hnara', at: 'ticket', kind: 'time', ask: '何時の バス？', ctx: 'バスの窓口でチケットを売っています', pool: times([8, 15], [9, 40], [10, 15], [11, 50], [1, 30], [2, 15], [4, 15]),
    en: (n) => `A ticket for the ${n} bus to Nara, please.`, fix: (w, n) => `A ticket for the ${w} bus to Nara, please. Sorry, the ${n}.`, cue: CUES.sorry,
    ja: (n) => `奈良行き${n}のバスのチケットを1枚ください。`, jaFix: (w, n) => `奈良行き${w}の…すみません、${n}のバスのチケットを1枚ください。` },
  { id: 'hyokohama', at: 'ticket', kind: 'qty', unit: '枚', ask: 'きっぷは 何枚？', pool: [2, 3, 4, 5, 6],
    en: (n) => `Can I get ${n} tickets to Yokohama?`, fix: (w, n) => `Can I get ${w} tickets to Yokohama? Oh, no, ${n}.`, cue: CUES.noWait,
    ja: (n) => `横浜までのきっぷを${n}ください。`, jaFix: (w, n) => `横浜までのきっぷを${w}…あ、いや、${n}で。` },
  { id: 'hplatform', at: 'ticket', kind: 'num', unit: '番線', ask: '何番線？', pool: [3, 4, 5, 6, 13, 14, 15, 16],
    en: (n) => `Which way is platform ${n}?`, fix: (w, n) => `Which way is platform ${w}? Sorry, I mean ${n}.`, cue: CUES.mean,
    ja: (n) => `${n}はどちらですか？`, jaFix: (w, n) => `${w}…すみません、${n}はどちらですか？` },
  { id: 'hdate', at: 'ticket', kind: 'date', unit: '', ask: '何日の きっぷ？', pool: [3, 4, 13, 14, 15, 16, 20, 30],
    en: (n) => `I'd like a ticket for the ${n}, please.`, fix: (w, n) => `I'd like a ticket for the ${w}. Sorry, the ${n}.`, cue: CUES.sorry,
    ja: (n) => `${n}のきっぷをください。`, jaFix: (w, n) => `${w}の…すみません、${n}のきっぷをください。` },
  { id: 'hstudent', at: 'ticket', kind: 'yen', ask: '学生は いくら？', ctx: '美術館の窓口でチケットを売っています', pool: [400, 500, 600, 800, 1000, 1200],
    en: (n) => `It's ${n} for students, right?`, fix: (w, n) => `It's ${w} for students, right? Oh, ${n}. Okay.`, cue: CUES.sorry,
    ja: (n) => `学生は${n}ですよね？`, jaFix: (w, n) => `学生は${w}…あ、${n}ですね。わかりました。` },
  // the deli, on a trip
  { id: 'hsandwich', at: 'deli', kind: 'usd', ask: 'サンドイッチは いくら？', pool: [650, 750, 825, 950, 1150, 1375],
    en: (n) => `This sandwich is ${n}? Okay, I'll take it.`, fix: (w, n) => `This sandwich is ${w}? Oh, sorry, ${n}. Okay, I'll take it.`, cue: CUES.sorry,
    ja: (n) => `このサンドイッチは${n}ですか？じゃあ、これで。`, jaFix: (w, n) => `このサンドイッチは${w}？あ、すみません、${n}か。じゃあ、これで。` },
  { id: 'hcookies', at: 'deli', kind: 'qty', unit: '枚', ask: 'クッキーは 何枚？', pool: [2, 3, 4, 5, 6],
    en: (n) => `${cap(n)} chocolate chip cookies, please.`, fix: (w, n) => `${cap(w)} chocolate chip cookies, please. No, wait, ${n}.`, cue: CUES.noWait,
    ja: (n) => `チョコチップクッキーを${n}ください。`, jaFix: (w, n) => `チョコチップクッキーを${w}…いや、待って、${n}で。` },
  { id: 'hwait', alts: [5, 10, 13, 15, 20, 30, 40, 50], at: 'deli', kind: 'mins', ask: '何分 待つ？', ctx: '旅行先のデリで、待ち時間を伝えました', pool: [5, 10, 13, 15, 20, 30, 40],
    en: (n) => `${cap(n)} minutes? Okay, I can wait.`, fix: (w, n) => `${cap(w)} minutes? Oh, ${n}. Okay, I can wait.`, cue: CUES.sorry,
    ja: (n) => `${n}ですか？じゃあ、待ちます。`, jaFix: (w, n) => `${w}ですか？あ、${n}か。じゃあ、待ちます。` },
  { id: 'hforks', at: 'deli', kind: 'qty', unit: '本', ask: 'フォークは 何本？', pool: [2, 3, 4, 5, 6],
    en: (n) => `Can I get ${n} forks, please?`, fix: (w, n) => `Can I get ${w} forks? Sorry, ${n}.`, cue: CUES.sorry,
    ja: (n) => `フォークを${n}もらえますか？`, jaFix: (w, n) => `フォークを${w}…すみません、${n}で。` },
  { id: 'htable', at: 'deli', kind: 'qty', unit: '人', ask: '何人の 席？', pool: [2, 3, 4, 5, 6],
    en: (n) => `Do you have a table for ${n}?`, fix: (w, n) => `Do you have a table for ${w}? Oh, sorry, ${n}.`, cue: CUES.sorry,
    ja: (n) => `${n}の席はありますか？`, jaFix: (w, n) => `${w}…あ、すみません、${n}の席はありますか？` },
  // the taxi stand
  { id: 'hfare', alts: [1000, 1500, 2000, 2500, 3000, 3500, 4000, 5000], at: 'taxi', kind: 'yen', ask: '運賃は いくらくらい？', pool: [1500, 2000, 2500, 3000, 3500, 4000],
    en: (n) => `Is it about ${n} to the station?`, fix: (w, n) => `Is it about ${w} to the station? Sorry, I mean ${n}.`, cue: CUES.mean,
    ja: (n) => `駅までだいたい${n}ですか？`, jaFix: (w, n) => `駅までだいたい${w}…すみません、${n}ですか？` },
  { id: 'hgroup', at: 'taxi', kind: 'qty', unit: '人', ask: '何人？', pool: [2, 3, 4, 5],
    en: (n) => `We're a group of ${n}. Can we all fit?`, fix: (w, n) => `We're a group of ${w}. No, wait, ${n}. Can we all fit?`, cue: CUES.noWait,
    ja: (n) => `${n}のグループです。全員乗れますか？`, jaFix: (w, n) => `${w}…いや、待って、${n}のグループです。全員乗れますか？` },
  { id: 'hhotel', at: 'taxi', kind: 'mins', ask: '何分 かかる？', pool: [10, 15, 20, 30, 40, 50],
    en: (n) => `It's about ${n} minutes to the hotel, right?`, fix: (w, n) => `It's about ${w} minutes to the hotel, right? Sorry, ${n}.`, cue: CUES.sorry,
    ja: (n) => `ホテルまで${n}くらいですよね？`, jaFix: (w, n) => `ホテルまで${w}…すみません、${n}くらいですよね？` },
  { id: 'hpickme', at: 'taxi', kind: 'time', ask: '何時に 迎え？', pool: times([5, 30], [6, 15], [6, 40], [7, 15], [7, 50], [8, 30]),
    en: (n) => `Can you pick me up at ${n}?`, fix: (w, n) => `Can you pick me up at ${w}? No, wait, ${n}.`, cue: CUES.noWait,
    ja: (n) => `${n}に迎えに来てもらえますか？`, jaFix: (w, n) => `${w}に…いや、待って、${n}に迎えに来てもらえますか？` },
  { id: 'hbags', at: 'taxi', kind: 'qty', unit: '個', ask: 'スーツケースは いくつ？', pool: [2, 3, 4, 5],
    en: (n) => `We have ${n} big suitcases.`, fix: (w, n) => `We have ${w} big suitcases. Sorry, ${n}.`, cue: CUES.sorry,
    ja: (n) => `大きいスーツケースが${n}あります。`, jaFix: (w, n) => `大きいスーツケースが${w}…すみません、${n}あります。` },
  // the pharmacy
  { id: 'hdays', at: 'pharmacy', kind: 'qty', unit: '日分', ask: '何日分？', pool: [3, 4, 5, 7, 10, 14],
    en: (n) => `I need medicine for ${n} days.`, fix: (w, n) => `I need medicine for ${w} days. Oh, sorry, ${n}.`, cue: CUES.sorry,
    ja: (n) => `${n}の薬がほしいです。`, jaFix: (w, n) => `${w}…あ、すみません、${n}の薬がほしいです。` },
  { id: 'hdaughter', at: 'pharmacy', kind: 'age', ask: '娘さんは 何歳？', pool: [3, 4, 5, 6, 13, 14, 15],
    en: (n) => `It's for my daughter. She's ${n}.`, fix: (w, n) => `It's for my daughter. She's ${w}. No, wait, ${n}.`, cue: CUES.noWait,
    ja: (n) => `娘の薬です。${n}です。`, jaFix: (w, n) => `娘の薬です。${w}…いや、待って、${n}です。` },
  { id: 'hpills', alts: [1, 2, 3, 4], at: 'pharmacy', kind: 'qty', unit: '錠', ask: '夕食の あとは 何錠？', pool: [1, 2, 3, 4],
    en: (n) => `So I take ${n} after dinner, right?`, fix: (w, n) => `So I take ${w} after dinner, right? Oh, sorry, ${n}.`, cue: CUES.sorry,
    ja: (n) => `じゃあ、夕食のあとに${n}ですね？`, jaFix: (w, n) => `じゃあ、夕食のあとに${w}…あ、すみません、${n}ですね？` },
  { id: 'hcold', at: 'pharmacy', kind: 'yen', ask: '風邪薬は いくら？', pool: [980, 1180, 1280, 1480, 1580, 1980],
    en: (n) => `Is this cold medicine ${n}?`, fix: (w, n) => `Is this cold medicine ${w}? Oh, sorry, ${n}.`, cue: CUES.sorry,
    ja: (n) => `この風邪薬は${n}ですか？`, jaFix: (w, n) => `この風邪薬は${w}…あ、すみません、${n}ですか？` },
  { id: 'hready', at: 'pharmacy', kind: 'time', ask: '何時に また 来る？', pool: times([2, 15], [3, 30], [4, 15], [4, 40], [5, 30], [6, 15]),
    en: (n) => `So I can come back at ${n}?`, fix: (w, n) => `So I can come back at ${w}? Sorry, ${n}?`, cue: CUES.sorry,
    ja: (n) => `じゃあ、${n}にまた来ればいいですか？`, jaFix: (w, n) => `じゃあ、${w}に…すみません、${n}にまた来ればいいですか？` }
];

/** やま (S3): fast orders with two or three numbers, the asked one never said first; a correction with its reason;
 *  dollars and cents; times said as "a quarter to six". */
const YAMA: readonly Frame[] = [
  // the café
  { id: 'ymuffins', at: 'cafe', kind: 'qty', unit: '個', ounit: '杯', ask: 'マフィンは いくつ？', pool: [3, 4, 5, 6], slip: (n) => n - 1, o: (n, r) => pick([2, 3, 4].filter((v) => v !== n && v !== n - 1), r),
    en: (n, o) => `Can I get ${o} large cold brews and ${n} blueberry muffins? They're for the office.`,
    fix: (w, n, o) => `Can I get ${o} large cold brews and ${w} blueberry muffins? Actually, make it ${n}. My sister's meeting me here.`, cue: CUES.makeIt,
    ja: (n, _o, x) => `コールドブリューのLを${x.say(x.o, 'num')}と、ブルーベリーマフィンを${n}ください。会社の分です。`,
    jaFix: (w, n, _o, x) => `コールドブリューのLを${x.say(x.o, 'num')}と、ブルーベリーマフィンを${w}…やっぱり${n}で。妹がここに来るので。`,
    why: (n, _o, w, x) => w ? `${w}から Actually, make it で${n}に言い直し。理由は妹が来るから。${x.say(x.o, 'num')}はコールドブリュー。` : `マフィンは${n}。先に言った${x.say(x.o, 'num')}はコールドブリューの数。large はサイズ。` },
  { id: 'ybrunch', at: 'cafe', kind: 'time', say: byClock, ask: 'ほかの 人は 何時に 来る？', pool: times([11, 15], [11, 45], [12, 15], [12, 30], [1, 15], [1, 45]), slip: (n) => n - 15,
    o: (_n, r) => pick([2, 3, 4], r), okind: 'qty', ounit: '人',
    en: (n, o) => `A table for ${o} for now, please. The rest of our group gets here at ${n}.`,
    fix: (w, n, o) => `A table for ${o} for now, please. The rest of our group gets here at ${w}. Actually, ${n}. Their train's running late.`, cue: CUES.actually,
    ja: (n, o) => `とりあえず${o}の席をお願いします。ほかのメンバーは${n}に来ます。`, jaFix: (w, n, o) => `とりあえず${o}の席をお願いします。ほかのメンバーは${w}に…いえ、${n}です。電車が遅れているので。`,
    why: (n, o, w, x) => w ? `${w}から Actually で${n}に言い直し。電車が遅れているから。${o}は今いる人数。` : `「${clockEn(x.n)}」は${n}。${o}は今いる人数。`, note: CLOCK_NOTE },
  { id: 'ycake', at: 'cafe', kind: 'qty', unit: '人分', ask: 'ケーキは 何人分？', pool: [8, 10, 12, 14, 15, 16, 20], o: (_n, r) => pick([13, 14, 15, 16, 20, 21], r), okind: 'date', ounit: '',
    en: (n, o) => `I'd like to order a birthday cake for pickup on the ${o}. It's for ${n} people.`,
    fix: (w, n, o) => `I'd like to order a birthday cake for pickup on the ${o}. It's for ${w} people. Sorry, I mean ${n}. I counted wrong.`, cue: CUES.sorry,
    ja: (n, o) => `${o}受け取りで、誕生日ケーキを注文したいんです。${n}です。`, jaFix: (w, n, o) => `${o}受け取りで、誕生日ケーキを注文したいんです。${w}…すみません、${n}です。数え間違えました。` },
  { id: 'yiced', at: 'cafe', kind: 'qty', unit: '杯', ask: 'アイスは 何杯？', pool: [1, 2, 3], o: (n) => 5 - n, slip: (n) => n + 1, chips: () => [5],
    en: (n, o) => `Five drinks altogether: ${o} hot lattes, and the other ${n} iced.`,
    fix: (w, n, o) => `Five drinks altogether: ${o} hot lattes and ${w} iced. Wait, that's six. ${cap(n)} iced, then.`, cue: CUES.noWait,
    ja: (n, o) => `全部で5杯。ホットラテを${o}、残りの${n}はアイスで。`, jaFix: (w, n, o) => `全部で5杯。ホットラテ${o}とアイス${w}…あ、それだと6杯だ。アイスは${n}で。`,
    why: (n, o, w) => w ? `ホット${o}とアイス${w}では6杯になるので、アイスを${n}に直した。全部で5杯。` : `全部で5杯のうち、ホットが${o}。残り（the other）の${n}がアイス。`,
    note: '全部で5杯。ホットの数を引いて考える' },
  { id: 'yclose', at: 'cafe', kind: 'time', say: byClock, ask: '何時に 閉まる？', pool: times([8, 45], [9, 15], [9, 30], [9, 45], [10, 15], [8, 30]),
    o: (_n, r) => pick([15, 20, 30, 40], r), okind: 'mins',
    en: (n, o) => `So we've got about ${o} minutes? You close at ${n}, right?`,
    fix: (w, n, o) => `You close at ${w}, right? Oh, the sign says ${n}. So we've got about ${o} minutes.`, cue: CUES.oh,
    ja: (n, o) => `あと${o}くらいですか？${n}閉店ですよね？`, jaFix: (w, n, o) => `${w}閉店ですよね？あ、看板には${n}って。じゃあ、あと${o}くらいか。`,
    why: (n, o, w, x) => w ? `${w}と言ってから、看板を見て${n}に言い直し。${o}は残りの時間。` : `「${clockEn(x.n)}」は${n}。${o}は残りの時間。`, note: CLOCK_NOTE },
  // the konbini
  { id: 'ytopup', alts: [1000, 2000, 3000, 4000, 5000, 10000], at: 'konbini', kind: 'yen', ask: 'チャージは いくら？', pool: [2000, 3000, 4000, 5000], slip: (n) => n - 1000,
    o: (_n, r) => pick([120, 340, 580, 760, 910], r), oja: 'カードの残高',
    en: (n, o) => `There's only ${o} left on my Suica. Can you put ${n} on it?`,
    fix: (w, n, o) => `There's only ${o} left on my Suica. Can you put ${w} on it? Actually, ${n}. I'm going all the way to Narita.`, cue: CUES.actually,
    ja: (n, o) => `Suicaの残りが${o}しかないんです。${n}チャージしてもらえますか？`, jaFix: (w, n, o) => `Suicaの残りが${o}しかないんです。${w}…やっぱり${n}チャージで。成田まで行くので。` },
  { id: 'ybox', at: 'konbini', kind: 'yen', ask: '大きい 箱は いくら？', ctx: 'コンビニで、宅配便の受付をしています', pool: [1150, 1380, 1460, 1720, 1860, 2030], o: (n) => n - 400, oja: '小さい箱の値段',
    en: (n, o) => `So it's ${o} for the small box, and ${n} for the big one? I'll go with the big one.`,
    fix: (w, n, o) => `So it's ${o} for the small box, and ${w} for the big one? Oh, ${n}. I misread it. The big one, please.`, cue: CUES.oh,
    ja: (n, o) => `小さい箱が${o}で、大きい箱が${n}ですか？大きいほうにします。`, jaFix: (w, n, o) => `小さい箱が${o}で、大きい箱が${w}？あ、${n}か。見間違えました。大きいほうで。` },
  { id: 'ytax', at: 'konbini', kind: 'yen', ask: '税込みで いくら？', pool: [330, 440, 550, 660, 770, 880], o: (n) => Math.round(n / 1.1), oja: '税抜きの値段',
    en: (n, o) => `It says ${o} on the shelf, so it's ${n} with tax? Okay, that's fine.`,
    fix: (w, n, o) => `It says ${o} on the shelf, so with tax it's ${w}? Oh, ${n}. Okay, that's fine.`, cue: CUES.oh,
    ja: (n, o) => `棚には${o}って書いてあるから、税込みで${n}ですか？それでいいです。`, jaFix: (w, n, o) => `棚には${o}って書いてあるから、税込みで${w}？あ、${n}か。それでいいです。` },
  { id: 'ycopies', at: 'konbini', kind: 'qty', unit: '枚', ounit: '部', ask: '地図は 何枚？', pool: [...TEENS, 20, 30], o: (_n, r) => pick([2, 3, 4, 5], r), oja: '両面コピーの数',
    en: (n, o) => `I need ${o} copies of this, double-sided, and ${n} of the map, in color.`,
    fix: (w, n, o) => `I need ${o} copies of this, double-sided, and ${w} of the map. No, ${n} of the map. One for each family.`, cue: CUES.noWait,
    ja: (n, _o, x) => `これを両面で${x.say(x.o, 'num')}、地図はカラーで${n}コピーしたいです。`, jaFix: (w, n, _o, x) => `これを両面で${x.say(x.o, 'num')}、地図は${w}…いや、${n}です。1家族に1枚ずつなので。`,
    why: (n, _o, w, x) => w ? `地図は${w}から No で${n}に言い直し。1家族に1枚ずつだから。${x.say(x.o, 'num')}は両面コピーの数。` : `地図は${n}。先に言った${x.say(x.o, 'num')}は両面コピーの数。` },
  { id: 'ydiff', at: 'konbini', kind: 'yen', ask: 'きのう いくら 払った？', pool: [480, 650, 880, 1080, 1290], o: (n) => n - 100, oja: '今日の値段',
    en: (n, o) => `It's ${o} today, but I paid ${n} for it yesterday. Can I get the difference back?`,
    fix: (w, n, o) => `It's ${o} today, but I paid ${w} for it yesterday. No, sorry, ${n}. Can I get the difference back?`, cue: CUES.sorry,
    ja: (n, o) => `今日は${o}なのに、きのう${n}で買ったんです。差額を返してもらえますか？`, jaFix: (w, n, o) => `今日は${o}なのに、きのう${w}…いえ、すみません、${n}で買ったんです。差額を返してもらえますか？` },
  // the ticket window
  { id: 'ynagoya', at: 'ticket', kind: 'time', say: byClock, ask: '何時の 電車？', pool: times([10, 45], [11, 15], [11, 45], [12, 15], [1, 45], [2, 15]), o: (n) => n - 25, slip: (n) => n - 30,
    en: (n, o) => `Two to Nagoya, please. The ${o}'s full, so the one at ${n}.`,
    fix: (w, n, o) => `Two to Nagoya, please. The ${o}'s full, so the one at ${w}. No, wait, ${n}. We need lunch first.`, cue: CUES.noWait,
    ja: (n, o) => `名古屋まで2枚。${o}のは満席なので、${n}のにします。`, jaFix: (w, n, o) => `名古屋まで2枚。${o}のは満席なので、${w}の…いや、待って、${n}ので。先にお昼を食べたいので。`,
    why: (n, o, w, x) => w ? `${w}から No, wait で${n}に言い直し。お昼を食べたいから。${o}は満席の電車。` : `「${clockEn(x.n)}」は${n}。${o}は満席の電車。`, note: CLOCK_NOTE },
  { id: 'yseniors', at: 'ticket', kind: 'qty', unit: '人', ask: 'シニアは 何人？', pool: [3, 4, 5], o: (n, r) => pick([2, 3, 4].filter((v) => v !== n), r), slip: (n) => n - 1, chips: () => [2], oja: '大人の数',
    en: (n, o) => `${cap(o)} adults, two kids, and ${n} seniors to Nikko, please.`,
    fix: (w, n, o) => `${cap(o)} adults, two kids, and ${w} seniors to Nikko. Sorry, ${n}. My aunt decided to come.`, cue: CUES.sorry,
    ja: (n, o) => `日光まで、大人${o}、子ども2人、シニア${n}でお願いします。`, jaFix: (w, n, o) => `日光まで、大人${o}、子ども2人、シニア${w}…すみません、${n}で。おばも来ることになったので。` },
  { id: 'ytrack', at: 'ticket', kind: 'num', unit: '番線', ask: '何番線？', pool: [3, 4, 5, 6, 13, 14, 15, 16], o: (_n, r) => pick(times([9, 10], [10, 40], [11, 20], [1, 50], [3, 5]), r), okind: 'time',
    en: (n, o) => `So the ${o} to Kamakura goes from track ${n}?`,
    fix: (w, n, o) => `So the ${o} to Kamakura goes from track ${w}? Oh, they moved it to ${n}. Thanks.`, cue: CUES.oh,
    ja: (n, o) => `${o}の鎌倉行きは${n}から出るんですね？`, jaFix: (w, n, o) => `${o}の鎌倉行きは${w}…あ、${n}に変わったんですね。どうも。` },
  { id: 'yseats', at: 'ticket', kind: 'qty', unit: '枚', ask: '席は 何枚？', pool: [3, 4, 5, 6], slip: (n) => n - 1, o: (_n, r) => pick([5, 7, 8, 11, 12], r), okind: 'num', ounit: '号車',
    en: (n, o) => `Car ${o}, if possible. We need ${n} seats together.`,
    fix: (w, n, o) => `Car ${o}, if possible. We need ${w} seats together. Make that ${n}. My friend just texted, she's coming.`, cue: CUES.makeThat,
    ja: (n, o) => `できれば${o}で、並びの席を${n}ください。`, jaFix: (w, n, o) => `できれば${o}で、並びの席を${w}…やっぱり${n}で。友だちも来るって連絡が来たので。` },
  { id: 'ykids', at: 'ticket', kind: 'yen', ask: '子どもは いくら？', ctx: '観光地の窓口でチケットを売っています', pool: [400, 500, 600, 700, 800], o: (n) => n * 2, oja: '大人の値段',
    en: (n, o) => `Adults are ${o}, and kids are ${n}? Okay, one of each.`,
    fix: (w, n, o) => `Adults are ${o}, and kids are ${w}? Oh, ${n}, I see. One of each, then.`, cue: CUES.oh,
    ja: (n, o) => `大人が${o}で、子どもが${n}ですか？じゃあ、1枚ずつ。`, jaFix: (w, n, o) => `大人が${o}で、子どもが${w}？あ、${n}ですね。じゃあ、1枚ずつ。` },
  // the deli, on a trip
  { id: 'ysplit', at: 'deli', kind: 'usd', ask: '自分の 分は いくら？', pool: [1240, 1375, 1460, 1525, 1690], o: (n) => n - 350, slip: (n) => n - 250, oja: '友だちの分',
    en: (n, o) => `Hers is ${o}, and mine's ${n}, since I got the soup too.`,
    fix: (w, n, o) => `Hers is ${o}, and mine's ${w}. No, ${n}. I forgot I got the soup.`, cue: CUES.noWait,
    ja: (n, o) => `彼女の分が${o}で、私の分は${n}。スープも頼んだので。`, jaFix: (w, n, o) => `彼女の分が${o}で、私の分は${w}…いや、${n}だ。スープを頼んだのを忘れてた。` },
  { id: 'ysesame', at: 'deli', kind: 'qty', unit: '個', ask: 'ごまベーグルは いくつ？', pool: [3, 4, 5, 6], slip: (n) => n - 1, o: (n, r) => pick([2, 3, 4].filter((v) => v !== n && v !== n - 1), r), oja: 'エブリシングベーグルの数',
    en: (n, o) => `Can I get ${o} everything bagels and ${n} sesame? And could you slice the sesame ones?`,
    fix: (w, n, o) => `Can I get ${o} everything bagels and ${w} sesame? Actually, ${n}. My roommate wants one too.`, cue: CUES.actually,
    ja: (n, o) => `エブリシングベーグルを${o}と、ごまを${n}。ごまのほうはスライスしてもらえますか？`, jaFix: (w, n, o) => `エブリシングベーグルを${o}と、ごまを${w}…やっぱり${n}で。ルームメイトも1つほしいって。` },
  { id: 'yswiss', at: 'deli', kind: 'qty', unit: '枚', ask: 'チーズは 何枚？', pool: [8, 10, 12, 14, 15, 16, 20], slip: (n) => n - 4,
    en: (n) => `A pound of turkey, and ${n} slices of the Swiss, please.`,
    fix: (w, n) => `A pound of turkey, and ${w} slices of the Swiss. No, ${n}. We're making sandwiches for the whole team.`, cue: CUES.noWait,
    ja: (n) => `ターキーを1ポンドと、スイスチーズのスライスを${n}ください。`, jaFix: (w, n) => `ターキーを1ポンドと、スイスチーズのスライスを${w}…いや、${n}。チーム全員のサンドイッチを作るので。` },
  { id: 'yrefills', alts: [125, 150, 175, 200, 250, 300], at: 'deli', kind: 'usd', ask: 'おかわりは いくら？', pool: [125, 150, 175, 200, 250], o: (n) => n + 225, oja: 'コーヒーの値段',
    en: (n, o) => `It's ${o} for a coffee, and refills are ${n}? That's not bad.`,
    fix: (w, n, o) => `It's ${o} for a coffee, and refills are ${w}? Oh, ${n}. That's not bad.`, cue: CUES.oh,
    ja: (n, o) => `コーヒーが${o}で、おかわりは${n}ですか？悪くないですね。`, jaFix: (w, n, o) => `コーヒーが${o}で、おかわりは${w}？あ、${n}か。悪くないですね。` },
  { id: 'ylunch', at: 'deli', kind: 'time', say: byClock, ask: '受け取りは 何時？', pool: times([11, 15], [11, 45], [12, 15], [12, 30], [1, 15], [5, 45]),
    o: (_n, r) => pick([12, 15, 18, 20, 24], r), okind: 'qty', ounit: '個',
    en: (n, o) => `I ordered ${o} sandwiches for the office. Can I pick them up at ${n}?`,
    fix: (w, n, o) => `I ordered ${o} sandwiches for the office. Can I pick them up at ${w}? Actually, ${n}. My meeting got moved.`, cue: CUES.actually,
    ja: (n, o) => `会社用にサンドイッチを${o}注文しました。${n}に受け取れますか？`, jaFix: (w, n, o) => `会社用にサンドイッチを${o}注文しました。${w}に…やっぱり${n}で。会議の時間が変わったので。`,
    why: (n, o, w, x) => w ? `${w}から Actually で${n}に言い直し。会議の時間が変わったから。${o}はサンドイッチの数。` : `「${clockEn(x.n)}」は${n}。${o}はサンドイッチの数。`, note: CLOCK_NOTE },
  // the taxi stand
  { id: 'yterminal', alts: [1, 2, 3, 4, 5], at: 'taxi', kind: 'num', unit: '', say: byClock, ask: '何番 ターミナル？', ctx: '空港行きのタクシー乗り場で案内しています', pool: [1, 2, 3],
    o: (_n, r) => pick(times([5, 45], [6, 15], [6, 45], [7, 15]), r), okind: 'time',
    en: (n, o) => `We need to be at the airport by ${o}. Terminal ${n}, please.`,
    fix: (w, n, o) => `Terminal ${w}, please. Wait, sorry, I was looking at the wrong ticket. Terminal ${n}. We need to be there by ${o}.`, cue: CUES.noWait,
    ja: (n, o) => `${o}までに空港に着きたいんです。第${n}ターミナルで。`, jaFix: (w, n, o) => `第${w}ターミナルまで。あ、待って、すみません、別のチケットを見てました。第${n}ターミナルです。${o}までに着きたいんです。`,
    why: (n, o, w, x) => w ? `第${w}から Wait, sorry で第${n}に言い直し。「${clockEn(x.o)}」は${o}で、番号ではない。` : `ターミナルは第${n}。「${clockEn(x.o)}」は${o}で、番号ではない。`, note: CLOCK_NOTE },
  { id: 'ytoll', at: 'taxi', kind: 'yen', ask: '高速代 込みで いくら？', pool: [4860, 5320, 6140, 7280, 8350], o: (n) => n - 720, oja: 'アプリの料金',
    en: (n, o) => `The app said ${o}, but with the highway toll it's ${n}? Okay.`,
    fix: (w, n, o) => `The app said ${o}, so with the toll it's ${w}? Oh, ${n}. Okay, card's fine.`, cue: CUES.oh,
    ja: (n, o) => `アプリでは${o}だったけど、高速代込みで${n}ですか？わかりました。`, jaFix: (w, n, o) => `アプリでは${o}だったから、高速代込みで${w}？あ、${n}か。カードで払います。` },
  { id: 'ysuitcases', at: 'taxi', kind: 'qty', unit: '人', ounit: '個', ask: '何人 乗る？', pool: [2, 3, 4, 5], slip: (n) => n + 1, o: (n, r) => pick([2, 3, 4, 5, 6].filter((v) => v !== n && v !== n + 1), r), oja: 'スーツケースの数',
    en: (n, o) => `We've got ${o} suitcases and ${n} people. Will that all fit?`,
    fix: (w, n, o) => `We've got ${o} suitcases and ${w} people. No, ${n}. My brother's taking the train.`, cue: CUES.noWait,
    ja: (n, _o, x) => `スーツケースが${x.say(x.o, 'num')}で、${n}です。全部乗りますか？`, jaFix: (w, n, _o, x) => `スーツケースが${x.say(x.o, 'num')}で、${w}…いや、${n}です。兄は電車で行くので。`,
    why: (n, _o, w, x) => w ? `${w}から No で${n}に言い直し。兄は電車だから。${x.say(x.o, 'num')}はスーツケース。` : `乗るのは${n}。先に言った${x.say(x.o, 'num')}はスーツケースの数。` },
  { id: 'ydinner', at: 'taxi', kind: 'time', say: byClock, ask: '予約は 何時？', pool: times([6, 45], [7, 15], [7, 30], [7, 45], [8, 15]), o: (n) => n - 25,
    en: (n, o) => `It's ${o} now, and our dinner's at ${n}. Can we make it?`,
    fix: (w, n, o) => `It's ${o} now, and our dinner's at ${w}. No, ${n}, I moved it. Can we make it?`, cue: CUES.noWait,
    ja: (n, o) => `今${o}で、ディナーの予約が${n}なんです。間に合いますか？`, jaFix: (w, n, o) => `今${o}で、ディナーの予約が${w}…いや、${n}に変えたんだ。間に合いますか？`,
    why: (n, o, w, x) => w ? `${w}から No で${n}に言い直し。予約を変えたから。${o}は今の時刻。` : `「${clockEn(x.n)}」は${n}。${o}は今の時刻。`, note: CLOCK_NOTE },
  { id: 'ywait', at: 'taxi', kind: 'mins', ask: '何分 待つ？', pool: [10, 15, 20], slip: (n) => n - 5, o: (_n, r) => pick([500, 1000], r), okind: 'yen',
    en: (n, o) => `I'll pay ${o} extra if you can wait ${n} minutes. I just need to grab my bags.`,
    fix: (w, n, o) => `I'll pay ${o} extra if you can wait ${w} minutes. Well, ${n}. The elevator's really slow.`, cue: CUES.noWait,
    ja: (n, o) => `${o}多く払うので、${n}待ってもらえますか？荷物を取ってくるだけなので。`, jaFix: (w, n, o) => `${o}多く払うので、${w}…いや、${n}待ってもらえますか？エレベーターがすごく遅くて。`,
    why: (n, o, w) => w ? `${w}と言ってから Well で${n}に言い直し。エレベーターが遅いから。${o}は追加の料金。` : `待つのは${n}。${o}は追加で払う料金。` },
  // the pharmacy
  { id: 'ycopay', at: 'pharmacy', kind: 'yen', ask: '保険ありで いくら？', pool: [860, 1240, 1380, 1520, 2140], o: (n) => Math.round(n / 0.3 / 10) * 10, oja: '保険なしの値段',
    en: (n, o) => `It's ${o} without insurance, but with my plan it comes to ${n}? Great.`,
    fix: (w, n, o) => `It's ${o} without insurance, but with my plan it's ${w}? Oh, ${n}. Even better.`, cue: CUES.oh,
    ja: (n, o) => `保険なしだと${o}で、私の保険だと${n}ですか？よかった。`, jaFix: (w, n, o) => `保険なしだと${o}で、私の保険だと${w}？あ、${n}か。もっといいですね。` },
  { id: 'ydrops', alts: [1, 2, 3, 4, 5, 6], at: 'pharmacy', kind: 'qty', unit: '回', ounit: '滴', ask: '1日 何回？', pool: [2, 3, 4, 5, 6], o: (n, r) => pick([1, 2].filter((v) => v !== n), r),
    en: (n, o) => `So it's ${o} drops in each eye, ${n} times a day, for a week?`,
    fix: (w, n, o) => `So it's ${o} drops in each eye, ${w} times a day? Oh, ${n}. Sorry, I read the label wrong.`, cue: CUES.oh,
    ja: (n, _o, x) => `じゃあ、両目に${x.say(x.o, 'num')}ずつ、1日${n}、1週間ですね？`, jaFix: (w, n, _o, x) => `じゃあ、両目に${x.say(x.o, 'num')}ずつ、1日${w}…あ、${n}ですね。ラベルを読み間違えました。`,
    why: (n, _o, w, x) => w ? `${w}から Oh で${n}に言い直し。${x.say(x.o, 'num')}は1回にさす数。` : `1日${n}（${numberWords(x.n)} times a day）。${x.say(x.o, 'num')}は1回にさす数。` },
  { id: 'yrefilldue', at: 'pharmacy', kind: 'date', unit: '', ask: '補充の 予定日は？', pool: [14, 15, 16, 18, 20, 21], o: (n) => n - 3, oja: '出かける日',
    en: (n, o) => `I'm away from the ${o}, and my refill's due on the ${n}. Can I get it early?`,
    fix: (w, n, o) => `I'm away from the ${o}, and my refill's due on the ${w}. No, the ${n}. I just checked the bottle.`, cue: CUES.noWait,
    ja: (n, o) => `${o}から出かけるんですが、薬の補充が${n}なんです。早めにもらえますか？`, jaFix: (w, n, o) => `${o}から出かけるんですが、薬の補充が${w}…いや、${n}です。今ボトルを見ました。` },
  { id: 'yhours', at: 'pharmacy', kind: 'time', say: byClock, ask: '何時まで 開いてる？', pool: times([8, 30], [8, 45], [9, 15], [9, 30], [9, 45]), o: (n) => n - 90,
    en: (n, o) => `I get off work at ${o}. You're open till ${n}, right?`,
    fix: (w, n, o) => `I get off work at ${o}. You're open till ${w}? Oh, ${n} on Fridays. Okay.`, cue: CUES.oh,
    ja: (n, o) => `仕事が${o}に終わるんです。${n}まで開いてますよね？`, jaFix: (w, n, o) => `仕事が${o}に終わるんです。${w}まで？あ、金曜は${n}までですね。わかりました。`,
    why: (n, o, w, x) => w ? `${w}と言ってから、金曜は${n}までと言い直し。${o}は仕事が終わる時刻。` : `「${clockEn(x.n)}」は${n}。${o}は仕事が終わる時刻。`, note: CLOCK_NOTE },
  { id: 'ygrandma', at: 'pharmacy', kind: 'age', ask: 'おばあさんは 何歳？', pool: [78, 81, 84, 86, 90], slip: (n) => n - 1, o: (_n, r) => pick([2, 3, 4], r), okind: 'qty', ounit: '種類',
    en: (n, o) => `It's for my grandmother. She takes ${o} other medicines, and she's ${n}. Is this safe for her?`,
    fix: (w, n, o) => `It's for my grandmother. She takes ${o} other medicines, and she's ${w}. Sorry, ${n}. She just had a birthday.`, cue: CUES.sorry,
    ja: (n, o) => `祖母の薬です。ほかに${o}の薬を飲んでいて、${n}です。これは大丈夫ですか？`, jaFix: (w, n, o) => `祖母の薬です。ほかに${o}の薬を飲んでいて、${w}…すみません、${n}です。誕生日が来たばかりで。` }
];

/** ほし (S4): the number is meant, not said: by the dozen, "all but one", "the one after that", split three ways, a
 *  week later, half off; a correction that changes the sum. */
const HOSHI: readonly Frame[] = [
  // the café
  { id: 'zlattes', at: 'cafe', kind: 'qty', unit: '杯', ask: 'カフェイン入りは 何杯？', pool: [2, 3, 4, 5], o: (n) => n + 2, slip: (n) => n - 1, chips: () => [2],
    en: (_n, o) => `${cap(o)} lattes, please, and make two of them decaf.`,
    fix: (_w, _n, o) => `${cap(o)} lattes, please, and make three of them decaf. Sorry, just two decaf.`, cue: CUES.sorry,
    ja: (_n, o) => `ラテを${o}、そのうち2杯はデカフェで。`, jaFix: (_w, _n, o) => `ラテを${o}、そのうち3杯をデカフェ…すみません、デカフェは2杯だけで。`,
    why: (n, o, w) => w ? `全部で${o}。デカフェを3杯から2杯に直したので、カフェイン入りは${n}。${w}は直す前。` : `全部で${o}、そのうち2杯がデカフェ。カフェイン入りは残りの${n}。`,
    note: 'カフェイン入り＝全部からデカフェを引いた数' },
  { id: 'zparty', at: 'cafe', kind: 'qty', unit: '人', ask: '何人の 席？', ctx: 'レストランの入り口で、案内係をしています', pool: [5, 6, 7, 8],
    o: (n, _r, fixed) => (fixed ? n : n + 2), slip: (n) => n - 2, chips: (n) => [n + 2, 2],
    en: (_n, o) => `We're a party of ${o}, but two are running late, so just a table for the rest of us for now.`,
    fix: (w, n, o) => `We're a party of ${o}, but two are running late, so a ${w} for now? Oh, never mind, they're parking. All ${n}.`, cue: CUES.neverMind,
    ja: (_n, o) => `${o}ですが、2人遅れているので、とりあえず今いる人の席で。`, jaFix: (w, n, o) => `${o}ですが、2人遅れているので、とりあえず${w}席で…あ、やっぱりいいです。今駐車しているそうです。${n}全員で。`,
    why: (n, o, w, x) => w ? `「a ${numberWords(x.w)}」は${w}席。never mind で取り消して、最後の All（全員）の${n}が答え。` : `${o}から遅れている2人を引いて${n}。the rest of us＝残りの人。`,
    note: (f) => (f ? 'never mind で取り消し。All＝全員' : 'the rest of us＝今いる残りの人'), feat: ['ellipsis'] },
  { id: 'zcoworkers', at: 'cafe', kind: 'qty', unit: '杯', ounit: '人', ask: 'カプチーノは 何杯？', pool: [3, 4, 5, 6], o: (n, _r, fixed) => (fixed ? n : n - 1), slip: (n) => n + 1,
    en: (_n, o) => `It's me and my ${o} coworkers, and we'll all have cappuccinos.`,
    fix: (_w, _n, o) => `It's me and my ${o} coworkers, cappuccinos all around. Oh, except Ken. He wants tea.`, cue: CUES.except,
    ja: (_n, _o, x) => `私と同僚${x.say(x.o, 'num')}で、みんなカプチーノにします。`, jaFix: (_w, _n, _o, x) => `私と同僚${x.say(x.o, 'num')}で、全員カプチーノ。あ、ケンは別。紅茶がいいって。`,
    why: (n, _o, w, x) => w ? `自分と同僚${x.say(x.o, 'num')}で${w}。でもケンは紅茶なので、1杯へって${n}。` : `「私と同僚${x.say(x.o, 'num')}」なので、自分を足して${n}。同僚だけなら1杯少ない。`,
    note: (f) => (f ? 'except＝〜をのぞいて。1杯へる' : 'me and my ～＝自分も入れて数える') },
  { id: 'zeach', at: 'cafe', kind: 'qty', unit: '個', ounit: '人', ask: 'お菓子は 全部で いくつ？', pool: [4, 6, 8, 10], poolFix: [2, 3, 4, 5],
    o: (n, _r, fixed) => (fixed ? n : n / 2), slip: (n) => n * 2,
    en: (_n, o) => `There are ${o} of us, and we'll each have a scone and a muffin.`,
    fix: (_w, _n, o) => `There are ${o} of us, and we'll each have a scone and a muffin. Actually, skip the muffins.`, cue: CUES.actually,
    ja: (_n, _o, x) => `${x.say(x.o, 'num')}です。1人ずつスコーンとマフィンを1つずつお願いします。`, jaFix: (_w, _n, _o, x) => `${x.say(x.o, 'num')}です。1人ずつスコーンとマフィンを…やっぱりマフィンはなしで。`,
    why: (n, _o, w, x) => w ? `${x.say(x.o, 'num')}が1つずつで${n}。マフィンもなら2つずつで${w}。skip＝やめる。` : `${x.say(x.o, 'num')}がそれぞれ（each）2つずつで${n}。`,
    note: 'each＝1人ずつ。人数×数で考える' },
  { id: 'zclose', at: 'cafe', kind: 'time', say: byClockAll, ask: '閉店は 何時？', pool: times([9, 10], [9, 40], [10, 10], [8, 40], [9, 20], [8, 50]),
    o: (n, _r, fixed) => (fixed ? n - 60 : n - 30), slip: (n) => n - 30, chips: (n) => [n + 30],
    en: (_n, o) => `It's ${o} now, and you close in half an hour? Then just a small latte to go.`,
    fix: (_w, _n, o) => `It's ${o} now, and you close in half an hour? Oh, an hour. Then we'll sit down.`, cue: CUES.oh,
    ja: (_n, o) => `今${o}で、閉店まであと30分ですか？じゃあ、Sのラテを持ち帰りで。`, jaFix: (_w, _n, o) => `今${o}で、閉店まであと30分？あ、1時間か。じゃあ、座っていきます。`,
    why: (n, o, w, x) => w ? `「${clockEn(x.o, true)}」は${o}。half an hour を an hour に直したので${n}。` : `「${clockEn(x.o, true)}」は${o}。その30分後（in half an hour）なので${n}。`,
    note: 'in ～＝～後。今の時刻に足す' },
  // the konbini
  { id: 'ztopup', at: 'konbini', kind: 'yen', ask: 'チャージは いくら？', pool: [3800, 3120, 4260, 3370, 2950], o: (n) => 5000 - n, slip: (n) => n - 1000, chips: () => [5000],
    en: (_n, o) => `I've got ${o} on my Suica. Can you top it up to five thousand?`,
    fix: (_w, _n, o, x) => `I've got ${x.say(x.o + 1000)} on my Suica. Wait, no, ${o}. Can you top it up to five thousand?`, cue: CUES.noWait,
    ja: (_n, o) => `Suicaに${o}入っています。5,000円になるようにチャージしてもらえますか？`, jaFix: (_w, _n, o, x) => `Suicaに${x.say(x.o + 1000)}…いや、${o}入っています。5,000円になるようにチャージしてもらえますか？`,
    why: (n, o, w, x) => w ? `残高を${x.say(x.o + 1000)}から${o}に言い直し。5,000円まであと${n}。${w}は直す前の計算。` : `top it up to five thousand＝5,000円にする。残高が${o}なので、チャージは${n}。`,
    note: 'top it up to ～＝～円になるまで足す' },
  { id: 'zcopies', at: 'konbini', kind: 'qty', unit: '枚', ounit: 'ページ', ask: 'コピーは 全部で 何枚？', pool: [6, 9, 12, 15, 18], poolFix: [6, 12, 18, 24],
    o: (n, _r, fixed) => (fixed ? n / 2 : n / 3), slip: (n) => (n / 2) * 3,
    en: (_n, o) => `It's ${o} pages, and I need three copies of each.`,
    fix: (_w, _n, o) => `It's ${o} pages, and I need three copies of each. Actually, two of each is plenty.`, cue: CUES.actually,
    ja: (_n, _o, x) => `${x.say(x.o, 'num')}あって、それぞれ3部ずつコピーしたいです。`, jaFix: (_w, _n, _o, x) => `${x.say(x.o, 'num')}あって、それぞれ3部ずつ…やっぱり2部ずつで十分です。`,
    why: (n, _o, w, x) => w ? `${x.say(x.o, 'num')}を2部ずつに直したので${n}。3部ずつなら${w}。` : `${x.say(x.o, 'num')}を3部ずつ（three copies of each）で${n}。`,
    note: 'three copies of each＝それぞれ3部' },
  { id: 'zbento', at: 'konbini', kind: 'qty', unit: '個', ask: '温めるのは いくつ？', pool: [2, 3, 4, 5], o: (n, _r, fixed) => (fixed ? n : n + 1), slip: (n) => n - 1,
    en: (_n, o) => `${cap(o)} of these bentos, and could you heat up all but one?`,
    fix: (_w, _n, o) => `${cap(o)} of these bentos, and could you heat up all but one? Actually, heat them all.`, cue: CUES.actually,
    ja: (_n, o) => `このお弁当を${o}、1つ以外は温めてもらえますか？`, jaFix: (_w, _n, o) => `このお弁当を${o}、1つ以外は温めて…やっぱり全部温めてください。`,
    why: (n, o, w) => w ? `all but one（1つ以外）なら${w}。Actually で「全部」に変えたので${n}。` : `all but one＝1つ以外。${o}のうち1つをのぞいて${n}。`,
    note: 'all but one＝1つ以外ぜんぶ', feat: ['idiom'] },
  { id: 'zpoints', at: 'konbini', kind: 'yen', ask: '現金で いくら？', pool: [980, 1180, 1460, 1720, 2040], o: (n, _r, fixed) => (fixed ? n + 500 : n + 300), slip: (n) => n + 200,
    en: (_n, o) => `So it's ${o}, and I'll use three hundred of my points. The rest in cash.`,
    fix: (_w, _n, o) => `So it's ${o}, and I'll use three hundred points. Oh, it says I've got five hundred. Use all of them.`, cue: CUES.oh,
    ja: (_n, o) => `${o}ですね。ポイントを300使って、残りは現金で。`, jaFix: (_w, _n, o) => `${o}ですね。ポイントを300使って…あ、500あるって。全部使ってください。`,
    why: (n, o, w) => w ? `${o}からポイント500を引いて${n}。300のままなら${w}。` : `${o}からポイント300を引いた残り（the rest）が${n}。`,
    note: 'the rest＝残り。引き算して答える' },
  { id: 'zstamps', at: 'konbini', kind: 'qty', unit: '枚', ask: '切手は 全部で 何枚？', pool: [6, 7, 8, 9, 10], o: (n, _r, fixed) => (fixed ? n - 4 : n - 2), slip: (n) => n - 2,
    en: (_n, o) => `Stamps for these, please. ${cap(o)} postcards, one each, and this letter needs two.`,
    fix: (_w, _n, o) => `Stamps for these, please. ${cap(o)} postcards, one each, and this letter needs two. Oh, and so does this one.`, cue: CUES.oh,
    ja: (_n, o) => `これに切手をお願いします。はがき${o}に1枚ずつ、この手紙は2枚です。`, jaFix: (_w, _n, o) => `これに切手をお願いします。はがき${o}に1枚ずつ、この手紙は2枚。あ、こっちの手紙も2枚です。`,
    why: (n, o, w) => w ? `はがき${o}に1枚ずつ、手紙2通に2枚ずつで${n}。手紙1通なら${w}。` : `はがき${o}に1枚ずつ（one each）、手紙に2枚で${n}。`,
    note: (f) => (f ? 'so does this one＝これも同じ（2枚）' : 'one each＝1枚ずつ。足して答える') },
  // the ticket window
  { id: 'zfares', at: 'ticket', kind: 'qty', unit: '枚', ask: '大人料金は 何枚？', ctx: '観光地の窓口でチケットを売っています', pool: [2, 3, 4], poolFix: [3, 4, 5],
    o: (_n, r) => 1 + Math.floor(r() * 3), okind: 'num', slip: (n) => n - 1,
    en: (_n, _o, x) => { const [a, b] = FARE_AGES[x.n - 2][x.o - 1]; return `Two adults, and the kids are ${numberWords(a)} and ${numberWords(b)}. Under-twelves are half price, right?`; },
    fix: (_w, _n, _o, x) => { const [a, b] = FARE_AGES[x.n - 3][x.o - 1]; return `Two adults... sorry, three adults, and the kids are ${numberWords(a)} and ${numberWords(b)}. Under-twelves are half price, right?`; },
    cue: CUES.sorry,
    ja: (_n, _o, x) => { const [a, b] = FARE_AGES[x.n - 2][x.o - 1]; return `大人2人と、子どもが${a}歳と${b}歳です。12歳未満は半額ですよね？`; },
    jaFix: (_w, _n, _o, x) => { const [a, b] = FARE_AGES[x.n - 3][x.o - 1]; return `大人2人…すみません、大人3人と、子どもが${a}歳と${b}歳です。12歳未満は半額ですよね？`; },
    why: (n, _o, w, x) => { const c = x.n - (w ? 3 : 2), kids = c ? `12歳以上の子${c}人も大人料金で${n}。` : `子どもは2人とも12歳未満なので${n}。`; return w ? `大人は3人に言い直し。${kids}大人2人なら${w}。` : `大人2人。${kids}12歳未満（Under-twelves）は半額。`; },
    note: 'Under-twelves＝12歳未満。12歳は大人料金' },
  { id: 'znext', at: 'ticket', kind: 'time', ask: '何時の 電車？', pool: times([7, 0], [8, 20], [9, 40], [10, 30], [11, 10]), o: (n, _r, fixed) => (fixed ? n - 30 : n - 20), slip: (n) => n - 10,
    en: (_n, o) => `Two to Kamakura. Not the ${o}, the one after that. They run every twenty minutes, right?`,
    fix: (_w, _n, o) => `Two to Kamakura. Not the ${o}, the one after that. Every twenty minutes, right? Oh, every half hour on weekends.`, cue: CUES.oh,
    ja: (_n, o) => `鎌倉まで2枚。${o}のじゃなくて、その次ので。20分おきですよね？`, jaFix: (_w, _n, o) => `鎌倉まで2枚。${o}のじゃなくて、その次ので。20分おきですよね？あ、週末は30分おきか。`,
    why: (n, o, w) => w ? `${o}の次。週末は30分おきなので${n}。20分おきなら${w}。` : `${o}の次（the one after that）。20分おきなので${n}。`,
    note: 'the one after that＝その次の便' },
  { id: 'zreturn', at: 'ticket', kind: 'date', unit: '', ask: '帰りは 何日？', pool: [14, 15, 18, 20, 21, 24], o: (n, _r, fixed) => (fixed ? n - 10 : n - 7), slip: (n) => n - 3,
    en: (_n, o) => `Going out on the ${o}, and coming back a week later.`,
    fix: (_w, _n, o) => `Going out on the ${o}, coming back a week later. Well, make it ten days.`, cue: CUES.makeIt,
    ja: (_n, o) => `行きは${o}で、帰りはその1週間後です。`, jaFix: (_w, _n, o) => `行きは${o}、帰りは1週間後…いや、10日後にします。`,
    why: (n, o, w) => w ? `${o}の10日後で${n}。1週間後なら${w}。` : `${o}の1週間後（a week later）で${n}。`,
    note: 'a week later＝7日後。日付を足して答える' },
  { id: 'zseniors', at: 'ticket', kind: 'yen', ask: 'シニアは いくら？', ctx: '観光地の窓口でチケットを売っています', pool: [500, 600, 700, 800, 900], poolFix: [500, 600, 700, 800],
    o: (n, _r, fixed) => (fixed ? n * 2 : n + 200), slip: (n) => n * 2 - 200,
    en: (_n, o) => `The adult ticket's ${o}, and seniors get two hundred off?`,
    fix: (_w, _n, o) => `The adult ticket's ${o}, and seniors get two hundred off? Oh, half off. Even better.`, cue: CUES.oh,
    ja: (_n, o) => `大人は${o}で、シニアは200円引きですか？`, jaFix: (_w, _n, o) => `大人は${o}で、シニアは200円引き？あ、半額か。もっといいですね。`,
    why: (n, o, w) => w ? `${o}の半額（half off）で${n}。200円引きなら${w}。` : `${o}から200円引き（two hundred off）で${n}。`,
    note: '～ off＝～引き。half off＝半額' },
  { id: 'zgroup', at: 'ticket', kind: 'qty', unit: '人', ask: '全部で 何人？', pool: [6, 7, 8, 9], o: (n, _r, fixed) => (fixed ? n - 3 : n - 4), slip: (n) => n + 1, chips: () => [4],
    en: (_n, o) => `It's the four of us, plus my sister's family of ${o}.`,
    fix: (_w, _n, o) => `It's the four of us, plus my sister's family of ${o}. Oh, but her husband's not coming.`, cue: CUES.oh,
    ja: (_n, o) => `私たち4人と、姉の家族${o}です。`, jaFix: (_w, _n, o) => `私たち4人と、姉の家族${o}。あ、でも姉の夫は来ません。`,
    why: (n, o, w) => w ? `4人と姉の家族${o}で${w}。夫が来ないので1人へって${n}。` : `the four of us（4人）と姉の家族${o}を足して${n}。`,
    note: (f) => (f ? 'not coming の人を引いて数える' : 'plus＝足す。全部の人数を答える') },
  // the deli, on a trip
  { id: 'zbagels', at: 'deli', kind: 'qty', unit: '個', say: byDozen, ask: 'ベーグルは いくつ？', pool: [6, 12, 13, 18, 24], slip: (n) => (n === 13 ? 12 : n / 2), chips: () => [12, 13, 6],
    en: (n) => `Could I get ${n} bagels? Assorted is fine.`,
    fix: (w, _n, _o, x) => (x.n === 13 ? `Could I get a dozen bagels? Actually, make it a baker's dozen.` : `Could I get ${w} bagels? Actually, double that. The meeting got bigger.`), cue: CUES.actually,
    ja: (n, _o, x) => `ベーグルを${dozJa(x.n, n)}ください。種類はおまかせで。`,
    jaFix: (w, _n, _o, x) => (x.n === 13 ? 'ベーグルを1ダース…やっぱり13個で。' : `ベーグルを${dozJa(x.w, w)}…いえ、その倍で。会議の人数が増えたので。`),
    why: (n, _o, w, x) => w ? (x.n === 13 ? `a baker's dozen＝13個。1ダース（12個）から言い直した。` : `${w}と言ってから double that（その倍）で${n}。`) : x.n === 12 ? 'a dozen＝12個。half a dozen なら6個。' : `${DOZEN[x.n][0]}は${n}。a dozen＝12個。`,
    note: "a dozen＝12個。a baker's dozen＝13個", feat: ['idiom'] },
  { id: 'zsplit', at: 'deli', kind: 'usd', ask: '1人 いくら？', pool: [1200, 1350, 1500, 1650, 1800], o: (n, _r, fixed) => (fixed ? n * 4 : n * 3), slip: (n) => (n * 4) / 3,
    en: (_n, o) => `It's ${o} altogether, and we're splitting it three ways.`,
    fix: (_w, _n, o) => `It's ${o} altogether, and we're splitting it three ways. Oh, four ways. Sam's back.`, cue: CUES.oh,
    ja: (_n, o) => `全部で${o}で、3人で割り勘です。`, jaFix: (_w, _n, o) => `全部で${o}、3人で割り勘…あ、4人だ。サムが戻ってきた。`,
    why: (n, o, w) => w ? `${o}を4人で割って${n}。3人なら${w}。` : `${o}を3人で割る（three ways）と${n}。`,
    note: 'split three ways＝3人で割る' },
  { id: 'ztip', at: 'deli', kind: 'usd', ask: 'チップは いくら？', pool: [150, 225, 275, 320, 380], o: (n, _r, fixed) => (fixed ? 1900 - n : 2000 - n), slip: (n) => n + 100, chips: () => [2000],
    en: (_n, o) => `Is that ${o}? I'll give you a twenty, and you keep whatever's left over.`,
    fix: (_w, _n, o) => `Is that ${o}? I'll give you a twenty. Actually, can I get a dollar back? Keep the rest.`, cue: CUES.actually,
    ja: (_n, o) => `${o}ですか？20ドル札を出すので、残りはどうぞ。`, jaFix: (_w, _n, o) => `${o}ですか？20ドル札で。やっぱり1ドルだけ返してもらえますか？残りはどうぞ。`,
    why: (n, o, w) => w ? `20ドルから${o}を引いて、さらに1ドル返してもらうので${n}。` : `20ドルから${o}を引いた残り（whatever's left over）の${n}がチップ。`,
    note: 'left over、the rest＝残り。それがチップ' },
  { id: 'zhalves', at: 'deli', kind: 'qty', unit: '切れ', ounit: '個', ask: '全部で 何切れ？', pool: [8, 12, 16, 24], poolFix: [8, 12, 16, 24], o: (n, _r, fixed) => (fixed ? n / 4 : n / 2), slip: (n) => n / 2,
    en: (_n, o) => `Could you cut each of the ${o} sandwiches in half?`,
    fix: (_w, _n, o) => `Could you cut each of the ${o} sandwiches in half? Actually, in quarters. It's for a party.`, cue: CUES.actually,
    ja: (_n, _o, x) => `サンドイッチ${x.say(x.o, 'num')}を、それぞれ半分に切ってもらえますか？`, jaFix: (_w, _n, _o, x) => `サンドイッチ${x.say(x.o, 'num')}を、それぞれ半分に…やっぱり4つに切ってください。パーティー用なので。`,
    why: (n, _o, w, x) => w ? `${x.say(x.o, 'num')}をそれぞれ4つ（in quarters）に切るので${n}。半分なら${w}。` : `${x.say(x.o, 'num')}をそれぞれ半分（in half）で${n}。`,
    note: 'in half＝半分に。in quarters＝4つに' },
  { id: 'zcups', at: 'deli', kind: 'qty', unit: '杯', ounit: '人', ask: 'アイスティーは 何杯？', pool: [3, 4, 5, 6], poolFix: [4, 5, 6, 7], o: (n, _r, fixed) => (fixed ? (n - 1) * 2 : n * 2), slip: (n) => n - 1,
    en: (_n, o) => `There are ${o} of us. Half want iced tea, and the rest want lemonade.`,
    fix: (_w, _n, o) => `There are ${o} of us. Half want iced tea, the rest lemonade. Oh, and one more iced tea for our driver.`, cue: CUES.oh,
    ja: (_n, _o, x) => `${x.say(x.o, 'num')}です。半分がアイスティー、残りはレモネードで。`, jaFix: (_w, _n, _o, x) => `${x.say(x.o, 'num')}です。半分がアイスティー、残りはレモネード。あ、運転手さんの分もアイスティーを1杯。`,
    why: (n, _o, w, x) => w ? `${x.say(x.o, 'num')}の半分で${w}。運転手の分を足して${n}。` : `${x.say(x.o, 'num')}の半分（Half）が${n}。残りはレモネード。`,
    note: 'Half＝半分。人数から考える' },
  // the taxi stand
  { id: 'zarrive', at: 'taxi', kind: 'time', say: byClockAll, ask: '何時までに 着く？', pool: times([6, 55], [7, 25], [8, 5], [8, 35], [9, 15]), o: (n, _r, fixed) => (fixed ? n - 30 : n - 45), slip: (n) => n + 15,
    en: (_n, o) => `It's ${o} now, and we need to be there in forty-five minutes.`,
    fix: (_w, _n, o) => `It's ${o} now, and we need to be there in forty-five minutes. No, half an hour. We're cutting it close.`, cue: CUES.noWait,
    ja: (_n, o) => `今${o}で、45分後には着いていないといけないんです。`, jaFix: (_w, _n, o) => `今${o}で、45分後…いや、30分後には着かないと。ぎりぎりです。`,
    why: (n, o, w, x) => w ? `今が${o}。half an hour（30分）後なので${n}。45分後なら${w}。` : `「${clockEn(x.o, true)}」は${o}。その45分後なので${n}。`,
    note: 'in ～ minutes＝～分後。今の時刻に足す' },
  { id: 'zshare', at: 'taxi', kind: 'yen', ask: '1人 いくらくらい？', pool: [800, 960, 1200, 1440, 1600], o: (n, _r, fixed) => (fixed ? n * 3 : n * 4), slip: (n) => (n * 3) / 4,
    en: (_n, o) => `It's about ${o} to Ginza. With four of us sharing, that's not bad at all.`,
    fix: (_w, _n, o) => `It's about ${o} to Ginza. With four of us sharing... oh, Mia's walking, so three of us.`, cue: CUES.oh,
    ja: (_n, o) => `銀座まで${o}くらい。4人で分ければ、全然悪くないですね。`, jaFix: (_w, _n, o) => `銀座まで${o}くらい。4人で分ければ…あ、ミアは歩くから3人だ。`,
    why: (n, o, w) => w ? `${o}を3人で分けて${n}。4人なら${w}。` : `${o}を4人で分ける（four of us sharing）と${n}。`,
    note: 'sharing＝人数で分ける。割り算して答える' },
  { id: 'zmeter', at: 'taxi', kind: 'yen', ask: '全部で いくら？', pool: [5240, 6180, 7320, 4860, 5970], o: (n, _r, fixed) => (fixed ? n - 1000 : n - 800), slip: (n) => n - 200,
    en: (_n, o) => `It's ${o} on the meter, plus the eight-hundred-yen toll, right?`,
    fix: (_w, _n, o) => `It's ${o} on the meter, plus the toll. That was eight hundred, wasn't it? Oh, a thousand.`, cue: CUES.oh,
    ja: (_n, o) => `メーターが${o}で、それに高速代の800円ですよね？`, jaFix: (_w, _n, o) => `メーターが${o}、それに高速代。800円でしたっけ？あ、1,000円か。`,
    why: (n, o, w) => w ? `${o}に高速代1,000円を足して${n}。800円なら${w}。` : `${o}に高速代800円を足して（plus）${n}。`,
    note: 'plus＝足す。メーターだけで答えない' },
  { id: 'zcheckout', at: 'taxi', kind: 'mins', ask: '何分 待つ？', say: (v, k) => (k === 'mins' && MINS[v] ? { en: MINS[v], tts: MINS[v] } : undefined),
    pool: [15, 30, 45, 90], poolFix: [30, 45, 90], slip: (n) => ({ 30: 15, 45: 30, 90: 45 })[n]!, chips: () => [15, 30, 45, 90],
    en: (n) => `Could you wait while we check out? Give us ${n}, tops.`,
    fix: (w, n) => `Could you wait while we check out? Give us ${w}. Make that ${n}. My wife's still packing.`, cue: CUES.makeThat,
    ja: (n) => `チェックアウトの間、待ってもらえますか？長くても${n}で。`, jaFix: (w, n) => `チェックアウトの間、待ってもらえますか？${w}…いや、${n}で。妻がまだ荷造りしていて。`,
    why: (n, _o, w, x) => w ? `${w}から Make that で「${MINS[x.n]}」（${n}）に言い直し。` : `「${MINS[x.n]}」は${n}。tops＝長くても。`,
    note: 'a quarter of an hour＝15分。tops＝長くても', feat: ['idiom'] },
  { id: 'zshow', at: 'taxi', kind: 'time', say: byClock, ask: '迎えは 何時？', pool: times([9, 0], [9, 30], [10, 15], [8, 45], [10, 0]), o: (n, _r, fixed) => (fixed ? n - 150 : n - 120), slip: (n) => n - 30,
    en: (_n, o) => `The show starts at ${o}, and it runs about two hours. Can you pick us up then?`,
    fix: (_w, _n, o) => `The show starts at ${o} and runs about two hours. Actually, two and a half, with the break. Can you pick us up then?`, cue: CUES.actually,
    ja: (_n, o) => `ショーは${o}に始まって、2時間くらいです。終わるころに迎えに来てもらえますか？`, jaFix: (_w, _n, o) => `ショーは${o}開始で2時間くらい…いや、休憩込みで2時間半。終わるころに迎えに来てもらえますか？`,
    why: (n, o, w) => w ? `${o}開始で、休憩込みの2時間半後なので${n}。2時間なら${w}。` : `${o}開始で、2時間後（runs about two hours）の${n}。`,
    note: 'then＝終わる時刻。開始に足して答える' },
  // the pharmacy
  { id: 'zweek', at: 'pharmacy', kind: 'qty', unit: '錠', ask: '全部で 何錠？', pool: [7, 14, 21, 28], poolFix: [10, 20, 30, 40], o: (n, _r, fixed) => (fixed ? n / 10 : n / 7), slip: (n) => (n / 10) * 7,
    en: (_n, o) => `So I take ${o} a day for a week, and that's the whole box?`,
    fix: (_w, _n, o) => `So I take ${o} a day for a week? Oh, ten days. Sorry, I misread it.`, cue: CUES.oh,
    ja: (_n, o) => `じゃあ、1日${o}を1週間で、箱の中身全部ですか？`, jaFix: (_w, _n, o) => `じゃあ、1日${o}を1週間？あ、10日間か。すみません、読み間違えました。`,
    why: (n, o, w) => w ? `1日${o}を10日間で${n}。1週間なら${w}。` : `1日${o}を1週間（7日）で${n}。`,
    note: 'a week＝7日。かけ算して答える' },
  { id: 'zevery', at: 'pharmacy', kind: 'qty', unit: '回', ounit: '週間', ask: '全部で 何回 飲む？', pool: [7, 14, 21, 28], o: (n) => n / 3.5, slip: (n) => n * 2,
    en: (_n, o) => `So I take it every other day for ${o} weeks?`,
    fix: (_w, _n, o) => `So I take it every day for ${o} weeks? Oh, every other day. Got it.`, cue: CUES.oh,
    ja: (_n, _o, x) => `じゃあ、${x.say(x.o, 'num')}、1日おきに飲むんですね？`, jaFix: (_w, _n, _o, x) => `じゃあ、${x.say(x.o, 'num')}毎日？あ、1日おきですね。わかりました。`,
    why: (n, _o, w, x) => w ? `毎日なら${w}。every other day（1日おき）なので半分の${n}。` : `${x.say(x.o, 'num')}は${x.o * 7}日。every other day（1日おき）なので${n}。`,
    note: 'every other day＝1日おき' },
  { id: 'zniece', at: 'pharmacy', kind: 'age', ask: '今 何歳？', pool: [6, 9, 11, 12, 14], o: (n, _r, fixed) => (fixed ? n : n + 1), slip: (n) => n - 1, chips: (n) => [n + 1],
    en: (_n, o) => `It's for my niece. She turns ${o} next month. Is the kids' dose still okay?`,
    fix: (_w, _n, o) => `It's for my niece. She turns ${o} next month. No, wait, she turned ${o} last month. Is the kids' dose still okay?`, cue: CUES.noWait,
    ja: (_n, o) => `めいの薬です。来月${o}になります。子ども用の量でまだ大丈夫ですか？`, jaFix: (_w, _n, o) => `めいの薬です。来月${o}に…いや、先月${o}になったんだ。子ども用の量でまだ大丈夫ですか？`,
    why: (n, o, w) => w ? `先月${o}になった（turned）ので今${n}。来月なるなら今は${w}。` : `来月${o}になる（turns）ので、今は${n}。`,
    note: 'turns ～＝～歳になる。今はその1つ下' },
  { id: 'zready', at: 'pharmacy', kind: 'time', say: byClock, ask: '何時に できる？', pool: times([3, 30], [4, 15], [5, 0], [5, 45], [6, 30]), o: (n, _r, fixed) => (fixed ? n - 120 : n - 90), slip: (n) => n - 30,
    en: (_n, o) => `They said it'd be ready an hour and a half after I dropped it off, and that was at ${o}.`,
    fix: (_w, _n, o) => `They said it'd be ready an hour and a half after I dropped it off. No, two hours, sorry. And that was at ${o}.`, cue: CUES.noWait,
    ja: (_n, o) => `出してから1時間半でできると言われて、出したのは${o}でした。`, jaFix: (_w, _n, o) => `出してから1時間半で…いや、すみません、2時間でした。出したのは${o}です。`,
    why: (n, o, w) => w ? `${o}に出して2時間後なので${n}。1時間半後なら${w}。` : `${o}に出して、1時間半後（an hour and a half）で${n}。`,
    note: 'an hour and a half＝1時間半' },
  { id: 'zgeneric', at: 'pharmacy', kind: 'yen', ask: 'ジェネリックは いくら？', pool: [600, 740, 860, 1120], poolFix: [400, 520, 680, 760], o: (n, _r, fixed) => (fixed ? n * 3 : n * 2), slip: (n) => (n * 3) / 2,
    en: (_n, o) => `The brand name is ${o}, and the generic is half that?`,
    fix: (_w, _n, o) => `The brand name is ${o}, and the generic is half that? Oh, a third. Even better.`, cue: CUES.oh,
    ja: (_n, o) => `先発品が${o}で、ジェネリックはその半分ですか？`, jaFix: (_w, _n, o) => `先発品が${o}で、ジェネリックはその半分？あ、3分の1か。もっといいですね。`,
    why: (n, o, w) => w ? `${o}の3分の1（a third）で${n}。半分なら${w}。` : `${o}の半分（half that）で${n}。`,
    note: 'half that＝その半分。a third＝3分の1' }
];

function cap(s: string): string {
  return s[0].toUpperCase() + s.slice(1);
}

// ---------- the expansion ----------

/** The customers: one per US voice (cast.ts CAST), so a run of eight sounds like eight people. */
const CUSTOMERS = ['rosie', 'goldie', 'maple', 'diana', 'celeste', 'cherry', 'dom', 'hamlet', 'bob', 'punchy', 'raymond', 'apollo'] as const;
/** Variants a frame. */
const PER_FRAME = 4;
/** The corrected share (about a third, at random places). */
const CORRECTED = 1 / 3;

interface Out {
  id: string; at: Setting; speaker: string; en: string; tts?: string; ja: string; ask: string; ctx: string;
  options: string[]; answer: number; was?: number; cja: string[]; why: string; note: string;
  scene?: string; tags: { seed: number; register: 'service'; pragmatic: 'literal'; conditions?: string[]; features: string[] };
}

/** One item of a frame: n, a slip w (a correction), o; the ticket's 4 chips (ascending), 解説 and the note. */
function itemOf(f: Frame, k: number, n: number, fixed: boolean, who: string, r: () => number, tts: (s: string) => string): Out {
  const st = SETTINGS[f.at], okind = f.okind ?? f.kind;
  const o = f.o?.(n, r, fixed);
  const tw = twin(f.kind, n);
  // the slip: its teen / -ty twin half the time when it has one, else a near value (never o)
  const close = f.alts ? shuffle(f.alts.filter((x) => x !== n), r) : [...near(f.kind, n), ...swaps(f.kind, n)];
  const slips = [...(tw !== null && r() < 0.5 ? [tw] : []), ...close].filter((x) => x !== n && x !== o && ok(f.kind, x));
  const w = fixed ? (f.slip ? f.slip(n, o) : slips[Math.floor(r() * Math.min(slips.length, 3))]) : undefined;
  if (fixed && w === undefined) throw new Error(`rush: no slip for ${f.id} ${n}`);
  // the chips: n, the slip, o (when it can be taken for the answer), a sound trap, a near value
  const vals = [n];
  const add = (x: number | null | undefined) => x !== null && x !== undefined && ok(f.kind, x) && !vals.includes(x) && vals.length < 4 && vals.push(x);
  add(w);
  if (okind === f.kind) add(o);
  for (const x of f.chips?.(n, o, w) ?? []) add(x);
  add(tw);
  for (const x of f.alts ? close : shuffle(close, r)) add(x);
  if (vals.length < 4) throw new Error(`rush: too few chips for ${f.id} ${n}`);
  const sorted = [...vals].sort((a, b) => a - b);
  const sh = (v: number) => shown(f.kind, v, f.unit);
  const options = sorted.map((v) => sh(v).chip), cja = sorted.map((v) => sh(v).ja);
  const say = (v: number, kind = f.kind) => f.say?.(v, kind) ?? said(kind, v);
  const jv = (v: number, kind = f.kind) => shown(kind, v, kind === f.kind ? f.unit : f.ounit).ja;
  const x = (s: 'en' | 'tts' | 'ja'): Said => ({ n, o: o ?? 0, w: w ?? 0, say: (v, kind = f.kind) => (s === 'ja' ? jv(v, kind) : say(v, kind)[s]) });
  const N = say(n), W = w !== undefined ? say(w) : null, O = o !== undefined ? say(o, okind) : null;
  const [hiEn, hiJa] = st.hi[Math.floor(r() * st.hi.length)];
  const line = (s: 'en' | 'tts') => {
    const body = fixed ? f.fix(W![s], N[s], O?.[s] ?? '', x(s)) : f.en(N[s], O?.[s] ?? '', x(s));
    if (!hiEn || /^(Hi|Hey|So|Um|Excuse|Good|Morning|Hello)\b/.test(body)) return body;
    return hiEn + (hiEn.endsWith(', ') && !/^I\b/.test(body) ? body[0].toLowerCase() + body.slice(1) : body);
  };
  const en = line('en'), said_ = tts(line('tts'));
  const jn = jv(n), jw = w !== undefined ? jv(w) : '', jo = o !== undefined ? jv(o, okind) : '';
  const jaBody = fixed ? f.jaFix(jw, jn, jo, x('ja')) : f.ja(jn, jo, x('ja'));
  const ja = (hiEn && en.startsWith(hiEn) ? hiJa : '') + jaBody;
  // 解説 (≤ 90 字): the correction or the answer, the other number, the sound trap
  const pair = tw !== null && sorted.includes(tw) ? `${sh(Math.min(n, tw)).ja}と${sh(Math.max(n, tw)).ja}は、-teenと-tyの違い。-teenは後ろを強く長く言います。` : '';
  const parts = [
    fixed ? `「${f.cue[0]}」（${f.cue[1]}）で言い直し。答えは最後の${sh(n).ja}。${sh(w!).ja}は言い直す前です。` : `「${N.tts}」で${sh(n).ja}。${TIP[f.kind]}`,
    o !== undefined && okind === f.kind && sorted.includes(o) ? `${sh(o).ja}は${f.oja ?? '別の数字'}。` : '',
    pair
  ];
  let why = parts.join('');
  if ([...why].length > 90) why = parts.slice(0, 2).join('');
  if ([...why].length > 90) why = parts[0];
  if (f.why) why = f.why(jn, jo, jw, x('ja'));
  const fnote = typeof f.note === 'function' ? f.note(fixed) : f.note;
  if ([...why].length > 90 || [...(fnote ?? '')].length > 40) throw new Error(`rush: ${f.id}'s why or note is too long: ${why} / ${fnote}`);
  const note = fnote ? fnote : fixed ? `言い直しの「${f.cue[0]}」のあとが答え`
    : pair ? `${sh(Math.min(n, tw!)).ja}と${sh(Math.max(n, tw!)).ja}：-teenは後ろが強い`
      : o !== undefined ? `数字が2つ。何を聞かれているかに注意` : NOTE[f.kind];
  const features = ['numbers', ...(fixed ? ['self-repair'] : []), ...(pair ? ['teen-ty'] : []), ...(f.kind === 'time' ? ['clock'] : []), ...(f.feat ?? [])];
  return {
    id: `rush-${f.id}-${k + 1}`, at: f.at, speaker: who, en, ...(said_ !== en && { tts: said_ }), ja, ask: f.ask, ctx: f.ctx ?? st.ctx,
    options, answer: sorted.indexOf(n), ...(w !== undefined && { was: sorted.indexOf(w) }), cja, why, note, ...(st.scene && { scene: st.scene }),
    tags: { seed: st.seed, register: 'service', pragmatic: 'literal', ...(st.conditions && { conditions: st.conditions }), features }
  };
}

/** 解説's tip on a kind, when there's no correction. */
const TIP: Readonly<Record<Kind, string>> = {
  qty: '数は名詞の前に来ます。', yen: '円の値段は thousand（千）と hundred（百）の順に聞きます。', usd: 'ドルとセントは「14 50」のように2つに分けて言います。',
  time: '時刻は時と分を続けて言います。', num: '番号は数字をそのまま言います。', date: '日付は fourteenth のような序数で言います。',
  mins: 'minutes の前の数を聞きます。', age: '年齢は数字だけで言うことが多いです。', digits: '番号は1けたずつ読みます。'
};

/** What a kind's ear should listen for, when nothing else is the trap. */
const NOTE: Readonly<Record<Kind, string>> = {
  qty: '数は名詞の前。最後まで聞いて答える', yen: '値段は千の位から順に聞く', usd: 'ドルは「14 50」のように2つに分けて言う',
  time: '時刻は「3 15」のように時と分を続けて言う', num: '番号はそのまま数字で言う', date: '日付は the 14th のように序数で言う',
  mins: '分の数を聞き取る', age: '年齢は数字だけで言うことが多い', digits: '番号は1けたずつ読む'
};

/** What the engine says beyond the numbers: a year in words, a contraction (gonna, wanna, lemme are written so in `en`). */
const spoken = (s: string) => s.replace(/([.?!] )([a-z])/g, (_, a: string, b: string) => a + b.toUpperCase()).replace(/\bWhat time is\b/g, "What time's").replace(/\b19(\d\d)\b/g, (_, d: string) => `nineteen ${numberWords(+d)}`);

interface FileSpec {
  unit: string;
  stage: number;
  frames: readonly Frame[];
  cando: string;
  title: string;
  /** The corrected share, when not CORRECTED (はまべ: one in five). */
  corrected?: number;
}
const FILES: readonly FileSpec[] = [
  { unit: 's1-rush', stage: 2, frames: KAWA, cando: '注文や受付で、数・値段・時刻・番号を聞き取り、言い直しにも気づける',
    title: 'すうじ ラッシュ S1 かわ: one number a line, short orders, plain self-corrections' },
  { unit: 's2-rush', stage: 3, frames: MORI, cando: '数字が2つ以上ある注文から、聞かれた数字を選び、言い直しを聞き分けられる',
    title: 'すうじ ラッシュ S2 もり: two numbers a line, the asked one picked out, casual self-corrections' },
  { unit: 's0-rush', stage: 1, frames: HAMA, corrected: 0.2, cando: 'みじかい 注文から 数・時刻・値段を 聞き取れる',
    title: 'すうじ ラッシュ S0 はまべ: one number a line, said clearly in a short order; about one in five corrects itself, plainly' },
  { unit: 's3-rush', stage: 4, frames: YAMA, cando: '数字が いくつも 出る 速い 注文から、聞かれた 数字を 理由つきの 言い直しまで 追える',
    title: 'すうじ ラッシュ S3 やま: two or three numbers in a fast order, the asked one never first; a correction with its reason; dollars and cents; a quarter to six' },
  { unit: 's4-rush', stage: 5, frames: HOSHI, cando: 'はっきり 言われない 数を、速い 注文の 言い回しから 聞き取れる',
    title: 'すうじ ラッシュ S4 ほし: the number is meant, not said (by the dozen, all but one, the one after that, split three ways); a correction changes the sum' }
];

function expand(spec: FileSpec): Out[] {
  const r = mulberry32(fnv1a(spec.unit));
  const n = spec.frames.length * PER_FRAME;
  const fixedAt = new Set(shuffle(Array.from({ length: n }, (_, j) => j), r).slice(0, Math.round(n * (spec.corrected ?? CORRECTED))));
  const who = shuffle([...CUSTOMERS], r);
  let next = 0;
  return spec.frames.flatMap((f, fi) => {
    const pool = shuffle([...f.pool], r), poolFix = f.poolFix && shuffle([...f.poolFix], r);
    return Array.from({ length: PER_FRAME }, (_, k) => {
      const fixed = fixedAt.has(fi * PER_FRAME + k), from = fixed && poolFix ? poolFix : pool;
      return itemOf(f, k, from[k % from.length], fixed, who[(next++ + fi) % who.length], r, spoken);
    });
  });
}

// ---------- the YAML ----------

const q = (s: string) => JSON.stringify(s);
const arr = (xs: readonly (string | number)[]) => `[${xs.map((x) => (typeof x === 'number' ? x : q(x))).join(', ')}]`;

function yamlOf(spec: FileSpec, items: readonly Out[], status: string): string {
  const seeds = [...new Set(items.map((it) => it.tags.seed))].sort((a, b) => a - b);
  const head = [
    `# ${spec.title}.`,
    '# Written by scripts/kikimimi-rush.ts (npm run kikimimi:rush): edit the frames there, not this file. One item = one',
    '# customer = one clip; `options` the ticket\'s chips (ascending), `was` the one said before a self-correction.',
    'schema: 1', `unit: ${spec.unit}`, 'game: rush', `stage: ${spec.stage}`, 'track: life', `seeds: ${arr(seeds)}`,
    'features: { primary: numbers, review: self-repair }', `cando: ${q(spec.cando)}`, `status: ${status}`, 'items:'
  ];
  const body = items.map((it) => [
    '  - kind: rush', `    id: ${it.id}`, `    at: ${it.at}`, `    speaker: ${it.speaker}`, `    en: ${q(it.en)}`, ...(it.tts ? [`    tts: ${q(it.tts)}`] : []), `    ja: ${q(it.ja)}`,
    `    ask: ${q(it.ask)}`, `    ctx: ${q(it.ctx)}`, ...(it.scene ? [`    scene: ${it.scene}`] : []),
    `    options: ${arr(it.options)}`, `    answer: ${it.answer}`, ...(it.was !== undefined ? [`    was: ${it.was}`] : []), `    cja: ${arr(it.cja)}`,
    `    why: ${q(it.why)}`, `    note: ${q(it.note)}`,
    `    tags: { seed: ${it.tags.seed}, register: service, pragmatic: literal, ${it.tags.conditions ? `conditions: ${arr(it.tags.conditions)}, ` : ''}features: ${arr(it.tags.features)} }`
  ].join('\n'));
  return `${head.join('\n')}\n${body.join('\n\n')}\n`;
}

/** A file's status as it is (a person flips it after the listening check), else draft. */
function statusOf(path: string): string {
  if (!existsSync(path)) return 'draft';
  return /^status: (\w+)$/m.exec(readFileSync(path, 'utf8'))?.[1] ?? 'draft';
}

const built = FILES.map((spec) => ({ spec, items: expand(spec) }));
if (process.argv.includes('--clips')) {
  for (const { items } of built) for (const it of items) console.log(it.id);
} else {
  const check = process.argv.includes('--check');
  let stale = 0;
  for (const { spec, items } of built) {
    const path = join(DIR, `${spec.unit}.yaml`), text = yamlOf(spec, items, statusOf(path));
    const was = existsSync(path) ? readFileSync(path, 'utf8') : '';
    if (was === text) continue;
    stale++;
    if (check) console.error(`kikimimi-rush: ${spec.unit}.yaml is out of date`);
    else writeFileSync(path, text);
  }
  const all = built.flatMap((b) => b.items), fixed = all.filter((it) => it.was !== undefined).length;
  console.log(`kikimimi-rush: ${built.map((b) => `${b.spec.unit} ${b.items.length}`).join(', ')}; ${fixed} corrected (${Math.round((fixed / all.length) * 100)} %); ${all.length} clips for A3 (--only '^rush-')${check ? '' : `, ${stale} file(s) written`}`);
  if (check && stale) process.exit(1);
}
