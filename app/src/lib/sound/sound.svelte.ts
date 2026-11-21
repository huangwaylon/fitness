// Sound for the app (docs/design.md#sound): the settings, the floor (a video, the mic, the room, a sheet over the
// scene) and the way in to the player (player.svelte.ts: the engine, the music, the unlock), which is its own chunk,
// never in the first load: loaded at launch when a setting is on, else at the first tap (so a setting turned on in that
// session finds it there, its tap the unlock). App moments go through cue() (cues.ts); until the player is here a call
// is the nothing it would be without a context (an effect, a prefetch), or remembered (the room, the floor, しずえ's
// announcement). Nothing is created while every setting is off.
//   startSound({ muffled: () => ui.sheets.length > 0 })   // once, in the root layout
//   setSound({ music: true })                             // from a tap (the settings app)
//   sound.weather = 'rain'; sound.heavy = true            // set by the island's weather (island/weatherNow.svelte.ts)
//   waspMusic('chase')                                    // a cut-in of my own over the island's music (events.ts)
//   (the shared stages: K.K., the stereos, stage.svelte.ts request / hush; the player plays the one where I am)
//   eventJingle(['turkey-cooking-start', …])             // a cut-in of my own (events.ts CutInId: Franklin's)
//   setPlace('shop') · setPlace(null)                     // a building's room plays its own track (places.ts)
import type { SoundId } from './ids.ts';
import type { Weather } from './hourly.ts';
import type { CutInId } from './events.ts';
import type { KKSource } from './kk.ts';
import type { PlaceId } from './places.ts';
import type { Playing } from './choose.ts';
import { DEFAULT_SOUND, loadSound, sanitize, saveSound, silent, type SoundSettings } from './settings.ts';
import { setAudioSession } from './audioSession.ts';
import { localKV } from '#lib/sync/storage.ts';

export const sound = $state<{ settings: SoundSettings; weather: Weather; heavy: boolean; shift: number; playing: Playing; unlocked: boolean }>({
  settings: { ...DEFAULT_SOUND },
  weather: 'sunny',
  /** How far (ms) the island's music runs from the clock: the island's look shows another day or time of day (設定 →
   *  季節, island/weatherNow.svelte.ts: its event's music, its hour's track and ambience); 0, the clock's. */
  shift: 0,
  /** A downpour: the rain bed louder (ambient.ts). */
  heavy: false,
  /** What the music is (for the settings' note and the Now Playing tile). */
  playing: null,
  /** Audio is unlocked (a tap made the context): a shared stage's song can be heard (else its caption says 🔇). */
  unlocked: false
});

/** What the player reads, kept here so it holds before the player loads. `video`: a video has the floor (English
 *  Study's lesson); `mic`: the mic has it (the speech test); `place`: the building's room I'm in (places.ts; null:
 *  outdoors); `covered`: a sheet, the phone or the harvest covers the scene (world cues wait; the music muffled). */
export const floor = { video: false, mic: false, place: null as PlaceId | null, covered: (): boolean => false };

type Player = typeof import('./player.svelte.ts');
let player: Player | null = null;
let loading: Promise<Player> | null = null;
/** startSound's options while started (the player starts with them once loaded), and the player's cleanup. */
let started: { muffled: () => boolean } | null = null;
let stopPlayer: (() => void) | null = null;
/** しずえ's announcement asked for before the player loaded (its time). */
let announceAt = 0;

function load(): Promise<Player> {
  return (loading ??= import('./player.svelte.ts').then((p) => {
    player = p;
    if (announceAt) p.heldAnnounce(announceAt);
    if (started) stopPlayer = p.startSound(started);
    p.refocus();
    return p;
  }));
}

/** A tap anywhere (capture, from the launch): the player's unlock, or (sound off) its load, so a setting turned on later
 *  finds it here and its tap unlocks. */
function gesture(ev: Event): void {
  if (player) player.unlock(ev);
  else void load();
}

/** A shared stage's song can be heard on this phone (ミュージック on with files, not muted, a tap made the context):
 *  reactive (sound.settings, sound.unlocked), for a caption's 🔇. */
export const musicHeard = (): boolean => sound.unlocked && !!player && player.musicHeard();
/** A tap that picked a song wants to hear it: ミュージック on here if it's off (K.K.'s pick, a stereo's). */
export function wantMusic(): void {
  if (!sound.settings.music) setSound({ music: true });
}

/** A video has the floor (English Study's lesson): the island's audio paused and kept so (no tap, return or lock-screen
 *  ▶ resumes it), and iOS's audio session 'playback', so the clip plays with the Ring/Silent switch on silent (under
 *  the island's 'ambient' the page's session silenced the embed too). Off: 'ambient' again, and the island's sound as
 *  it was. */
export function videoFocus(on: boolean): void {
  if (floor.video === on) return;
  floor.video = on;
  if (on) {
    player?.refocus();
    setAudioSession('playback');
    return;
  }
  setAudioSession(floor.mic ? 'play-and-record' : 'ambient');
  player?.refocus();
}

/** The mic has the floor (the speech test, docs/speech-test.md): iOS's audio session 'play-and-record' (WebKit refuses
 *  getUserMedia under 'ambient' or 'playback': "AudioSession category is not compatible with audio capture"), the
 *  island's audio paused and no effect sounding, till off: then the session it had and the island's sound as it was.
 *  On before the mic is asked for, in the same tap. Returns the session's type before (null: no audioSession). */
let micWas: string | null = null;
export function micFocus(on: boolean): string | null {
  if (floor.mic === on) return micWas;
  floor.mic = on;
  if (on) {
    player?.refocus();
    return (micWas = setAudioSession('play-and-record'));
  }
  setAudioSession(floor.video ? 'playback' : 'ambient');
  player?.refocus();
  return micWas;
}

/** The island's AudioContext's state ('none': not made yet), for the speech test's log. */
export const audioState = (): string => player?.audioState() ?? 'none';

/** ミュージック can be heard now (on, 音量 above 0, unlocked, in front): else a moment's song plays its effect. */
export const hearsMusic = (): boolean => !!player && player.hearsMusic();

/** What the music deck plays now and how far in (s), and where the stage's song is meant to be (the e2e's look,
 *  window.__music: player.svelte.ts musicNow). */
export const musicNow = (): { key: string | null; pos: number | null; sched: number | null } => player?.musicNow() ?? { key: null, pos: null, sched: null };

/** Change settings (from a tap: that tap unlocks audio). Turning a kind on previews it: 効果音 a confirm, ミュージック
 *  the opening theme before the hour's track (NH's title screen). Before the player is here (a setting turned on
 *  before any tap): kept, and played once it loads. */
export function setSound(patch: Partial<SoundSettings>): void {
  if (player) return player.setSound(patch);
  const prev = sound.settings;
  const next = sanitize({ ...prev, ...patch });
  sound.settings = next;
  saveSound(localKV(), next);
  if (!silent(next)) void load().then((p) => p.settingsChanged(prev));
}

/** The scene is covered (world cues wait; cues.ts). */
export const covered = (): boolean => floor.covered();

/** Play an effect if 効果音 is on (cues.ts is the usual way in). */
export function play(id: SoundId, o?: { gain?: number; rate?: number; delay?: number }): void {
  player?.play(id, o);
}

/** しずえ's announcement (cue 'announce'): the radio jingle of the moment. Fired as the island opens, before any tap:
 *  it waits for the first one (player.svelte.ts ANNOUNCE_WAIT_MS). */
export function announce(o?: { gain?: number }): void {
  if (player) return player.announce(o);
  const s = sound.settings;
  if (s.volume > 0 && s.sfx) announceAt = Date.now();
}

/** The wasps (island/treeShakes.svelte.ts): player.svelte.ts waspMusic. Only with ミュージック on. */
export function waspMusic(phase: 'nest' | 'chase' | 'caught' | 'stung'): void {
  player?.waspMusic(phase);
}

/** Fetch a song ahead (offered by K.K.'s リクエスト, pressed in a stereo's list), when ミュージック can sound. */
export function prefetchKK(id: string, source: KKSource = 'live'): void {
  player?.prefetchKK(id, source);
}

/** Let go of the songs fetched ahead (a stereo's list closed). */
export function dropPrefetched(): void {
  player?.dropPrefetched();
}

/** A cut-in of my own (events.ts CutInId): player.svelte.ts eventJingle. False: it can't sound now (no player yet
 *  either), and the caller plays its effect. */
export function eventJingle(ids: CutInId | CutInId[], loopMs?: number): boolean {
  return !!player && player.eventJingle(ids, loopMs);
}

/** The player is in a building's room (places.ts PlaceId), or back out (null): its track plays there
 *  (player.svelte.ts setPlace). Only a value till the player is here. */
export function setPlace(id: PlaceId | null): void {
  if (player) player.setPlace(id);
  else floor.place = id;
}

/** Fetch a room's track ahead (its door tapped), when ミュージック can sound. */
export function prefetchPlace(id: PlaceId): void {
  player?.prefetchPlace(id);
}

/** Once, in the root layout. `muffled`: a sheet, the phone or the harvest is up. The gesture listeners go on now (before
 *  the taps' own, startTaps, so a tap's unlock runs first); the player loads now if a setting is on, else at the first
 *  tap. Returns the cleanup. */
export function startSound(o: { muffled: () => boolean }): () => void {
  floor.covered = o.muffled;
  started = o;
  sound.settings = loadSound(localKV());
  const gestures = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'] as const;
  for (const g of gestures) document.addEventListener(g, gesture, { capture: true, passive: true });
  if (player) stopPlayer = player.startSound(o);
  else if (!silent(sound.settings)) void load();
  return () => {
    for (const g of gestures) document.removeEventListener(g, gesture, { capture: true });
    started = null;
    stopPlayer?.();
    stopPlayer = null;
  };
}
