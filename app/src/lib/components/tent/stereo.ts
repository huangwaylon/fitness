// The rooms' music players (docs/design.md "The tent: stereos"), pure: as in NH, a stereo, the jukebox, a record
// player or a cassette player put down in a room plays K.K.'s songs, his airchecks (sound/kk.ts kkFile: the
// recorded version, else his live file). A tap on one that's playing stops it; on another, the song list (おまかせ or
// one by name); the song plays through sound.svelte.ts playKK(id, 'aircheck'), a cut-in over the room's music.
import { ITEMS } from './items.ts';

/** NH's music players among the rooms' furniture (their ずかん ids). */
export const MUSIC_PLAYERS: ReadonlySet<string> = new Set([
  'hi-fi-stereo', 'high-end-stereo', 'retro-stereo', 'jukebox', 'phonograph', 'portable-record-player', 'cassette-player',
  'cute-music-player', 'pro-tape-recorder', 'tape-deck', 'throwback-skull-radio'
]);

/** Whether a room's item (its code) plays music. */
export const isStereo = (code: string): boolean => MUSIC_PLAYERS.has(ITEMS[code]?.cat ?? '');

/** What a tap on music player `piece` does: `stop` the song it's playing, else `pick` (the song list). `playing`: the
 *  piece playing now (null: none, or the song ended or was cut off), and whether a stereo's song still sounds. */
export function stereoTap(piece: string, playing: string | null, sounding: boolean): 'stop' | 'pick' {
  return sounding && playing === piece ? 'stop' : 'pick';
}
