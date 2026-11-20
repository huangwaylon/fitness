<script lang="ts">
  // やること's 「この端末に通知」 (docs/todo.md "Reminders"; push.svelte.ts over lib/push/phone.ts): this phone's switch at
  // the foot of the lists, off by default. A tap asks the notification permission first (in the tap), then subscribes
  // and hands it to the relay; on only once the relay took it. Where it can't work, one line says why (a Safari tab: the
  // Home Screen app; refused: the Settings app; an unsupported browser; a relay without push yet: 準備中). On: テスト通知.
  // Only items whose reminder names this phone's person notify it (the note).
  //   <TodoNotify />
  import { t, i18n } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { pushSupport, type EnableResult, type TestResult } from '#lib/push/phone.ts';
  import { pushState, todoPush } from './push.svelte.ts';

  let on = $state(todoPush.on());
  let busy = $state(false);
  let why = $state<EnableResult | null>(null);
  let tested = $state<TestResult | null>(null);
  let support = $state(pushSupport());
  const vapid = $derived(pushState.status?.vapidPublic ?? null);
  const lang = () => (i18n.locale === 'en' ? 'en' : 'ja');
  const line = $derived(
    support === 'install' ? 'pushInstall' : support === 'unsupported' ? 'pushUnsupported' : support === 'denied' ? 'pushDenied'
      : why === 'soon' ? 'pushSoon' : why === 'failed' ? 'pushFailed' : null
  );
  const TESTED: Record<TestResult, string> = { sent: 'todo.pushSent', wait: 'todo.pushWait', soon: 'todo.pushSoon', failed: 'todo.pushFailed' };
  const usable = $derived(support === 'ok' || support === 'denied');

  /** The tap: enable is called at once (its permission prompt must be in the gesture). */
  function toggle() {
    if (busy) return;
    if (on) {
      cue('toggle-off');
      on = false;
      why = tested = null;
      void todoPush.disable();
      return;
    }
    if (!usable) return void cue('boop');
    busy = true;
    why = tested = null;
    void todoPush.enable(vapid, lang()).then((r) => {
      busy = false;
      on = r === 'on';
      why = r;
      support = pushSupport();
      cue(on ? 'toggle-on' : 'boop');
    });
  }
  async function test() {
    if (busy) return;
    busy = true;
    tested = await todoPush.test(vapid, lang());
    busy = false;
    if (tested !== 'sent') on = todoPush.on();
  }
</script>

<div class="notify" data-todo-notify>
  <button type="button" class="prow" role="switch" aria-checked={on} aria-disabled={busy || (!on && !usable) || undefined} aria-describedby="todo-notify-why"
    data-todo-push={on ? 'on' : 'off'} data-sfx="self" onclick={toggle}>
    <span class="prl">{t('todo.push')}<small id="todo-notify-why">{line ? t(`todo.${line}`) : t('todo.pushNote')}</small></span>
    <span class="sw" aria-hidden="true"><i></i></span>
  </button>
  {#if on}
    <div class="test">
      <button type="button" class="text-link" data-todo-push-test data-sfx="tick" aria-disabled={busy || undefined} onclick={() => void test()}>{t('todo.pushTest')}</button>
      {#if tested}<span class="hint" role="status" data-todo-push-tested={tested}>{t(TESTED[tested])}</span>{/if}
    </div>
  {/if}
</div>

<style>
  .notify { display: grid; gap: 6px; }
  .prow[aria-disabled='true'] { cursor: default; }
  .prow[aria-disabled='true'][aria-checked='false'] { color: var(--text-soft); }
  .prow[aria-disabled='true'][aria-checked='false'] .sw { opacity: .55; }
  .test { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 0 4px; }
  .hint { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
</style>
