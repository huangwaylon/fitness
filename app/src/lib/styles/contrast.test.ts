// The theme's readability (the 2026-11-07 contrast review): the soft text, the coloured texts and the tinted cards hold
// 4.5:1 where they're read. One light theme (tokens.css): these are its values.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const tokens = readFileSync(join(import.meta.dirname, 'tokens.css'), 'utf8');

/** sRGB hex → relative luminance. */
function lum(hex: string): number {
  const c = hex.replace('#', '').match(/../g)!.map((x) => parseInt(x, 16) / 255).map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const contrast = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
/** A primitive's hex in tokens.css. */
const tok = (name: string): string => tokens.match(new RegExp(`${name}\\s*:\\s*(#[0-9A-Fa-f]{6})`))![1];
const hex = (h: string) => h.slice(1).match(/../g)!.map((x) => parseInt(x, 16));
/** `c` at `pct` over `card`. */
const over = (c: string, card: string, pct: number) => '#' + hex(c).map((v, i) => Math.round(v * pct + hex(card)[i] * (1 - pct)).toString(16).padStart(2, '0')).join('');

describe('the theme’s readability', () => {
  it('an ok card (--ok-bg: the leaf at 22% over the card) keeps the text 4.5:1', () => {
    expect(tokens).toMatch(/--ok-bg: color-mix\(in srgb, var\(--c-leaf\) 22%, var\(--c-card\)\)/);
    const ok = over(tok('--c-leaf'), tok('--c-card'), 0.22);
    for (const t of ['--c-ink', '--c-ink-soft', '--c-leaf-text']) expect(contrast(tok(t), ok), t).toBeGreaterThanOrEqual(4.5);
  });

  it('reads at 4.5:1: the soft and coral text on the card and the paper, the soft text on a sunk control', () => {
    for (const t of ['--c-ink-soft', '--c-coral-text', '--c-leaf-text', '--c-sky-text']) {
      expect(contrast(tok(t), tok('--c-card')), `${t} on the card`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(tok(t), tok('--c-paper')), `${t} on the paper`).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrast(tok('--c-ink-soft'), tok('--c-sunk'))).toBeGreaterThanOrEqual(4.5);
  });

  it('きろく’s P · F · C tints (FoodMeal: each colour at --pfc-tint-1 / -2 over the card) keep the text 4.5:1', () => {
    const pct = (n: 1 | 2) => Number(tokens.match(new RegExp(`--pfc-tint-${n}:\\s*([\\d.]+)%`))![1]) / 100;
    for (const c of ['--c-leaf', '--c-yuzu', '--c-mint']) {
      for (const n of [1, 2] as const) expect(contrast(tok('--c-ink'), over(tok(c), tok('--c-card'), pct(n))), `${c} ${n}`).toBeGreaterThanOrEqual(4.5);
    }
    expect(pct(2)).toBeGreaterThan(pct(1));
  });

  it('the menu’s tiles (--tile-*): a white line icon reads at 3:1 on each, ink on ベル’s gold at 4.5:1; each hue its own', () => {
    /** A token's colour: a hex, a var() or a 2-colour sRGB color-mix (nested too), as tokens.css writes them. */
    const rgb = (v: string): number[] => {
      v = v.trim();
      if (v.startsWith('#')) return hex(v);
      const ref = v.match(/^var\((--[\w-]+)\)$/);
      if (ref) return rgb(tokens.match(new RegExp(`${ref[1]}\\s*:\\s*([^;]+);`))![1]);
      const body = v.match(/^color-mix\(in srgb,\s*(.+)\)$/)![1];
      let depth = 0, cut = -1;
      for (let i = 0; i < body.length; i++) {
        if (body[i] === '(') depth++;
        else if (body[i] === ')') depth--;
        else if (body[i] === ',' && !depth) cut = i;
      }
      const [a, b] = [body.slice(0, cut), body.slice(cut + 1)];
      const pa = a.match(/\s(\d+)%\s*$/), p = pa ? Number(pa[1]) / 100 : 0.5;
      const [ca, cb] = [rgb(pa ? a.slice(0, pa.index) : a), rgb(b)];
      return ca.map((x, i) => x * p + cb[i] * (1 - p));
    };
    const toHex = (c: number[]) => '#' + c.map((x) => Math.round(x).toString(16).padStart(2, '0')).join('');
    const tiles = ['todo', 'english', 'travel', 'places', 'hiking', 'wedding', 'bots', 'settings'].map((id) => toHex(rgb(`var(--tile-${id})`)));
    for (const [i, c] of tiles.entries()) expect(contrast(c, '#ffffff'), `${i} ${c}`).toBeGreaterThanOrEqual(3);
    expect(contrast(tok('--c-ink'), toHex(rgb('var(--tile-bells)')))).toBeGreaterThanOrEqual(4.5);
    expect(new Set([...tiles, toHex(rgb('var(--tile-bells)'))]).size).toBe(9);
  });
});
