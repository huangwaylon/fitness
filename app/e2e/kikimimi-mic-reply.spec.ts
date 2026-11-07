// こたえて！ (docs/kikimimi-mic.md §2.3, §5): a reply round's 🎤 chip with the mic on, in the chromium-mic project: the
// stand-in mic (one of our clips through a getUserMedia shim, as kikimimi-mic-optin's), the stub recogniser
// (`e2e.stt`, set before each take), nothing played out loud, no network. Solo: a clear reply answers as its tap and
// what was heard shows at the reveal; an unclear one says 「通じるかも」 with it and the choices stay open; nothing heard
// says so; a tap mid-take drops the take and answers as tapped. Co-op (a unit's チェック over the demo's relay): A
// says the reply round's answer, B taps; B sees no chip text of A's, and what A said is in no message between the
// phones, in no stored value, and never POSTed. Screenshots (KIKI_SHOTS=1) into /tmp/kikimimi-shots/reply/ at 393×852.
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { openStage } from './kikimimi-nav.ts';

test.use({ viewport: { width: 393, height: 852 } });
const Q = 'date=2026-11-04T12:00&critter=none&visitor=none&kikimimi=fast';
const SHOTS = '/tmp/kikimimi-shots/reply';

type Kiki = {
  view(): { phase: string; i: number };
  right(): number;
  deck(ids: string[]): Promise<void>;
  items(): string[];
  unit(unit: unknown, ids: string[], cv?: string): Promise<void>;
};
const kiki = <R,>(p: Page, fn: (k: Kiki) => R) => p.evaluate(`(${fn.toString()})(window.__kiki)`) as Promise<R>;
const sheet = (p: Page) => p.locator('dialog[open] [data-kikimimi]');
async function shot(p: Page, name: string) {
  if (!process.env.KIKI_SHOTS) return;
  await expect(p.locator('dialog[open] [data-typing="true"]')).toHaveCount(0);
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: `${SHOTS}/${name}.png` });
}

/** The mic on with the stand-in mic (the clip once, then silence; each track in `__micTracks`), and every message
 *  between the demo's phones kept in `__said` (the BroadcastChannel's). */
async function micOn(ctx: BrowserContext) {
  await ctx.route('**/__e2e/mic.wav', (route) => route.fulfill({ path: `${import.meta.dirname}/fixtures/mic/ladder-line.wav`, contentType: 'audio/wav' }));
  await ctx.addInitScript(() => {
    localStorage.setItem('island.mic', JSON.stringify({ on: true, be: 'auto' }));
    localStorage.setItem('e2e.stt', JSON.stringify(['']));
    const w = window as unknown as { __micTracks: MediaStreamTrack[]; __said: string[] };
    w.__micTracks = [];
    w.__said = [];
    navigator.mediaDevices.getUserMedia = async () => {
      const ac = new AudioContext();
      await ac.resume();
      const src = ac.createBufferSource();
      src.buffer = await ac.decodeAudioData(await (await fetch('/__e2e/mic.wav')).arrayBuffer());
      const out = ac.createMediaStreamDestination();
      src.connect(out);
      src.start();
      w.__micTracks.push(...out.stream.getTracks());
      return out.stream;
    };
    const post = BroadcastChannel.prototype.postMessage;
    BroadcastChannel.prototype.postMessage = function (m: unknown) {
      w.__said.push(JSON.stringify(m));
      return post.call(this, m);
    };
  });
}
const live = (p: Page) => p.evaluate(() => (window as unknown as { __micTracks: MediaStreamTrack[] }).__micTracks.filter((t) => t.readyState === 'live').length);
/** What the stub hears at the next take. */
const willHear = (p: Page, line: string | { miss: string }) => p.evaluate((l) => localStorage.setItem('e2e.stt', JSON.stringify([l])), line);
/** Whether `text` is anywhere but the stub's script: a stored value, or a message between the phones. */
const kept = (p: Page, text: string) => p.evaluate((x) => {
  const stored = Object.keys(localStorage).filter((k) => k !== 'e2e.stt').some((k) => localStorage.getItem(k)?.includes(x));
  return stored || (window as unknown as { __said: string[] }).__said.some((m) => m.includes(x));
}, text);

/** The chip tapped, then tapped again to stop (the take's speech kept: the stub's line). */
async function sayIt(p: Page, shotName?: string) {
  const say = sheet(p).locator('[data-mic-say]');
  await expect(say).toHaveAttribute('aria-disabled', 'false');
  await say.click();
  await expect(sheet(p).locator('[data-mic-answer]')).toHaveAttribute('data-mic-answer', 'listening');
  if (shotName) await shot(p, shotName);
  await say.click();
}

test('こたえて！ solo: a clear reply answers as its tap, an unclear one 「通じるかも」, nothing heard, a tap mid-take', async ({ page, context }) => {
  test.slow();
  await micOn(context);
  const posts: string[] = [];
  page.on('request', (r) => r.method() === 'POST' && posts.push(r.url()));
  await page.goto(`?demo&${Q}`);
  await islandUp(page);
  await fromMenu(page, 'kikimimi');
  await expect(sheet(page)).toHaveAttribute('data-phase', 'lobby');
  await kiki(page, (k) => k.deck(['r2-up-to', 'r2-fossil', 'r2-tea', 'w2-seat']));
  await expect.poll(() => kiki(page, (k) => k.items())).toEqual(['r2-up-to', 'r2-fossil', 'r2-tea', 'w2-seat']);
  const answer = sheet(page).locator('[data-mic-answer]');
  const heard = sheet(page).locator('[data-mic-heard]');
  const atAnswer = async (i: number) => {
    await expect.poll(() => kiki(page, (k) => k.view().i), { timeout: 15_000 }).toBe(i);
    await expect(sheet(page)).toHaveAttribute('data-phase', 'answer', { timeout: 30_000 });
    return kiki(page, (k) => k.right());
  };

  // 1, clear: answered as that choice's tap; what was heard under the choices at the reveal; the track released
  await expect.poll(() => kiki(page, (k) => k.view().i), { timeout: 15_000 }).toBe(0);
  await expect(sheet(page).locator('[data-mic-say]')).toHaveAttribute('aria-disabled', 'true');
  let right = await atAnswer(0);
  await shot(page, '1-chip');
  await willHear(page, "I'm just fishing.");
  await sayIt(page, '2-listening');
  await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
  await expect(sheet(page).locator(`[data-choice="${right}"]`)).toHaveAttribute('aria-pressed', 'true');
  await expect(sheet(page).locator('[data-kiki-verdict]')).toHaveAttribute('data-kiki-verdict', 'right');
  await expect(heard).toContainText("“I'm just fishing.”");
  await expect(sheet(page).locator('[data-mic-say]')).toHaveCount(0);
  expect(await live(page)).toBe(0);
  await shot(page, '3-reveal');
  await sheet(page).locator('[data-kiki-next]').click();

  // 2, unclear: 「通じるかも」 with what was heard, nothing answered; a tap answers; heard kept for the reveal
  right = await atAnswer(1);
  await expect(heard).toHaveCount(0);
  await willHear(page, 'by the river');
  await sayIt(page);
  await expect(answer).toHaveAttribute('data-mic-answer', 'unsure');
  await expect(sheet(page).locator('[data-mic-unsure]')).toContainText('その言い方も通じるかも。選ぶなら？');
  await expect(sheet(page).locator('[data-mic-unsure]')).toContainText('“by the river”');
  await expect(sheet(page)).toHaveAttribute('data-phase', 'answer');
  await shot(page, '4-unsure');
  await sheet(page).locator(`[data-choice="${right}"]`).click();
  await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
  await expect(heard).toContainText('“by the river”');
  await sheet(page).locator('[data-kiki-next]').click();

  // 3, nothing heard: said so, the chip again; then a tap mid-take drops it and answers as tapped (a wrong one)
  right = await atAnswer(2);
  await willHear(page, { miss: 'none' });
  await sayIt(page);
  await expect(sheet(page).locator('[data-mic-missed]')).toHaveText('声が聞こえませんでした。もう一度どうぞ');
  await willHear(page, 'yes please just a little');
  await sheet(page).locator('[data-mic-say]').click();
  await expect(answer).toHaveAttribute('data-mic-answer', 'listening');
  const wrong = (right + 1) % 3;
  await sheet(page).locator(`[data-choice="${wrong}"]`).click();
  await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
  await expect(sheet(page).locator(`[data-choice="${wrong}"]`)).toHaveAttribute('data-mark', 'wrong');
  await expect(heard).toHaveCount(0);
  expect(await live(page)).toBe(0);
  await sheet(page).locator('[data-kiki-next]').click();

  // 4, not a reply round: no chip
  await atAnswer(3);
  await expect(sheet(page).locator('[data-mic-say]')).toHaveCount(0);
  await sheet(page).locator(`[data-choice="${await kiki(page, (k) => k.right())}"]`).click();
  await sheet(page).locator('[data-kiki-next]').click();
  await expect(sheet(page)).toHaveAttribute('data-phase', 'results');
  for (const x of ["I'm just fishing", 'by the river']) expect(await kept(page, x)).toBe(false);
  expect(posts).toEqual([]);
});

// a unit as its chunk holds it (kikimimi-coop.spec's fixture): its チェック has a reply round (r4-leak)
const CHECK = ['ml-n-room', 'ml-n-late-checkout', 'r4-leak', 'm4-easy', 'n4-reference', 'w4-youll-need'];
const LESSONS = {
  deai: ['d4-hotel-suite', 'r4-room-ready', 'm4-upgrade', 'r4-overbooked', 'ml-m-quieter-room', 'r4-anything-else'],
  bamen: ['ml-r-incidentals', 'm4-not-ideal', 'r4-triage', 'm4-see-what', 'w4-cant-uk', 'r4-reschedule'],
  check: CHECK
};
const IDS = Object.values(LESSONS).flat();
const UNIT = {
  id: 'tr-coopinn', name: 'ホテルで こまった', stage: 'mori', domain: 'tabi', host: 'diana', scene: 'lobby', sound: 'self-repair', status: 'draft',
  cando: { ja: 'ホテルの スタッフが へやの もんだいへの たいおうを せつめいするのを きいて、できる ことが わかる', short: 'ホテルの もんだいを ききとれる', en: 'I can follow hotel staff…' },
  lessons: { v: 1, ...LESSONS }, home: IDS,
  ph: [{ id: 'ph-co-room', en: 'the room is ready', register: 'service', scene: 'hotel desk', trap: 'ready = もう はいれる', in: ['r4-room-ready'] }]
};

test('こたえて！ co-op: A says the reply round’s answer, B taps; the team counts it, and what A said stays on A’s phone', async ({ browser }) => {
  test.slow();
  const ctx = await browser.newContext();
  await micOn(ctx);
  const posts: string[] = [];
  ctx.on('request', (r) => r.method() === 'POST' && posts.push(r.url()));
  const phone = async (as: 'A' | 'B') => {
    const p = await ctx.newPage();
    await p.goto(`?demo&${Q}${as === 'B' ? '&as=B' : ''}`);
    await islandUp(p);
    return p;
  };
  const addUnit = (p: Page) => p.evaluate(([u, ids]) => (window as unknown as { __kiki: Kiki }).__kiki.unit(u, ids as string[], 'c0ffee'), [UNIT, IDS] as const);
  const a = await phone('A'), b = await phone('B');
  await a.bringToFront();
  await fromMenu(a, 'kikimimi');
  await expect(sheet(a)).toHaveAttribute('data-phase', 'lobby');
  await addUnit(a);
  await sheet(a).locator('[data-kiki-tile="together"]').click();
  await sheet(a).locator('[data-kiki-invite-all]').click();
  const banner = b.locator('.banner', { hasText: 'ききみみに さそっています' });
  await expect(banner).toBeVisible({ timeout: 15_000 });
  await b.bringToFront();
  await banner.getByRole('button', { name: 'さんか' }).click();
  await expect(sheet(b)).toHaveAttribute('data-phase', 'lobby');
  await addUnit(b);
  await a.bringToFront();
  await expect(sheet(a).locator('[data-player="B"]')).toHaveAttribute('data-state', 'here');
  await sheet(a).locator('[data-kiki-path-open]').click();
  await openStage(a, 'mori');
  await sheet(a).locator(`[data-kiki-stop="${UNIT.id}"] [data-kiki-stop-open]`).click();
  await sheet(a).locator('[data-kiki-skip-check]').click();
  await sheet(a).locator('[data-kiki-lesson-start]').click();
  await expect(sheet(b)).not.toHaveAttribute('data-phase', 'lobby', { timeout: 10_000 });

  let said = '';
  for (let i = 0; i < CHECK.length; i++) {
    let reply = false;
    for (const p of [a, b]) {
      await p.bringToFront();
      await expect.poll(() => kiki(p, (k) => k.view().i), { timeout: 45_000 }).toBe(i);
      await expect(sheet(p)).toHaveAttribute('data-phase', 'answer', { timeout: 45_000 });
      const right = await kiki(p, (k) => k.right());
      reply = (await sheet(p).locator('[data-kiki-q]').getAttribute('data-type')) === 'reply';
      if (p === a && reply) {
        said = `Well, ${(await sheet(a).locator(`[data-choice="${right}"] .tx`).textContent()) ?? ''}`;
        await willHear(a, said);
        await sayIt(a);
      } else await sheet(p).locator(`[data-choice="${right}"]`).click();
      await expect(sheet(p).locator(`[data-choice="${right}"]`)).toHaveAttribute('aria-pressed', 'true');
    }
    await a.bringToFront();
    await expect(sheet(a)).toHaveAttribute('data-phase', 'reveal');
    if (reply) {
      // both got it (the team's count, as for two taps); what A said only on A's phone
      await expect(sheet(a).locator('[data-mic-heard]')).toContainText(said);
      await shot(a, '5-coop-A');
      await b.bringToFront();
      await expect(sheet(b)).toHaveAttribute('data-phase', 'reveal');
      await expect(sheet(b).locator('[data-kiki-verdict]')).toHaveAttribute('data-kiki-verdict', 'right');
      await expect(sheet(b).locator('[data-mic-heard]')).toHaveCount(0);
      await shot(b, '6-coop-B');
      await a.bringToFront();
    }
    await sheet(a).locator('[data-kiki-next]').click();
  }
  expect(said).not.toBe('');
  for (const p of [a, b]) {
    await p.bringToFront();
    await expect(sheet(p)).toHaveAttribute('data-phase', 'results', { timeout: 20_000 });
    expect(await kept(p, said)).toBe(false);
  }
  expect(posts).toEqual([]);
  await ctx.close();
});
