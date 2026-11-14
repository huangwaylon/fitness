<script lang="ts">
  // ボット (docs/design.md "Bots"): the menu's ボット opens it (members only: open.svelte.ts botTabs), full height like
  // 設定, at once (Sheet's `pop`). One title bar (ボット, ✕), one scroller with the shown tab's page, and the bottom
  // tabs (a tablist, registry.ts's bots left to right: ジム, 保養所, メニュー); with one bot only, no tabs. It opens on
  // the tab last shown in this app session (DEVICE.botsTab, sessionStorage: a swipe-closed app opens on ジム, the
  // leftmost; an update's reload keeps it), or the one asked (show(tab): a notification's tap opens 保養所). Only the
  // shown page is mounted (the three in this chunk): it reads and polls while shown, and the other tab, ✕ or a close
  // unmounts it. Each tab's dot (summary.svelte.ts, StatusDot; dimmed and 「（古い）」 when stale): the other tabs read as the
  // sheet opens, then every 5 min while it stays open (`watch`). 保養所's unsaved draft: a tab switch asks first (its
  // `leave`), ✕, Esc and the backdrop too (Sheet's guard); its sticky 保存 bar sits at the scroller's foot, over the tabs.
  import { tick, untrack } from 'svelte';
  import Sheet from '../ui/Sheet.svelte';
  import NavBar from '../ui/NavBar.svelte';
  import TabBar from '../ui/TabBar.svelte';
  import ItsPage from './ItsPage.svelte';
  import GymPage from './GymPage.svelte';
  import KaloriPage from './KaloriPage.svelte';
  import StatusDot from './StatusDot.svelte';
  import { botTabs, botsSheet } from './open.svelte.ts';
  import { BOTS, botMeta, type BotId } from './registry.ts';
  import { summaries, watch } from './summary.svelte.ts';
  import { shown } from '#lib/bots/types.ts';
  import { DEVICE, sessionKV } from '#lib/sync/storage.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import '#lib/i18n/bots.ts';

  let { open = $bindable() }: { open: boolean } = $props();

  const kv = sessionKV();
  const tabs = $derived(botTabs());
  const kept = kv?.getItem(DEVICE.botsTab);
  let picked = $state<BotId>(BOTS.some((b) => b.id === kept) ? (kept as BotId) : 'gym');
  /** The tab shown: the one picked, if this phone has it. */
  const tab = $derived(tabs.includes(picked) ? picked : (tabs[0] ?? 'gym'));
  /** 保養所's guard (its draft). */
  let itsLeave = $state<((run: () => void) => void) | undefined>();
  let sheet: ReturnType<typeof Sheet> | undefined = $state();
  let body: HTMLElement | undefined = $state();

  /** A tab's dot as drawn, and its name: 「ジム、順調」 (en 「Gym, healthy」), 「、要対応」 when a person must look,
   *  「（古い）」 when the dot is stale. */
  function dotOf(id: BotId) {
    const s = summaries[id];
    const d = shown(s);
    const raw = t(`bots.w.${d.w}`);
    const word = i18n.locale === 'en' ? raw.toLowerCase() : raw;
    let name = t('bots.say', { bot: t(botMeta(id).labelKey), word });
    if (d.look && d.w !== 'needsYou') name = t('bots.say', { bot: name, word: t('bots.attention') });
    return { ...d, stale: s.stale, name: s.stale ? name + t('bots.stale') : name };
  }
  const dots = $derived(Object.fromEntries(tabs.map((id) => [id, dotOf(id)])) as Record<BotId, ReturnType<typeof dotOf>>);
  const items = $derived(tabs.map((id) => ({
    id, label: t(botMeta(id).labelKey), icon: botMeta(id).icon, name: dots[id].name,
    attrs: { 'data-tab-status': dots[id].tone, 'data-look': dots[id].look ? '' : undefined, 'data-stale': dots[id].stale ? '' : undefined }
  })));

  // asked for a tab (a notification's tap: 保養所), as a tab's tap would (保養所's draft asks first)
  $effect(() => {
    const a = botsSheet.ask;
    if (a) untrack(() => pick(a.arg));
  });

  // open: the other tabs' dots read now and every 5 min (the shown page reads its own)
  $effect(() => {
    if (!open) return;
    const others = tabs.filter((k) => k !== tab);
    return untrack(() => watch(others));
  });

  function pick(id: BotId) {
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

{#snippet mark(id: BotId)}<StatusDot tone={dots[id].tone} look={dots[id].look} stale={dots[id].stale} />{/snippet}

<Sheet bind:this={sheet} bind:open tunes label={t('panel.bots')} variant="pop" onclose={closed} timed="bots">
  <div class="titlebar"><NavBar title={t('panel.bots')} onclose={() => (sheet ? sheet.guard(() => (open = false)) : (open = false))} sfx="self" /></div>
  <div class="bots-body" data-bots data-tab={tab} bind:this={body} id="bots-panel"
    role={tabs.length > 1 ? 'tabpanel' : undefined} aria-labelledby={tabs.length > 1 ? `bots-tab-${tab}` : undefined}>
    {#if tab === 'its'}
      <ItsPage bind:leave={itsLeave} />
    {:else if tab === 'kalori'}
      <KaloriPage />
    {:else}
      <GymPage />
    {/if}
  </div>
  {#if tabs.length > 1}
    <div class="tabs"><TabBar {items} {mark} value={tab} label={t('panel.bots')} attr="bots-tab" panel="bots-panel" onpick={pick} /></div>
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
