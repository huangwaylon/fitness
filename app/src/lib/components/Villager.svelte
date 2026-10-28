<script lang="ts">
  // A villager (style guide v3 §A, §7): the official NH render (full body, or the round head icon),
  // with one lightweight fan-art silhouette as the fallback if the image is missing.
  //   <Villager villager="raymond" size={88} />            full body, `size` = figure height
  //   <Villager person="B" size={44} head />               head icon; villager from that person's prefs
  //   <Villager person="A" expression="cheer" emote />     hop once + ♪ emote above the head
  // `villager` (roster id) wins; else `person`'s prefs in the week view; else A = Goldie, B = Raymond.
  // Unknown ids fall back to that default.
  import type { PersonId } from '#lib/types.ts';
  import OfficialArt from './OfficialArt.svelte';
  import Emote from './Emote.svelte';
  import VillagerFallback from '#lib/villagers/VillagerFallback.svelte';
  import { EXPRESSION_EMOTE, type EmoteKind, type Expression } from '#lib/villagers/species.ts';
  import { resolveLook } from '#lib/villagers/roster.ts';
  import { villagerArt } from '#lib/client/assets.ts';
  import { week } from '#lib/client/week.svelte.ts';

  interface Props {
    person?: PersonId;
    /** Roster id (goldie, raymond, bob, bunnie, judy, stitches, hamlet, molly, lily, dom). */
    villager?: string | null;
    /** Older alias of `villager`. */
    species?: string | null;
    /** cheer / surprised hop once; the emote (if `emote`) follows the expression. */
    expression?: Expression;
    /** Rendered height: px number or any CSS length (e.g. '23cqw'). */
    size?: number | string;
    /** Head icon instead of the full body. Default: auto (true when a numeric size is under 56). */
    head?: boolean;
    /** true = the expression's emote, or a specific kind; false = none. */
    emote?: boolean | EmoteKind;
    emoteHold?: boolean;
    /** Idle bob (full body) and hops. Off under reduced motion regardless. */
    animate?: boolean;
    /** Bump to replay the hop / emote. */
    replay?: number;
    /** Accessible name; omit for decorative use next to a text label. */
    label?: string;
    /** false = always draw the fan-art fallback (gallery). */
    official?: boolean;
    /** Eager-load (above the fold). */
    eager?: boolean;
  }
  let {
    person = 'A', villager, species, expression = 'happy', size = 48, head, emote = false, emoteHold = false,
    animate = true, replay = 0, label, official = true, eager = false
  }: Props = $props();

  const pref = $derived(week.view?.people?.[person]?.villager);
  const look = $derived(
    villager !== undefined || species !== undefined
      ? resolveLook({ villager, species, person })
      : resolveLook({ villager: pref, person })
  );
  const headOnly = $derived(head ?? (typeof size === 'number' && size < 56));
  const h = $derived(typeof size === 'number' ? `${size}px` : size);
  const key = $derived(official ? villagerArt(look.id, headOnly) : null);
  const emoteKind = $derived<EmoteKind | null>(
    emote === false ? null : emote === true ? (EXPRESSION_EMOTE[expression] ?? 'note') : emote
  );
  const hop = $derived(animate && (expression === 'cheer' || expression === 'surprised'));
</script>

<span
  class="villager"
  class:head={headOnly}
  style:--h={h}
  role={label ? 'img' : undefined}
  aria-label={label}
  aria-hidden={label ? undefined : 'true'}
>
  {#key replay}
    <span class="fig" class:hop>
      <span class="body" class:bob={animate && !headOnly}>
        <OfficialArt {key} size={h} {eager}>
          {#snippet fallback()}<VillagerFallback {look} head={headOnly} height={h} />{/snippet}
        </OfficialArt>
      </span>
    </span>
    {#if emoteKind}
      <span class="emote"><Emote kind={emoteKind} size="100%" hold={emoteHold} animate={animate} /></span>
    {/if}
  {/key}
</span>

<style>
  .villager { position: relative; display: inline-block; flex: none; line-height: 0; vertical-align: bottom; }
  .fig, .body { display: block; transform-origin: 50% 100%; }
  .fig.hop { animation: if-hop 600ms var(--ease-soft) 1; }
  .body.bob { animation: if-bob var(--dur-bob, 2400ms) var(--ease-idle) infinite; animation-delay: var(--bob-delay, 0s); }
  .emote {
    position: absolute; z-index: 1; left: 52%; top: calc(var(--h) * -0.3);
    width: max(22px, calc(var(--h) * .38)); pointer-events: none;
  }
  .head .emote { left: 62%; top: calc(var(--h) * -0.42); width: max(20px, calc(var(--h) * .5)); }
  @media (prefers-reduced-motion: reduce) {
    .fig.hop, .body.bob { animation: none; }
  }
</style>
