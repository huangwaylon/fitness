<script lang="ts">
  // A villager (style guide v2 §7): shared chibi body + species head, 5 expressions, emotes.
  // New API: <Villager species colourway expression size head emote label />.
  // v0.4 API still works: <Villager person size label /> (species/colour then come from the
  // person's prefs in the week view, falling back to A = Bean the dog, B = Mochi the cat).
  import type { PersonId } from '#lib/types.ts';
  import VillagerArt from '#lib/villagers/VillagerArt.svelte';
  import {
    resolveVillager, SHIRT, SHIRT_PATTERN,
    type EmoteKind, type Expression, type ShirtPattern
  } from '#lib/villagers/species.ts';
  import { week } from '#lib/client/week.svelte.ts';

  interface Props {
    person?: PersonId;
    /** Species id (cat, dog, rabbit, bear, hamster, duck, frog, sheep). */
    species?: string | null;
    /** Colourway id within the species (e.g. 'biscuit'); alias: `color`. */
    colourway?: string | null;
    color?: string | null;
    expression?: Expression;
    /** Rendered height in px (or any CSS length). Head-only renders are square. */
    size?: number | string;
    /** Head-only avatar. Default: auto (true when a numeric size is under 56). */
    head?: boolean;
    /** true = the expression's emote, or a specific kind; false = none. */
    emote?: boolean | EmoteKind;
    emoteHold?: boolean;
    shirt?: string;
    pattern?: ShirtPattern;
    animate?: boolean;
    /** Bump to replay the hop / emote. */
    replay?: number;
    label?: string;
  }
  let {
    person = 'A', species, colourway, color, expression = 'happy', size = 48, head,
    emote = false, emoteHold = false, shirt, pattern, animate = true, replay = 0, label
  }: Props = $props();

  const pref = $derived(week.view?.people?.[person]);
  const v = $derived(
    resolveVillager(
      species !== undefined ? species : pref?.villagerSpecies,
      colourway ?? color ?? (species === undefined ? pref?.villagerColor : null),
      person
    )
  );
  const px = $derived(typeof size === 'number' ? size : null);
  const headOnly = $derived(head ?? (px !== null && px < 56));
  // Full body frame leaves room above for tall ears and tufts; head frame is square.
  const vb = $derived(
    headOnly
      ? v.species.id === 'rabbit' ? '4 -16 92 92' : v.species.id === 'duck' ? '8 -4 84 84' : '9 1 82 82'
      : '0 -14 100 134'
  );
  const vbH = $derived(headOnly ? (v.species.id === 'rabbit' ? 92 : v.species.id === 'duck' ? 84 : 82) : 134);
  // Keep the outline ≈ 1.1 px or more on screen however small we draw.
  const lw = $derived(px ? Math.max(2.6, (1.15 * vbH) / px) : 2.6);
  const small = $derived(px !== null && px < 34);
  const h = $derived(typeof size === 'number' ? `${size}px` : size);
  const w = $derived(headOnly ? h : typeof size === 'number' ? `${(size * 100) / 134}px` : `calc(${size} * 100 / 134)`);
</script>

<svg
  class="villager"
  viewBox={vb}
  style:width={w}
  style:height={h}
  role={label ? 'img' : undefined}
  aria-label={label}
  aria-hidden={label ? undefined : 'true'}
>
  <VillagerArt
    species={v.species}
    colourway={v.colourway}
    {expression}
    shirt={shirt ?? SHIRT[person]}
    pattern={pattern ?? SHIRT_PATTERN[person]}
    {lw}
    {small}
    head={headOnly}
    {animate}
    {emote}
    {emoteHold}
    {replay}
  />
</svg>

<style>
  .villager { display: block; flex: none; overflow: visible; }
</style>
