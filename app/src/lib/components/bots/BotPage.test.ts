import { describe, expect, it } from 'vitest';
import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import BotPage from './BotPage.svelte';
import '#lib/i18n/bots.ts';

const snip = (html: string) => createRawSnippet(() => ({ render: () => html }));
const base = { attr: 'gym', busy: false, onretry: () => {}, facts: [] };
const bot = (failed: string | null, stale = false) => ({ failed, stale, readAt: null });
const head = { title: '空き枠の確認', bot: 'ジム', jump: () => {} };

describe('BotPage', () => {
  const menu = { label: 'ジムの操作', onopen: () => {} };
  it('ジム with /status failed and /gym/config answered: the error, the head (a hollow dot, ⋯) and the calendar; no skeleton, no verdict', () => {
    const { body } = render(BotPage, {
      props: { ...base, bot: bot('http 500'), verdict: null, head, menu, children: snip('<section data-gym-config></section>') }
    });
    expect(body).toContain('data-gym-error');
    expect(body).toMatch(/class="phead[\s\S]*空き枠の確認[\s\S]*data-dot="unknown"[\s\S]*data-gym-menu/);
    expect(body).toContain('aria-label="ジムの状態：不明。Jobsで詳しく見る"');
    expect(body).toContain('data-gym-config');
    expect(body).not.toContain('data-gym-skeleton');
    expect(body).not.toContain('data-gym-verdict');
  });

  it('before the first status: the skeleton, the calendar already under it', () => {
    const { body } = render(BotPage, { props: { ...base, bot: bot(null), verdict: null, head, children: snip('<section data-gym-config></section>') } });
    expect(body.indexOf('data-gym-skeleton')).toBeGreaterThan(-1);
    expect(body.indexOf('data-gym-config')).toBeGreaterThan(body.indexOf('data-gym-skeleton'));
  });

  const verdict = { tone: 'good', w: 'healthy', word: '順調', sentence: 'x', needsLook: false } as const;

  it('a head: the heading, its dot inline (the verdict on it, named, a button to Jobs) and ⋯; no card, no word, no sentence; くわしく last', () => {
    const { body } = render(BotPage, {
      props: { ...base, bot: bot(null), verdict, vid: 'healthy', head, menu, more: [{ id: 'changes', label: 'アプリで変更', n: 1, body: snip('<ul></ul>') }],
        children: snip('<section data-gym-config></section>') }
    });
    expect(body).toMatch(/<h3[^>]*>空き枠の確認<\/h3>[\s\S]*<button[^>]*aria-label="ジムの状態：順調。Jobsで詳しく見る"[^>]*data-gym-verdict="healthy"[\s\S]*data-dot="good"[\s\S]*aria-label="ジムの操作" aria-haspopup="dialog"[^>]*data-gym-menu/);
    expect(body).not.toContain('data-bots-word');
    expect(body).not.toContain('data-bots-say');
    expect(body).not.toContain('card pad status');
    expect(body.indexOf('data-gym-more')).toBeGreaterThan(body.indexOf('data-gym-config'));
  });

  it('a head without a jump (/gym alone): the dot an image, not a button; stale: dimmed and said', () => {
    const { body } = render(BotPage, { props: { ...base, bot: bot(null, true), verdict, head: { ...head, jump: undefined } } });
    expect(body).toMatch(/<span class="dotbtn[^"]*" role="img" aria-label="ジムの状態：順調（古い）"/);
    expect(body).toContain('data-stale');
  });

  it('a person must act: the act leads 確認が必要, its sentence under it; no act: the sentence leads', () => {
    const its = { ...base, attr: 'its', bot: bot(null), head: { ...head, title: '空室の確認', bot: '保養所' } };
    const { body } = render(BotPage, { props: { ...its, verdict: { tone: 'warn', w: 'trouble', word: '一部不調', sentence: '認証が続けて失敗しています。', needsLook: true, act: '箱根をメールで申込' } } });
    expect(body).toMatch(/data-its-alert[\s\S]*data-bots-act[^>]*>[\s\S]*箱根を[\s\S]*申込[\s\S]*data-its-reason[\s\S]*失敗しています。/);
    const say = render(BotPage, { props: { ...its, verdict: { tone: 'bad', w: 'broken', word: '故障', sentence: '止まっています。', needsLook: true } } }).body;
    expect(say).toMatch(/data-its-alert[\s\S]*data-bots-act[^>]*>[\s\S]*止まっています。/);
    expect(say).not.toContain('data-its-reason');
    // nothing to do: no 確認が必要 (the sentence lives in Jobs)
    expect(render(BotPage, { props: { ...its, verdict } }).body).not.toContain('data-its-alert');
  });

  it('Jobs (no head): the card, its word, the as-of', () => {
    const { body } = render(BotPage, { props: { ...base, attr: 'jobs', bot: { failed: null, stale: false, readAt: 0 }, verdict, now: 0 } });
    expect(body).toMatch(/data-jobs-verdict="healthy"[\s\S]*data-bots-word[^>]*>順調[\s\S]*data-bots-asof[\s\S]*data-bots-say/);
    expect(body).not.toContain('phead');
  });

  it('offline with the last copy shown: one quiet line (no tinted error row) and もう一度; offline with nothing shown: the error row', () => {
    const kept = render(BotPage, { props: { ...base, bot: bot('offline'), verdict, vid: 'healthy', head } }).body;
    expect(kept).toMatch(/data-gym-error="" data-offline=""[^>]*>[\s\S]*オフラインのため、前回の内容を表示しています[\s\S]*もう一度/);
    expect(kept).not.toContain('load-error');
    const none = render(BotPage, { props: { ...base, bot: bot('offline'), verdict: null, head } }).body;
    expect(none).toContain('load-error');
    expect(none).not.toContain('data-offline');
  });
});
