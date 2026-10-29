<script lang="ts">
  // A villager (style guide v4 §M.1): the official NH render on a small CSS rig, with the generic
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
  import Silhouette from './Silhouette.svelte';
  import { villagerEmote, type EmoteIcon } from '#lib/art.ts';
  import type { EmoteKind, Expression } from '#lib/villagers/species.ts';
  import { resolveLook } from '#lib/villagers/roster.ts';
  import { villagerArt } from '#lib/art.ts';
  import { week } from '#lib/client/week.svelte.ts';
  import { actors, removeFx } from './motion/director.svelte.ts';
  import type { ActorId, Motion } from './motion/reactions.ts';

  interface Props {
    person?: PersonId;
    /** Roster id (goldie, raymond, bob, bunnie, judy, stitches, hamlet, molly, lily, dom). */
    villager?: string | null;
    /** cheer / surprised hop once; proud puffs up; sleepy breathes slowly. */
    expression?: Expression;
    /** Rendered height: px number or any CSS length (e.g. '24cqw'). */
    size?: number | string;
    /** Head icon instead of the full body. Default: auto (true when a numeric size is under 56). */
    head?: boolean;
    /** true = the expression's reaction, a v4 reaction icon id, a legacy kind; false = none. */
    emote?: boolean | EmoteIcon | EmoteKind;
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
  }
  let {
    person = 'A', villager, expression = 'happy', size = 48, head, emote = false,
    animate = true, eager = false, actor, side = 'left', emoteSize = '44px', shadow = false
  }: Props = $props();

  const pref = $derived(week.view?.people?.[person]?.villager);
  const look = $derived(resolveLook({ villager: villager !== undefined ? villager : pref, person }));
  const headOnly = $derived(head ?? (typeof size === 'number' && size < 56));
  const h = $derived(typeof size === 'number' ? `${size}px` : size);
  const key = $derived(villagerArt(look.id, headOnly));

  // Which way each render looks (as drawn), so "face in" turns toward the middle of the island.
  const LOOKS_RIGHT = new Set(['goldie', 'bunnie', 'judy', 'molly', 'dom']);
  // Asymmetric designs never mirror (Raymond's heterochromia would swap sides): they lean in instead.
  const NO_MIRROR = new Set(['raymond']);

  // Villagers show floating NH marks / colour glyphs, never the player's cat faces (A1, villagerEmote).
  const EXPR: Record<Expression, EmoteIcon | null> = { happy: null, cheer: 'glee', sleepy: 'mark-zzz', surprised: 'surprise', proud: 'mark-sparkle' };
  const LEGACY: Record<EmoteKind, EmoteIcon> = { note: 'mark-note', bang: 'surprise', zz: 'mark-zzz', sparkle: 'mark-sparkle', heart: 'love' };
  const propEmote = $derived<EmoteIcon | null>(
    emote === false ? null : emote === true ? (EXPR[expression] ?? 'mark-note') : ((LEGACY as Record<string, EmoteIcon>)[emote] ?? (emote as EmoteIcon))
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
  const inward = $derived(st?.face === 'in');
  const lean = $derived(inward && NO_MIRROR.has(look.id));
  const facing = $derived.by(() => {
    if (!inward || NO_MIRROR.has(look.id)) return 1;
    const wantRight = side === 'left';
    return wantRight === LOOKS_RIGHT.has(look.id) ? 1 : -1;
  });

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

<span class="villager" class:head={headOnly} class:right={side === 'right'} style:--h={h} style:--facing={facing}
  style:--in={side === 'left' ? 1 : -1} aria-hidden="true">
  {#if shadow && !headOnly}<span class="shadow" data-act={animate ? motion : null}></span>{/if}
  <span class="face" class:turning={motion === 'turn' && animate} class:lean>
    <span bind:this={bodyEl} class="body" class:bob={animate && !headOnly && !asleep && !walking} class:sleep={animate && asleep && !headOnly}
      class:walk={animate && walking}>
      <OfficialArt {key} size={h} {eager}>
        {#snippet fallback()}<Silhouette colour={look.colour} head={headOnly} height={h} />{/snippet}
      </OfficialArt>
    </span>
  </span>
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
  .face.lean { transform: translateX(calc(var(--in) * 4%)) rotate(calc(var(--in) * 6deg)); }
  .body { display: block; transform-origin: 50% 100%; }
  .body.bob { animation: if-bob var(--dur-bob, 2400ms) var(--ease-idle) infinite; animation-delay: var(--bob-delay, 0s); }
  .body.sleep { animation: if-breath-slow 4000ms var(--ease-idle) infinite; }
  .body.walk { animation: if-walkbounce 640ms linear infinite; }
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
