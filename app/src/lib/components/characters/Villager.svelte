<script lang="ts">
  // A villager (design.md "Motion"): the official NH render on a small CSS rig, with the generic
  // silhouette as the fallback if the image is missing.
  //   <Villager villager="raymond" size={88} />            full body, `size` = figure height
  //   <Villager person="B" size={44} head />               head icon; villager from that person's prefs
  //   <Villager person="A" expression="cheer" emote />     hop once + an official reaction bubble
  //   <Villager person="A" actor="mine" side="left" />     driven by the stage director (island scene)
  // Rig: .face (scaleX = facing; `if-turn`) › .body (origin at the feet; idle bob OR one motion) › art.
  // The emote bubble and fx are siblings of .face, so they never squash or mirror.
  import type { PersonId } from '#lib/types.ts';
  import OfficialArt from './OfficialArt.svelte';
  import Emote from './Emote.svelte';
  import Fx from './Fx.svelte';
  import RosterSilhouette from './RosterSilhouette.svelte';
  import { villagerEmote, type EmoteIcon } from '#lib/art.ts';
  import type { Expression } from '#lib/villagers/species.ts';
  import { resolveLook } from '#lib/villagers/look.ts';
  import { villagerArt } from '#lib/art.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { actors, removeFx } from '../motion/director.svelte.ts';
  import type { ActorId, Motion } from '../motion/reactions.ts';
  import type { Tool } from '../motion/director.svelte.ts';

  interface Props {
    person?: PersonId;
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
    /** Idle bob (full body) and motions. Off under reduced motion regardless. */
    animate?: boolean;
    eager?: boolean;
    /** Island scene: render from the stage director's state for this actor. */
    actor?: ActorId;
    /** Which side of the screen the villager stands on (emote bubble and notes lean outward). */
    side?: 'left' | 'right';
    /** Emote bubble size (default 44px; 36px compact). */
    emoteSize?: string;
    /** Ground shadow under the feet (squashes with hops). */
    shadow?: boolean;
    /** Stung by a shaken tree's wasps (island/TreeShakes.svelte): NH's swollen eye, for a while. */
    puffy?: boolean;
    /** Tricked by Jack on Halloween (island/Visitor.svelte): NH's trick changes your look; here, party nose glasses. */
    tricked?: boolean;
  }
  let {
    person = 'A', villager, expression = 'happy', size = 48, head, emote = false,
    animate = true, eager = false, actor, side = 'left', emoteSize = '44px', shadow = false, puffy = false, tricked = false
  }: Props = $props();

  const pref = $derived(week.view?.people?.[person]?.villager);
  const look = $derived(resolveLook({ villager: villager !== undefined ? villager : pref, person }));
  const headOnly = $derived(head ?? (typeof size === 'number' && size < 56));
  const h = $derived(typeof size === 'number' ? `${size}px` : size);
  const key = $derived(villagerArt(look.id, headOnly));

  // Villagers show floating NH marks / colour glyphs, never the player's cat faces (villagerEmote).
  const EXPR: Record<Expression, EmoteIcon | null> = { happy: null, cheer: 'glee', sleepy: 'mark-zzz', surprised: 'surprise', proud: 'mark-sparkle' };
  const propEmote = $derived<EmoteIcon | null>(
    emote === false ? null : emote === true ? (EXPR[expression] ?? 'mark-note') : emote
  );
  const propMotion = $derived<Motion | null>(
    !animate ? null : expression === 'cheer' ? 'hop' : expression === 'surprised' ? 'surprise' : expression === 'proud' ? 'proud' : null
  );

  const st = $derived(actor ? actors[actor] : null);
  const motion = $derived(st ? st.motion : propMotion);
  const motionN = $derived(st ? st.motionN : 0);
  const rawEmote = $derived(st ? st.emote : propEmote);
  const shownEmote = $derived(rawEmote ? villagerEmote(rawEmote) : null);
  const emoteN = $derived(st ? st.emoteN : 0);
  const asleep = $derived(st ? st.asleep : expression === 'sleepy');
  const walking = $derived(st?.walking ?? false);
  // Facing: as drawn, toward the middle of the island ('in'), or left / right (a walk, a target); look.ts says which way
  // each render looks as drawn. A render that must never mirror (text on the outfit) leans that way instead.
  const wantRight = $derived.by<boolean | null>(() => {
    const f = st?.face ?? 'home';
    return f === 'l' ? false : f === 'r' ? true : f === 'in' ? side === 'left' : null;
  });
  const lean = $derived(wantRight !== null && look.noMirror && wantRight !== look.looksRight);
  const facing = $derived(wantRight === null || look.noMirror ? 1 : wantRight === look.looksRight ? 1 : -1);
  const tool = $derived(st?.tool ?? null);
  const holding = $derived(st?.holding ?? null);
  const TOOL_ART: Partial<Record<Tool, string>> = { can: 'finds/watering-can', shovel: 'finds/shovel' };

  // Replay the same motion back to back: drop the attribute, reflow, set it again.
  let bodyEl = $state<HTMLElement | null>(null);
  $effect(() => {
    const m = motion;
    void motionN;
    if (!bodyEl) return;
    bodyEl.removeAttribute('data-act');
    if (m && animate) {
      void bodyEl.offsetWidth;
      bodyEl.setAttribute('data-act', m);
    }
  });
  const dir = $derived<1 | -1>(side === 'left' ? -1 : 1);
</script>

<span class="villager" class:head={headOnly} class:right={side === 'right'} class:drawn-right={look.looksRight} style:--h={h}
  style:--facing={facing} style:--in={side === 'left' ? 1 : -1} style:--lean={wantRight ? 1 : -1} style:--step={st ? `${st.stepMs}ms` : null}
  aria-hidden="true">
  {#if shadow && !headOnly}<span class="shadow" data-act={animate ? motion : null}></span>{/if}
  <span class="face" class:turning={motion === 'turn' && animate} class:lean>
    <span bind:this={bodyEl} class="body" class:bob={animate && !headOnly && !asleep && !walking} class:sleep={animate && asleep && !headOnly}
      class:walk={animate && walking}>
      <OfficialArt {key} size={h} {eager}>
        {#snippet fallback()}<RosterSilhouette id={look.id} head={headOnly} height={h} />{/snippet}
      </OfficialArt>
      {#if puffy && !headOnly}<span class="puffy" data-puffy aria-hidden="true"></span>{/if}
      {#if tricked && !headOnly}
        <svg class="tricked" data-tricked viewBox="0 0 72 34" aria-hidden="true">
          <path d="M28 12 Q36 7 44 12" fill="none" stroke="#2B2230" stroke-width="2.6" stroke-linecap="round" />
          <circle cx="18" cy="13" r="9.5" fill="rgba(255,255,255,.35)" stroke="#2B2230" stroke-width="3" />
          <circle cx="54" cy="13" r="9.5" fill="rgba(255,255,255,.35)" stroke="#2B2230" stroke-width="3" />
          <path d="M22 29 Q29 22 36 26 Q43 22 50 29 Q43 27 36 30 Q29 27 22 29 Z" fill="#3A2A22" />
          <ellipse cx="36" cy="21" rx="6.5" ry="7" fill="#FF9AA8" />
          <ellipse cx="34" cy="18.5" rx="2" ry="1.6" fill="#FFE1E6" />
        </svg>
      {/if}
    </span>
    {#if tool && !headOnly}
      <!-- the tool in hand, on the side the render looks to (mirrors with the facing) -->
      {#key st?.toolN}
        <span class="tool {tool}" data-tool={tool}>
          {#if TOOL_ART[tool]}<OfficialArt key={TOOL_ART[tool]} size="calc(var(--h) * .3)" eager />
          {:else if tool === 'net'}
            <svg viewBox="-20 -20 40 40"><path class="handle" d="M6 6 L19 19" /><circle class="hoop" cx="-1" cy="-1" r="9.5" /><path class="mesh" d="M-10 -1 H8 M-1 -10 V8 M-7.5 -7.5 L5.5 5.5 M-7.5 5.5 L5.5 -7.5" /></svg>
          {:else}
            <svg viewBox="-4 -40 44 44"><path class="handle" d="M0 0 L30 -34" /><path class="reel" d="M5 -6 h4" /></svg>
          {/if}
        </span>
      {/key}
    {/if}
  </span>
  {#if holding && !headOnly}
    <!-- NH's hold-up: the catch or find lifted over the head while its plate reads (placement.ts keeps clear of it) -->
    {#key holding.n}
      <span class="held-up" data-holding={holding.art} data-guard><OfficialArt key={holding.art} size="calc(var(--h) * .36)" eager /></span>
    {/key}
  {/if}
  {#if shownEmote}
    <span class="emote">
      {#key emoteN}
        <Emote id={shownEmote} size={headOnly ? 'max(22px, calc(var(--h) * .5))' : emoteSize} hold={st ? st.emoteHold : expression === 'sleepy'}
          animate={animate} tail={side === 'left' ? 'right' : 'left'} bare />
      {/key}
    </span>
  {/if}
  {#if st && actor}
    {#each st.fx as f (f.n)}
      <span class="fxa {f.kind}"><Fx kind={f.kind} {dir} spread="calc(var(--h) * .55)" ondone={() => removeFx(actor, f.n)} /></span>
    {/each}
  {/if}
</span>

<style>
  .villager { position: relative; display: inline-block; flex: none; line-height: 0; vertical-align: bottom; }
  /* facing flips squash through scaleX(0) over 200ms; .lean tilts toward the middle instead */
  .face { display: block; transform-origin: 50% 100%; transform: scaleX(var(--facing, 1)); transition: transform 200ms var(--ease-soft); }
  .body { position: relative; display: block; transform-origin: 50% 100%; }
  /* NH's sting: one eye swollen shut under a round pink lump (on the face, over the eye on the left as drawn) */
  .puffy {
    position: absolute; left: 19%; top: 14%; width: 19%; aspect-ratio: 1.1; border-radius: 50% 50% 46% 46%;
    background: radial-gradient(circle at 36% 32%, #FFE3E6 0 14%, #FF9FAE 34%, #EE6F86 78%, #D95773);
    box-shadow: 0 1px 2px rgb(120 30 50 / .3); transform-origin: 50% 70%; animation: puff-up 420ms var(--ease-bounce) both;
  }
  /* Jack's trick: party nose glasses (鼻めがね) over the face, popping on with a wobble */
  .tricked {
    position: absolute; left: 14%; top: 11%; width: 72%; height: auto; overflow: visible;
    filter: drop-shadow(0 1px 1px rgb(40 20 30 / .3)); transform-origin: 50% 40%; animation: trick-on 520ms var(--ease-bounce) both;
  }
  @keyframes trick-on { from { transform: scale(.2) rotate(-20deg); opacity: 0; } 50% { opacity: 1; } }
  @keyframes puff-up { from { transform: scale(.2); opacity: 0; } 40% { opacity: 1; } }
  .body.bob { animation: if-bob 2400ms var(--ease-idle) infinite; animation-delay: var(--bob-delay, 0s); }
  .body.sleep { animation: if-breath-slow 4000ms var(--ease-idle) infinite; }
  .body.walk { animation: if-walkbounce var(--step, 640ms) linear infinite; }
  .face.lean { transform: translateX(calc(var(--lean) * 4%)) rotate(calc(var(--lean) * 6deg)); }

  /* a tool in hand: at the hip on the side the render looks to; each comes out with its own little swing */
  .tool { position: absolute; bottom: 18%; left: 2%; line-height: 0; transform-origin: 70% 90%; pointer-events: none; }
  .drawn-right .tool { left: auto; right: 2%; scale: -1 1; }
  .tool :global(.official) { max-width: none; }
  .tool svg { width: calc(var(--h) * .36); overflow: visible; }
  .tool.net svg { width: calc(var(--h) * .42); }
  .tool .hoop { fill: rgba(255, 255, 255, .25); stroke: #F4E9D2; stroke-width: 1.6; }
  .tool .mesh { stroke: rgba(255, 255, 255, .6); stroke-width: .5; fill: none; }
  .tool .handle { stroke: #B88A55; stroke-width: 2.2; stroke-linecap: round; fill: none; }
  .tool .reel { stroke: #6B5B4B; stroke-width: 3; stroke-linecap: round; }
  .tool.can { animation: tool-pour 900ms ease-out both; }
  .tool.shovel { animation: tool-dig 640ms cubic-bezier(.3, .6, .4, 1) both; }
  .tool.net { animation: tool-swing 420ms cubic-bezier(.3, .7, .4, 1) both; bottom: 30%; }
  .tool.rod { animation: tool-cast 520ms cubic-bezier(.3, .7, .4, 1) both; bottom: 30%; }
  @keyframes tool-pour { 0% { transform: translateY(10%) scale(.6); opacity: 0; } 18% { transform: none; opacity: 1; } 40%, 75% { transform: rotate(-28deg); } 100% { transform: rotate(-8deg); } }
  @keyframes tool-dig { 0% { transform: rotate(30deg) scale(.6); opacity: 0; } 15% { opacity: 1; } 40% { transform: rotate(-20deg); } 60% { transform: rotate(14deg); } 80% { transform: rotate(-10deg); } 100% { transform: none; } }
  @keyframes tool-swing { 0% { transform: rotate(60deg) scale(.7); opacity: 0; } 20% { opacity: 1; } 70% { transform: rotate(-30deg); } 100% { transform: rotate(-24deg); } }
  @keyframes tool-cast { 0% { transform: rotate(50deg); opacity: 0; } 20% { opacity: 1; } 55% { transform: rotate(-20deg); } 100% { transform: rotate(-6deg); } }
  /* the hold-up: up out of the hands to over the head, then a slow bob */
  .held-up {
    position: absolute; z-index: 2; left: 50%; bottom: 97%; line-height: 0; translate: -50% 0; pointer-events: none;
    animation: held-rise 520ms cubic-bezier(.3, .8, .4, 1.2) 120ms both, held-bob 1800ms ease-in-out 700ms infinite;
  }
  .held-up :global(.official) { max-width: none; filter: drop-shadow(0 2px 2px rgb(60 40 20 / .3)); }
  @keyframes held-rise { from { transform: translateY(60%) scale(.4); opacity: 0; } 50% { opacity: 1; } to { transform: none; opacity: 1; } }
  @keyframes held-bob { 0%, 100% { transform: none; } 50% { transform: translateY(-5%); } }
  .body:global([data-act='holdup']) { animation: if-holdup 1600ms var(--ease-soft) both; }
  .face.turning { animation: if-turn 1400ms var(--ease-soft) both; transition: none; }
  .face.turning .body { animation: if-turn-dip 1400ms linear both; }
  .body:global([data-act='squish']) { animation: if-squish 220ms var(--ease-bounce) both; }
  .body:global([data-act='hop']) { animation: if-hop 600ms var(--ease-soft) both; }
  .body:global([data-act='hop2']) { animation: if-hop2 900ms var(--ease-soft) both; }
  .body:global([data-act='wiggle']) { animation: if-wiggle 700ms ease-in-out both; }
  .body:global([data-act='nod']) { animation: if-nod 520ms ease-in-out both; }
  .body:global([data-act='laugh']) { animation: if-laugh 620ms ease-in-out both; }
  .body:global([data-act='surprise']) { animation: if-surprise 420ms var(--ease-bounce) both; }
  .body:global([data-act='shy']) { animation: if-shy 1000ms var(--ease-soft) both; }
  .body:global([data-act='stretch']) { animation: if-stretch 1400ms var(--ease-soft) both; }
  .body:global([data-act='proud']) { animation: if-proud 900ms var(--ease-soft) both; }
  .body:global([data-act='dance']) { animation: if-dance 1600ms ease-in-out both; }
  .body:global([data-act='hum']) { animation: if-bob 1200ms var(--ease-idle) 2 both; }
  .body:global([data-act='bow']) { animation: if-bow 1100ms var(--ease-soft) both; }
  .body:global([data-act='headshake']) { animation: if-headshake 600ms ease-in-out both; }
  .body:global([data-act='warmup']) { animation: if-warmup 2000ms ease-in-out both; }
  .body:global([data-act='sidebend']) { animation: if-sidebend 2000ms ease-in-out both; }
  .body:global([data-act='leap']) { animation: if-leap 2000ms ease-in-out both; }

  /* ground shadow: shrinks while the body is in the air */
  .shadow {
    position: absolute; left: 50%; bottom: calc(var(--h) * -0.035); width: calc(var(--h) * .42); height: calc(var(--h) * .1);
    margin-left: calc(var(--h) * -0.21); border-radius: 50%; background: var(--sh-ground);
    transform: scaleX(var(--sh-scale, 1));
  }
  .shadow:global([data-act='hop']) { animation: sh-hop 600ms var(--ease-soft) both; }
  .shadow:global([data-act='hop2']) { animation: sh-hop2 900ms var(--ease-soft) both; }
  .shadow:global([data-act='surprise']) { animation: sh-hop 420ms var(--ease-bounce) both; }
  @keyframes sh-hop { 0%, 100% { transform: scaleX(var(--sh-scale, 1)); } 40% { transform: scale(.8); } }
  @keyframes sh-hop2 { 0%, 45%, 85%, 100% { transform: scaleX(var(--sh-scale, 1)); } 25% { transform: scale(.8); } 65% { transform: scale(.88); } }

  /* emote: centred just above the head, leaning toward the screen edge */
  .emote {
    position: absolute; z-index: 2; bottom: calc(100% + var(--h) * .02); left: 50%;
    transform: translateX(calc(-50% - var(--h) * .11)); pointer-events: none; line-height: 0;
  }
  .right .emote { transform: translateX(calc(-50% + var(--h) * .11)); }
  .head .emote { left: 62%; bottom: 82%; transform: none; }

  .fxa { position: absolute; left: 50%; top: 4%; width: 0; height: 0; }
  .fxa.sweat { left: 68%; top: 22%; }
  .right .fxa.sweat { left: 32%; }
  .fxa.puff { top: 100%; }
  .fxa.zzz { left: 34%; top: 6%; }
  .right .fxa.zzz { left: 66%; }
  .fxa.notes { left: 30%; top: 8%; }
  .right .fxa.notes { left: 70%; }
  .fxa.confetti { top: 0; }

  @media (prefers-reduced-motion: reduce) {
    .body.bob, .body.sleep, .body.walk, .face.turning, .face.turning .body, .body:global([data-act]), .shadow:global([data-act]) { animation: none; }
  }
</style>
