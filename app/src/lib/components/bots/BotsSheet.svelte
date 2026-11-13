<script lang="ts">
  // ボット (docs/design.md "Bots"): the menu's ボット opens it (members only: open.svelte.ts botTabs), full height like
  // 設定, at once (Sheet's `pop`). One title bar (ボット, ✕), one scroller with the shown tab's page, and the bottom
  // tabs (a tablist): 保養所 (ItsPage) on the left, ジム (GymPage); with one bot only (demo mode: ジム), no tabs. It opens
  // on the tab last shown on this phone (DEVICE.botsTab; 保養所 by default). Only the shown page is mounted: it reads
  // and polls while shown, and the other tab, ✕ or a close unmounts it (nothing polls while closed). A tab's dot: that
  // bot needs a person (open.svelte.ts: the tab not shown is read once as the sheet opens). 保養所's unsaved draft: a
  // tab switch asks first (its `leave`), ✕, Esc and the backdrop too (Sheet's guard); its sticky 保存 bar sits at the
  // scroller's foot, over the tabs.
  import { tick } from 'svelte';
  import Sheet from '../ui/Sheet.svelte';
  import NavBar from '../ui/NavBar.svelte';
  import TabBar from '../ui/TabBar.svelte';
  import ItsPage from './ItsPage.svelte';
  import GymPage from './GymPage.svelte';
  import { botTabs, botsBadge, readBadge, type BotTab } from './open.svelte.ts';
  import { DEVICE, localKV } from '#lib/sync/storage.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { t } from '#lib/i18n/index.ts';

  let { open = $bindable() }: { open: boolean } = $props();

  const kv = localKV();
  const tabs = $derived(botTabs());
  let picked = $state<BotTab>(kv?.getItem(DEVICE.botsTab) === 'gym' ? 'gym' : 'its');
  /** The tab shown: the one picked, if this phone has it. */
  const tab = $derived(tabs.includes(picked) ? picked : (tabs[0] ?? 'its'));
  /** 保養所's guard (its draft). */
  let itsLeave = $state<((run: () => void) => void) | undefined>();
  let sheet: ReturnType<typeof Sheet> | undefined = $state();
  let body: HTMLElement | undefined = $state();

  const ICONS = { its: 'bed', gym: 'barbell' } as const;
  const items = $derived(tabs.map((id) => ({ id, label: t(`bots.${id}`), icon: ICONS[id], dot: botsBadge[id], note: t('bots.attention') })));

  // opening: the other tab's dot read (the shown page reads its own)
  $effect(() => {
    if (open) for (const k of tabs) if (k !== tab) readBadge(k);
  });

  function pick(id: BotTab) {
    if (id === tab) return;
    const go = () => {
      picked = id;
      try {
        kv?.setItem(DEVICE.botsTab, id);
      } catch {
        /* this opening only */
      }
      void tick().then(() => body?.scrollTo({ top: 0 }));
    };
    if (tab === 'its' && itsLeave) itsLeave(go);
    else go();
  }

  /** Closing ends its banner too. */
  function closed() {
    if (toasts.current) toasts.dismiss();
  }
</script>

<Sheet bind:this={sheet} bind:open tunes label={t('panel.bots')} variant="pop" onclose={closed} timed="bots">
  <div class="titlebar"><NavBar title={t('panel.bots')} onclose={() => (sheet ? sheet.guard(() => (open = false)) : (open = false))} sfx="self" /></div>
  <div class="bots-body" data-bots data-tab={tab} bind:this={body} id="bots-panel"
    role={tabs.length > 1 ? 'tabpanel' : undefined} aria-labelledby={tabs.length > 1 ? `bots-tab-${tab}` : undefined}>
    {#if tab === 'its'}
      <ItsPage bind:leave={itsLeave} />
    {:else}
      <GymPage />
    {/if}
  </div>
  {#if tabs.length > 1}
    <div class="tabs"><TabBar {items} value={tab} label={t('panel.bots')} attr="bots-tab" panel="bots-panel" onpick={pick} /></div>
  {/if}
</Sheet>

<style>
  /* The one scroller (設定's): it bleeds 8px past the side padding so focus rings and lips are not clipped; the
     tabs under it, so its foot (and 保存's sticky bar) is the tabs' top edge, no safe area to clear. */
  .bots-body {
    --body-pad: 18px;
    flex: 1; min-height: 0; overflow: hidden auto; overscroll-behavior: contain;
    margin: 0 -8px; padding: 6px 8px var(--body-pad); display: flex; flex-direction: column; gap: 14px;
  }
  .bots-body > :global(*) { flex: none; }
  /* an undo banner up: the last row can scroll clear of it */
  :global(dialog.toasting) .bots-body { --body-pad: 96px; }
  /* with no tabs, the home indicator's safe area under the last row (the pop's own --body-pad) */
  .bots-body:last-child { --body-pad: calc(var(--safe-bottom) + 18px + var(--kb, 0px)); }
  /* the tabs edge to edge, out of the sheet's side padding */
  .tabs { flex: none; margin: 0 calc(-1 * (var(--side) + var(--safe-right))) 0 calc(-1 * (var(--side) + var(--safe-left))); }
</style>
