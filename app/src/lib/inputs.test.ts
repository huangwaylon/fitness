// Round 10 (ios-scroll-audit H1): iOS Safari zooms the page when an input under 16px is focused, and leaves it zoomed.
// The global guard (styles/theme.css `input, textarea, select { font-size: var(--fs-input) }`) loses to any scoped
// `font:` shorthand, so every component rule that styles a form field (by element, or by a class the markup puts on
// one) must resolve its font size to 16px or more. Sizes resolve through the type tokens in styles/tokens.css;
// clamp() counts as its minimum, max() as its largest argument; em / inherit / unknown values fail (they follow
// the container, which is 15px body text).
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(import.meta.dirname, '..');
const FIELD = /^(input|textarea|select)$/;

function files(p: string): string[] {
  return readdirSync(p, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? files(join(p, d.name)) : [join(p, d.name)]));
}

const tokensCss = readFileSync(join(SRC, 'lib/styles/tokens.css'), 'utf8');
const tokens = new Map([...tokensCss.matchAll(/(--fs-[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));

/** The smallest px a font-size value can resolve to, or NaN when it can't be known statically. */
export function minPx(v: string): number {
  v = v.trim();
  let m: RegExpMatchArray | null;
  if ((m = v.match(/^(\d*\.?\d+)px$/))) return Number(m[1]);
  if ((m = v.match(/^(\d*\.?\d+)rem$/))) return Number(m[1]) * 16;
  if ((m = v.match(/^var\((--[\w-]+)\)$/))) return tokens.has(m[1]) ? minPx(tokens.get(m[1])!) : NaN;
  if ((m = v.match(/^(max|min|clamp)\((.*)\)$/))) {
    const args = splitArgs(m[2]).map(minPx);
    if (m[1] === 'clamp') return args[0];
    if (m[1] === 'max') return args.some((a) => a >= 16) ? Math.max(...args.filter((a) => !Number.isNaN(a))) : NaN;
    return args.some(Number.isNaN) ? NaN : Math.min(...args);
  }
  return NaN;
}

function splitArgs(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  return [...out, cur];
}

/** The size part of a `font:` shorthand (`700 var(--fs-body)/1 var(--font-ui)`), or the `font-size:` value. */
function sizeOf(decl: string, value: string): string | null {
  if (decl === 'font-size') return value;
  const m = value.match(/(?:max|min|clamp)\((?:[^()]|\([^()]*\))*\)|var\(--fs-[\w-]+\)|\d*\.?\d+(?:px|rem|em|%)|\binherit\b|\bvar\(--[\w-]+\)/);
  return m ? m[0] : null;
}

interface Hit { file: string; selector: string; value: string }

function violations(): { checked: number; bad: Hit[] } {
  const bad: Hit[] = [];
  let checked = 0;
  for (const f of files(SRC).filter((x) => x.endsWith('.svelte'))) {
    const text = readFileSync(f, 'utf8');
    const style = [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
    const markup = text.replace(/<style[^>]*>[\s\S]*?<\/style>/g, '');
    /** Classes the markup puts on a form field. */
    const fieldClasses = new Set(
      [...markup.matchAll(/<(input|textarea|select)\b[^>]*?\bclass="([^"]+)"/g)].flatMap((m) => m[2].split(/\s+/))
    );
    for (const [, selector, body] of style.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const targets = selector.split(',').some((part) => {
        const last = part.trim().split(/\s+|>|\+|~/).filter(Boolean).at(-1) ?? '';
        const el = last.match(/^[a-z]+/)?.[0] ?? '';
        const classes = [...last.matchAll(/\.([\w-]+)/g)].map((m) => m[1]);
        // `input::placeholder` and the like only colour the field
        return !last.includes('::') && (FIELD.test(el) || classes.some((c) => fieldClasses.has(c)));
      });
      if (!targets) continue;
      for (const [, decl, value] of body.matchAll(/(font-size|font)\s*:\s*([^;]+)/g)) {
        checked++;
        const size = sizeOf(decl, value.replace(/!important/, ''));
        if (!size || !(minPx(size) >= 16)) bad.push({ file: relative(SRC, f), selector: selector.trim(), value: value.trim() });
      }
    }
  }
  return { checked, bad };
}

describe('form fields are 16px or more (no iOS focus zoom)', () => {
  it('resolves the token values', () => {
    expect(minPx('var(--fs-input)')).toBe(16);
    expect(minPx('var(--fs-body)')).toBe(15);
    expect(minPx('max(16px, var(--fs-body))')).toBe(16);
    expect(minPx('clamp(14px, 4vw, 20px)')).toBe(14);
    expect(minPx('1em')).toBeNaN();
  });
  it('every component input / textarea / select rule', () => {
    const { checked, bad } = violations();
    expect(checked).toBeGreaterThan(0);
    expect(bad).toEqual([]);
  });
});
