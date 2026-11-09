// けっこんしき's note grammar, its toolbar and the link allowlist (ported from the old board's tests): what a line
// becomes, that nothing it produces can carry markup, and that an href is http/https or nothing.
import { describe, expect, it } from 'vitest';
import { parseMarkdown, toggleBold, toggleBullets, toggleHeading, groupLinks, type Block, type Span } from './markdown.ts';
import { safeHref, splitLinks, urlAt } from './links.ts';

const kinds = (text: string) => parseMarkdown(text).map((b) => b.kind);
const spans = (b: Block): Span[] => ('spans' in b ? b.spans : 'items' in b ? b.items.flat() : b.lines.flat());
const words = (b: Block) => spans(b).map((s) => s.text).join('');
const line0 = (text: string) => (parseMarkdown(text)[0] as Extract<Block, { kind: 'text' }>).lines[0];

describe('links', () => {
  it('passes http and https through unchanged, trimmed', () => {
    for (const url of ['https://venue.example', 'http://venue.example/hall?a=1&b=2#x', 'HTTPS://VENUE.EXAMPLE', 'https://例え.example/会場']) expect(safeHref(url)).toBe(url);
    expect(safeHref('  https://venue.example  ')).toBe('https://venue.example');
  });
  it('refuses every other scheme and the ways one is smuggled', () => {
    for (const url of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'java\nscript:alert(1)', 'data:text/html;base64,PHNjcmlwdD4=', 'vbscript:x', 'file:///etc/passwd',
      'mailto:a@b.example', 'tel:+81', 'about:blank', '//venue.example', '/wedding/', 'venue.example', 'www.venue.example', 'https://', 'https:// venue.example', '', null, undefined, {}])
      expect(safeHref(url), String(url)).toBe('');
    expect(safeHref('https://venue.example/\u0000x')).toBe('');
    expect(safeHref('https://venue.example/\u0009x')).toBe('');
  });
  it('hands a sentence its punctuation back, keeps a bracket the URL opened, in linear time', () => {
    for (const end of ['.', ',', '。', ')', '」']) expect(urlAt(`https://venue.example${end}`, 0)).toBe('https://venue.example');
    expect(urlAt('https://x.example/a_(b))', 0)).toBe('https://x.example/a_(b)');
    const t0 = performance.now();
    expect(urlAt('https://x.example/' + ')'.repeat(20_000), 0)).toBe('https://x.example/');
    expect(performance.now() - t0).toBeLessThan(1000); // (quadratic: seconds; a busy full run: ~300 ms)
  });
  it('splits text into runs without dropping a character', () => {
    expect(splitLinks('Quote: https://venue.example/q, then')).toEqual([{ text: 'Quote: ' }, { text: 'https://venue.example/q', href: 'https://venue.example/q' }, { text: ', then' }]);
    for (const text of ['a https://b.example c', 'javascript:alert(1) https://c.example', '（https://d.example）', 'https://e.example。つづき'])
      expect(splitLinks(text).map((r) => r.text).join('')).toBe(text);
  });
});

describe('parseMarkdown: blocks', () => {
  it('reads a heading, bullets, numbers and text; deeper headings collapse onto level 2', () => {
    expect(kinds('# Venue\n- a\n- b\n1. Deposit\nBooked.')).toEqual(['heading', 'bullets', 'numbers', 'text']);
    expect(parseMarkdown('### Deep').map((b) => (b.kind === 'heading' ? b.level : 0))).toEqual([2]);
    expect(kinds('#1 dress')).toEqual(['text']);
  });
  it('keeps a single newline as a line break and a blank line as a paragraph', () => {
    const b = parseMarkdown('One\nTwo\n\nThree') as Extract<Block, { kind: 'text' }>[];
    expect(b.map((x) => x.lines.length)).toEqual([2, 1]);
    expect(parseMarkdown('\n\n \n\t\n')).toEqual([]);
    expect(kinds('# A\r\n- b\r\n')).toEqual(['heading', 'bullets']);
  });
});

describe('parseMarkdown: marks and safety', () => {
  it('marks bold, italic and both, and nests them', () => {
    expect(line0('**a**')).toEqual([{ text: 'a', bold: true }]);
    expect(line0('***a***')).toEqual([{ text: 'a', bold: true, italic: true }]);
    expect(line0('*a **b** c*')).toEqual([{ text: 'a ', italic: true }, { text: 'b', bold: true, italic: true }, { text: ' c', italic: true }]);
  });
  it('renders an unmatched marker and arithmetic as typed', () => {
    expect(line0('**not closed')).toEqual([{ text: '**not closed' }]);
    expect(line0('2 * 3 * 4')).toEqual([{ text: '2 * 3 * 4' }]);
  });
  it('never produces anything but text, two flags and an href: raw HTML is text', () => {
    const nasty = '<script>alert(1)</script>\n- <img src=x onerror=y>\n# [a](javascript:1)\n[b](https://x.example)';
    for (const b of parseMarkdown(nasty))
      for (const s of spans(b)) {
        expect(Object.keys(s).every((k) => ['text', 'bold', 'italic', 'href'].includes(k))).toBe(true);
        expect(typeof s.text).toBe('string');
      }
    expect(words(parseMarkdown('<b>hi</b>')[0])).toBe('<b>hi</b>');
    expect(words(parseMarkdown('[a](javascript:1)')[0])).toBe('[a](javascript:1)');
  });
  it('gives an href to http and https and to nothing else', () => {
    const docs = ['[a](https://x.example)', '[a](http://x.example)', '[a](javascript:alert(1))', '[a](data:text/html,x)', '[a](mailto:a@b.example)', '[a](//x.example)',
      '[a](/wedding/)', 'bare https://x.example here', 'bare www.x.example here', '**[a](https://x.example)**', '- [a](https://x.example)', '# [a](https://x.example)'];
    let linked = 0;
    for (const d of docs)
      for (const b of parseMarkdown(d))
        for (const s of spans(b))
          if (s.href !== undefined) {
            linked++;
            expect(s.href).toMatch(/^https?:\/\//i);
          }
    expect(linked).toBe(6);
  });
  it('a link label with marks is one anchor', () => {
    const l = line0('[the **pavilion** hall](https://x.example) ok');
    expect(groupLinks(l).map((g) => [g.href, g.spans.length])).toEqual([['https://x.example', 3], [undefined, 1]]);
  });
});

describe('the toolbar', () => {
  it('bold wraps the selection and a second tap undoes it', () => {
    const once = toggleBold('say yes now', 4, 7);
    expect(once).toEqual({ text: 'say **yes** now', start: 6, end: 9 });
    expect(toggleBold(once.text, once.start, once.end)).toEqual({ text: 'say yes now', start: 4, end: 7 });
    expect(toggleBold('say yes now', 3, 8).text).toBe('say **yes** now');
    expect(toggleBold('one\ntwo', 0, 7).text).toBe('**one**\n**two**');
    expect(toggleBold('- one\n- two', 0, 11).text).toBe('- **one**\n- **two**');
  });
  it('bullets and headings prefix every touched line, strip when all carry it, replace another family', () => {
    expect(toggleBullets('one\ntwo\nthree', 1, 5).text).toBe('- one\n- two\nthree');
    expect(toggleBullets('- one\n- two', 0, 11).text).toBe('one\ntwo');
    expect(toggleHeading('- a', 0, 3).text).toBe('# a');
    expect(toggleHeading('Venue', 2, 2).text).toBe('# Venue');
    expect(toggleBullets('\nabc', 0, 0).text).toBe('- \nabc');
  });
});

describe('parseMarkdown: a whole note in linear time', () => {
  it('reads a 64,000-character line of unclosed marks, brackets, nested runs or URL schemes at once', () => {
    // (each was quadratic or worse: '*a ' × 21,000 took 5 s, nested runs of growing length minutes; a busy full run
    // takes each in tens of ms)
    const lines = [
      '*a '.repeat(21_000), '**a '.repeat(16_000), '***a '.repeat(12_800), '*'.repeat(64_000), '['.repeat(64_000), '[a]('.repeat(16_000),
      'https://'.repeat(8000) + '\u0001', Array.from({ length: 300 }, (_, i) => '*'.repeat(i + 1) + 'a').join(''),
      '['.repeat(32_000) + '](javascript:x)'
    ];
    for (const line of lines) {
      const t0 = performance.now();
      expect(parseMarkdown(line)).toHaveLength(1);
      expect(performance.now() - t0, line.slice(0, 12)).toBeLessThan(1000);
    }
  });

  it('still reads a link, its URL up to a space or a control character', () => {
    expect(line0('see [the hall](https://hall.example/a_(b)) and https://x.example/\u0001y')).toEqual([
      { text: 'see ' }, { text: 'the hall', href: 'https://hall.example/a_(b' }, { text: ') and ' }, { text: 'https://x.example/', href: 'https://x.example/' }, { text: '\u0001y' }
    ]);
  });
});
