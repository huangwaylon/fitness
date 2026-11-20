<script lang="ts">
  // The wedding (docs/design.md "Wedding countdown"; wedding.ts): every June Sunday NH's wedding arch stands behind
  // centre stage (world.ts ARCH: a things3 thing, no DOM on the island, R4 step 7; framing Reese and Cyrus in the campsite's clearing seen from おく), and on our wedding day (the board's date: time/holidays.ts weddingDate) the villagers
  // greet the island in a wedding pose: they turn to each other, bow and glow with hearts, under a burst of confetti
  // (the confetti the first time the island opens that day on this phone). Fireworks at night: IslandScene's sky.
  // Reese and Cyrus are visitors (visitor.svelte.ts). Decoration only: no taps, no ベル.
  import { onMount, untrack } from 'svelte';
  import { ARCH } from '#lib/world/world.ts';
  import { site } from './site.svelte.ts';
  import { useWorld } from './camera.svelte.ts';
  import { thing, things3 } from '../world3d/things3.ts';
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
  // the arch behind centre stage (its depth: behind the visitors and the cake, in front of the tent), and the e2e's row
  // (things3 probe 'arch': its spot and height, Island3D's props().arch)
  $effect(() => {
    if (!arch) return;
    const [x, z] = arch3, r = things3(w), row = () => ({ x, z, h: ARCH_U, id3: 'arch' });
    r.probes.set('arch', row);
    const off = untrack(() => thing(w, { x, z, h: ARCH_U, m3: { key: 'deco/wedding-arch', id: 'arch' } })());
    return () => (off(), void (r.probes.get('arch') === row && r.probes.delete('arch')));
  });
</script>
