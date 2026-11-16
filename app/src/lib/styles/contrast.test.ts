// The theme's readability (the 2026-11-07 contrast review): .obj-cream (an always-cream
// object: a bubble, a cream button, a ticket) puts the day text colours and controls back inside it, so the same token
// reads on navy and on cream, and the soft text holds 4.5:1 where it's read.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const tokens = readFileSync(join(import.meta.dirname, 'tokens.css'), 'utf8');
const theme = readFileSync(join(import.meta.dirname, 'theme.css'), 'utf8');

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

describe('the theme’s readability', () => {
  it('.obj-cream puts every theme text colour back to its day value', () => {
    const rule = theme.match(/\.obj-cream, \.btn\.paper \{([^}]*)\}/)?.[1] ?? '';
    for (const k of ['text', 'text-soft', 'leaf-text', 'coral-text', 'sky-text']) expect(rule).toMatch(new RegExp(`--${k}:\\s*var\\(--c-`));
  });

  it('.obj-cream puts the controls inside it back to the day ones (a ticket’s choices: not ink on night’s navy)', () => {
    const rule = theme.match(/\.obj-cream \{([^}]*)\}/)?.[1] ?? '';
    for (const k of ['ctl', 'ctl-off']) expect(rule).toMatch(new RegExp(`--${k}:\\s*var\\(--c-`));
    expect(rule).toMatch(/--sh-ctl:\s*var\(--sh-obj\)/);
  });

  it('reads at 4.5:1: night soft text on the night card, the day ink-soft on cream, a sunk control’s soft text', () => {
    expect(contrast(tok(night, '--text-soft'), tok(night, '--card'))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tok(night, '--coral-text'), tok(night, '--card'))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tok(tokens, '--c-ink-soft'), tok(tokens, '--c-card'))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tok(tokens, '--c-coral-text'), tok(tokens, '--c-card'))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tok(night, '--text-soft'), tok(night, '--ctl-off'))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tok(tokens, '--c-ink-soft'), tok(tokens, '--c-sunk'))).toBeGreaterThanOrEqual(4.5);
  });
});
