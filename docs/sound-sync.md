# Shared music and sound: design (2026-11-06)

**Status: shipped (2026-11-06).** All six steps are in: K.K., the stereos, the stretch and the cake on the shared
stages, and the remote cues' spatial gain. §3 below is the design with the API as it shipped; §1(c) is what it replaced.

The user: "the music should be synced across players: anyone can request and stop KK music. In general, all music/sounds/effects should be synced across players. Make it minimal, simple, robust and performant." Step 5 is decided: the aerobics tape and the birthday cake play on the shared `isl` stage too.

## 1. Inventory

**(a) Personal UI. These stay local.**
- Tap feedback from `taps.ts`'s `data-sfx` controls: tick, open, confirm, toggles, page, boop, panel, back, choice.
- Shop and money cues: buy, badge, harvest-receive.
- The ききみみ quiz-* cues, which play on the game sheet.
- The preview that plays when you turn a setting on in `setSound`.
- The wasps' chase and sting music (`waspMusic`). It only plays when my own villager is chased (`side === 'mine'`), so it counts as personal.

**(b) World events another player can see.** These already reach the other phones through existing intents, and most already play their cue there:
- tree shake, nest, buzz, twig (`TreeShakes.play(side)`)
- weed and rock (`Care.svelte` `shared.on`)
- bush and watering (`SceneTaps.svelte:519`)
- catches, bugs and casts (`Critters` `theirCatch` / `theirBug`)
- fishing steps (the presence-only `fish` intent)
- high-five (`IslandScene:917`)
- director reactions, footsteps, fireworks

The gap: remote cues play at full volume wherever the event is, with no attenuation for distance or for being out of view.

**(c) Shared continuous audio. Per-phone before this design; on the shared stages now (§2).**
- K.K. live: `KKSlider.perform` called `playKK(id,'live')`, each phone's own song. Now `request('isl', id)`.
- Stereos in rooms t/u/v: `TentRoom.playStereo` called `playKK(id,'aircheck')`, each phone with its own `stereo` state.
  Now `request(sc, id, { pc })`.
- Island cut-ins: aerobics (`TapeDeck`), happy-birthday (`Cake`): now on `isl`. Franklin's cooking (`Visitor`) stays
  per-phone.

**(d) Already the same on every phone (derived from shared state and the clock).**
- Hour music (`hourly.ts`, using the relay's `wx` for weather), event music (`events.ts`), ambience (`ambient.ts`).
- Place music for the shop and museum (`places.ts`).
- しずえ's jingle (`radio.ts`, seeded by the date).
- ききみみ's voice: already synced through `go at` and `playVoice({relayAt})`, and in おなじへや only the host's phone speaks.

## 2. Mechanism: one "stage" record per source, kept on the room

I chose to keep the record on the room rather than use a presence-only intent that phones re-send. Re-sending on arrival depends on a `presence` event, and the room skips that event when a ghost socket is replaced (`if (!was.length)`). It also breaks when nobody else is there to re-send. The room already does this for `wx` and held high-fives: it keeps a little state and sends it at hello. A music map is about 4 entries.

**Sources.**
- `isl`: the island stage, shared by K.K. and the island cut-ins.
- `t`, `u`, `v`: one stereo per room, with `pc` naming the piece.

**What each phone does with a record.** It treats the record as a picture of what plays, not as a command:
- **Visuals follow the record for everyone:** K.K. strumming, the caption, the villagers swaying, the stereo bumping.
- **Audio plays only when all of these hold:**
  - I'm where the source is: outdoors on the island for `isl`, inside the room for `t`/`u`/`v`.
  - The song hasn't ended.
  - ミュージック is on, volume is above 0, and audio is unlocked.
- **Mute stays local.** Turning sound off never sends anything.

**Playback.** Each phone plays from position `(serverNow() − at)/1000` into the track.

**Concurrency.** Anyone may start, replace or stop. Last writer wins by `(at, who)`: one shared rule, `musicBeats`
(below), used by the relay, the demo relay and the client.

**World-event SFX.** No new messages. The existing remote handlers pass the event's point to the cue, which turns it into a gain (see step 6).

**iOS unlock.** A start that arrives before this phone has had a gesture shows its visuals at once. The first tap anywhere runs the existing `unlock()` → `apply()` → `syncMusic()` chain, which picks up the record mid-song inside that tap. Until then the caption reads 「♪ title 🔇 タップで きく」.

**ミュージック off.** The same caption and 🔇 show. K.K.'s tap menu offers 「きく」, which calls `setSound({music:true})` from the tap.

## 3. Refactor

### Contract (`app/src/lib/contract/live-protocol.ts`)

```ts
export const MUSIC_SRCS = ['isl', 't', 'u', 'v'] as const;
export type MusicSrc = (typeof MUSIC_SRCS)[number];
// Intent: song absent = stop; ms = length after `start`; pc = the playing piece (room sources only)
| { kind: 'music'; src: MusicSrc; at: number; song?: string; ms?: number; pc?: string }
export const MUSIC_MS_MAX = 600_000, MUSIC_SKEW_MS = 5_000, MUSIC_STOP_KEEP_MS = 600_000;
export const newerMusic = (a: {at; who}, b: {at; who}) => a.at !== b.at ? a.at > b.at : a.who > b.who;
// when a record stops saying anything: a song at its end, a stop MUSIC_STOP_KEEP_MS on (song null on a phone's stage)
export const musicEnd = (m: {song?: string | null; at; ms?}) => m.at + (m.song ? (m.ms ?? 0) : MUSIC_STOP_KEEP_MS);
export const musicLive = (m, now) => now < musicEnd(m);
// the one accept rule: `m` takes its stage from `cur` at `now`
export const musicBeats = (m, cur, now) => (!cur || newerMusic(m, cur)) && musicLive(m, now);
// the skew clamp: the relay's clock `t` when the sender's `at` is more than MUSIC_SKEW_MS off
export const musicAt = (at, t) => (Math.abs(at - t) > MUSIC_SKEW_MS ? t : at);
```

- **Parsing:** `song` must match `/^[a-z0-9-]{1,32}$/`, for example `kk-chorale` or `ev-aerobics`. `ms` must be 1 to `MUSIC_MS_MAX`. `pc` must be a `DECOR_ID` and is only allowed on room sources.
- **`guestMaySend`:** add `music`.
- **`isAcked`:** add `music`. The outbox then resends it after a reconnect, and the room's existing `acked` map removes duplicates. Do not add it to `isStored`: it must stay out of the ring.

### Relay (`relay/src/room.ts`). This deploys first.

- Add a field `music: Partial<Record<MusicSrc, Relayed>>`. Persist it the same way as `held`: a `RoomIO.saveMusic?` hook, loaded in the constructor.
- In the message handler, before forwarding to the others:

```ts
if (out.kind === 'music') {
  out.at = musicAt(out.at, out.t);                                  // a wrong clock can't pin the stage
  const cur = this.music[out.src];
  if (!musicBeats(out, cur, out.t)) {                               // stale or already over
    if (cur) this.send(s, cur);                                     // tell the sender what won
    return c !== undefined ? this.ack(s, c, out.t, false) : undefined;
  }
  this.music = { ...this.music, [out.src]: out }; this.io.saveMusic?.(this.music);
}
```

- **In `hello`:** after the `wx` message, send each record for which `musicLive(r, t)` is true, including the phone's own. Drop expired records at that point.
- **Older relays:** they refuse `music` with ack false. Older app builds drop it when parsing. Neither breaks.

### Demo relay (`app/src/lib/sync/live-local.ts`)

- Keep the last record per source (`DEMO.music`), with the same `musicAt` clamp (on the device's clock) and
  `musicBeats` rule in the tab that sends; a beaten record gets the winner back.
- Deliver over the BroadcastChannel as now.
- Re-send the live records when another tab says `hi`.

### Client

**New: `app/src/lib/sound/stage.svelte.ts`** (as shipped):

```ts
export interface Stage { src: MusicSrc; song: string | null; at: number; ms: number; who: Who; pc?: string }
export const stage = $state<{ on: Partial<Record<MusicSrc, Stage>>; here: MusicSrc | null }>({ on: {}, here: null });
export function bindStage(n: { send(i: Intent): boolean; serverNow(): number; me(): Who | null }): void; // the layout, once
export function request(src: MusicSrc, song: string, o?: { ms?: number; pc?: string }): void;
       // from a tap: at = serverNow() (after the stage's record), ms from `o.ms` or the file's `d`; applied here, then sent
export function hush(src: MusicSrc): void;                                  // stop (same path)
export function hear(m: MusicRec): void;                                    // musicBeats apply (mine too, from hello)
export function acked(i: Intent, ok: boolean, t: number): void;             // the relay clamped my `at`: so does this phone
export function live(src: MusicSrc, now?: number): (Stage & { song: string; elapsedMs: number }) | null;
export function enterStage(src: MusicSrc, plays?: (s: Stage) => boolean): () => void;
       // where I am: the island page 'isl', TentRoom its sc (`plays`: its stereo still stands); returns the leaving
export function heardHere(): ReturnType<typeof live>;                       // what plays where I am and sounds here
export function onStage(fn: () => void): () => void;                        // sound.svelte.ts: syncMusic at each change
export const restage: () => void;                                           // what `plays` reads changed
export const cutInSong: (id: EventMusicId) => string;                       // an island cut-in's song, `ev-<id>`
export const cutInOf: (song: string) => EventMusicId | null;                // and back (null: K.K.'s)
```

- One timer, set for the earliest end (`musicEnd`), clears ended records and calls `syncMusic`.
- On ack, if the relay clamped `at` (`musicAt`), the client copies the clamp (`at = t`).

**New: `app/src/lib/sound/stageStart.svelte.ts`:** `onStageStart(song, unheardCue, (fresh) => …, on?)`, a start of a
song on `isl` seen once on each phone (TapeDeck's stretch, Cake's candles): `fresh` within `FRESH_MS` (1 s) of its
`at`; a fresh start this phone can't hear plays the cue instead.

**`app/src/lib/store/world.svelte.ts`:** in `#heard`, send `music` messages to `stage.hear`. Widen `tell()` to accept `music`.

**`app/src/lib/sound/sound.svelte.ts`:**
- **Delete:** `playKK`, `stopKK`, `sound.kk`, and the KK branch of `startCutIn`/`endCutIn`.
- **Keep:** `CutIn` for the personal cut-ins only (wasps, Franklin).
- **`syncMusic`:** add the stage's track to the inputs of `pickMusic`. Order: opening > personal cut-in > stage > place > island.
  - Key: `st/${src}/${song}/${at}`.
  - Track: the song with `from = at − (serverNow() − Date.now())`, which is when position 0 played on this phone's clock.
  - `loop: false`, `fade: 'cut'`.
- **When the track ends:** do nothing over the wire. Every phone reaches `at + ms` on its own.

**`app/src/lib/sound/engine.ts`, `setTrack`:**
- **Seeking:** if `track.from` is set, after `loadedmetadata` seek to `start + (Date.now() − from)/1000`. The offset is computed after the fetch, so a slow download still lines up. If that point is past the end, call `onended`.
- **Drift fix:** in the same-key branch, re-seek when the drift is over 0.3 s. This covers coming back from a hidden tab or a lock.
- No new AudioContext and no decoding: the same two `<audio>` decks play blob URLs, so seeking works.

**Durations:**
- `scripts/music.ts` writes `d` (seconds) for each song and aircheck in `kk.json`, and for each event cut-in in the manifest.
- `parseKK` and `track()` read it into a new `MusicTrack.dur`.
- If `d` is missing, fall back to 360 s.

**`app/src/lib/sound/choose.ts`:** `playingLabel` reads the title from the stage instead of `cutIn.kk`.

**`app/src/lib/components/island/KKSlider.svelte`:**
- `playing` comes from `live('isl')` when the song isn't a cut-in (`cutInOf`).
- `perform` calls `request('isl', id)`. A pick turns ミュージック on for this phone (`wantMusic()`, the stereo's too); its
  🔇 is `!musicHeard()` (on, not muted, unlocked).
- ストップ calls `hush('isl')`.
- **Delete:** the `stopKK` effects on unmount and at midnight (a shared song plays to its end), the `ours` bookkeeping, and the `noSound` refusal.
- K.K.'s sign-off shows on every phone outdoors when the record ends.

**`app/src/lib/components/tent/TentRoom.svelte`:**
- The playing stereo is `live(sc)?.pc`, counted only while that piece is still in the room.
- Tapping a stereo that's playing calls `hush(sc)`. Picking a song calls `request(sc, id, { pc })`.
- **Delete:** the local `stereo` state and its three effects.
- On mount `enterStage(sc, plays)` (its stereo still stands); its returned leaving on leave.

**`TapeDeck` and `Cake`:** `request('isl', cutInSong('aerobics' | 'happy-birthday'))`; a tap while it plays starts
nothing over. `onStageStart` gives the stretch poses and the candles' puff to a phone that sees the start, and the
done-for-today and the candles out to every phone. Franklin stays personal, because his fed state is per phone.

**Remote SFX:** add `cue(c, { at?: Pt })` and `sceneSfx(kind, at?)`.
- A listener that `camera.svelte.ts` registers returns the gain: 0 out of view (with a margin), otherwise 1 falling to 0.35 with distance from the view's centre.
- Only the remote handlers listed in (b) pass `at`. My own taps are unchanged.

## 4. Tests

- **Contract:** parsing `music` (bounds, song pattern, `pc` only on room sources), `newerMusic` including a tie on `at`, and `musicLive`.
- **Relay (`room.test`):**
  - the newer record wins
  - an older one gets ack false plus a correction
  - the skew clamp
  - the guest may send
  - hello replays live records and skips expired ones
  - a stop beats an older start that arrives as a resend
  - records survive a restart
- **Client:**
  - `stage.test`: LWW, the end timer, elapsed time under a skewed `serverNow`
  - `choose.test`: the stage's priority
  - `engine.test`: the `from` seek, the drift re-seek, a start past the end
  - `live-room.test`: A requests and B hears; B joins late and gets the offset
- **E2E** (`kk-sync.spec`, two and three tabs on the demo relay):
  - A requests a song; B's caption shows, and B's deck position is within 0.5 s of A's
  - B stops it, and A stops
  - G joins mid-song and starts at the right point
  - B with ミュージック off sees the caption and 🔇
  - a stereo in the tent is heard only inside the tent
  - a remote shake out of view logs a cue with gain 0

## 5. Steps (each one green on its own)

1. Contract and relay, with their tests. The lead deploys the relay.
2. Durations in `kk.json` and the manifest, plus the engine's `from` seek. No behaviour change.
3. `stage.svelte.ts`, the `world` routing and the demo relay. K.K. moves to the stage, and `playKK('live')` goes.
4. Stereos move to the stage, then delete `playKK`, `stopKK` and `sound.kk` entirely.
5. Stretch and cake on `isl`, after the designer signs off.
6. Spatial gain for remote SFX.

## 6. Risks and edge cases

- **Two people start at once:** every phone and the relay pick the same winner by `(at, who)`. The loser's phone hears the correction.
- **A song ends while someone is offline:** `ms` makes the record expire on its own, at the relay and on every phone, so nothing needs to be sent. A tap made offline goes out on reconnect and is refused if it's stale or over.
- **Clock skew:** playback uses `serverNow`. Before the first ping it uses the guess from the welcome's `t`, and the drift re-seek fixes it later. The relay's ±5 s clamp stops a bad clock from winning forever.
- **Music turned off or muted:** this is a purely local projection. Visuals and the record carry on.
- **A stereo put away mid-song:** it's projected as silent, and nobody needs to send anything.
- **iPhone performance:** a remote start costs one blob fetch (the request menu's existing prefetch covers the person asking) and one seek. There is one music deck pair and no PCM decoding.
