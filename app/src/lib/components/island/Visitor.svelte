<script lang="ts">
  // Visitors (docs/design.md "Visitors"), after NH: K.K. Slider with his guitar on Saturday nights, Daisy Mae on Sunday
  // mornings, Wisp floating by on some nights (see-through, a slow bob), Gulliver washed up asleep on the beach on some
  // days. They stand (or lie, or float) on the front beach, measured clear of every control (else a little to the side,
  // else not at all). A tap gives a line in the speech balloon (no trading, no ベル); K.K. plays one of his songs if the
  // music is on (sound/kk.ts: the island's music stops for it, ♪ float up). Official renders (static/art/villagers/, cached on first use).
  // On Halloween night (events.ts) Jack comes instead and asks for candy: 「キャンディを あげる」 delights him (joy, the
  // candy pops up over a spooky sparkle), 「なにも あげない」 earns his trick (my villager's face goes goofy for a minute:
  // `ontrick`). No inventory, no ベル.
  // SceneTaps mounts this inside the stage and asks it about each tap after the care (`tap`). `?visitor=<id>` (dev or
  // ?demo) brings one now.
  import { untrack } from 'svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { t } from '#lib/i18n/index.ts';
  import { jst, minuteNow, now } from '#lib/time/clock.ts';
  import { addDays, localDateAt } from '#lib/time/dates.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { playKK, sound, stopKK } from '#lib/sound/sound.svelte.ts';
  import { kkPick } from '#lib/sound/kk.ts';
  import { sceneSfx } from './sceneTaps.ts';
  import { clearAt, guardsU, stageGeo } from './placement.ts';
  import { ISLAND_SEED, zodiacOf } from './beach.ts';
  import { approach } from './avatar.ts';
  import { showerAt } from './meteor.ts';
  import { VISITORS, visitorAt, visitorLine, type VisitorId } from './visitors.ts';
  import { eventAt, forcedEvent } from './events.ts';
  import type { Choice } from './pager.ts';
  import { stretch } from '../motion/stretch.svelte.ts';

  interface Props {
    scene?: HTMLElement;
    enabled: () => boolean;
    /** Say a line in the speech balloon (IslandScene's Talk). */
    say?: (name: string, parts: string | string[], from: Element, o?: { colour?: string; choices?: Choice[] }) => void;
    /** Jack's trick, when he gets no candy (IslandScene: my villager's goofy face for a while). */
    ontrick?: () => void;
  }
  let { scene, enabled, say, ontrick }: Props = $props();

  const q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
  const hooks = import.meta.env.DEV || q.has('demo');
  const seed = (hooks && q.get('seed')) || ISLAND_SEED;
  const want = hooks ? (q.get('visitor') as VisitorId | null) : null;
  const force = forcedEvent();
  /** `?shower` (dev or ?demo): tonight is a meteor shower's night. */
  const forceShower = hooks && q.has('shower');
  const U = (n: number) => `calc(${n.toFixed(1)} * var(--su))`;

  /** How each stands: height (u), and its box above its foot (half-width, height) for the clearance check. */
  const LOOK: Record<VisitorId, { h: number; hw: number; up: number }> = {
    'kk-slider': { h: 48, hw: 15, up: 48 },
    'daisy-mae': { h: 48, hw: 16, up: 48 },
    wisp: { h: 30, hw: 16, up: 44 }, // floating: drawn a third of its height above the sand, bobbing
    gulliver: { h: 40, hw: 22, up: 14 }, // lying down: the render turned on its side
    jack: { h: 48, hw: 17, up: 48 },
    celeste: { h: 44, hw: 15, up: 44 }
  };
  /** Visitors outside the roster (an event's guest): their render and name-tag colour (Jack: his robe's purple). */
  const ART: Partial<Record<VisitorId, string>> = { jack: 'villagers/jack' };
  const TAG: Partial<Record<VisitorId, string>> = { jack: '#7A4FB8' };

  const clock = $derived(minuteNow());
  const who = $derived.by<VisitorId | null>(() => {
    if (want && VISITORS.includes(want)) return want;
    const date = localDateAt(clock.getTime());
    const { hour, weekday } = jst(clock);
    const prev = addDays(date, -1);
    return visitorAt(date, prev, hour, weekday, seed, eventAt(date, hour, force), showerAt(date, prev, hour, seed, forceShower));
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
  /** Group stretching: an awake visitor joins in on the villagers' beat (Gulliver sleeps through it). */
  const pose = $derived(who && who !== 'gulliver' ? stretch.pose : null);
  let bodyEl = $state<HTMLElement>();
  $effect(() => {
    const p = pose;
    void stretch.n;
    if (!bodyEl) return;
    bodyEl.removeAttribute('data-act');
    if (p) {
      void bodyEl.offsetWidth;
      bodyEl.setAttribute('data-act', p);
    }
  });
  /** Visitors who introduced themselves this session. */
  const met = new Set<VisitorId>();
  let last: string | undefined;
  let lastSong: string | undefined;
  let notes = $state(0);
  let notesTimer: ReturnType<typeof setTimeout> | undefined;
  $effect(() => () => clearTimeout(notesTimer));
  // his show is over (midnight) or the island is left: his song stops and the island's music comes back
  $effect(() => {
    const here = who === 'kk-slider';
    untrack(() => !here && stopKK());
    return () => untrack(stopKK);
  });
  /** Jack got his candy this session (then he just chats); `treat` replays his joy. */
  let treated = false;
  let treat = $state(0);
  let treatTimer: ReturnType<typeof setTimeout> | undefined;
  $effect(() => () => clearTimeout(treatTimer));

  /** Jack: trick or treat. His introduction (the first time) ends on the ask; after a treat, one of his lines. */
  function jack(name: string, target: Element, colour: string) {
    if (treated) {
      last = visitorLine('jack', Math.random, last);
      return say?.(name, t(last), target, { colour });
    }
    const parts = met.has('jack') ? [t('chat.sp.jack.ask')] : [t('chat.sp.jack.intro'), t('chat.sp.jack.ask')];
    met.add('jack');
    const again = () => el?.querySelector('.art');
    say?.(name, parts, target, {
      colour,
      choices: [
        { label: t('visitor.jack.give'), pick: () => {
          treated = true;
          cue('emote-joy');
          treat++;
          clearTimeout(treatTimer);
          treatTimer = setTimeout(() => (treat = 0), 2400);
          const a = again();
          if (a) say?.(name, t('chat.sp.jack.thanks'), a, { colour });
        } },
        { label: t('visitor.jack.none'), pick: () => {
          cue('emote-surprise');
          ontrick?.();
          const a = again();
          if (a) say?.(name, t('chat.sp.jack.trick'), a, { colour });
        } }
      ]
    });
  }

  async function talk(id: VisitorId) {
    const target = el?.querySelector('.art');
    if (!target) return;
    sceneSfx('visitor');
    // their name tag in their own NH colour (the roster, loaded on the first visit's tap)
    const name = t(`visitor.${id}`);
    if (id === 'jack') return jack(name, target, TAG.jack!);
    const colour = (await import('#lib/villagers/roster.ts')).ROSTER[id]?.colour;
    // K.K. plays when the music is on: one of his songs (sound/kk.ts) over the island's music, which comes back after
    // it; a tap while he plays doesn't restart it. Without song files, his short placeholder tune (a jingle).
    if (id === 'kk-slider' && sound.settings.music) {
      met.add(id);
      if (!sound.kk) {
        const song = kkPick(Math.random, lastSong);
        if (song && playKK(song.id)) lastSong = song.id;
        else cue('kk-song');
      }
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
    // Celeste names the season's sign (its zodiac fragment is the likelier one after tonight's wishes)
    const sign = zodiacOf(localDateAt(now().getTime())).replace(/-fragment$/, '');
    say?.(name, t(last, { sign: t(`zodiac.${sign}`) }), target, { colour });
  }

  /** A tap on the scene (client px), after the care: true when the visitor took it. */
  export function tap(px: number, py: number): boolean {
    const id = who, r = el?.querySelector('.art')?.getBoundingClientRect();
    if (!id || !r || !enabled()) return false;
    const pad = 8; // a finger's slack around the figure (px)
    if (px < r.left - pad || px > r.right + pad || py < r.top - pad || py > r.bottom + pad) return false;
    // my villager walks over to talk (avatar.ts); they speak once it's there
    const { ms } = spot ? approach(spot.x, spot.y) : { ms: 0 };
    clearTimeout(talkTimer);
    if (ms) talkTimer = setTimeout(() => talk(id), ms);
    else talk(id);
    return true;
  }
  let talkTimer: ReturnType<typeof setTimeout> | undefined;
  $effect(() => () => clearTimeout(talkTimer));
</script>

{#if who && spot}
  <div class="visitors" aria-hidden="true">
    <span class="visitor {who}" data-visitor={who} bind:this={el} style:translate="{U(spot.x)} {U(spot.y)}">
      <span class="art"><span class="body" bind:this={bodyEl}><OfficialArt key={ART[who] ?? `villagers/${who}`} size={U(LOOK[who].h)} /></span></span>
      {#if notes}
        {#key notes}<span class="notes">{#each [0, 1, 2] as i (i)}<i style:--i={i}>♪</i>{/each}</span>{/key}
      {/if}
      {#if treat}
        <!-- Jack's joy at a treat: the candy pops up over his head in a little spooky sparkle -->
        {#key treat}
          <span class="treat" data-treat>
            <span class="candy"><OfficialArt key="items/candy" size={U(22)} eager /></span>
            {#each [0, 1, 2, 3, 4] as i (i)}<i style:--i={i}></i>{/each}
          </span>
        {/key}
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
  /* group stretching: the same stretches as the villagers (tokens.css), from the feet */
  .body { display: block; transform-origin: 50% 100%; }
  .body:global([data-act='warmup']) { animation: if-warmup 2000ms ease-in-out both; }
  .body:global([data-act='sidebend']) { animation: if-sidebend 2000ms ease-in-out both; }
  .body:global([data-act='leap']) { animation: if-leap 2000ms ease-in-out both; }
  /* Gulliver: washed up, asleep on his side */
  .gulliver .art { translate: -50% -60%; rotate: -84deg; transform-origin: 50% 60%; }
  /* Wisp: see-through, floating a little above the sand with a slow bob, a soft glow */
  .wisp .art { translate: -50% -130%; opacity: .82; filter: drop-shadow(0 0 6px rgba(220, 235, 255, .9)); animation: arrive .6s ease-out both, float 3.2s ease-in-out infinite alternate; }
  @keyframes float { from { transform: translateY(0); } to { transform: translateY(calc(-4 * var(--su))); } }
  /* Jack's treat: the candy hops up over his pumpkin head, five orange and purple glints burst around it */
  .treat { left: 0; top: calc(-56 * var(--su)); }
  .candy :global(.official) { max-width: none; }
  .candy { position: absolute; translate: -50% -50%; line-height: 0; animation: candy 2.2s cubic-bezier(.3, 1.4, .5, 1) both; }
  @keyframes candy {
    from { transform: translateY(calc(10 * var(--su))) scale(.3); opacity: 0; } 18% { transform: none; opacity: 1; }
    80% { opacity: 1; } to { transform: translateY(calc(-6 * var(--su))); opacity: 0; }
  }
  .treat i {
    position: absolute; width: calc(5 * var(--su)); height: calc(5 * var(--su)); translate: -50% -50%; border-radius: 50%;
    background: var(--c, #FFB347); box-shadow: 0 0 calc(4 * var(--su)) var(--c, #FFB347);
    --a: calc(var(--i) * 72deg - 90deg); animation: glint 1.1s ease-out calc(.15s + var(--i) * .05s) both;
  }
  .treat i:nth-child(odd) { --c: #B98AF0; }
  @keyframes glint {
    from { transform: rotate(var(--a)) translateX(0) scale(.4); opacity: 0; } 30% { opacity: 1; }
    to { transform: rotate(var(--a)) translateX(calc(16 * var(--su))) scale(1); opacity: 0; }
  }
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
