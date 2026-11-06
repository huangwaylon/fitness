<script lang="ts">
  // The wedding (docs/design.md "Wedding countdown"; wedding.ts): every June Sunday NH's wedding arch stands behind
  // centre stage (world.ts ARCH: a world node, framing Reese and Cyrus in the campsite's clearing seen from おく), and on our wedding day (the board's date: time/holidays.ts weddingDate) the villagers
  // greet the island in a wedding pose: they turn to each other, bow and glow with hearts, under a burst of confetti
  // (the confetti the first time the island opens that day on this phone). Fireworks at night: IslandScene's sky.
  // Reese and Cyrus are visitors (Visitor.svelte). Decoration only: no taps, no ベル.
  import { onMount } from 'svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { su } from './scene.ts';
  import { ARCH } from './world.ts';
  import { site } from './site.svelte.ts';
  import { useWorld } from './camera.svelte.ts';
  import { SCENE, firstOn } from '#lib/sync/storage.ts';
  import { actors, addFx, later, setEmote, setMotion } from '../motion/director.svelte.ts';
  import { cue } from '#lib/sound/cues.ts';

  let { arch, day, date }: { arch: boolean; day: boolean; date: string } = $props();
  /** The arch's height (u): NH's arch stands well over a villager (80u), so the couple stands under it. */
  const ARCH_U = 124;
  const w = useWorld();

  // the day itself: the wedding pose on opening, and the confetti once a day on this phone
  onMount(() => {
    if (!day) return;
    const first = firstOn(SCENE.wedding, date);
    const t = setTimeout(() => {
      for (const id of ['mine', 'partner'] as const) {
        actors[id].face = 'in';
        setMotion(id, 'bow');
        setEmote(id, 'love');
        addFx(id, 'hearts');
        if (first) addFx(id, 'confetti');
        later(id, 4200, () => (actors[id].face = 'home'));
      }
      cue(first ? 'harvest-receive' : 'emote-love');
    }, 1600);
    return () => clearTimeout(t);
  });
  /** The arch's spot (world.ts ARCH, on the island's layout: site.rev). */
  const arch3 = $derived((void site.rev, ARCH));
</script>

{#if arch}
  <span class="arch" data-arch aria-hidden="true" {@attach w.at({ x: arch3[0], z: arch3[1], h: ARCH_U, m3: { key: 'deco/wedding-arch' } })}><OfficialArt key="deco/wedding-arch" size={su(ARCH_U)} /></span>
{/if}

<style>
  /* a world node behind centre stage (its depth: behind the visitors and the cake, in front of the tent) */
  .arch { width: 0; height: 0; line-height: 0; pointer-events: none; }
  .arch > :global(*) { position: absolute; left: 0; top: 0; translate: -50% -96%; filter: var(--leaf-tint,) drop-shadow(0 2px 1.5px rgba(80, 60, 40, .3)); }
  .arch :global(.official) { max-width: none; }
</style>
