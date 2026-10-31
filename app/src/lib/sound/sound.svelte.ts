// Sound for the app (docs/design.md#sound): the settings, the unlock on the first tap, the hourly music clock, the
// weather, the muffle under sheets and the pause in the background. App moments go through cue() (cues.ts);
// this module decides whether anything may sound at all. Nothing is created while every setting is off.
//   startSound({ muffled: () => ui.sheets.length > 0 })   // once, in the root layout
//   setSound({ music: true })                             // from a tap (the settings app)
//   sound.weather = 'rain'; sound.heavy = true                // set by the island's weather (island/weatherNow.svelte.ts)
//   waspMusic('chase') · playKK('kk-march')               // cut-ins over the island's music (events.ts, kk.ts)
import { untrack } from 'svelte';
import type { SoundId } from './ids.ts';
import { Engine } from './engine.ts';
import type { Gesture } from './session.ts';
import { DEFAULT_SOUND, loadSound, sanitize, saveSound, silent, type SoundSettings } from './settings.ts';
import { AUDIO, hasMusic } from './manifest.ts';
import { trackAt, type MusicTrack, type Weather } from './hourly.ts';
import { eventMusicAt, type EventMusicId } from './events.ts';
import { kkTracks } from './kk.ts';
import { HourClock } from './session.ts';
import { ambientFor } from './ambient.ts';
import { localKV } from '#lib/sync/storage.ts';
import { dayKey, jst, now } from '#lib/time/clock.ts';
import { i18n, t } from '#lib/i18n/index.ts';
import { asset } from '$app/paths';

/** What the music is: the opening theme, the hour's track, an event's (events.ts, the wasps' too), a K.K. song, or
 *  nothing. */
export type Playing = 'opening' | 'hour' | EventMusicId | 'kk' | null;

export const sound = $state<{ settings: SoundSettings; weather: Weather; heavy: boolean; playing: Playing; kk: string | null }>({
  settings: { ...DEFAULT_SOUND },
  weather: 'sunny',
  /** A downpour: the rain bed louder (ambient.ts). */
  heavy: false,
  /** What the music is (for the settings' note and the Now Playing tile). */
  playing: null,
  /** The K.K. song playing (kk.ts id), else null. */
  kk: null
});

/** A track the engine should play: its key, whether it loops, and `cut` for a cut-in's quick swap. */
interface Want {
  key: string;
  track: MusicTrack;
  playing: Exclude<Playing, null>;
  loop: boolean;
  cut?: boolean;
}

/** A cut-in over the island's music, as in NH: the wasps' chase (loops until they're netted or sting), their sting
 *  (once) or a K.K. song (once). It ends by itself (a one-shot's end, CUT_IN_MAX_MS for the chase) or is cleared. */
let cutIn: (Want & { kk?: string }) | null = null;
let cutInTimer: ReturnType<typeof setTimeout> | undefined;
/** A chase the scene never ended (it went away mid-swarm) lets the island's music back after this long. */
const CHASE_MAX_MS = 6000;
/** The days whose midnight jingle was heard (events.ts intro): never twice. */
const introHeard = new Set<string>();

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
    engine.onended = (key) => {
      if (key === 'opening') opening = false;
      else if (cutIn?.key === key) endCutIn();
      else if (key === 'event/happy-new-year') introHeard.add(dayKey());
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
    e.hush(); // muted, not off: the track keeps its place
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
  const ev = eventMusicAt(d);
  const intro = ev?.intro && AUDIO.events[ev.intro];
  if (ev?.intro && intro && !introHeard.has(dayKey(d))) return { key: `event/${ev.intro}`, track: intro, playing: ev.intro, loop: false };
  const loop = ev && AUDIO.events[ev.id];
  if (ev && loop) return { key: `event/${ev.id}`, track: loop, playing: ev.id, loop: true };
  const tr = trackAt(d, sound.weather, AUDIO.music);
  return tr && { key: tr.key, track: tr, playing: 'hour', loop: true };
}

/** What the settings' note and the Now Playing tile say about the music (null: none). */
export function playingLabel(playing: Playing, hour: number, kk: string | null = sound.kk): string | null {
  if (playing === 'opening') return t('sound.opening');
  if (playing === 'hour') return t('sound.nowPlaying', { hour });
  if (playing === 'kk') {
    const k = kkTracks.find((s) => s.id === kk);
    return k ? t('sound.nowPlayingTitle', { title: i18n.locale === 'en' ? k.en : k.ja }) : null;
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
function startCutIn(want: Want & { kk?: string }, maxMs?: number): boolean {
  const s = sound.settings;
  if (!musicOn(s) || s.volume <= 0 || !engine?.ctx || document.hidden) return false;
  clearTimeout(cutInTimer);
  const base = musicAt(now());
  cutIn = want;
  sound.kk = want.kk ?? null;
  // keep the interrupted track (coming back starts at once) and, during the chase, the sting that may follow
  engine.pin([...(base ? [base.track.file] : []), ...(want.playing === 'bee-chase' && AUDIO.events['bee-stung'] ? [AUDIO.events['bee-stung'].file] : [])]);
  if (maxMs) cutInTimer = setTimeout(() => cutIn === want && (endCutIn(), syncMusic()), maxMs);
  syncMusic();
  return true;
}

/** The music and ambience that should sound now: the opening while it plays, a cut-in, else the island's (musicAt). */
function syncMusic(): void {
  const e = engine;
  if (!e?.ctx || document.hidden) return;
  const s = sound.settings;
  if (!s.music || !anyOn(s)) {
    opening = false;
    if (cutIn) endCutIn();
    sound.playing = null;
    e.stopMusic();
    void e.setAmbient([]);
    nowPlaying(null);
    return;
  }
  if (s.volume <= 0) return; // muted: everything holds where it is
  e.muffle(coveredBy() && !opening);
  const d = now();
  const { hour, month } = jst(d);
  const want: Want | null = opening && AUDIO.opening ? { key: 'opening', track: AUDIO.opening, playing: 'opening', loop: false } : cutIn ?? musicAt(d);
  sound.playing = want?.playing ?? null;
  void e.setTrack(want?.key ?? null, want?.track ?? null, want?.loop, want?.cut);
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
  const tr = musicOn(s) && !e.ctx ? musicAt(now()) : null;
  if (tr) e.prefetch(tr.track.file);
}

/** The next hour's track a minute early (only while it could play: visible, ミュージック on and audible), and the change
 *  on the hour. Stopped while hidden (onHide), so nothing is fetched and kept for hours nobody hears. */
const hourClock = new HourClock(
  now,
  (at) => {
    const s = sound.settings;
    const tr = musicAt(at);
    if (tr && s.music && s.volume > 0 && engine?.ctx && !document.hidden) engine.prefetch(tr.track.file);
  },
  syncMusic
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
  else engine?.play(id, o);
}

/** The wasps (island/TreeShakes.svelte), as in NH: `nest` (it fell: fetch the chase ahead), `chase` (they're out:
 *  Chased by Bees cuts in over the island's music and loops), `caught` (netted: the island's music comes straight
 *  back), `stung` (Stung by Bees, once, then the island's music fades back in). Only with ミュージック on. */
export function waspMusic(phase: 'nest' | 'chase' | 'caught' | 'stung'): void {
  const chase = AUDIO.events['bee-chase'], stung = AUDIO.events['bee-stung'];
  if (phase === 'nest') {
    if (chase && musicOn(sound.settings) && engine?.ctx) engine.prefetch(chase.file);
  } else if (phase === 'chase') {
    if (chase) startCutIn({ key: 'event/bee-chase', track: chase, playing: 'bee-chase', loop: true, cut: true }, CHASE_MAX_MS);
  } else if (cutIn?.playing === 'bee-chase') {
    // caught or stung: the chase ends either way
    endCutIn();
    if (phase === 'stung' && stung && startCutIn({ key: 'event/bee-stung', track: stung, playing: 'bee-stung', loop: false, cut: true })) return;
    const base = musicAt(now());
    if (base && engine?.ctx) void engine.setTrack(base.key, base.track, base.loop, true);
    syncMusic();
  }
}

/** K.K. plays song `id` (kk.ts kkTracks) over the island's music, which stops for it and comes back after (NH's
 *  show). Only with ミュージック on and audio unlocked (call it from a tap). `sound.kk` is the song while it plays.
 *  False: it can't sound now (no such song, music off, locked or muted). */
export function playKK(id: string): boolean {
  const k = kkTracks.find((s) => s.id === id);
  return !!k && startCutIn({ key: `kk/${k.id}`, track: k, playing: 'kk', loop: false, cut: true, kk: k.id });
}

/** Stop K.K.'s song early (the show ends, he leaves): the island's music fades back in. */
export function stopKK(): void {
  if (!cutIn?.kk) return;
  endCutIn();
  syncMusic();
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
