// せってい → すがた (docs/design.md "すがた", design/avatar/sugata-ux.md): on phones paired with a record of their own
// (e2e/record.ts: the relay's real code). One dresser: the stage (the final form, its status in words, もどす, the
// tapped item's colours), six tabs and their sub-rows. What's tapped is worn on the stage and goes out once, when the
// level is left: `look`, and `villager` first when a villager was picked (the むらびと tab); then 「すがたを かえたよ」
// with とりけす. The コーデ (save, wear, うわがき, なまえ, けす with とりけす, full at 20) go out as they're made, as one
// `savedLooks` pref; いつもの is one tap back (no pref: null). What's kept is on the record: a phone opening later, and
// the partner's, have it. The guest has its own look and コーデ, the same closet; its いつもの is its villager.
import { expect, test, type Browser, type Page } from '@playwright/test';
import { fromMenu, hudMenu } from './hud.ts';
import { newRecord } from './record.ts';
import { DEFAULT_LOOKS } from '../src/lib/contract/look.ts';
import { ROSTER } from '../src/lib/villagers/roster.ts';

type Rec = ReturnType<typeof newRecord>;
type Who = 'A' | 'B' | 'G';

/** A fresh phone paired as `who` on `rec`, its せってい open. */
async function phone(browser: Browser, rec: Rec, who: Who) {
  const context = await browser.newContext({ viewport: { width: 393, height: 852 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  await rec.pair(context, who);
  const page = await context.newPage();
  await page.goto('?critter=none&visitor=none');
  await expect(hudMenu(page)).toBeVisible();
  await fromMenu(page, 'settings');
  await expect(settings(page).locator('[data-look-row]')).toBeVisible();
  return page;
}

const settings = (page: Page) => page.locator('dialog[open]').first();
/** The name / confirm card (a sheet over せってい). */
const card = (page: Page) => page.locator('dialog[open]').nth(1);
const chip = (page: Page, id: string) => settings(page).locator(`[data-look-chip="${id}"]`);
const back = (page: Page) => settings(page).locator('.titlebar .back').click();
const tab = (page: Page, id: string) => settings(page).locator(`[data-look-tab=${id}]`).click();
const sub = (page: Page, id: string) => settings(page).locator(`[data-look-sub=${id}]`).click();
const status = (page: Page) => settings(page).locator('[data-look-status]');

async function openLook(page: Page) {
  await settings(page).locator('[data-push=look]').click();
  await expect(settings(page).locator('[data-look-page]')).toBeVisible();
}

/** The `pref` events `who` sent with `key`, in order, as [ok, value]. */
const sentPrefs = (rec: Rec, who: Who, key: string) =>
  rec.sent.filter((e) => e.type === 'pref' && e.who === who && e.data.key === key).map((e) => [e.ok, e.data.value] as [boolean, unknown]);
const lastValue = (rec: Rec, who: Who, key: string) => sentPrefs(rec, who, key).at(-1)?.[1];
/** The keys of `who`'s look and villager prefs, in the order sent. */
const lookKeys = (rec: Rec, who: Who) => rec.sent.filter((e) => e.type === 'pref' && e.who === who && (e.data.key === 'look' || e.data.key === 'villager')).map((e) => e.data.key);
type Saved = { id: string; name: string; look: Record<string, unknown> }[];

test('コーデ: save, wear, うわがき, なまえ, けす with とりけす; the colours on the stage; the look goes out once, on leaving; a phone opening later has it all', async ({ browser }) => {
  test.setTimeout(60_000);
  const rec = newRecord();
  const a = await phone(browser, rec, 'A');
  await expect(settings(a).locator('[data-look-worn]')).toHaveText('いつもの');
  await openLook(a);
  // nothing saved yet: it opens on ふく → トップス
  await expect(settings(a).locator('[data-look-tab=wear]')).toHaveAttribute('aria-selected', 'true');
  await expect(status(a)).toHaveText('★いつもの');
  await expect(settings(a).locator('[data-look-revert]')).toHaveCount(0);

  // the worn cable knit is checked; its colours are on the stage, and a dot there wears the cream one: the grid stays put
  const aran = settings(a).locator('[data-closet=top] [data-item=TopsTexTopOuterLAran]');
  await expect(aran).toHaveAttribute('aria-checked', 'true');
  await aran.click();
  const box = await aran.boundingBox();
  await settings(a).locator('[data-colours=TopsTexTopOuterLAran] [data-part=TopsTexTopOuterLAran1]').click();
  await expect(aran).toHaveAttribute('data-part', 'TopsTexTopOuterLAran1');
  expect(await aran.boundingBox()).toEqual(box);
  if (process.env.SHOTS) await a.screenshot({ path: `${process.env.SHOTS}/look-tops.png` });
  await expect(status(a)).toHaveText('いつもの · アレンジちゅう');
  await expect(settings(a).locator('[data-look-revert]')).toBeVisible();
  // nothing sent while editing
  expect(sentPrefs(rec, 'A', 'look')).toEqual([]);

  // コーデ → ＋ ほぞん: 「コーデ 1」 by default, renamed here to 「ふゆ」
  await tab(a, 'coord');
  await expect(chip(a, 'usual')).toHaveAttribute('aria-pressed', 'true');
  await settings(a).locator('[data-look-save]').click();
  await expect(card(a).locator('[data-look-name]')).toHaveValue('コーデ 1');
  await card(a).locator('[data-look-name]').fill('ふゆ');
  await card(a).locator('[data-look-ok]').click();
  await expect(card(a)).toHaveCount(0);
  await expect.poll(() => (lastValue(rec, 'A', 'savedLooks') as Saved | undefined)?.map((s) => [s.name, s.look.top])).toEqual([['ふゆ', 'TopsTexTopOuterLAran1']]);
  const id = (lastValue(rec, 'A', 'savedLooks') as Saved)[0].id;
  await expect(chip(a, id)).toHaveAttribute('aria-pressed', 'true');
  await expect(status(a)).toHaveText('ふゆ');
  await expect(settings(a).locator('[data-look-overwrite]')).toHaveCount(0); // not edited: nothing to うわがき

  // ボトムス: blue denim, then コーデ → いまので うわがき (its name and place kept)
  await tab(a, 'wear');
  await sub(a, 'bottoms');
  await settings(a).locator('[data-closet=bottom] [data-item=BottomsTexPantsNormalDenim]').click();
  await settings(a).locator('[data-colours=BottomsTexPantsNormalDenim] [data-part=BottomsTexPantsNormalDenim0]').click();
  await expect(status(a)).toHaveText('ふゆ · アレンジちゅう');
  await tab(a, 'coord');
  await expect(settings(a).locator('[data-look-acts]')).toContainText('「ふゆ」と ちょっと ちがうよ');
  await settings(a).locator('[data-look-overwrite]').click();
  await expect.poll(() => (lastValue(rec, 'A', 'savedLooks') as Saved).map((s) => [s.id, s.name, s.look.bottom])).toEqual([[id, 'ふゆ', 'BottomsTexPantsNormalDenim0']]);
  await expect(status(a)).toHaveText('ふゆ');

  // なまえ
  await settings(a).locator('[data-look-rename]').click();
  await expect(card(a).locator('[data-look-name]')).toHaveValue('ふゆ');
  await card(a).locator('[data-look-name]').fill('おでかけ');
  await card(a).locator('[data-look-ok]').click();
  await expect(chip(a, id)).toContainText('おでかけ');
  await expect.poll(() => (lastValue(rec, 'A', 'savedLooks') as Saved).map((s) => s.name)).toEqual(['おでかけ']);

  // いつもの is one tap back; the コーデ wears it again
  await chip(a, 'usual').click();
  await expect(settings(a).locator('[data-look-revert]')).toHaveCount(0); // back to what was worn: nothing to undo
  await tab(a, 'wear');
  await expect(settings(a).locator('[data-closet=bottom] [data-item=BottomsTexPantsNormalSlacks]')).toHaveAttribute('aria-checked', 'true');
  await tab(a, 'coord');
  await chip(a, id).click();
  await tab(a, 'wear');
  await expect(settings(a).locator('[data-closet=bottom] [data-item=BottomsTexPantsNormalDenim]')).toHaveAttribute('aria-checked', 'true');
  await tab(a, 'coord');

  // けす → the confirm → とりけす on the banner: the コーデ comes back, nothing sent
  const sends = sentPrefs(rec, 'A', 'savedLooks').length;
  await settings(a).locator('[data-look-delete]').click();
  await expect(card(a)).toContainText('この コーデを けしますか？');
  if (process.env.SHOTS) await a.screenshot({ path: `${process.env.SHOTS}/look-delete.png` });
  await card(a).locator('[data-look-confirm]').click();
  await expect(chip(a, id)).toHaveCount(0);
  await a.getByRole('button', { name: 'とりけす' }).click();
  await expect(chip(a, id)).toBeVisible();
  await a.waitForTimeout(5500); // the hold's whole window: nothing goes out after an undo
  expect(sentPrefs(rec, 'A', 'savedLooks')).toHaveLength(sends);

  // leaving sends the look once: the コーデ being worn; the banner says so
  await chip(a, id).click();
  await back(a);
  await expect.poll(() => sentPrefs(rec, 'A', 'look')).toHaveLength(1);
  expect(lastValue(rec, 'A', 'look')).toMatchObject({ kind: 'player', look: { top: 'TopsTexTopOuterLAran1', bottom: 'BottomsTexPantsNormalDenim0' } });
  expect(sentPrefs(rec, 'A', 'look')[0][0]).toBe(true);
  await expect(a.getByRole('status').filter({ hasText: 'すがたを かえたよ' })).toBeVisible();
  await expect(settings(a).locator('[data-look-worn]')).toHaveText('おでかけ');
  await a.context().close();

  // ウェイ's phone opening later: the look worn and the コーデ, from the record (a コーデ saved: it opens on コーデ)
  const a2 = await phone(browser, rec, 'A');
  await expect(settings(a2).locator('[data-look-worn]')).toHaveText('おでかけ');
  await openLook(a2);
  await expect(settings(a2).locator('[data-look-tab=coord]')).toHaveAttribute('aria-selected', 'true');
  await expect(chip(a2, id)).toHaveAttribute('aria-pressed', 'true');
  await tab(a2, 'wear');
  await sub(a2, 'bottoms');
  await expect(settings(a2).locator('[data-closet=bottom] [data-item=BottomsTexPantsNormalDenim]')).toHaveAttribute('aria-checked', 'true');
  await a2.context().close();

  // うめ's phone: ウェイ's look is on its snapshot (the island draws it); its own すがた is still its いつもの
  const b = await phone(browser, rec, 'B');
  expect(rec.prefs('B').filter(([w, d]) => w === 'A' && d.key === 'look').map(([, d]) => d.value)).toEqual([lastValue(rec, 'A', 'look')]);
  await expect(settings(b).locator('[data-look-worn]')).toHaveText('いつもの');
  await openLook(b);
  await expect(settings(b).locator('[data-closet=top] [data-item=TopsTexTopYshirtsHPolo]')).toHaveAttribute('aria-checked', 'true');
  await tab(b, 'coord');
  await expect(chip(b, 'usual')).toHaveAttribute('aria-pressed', 'true');
  await expect(settings(b).locator('[data-look-chip]')).toHaveCount(1); // ウェイ's コーデ aren't hers
  await b.context().close();
});

test('けす goes out after its banner; もどす undoes this visit; full at 20 says 「いっぱいだよ」', async ({ browser }) => {
  test.setTimeout(45_000);
  const rec = newRecord();
  const full = Array.from({ length: 20 }, (_, i) => ({ id: `look${String(i).padStart(4, '0')}`, name: `コーデ ${i + 1}`, look: { ...DEFAULT_LOOKS.A, top: 'TopsTexTopOuterLAran1' } }));
  expect(rec.event('A', 'pref', { key: 'savedLooks', value: full })).toMatchObject({ ok: true });
  const a = await phone(browser, rec, 'A');
  await openLook(a);
  await expect(settings(a).locator('[data-look-chip]')).toHaveCount(21);
  if (process.env.SHOTS) await a.screenshot({ path: `${process.env.SHOTS}/look-full.png` });
  const save = settings(a).locator('[data-look-save]');
  await expect(save).toHaveClass(/\boff\b/);
  await save.click();
  await expect(a.getByRole('status').filter({ hasText: 'コーデは 20こまで。いっぱいだよ' })).toBeVisible();
  await expect(card(a)).toHaveCount(0);

  // もどす: a change, then back to what was worn when the level opened
  await tab(a, 'acc');
  await settings(a).locator('[data-closet=glasses] [data-item=none]').click();
  await expect(settings(a).locator('[data-closet=glasses] [data-item=none]')).toHaveAttribute('aria-checked', 'true');
  await settings(a).locator('[data-look-revert]').click();
  await expect(settings(a).locator('[data-closet=glasses] [data-item=AccessoryGlassCircle]')).toHaveAttribute('aria-checked', 'true');
  await expect(settings(a).locator('[data-look-revert]')).toHaveCount(0);

  // けす, not taken back: sent once the banner's 5 s are over
  await tab(a, 'coord');
  await chip(a, 'look0003').click();
  await settings(a).locator('[data-look-delete]').click();
  await card(a).locator('[data-look-confirm]').click();
  await expect(settings(a).locator('[data-look-chip]')).toHaveCount(20);
  await a.mouse.move(200, 120); // off the banner: a pointer resting on it holds the send
  await expect(save).not.toHaveClass(/\boff\b/);
  await expect.poll(() => (lastValue(rec, 'A', 'savedLooks') as Saved | undefined)?.length, { timeout: 10_000 }).toBe(19);
  expect((lastValue(rec, 'A', 'savedLooks') as Saved).some((s) => s.id === 'look0003')).toBe(false);
  // nothing else changed: leaving sends no look
  await chip(a, 'usual').click();
  await back(a);
  await a.waitForTimeout(300);
  expect(sentPrefs(rec, 'A', 'look')).toEqual([]);
  await a.context().close();
});

test('ぼうし: a hat takes the hair ornament off (headwear, one at a time); めの いろ on the stage; both go out on leaving', async ({ browser }) => {
  const rec = newRecord();
  const b = await phone(browser, rec, 'B');
  await openLook(b);
  await sub(b, 'hat');
  const grid = settings(b).locator('[data-closet=hat]');
  await expect(grid.locator('[data-item=none]')).toHaveAttribute('aria-checked', 'true');
  await grid.locator('[data-item=CapHatBeret]').click();
  await expect(grid.locator('[data-item=CapHatBeret]')).toHaveAttribute('aria-checked', 'true');
  // her bow (B's いつもの) went: the ornament's なし is on
  await tab(b, 'acc');
  await sub(b, 'ornament');
  await expect(settings(b).locator('[data-closet=ornament] [data-item=none]')).toHaveAttribute('aria-checked', 'true');
  // the eyes' colour: another swatch, on the stage under め
  await tab(b, 'face');
  await settings(b).locator('[data-colour=eyeColor] [data-hex="#4f6378"]').click();
  await back(b);
  await expect.poll(() => lastValue(rec, 'B', 'look')).toMatchObject({ kind: 'player', look: { hat: expect.stringMatching(/^CapHatBeret\d$/), ornament: null, eyeColor: '#4f6378' } });
  await b.context().close();
});

test('むらびと tab: a pick swaps the stage, nothing goes out until leaving (then villager, look); いつもの brings the player back; とりけす re-sends', async ({ browser }) => {
  test.setTimeout(45_000);
  const rec = newRecord();
  const a = await phone(browser, rec, 'A');
  await openLook(a);
  // the player in 3D (its renderer the level's own), the villager its official render
  await expect(settings(a).locator('[data-look-preview=player][data-look-3d=on]')).toBeVisible({ timeout: 15_000 });
  await tab(a, 'villager');
  const jun = ROSTER.raymond.nameJa;
  await settings(a).getByRole('searchbox').fill(jun);
  await settings(a).getByRole('radio', { name: jun }).click();
  await expect(settings(a).locator('[data-look-preview=villager][data-look-3d=off]')).toBeVisible();
  await expect(status(a)).toHaveText(`むらびと · ${jun}`);
  await a.waitForTimeout(300);
  expect(lookKeys(rec, 'A')).toEqual([]); // the draft: nothing sent yet
  await back(a); // to the list: sent, the villager first
  await expect.poll(() => lookKeys(rec, 'A')).toEqual(['villager', 'look']);
  expect(lastValue(rec, 'A', 'look')).toEqual({ kind: 'villager' });
  expect(lastValue(rec, 'A', 'villager')).toBe('raymond');
  await expect(settings(a).locator('[data-look-row]')).toHaveAttribute('data-look-row', 'villager');
  await expect(settings(a).locator('[data-look-worn]')).toHaveText(jun);

  await openLook(a);
  await expect(settings(a).locator('[data-look-villager-note]')).toContainText(`いまは ${jun}の すがた`);
  await tab(a, 'coord');
  await expect(chip(a, 'usual')).toHaveAttribute('aria-pressed', 'false');
  await chip(a, 'usual').click();
  await expect(settings(a).locator('[data-look-preview=player][data-look-3d=on]')).toBeVisible({ timeout: 15_000 });
  await back(a);
  await expect(settings(a).locator('[data-look-preview] canvas')).toHaveCount(0); // the level and its renderer gone
  await expect.poll(() => sentPrefs(rec, 'A', 'look').map(([ok, v]) => [ok, v])).toEqual([[true, { kind: 'villager' }], [true, null]]);
  await expect(settings(a).locator('[data-look-row]')).toHaveAttribute('data-look-row', 'player');
  await expect(settings(a).locator('[data-look-worn]')).toHaveText('いつもの');
  // the banner's とりけす: Raymond again, as when the level opened
  await a.getByRole('button', { name: 'とりけす' }).click();
  await expect.poll(() => sentPrefs(rec, 'A', 'look').map(([, v]) => v)).toEqual([{ kind: 'villager' }, null, { kind: 'villager' }]);
  expect(sentPrefs(rec, 'A', 'villager')).toHaveLength(1); // the pref was Raymond already
  await expect(settings(a).locator('[data-look-row]')).toHaveAttribute('data-look-row', 'villager');
  await a.context().close();
});

test('the round trip: a villager, then a top wears the player again with this visit’s human edits; もどす sends nothing', async ({ browser }) => {
  const rec = newRecord();
  const a = await phone(browser, rec, 'A');
  await openLook(a);
  await tab(a, 'acc');
  await settings(a).locator('[data-closet=glasses] [data-item=none]').click();
  await tab(a, 'villager');
  await settings(a).locator('[data-villager=raymond]').click();
  await expect(settings(a).locator('[data-look-preview=villager]')).toBeVisible();
  await tab(a, 'wear');
  await expect(settings(a).locator('[data-look-villager-note]')).toBeVisible();
  await settings(a).locator('[data-closet=top] [data-item=TopsTexTopYshirtsHPolo]').click();
  await expect(settings(a).locator('[data-look-preview=player]')).toBeVisible();
  await expect(settings(a).locator('[data-look-villager-note]')).toHaveCount(0);
  await tab(a, 'acc');
  await expect(settings(a).locator('[data-closet=glasses] [data-item=none]')).toHaveAttribute('aria-checked', 'true');
  await settings(a).locator('[data-look-revert]').click();
  await expect(settings(a).locator('[data-closet=glasses] [data-item=AccessoryGlassCircle]')).toHaveAttribute('aria-checked', 'true');
  await back(a);
  await a.waitForTimeout(300);
  expect(lookKeys(rec, 'A')).toEqual([]);
  await expect(a.getByRole('status').filter({ hasText: 'すがたを かえたよ' })).toHaveCount(0);
  await a.context().close();
});

test('the guest: its villager is its いつもの; the same closet; its own look and コーデ, none of the members’; a villager pick sends villager, then look: null', async ({ browser }) => {
  test.setTimeout(45_000);
  const rec = newRecord();
  const g = await phone(browser, rec, 'G');
  await expect(settings(g).locator('[data-look-row]')).toHaveAttribute('data-look-row', 'villager');
  await openLook(g);
  await expect(settings(g).locator('[data-look-preview=villager]')).toBeVisible();
  await expect(status(g)).toContainText('いつもの');
  await tab(g, 'coord');
  await expect(chip(g, 'usual')).toHaveAttribute('aria-pressed', 'true');
  // a dress: the player, from A's starting look
  await tab(g, 'wear');
  await sub(g, 'onepiece');
  await settings(g).locator('[data-closet=onepiece] [data-item=TopsTexOnepieceBalloonHDolly]').click();
  await expect(settings(g).locator('[data-look-preview=player]')).toBeVisible();
  if (process.env.SHOTS) await g.screenshot({ path: `${process.env.SHOTS}/look-guest-dress.png` });
  await tab(g, 'coord');
  await settings(g).locator('[data-look-save]').click();
  await card(g).locator('[data-look-ok]').click();
  await expect.poll(() => (lastValue(rec, 'G', 'savedLooks') as Saved | undefined)?.map((s) => [s.name, s.look.top, s.look.bottom])).toEqual([['コーデ 1', 'TopsTexOnepieceBalloonHDolly0', null]]);
  await back(g);
  await expect.poll(() => lastValue(rec, 'G', 'look')).toMatchObject({ kind: 'player', look: { top: 'TopsTexOnepieceBalloonHDolly0', bottom: null } });
  expect(rec.sent.filter((e) => e.type === 'pref').every((e) => e.who === 'G' && e.ok)).toBe(true);
  await expect(settings(g).locator('[data-look-row]')).toHaveAttribute('data-look-row', 'player');
  // いつもの: back to its villager (no pref)
  await openLook(g);
  await chip(g, 'usual').click();
  await expect(settings(g).locator('[data-look-preview=villager]')).toBeVisible();
  await back(g);
  await expect.poll(() => lastValue(rec, 'G', 'look')).toBeNull();
  await expect(settings(g).locator('[data-look-row]')).toHaveAttribute('data-look-row', 'villager');
  // another villager: its いつもの now (the villager pref, then look: null)
  const before = lookKeys(rec, 'G').length;
  await openLook(g);
  await tab(g, 'villager');
  await settings(g).locator('[data-villager=raymond]').click();
  await expect(status(g)).toHaveText(`★いつもの · ${ROSTER.raymond.nameJa}`);
  await back(g);
  await expect.poll(() => lookKeys(rec, 'G').slice(before)).toEqual(['villager', 'look']);
  expect(lastValue(rec, 'G', 'villager')).toBe('raymond');
  expect(lastValue(rec, 'G', 'look')).toBeNull();
  await g.context().close();
});
