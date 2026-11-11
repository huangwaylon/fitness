// The docs' pointer check (scripts/docs-check.ts, verify's `docs` step): links, anchors, backticked paths, code citations.
import { describe, expect, it } from 'vitest';
import { LONG, checkCode, checkDoc, isPath, lint, names, outline, slug } from '../../scripts/docs-check.ts';

const files: Record<string, string> = {
  'docs/a.md': '# A\n\n## The guest\n\n### 2.4 Scoring\n\n## Same\n\n## Same\n\n<a id="kept"></a>\n**Mic modes.** text\n\n```\n## Not a heading\n```\n',
  'docs/b.md': '# B\n\n## Weather: rain, snow\n',
  'app/src/lib/x.ts': '',
  'app/e2e/island.ts': '',
};
const exists = (p: string) => p in files || (p.startsWith('*/') && Object.keys(files).some((f) => f.endsWith(p.slice(1))));
const read = (p: string) => files[p] ?? null;

describe('docs-check', () => {
  it('slugs headings as GitHub does', () => {
    expect(slug('The guest')).toBe('the-guest');
    expect(slug('Weather: rain, snow')).toBe('weather-rain-snow');
    expect(slug('`quiet()` and **lazy** loads')).toBe('quiet-and-lazy-loads');
    expect(slug('ききみみ クイズ')).toBe('ききみみ-クイズ');
  });

  it('collects anchors: headings, repeats, <a id>, not inside a fence', () => {
    const a = outline(files['docs/a.md']).anchors;
    for (const id of ['the-guest', '24-scoring', 'same', 'same-1', 'kept']) expect(a.has(id)).toBe(true);
    expect(a.has('not-a-heading')).toBe(false);
  });

  it('names a heading by a whole-word prefix, a bold label, or a section number; never by a longer name or a word cut', () => {
    const md = files['docs/a.md'];
    for (const n of ['The guest', 'the guest', 'Mic modes', '2.4', '2.4-2.6', 'Scoring']) expect(names(md, n), n).toBe(true);
    for (const n of ['The host', '3.1', 'Settings', 'The gu', 'the guest player', 'Scor', 'Mic mo']) expect(names(md, n), n).toBe(false);
    // a whole-word prefix, or a heading then its subsection
    for (const n of ['Weather', 'Weather: rain', 'Weather: rain, snow']) expect(names(files['docs/b.md'], n), n).toBe(true);
    expect(names(files['docs/b.md'], 'Weath')).toBe(false);
  });

  it('tells a backticked path from code and placeholders', () => {
    for (const p of ['app/src/lib/x.ts', 'lib/x.ts', 'food-data/raw/', 'e2e/island.ts']) expect(isPath(p), p).toBe(true);
    for (const p of ['x.ts', '/api/record', 'static/<hash>.ktx2', 'a/b', 'https://x.dev/a.js', 'src/**/*.ts', '_app/version.json']) expect(isPath(p), p).toBe(false);
  });

  it('flags broken links, anchors and paths in a doc', () => {
    const md = [
      '[ok](a.md#the-guest) [self](#x) [web](https://x.dev/y)',
      '[gone](c.md) [bad](a.md#the-host) `lib/x.ts` `e2e/island.ts` `lib/gone.ts`',
    ].join('\n');
    expect(checkDoc('docs/b.md', md, exists, read).map((p) => `${p.line} ${p.msg}`)).toEqual([
      '1 link to #x: no #x in docs/b.md',
      '2 link to c.md: no docs/c.md',
      '2 link to a.md#the-host: no #the-host in docs/a.md',
      '2 path `lib/gone.ts` not found',
    ]);
    // a gitignored folder is named on purpose
    expect(checkDoc('docs/b.md', '`food-data/raw/`', exists, read, (p) => p === 'food-data/raw')).toEqual([]);
    expect(checkDoc('docs/b.md', '`food-data/raw/`', exists, read)).toHaveLength(1);
  });

  it('flags a code comment citing a missing doc, anchor, heading or section', () => {
    const src = [
      '// docs/a.md "The guest", docs/a.md#kept, docs/a.md §2.4, docs/b.md "Weather"',
      '// docs/c.md, docs/a.md#gone, docs/a.md "The host", docs/a.md §3.1',
    ].join('\n');
    expect(checkCode('x.ts', src, read).map((p) => `${p.line} ${p.msg}`)).toEqual([
      '2 docs/c.md: no such doc',
      '2 docs/a.md#gone: no such anchor',
      '2 docs/a.md "The host": no such heading',
      '2 docs/a.md §"3.1": no such heading',
    ]);
  });

  it('checks the heading a doc names after a link or a bare file name', () => {
    const md = '[a](a.md) "The guest", a.md "Scoring" and a.md "The host"; [b](b.md) “Weather”, [a](a.md) "Gone"; `a.md` "x"';
    expect(checkDoc('docs/b.md', md, exists, read).map((p) => p.msg)).toEqual([
      'a.md "Gone": no such heading in docs/a.md',
      'a.md "The host": no such heading in docs/a.md'
    ]);
  });

  it('flags a code comment naming a design note that is gone', () => {
    const src = '// design/avatar/gone.md §3, app/design/avatar/render/player.js';
    expect(checkCode('x.ts', src, read).map((p) => p.msg)).toEqual(['app/design/avatar/gone.md: no such note']);
  });

  it('warns on a date, "the user" and a long line, never inside a fence or a code span', () => {
    const md = ['A rule (the user, 2026-11-10).', '`2026-11-10` in code', '```', 'the user 2026-11-10', '```', 'x'.repeat(LONG + 1)].join('\n');
    expect(lint('docs/a.md', md).map((p) => `${p.line} ${p.msg.split(':')[0].split(' (')[0]}`)).toEqual([
      '1 a date', '1 "the user"', `6 a line of ${LONG + 1} characters`
    ]);
  });
});
