<script lang="ts">
  // Visitors (docs/design.md "Visitors"), after NH: K.K. Slider with his guitar on Saturday nights, Daisy Mae on Sunday
  // mornings, Wisp floating by on some nights (see-through, a slow bob), Gulliver on some days. They stand on the centre
  // stage (CENTRE_STAGE: the plaza, where the jar stood) at the villagers' scale (each at their NH height relative to a
  // villager), with the same contact shadow; where a control still covers it, a smaller figure on the front beach;
  // else none. A tap: their introduction the first time, then one of their lines (no trading, no ベル).
  // K.K.'s show (NH's Saturday concert): with ミュージック on, a tap is his greeting and 「リクエストは あるかな？」
  // (リクエスト: a few of his songs to pick from; おまかせ: one at random); the island's music stops for the song
  // (sound/kk.ts, sound.svelte.ts playKK), he strums harder, ♪ float up, the villagers sway, a 「♪ title」 caption
  // shows; a tap meanwhile offers ストップ; at the end his sign-off and the island's music comes back. With no songs
  // he's still tuning his guitar. Official renders.
  // On Halloween night (events.ts) Jack comes instead and asks for candy: 「キャンディを あげる」 delights him (joy, the
  // candy pops up over a spooky sparkle), 「なにも あげない」 earns his trick (my villager's face goes goofy for a minute:
  // `ontrick`). No inventory, no ベル.
  // SceneTaps mounts this inside the stage and asks it about each tap (`tap`). `?visitor=<id>` (dev or ?demo) brings
  // one now.
  import { tick, untrack } from 'svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { i18n, t } from '#lib/i18n/index.ts';
  import { jst, minuteNow, now } from '#lib/time/clock.ts';
  import { addDays, localDateAt } from '#lib/time/dates.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { kkPick, kkTracks, type KKTrack } from '#lib/sound/kk.ts';
  import { playKK, sound, stopKK } from '#lib/sound/sound.svelte.ts';
  import { sceneSfx } from './sceneTaps.ts';
  import { clearAt, guardsU, place, stageGeo } from './placement.ts';
  import { ISLAND_SEED, zodiacOf } from './beach.ts';
  import { approach, presence } from './avatar.ts';
  import { showerAt } from './meteor.ts';
  import { CENTRE_STAGE, VILLAGER } from './scene.ts';
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

  /** NH heights relative to a villager (VILLAGER.h): K.K. stands about as tall, Daisy Mae is a child, Wisp a small
   *  ghost floating a little off the ground, Gulliver a tall seagull. */
  const REL: Record<VisitorId, number> = { 'kk-slider': 1, 'daisy-mae': 0.78, wisp: 0.7, gulliver: 1.1, jack: 1, celeste: 0.85 };
  /** Floating off the ground (u). */
  const FLOAT: Partial<Record<VisitorId, number>> = { wisp: 12 };
  /** The front beach's smaller figures, for when the centre stage is covered: height and half-width (u). */
  const BEACH: Record<VisitorId, { h: number; hw: number }> = {
    'kk-slider': { h: 48, hw: 15 }, 'daisy-mae': { h: 48, hw: 16 }, wisp: { h: 30, hw: 16 }, gulliver: { h: 44, hw: 18 }, jack: { h: 48, hw: 17 }, celeste: { h: 44, hw: 15 }
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
  /** Where it stands this time and how tall (u): the centre stage at its NH scale, else the beach, else nowhere. */
  let spot = $state<{ x: number; y: number; h: number; stage: boolean } | null>(null);
  $effect(() => {
    const id = who, g = stageGeo(scene);
    if (!id || !g) return void (spot = null);
    // clear of the controls themselves (their 6px tap padding may run over a head)
    const keep = guardsU(g, -5 * g.k);
    const h = VILLAGER.h * REL[id], up = h + (FLOAT[id] ?? 0);
    if (clearAt(keep, CENTRE_STAGE.x, CENTRE_STAGE.base - up / 2, h * 0.32, up / 2)) return void (spot = { x: CENTRE_STAGE.x, y: CENTRE_STAGE.base, h, stage: true });
    const b = BEACH[id], bup = b.h + (FLOAT[id] ? 9 : 0);
    const x = [195, 160, 230, 125, 265].find((x) => clearAt(keep, x, 349 - bup / 2, b.hw, bup / 2));
    spot = x === undefined ? null : { x, y: 349, h: b.h, stage: false };
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
  /** K.K.'s song playing now (sound.kk), and the caption's place (stage px). */
  const playing = $derived<KKTrack | null>(sound.kk ? (kkTracks.find((k) => k.id === sound.kk) ?? null) : null);
  let caption = $state<{ x: number; y: number; placed: boolean } | null>(null);
  let capEl = $state<HTMLElement>();
  /** The show this visit started (its sign-off comes when the song is over); the name tag's colour for it. */
  let ours: { id: string; colour?: string } | null = null;
  let lastSong: string | undefined;

  // The show sways the villagers (IslandScene: `.if-scene[data-show]`).
  $effect(() => {
    const s = scene, on = !!playing;
    s?.toggleAttribute('data-show', on);
    return () => s?.removeAttribute('data-show');
  });
  // the song is over (its end, ストップ, the music turned off): his sign-off, and the caption goes
  $effect(() => {
    const id = sound.kk;
    untrack(() => {
      if (id || !ours) return;
      const c = ours.colour;
      ours = null;
      caption = null;
      const a = art();
      if (a) say?.(t('visitor.kk-slider'), t('chat.sp.kk-slider.bye'), a, { colour: c });
    });
  });
  // his show is over (midnight) or the island is left: his song stops and the island's music comes back
  $effect(() => {
    const here = who === 'kk-slider';
    untrack(() => !here && stopKK());
    return () => untrack(stopKK);
  });

  const titleOf = (s: KKTrack) => (i18n.locale === 'en' ? s.en : s.ja);
  const art = () => el?.querySelector('.art') ?? null;

  /** K.K. plays `song`: the island's music stops for it; its end (or ストップ) brings his sign-off. */
  async function perform(song: KKTrack, colour?: string) {
    const target = art();
    if (!target) return;
    if (!playKK(song.id)) return say?.(t('visitor.kk-slider'), t('chat.sp.kk-slider.2'), target, { colour });
    ours = { id: song.id, colour };
    lastSong = song.id;
    // the 「♪ title」 caption: measured hidden, then placed by K.K. clear of every control
    caption = { x: 0, y: 0, placed: false };
    await tick();
    const st = scene?.querySelector('.stage')?.getBoundingClientRect(), c = capEl?.getBoundingClientRect(), a = target.getBoundingClientRect();
    if (!scene || !st || !c) return;
    const p = place(scene, c.width, c.height, a.left + a.width / 2, a.top, [{ x0: a.left, x1: a.right, y0: a.top, y1: a.bottom }]);
    caption = p ? { x: p.x - st.left, y: p.y - st.top, placed: true } : null;
  }

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
    const target = art();
    if (!target) return;
    sceneSfx('visitor');
    const name = t(`visitor.${id}`);
    if (id === 'jack') return jack(name, target, TAG.jack!);
    // their name tag in their own NH colour (the roster, loaded on the first visit's tap)
    const colour = (await import('#lib/villagers/roster.ts')).ROSTER[id]?.colour;
    if (id === 'kk-slider') {
      // mid-song: nothing disruptive, but he'll stop if asked
      if (playing)
        return say?.(name, t('chat.sp.kk-slider.playing'), target, { colour, choices: [
          { label: t('visitor.stop'), pick: stopKK }, { label: t('visitor.keep'), pick: () => {} }
        ] });
      if (sound.settings.music && kkTracks.length)
        return say?.(name, t('chat.sp.kk-slider.hello'), target, { colour, choices: [
          { label: t('visitor.request'), pick: () => request(colour) },
          { label: t('visitor.surprise'), pick: () => { const s = kkPick(Math.random, lastSong); if (s) void perform(s, colour); } }
        ] });
      if (sound.settings.music) return say?.(name, t('chat.sp.kk-slider.tuning'), target, { colour }); // no songs yet
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
  /** リクエスト: two of his songs to pick from, or 「ほかの 曲」 for two others (NH lets you name one). */
  function request(colour?: string, from: readonly KKTrack[] = []) {
    const target = art();
    if (!target) return;
    const rest = kkTracks.filter((s) => !from.includes(s));
    const pool = rest.length >= 2 ? rest : kkTracks;
    const two = [...pool].sort(() => Math.random() - 0.5).slice(0, 2);
    const more = kkTracks.length > 2 ? [{ label: t('visitor.other'), pick: () => request(colour, [...from, ...two]) }] : [];
    say?.(t('visitor.kk-slider'), t('chat.sp.kk-slider.which'), target, { colour, choices: [...two.map((s) => ({ label: titleOf(s), pick: () => void perform(s, colour) })), ...more] });
  }

  /** A tap on the scene (client px): true when the visitor took it. */
  export function tap(px: number, py: number): boolean {
    const id = who, r = art()?.getBoundingClientRect();
    if (!id || !r || !enabled()) return false;
    const pad = 8; // a finger's slack around the figure (px)
    if (px < r.left - pad || px > r.right + pad || py < r.top - pad || py > r.bottom + pad) return false;
    // my villager walks over to talk (avatar.ts); they speak once it's there (a tap meanwhile is the same tap)
    if (talkTimer) return true;
    const { ms } = spot ? approach(spot.x, spot.y) : { ms: 0 };
    if (!ms) {
      void talk(id);
      return true;
    }
    talkTimer = setTimeout(() => {
      talkTimer = undefined;
      void talk(id);
    }, ms);
    return true;
  }
  // centre stage and the shore in front of it are the visitor's while one is out (the villagers wander elsewhere)
  $effect(() => {
    presence.visitor = !!(who && spot);
    return () => (presence.visitor = false);
  });
  let talkTimer: ReturnType<typeof setTimeout> | undefined;
  $effect(() => () => clearTimeout(talkTimer));
</script>

{#if who && spot}
  <div class="visitors" class:beach={!spot.stage} aria-hidden="true">
    <span class="visitor {who}" class:show={!!playing} data-visitor={who} data-stage={spot.stage || undefined} bind:this={el}
      style:translate="{U(spot.x)} {U(spot.y)}" style:--h={U(spot.h)} style:--lift={U(spot.stage ? (FLOAT[who] ?? 0) : 0)}>
      <i class="shade"></i>
      <span class="art"><span class="body" bind:this={bodyEl}><OfficialArt key={ART[who] ?? `villagers/${who}`} size={U(spot.h)} /></span></span>
      {#if playing}<span class="notes">{#each [0, 1, 2] as i (i)}<i style:--i={i}>♪</i>{/each}</span>{/if}
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
{#if playing && caption}
  <span class="caption" class:placed={caption.placed} data-fx="kk-caption" bind:this={capEl} style:left="{caption.x}px" style:top="{caption.y}px">♪ {titleOf(playing)}</span>
{/if}

<style>
  /* on the centre stage: among the island's things (z 45: over the trees' row and the hedge, under the villagers 51–52;
     the spot is measured clear of every control), under the time-of-day tint; on the beach in front of everyone */
  .visitors { position: absolute; inset: 0; z-index: 45; pointer-events: none; --su: calc(100cqw / 390); }
  .visitors.beach { z-index: 55; }
  .visitor { position: absolute; left: 0; top: 0; width: 0; height: 0; }
  .visitor > * { position: absolute; left: 0; top: 0; line-height: 0; }
  .art { translate: -50% calc(-97% - var(--lift)); transform-origin: 50% 100%; animation: arrive .6s ease-out both; }
  .art :global(.official) { max-width: none; }
  @keyframes arrive { from { opacity: 0; } }
  /* group stretching: the same stretches as the villagers (tokens.css), from the feet */
  .body { display: block; transform-origin: 50% 100%; }
  .body:global([data-act='warmup']) { animation: if-warmup 2000ms ease-in-out both; }
  .body:global([data-act='sidebend']) { animation: if-sidebend 2000ms ease-in-out both; }
  .body:global([data-act='leap']) { animation: if-leap 2000ms ease-in-out both; }
  /* the villagers' contact shadow (IslandScene .vil .shadow): radial, surface-coloured, under the feet */
  .shade {
    display: block; width: calc(var(--h) * .6); height: calc(var(--h) * .12); translate: -50% -50%;
    background: radial-gradient(closest-side, var(--sh-c, rgba(60, 80, 30, .35)), color-mix(in srgb, var(--sh-c, rgba(60, 80, 30, .35)) 70%, transparent) 50%, transparent);
  }
  .wisp .shade { opacity: .45; scale: .7; }
  /* Wisp: see-through, floating with a slow bob, a soft glow */
  .wisp .art { opacity: .82; filter: drop-shadow(0 0 6px rgba(220, 235, 255, .9)); animation: arrive .6s ease-out both, float 3.2s ease-in-out infinite alternate; }
  @keyframes float { from { transform: translateY(0); } to { transform: translateY(calc(-4 * var(--su))); } }
  /* K.K.: a gentle head-bob as he strums; harder while he plays */
  .kk-slider .art { animation: arrive .6s ease-out both, strum 1.3s ease-in-out infinite alternate; }
  .kk-slider.show .art { animation: strum-hard .42s ease-in-out infinite alternate; }
  @keyframes strum { from { rotate: -1.5deg; } to { rotate: 1.5deg; } }
  @keyframes strum-hard { from { rotate: -3.5deg; transform: translateY(0); } to { rotate: 3.5deg; transform: translateY(calc(var(--h) * -.02)); } }
  /* the beach's fallback: Gulliver washed up, asleep on his side */
  .beach .gulliver .art { translate: -50% -60%; rotate: -84deg; transform-origin: 50% 60%; animation: arrive .6s ease-out both; }
  /* ♪ float up off his guitar while he plays */
  .notes { left: calc(var(--h) * .18); top: calc(var(--h) * -.62); }
  .notes i {
    position: absolute; font: 700 calc(var(--h) * .17) / 1 var(--font-ui); font-style: normal; color: #FFF6C8;
    text-shadow: 0 1px 2px rgba(60, 40, 20, .5); animation: note 1.8s ease-out calc(var(--i) * .6s) infinite;
  }
  @keyframes note {
    from { transform: translate(0, 0) rotate(-10deg); opacity: 0; } 20% { opacity: 1; }
    to { transform: translate(calc(var(--h) * .14), calc(var(--h) * -.3)) rotate(12deg); opacity: 0; }
  }
  /* Jack's treat: the candy hops up over his pumpkin head, five orange and purple glints burst around it */
  .treat { left: 0; top: calc(var(--h) * -1.1); }
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
  /* 「♪ title」 */
  .caption {
    position: absolute; z-index: var(--z-taps); translate: -50% -50%; padding: 5px 12px; border-radius: 999px; white-space: nowrap;
    background: rgba(255, 249, 227, .94); color: var(--c-ink, #4A3A2C); font: 700 13px/1.2 var(--font-ui); pointer-events: none;
    box-shadow: 0 2px 0 rgba(150, 110, 70, .3); animation: arrive .4s ease-out both;
  }
  .caption:not(.placed) { visibility: hidden; }
</style>
