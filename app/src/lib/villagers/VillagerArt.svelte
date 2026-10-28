<svelte:options namespace="svg" />

<script lang="ts">
  // Draws one villager as an SVG <g> in the shared chibi frame (style guide v2 §7.1):
  // viewBox 0 0 100 120, ground line y 116, head ellipse cx 50 cy 40. Embed inside any <svg>
  // (Villager.svelte wraps it; IslandScene places it directly in the scene).
  import type { Colourway, EmoteKind, Expression, EyeVariant, MouthVariant, ShirtPattern, Species } from './species.ts';
  import { EXPRESSION_EMOTE } from './species.ts';
  import EmoteArt from './EmoteArt.svelte';

  interface Props {
    species: Species;
    colourway: Colourway;
    expression?: Expression;
    /** Shirt fill (default partner colour). */
    shirt?: string;
    pattern?: ShirtPattern;
    /** Outline width in viewBox units (thicken for tiny renders). */
    lw?: number;
    /** Simplified detail for tiny renders (no whiskers / patterns). */
    small?: boolean;
    /** Only draw the head (for avatars). */
    head?: boolean;
    /** Idle bob + hops. */
    animate?: boolean;
    /** true = the expression's emote; a kind = that emote; false = none. */
    emote?: boolean | EmoteKind;
    /** Keep the emote up after it pops (default: rise and fade). */
    emoteHold?: boolean;
    /** Bump to replay the hop / emote (e.g. on tap). */
    replay?: number;
  }
  let {
    species,
    colourway: cw,
    expression = 'happy',
    shirt = '#FFB38A',
    pattern = 'plain',
    lw = 2.6,
    small = false,
    head: headOnly = false,
    animate = true,
    emote = false,
    emoteHold = false,
    replay = 0
  }: Props = $props();

  const uid = $props.id();
  const LINE = '#4A3A2C';
  const EYE = '#3A2C20';
  const MOUTH = '#8A3B2E';
  const TONGUE = '#FF8A7A';
  const BLUSH = '#FF9E8F';
  const PINK = '#F28BA8';

  const sp = $derived(species.id);
  const fs = $derived(Math.min(1.6, lw / 2.6)); // face stroke scale
  const eyeCol = $derived(cw.eye ?? EYE);
  const H = $derived(species.head);
  const eyeY = $derived(species.eyeY);
  const eyeDX = $derived(sp === 'frog' ? 18 : sp === 'hamster' ? 15 : 14);
  const eyeK = $derived(small ? 1.18 : 1);

  const eyes = $derived<EyeVariant>(
    expression === 'cheer' ? 'happy'
    : expression === 'sleepy' ? 'sleepy'
    : expression === 'surprised' ? 'wide'
    : expression === 'proud' ? 'smug'
    : species.defaultEyes
  );
  const mouth = $derived<MouthVariant>(
    expression === 'cheer' ? 'open'
    : expression === 'sleepy' ? 'flat'
    : expression === 'surprised' ? 'o'
    : species.defaultMouth
  );
  const mouthY = $derived(
    sp === 'frog' ? 47 : sp === 'cat' ? 57 : sp === 'rabbit' || sp === 'hamster' ? 57.5 : sp === 'sheep' ? 57 : 59.5
  );
  const blush = $derived(
    sp === 'frog' ? { x: 23, y: 45, rx: 8, ry: 4.5 }
    : sp === 'hamster' ? { x: 25, y: 54, rx: 8, ry: 4.6 }
    : sp === 'sheep' ? { x: 32, y: 55, rx: 5.5, ry: 3.4 }
    : { x: 27, y: 54, rx: 6.5, ry: 4 }
  );
  const emoteKind = $derived<EmoteKind | null>(
    emote === true ? EXPRESSION_EMOTE[expression] : emote === false ? null : emote
  );

  // Arm polylines (left side; right is mirrored). Shoulder at (31, 74).
  const arm = $derived(
    expression === 'cheer' ? 'M31 74 L18.5 63.5'
    : expression === 'surprised' ? 'M31 74 L21 84'
    : expression === 'proud' ? 'M31 74 L22 82 L29.5 90'
    : expression === 'sleepy' ? 'M31 74 L28.5 88'
    : 'M31 74 L26.7 87.3'
  );
  const hand = $derived(
    (arm.match(/(-?[\d.]+) (-?[\d.]+)$/) ?? ['', '26.7', '87.3']).slice(1, 3).map(Number) as [number, number]
  );
  const hop = $derived(expression === 'cheer' ? 'hop' : expression === 'surprised' ? 'hop small' : '');
  const legs = 'M42.5 104 V110.5 M57.5 104 V110.5';
  const torso = 'M38 68 H62 Q67 68 67.6 73 L71.6 98 Q72.6 106 64.5 106 H35.5 Q27.4 106 28.4 98 L32.4 73 Q33 68 38 68 Z';
  const coat = $derived(sp === 'sheep' ? cw.light : cw.base);
  const limb = $derived(sp === 'sheep' ? cw.light : sp === 'duck' ? '#F5A341' : cw.shade);

  // Sheep wool ring: 11 puffs around the face.
  const wool = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    return { x: 50 + Math.cos(a) * 29, y: 42 + Math.sin(a) * 26, r: i === 0 ? 11 : 10 };
  });
</script>

{#snippet eye(cx: number, cy: number)}
  <g transform="translate({cx} {cy}) scale({eyeK})">
    {#if eyes === 'oval'}
      <ellipse rx="4.5" ry="5.8" fill={eyeCol} />
      <circle cx="1.4" cy="-2.2" r={small ? 1.8 : 1.6} fill="#fff" />
    {:else if eyes === 'dot'}
      <circle r="3.9" fill={eyeCol} />
      {#if !small}<circle cx="1" cy="-1.1" r=".9" fill="#fff" opacity=".85" />{/if}
    {:else if eyes === 'happy'}
      <path d="M-4.6 1.8 Q0 -5.4 4.6 1.8" fill="none" stroke={eyeCol} stroke-width={3 * fs} stroke-linecap="round" />
    {:else if eyes === 'sleepy'}
      <path d="M-4.6 -.6 Q0 3.8 4.6 -.6" fill="none" stroke={eyeCol} stroke-width={3 * fs} stroke-linecap="round" />
    {:else if eyes === 'wide'}
      <circle r="5.4" fill={eyeCol} />
      <circle cx="1.7" cy="-1.9" r="2" fill="#fff" />
      <circle cx="-1.8" cy="2" r=".9" fill="#fff" />
    {:else if eyes === 'smug'}
      <path d="M-4.2 -1 A4.2 5.3 0 0 0 4.2 -1 Z" fill={eyeCol} />
      <path d="M-5.6 -1.6 L5.2 -1.1" stroke={LINE} stroke-width={2.4 * fs} stroke-linecap="round" />
      {#if !small}<circle cx="1.4" cy="1" r="1" fill="#fff" />{/if}
    {:else}
      <ellipse rx="4.3" ry="5.4" fill={eyeCol} />
      <path d="M1.3 -4.2 L1.9 -2.4 L3.7 -1.8 L1.9 -1.2 L1.3 .6 L.7 -1.2 L-1.1 -1.8 L.7 -2.4 Z" fill="#FFF1B8" />
      <circle cx="-1.6" cy="2.2" r=".8" fill="#fff" />
    {/if}
  </g>
{/snippet}

{#snippet face()}
  <!-- blush -->
  <ellipse cx={blush.x} cy={blush.y} rx={blush.rx} ry={blush.ry} fill={BLUSH} opacity=".7" />
  <ellipse cx={100 - blush.x} cy={blush.y} rx={blush.rx} ry={blush.ry} fill={BLUSH} opacity=".7" />
  <!-- eyes -->
  {@render eye(50 - eyeDX, eyeY)}
  {@render eye(50 + eyeDX, eyeY)}
  {#if expression === 'surprised'}
    <g fill="none" stroke={LINE} stroke-width={2.2 * fs} stroke-linecap="round">
      <path d="M{50 - eyeDX - 4} {eyeY - 10} Q{50 - eyeDX} {eyeY - 13} {50 - eyeDX + 4} {eyeY - 10.5}" />
      <path d="M{50 + eyeDX - 4} {eyeY - 10.5} Q{50 + eyeDX} {eyeY - 13} {50 + eyeDX + 4} {eyeY - 10}" />
    </g>
  {/if}
  <!-- nose -->
  {#if sp === 'cat'}
    <path d="M47.3 50.6 H52.7 L50 53.6 Z" fill={PINK} stroke={LINE} stroke-width={1.2 * fs} stroke-linejoin="round" />
    {#if !small}
      <g stroke={LINE} stroke-width={1.6 * fs} stroke-linecap="round" opacity=".5">
        <path d="M13 50 L22 52 M13.5 57 L22 55.5 M87 50 L78 52 M86.5 57 L78 55.5" />
      </g>
    {/if}
  {:else if sp === 'dog'}
    <ellipse cx="50" cy="51" rx="5.2" ry="3.7" fill={EYE} />
    <ellipse cx="48.6" cy="49.9" rx="1.7" ry="1" fill="#fff" opacity=".8" />
  {:else if sp === 'bear'}
    <path d="M45 50 Q50 48 55 50 Q54 54.6 50 55.4 Q46 54.6 45 50 Z" fill={EYE} />
    <ellipse cx="48.6" cy="50.3" rx="1.5" ry=".8" fill="#fff" opacity=".7" />
  {:else if sp === 'rabbit'}
    <ellipse cx="50" cy="51.6" rx="2.6" ry="1.9" fill={PINK} stroke={LINE} stroke-width={1 * fs} />
    <path d="M50 53.5 V55.8" stroke={LINE} stroke-width={1.6 * fs} stroke-linecap="round" />
  {:else if sp === 'hamster'}
    <ellipse cx="50" cy="51.4" rx="2.6" ry="2" fill={PINK} stroke={LINE} stroke-width={1 * fs} />
  {:else if sp === 'sheep'}
    <path d="M47.5 51 Q50 53 52.5 51" fill="none" stroke={cw.eye ? '#FFF1DE' : LINE} stroke-width={1.8 * fs} stroke-linecap="round" opacity=".7" />
  {:else if sp === 'frog'}
    <circle cx="46.5" cy="39" r="1.2" fill={LINE} opacity=".7" /><circle cx="53.5" cy="39" r="1.2" fill={LINE} opacity=".7" />
  {/if}
  <!-- mouth -->
  {#if sp === 'duck'}
    {@render bill()}
  {:else if sp === 'frog'}
    {#if mouth === 'open'}
      <path d="M36 45 H64 Q63 57 50 57.5 Q37 57 36 45 Z" fill={MOUTH} stroke={LINE} stroke-width={1.6 * fs} stroke-linejoin="round" />
      <path d="M43 53.6 Q50 49 57 53.6 Q50 57 43 53.6 Z" fill={TONGUE} />
    {:else if mouth === 'o'}
      <ellipse cx="50" cy="49" rx="3.2" ry="3.8" fill={MOUTH} />
    {:else if mouth === 'flat'}
      <path d="M41 48 H59" stroke={LINE} stroke-width={2.4 * fs} stroke-linecap="round" />
    {:else}
      <path d="M33 45.5 Q50 57 67 45.5" fill="none" stroke={LINE} stroke-width={2.4 * fs} stroke-linecap="round" />
    {/if}
  {:else}
    {@render mouthArt(mouthY, cw.eye ? '#FFF1DE' : LINE)}
  {/if}
{/snippet}

{#snippet mouthArt(my: number, ink: string)}
  {#if mouth === 'open'}
    <path d="M44.6 {my - 1} H55.4 Q55.4 {my + 7} 50 {my + 7} Q44.6 {my + 7} 44.6 {my - 1} Z" fill={MOUTH} stroke={LINE} stroke-width={1.5 * fs} stroke-linejoin="round" />
    <path d="M46.6 {my + 5.2} Q50 {my + 2.4} 53.4 {my + 5.2} Q50 {my + 7.2} 46.6 {my + 5.2} Z" fill={TONGUE} />
    {#if sp === 'rabbit' || sp === 'hamster'}
      <rect x="47.3" y={my - 0.6} width="5.4" height="2.8" rx=".8" fill="#fff" />
      <path d="M50 {my - 0.4} V{my + 2}" stroke={LINE} stroke-width=".6" opacity=".5" />
    {/if}
  {:else if mouth === 'o'}
    <ellipse cx="50" cy={my + 1.5} rx="2.6" ry="3.2" fill={MOUTH} />
  {:else if mouth === 'flat'}
    <path d="M47 {my + 1} H53" stroke={ink} stroke-width={2.3 * fs} stroke-linecap="round" />
  {:else if mouth === 'cat'}
    <path d="M44.2 {my} Q47.1 {my + 3.6} 50 {my} Q52.9 {my + 3.6} 55.8 {my}" fill="none" stroke={ink} stroke-width={2.2 * fs} stroke-linecap="round" stroke-linejoin="round" />
  {:else}
    <path d="M45 {my} Q50 {my + 4.8} 55 {my}" fill="none" stroke={ink} stroke-width={2.3 * fs} stroke-linecap="round" />
  {/if}
{/snippet}

{#snippet bill()}
  {#if mouth === 'open' || mouth === 'o'}
    {@const gap = mouth === 'open' ? 4.5 : 2.5}
    <path d="M37 {59 + gap * 0.4} Q50 {67 + gap} 63 {59 + gap * 0.4} Z" fill={MOUTH} />
    <path d="M36 {58.5 + gap * 0.5} Q36 {65 + gap} 50 {65.5 + gap} Q64 {65 + gap} 64 {58.5 + gap * 0.5} Q50 {61 + gap} 36 {58.5 + gap * 0.5} Z" fill="#E08A2E" stroke={LINE} stroke-width={1.6 * fs} stroke-linejoin="round" />
    <path d="M34.5 58 Q34 51 50 51 Q66 51 65.5 58 Q50 {62 - gap * 0.2} 34.5 58 Z" fill="#F5A341" stroke={LINE} stroke-width={1.6 * fs} stroke-linejoin="round" />
  {:else}
    <ellipse cx="50" cy="58" rx="16" ry="7" fill="#F5A341" stroke={LINE} stroke-width={1.6 * fs} />
    <path d="M36.5 56 Q50 51.5 63.5 56 Q63 52 50 51.2 Q37 52 36.5 56 Z" fill="#FFC56E" />
    <path d={mouth === 'flat' ? 'M38 59 H62' : 'M37 58.2 Q50 63 63 58.2'} fill="none" stroke={LINE} stroke-width={1.3 * fs} stroke-linecap="round" opacity=".6" />
  {/if}
  <circle cx="45" cy="54.4" r=".9" fill={LINE} opacity=".55" /><circle cx="55" cy="54.4" r=".9" fill={LINE} opacity=".55" />
{/snippet}

{#snippet earsBack()}
  {#if sp === 'cat'}
    {#each [0, 1] as m (m)}
      <g transform={m ? 'matrix(-1 0 0 1 100 0)' : undefined}>
        <path d="M15 33 L18.4 8.6 Q19.4 2.6 25 5.8 L45 17 Z" fill={cw.base} stroke={LINE} stroke-width={lw} stroke-linejoin="round" />
        <path d="M21.4 25 L22.6 12.4 Q23 10 25.2 11.3 L36.4 18.4 Z" fill={cw.light} />
      </g>
    {/each}
  {:else if sp === 'rabbit'}
    {#each [0, 1] as m (m)}
      <g transform={m ? 'matrix(-1 0 0 1 100 0)' : undefined}>
        <g transform="rotate(-9 37 14)">
          <rect x="30.5" y="-21" width="13" height="38" rx="6.5" fill={cw.base} stroke={LINE} stroke-width={lw} />
          <rect x="34" y="-15.5" width="6" height="26" rx="3" fill={cw.light} />
        </g>
      </g>
    {/each}
  {:else if sp === 'bear'}
    {#each [0, 1] as m (m)}
      <g transform={m ? 'matrix(-1 0 0 1 100 0)' : undefined}>
        <circle cx="22" cy="15" r="9.5" fill={cw.base} stroke={LINE} stroke-width={lw} />
        <circle cx="22.6" cy="15.6" r="5" fill={cw.light} />
      </g>
    {/each}
  {:else if sp === 'hamster'}
    {#each [0, 1] as m (m)}
      <g transform={m ? 'matrix(-1 0 0 1 100 0)' : undefined}>
        <circle cx="25" cy="13" r="7.5" fill={cw.base} stroke={LINE} stroke-width={lw} />
        <circle cx="25.4" cy="13.4" r="4.2" fill="#FFC0C8" />
      </g>
    {/each}
  {:else if sp === 'duck'}
    <g fill={cw.base} stroke={LINE} stroke-width={lw} stroke-linejoin="round">
      <path d="M50 12 Q42 6 40.5 -1 Q48 1 50 9 Z" />
      <path d="M50 12 Q58 6 59.5 -1 Q52 1 50 9 Z" />
      <path d="M48 12 Q47 3 50 -4 Q53 3 52 12 Z" />
    </g>
  {:else if sp === 'sheep'}
    {#each [0, 1] as m (m)}
      <g transform={m ? 'matrix(-1 0 0 1 100 0)' : undefined}>
        <ellipse cx="12" cy="47" rx="9" ry="4.6" transform="rotate(18 12 47)" fill={cw.light} stroke={LINE} stroke-width={lw} />
      </g>
    {/each}
  {/if}
{/snippet}

{#snippet headShape()}
  {#if sp === 'sheep'}
    <!-- wool ring: outline pass, then fill pass so the puffs merge into one cloud -->
    <g fill={LINE}>{#each wool as w, i (i)}<circle cx={w.x} cy={w.y} r={w.r + lw / 2} />{/each}</g>
    <g fill={cw.base}>{#each wool as w, i (i)}<circle cx={w.x} cy={w.y} r={w.r - lw / 2} />{/each}</g>
    <ellipse cx="50" cy="42" rx="27" ry="24" fill={cw.base} />
    <ellipse cx="50" cy="47" rx="25" ry="22" fill={cw.light} />
    <!-- fringe -->
    <g fill={cw.base}>
      <circle cx="38" cy="26" r="7.5" /><circle cx="50" cy="24" r="8.5" /><circle cx="62" cy="26" r="7.5" />
    </g>
    <path d="M31 29 Q34 32 38 33.5 Q44 31 50 32.5 Q56 31 62 33.5 Q66 32 69 29" fill="none" stroke={cw.shade} stroke-width="1.6" stroke-linecap="round" opacity=".9" />
  {:else if sp === 'frog'}
    <g fill={LINE}>
      <ellipse cx="50" cy="41" rx={H.rx + lw / 2} ry={H.ry + lw / 2} />
      <circle cx="32" cy="19" r={12 + lw / 2} /><circle cx="68" cy="19" r={12 + lw / 2} />
    </g>
    <g fill={cw.base}>
      <ellipse cx="50" cy="41" rx={H.rx - lw / 2} ry={H.ry - lw / 2} />
      <circle cx="32" cy="19" r={12 - lw / 2} /><circle cx="68" cy="19" r={12 - lw / 2} />
    </g>
    <!-- pale belly-coloured chin -->
    <path d="M18 50 Q50 76 82 50 Q76 66 50 68 Q24 66 18 50 Z" fill={cw.light} opacity=".9" />
    <circle cx="32" cy="19" r="7.6" fill="#fff" /><circle cx="68" cy="19" r="7.6" fill="#fff" />
  {:else}
    <ellipse cx="50" cy="40" rx={H.rx} ry={H.ry} fill={cw.base} stroke={LINE} stroke-width={lw} />
  {/if}
{/snippet}

{#snippet markings()}
  <clipPath id="{uid}-head"><ellipse cx="50" cy="40" rx={H.rx - lw / 2} ry={H.ry - lw / 2} /></clipPath>
  {#if sp === 'cat'}
    <g clip-path="url(#{uid}-head)">
      <path d="M56 6 Q80 6 90 26 Q84 34 74 30 Q64 24 58 16 Z" fill={cw.shade} opacity=".75" />
    </g>
    <ellipse cx="50" cy="56.5" rx="11" ry="7" fill={cw.light} opacity=".5" />
  {:else if sp === 'dog'}
    <ellipse cx="50" cy="56.5" rx="15" ry="11" fill={cw.light} />
    <g clip-path="url(#{uid}-head)"><ellipse cx="66" cy="38" rx="10" ry="8" fill={cw.shade} opacity={cw.id === 'cloud' ? 0.55 : 0} /></g>
  {:else if sp === 'bear'}
    <ellipse cx="50" cy="56.5" rx="14" ry="10" fill={cw.light} />
  {:else if sp === 'rabbit'}
    <ellipse cx="50" cy="56" rx="11" ry="7.5" fill={cw.light} opacity=".7" />
  {:else if sp === 'hamster'}
    <g clip-path="url(#{uid}-head)">
      <path d="M44 4 Q50 2 56 4 Q57 18 50 24 Q43 18 44 4 Z" fill={cw.shade} opacity=".85" />
      <path d="M22 54 Q28 46 40 50 Q46 47 50 49 Q54 47 60 50 Q72 46 78 54 Q78 72 50 74 Q22 72 22 54 Z" fill={cw.light} />
    </g>
  {:else if sp === 'duck'}
    <g clip-path="url(#{uid}-head)"><ellipse cx="50" cy="66" rx="30" ry="12" fill={cw.light} opacity=".8" /></g>
  {/if}
{/snippet}

{#snippet earsFront()}
  {#if sp === 'dog'}
    {#each [0, 1] as m (m)}
      <g transform={m ? 'matrix(-1 0 0 1 100 0)' : undefined}>
        <path d="M30 13 Q14 10 9.4 31 Q6 49 12.6 58.6 Q19.4 64.6 23.6 53.4 Q27 39 34.4 21 Z" fill={cw.shade} stroke={LINE} stroke-width={lw} stroke-linejoin="round" />
      </g>
    {/each}
  {/if}
{/snippet}

{#snippet tail()}
  {#if sp === 'cat'}
    <path d="M66 100 Q82 102 81 90 Q80 80 88 77" fill="none" stroke={LINE} stroke-width={6 + lw * 2} stroke-linecap="round" />
    <path d="M66 100 Q82 102 81 90 Q80 80 88 77" fill="none" stroke={cw.base} stroke-width="6" stroke-linecap="round" />
  {:else if sp === 'dog'}
    <path d="M67 99 Q80 98 78 86" fill="none" stroke={LINE} stroke-width={7 + lw * 2} stroke-linecap="round" />
    <path d="M67 99 Q80 98 78 86" fill="none" stroke={cw.base} stroke-width="7" stroke-linecap="round" />
  {:else if sp === 'rabbit' || sp === 'sheep'}
    <circle cx="73" cy="100" r="6.5" fill={sp === 'sheep' ? cw.base : cw.light} stroke={LINE} stroke-width={lw} />
  {:else if sp === 'bear'}
    <circle cx="72" cy="101" r="5" fill={cw.base} stroke={LINE} stroke-width={lw} />
  {:else if sp === 'hamster'}
    <circle cx="71" cy="102" r="3.6" fill={cw.base} stroke={LINE} stroke-width={lw} />
  {:else if sp === 'duck'}
    <path d="M66 96 L82 91 L78 97.5 L84 100.5 L72 104 Z" fill={cw.base} stroke={LINE} stroke-width={lw} stroke-linejoin="round" />
  {/if}
{/snippet}

{#snippet body()}
  {@render tail()}
  <!-- legs -->
  <path d={legs} stroke={LINE} stroke-width={11 + lw * 2} stroke-linecap="round" />
  <path d={legs} stroke={limb} stroke-width="11" stroke-linecap="round" />
  <!-- torso -->
  <g transform={expression === 'proud' ? 'translate(50 0) scale(1.04 1) translate(-50 0)' : undefined}>
    {#if sp === 'sheep'}
      <!-- wool skirt peeking under the shirt -->
      <g fill={cw.base} stroke={LINE} stroke-width={lw}>
        {#each [31, 39.5, 48, 56.5, 65] as x (x)}<circle cx={x + 2} cy="104" r="5.6" />{/each}
      </g>
    {/if}
    <path d={torso} fill={shirt} stroke={LINE} stroke-width={lw} stroke-linejoin="round" />
    {#if !small && pattern !== 'plain'}
      <clipPath id="{uid}-shirt"><path d={torso} /></clipPath>
      <g clip-path="url(#{uid}-shirt)">
        {#if pattern === 'stripes'}
          <g fill="#fff" opacity=".42"><rect x="20" y="78" width="60" height="4.5" /><rect x="20" y="88" width="60" height="4.5" /><rect x="20" y="98" width="60" height="4.5" /></g>
        {:else if pattern === 'dots'}
          <g fill="#fff" opacity=".55">
            {#each [[38, 80], [50, 77], [62, 80], [34, 92], [46, 89], [58, 92], [68, 96], [40, 101], [54, 101]] as [x, y] (x * 1000 + y)}<circle cx={x} cy={y} r="2.1" />{/each}
          </g>
        {:else}
          <g fill="#7BC67E" stroke={LINE} stroke-width=".8" opacity=".9">
            {#each [[38, 82], [56, 80], [46, 94], [64, 96], [34, 100]] as [x, y] (x * 1000 + y)}
              <path d="M{x} {y} q3 -4.5 7 -2 q-3 4.5 -7 2 z" />
            {/each}
          </g>
        {/if}
      </g>
    {/if}
    <!-- collar shadow under the chin -->
    <path d="M36 72 Q50 78 64 72" fill="none" stroke={LINE} stroke-width="1.6" stroke-linecap="round" opacity=".18" />
  </g>
  <!-- arms -->
  {#each [0, 1] as m (m)}
    <g transform={m ? 'matrix(-1 0 0 1 100 0)' : undefined}>
      <path d={arm} fill="none" stroke={LINE} stroke-width={10 + lw * 2} stroke-linecap="round" stroke-linejoin="round" />
      <path d={arm} fill="none" stroke={shirt} stroke-width="10" stroke-linecap="round" stroke-linejoin="round" />
      <!-- the hand is a coat-coloured round end (no fingers) -->
      <circle cx={hand[0]} cy={hand[1]} r="4.6" fill={coat} />
    </g>
  {/each}
{/snippet}

{#snippet headGroup()}
  <g transform={expression === 'sleepy' ? 'rotate(6 50 72)' : undefined}>
    {@render earsBack()}
    {@render headShape()}
    {@render markings()}
    {@render earsFront()}
    {@render face()}
  </g>
{/snippet}

<g class="villager-art" class:anim={animate} class:sleepy={expression === 'sleepy'}>
  {#key `${expression}-${replay}`}
    <g class="hopper {animate ? hop : ''}">
      <g class="bob">
        {#if !headOnly}{@render body()}{/if}
        {@render headGroup()}
      </g>
    </g>
    {#if emoteKind}
      <EmoteArt kind={emoteKind} x={headOnly ? 84 : 88} y={sp === 'rabbit' ? -18 : -9} animate={animate} hold={emoteHold} />
    {/if}
  {/key}
</g>

<style>
  .hopper, .bob { transform-box: fill-box; transform-origin: 50% 100%; }
  .anim .bob { animation: if-bob var(--dur-idle, 2.4s) var(--ease-idle, ease-in-out) infinite; }
  .anim.sleepy .bob { animation-duration: 4s; }
  .hopper.hop { animation: if-hop 600ms 1 both; }
  .hopper.hop.small { animation: hop-small 420ms 1 both; }
  @keyframes hop-small {
    0% { transform: translateY(0) scale(1, 1); }
    30% { transform: translateY(-6%) scale(.95, 1.05); }
    70% { transform: translateY(0) scale(1.05, .95); }
    100% { transform: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    .anim .bob, .hopper.hop, .hopper.hop.small { animation: none; }
  }
</style>
