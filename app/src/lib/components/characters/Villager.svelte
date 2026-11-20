<script lang="ts">
  // A villager (design.md "Motion"): the official NH render on a small CSS rig, with the generic
  // silhouette as the fallback if the image is missing.
  //   <Villager villager="raymond" size={88} />            full body, `size` = figure height
  //   <Villager person="B" size={44} head />               head icon; villager from that person's prefs
  //   <Villager person="A" expression="cheer" emote />     hop once + an official reaction bubble
  // Rig: .face › .body (origin at the feet; idle bob OR one motion) › art. The emote bubble is a sibling of .face, so it
  // never squashes. (The island's villagers are the 3D island's: world3d/villagers.ts.)
  import { TYPICAL_HEAD, loadHeads, swollenEye, type HeadBox } from '#lib/villagers/heads.ts';
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
    /** A hat on its head (world/birthday.ts: NH's birthday hat on a birthday), an art key. */
    hat?: string | null;
    /** Party nose glasses (Jack's trick on Halloween: the 3D island draws the island's, world3d/fxArt.ts). */
    tricked?: boolean;
    /** NH's swollen eye (a shaken tree's wasps' sting). */
    swollen?: boolean;
  }
  let {
    person = 'A', villager, expression = 'happy', size = 48, head, emote = false,
    animate = true, eager = false, tricked = false, swollen = false, hat = null
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

  // What sits on the head (the birthday hat, Jack's glasses, a sting's swollen eye) goes where this render's head and
  // eyes are (villagers/heads.ts, measured from the art), loaded the first time one is worn.
  let heads = $state.raw<Record<string, HeadBox> | null>(null);
  $effect(() => {
    if ((hat || tricked || swollen) && !headOnly && !heads) void loadHeads().then((t) => (heads = t), () => {});
  });
  const headBox = $derived(heads?.[look.id] ?? TYPICAL_HEAD);
  // the lump waits for the table (a typical face's eye could be a cheek on this one)
  const eye = $derived(swollen && heads ? swollenEye(headBox, look.looksRight) : null);

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
      {#if eye && !headOnly}<span class="swollen" data-swollen aria-hidden="true" style:left="{eye.x * 100}%" style:top="{eye.y * 100}%" style:width="{eye.w * 100}%"></span>{/if}
      {#if hat && !headOnly}<span class="hat" data-hat aria-hidden="true" style:left="{headBox[0] * 100}%" style:top="{headBox[1] * 100}%"><OfficialArt key={hat} size="calc(var(--h) * .24)" eager /></span>{/if}
      {#if tricked && !headOnly}
        <svg class="tricked" data-tricked viewBox="0 0 72 34" aria-hidden="true" style:left="{headBox[0] * 100}%" style:top="{headBox[2] * 100}%" style:width="{headBox[3] * 74}%">
          <path d="M28 12 Q36 7 44 12" fill="none" stroke="#2B2230" stroke-width="2.6" stroke-linecap="round" />
          <circle cx="18" cy="13" r="9.5" fill="rgba(255,255,255,.35)" stroke="#2B2230" stroke-width="3" />
          <circle cx="54" cy="13" r="9.5" fill="rgba(255,255,255,.35)" stroke="#2B2230" stroke-width="3" />
          <path d="M22 29 Q29 22 36 26 Q43 22 50 29 Q43 27 36 30 Q29 27 22 29 Z" fill="#3A2A22" />
          <ellipse cx="36" cy="21" rx="6.5" ry="7" fill="#FF9AA8" />
          <ellipse cx="34" cy="18.5" rx="2" ry="1.6" fill="#FFE1E6" />
        </svg>
      {/if}
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
  /* Jack's trick: party nose glasses (鼻めがね) over the face, popping on with a wobble */
  .tricked {
    position: absolute; translate: -50% -38%; height: auto; overflow: visible; /* the lenses' middle on the eyes' line */
    filter: drop-shadow(0 1px 1px rgb(40 20 30 / .3)); transform-origin: 50% 40%; animation: trick-on 520ms var(--ease-bounce) both;
  }
  @keyframes trick-on { from { transform: scale(.2) rotate(-20deg); opacity: 0; } 50% { opacity: 1; } }
  @keyframes puff-up { from { transform: scale(.2); opacity: 0; } 40% { opacity: 1; } }
  /* NH's sting: one eye swollen shut under a round pink lump, centred on the eye (villagers/heads.ts swollenEye) */
  .swollen {
    position: absolute; translate: -50% -42%; aspect-ratio: 1.1; border-radius: 50% 50% 46% 46%; /* a little onto the cheek */
    background: radial-gradient(circle at 36% 32%, #FFE3E6 0 14%, #FF9FAE 34%, #EE6F86 78%, #D95773);
    box-shadow: 0 1px 2px rgb(120 30 50 / .3); transform-origin: 50% 70%; animation: puff-up 420ms var(--ease-bounce) both;
  }
  /* NH's birthday hat: perched on the top of the head, a little tilted, popping on */
  .hat { position: absolute; translate: -50% -90%; rotate: -8deg; line-height: 0; animation: puff-up 420ms var(--ease-bounce) both; } /* its brim on the head's top */
  .hat :global(.official) { max-width: none; filter: drop-shadow(0 1px 1px rgba(80, 50, 40, .3)); }
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
