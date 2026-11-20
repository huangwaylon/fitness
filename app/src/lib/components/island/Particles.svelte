<script lang="ts">
  // Seasonal particles (design.md "Particles and events"; ≤ 3 in the idle budget): cherry-blossom petals, autumn maple
  // leaves (2, 3 in festival week), snowflakes on a snow day (3): which and how many, for the 3D island to draw
  // (ambient3d.svelte.ts); summer nights get our fireflies over the grass in front of the camera where it settled
  // (mode="fireflies"), and on Toy Day (Dec 24) the same mode sets two presents beside the goal trees: the 3D island's
  // things, no DOM.
  import type { Season } from '#lib/ui-state/theme.svelte.ts';
  import type { Foliage } from '#lib/ui-state/season.ts';
  import { eventsAt, type Tod } from './scene.ts';
  import { minuteNow } from '#lib/time/clock.ts';
  import { scenePreview } from '#lib/ui-state/preview.svelte.ts';
  import { useWorld } from './camera.svelte.ts';
  import { thing, things3 } from '../world3d/things3.ts';
  import { ambient3 } from './ambient3d.svelte.ts';
  import { HOMES, onGrass, surfaceAt, type Pt } from '#lib/world/world.ts';
  import { site } from './site.svelte.ts';

  interface Props {
    season: Season;
    /** Petals only fall while the cherry blossoms are out, maple leaves once the oaks turn. */
    foliage?: Foliage;
    tod: Tod;
    /** The villagers sleep (their zzz loops count against the budget): one particle at most. */
    quiet?: boolean;
    /** Cherry-blossom / maple week: a few more. */
    festival?: boolean;
    mode?: 'fall' | 'fireflies';
    /** Snow is falling (a snow day: weatherNow.svelte.ts); without the weather (the gallery), every winter. */
    snowing?: boolean;
    /** Raining: no fireflies (NH: never in the rain). */
    raining?: boolean;
  }
  let { season, foliage = 'green', tod, quiet = false, festival = false, mode = 'fall', snowing = season === 'winter', raining = false }: Props = $props();

  const kind = $derived(
    // leaves and petals rest at night (idle budget); snow keeps falling
    foliage === 'blossom' && tod !== 'night' ? 'petal' : foliage === 'fall' && tod !== 'night' ? 'maple-leaf' : snowing ? 'snowflake' : null
  );
  const count = $derived(quiet ? (kind ? 1 : 0) : kind === 'petal' || kind === 'maple-leaf' ? (festival ? 3 : 2) : kind === 'snowflake' ? 3 : 0);
  const w = useWorld();
  // the 3D island draws the fall itself (ambient3d.svelte.ts)
  $effect(() => {
    if (mode !== 'fall' || !w.rest.three) return;
    ambient3.kind = kind;
    ambient3.count = count;
    return () => {
      ambient3.kind = null;
      ambient3.count = 0;
    };
  });
  /** The fireflies: over the grass a little in front of the camera's pivot when it settles (world x, dz from camZ,
   *  lift u), kept off the paths and the water; ≤ 3 (idle budget). */
  const FIREFLY_AT: readonly [number, number, number][] = [[60, -70, 34], [300, -40, 26], [128, 60, 40], [250, 110, 30], [40, 150, 36]];
  const FIREFLIES = $derived.by(() => {
    if (mode !== 'fireflies') return [];
    const z0 = w.rest.z;
    const out = FIREFLY_AT.map(([x, dz, lift]) => [x, Math.round(z0 + dz), lift] as const).filter(([x, z]) => onGrass(x, z) && surfaceAt(x, z) === 'grass').slice(0, 3);
    return quiet ? out.slice(0, 1) : out;
  });
  /** Toy Day's presents (NH's Dec 24), one on each side of the path, a step in front of each villager on its inner
   *  side, clear of the villagers and the goal trees' canopies and fruit rows (controls) at 390 and 320 wide. */
  const toyDay = $derived(mode === 'fireflies' && eventsAt(minuteNow(), scenePreview().event).toyDay);
  const TOYS: readonly Pt[] = $derived((void site.rev, [[HOMES.A[0] + 42, HOMES.A[1] - 34], [HOMES.B[0] - 42, HOMES.B[1] - 34]]));
  // the 3D island's things (no DOM of their own, R4 step 8): a firefly's glow (fx3d 'firefly', no model), a present
  $effect(() => {
    if (mode !== 'fireflies' || season !== 'summer' || tod !== 'night' || raining) return;
    const offs = FIREFLIES.map(([x, z, lift], i) => thing(w, { x, z, lift, h: 10, m3: { key: '', id: `firefly-${i}`, emit: { kind: 'firefly', every: 5200 } } })());
    return () => offs.forEach((off) => off());
  });
  $effect(() => {
    if (!toyDay) return;
    const offs = TOYS.map(([x, z], i) => thing(w, { x, z, h: 24, m3: { key: 'deco/present', id: `toy-${i}` } })());
    // (the e2e's: things3 probe 'toys', each present's spot and instance; Island3D's props().toys, box('toy'))
    const r = things3(w), rows = () => TOYS.map(([x, z], i) => ({ x, z, id3: `toy-${i}` }));
    r.probes.set('toys', rows);
    return () => (offs.forEach((off) => off()), r.probes.get('toys') === rows && r.probes.delete('toys'));
  });
</script>
