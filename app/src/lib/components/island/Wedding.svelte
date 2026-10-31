<script lang="ts">
  // The wedding (docs/design.md "Wedding countdown"; wedding.ts): every June Sunday NH's wedding arch stands behind the
  // centre stage (measured clear of every control, else not shown), and on our wedding day (2027-10-08) the villagers
  // greet the island in a wedding pose: they turn to each other, bow and glow with hearts, under a burst of confetti
  // (the confetti the first time the island opens that day on this phone). Fireworks at night: IslandScene's sky.
  // Reese and Cyrus are visitors (Visitor.svelte). Decoration only: no taps, no ベル.
  import { onMount } from 'svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { clearAt, guardsU, stageGeo } from './placement.ts';
  import { CENTRE_STAGE } from './scene.ts';
  import { localKV, readJson, SCENE, writeJson } from '#lib/sync/storage.ts';
  import { actors, addFx, later, setEmote, setMotion } from '../motion/director.svelte.ts';
  import { cue } from '#lib/sound/cues.ts';

  let { scene, arch, day, date }: { scene?: HTMLElement; arch: boolean; day: boolean; date: string } = $props();
  const U = (n: number) => `calc(${n.toFixed(1)} * var(--su))`;
  /** The arch: its height (u) and where it stands (its foot), just behind the centre stage. */
  const ARCH_U = 74, ARCH = { x: CENTRE_STAGE.x, y: CENTRE_STAGE.base - 6 };

  let archOk = $state(false);
  $effect(() => {
    if (!arch) return void (archOk = false);
    const measure = () => {
      const g = stageGeo(scene);
      if (!g) return;
      // a 113 × 119 render: about as wide as it's tall
      archOk = clearAt(guardsU(g, -5 * g.k), ARCH.x, ARCH.y - ARCH_U / 2, ARCH_U * 0.47, ARCH_U / 2);
    };
    const id = setTimeout(measure, 300);
    addEventListener('resize', measure);
    return () => (clearTimeout(id), removeEventListener('resize', measure));
  });

  // the day itself: the wedding pose on opening, and the confetti once a day on this phone
  onMount(() => {
    if (!day) return;
    const first = readJson<string>(localKV(), SCENE.wedding) !== date;
    if (first) writeJson(localKV(), SCENE.wedding, date);
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
</script>

{#if arch && archOk}
  <div class="wedding" aria-hidden="true">
    <span class="arch" data-arch style:translate="{U(ARCH.x)} {U(ARCH.y)}"><OfficialArt key="deco/wedding-arch" size={U(ARCH_U)} /></span>
  </div>
{/if}

<style>
  .wedding { position: absolute; inset: 0; pointer-events: none; --su: calc(100cqw / 390); }
  /* behind the centre stage: in front of the hedge and the rock, behind the trees, the visitors and everyone */
  .arch { position: absolute; left: 0; top: 0; width: 0; height: 0; z-index: 28; line-height: 0; }
  .arch > :global(*) { position: absolute; left: 0; top: 0; translate: -50% -96%; filter: drop-shadow(0 2px 1.5px rgba(80, 60, 40, .3)); }
  .arch :global(.official) { max-width: none; }
</style>
