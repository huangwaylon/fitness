// Sound for the app (docs/design.md#sound): the settings, the unlock on the first tap, the hourly music clock, the
// weather, the muffle under sheets and the pause in the background. App moments go through cue() (cues.ts);
// this module decides whether anything may sound at all. Nothing is created while every setting is off.
//   startSound({ muffled: () => ui.sheets.length > 0 })   // once, in the root layout
//   setSound({ music: true })                             // from a tap (the settings app)
//   sound.weather = 'rain'                                // the hour's rain arrangement (only `?weather=` sets it yet)
import { untrack } from 'svelte';
import { SOUNDS, type SoundId } from './ids.ts';
import { Engine } from './engine.ts';
import type { Gesture } from './session.ts';
import { DEFAULT_SOUND, loadSound, sanitize, saveSound, silent, type SoundSettings } from './settings.ts';
import { blipPlan, type Glyph } from './dialogue.ts';
import { AUDIO, hasMusic } from './manifest.ts';
import { WEATHERS, trackAt, type Weather } from './hourly.ts';
import { HourClock } from './session.ts';
import { ambientFor } from './ambient.ts';
import { localKV } from '#lib/sync/storage.ts';
import { jst, now } from '#lib/time/clock.ts';
import { t } from '#lib/i18n/index.ts';
import { asset } from '$app/paths';

export const sound = $state<{ settings: SoundSettings; weather: Weather; playing: 'opening' | 'hour' | null }>({
  settings: { ...DEFAULT_SOUND },
  weather: 'sunny',
  /** What the music is: the opening theme, the hour's track, or nothing (for the settings' note). */
  playing: null
});

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
      if (key !== 'opening') return;
      opening = false;
      syncMusic();
    };
    // the context came back by itself (after a call or Siri): bring the music back without waiting for a tap
    engine.onrunning = () => engine?.track && syncMusic();
    // the opening is title music: it plays clear under the phone that started it
  }
  return engine;
}

const musicOn = (s: SoundSettings): boolean => s.music && hasMusic();
const anyOn = (s: SoundSettings): boolean => s.music || s.sfx || s.voice;

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
  e.setSession(musicOn(s));
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

/** The music and ambience that should sound now: the opening while it plays, else the Tokyo hour's track. */
function syncMusic(): void {
  const e = engine;
  if (!e?.ctx || document.hidden) return;
  const s = sound.settings;
  if (!s.music || !anyOn(s)) {
    opening = false;
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
  if (opening && AUDIO.opening) {
    sound.playing = 'opening';
    void e.setTrack('opening', AUDIO.opening, false);
    nowPlaying(t('sound.opening'));
  } else {
    const tr = trackAt(d, sound.weather, AUDIO.music);
    sound.playing = tr ? 'hour' : null;
    void e.setTrack(tr?.key ?? null, tr);
    nowPlaying(tr ? t('sound.nowPlaying', { hour }) : null);
  }
  void e.setAmbient(ambientFor(hour, month, sound.weather).filter((l) => AUDIO.ambient[l.id]));
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
    ms.metadata = new MediaMetadata({ title: name, artist: t('app.name'), artwork: [{ src: asset('icons/icon-512.png'), sizes: '512x512', type: 'image/png' }] });
  }
  ms.playbackState = document.hidden ? 'paused' : 'playing';
}

/** Ahead of the first tap (needs no context): the renderer, and the hour's track when ミュージック is on. */
function prefetchFirst(): void {
  const s = sound.settings;
  if (silent(s)) return;
  const e = eng();
  e.warm();
  const tr = musicOn(s) && !e.ctx ? trackAt(now(), sound.weather, AUDIO.music) : null;
  if (tr) e.prefetch(tr.file);
}

/** The next hour's track a minute early (only while it could play: visible, ミュージック on and audible), and the change
 *  on the hour. Stopped while hidden (onHide), so nothing is fetched and kept for hours nobody hears. */
const hourClock = new HourClock(
  now,
  (at) => {
    const s = sound.settings;
    const tr = trackAt(at, sound.weather, AUDIO.music);
    if (tr && s.music && s.volume > 0 && engine?.ctx && !document.hidden) engine.prefetch(tr.file);
  },
  syncMusic
);

/** Change settings (from a tap: that tap unlocks audio). Turning a kind on previews it: 効果音 a confirm, おしゃべり a
 *  few blips, ミュージック the opening theme before the hour's track (NH's title screen). */
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
  if (next.voice && !prev.voice) void e.whenReady().then(() => talk([...'こんにちは'].map((ch, i) => ({ ch, at: i * 66 })), 'host'));
}

/** The scene is covered (world cues wait; cues.ts). */
export const covered = (): boolean => coveredBy();

/** Play an effect or blip if its setting is on (cues.ts is the usual way in). */
export function play(id: SoundId, o?: { gain?: number; rate?: number; delay?: number }): void {
  const s = sound.settings;
  if (s.volume <= 0 || !(SOUNDS[id].bus === 'voice' ? s.voice : s.sfx)) return;
  if (id === 'chime' && engine?.needsUnlock(false) !== false) announceAt = Date.now();
  else engine?.play(id, o);
}

/** Blips for a line as it types (Bubble.svelte); returns a canceller (tap-to-finish, a new line). */
export function talk(glyphs: readonly Glyph[], voice: 'host' | 'villager'): () => void {
  const s = sound.settings;
  if (!s.voice || s.volume <= 0 || !engine) return () => {};
  const p = blipPlan(glyphs);
  return engine.blips(voice === 'host' ? 'blip-host' : 'blip-villager', p.times, p.rates);
}

/** Once, in the root layout. `muffled`: a sheet, the phone or the harvest is up (the music goes soft and dull under
 *  it, as under NH's menus). `?weather=rain|snow` previews a weather for this load. Returns the cleanup. */
export function startSound(o: { muffled: () => boolean }): () => void {
  coveredBy = o.muffled;
  sound.settings = loadSound(localKV());
  const w = new URLSearchParams(location.search).get('weather') as Weather | null;
  if (w && WEATHERS.includes(w)) sound.weather = w;
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
