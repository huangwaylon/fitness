#!/usr/bin/env python3
"""The one Chrome this program drives, and the two jobs that need it.

Two users, one browser: the Turnstile solver that mints a session, and the
申込する/確認 leg that files an application. They are serialised by `hold()`, because
`_kill_stray_chrome()` reaps by `pgrep -f remote-debugging-port` and that matches a
filing browser as readily as a solving one — a timed-out solve would otherwise SIGKILL
a browser between 申込する and 確認, with no way to learn which side of the commit it
died on. Under the lock, anything `pgrep` finds really is an orphan.

**Turnstile** detects Playwright's bundled Chromium and a HeadlessChrome UA; pydoll
driving real Chrome over CDP passes, and a minimised window still passes. The checkbox
sits in a cross-origin iframe reachable only by CDP mouse events, at the centre of the
widget's 300 px box (`_checkbox_spot`; the left-edge spot is the second attempt). On
Linux (Actions) Chrome runs headed under xvfb, not minimised (xvfb has no window
manager to minimise to). See its/SITE.md §6.

`last_solve` records how the latest solve went (seconds, which spot), for the runner's
reports.

**`submit()`** files the emailed leg: the site refuses curl's POST (its/SITE.md §5), so
Chrome is the only committer. **It presses 確認**, past which a real reservation exists, so:

  - `allow_commit` is a **callable**, re-consulted immediately before the commit —
    filling a form takes tens of seconds and the gate can close inside that window;
  - every field is written back and *read back*. A `<select>` given a value not among
    its options keeps its old one silently, so an unverified mismatch would file a
    blank 都道府県 or 生年月日 against somebody's insurance record;
  - 申込内容確認画面 must be on screen before 確認 is looked for.

A timeout does **not** reap the browser — it may have landed after 確認 was accepted,
and SIGKILL cannot un-file an application, so the outcome is unknown and the mailbox is
the authority. Field values are never logged; they are 資格認証のキー.

pydoll is imported inside the functions that need it, never at module scope: it is the
one dependency, and a booking that already holds a room and has had its mail sent must
not be lost to its absence.

    python3 chrome.py       # solve, cache the calendar URL
"""
import asyncio
import contextlib
import json
import os
import re
import signal
import subprocess
import sys
import threading
import time
from datetime import datetime

from config import (
    BROWSER_CONFIRM_TIMEOUT, CALENDAR_URL_CACHE, CAPTCHA_TIMEOUT, USER_AGENT_CACHE,
    TURNSTILE_ATTEMPTS, TURNSTILE_POLL_SEC, TURNSTILE_TOKEN_SEC, TURNSTILE_RELOAD_PAUSE, SOLVE_PAUSES, LEG_PAUSES,
    CHROME_WAIT_SEC, EVIDENCE_TIMEOUT,
)
import book_hotels as bh
from book_hotels import log

_CONFIRM_TEXT = '申込内容確認'

_LINUX = sys.platform.startswith('linux')

# The latest solve's outcome: {'secs': float, 'spot': 'centre' | 'left' | None, 'cls': a failure's code or None}.
# Written by `get_calendar_url`, read by main.py's URL monitor for the reports. `cls`: `timeout` (CAPTCHA_TIMEOUT),
# `chrome_<exception>`, `unsolved` (no token after every attempt), `no_calendar` (solved, but 次へ led elsewhere).
last_solve = {'secs': None, 'spot': None, 'cls': None}

# The latest filing leg: whether 申込する was pressed (a timeout after it is `submit_unknown`, before it nothing was
# sent: `leg_timeout`).
last_leg = {'applied': False}

# Every fixed wait on a page goes through this; the tests replace it (no real sleeps).
_pause = asyncio.sleep


# ── one Chrome at a time ─────────────────────────────────────────────
# Long enough to sit through a solve plus teardown, short enough that a wedged holder
# cannot cost a whole booking (config.CHROME_WAIT_SEC).
DEFAULT_WAIT = CHROME_WAIT_SEC

_lock = threading.Lock()


@contextlib.contextmanager
def hold(timeout=None):
    """Own the browser for the duration of the block.

    Yields True when the lock was taken, False when not — callers decide, because a
    solve can wait for the next cycle while a booking on a hold may have seconds.
    `timeout=None` reads `DEFAULT_WAIT` at call time, so a test can shorten it.
    """
    wait = DEFAULT_WAIT if timeout is None else timeout
    acquired = _lock.acquire(timeout=wait)
    try:
        yield acquired
    finally:
        if acquired:
            _lock.release()


# ── Chrome plumbing ──────────────────────────────────────────────────

def value(result):
    """Unwrap a CDP Runtime.evaluate result to its plain string value."""
    if isinstance(result, dict):
        result = result.get('result', {}).get('result', {}).get('value', '')
    return result if isinstance(result, str) else ''


def spawn(command):
    """pydoll's `process_creator`: Chrome with stdin closed and stdout/stderr **inherited**, i.e. our fd 1/2.

    pydoll's default pipes both and never reads them, so a chatty Chrome fills the 64 KB pipe and blocks on its next
    write: a wedged solve, or a wedged browser between 申込する and 確認. Inherited, its output lands where ours does:
    the private log on a `--remote` run (logs.setup() pointed fd 1/2 there), never the public Actions log; a local run
    has none of that and sends it to /dev/null as pydoll did."""
    import logs
    out = None if logs.private_fds() else subprocess.DEVNULL
    return subprocess.Popen(command, stdin=subprocess.DEVNULL, stdout=out, stderr=out)


def launch():
    """A real, non-headless Chrome — Turnstile rejects headless, and so may /apply.
    On Linux the display is xvfb's (the workflow runs us under `xvfb-run`). Its output goes through `spawn`, set as
    the browser's process manager's `process_creator` (pydoll 2.22's hook: Chrome() doesn't take one itself)."""
    from pydoll.browser.chromium.chrome import Chrome
    from pydoll.browser.managers import BrowserProcessManager
    from pydoll.browser.options import ChromiumOptions

    options = ChromiumOptions()
    options.headless = False
    options.add_argument('--no-sandbox')
    options.add_argument('--lang=ja-JP')
    options.add_argument('--window-size=1280,1600')
    browser = Chrome(options=options)
    browser._browser_process_manager = BrowserProcessManager(process_creator=spawn)
    return browser


async def minimise(tab):
    """Hide the window without going headless — minimised still renders, and passes.
    Not on Linux: under xvfb nobody sees it, and the measured passes were not minimised."""
    if _LINUX:
        return
    try:
        win = await tab._connection_handler.execute_command(
            {'method': 'Browser.getWindowForTarget', 'params': {}})
        window_id = win.get('result', win).get('windowId')
        if window_id:
            await tab._connection_handler.execute_command({
                'method': 'Browser.setWindowBounds',
                'params': {'windowId': window_id,
                           'bounds': {'windowState': 'minimized'}},
            })
    except Exception:
        pass   # cosmetic only; never worth losing a hold over


async def html(tab):
    return value(await tab.execute_script('return document.documentElement.outerHTML'))


async def evidence(tab, label, step):
    """Save the page as it is now, HTML and a screenshot, to the private debug dir (book_hotels.DEBUG_DIR, in the
    state dir: on the applicant's pages it shows 記号/番号/カナ氏名/生年月日, so it is as credential-bearing as a dump).
    For a failed solve and for any failure after 申込する. Each half bounded by EVIDENCE_TIMEOUT (a hung Chrome must not
    hold up the leg further); never raises."""
    try:
        os.makedirs(bh.DEBUG_DIR, exist_ok=True)
        safe = re.sub(r'[^\w.\-]+', '_', label).strip('_') or 'page'
        stem = os.path.join(bh.DEBUG_DIR, f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{bh._dump_seq()}_{safe}_{step}")
    except Exception as e:
        log(f'Could not save evidence: {e!r}')
        return None
    saved = []
    try:
        page = await asyncio.wait_for(html(tab), EVIDENCE_TIMEOUT)
        with open(stem + '.html', 'w', encoding='utf-8') as f:
            f.write(page)
        saved.append('html')
    except Exception as e:
        log(f'Evidence: no HTML ({type(e).__name__})')
    try:
        await asyncio.wait_for(tab.take_screenshot(path=stem + '.png'), EVIDENCE_TIMEOUT)
        saved.append('png')
    except Exception as e:
        log(f'Evidence: no screenshot ({type(e).__name__})')
    if saved:
        log(f"Evidence saved: {os.path.basename(stem)} ({', '.join(saved)})")
        bh._prune_debug_dir()
    return stem


async def _click(tab, predicate):
    """Click the first input/button matching a JS predicate on `e`."""
    return value(await tab.execute_script("""
        const b = [...document.querySelectorAll('input,button')].find(e => %s);
        if (!b) return 'missing';
        b.click();
        return 'clicked';
    """ % predicate))


def _kill_stray_chrome():
    """Kill Chrome processes left behind by an abandoned solve — a cancelled
    `async with Chrome(...)` cannot always finish pydoll's teardown, and each orphan
    keeps a profile and a few hundred MB. Only safe under `hold()`: the match is on
    launch flags an application-filing browser carries too."""
    try:
        out = subprocess.run(['pgrep', '-f', 'remote-debugging-port'],
                             capture_output=True, text=True, timeout=10).stdout
        for pid in [int(p) for p in out.split() if p.isdigit()]:
            try:
                os.kill(pid, signal.SIGKILL)
                log(f'Killed stray Chrome pid {pid}')
            except (ProcessLookupError, PermissionError):
                pass
    except Exception as e:
        log(f'Could not reap stray Chrome: {e}')


# ── Turnstile ────────────────────────────────────────────────────────

async def _save_user_agent(tab):
    """Record Chrome's UA alongside the session token it minted, so curl's replays and
    the browser that solved the CAPTCHA cannot disagree."""
    try:
        ua = value(await tab.execute_script('return navigator.userAgent'))
        ua = (ua.splitlines() or [''])[0].strip()
        if not ua or 'Headless' in ua:
            log(f'Not recording user agent: {ua or "(empty)"}')
            return
        with open(USER_AGENT_CACHE + '.tmp', 'w') as f:
            f.write(ua + '\n')
        os.replace(USER_AGENT_CACHE + '.tmp', USER_AGENT_CACHE)
        log(f'Recorded Chrome user agent: {ua}')
    except Exception as e:
        log(f'Could not record user agent: {e}')


# The widget draws a 300 px box centred in the `.cf-turnstile` container (960 px wide on
# the page), its checkbox 22 px in from the box's left edge (its/SITE.md §6). The second attempt clicks 28 px in from
# the container's own left edge.
_WIDGET_W = 300
_CHECKBOX_IN = 22
_LEFT_IN = 28


def _checkbox_spot(bounds, attempt):
    """`(x, y, spot)` to click on this attempt: the drawn checkbox at the centred box
    (`x + w/2 − 150 + 22`) first, the container's left-edge spot (`x + 28`) second, then centred
    again. A container narrower than the box clamps to its own left edge."""
    y = int(bounds['y'] + bounds['height'] / 2)
    if attempt % 2 == 0:
        return int(bounds['x'] + _LEFT_IN), y, 'left'
    left = bounds['x'] + max(0.0, bounds['width'] / 2 - _WIDGET_W / 2)
    return int(left + _CHECKBOX_IN), y, 'centre'


async def _click_turnstile_checkbox(tab, attempt=1):
    """Find the Turnstile widget and click its checkbox via CDP mouse events.

    Returns `(token, spot)`: the cf-turnstile-response token string (None on failure)
    and which spot was clicked.
    """
    from pydoll.commands.input_commands import InputCommands
    from pydoll.protocol.input.types import MouseEventType, MouseButton

    cf = await tab.find(class_name='cf-turnstile', timeout=10, raise_exc=False)
    if not cf:
        log('No Cloudflare Turnstile widget found on page')
        return None, None

    bounds = await cf.get_bounds_using_js()
    log(f'Turnstile widget bounds: x={bounds["x"]:.0f} y={bounds["y"]:.0f} '
        f'w={bounds["width"]:.0f} h={bounds["height"]:.0f}')

    # The checkbox sits in a cross-origin iframe: CDP mouse events cross iframe
    # boundaries; DOM clicks do not.
    x, y, spot = _checkbox_spot(bounds, attempt)
    log(f'Clicking Turnstile checkbox at ({x}, {y}), the {spot} spot...')

    for event in (MouseEventType.MOUSE_PRESSED, MouseEventType.MOUSE_RELEASED):
        await tab._connection_handler.execute_command(
            InputCommands.dispatch_mouse_event(
                type=event, x=x, y=y, button=MouseButton.LEFT, click_count=1))
        await _pause(0.1)

    deadline = time.time() + TURNSTILE_TOKEN_SEC
    while time.time() < deadline:
        await _pause(TURNSTILE_POLL_SEC)
        token = value(await tab.execute_script(
            'return document.querySelector'
            '(\'input[name="cf-turnstile-response"]\')?.value || ""'))
        if token:
            # Length only: this is Cloudflare's single-use response token.
            log(f'Turnstile token obtained ({len(token)} chars)')
            return token, spot
        log(f'  Waiting for token ({TURNSTILE_TOKEN_SEC - (deadline - time.time()):.0f}s)...')

    log('Turnstile token not generated within timeout')
    return None, spot


async def solve_turnstile(tab):
    """Solve Cloudflare Turnstile on the given pydoll tab. The token, or None."""
    for attempt in range(1, TURNSTILE_ATTEMPTS + 1):
        log(f'═══ Turnstile attempt {attempt}/{TURNSTILE_ATTEMPTS} ═══')
        token, spot = await _click_turnstile_checkbox(tab, attempt)
        if token:
            last_solve['spot'] = spot
            return token
        if attempt < TURNSTILE_ATTEMPTS:
            log('Reloading page for fresh Turnstile challenge...')
            await tab.refresh()
            await _pause(TURNSTILE_RELOAD_PAUSE)

    log('Failed to solve Turnstile after all attempts')
    return None


async def get_calendar_url():
    """Solve the CAPTCHA and cache a fresh calendar URL, under a hard deadline.

    The solve occupies the one thread that can re-mint a session, so an untimed Chrome
    hang would stop all booking behind a healthy-looking process. Serialised against
    the application-filing browser. None on failure or timeout, with `last_solve['cls']` saying which.
    """
    last_solve.update(secs=None, spot=None, cls=None)
    with hold() as owned:
        if not owned:
            log('Chrome is busy filing an application; deferring this solve')
            return None
        t0 = time.monotonic()
        try:
            url = await asyncio.wait_for(_solve_and_cache(), timeout=CAPTCHA_TIMEOUT)
            if not url:
                last_solve['cls'] = last_solve['cls'] or 'unsolved'
            return url
        except asyncio.TimeoutError:
            log(f'TIMEOUT: solve exceeded {CAPTCHA_TIMEOUT}s, abandoning this attempt')
            last_solve['cls'] = 'timeout'
            _kill_stray_chrome()
            return None
        except Exception as e:
            log(f'Solve failed: {e!r}')
            last_solve['cls'] = chrome_cls(e)
            return None
        finally:
            last_solve['secs'] = round(time.monotonic() - t0, 1)


def chrome_cls(e):
    """A failure's code from Chrome's (or pydoll's) exception: `chrome_<class>`, lower-cased."""
    return ('chrome_' + re.sub(r'[^a-z0-9_]', '', type(e).__name__.lower()))[:40]


async def _solve_and_cache():
    """Navigate ITS, solve Turnstile, click 次へ, and cache the calendar URL. A failure (or the timeout cancelling it)
    leaves the page's evidence in the debug dir."""
    log('Starting Chrome browser via pydoll...')
    async with launch() as browser:
        tab = await browser.start()
        try:
            return await _solve_on(tab)
        except asyncio.CancelledError:
            await evidence(tab, 'solve', 'timeout')
            raise
        except Exception as e:
            await evidence(tab, 'solve', chrome_cls(e))
            raise


async def _solve_on(tab):
    pause_home, pause_captcha, pause_next = SOLVE_PAUSES
    await minimise(tab)

    log('Navigating to ITS homepage...')
    await tab.go_to(bh.BASE + '/', timeout=30)
    await _pause(pause_home)

    await _save_user_agent(tab)

    log('Looking for カレンダーから探す link...')
    await tab.execute_script("""
        for (const a of document.querySelectorAll('a')) {
            if (a.textContent.includes('カレンダーから探す')) { a.click(); return true; }
        }
        return false;
    """)
    await _pause(pause_captcha)

    url = await tab.current_url
    log(f'On captcha page: {url}')
    if 'calendar_apply' not in url:
        log(f'WARNING: unexpected URL (expected calendar_apply): {url}')

    if not await solve_turnstile(tab):
        log('FAILED to solve Turnstile')
        last_solve['cls'] = 'unsolved'
        await evidence(tab, 'solve', 'unsolved')
        return None

    log('Turnstile solved! Submitting form...')
    await tab.execute_script("""
        const btn = document.querySelector('input[value="次へ"]');
        if (btn) { btn.disabled = false; btn.form.submit(); }
    """)
    await _pause(pause_next)

    calendar_url = await tab.current_url
    log(f'Calendar URL obtained — {calendar_url}')

    # A non-calendar URL still answers 200, so caching one makes the session
    # look healthy forever and no re-solve ever fires.
    if 'calendar_select' not in (calendar_url or ''):
        log(f'FAILED: not a calendar URL, not caching: {calendar_url}')
        last_solve['cls'] = 'no_calendar'
        await evidence(tab, 'solve', 'no_calendar')
        return None

    with open(CALENDAR_URL_CACHE + '.tmp', 'w') as f:
        f.write(calendar_url + '\n')
    os.replace(CALENDAR_URL_CACHE + '.tmp', CALENDAR_URL_CACHE)
    log(f'Saved to {CALENDAR_URL_CACHE}')
    return calendar_url


# ── the 申込する / 確認 leg ───────────────────────────────────────────

def submit(link, values, log, tag, allow_commit):
    """Fill the emailed applicant form, press 申込する, then 確認.

    `values` is `map_fields`' post body without the hidden fields — the DOM already has
    `_method` and `authenticity_token`, and overwriting them with copies from a
    different page load is how a browser submit fails for a reason that looks like the
    bug it works around. Returns `(status, detail)` in `confirm_from_email`'s
    vocabulary, `detail` a code for every outcome but `confirmed` (the 申込受付番号) and a
    gate's deferral (its reason): `hold_expired`, `room_taken`, `link_used`,
    `fill_rejected`, `no_apply_button`, `no_confirm_screen`, `no_confirm_button`,
    `no_completion`, `submit_unknown` (the budget ran out after 申込する: the mailbox is the
    authority), `leg_timeout` (ran out before it: nothing sent), `browser_busy`,
    `chrome_<exception>`. Any failure after 申込する leaves the page's evidence (HTML and a
    screenshot) in the debug dir.
    """
    budget = BROWSER_CONFIRM_TIMEOUT
    last_leg['applied'] = False

    with hold(timeout=max(1, budget)) as owned:
        if not owned:
            log(f'{tag}   Chrome is busy re-minting a session; '
                f'not waiting any longer with a hold running')
            return 'failed', 'browser_busy'
        try:
            return asyncio.run(
                asyncio.wait_for(_run(link, values, log, tag, allow_commit),
                                 timeout=budget))
        except asyncio.TimeoutError:
            if not last_leg['applied']:
                log(f'{tag}   Browser submit exceeded {budget:.0f}s before 申込する: nothing was sent')
                return 'failed', 'leg_timeout'
            log(f'{tag}   Browser submit exceeded {budget:.0f}s: outcome UNKNOWN. '
                f'Check the mailbox for a 申込完了メール before retrying.')
            return 'failed', 'submit_unknown'
        except Exception as e:
            log(f'{tag}   Browser submit failed: {e!r}')
            return 'failed', chrome_cls(e)


async def _run(link, values, log, tag, allow_commit):
    import confirm_booking

    async with launch() as browser:
        tab = await browser.start()

        async def after_apply(code, why):
            """A failure past 申込する: say so, keep the page."""
            log(f'{tag}   {why}')
            await evidence(tab, f'leg_{tag}', code)
            return 'failed', code
        try:
            return await _leg(tab, link, values, log, tag, allow_commit, after_apply, confirm_booking)
        except asyncio.CancelledError:
            if last_leg['applied']:
                await evidence(tab, f'leg_{tag}', 'submit_unknown')
            raise
        except Exception as e:
            if last_leg['applied']:
                await evidence(tab, f'leg_{tag}', chrome_cls(e))
            raise
        finally:
            try:
                await browser.stop()
            except Exception:
                pass


async def _leg(tab, link, values, log, tag, allow_commit, after_apply, confirm_booking):
    pause_load, pause_apply, pause_confirm = LEG_PAUSES
    await minimise(tab)
    await tab.go_to(link, timeout=30)
    await _pause(pause_load)

    page = await html(tab)
    if confirm_booking._EXPIRED_TEXT in page:
        log(f'{tag}   The hold expired before the browser reached the form')
        return 'failed', 'hold_expired'
    if bh._NO_ROOMS_TEXT in page:
        return 'failed', 'room_taken'

    # Write every value back and read it back out — see the module note.
    report = value(await tab.execute_script("""
        const V = %s;
        const bad = [];
        let ok = 0;
        for (const [name, v] of Object.entries(V)) {
            const el = document.getElementsByName(name)[0];
            if (!el) { bad.push(name + ':missing'); continue; }
            el.value = v;
            el.dispatchEvent(new Event('input',  {bubbles: true}));
            el.dispatchEvent(new Event('change', {bubbles: true}));
            if (el.value === v) { ok++; } else { bad.push(name + ':rejected'); }
        }
        return JSON.stringify({ok: ok, bad: bad});
    """ % json.dumps(values, ensure_ascii=False)))
    try:
        filled = json.loads(report or '{}')
    except ValueError:
        filled = {}
    bad = filled.get('bad') or []
    # Every field missing means this is not the applicant form at all — a
    # consumed link renders something else, and calling that "could not fill"
    # sends the operator hunting for a form-mapping bug that is not there.
    if values and all(b.endswith(':missing') for b in bad) \
            and len(bad) == len(values):
        log(f'{tag}   The emailed link no longer shows the applicant form '
            f'(no such fields on the page) — it was probably already used')
        return 'failed', 'link_used'
    # Field *names* only. The values are 資格認証のキー.
    log(f'{tag}   Browser filled {filled.get("ok", 0)}/{len(values)} fields'
        + (f', not accepted: {", ".join(bad)}' if bad else ''))
    if bad or filled.get('ok') != len(values):
        log(f'{tag}   Not submitting a form the page did not accept in full')
        return 'deferred', 'fill_rejected'

    if await _click(tab, "(e.value || e.textContent || '').includes('申込する')") \
            != 'clicked':
        log(f'{tag}   No 申込する control on the page')
        return 'failed', 'no_apply_button'
    last_leg['applied'] = True
    await _pause(pause_apply)

    page = await html(tab)
    if _CONFIRM_TEXT not in page:
        if bh._NO_ROOMS_TEXT in page:
            return await after_apply('room_taken', '申込する: the room was taken meanwhile')
        return await after_apply('no_confirm_screen', '申込する did not reach 申込内容確認画面 even in Chrome')

    # Re-checked here, on the screen before the commit, because filling the
    # form took time and the free-cancellation gate can have closed.
    allowed, why = allow_commit()
    if not allowed:
        log(f'{tag}   Gate closed before 確認 in the browser: {why}')
        return 'deferred', why

    log(f'{tag}   確認 (browser): filing the application')
    if await _click(tab, "['確認', '確定'].includes("
                         "(e.value || e.textContent || '').trim())") != 'clicked':
        return await after_apply('no_confirm_button', 'No 確認 control on 申込内容確認画面')
    await _pause(pause_confirm)

    page = await html(tab)
    receipt = confirm_booking.parse_receipt(page)
    if receipt or '申込完了' in page:
        return 'confirmed', receipt
    return await after_apply('no_completion', 'Browser 確認 did not produce a completion page: outcome '
                                              'unknown, check the mailbox for a 申込完了メール')


if __name__ == '__main__':
    asyncio.run(get_calendar_url())
