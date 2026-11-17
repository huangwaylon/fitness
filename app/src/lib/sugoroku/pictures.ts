// 英語すごろく's 絵 stones (docs/sugoroku.md "Rules"): an NH item's picture (the app's own art), its English name to
// spell (やさしい: one of three spellings; ふつう: its letters, the first given; むずかしい: its letters and two more), and,
// spelt, a souvenir: three of a set (虫, 海, 畑, 果物, おやつ) pay SET_BONUS once. The names say what the art shows
// (ramen for the bowl, cherries for the pair: the 2026-11-17 panel's check).

type PictureSet = 'bug' | 'sea' | 'farm' | 'fruit' | 'treat';
export interface Picture {
  /** Its English name (what's spelt). */
  w: string;
  ja: string;
  set: PictureSet;
  /** Its art's key (lib/art.ts artUrl). */
  key: string;
}

const P = (set: PictureSet, dir: string, list: string): Picture[] =>
  list.split(' ').map((x) => {
    const [w, ja, file] = x.split(':');
    return { w, ja, set, key: `${dir}/${file ?? w}` };
  });

export const PICTURES: readonly Picture[] = [
  ...P('bug', 'critters', 'ant:アリ bee:ミツバチ:honeybee moth:ガ fly:ハエ snail:カタツムリ spider:クモ cricket:コオロギ firefly:ホタル ladybug:テントウムシ wasp:スズメバチ'),
  ...P('sea', 'critters', 'octopus:タコ squid:イカ tuna:マグロ salmon:サケ oyster:カキ lobster:ロブスター goldfish:金魚 seaweed:海藻'),
  ...P('sea', 'finds', 'pearl:真珠 coral:サンゴ'),
  ...P('farm', 'finds', 'carrot:にんじん potato:じゃがいも tomato:トマト pumpkin:かぼちゃ wheat:小麦'),
  ...P('farm', 'critters', 'frog:カエル'),
  ...P('fruit', 'fruit', 'apple:りんご cherries:さくらんぼ:cherry peach:もも pear:洋なし'),
  ...P('fruit', 'finds', 'coconut:ココナッツ'),
  ...P('treat', 'items', 'bread:パン candy:あめ cookies:クッキー ramen:ラーメン:dinner')
];

export const SET_BONUS = 5;
const SET_SIZE = 3;
/** A picture spelt: first try, after a nudge, after 答えはこれ. */
export const PICTURE_STARS = [5, 3, 2];

/** The letters a seat spells a picture with (level 2: its own letters; 3: and two more), shuffled by `r`. */
export function lettersFor(p: Picture, level: number, r: () => number): string[] {
  const extra = level >= 3 ? ['e', 'a', 'r', 's', 't', 'o', 'n', 'l'].filter((l) => !p.w.includes(l)).slice(0, 8) : [];
  const pool = extra.length ? extra : ['k', 'm'];
  const more = level >= 3 ? [pool[Math.floor(r() * pool.length)], pool[Math.floor(r() * pool.length)]] : [];
  const tiles = [...p.w, ...more];
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  return tiles;
}

/** やさしい's three spellings: the word and two near misses (a letter doubled or two swapped), shuffled by `r`. */
export function choicesFor(p: Picture, r: () => number): string[] {
  const w = p.w, n = w.length;
  const swap = (i: number) => w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2);
  const near = new Set<string>();
  for (let k = 0; k < 20 && near.size < 2; k++) {
    const i = Math.floor(r() * (n - 1));
    const c = k % 2 ? swap(i) : w.slice(0, i + 1) + w[i] + w.slice(i + 1);
    if (c !== w) near.add(c);
  }
  const out = [w, ...near];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** The set bonuses a collection holds (sets of SET_SIZE). */
export const setsOf = (have: readonly number[]): number => {
  const n: Partial<Record<PictureSet, number>> = {};
  for (const i of have) n[PICTURES[i].set] = (n[PICTURES[i].set] ?? 0) + 1;
  return Object.values(n).reduce((s, k) => s + Math.floor(k / SET_SIZE), 0);
};
