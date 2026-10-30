// Sound for the app (docs/design/sound.md): the settings, the unlock on the first tap, the hourly music clock, the
// weather hook, the muffle under sheets and the pause in the background. App moments go through cue() (cues.ts);
// this module decides whether anything may sound at all. Nothing is created while every setting is off.
//   startSound({ muffled: () => ui.sheets.length > 0 })   // once, in the root layout
//   setSound({ music: true })                             // from a tap (the settings app)
//   sound.weather = 'rain'                                // the weather hook: the hour's rain arrangement
import { untrack } from 'svelte';
import { SOUNDS, type SoundId } from './ids.ts';
import { Engine } from './engine.ts';
import { DEFAULT_SOUND, loadSound, sanitize, saveSound, silent, type SoundSettings } from './settings.ts';
import { blipPlan, type Glyph } from './dialogue.ts';
import { AUDIO, hasMusic } from './manifest.ts';
import { PREFETCH_MS, WEATHERS, msToNextHour, trackAt, type Weather } from './hourly.ts';
import { ambientFor } from './ambient.ts';
import { localKV } from '#lib/sync/storage.ts';
import { jst, now } from '#lib/time/clock.ts';

export const sound = $state<{ settings: SoundSettings; weather: Weather; playing: 'opening' | 'hour' | null }>({
  settings: { ...DEFAULT_SOUND },
  weather: 'sunny',
  /** What the music is: the opening theme, the hour's track, or nothing (for the settings' note). */
  playing: null
});

let engine: Engine | null = null;
/** The opening theme is playing (or about to): the hourly track waits for it to end. */
let opening = false;
let clock: ReturnType<typeof setTimeout>[] = [];
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
  }
  return engine;
}

/** Inside a user gesture: start audio (or wake it after iOS suspended it) if any setting wants it. */
function unlock(): void {
  const s = sound.settings;
  if (typeof window === 'undefined' || silent(s)) return;
  const e = eng();
  const music = s.music && hasMusic();
  if (!e.needsUnlock(music)) return;
  e.unlock(music);
  apply();
  if (Date.now() - announceAt < ANNOUNCE_WAIT_MS) void e.whenReady().then(() => play('chime'));
  announceAt = 0;
}

function apply(): void {
  const e = engine;
  if (!e?.ctx) return;
  e.setLevels(sound.settings);
  if (silent(sound.settings)) e.sleep();
  else syncMusic();
}

/** The music and ambience that should sound now: the opening while it plays, else the Tokyo hour's track. */
function syncMusic(): void {
  const e = engine;
  if (!e?.ctx || document.hidden) return;
  const s = sound.settings;
  if (!s.music || silent(s)) {
    opening = false;
    sound.playing = null;
    e.stopMusic();
    void e.setAmbient([]);
    return;
  }
  const d = now();
  if (opening && AUDIO.opening) {
    sound.playing = 'opening';
    void e.setTrack('opening', { file: AUDIO.opening, start: 0 }, false);
  } else {
    const t = trackAt(d, sound.weather, AUDIO.music);
    sound.playing = t ? 'hour' : null;
    void e.setTrack(t?.key ?? null, t);
  }
  const { hour, month } = jst(d);
  void e.setAmbient(ambientFor(hour, month, sound.weather).filter((l) => AUDIO.ambient[l.id]));
}

/** Timers for the next top of the hour: fetch its track a minute early, change on the hour. */
function armClock(): void {
  clock.forEach(clearTimeout);
  const ms = msToNextHour(now());
  clock = [
    setTimeout(() => {
      const t = trackAt(new Date(now().getTime() + PREFETCH_MS + 1000), sound.weather, AUDIO.music);
      if (t && sound.settings.music && engine?.ctx) engine.prefetch(t.file);
    }, Math.max(0, ms - PREFETCH_MS)),
    setTimeout(() => {
      syncMusic();
      armClock();
    }, ms + 30)
  ];
}

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
  sound.settings = loadSound(localKV());
  const w = new URLSearchParams(location.search).get('weather') as Weather | null;
  if (w && WEATHERS.includes(w)) sound.weather = w;
  const gestures = ['pointerup', 'touchend', 'click', 'keydown'] as const;
  for (const g of gestures) document.addEventListener(g, unlock, { capture: true, passive: true });
  const onVisible = () => {
    if (document.hidden) return engine?.pause();
    if (!engine?.ctx || silent(sound.settings)) return;
    engine.resume();
    syncMusic();
    armClock();
  };
  document.addEventListener('visibilitychange', onVisible);
  const stopEffects = $effect.root(() => {
    $effect(() => {
      const m = o.muffled();
      untrack(() => engine?.muffle(m));
    });
    $effect(() => {
      void sound.weather;
      untrack(syncMusic);
    });
  });
  armClock();
  return () => {
    for (const g of gestures) document.removeEventListener(g, unlock, { capture: true });
    document.removeEventListener('visibilitychange', onVisible);
    stopEffects();
    clock.forEach(clearTimeout);
    engine?.pause();
  };
}
