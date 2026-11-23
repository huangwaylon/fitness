// The gazetteer (romaji.ts): a ward's kanji, kana and romaji spellings meet, Hepburn's variants, a foreign city's
// Japanese name, a reading two places share, a city or country standing for the places in it. Invented inputs only.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { areaAliases, areaGroup, setGazetteer } from './romaji.ts';
import { placeKey } from './text.ts';

const lex = (f: string): unknown => JSON.parse(readFileSync(new URL(`./data/${f}`, import.meta.url), 'utf8'));
expect(areaAliases('渋谷')).toEqual([]); // (nothing known before the file is in)
expect(setGazetteer({ v: 1 })).toBe(false);
expect(setGazetteer(lex('places-gazetteer.json'))).toBe(true);

const keys = (l: string[]) => new Set(l.map(placeKey));
const aliases = (n: string) => keys(areaAliases(n));

describe('areaAliases', () => {
  it('kanji, hiragana and romaji meet', () => {
    expect(areaAliases('渋谷')).toEqual(expect.arrayContaining(['Shibuya', 'しぶや']));
    expect(aliases('shibuya').has(placeKey('渋谷'))).toBe(true);
    expect(aliases('しぶや').has(placeKey('Shibuya'))).toBe(true);
    // a ward with 区, and a ward its 区 can't leave (港区)
    expect(aliases('渋谷区').has(placeKey('Shibuya'))).toBe(true);
    expect(aliases('港区').has(placeKey('Minato'))).toBe(true);
    expect(aliases('Minato').has(placeKey('港区'))).toBe(true);
  });

  it('the name itself is not an alias', () => {
    expect(aliases('渋谷').has(placeKey('渋谷'))).toBe(false);
    expect(aliases('Kyoto').has(placeKey('kyoto'))).toBe(false);
  });

  it('Hepburn variants: marks, m/n before b-m-p, long vowels', () => {
    for (const n of ['Jimbocho', 'Jinbocho', 'Jinbōchō', 'jinbouchou', '神保町', '神田神保町', 'じんぼうちょう']) {
      const a = new Set([...aliases(n), placeKey(n)]);
      expect(a.has(placeKey('神保町')) && a.has(placeKey('Jimbocho')) && a.has(placeKey('Jinbocho')), n).toBe(true);
    }
    expect(aliases('Ryogoku').has(placeKey('両国'))).toBe(true);
    expect(aliases('Ryōgoku').has(placeKey('両国'))).toBe(true);
    expect(aliases('Oshiage').has(placeKey('押上'))).toBe(true);
    expect(aliases('Shimbashi').has(placeKey('新橋'))).toBe(true);
    expect(aliases('Gotemba').has(placeKey('御殿場'))).toBe(true);
  });

  it('prefectures, with and without 都/府/県', () => {
    expect(aliases('神奈川県').has(placeKey('Kanagawa'))).toBe(true);
    expect(aliases('kanagawa').has(placeKey('神奈川県'))).toBe(true);
    expect(aliases('東京都').has(placeKey('Tokyo'))).toBe(true);
    expect(aliases('tokyo').has(placeKey('東京都'))).toBe(true);
    expect(aliases('京都府').has(placeKey('Kyoto'))).toBe(true);
    expect(aliases('Hokkaido').has(placeKey('北海道'))).toBe(true);
  });

  it('foreign cities and countries, marks folded', () => {
    expect(areaAliases('Seattle')).toEqual(['シアトル']);
    expect(aliases('シアトル').has(placeKey('Seattle'))).toBe(true);
    expect(aliases('Hà Nội').has(placeKey('ハノイ'))).toBe(true);
    expect(placeKey('Hà Nội')).toBe(placeKey('Hanoi')); // (the key folds the marks itself: text.ts)
    expect(placeKey('Đà Nẵng')).toBe(placeKey('Da Nang'));
    expect(aliases('Seoul').has(placeKey('ソウル'))).toBe(true);
    expect(aliases('台北').has(placeKey('Taipei'))).toBe(true);
    expect(aliases('Taiwan').has(placeKey('台湾'))).toBe(true);
    expect(aliases('韓国').has(placeKey('Korea'))).toBe(true);
    expect(aliases('ベトナム').has(placeKey('Vietnam'))).toBe(true);
    expect(aliases('アメリカ合衆国').has(placeKey('USA'))).toBe(true);
    expect(aliases('München').has(placeKey('Munich'))).toBe(true);
    // a label with a slash, by its parts
    expect(aliases('Fatih/İstanbul').has(placeKey('イスタンブール'))).toBe(true);
  });

  it('a shared reading names both; a kanji name only its own', () => {
    const t = aliases('たてやま');
    expect(t.has(placeKey('館山')) && t.has(placeKey('立山'))).toBe(true);
    expect(aliases('館山').has(placeKey('立山'))).toBe(false);
  });

  it('an unknown name has none', () => {
    expect(areaAliases('どこでもない町')).toEqual([]);
    expect(areaAliases('')).toEqual([]);
    expect(areaAliases('Atlantis')).toEqual([]);
  });

  it('no romaji m/n variants abroad', () => {
    expect(areaAliases('Istanbul')).not.toContain('Istambul');
  });
});

describe('areaGroup', () => {
  it('東京: the 23 wards, their towns, the Tama cities', () => {
    const g = keys(areaGroup('東京'));
    const wards = ['千代田', '中央', '港区', '新宿', '文京', '台東', '墨田', '江東', '品川', '目黒', '大田', '世田谷', '渋谷', '中野', '杉並', '豊島', '北区', '荒川', '板橋', '練馬', '足立', '葛飾', '江戸川'];
    for (const w of wards) expect(g.has(placeKey(w)), w).toBe(true);
    for (const w of ['Ginza', 'Kuramae', '神保町', 'Kichijoji', 'Shimokitazawa', 'Nakameguro', 'Daikanyama', 'Ebisu', 'Kiyosumi-shirakawa', '三鷹']) expect(g.has(placeKey(w)), w).toBe(true);
    expect(g.has(placeKey('Yokohama'))).toBe(false);
    expect(keys(areaGroup('Tokyo'))).toEqual(g);
  });

  it('a ward stands for its towns', () => {
    const g = keys(areaGroup('渋谷'));
    for (const w of ['恵比寿', 'Ebisu', 'Daikanyama', 'Harajuku', '広尾']) expect(g.has(placeKey(w)), w).toBe(true);
    // a town under two wards is under both
    expect(keys(areaGroup('港区')).has(placeKey('広尾'))).toBe(true);
    expect(g.has(placeKey('Ginza'))).toBe(false);
  });

  it('metros, regions and countries, all the way down', () => {
    const s = keys(areaGroup('Seattle'));
    for (const w of ['Redmond', 'Bellevue', 'Kirkland']) expect(s.has(placeKey(w)), w).toBe(true);
    expect(s.has(placeKey('Seattle'))).toBe(false);
    expect(keys(areaGroup('シアトル'))).toEqual(s);
    const us = keys(areaGroup('アメリカ'));
    for (const w of ['Seattle', 'Redmond', 'Honolulu', 'Leavenworth']) expect(us.has(placeKey(w)), w).toBe(true);
    const vn = keys(areaGroup('Vietnam'));
    for (const w of ['Hanoi', 'Hà Nội', 'ダナン', 'Hoi An']) expect(vn.has(placeKey(w)), w).toBe(true);
    const kana = keys(areaGroup('神奈川'));
    for (const w of ['鎌倉', 'Hakone', 'えのしま']) expect(kana.has(placeKey(w)), w).toBe(true);
    const jp = keys(areaGroup('日本'));
    for (const w of ['渋谷', 'Kamakura', '京都', 'Nara', '那覇']) expect(jp.has(placeKey(w)), w).toBe(true);
    expect(jp.has(placeKey('Seattle'))).toBe(false);
  });

  it('a place with nothing in it, or unknown: none', () => {
    expect(areaGroup('Redmond')).toEqual([]);
    expect(areaGroup('どこでもない町')).toEqual([]);
  });
});
