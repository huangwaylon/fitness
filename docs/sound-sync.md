# Shared music and sound

Music and world sounds are the same on every phone; only the personal UI's sounds are local. What plays where and the
captions: design.md "Sound"; this doc is the mechanism.

## What is shared how

- **Local (personal UI):** tap feedback (`taps.ts` `data-sfx`), shop and money cues, ききみみ's quiz cues, a setting's
  preview (`setSound`), the wasps' chase music (my own villager chased).
- **Derived (same everywhere from shared state and the clock):** hour music (`hourly.ts`, with the relay's `wx`), event
  music (`events.ts`), ambience (`ambient.ts`), place music (`places.ts`), しずえ's jingle (`radio.ts`, seeded by the
  date), ききみみ's voice (`go at` and `playVoice({relayAt})`; in おなじへや only the host's phone speaks).
- **World events another player sees:** the existing intents (tree shakes, weeds and rocks, bushes and watering,
  catches and casts, fishing steps, high-fives, reactions, footsteps, fireworks) play their cue on every phone, with a
  gain by where it happened ("Remote cues").
- **Shared continuous audio, the stages:** K.K. live and the island cut-ins (the aerobics tape, the birthday cake) on
  `isl`; each room's stereo on `t`, `u`, `v`. Franklin's cooking stays personal (his fed state is per phone).

## The stage record

One record per source, kept on the room, not a presence intent (that needs someone there to re-send, and the room skips
`presence` when a ghost socket is replaced).

- **Contract** (`contract/live-protocol.ts`): `MUSIC_SRCS` (`isl`, `t`, `u`, `v`); the intent
  `{ kind: 'music', src, at, song?, ms?, pc? }` (no `song` = stop; `ms` the length; `pc` the playing piece, room
  sources only; `song` `/^[a-z0-9-]{1,32}$/`, `ms` ≤ `MUSIC_MS_MAX`). `newerMusic` (last writer by `(at, who)`),
  `musicEnd` (a song at its end, a stop `MUSIC_STOP_KEEP_MS` on), `musicLive`, `musicBeats` (the one accept rule),
  `musicAt` (the sender's `at`, or the relay's clock when over `MUSIC_SKEW_MS`, 5 s, off). The guest may send it.
  Acked (the outbox resends after a reconnect, the room drops duplicates), never stored in the ring.
- **Relay** (`relay/src/room.ts`): `music` per source, persisted like `held` (`RoomIO.saveMusic`). A beaten or ended
  record gets ack false and the winner back. `hello` replays every live record (the phone's own too) and drops expired
  ones.
- **Demo relay** (`sync/live-local.ts`): the same rule per tab over the BroadcastChannel; live records re-sent on `hi`.
- **Client** (`sound/stage.svelte.ts`): `request(src, song, { ms?, pc? })` from a tap (at = `serverNow()`, `ms` from the
  file's `d`), `hush(src)`, `hear(m)` (`musicBeats`), `acked` (copies the relay's clamp), `live(src)`,
  `enterStage(src, plays?)` (where I am: the island `isl`, a room its scope), `heardHere()`. One timer at the earliest
  `musicEnd` clears ended records. `sound/stageStart.svelte.ts` `onStageStart`: an `isl` start seen once per phone (the
  stretch's poses, the candles' puff), fresh within 1 s; a phone that can't hear it plays a cue instead.

## Playing it

- The record is a picture of what plays, not a command. **Visuals follow it for everyone** (K.K. strumming, the
  caption, villagers swaying, the stereo bumping). **Audio plays** only where the source is (outdoors for `isl`, inside
  the room for `t`/`u`/`v`), before its end, with ミュージック on, volume above 0 and audio unlocked. Mute is local.
- `sound.svelte.ts` `syncMusic` → `pickMusic`: opening > personal cut-in > stage > place > island. A stage's track is
  keyed `st/<src>/<song>/<at>`, `from` = when its position 0 played on this phone's clock (`at − skew`), no loop, a cut.
  Nothing is sent at the end: every phone reaches `at + ms` itself.
- `engine.ts` `setTrack` seeks to `start + (Date.now() − from)/1000` after `loadedmetadata` (a slow fetch still lines
  up; past the end, `onended`) and re-seeks when drift passes `DRIFT_S` (0.3 s: a hidden tab or a lock). The same two
  `<audio>` decks on blob URLs.
- Durations: `scripts/music.ts` writes `d` per song, aircheck and cut-in (`-- --durations` re-measures); 360 s when
  missing (stage.svelte.ts `DEFAULT_S`).
- iOS unlock: a start before this phone's first gesture shows its visuals; the first tap runs `unlock()` → `apply()` →
  `syncMusic()`, joining the song mid-way. Until then, or with ミュージック off, the caption reads 「♪ title 🔇 タップで
  きく」; K.K.'s menu offers 「きく」 (`setSound({music:true})`).
- **Remote cues:** `cue(c, { at })` / `sceneSfx(kind, at)` from the remote handlers only, the gain from the camera's
  listener (`sound/cues.ts` `hearFrom`, fed `earGain` by IslandScene; camera.svelte.ts `EAR_PAD`, `EAR_FAR`): 0 out of
  view (60 px margin), else 1 falling to 0.35 with distance from the view's centre.

## Edge cases

- **Two starts at once:** relay and phones pick the same winner by `(at, who)`; the loser hears the correction.
- **A song ends while someone's offline:** `ms` expires it everywhere; a tap made offline goes out on reconnect and is
  refused if stale or over.
- **Clock skew:** playback uses `serverNow` (the welcome's `t` till the first ping; the drift re-seek fixes it); the
  ±5 s clamp stops a bad clock winning forever.
- **A stereo put away mid-song:** projected as silent; nothing to send.
- **Cost on an iPhone:** a remote start is one blob fetch (the menu's prefetch covers the asker) and one seek.

Tests: `live-protocol` and `room.test` (parse, LWW, the clamp, the guest, hello's replay, a stale resend, a restart),
`stage.test`, `choose.test`, `engine.test`, `live-room.test`, `e2e/kk-sync.spec.ts` (two and three tabs: in step
within 0.5 s, a stop, a late join, ミュージック off, a tent stereo heard only inside, a remote shake out of view at gain
0).
