<script lang="ts">
  // A stand-in drawing of a human player from its look (the closet's swatches as flat colours), until the 3D player
  // (components/player3d createPlayer) and its portraits land. Only LookPreview and LookPortrait use it: swapping it out
  // touches nothing else. `head`: the portrait's crop (a コーデ chip, the せってい row).
  import type { PlayerLook } from '#lib/contract/look.ts';
  import { isOnepiece } from '#lib/contract/look.ts';
  import { swatchOf } from './closet.ts';

  let { look, head = false }: { look: PlayerLook; head?: boolean } = $props();

  const top = $derived(look.top ? swatchOf(look.top, '#e9e4d8') : '#f3efe6');
  const dress = $derived(isOnepiece(look.top));
  const legs = $derived(look.bottom ? swatchOf(look.bottom, '#55555c') : dress ? top : look.skin);
  const skirt = $derived(look.bottom?.startsWith('BottomsTexSkirt') ?? false);
  const long = $derived(look.bottom?.startsWith('BottomsTexSkirtLong') ?? false);
  const socks = $derived(look.socks ? swatchOf(look.socks, '#ffffff') : look.skin);
  const shoes = $derived(look.shoes ? swatchOf(look.shoes, '#333333') : look.skin);
  const glasses = $derived(look.glasses ? swatchOf(look.glasses, '#444444') : null);
  const bow = $derived(look.ornament ? swatchOf(look.ornament, '#e2506a') : null);
  /** Long hair falls behind the shoulders (the stand-in's guess from the id: ponytails and long cuts). */
  const longHair = $derived(['PlayerHair11', 'PlayerHair12', 'PlayerHair16', 'PlayerHair29'].includes(look.hair));
</script>

<svg class="fig" viewBox={head ? '10 2 60 52' : '0 0 80 120'} aria-hidden="true" data-figure>
  {#if !head}
    <!-- legs, socks, shoes -->
    <rect x="30" y="84" width="8" height="24" rx="3" fill={look.skin} />
    <rect x="42" y="84" width="8" height="24" rx="3" fill={look.skin} />
    <rect x="30" y="100" width="8" height="8" fill={socks} />
    <rect x="42" y="100" width="8" height="8" fill={socks} />
    {#if !skirt && !dress}
      <rect x="29" y="76" width="10" height={look.bottom?.includes('Half') || look.bottom?.includes('Hot') ? 12 : 26} rx="3" fill={legs} />
      <rect x="41" y="76" width="10" height={look.bottom?.includes('Half') || look.bottom?.includes('Hot') ? 12 : 26} rx="3" fill={legs} />
    {/if}
    <rect x="28" y="106" width="11" height="6" rx="3" fill={shoes} />
    <rect x="41" y="106" width="11" height="6" rx="3" fill={shoes} />
    <!-- body: a top over bottoms, or a dress -->
    {#if skirt || dress}
      <path d={`M28 74 L52 74 L${long ? 58 : 56} ${long ? 102 : 90} L${long ? 22 : 24} ${long ? 102 : 90} Z`} fill={dress ? top : legs} />
    {/if}
    <rect x="27" y="54" width="26" height={dress ? 24 : 26} rx="7" fill={top} />
    <rect x="19" y="56" width="9" height="20" rx="4" fill={top} />
    <rect x="52" y="56" width="9" height="20" rx="4" fill={top} />
    <circle cx="23.5" cy="78" r="3.5" fill={look.skin} />
    <circle cx="56.5" cy="78" r="3.5" fill={look.skin} />
  {/if}
  <!-- head -->
  {#if longHair}<rect x="21" y="18" width="38" height="36" rx="12" fill={look.hairColor} />{/if}
  <ellipse cx="40" cy="30" rx="19" ry="20" fill={look.skin} />
  <path d="M20 30 C20 10 60 10 60 30 C60 22 52 18 40 19 C30 18 22 22 20 30 Z" fill={look.hairColor} />
  <path d="M21 28 C22 16 34 12 40 13 C48 12 58 16 59 28 C54 22 48 21 40 22 C32 21 26 23 21 28 Z" fill={look.hairColor} />
  {#if bow}<path d="M50 12 l6 -4 v8 z M50 12 l-6 -4 v8 z" fill={bow} />{/if}
  <ellipse cx="33" cy="32" rx="2.4" ry="3.2" fill={look.eyeColor} />
  <ellipse cx="47" cy="32" rx="2.4" ry="3.2" fill={look.eyeColor} />
  {#if look.cheek !== 2}
    <ellipse cx="29" cy="38" rx="3" ry="1.8" fill="#f29a9a" opacity={look.cheek === 1 ? 0.55 : 0.9} />
    <ellipse cx="51" cy="38" rx="3" ry="1.8" fill="#f29a9a" opacity={look.cheek === 1 ? 0.55 : 0.9} />
  {/if}
  <path d={look.mouthFrame === 0 ? 'M37 41 Q40 43.5 43 41' : 'M36.5 40.5 Q40 46 43.5 40.5 Z'} fill={look.mouthFrame === 0 ? 'none' : '#a8443f'}
    stroke="#7a3a30" stroke-width="1.2" stroke-linecap="round" />
  {#if glasses}
    <g fill="none" stroke={glasses} stroke-width="1.4">
      <circle cx="33" cy="32" r="5" /><circle cx="47" cy="32" r="5" /><path d="M38 32 h4" />
    </g>
  {/if}
</svg>

<style>
  .fig { display: block; width: 100%; height: 100%; overflow: visible; }
</style>
