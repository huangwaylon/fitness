<script lang="ts">
  // The island panel, ごほうび: the HUD menu's 「ベル」 row → it slides down from the top (design.md "Panel"): the
  // wallets (each member's jar and balance, today's ベル, the rewards, the ベル ledger, the buys: Wallet). A day of the ledger
  // pushes a level with ‹ in the title bar (DayDetail; the wallet stays mounted under it, hidden, so ‹ finds it as it
  // was); ✕, the backdrop and Esc close it. 健康 is the HUD's dumbbell's popup (the goals under its charts), the
  // 図鑑 and 設定 the HUD menu's (HudMenu), and per-fruit detail lives in the tree popups (one home per datum).
  import { tick } from 'svelte';
  import type { PersonId } from '#lib/types.ts';
  import Sheet from '../ui/Sheet.svelte';
  import NavBar from '../ui/NavBar.svelte';
  import { dayTitle } from '../kiroku/fmt.ts';
  import Wallet from '../wallet/Wallet.svelte';
  import DayDetail from '../kiroku/DayDetail.svelte';
  import { dayDetail } from '#lib/model/history.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { mine } from '#lib/ui-state/viewer.ts';

  let { open = $bindable() }: { open: boolean } = $props();

  let body: HTMLElement | undefined = $state();
  /** The ledger's day open over the wallet (null: the wallet). */
  let date = $state<string | null>(null);
  /** Where the wallet was scrolled when the day opened (restored on ‹). */
  let savedY = 0;
  /** The wallet came back on ‹ (it slides in then; not on the panel's own opening). */
  let again = $state(false);

  const view = $derived(week.view);
  const m = $derived(week.model);
  /** This phone's person (the guest's own on the guest's phone). */
  const me = $derived(view ? mine(view) : null);
  const partner = $derived<PersonId>(view?.partner ?? 'B');
  const names = $derived({ A: view?.people.A.villagerName ?? 'A', B: view?.people.B.villagerName ?? 'B' } as Record<PersonId, string>);
  const villagers = $derived({ A: view?.people.A.villager ?? null, B: view?.people.B.villager ?? null } as Record<PersonId, string | null>);
  const day = $derived(m && date ? dayDetail(m.state, date, m.now) : null);

  async function openDay(d: string) {
    savedY = body?.scrollTop ?? 0;
    date = d;
    await tick();
    body?.scrollTo({ top: 0 });
  }
  /** ‹: back to the wallet, where it was scrolled to. */
  async function back() {
    cue('back');
    again = true;
    date = null;
    await tick();
    body?.scrollTo({ top: savedY });
  }

  /** The next open starts at the top of the wallet (the sheet unmounts its body). */
  function closed() {
    date = null;
    again = false;
  }

</script>

<Sheet bind:open tunes label={t('wallet.title')} variant="top" onclose={closed} timed="panel">
  <div class="titlebar"><NavBar title={date ? dayTitle(date) : t('wallet.title')} onback={date ? back : null} onclose={() => (open = false)} sfx="self" /></div>

  <div class="panel-body sheet-scroll" bind:this={body}>
    {#if view && me}
      <div class="lvl" class:again hidden={!!date}><Wallet onday={openDay} /></div>
      {#if day}
        <div class="lvl day"><DayDetail d={day} me={view.me} {partner} {names} {villagers} /></div>
      {/if}
    {/if}
  </div>
</Sheet>

<style>
  /* The one scroller. It bleeds 8px past the side padding so focus rings and lips are not clipped by its overflow. */
  .panel-body {
    margin: 0 -8px; padding: 6px 8px var(--body-pad); display: flex; flex-direction: column; gap: 14px;
  }
  .panel-body > :global(*) { flex: none; }
  /* each level slides in from the right (design.md "Navigation": one push motion, 240ms); the wallet again on ‹ (an
     animation restarts when its element comes back from display: none) */
  .day, .again { animation: if-lvl var(--dur-sheet) var(--ease-out); }
  .lvl[hidden] { display: none; }
  .day { display: grid; gap: 12px; }
  @media (prefers-reduced-motion: reduce) { .day, .again { animation: none; } }
</style>
