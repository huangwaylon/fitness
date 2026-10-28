<svelte:options namespace="svg" />

<script lang="ts">
  // Draws one villager as an SVG <g> in the shared chibi frame (style guide v2 §7.1):
  // viewBox 0 0 100 120, ground line y 116, head ellipse cx 50 cy 40. Embed inside any <svg>
  // (Villager.svelte wraps it; IslandScene places it directly in the scene).
  // What to draw comes from a `Look` (lib/villagers/roster.ts): a roster villager or a generic
  // species colourway.
  import type { EmoteKind, Expression } from './species.ts';
  import { EXPRESSION_EMOTE } from './species.ts';
  import type { Look } from './roster.ts';
  import EmoteArt from './EmoteArt.svelte';

  interface Props {
    look: Look;
    expression?: Expression;
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
    look: L,
    expression = 'happy',
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
  const PINK = '#F28BA8';

  const sp = $derived(L.species.id);
  const who = $derived(L.id);
  const generic = $derived(L.id.includes('-'));
  const fs = $derived(Math.min(1.6, lw / 2.6));
  const eyeCol = $derived(L.eye ?? EYE);
  const H = $derived(L.species.head);
  const eyeY = $derived(L.species.eyeY);
  const eyeDX = $derived(sp === 'frog' ? 18 : sp === 'hamster' ? 15 : 14);
  const eyeK = $derived(small ? 1.15 : 1);
  const legsCol = $derived(L.legs ?? L.shade);
  const handCol = $derived(L.hands ?? L.base);
  const blushCol = $derived(L.blush ?? '#FF9E8F');
  const headFill = $derived(who === 'judy' || who === 'molly' ? `url(#${uid}-hf)` : L.base);

  type EyeShape = 'oval' | 'dot' | 'ringed' | 'hetero' | 'bob' | 'lashes' | 'sparkle' | 'x' | 'lily' | 'big' | 'happy' | 'sleepy' | 'wide' | 'smug';
  const eyes = $derived<EyeShape>(
    expression === 'cheer' ? 'happy'
    : expression === 'sleepy' ? 'sleepy'
    : expression === 'surprised' ? (L.eyeStyle === 'x' ? 'x' : L.eyeStyle === 'lily' ? 'lily' : 'wide')
    : expression === 'proud' ? (L.eyeStyle === 'bob' || L.eyeStyle === 'hetero' || L.eyeStyle === 'x' ? L.eyeStyle : 'smug')
    : L.eyeStyle
  );
  type MouthShape = 'smile' | 'open' | 'cat' | 'o' | 'flat' | 'wide' | 'tongue';
  const mouth = $derived<MouthShape>(
    expression === 'cheer' ? (L.mouth === 'tongue' ? 'tongue' : 'open')
    : expression === 'sleepy' ? 'flat'
    : expression === 'surprised' ? 'o'
    : expression === 'proud' && L.mouth === 'open' ? 'smile'
    : L.mouth
  );
  const mouthY = $derived(
    sp === 'frog' ? 47 : sp === 'cat' ? 57 : sp === 'rabbit' || sp === 'hamster' ? 57.5 : sp === 'sheep' ? 57 : 59.5
  );
  const blush = $derived(
    sp === 'frog' ? { x: 22, y: 45, rx: 8.5, ry: 5 }
    : sp === 'hamster' ? { x: 25, y: 54, rx: 8, ry: 4.6 }
    : sp === 'sheep' ? { x: 32, y: 55, rx: 5.5, ry: 3.4 }
    : who === 'bunnie' ? { x: 26, y: 55, rx: 7, ry: 4.6 }
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
  const trim = $derived(L.trim ?? ['#FFFFFF']);

  // Sheep wool ring: 12 puffs around the face.
  const wool = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    return { x: 50 + Math.cos(a) * 29, y: 42 + Math.sin(a) * 26, r: i === 0 ? 11 : 10 };
  });
  const star = (cx: number, cy: number, r: number) => {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? r * 0.46 : r;
      d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * rr).toFixed(2)} ${(cy + Math.sin(a) * rr).toFixed(2)} `;
    }
    return d + 'Z';
  };
  const flower = (cx: number, cy: number, r: number) =>
    [0, 72, 144, 216, 288].map((a) => ({ x: cx + Math.cos((a * Math.PI) / 180) * r, y: cy + Math.sin((a * Math.PI) / 180) * r }));
</script>

<!-- ===== eyes ===== -->
{#snippet eye(cx: number, cy: number, o: number)}
  <!-- o = outer side (-1 left eye, +1 right eye) -->
  <g transform="translate({cx} {cy}) scale({eyeK})">
    {#if eyes === 'oval'}
      <ellipse rx="4.5" ry="5.8" fill={eyeCol} />
      <circle cx="1.4" cy="-2.2" r={small ? 1.8 : 1.6} fill="#fff" />
    {:else if eyes === 'dot'}
      <circle r="3.9" fill={eyeCol} />
      {#if !small}<circle cx="1" cy="-1.1" r=".9" fill="#fff" opacity=".85" />{/if}
    {:else if eyes === 'ringed'}
      <ellipse rx="5.1" ry="6.3" fill={L.eye2 ?? '#C9803A'} />
      <ellipse rx="3.9" ry="5.1" fill={eyeCol} />
      <circle cx="1.3" cy="-2.2" r="1.6" fill="#fff" />
    {:else if eyes === 'big'}
      <ellipse rx="5.4" ry="6.6" fill={eyeCol} />
      <circle cx="1.6" cy="-2.4" r="2.2" fill="#fff" /><circle cx="-1.8" cy="2.6" r=".9" fill="#fff" />
    {:else if eyes === 'lashes'}
      <ellipse rx="5" ry="6.3" fill={eyeCol} />
      <circle cx="1.4" cy="-2.4" r="2.1" fill="#fff" /><circle cx="-1.8" cy="2.4" r=".9" fill="#fff" />
      <path d="M{-4 * o} -8.6 Q{1 * o} -11.6 {6 * o} -7.4" fill="none" stroke={LINE} stroke-width={1.8 * fs} stroke-linecap="round" />
      <path d="M{4.2 * o} -4.4 L{7 * o} -6.2" stroke={LINE} stroke-width={1.5 * fs} stroke-linecap="round" />
    {:else if eyes === 'sparkle'}
      <ellipse rx="5.6" ry="6.7" fill={eyeCol} />
      <ellipse cy="2.6" rx="4" ry="3" fill="#5652B8" />
      <path d="M1.6 -5.4 L2.4 -3 L4.8 -2.2 L2.4 -1.4 L1.6 1 L.8 -1.4 L-1.6 -2.2 L.8 -3 Z" fill="#fff" />
      <path d="M-2.2 1.4 L-1.8 2.6 L-.6 3 L-1.8 3.4 L-2.2 4.6 L-2.6 3.4 L-3.8 3 L-2.6 2.6 Z" fill="#fff" />
      <path d="M{4.4 * o} -4.8 L{7.4 * o} -6.8 M{5.4 * o} -2 L{8.2 * o} -3" stroke={LINE} stroke-width={1.4 * fs} stroke-linecap="round" />
    {:else if eyes === 'hetero' || eyes === 'bob'}
      <clipPath id="{uid}-sc"><path d="M-5.6 -1.4 Q0 -2.6 5.6 -1.4 Q5.2 5 0 5 Q-5.2 5 -5.6 -1.4 Z" /></clipPath>
      <path d="M-5.6 -1.4 Q0 -2.6 5.6 -1.4 Q5.2 5 0 5 Q-5.2 5 -5.6 -1.4 Z" fill={eyes === 'bob' ? eyeCol : '#fff'} />
      <g clip-path="url(#{uid}-sc)">
        {#if eyes === 'hetero'}
          <circle cx={-0.6 * o} cy="1" r="3.4" fill={o < 0 ? eyeCol : (L.eye2 ?? eyeCol)} />
          <circle cx={-0.6 * o} cy="1" r="1.6" fill="#1E1A1A" />
          <circle cx={-0.6 * o + 1} cy="0" r=".8" fill="#fff" />
        {:else}
          <ellipse cx={-2.2 * o} cy="1.4" rx="1.5" ry="3" fill="#1E1A1A" />
        {/if}
      </g>
      <path d="M-5.6 -1.4 Q0 -2.6 5.6 -1.4 Q5.2 5 0 5 Q-5.2 5 -5.6 -1.4 Z" fill="none" stroke={LINE} stroke-width={1.1 * fs} />
      <path d="M-6.4 -1.8 Q0 -3.2 6.4 -1.6" fill="none" stroke={LINE} stroke-width={2.6 * fs} stroke-linecap="round" />
    {:else if eyes === 'x'}
      <path d="M-3.6 -3.6 L3.6 3.6 M3.6 -3.6 L-3.6 3.6" stroke={eyeCol} stroke-width={2.6 * fs} stroke-linecap="round" />
    {:else if eyes === 'lily'}
      <ellipse rx="4.6" ry="5.4" fill={eyeCol} />
      <circle r="2.4" fill="#2A1A14" />
      <circle cx="1.4" cy="-1.8" r="1.3" fill="#fff" />
      <path d="M-6.4 -2.2 Q0 -9 6.4 -2.2" fill="none" stroke={LINE} stroke-width={1.9 * fs} stroke-linecap="round" />
      <path d="M{5.2 * o} -4.6 L{8 * o} -6.4" stroke={LINE} stroke-width={1.5 * fs} stroke-linecap="round" />
    {:else if eyes === 'happy'}
      <path d="M-4.6 1.8 Q0 -5.4 4.6 1.8" fill="none" stroke={L.eyeStyle === 'bob' || L.eyeStyle === 'lily' ? LINE : eyeCol} stroke-width={3 * fs} stroke-linecap="round" />
    {:else if eyes === 'sleepy'}
      <path d="M-4.6 -.6 Q0 3.8 4.6 -.6" fill="none" stroke={L.eyeStyle === 'bob' || L.eyeStyle === 'lily' ? LINE : eyeCol} stroke-width={3 * fs} stroke-linecap="round" />
    {:else if eyes === 'wide'}
      <circle r="5.4" fill={L.eyeStyle === 'bob' ? '#1E1A1A' : L.eyeStyle === 'hetero' && o > 0 ? (L.eye2 ?? eyeCol) : eyeCol} />
      <circle cx="1.7" cy="-1.9" r="2" fill="#fff" />
      <circle cx="-1.8" cy="2" r=".9" fill="#fff" />
    {:else}
      <path d="M-4.2 -1 A4.2 5.3 0 0 0 4.2 -1 Z" fill={eyeCol} />
      <path d="M-5.6 -1.6 L5.2 -1.1" stroke={LINE} stroke-width={2.4 * fs} stroke-linecap="round" />
      {#if !small}<circle cx="1.4" cy="1" r="1" fill="#fff" />{/if}
    {/if}
  </g>
{/snippet}

<!-- ===== face ===== -->
{#snippet face()}
  <ellipse cx={blush.x} cy={blush.y} rx={blush.rx} ry={blush.ry} fill={blushCol} opacity=".7" />
  <ellipse cx={100 - blush.x} cy={blush.y} rx={blush.rx} ry={blush.ry} fill={blushCol} opacity=".7" />
  {@render eye(50 - eyeDX, eyeY, -1)}
  {@render eye(50 + eyeDX, eyeY, 1)}
  {#if who === 'raymond' && !small}
    <!-- glasses -->
    <g fill="none" stroke="#26242A" stroke-width={2.2 * fs} stroke-linejoin="round">
      <rect x={50 - eyeDX - 8.4} y={eyeY - 6.4} width="16.8" height="12.6" rx="4.6" />
      <rect x={50 + eyeDX - 8.4} y={eyeY - 6.4} width="16.8" height="12.6" rx="4.6" />
      <path d="M{50 - eyeDX + 8.4} {eyeY - 2} Q50 {eyeY - 4.4} {50 + eyeDX - 8.4} {eyeY - 2}" />
      <path d="M{50 - eyeDX - 8.4} {eyeY - 2.4} L15 {eyeY - 4.4} M{50 + eyeDX + 8.4} {eyeY - 2.4} L85 {eyeY - 4.4}" />
    </g>
  {:else if who === 'raymond'}
    <path d="M{50 - eyeDX - 7} {eyeY - 5} H{50 + eyeDX + 7}" stroke="#26242A" stroke-width={1.8 * fs} />
  {/if}
  {#if expression === 'surprised' || who === 'dom'}
    <g fill="none" stroke={LINE} stroke-width={2.2 * fs} stroke-linecap="round">
      <path d="M{50 - eyeDX - 4} {eyeY - 10} Q{50 - eyeDX} {eyeY - 13} {50 - eyeDX + 4} {eyeY - 10.5}" />
      <path d="M{50 + eyeDX - 4} {eyeY - 10.5} Q{50 + eyeDX} {eyeY - 13} {50 + eyeDX + 4} {eyeY - 10}" />
    </g>
  {/if}
  <!-- nose -->
  {#if sp === 'cat'}
    <path d="M47.3 50.6 H52.7 L50 53.6 Z" fill={L.nose ?? PINK} stroke={LINE} stroke-width={1.2 * fs} stroke-linejoin="round" />
    {#if !small && generic}
      <g stroke={LINE} stroke-width={1.6 * fs} stroke-linecap="round" opacity=".5">
        <path d="M13 50 L22 52 M13.5 57 L22 55.5 M87 50 L78 52 M86.5 57 L78 55.5" />
      </g>
    {/if}
  {:else if sp === 'dog'}
    <ellipse cx="50" cy="51" rx="5.2" ry="3.7" fill={L.nose ?? EYE} />
    <ellipse cx="48.6" cy="49.9" rx="1.7" ry="1" fill="#fff" opacity=".8" />
  {:else if sp === 'bear'}
    <path d="M45.6 50 Q50 48.2 54.4 50 Q53.4 54.4 50 55.2 Q46.6 54.4 45.6 50 Z" fill={L.nose ?? EYE} />
    <ellipse cx="48.6" cy="50.3" rx="1.4" ry=".8" fill="#fff" opacity=".7" />
  {:else if sp === 'rabbit'}
    <ellipse cx="50" cy="51.6" rx="2.4" ry="1.8" fill={L.nose ?? PINK} stroke={generic ? LINE : 'none'} stroke-width={1 * fs} />
    {#if generic}<path d="M50 53.5 V55.8" stroke={LINE} stroke-width={1.6 * fs} stroke-linecap="round" />{/if}
  {:else if sp === 'hamster'}
    <ellipse cx="50" cy="51.4" rx="2.6" ry="2" fill={L.nose ?? PINK} stroke={generic ? LINE : 'none'} stroke-width={1 * fs} />
  {:else if sp === 'sheep'}
    <path d="M47.5 51 Q50 53 52.5 51" fill="none" stroke={L.eye && generic ? '#FFF1DE' : LINE} stroke-width={1.8 * fs} stroke-linecap="round" opacity=".7" />
  {:else if sp === 'frog'}
    <circle cx="46.5" cy="38" r="1.2" fill={LINE} opacity=".7" /><circle cx="53.5" cy="38" r="1.2" fill={LINE} opacity=".7" />
  {/if}
  <!-- mouth -->
  {#if sp === 'duck'}
    {@render bill()}
  {:else if sp === 'frog'}
    {#if mouth === 'open' || mouth === 'tongue'}
      <path d="M33 44 H67 Q65.5 59 50 59.5 Q34.5 59 33 44 Z" fill={MOUTH} stroke={LINE} stroke-width={1.6 * fs} stroke-linejoin="round" />
      <path d="M41 54.6 Q50 48.6 59 54.6 Q50 59.6 41 54.6 Z" fill={who === 'lily' ? '#F59A4A' : TONGUE} />
    {:else if mouth === 'o'}
      <ellipse cx="50" cy="49" rx="3.4" ry="4" fill={MOUTH} />
    {:else if mouth === 'flat'}
      <path d="M41 48 H59" stroke={LINE} stroke-width={2.4 * fs} stroke-linecap="round" />
    {:else}
      <path d="M33 45.5 Q50 57 67 45.5" fill="none" stroke={LINE} stroke-width={2.4 * fs} stroke-linecap="round" />
    {/if}
  {:else}
    {@render mouthArt(mouthY, L.eye && generic ? '#FFF1DE' : LINE)}
  {/if}
{/snippet}

{#snippet mouthArt(my: number, ink: string)}
  {#if mouth === 'open' || mouth === 'tongue'}
    <path d="M44.6 {my - 1} H55.4 Q55.4 {my + 7} 50 {my + 7} Q44.6 {my + 7} 44.6 {my - 1} Z" fill={MOUTH} stroke={LINE} stroke-width={1.5 * fs} stroke-linejoin="round" />
    <path d="M46.6 {my + 5.2} Q50 {my + 2.4} 53.4 {my + 5.2} Q50 {my + 7.2} 46.6 {my + 5.2} Z" fill={TONGUE} />
    {#if mouth === 'tongue'}
      <path d="M48.4 {my + 5} Q48.6 {my + 10.6} 52 {my + 10.4} Q55 {my + 10} 54.6 {my + 5} Z" fill={TONGUE} stroke={LINE} stroke-width={1.2 * fs} stroke-linejoin="round" />
    {/if}
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
  {:else if mouth === 'wide'}
    <path d="M37.5 {my - 1.5} Q50 {my + 4} 62.5 {my - 1.5}" fill="none" stroke={ink} stroke-width={2.3 * fs} stroke-linecap="round" />
  {:else}
    <path d="M45 {my} Q50 {my + 4.8} 55 {my}" fill="none" stroke={ink} stroke-width={2.3 * fs} stroke-linecap="round" />
  {/if}
{/snippet}

{#snippet bill()}
  {@const billCol = who === 'molly' ? '#F59A30' : '#F5A341'}
  {#if mouth === 'open' || mouth === 'o' || mouth === 'tongue'}
    {@const gap = mouth === 'o' ? 2.5 : 4.5}
    <path d="M37 {59 + gap * 0.4} Q50 {67 + gap} 63 {59 + gap * 0.4} Z" fill={MOUTH} />
    <path d="M36 {58.5 + gap * 0.5} Q36 {65 + gap} 50 {65.5 + gap} Q64 {65 + gap} 64 {58.5 + gap * 0.5} Q50 {61 + gap} 36 {58.5 + gap * 0.5} Z" fill="#E08A2E" stroke={LINE} stroke-width={1.6 * fs} stroke-linejoin="round" />
    <path d="M34.5 58 Q34 51 50 51 Q66 51 65.5 58 Q50 {62 - gap * 0.2} 34.5 58 Z" fill={billCol} stroke={LINE} stroke-width={1.6 * fs} stroke-linejoin="round" />
  {:else}
    <ellipse cx="50" cy="58" rx="16" ry="7" fill={billCol} stroke={LINE} stroke-width={1.6 * fs} />
    <path d="M36.5 56 Q50 51.5 63.5 56 Q63 52 50 51.2 Q37 52 36.5 56 Z" fill="#FFC56E" />
    <path d={mouth === 'flat' ? 'M38 59 H62' : 'M37 58.2 Q50 63 63 58.2'} fill="none" stroke={LINE} stroke-width={1.3 * fs} stroke-linecap="round" opacity=".6" />
  {/if}
  <circle cx="45" cy="54.4" r=".9" fill={LINE} opacity=".55" /><circle cx="55" cy="54.4" r=".9" fill={LINE} opacity=".55" />
{/snippet}

<!-- ===== ears / head ===== -->
{#snippet earsBack()}
  {#if sp === 'cat'}
    {#each [0, 1] as m (m)}
      <g transform={m ? 'matrix(-1 0 0 1 100 0)' : undefined}>
        <path d="M15 33 L18.4 8.6 Q19.4 2.6 25 5.8 L45 17 Z" fill={L.earOuter ?? L.base} stroke={LINE} stroke-width={lw} stroke-linejoin="round" />
        <path d="M21.4 25 L22.6 12.4 Q23 10 25.2 11.3 L36.4 18.4 Z" fill={L.ear ?? L.light} />
      </g>
    {/each}
  {:else if sp === 'rabbit'}
    {#each [0, 1] as m (m)}
      <g transform={m ? 'matrix(-1 0 0 1 100 0)' : undefined}>
        <g transform="rotate(-9 37 14)">
          <rect x="30.5" y="-21" width="13" height="38" rx="6.5" fill={L.earOuter ?? L.base} stroke={LINE} stroke-width={lw} />
          <rect x="34" y="-15.5" width="6" height="26" rx="3" fill={L.ear ?? L.light} />
        </g>
      </g>
    {/each}
  {:else if sp === 'bear'}
    {#each [0, 1] as m (m)}
      {@const outer = who === 'stitches' ? (m ? L.ear : L.eye2) : (L.earOuter ?? L.base)}
      {@const inner = who === 'stitches' ? (m ? L.eye2 : L.ear) : (L.ear ?? L.light)}
      <g transform={m ? 'matrix(-1 0 0 1 100 0)' : undefined}>
        <circle cx="22" cy="15" r="9.5" fill={outer} stroke={LINE} stroke-width={lw} />
        <circle cx="22.6" cy="15.6" r="5" fill={inner} />
      </g>
    {/each}
  {:else if sp === 'hamster'}
    {#each [0, 1] as m (m)}
      <g transform={m ? 'matrix(-1 0 0 1 100 0)' : undefined}>
        <circle cx="25" cy="13" r="7.5" fill={L.earOuter ?? L.base} stroke={LINE} stroke-width={lw} />
        <circle cx="25.4" cy="13.4" r="4.2" fill={L.ear ?? '#FFC0C8'} />
      </g>
    {/each}
  {:else if sp === 'duck'}
    <g fill={who === 'molly' ? L.shade : L.base} stroke={LINE} stroke-width={lw} stroke-linejoin="round">
      <path d="M50 12 Q42 6 40.5 -1 Q48 1 50 9 Z" />
      <path d="M50 12 Q58 6 59.5 -1 Q52 1 50 9 Z" />
      <path d="M48 12 Q47 3 50 -4 Q53 3 52 12 Z" />
    </g>
  {:else if sp === 'sheep'}
    {#each [0, 1] as m (m)}
      <g transform={m ? 'matrix(-1 0 0 1 100 0)' : undefined}>
        <ellipse cx="12" cy="47" rx="9" ry="4.6" transform="rotate(18 12 47)" fill={L.light} stroke={LINE} stroke-width={lw} />
      </g>
    {/each}
  {/if}
{/snippet}

{#snippet headShape()}
  {#if who === 'judy'}
    <linearGradient id="{uid}-hf" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F7B0D8" /><stop offset=".55" stop-color="#E6C2F2" /><stop offset="1" stop-color="#A9C8F7" />
    </linearGradient>
  {:else if who === 'molly'}
    <linearGradient id="{uid}-hf" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8E5E36" /><stop offset=".3" stop-color="#A8743F" /><stop offset=".52" stop-color={L.base} /><stop offset="1" stop-color={L.base} />
    </linearGradient>
  {/if}
  {#if sp === 'sheep'}
    <!-- wool ring: outline pass, then fill pass so the puffs merge into one cloud -->
    <g fill={LINE}>{#each wool as w, i (i)}<circle cx={w.x} cy={w.y} r={w.r + lw / 2} />{/each}</g>
    <g fill={L.base}>{#each wool as w, i (i)}<circle cx={w.x} cy={w.y} r={w.r - lw / 2} />{/each}</g>
    <ellipse cx="50" cy="42" rx="27" ry="24" fill={L.base} />
    <ellipse cx="50" cy="47" rx="25" ry="22" fill={L.light} />
    <g fill={L.base}>
      <circle cx="38" cy="26" r="7.5" /><circle cx="50" cy="24" r="8.5" /><circle cx="62" cy="26" r="7.5" />
    </g>
    <path d="M31 29 Q34 32 38 33.5 Q44 31 50 32.5 Q56 31 62 33.5 Q66 32 69 29" fill="none" stroke={L.shade} stroke-width="1.6" stroke-linecap="round" opacity=".9" />
  {:else if sp === 'frog'}
    <g fill={LINE}>
      <ellipse cx="50" cy="41" rx={H.rx + lw / 2} ry={H.ry + lw / 2} />
      <circle cx="32" cy="19" r={12 + lw / 2} /><circle cx="68" cy="19" r={12 + lw / 2} />
    </g>
    <g fill={L.base}>
      <ellipse cx="50" cy="41" rx={H.rx - lw / 2} ry={H.ry - lw / 2} />
      <circle cx="32" cy="19" r={12 - lw / 2} /><circle cx="68" cy="19" r={12 - lw / 2} />
    </g>
    {#if who === 'lily'}
      <path d="M14 42 Q50 30 86 42 Q86 64 50 68 Q14 64 14 42 Z" fill={L.light} />
    {:else}
      <path d="M18 50 Q50 76 82 50 Q76 66 50 68 Q24 66 18 50 Z" fill={L.light} opacity=".9" />
    {/if}
    <circle cx="32" cy="19" r="7.6" fill="#fff" /><circle cx="68" cy="19" r="7.6" fill="#fff" />
  {:else}
    <ellipse cx="50" cy="40" rx={H.rx} ry={H.ry} fill={headFill} stroke={LINE} stroke-width={lw} />
  {/if}
{/snippet}

{#snippet markings()}
  <clipPath id="{uid}-head"><ellipse cx="50" cy="40" rx={H.rx - lw / 2} ry={H.ry - lw / 2} /></clipPath>
  {#if who === 'raymond'}
    <ellipse cx="50" cy="56.5" rx="12" ry="7.5" fill={L.light} opacity=".8" />
  {:else if who === 'bob'}
    <g clip-path="url(#{uid}-head)">
      <path d="M52 4 Q84 2 90 30 Q88 50 76 50 Q66 48 62 38 Q60 22 52 4 Z" fill={L.shade} opacity=".85" />
    </g>
  {:else if sp === 'cat'}
    <g clip-path="url(#{uid}-head)">
      <path d="M56 6 Q80 6 90 26 Q84 34 74 30 Q64 24 58 16 Z" fill={L.shade} opacity=".75" />
    </g>
    <ellipse cx="50" cy="56.5" rx="11" ry="7" fill={L.light} opacity=".5" />
  {:else if sp === 'dog'}
    <ellipse cx="50" cy="56.5" rx="15" ry="11" fill={L.light} />
    {#if L.id === 'dog-cloud'}<g clip-path="url(#{uid}-head)"><ellipse cx="66" cy="38" rx="10" ry="8" fill={L.shade} opacity=".55" /></g>{/if}
  {:else if who === 'bunnie'}
    <g clip-path="url(#{uid}-head)">
      <path d="M50 22 Q46 14 40 11 Q22 12 17 32 Q13 56 30 66 Q50 74 70 66 Q87 56 83 32 Q78 12 60 11 Q54 14 50 22 Z" fill={L.light} />
    </g>
  {:else if who === 'stitches'}
    <g clip-path="url(#{uid}-head)">
      <path d="M26 4 Q50 0 74 6 L56 30 Q50 33 44 30 Z" fill={L.shade} />
      <path d="M27 6 L44.5 29.5 M73 7 L55.5 29.5" stroke="#fff" stroke-width="1.2" stroke-dasharray="2 2.4" opacity=".7" />
      <path d="M14 46 Q22 54 20 66" stroke="#B86A1E" stroke-width="1.2" stroke-dasharray="2 2.4" fill="none" opacity=".6" />
    </g>
    <ellipse cx="50" cy="57" rx="13" ry="10" fill={L.light} />
  {:else if sp === 'bear'}
    <ellipse cx="50" cy="56.5" rx={who === 'judy' ? 12 : 14} ry={who === 'judy' ? 8.5 : 10} fill={L.light} opacity={who === 'judy' ? 0.8 : 1} />
  {:else if sp === 'rabbit'}
    <ellipse cx="50" cy="56" rx="11" ry="7.5" fill={L.light} opacity=".7" />
  {:else if sp === 'hamster'}
    <g clip-path="url(#{uid}-head)">
      {#if who === 'hamlet'}
        <path d="M41 4 Q50 0 59 4 L56.6 20 L53 14.6 L50 22 L47 14.6 L43.4 20 Z" fill={L.shade} />
      {:else}
        <path d="M44 4 Q50 2 56 4 Q57 18 50 24 Q43 18 44 4 Z" fill={L.shade} opacity=".85" />
      {/if}
      <path d="M22 54 Q28 46 40 50 Q46 47 50 49 Q54 47 60 50 Q72 46 78 54 Q78 72 50 74 Q22 72 22 54 Z" fill={L.light} />
    </g>
  {:else if sp === 'duck' && who !== 'molly'}
    <g clip-path="url(#{uid}-head)"><ellipse cx="50" cy="66" rx="30" ry="12" fill={L.light} opacity=".8" /></g>
  {/if}
{/snippet}

{#snippet earsFront()}
  {#if sp === 'dog'}
    {#each [0, 1] as m (m)}
      <g transform={m ? 'matrix(-1 0 0 1 100 0)' : undefined}>
        <path d="M30 13 Q14 10 9.4 31 Q6 49 12.6 58.6 Q19.4 64.6 23.6 53.4 Q27 39 34.4 21 Z" fill={L.shade} stroke={LINE} stroke-width={lw} stroke-linejoin="round" />
      </g>
    {/each}
  {:else if who === 'raymond'}
    <!-- neat blonde hair, combed to one side -->
    <path d="M28 18 Q36 5 56 7 Q66 8 70 14 Q60 11 52 15 Q47 19 44 25 Q42 18 36 18 Q32 18 28 22 Z" fill="#F4E2A0" stroke={LINE} stroke-width={lw * 0.7} stroke-linejoin="round" />
    <path d="M38 12 Q46 9 56 10" fill="none" stroke="#D9BE6A" stroke-width="1.4" stroke-linecap="round" />
  {:else if who === 'dom'}
    {#each [0, 1] as m (m)}
      <g transform={m ? 'matrix(-1 0 0 1 100 0)' : undefined}>
        <path d="M27 20 Q14 8 6 20 Q0 34 12 40 Q20 42 20 34 Q19 28 13 30" fill="none" stroke={LINE} stroke-width={9 + lw * 2} stroke-linecap="round" />
        <path d="M27 20 Q14 8 6 20 Q0 34 12 40 Q20 42 20 34 Q19 28 13 30" fill="none" stroke="#EE5F67" stroke-width="9" stroke-linecap="round" />
        <path d="M22 15 Q13 10 8 18" fill="none" stroke="#FF9AA0" stroke-width="2.4" stroke-linecap="round" />
      </g>
    {/each}
  {/if}
{/snippet}

{#snippet tail()}
  {#if sp === 'cat'}
    {@const tc = who === 'raymond' ? L.shade : L.base}
    <path d="M66 100 Q82 102 81 90 Q80 80 88 77" fill="none" stroke={LINE} stroke-width={6 + lw * 2} stroke-linecap="round" />
    <path d="M66 100 Q82 102 81 90 Q80 80 88 77" fill="none" stroke={tc} stroke-width="6" stroke-linecap="round" />
  {:else if sp === 'dog'}
    <path d="M67 99 Q80 98 78 86" fill="none" stroke={LINE} stroke-width={7 + lw * 2} stroke-linecap="round" />
    <path d="M67 99 Q80 98 78 86" fill="none" stroke={L.base} stroke-width="7" stroke-linecap="round" />
  {:else if sp === 'rabbit' || sp === 'sheep'}
    <circle cx="73" cy="100" r="6.5" fill={sp === 'sheep' ? L.base : L.light} stroke={LINE} stroke-width={lw} />
  {:else if sp === 'bear'}
    <circle cx="72" cy="101" r="5" fill={L.base} stroke={LINE} stroke-width={lw} />
  {:else if sp === 'hamster'}
    <circle cx="71" cy="102" r="3.6" fill={L.base} stroke={LINE} stroke-width={lw} />
  {:else if sp === 'duck'}
    <path d="M66 96 L82 91 L78 97.5 L84 100.5 L72 104 Z" fill={L.base} stroke={LINE} stroke-width={lw} stroke-linejoin="round" />
  {/if}
{/snippet}

<!-- ===== outfit (clipped to the torso) ===== -->
{#snippet outfit()}
  {#if L.outfit === 'stripes'}
    <g fill="#fff" opacity=".42"><rect x="20" y="78" width="60" height="4.5" /><rect x="20" y="88" width="60" height="4.5" /><rect x="20" y="98" width="60" height="4.5" /></g>
  {:else if L.outfit === 'dots'}
    <g fill="#fff" opacity=".55">
      {#each [[38, 80], [50, 77], [62, 80], [34, 92], [46, 89], [58, 92], [68, 96], [40, 101], [54, 101]] as [x, y], i (i)}<circle cx={x} cy={y} r="2.1" />{/each}
    </g>
  {:else if L.outfit === 'leaf'}
    <g fill="#7BC67E" stroke={LINE} stroke-width=".8" opacity=".9">
      {#each [[38, 82], [56, 80], [46, 94], [64, 96], [34, 100]] as [x, y], i (i)}<path d="M{x} {y} q3 -4.5 7 -2 q-3 4.5 -7 2 z" />{/each}
    </g>
  {:else if L.outfit === 'plaid'}
    <g opacity=".75" fill={trim[0]}>
      {#each [30, 41, 52, 63] as x (x)}<rect x={x} y="60" width="4" height="50" />{/each}
      {#each [76, 88, 100] as y (y)}<rect x="20" y={y} width="60" height="4" />{/each}
    </g>
    <g stroke={trim[1]} stroke-width="1.3" opacity=".9">
      {#each [36.5, 47.5, 58.5, 69.5] as x (x)}<path d="M{x} 60 V110" />{/each}
      {#each [82.5, 94.5] as y (y)}<path d="M20 {y} H80" />{/each}
    </g>
  {:else if L.outfit === 'aloha'}
    {#each [[38, 79], [57, 77], [47, 90], [66, 92], [35, 99], [56, 102]] as [x, y], i (i)}
      {#each flower(x, y, 2.6) as p, j (j)}<circle cx={p.x} cy={p.y} r="2.2" fill={trim[0]} />{/each}
      <circle cx={x} cy={y} r="1.4" fill={trim[1]} />
    {/each}
  {:else if L.outfit === 'waistcoat'}
    {#each [0, 1] as m (m)}
      <g transform={m ? 'matrix(-1 0 0 1 100 0)' : undefined}>
        <path d="M26 110 L31 72 Q33 67 38 67 H43 L50 86 V110 Z" fill={trim[0]} stroke={LINE} stroke-width="1.2" stroke-linejoin="round" />
        <path d="M36 92 H44" stroke={LINE} stroke-width="1" opacity=".4" />
      </g>
    {/each}
    <path d="M48.2 69 H51.8 L53 72 L51.6 84 L50 86.4 L48.4 84 L47 72 Z" fill={trim[1]} stroke={LINE} stroke-width=".9" stroke-linejoin="round" />
    <g fill="#5A5C66"><circle cx="50" cy="91" r="1.1" /><circle cx="50" cy="97" r="1.1" /><circle cx="50" cy="103" r="1.1" /></g>
  {:else if L.outfit === 'stars'}
    {#each [[38, 79, 0], [58, 77, 1], [48, 90, 2], [66, 93, 3], [35, 99, 1], [56, 101, 0]] as [x, y, c], i (i)}
      <path d={star(x, y, 4)} fill={trim[c]} />
    {/each}
  {:else if L.outfit === 'star'}
    <path d={star(50, 89, 11)} fill={trim[0]} stroke={LINE} stroke-width=".9" stroke-linejoin="round" />
  {:else if L.outfit === 'frill'}
    <g fill={trim[0]} stroke={LINE} stroke-width=".9">
      {#each [27, 33, 39, 45, 51, 57, 63, 69, 75] as x (x)}<circle cx={x} cy="104" r="3.6" />{/each}
    </g>
    <rect x="20" y="96" width="60" height="5" fill={trim[0]} />
    <path d="M42 69 Q50 76 58 69" fill={trim[0]} stroke={LINE} stroke-width=".9" />
  {:else if L.outfit === 'dress'}
    <path d="M44.6 70.6 L50 73.4 L44.6 76.4 Z M55.4 70.6 L50 73.4 L55.4 76.4 Z" fill={trim[0]} />
    <circle cx="50" cy="73.4" r="1.6" fill={trim[0]} />
    <path d="M49 74.4 L46.6 81 M51 74.4 L53.4 81" stroke={trim[0]} stroke-width="1.2" stroke-linecap="round" />
    <path d="M26 101 Q32 98 38 101 Q44 98 50 101 Q56 98 62 101 Q68 98 74 101" fill="none" stroke="#fff" stroke-width="1.6" opacity=".7" />
  {:else if L.outfit === 'pineapple'}
    {#each [[39, 80], [58, 79], [48, 92], [66, 95], [35, 100], [56, 103]] as [x, y], i (i)}
      <path d="M{x} {y - 3.4} l-2 -2.6 M{x} {y - 3.4} l0 -3 M{x} {y - 3.4} l2 -2.6" stroke={trim[1]} stroke-width="1.4" stroke-linecap="round" />
      <ellipse cx={x} cy={y} rx="2.6" ry="3.4" fill={trim[0]} />
    {/each}
  {:else if L.outfit === 'tiedye'}
    {#each [34, 29, 24, 19, 14, 9, 4] as r, i (r)}
      <circle cx="50" cy="90" r={r} fill="none" stroke={i % 5 === 0 ? L.shirt : trim[(i - 1) % 4]} stroke-width="5.4" />
    {/each}
  {/if}
{/snippet}

{#snippet body()}
  {@render tail()}
  <path d={legs} stroke={LINE} stroke-width={11 + lw * 2} stroke-linecap="round" />
  <path d={legs} stroke={legsCol} stroke-width="11" stroke-linecap="round" />
  {#if who === 'raymond'}
    <path d="M42.5 109 V110.5 M57.5 109 V110.5" stroke={L.shade} stroke-width="11" stroke-linecap="round" />
  {/if}
  <g transform={expression === 'proud' ? 'translate(50 0) scale(1.04 1) translate(-50 0)' : undefined}>
    {#if sp === 'sheep'}
      <g fill={L.base} stroke={LINE} stroke-width={lw}>
        {#each [31, 39.5, 48, 56.5, 65] as x (x)}<circle cx={x + 2} cy="104" r="5.6" />{/each}
      </g>
    {/if}
    <path d={torso} fill={L.shirt} stroke={LINE} stroke-width={lw} stroke-linejoin="round" />
    {#if !small && L.outfit !== 'plain'}
      <clipPath id="{uid}-shirt"><path d={torso} /></clipPath>
      <g clip-path="url(#{uid}-shirt)">{@render outfit()}</g>
      <path d={torso} fill="none" stroke={LINE} stroke-width={lw} stroke-linejoin="round" />
    {/if}
    {#if L.outfit === 'plaid' && !small}
      <!-- white collar -->
      <path d="M40 68.6 Q42 75.6 49 72.4 L50 69 Z M60 68.6 Q58 75.6 51 72.4 L50 69 Z" fill="#fff" stroke={LINE} stroke-width="1" stroke-linejoin="round" />
    {/if}
    <path d="M36 72 Q50 78 64 72" fill="none" stroke={LINE} stroke-width="1.6" stroke-linecap="round" opacity=".18" />
  </g>
  {#each [0, 1] as m (m)}
    {@const hc = who === 'stitches' ? (m ? '#4FC95A' : '#4A8FE8') : handCol}
    <g transform={m ? 'matrix(-1 0 0 1 100 0)' : undefined}>
      <path d={arm} fill="none" stroke={LINE} stroke-width={10 + lw * 2} stroke-linecap="round" stroke-linejoin="round" />
      <path d={arm} fill="none" stroke={L.shirt} stroke-width="10" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="4.6" fill={hc} />
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
      <EmoteArt kind={emoteKind} x={headOnly ? 84 : 88} y={sp === 'rabbit' ? -18 : -9} {animate} hold={emoteHold} />
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
