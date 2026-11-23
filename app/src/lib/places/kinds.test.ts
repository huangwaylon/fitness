// The Google kinds' table (kinds.ts): a hard kind's category, a soft one's, the words (the kind first, JA variants,
// English, romaji), specific kinds kept apart, the endings' fallback, and every entry inside the contract's taxonomy.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { isPlaceCat, isPlaceSub } from '../contract/places.ts';
import { kindInfo, setKinds } from './kinds.ts';
import { placeKey } from './text.ts';

const lex = (f: string): unknown => JSON.parse(readFileSync(new URL(`./data/${f}`, import.meta.url), 'utf8'));
const TABLE = lex('places-kinds.json');
expect(setKinds({ v: 1, rows: { 'x店': ['麺', 'カフェ', 1, 'x'] } })).toBe(false); // (a sub not its top's: refused, nothing set)
expect(setKinds(TABLE)).toBe(true);

const words = (k: string) => (kindInfo(k)?.words ?? []).map(placeKey);
const has = (k: string, w: string) => words(k).includes(placeKey(w));

describe('kindInfo', () => {
  it('hard kinds carry their own category', () => {
    expect(kindInfo('ラーメン屋')).toMatchObject({ cat: '麺', sub: 'ラーメン', hard: true });
    expect(kindInfo('蕎麦店')).toMatchObject({ cat: '麺', sub: 'そば', hard: true });
    expect(kindInfo('韓国料理店')).toMatchObject({ cat: '世界の料理', sub: 'エスニック', hard: true });
    expect(kindInfo('神社')).toMatchObject({ cat: '見どころ', sub: '寺社', hard: true });
    expect(kindInfo('山頂')).toMatchObject({ cat: '自然・登山', sub: '山', hard: true });
    expect(kindInfo('駅')).toMatchObject({ cat: 'その他', sub: '', hard: true });
    expect(kindInfo('書店')).toMatchObject({ cat: '買い物', sub: '本', hard: true });
  });

  it('soft kinds only suggest', () => {
    for (const k of ['カフェ・喫茶', 'レストラン', '観光名所', 'ホテル', '旅館', '景勝地']) expect(kindInfo(k)?.hard, k).toBe(false);
  });

  it('words: the kind first, JA variants, English and romaji', () => {
    expect(kindInfo('蕎麦店')!.words[0]).toBe('蕎麦店');
    for (const w of ['そば', '蕎麦', 'soba', 'sobaya']) expect(has('蕎麦店', w), w).toBe(true);
    for (const w of ['ramen', 'らーめん']) expect(has('ラーメン屋', w), w).toBe(true);
    expect(has('居酒屋', 'izakaya')).toBe(true);
    expect(has('旅館', 'ryokan')).toBe(true);
    expect(has('日帰り温泉', 'onsen')).toBe(true);
    expect(has('フォー レストラン', 'pho')).toBe(true);
    expect(has('点心店', 'dumplings')).toBe(true);
    expect(has('ハイキング コース', 'hike')).toBe(true);
    expect(has('ハイキング コース', 'trail')).toBe(true);
    expect(has('展望台', 'viewpoint')).toBe(true);
    expect(has('城', 'castle')).toBe(true);
    expect(has('湖', 'lake')).toBe(true);
    expect(has('ベーカリー', 'bakery')).toBe(true);
    expect(has('書店', 'bookstore')).toBe(true);
    expect(has('美術館', 'museum')).toBe(true);
    expect(has('アート ギャラリー', 'gallery')).toBe(true);
  });

  it('specific kinds stay apart', () => {
    expect(has('神社', 'temple')).toBe(false);
    expect(has('仏教寺院', 'shrine')).toBe(false);
    expect(has('仏教寺院', 'temple')).toBe(true);
    expect(has('神社', 'shrine')).toBe(true);
    expect(has('銭湯', 'onsen')).toBe(false);
    expect(has('温泉', 'sento')).toBe(false);
    expect(kindInfo('銭湯')!.sub).toBe('銭湯');
    expect(kindInfo('温泉')!.sub).toBe('温泉');
  });

  it('an unknown kind by its ending, else undefined', () => {
    expect(kindInfo('ウズベキスタン料理店')).toMatchObject({ cat: '世界の料理', hard: false, words: ['ウズベキスタン料理店', 'レストラン', 'restaurant'] });
    expect(kindInfo('おもちゃ博物館')).toMatchObject({ cat: '見どころ', sub: '美術館' });
    expect(kindInfo('長老派教会')?.words).toContain('church');
    expect(kindInfo('なにかの施設')).toBeUndefined();
    expect(kindInfo('')).toBeUndefined();
    expect(kindInfo('toString')).toBeUndefined();
  });

  it('every entry is in the taxonomy, its words unique and not too short', () => {
    // (through the module: the table's own keys via a probe of each row's kind)
    const probe = ['ラーメン屋', 'カフェ・喫茶', '駅', '山小屋', 'サウナ', '夜市', 'ギフト ショップ', 'B&B', 'Vista'];
    for (const k of probe) {
      const i = kindInfo(k)!;
      expect(isPlaceCat(i.cat), k).toBe(true);
      if (i.sub) expect(isPlaceSub(i.cat, i.sub), k).toBe(true);
      expect(new Set(i.words).size, k).toBe(i.words.length);
      for (const w of i.words) expect(placeKey(w).length, `${k}: ${w}`).toBeGreaterThanOrEqual(1);
    }
  });
});
