// Sound for the app (docs/design.md#sound): the settings, the unlock on the first tap, the hourly music clock, the
// weather, the muffle under sheets and the pause in the background. App moments go through cue() (cues.ts);
// this module decides whether anything may sound at all. Nothing is created while every setting is off.
//   startSound({ muffled: () => ui.sheets.length > 0 })   // once, in the root layout
//   setSound({ music: true })                             // from a tap (the settings app)
//   sound.weather = 'rain'; sound.heavy = true                // set by the island's weather (island/weatherNow.svelte.ts)
//   waspMusic('chase') · playKK('kk-march')               // cut-ins over the island's music (events.ts, kk.ts)
//   setPlace('shop') · setPlace(null)                     // a building's room plays its own track (places.ts)
import { untrack } from 'svelte';
import type { SoundId } from './ids.ts';
import { Engine } from './engine.ts';
import type { Gesture } from './session.ts';
import { DEFAULT_SOUND, loadSound, sanitize, saveSound, silent, type SoundSettings } from './settings.ts';
import { AUDIO, hasMusic } from './manifest.ts';
import { msToNextHour, trackAt, type Fade, type MusicTrack, type Weather } from './hourly.ts';
import { eventMusicAt, msToNextEdge, type EventMusicId } from './events.ts';
import { radioJingleAt } from './radio.ts';
import { kkTitle, kkTrack, loadKK, type KKSource, type KKTrack } from './kk.ts';
import { pickMusic, placeTrack, type PlaceId } from './places.ts';
import { HourClock } from './session.ts';
import { ambientFor } from './ambient.ts';
import { DEVICE, localKV } from '#lib/sync/storage.ts';
import { dayKey, jst, now } from '#lib/time/clock.ts';
import { t } from '#lib/i18n/index.ts';
import { asset } from '$app/paths';

/** What the music is: the opening theme, the hour's track, an event's (events.ts, the wasps' too), a room's
 *  (places.ts), a K.K. song, or nothing. */
export type Playing = 'opening' | 'hour' | EventMusicId | PlaceId | 'kk' | null;

export const sound = $state<{ settings: SoundSettings; weather: Weather; heavy: boolean; playing: Playing; kk: { id: string; from: KKSource } | null }>({
  settings: { ...DEFAULT_SOUND },
  weather: 'sunny',
  /** A downpour: the rain bed louder (ambient.ts). */
  heavy: false,
  /** What the music is (for the settings' note and the Now Playing tile). */
  playing: null,
  /** The K.K. song playing (kk.ts id) and where from (K.K. on the island, or a room's stereo: its aircheck), else
   *  null. */
  kk: null
});

/** A track the engine should play: its key, whether it loops, and its fade (hourly.ts: a cut-in's quick swap). */
interface Want {
  key: string;
  track: MusicTrack;
  playing: Exclude<Playing, null>;
  loop: boolean;
  fade?: Fade;
}

/** A cut-in over the island's music, as in NH: the wasps' chase (loops until they're netted or sting), their sting
 *  (once) or a K.K. song (once). It ends by itself (a one-shot's end, CUT_IN_MAX_MS for the chase) or is cleared. */
let cutIn: (Want & { kk?: KKTrack; from?: KKSource; next?: EventMusicId[] }) | null = null;
let cutInTimer: ReturnType<typeof setTimeout> | undefined;
/** A chase the scene never ended (it went away mid-swarm) lets the island's music back after this long. */
const CHASE_MAX_MS = 6000;
/** The midnight jingle (events.ts intro) is heard once a day, on this phone: the Tokyo date it was, kept (a reload
 *  at 00:01 doesn't play it again). */
let introDay: string | null = null;
const introHeard = (day: string): boolean => introDay === day || localKV()?.getItem(DEVICE.newYearIntro) === day;
function hearIntro(day: string): void {
  introDay = day;
  try {
    localKV()?.setItem(DEVICE.newYearIntro, day);
  } catch {
    /* a full store: this session remembers */
  }
}

/** The building's room the player is in (places.ts; null: outdoors, or a room that keeps the island's music). */
let place: PlaceId | null = null;

let engine: Engine | null = null;
/** The opening theme is playing (or about to): the hourly track waits for it to end. */
let opening = false;
/** A sheet, the phone or the harvest covers the scene (from the layout). */
let coveredBy: () => boolean = () => false;
/** しずえ's daily announcement fires as the island opens, before any tap can unlock audio: it waits this long for the
 *  first tap (NH plays it as you step outside), then lapses. */
const ANNOUNCE_WAIT_MS = 15_000;
let announceAt = 0;

function eng(): Engine {
  if (!engine) {
    engine = new Engine();
    // a one-shot that ended, or one whose file couldn't play (it would never end): what it held back comes back
    engine.onended = engine.onfailed = (key) => {
      if (key === 'opening') opening = false;
      else if (cutIn?.key === key) {
        const next = cutIn.next ?? [];
        endCutIn();
        if (next.length && eventJingle(next)) return;
      }
      else if (key === 'event/happy-new-year') hearIntro(dayKey());
      else return;
      syncMusic();
    };
    // the context came back by itself (after a call or Siri): bring the music back without waiting for a tap
    engine.onrunning = () => engine?.track && syncMusic();
    // the opening is title music: it plays clear under the phone that started it
  }
  return engine;
}

const musicOn = (s: SoundSettings): boolean => s.music && hasMusic();
const anyOn = (s: SoundSettings): boolean => s.music || s.sfx;
/** Music can be heard now: ミュージック on with files, not muted, unlocked, in front. Cut-ins start and files are
 *  fetched ahead only then. */
const audible = (): boolean => musicOn(sound.settings) && sound.settings.volume > 0 && !!engine?.ctx && !document.hidden;

/** Inside a user gesture: start audio (or wake it after iOS suspended it, or restart a track something outside
 *  paused or the browser refused to start) if any setting wants it (session.ts gestureAction). Any tap does it, on
 *  a control or on plain scenery: a scenery tap sounds on pointerdown, which on a touch screen isn't a user
 *  activation, so it only gets the context going (that tap's sound is scheduled), and the pointerup or touchend
 *  unlocks the rest. Never waits for a click (iOS fires none on plain scenery). */
function unlock(ev?: Event): void {
  const s = sound.settings;
  if (typeof window === 'undefined' || silent(s)) return;
  const e = eng();
  const music = musicOn(s);
  const act = e.gesture((ev?.type ?? 'click') as Gesture, music);
  if (act === 'none') return; // nothing waits, or only the decks: that's the pointerup's / touchend's job
  const activation = act === 'full';
  e.unlock(music, activation);
  apply();
  if (!activation) return;
  if (Date.now() - announceAt < ANNOUNCE_WAIT_MS) void e.whenReady().then(() => play('chime'));
  announceAt = 0;
}

function apply(): void {
  const e = engine;
  if (!e?.ctx) return;
  const s = sound.settings;
  e.setLevels(s);
  if (!anyOn(s)) e.sleep();
  else if (s.volume <= 0) {
    // muted, not off: the track keeps its place; a cut-in (a K.K. song, its caption) ends, as nobody hears it
    if (cutIn) endCutIn();
    e.hush();
    const ms = mediaSession();
    if (ms?.metadata) ms.playbackState = 'paused';
  } else {
    e.resume();
    syncMusic();
  }
}

/** The island's own music at an instant: the event's track on an event day (its midnight jingle first, once), else
 *  the Tokyo hour's. Cut-ins (the wasps, K.K.) come on top of it. */
function musicAt(d: Date): Want | null {
  const ev = eventMusicAt(d, sound.weather);
  const intro = ev?.intro && AUDIO.events[ev.intro];
  if (ev?.intro && intro && !introHeard(dayKey(d))) return { key: `event/${ev.intro}`, track: intro, playing: ev.intro, loop: false };
  const id = ev && (AUDIO.events[ev.id] ? ev.id : ev.alt && AUDIO.events[ev.alt] ? ev.alt : null);
  if (id) return { key: `event/${id}`, track: AUDIO.events[id]!, playing: id, loop: true };
  const tr = trackAt(d, sound.weather, AUDIO.music);
  return tr && { key: tr.key, track: tr, playing: 'hour', loop: true };
}

/** The room's track (null: outdoors, or the room has no file, so the island's music goes on). */
function placeMusic(): Want | null {
  const tr = placeTrack(place, AUDIO.places);
  return tr && { key: `place/${tr.id}`, track: tr, playing: tr.id, loop: true };
}

/** What plays under a cut-in: the room's track indoors, else the island's (places.ts pickMusic). */
const baseAt = (d: Date): Want | null => pickMusic({ place: placeMusic(), island: musicAt(d) });

/** What the settings' note and the Now Playing tile say about the music (null: none). A K.K. song's title is the
 *  cut-in's. */
export function playingLabel(playing: Playing, hour: number): string | null {
  if (playing === 'opening') return t('sound.opening');
  if (playing === 'hour') return t('sound.nowPlaying', { hour });
  if (playing === 'kk') {
    const k = cutIn?.kk;
    return k ? t(cutIn?.from === 'aircheck' ? 'sound.nowPlayingAircheck' : 'sound.nowPlayingTitle', { title: kkTitle(k) }) : null;
  }
  return playing ? t('sound.nowPlayingTitle', { title: t(`sound.title.${playing}`) }) : null;
}

function endCutIn(): void {
  clearTimeout(cutInTimer);
  cutIn = null;
  sound.kk = null;
  engine?.pin([]);
}

/** Start a cut-in (when ミュージック can sound) and play it at once. False: it can't sound now. */
function startCutIn(want: NonNullable<typeof cutIn>, maxMs?: number): boolean {
  if (!audible() || !engine) return false;
  clearTimeout(cutInTimer);
  // the opening outranks a cut-in (pickMusic): a cut-in asked for now ends it, as a tap past NH's title screen
  opening = false;
  const d = now();
  cutIn = want;
  sound.kk = want.kk && want.from ? { id: want.kk.id, from: want.from } : null;
  // keep what it interrupted (indoors the room's and the island's: coming back, or leaving the room meanwhile, starts
  // at once), the next of a chain (Franklin's done after his start) and, during the chase, the sting that may follow
  const keep = [placeMusic(), musicAt(d), want.next?.[0] && AUDIO.events[want.next[0]], want.playing === 'bee-chase' && AUDIO.events['bee-stung']];
  engine.pin([...new Set(keep.flatMap((w) => (!w ? [] : 'track' in w ? [w.track.file] : [w.file])))]);
  if (maxMs) cutInTimer = setTimeout(() => cutIn === want && (endCutIn(), syncMusic()), maxMs);
  syncMusic();
  return true;
}

/** The music and ambience that should sound now: the opening while it plays, a cut-in, else the island's (musicAt).
 *  `fade`: how a change fades (hourly.ts; a cut-in's own is its quick swap). */
function syncMusic(fade: Fade = 'hour'): void {
  const e = engine;
  if (!e?.ctx || document.hidden) return;
  const s = sound.settings;
  if (!s.music || !anyOn(s)) {
    opening = false;
    if (cutIn) endCutIn();
    sound.playing = null;
    e.stopMusic();
    e.release(); // the files go once the fade is over (nothing plays them: no memory held for hours off)
    void e.setAmbient([]);
    nowPlaying(null);
    return;
  }
  if (s.volume <= 0) {
    if (cutIn) endCutIn(); // muted: everything holds where it is, but a cut-in nobody hears is over
    return;
  }
  e.muffle(coveredBy() && !opening);
  const d = now();
  const { hour, month } = jst(d);
  const island = musicAt(d), inside = placeMusic();
  const want = pickMusic<Want>({ opening: opening && AUDIO.opening ? { key: 'opening', track: AUDIO.opening, playing: 'opening', loop: false } : null, cutIn, place: inside, island });
  // indoors, the island's file stays (leaving starts it at once); a cut-in pins its own
  if (!cutIn) e.pin(want === inside && island ? [island.track.file] : []);
  sound.playing = want?.playing ?? null;
  void e.setTrack(want?.key ?? null, want?.track ?? null, want?.loop, want?.fade ?? fade);
  nowPlaying(playingLabel(sound.playing, hour));
  void e.setAmbient(ambientFor(hour, month, sound.weather, { heavy: sound.heavy }));
}

const mediaSession = (): MediaSession | null => (typeof navigator !== 'undefined' && 'mediaSession' in navigator ? navigator.mediaSession : null);

/** The Media Session (the lock screen's and Control Center's Now Playing tile). Under the 'playback' session iOS may
 *  show one for the music deck. Its ▶ and ⏸ are ours: ▶ only resumes while the app is in front (never
 *  music from a pocket), ⏸ holds the track until the next tap in the app. The tile is named after the tune with the
 *  app's icon, so it isn't a bare URL; no seeking or skipping. */
function initMediaSession(): void {
  const ms = mediaSession();
  if (!ms) return;
  const handle = (a: MediaSessionAction, f: MediaSessionActionHandler | null) => {
    try {
      ms.setActionHandler(a, f);
    } catch {
      /* this action isn't supported */
    }
  };
  handle('play', () => {
    if (document.hidden || !engine?.ctx || silent(sound.settings)) return void (ms.playbackState = 'paused');
    engine.unhold();
    engine.resume();
    syncMusic();
  });
  const hold = () => {
    engine?.holdMusic();
    ms.playbackState = 'paused';
  };
  handle('pause', hold);
  handle('stop', hold);
  for (const a of ['seekbackward', 'seekforward', 'seekto', 'previoustrack', 'nexttrack'] as const) handle(a, null);
}

/** What the Now Playing tile says (null: no music). */
function nowPlaying(title: string | null): void {
  const ms = mediaSession();
  if (!ms) return;
  if (!title) {
    ms.metadata = null;
    ms.playbackState = 'none';
    return;
  }
  const name = title.replace(/^♪\s*/, '');
  if (ms.metadata?.title !== name && typeof MediaMetadata === 'function') {
    ms.metadata = new MediaMetadata({ title: name, artist: t('app.name'), artwork: [{ src: asset('icons/icon-512.webp'), sizes: '512x512', type: 'image/webp' }] });
  }
  ms.playbackState = document.hidden ? 'paused' : 'playing';
}

/** Ahead of the first tap (needs no context): the renderer, and the hour's track when ミュージック is on. */
function prefetchFirst(): void {
  const s = sound.settings;
  if (silent(s)) return;
  const e = eng();
  e.warm();
  const tr = musicOn(s) && !e.ctx ? baseAt(now()) : null;
  if (tr) e.prefetch(tr.track.file);
}

/** The next hour's track a minute early (only while it could play: visible, ミュージック on and audible), and the change
 *  on the hour. Stopped while hidden (onHide), so nothing is fetched and kept for hours nobody hears. */
const hourClock = new HourClock(
  now,
  (at) => {
    const tr = audible() && baseAt(at);
    if (tr) engine?.prefetch(tr.track.file);
  },
  syncMusic,
  undefined,
  (d) => Math.min(msToNextHour(d), msToNextEdge(d) ?? Infinity)
);

/** Change settings (from a tap: that tap unlocks audio). Turning a kind on previews it: 効果音 a confirm, ミュージック
 *  the opening theme before the hour's track (NH's title screen). */
export function setSound(patch: Partial<SoundSettings>): void {
  const prev = sound.settings;
  const next = sanitize({ ...prev, ...patch });
  sound.settings = next;
  saveSound(localKV(), next);
  opening = next.music && (opening || (!prev.music && !!AUDIO.opening));
  unlock();
  apply();
  const e = engine;
  if (!e) return;
  if (next.sfx && !prev.sfx) void e.whenReady().then(() => play('confirm'));
}

/** The scene is covered (world cues wait; cues.ts). */
export const covered = (): boolean => coveredBy();

/** Play an effect if 効果音 is on (cues.ts is the usual way in). */
export function play(id: SoundId, o?: { gain?: number; rate?: number; delay?: number }): void {
  const s = sound.settings;
  if (s.volume <= 0 || !s.sfx) return;
  if (id === 'chime' && engine?.needsUnlock(false) !== false) announceAt = Date.now();
  // the announcement opens with the radio jingle of the moment (radio.ts; its file, else the broadcast's, else the chime)
  else engine?.play(id === 'chime' ? radioJingleAt(now()) : id, o);
}

/** The wasps (island/TreeShakes.svelte), as in NH: `nest` (it fell: fetch the chase ahead), `chase` (they're out:
 *  Chased by Bees cuts in over the island's music and loops), `caught` (netted: the island's music comes straight
 *  back), `stung` (Stung by Bees, once, then the island's music fades back in). Only with ミュージック on. */
export function waspMusic(phase: 'nest' | 'chase' | 'caught' | 'stung'): void {
  const chase = AUDIO.events['bee-chase'], stung = AUDIO.events['bee-stung'];
  if (phase === 'nest') {
    if (chase && audible()) engine?.prefetch(chase.file);
  } else if (phase === 'chase') {
    if (chase) startCutIn({ key: 'event/bee-chase', track: chase, playing: 'bee-chase', loop: true, fade: 'cut' }, CHASE_MAX_MS);
  } else if (cutIn?.playing === 'bee-chase') {
    // caught or stung: the chase ends either way
    endCutIn();
    if (phase === 'stung' && stung && startCutIn({ key: 'event/bee-stung', track: stung, playing: 'bee-stung', loop: false, fade: 'cut' })) return;
    const base = baseAt(now());
    if (base && engine?.ctx) void engine.setTrack(base.key, base.track, base.loop, 'cut');
    syncMusic();
  }
}

/** K.K. plays song `id` (kk.ts loadKK's list) over the island's music, which stops for it and comes back after (NH's
 *  show): `source` `live` K.K. on his stool, `aircheck` a room's stereo (the song's aircheck, else its live file).
 *  Only with ミュージック on and audio unlocked (call it from a tap). `sound.kk` is the song and its source while it
 *  plays. False: it can't sound now (no such song, the list not loaded yet, music off, locked or muted). */
export function playKK(id: string, source: KKSource = 'live'): boolean {
  void loadKK();
  const k = kkTrack(id, source);
  return !!k && startCutIn({ key: `kk/${source}/${id}`, track: k.track, playing: 'kk', loop: false, fade: 'cut', kk: k.song, from: source });
}

/** Fetch a song ahead (offered by K.K.'s リクエスト, pressed in a stereo's list), when ミュージック can sound. */
export function prefetchKK(id: string, source: KKSource = 'live'): void {
  const k = audible() && kkTrack(id, source);
  if (k) engine?.prefetch(k.track.file);
}

/** The island's own cut-ins (events.ts): `aerobics` for the stretch, `happy-birthday` at the cake, Franklin's cooking,
 *  Festivale's dance. A one-shot plays once (a list: one after another), a loop until `maxMs`; then the island's music
 *  fades back. Only with ミュージック on, audio unlocked and the file there: false, and the caller plays its effect. */
export function eventJingle(ids: EventMusicId | EventMusicId[], maxMs?: number): boolean {
  const [id, ...next] = Array.isArray(ids) ? ids : [ids];
  const tr = AUDIO.events[id];
  return !!tr && startCutIn({ key: `event/${id}`, track: tr, playing: id, loop: !!maxMs, fade: 'cut', next }, maxMs);
}

/** Stop an island cut-in early (the stretch left or cut short: TapeDeck): the island's music fades back in. */
export function stopJingle(id: EventMusicId): void {
  if (cutIn?.playing !== id) return;
  endCutIn();
  syncMusic();
}

/** Stop a K.K. song early (the show ends, a stereo's tapped off, the room is left): the island's music fades back
 *  in. `source`: only a song from there (leaving the tent never stops K.K.'s own, nor he a stereo's). */
export function stopKK(source?: KKSource): void {
  if (!cutIn?.kk || (source && cutIn.from !== source)) return;
  endCutIn();
  syncMusic();
}

/** The player is in a building's room (places.ts PlaceId), or back out (null): through the door the room's track
 *  replaces the island's with the door's short fade (hourly.ts DOOR, under the door's black), and leaving hands back
 *  the same way; between a building's rooms (the museum's wings) the hour's crossfade. A room without a file keeps the
 *  island's music. Only a value: nothing is created or fetched while ミュージック is off. */
export function setPlace(id: PlaceId | null): void {
  if (place === id) return;
  const door = (place === null) !== (id === null);
  place = id;
  syncMusic(door ? 'door' : 'hour');
}

/** Fetch a room's track ahead (its door tapped: the door's black covers the fetch), when ミュージック can sound. */
export function prefetchPlace(id: PlaceId): void {
  const tr = audible() && placeTrack(id, AUDIO.places);
  if (tr) engine?.prefetch(tr.file);
}

/** Once, in the root layout. `muffled`: a sheet, the phone or the harvest is up (the music goes soft and dull under
 *  it, as under NH's menus). The weather's arrangement and rain follow the island's weather (`?weather=` forces one in
 *  dev or `?demo`: island/weatherNow.svelte.ts). Returns the cleanup. */
export function startSound(o: { muffled: () => boolean }): () => void {
  coveredBy = o.muffled;
  sound.settings = loadSound(localKV());
  const gestures = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'] as const;
  for (const g of gestures) document.addEventListener(g, unlock, { capture: true, passive: true });
  initMediaSession();
  // the renderer is pure and small: fetch it ahead of the first tap when a setting is on (nothing loads while off);
  // with ミュージック on, the hour's file too, so the first tap anywhere starts it inside that tap (no fetch to wait for)
  const first = silent(sound.settings) ? undefined : setTimeout(prefetchFirst, 1000);
  const onHide = () => {
    hourClock.stop();
    engine?.pause();
    const ms = mediaSession();
    if (ms && ms.playbackState !== 'none') ms.playbackState = 'paused';
  };
  const onVisible = () => {
    if (document.hidden) return onHide();
    hourClock.start(); // even before the first tap: the tap's syncMusic needs the hour change after it
    if (!engine?.ctx || silent(sound.settings)) return;
    engine.resume();
    syncMusic();
  };
  // pagehide / pageshow: a bfcache restore, or a pagehide without a visibilitychange first (a fast reload)
  const onPageShow = (e: PageTransitionEvent) => e.persisted && onVisible();
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('pagehide', onHide);
  window.addEventListener('pageshow', onPageShow);
  const stopEffects = $effect.root(() => {
    // Under a sheet the music goes muffled. The opening theme is NH's title screen: closing the phone it started in
    // is "pressing A", and the island's hour takes over with the usual crossfade.
    let was = false;
    $effect(() => {
      const m = o.muffled();
      untrack(() => {
        if (was && !m && opening) {
          opening = false;
          syncMusic();
        }
        was = m;
        engine?.muffle(m && !opening);
      });
    });
    $effect(() => {
      void sound.weather;
      void sound.heavy;
      untrack(syncMusic);
    });
  });
  hourClock.start();
  return () => {
    clearTimeout(first);
    for (const g of gestures) document.removeEventListener(g, unlock, { capture: true });
    document.removeEventListener('visibilitychange', onVisible);
    window.removeEventListener('pagehide', onHide);
    window.removeEventListener('pageshow', onPageShow);
    stopEffects();
    hourClock.stop();
    engine?.pause();
  };
}
