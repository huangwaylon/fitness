<script lang="ts">
  // ボット (docs/bots.md): the menu's ボット opens it (the guest's too, read-only: open.svelte.ts botTabs), full height like
  // 設定, at once (Sheet's `pop`). One title bar (ボット, ✕), one scroller with the shown tab's page, and the bottom
  // tabs (a tablist, registry.ts's bots left to right: ジム, 保養所, Jobs: English, as its page); with one bot only, no tabs. It opens on
  // the tab last shown in this app session (DEVICE.botsTab, sessionStorage: a swipe-closed app opens on ジム, the
  // leftmost; an update's reload keeps it), or the one asked (show(tab): a notification's tap opens 保養所). メニュー was a
  // tab till 2026-11-24: a kept or asked 'kalori' opens Jobs with Chain menus' row unfolded, a bot page's dot with
  // its row unfolded. Only the shown page is mounted (the three in this chunk): it reads and polls while
  // shown, and the other tab, ✕ or a close unmounts it. Each tab's dot (summary.svelte.ts, StatusDot; dimmed and
  // 「（古い）」 when stale): the other tabs read as the sheet opens, then every 5 min while it stays open (`watch`; none
  // while Jobs is shown: it reads all three). 保養所's unsaved draft: a tab switch asks first (its `leave`), ✕, Esc and
  // the backdrop too (Sheet's guard); its sticky 保存 bar sits at the scroller's foot, over the tabs.
  import { tick, untrack } from 'svelte';
  import Sheet from '../ui/Sheet.svelte';
  import NavBar from '../ui/NavBar.svelte';
  import TabBar from '../ui/TabBar.svelte';
  import ItsPage from './ItsPage.svelte';
  import GymPage from './GymPage.svelte';
  import JobsPage from './JobsPage.svelte';
  import StatusDot from './StatusDot.svelte';
  import { botTabs, botsSheet, type BotAsk } from './open.svelte.ts';
  import { BOTS, botMeta, type BotId } from './registry.ts';
  import { summaries, watch } from './summary.svelte.ts';
  import { shown, worst } from '#lib/bots/types.ts';
  import type { RowKey as JobsRow } from '#lib/jobs/status.ts';
  import { DEVICE, sessionKV } from '#lib/sync/storage.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { i18n, inLocale, t } from '#lib/i18n/index.ts';
  import '#lib/i18n/bots.ts';

  let { open = $bindable() }: { open: boolean } = $props();

  const kv = sessionKV();
  const tabs = $derived(botTabs());
  const kept = kv?.getItem(DEVICE.botsTab);
  let picked = $state<BotId>(kept === 'kalori' ? 'jobs' : BOTS.some((b) => b.id === kept) ? (kept as BotId) : 'gym');
  /** Jobs' row unfolded as it opens (メニュー asked: Chain menus'; a bot page's dot: its bot's row). */
  let jobsRow = $state<JobsRow | null>(kept === 'kalori' ? 'kalori-scrape' : null);
  /** The tab shown: the one picked, if this phone has it. */
  const tab = $derived(tabs.includes(picked) ? picked : (tabs[0] ?? 'gym'));
  /** 保養所's guard (its draft). */
  let itsLeave = $state<((run: () => void) => void) | undefined>();
  let sheet: ReturnType<typeof Sheet> | undefined = $state();
  let body: HTMLElement | undefined = $state();

  /** A tab's dot as drawn, and its name: 「ジム、順調」 (en 「Gym, healthy」), 「、要対応」 when a person must look,
   *  「（古い）」 when the dot is stale; Jobs' in English always (its page is: JobsPage). */
  function dotOf(id: BotId) {
    const s = id === 'jobs' ? jobsMark() : summaries[id];
    const d = shown(s);
    const lang = id === 'jobs' ? 'en' : i18n.locale;
    return inLocale(lang, () => {
      const raw = t(`bots.w.${d.w}`);
      const word = lang === 'en' ? raw.toLowerCase() : raw;
      let name = t('bots.say', { bot: t(botMeta(id).labelKey), word });
      if (d.look && d.w !== 'needsYou') name = t('bots.say', { bot: name, word: t('bots.attention') });
      return { ...d, stale: s.stale, name: s.stale ? name + t('bots.stale') : name };
    });
  }
  /** Jobs' dot as its verdict weighs it: its rows and the bots' (the other tabs' dots, those read; ITS unknown aside),
   *  the worst tone, 「!」 when any needs a person; the word the worst's (lib/jobs/status.ts verdictOf). */
  function jobsMark() {
    const j = summaries.jobs;
    const bots = tabs.filter((b) => b !== 'jobs').map((b) => summaries[b]).filter((m) => m.updatedAt !== null && m.tone !== 'unknown');
    const m = worst([j, ...bots])!;
    const w = m.tone === j.tone ? j.w : m.tone === 'bad' ? 'failing' : m.tone === 'warn' ? 'trouble' : j.w;
    return { ...j, tone: m.tone, needsLook: m.needsLook, w } as const;
  }
  const dots = $derived(Object.fromEntries(tabs.map((id) => [id, dotOf(id)])) as Record<BotId, ReturnType<typeof dotOf>>);
  const items = $derived(tabs.map((id) => ({
    id, label: t(botMeta(id).labelKey), icon: botMeta(id).icon, name: dots[id].name,
    attrs: { lang: id === 'jobs' ? 'en' : undefined, 'data-tab-status': dots[id].tone, 'data-look': dots[id].look ? '' : undefined, 'data-stale': dots[id].stale ? '' : undefined }
  })));

  // asked for a tab (a notification's tap: 保養所), as a tab's tap would (保養所's draft asks first)
  $effect(() => {
    const a = botsSheet.ask;
    if (a) untrack(() => pick(a.arg));
  });

  // open: the other tabs' dots read now and every 5 min (the shown page reads its own; Jobs reads all three)
  $effect(() => {
    if (!open) return;
    const others = tab === 'jobs' ? [] : tabs.filter((k) => k !== tab);
    return untrack(() => watch(others));
  });

  /** A tab: `row` unfolded in Jobs (a bot page's dot: its bot's row). */
  function pick(ask: BotAsk, row?: JobsRow) {
    const id: BotId = ask === 'kalori' ? 'jobs' : ask;
    if (ask === 'kalori') jobsRow = 'kalori-scrape';
    if (row) jobsRow = row;
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
</script>

<!-- (a dot only while a person must act: summary.svelte.ts dotShown; the tab's name still says the state) -->
{#snippet mark(id: BotId)}{#if dots[id].look}<StatusDot tone={dots[id].tone} look stale={dots[id].stale} />{/if}{/snippet}

<Sheet bind:this={sheet} bind:open tunes label={t('panel.bots')} variant="pop" timed="bots">
  <div class="titlebar"><NavBar title={t('panel.bots')} onclose={() => (sheet ? sheet.guard(() => (open = false)) : (open = false))} sfx="self" /></div>
  <div class="bots-body" data-bots data-tab={tab} bind:this={body} id="bots-panel"
    role={tabs.length > 1 ? 'tabpanel' : undefined} aria-labelledby={tabs.length > 1 ? `bots-tab-${tab}` : undefined}>
    {#if tab === 'its'}
      <ItsPage bind:leave={itsLeave} onjobs={tabs.includes('jobs') ? () => pick('jobs', 'svc-its') : undefined} />
    {:else if tab === 'jobs'}
      {#key jobsRow}<JobsPage openRow={jobsRow} onopen={(id) => pick(id)} />{/key}
    {:else}
      <GymPage viewOnly={week.guest} onjobs={tabs.includes('jobs') ? () => pick('jobs', 'svc-gym') : undefined} />
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
  /* a snackbar up: the last row can scroll clear of it */
  :global(dialog.toasting) .bots-body { --body-pad: 72px; }
  /* with no tabs, the home indicator's safe area under the last row (the pop's own --body-pad) */
  .bots-body:last-child { --body-pad: calc(var(--safe-bottom) + 18px + var(--kb, 0px)); }
  /* the tabs edge to edge, out of the sheet's side padding */
  .tabs { flex: none; margin: 0 calc(-1 * (var(--side) + var(--safe-right))) 0 calc(-1 * (var(--side) + var(--safe-left))); }
</style>
