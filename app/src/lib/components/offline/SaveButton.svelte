<script lang="ts">
  // 「オフライン用に保存（16.8 MB）」 (docs/design.md "Offline maps"): an area's one control, on the trip map's page and on a
  // trail's map. Tapped: the save (lib/offline/areas.svelte.ts), its progress in the pill (tapped again: stopped, what's in
  // kept), then 「保存済み · 16.8 MB」 as a label, not a button. 一部のみ and 消えました are taps to go on; an OpenFreeMap
  // area past 30 days offers 更新. A save that can't start says why for a few seconds. Offline with nothing saved:
  // nothing shown. The NavButton family: a 32px pill drawn in the 44px hit, the kit's control (--ctl, --sh-ctl-s).
  import { onMount } from 'svelte';
  import type { L } from '#lib/travel/types.ts';
  import { t } from '#lib/i18n/index.ts';
  import Icon from '../ui/Icon.svelte';
  import { areas, type Refusal } from '#lib/offline/areas.svelte.ts';
  import { mb, type Plan } from '#lib/offline/plan.ts';

  let { plan, name }: { plan: Plan | null; name: L } = $props();

  let online = $state(typeof navigator === 'undefined' || navigator.onLine);
  let why = $state<Refusal | null>(null);
  let whyTimer: ReturnType<typeof setTimeout> | undefined;
  const id = $derived(plan?.id ?? '');
  const st = $derived(plan ? areas.state(plan.id) : { k: 'none' as const });
  const pct = $derived(st.k === 'saving' ? Math.floor((100 * st.done) / Math.max(1, st.total)) : 0);

  async function tap() {
    if (!plan) return;
    if (st.k === 'saving') return areas.stop();
    if (!online) return;
    const r = await areas.save(plan, name);
    if (r) {
      why = r;
      clearTimeout(whyTimer);
      whyTimer = setTimeout(() => (why = null), 4000);
    }
  }

  onMount(() => {
    void areas.refresh();
    const on = () => (online = navigator.onLine);
    addEventListener('online', on);
    addEventListener('offline', on);
    return () => (removeEventListener('online', on), removeEventListener('offline', on), clearTimeout(whyTimer));
  });
</script>

{#if plan && (online || st.k !== 'none')}
  {#if why}
    <p class="save why" role="status" data-offline-save="refused" data-offline-why={why}><span>{t(`offline.refuse.${why}`)}</span></p>
  {:else if st.k === 'saved' && !st.stale}
    <p class="save done" data-offline-save="saved" data-offline-id={id}><Icon name="check" size={16} stroke={2.6} /><span>{t('offline.saved', { mb: mb(st.bytes) })}</span></p>
  {:else}
    <button type="button" class="save" class:busy={st.k === 'saving'} style:--p="{pct}%" data-offline-save={st.k === 'saved' ? 'stale' : st.k} data-offline-id={id} data-sfx="tick"
      aria-label={st.k === 'saving' ? `${t('offline.saving', { pct })} · ${t('offline.stop')}` : undefined} aria-disabled={!online && st.k !== 'saving'} onclick={tap}>
      <Icon name={st.k === 'saving' ? 'close' : st.k === 'saved' ? 'refresh' : 'download'} size={16} stroke={2.4} />
      <span>{st.k === 'saving' ? t('offline.saving', { pct }) : st.k === 'saved' ? t('offline.update') : st.k === 'partial' ? t('offline.partial') : st.k === 'gone' ? t('offline.gone') : t('offline.save', { mb: mb(plan.bytes) })}</span>
    </button>
  {/if}
{/if}

<style>
  .save {
    appearance: none; position: relative; flex: none; display: inline-flex; align-items: center; gap: 5px; height: var(--hit); margin: 0; padding: 0 14px 0 10px;
    border: 0; background: none; color: var(--text); font: 700 var(--fs-s)/1 var(--font-ui); white-space: nowrap; cursor: pointer;
    -webkit-tap-highlight-color: transparent; touch-action: manipulation;
  }
  /* the pill, 32px in the 44px hit (NavButton's), the progress filling it yuzu */
  .save::before { content: ''; position: absolute; inset: 6px 0; border-radius: var(--r-pill); background: var(--ctl); box-shadow: var(--sh-ctl-s); }
  .save.busy::before { background: linear-gradient(90deg, var(--ctl-sel) var(--p), var(--ctl) var(--p)); }
  .save > :global(*) { position: relative; }
  button.save:active::before { transform: translateY(2px); box-shadow: var(--sh-ctl-s-press); }
  button.save[aria-disabled='true'] { cursor: default; color: var(--text-soft); }
  .save:focus-visible { outline: none; }
  .save:focus-visible::before { outline: 2px solid var(--focus); outline-offset: 2px; }
  /* a label: saved (the leaf check), or why a save didn't start */
  p.save { cursor: default; }
  .done :global(svg) { color: var(--leaf-text); }
  .why { color: var(--coral-text); }
  @media (prefers-reduced-motion: reduce) { button.save:active::before { transform: none; } }
</style>
