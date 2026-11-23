// The copy's two zones (docs/design.md "Copy"). The WORLD (the island and its rooms: villagers' and NPCs' lines, bubbles,
// signs, in-world notices, the HUD) is kids-style spaced kana under `word-break: keep-all`: a
// line breaks only at the copy's spaces or after 、。！, so a run with no break opportunity is one unbreakable word and
// a long one overflows a 320px screen or a narrow card. Everything opened from the world (sheets, panels, dialogs,
// forms) and the leaf menu's pills (since 2026-11-08: easier to read) is normal Japanese with kanji under `word-break: normal` (theme.css): it breaks between any two Japanese
// characters, so only a run of Latin letters or digits can't break there.
import { describe, expect, it } from 'vitest';
import jaMain from './ja.json';
import jaTab from './kenkou.ja.json';
import jaSheets from './sheets.ja.json';
import jaFood from './food.ja.json';
import jaTravel from './travel.ja.json';
import jaLink from './link.ja.json';
import jaWed from './wedding.ja.json';
import jaTodo from './todo.ja.json';
import jaNames from './catch.ja.json';
import jaGym from './gym.ja.json';
import jaIts from './its.ja.json';
import jaKalori from './kalori.ja.json';
import jaBots from './bots.ja.json';
import jaRooms from './rooms.ja.json';
import jaVisitors from './visitors.ja.json';
import { jaStrings as jaEnglishTable } from '#lib/english/i18n.ts';
import { jaStrings as jaSugorokuTable } from '#lib/sugoroku/i18n.ts';
import { jaStrings as jaSpeakTable } from '#lib/sugoroku/speak.ts';
import { jaStrings as jaSpeechTable } from '#lib/speech/i18n.ts';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// The feature tables of their own, a sheet's copy each, keyed by their prefix here: English Study (lib/english/i18n.ts),
// 英語すごろく (lib/sugoroku/i18n.ts, its speaking step's speak.ts) and the speech test (lib/speech/i18n.ts).
const keyed = (prefix: string, table: Record<string, string>) => Object.fromEntries(Object.entries(table).map(([k, v]) => [`${prefix}.${k}`, v]));
const jaEnglish = keyed('english', jaEnglishTable());
const jaSugoroku = { ...keyed('sugoroku', jaSugorokuTable()), ...keyed('sugoroku.speak', jaSpeakTable()), ...keyed('speech', jaSpeechTable()) };

const ja: Record<string, string> = { ...jaMain, ...jaTab, ...jaSheets, ...jaFood, ...jaNames, ...jaTravel, ...jaLink, ...jaWed, ...jaTodo, ...jaGym, ...jaIts, ...jaKalori, ...jaBots, ...jaRooms, ...jaVisitors, ...jaEnglish, ...jaSugoroku };

/** The world's keys: shown on the island or in a room (a line, a bubble, a sign, a notice, the HUD), or
 *  an official name (NH's names, as the game writes them). Every other key is a sheet's. */
const WORLD: RegExp[] = [
  // lines: しずえ, the visitors, the curator, the twins, ハニワくん, a look into a wardrobe or a mirror, a clock's time, a toss, the snowman, notes in bottles
  /^host\./, /^chat\./, /^visitor\./, /^museum\.curator/, /^shop\.say\./, /^tent\.hha\./, /^tent\.(peek|dress|clock|toss)\./, /^tent\.theme\./, /^tent\.colour\./,
  /^world\./, /^beach\./, /^critter\./, /^shake\./, /^present\./, /^zodiac\./, /^harvest\.(hello|doneHost)$/,
  /^guest\.(arrived|welcome)$/, /^panel\.sheet(Offline|Retry)$/, /^zukan\.added$/, /^island\.(highfive|balloon|no3d|partnerNewer|me$)/,
  // the HUD, the island's own controls and plates (the leaf menu's pills are a sheet's copy: kanji since 2026-11-08)
  /^island\.(health|food|menu)/, /^zukan\.title$/, /^wallet\.title$/,
  /^say\./, /^room\./, /^tree\./, /^preview\.chip/, /^preview\.(event|season|weather|tod)\./, /^sound\.tapToHear$/, /^sync\./, /^board\.(name|open|new)$/,
  // the rooms' signs and HUD
  /^museum\.(title|room)$/, /^shop\.(title|sign|out|wallet|counter|twins|room|fail)$/, /^shop\.(open|choice)\./, /^tent\.(title|room|back|whose|failed|lights|resetView|edit|homeLook)$/,
  // official names
  /\.name\./, /^fossil\.set\./, /^decor\.item\./, /^travel\.air$/ /* the boarding pass's airline */
];
const isWorld = (k: string): boolean => WORLD.some((r) => r.test(k));

/** The longest stretch of a string with no break opportunity under keep-all, in characters ({n} counts as one). */
function longestRun(s: string): number {
  const runs = s.replace(/\{[^}]+\}/g, 'X').split(/[\s、。！？!?）)」』・〜~/]|(?<=[（(「『])/);
  return Math.max(...runs.map((r) => [...r].length));
}

/** The longest run of Latin letters and digits (the only thing `word-break: normal` won't break), in characters. */
const longestLatin = (s: string): number => Math.max(0, ...(s.replace(/\{[^}]+\}/g, ' ').match(/[A-Za-z0-9]+/g) ?? []).map((r) => r.length));

describe('ja copy: the world (keep-all)', () => {
  it('has no unbreakable run longer than 12 characters (≈ 290px at the 24px title size)', () => {
    const long = Object.entries(ja).filter(([k, v]) => isWorld(k) && longestRun(v) > 12).map(([k, v]) => `${k}: ${v}`);
    expect(long).toEqual([]);
  });
});

describe('ja copy: the sheets (word-break: normal)', () => {
  it('has no Latin or digit run longer than 16 characters', () => {
    const long = Object.entries(ja).filter(([k, v]) => !isWorld(k) && longestLatin(v) > 16).map(([k, v]) => `${k}: ${v}`);
    expect(long).toEqual([]);
  });
});

const sheet = Object.entries(ja).filter(([k]) => !isWorld(k));
const JA = '[\\u3040-\\u30ff\\u4e00-\\u9fff々ー]';

describe('ja copy: the sheets are normal Japanese', () => {
  it('has no space between two Japanese characters (no 分かち書き; around a number or Latin is fine)', () => {
    const spaced = new RegExp(`${JA} +${JA}`);
    expect(sheet.filter(([, v]) => spaced.test(v)).map(([k, v]) => `${k}: ${v}`)).toEqual([]);
  });
  it('spells a term one way (docs/design.md "Copy": 取り消す, もう一度, 保存, 決定, 設定, 記録, 目標, 編集, 削除, 閉じる, 戻る, 今日)', () => {
    const kana = /とりけす|もういちど|ほぞん|けってい|せってい|きろく|もくひょう|へんしゅう|さくじょ|とじる|もどる|きょう/;
    expect(sheet.filter(([, v]) => kana.test(v)).map(([k, v]) => `${k}: ${v}`)).toEqual([]);
  });
});

// The terms the health review found spelt two ways across sheets (health plan C6), for every sheet's key: 図鑑 (not ずかん), 捕まえる, 作る, a range with 〜 (10/29〜11/4, 3〜60%: never – or ～), 取り消す for an undo,
// 資料 for food data's sources (「{n}件の資料で一致」). The world keeps its kana (「ずかんに のったよ！」).
describe('ja copy: one spelling per term, every sheet', () => {
  const sheets = Object.entries(ja).filter(([k]) => !isWorld(k));
  const bad = (re: RegExp) => sheets.filter(([, v]) => re.test(v)).map(([k, v]) => `${k}: ${v}`);
  it('図鑑, 捕まえた, 作る, 取り消す', () => {
    expect(bad(/ずかん|つかまえ|つくる|つくり|つくっ|とりけ|元に戻した/)).toEqual([]);
  });
  it('もう一度 (never もう一回); 英語すごろく’s stone is 文 (never ぶん)', () => {
    expect(bad(/もう一回/)).toEqual([]);
    expect(bad(/(?<![じずたはさ])ぶん/).filter((k) => /^(sugoroku|speech)\./.test(k))).toEqual([]);
  });
  it('a range is 〜', () => {
    expect(bad(/～|[\d}）)]\s?[–—-]\s?[\d{]/)).toEqual([]);
  });
  it('詳しく, 並べ替え; a filter すべて, a verb 全部〜 (全部選ぶ, 全部売る, 全部削除)', () => {
    expect(bad(/くわしく|並べかえ|ならべかえ/)).toEqual([]);
    expect(bad(/すべて(選|売|買|削除|片付)|^全部$/)).toEqual([]);
  });
  it('共有リンク\'s terms: 共有リンク, 作成, 有効期限, 無効にする, 取り消す, コピー, 閲覧 (never in kana or another word)', () => {
    expect(bad(/きょうゆう|シェアリンク|さくせい|ゆうこう|むこうに|えつらん|コピペ|ふくせい/)).toEqual([]);
    const share = sheets.filter(([k]) => k.startsWith('travel.share.')).map(([, v]) => v).join(' ');
    for (const term of ['共有リンク', '作成', '有効期限', '無効にする', '取り消す', 'コピー', '閲覧']) expect(share).toContain(term);
  });
  it('food data\'s sources are 資料, counted 件', () => {
    expect(bad(/件のデータ|\d*つの資料|\}つの資料/)).toEqual([]);
  });
});

// A sheet's lead, note or hint is Japanese that wraps by phrase (ui/Phrases: WebKit has no word-break: auto-phrase, so a
// plain one broke 「削 / 除しますか」); the area not moved yet (the island) and the world's lines are outside it.
describe('ja copy: a sheet\'s lead, note and hint wrap by phrase', () => {
  const SRC = join(import.meta.dirname, '../..');
  const OUT = /\/(island|dev)\/|rooms\/PanHint|tent\/HhaLetter/;
  const walk = (d: string): string[] => readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(join(d, e.name)) : e.name.endsWith('.svelte') ? [join(d, e.name)] : []);
  it('no plain {t(…)} in a <p class="lead | note | hint | soft | foot | none">', () => {
    const plain = /<p class="(?:lead|note|hint|soft|foot|none)[^"]*"[^>]*>\{t\(/;
    const bad = [...walk(join(SRC, 'lib/components')), ...walk(join(SRC, 'routes'))].filter((f) => !OUT.test(f) && plain.test(readFileSync(f, 'utf8')));
    expect(bad.map((f) => f.slice(SRC.length + 1))).toEqual([]);
  });
  // any other <p> holding a plain {…} (the shop's 全部買う line broke 「かい / がら」, class all-line): each file's count
  // only goes down (a ratchet; a short label that never wraps may stay)
  it('no new plain {…} in any <p>: each file\'s count only goes down', () => {
    const now: Record<string, number> = {};
    for (const f of [...walk(join(SRC, 'lib/components')), ...walk(join(SRC, 'routes'))]) {
      const n = OUT.test(f) ? 0 : (readFileSync(f, 'utf8').match(/<p\b[^>]*>\{(?![#@/:])/g)?.length ?? 0);
      if (n) now[f.slice(SRC.length + 1)] = n;
    }
    const more = Object.entries(now).filter(([f, n]) => n > (PLAIN_P[f] ?? 0)).map(([f, n]) => `${f}: ${n} (was ${PLAIN_P[f] ?? 0}): wrap it in <Phrases>`);
    expect(more).toEqual([]);
  });
});
/** Each file's plain {…} <p>s (2026-11-20): may only go down. */
const PLAIN_P: Record<string, number> = {
  'lib/components/board/BoardView.svelte': 1,
  'lib/components/bots/GymDayEditor.svelte': 3,
  'lib/components/bots/GymPage.svelte': 5,
  'lib/components/bots/ItsPage.svelte': 8,
  'lib/components/bots/StatusCard.svelte': 1,
  'lib/components/editor/Editor.svelte': 1,
  'lib/components/editor/ResetConfirm.svelte': 1,
  'lib/components/food/FoodAmount.svelte': 4,
  'lib/components/food/FoodCredits.svelte': 1,
  'lib/components/food/FoodCustom.svelte': 1,
  'lib/components/food/FoodOpen.svelte': 1,
  'lib/components/food/FoodPhoto.svelte': 2,
  'lib/components/food/FoodPortion.svelte': 1,
  'lib/components/food/FoodRecipe.svelte': 4,
  'lib/components/food/FoodScan.svelte': 3,
  'lib/components/food/FoodSummary.svelte': 1,
  'lib/components/health/BodyCard.svelte': 1,
  'lib/components/health/GoalEdit.svelte': 3,
  'lib/components/health/Health.svelte': 1,
  'lib/components/hiking/TrailView.svelte': 3,
  'lib/components/homes/HomePicker.svelte': 1,
  'lib/components/kiroku/BellsLog.svelte': 1,
  'lib/components/kiroku/Zukan.svelte': 1,
  'lib/components/look/ClosetGrid.svelte': 1,
  'lib/components/look/LookPage.svelte': 2,
  'lib/components/panel/SeasonSection.svelte': 2,
  'lib/components/panel/SettingsSheet.svelte': 1,
  'lib/components/rooms/RoomShell.svelte': 1,
  'lib/components/share/SharePage.svelte': 1,
  'lib/components/share/TripShare.svelte': 1,
  'lib/components/shop/Counter.svelte': 3,
  'lib/components/shop/ShopRoom.svelte': 1,
  'lib/components/tent/StereoPicker.svelte': 1,
  'lib/components/tent/TentEdit.svelte': 5,
  'lib/components/tent/TentRoom.svelte': 1,
  'lib/components/travel/MapPane.svelte': 1,
  'lib/components/travel/PackList.svelte': 2,
  'lib/components/travel/ShareLinks.svelte': 2,
  'lib/components/travel/TravelSettings.svelte': 1,
  'lib/components/travel/TravelSheet.svelte': 1,
  'lib/components/map/MapStatus.svelte': 2,
  'lib/components/ui/Sheet.svelte': 1,
  'lib/components/wallet/Purchases.svelte': 1,
  'lib/components/wallet/Shop.svelte': 1,
  'lib/components/wedding/Head.svelte': 2,
  'lib/components/wedding/Notes.svelte': 3,
  'lib/components/wedding/Plan.svelte': 2,
  'lib/components/wedding/Settings.svelte': 1,
  'routes/+layout.svelte': 1,
  'routes/speech/+page.svelte': 5,
  'routes/sugoroku/+page.svelte': 1
};

describe('catalog text', () => {
  it('has no broken characters (U+FFFD) in either language', async () => {
    const en = { ...(await import('./en.json')).default, ...(await import('./catch.en.json')).default, ...(await import('./food.en.json')).default } as Record<string, string>;
    const bad = [...Object.entries(ja), ...Object.entries(en)].filter(([, v]) => v.includes('\uFFFD')).map(([k]) => k);
    expect(bad).toEqual([]);
  });
});
