// The rooms' music players (docs/design.md "The tent: stereos"), pure: as in NH, a stereo, the jukebox, a record
// player or a cassette player put down in a room plays K.K.'s songs, his airchecks (sound/kk.ts kkFile: the
// recorded version, else his live file). A tap on one that's playing stops it; on another, the song list (おまかせ or
// one by name); the song plays on the room's music stage (sound/stage.svelte.ts request(sc, id, { pc }): everyone in
// the room hears it from the same point, docs/sound-sync.md).
import { ITEMS } from './items.ts';

/** NH's music players among the rooms' furniture (their ずかん ids). */
export const MUSIC_PLAYERS: ReadonlySet<string> = new Set([
  'hi-fi-stereo', 'high-end-stereo', 'retro-stereo', 'jukebox', 'phonograph', 'portable-record-player', 'cassette-player',
  'cute-music-player', 'pro-tape-recorder', 'tape-deck', 'throwback-skull-radio'
]);

/** Whether a room's item (its code) plays music. */
export const isStereo = (code: string): boolean => MUSIC_PLAYERS.has(ITEMS[code]?.cat ?? '');

