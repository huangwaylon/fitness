<script lang="ts">
  // K.K. Slider on his stool (docs/design.md "K.K. Slider"; island/kkSlider.ts): he lives on the island now, every
  // day, on the layout's `kk-stool` piece (moved and turned in the editor), NH's own model sitting on it, facing its
  // way (world3d/villagers.ts, slot `kk`, the director's actor `kk`). The node here is his tap area, his balloon's
  // anchor, his emotes and fx. What he's up to goes by the clock (kkSlider.ts kkMode; `?kk=show|day|asleep` in dev or
  // ?demo):
  //  - show (Saturday 18:00–24:00, NH's concert): a tap is his greeting and 「リクエストは あるかな？」 (リクエスト: a few
  //    of his songs to pick from; おまかせ: one at random); the song is the island's music stage's (sound/stage.svelte.ts
  //    request('isl'): every phone hears it from the same point, docs/sound-sync.md), the island's music stopping for it
  //    (his live file); he strums harder, ♪ float up, the villagers sway, a 「♪ title」 caption shows (🔇 タップで きく
  //    where it can't be heard: ミュージック off, or no tap yet); a tap meanwhile offers ストップ (for everyone) and, unheard
  //    here, きく; at the end his sign-off on every phone and the island's music comes back
  //  - day: he strums quietly to himself (a nod now and then, no sound); a tap is a chat that offers a song all the same
  //  - asleep (00:00–06:00): nodded off on his stool, zzz; a tap wakes him groggily and he offers one all the same
  //    (awake while it plays, back to sleep after)
  // Anyone may ask or stop him, any time (A, B, the guest: nothing here goes by who's tapping), whatever ミュージック is:
  // picking a song turns it on on that phone (the tap that asked for a song wants to hear it). A song plays to its end
  // (or ストップ), past midnight and with nobody left outdoors. With no songs yet he's tuning his guitar.
  import { tick, untrack } from 'svelte';
  import { shuffle } from '#lib/random.ts';
  import Emote from '../characters/Emote.svelte';
  import Fx from '../characters/Fx.svelte';
  import { villagerEmote, type EmoteIcon } from '#lib/art.ts';
  import { actors, addFx, cancel, place as placeActor, removeFx, setEmote, setMotion } from '../motion/director.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import { jst, minuteNow } from '#lib/time/clock.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { kkPick, kkTitle, loadKK, type KKTrack } from '#lib/sound/kk.ts';
  import { prefetchKK, setSound, sound } from '#lib/sound/sound.svelte.ts';
  import { cutInOf, hush, live, request as requestSong } from '#lib/sound/stage.svelte.ts';
  import { count } from '#lib/sync/log.ts';
  import { tall3d } from '../villager3d/manifest.ts';
  import { sceneSfx } from './sceneTaps.ts';
  import { place } from './placement.ts';
  import { hookOneOf } from './devHooks.ts';
  import { presence, turnTo } from './avatar.ts';
  import { su, VILLAGER } from './scene.ts';
  import { site } from './site.svelte.ts';
  import { useWorld } from './camera.svelte.ts';
  import { KK_MODES, KK_SEAT, kkAct, kkBye, kkEmote, kkGreeting, kkMode, kkSpot, type KKMode } from './kkSlider.ts';
  import type { Choice } from './pager.ts';

  interface Props {
    scene?: HTMLElement;
    enabled: () => boolean;
    /** Say a line in the speech balloon (IslandScene's Talk). */
    say?: (name: string, parts: string | string[], from: Element, o?: { colour?: string; choices?: Choice[]; ondone?: () => void }) => void;
  }
  let { scene, enabled, say: rawSay }: Props = $props();

  const w = useWorld();
  const ID = 'kk-slider';
  /** His name tag's colour (the roster's: white). */
  const COLOUR = '#FFFFFF';
  /** His figure seated (u): the stool's seat, and him on it (a seated figure ~0.8 of his height). */
  const H = tall3d(ID) || VILLAGER.h;
  const TOP = KK_SEAT + H * 0.8;

  const clock = $derived(minuteNow());
  const mode = $derived<KKMode>(hookOneOf('kk', KK_MODES) ?? ((j) => kkMode(j.weekday, j.hour))(jst(clock)));
  const spot = $derived((void site.rev, site.layout ? kkSpot(site.layout) : null));
  const st = actors.kk;

  // the director's actor where he sits (a look's, a motion's, an fx's); asleep: dozing, his zzz
  $effect(() => {
    const s = spot;
    if (!s) return;
    untrack(() => {
      placeActor('kk', s.x, s.z);
      st.home = [s.x, s.z];
      st.face = 'home';
    });
  });
  $effect(() => () => untrack(() => cancel('kk')));

  /** A line of his is in the balloon (until it closes, or 20 s at most: another speaker may replace it). */
  let speakingUntil = 0;
  const speaking = () => Date.now() < speakingUntil;
  function say(parts: string | string[], from: Element, o: { choices?: Choice[] } = {}) {
    speakingUntil = Date.now() + 20_000;
    rawSay?.(t('visitor.kk-slider'), parts, from, { colour: COLOUR, ...o, ondone: () => (speakingUntil = 0) });
  }

  /** His songs (kk.ts: their own chunk, loaded as he first shows). */
  let kkTracks = $state.raw<readonly KKTrack[]>([]);
  $effect(() => void loadKK().then((l) => (kkTracks = l.tracks)));
  /** His song playing now (the island stage's, for everyone: an island cut-in isn't his), and whether this phone can't
   *  hear it (ミュージック off or muted, or no tap yet). */
  const onStage = $derived(live('isl'));
  const playing = $derived<KKTrack | null>(onStage && !cutInOf(onStage.song) ? (kkTracks.find((k) => k.id === onStage.song) ?? null) : null);
  const unheard = $derived(!sound.settings.music || sound.settings.volume <= 0 || !sound.unlocked);
  /** Dozing: asleep by the clock and not playing (woken for a song, he's up till it's over). */
  const dozing = $derived(mode === 'asleep' && !playing);
  $effect(() => {
    const asleep = dozing;
    untrack(() => {
      st.asleep = asleep;
      if (asleep && !st.fx.some((f) => f.kind === 'zzz')) addFx('kk', 'zzz');
      if (!asleep) st.fx = st.fx.filter((f) => f.kind !== 'zzz');
    });
  });
  /** The caption's place (stage px). */
  let caption = $state<{ x: number; y: number; placed: boolean } | null>(null);
  let capEl = $state<HTMLElement>();
  /** The song the caption is for (its sign-off comes when it's over), and the last one he played. */
  let shown: string | null = null;
  let lastSong: string | undefined;

  // idle life's beat (presence.kk, the visitor's slot: the same PRNG on both phones): a strum, an emote, a snore
  let lastEmote: EmoteIcon | null = null;
  function beat(r: () => number) {
    if (!spot || !enabled()) return;
    const act = kkAct(mode, { speaking: speaking(), playing: !!playing }, r);
    if (act === 'strum') {
      setMotion('kk', 'nod');
      if (mode === 'show' || playing) addFx('kk', 'notes');
    } else if (act === 'emote') {
      const e = kkEmote(mode, r, lastEmote);
      if (e) setEmote('kk', (lastEmote = e));
    } else if (act === 'snore') {
      setMotion('kk', 'twitch');
      if (!st.fx.some((f) => f.kind === 'zzz')) addFx('kk', 'zzz');
    }
  }
  $effect(() => {
    presence.kk = beat;
    return () => {
      if (presence.kk === beat) presence.kk = null;
    };
  });

  // his song sways the villagers (IslandScene: `.if-scene[data-show]`)
  $effect(() => {
    const s = scene, on = !!playing;
    s?.toggleAttribute('data-show', on);
    return () => s?.removeAttribute('data-show');
  });
  // a song starts (anyone's): its caption; it's over (its end, anyone's ストップ): his sign-off, and the caption goes
  $effect(() => {
    const id = playing?.id ?? null;
    untrack(() => {
      if (id === shown) return;
      const was = shown;
      shown = id;
      if (id) {
        lastSong = id;
        setMotion('kk', 'nod');
        return void placeCaption();
      }
      caption = null;
      const a = art();
      if (was && a) say(t(kkBye(mode)), a);
    });
  });

  let el = $state<HTMLElement>();
  const art = () => el?.querySelector('.art') ?? null;

  /** He plays `song` for everyone (from the pick's tap): ミュージック turned on here if it's off (asking him for a song
   *  is asking to hear it); the island's music stops for it; its end (or ストップ) brings his sign-off. */
  function perform(song: KKTrack) {
    if (!art()) return;
    if (!sound.settings.music) setSound({ music: true });
    count(`act:kk.song.${mode}`);
    requestSong('isl', song.id);
  }

  /** The 「♪ title」 caption: measured hidden, then placed by him clear of every control. */
  async function placeCaption() {
    const target = art();
    if (!target) return;
    caption = { x: 0, y: 0, placed: false };
    await tick();
    const sb = scene?.querySelector('.stage')?.getBoundingClientRect(), c = capEl?.getBoundingClientRect(), a = target.getBoundingClientRect();
    if (!scene || !sb || !c) return;
    const p = place(scene, c.width, c.height, a.left + a.width / 2, a.top, [{ x0: a.left, x1: a.right, y0: a.top, y1: a.bottom }]);
    caption = p ? { x: p.x - sb.left, y: p.y - sb.top, placed: true } : null;
  }

  /** リクエスト: two of his songs to pick from, or 「ほかの 曲」 for two others (NH lets you name one). */
  function request(from: readonly KKTrack[] = []) {
    const target = art();
    if (!target) return;
    const rest = kkTracks.filter((s) => !from.includes(s));
    const pool = rest.length >= 2 ? rest : kkTracks;
    const two = shuffle([...pool], Math.random).slice(0, 2);
    for (const s of two) prefetchKK(s.id, 'live'); // the pick then starts at once
    const more = kkTracks.length > 2 ? [{ label: t('visitor.other'), pick: () => request([...from, ...two]) }] : [];
    say(t('chat.sp.kk-slider.which'), target, { choices: [...two.map((s) => ({ label: kkTitle(s), pick: () => perform(s) })), ...more] });
  }

  function talk() {
    const target = art();
    if (!target) return;
    sceneSfx('visitor');
    count(`act:kk.tap.${mode}`);
    // mid-song: nothing disruptive, but he'll stop if asked (for everyone); unheard here, きく turns ミュージック on
    if (playing) {
      const listen = unheard ? [{ label: t('visitor.listen'), pick: () => setSound({ music: true }) }] : [];
      return say(t('chat.sp.kk-slider.playing'), target, { choices: [...listen, { label: t('visitor.stop'), pick: () => hush('isl') }, { label: t('visitor.keep'), pick: () => {} }] });
    }
    const g = kkGreeting(mode, kkTracks.length > 0);
    if (!g.asks) return say(t(g.key), target);
    say(t(g.key), target, { choices: [
      { label: t('visitor.request'), pick: () => request() },
      { label: t('visitor.surprise'), pick: () => { const s = kkPick(Math.random, lastSong, kkTracks); if (s) perform(s); } }
    ] });
  }

  /** A tap on the scene (client px): true when he took it (on his figure, on screen). */
  let talkTimer: ReturnType<typeof setTimeout> | undefined;
  $effect(() => () => clearTimeout(talkTimer));
  export function tap(px: number, py: number): boolean {
    const a = art(), s = spot;
    if (!a || !s || !enabled()) return false;
    // on screen: in view, his feet clear of the horizon (a speck sunk behind it is out of reach)
    if (!w.inView(s.x, s.z, 20) || w.screenAt(s.x, s.z).sy <= w.view.horizon + 24) return false;
    const pad = 8, r = a.getBoundingClientRect(); // (a finger's slack round the figure, px)
    if (px < r.left - pad || px > r.right + pad || py < r.top - pad || py > r.bottom + pad) return false;
    // in place (only a tap on empty ground walks): my villager turns to him, he looks up (a nod; a start, asleep)
    if (talkTimer) return true;
    turnTo(s.x);
    if (dozing) cue('villager-tap');
    setMotion('kk', dozing ? 'twitch' : 'nod');
    speakingUntil = Date.now() + 20_000;
    talkTimer = setTimeout(() => {
      talkTimer = undefined;
      talk();
    }, TURN_MS);
    return true;
  }
  /** The nod before a line (ms). */
  const TURN_MS = 600;
  // (an emote shows a moment, as the visitors' do)
  const emote = $derived(st.emote ? villagerEmote(st.emote) : null);
</script>

{#if spot}
  <!-- one world node at his feet (camera.svelte.ts): the 3D island draws his model sitting on the stool there (v3), the
       node's .art his tap area and his balloon's anchor -->
  <span class="kk" aria-hidden="true" {@attach w.at({ x: spot.x, z: spot.z, h: TOP + 40, inv: true,
        m3: playing ? { key: '', emit: { kind: 'notes', every: 1100, lift: TOP * 0.9 }, art: () => el?.querySelector('.notes') } : null,
        v3: { id: ID, actor: 'kk', seat: KK_SEAT, yaw: spot.yaw, lift: () => 0, prone: () => false, away: () => false, asleep: () => dozing } })}
      class:show={!!playing} data-kk={mode} data-motion={st.motion ?? undefined} bind:this={el} style:--h={su(TOP)}>
      <span class="art"></span>
      <!-- emotes and fx over the head -->
      <span class="over">
        {#if emote}<span class="emote">{#key st.emoteN}<Emote id={emote} size="var(--emote-size, 40px)" bare />{/key}</span>{/if}
        {#each st.fx as f (f.n)}
          <span class="fxa {f.kind}"><Fx kind={f.kind} dir={f.kind === 'zzz' ? -1 : 1} spread="calc(var(--h) * .55)" ondone={() => removeFx('kk', f.n)} /></span>
        {/each}
      </span>
      {#if playing}<span class="notes">{#each [0, 1, 2] as i (i)}<i style:--i={i}>♪</i>{/each}</span>{/if}
  </span>
{/if}
{#if playing && caption}
  <span class="caption if-caption" class:placed={caption.placed} data-fx="kk-caption" data-unheard={unheard || undefined} bind:this={capEl} style:left="{caption.x}px" style:top="{caption.y}px">♪ {kkTitle(playing)}{#if unheard}{` 🔇 ${t('sound.tapToHear')}`}{/if}</span>
{/if}

<style>
  /* the feet at the node's origin (camera.svelte.ts places it among the island's things); taps go to the scene
     (SceneTaps asks `tap`) */
  .kk { width: 0; height: 0; transform-origin: 0 0; pointer-events: none; }
  .kk > * { position: absolute; left: 0; top: 0; line-height: 0; }
  /* the tap area and the balloon's anchor: him seated on the stool (~0.6 as wide as tall) */
  .art { display: block; width: calc(var(--h) * .6); height: var(--h); translate: -50% -100%; }
  .over { left: 0; top: calc(-1 * var(--h)); width: 0; height: 0; }
  .emote { position: absolute; left: 0; bottom: 2px; translate: calc(-50% + var(--h) * .14) 0; line-height: 0; }
  .fxa { position: absolute; left: 0; top: calc(var(--h) * .04); width: 0; height: 0; }
  .fxa.zzz { left: calc(var(--h) * -.12); top: calc(var(--h) * .1); }
  .fxa.notes { left: calc(var(--h) * .18); top: calc(var(--h) * .12); }
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
  :global(.if-scene:is([data-covered], [data-paused])) .kk .notes i { animation-play-state: paused; }
  /* 「♪ title」 */
  .caption { z-index: var(--z-taps); translate: -50% -50%; animation: kk-appear .4s ease-out both; }
  .caption:not(.placed) { visibility: hidden; }
  @keyframes kk-appear { from { opacity: 0; transform: scale(.85); } 60% { opacity: 1; transform: scale(1.04); } to { opacity: 1; transform: none; } }
</style>
