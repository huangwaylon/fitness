import { describe, expect, it } from 'vitest';
import { arrow, paginate, split, tagInk, tapBox, typeOne, typing, type PagerState } from './pager.ts';

describe("NH's dialogue box", () => {
  it('pages hold two lines; each part starts a page', () => {
    expect(paginate('one')).toEqual(['one']);
    expect(paginate('a\nb')).toEqual(['a\nb']);
    expect(paginate('a\nb\nc\nd\ne')).toEqual(['a\nb', 'c\nd', 'e']);
    expect(paginate(['a\nb\nc', 'intro'])).toEqual(['a\nb', 'c', 'intro']);
    expect(paginate('a\n\nb')).toEqual(['a\nb']); // a blank line doesn't make an empty page
  });
  it('the ▼ shows only when a page is done and another follows; never on the last page', () => {
    const s: PagerState = { pages: ['あいう', 'えお'], page: 0, shown: 0 };
    expect(typing(s)).toBe(true);
    expect(arrow(s)).toBe(false); // still typing
    expect(arrow({ ...s, shown: 3 })).toBe(true);
    expect(arrow({ ...s, page: 1, shown: 2 })).toBe(false); // the last page
  });
  it('a tap finishes the page at once, the next turns the page, the last closes', () => {
    let s: PagerState = { pages: ['ことばの ページ', 'つぎ'], page: 0, shown: 2 };
    let r = tapBox(s);
    expect(r.action).toBe('finish');
    s = r.state;
    expect(split(s)).toEqual(['ことばの ページ', '']);
    r = tapBox(s);
    expect(r.action).toBe('next');
    expect(r.state).toMatchObject({ page: 1, shown: 0 });
    s = r.state;
    s = typeOne(typeOne(s));
    expect(typing(s)).toBe(false);
    expect(typeOne(s)).toBe(s); // done: no more glyphs
    expect(tapBox(s).action).toBe('close');
  });
  it('types a glyph at a time (emoji and kana count as one) and keeps the untyped rest', () => {
    const s: PagerState = { pages: ['♪ラ〜'], page: 0, shown: 1 };
    expect(split(s)).toEqual(['♪', 'ラ〜']);
  });
  it("the name tag's ink reads on the villager's colour", () => {
    expect(tagInk('#FFFFFF')).toBe('#4A3A2C');
    expect(tagInk('#FFD84D')).toBe('#4A3A2C');
    expect(tagInk('#7A2500')).toBe('#FFF9E3');
    expect(tagInk('#0073FF')).toBe('#FFF9E3');
    expect(tagInk('nope')).toBe('#4A3A2C');
  });
});
