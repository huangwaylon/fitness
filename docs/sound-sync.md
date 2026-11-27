# Shared music and sound

Music and world sounds are the same on every phone; only the personal UI's sounds are local. What plays where:
design.md "Sound"; this doc is the mechanism.

## What is shared how
| Kind | What |
|---|---|
| Local | tap feedback (`taps.ts` `data-sfx`), shop cues, setting previews, the wasps' chase |
| Derived (shared state + clock) | hour music (`hourly.ts`, the relay's `wx`), events, ambience, places, `radio.ts` |
| Remote cues | the intents (shakes, catches, high-fives, footsteps…) with gain by distance from the view (`sound/cues.ts` `hearFrom`; `EAR_PAD`, `EAR_FAR`): 0 out of view, 1 → 0.35 |
| Stages | K.K. and island cut-ins on `isl`; each room's stereo on `t`, `u`, `v` |

## The stage record
One record per source, kept on the room.
- **Contract** (`contract/live-protocol.ts`): `{ kind: 'music', src, at, song?, ms?, pc? }` (no `song` = stop; `ms` ≤
  `MUSIC_MS_MAX`); last writer by `(at, who)` (`newerMusic`, `musicBeats`); `musicAt` clamps `at` past
  `MUSIC_SKEW_MS`. The guest may send. Acked, resent after reconnect, never in the day's ring.
- **Relay** (`relay/src/room.ts`): persisted per source (`RoomIO.saveMusic`); a beaten record gets ack false and the
  winner; `hello` replays. Demo relay: `sync/live-local.ts`.
- **Client** (`sound/stage.svelte.ts`): `request`, `hush`, `hear`, `live`, `enterStage`; one timer at the earliest end;
  `sound/stageStart.svelte.ts` fires an `isl` start's visuals once per phone.

## Playing it
The record is a picture, not a command: visuals follow it for everyone; audio plays only where the source is, before
its end, with ミュージック on and audio unlocked. `player.svelte.ts` `syncMusic` → `pickMusic`; a stage track starts at
`at − skew`, no loop; `engine.ts` `setTrack` seeks and re-seeks past `DRIFT_S`. Durations: `scripts/music.ts` (`--
--durations`), else `DEFAULT_S`. Before iOS's first gesture only visuals show, with 「タップで きく」.

Tests: `live-protocol`, `room.test`, `stage.test`, `engine.test`, `e2e/kk-sync.spec.ts`.
