<script lang="ts">
  // A birthday on the island (docs/design.md "Birthdays"; birthday.ts): confetti over both villagers the first time the
  // island opens that day on this phone, and a party popper going off over the birthday person's villager each time
  // they meet a goal that day (from the view, never on the first render). The hats are IslandScene's, the cake Cake.svelte,
  // しずえ's line the page's. No ベル.
  import { onMount, untrack } from 'svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import type { PersonId, WeekView } from '#lib/types.ts';
  import { RING_FRUITS } from '#lib/config/rules.ts';
  import { addFx, setEmote } from '../motion/director.svelte.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { firstConfetti } from './birthday.ts';
  import { sceneSfx } from './sceneTaps.ts';
  import { timers } from './timers.ts';
  import { VILLAGER, u } from './scene.ts';

  let { view, people, date }: { view: WeekView; people: PersonId[]; date: string } = $props();

  const side = (p: PersonId): 'mine' | 'partner' => (p === view.me ? 'mine' : 'partner');
  const { later, clear } = timers();
  onMount(() => {
    if (untrack(() => firstConfetti(date)))
      later(() => {
        for (const id of ['mine', 'partner'] as const) addFx(id, 'confetti');
        for (const p of untrack(() => people)) setEmote(side(p), 'glee');
        cue('harvest-receive');
      }, 1400);
    return clear;
  });

  // a party popper when the birthday person meets a goal
  let pops = $state<{ n: number; side: 'mine' | 'partner' }[]>([]);
  let seq = 0;
  let prev: Record<PersonId, number> | null = null;
  $effect(() => {
    const met = { A: 0, B: 0 } as Record<PersonId, number>;
    for (const p of ['A', 'B'] as const) met[p] = RING_FRUITS.filter((f) => view.people[p].rings[f].met).length;
    untrack(() => {
      const before = prev;
      prev = met;
      if (!before) return;
      for (const p of people) {
        if (met[p] <= before[p]) continue;
        const s = side(p), n = ++seq;
        pops = [...pops.slice(-1), { n, side: s }];
        addFx(s, 'confetti');
        sceneSfx('balloon');
        later(() => (pops = pops.filter((x) => x.n !== n)), 1600);
      }
    });
  });
</script>

{#each pops as p (p.n)}
  <span class="popper" class:right={p.side === 'partner'} data-popper style:left={u(p.side === 'mine' ? VILLAGER.x.A : VILLAGER.x.B)}
    style:top={u(VILLAGER.foot - VILLAGER.h * 1.05)} aria-hidden="true">
    <OfficialArt key="deco/party-popper" size={u(20)} eager />
  </span>
{/each}

<style>
  /* NH's party popper, popping up over the villager's head and going off */
  .popper { position: absolute; z-index: var(--z-taps); width: 0; height: 0; line-height: 0; pointer-events: none; }
  .popper :global(.official) { position: absolute; translate: -50% -50%; max-width: none; animation: pop 1.5s cubic-bezier(.3, 1.4, .5, 1) both; }
  .right :global(.official) { scale: -1 1; }
  @keyframes pop {
    0% { transform: translateY(10px) scale(.3) rotate(-20deg); opacity: 0; } 20% { transform: none; opacity: 1; }
    35% { transform: rotate(14deg) scale(1.1); } 80% { opacity: 1; } 100% { transform: translateY(-8px); opacity: 0; }
  }
</style>
