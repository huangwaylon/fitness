import { describe, expect, it } from 'vitest';
import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import BotPage from './BotPage.svelte';

const snip = (html: string) => createRawSnippet(() => ({ render: () => html }));
const base = { attr: 'gym', busy: false, onretry: () => {}, stale: false, facts: [], foot: null };

describe('BotPage', () => {
  it('ジム with /status failed and /gym/config answered: the error, the controls in their own row and the calendar; no skeleton, no status', () => {
    const { body } = render(BotPage, {
      props: { ...base, failed: 'http 500', verdict: null, act: snip('<div data-gym-controls></div>'), children: snip('<section data-gym-config></section>') }
    });
    expect(body).toContain('data-gym-error');
    expect(body).toMatch(/class="card pad actrow[^"]*"[^>]*>\s*<div data-gym-controls>/);
    expect(body).toContain('data-gym-config');
    expect(body).not.toContain('data-gym-skeleton');
    expect(body).not.toContain('data-gym-verdict');
    expect(body).not.toContain('data-gym-status');
  });

  it('before the first status: the calendar already, the skeleton in 動作状況’s place', () => {
    const { body } = render(BotPage, { props: { ...base, failed: null, verdict: null, children: snip('<section data-gym-config></section>') } });
    expect(body.indexOf('data-gym-config')).toBeGreaterThan(-1);
    expect(body.indexOf('data-gym-skeleton')).toBeGreaterThan(body.indexOf('data-gym-config'));
  });

  it('with a verdict: the controls in its row, 動作状況 with one hint when the strip is empty', () => {
    const { body } = render(BotPage, {
      props: { ...base, failed: null, verdict: { tone: 'good', w: 'healthy', word: '順調', sentence: 'x', needsLook: false }, vid: 'healthy', act: snip('<div data-gym-controls></div>'),
        strip: { cells: [{ start: 0, end: 1, state: 'none', label: '' }], ticks: [], title: '', legend: { ok: '', avail: '', fail: '', none: '' }, summary: '', hint: '' } }
    });
    expect(body).toMatch(/data-gym-verdict="healthy"[\s\S]*data-gym-controls/);
    expect(body).not.toContain('actrow');
    expect(body).toContain('data-gym-empty');
    expect(body).not.toContain('data-gym-strip');
  });
});
