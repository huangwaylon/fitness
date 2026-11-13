<script lang="ts">
  // 保養所's 通知 (docs/design.md "Bots"; lib/its/push.ts): this phone's switch 「仮押さえと予約確定を通知する」, off by
  // default. A tap asks the notification permission first (in the tap), then subscribes and hands it to the Worker;
  // on only once the Worker took it. Where it can't work, one line says why (an iPhone's Safari tab: add it to the Home
  // Screen; notifications refused: the Settings app; an unsupported browser; a Worker without push yet: 準備中). On:
  // テスト通知 (waits PUSH_TEST_EVERY_SEC after each test, counting down on the button: the Worker's rate). A note: Focus
  // and Sleep can hold a notification back, and the site's mail still comes. Opening the tab with the Worker's push
  // read keeps the subscription fresh (refreshPush) and clears the app's badge. Members only (ボット has no 保養所 for
  // the guest or in demo mode).
  import { untrack } from 'svelte';
  import Phrases from '../ui/Phrases.svelte';
  import { t, i18n } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { PUSH_TEST_EVERY_SEC, type ItsPushStatus } from '#lib/its/contract.ts';
  import { disablePush, enablePush, pushOn, pushSupport, refreshPush, testPush, type EnableResult, type TestResult } from '#lib/its/push.ts';

  /** The Worker's push status (absent: a Worker without push; its key null: push off there). */
  let { push }: { push: ItsPushStatus | undefined } = $props();

  let on = $state(pushOn());
  let busy = $state(false);
  /** Why the last turn-on didn't take, or null. */
  let why = $state<EnableResult | null>(null);
  let tested = $state<TestResult | null>(null);
  let testing = $state(false);
  /** テスト通知 waits PUSH_TEST_EVERY_SEC after each test (the Worker's rate), counting down on the button. */
  let waitUntil = $state(0);
  let nowMs = $state(Date.now());
  const left = $derived(Math.max(0, Math.ceil((waitUntil - nowMs) / 1000)));
  $effect(() => {
    if (!left) return;
    const id = setInterval(() => (nowMs = Date.now()), 250);
    return () => clearInterval(id);
  });
  let support = $state(pushSupport());

  const vapid = $derived(push?.vapidPublic ?? null);
  /** The Worker can take a subscription. */
  const ready = $derived(!!vapid);
  const lang = () => (i18n.locale === 'en' ? 'en' : 'ja');
  /** The line under the switch: why it can't be used, or why the last turn-on failed. */
  const line = $derived(
    support === 'install' ? 'install' : support === 'unsupported' ? 'unsupported' : support === 'denied' ? 'denied' : !ready ? 'soon'
      : why && why !== 'on' ? why : null
  );
  const usable = $derived(support === 'ok' && ready);

  // once a mount, with the Worker's key read: the subscription kept fresh (a revoked permission turns it off);
  // `fresh` once that's done (data-its-push-fresh)
  let refreshed = false;
  let fresh = $state(false);
  $effect(() => {
    const key = vapid;
    if (refreshed || !key) return;
    refreshed = true;
    untrack(() => void refreshPush(key, lang()).then((v) => {
      on = v;
      support = pushSupport();
      fresh = true;
    }));
  });
  // opening 保養所: the app icon's badge (a push set it) goes
  $effect(() => void (navigator as Navigator & { clearAppBadge?: () => Promise<void> }).clearAppBadge?.()?.catch(() => {}));

  /** The tap: enablePush is called at once (its permission prompt must be in the gesture). */
  function toggle() {
    if (busy) return;
    if (on) {
      cue('toggle-off');
      on = false;
      why = tested = null;
      void disablePush();
      return;
    }
    if (!usable && support !== 'denied') return void cue('boop');
    busy = true;
    why = tested = null;
    const asked = enablePush(vapid, lang());
    void asked.then((r) => {
      busy = false;
      on = r === 'on';
      why = r;
      support = pushSupport();
      cue(on ? 'toggle-on' : 'boop');
    });
  }

  async function test() {
    if (testing || left) return;
    testing = true;
    tested = null;
    tested = await testPush(vapid, lang());
    testing = false;
    nowMs = Date.now();
    waitUntil = nowMs + PUSH_TEST_EVERY_SEC * 1000;
    if (tested !== 'sent') on = pushOn();
  }
</script>

<section class="sec" aria-labelledby="its-notify" data-its-notify data-its-push-fresh={fresh ? '' : undefined}>
  <h3 id="its-notify" class="sec-label">{t('its.sec.notify')}</h3>
  <button type="button" class="prow" role="switch" aria-checked={on} aria-disabled={busy || (!on && !usable && support !== 'denied')} aria-describedby={line ? 'its-notify-why' : undefined}
    data-its-push={on ? 'on' : 'off'} data-sfx="self" onclick={toggle}>
    <span class="prl">{t('its.push.switch')}<small>{t('its.push.hint')}</small></span>
    <span class="sw" aria-hidden="true"><i></i></span>
  </button>
  {#if line}<p class="hint" class:bad={line === 'failed' || line === 'denied'} id="its-notify-why" data-its-push-why={line}><Phrases text={t(`its.push.why.${line}`)} /></p>{/if}
  {#if on}
    <div class="test">
      <button type="button" class="btn small paper" data-its-push-test data-sfx="tick" aria-disabled={testing || left > 0} data-its-push-wait={left || undefined} onclick={() => void test()}>{left ? t('its.push.testWait', { n: left }) : t('its.push.test')}</button>
      {#if tested}<p class="hint" class:bad={tested === 'failed'} role="status" data-its-push-tested={tested}>{t(`its.push.tested.${tested}`, { n: PUSH_TEST_EVERY_SEC })}</p>{/if}
    </div>
  {/if}
  <p class="hint" data-its-push-note><Phrases text={t('its.push.note')} /></p>
</section>

<style>
  .sec { display: grid; gap: 8px; }
  .hint { margin: 0 4px; font-size: var(--fs-s); font-weight: 700; line-height: var(--lh); color: var(--text-soft); }
  .hint.bad { color: var(--coral-text); }
  small { display: block; margin-top: 2px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); line-height: 1.3; }
  .prow[aria-checked='true'] small { color: var(--c-ink-soft); }
  .prow[aria-disabled='true'] { cursor: default; }
  /* nothing to turn on here (a Safari tab, a Worker without push): the disabled tier (sunk, no edge: SoundSection's) */
  .prow[aria-disabled='true'][aria-checked='false'] { background: var(--ctl-off); box-shadow: none; transform: translateY(4px); color: var(--text-soft); }
  .prow[aria-disabled='true'][aria-checked='false'] .sw { opacity: .55; }
  .test { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .test .btn { margin: 0; }
  .test .hint { flex: 1; min-width: 10em; }
  /* (the switch: theme.css .sw) */
</style>
