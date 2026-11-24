// ボット's 保養所 tab (docs/bots.md): a member's menu shows ボット with a dot while the bot needs a person
// (要対応), and its sheet opens on 保養所, which reads the its-bot Worker's GET /its/status (lib/its/client.ts, mocked
// here: the contract's example moved to the pinned time) and shows the status card with its strip and ⋯, the hold that
// needs a person in the card under its act (its deadline, the mail), 直近1時間 in the card, 最近の動き in くわしく, 設定's folded rows and くわしく;
// ジム's tab leaves it. ⋯'s 開始 goes out at once (it needs a stay), its 停止 asks first; the settings are one draft: 保存 sends one PUT (its body checked: the allow-list `search` too), ✕, Esc and a tab switch
// ask before dropping it, and a 409 (the
// bare status) or a poll seeing someone else's save says so in the save bar, with 読み込み直す, 保存 turning 上書き保存
// (asks first); 開始 / 停止 never move the draft's base, and 保存 gives up a read in flight. 日付: a calendar (this month or
// next; a tap a night, a weekday's header its column, a booking marked) and the nights under it (tapped open: the names
// and reasons), 予約済み. The facilities: the allow-list (derived from a Worker without one, said until saved), the
// summary, presets, 探す · 日程に合わない (a reason a row) · 除外, the new ones' banner; no ★ (no priority sent). A
// refusal is worded, a failed read shows its code and もう一度. Each call carries an X-Request-Id. The guest and demo mode have no ボット. The rules
// are view.test.ts's.
import { expect, test, type BrowserContext, type Page, type Route } from './fixtures.ts';
import { unfoldMenu } from './hud.ts';
import { islandUp } from './island.ts';
import { newRecord } from './record.ts';
import { ORIGIN, cors, payload, type Status } from './its.ts';
import { ROSTER } from '../src/lib/its/roster.ts';

/** The contract example's skipped facilities (its settings.skip). */
const SKIPPED = ['ゆふいん山水館', 'ブルーベリーヒル勝浦'];

type Call = { method: string; path: string; auth: string | null; rid: string | null; body: unknown };
type Reply = { status: number; body: unknown };
type Answer = (c: Call, n: number, s: Status) => Reply | Promise<Reply> | undefined;
type Opts = { legacy?: boolean; edit?: (s: Status) => Status };

/** A phone paired as `who`, the Worker answered by `answer` (else: the status, a PUT or POST applied to it as the
 *  Worker does: a PUT moves updatedAt, 開始 / 停止 doesn't and records `control`), ボット open on 保養所 (a member's: the
 *  menu's dot read first) or, the guest's, the menu unfolded. `set` changes the
 *  Worker's state behind the page's back (someone else's save). */
async function phone(page: Page, context: BrowserContext, who: 'A' | 'G', answer: Answer = () => undefined, opts: Opts = {}) {
  const rec = newRecord();
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  // (保養所 the tab last shown on this phone: ジム is the first opening's)
  await context.addInitScript(() => sessionStorage.setItem('island.botsTab', 'its'));
  await rec.pair(context, who);
  const calls: Call[] = [];
  const first = (opts.edit ?? ((s) => s))(payload(rec.now(), opts.legacy));
  let state = first;
  await page.route(`${ORIGIN}/**`, async (route: Route) => {
    const req = route.request();
    const headers = cors();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    const h = req.headers();
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

/** 設定's row opened (a plain <details>: one open stays open). */
async function unfold(its: ReturnType<Page['locator']>, id: 'hotels' | 'detail' | 'notify') {
  const d = its.locator(`[data-its-fold="${id}"]`);
  if (!(await d.evaluate((e) => (e as HTMLDetailsElement).open))) await d.locator('> summary').click();
}

/** The page shown, 設定's 間隔と人数 opened. */
async function open(sheet: ReturnType<Page['locator']>) {
  await expect(sheet.locator('[data-its-verdict]')).toBeVisible();
  const its = sheet.locator('[data-its-page]');
  await unfold(its, 'detail');
}

/** ⋯'s 開始, or its 停止 (asked first: 停止する). */
async function runAct(page: Page, its: ReturnType<Page['locator']>, action: 'start' | 'stop') {
  await its.locator('[data-its-menu]').click();
  await page.locator(`dialog[open] [data-action="${action}"]`).click();
  if (action === 'stop') await page.getByRole('dialog', { name: '保養所の確認を停止しますか？' }).locator('[data-action="stop"]').click();
}

test('ボット opens on 保養所 (its tab yuzu 「!」: 要対応): the card (the act, the hold to finish by mail under it, its deadline, 前回, 次回, 予約), くわしく; ジム leaves it', async ({ page, context }) => {
  const { sheet, its, calls } = await phone(page, context, 'A');
  const tab = page.locator('dialog[open] [data-bots-tab="its"]');
  await expect(tab).toHaveAttribute('aria-selected', 'true');
  await expect(tab).toHaveAttribute('data-tab-status', 'warn');
  await expect(tab).toHaveAttribute('data-look', '');
  await expect(tab).toHaveAccessibleName('保養所、要対応');
  const verdict = its.locator('[data-its-verdict="degraded"]');
  await expect(verdict.locator('[data-bots-word]')).toHaveText('要対応'); // a hold waiting is all: 要対応, not 一部不調
  await expect(verdict.locator('[data-bots-act]')).toHaveText('NAGU 勝浦をメールで申込'); // the act, in ink
  await expect(tab.locator('[data-dot="warn"][data-look]')).toHaveCount(1); // a person must act: the tab's 「!」
  await expect(verdict.locator('[data-bots-say]')).toHaveCount(0); // the word and the act say it
  await expect(page.locator('dialog[open] .titlebar')).toContainText('ボット');
  // 次回 (a live runner: its interval) and 予約, the 成果 term (no key row; no read this hour: no strip)
  await expect(its.locator('[data-its-key]')).toHaveCount(0);
  await expect(its.locator('[data-its-scans]')).toHaveCount(0);
  await expect(its.locator('[data-its-empty]')).toHaveText('確認なし'); // running: a neutral line, the warning is the sentence's
  await expect(its.locator('[data-its-menu]')).toHaveAccessibleName('保養所の操作');
  const y = async (sel: string) => (await sheet.locator(sel).boundingBox())!.y;
  // the hold, in the card under its act (said once: no 確認が必要, its hotel not named again): its deadline (30 min
  // from 11:44), the mail to look for; not again under 予約
  const hold = verdict.locator('[data-its-booking="action"]');
  await expect(its.locator('[data-its-alert]')).toHaveCount(0);
  await expect(hold.locator('b')).toHaveCount(0);
  await expect(hold).toContainText('日付が近いため');
  await expect(hold.locator('[data-its-hold-left]')).toHaveText(/^あと1[45]分ほどで無効$/);
  await expect(hold.locator('[data-its-steps] li')).toHaveText(['メール『NAGU 勝浦申込手続きのご案内』→ 申込する → 確認']); // the one act numbered
  await expect(hold.locator('[data-its-hold-note]')).toHaveText(['何もしなければ自動で取り消されます。料金はかかりません。']);
  await expect(its.locator('[data-its-booking]')).toHaveCount(1);
  expect(await y('[data-its-verdict]')).toBeLessThan(await y('[data-its-settings]'));
  // くわしく: everything else, folded (not drawn until opened); the mode and the version, no foot
  await expect(its.locator('[data-its-fact="phase"]')).toHaveCount(0);
  await expect(its.locator('[data-its-more] summary')).toHaveText('詳しく最近の動き 2件'); // its rows named while folded
  await its.locator('[data-its-more] summary').click();
  await expect(its.locator('[data-its-fact="phase"]')).toContainText('空室を確認中');
  await expect(its.locator('[data-its-fact="scan"]')).toContainText('11:59（120回）');
  await expect(its.locator('[data-its-fact="run"] a')).toHaveAttribute('href', 'https://github.com/huangwaylon/fitness/actions/runs/19283746');
  await expect(its.locator('[data-its-fact="error"]')).toContainText('空室の確認 · 時間切れ');
  await expect(its.locator('[data-its-fact="report"]')).toContainText('11:59');
  await expect(its.locator('[data-its-fact="mode"] dd')).toHaveText('稼働');
  await expect(its.locator('[data-its-foot]')).toHaveCount(0);
  // 最近の動き: the fold's last row, under the facts (no card of its own)
  const recent = its.locator('[data-its-more] > :last-child');
  await expect(recent).toHaveAttribute('data-its-recent', '');
  await expect(recent.getByRole('heading', { level: 3 })).toHaveText('最近の動き');
  await expect(recent.locator('[data-its-event]')).toHaveCount(2);
  await expect(its.locator('[data-its-recent]')).toHaveCount(1);
  // 日付 never folded: the calendar and the nights under it; 設定: folded rows with their summaries; who saved last
  await expect(its.locator('[data-its-fold]')).toHaveCount(3);
  await expect(its.locator('[data-its-fold="dates"]')).toHaveCount(0);
  await expect(its.locator('[data-its-sum-detail]')).toHaveText('15秒・2人');
  await expect(its.locator('[data-its-sum-notify]')).toHaveText('オフ');
  await expect(its.locator('[data-its-date]')).toHaveCount(2);
  await expect(its.locator('[data-its-date="2026-11-21"]')).toContainText('あと17日');
  await expect(its.locator('[data-its-saved-by]')).toHaveText(/^最近の操作：開始（.+・.+）設定の変更：.+・11:/);
  await expect(its.locator('[data-its-unsaved]')).toHaveCount(0);
  // the menu's read (its dot), with the key and a request id; the page, opened seconds after it, asks nothing more
  expect(calls.map((c) => [c.method, c.path])).toEqual([['GET', '/its/status']]);
  expect(calls[0].auth).toMatch(/^Bearer [0-9a-f]{32,}$/);
  expect(calls.every((c) => /^[0-9a-f]{8}$/.test(c.rid ?? ''))).toBe(true);

  // the facilities, folded: in November (FY2026's gap between 夏季 and 冬季) only 直営 and 通年 can take the nights;
  
  const search = its.locator('[data-its-search]');
  const fit = ROSTER.filter((h) => (h.kind === 'direct' || h.kind === 'year') && !SKIPPED.includes(h.name));
  const unfit = ROSTER.filter((h) => !(h.kind === 'direct' || h.kind === 'year') && !SKIPPED.includes(h.name));
  const region = (r: string) => fit.filter((h) => h.region === r).length;
  await expect(its.locator('[data-its-sum-hotels]')).toHaveText(`探す${fit.length}・除外${SKIPPED.length}`);
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
  await expect(out.locator('h4')).toHaveText(`日程に合わない${unfit.length}件`);
  // its heading outside the summary (VoiceOver's headings reach it), the summary a button named by it
  await expect(out.getByRole('heading', { level: 4 })).toHaveAccessibleName(`日程に合わない ${unfit.length}件`);
  await expect(out.locator('summary')).toHaveAccessibleName(`日程に合わない ${unfit.length}件`);
  await expect(search.locator('[data-its-part="off"] h4')).toHaveText(`除外${SKIPPED.length}件`);
  await expect(out.locator('[data-its-hotel="NAGU 勝浦"]')).toBeHidden();
  await out.locator('summary').click();
  // a reason row: its small line is why, and its switch says so
  const nagu = out.locator('[data-its-hotel="NAGU 勝浦"]');
  await expect(nagu.locator('[data-its-meta]')).toHaveText('季節外（冬季は12/19から）');
  await expect(nagu.locator('[role="switch"]')).toHaveAccessibleName('NAGU 勝浦、探す、季節外（冬季は12/19から）');
  await expect(nagu.locator('[role="switch"]')).toHaveAttribute('aria-checked', 'true');
  await expect(out.locator('[data-its-hotel="ホテルハーヴェスト　スキージャム勝山"] [data-its-meta]')).toHaveText('掲載終了');
  await expect(search.locator('[data-its-hotel="トスラブ箱根ビオーレ"] [data-its-meta]')).toHaveText('箱根 · 直営 · 4日前まで');
  // 44px targets: ⋯, the run's link, a switch, a part's fold, a night
  for (const sel of ['[data-its-menu]', '[data-its-fact="run"] a', '[data-its-hotel="NAGU 勝浦"] [role="switch"]', '[data-its-part="unfit"] summary', '[data-its-night]']) {
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
  await expect(its).toHaveAttribute('data-its-run', 'running');
  // ⋯: 停止 asks first (次の区切りで止まります); キャンセル sends nothing
  await its.locator('[data-its-menu]').click();
  await expect(page.locator('dialog[open] [data-action]')).toHaveText(['停止']);
  await page.locator('dialog[open] [data-action="stop"]').click();
  const ask = page.getByRole('dialog', { name: '保養所の確認を停止しますか？' });
  await expect(ask).toContainText('次の区切りで止まります。');
  await ask.locator('[data-action="cancel"]').click();
  expect(calls.filter((c) => c.method === 'POST')).toHaveLength(0);
  await runAct(page, its, 'stop');
  await expect(its).toHaveAttribute('data-its-run', 'stopped');
  // who stopped it, in the sentence (in 確認が必要 while the act has the card's row); stopped with no read: no strip
  await expect(its.locator('[data-its-alert] [data-its-reason]').first()).toHaveText(/停止（.+・12:00）$/);
  await expect(its.locator('[data-its-empty], [data-its-scans]')).toHaveCount(0);
  expect(calls.filter((c) => c.method === 'POST')).toEqual([{ method: 'POST', path: '/its/run', auth: expect.stringMatching(/^Bearer /), rid: expect.any(String), body: { action: 'stop' } }]);
  await expect(its.locator('[data-its-save-bar]')).toHaveCount(0);

  // a night added on the calendar, one taken out, a facility off, 4 people, 1 minute
  await its.locator('[data-its-night-day="2026-11-30"]').click();
  await expect(its.locator('[data-its-night-day="2026-11-30"]')).toHaveAttribute('aria-pressed', 'true');
  await its.locator('[data-its-night-day="2026-11-21"]').click();
  await expect(its.locator('[data-its-night-day="2026-11-21"]')).toHaveAttribute('aria-pressed', 'false');
  await its.locator('[data-its-search] > summary').click();
  await its.locator('[data-its-hotel="リソルの森"] [role="switch"]').click();
  await expect(its.locator('[data-its-hotel="リソルの森"] [role="switch"]')).toHaveAttribute('aria-checked', 'false');
  await expect(its.locator('[data-its-part="off"] [data-its-hotel="リソルの森"]')).toHaveCount(1);   // (moved to 除外)
  await expect(its.locator('[data-its-part="off"] h4')).toHaveText('除外3件');
  await its.locator('[data-its-guests="4"]').click();
  await its.locator('[data-its-interval="60"]').click();
  // each part the draft changed says 未保存 (日付's heading, 設定's rows open or folded)
  await expect(its.locator('[data-its-unsaved]')).toHaveCount(3);
  const bar = its.locator('[data-its-save-bar]');
  await expect(bar.locator('[data-its-draft-note]')).toHaveText('開始は保存済みの設定で動きます。');
  await bar.locator('[data-its-save]').click();
  await expect(bar).toHaveCount(0);
  const [put] = puts(calls);
  expect(put).toMatchObject({ path: '/its/settings', auth: expect.stringMatching(/^Bearer /) });
  const body = put.body as Record<string, unknown>;
  expect({ ...body, search: undefined }).toEqual({
    intervalSec: 60, dates: ['2026-11-22', '2026-11-30'], guests: 4, search: undefined, skip: ['ゆふいん山水館', 'ブルーベリーヒル勝浦', 'リソルの森'], priority: [], autoConfirm: false,
    baseUpdatedAt: first.settings.updatedAt
  });
  expect((body.search as string[]).length).toBe(ROSTER.length - 3);
  expect(body.search).not.toContain('リソルの森');
  await expect(its.locator('[data-its-date]')).toHaveCount(2);
  await expect(its.locator('[data-its-guests="4"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(its.locator('[data-its-unsaved]')).toHaveCount(0);
});

test('a draft isn’t dropped by a stray ✕, Esc or the ジム tab: each asks first; 自動で確定 asks before it turns on, focus back on it', async ({ page, context }) => {
  const { sheet, its } = await phone(page, context, 'A');
  await open(sheet);
  const ask = page.locator('dialog[open] [data-discard-ask]');
  // 自動で確定 in 通知 (the user asked: out of 間隔と人数, once 詳細), still in the 保存 draft: 通知 says 未保存 and 自動で確定
  await expect(its.locator('[data-its-fold="detail"] [data-its-auto]')).toHaveCount(0);
  await unfold(its, 'notify');
  const auto = its.locator('[data-its-fold="notify"] [data-its-auto]');
  // first in 通知, saying it waits for 保存; drawn as the push row under it (the kit's switch row: one fill, edge, size)
  await expect(its.locator('#its-settings')).toHaveText('設定');
  await expect(its.locator('[data-its-set-hint]')).toHaveText('変更は保存すると反映されます');
  await expect(auto).toContainText('保存で反映・仮押さえの後、申込まで自動で進めます');
  const push = its.locator('[data-its-fold="notify"] [data-its-push]');
  expect((await auto.boundingBox())!.y).toBeLessThan((await push.boundingBox())!.y);
  const look = (l: typeof auto) => l.evaluate((e) => { const s = getComputedStyle(e); return [s.backgroundColor, s.boxShadow, s.transform, s.minHeight, Math.round(e.getBoundingClientRect().width)]; });
  expect(await look(push)).toEqual(await look(auto));
  await auto.click();
  // the note wraps by phrase (never 「予 / 約」)
  await expect(page.locator('dialog[open] .note wbr').first()).toBeAttached();
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
  await expect(its.locator('[data-its-sum-notify]')).toHaveText('オフ・自動で確定');
  await expect(its.locator('[data-its-fold="notify"] [data-its-unsaved]')).toHaveCount(1);
  await expect(its.locator('[data-its-fold="detail"] [data-its-unsaved]')).toHaveCount(0);
  await expect(its.locator('[data-its-sum-detail]')).toHaveText('15秒・2人');
  await expect(its.locator('[data-its-discard]')).toHaveText('変更を破棄');

  const gym = page.locator('dialog[open] [data-bots-tab="gym"]');
  await gym.click();
  await expect(ask).toContainText('入力した内容を破棄しますか？');
  await page.locator('dialog[open] [data-discard-keep]').click();
  await expect(its).toBeVisible();
  await page.locator('dialog[open] .navbar button.nav.close').click();
  await expect(ask).toBeVisible();
  await page.locator('dialog[open] [data-discard-keep]').click();
  await auto.focus();
  await page.keyboard.press('Escape');
  await expect(ask).toBeVisible();
  await page.locator('dialog[open] [data-discard-keep]').click();
  await expect(auto).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('dialog[open] [data-bots-tab="its"]')).toHaveAttribute('aria-selected', 'true');
  await gym.click();
  await page.locator('dialog[open] [data-discard-yes]').click();
  await expect(its).toHaveCount(0);
  await expect(gym).toHaveAttribute('aria-selected', 'true');
  await expect(sheet).toHaveAttribute('data-tab', 'gym');
});

test('a 409 says who saved, in the save bar, and 読み込み直す reads theirs; a refusal is worded in coral; a failed read shows its code and もう一度', async ({ page, context }) => {
  let n = 0;
  const { its, calls } = await phone(page, context, 'A', (c, i, s) => {
    if (i <= 2) return { status: 500, body: { error: 'boom' } };   // the menu's read (its dot), then the page's
    if (c.method === 'PUT' && ++n === 1) return { status: 400, body: { ok: false, error: 'past_date' } };
    if (c.method === 'PUT') return { status: 409, body: theirSave(s) };
    return undefined;
  });
  const error = its.locator('[data-its-error]');
  await expect(error).toContainText('読み込めませんでした（boom 500）');
  await error.getByRole('button', { name: 'もう一度' }).click();
  await expect(its.locator('[data-its-verdict="degraded"]')).toBeVisible();
  await expect(error).toHaveCount(0);

  await unfold(its, 'detail');
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
  await runAct(page, its, 'stop');
  await expect(its).toHaveAttribute('data-its-run', 'stopped');
  await its.locator('[data-its-guests="3"]').click();
  await expect(its.locator('[data-its-draft-note]')).toHaveText('開始は保存済みの設定で動きます。');
  set(theirSave);   // B saves; this page hasn't polled since
  await runAct(page, its, 'start');
  await expect(its).toHaveAttribute('data-its-run', 'running');
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
  await expect(its.locator('[data-its-verdict] [data-its-need-dates]')).toHaveText('日付を追加してください');
  await its.locator('[data-its-menu]').click();
  const start = page.locator('dialog[open] [data-action="start"]');
  await expect(start).toHaveText('開始');
  await expect(start).toHaveAttribute('aria-disabled', 'true');
  await start.dispatchEvent('click');   // (aria-disabled: Playwright won't tap it)
  expect(calls.filter((c) => c.method === 'POST')).toHaveLength(0);
  await expect(its.locator('[data-its-date]')).toHaveCount(0);
});

test('停止 failing after the sheet closed: said in a toast (the page is gone)', async ({ page, context }) => {
  let release: (() => void) | null = null;
  const held = new Promise<void>((r) => (release = r));
  const { sheet, its } = await phone(page, context, 'A', (c) => (c.path === '/its/run' ? held.then(() => ({ status: 500, body: { ok: false } })) : undefined));
  await open(sheet);
  await runAct(page, its, 'stop');
  await page.locator('dialog[open] .navbar button.nav.close').click();
  await expect(sheet).toHaveCount(0);
  release!();
  await expect(page.locator('.banner')).toContainText('停止できませんでした');
});

test('a read in flight as 保存 goes is let go: its older answer never replaces the saved settings', async ({ page, context }) => {
  let release: (() => void) | null = null;
  let held = false;
  // the page's own count of its status reads given up (their signal's abort): WebKit's Playwright says nothing of a
  // routed request the page aborts once it has been held a moment (no requestfailed: 3 s held, never), so under load
  // the old wait for that event ran out
  await context.addInitScript(() => {
    const f = window.fetch;
    window.fetch = (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (url.endsWith('/its/status')) init?.signal?.addEventListener('abort', () => ((window as unknown as { __statusAborts: number }).__statusAborts = ((window as unknown as { __statusAborts?: number }).__statusAborts ?? 0) + 1));
      return f(input, init);
    };
  });
  const aborts = () => page.evaluate(() => (window as unknown as { __statusAborts?: number }).__statusAborts ?? 0);
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
  const before = await aborts();
  await its.locator('[data-its-save]').click();
  await expect.poll(aborts, { message: 'the read in flight given up' }).toBe(before + 1);
  await expect(its.locator('[data-its-save-bar]')).toHaveCount(0);
  await expect(its.locator('[data-its-guests="4"]')).toHaveAttribute('aria-pressed', 'true');
  release!();
  await expect(its.locator('[data-its-guests="4"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(its.locator('[data-its-conflict]')).toHaveCount(0);
});

test('off and on: off moves a facility to 除外, its switch back on searches it again (no ★: every facility alike, no priority sent)', async ({ page, context }) => {
  const { sheet, its, calls } = await phone(page, context, 'A');
  await open(sheet);
  const search = its.locator('[data-its-search]');
  await its.locator('[data-its-search] > summary').click();
  await search.locator('[data-its-part="unfit"] summary').click();
  await search.locator('[data-its-part="off"] summary').click();
  await expect(search.locator('[data-its-hotel]')).toHaveCount(ROSTER.length);
  await expect(its.locator('[data-its-star]')).toHaveCount(0);
  await its.locator('[data-its-hotel="NAGU 勝浦"] [role="switch"]').click();
  const nagu = search.locator('[data-its-part="off"] [data-its-hotel="NAGU 勝浦"]');
  await expect(nagu.locator('[role="switch"]')).toHaveAttribute('aria-checked', 'false');
  await expect(nagu.locator('[role="switch"]')).toHaveAccessibleName('NAGU 勝浦、除外');
  await expect(nagu.locator('[data-its-meta]')).toHaveText('勝浦 · 夏季・冬季 · 4日前まで');
  await nagu.locator('[role="switch"]').click();
  const back = search.locator('[data-its-part="unfit"] [data-its-hotel="NAGU 勝浦"]');
  await expect(back.locator('[role="switch"]')).toHaveAttribute('aria-checked', 'true');
  // the rows' small text in the theme's soft ink, not the yellow row's
  const ink = (sel: string) => its.locator(sel).evaluate((e) => getComputedStyle(e).color);
  expect(await ink('[data-its-hotel="トスラブ箱根ビオーレ"] small')).toBe(await ink('[data-its-saved-by]'));
  // a save sends no priority: the saved ★ (NAGU) let go, every facility alike
  await its.locator('[data-its-guests="3"]').click();
  await its.locator('[data-its-save]').click();
  await expect.poll(() => puts(calls).length).toBe(1);
  expect((puts(calls)[0].body as { priority: string[] }).priority).toEqual([]);
});

test('the allow-list: presets (関東だけ, 近郊まで, 全部), the parts follow; a new facility’s banner', async ({ page, context }) => {
  const { sheet, its, calls } = await phone(page, context, 'A', undefined, { edit: (s) => ({ ...s, seen: [...s.seen, '新しいリゾート'] }) });
  await open(sheet);
  // offered since the allow-list was saved: not searched until someone says so (除外 meanwhile)
  const banner = its.locator('[data-its-new="新しいリゾート"]');
  await expect(banner).toContainText('新しい施設：新しいリゾート');
  await expect(banner.locator('[data-its-new-on]')).toHaveAttribute('aria-label', '新しいリゾートを探す');
  await expect(its.locator('[data-its-sum-hotels]')).toContainText('除外3');
  await banner.locator('[data-its-new-on]').click();
  await expect(banner).toHaveCount(0);
  await expect(its.locator('[data-its-sum-hotels]')).toContainText('除外2');

  const search = its.locator('[data-its-search]');
  const fold = its.locator('[data-its-search] > summary');
  await fold.click();
  await expect(search.locator('[data-its-part="search"] [data-its-group]')).toHaveCount(4);
  await expect(search.locator('[data-its-group="new"] [data-its-hotel="新しいリゾート"] [role="switch"]')).toHaveAttribute('aria-checked', 'true');
  await expect(search.locator('[data-its-group="new"] [data-its-meta]')).toHaveText('新しい施設');
  // 関東だけ: only 関東 searched, the chip pressed; NAGU (関東) in 日程に合わない (11月: 季節外)
  await search.locator('[data-its-preset="kanto"]').click();
  await expect(search.locator('[data-its-preset="kanto"]')).toHaveAttribute('aria-pressed', 'true');
  const kanto = ROSTER.filter((h) => h.region === 'kanto');
  const kantoFit = kanto.filter((h) => h.kind === 'direct' || h.kind === 'year').length;
  await expect(its.locator('[data-its-sum]')).toHaveText(`この日程で探す施設 ${kantoFit}件`);
  await expect(its.locator('[data-its-sum-line]')).toHaveText(`関東 ${kantoFit}`);
  await expect(its.locator('[data-its-sum-more]')).toHaveText(`ほか${kanto.length - kantoFit}件は日程に合いません`);
  await expect(search.locator('[data-its-part="search"] h5')).toHaveText([`関東${kantoFit}`]);
  await expect(search.locator('[data-its-part="off"] h4')).toHaveText(`除外${ROSTER.length + 1 - kanto.length}件`);
  // the bars read the draft at once: n/N
  await expect(its.locator('[data-its-date="2026-11-22"] .nn')).toHaveText(`${kantoFit}/${kanto.length}施設`);
  // 近郊まで, then 全部 (never the one on no roster)
  await search.locator('[data-its-preset="near"]').click();
  await expect(search.locator('[data-its-part="search"] h5')).toHaveText([/^関東\d+$/, /^近郊\d+$/]);
  await search.locator('[data-its-preset="all"]').click();
  await expect(search.locator('[data-its-part="off"] h4')).toHaveText('除外1件');
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
  await expect(its.locator('[data-its-dates-total]')).toHaveAttribute('data-its-dates-total', String(ROSTER.length - 2));
  await note.locator('[data-its-migrate-save]').click();
  await expect(note).toHaveCount(0);   // the Worker kept it
  const body = puts(calls)[0].body as { search: string[]; skip: string[] };
  expect(body.search).toHaveLength(ROSTER.length - 2);
  expect(body.search).not.toContain('ゆふいん山水館');
});

test('日付: a calendar (this month or next): a tap puts a night in or out, a weekday’s header its column, past nights inert, a booking marked; the nights under it, tapped open by why', async ({ page, context }) => {
  const { sheet: bots, its } = await phone(page, context, 'A', undefined, {
    edit: (s) => ({ ...s, bookings: [...s.bookings, { id: 'r:9', kind: 'confirmed', date: '2026-11-21', hotel: 'リソルの森', number: 'B77', at: s.now - 60_000, runId: 'r' }] })
  });
  await open(bots);
  const cal = its.getByRole('grid', { name: '2026年11月の泊まる日' });
  await expect(its.locator('[data-its-month]')).toHaveText(['11月', '12月']);
  await expect(cal.getByRole('columnheader')).toHaveText(['月', '火', '水', '木', '金', '土', '日']);
  // past nights inert (faint, no button), today on; the stays filled; a booking marked on its night
  await expect(cal.locator('[data-its-night-day="2026-11-03"]')).toHaveCount(0);
  await expect(cal.locator('[data-its-night-day="2026-11-04"]')).toBeVisible();
  await expect(cal.locator('[data-its-night-day][aria-pressed="true"]')).toHaveCount(2);
  await expect(cal.locator('[data-its-night-day="2026-11-21"]')).toHaveAttribute('data-mark', 'booked');
  await expect(cal.locator('[data-its-night-day="2026-11-22"]')).toHaveAttribute('data-mark', 'action');   // the hold waiting
  await expect(cal.locator('[data-its-night-day="2026-11-22"]')).toHaveAccessibleName('11/22（日）、探す日、要対応');
  // a night 44 high; the weekday header a button its column's width; the legend under it
  expect((await cal.locator('[data-its-night-day="2026-11-04"]').boundingBox())!.height).toBeGreaterThanOrEqual(44);
  expect((await cal.locator('[data-its-weekday="5"]').boundingBox())!.width).toBeGreaterThanOrEqual(44);
  await expect(cal.getByRole('row')).toHaveCount(7);   // the weekdays, then the whole month: 10/26–12/6
  await expect(its.locator('[data-its-legend] > span')).toHaveText(['!要対応', '仮押さえ', '✓予約確定']); // 要対応 the tab's yuzu 「!」, 仮押さえ a ring
  // 日付 first, under the status cards: before 予約 and 設定
  const y = async (l: ReturnType<Page['locator']>) => (await l.boundingBox())!.y;
  expect(await y(its.locator('[data-its-dates-sec]'))).toBeLessThan(await y(its.locator('[data-its-settings]')));
  // a booked night under it: nothing to open
  await expect(its.locator('[data-its-date="2026-11-21"]')).toContainText('予約済み・探していません');
  await expect(its.locator('[data-its-date="2026-11-21"] [data-its-night]')).toHaveCount(0);
  const total = ROSTER.length - SKIPPED.length;
  const fit = ROSTER.filter((h) => (h.kind === 'direct' || h.kind === 'year') && !SKIPPED.includes(h.name)).length;
  const seasonal = ROSTER.filter((h) => h.kind === 'summer' || h.kind === 'winter' || h.kind === 'both').length;
  await expect(its.locator('[data-its-dates-total]')).toHaveAttribute('data-its-dates-total', String(total));
  // 11/22: 18 days on, November: 直営 and 通年 searched, the seasonal ones 季節外, スキージャム勝山 掲載終了
  const row = its.locator('[data-its-date="2026-11-22"]');
  const night = row.locator('[data-its-night]');
  await expect(row.locator('.nn')).toHaveText(`${fit}/${total}施設`);
  await expect(night).toHaveAccessibleName(`11/22（日）、あと18日。${total}件中${fit}件を探しています。季節外で${seasonal}件、掲載終了で1件除外。`);
  await night.click();
  await expect(night).toHaveAttribute('aria-expanded', 'true');
  const list = row.locator('[data-its-night-list]');
  await expect(list.locator('[data-its-why]')).toHaveCount(3);
  await expect(list.locator('[data-its-why="check"] h5')).toHaveText(`探す${fit}件`);
  await expect(list.locator('[data-its-why="check"] p')).not.toContainText('NAGU 勝浦');   // 夏季・冬季: not in November
  await expect(list.locator('[data-its-why="gone"] p')).toHaveText('ホテルハーヴェスト　スキージャム勝山');
  // ≤ 8 names, then ほか n (a chevron): all of them
  await expect(list.locator('[data-its-why="check"] p')).toHaveText(/^([^、]+、){7}[^、]+$/);
  const more = list.locator('[data-its-night-more]');
  await expect(more).toHaveText(`ほか${fit - 8}件`);
  await more.click();
  await expect(list.locator('[data-its-why="check"] p')).toContainText('日光千姫物語');
  await night.click();
  await expect(list).toHaveCount(0);

  // 12月: 土's header puts its 4 nights in (a second tap would take them out); 未保存 on 日付's heading, the save bar up
  await its.locator('[data-its-month="2026-12"]').click();
  const dec = its.getByRole('grid', { name: '2026年12月の泊まる日' });
  await dec.locator('[data-its-weekday="5"]').click();
  await expect(dec.locator('[data-its-night-day][aria-pressed="true"]')).toHaveCount(4);
  await expect(its.locator('[data-its-date]')).toHaveCount(6);
  await expect(its.locator('[data-its-dates-sec] [data-its-unsaved]')).toBeVisible();
  await expect(its.locator('[data-its-save-bar]')).toBeVisible();
  // 12/19 is 冬季's first night: the winter facilities count in, and NAGU takes only the winter Saturdays
  await its.locator('[data-its-search] > summary').click();
  await expect(its.locator('[data-its-hotel="NAGU 勝浦"] [data-its-meta]')).toHaveText('勝浦 · 夏季・冬季 · 4日前まで · 12/19・12/26のみ');
  await expect(its.locator('[data-its-hotel="NAGU 勝浦"] [role="switch"]')).toHaveAccessibleName('NAGU 勝浦、探す、12/19・12/26のみ');
  // a tap on a night already in takes it out
  await dec.locator('[data-its-night-day="2026-12-05"]').click();
  await expect(its.locator('[data-its-date]')).toHaveCount(5);
});

test('日付: a saved stay past next month is listed and its ✕ takes it out; a weekday cut short by the 20-stay cap comes out at the next tap', async ({ page, context }) => {
  const later = Array.from({ length: 18 }, (_, i) => `2027-0${1 + Math.floor(i / 9)}-${String(10 + (i % 9)).padStart(2, '0')}`);
  const { sheet, its } = await phone(page, context, 'A', undefined, { edit: (s) => ({ ...s, settings: { ...s.settings, dates: ['2026-11-22', ...later, '2027-11-30'] } }) });
  await open(sheet);
  // 2027-11-30: a year on, on no calendar month shown; its row's ✕ takes it out (未保存)
  const far = its.locator('[data-its-date="2027-11-30"]');
  await expect(far).toBeVisible();
  await expect(its.locator('[data-its-night-day="2027-11-30"]')).toHaveCount(0);
  await far.locator('[data-its-date-remove]').click();
  await expect(far).toHaveCount(0);
  await expect(its.locator('[data-its-dates-sec] [data-its-unsaved]')).toBeVisible();
  // 19 stays: 土's column (11/7, 14, 21, 28) has room for one; said why; the next tap takes it out
  const nov = its.getByRole('grid', { name: '2026年11月の泊まる日' });
  await nov.locator('[data-its-weekday="5"]').click();
  await expect(nov.locator('[data-its-night-day][aria-pressed="true"]')).toHaveCount(2);   // 11/22 (日) and one 土
  await expect(its.locator('[data-its-date-why]')).toHaveText('日付は20件までです（3日は入りませんでした）');
  await nov.locator('[data-its-weekday="5"]').click();
  await expect(nov.locator('[data-its-night-day][aria-pressed="true"]')).toHaveCount(1);
  // the why goes with a month switch (and on 破棄, after a save)
  await nov.locator('[data-its-weekday="5"]').click();
  await expect(its.locator('[data-its-date-why]')).toBeVisible();
  await its.locator('[data-its-month="2026-12"]').click();
  await expect(its.locator('[data-its-date-why]')).toHaveCount(0);
  await its.locator('[data-its-discard]').click();
  await expect(its.locator('[data-its-date="2027-11-30"]')).toBeVisible();
});

test('直近1時間: a cell a minute, a tap names it, the group says the hour', async ({ page, context }) => {
  const { sheet, its } = await phone(page, context, 'A', undefined, {
    edit: (s) => {
      const minute = (ago: number) => Math.floor(s.now / 60_000) * 60_000 - ago * 60_000;
      return {
        ...s, recentMinutes: [
          ...Array.from({ length: 30 }, (_, i) => ({ minute: minute(59 - i), n: 1, ok: 1, fail: 0, avail: 0 })),
          { minute: minute(20), n: 1, ok: 0, fail: 1, avail: 0, codes: { timeout: 1 } },
          { minute: minute(10), n: 1, ok: 1, fail: 0, avail: 2 }
        ]
      };
    }
  });
  await open(sheet);
  const strip = its.locator('[data-its-strip]');
  await expect(strip.locator('[data-its-cell]')).toHaveCount(60);
  await expect(strip).toHaveAttribute('aria-label', '直近1時間：確認32回、失敗1回、空き検出1分');
  await expect(strip.locator('[data-its-cell="fail"]')).toHaveCount(1);
  await expect(strip.locator('[data-its-cell="avail"]')).toHaveCount(1);
  await expect(strip.locator('[data-its-cell="ok"]')).toHaveCount(30);
  // 前回 the newest minute read, its time in ink; the counts and 予約, and on their row 次回 the runner's interval
  await expect(strip.locator('[data-its-cell][data-last]')).toHaveCount(1);
  await expect(its.locator('[data-its-next]')).toHaveText('次回 15秒ごと');
  await expect(its.locator('[data-its-count]')).toHaveText(['正常30', '空き検出1', '失敗1']);
  await expect(its.locator('[data-its-outcome]')).toHaveText('予約1');
  // a tap on the failed minute names it
  const cell = strip.locator('[data-its-cell="fail"]');
  await cell.click();
  await expect(its.locator('[data-its-scan-line]')).toHaveText(/^\d\d:\d\d · 1回 · 失敗1（timeout）$/);
  await expect(cell).toHaveAttribute('data-on', 'true');
  // ← walks to the minute before
  await page.keyboard.press('ArrowLeft');
  await expect(its.locator('[data-its-scan-line]')).toHaveText(/ · 確認なし$/);
});

test('直近1時間 from the Worker’s per-minute aggregate: every read of the hour, however many runs', async ({ page, context }) => {
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
  await expect(strip).toHaveAttribute('aria-label', '直近1時間：確認328回、失敗2回、空き検出1分');
  await expect(strip.locator('[data-its-cell="ok"]')).toHaveCount(40);
  await strip.locator('[data-its-cell="warn"]').click(); // 2 of 8 failed: warn, not fail
  await expect(its.locator('[data-its-scan-line]')).toHaveText(/^\d\d:\d\d · 8回 · 失敗2（http_503） · 空き3日$/);
});

test('demo mode has no ボット (no fixtures): no pill, and nothing asks a bot\'s Worker or メニュー\'s status', async ({ page, context }) => {
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  const asked: string[] = [];
  const ask = (route: Route) => (asked.push(route.request().url()), route.abort());
  await page.route(/^https:\/\/(its-bot|gym-bot)\.island-fund-relay\.workers\.dev\//, ask);
  await page.route('https://raw.githubusercontent.com/**', ask);
  await page.goto('?demo');
  await islandUp(page);
  await unfoldMenu(page);
  await expect(page.locator('[data-hud-settings]')).toBeVisible();
  await expect(page.locator('[data-hud-bots]')).toHaveCount(0);
  expect(asked).toEqual([]);
});

test('the guest has no ボット, and nothing asks the Worker', async ({ page, context }) => {
  const { calls } = await phone(page, context, 'G');
  await expect(page.locator('[data-hud-settings]')).toBeVisible();
  await expect(page.locator('[data-hud-bots]')).toHaveCount(0);
  expect(calls).toHaveLength(0);
});
