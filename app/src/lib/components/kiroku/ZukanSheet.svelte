<script lang="ts">
  // ずかん (docs/design.md "Zukan"): the HUD's menu's ずかん button opens it, full height, grown out of the button
  // (Sheet's `pop`, as けんこう out of the dumbbell). Its first screen: one row per kind with how many either of us has
  // found (ZukanCard); a row pushes that kind's page (Zukan.svelte) with ‹. ✕, the backdrop and Esc close it, and the
  // next opening starts on the rows. The guest's phone has it too (a shared museum, the guest's finds under its name).
  import Sheet from '../ui/Sheet.svelte';
  import NavBar from '../ui/NavBar.svelte';
  import ZukanCard from './ZukanCard.svelte';
  import Zukan from './Zukan.svelte';
  import type { ZukanKind } from './zukan.ts';
  import type { PersonId, Who } from '#lib/types.ts';
  import { findsView } from '#lib/model/finds.ts';
  import { tallyTotals } from '#lib/model/tally.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';

  let { open = $bindable() }: { open: boolean } = $props();
  /** The kind whose page is open (null: the rows). */
  let kind = $state<ZukanKind | null>(null);

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

  function closed() {
    if (toasts.current) toasts.dismiss();
    kind = null;
  }

  // Its open and close tunes (it mounts on the first tap, already open: that is an open too).
  let wasOpen = false;
  $effect(() => {
    const o = open;
    if (o === wasOpen) return;
    wasOpen = o;
    cue(o ? 'panel-open' : 'panel-close');
  });
</script>

<Sheet bind:open label={t('zukan.title')} variant="pop" onclose={closed}>
  <div class="titlebar"><NavBar title={t('zukan.title')} onback={kind ? back : null} onclose={() => (open = false)} sfx="self" /></div>
  <div class="zs-body" class:fill={kind !== null} data-zukan-sheet>
    {#if m && finds}
      {#key kind}
        <div class="lvl">
          {#if kind}
            <Zukan {kind} {finds} counts={tallyTotals(m.state.tallies)} {order} {names} {villagers} />
          {:else}
            <ZukanCard {finds} onopen={(k) => (kind = k)} />
          {/if}
        </div>
      {/key}
    {/if}
  </div>
</Sheet>

<style>
  .titlebar { flex: none; position: relative; z-index: 2; margin-bottom: 4px; }
  /* rows scrolling up fade out under the title bar instead of being cut at a hard edge */
  .titlebar::after {
    content: ''; position: absolute; left: -8px; right: -8px; top: 100%; height: 14px; pointer-events: none;
    background: linear-gradient(var(--surface), transparent);
  }
  /* The one scroller (as the panel's): it bleeds 8px past the side padding so focus rings and lips are not clipped. */
  .zs-body {
    flex: 1; min-height: 0; overflow: hidden auto; overscroll-behavior: contain;
    margin: 0 -8px; padding: 6px 8px var(--body-pad); display: flex; flex-direction: column;
  }
  /* a kind's page pins its head and scrolls its own grid (to the bottom edge): the body holds still */
  .zs-body.fill { overflow: hidden; padding-bottom: 0; }
  /* each level slides in from the right (design.md "Navigation": one push motion, 240ms) */
  .lvl { display: grid; gap: 12px; animation: lvl 240ms cubic-bezier(.2, .8, .2, 1); }
  .fill .lvl { flex: 1; min-height: 0; display: flex; flex-direction: column; }
  @keyframes lvl { from { opacity: 0; transform: translateX(24%); } to { opacity: 1; transform: none; } }
</style>
