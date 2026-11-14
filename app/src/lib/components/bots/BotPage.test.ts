import { describe, expect, it } from 'vitest';
import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import BotPage from './BotPage.svelte';

const snip = (html: string) => createRawSnippet(() => ({ render: () => html }));
const base = { attr: 'gym', busy: false, onretry: () => {}, stale: false, facts: [] };

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

  it('before the first status: the skeleton in the verdict’s place, the calendar already under it', () => {
    const { body } = render(BotPage, { props: { ...base, failed: null, verdict: null, children: snip('<section data-gym-config></section>') } });
    expect(body.indexOf('data-gym-skeleton')).toBeGreaterThan(-1);
    expect(body.indexOf('data-gym-config')).toBeGreaterThan(body.indexOf('data-gym-skeleton'));
  });

  const verdict = { tone: 'good', w: 'healthy', word: '順調', sentence: 'x', needsLook: false } as const;
  const strip = (state: 'none' | 'ok', empty?: string) => ({ cells: [{ start: 0, end: 1, state, label: '' }], ticks: [], title: 't', legend: { ok: 'ok' }, summary: 's', line: 'l', empty });

  it('with a verdict: the action in its row, after the key row (VoiceOver’s order); a strip with nothing in it left out; くわしく last', () => {
    const { body } = render(BotPage, {
      props: { ...base, failed: null, verdict, vid: 'healthy', act: snip('<div data-gym-controls></div>'), keys: [{ id: 'last', label: '前回', value: '11:54' }],
        strip: strip('none'), facts: [{ id: 'mode', label: 'モード', value: 'ボット' }], children: snip('<section data-gym-config></section>') }
    });
    expect(body).toMatch(/data-gym-verdict="healthy"[\s\S]*data-gym-key="last"[\s\S]*data-gym-controls/);
    expect(body).not.toContain('actrow');
    expect(body).not.toContain('data-gym-scans');
    expect(body.indexOf('data-gym-more')).toBeGreaterThan(body.indexOf('data-gym-config'));
  });

  it('an empty strip that warns stays (保養所 running): its line in the cells’ place', () => {
    const { body } = render(BotPage, { props: { ...base, failed: null, verdict, strip: strip('none', '直近1時間の確認なし') } });
    expect(body).toContain('data-gym-empty');
    expect(body).not.toContain('data-gym-strip');
    expect(render(BotPage, { props: { ...base, failed: null, verdict, strip: strip('ok') } }).body).toContain('data-gym-strip');
  });
});
