import { describe, expect, it } from 'vitest';
import {
  BOARD_CHARS, BOARD_LINES, BOARD_MAX, boardAccept, boardBeats, boardFold, boardMayWrite, boardOpOf, boardPosts, cleanText, mergeBoard, newPostId, textLength,
  type BoardEntry, type BoardRow
} from './board.ts';

const T = Date.parse('2026-11-02T03:00:00.000Z');
const set = (id: string, who: 'A' | 'B' | 'G', at: number, t = 'メモ', p = at): BoardEntry => ({ id, who, at, p, t });
const rm = (id: string, who: 'A' | 'B' | 'G', at: number): BoardEntry => ({ id, who, at, rm: true });

describe('cleanText', () => {
  it('trims, strips control characters and bidi overrides, keeps line breaks and emoji', () => {
    expect(cleanText('  こんにちは  ')).toBe('こんにちは');
    expect(cleanText('a\u0000b\u0007c\u001bd\u007f\u0085e')).toBe('abcd\ne');
    expect(cleanText('ab\u202ecd\u2066ef\u200bg\ufeff')).toBe('abcdefg');
    expect(cleanText('一\r\n二\r三\u2028四')).toBe('一\n二\n三\n四');
    expect(cleanText('🐟 つれた！\tやった')).toBe('🐟 つれた！ やった');
    expect(cleanText('\n\n  　まえ　\n')).toBe('まえ');
  });
  it('allows at most BOARD_LINES lines (the rest joined) and no runs of blank lines', () => {
    expect(BOARD_LINES).toBe(4);
    expect(cleanText('1\n2\n3\n4\n5\n6')).toBe('1\n2\n3\n4 5 6');
    expect(cleanText('1\n\n\n\n2')).toBe('1\n\n2');
  });
  it('allows at most BOARD_CHARS characters, counted as code points', () => {
    expect(BOARD_CHARS).toBe(100);
    expect(textLength(cleanText('あ'.repeat(150)))).toBe(100);
    expect(textLength(cleanText('🐟'.repeat(120)))).toBe(100);
    expect(cleanText('🐟'.repeat(120)).length).toBe(200);
  });
  it('drops lone surrogates, never splits a pair, and is idempotent', () => {
    expect(cleanText('a\ud800b\udc00c')).toBe('abc');
    for (const s of ['  x\r\ny ', '1\n2\n3\n4\n5', 'あ'.repeat(120), ' \u202e\u0000 ', '<b>hi</b>']) expect(cleanText(cleanText(s))).toBe(cleanText(s));
    expect(cleanText(42)).toBe('');
  });
});

describe('boardOpOf', () => {
  it('reads a set and a removal, known keys only, the text already clean', () => {
    expect(boardOpOf({ id: 'babcdef1', at: T, p: T, t: 'やあ' })).toEqual({ id: 'babcdef1', at: T, p: T, t: 'やあ' });
    expect(boardOpOf({ id: 'babcdef1', at: T, rm: true })).toEqual({ id: 'babcdef1', at: T, rm: true });
    expect(boardOpOf({ id: 'babcdef1', at: T, p: T, t: ' やあ ' })).toBeNull();
    expect(boardOpOf({ id: 'babcdef1', at: T, p: T, t: '' })).toBeNull();
    expect(boardOpOf({ id: 'babcdef1', at: T, p: T + 1, t: 'x' })).toBeNull();
    expect(boardOpOf({ id: 'babcdef1', at: T, p: T, t: 'x', who: 'A' })).toBeNull();
    expect(boardOpOf({ id: 'babcdef1', at: T, rm: true, p: T })).toBeNull();
    expect(boardOpOf({ id: 'xabcdef1', at: T, p: T, t: 'x' })).toBeNull();
    expect(boardOpOf({ id: 'babcdef1', at: 5, p: 5, t: 'x' })).toBeNull();
    expect(boardOpOf({ id: newPostId(T), at: T, p: T, t: 'x' })).not.toBeNull();
  });
});

describe('the merge', () => {
  it('a removal beats everything, else the later at, then G over B over A', () => {
    expect(boardBeats(rm('b1234567', 'A', T), set('b1234567', 'A', T + 9))).toBe(true);
    expect(boardBeats(set('b1234567', 'A', T + 2), set('b1234567', 'A', T + 1))).toBe(true);
    expect(boardBeats(set('b1234567', 'G', T), set('b1234567', 'B', T))).toBe(true);
    expect(boardBeats(set('b1234567', 'A', T), set('b1234567', 'B', T))).toBe(false);
  });
  it('is commutative: any order gives the same posts', () => {
    const ops = [set('b1111111', 'A', T, 'one'), set('b1111111', 'A', T + 5, 'one!', T), set('b2222222', 'G', T + 1), rm('b2222222', 'B', T + 2), set('b3333333', 'B', T + 3)];
    const orders = [ops, [...ops].reverse(), [ops[3], ops[1], ops[4], ops[0], ops[2]]];
    const views = orders.map((o) => {
      const m = new Map<string, BoardEntry>();
      for (const e of o) mergeBoard(m, e);
      return boardPosts(m.values());
    });
    for (const v of views) expect(v).toEqual(views[0]);
    expect(views[0].map((p) => [p.id, p.t])).toEqual([['b3333333', 'メモ'], ['b1111111', 'one!']]);
  });
  it('shows the newest BOARD_MAX, newest first', () => {
    const many = Array.from({ length: BOARD_MAX + 7 }, (_, i) => set(`bm${String(i).padStart(6, '0')}`, 'A', T + i));
    const v = boardPosts(many);
    expect(v).toHaveLength(BOARD_MAX);
    expect(v[0].id).toBe(`bm${String(BOARD_MAX + 6).padStart(6, '0')}`);
    expect(v.at(-1)!.id).toBe('bm000007');
  });
  it('the phone folds its queued ops as the record takes them (a forbidden edit, an op after a removal and the cap)', () => {
    const ops: BoardRow[] = [
      set('b1111111', 'A', T, 'ウェイの'), set('b1111111', 'G', T + 1, 'ゲストが', T), set('b2222222', 'G', T + 2, 'ゲストの'),
      rm('b2222222', 'G', T + 3), set('b2222222', 'G', T + 4, 'もどれ', T + 2),
      ...Array.from({ length: BOARD_MAX }, (_, i) => set(`bz${String(i).padStart(6, '0')}`, 'B', T + 10 + i))
    ].map((e) => ({ ...e, queued: true }));
    const posts = boardPosts(boardFold(ops).values());
    expect(posts).toHaveLength(BOARD_MAX);
    expect(posts.find((p) => p.id === 'b1111111')).toBeUndefined();
    expect(posts.some((p) => p.t === 'ゲストが' || p.t === 'もどれ')).toBe(false);
    const small = boardPosts(boardFold(ops.slice(0, 5)).values());
    expect(small.map((p) => [p.id, p.t])).toEqual([['b1111111', 'ウェイの']]);
  });
  it('takes the record’s own rows as they are: an edited post is only its latest row', () => {
    const edited = set('b1111111', 'A', T + 5, 'なおした', T);
    expect(boardPosts(boardFold([edited]).values()).map((p) => p.t)).toEqual(['なおした']);
    expect(boardPosts(boardFold([edited, { ...set('b1111111', 'A', T + 6, 'また', T), queued: true }]).values()).map((p) => p.t)).toEqual(['また']);
    expect(boardFold([edited, { ...set('b1111111', 'B', T + 6, 'のっとり', T), queued: true }]).get('b1111111')).toMatchObject({ t: 'なおした' });
  });
});

describe('who may write', () => {
  const mine = set('b1234567', 'G', T);
  it('anyone posts; only the author edits; the author or a member removes', () => {
    for (const w of ['A', 'B', 'G'] as const) expect(boardMayWrite(w, set('bnew0000', w, T), null)).toBe(true);
    expect(boardMayWrite('G', set('b1234567', 'G', T + 1, 'x', T), mine)).toBe(true);
    expect(boardMayWrite('A', set('b1234567', 'A', T + 1, 'x', T), mine)).toBe(false);
    expect(boardMayWrite('A', rm('b1234567', 'A', T + 1), mine)).toBe(true);
    expect(boardMayWrite('B', rm('b1234567', 'B', T + 1), mine)).toBe(true);
    const theirs = set('b7654321', 'A', T);
    expect(boardMayWrite('G', rm('b7654321', 'G', T + 1), theirs)).toBe(false);
    expect(boardMayWrite('G', set('b7654321', 'G', T + 1, 'x', T), theirs)).toBe(false);
    expect(boardMayWrite('B', set('b7654321', 'B', T + 1, 'x', T), theirs)).toBe(false);
  });
  it('the record: forbidden, stale or append (and the cap’s drop)', () => {
    const held = [set('b1234567', 'A', T)];
    expect(boardAccept(held, set('b1234567', 'B', T + 1, 'x', T))).toEqual({ v: 'forbidden' });
    expect(boardAccept(held, set('b1234567', 'A', T + 1, 'x', T))).toEqual({ v: 'append', drop: null });
    expect(boardAccept(held, set('b1234567', 'A', T - 1, 'x', T - 1))).toEqual({ v: 'stale' });
    expect(boardAccept(held, rm('bunknown', 'A', T))).toEqual({ v: 'stale' });
    expect(boardAccept(held, set('bunknown', 'A', T + 9, 'x', T))).toEqual({ v: 'stale' });
    expect(boardAccept([...held, rm('b1234567', 'B', T + 2)], set('b1234567', 'A', T + 9, 'x', T))).toEqual({ v: 'stale' });
    const full = Array.from({ length: BOARD_MAX }, (_, i) => set(`bf${String(i).padStart(6, '0')}`, 'A', T + i));
    expect(boardAccept(full, set('bnewest0', 'G', T + 999))).toEqual({ v: 'append', drop: 'bf000000' });
    expect(boardAccept(full, set('bolder00', 'G', T - 5))).toEqual({ v: 'stale' });
  });
});
