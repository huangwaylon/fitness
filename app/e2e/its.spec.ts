// ボット's 保養所 tab (docs/design.md "Bots"): a member's menu shows ボット with a dot while the bot needs a person
// (要対応), and its sheet opens on 保養所, which reads the its-bot Worker's GET /its/status (lib/its/client.ts, mocked
// here: the contract's example moved to the pinned time) and shows the verdict, 状況 (くわしく, 直近1時間), the hold that
// needs a person (its deadline, the mail); ジム's tab leaves it. 開始 / 停止 go out at once (開始 needs a stay); the
// settings are one draft: 保存 sends one PUT (its body checked: the allow-list `search` too), ✕, Esc and a tab switch
// ask before dropping it, and a 409 (the
// bare status) or a poll seeing someone else's save says so in the save bar, with 読み込み直す, 保存 turning 上書き保存
// (asks first); 開始 / 停止 never move the draft's base, and 保存 gives up a read in flight. The stays: one at a time or
// まとめて追加, by month, a bar a night (its facilities by why, tapped open: the names and reasons; VoiceOver's line),
// 予約済み. The facilities: the allow-list (derived from a Worker without one, said until saved), the summary, presets,
// 探す · 日程に合わない (a reason a row) · 除外, the new ones' banner; ★ and off
// exclude each other. A refusal is worded, a failed read shows its code and もう一度. Each call carries an X-Request-Id,
// and a Worker whose CORS doesn't allow it still answers. The guest has no ボット, demo mode no 保養所 tab. The rules
// are view.test.ts's.
import { expect, test, type BrowserContext, type Page, type Route } from './fixtures.ts';
import { fromMenu, unfoldMenu } from './hud.ts';
import { islandUp } from './island.ts';
import { newRecord } from './record.ts';
import { ORIGIN, cors, payload, type Status } from './its.ts';
import { ROSTER } from '../src/lib/its/roster.ts';

/** The contract example's skipped facilities (its settings.skip). */
const SKIPPED = ['ゆふいん山水館', 'ブルーベリーヒル勝浦'];

type Call = { method: string; path: string; auth: string | null; rid: string | null; body: unknown };
type Reply = { status: number; body: unknown };
type Answer = (c: Call, n: number, s: Status) => Reply | Promise<Reply> | undefined;
type Opts = { legacy?: boolean; allow?: string; edit?: (s: Status) => Status };

/** A phone paired as `who`, the Worker answered by `answer` (else: the status, a PUT or POST applied to it as the
 *  Worker does: a PUT moves updatedAt, 開始 / 停止 doesn't and records `control`), ボット open on 保養所 (a member's: the
 *  menu's dot read first) or, the guest's, the menu unfolded. `set` changes the
 *  Worker's state behind the page's back (someone else's save). `allow`: the preflight's allowed headers. */
async function phone(page: Page, context: BrowserContext, who: 'A' | 'G', answer: Answer = () => undefined, opts: Opts = {}) {
  const rec = newRecord();
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  // (保養所 the tab last shown on this phone: ジム is the first opening's)
  await context.addInitScript(() => localStorage.setItem('island.botsTab', 'its'));
  await rec.pair(context, who);
  const calls: Call[] = [];
  const first = (opts.edit ?? ((s) => s))(payload(rec.now(), opts.legacy));
  let state = first;
  await page.route(`${ORIGIN}/**`, async (route: Route) => {
    const req = route.request();
    const headers = cors(opts.allow);
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    const h = req.headers();
    // a header the Worker's CORS doesn't allow: the browser's preflight fails the call (a TypeError to the page)
    const allowed = headers['Access-Control-Allow-Headers'].toLowerCase().split(/,\s*/);
    if (h['x-request-id'] && !allowed.includes('x-request-id')) return route.abort('failed');
    const c: Call = { method: req.method(), path: new URL(req.url()).pathname, auth: h.authorization ?? null, rid: h['x-request-id'] ?? null, body: req.postData() ? JSON.parse(req.postData()!) : null };
    calls.push(c);
    const a = answer(c, calls.length, state);
    if (!a) {
      if (c.path === '/its/settings') {
        const { baseUpdatedAt: _, ...v } = c.body as Record<string, unknown>;
        state = { ...state, settings: { ...state.settings, ...v, updatedAt: state.settings.updatedAt! + 1000, updatedBy: 'A' } };
      }
      if (c.path === '/its/run') {
        const action = (c.body as { action: 'start' | 'stop' }).action, stop = action === 'stop';
        state = {
          ...state, settings: { ...state.settings, paused: stop }, verdict: stop ? 'stopped' : 'degraded', reasons: stop ? ['paused', 'human_needed'] : ['human_needed'],
          control: { action, by: 'A', at: state.now }
        };
      }
    }
    const { status, body } = (await a) ?? { status: 200, body: state };
    // (an answer the page gave up on: its fetch was aborted)
    await route.fulfill({ status, contentType: 'application/json', headers, body: JSON.stringify(body) }).catch(() => {});
  });
  await page.goto('');
  await islandUp(page);
  await unfoldMenu(page);
  if (who === 'A') {
    await expect.poll(() => calls.length).toBe(1);
    await page.locator('[data-hud-bots]').click();
  }
  const sheet = page.locator('dialog[open] [data-bots]');
  const set = (f: (s: Status) => Status) => void (state = f(state));
  return { calls, sheet, first, set, state: () => state, its: sheet.locator('[data-its-page]') };
}

/** Someone else's 保存: the Worker's settings moved (guests 5, by B). */
const theirSave = (s: Status): Status => ({ ...s, settings: { ...s.settings, guests: 5, updatedAt: s.settings.updatedAt! + 5000, updatedBy: 'B' } });
/** The page's next poll, now (as on coming back to it). */
const poll = (page: Page) => page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
const puts = (calls: Call[]) => calls.filter((c) => c.method === 'PUT');

async function open(sheet: ReturnType<Page['locator']>) {
  await expect(sheet.locator('[data-its-verdict]')).toBeVisible();
}

test('ボット opens on 保養所 (its tab dotted: 要対応): the verdict, 状況 (くわしく), the hold to finish by mail with its deadline; ジム leaves it', async ({ page, context }) => {
  const { sheet, its, calls } = await phone(page, context, 'A');
  const tab = page.locator('dialog[open] [data-bots-tab="its"]');
  await expect(tab).toHaveAttribute('aria-selected', 'true');
  await expect(tab.locator('[data-tab-dot]')).toBeVisible();
  await expect(tab).toHaveAccessibleName(/^保養所\s*要対応$/);
  await expect(its.locator('[data-its-verdict="degraded"]')).toContainText('要確認');
  await expect(its.locator('[data-its-verdict]')).toContainText('対応が必要な予約があります。');
  await expect(page.locator('dialog[open] .titlebar')).toContainText('ボット');
  const y = async (sel: string) => (await sheet.locator(sel).boundingBox())!.y;
  // 状態 · 最終確認 · 実行; the rest folded under くわしく (not drawn until opened)
  await expect(its.locator('[data-its-fact="phase"]')).toContainText('空室を確認中');
  await expect(its.locator('[data-its-fact="scan"]')).toContainText('11:59（120回）');
  await expect(its.locator('[data-its-fact="run"] a')).toHaveAttribute('href', 'https://github.com/huangwaylon/fitness/actions/runs/19283746');
  await expect(its.locator('[data-its-fact="error"]')).toHaveCount(0);
  await its.locator('[data-its-more] summary').click();
  await expect(its.locator('[data-its-fact="error"]')).toContainText('空室の確認 · 時間切れ');
  await expect(its.locator('[data-its-fact="report"]')).toContainText('11:59');
  // the hold: right under the verdict, its deadline (30 min from 11:44), the mail to look for
  const hold = its.locator('[data-its-booking="action"]');
  await expect(hold).toContainText('NAGU 勝浦');
  await expect(hold).toContainText('日付が近いため');
  await expect(hold.locator('[data-its-hold-left]')).toHaveText(/^あと1[45]分ごろで無効$/);
  await expect(hold.locator('[data-its-steps] li')).toHaveText(['メール『NAGU 勝浦申込手続きのご案内』→ 申込する → 確認', '何もしなければ自動で取り消されます。料金はかかりません。']);
  expect(await y('[data-its-verdict]')).toBeLessThan(await y('[data-its-booking]'));
  expect(await y('[data-its-booking]')).toBeLessThan(await y('[data-its-fact="phase"]'));
  await expect(its.locator('[data-its-date]')).toHaveCount(2);
  await expect(its.locator('[data-its-date="2026-11-21"]')).toContainText('あと17日');
  await expect(its.locator('[data-its-foot]')).toContainText('稼働 · abc1234 · 更新 12:00');
  await expect(its.locator('[data-its-saved-by]')).toHaveText(/^設定の変更：.+・11:/);
  // the menu's read (its dot), then the page's; each with the key and a request id
  expect(calls.slice(0, 2).map((c) => [c.method, c.path])).toEqual([['GET', '/its/status'], ['GET', '/its/status']]);
  expect(calls[0].auth).toMatch(/^Bearer [0-9a-f]{32,}$/);
  expect(calls.every((c) => /^[0-9a-f]{8}$/.test(c.rid ?? ''))).toBe(true);

  // the facilities, folded: in November (FY2026's gap between 夏季 and 冬季) only 直営 and 通年 can take the nights;
  // ★ NAGU (夏季・冬季) can't, so the fold's ★ names nobody
  const search = its.locator('[data-its-search]');
  const fit = ROSTER.filter((h) => (h.kind === 'direct' || h.kind === 'year') && !SKIPPED.includes(h.name));
  const unfit = ROSTER.filter((h) => !(h.kind === 'direct' || h.kind === 'year') && !SKIPPED.includes(h.name));
  const region = (r: string) => fit.filter((h) => h.region === r).length;
  await expect(search.locator('[data-its-sum]')).toHaveText(`この日程で探す施設 ${fit.length}件`);
  await expect(search.locator('[data-its-sum-line]')).toHaveText(`関東 ${region('kanto')}・近郊 ${region('near')}・遠方 ${region('far')}`);
  await expect(search.locator('[data-its-sum-more]')).toHaveText(`ほか${unfit.length}件は日程に合いません`);
  await expect(search.locator('[data-its-hotel]')).toHaveCount(0);
  await its.locator('[data-its-search] > summary').click();
  // presets (no 直営だけ), then 探す by region, 日程に合わない and 除外 folded
  await expect(search.locator('[data-its-preset]')).toHaveCount(3);
  await expect(search.locator('[data-its-part="search"] [data-its-group]')).toHaveCount(3);
  await expect(search.locator('[data-its-part="search"] h4')).toHaveText(`探す${fit.length}件`);
  await expect(search.locator('[data-its-part="search"] h5')).toHaveText([`関東${region('kanto')}`, `近郊${region('near')}`, `遠方${region('far')}`]);
  await expect(search.locator('[data-its-part="search"] [data-its-hotel]')).toHaveCount(fit.length);
  const out = search.locator('[data-its-part="unfit"]');
  await expect(out.locator('summary')).toHaveText(`日程に合わない${unfit.length}件`);
  await expect(search.locator('[data-its-part="off"] summary')).toHaveText(`除外${SKIPPED.length}件`);
  await expect(out.locator('[data-its-hotel="NAGU 勝浦"]')).toBeHidden();
  await out.locator('summary').click();
  // a reason row: NAGU keeps its ★; its small line is why, and its switch says so
  const nagu = out.locator('[data-its-hotel="NAGU 勝浦"]');
  await expect(nagu.locator('[data-its-meta]')).toHaveText('季節外（冬季は12/19から）');
  await expect(nagu.locator('[role="switch"]')).toHaveAccessibleName('NAGU 勝浦、探す、季節外（冬季は12/19から）');
  await expect(nagu.locator('[role="switch"]')).toHaveAttribute('aria-checked', 'true');
  await expect(out.locator('[data-its-hotel="ホテルハーヴェスト　スキージャム勝山"] [data-its-meta]')).toHaveText('掲載終了');
  await expect(nagu.locator('[data-its-star]')).toHaveAttribute('aria-pressed', 'true');
  await expect(nagu.locator('[data-its-star]')).toHaveAttribute('aria-label', 'NAGU 勝浦、優先1');
  await expect(search.locator('[data-its-hotel="トスラブ箱根ビオーレ"] [data-its-meta]')).toHaveText('箱根 · 直営 · 4日前まで');
  // 44px targets: the run's link, ★, a switch, a part's fold, a night, a date's ✕
  for (const sel of ['[data-its-fact="run"] a', '[data-its-star="NAGU 勝浦"]', '[data-its-hotel="NAGU 勝浦"] [role="switch"]', '[data-its-part="unfit"] summary', '[data-its-night]', '[data-its-date-remove]']) {
    const b = (await its.locator(sel).first().boundingBox())!;
    expect(Math.min(b.width, b.height), sel).toBeGreaterThanOrEqual(44);
  }

  // nothing changed: ジム goes straight there, asking nothing, and nothing asks the ITS Worker after
  const n = calls.length;
  const gym = page.locator('dialog[open] [data-bots-tab="gym"]');
  await gym.click();
  await expect(page.locator('dialog[open] [data-discard-ask]')).toHaveCount(0);
  await expect(its).toHaveCount(0);
  await expect(gym).toHaveAttribute('aria-selected', 'true');
  await expect(gym).toBeFocused();
  await poll(page);
  expect(calls).toHaveLength(n);
});

test('停止 goes out at once, outside the draft; the edits go in one PUT with 保存, the allow-list in it', async ({ page, context }) => {
  const { sheet, its, calls, first } = await phone(page, context, 'A');
  await open(sheet);
  await expect(its.locator('[data-its-run="running"]')).toContainText('停止すると次の区切りで止まります。');
  await its.locator('[data-its-action="stop"]').click();
  await expect(its.locator('[data-its-run="stopped"]')).toBeVisible();
  await expect(its.locator('[data-its-control]')).toHaveText(/^停止（.+・12:00）$/);
  await expect(its.locator('[data-its-verdict="stopped"]')).toBeVisible();
  expect(calls.filter((c) => c.method === 'POST')).toEqual([{ method: 'POST', path: '/its/run', auth: expect.stringMatching(/^Bearer /), rid: expect.any(String), body: { action: 'stop' } }]);
  await expect(its.locator('[data-its-save-bar]')).toHaveCount(0);

  // a date added, one removed, a facility off, 4 people, 1 minute
  await expect(its.locator('label[for="its-date-field"]')).toHaveText('泊まる日を選ぶ');
  await its.locator('[data-its-date-field]').fill('2026-11-30');
  await its.locator('[data-its-date-add]').click();
  await its.locator('[data-its-date="2026-11-21"] [data-its-date-remove]').click();
  await its.locator('[data-its-search] > summary').click();
  await its.locator('[data-its-hotel="リソルの森"] [role="switch"]').click();
  await expect(its.locator('[data-its-hotel="リソルの森"] [role="switch"]')).toHaveAttribute('aria-checked', 'false');
  await expect(its.locator('[data-its-part="off"] [data-its-hotel="リソルの森"]')).toHaveCount(1);   // (moved to 除外)
  await expect(its.locator('[data-its-part="off"] summary')).toHaveText('除外3件');
  await its.locator('[data-its-guests="4"]').click();
  await its.locator('[data-its-interval="60"]').click();
  const bar = its.locator('[data-its-save-bar]');
  await expect(bar.locator('[data-its-draft-note]')).toHaveText('開始は保存済みの設定で動きます。');
  await bar.locator('[data-its-save]').click();
  await expect(bar).toHaveCount(0);
  const [put] = puts(calls);
  expect(put).toMatchObject({ path: '/its/settings', auth: expect.stringMatching(/^Bearer /) });
  const body = put.body as Record<string, unknown>;
  expect({ ...body, search: undefined }).toEqual({
    intervalSec: 60, dates: ['2026-11-22', '2026-11-30'], guests: 4, search: undefined, skip: ['ゆふいん山水館', 'ブルーベリーヒル勝浦', 'リソルの森'], priority: ['NAGU'], autoConfirm: false,
    baseUpdatedAt: first.settings.updatedAt
  });
  expect((body.search as string[]).length).toBe(ROSTER.length - 3);
  expect(body.search).not.toContain('リソルの森');
  await expect(its.locator('[data-its-date]')).toHaveCount(2);
  await expect(its.locator('[data-its-guests="4"]')).toHaveAttribute('aria-pressed', 'true');
});

test('a draft isn’t dropped by a stray ✕, Esc or the ジム tab: each asks first; 自動で確定 asks before it turns on, focus back on it', async ({ page, context }) => {
  const { sheet, its } = await phone(page, context, 'A');
  await open(sheet);
  const ask = page.locator('dialog[open] [data-discard-ask]');
  const auto = its.locator('[data-its-auto]');
  await auto.click();
  await page.locator('dialog[open] [data-action="cancel"]').click();
  await expect(auto).toBeFocused();
  await expect(auto).toHaveAttribute('aria-checked', 'false');
  await auto.click();
  const on = page.locator('dialog[open] [data-action="on"]');
  await expect(on).toHaveText('自動で確定する');
  await on.click();
  await expect(auto).toHaveAttribute('aria-checked', 'true');
  await expect(auto).toBeFocused();
  await expect(its.locator('[data-its-date="2026-11-21"]')).toContainText('あと17日 · 自動で確定');
  await expect(its.locator('[data-its-discard]')).toHaveText('変更を破棄');

  const gym = page.locator('dialog[open] [data-bots-tab="gym"]');
  await gym.click();
  await expect(ask).toContainText('入力した内容を破棄しますか？');
  await ask.locator('[data-discard-keep]').click();
  await expect(its).toBeVisible();
  await page.locator('dialog[open] .navbar button.nav.close').click();
  await expect(ask).toBeVisible();
  await ask.locator('[data-discard-keep]').click();
  await auto.focus();
  await page.keyboard.press('Escape');
  await expect(ask).toBeVisible();
  await ask.locator('[data-discard-keep]').click();
  await expect(auto).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('dialog[open] [data-bots-tab="its"]')).toHaveAttribute('aria-selected', 'true');
  await gym.click();
  await ask.locator('[data-discard-yes]').click();
  await expect(its).toHaveCount(0);
  await expect(gym).toHaveAttribute('aria-selected', 'true');
  await expect(sheet).toHaveAttribute('data-tab', 'gym');
});

test('a 409 says who saved, in the save bar, and 読み込み直す reads theirs; a refusal is worded in coral; a failed read shows its code and もう一度', async ({ page, context }) => {
  let n = 0;
  const { its, calls } = await phone(page, context, 'A', (c, i, s) => {
    if (i === 2) return { status: 500, body: { error: 'boom' } };   // the page's first read (the menu's dot was the first call)
    if (c.method === 'PUT' && ++n === 1) return { status: 400, body: { ok: false, error: 'past_date' } };
    if (c.method === 'PUT') return { status: 409, body: theirSave(s) };
    return undefined;
  });
  const error = its.locator('[data-its-error]');
  await expect(error).toContainText('読み込めませんでした（boom 500）');
  await error.getByRole('button', { name: 'もう一度' }).click();
  await expect(its.locator('[data-its-verdict="degraded"]')).toBeVisible();
  await expect(error).toHaveCount(0);

  await its.locator('[data-its-guests="3"]').click();
  await its.locator('[data-its-save]').click();
  const why = its.locator('[data-its-save-failed]');
  await expect(why).toHaveText('過ぎた日付が含まれています。日付を確認してください。');
  expect(await why.evaluate((e) => getComputedStyle(e).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');
  await its.locator('[data-its-save]').click();
  const notice = its.locator('[data-its-save-bar] [data-its-conflict]');
  await expect(notice).toHaveText(/^.+さんが保存しました\s*読み込み直す$/);
  await expect(why).toHaveCount(0);
  await expect(its.locator('[data-its-guests="3"]')).toHaveAttribute('aria-pressed', 'true');   // the draft is kept
  await notice.getByRole('button', { name: '読み込み直す' }).click();
  await expect(its.locator('[data-its-save-bar]')).toHaveCount(0);
  await expect(its.locator('[data-its-guests="2"]')).toHaveAttribute('aria-pressed', 'true');   // the mock's own status again
  expect(calls.map((c) => c.method)).toEqual(['GET', 'GET', 'GET', 'PUT', 'PUT', 'GET']);
});

test('a poll moving the saved settings under a draft: the notice, 保存 becomes 上書き保存 (asks, then sends the new base); undone by hand, the notice goes', async ({ page, context }) => {
  const { sheet, its, calls, set, state } = await phone(page, context, 'A');
  await open(sheet);
  const notice = its.locator('[data-its-conflict]');
  const save = its.locator('[data-its-save]');
  await its.locator('[data-its-guests="3"]').click();
  set(theirSave);
  await poll(page);
  await expect(notice).toContainText('さんが保存しました');
  await expect(its.locator('[data-its-guests="3"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(save).toHaveText('上書き保存');
  // undone by hand: nothing left to save, so nothing in the way; the next poll lets it go
  await its.locator('[data-its-guests="2"]').click();
  await expect(its.locator('[data-its-save-bar]')).toHaveCount(0);
  await poll(page);
  await expect(notice).toHaveCount(0);
  await expect(its.locator('[data-its-guests="5"]')).toHaveAttribute('aria-pressed', 'true');

  // again, and 上書き保存 this time
  await its.locator('[data-its-guests="3"]').click();
  set((s) => ({ ...theirSave(s), settings: { ...theirSave(s).settings, guests: 6 } }));
  const theirs = state().settings.updatedAt;
  await poll(page);
  await expect(save).toHaveText('上書き保存');
  await save.click();
  const yes = page.locator('dialog[open] [data-action="yes"]');
  await expect(yes).toHaveText('上書きする');
  const before = calls.length;
  await page.locator('dialog[open] [data-action="cancel"]').click();
  expect(calls.length).toBe(before);   // やめる sends nothing
  await save.click();
  await yes.click();
  await expect(its.locator('[data-its-save-bar]')).toHaveCount(0);
  await expect(its.locator('[data-its-guests="3"]')).toHaveAttribute('aria-pressed', 'true');
  expect(puts(calls)).toHaveLength(1);
  expect(puts(calls)[0].body).toMatchObject({ guests: 3, baseUpdatedAt: theirs });
});

test('開始 / 停止 with a draft open: the draft keeps its base, so a save someone made meanwhile is noticed, not overwritten', async ({ page, context }) => {
  const { sheet, its, calls, set } = await phone(page, context, 'A');
  await open(sheet);
  await its.locator('[data-its-action="stop"]').click();
  await expect(its.locator('[data-its-run="stopped"]')).toBeVisible();
  await its.locator('[data-its-guests="3"]').click();
  await expect(its.locator('[data-its-draft-note]')).toHaveText('開始は保存済みの設定で動きます。');
  set(theirSave);   // B saves; this page hasn't polled since
  await its.locator('[data-its-action="start"]').click();
  await expect(its.locator('[data-its-run="running"]')).toBeVisible();
  await expect(its.locator('[data-its-draft-note]')).toHaveCount(0);
  await expect(its.locator('[data-its-conflict]')).toContainText('さんが保存しました');
  await expect(its.locator('[data-its-save]')).toHaveText('上書き保存');
  await expect(its.locator('[data-its-guests="3"]')).toHaveAttribute('aria-pressed', 'true');
  expect(puts(calls)).toHaveLength(0);
});

test('開始 needs a stay: without one it is disabled and says so', async ({ page, context }) => {
  const { sheet, its, calls } = await phone(page, context, 'A', undefined, {
    edit: (s) => ({ ...s, verdict: 'stopped', reasons: ['paused', 'no_dates'], settings: { ...s.settings, paused: true, dates: [] }, bookings: [], events: [] })
  });
  await open(sheet);
  const start = its.locator('[data-its-action="start"]');
  await expect(start).toHaveAttribute('aria-disabled', 'true');
  await expect(its.locator('[data-its-need-dates]')).toHaveText('日付を追加してください');
  await start.dispatchEvent('click');   // (aria-disabled: Playwright won't tap it)
  expect(calls.filter((c) => c.method === 'POST')).toHaveLength(0);
  await expect(its.locator('[data-its-date]')).toHaveCount(0);
});

test('a read in flight as 保存 goes is let go: its older answer never replaces the saved settings', async ({ page, context }) => {
  let release: (() => void) | null = null;
  let held = false;
  const { sheet, its, first } = await phone(page, context, 'A', (c) => {
    if (c.method !== 'GET' || !held) return undefined;
    held = false;
    // the status as it was before the save (an older read), answered only after the PUT
    return new Promise<Reply>((ok) => (release = () => ok({ status: 200, body: first })));
  });
  await open(sheet);
  await its.locator('[data-its-guests="4"]').click();
  held = true;
  await poll(page);
  await expect.poll(() => release !== null).toBe(true);
  // 保存 gives the read up (its fetch aborted), so its older answer can't land after the save's
  const givenUp = page.waitForEvent('requestfailed', (r) => r.url().endsWith('/its/status'));
  await its.locator('[data-its-save]').click();
  await givenUp;
  await expect(its.locator('[data-its-save-bar]')).toHaveCount(0);
  await expect(its.locator('[data-its-guests="4"]')).toHaveAttribute('aria-pressed', 'true');
  release!();
  await expect(its.locator('[data-its-guests="4"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(its.locator('[data-its-conflict]')).toHaveCount(0);
});

test('★ and off: ★ numbers the priority and puts the row first, off moves it to 除外 and takes ★ away, ★ on one that is off searches it again', async ({ page, context }) => {
  const { sheet, its } = await phone(page, context, 'A');
  await open(sheet);
  const search = its.locator('[data-its-search]');
  const fold = its.locator('[data-its-search] > summary');
  await fold.click();
  await search.locator('[data-its-part="unfit"] summary').click();
  await search.locator('[data-its-part="off"] summary').click();
  await expect(search.locator('[data-its-hotel]')).toHaveCount(ROSTER.length);
  const first = () => search.locator('[data-its-part="search"] [data-its-hotel]').first();
  const star = its.locator('[data-its-star="リソルの森"]');
  await expect(star).toHaveAttribute('aria-pressed', 'false');
  await expect(star).toHaveAttribute('aria-label', 'リソルの森を優先');
  await star.click();
  await expect(star).toHaveAttribute('aria-pressed', 'true');
  await expect(star).toHaveAttribute('aria-label', 'リソルの森、優先2');
  await expect(first()).toHaveAttribute('data-its-hotel', 'リソルの森');
  await expect(search.locator('[data-its-group="star"] [data-its-hotel]')).toHaveCount(1);
  // the fold's ★: only those that can take the nights (NAGU, 季節外, isn't named)
  await expect(fold.locator('[data-its-sum-line]')).toContainText(' · ★ リソルの森');
  await expect(fold).not.toContainText('NAGU');
  await its.locator('[data-its-star="リソルの森"]').click();
  await expect(its.locator('[data-its-star="リソルの森"]')).toHaveAttribute('aria-pressed', 'false');
  await expect(first()).not.toHaveAttribute('data-its-hotel', 'リソルの森');

  // off NAGU: to 除外, its ★ gone with it
  await its.locator('[data-its-hotel="NAGU 勝浦"] [role="switch"]').click();
  const nagu = search.locator('[data-its-part="off"] [data-its-hotel="NAGU 勝浦"]');
  await expect(nagu.locator('[role="switch"]')).toHaveAttribute('aria-checked', 'false');
  await expect(nagu.locator('[role="switch"]')).toHaveAccessibleName('NAGU 勝浦、除外');
  await expect(nagu.locator('[data-its-meta]')).toHaveText('勝浦 · 夏季・冬季 · 4日前まで');
  await expect(nagu.locator('[data-its-star]')).toHaveAttribute('aria-pressed', 'false');
  // ★ on it: searched again (back in 日程に合わない, ★ 1)
  await nagu.locator('[data-its-star]').click();
  const back = search.locator('[data-its-part="unfit"] [data-its-hotel="NAGU 勝浦"]');
  await expect(back.locator('[role="switch"]')).toHaveAttribute('aria-checked', 'true');
  await expect(back.locator('[data-its-star]')).toHaveAttribute('aria-pressed', 'true');
  // night: the rows' small text in the theme's soft ink, not the yellow row's
  await page.evaluate(() => document.documentElement.setAttribute('data-tod', 'night'));
  const ink = (sel: string) => its.locator(sel).evaluate((e) => getComputedStyle(e).color);
  expect(await ink('[data-its-hotel="トスラブ箱根ビオーレ"] small')).toBe(await ink('[data-its-foot]'));
});

test('the allow-list: presets (関東だけ, 近郊まで, 全部), the parts follow; a new facility’s banner', async ({ page, context }) => {
  const { sheet, its, calls } = await phone(page, context, 'A', undefined, { edit: (s) => ({ ...s, seen: [...s.seen, '新しいリゾート'] }) });
  await open(sheet);
  // offered since the allow-list was saved: not searched until someone says so (除外 meanwhile)
  const banner = its.locator('[data-its-new="新しいリゾート"]');
  await expect(banner).toContainText('新しい施設：新しいリゾート');
  await expect(banner.locator('[data-its-new-on]')).toHaveAttribute('aria-label', '新しいリゾートを探す');
  await expect(its.locator('[data-its-dates-foot]')).toHaveText('ほかに『探さない』3件（施設の一覧で変更）');
  await banner.locator('[data-its-new-on]').click();
  await expect(banner).toHaveCount(0);
  await expect(its.locator('[data-its-dates-foot]')).toHaveText('ほかに『探さない』2件（施設の一覧で変更）');

  const search = its.locator('[data-its-search]');
  const fold = its.locator('[data-its-search] > summary');
  await fold.click();
  await expect(search.locator('[data-its-part="search"] [data-its-group]')).toHaveCount(4);
  await expect(search.locator('[data-its-group="new"] [data-its-hotel="新しいリゾート"] [role="switch"]')).toHaveAttribute('aria-checked', 'true');
  await expect(search.locator('[data-its-group="new"] [data-its-meta]')).toHaveText('新しい施設');
  // 関東だけ: only 関東 searched, the chip pressed; ★ NAGU (関東) stays, in 日程に合わない (11月: 季節外)
  await search.locator('[data-its-preset="kanto"]').click();
  await expect(search.locator('[data-its-preset="kanto"]')).toHaveAttribute('aria-pressed', 'true');
  const kanto = ROSTER.filter((h) => h.region === 'kanto');
  const kantoFit = kanto.filter((h) => h.kind === 'direct' || h.kind === 'year').length;
  await expect(fold.locator('[data-its-sum]')).toHaveText(`この日程で探す施設 ${kantoFit}件`);
  await expect(fold.locator('[data-its-sum-line]')).toHaveText(`関東 ${kantoFit}`);
  await expect(fold.locator('[data-its-sum-more]')).toHaveText(`ほか${kanto.length - kantoFit}件は日程に合いません`);
  await expect(search.locator('[data-its-part="search"] h5')).toHaveText([`関東${kantoFit}`]);
  await expect(search.locator('[data-its-part="off"] summary')).toHaveText(`除外${ROSTER.length + 1 - kanto.length}件`);
  await expect(search.locator('[data-its-star="NAGU 勝浦"]')).toHaveAttribute('aria-pressed', 'true');
  // the bars read the draft at once: n/N
  await expect(its.locator('[data-its-date="2026-11-22"] .nn')).toHaveText(`${kantoFit}/${kanto.length}`);
  // 近郊まで, then 全部 (never the one on no roster)
  await search.locator('[data-its-preset="near"]').click();
  await expect(search.locator('[data-its-part="search"] h5')).toHaveText([/^関東\d+$/, /^近郊\d+$/]);
  await search.locator('[data-its-preset="all"]').click();
  await expect(search.locator('[data-its-part="off"] summary')).toHaveText('除外1件');
  await expect(search.locator('[data-its-part="off"] [data-its-hotel]')).toHaveAttribute('data-its-hotel', 'ホテルハーヴェスト　スキージャム勝山');
  await search.locator('[data-its-preset="kanto"]').click();

  await its.locator('[data-its-save]').click();
  await expect(its.locator('[data-its-save-bar]')).toHaveCount(0);
  const body = puts(calls)[0].body as { search: string[]; skip: string[] };
  expect(body.search.sort()).toEqual(kanto.map((h) => h.name).sort());   // a preset decides every row
  expect(body.skip).toContain('新しいリゾート');
});

test('a Worker without the allow-list: the page derives it, says new facilities aren’t searched, and saves it once asked', async ({ page, context }) => {
  const { sheet, its, calls } = await phone(page, context, 'A', undefined, { legacy: true });
  await open(sheet);
  const note = its.locator('[data-its-migrate]');
  await expect(note).toContainText('新しい施設は自動では探しません');
  await expect(its.locator('[data-its-save-bar]')).toHaveCount(0);   // derived, not a change
  await expect(its.locator('[data-its-dates-total]')).toHaveText(`探す施設 ${ROSTER.length - 2}件`);
  await note.locator('[data-its-migrate-save]').click();
  await expect(note).toHaveCount(0);   // the Worker kept it
  const body = puts(calls)[0].body as { search: string[]; skip: string[] };
  expect(body.search).toHaveLength(ROSTER.length - 2);
  expect(body.search).not.toContain('ゆふいん山水館');
});

test('an older runner (no settingsAt, no reads): the page claims neither the allow-list nor the stop at a booked night', async ({ page, context }) => {
  const { sheet, its } = await phone(page, context, 'A', undefined, {
    legacy: true,
    edit: ({ recentScans: _, ...s }) => ({ ...s, bookings: [...s.bookings, { id: 'r:9', kind: 'confirmed', date: '2026-11-21', hotel: 'リソルの森', number: 'B77', at: s.now - 60_000, runId: 'r' }] })
  });
  await open(sheet);
  await expect(its.locator('[data-its-verdict]')).toBeVisible();
  await expect(its.locator('[data-its-migrate]')).toHaveCount(0);
  await expect(its.locator('[data-its-date="2026-11-21"] small')).toHaveText(/^あと\d+日 · 予約済み$/);
  // 自動で確定 off: nothing is applied for by the bot
  await expect(its.locator('[data-its-hotel-hint]')).toHaveText('空きが出た施設は★の施設から順にすべて仮押さえします。申込はメールから行ってください。');
});

test('the stays: a bar a night (its parts named, VoiceOver’s line), tapped open by why; まとめて追加 (a period’s weekdays, the preview), by month, 予約済み', async ({ page, context }) => {
  const { sheet: bots, its } = await phone(page, context, 'A', undefined, {
    edit: (s) => ({ ...s, bookings: [...s.bookings, { id: 'r:9', kind: 'confirmed', date: '2026-11-21', hotel: 'リソルの森', number: 'B77', at: s.now - 60_000, runId: 'r' }] })
  });
  await open(bots);
  // a booked night: no bar, nothing to open
  await expect(its.locator('[data-its-date="2026-11-21"]')).toContainText('予約済み・探していません');
  await expect(its.locator('[data-its-date="2026-11-21"] [data-its-night]')).toHaveCount(0);
  await expect(its.locator('[data-its-date="2026-11-21"] .bar')).toHaveCount(0);
  await expect(its.locator('.month').first()).toHaveText('2026年11月');
  const total = ROSTER.length - SKIPPED.length;
  const fit = ROSTER.filter((h) => (h.kind === 'direct' || h.kind === 'year') && !SKIPPED.includes(h.name)).length;
  const seasonal = ROSTER.filter((h) => h.kind === 'summer' || h.kind === 'winter' || h.kind === 'both').length;
  await expect(its.locator('[data-its-dates-total]')).toHaveText(`探す施設 ${total}件`);
  await expect(its.locator('[data-its-dates-foot]')).toHaveText('ほかに『探さない』2件（施設の一覧で変更）');
  // 11/22: 18 days on, November: 直営 and 通年 searched, the seasonal ones 季節外, スキージャム勝山 掲載なし
  const row = its.locator('[data-its-date="2026-11-22"]');
  const night = row.locator('[data-its-night]');
  await expect(row.locator('.nn')).toHaveText(`${fit}/${total}`);
  await expect(row.locator('.bar .seg')).toHaveCount(3);
  await expect(row.locator('.legend > span')).toHaveText([`探す ${fit}`, `季節外 ${seasonal}`, '掲載なし 1']);
  await expect(row.locator('.bar')).toHaveAttribute('aria-hidden', 'true');
  await expect(night).toHaveAccessibleName(`11月22日(日)、あと18日。${total}件中${fit}件を探しています。季節外で${seasonal}件、掲載なしで1件除外。`);
  await expect(night).toHaveAttribute('aria-expanded', 'false');
  await night.click();
  await expect(night).toHaveAttribute('aria-expanded', 'true');
  const list = row.locator('[data-its-night-list]');
  await expect(list.locator('[data-its-why]')).toHaveCount(3);
  await expect(list.locator('[data-its-why="check"] h5')).toHaveText(`探す${fit}件`);
  await expect(list.locator('[data-its-why="check"] p')).not.toContainText('NAGU 勝浦');   // 夏季・冬季: not in November
  await expect(list.locator('[data-its-why="season"] p')).toHaveText(['冬季は12/19から', '夏季は9/30まで', '冬季は12/19〜3/31']);   // (the list's order: ★ NAGU's first)
  await expect(list.locator('[data-its-why="gone"] p')).toHaveText('ホテルハーヴェスト　スキージャム勝山');
  // ≤ 8 names, then ほか n ›: all of them
  await expect(list.locator('[data-its-why="check"] p')).toHaveText(/^([^、]+、){7}[^、]+$/);
  const more = list.locator('[data-its-night-more]');
  await expect(more).toHaveText(`ほか${fit - 8}件 ›`);
  expect((await more.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await more.click();
  await expect(more).toHaveCount(0);
  await expect(list.locator('[data-its-why="check"] p')).toContainText('日光千姫物語');
  await night.click();
  await expect(list).toHaveCount(0);

  const opener = its.locator('[data-its-bulk-open]');
  await opener.click();
  const sheet = page.locator('dialog[open] [data-its-bulk]');
  await sheet.locator('[data-its-bulk-from]').fill('2026-12-01');
  await sheet.locator('[data-its-bulk-to]').fill('2026-12-31');
  // 金 and 土 by default; 土 only: 4 nights
  await expect(sheet.locator('[data-its-weekday="5"]')).toHaveAttribute('aria-pressed', 'true');
  await sheet.locator('[data-its-weekday="5"]').click();
  const add = page.locator('dialog[open] [data-its-bulk-add]');
  await expect(add).toHaveText('4日を追加');
  await add.click();
  await expect(sheet).toHaveCount(0);
  await expect(opener).toBeFocused();
  await expect(its.locator('[data-its-date]')).toHaveCount(6);
  await expect(its.locator('.month')).toHaveText(['2026年11月', '2026年12月']);
  await expect(its.locator('[data-its-save-bar]')).toBeVisible();
  // 12/19 is 冬季's first night: the winter facilities count in, and ★ NAGU takes only the winter Saturdays
  await expect(its.locator('[data-its-date="2026-12-19"] .legend > span')).toHaveText([/^探す \d+$/, /^季節外 \d+$/, '掲載なし 1']);
  const fold = its.locator('[data-its-search] > summary');
  await expect(fold.locator('[data-its-sum-line]')).toContainText(' · ★ NAGU 勝浦');
  await fold.click();
  await expect(its.locator('[data-its-part="search"] [data-its-hotel]').first()).toHaveAttribute('data-its-hotel', 'NAGU 勝浦');
  await expect(its.locator('[data-its-hotel="NAGU 勝浦"] [data-its-meta]')).toHaveText('勝浦 · 夏季・冬季 · 4日前まで · 12/19・12/26のみ');
  await expect(its.locator('[data-its-hotel="NAGU 勝浦"] [role="switch"]')).toHaveAccessibleName('NAGU 勝浦、探す、12/19・12/26のみ');
});

test('直近1時間: a cell a minute, a tap names it, the group says the hour; hidden when the Worker sends none', async ({ page, context }) => {
  const { sheet, its } = await phone(page, context, 'A', undefined, {
    edit: (s) => ({
      ...s, recentScans: [
        ...Array.from({ length: 30 }, (_, i) => ({ t: s.now - (59 - i) * 60_000, ok: true, ms: 900, avail: 0 })),
        { t: s.now - 20 * 60_000, ok: false, code: 'timeout', ms: 20000, avail: 0 },
        { t: s.now - 10 * 60_000, ok: true, ms: 900, avail: 2 }
      ]
    })
  });
  await open(sheet);
  const strip = its.locator('[data-its-strip]');
  await expect(strip.locator('[data-its-cell]')).toHaveCount(60);
  await expect(strip).toHaveAttribute('aria-label', '直近1時間：確認32回、失敗1回、空きあり1回');
  await expect(strip.locator('[data-its-cell="fail"]')).toHaveCount(1);
  await expect(strip.locator('[data-its-cell="avail"]')).toHaveCount(1);
  await expect(strip.locator('[data-its-cell="ok"]')).toHaveCount(30);
  // a tap on the failed minute names it
  const cell = strip.locator('[data-its-cell="fail"]');
  await cell.click();
  await expect(its.locator('[data-its-scan-line]')).toHaveText(/^\d\d:\d\d · 1回 · 失敗1（timeout）$/);
  await expect(cell).toHaveAttribute('aria-pressed', 'true');
  // ← walks to the minute before
  await page.keyboard.press('ArrowLeft');
  await expect(its.locator('[data-its-scan-line]')).toHaveText(/ · 確認なし$/);
});

test('直近1時間 from the Worker’s per-minute aggregate when it sends one (every read of the hour, not the last 300)', async ({ page, context }) => {
  const { sheet, its } = await phone(page, context, 'A', undefined, {
    edit: (s) => {
      const minute = (ago: number) => Math.floor(s.now / 60_000) * 60_000 - ago * 60_000;
      return {
        ...s, recentMinutes: [
          ...Array.from({ length: 40 }, (_, i) => ({ minute: minute(39 - i), n: 8, ok: 8, fail: 0, avail: 0 })),
          { minute: minute(45), n: 8, ok: 6, fail: 2, avail: 3, codes: { http_503: 2 } }
        ]
      };
    }
  });
  await open(sheet);
  const strip = its.locator('[data-its-strip]');
  await expect(strip).toHaveAttribute('aria-label', '直近1時間：確認328回、失敗2回、空きあり1分');
  await expect(strip.locator('[data-its-cell="ok"]')).toHaveCount(40);
  await strip.locator('[data-its-cell="fail"]').click();
  await expect(its.locator('[data-its-scan-line]')).toHaveText(/^\d\d:\d\d · 8回 · 失敗2（http_503） · 空き3日$/);
});

test('直近1時間 is hidden from a Worker without it; a Worker whose CORS doesn’t allow X-Request-Id still answers', async ({ page, context }) => {
  const { sheet, its, calls } = await phone(page, context, 'A', undefined, { allow: 'Authorization, Content-Type', edit: ({ recentScans: _, ...s }) => s });
  await open(sheet);
  await expect(its.locator('[data-its-scans]')).toHaveCount(0);
  await expect(its.locator('[data-its-error]')).toHaveCount(0);
  await its.locator('[data-its-action="stop"]').click();
  await expect(its.locator('[data-its-run="stopped"]')).toBeVisible();
  expect(calls.length).toBeGreaterThanOrEqual(3);
  expect(calls.every((c) => c.rid === null)).toBe(true);
});

test('in demo mode ボット has no 保養所 tab (no fixture): ジム alone, no tabs, and nothing asks the Worker', async ({ page, context }) => {
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  const asked: string[] = [];
  await page.route(`${ORIGIN}/**`, (route) => (asked.push(route.request().url()), route.abort()));
  await page.goto('?demo');
  await islandUp(page);
  await fromMenu(page, 'bots');
  const sheet = page.locator('dialog[open] [data-bots]');
  await expect(sheet).toHaveAttribute('data-tab', 'gym');
  await expect(sheet.locator('[data-gym-page]')).toBeVisible();
  await expect(page.locator('dialog[open] [role="tablist"]')).toHaveCount(0);
  expect(asked).toEqual([]);
});

test('the guest has no ボット, and nothing asks the Worker', async ({ page, context }) => {
  const { calls } = await phone(page, context, 'G');
  await expect(page.locator('[data-hud-settings]')).toBeVisible();
  await expect(page.locator('[data-hud-bots]')).toHaveCount(0);
  expect(calls).toHaveLength(0);
});
