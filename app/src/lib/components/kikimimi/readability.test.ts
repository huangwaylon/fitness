// ききみみ's readability rules (the 2026-11-07 contrast review: 166 screenshots by day and at night).
// 1. Text colours: the theme's (--text, --text-soft, --leaf-text, --coral-text), never the day-only --c-*-text ones.
//    An always-cream object (a bubble, a cream button, a transcript line, 解説, a stamp) carries .obj-cream (theme.css),
//    which puts the theme's text colours back to the day ones inside it, so the same token reads on navy and on cream.
// 2. Content text is at least 13px (--fs-s): 11px (--fs-xs) and smaller only for the decorative counts, marks and badges
//    listed here.
// 3. The palettes themselves: the soft text and the .obj-cream reset hold 4.5:1 where they're read, a set-aside choice too.
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const DIR = import.meta.dirname;
const STYLES = join(DIR, '../../styles');

function files(p: string): string[] {
  return readdirSync(p, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? files(join(p, d.name)) : d.name.endsWith('.svelte') ? [join(p, d.name)] : []));
}
const comps = files(DIR).map((f) => ({ f: relative(DIR, f), src: readFileSync(f, 'utf8') }));
const style = (src: string) => (src.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '').replace(/\/\*[\s\S]*?\*\//g, '');
const tokens = readFileSync(join(STYLES, 'tokens.css'), 'utf8');
const theme = readFileSync(join(STYLES, 'theme.css'), 'utf8');

/** `file selector` pairs allowed under 13px: counts, marks and badges, never a sentence or a label to read. */
const SMALL = new Set([
  'Progress.svelte .more thead th', // a table's column heads
  'mode/StageRow.svelte .stars', 'onboarding/Placed.svelte .stars', 'zukan/Words.svelte .zc .stars', // ★ counts (aria-hidden)
  'zukan/Words.svelte .zc .new', 'zukan/Voices.svelte .got-mark', // a tile's corner badge
  'zukan/Voices.svelte .more', 'zukan/Stamps.svelte .day', 'zukan/Stamps.svelte .chs small', 'path/VillagerLetter.svelte .etxt small', // numbers
  'taikai/TaikaiPlay.svelte .pips i.line::after, .pips i.gold::after', 'frame/PlayerChip.svelte .read', // icons
  'scene/MarkLegend.svelte .say', 'scene/MarkLegend.svelte .dot', 'scene/SoundLine.svelte .w.st::before', // the marks' samples
  'scene/PhoneFrame.svelte .tm', // a call's running time
  'long/LongTranscript.svelte .q', // a question's number by the line that answers it
]);

const fsPx = new Map([...tokens.matchAll(/(--fs-[\w-]+)\s*:\s*(\d*\.?\d+)rem/g)].map((m) => [m[1], Number(m[2]) * 16]));
/** The font size a `font:` / `font-size:` declaration sets, in px (NaN: not a plain size). */
function size(decl: string): number {
  const v = decl.replace(/^\s*font(-size)?\s*:/, ' ').trim();
  const m = /^font-size/.test(decl.trim()) ? v.match(/^(\S+)/) : v.match(/(?:^|\s)(var\(--fs-[\w-]+\)|\d*\.?\d+px)(?=\/|\s)/);
  if (!m) return NaN;
  const t = m[1];
  if (t.startsWith('var(')) return fsPx.get(t.slice(4, -1)) ?? NaN;
  return t.endsWith('px') ? Number(t.slice(0, -2)) : NaN;
}

/** sRGB hex → relative luminance. */
function lum(hex: string): number {
  const c = hex.replace('#', '').match(/../g)!.map((x) => parseInt(x, 16) / 255).map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const contrast = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const night = tokens.match(/:root\[data-tod="night"\]\s*\{([^}]*)\}/)![1];
/** A token's hex in a block: its own, or the primitive it names (`--text-soft: var(--n-soft)`: :root's --n-soft). */
const tok = (block: string, name: string): string => {
  const v = block.match(new RegExp(`${name}\\s*:\\s*(#[0-9A-Fa-f]{6}|var\\(--[\\w-]+\\))`))![1];
  return v.startsWith('var(') ? tok(tokens, v.slice(4, -1)) : v;
};

describe('ききみみ readability', () => {
  it('uses the theme text colours, never the day-only --c-*-text ones (cream objects carry .obj-cream)', () => {
    const bad = comps.filter((c) => /var\(--c-(coral|leaf|sky)-text\)/.test(c.src)).map((c) => c.f);
    expect(bad).toEqual([]);
  });

  it('sets content text at 13px or more (--fs-xs and smaller only for counts, marks and badges)', () => {
    const bad: string[] = [];
    for (const c of comps) {
      for (const r of style(c.src).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const sel = r[1].trim().replace(/\s+/g, ' ');
        for (const d of r[2].split(';')) {
          if (!/^\s*font(-size)?\s*:/.test(d)) continue;
          const px = size(d);
          if (px < 13 && !SMALL.has(`${c.f} ${sel}`)) bad.push(`${c.f} ${sel} (${px}px)`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('.obj-cream puts every theme text colour back to its day value', () => {
    const rule = theme.match(/\.obj-cream, \.btn\.paper \{([^}]*)\}/)?.[1] ?? '';
    for (const k of ['text', 'text-soft', 'leaf-text', 'coral-text', 'sky-text']) expect(rule).toMatch(new RegExp(`--${k}:\\s*var\\(--c-`));
  });

  it('.obj-cream puts the controls inside it back to the day ones (a ticket’s choices: not ink on night’s navy)', () => {
    const rule = theme.match(/\.obj-cream \{([^}]*)\}/)?.[1] ?? '';
    for (const k of ['ctl', 'ctl-off']) expect(rule).toMatch(new RegExp(`--${k}:\\s*var\\(--c-`));
    expect(rule).toMatch(/--sh-ctl:\s*var\(--sh-obj\)/);
  });

  it('reads at 4.5:1: night soft text on the night card, the day ink-soft on cream', () => {
    expect(contrast(tok(night, '--text-soft'), tok(night, '--card'))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tok(night, '--coral-text'), tok(night, '--card'))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tok(tokens, '--c-ink-soft'), tok(tokens, '--c-card'))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tok(tokens, '--c-coral-text'), tok(tokens, '--c-card'))).toBeGreaterThanOrEqual(4.5);
  });

  it('a choice set aside after the reveal: sunk, its soft text at 4.5:1 by day and at night', () => {
    const grid = comps.find((c) => c.f === 'frame/ChoiceGrid.svelte')!.src;
    expect(style(grid)).toMatch(/\.ch:not\(\[data-mark\]\) \{ background: var\(--ctl-off\); color: var\(--text-soft\);/);
    expect(contrast(tok(night, '--text-soft'), tok(night, '--ctl-off'))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tok(tokens, '--c-ink-soft'), tok(tokens, '--c-sunk'))).toBeGreaterThanOrEqual(4.5);
  });
});
