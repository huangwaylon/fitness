// One navigation model (docs/design.md "Navigation"): every modal has a visible ✕ (or a labelled
// close) in the one title bar, every pushed level a ‹ back, one size of both, and nothing advertises swipe-down (no grabber).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(import.meta.dirname, '../../..');
function svelteFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? svelteFiles(p) : n.endsWith('.svelte') ? [p] : [];
  });
}
const files = [...svelteFiles(join(SRC, 'lib/components')), ...svelteFiles(join(SRC, 'routes'))]
  .filter((f) => !f.includes('/dev/'))
  .map((f) => ({ f: relative(SRC, f), src: readFileSync(f, 'utf8') }));
const uses = (src: string, name: string) => new RegExp(`import ${name} from '[^']*/${name}\\.svelte'`).test(src);

describe('navigation', () => {
  it('every modal <dialog> carries the shared close (NavBar or NavButton); banners are not modals', () => {
    const closes = (src: string) => uses(src, 'NavBar') || uses(src, 'NavButton');
    const bad = files.filter((x) => /<dialog\b/.test(x.src) && !/Toast/.test(x.f) && !closes(x.src)).map((x) => x.f);
    expect(bad).toEqual([]);
  });
  it('a paper sheet always renders the title bar with ✕', () => {
    const sheet = files.find((x) => x.f.endsWith('ui/Sheet.svelte'))!.src;
    expect(sheet).toMatch(/<NavBar\b[^>]*onclose=/);
  });
  it('every top panel renders its own title bar with ✕ and ‹ back', () => {
    const phones = files.filter((x) => /<Sheet\b[^>]*variant="top"/.test(x.src));
    expect(phones.length).toBeGreaterThan(0);
    for (const x of phones) expect(x.src, x.f).toMatch(/<NavBar\b[^>]*onback=[^>]*onclose=/);
  });
  it('nothing draws a grabber (swipe-down is never advertised)', () => {
    expect(files.filter((x) => /grabber/.test(x.src)).map((x) => x.f)).toEqual([]);
  });
  it('back and close buttons are the shared NavButton (no ad-hoc ones): no ✕ / × typed into a button, no hand-drawn ✕ path, no button named 閉じる / 戻る but it', () => {
    const glyph = /<button\b[^>]*>\s*[✕×✖]\s*<\/button>/;
    const drawn = /d="M6 6l12 12M18 6L6 18"|d="M6 6 L18 18|d="M18 6 6 18"/;
    const named = /<button\b[^>]*aria-label=\{t\('common\.(close|back)'\)\}/;
    const adhoc = files.filter((x) => !/ui\/(NavButton|Icon)\.svelte$/.test(x.f) && (glyph.test(x.src) || drawn.test(x.src) || named.test(x.src))).map((x) => x.f);
    expect(adhoc).toEqual([]);
  });
  it('one size: NavBar and NavButton take no size (the 32px disc in the 44px hit everywhere)', () => {
    // (components/travel: until the trip guides move onto the kit, NavBar ignores their size="s")
    const sized = files.filter((x) => !x.f.includes('components/travel/') && /<Nav(Bar|Button)\b[^>]*\bsize=/.test(x.src)).map((x) => x.f);
    expect(sized).toEqual([]);
  });
  it('the title bar\'s lead / trailing slots hold compact controls only (a NavButton tool, a pill), never a chip of words like キャンセル', () => {
    const snippets = files.flatMap((x) => [...x.src.matchAll(/\b(?:lead|trailing)=\{[^}]*?\b(\w+)\s*:\s*null\}/g)].map((m) => ({ f: x.f, name: m[1], src: x.src })));
    expect(snippets.length).toBeGreaterThanOrEqual(2);
    const bad = snippets.filter(({ name, src }) => {
      const body = src.match(new RegExp(`\\{#snippet ${name}\\(\\)\\}([\\s\\S]*?)\\{/snippet\\}`))?.[1] ?? '';
      return /common\.(cancel|save|done)/.test(body);
    }).map((x) => `${x.f}: ${x.name}`);
    expect(bad).toEqual([]);
  });
  it('a confirm answers with its verb, never はい / いいえ', () => {
    const ja = JSON.parse(readFileSync(join(SRC, 'lib/i18n/ja.json'), 'utf8')) as Record<string, string>;
    expect(Object.entries(ja).filter(([, v]) => v === 'はい' || v === 'いいえ').map(([k]) => k)).toEqual([]);
  });
});
