# Shared music and sound

Music and world sounds are the same on every phone; only the personal UI's sounds are local. What plays where and the
captions: design.md "Sound"; this doc is the mechanism.

## What is shared how
- **Local**: tap feedback (`taps.ts` `data-sfx`), shop cues, setting previews, the wasps' chase.
- **Derived** from shared state and the clock: hour music (`hourly.ts`, the relay's `wx`), events, ambience, places,
  しずえ's jingle (`radio.ts`).
- **Remote cues**: the existing intents (shakes, catches, high-fives, footsteps…) play on every phone with a gain by
  distance from the view (`sound/cues.ts` `hearFrom`; camera.svelte.ts `EAR_PAD`, `EAR_FAR`): 0 out of view, 1 → 0.35.
- **Stages** (shared continuous audio): K.K. and island cut-ins on `isl`; each room's stereo on `t`, `u`, `v`.

## The stage record
One record per source, kept on the room (not presence, which needs someone to re-send).
- **Contract** (`contract/live-protocol.ts`): `{ kind: 'music', src, at, song?, ms?, pc? }` (no `song` = stop; `ms` ≤
  `MUSIC_MS_MAX`); last writer by `(at, who)` (`newerMusic`, `musicBeats`); `musicAt` clamps `at` to the relay's clock
  past `MUSIC_SKEW_MS` (5 s). Guest may send. Acked, resent after reconnect, never in the day's ring.
- **Relay** (`relay/src/room.ts`): per source, persisted (`RoomIO.saveMusic`); a beaten record gets ack false and the
  winner; `hello` replays live records. Demo relay: `sync/live-local.ts`, same rule.
- **Client** (`sound/stage.svelte.ts`): `request`, `hush`, `hear`, `live`, `enterStage`; one timer at the earliest end.
  `sound/stageStart.svelte.ts` fires an `isl` start's visuals once per phone.

## Playing it
The record is a picture, not a command: visuals follow it for everyone; audio plays only where the source is, before
its end, with ミュージック on and audio unlocked. `sound/player.svelte.ts` `syncMusic` → `pickMusic` (opening >
personal cut-in > stage > place > island); a stage track starts at `at − skew`, no loop, nothing sent at its end.
`sound/engine.ts` `setTrack` seeks to the elapsed time and re-seeks past `DRIFT_S` (0.3 s). Durations: `scripts/music.ts`
(`-- --durations`), else 360 s (`DEFAULT_S`). Before iOS's first gesture only visuals show, with 「タップで きく」.

Tests: `live-protocol`, `room.test`, `stage.test`, `engine.test`, `e2e/kk-sync.spec.ts` (tabs in step within 0.5 s, late
join, a room stereo heard only inside).
