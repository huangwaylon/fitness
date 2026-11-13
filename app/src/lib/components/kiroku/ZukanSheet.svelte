<script lang="ts">
  // ずかん (docs/design.md "Zukan"): 設定's 図鑑 row opens it (設定 closing), full height, at once
  // (Sheet's `pop`). Its first screen: one row per kind with how many either of us has
  // found (ZukanCard); a row pushes that kind's page (Zukan.svelte) with ‹; on the rows ‹ goes back to 設定 (`onback`). ✕, the backdrop and Esc close it, and the
  // next opening starts on the rows. The guest's phone has it too (a shared museum, the guest's finds under its name).
  import Sheet from '../ui/Sheet.svelte';
  import NavBar from '../ui/NavBar.svelte';
  import ZukanCard from './ZukanCard.svelte';
  import Zukan from './Zukan.svelte';
  import Cast from './Cast.svelte';
  import type { ZukanKind } from './zukan.ts';
  import type { PersonId, Who } from '#lib/types.ts';
  import { findsView } from '#lib/model/finds.ts';
  import { tallyTotals } from '#lib/model/tally.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';

  /** `onback`: opened from 設定 (Hud): ‹ on the rows goes back there (this closes, 設定 reopens where it was). */
  let { open = $bindable(), onback = null }: { open: boolean; onback?: (() => void) | null } = $props();
  /** The kind whose page is open (null: the rows). */
  let kind = $state<ZukanKind | 'cast' | null>(null);

  const m = $derived(week.model);
  const view = $derived(week.view);
  const me = $derived<PersonId>(view?.me ?? 'A');
  const partner = $derived<PersonId>(view?.partner ?? 'B');
  // the three (each entry credited to who found it: the guest's under its own name): the guest's phone itself first,
  // a member's lists the guest once it has found or caught anything
  const guestFound = $derived(!!m && (m.state.finds.some((f) => f.person === 'G') || m.state.tallies.some((r) => r.person === 'G')));
  const order = $derived<Who[]>(view?.viewer === 'G' ? ['G', 'A', 'B'] : guestFound ? [me, partner, 'G'] : [me, partner]);
  const names = $derived<Record<Who, string>>({ A: view?.people.A.villagerName ?? 'A', B: view?.people.B.villagerName ?? 'B', G: view?.guest.villagerName ?? 'G' });
  const villagers = $derived<Record<Who, string | null>>({ A: view?.people.A.villager ?? null, B: view?.people.B.villager ?? null, G: view?.guest.villager ?? null });
  const finds = $derived(m ? findsView(m.state) : null);

  function back() {
    cue('back');
    const from = kind;
    kind = null;
    void Promise.resolve().then(() => document.querySelector<HTMLElement>(`[data-zukan="${from}"]`)?.focus({ preventScroll: true }));
  }

  /** ‹ on the rows (opened from 設定): back to it (its own open tune, this one's close). */
  function toSettings() {
    open = false;
    onback?.();
  }

  function closed() {
    if (toasts.current) toasts.dismiss();
    kind = null;
  }

</script>

<Sheet bind:open tunes label={t('title.zukan')} variant="pop" onclose={closed} timed="zukan">
  <div class="titlebar"><NavBar title={kind ? t(`zukan.kind.${kind}`) : t('title.zukan')} onback={kind ? back : onback ? toSettings : null} onclose={() => (open = false)} sfx="self" /></div>
  <div class="zs-body sheet-scroll" class:fill={kind !== null && kind !== 'cast'} data-zukan-sheet>
    {#if m && finds}
      {#key kind}
        <div class="lvl">
          {#if kind === 'cast'}
            <Cast />
          {:else if kind}
            <Zukan {kind} {finds} counts={tallyTotals(m.state.tallies)} {order} {names} {villagers} />
          {:else}
            <ZukanCard {finds} onopen={(k) => (kind = k)} oncast={() => (kind = 'cast')} />
          {/if}
        </div>
      {/key}
    {/if}
  </div>
</Sheet>

<style>
  /* The one scroller (as the panel's): it bleeds 8px past the side padding so focus rings and lips are not clipped. */
  .zs-body {
    margin: 0 -8px; padding: 6px 8px var(--body-pad); display: flex; flex-direction: column;
  }
  /* a kind's page pins its head and scrolls its own grid (to the bottom edge): the body holds still */
  .zs-body.fill { overflow: hidden; padding-bottom: 0; }
  /* each level slides in from the right (design.md "Navigation": one push motion, 240ms) */
  .lvl { display: grid; gap: 12px; animation: if-lvl var(--dur-sheet) var(--ease-out); }
  .fill .lvl { flex: 1; min-height: 0; display: flex; flex-direction: column; }
</style>
