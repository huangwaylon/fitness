// One navigation model (docs/design.md "Navigation"): every modal has a visible ✕ (or a labelled
// close) in the one title bar, every pushed level a ‹ back, and nothing advertises swipe-down (no grabber).
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
  it('every modal <dialog> carries the shared close (NavBar or NavButton; banners are not modals)', () => {
    const bad = files.filter((x) => /<dialog\b/.test(x.src) && !/Toast/.test(x.f) && !uses(x.src, 'NavBar') && !uses(x.src, 'NavButton')).map((x) => x.f);
    expect(bad).toEqual([]);
  });
  it('a paper sheet always renders the title bar with ✕', () => {
    const sheet = files.find((x) => x.f.endsWith('ui/Sheet.svelte'))!.src;
    expect(sheet).toMatch(/<NavBar\b[^>]*onclose=/);
  });
  it('every phone sheet renders its own title bar with ✕ and ‹ back', () => {
    const phones = files.filter((x) => /<Sheet\b[^>]*variant="phone"/.test(x.src));
    expect(phones.length).toBeGreaterThan(0);
    for (const x of phones) expect(x.src, x.f).toMatch(/<NavBar\b[^>]*onback=[^>]*onclose=/);
  });
  it('nothing draws a grabber (swipe-down is never advertised)', () => {
    expect(files.filter((x) => /grabber/.test(x.src)).map((x) => x.f)).toEqual([]);
  });
  it('back and close buttons are the shared NavButton (no ad-hoc ones)', () => {
    const adhoc = files.filter((x) => !x.f.endsWith('NavButton.svelte') && /href="#i-(back|close)"/.test(x.src) && !/class="rm"/.test(x.src)).map((x) => x.f);
    expect(adhoc).toEqual([]);
  });
});
