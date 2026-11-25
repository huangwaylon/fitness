// The editor's names (layout/labels.ts) and the palette's search (search.ts) over the whole catalogue, the outdoor one in.
import { beforeAll, describe, expect, it } from 'vitest';
import { KIND_LIST, kindDef } from '#lib/layout/catalog.ts';
import { loadOutdoor } from '#lib/layout/outdoor.ts';
import { labelOf } from '#lib/layout/labels.ts';
import { validate } from '#lib/layout/validate.ts';
import { defaultLayout, withChanges } from '#lib/layout/model.ts';
import { kindMatches, kunrei, romaji } from './search.ts';
import { liveBadge } from './liveBadge.ts';
import './kanjiNames.ts';

beforeAll(() => loadOutdoor());
const find = (q: string) => KIND_LIST.filter((d) => !d.hidden && kindMatches(d, q)).map((d) => d.k);

describe('labelOf', () => {
  it('names a kind in kanji where its kana name has a kanji word, the rest as the catalogue has it', () => {
    expect(labelOf('stone-lantern')).toBe('石灯籠');
    expect(labelOf('tanuki')).toBe('タヌキの置物');
    expect(labelOf('signpost')).toBe('道標');
    expect(labelOf('shishiodoshi')).toBe('鹿威し');
    expect(labelOf('nh-f1111')).toBe('露天風呂');
    expect(labelOf('nh-f14056')).toBe('ワンはにわ');
    // (katakana and words written in kana kept; a name already in kanji as it is)
    expect(labelOf('lantern')).toBe('ランタン');
    expect(labelOf('kettle')).toBe('やかん');
    expect(labelOf('museum')).toBe('博物館');
    expect(labelOf('nope')).toBe('nope');
  });
  it('names a home by its owner', () => {
    expect(['home-A', 'home-B', 'home-G'].map((id) => labelOf('home', id))).toEqual(['ウェイの家', 'うめの家', 'ゲストの家']);
    expect(labelOf('home')).toBe('家');
  });
  it('leaves no palette name a kana spelling of a common kanji word (a hiragana-only name is a kept one)', () => {
    const KANA_OK = new Set(['とたけけ', 'やかん', 'かかし', 'そり', 'のぼり']);
    // (and a kanji outside the font subsets: 杭)
    KANA_OK.add('まるたのくい');
    const left = KIND_LIST.filter((d) => !d.hidden && /^[ぁ-ゖ]+$/.test(labelOf(d.k)) && !KANA_OK.has(labelOf(d.k))).map((d) => `${d.k} ${labelOf(d.k)}`);
    expect(left).toEqual([]);
  });
  it('only ever renames a kind the catalogue has', () => {
    for (const k of ['stone-lantern', 'nh-f13631', 'nh-f14108']) expect(kindDef(k), k).toBeTruthy();
  });
  it("the checks' texts use the editor's names: a home's its owner's", () => {
    const l = defaultLayout(), o = l.objects.get('home-B')!;
    // (into the sea off the island's left edge)
    const moved = withChanges(l, { set: [{ ...o, x: 0 }] });
    const said = validate(moved).filter((i) => i.ids.includes('home-B')).map((i) => i.ja);
    expect(said.length).toBeGreaterThan(0);
    expect(said.every((t) => t.includes('うめの家'))).toBe(true);
  });
});

describe('the palette search', () => {
  it('finds a kind by its kanji name, its kana (either script), its English, its romaji', () => {
    expect(find('石灯籠')).toContain('stone-lantern');
    expect(find('いしどうろう')).toContain('stone-lantern');
    expect(find('イシドウロウ')).toContain('stone-lantern');
    expect(find('Stone lantern')).toContain('stone-lantern');
    expect(find('ishidourou')).toContain('stone-lantern');
    expect(find('isidourou')).toContain('stone-lantern');
    expect(find('ishid')).toContain('stone-lantern');
    expect(find('torii')).toContain('nh-f13631');
    expect(find('鳥居')).toEqual(['nh-f13631']);
    expect(find('ﾍﾞﾝﾁ')).toContain('park-bench');
  });
  it('every word of the query in one name; nothing for nonsense; everything for nothing', () => {
    expect(find('貝殻 テーブル')).toEqual(['nh-f3980']);
    expect(find('zzzq')).toEqual([]);
    expect(find('  ').length).toBe(KIND_LIST.filter((d) => !d.hidden).length);
  });
  it('romaji both ways', () => {
    expect(romaji('しゃしん')).toBe('syasin');
    expect(romaji('まっちゃ')).toBe('mattya');
    expect(romaji('ちゅうせいのまちなみ')).toBe('tyuuseinomatinami');
    expect(kunrei('shashin')).toBe('syasin');
    expect(kunrei('matcha')).toBe('mattya');
    expect(kunrei('tsuki')).toBe('tuki');
    expect(kunrei('fujisan')).toBe('huzisan');
  });
});

describe('liveBadge', () => {
  it('says the socket as it is, and the edits not sent', () => {
    expect(liveBadge(true, true, 0)).toEqual({ state: 'on', text: 'ライブ', short: 'ライブ' });
    expect(liveBadge(false, true, 0).text).toBe('接続中…');
    expect(liveBadge(false, false, 3)).toEqual({ state: 'off', text: 'オフライン（未送信 3件）', short: 'オフライン · 3件' });
    expect(liveBadge(true, true, 2).text).toBe('ライブ（未送信 2件）');
  });
});
