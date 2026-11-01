<script lang="ts">
  // せってい → つうち (docs/backend.md#notifications): one ON/OFF row, off by default and kept on this phone only. On,
  // this phone gets a notification when my partner's day reaches all four goals (once a day, never 22:00–08:00). The
  // browser's permission is asked only by this tap; where it can't work, a line says why (an iPhone's Safari tab: add
  // the app to the Home Screen first).
  import type { WeekView } from '#lib/types.ts';
  import { disablePush, enablePush, pushOn, pushSupport, type EnableResult } from '#lib/sync/push.ts';
  import { t } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';

  let { view }: { view: WeekView } = $props();

  let on = $state(pushOn());
  let busy = $state(false);
  let support = $state(pushSupport());
  /** Why the last tap didn't turn it on. */
  let problem = $state<Exclude<EnableResult, 'on'> | null>(null);
  const note = $derived(problem ?? (support === 'ok' ? null : support));
  const usable = $derived(support === 'ok' || support === 'denied');
  const name = $derived(view.people[view.partner].villagerName);

  function toggle() {
    if (busy || !usable) return;
    if (on) {
      on = false;
      problem = null;
      cue('toggle-off');
      void disablePush();
      return;
    }
    busy = true;
    // straight from the tap: iOS shows the permission prompt only for a user gesture
    void enablePush(view.locale).then((r) => {
      busy = false;
      on = r === 'on';
      problem = r === 'on' ? null : r;
      support = pushSupport();
      if (on) cue('toggle-on');
    });
  }
</script>

<div class="prows">
  <button type="button" class="prow" role="switch" aria-checked={on} aria-disabled={!usable || busy} data-sfx="self" onclick={toggle}>
    <span class="prl">{t('notify.goal', { name })}<small>{t('notify.goal.hint')}</small></span>
    <span class="sw" aria-hidden="true"><i></i></span>
  </button>
  <p class="note" role={problem ? 'status' : undefined}>
    {#if note}{t(`notify.${note}`)}<br />{/if}
    {t('notify.note', { name })}
  </p>
</div>

<style>
  .prl small { display: block; margin-top: 2px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .prow[aria-checked='true'] .prl small { color: var(--c-ink-soft); }
  .prow[aria-disabled='true'] { cursor: default; }

  /* the switch, as サウンド's: a sunk tan track (off) or a leaf one (on) with a cream knob */
  .sw {
    position: relative; flex: none; width: 56px; height: 32px; border-radius: var(--r-pill);
    background: var(--ctl-off); box-shadow: inset 0 0 0 2px var(--edge); transition: background var(--dur-quick);
  }
  .sw i {
    position: absolute; top: 4px; left: 4px; width: 24px; height: 24px; border-radius: 50%;
    background: var(--c-card); box-shadow: inset 0 0 0 2px var(--c-edge), 0 2px 0 var(--c-edge);
    transition: translate var(--dur-base) var(--ease-bounce);
  }
  .prow[aria-checked='true'] .sw { background: var(--c-leaf); box-shadow: inset 0 0 0 2px var(--c-leaf-edge); }
  .prow[aria-checked='true'] .sw i { translate: 24px 0; }

  .note { margin: 4px 6px 0; font-size: var(--fs-s); font-weight: 700; line-height: 1.5; color: var(--text-soft); }
</style>
