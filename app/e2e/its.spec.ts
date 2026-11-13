// 設定's 保養所ボット (docs/design.md "Settings"): a member's row under ジムボット pushes its level, which reads the
// its-bot Worker's GET /its/status (lib/its/client.ts, mocked here: the contract's example moved to the pinned time) and
// shows the verdict, the facts and the stay that needs a person; ‹ comes back to the row. 停止 goes out at once; the
// settings are one draft: 保存 sends one PUT (its body checked), ✕ and ‹ ask before dropping it, and a 409 says someone
// else saved, with 読み込み直す. A failed read shows もう一度. The guest has no row. The section is off in builds until
// the Worker is live (ITS_URL ''), so the phones turn it on with `e2e.its`. The rules (notes, the merge, ★/除外,
// verdicts) are view.test.ts's.
import { expect, test, type BrowserContext, type Page, type Route } from './fixtures.ts';
import { fromMenu } from './hud.ts';
import { islandUp } from './island.ts';
import { newRecord } from './record.ts';
import example from '../../its/contract-example.json' with { type: 'json' };
import type { ItsStatus } from '../src/lib/its/contract.ts';

const ORIGIN = 'https://its-bot.island-fund-relay.workers.dev';
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, PUT, POST', 'Access-Control-Allow-Headers': 'Authorization, Content-Type' };

/** The contract's example status with its times moved to `now` (its stays, the 21st and 22nd, still ahead). */
function payload(now: number): ItsStatus {
  const s = structuredClone(example.status) as ItsStatus;
  const dt = now - s.now;
  const r = s.runner!;
  return {
    ...s, now, settings: { ...s.settings, updatedAt: s.settings.updatedAt! + dt },
    runner: { ...r, startedAt: r.startedAt + dt, deadline: r.deadline! + dt, lastScanAt: r.lastScanAt! + dt, lastOkAt: r.lastOkAt! + dt, lastSeen: r.lastSeen + dt,
      solves: { ...r.solves, lastOkAt: r.solves.lastOkAt! + dt }, lastError: { ...r.lastError!, at: r.lastError!.at + dt } },
    bookings: s.bookings.map((b) => ({ ...b, at: b.at + dt })),
    events: s.events.map((e) => ({ ...e, t: e.t + dt }))
  };
}

type Call = { method: string; path: string; auth: string | null; body: unknown };
type Answer = (c: Call, n: number, s: ItsStatus) => { status: number; body: unknown } | undefined;

/** A phone paired as `who`, the Worker answered by `answer` (else: the status, a PUT or POST applied to it), 設定 open. */
async function phone(page: Page, context: BrowserContext, who: 'A' | 'G', answer: Answer = () => undefined) {
  const rec = newRecord();
  await context.addInitScript(() => (localStorage.setItem('e2e.render', 'none'), localStorage.setItem('e2e.its', 'on')));
  await rec.pair(context, who);
  const calls: Call[] = [];
  const first = payload(rec.now());
  let state = first;
  await page.route(`${ORIGIN}/**`, (route: Route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    const c: Call = { method: req.method(), path: new URL(req.url()).pathname, auth: req.headers().authorization ?? null, body: req.postData() ? JSON.parse(req.postData()!) : null };
    calls.push(c);
    const a = answer(c, calls.length, state);
    if (!a) {
      if (c.path === '/its/settings') {
        const { baseUpdatedAt: _, ...v } = c.body as Record<string, unknown>;
        state = { ...state, settings: { ...state.settings, ...v, updatedAt: rec.now(), updatedBy: 'A' } };
      }
      if (c.path === '/its/run') {
        const stop = (c.body as { action: string }).action === 'stop';
        state = { ...state, settings: { ...state.settings, paused: stop }, verdict: stop ? 'stopped' : 'degraded', reasons: stop ? ['paused', 'human_needed'] : ['human_needed'] };
      }
    }
    const { status, body } = a ?? { status: 200, body: state };
    return route.fulfill({ status, contentType: 'application/json', headers: CORS, body: JSON.stringify(body) });
  });
  await page.goto('');
  await islandUp(page);
  await fromMenu(page, 'settings');
  const settings = page.locator('dialog[open] [data-settings]');
  return { calls, settings, first, its: settings.locator('[data-its-page]') };
}

async function open(settings: ReturnType<Page['locator']>) {
  await settings.locator('[data-push="its"]').click();
  await expect(settings.locator('[data-its-verdict]')).toBeVisible();
}

test('a member opens 保養所ボット under ジムボット: the verdict, the facts, the stay that needs a person; ‹ comes back', async ({ page, context }) => {
  const { settings, its, calls } = await phone(page, context, 'A');
  const row = settings.locator('[data-push="its"]');
  await row.scrollIntoViewIfNeeded();
  await expect(row).toContainText('予約設定・動作状況');
  const y = async (sel: string) => (await settings.locator(sel).boundingBox())!.y;
  expect(await y('[data-push="gym"]')).toBeLessThan(await y('[data-push="its"]'));
  expect(await y('[data-push="its"]')).toBeLessThan(await y('[data-settings-zukan]'));

  await row.click();
  await expect(its.locator('[data-its-verdict="degraded"]')).toContainText('要確認');
  await expect(its.locator('[data-its-verdict]')).toContainText('対応が必要な予約があります。');
  await expect(page.locator('dialog[open] .titlebar')).toContainText('保養所ボット');
  await expect(its.locator('[data-its-fact="phase"]')).toContainText('空室を確認中');
  await expect(its.locator('[data-its-fact="report"]')).toContainText('11:59');
  await expect(its.locator('[data-its-fact="run"] a')).toHaveAttribute('href', 'https://github.com/huangwaylon/fitness/actions/runs/19283746');
  await expect(its.locator('[data-its-booking="action"]')).toContainText('NAGU 勝浦');
  await expect(its.locator('[data-its-booking="action"]')).toContainText('日付が近いため');
  await expect(its.locator('[data-its-date]')).toHaveCount(2);
  await expect(its.locator('[data-its-date="2026-11-21"]')).toContainText('あと17日');
  await expect(its.locator('[data-its-foot]')).toContainText('on · abc1234 · 更新 12:00');
  expect(calls[0]).toMatchObject({ method: 'GET', path: '/its/status' });
  expect(calls[0].auth).toMatch(/^Bearer [0-9a-f]{32,}$/);

  // the facilities, folded: ★ NAGU first; the skipped behind 除外中
  const search = its.locator('[data-its-search]');
  await expect(search.locator('summary')).toContainText('★ NAGU 勝浦');
  await search.locator('summary').click();
  await expect(search.locator('[data-its-hotel]').first()).toHaveAttribute('data-its-hotel', 'NAGU 勝浦');
  await expect(search.locator('[data-its-star="NAGU 勝浦"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(its.locator('[data-its-skipped] summary')).toContainText('除外中 2件');

  await page.locator('dialog[open] .titlebar .back').click();
  await expect(its).toHaveCount(0);
  await expect(row).toBeFocused();
});

test('停止 goes out at once, outside the draft; the edits go in one PUT with 保存', async ({ page, context }) => {
  const { settings, its, calls, first } = await phone(page, context, 'A');
  await open(settings);
  await its.locator('[data-its-action="stop"]').click();
  await expect(its.locator('[data-its-run="stopped"]')).toContainText('停止中です。');
  await expect(its.locator('[data-its-verdict="stopped"]')).toBeVisible();
  expect(calls.filter((c) => c.method === 'POST')).toEqual([{ method: 'POST', path: '/its/run', auth: expect.stringMatching(/^Bearer /), body: { action: 'stop' } }]);
  await expect(its.locator('[data-its-save-bar]')).toHaveCount(0);

  // a date added, one removed, a facility skipped, 4 people, 1 minute
  await its.locator('[data-its-date-field]').fill('2026-11-30');
  await its.locator('[data-its-date-add]').click();
  await its.locator('[data-its-date="2026-11-21"] button').click();
  await its.locator('[data-its-search] summary').click();
  await its.locator('[data-its-hotel="リソルの森"] [role="switch"]').click();
  await expect(its.locator('[data-its-skipped] summary')).toContainText('除外中 3件');
  await its.locator('[data-its-guests="4"]').click();
  await its.locator('[data-its-interval="60"]').click();
  const bar = its.locator('[data-its-save-bar]');
  await expect(bar).toBeVisible();
  await bar.locator('[data-its-save]').click();
  await expect(bar).toHaveCount(0);
  const put = calls.find((c) => c.method === 'PUT')!;
  expect(put).toMatchObject({ path: '/its/settings', auth: expect.stringMatching(/^Bearer /) });
  expect(put.body).toEqual({
    intervalSec: 60, dates: ['2026-11-22', '2026-11-30'], guests: 4, skip: ['ゆふいん山水館', 'ブルーベリーヒル勝浦', 'リソルの森'], priority: ['NAGU'], autoConfirm: false,
    baseUpdatedAt: first.settings.updatedAt
  });
  await expect(its.locator('[data-its-date]')).toHaveCount(2);
  await expect(its.locator('[data-its-guests="4"]')).toHaveAttribute('aria-pressed', 'true');
});

test('a draft isn’t dropped by a stray ✕ or ‹: both ask first; 自動で確定 asks before it turns on', async ({ page, context }) => {
  const { settings, its } = await phone(page, context, 'A');
  await open(settings);
  const ask = page.locator('dialog[open] [data-discard-ask]');
  await its.locator('[data-its-auto]').click();
  const on = page.locator('dialog[open] [data-action="on"]');
  await expect(on).toHaveText('自動で確定する');
  await on.click();
  await expect(its.locator('[data-its-auto]')).toHaveAttribute('aria-checked', 'true');
  await expect(its.locator('[data-its-date="2026-11-21"]')).toContainText('あと17日 · 自動で確定');

  await page.locator('dialog[open] .titlebar .back').click();
  await expect(ask).toContainText('入力した内容を破棄しますか？');
  await ask.locator('[data-discard-keep]').click();
  await expect(its).toBeVisible();
  await page.locator('dialog[open] .navbar button.nav.close').click();
  await expect(ask).toBeVisible();
  await ask.locator('[data-discard-keep]').click();
  await expect(its.locator('[data-its-auto]')).toHaveAttribute('aria-checked', 'true');
  await page.locator('dialog[open] .titlebar .back').click();
  await ask.locator('[data-discard-yes]').click();
  await expect(its).toHaveCount(0);
  await expect(settings.locator('[data-push="its"]')).toBeFocused();
});

test('a 409 says someone else saved, and 読み込み直す reads theirs; a failed read offers もう一度', async ({ page, context }) => {
  const { settings, its, calls } = await phone(page, context, 'A', (c, n, s) => {
    if (n === 1) return { status: 500, body: { error: 'boom' } };
    if (c.method === 'PUT') return { status: 409, body: { error: 'conflict', status: { ...s, settings: { ...s.settings, guests: 5, updatedAt: s.now, updatedBy: 'B' } } } };
    return undefined;
  });
  await settings.locator('[data-push="its"]').click();
  const error = its.locator('[data-its-error]');
  await expect(error).toContainText('読み込めませんでした');
  await error.getByRole('button', { name: 'もう一度' }).click();
  await expect(its.locator('[data-its-verdict="degraded"]')).toBeVisible();
  await expect(error).toHaveCount(0);

  await its.locator('[data-its-guests="3"]').click();
  await its.locator('[data-its-save]').click();
  const notice = its.locator('[data-its-conflict]');
  await expect(notice).toContainText('ほかの人が設定を変更しました');
  await expect(its.locator('[data-its-guests="3"]')).toHaveAttribute('aria-pressed', 'true');   // the draft is kept
  await notice.getByRole('button', { name: '読み込み直す' }).click();
  await expect(notice).toHaveCount(0);
  await expect(its.locator('[data-its-save-bar]')).toHaveCount(0);
  await expect(its.locator('[data-its-guests="2"]')).toHaveAttribute('aria-pressed', 'true');   // the mock's own status again
  expect(calls.map((c) => c.method)).toEqual(['GET', 'GET', 'PUT', 'GET']);
});

test('the guest has no 保養所ボット row, and nothing asks the Worker', async ({ page, context }) => {
  const { calls, settings } = await phone(page, context, 'G');
  await expect(settings.locator('[data-settings-zukan]')).toBeVisible();
  await expect(settings.locator('[data-push="its"]')).toHaveCount(0);
  expect(calls).toHaveLength(0);
});
