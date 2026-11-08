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
  actually: ['actually', 'やっぱり'], scratch: ['scratch that', '今のはなし'], hangOn: ['hang on', 'ちょっと待って'], didISay: ['did I say', '〜って言った？']
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
  /** Another number said in the line, from n (its kind: `okind`, else the frame's). */
  o?: (n: number, r: () => number) => number;
  okind?: Kind;
  /** o's unit when it's of another kind (a count's 人). */
  ounit?: string;
  /** The values a slip or a distractor is drawn from, in place of the near ones (sizes, card amounts). */
  alts?: readonly number[];
  /** What o is, in Japanese, for 解説 ("大人の 人数"). */
  oja?: string;
  en: (n: string, o: string) => string;
  fix: (w: string, n: string, o: string) => string;
  cue: Cue;
  ja: (n: string, o: string) => string;
  jaFix: (w: string, n: string, o: string) => string;
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
  const o = f.o?.(n, r);
  const tw = twin(f.kind, n);
  // the slip: its teen / -ty twin half the time when it has one, else a near value (never o)
  const close = f.alts ? shuffle(f.alts.filter((x) => x !== n), r) : [...near(f.kind, n), ...swaps(f.kind, n)];
  const slips = [...(tw !== null && r() < 0.5 ? [tw] : []), ...close].filter((x) => x !== n && x !== o && ok(f.kind, x));
  const w = fixed ? slips[Math.floor(r() * Math.min(slips.length, 3))] : undefined;
  if (fixed && w === undefined) throw new Error(`rush: no slip for ${f.id} ${n}`);
  // the chips: n, the slip, o (when it can be taken for the answer), a sound trap, a near value
  const vals = [n];
  const add = (x: number | null | undefined) => x !== null && x !== undefined && ok(f.kind, x) && !vals.includes(x) && vals.length < 4 && vals.push(x);
  add(w);
  if (okind === f.kind) add(o);
  add(tw);
  for (const x of f.alts ? close : shuffle(close, r)) add(x);
  if (vals.length < 4) throw new Error(`rush: too few chips for ${f.id} ${n}`);
  const sorted = [...vals].sort((a, b) => a - b);
  const sh = (v: number) => shown(f.kind, v, f.unit);
  const options = sorted.map((v) => sh(v).chip), cja = sorted.map((v) => sh(v).ja);
  const say = (v: number, kind = f.kind) => said(kind, v);
  const jv = (v: number, kind = f.kind) => shown(kind, v, kind === f.kind ? f.unit : f.ounit).ja;
  const N = say(n), W = w !== undefined ? say(w) : null, O = o !== undefined ? say(o, okind) : null;
  const [hiEn, hiJa] = st.hi[Math.floor(r() * st.hi.length)];
  const line = (s: 'en' | 'tts') => {
    const body = fixed ? f.fix(W![s], N[s], O?.[s] ?? '') : f.en(N[s], O?.[s] ?? '');
    if (!hiEn || /^(Hi|Hey|So|Um|Excuse|Good|Morning|Hello)\b/.test(body)) return body;
    return hiEn + (hiEn.endsWith(', ') && !/^I\b/.test(body) ? body[0].toLowerCase() + body.slice(1) : body);
  };
  const en = line('en'), said_ = tts(line('tts'));
  const jn = jv(n), jw = w !== undefined ? jv(w) : '', jo = o !== undefined ? jv(o, okind) : '';
  const jaBody = fixed ? f.jaFix(jw, jn, jo) : f.ja(jn, jo);
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
  const note = fixed ? `言い直しの「${f.cue[0]}」のあとが答え`
    : pair ? `${sh(Math.min(n, tw!)).ja}と${sh(Math.max(n, tw!)).ja}：-teenは後ろが強い`
      : o !== undefined ? `数字が2つ。何を聞かれているかに注意` : NOTE[f.kind];
  const features = ['numbers', ...(fixed ? ['self-repair'] : []), ...(pair ? ['teen-ty'] : []), ...(f.kind === 'time' ? ['clock'] : [])];
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
}
const FILES: readonly FileSpec[] = [
  { unit: 's1-rush', stage: 2, frames: KAWA, cando: '注文や受付で、数・値段・時刻・番号を聞き取り、言い直しにも気づける',
    title: 'すうじ ラッシュ S1 かわ: one number a line, short orders, plain self-corrections' },
  { unit: 's2-rush', stage: 3, frames: MORI, cando: '数字が2つ以上ある注文から、聞かれた数字を選び、言い直しを聞き分けられる',
    title: 'すうじ ラッシュ S2 もり: two numbers a line, the asked one picked out, casual self-corrections' }
];

function expand(spec: FileSpec): Out[] {
  const r = mulberry32(fnv1a(spec.unit));
  const n = spec.frames.length * PER_FRAME;
  const fixedAt = new Set(shuffle(Array.from({ length: n }, (_, j) => j), r).slice(0, Math.round(n * CORRECTED)));
  const who = shuffle([...CUSTOMERS], r);
  let next = 0;
  return spec.frames.flatMap((f, fi) => {
    const pool = shuffle([...f.pool], r);
    return Array.from({ length: PER_FRAME }, (_, k) => itemOf(f, k, pool[k % pool.length], fixedAt.has(fi * PER_FRAME + k), who[(next++ + fi) % who.length], r, spoken));
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
