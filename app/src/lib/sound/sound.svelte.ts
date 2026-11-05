// Sound for the app (docs/design.md#sound): the settings, the unlock on the first tap, the hourly music clock, the
// weather, the muffle under sheets and the pause in the background. App moments go through cue() (cues.ts);
// this module decides whether anything may sound at all; what plays is choose.ts's. Nothing is created while every
// setting is off.
//   startSound({ muffled: () => ui.sheets.length > 0 })   // once, in the root layout
//   setSound({ music: true })                             // from a tap (the settings app)
//   sound.weather = 'rain'; sound.heavy = true            // set by the island's weather (island/weatherNow.svelte.ts)
//   waspMusic('chase') · playKK('kk-march') · stopKK()    // cut-ins over the island's music (events.ts, kk.ts)
//   eventJingle('happy-birthday') · stopJingle('aerobics') // the island's own cut-ins (events.ts CutInId)
//   setPlace('shop') · setPlace(null)                     // a building's room plays its own track (places.ts)
import { untrack } from 'svelte';
import type { SoundId } from './ids.ts';
import { Engine } from './engine.ts';
import { HourClock, type Gesture } from './session.ts';
import { DEFAULT_SOUND, loadSound, sanitize, saveSound, silent, type SoundSettings } from './settings.ts';
import { AUDIO, hasMusic } from './manifest.ts';
import { msToNextHour, type Fade, type Weather } from './hourly.ts';
import { msToNextEdge, type CutInId } from './events.ts';
import { radioJingleAt } from './radio.ts';
import { kkTrack, loadKK, type KKSource } from './kk.ts';
import { placeTrack, type PlaceId } from './places.ts';
import { musicAt, openingMusic, pickMusic, pinsFor, placeMusic, playingLabel as labelOf, type CutIn, type Playing } from './choose.ts';
import { initMediaSession, nowPlaying, tilePaused } from './mediaSession.ts';
import { ambientFor } from './ambient.ts';
import { DEVICE, localKV } from '#lib/sync/storage.ts';
import { dayKey, jst, now } from '#lib/time/clock.ts';

export const sound = $state<{ settings: SoundSettings; weather: Weather; heavy: boolean; playing: Playing; kk: { id: string; from: KKSource } | null }>({
  settings: { ...DEFAULT_SOUND },
  weather: 'sunny',
  /** A downpour: the rain bed louder (ambient.ts). */
  heavy: false,
  /** What the music is (for the settings' note and the Now Playing tile). */
  playing: null,
  /** The K.K. song playing (kk.ts id) and where from (K.K. on the island, or a room's stereo: its aircheck). */
  kk: null
});

/** The cut-in playing (choose.ts CutIn): it ends by itself (a one-shot's end, a loop's `loopMs`) or is cleared. */
let cutIn: CutIn | null = null;
let cutInTimer: ReturnType<typeof setTimeout> | undefined;
/** A chase the scene never ended (it went away mid-swarm) lets the island's music back after this long. */
const CHASE_MAX_MS = 6000;
/** The building's room the player is in (places.ts; null: outdoors). */
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

/** The midnight jingle (events.ts intro) is heard once a day on this phone: the Tokyo date it was, kept (a reload at
 *  00:01 doesn't play it again). */
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

const island = (d: Date) => musicAt(d, sound.weather, AUDIO, introHeard);
const room = () => placeMusic(place, AUDIO);
/** What plays under a cut-in (and is fetched ahead): the room's track indoors, else the island's. */
const baseAt = (d: Date) => pickMusic({ place: room(), island: island(d) });

/** A one-shot ended, or a track couldn't play (a one-shot would never end): what it held back comes back. */
function ended(key: string): void {
  switch (key === cutIn?.key ? 'cut-in' : key) {
    case 'opening':
      opening = false;
      break;
    case 'cut-in': {
      const next = cutIn!.next ?? [];
      endCutIn();
      if (next.length && eventJingle(next)) return;
      break;
    }
    case 'event/happy-new-year':
      hearIntro(dayKey());
      break;
    default:
      return; // a loop's: nothing waits on it
  }
  syncMusic();
}

function eng(): Engine {
  if (!engine) {
    engine = new Engine();
    engine.onended = engine.onfailed = ended;
    // the context came back by itself (after a call or Siri): bring the music back without waiting for a tap
    engine.onrunning = () => engine?.track && syncMusic();
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
  if (Date.now() - announceAt < ANNOUNCE_WAIT_MS) void e.whenReady().then(() => announce());
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
    tilePaused();
  } else {
    e.resume();
    syncMusic();
  }
}

/** What the settings' note and the Now Playing tile say about the music (null: none). */
export const playingLabel = (playing: Playing, hour: number): string | null => labelOf(playing, hour, cutIn);

function endCutIn(): void {
  clearTimeout(cutInTimer);
  cutIn = null;
  sound.kk = null;
}

/** Start a cut-in (when ミュージック can sound) and play it at once; a loop ends after `loopMs`. False: it can't
 *  sound now. */
function startCutIn(want: CutIn, loopMs?: number): boolean {
  if (!audible()) return false;
  clearTimeout(cutInTimer);
  // the opening outranks a cut-in (pickMusic): a cut-in asked for now ends it, as a tap past NH's title screen
  opening = false;
  cutIn = want;
  sound.kk = want.kk && want.from ? { id: want.kk.id, from: want.from } : null;
  if (loopMs) cutInTimer = setTimeout(() => cutIn === want && (endCutIn(), syncMusic()), loopMs);
  syncMusic();
  return true;
}

/** The music and ambience that should sound now (choose.ts pickMusic: the opening while it plays, a cut-in, the
 *  room's, the island's), and what stays fetched (pinsFor). `fade`: how a change fades (a cut-in's own is its swap). */
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
  const out = island(d), inside = room();
  const want = pickMusic({ opening: opening ? openingMusic(AUDIO) : null, cutIn, place: inside, island: out });
  e.pin(pinsFor({ cutIn, place: inside, island: out, files: AUDIO }));
  sound.playing = want?.playing ?? null;
  void e.setTrack(want?.key ?? null, want?.track ?? null, want?.loop, want?.fade ?? fade);
  nowPlaying(playingLabel(sound.playing, hour));
  void e.setAmbient(ambientFor(hour, month, sound.weather, { heavy: sound.heavy }));
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

/** The next hour's track a minute early (only while it could be heard), and the change on the hour. Stopped while
 *  hidden (onHide), so nothing is fetched and kept for hours nobody hears. */
const hourClock = new HourClock(
  now,
  (at) => {
    const tr = audible() && baseAt(at);
    if (tr) engine?.prefetch(tr.track.file);
  },
  () => syncMusic(),
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
  if (engine && next.sfx && !prev.sfx) void engine.whenReady().then(() => play('confirm'));
}

/** The scene is covered (world cues wait; cues.ts). */
export const covered = (): boolean => coveredBy();

/** Play an effect if 効果音 is on (cues.ts is the usual way in). */
export function play(id: SoundId, o?: { gain?: number; rate?: number; delay?: number }): void {
  const s = sound.settings;
  if (s.volume > 0 && s.sfx) engine?.play(id, o);
}

/** しずえ's announcement (cue 'announce'): the radio jingle of the moment (radio.ts; without its file the PA chime).
 *  Fired as the island opens, before any tap: it waits for the first one (ANNOUNCE_WAIT_MS). */
export function announce(o?: { gain?: number }): void {
  const s = sound.settings;
  if (s.volume <= 0 || !s.sfx) return;
  if (!engine || engine.needsUnlock(false)) announceAt = Date.now();
  else engine.play(radioJingleAt(now()), o);
}

/** The wasps (island/TreeShakes.svelte), as in NH: `nest` (it fell: fetch the chase ahead), `chase` (they're out:
 *  Chased by Bees cuts in over the island's music and loops), `caught` (netted: the island's music comes straight
 *  back), `stung` (Stung by Bees, once, then the island's music fades back in). Only with ミュージック on. */
export function waspMusic(phase: 'nest' | 'chase' | 'caught' | 'stung'): void {
  const chase = AUDIO.events['bee-chase'];
  if (phase === 'nest') {
    if (chase && audible()) engine?.prefetch(chase.file);
  } else if (phase === 'chase') eventJingle('bee-chase', CHASE_MAX_MS);
  else if (cutIn?.id === 'bee-chase') {
    // caught or stung: the chase ends either way
    endCutIn();
    if (phase === 'stung' && eventJingle('bee-stung')) return;
    syncMusic('cut');
  }
}

/** K.K. plays song `id` (kk.ts loadKK's list) over the island's music, which stops for it and comes back after (NH's
 *  show): `source` `live` K.K. on his stool, `aircheck` a room's stereo (the song's aircheck, else its live file).
 *  Only with ミュージック on and audio unlocked (call it from a tap). False: it can't sound now (no such song, the
 *  list not loaded yet, music off, locked or muted). */
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

/** The island's own cut-ins (events.ts CutInId): `aerobics` for the stretch, `happy-birthday` at the cake, Franklin's
 *  cooking, the wasps'. A one-shot plays once (a list: one after another); with `loopMs` it loops that long. Then the
 *  island's music fades back. Only with ミュージック on, audio unlocked and the file there: false, and the caller plays
 *  its effect. */
export function eventJingle(ids: CutInId | CutInId[], loopMs?: number): boolean {
  const [id, ...next] = Array.isArray(ids) ? ids : [ids];
  const tr = AUDIO.events[id];
  return !!tr && startCutIn({ key: `event/${id}`, track: tr, playing: id, id, loop: !!loopMs, fade: 'cut', next }, loopMs);
}

/** Stop an island cut-in early (the stretch left or cut short: TapeDeck): the island's music fades back in. */
export function stopJingle(id: CutInId): void {
  if (cutIn?.id !== id) return;
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
  initMediaSession({
    // ▶: only in front, with a kind on; ⏸ (and ⏹): the track holds until a tap in the app
    play: () => {
      if (document.hidden || !engine?.ctx || silent(sound.settings)) return tilePaused();
      engine.unhold();
      engine.resume();
      syncMusic();
    },
    hold: () => {
      engine?.holdMusic();
      tilePaused();
    }
  });
  // the renderer is pure and small: fetch it ahead of the first tap when a setting is on (nothing loads while off);
  // with ミュージック on, the hour's file too, so the first tap anywhere starts it inside that tap (no fetch to wait for)
  const first = silent(sound.settings) ? undefined : setTimeout(prefetchFirst, 1000);
  const onHide = () => {
    hourClock.stop();
    engine?.pause();
    tilePaused();
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
      untrack(() => syncMusic());
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
