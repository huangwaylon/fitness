<script lang="ts">
  // A villager (style guide v2 §7): roster villagers (Goldie, Raymond, Bob...) or generic species
  // colourways, 5 expressions, emotes.
  // API: <Villager villager="raymond" expression size head emote label />
  //      <Villager person species colourway size label />   (older paths; species may be a roster id)
  // With only `person`, the person's prefs in the week view decide (villager → villagerSpecies /
  // villagerColor), falling back to A = Goldie, B = Raymond.
  import type { PersonId } from '#lib/types.ts';
  import VillagerArt from '#lib/villagers/VillagerArt.svelte';
  import type { EmoteKind, Expression, ShirtPattern } from '#lib/villagers/species.ts';
  import { resolveLook, type Look } from '#lib/villagers/roster.ts';
  import { week } from '#lib/client/week.svelte.ts';

  interface Props {
    person?: PersonId;
    /** Roster id (goldie, raymond, bob, bunnie, judy, stitches, hamlet, molly, lily, dom). */
    villager?: string | null;
    /** Species id (cat, dog, rabbit, bear, hamster, duck, frog, sheep) or a roster id. */
    species?: string | null;
    /** Colourway id within the species (generic looks only); alias: `color`. */
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
    /** Outfit overrides. */
    shirt?: string;
    pattern?: ShirtPattern;
    animate?: boolean;
    /** Bump to replay the hop / emote. */
    replay?: number;
    label?: string;
  }
  let {
    person = 'A', villager, species, colourway, color, expression = 'happy', size = 48, head,
    emote = false, emoteHold = false, shirt, pattern, animate = true, replay = 0, label
  }: Props = $props();

  const pref = $derived(
    week.view?.people?.[person] as { villager?: string | null; villagerSpecies?: string | null; villagerColor?: string | null } | undefined
  );
  const look = $derived.by<Look>(() => {
    const explicit = villager !== undefined || species !== undefined;
    const base = resolveLook({
      villager: explicit ? villager : pref?.villager,
      species: explicit ? species : pref?.villagerSpecies,
      colourway: colourway ?? color ?? (explicit ? null : pref?.villagerColor),
      person
    });
    return shirt || pattern ? { ...base, shirt: shirt ?? base.shirt, outfit: pattern ?? base.outfit } : base;
  });
  const sp = $derived(look.species.id);
  const px = $derived(typeof size === 'number' ? size : null);
  const headOnly = $derived(head ?? (px !== null && px < 56));
  // Full body frame leaves room above for tall ears and tufts; head frame is square.
  const vbH = $derived(headOnly ? (sp === 'rabbit' ? 92 : sp === 'duck' || sp === 'sheep' ? 86 : 82) : 134);
  const vb = $derived(
    headOnly
      ? sp === 'rabbit' ? '4 -16 92 92' : sp === 'duck' ? '7 -5 86 86' : sp === 'sheep' ? '7 0 86 86' : '9 1 82 82'
      : '0 -14 100 134'
  );
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
  <VillagerArt {look} {expression} {lw} {small} head={headOnly} {animate} {emote} {emoteHold} {replay} />
</svg>

<style>
  .villager { display: block; flex: none; overflow: visible; }
</style>
