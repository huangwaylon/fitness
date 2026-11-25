// A bot's recent checks (ScanStrip, in its Jobs row): 次回 at the end of the counts' row only while there is a next, and nothing kept (`blank`) drawn as `empty`
// or left out.
import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import ScanStrip from './ScanStrip.svelte';
import type { CardStrip, CellState } from '#lib/strip.ts';

const strip = (state: CellState, over: Partial<CardStrip> = {}): CardStrip =>
  ({ cells: [{ start: 0, end: 1, state, label: '' }], ticks: [], last: null, words: { ok: '正常' }, summary: 's', ...over });
const card = (s: CardStrip) => render(ScanStrip, { props: { page: 'gym', strip: s } }).body;

describe('ScanStrip', () => {
  it('次回: at the end of the counts\' row (no ghost cell) with a next; none while stopped', () => {
    const next = card(strip('ok', { next: '12:10ごろ' }));
    expect(next).toMatch(/class="sline[\s\S]*data-gym-count="ok"[\s\S]*<\/p>[\s\S]*<span class="next[^>]*data-gym-next[^>]*>[^<]*12:10ごろ/);
    expect(next).not.toContain('ghost');
    const stopped = card(strip('ok', { next: null }));
    expect(stopped).toContain('data-gym-strip');
    expect(stopped).not.toContain('ghost');
    expect(stopped).not.toContain('data-gym-next');
  });

  it('nothing kept: `empty` in the strip’s place, else no row; something kept: the strip, never the empty line', () => {
    const empty = card(strip('none', { empty: { text: 'まだ確認していません' } }));
    expect(empty).toMatch(/data-gym-empty[^>]*>まだ確認していません/);
    expect(empty).not.toContain('data-gym-strip');
    const blank = card(strip('none'));
    expect(blank).not.toContain('data-gym-strip');
    expect(blank).not.toContain('data-gym-empty');
    // idle checks only (ジム's alarms with no day to check): the strip, its cells low; its word a label, no number
    const idle = card(strip('idle', { empty: null, words: { ok: '正常', idle: '確認する日なし' } }));
    expect(idle).toContain('data-gym-cell="idle"');
    expect(idle).toMatch(/data-gym-count="idle"[^>]*><i class="cell idle[^>]*><\/i>確認する日なし(<!--[^>]*-->)*<\/span>/);
    expect(card(strip('idle', { empty: null }))).not.toContain('data-gym-count');
    const kept = card(strip('ok', { empty: { text: 'x' } }));
    expect(kept).toContain('data-gym-strip');
    expect(kept).not.toContain('data-gym-empty');
  });
});
