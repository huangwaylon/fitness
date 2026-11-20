<script lang="ts">
  // A birthday on the island (docs/design.md "Birthdays"; birthday.ts): confetti over both villagers the first time the
  // island opens that day on this phone, and a party popper going off over the birthday person's villager each time
  // they meet a goal that day (from the view, never on the first render: NH's popper over the villager's head as it
  // stands or walks, the 3D island's: fx3d `art`). No DOM of its own (R4 step 7). The hats are IslandScene's, the cake
  // cake.svelte.ts, しずえ's line the page's. No ベル.
  import { onMount, untrack } from 'svelte';
  import type { PersonId, WeekView } from '#lib/types.ts';
  import { RING_FRUITS } from '#lib/config/rules.ts';
  import { addFx, livePos, setEmote } from '../motion/director.svelte.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { firstConfetti } from '#lib/world/birthday.ts';
  import { sceneSfx } from './sceneTaps.ts';
  import { timers } from './timers.ts';
  import { VILLAGER } from './scene.ts';
  import { fx3d } from '#lib/world/fx3d.ts';

  let { view, people, date }: { view: WeekView; people: PersonId[]; date: string } = $props();

  const side = (p: PersonId): 'mine' | 'partner' => (p === view.me ? 'mine' : 'partner');
  /** Over the villager's head (u above its feet), wherever it stands or walks. */
  const LIFT = VILLAGER.h * 1.05;
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
        const s = side(p), [x, z] = livePos(s);
        addFx(s, 'confetti');
        sceneSfx('balloon');
        // (it follows the villager for its moment)
        fx3d('art', x, z, LIFT, { art: 'deco/party-popper', v: 'rise', size: 20, ms: 1500, follow: () => [...livePos(s), LIFT] as const });
      }
    });
  });
</script>
