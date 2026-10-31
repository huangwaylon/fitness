<script lang="ts">
  // Visitors (docs/design.md "Visitors"), after NH: K.K. Slider with his guitar on Saturday nights, Daisy Mae on Sunday
  // mornings, Wisp floating by on some nights (see-through, a slow bob), Gulliver washed up asleep on the beach on some
  // days. They stand (or lie, or float) on the front beach, measured clear of every control (else a little to the side,
  // else not at all). A tap gives a line in the speech balloon (no trading, no ベル); K.K. plays a short song if the
  // music is on (his tune ducks it, ♪ float up). Official renders (static/art/villagers/, cached on first use).
  // SceneTaps mounts this inside the stage and asks it about each tap after the care (`tap`). `?visitor=<id>` (dev or
  // ?demo) brings one now.
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { t } from '#lib/i18n/index.ts';
  import { jst, minuteNow } from '#lib/time/clock.ts';
  import { addDays, localDateAt } from '#lib/time/dates.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { sound } from '#lib/sound/sound.svelte.ts';
  import { sceneSfx } from './sceneTaps.ts';
  import { clearAt, guardsU, stageGeo } from './placement.ts';
  import { ISLAND_SEED } from './beach.ts';
  import { VISITORS, visitorAt, visitorLine, type VisitorId } from './visitors.ts';

  interface Props {
    scene?: HTMLElement;
    enabled: () => boolean;
    /** Say a line in the speech balloon (IslandScene's Talk). */
    say?: (name: string, parts: string | string[], from: Element, o?: { colour?: string }) => void;
  }
  let { scene, enabled, say }: Props = $props();

  const q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
  const hooks = import.meta.env.DEV || q.has('demo');
  const seed = (hooks && q.get('seed')) || ISLAND_SEED;
  const want = hooks ? (q.get('visitor') as VisitorId | null) : null;
  const U = (n: number) => `calc(${n.toFixed(1)} * var(--su))`;

  /** How each stands: height (u), and its box above its foot (half-width, height) for the clearance check. */
  const LOOK: Record<VisitorId, { h: number; hw: number; up: number }> = {
    'kk-slider': { h: 48, hw: 15, up: 48 },
    'daisy-mae': { h: 48, hw: 16, up: 48 },
    wisp: { h: 30, hw: 16, up: 44 }, // floating: drawn a third of its height above the sand, bobbing
    gulliver: { h: 40, hw: 22, up: 14 } // lying down: the render turned on its side
  };

  const clock = $derived(minuteNow());
  const who = $derived.by<VisitorId | null>(() => {
    if (want && VISITORS.includes(want)) return want;
    const date = localDateAt(clock.getTime());
    const { hour, weekday } = jst(clock);
    return visitorAt(date, addDays(date, -1), hour, weekday, seed);
  });
  /** Where it stands this time (the front beach, the middle first), or null when the controls leave no room. */
  let spot = $state<{ x: number; y: number } | null>(null);
  $effect(() => {
    const id = who, g = stageGeo(scene);
    if (!id || !g) return void (spot = null);
    // clear of the controls themselves (their 6px tap padding may run over a head)
    const keep = guardsU(g, -5 * g.k), l = LOOK[id];
    const y = 349;
    spot = [195, 160, 230, 125, 265].map((x) => ({ x, y })).find((p) => clearAt(keep, p.x, p.y - l.up / 2, l.hw, l.up / 2)) ?? null;
  });

  let el = $state<HTMLElement>();
  /** Visitors who introduced themselves this session. */
  const met = new Set<VisitorId>();
  let last: string | undefined;
  let notes = $state(0);
  let notesTimer: ReturnType<typeof setTimeout> | undefined;
  $effect(() => () => clearTimeout(notesTimer));

  async function talk(id: VisitorId) {
    const target = el?.querySelector('.art');
    if (!target) return;
    sceneSfx('visitor');
    // their name tag in their own NH colour (the roster, loaded on the first visit's tap)
    const colour = (await import('#lib/villagers/roster.ts')).ROSTER[id]?.colour;
    const name = t(`visitor.${id}`);
    // K.K. plays when the music is on (his tune is a jingle: the hour's track ducks under it)
    if (id === 'kk-slider' && sound.settings.music) {
      met.add(id);
      cue('kk-song');
      notes++;
      clearTimeout(notesTimer);
      notesTimer = setTimeout(() => (notes = 0), 2600);
      return say?.(name, t('chat.sp.kk-slider.song'), target, { colour });
    }
    // the first tap of a visit: their introduction (a few pages, as NH's visitors open)
    if (!met.has(id)) {
      met.add(id);
      return say?.(name, t(`chat.sp.${id}.intro`), target, { colour });
    }
    last = visitorLine(id, Math.random, last);
    say?.(name, t(last), target, { colour });
  }

  /** A tap on the scene (client px), after the care: true when the visitor took it. */
  export function tap(px: number, py: number): boolean {
    const id = who, r = el?.querySelector('.art')?.getBoundingClientRect();
    if (!id || !r || !enabled()) return false;
    const pad = 8; // a finger's slack around the figure (px)
    if (px < r.left - pad || px > r.right + pad || py < r.top - pad || py > r.bottom + pad) return false;
    talk(id);
    return true;
  }
</script>

{#if who && spot}
  <div class="visitors" aria-hidden="true">
    <span class="visitor {who}" data-visitor={who} bind:this={el} style:translate="{U(spot.x)} {U(spot.y)}">
      <span class="art"><OfficialArt key={`villagers/${who}`} size={U(LOOK[who].h)} /></span>
      {#if notes}
        {#key notes}<span class="notes">{#each [0, 1, 2] as i (i)}<i style:--i={i}>♪</i>{/each}</span>{/key}
      {/if}
    </span>
  </div>
{/if}

<style>
  /* on the front beach: in front of the island's land and everyone on it (z 55, over the villagers' 51–52; they never
     overlap: the spot is measured clear), under the time-of-day tint */
  .visitors { position: absolute; inset: 0; z-index: 55; pointer-events: none; --su: calc(100cqw / 390); }
  .visitor { position: absolute; left: 0; top: 0; width: 0; height: 0; }
  .visitor > * { position: absolute; left: 0; top: 0; line-height: 0; }
  .art { translate: -50% -97%; filter: drop-shadow(0 2px 1.5px rgba(80, 60, 30, .3)); animation: arrive .6s ease-out both; }
  .art :global(.official) { max-width: none; }
  @keyframes arrive { from { opacity: 0; } }
  /* Gulliver: washed up, asleep on his side */
  .gulliver .art { translate: -50% -60%; rotate: -84deg; transform-origin: 50% 60%; }
  /* Wisp: see-through, floating a little above the sand with a slow bob, a soft glow */
  .wisp .art { translate: -50% -130%; opacity: .82; filter: drop-shadow(0 0 6px rgba(220, 235, 255, .9)); animation: arrive .6s ease-out both, float 3.2s ease-in-out infinite alternate; }
  @keyframes float { from { transform: translateY(0); } to { transform: translateY(calc(-4 * var(--su))); } }
  /* K.K.'s notes float up off his guitar */
  .notes { left: calc(8 * var(--su)); top: calc(-40 * var(--su)); }
  .notes i {
    position: absolute; font: 700 calc(12 * var(--su)) / 1 var(--font-ui); font-style: normal; color: #FFF6C8;
    text-shadow: 0 1px 2px rgba(60, 40, 20, .5); animation: note 1.8s ease-out calc(var(--i) * .45s) both;
  }
  @keyframes note {
    from { transform: translate(0, 0) rotate(-10deg); opacity: 0; } 20% { opacity: 1; }
    to { transform: translate(calc(10 * var(--su)), calc(-22 * var(--su))) rotate(12deg); opacity: 0; }
  }
</style>
