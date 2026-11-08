import { describe, expect, it } from 'vitest';
import { nodeToken, readiness } from './sheetTiming.ts';
import { cleanData } from '#lib/contract/log.ts';

describe('a sheet opening’s readiness (sheetTiming)', () => {
  it('content: the last change before 300 ms of none once the opening is done; a later one is late', () => {
    // a full-height sheet: shown at 20, its first frame (the opening done) at 36, its content built by 60, a portrait at 900
    expect(readiness([24, 40, 60, 900], 20, 36)).toEqual({ content: 60, late: 900 });
    // changes on and on, none 300 ms apart: all of it is the content
    expect(readiness([50, 300, 550, 800], 20, 36)).toEqual({ content: 800, late: -1 });
    // nothing changed: ready as shown
    expect(readiness([], 20, 36)).toEqual({ content: 20, late: -1 });
  });

  it('a slide-up sheet: the changes during its animation never end the content, the quiet counts from its end', () => {
    expect(readiness([30, 200], 20, 260)).toEqual({ content: 200, late: -1 });
    expect(readiness([30, 200, 700, 1200], 20, 260)).toEqual({ content: 200, late: 1200 });
  });

  it('what changed: tag and own class as a log token, never the svelte hash; kept by the log', () => {
    const el = (tag: string, ...cls: string[]) => ({ tagName: tag, classList: cls }) as unknown as Element;
    expect(nodeToken(el('SPAN', 'svelte-fdlvn4', 'av', 'pl'))).toBe('span.av');
    expect(nodeToken(el('IMG', 'svelte-1a0b4kj'))).toBe('img');
    expect(nodeToken(null)).toBeUndefined();
    expect(cleanData('perf.sheet', { sheet: 'health', content: 61.2, late: 2848, what: 'span.av' })).toEqual({ sheet: 'health', content: 61.2, late: 2848, what: 'span.av' });
  });
});
