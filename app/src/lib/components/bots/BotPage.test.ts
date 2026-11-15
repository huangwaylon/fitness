import { describe, expect, it } from 'vitest';
import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import BotPage from './BotPage.svelte';

const snip = (html: string) => createRawSnippet(() => ({ render: () => html }));
const base = { attr: 'gym', busy: false, onretry: () => {}, stale: false, facts: [] };

describe('BotPage', () => {
  const menu = { label: 'ジムの操作', onopen: () => {} };
  it('ジム with /status failed and /gym/config answered: the error, ⋯ in its own row and the calendar; no skeleton, no status', () => {
    const { body } = render(BotPage, {
      props: { ...base, failed: 'http 500', verdict: null, menu, children: snip('<section data-gym-config></section>') }
    });
    expect(body).toContain('data-gym-error');
    expect(body).toMatch(/class="card pad actrow[^"]*"[\s\S]*data-gym-menu/);
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
  const strip = (state: 'none' | 'ok', empty?: string) =>
    ({ cells: [{ start: 0, end: 1, state, label: '' }], ticks: [], last: null, words: { ok: '正常' }, summary: 's', next: '12:10ごろ', outcome: 'いま空き2枠', empty: empty ? { text: empty } : null });

  it('with a verdict: one card, its word and ⋯ (named, a dialog’s); no sentence row without one; a strip with nothing in it left out; くわしく last', () => {
    const { body } = render(BotPage, {
      props: { ...base, failed: null, verdict: { ...verdict, sentence: '' }, vid: 'healthy', menu,
        strip: strip('none'), facts: [{ id: 'mode', label: 'モード', value: 'ボット' }], children: snip('<section data-gym-config></section>') }
    });
    expect(body).toMatch(/data-gym-verdict="healthy"[\s\S]*data-bots-word[^>]*>順調[\s\S]*aria-label="ジムの操作" aria-haspopup="dialog"[^>]*data-gym-menu/);
    expect(body).not.toContain('data-bots-say');
    expect(body).not.toContain('actrow');
    expect(body).not.toContain('data-gym-scans');
    expect(body.indexOf('data-gym-more')).toBeGreaterThan(body.indexOf('data-gym-config'));
  });

  it('the strip in the card: 次回’s ghost, the counts with their swatches, the 成果 term; nothing kept: the empty line', () => {
    const { body } = render(BotPage, { props: { ...base, failed: null, verdict, strip: strip('ok') } });
    expect(body).toMatch(/data-gym-verdict[\s\S]*data-gym-strip[\s\S]*data-gym-next[^>]*>[\s\S]*12:10ごろ[\s\S]*data-gym-count="ok"[\s\S]*正常1[\s\S]*data-gym-outcome[^>]*>いま空き2枠/);
    const empty = render(BotPage, { props: { ...base, failed: null, verdict, strip: strip('none', 'まだ確認していません') } }).body;
    expect(empty).toContain('data-gym-empty');
    expect(empty).not.toContain('data-gym-strip');
  });

  it('a person must act: the act in the card, its sentence moved to 確認が必要', () => {
    const { body } = render(BotPage, { props: { ...base, attr: 'its', failed: null, verdict: { tone: 'warn', w: 'trouble', word: '一部不調', sentence: '認証が続けて失敗しています。', needsLook: true, act: '箱根をメールで申込' } } });
    expect(body).toMatch(/data-bots-act[^>]*>[\s\S]*箱根を[\s\S]*申込[\s\S]*data-its-alert[\s\S]*data-its-reason[\s\S]*失敗しています。/);
    expect(body).not.toContain('data-bots-say');
  });
});
