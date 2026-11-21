<script lang="ts">
  // A villager (design.md "Motion"): the official NH render on a small CSS rig, with the generic
  // silhouette as the fallback if the image is missing.
  //   <Villager villager="raymond" size={88} />            full body, `size` = figure height
  //   <Villager person="B" size={44} head />               head icon; villager from that person's prefs
  //   <Villager person="A" expression="cheer" emote />     hop once + an official reaction bubble
  // Rig: .face › .body (origin at the feet; idle bob OR one motion) › art. The emote bubble is a sibling of .face, so it
  // never squashes. (The island's villagers are the 3D island's: world3d/villagers.ts.)
  import type { Who } from '#lib/types.ts';
  import OfficialArt from './OfficialArt.svelte';
  import Emote from './Emote.svelte';
  import RosterSilhouette from './RosterSilhouette.svelte';
  import { villagerEmote, type EmoteIcon } from '#lib/art.ts';
  import type { Expression } from '#lib/villagers/species.ts';
  import { resolveLook } from '#lib/villagers/look.ts';
  import { villagerArt } from '#lib/art.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import type { Motion } from '../motion/reactions.ts';

  interface Props {
    /** Whose (`G`: the guest's, its look from the view's `guest`). */
    person?: Who;
    /** Roster id (villagers/roster.ts), e.g. goldie, raymond, anchovy. */
    villager?: string | null;
    /** cheer / surprised hop once; proud puffs up; sleepy breathes slowly. */
    expression?: Expression;
    /** Rendered height: px number or any CSS length (e.g. '24cqw'). */
    size?: number | string;
    /** Head icon instead of the full body. Default: auto (true when a numeric size is under 56). */
    head?: boolean;
    /** true = the expression's reaction, or an official reaction icon id; false = none. */
    emote?: boolean | EmoteIcon;
    /** Idle bob (full body) and motions. */
    animate?: boolean;
    eager?: boolean;
  }
  let {
    person = 'A', villager, expression = 'happy', size = 48, head, emote = false,
    animate = true, eager = false
  }: Props = $props();

  const pref = $derived(person === 'G' ? week.view?.guest?.villager : week.view?.people?.[person]?.villager);
  const look = $derived(resolveLook({ villager: villager !== undefined ? villager : pref, person }));
  const headOnly = $derived(head ?? (typeof size === 'number' && size < 56));
  const h = $derived(typeof size === 'number' ? `${size}px` : size);
  const key = $derived(villagerArt(look.id, headOnly));

  // Villagers show floating NH marks / colour glyphs, never the player's cat faces (villagerEmote).
  const EXPR: Record<Expression, EmoteIcon | null> = { happy: null, cheer: 'glee', sleepy: 'mark-zzz', surprised: 'surprise', proud: 'mark-sparkle' };
  const propEmote = $derived<EmoteIcon | null>(
    emote === false ? null : emote === true ? (EXPR[expression] ?? 'mark-note') : emote
  );
  const motion = $derived<Motion | null>(
    !animate ? null : expression === 'cheer' ? 'hop' : expression === 'surprised' ? 'surprise' : expression === 'proud' ? 'proud' : null
  );

  const shownEmote = $derived(propEmote ? villagerEmote(propEmote) : null);
  const asleep = $derived(expression === 'sleepy');

  // (re)play the motion: drop the attribute, reflow, set it again
  let bodyEl = $state<HTMLElement | null>(null);
  $effect(() => {
    const m = motion;
    if (!bodyEl) return;
    bodyEl.removeAttribute('data-act');
    if (m && animate) {
      void bodyEl.offsetWidth;
      bodyEl.setAttribute('data-act', m);
    }
  });
</script>

<span class="villager" class:head={headOnly} style:--h={h} aria-hidden="true">
  <span class="face">
    <span bind:this={bodyEl} class="body" class:bob={animate && !headOnly && !asleep} class:sleep={animate && asleep && !headOnly}>
      <OfficialArt {key} size={h} {eager}>
        {#snippet fallback()}<RosterSilhouette id={look.id} head={headOnly} height={h} />{/snippet}
      </OfficialArt>
    </span>
  </span>
  {#if shownEmote}
    <span class="emote">
      <Emote id={shownEmote} size={headOnly ? 'max(22px, calc(var(--h) * .5))' : '44px'} hold={expression === 'sleepy'} {animate} tail="right" bare />
    </span>
  {/if}
</span>

<style>
  .villager { position: relative; display: inline-block; flex: none; line-height: 0; vertical-align: bottom; }
  .face { display: block; transform-origin: 50% 100%; }
  .body { position: relative; display: block; transform-origin: 50% 100%; }
  .body.bob { animation: if-bob 2400ms var(--ease-idle) infinite; }
  .body.sleep { animation: if-breath-slow 4000ms var(--ease-idle) infinite; }
  /* (the expressions' motions: cheer, surprised, proud) */
  .body:global([data-act='hop']) { animation: if-hop 600ms var(--ease-soft) both; }
  .body:global([data-act='surprise']) { animation: if-surprise 420ms var(--ease-bounce) both; }
  .body:global([data-act='proud']) { animation: if-proud 900ms var(--ease-soft) both; }

  /* emote: centred just above the head, leaning toward the screen edge */
  .emote {
    position: absolute; z-index: 2; bottom: calc(100% + var(--h) * .02); left: 50%;
    transform: translateX(calc(-50% - var(--h) * .11)); pointer-events: none; line-height: 0;
  }
  .head .emote { left: 62%; bottom: 82%; transform: none; }
</style>
