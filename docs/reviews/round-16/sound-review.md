# Round 16: sound and music on the iPhone (audio and mobile-web performance review)

**Date:** 2026-10-30. **Scope:** `app/src/lib/sound/**`, `SoundApp.svelte`, `static/audio/**` (manifest and the 25
music files), `scripts/music.ts`, `src/service-worker/{index,caches}.ts`, every `cue(` / `talk(` call site, after
commit `aeb8615` switched the audio session from `ambient` to `playback` (user decision: what's turned on in サウンド
plays even in silent mode). Read with `docs/design/sound.md` and `round-14/sound-review.md`. **No code was changed.**

**Method.** Code reading, plus:
- An instrumented run of the built app (`vite build`, then `vite preview` on :4191, `?demo`) in installed Chrome via
  Playwright, with an iPhone 13 profile, `ja-JP`, Asia/Tokyo and the service worker on. `AudioContext`, `Audio` and
  `createMediaElementSource` were wrapped to read context state, deck state and deck gain.
- `ffprobe` / `ffmpeg` (`ebur128`, edit lists, decoded seam samples) on every music file.
- Timing `synth.render()` for every id in Node.

WebKit isn't available here, so every iOS claim is either from code plus WebKit's known behaviour or marked
**[device]**: it needs the real iPhone.

## Bottom line

The engine is lean and mostly correct. The off state is truly off, music is streamed and never decoded, the precache
holds no audio, only the current hour is fetched, and nothing runs while idle except the context itself. The switch to
`playback` adds two problems the design hasn't caught up with:

1. **The music can come back silent (H1, reproduced).** With `playback`, the music `<audio>` element can become
   iOS's Now Playing item. If anything other than our code plays it while the app is hidden (lock-screen ▶, Control
   Center, AirPods), the deck runs at gain 0. Coming back, the engine sees "not paused" and never fades it in, so the
   music stays silent until the next hour.
2. **`playback` doesn't mix with other audio (H2).** The first tap with any setting on stops the user's Spotify,
   podcast or Apple Music. That includes **効果音-only**, which has no music of ours to replace theirs. The note and the
   docs don't say so.

Medium items: an external pause while the app is visible leaves the music off for the rest of the hour (M1, reproduced).
An interrupted context can still queue effects that burst out later (M2). An effects-only session keeps the audio
hardware awake indefinitely (M3). The first fanfare, chime or heart renders synchronously on the main thread (M4). The
hourly tracks span 7 LU, and the opening is the loudest of all (M5).

## Verified OK (Chrome, instrumented)

| Check | Result |
|---|---|
| All off, after load and with the phone open | `AudioContext` instances: **0**. `<audio>` elements: **0**. Requests to `/audio/`: **none** |
| Service worker precache (`build-pages/service-worker.js`) | `$app/manifest` still lists the 25 `audio/music/*.m4a` paths (and `audio/manifest.json`, `icons/.DS_Store`), but `precachable()` drops them. After install, `island-shell-…` holds 132 entries and **0** audio |
| 効果音 on | One context, `running@48000`. No requests (there are no effect files; placeholders only) |
| ミュージック on | Two decks. `opening.m4a` fetched once, whole (no `Range`). Note: 「♪ いまはオープニングテーマ」 |
| Phone closed | Only **`hour-15.m4a`** fetched (Tokyo hour 15). The deck has `loop=true` and is playing from ≈ 48 s (its manifest `start` 48.024). Opening deck faded to 0 and paused. Deck gains `[1, 0]` |
| Hidden (`visibilitychange`) | Context `suspended`, both decks paused, gains `[0, 0]` |
| All off again | Context `suspended`, decks paused |
| `island-audio-v1` afterwards | `opening.m4a`, `hour-15.m4a` (LRU of 3 works on use) |
| Console errors / page errors | **none** |
| Audio session order | `navigator.audioSession.type = 'playback'` is set in `#ensure()` **before** `new AudioContext()` (`engine.ts:81-87`). It is a document-level setting and persists across interruptions, so it doesn't need re-setting |
| CPU when idle | No oscillators, no `requestAnimationFrame`, no timers except the two hour timers. Effects are rendered once per id and cached (`engine.ts:182-191`): all 21 at 48 kHz = 1.95 MB. Music: at most two blobs (0.4–0.9 MB each), never decoded |
| Music files | 44.1 kHz AAC-LC with an `elst` edit list (`media time 1024`, e.g. `hour-00` duration 3 076 745 samples = the cut period). Gapless metadata is present, and every `start` < duration |

## Findings, by severity

### H1. A deck played by iOS while hidden comes back silent for the rest of the hour (reproduced)

**Where.**
- `engine.ts:440-451` `pause()` zeroes both deck gains and pauses the elements.
- `engine.ts:332-335` (`setTrack`, same key) fades in **only if `cur.el.paused`**.
- `sound.svelte.ts:156-163` (`onVisible`) calls `syncMusic()`, which reaches that branch.

**Why it happens now.** With an `ambient` session iOS never gave the page Now Playing. With `playback`, a playing
`<audio>` element (ours, even routed through `MediaElementSource`) is eligible for the lock screen and Control Center
**[device: confirm it appears]**. On lock or app switch we pause, but the Now Playing tile can stay with a ▶ button.
AirPods/headphone "play" and Siri "resume" go to the same element. Any of these plays the element while the context
is suspended. When the page comes back, `el.paused === false` and the gain is 0, so nothing ever fades it in.

**Reproduced.** Hide, then `el.play()` on the hour deck (as the lock screen would), then show. Result: the deck is
playing at `t=55.01`, the context is `running`, and the deck gains are `[0, 0]`. The music is silent until the next
hour change.

**Fix** (all three; the first alone fixes the bug):
1. `engine.ts:333`: fade in whenever the deck isn't audibly up, not only when paused:
   ```ts
   if (cur.el.paused || cur.gain.gain.value < 0.5) this.#fadeIn(cur, crossfadePlan(ctx.currentTime, false));
   ```
2. `engine.ts` `#unlockDecks` (after line 153): keep the element from playing while hidden:
   ```ts
   el.addEventListener('play', () => { if (document.hidden) el.pause(); });
   ```
3. Keep design §11's "no lock-screen controls" true. Take over the Media Session so the tile, if iOS shows one, does
   our thing. Add in `startSound()` (`sound.svelte.ts`, after line 163):
   ```ts
   const ms = 'mediaSession' in navigator ? navigator.mediaSession : null;
   ms?.setActionHandler('play', () => { if (!document.hidden) syncMusic(); });
   ms?.setActionHandler('pause', () => engine?.stopMusic());
   ```
   Also set `ms.playbackState = 'paused'` in the hidden branch of `onVisible`, and `'playing'` after `syncMusic()`.
   Optional: `ms.metadata = new MediaMetadata({ title: t('sound.nowPlaying', { hour }), artist: 'Island Fund',
   artwork: [{ src: asset('icons/icon-512.png'), sizes: '512x512' }] })` so the tile isn't a bare URL.

   If the tile still shows after locking **[device]**, release the source in `pause()`: remember `{ key,
   currentTime }`, then `el.removeAttribute('src'); el.load()`. In `setTrack`'s same-key branch, re-attach the blob URL
   (still in `#blobs`) and seek. With no source there is no Now Playing item to press.

Also update `sound.md:221`, which still says "An `ambient` session never takes Now Playing".

### H2. `playback` stops the user's own audio on the first tap, even with only 効果音 on (needs a user decision)

**Where.**
- `engine.ts:81-87` (session type) and `engine.ts:123-126` (the 1-sample buffer started in the unlock tap).
- `sound.svelte.ts:154-155` (unlock on any tap whenever any setting is on).
- Copy: `ja.json:286` / `en.json:286`. Docs: `sound.md:218`.

**What happens.** WebKit maps `playback` to the non-mixable media-playback category. The context starts on the first
tap anywhere after launch (for anyone with a setting on), and that start **interrupts** whatever the user is playing:

- Spotify, a podcast or Apple Music pauses at once, not "while ours plays".
- With **効果音-only** nothing of ours replaces it: a coin clink costs them their podcast.
- iOS doesn't resume their app when ours goes quiet or goes to the background **[device: confirm]**.
- Only `playback` (and `play-and-record`) bypass the Ring/Silent switch. `transient` / `ambient` follow the switch,
  so there's no "mix and ignore the switch" option on the web.

**Fix.** Pick one with the user:
- **(A, recommended if they listen to podcasts while checking in):** use `playback` only while ミュージック is on.
  Otherwise use `'ambient'` (effects mix with their audio and follow the switch).
  - In `engine.ts`, move the session line into a method `session(music: boolean)` that sets
    `nav.audioSession.type = music ? 'playback' : 'ambient'`.
  - Call it in `#ensure()` before `new AC(...)`, and in `setLevels()` when `s.music` changes (inside the toggle tap).
  - The note then says 効果音 and おしゃべり follow the switch.
- **(B, keep the decision as is):** keep `playback` everywhere and tell the truth in the note (L5) and in
  `sound.md:218`. Change "it pauses the user's own music while ours plays" to "turning on any sound pauses music
  playing in other apps; they don't resume by themselves".

### M1. An external pause while the app is visible leaves the music off until the next hour (reproduced)

**Where.**
- `engine.ts:107-109` `needsUnlock()` is false once the context runs and the decks exist.
- `sound.svelte.ts:55` returns early, so a tap never re-syncs.

**What triggers it.** iOS pauses media elements itself in these cases:
- Control Center ⏸.
- AirPods taken out, or a Bluetooth route lost **[device]**.
- Siri.
- A call answered from the banner, which doesn't hide the page.

The context stays or returns to `running`, but the deck stays paused.

**Reproduced.** `el.pause()` on the playing deck, then tap the island. The deck stays paused, with gains `[0, 0]`.

**Fix.**
1. `engine.ts:108`: count a paused front deck as needing a tap:
   ```ts
   return !this.ctx || this.ctx.state !== 'running' || (music && (!this.#decks.length || (!!this.track && this.#decks[this.#front].el.paused)));
   ```
   `unlock()` → `apply()` → `syncMusic()` then fades it back in (the same-key branch with H1's fix).
2. Recover without a tap when the system resumes the context. In `#ensure()`, add
   `ctx.onstatechange = () => ctx.state === 'running' && this.onrunning?.()`, and wire `onrunning` to `syncMusic` in
   `eng()`. Optionally also listen to `navigator.audioSession.onstatechange` (`'interrupted'` → `'active'`).
3. Whether an AirPods-out pause should *stay* paused (the iOS convention) is a product call. If yes, have the H1
   `pause` handler set a `userPaused` flag that `syncMusic` honours until the next hour or a サウンド toggle.

### M2. During an interruption, effects can still be queued and burst out afterwards

**Where.**
- `engine.ts:115-121` sets `#resuming = true` until `ctx.resume()` settles.
- `engine.ts:195-198` `#ready()` treats `#resuming` as ready.

**What happens.** In WebKit, `resume()` called while the context is `interrupted` (a call, Siri) stays pending until
the interruption ends. So `#resuming` stays true and every cue in the meantime is scheduled on a frozen clock. They all
start together when audio comes back. That breaks `sound.md:141`, "nothing bursts out later".

**Fix.** Time-box the window to the unlocking tap:
```ts
// engine.ts:116
this.#resuming = true;
setTimeout(() => (this.#resuming = false), 250);
```
and in `#ready()`: `ctx.state === 'running' || (this.#resuming && ctx.state === 'suspended')`.
(`'interrupted'` is WebKit's extra state. It isn't in the TS `AudioContextState` union, so compare as a string.)

### M3. 効果音 / おしゃべり only: the context runs forever while visible (battery; holds the `playback` session)

**Where.** `sound.svelte.ts:50-60`, `engine.ts:112-131`. Nothing suspends a running context except hiding the app or
turning everything off. `sound.md:217` itself says "an open context keeps the audio hardware awake". With music off it
renders silence ~99.9 % of the time.

**Fix.**
- In `Engine`, after each `play()` / `blips()`, (re)start a timer:
  `clearTimeout(this.#idle); if (!this.track) this.#idle = setTimeout(() => this.ctx?.suspend(), 10_000)`.
- Taps already resume it: `needsUnlock()` is true while suspended, and the capture-phase `pointerup` calls `unlock()`
  before the cue.
- For the few non-tap cues (`bells-arrive` when the partner's coins sync, the director's emotes), have `play()` do
  `if (ctx.state === 'suspended') ctx.resume().then(() => this.play(id, o))`. A started context may resume without a
  gesture **[device: confirm on iOS 26]**.
- This also releases the `playback` session sooner (H2).

### M4. The first jingle, chime or heart is rendered synchronously on the main thread at the cue

**Where.** `engine.ts:182-191` renders a placeholder on its first `play()`. Node on an M-series Mac:
- `heart` 32.6 ms, `chime` 25.7 ms, `fanfare` 24.7 ms, `miles` 8.7 ms, `sparkle` 7.6 ms, `bells` 7.4 ms.
- 137 ms for all 21.

Expect 1.5–3× that on an iPhone. The fanfare lands on the harvest overlay's entrance animation
(`HarvestOverlay.svelte:69`). The chime fires right after the first tap of the day. Both are moments where a 40–90 ms
long task shows as a dropped frame.

**Fix.** Pre-render in small tasks once the renderer has loaded, jingles first.
In `engine.ts:129`:
```ts
this.#synthLoad ??= import('./synth.ts').then((m) => {
  this.#synth = m;
  const order = ['chime', 'fanfare', 'heart', 'miles', ...SOUND_IDS] as SoundId[];
  const step = () => { const id = order.shift(); if (!id || !this.ctx) return; this.#buffer(this.ctx, id); setTimeout(step, 30); };
  setTimeout(step, 500);
});
```
`#buffer` already skips ids that are cached. Memory is unchanged: all 21 = 1.95 MB, as `sound.md:222` already budgets.

### M5. Track loudness spans 7 LU, and the opening is the loudest thing the app plays

**Measured** (`ffmpeg ebur128`, integrated loudness / true peak):

| Track | Integrated | True peak |
|---|---|---|
| opening | **−10.6 LUFS** | — |
| 12:00 | −11.9 LUFS | — |
| 08:00 | −12.6 LUFS | — |
| 05:00 | **−19.2 LUFS** | — |
| 00:00 | −17.1 LUFS | — |
| 15:00 | — | **+4.1 dBTP** |
| most others | — | +0.5 to +1.7 dBTP |

- The opening plays the moment ミュージック is turned on, so the first impression is the loudest.
- The 04→05→06 sequence is −16.6 / −19.2 / −16.2, a dip, then a jump at 06:00.
- The over-0 peaks don't clip inside Web Audio (the music bus is 0.3), but they are encoder overshoot.

**Fix** (`scripts/music.ts`):
- Before `encode()`, measure each period's loudness (`ffmpeg -af ebur128` on the PCM, or `loudnorm` two-pass).
- Write a `gain` (dB) into each manifest entry: target −16 LUFS, with 22:00–04:00 allowed at −17 to −18 if the user
  likes the night quieter. Use the same for `opening`.
- Apply it in `engine.ts` `setTrack`: scale the deck's ramp target from `1` to `10 ** (track.gain / 20)` in
  `#fadeIn`, so `linearRampToValueAtTime(level, …)`.
- Keep the AAC peak under −1 dBTP: `-af alimiter=limit=0.89` or encode from the gained PCM.
- `parseManifest` (`manifest.ts:41-43`) needs `gain` read as an optional number.

### L1. The loop wrap on WebKit `<audio loop>` is unverified, and four files have a larger step at the seam

The files are right: the cut is sample-exact, there's a 250 ms equal-power safety blend (`music.ts:201-209`), and the
`elst` trims priming and padding. But WebKit implements `loop` as a seek to 0 at the end. On some iOS versions that
leaves a 20–80 ms dropout once per loop (every 50–104 s) **[device]**.

Decoded, the last→first sample step exceeds that file's 99th-percentile step in `hour-02` (0.076 vs 0.046), `hour-05`
(0.070 vs 0.041), `hour-12` (0.096 vs 0.083) and `hour-20` (0.052 vs 0.036). These are probably inaudible AAC
frame-edge differences, but listen to these first.

**Fix if a gap is heard.** Encode a "wrap-aware" file: append the first ~2 s after the period, then trim it with the
edit list (or iTunSMPB). Simpler, and uses the existing decks: at `duration - 0.15` (a `timeupdate` / timer check), cue
the other deck at 0 with a 100 ms crossfade, ping-ponging the two decks. The duplicate audio is identical, so a few ms
of misalignment is inaudible at that length.

### L2. Older iOS (no `navigator.audioSession`): effects-only is muted by the switch, and the doc says otherwise

**Where.** `engine.ts:81-86`, `engine.ts:151`, `sound.md:218`: "the silent `<audio>` played during unlock usually
switches the page to the playback category too".

**What actually happens.** The category follows whatever media is active, and that clip lasts 50 ms. On those
versions effects are audible in silent mode only **while the music deck plays**. With only 効果音 or おしゃべり on,
the switch mutes them.

**Fix.** If the user's iPhone runs iOS 26 (likely), just correct the doc sentence. To support older phones: when
`!nav.audioSession` and any setting is on, keep a third `<audio>` that isn't routed into the graph,
`loop = true`, `src = silentWav()` (lengthen it to 1 s), started in the unlock tap, paused in `pause()`, played again
in `resume()` (the unmute.js technique). It may itself show a Now Playing tile, so wire it into H1's handlers.

### L3. No `pagehide` / `pageshow` handling

**Where.** `sound.svelte.ts:156-163` relies only on `visibilitychange`. In the standalone app that fires on every app
switch and lock, so this is belt-and-braces. A bfcache restore (`pageshow` with `persisted`) or a `pagehide` that
isn't preceded by `hidden` (seen in WebKit on fast navigations/reloads, e.g. `ui-state/reload.ts`) skips it.

**Fix.** Add
`addEventListener('pagehide', () => engine?.pause())` and
`addEventListener('pageshow', (e) => e.persisted && onVisible())`, with matching removals in the cleanup.

### L4. Dragging 音量 through 0 restarts the hour (or the opening) from the top

**Where.** `sound.svelte.ts:62-67`: `silent()` at volume 0 → `engine.sleep()` → `stopMusic()` clears the deck key.
Coming back above 0 starts a fresh track, and `opening` is still true (`sound.svelte.ts:119`), so the opening replays.

**Fix.** In `apply()`, treat `volume === 0` with any kind on as muted, not off. Set the master gain to 0 (already done
by `setLevels`) and suspend after 800 ms, but keep the deck keys. `sleep()` stays for "all three off". Also, the slider
writes localStorage on every `input`. That's harmless at 11 steps, but `saveSound` could move to `onchange`.

### L5. UX: levels, defaults, the note

**Levels.** At the default 音量 0.8 (master 0.64):
- Music bus 0.3 puts the hourly tracks around **−26 to −34 LUFS**.
- Effects peak around −10 to −15 dBFS (e.g. confirm 0.8 × 0.55 × 0.9 × 0.64 ≈ −12 dBFS).
- Blips are ≈ −16 dBFS peak.

That ordering matches NH (jingles > actions > UI ticks > BGM > blips). But on a phone speaker the quiet hours (05:00 at
−34) will be close to inaudible. After M5's normalisation, try `LEVELS.music` 0.35 on the device. The defaults (all
off, 0.8) are right.

**サウンド app.** It's clear. Three switches, a slider that's disabled while all are off, and a note that names what's
playing. One gap: nothing says the music follows the Tokyo hour, so a user abroad hears "15時の曲" at their 8:00. A
hint already exists: make `sound.music.hint` 「東京の時刻で1時間ごとに変わるBGM」, if the user wants that.

**The note.** 「消音モードでも、ここでオンにした音は鳴ります。」 reads naturally and is accurate under option B. It
omits the cost from H2. Suggested:
- **ja:** 「消音モードでも、ここでオンにした音は鳴ります。ほかのアプリの音楽は止まります。」
- **en:** "What's on here plays even in silent mode, and pauses music playing in other apps."

The new kana-only clause keeps the only new kanji to 止. `fonts.test` will flag it if the subset lacks it; re-run
`npm run fonts:subset` as in `574f966`. Under option A, use instead:
- **ja:** 「ミュージックは消音モードでも鳴ります（ほかのアプリの音楽は止まります）。効果音とおしゃべりは消音モードでは鳴りません。」
- **en:** "Music plays even in silent mode (and pauses other apps' music). Sound effects and voices follow the silent switch."

### L6. Stale statements in the docs and comments

- `sound.md:217`: "No context exists while every setting is off". True only until the first time sound is turned on.
  Afterwards a *suspended* context remains (fine for power). Say so.
- `sound.md:218`: see L2 and H2.
- `sound.md:221`: see H1.
- `sound.md:236`: "the ambient session" → "the playback session".
- `engine.ts:78`: "iOS 17+ (Audio Session API)". WebKit shipped `navigator.audioSession` in the 16.4–17 window, so
  say "where `navigator.audioSession` exists" rather than a version.

### Notes (no action)

- **Service worker.** A music hit is deleted and re-put to mark recency (`index.ts:99-101`), which rewrites 0.4–0.9 MB
  on each play. That's acceptable at one play per hour or launch. The opening counts toward the LRU's 3, so the cache
  usually holds the opening plus two hours.
- **Blob revocation.** `#trimBlobs` (`engine.ts:343`) revokes the previous hour's blob URL while its deck is still in
  its 3 s fade-out. Chrome keeps playing. WebKit should too, since the resource is already loaded **[device: listen to
  an hour change]**. If it cuts, delay the revoke by `CROSSFADE.out + 1` s.
- **Bluetooth/AirPods.** There's no code issue beyond M1. The context stays at 48 kHz and WebKit resamples. AirPods
  add ~150–250 ms output latency, so tap sounds trail the visuals slightly; nothing to compensate for one-shots.
- **Scene taps** (`island/sceneTaps.ts:74`, uncommitted work by another agent). When `sceneSfx()` is wired to
  `cue()`, rapid taps on the sea or flowers go through the per-id `max` and the 6-voice limiter, which is enough.
  Mark them `world: true`.

## Test on the real iPhone (Home Screen app, after the fixes)

1. **Silent switch on, ミュージック + 効果音 on.** Tap: the hour's music and the coin and tap sounds are audible.
   Turn only 効果音 on: still audible (option B) or silent (option A), as decided.
2. **Spotify or Podcasts playing, open the app with 効果音 on, tap once.** Note whether their audio stops, and whether
   it comes back when you leave the app (H2).
3. **Lock the phone with music playing.** The music stops at once. Check whether an "Island Fund" Now Playing tile
   appears on the lock screen or in Control Center. If it does, press ▶ there, unlock, and confirm the music fades
   back in rather than staying silent (H1).
4. **AirPods.** Music on, take one AirPod out (or both), then put them back. Does the music stop, and does a tap
   bring it back (M1)? Squeeze to pause/play.
5. **Interruptions.** Music on, then trigger Siri ("Hey Siri, what time is it"), then call yourself from another
   phone, answer and hang up. The music returns within one tap, and no burst of queued effects plays (M2).
6. **Hour change.** Leave the app open over the top of an hour: a ~3 s crossfade with no click or cut. Also leave it
   in the background across an hour and come back: the new hour fades in.
7. **Loop seam.** Keep 02:00, 05:00, 12:00 or 20:00 (`?date=` preview) running for 3–4 minutes and listen at each
   wrap (every 50–104 s) for a gap or click (L1).
8. **Harvest.** Open the harvest with 効果音 on. The fanfare starts with the animation, without a stutter (M4).
9. **Battery.** 効果音 only, app open for 15 minutes. Settings → Battery shouldn't show the app far above its usual
   share (M3).
10. **音量.** Drag through 0 and back up. The music shouldn't restart from the top (L4). Check that the 05:00 and 15:00
    tracks are both comfortably audible at the default volume (M5, L5).

## Verification

- `BASE_PATH=/fitness npm run build`: OK. The built SW precache filter excludes `audio/`. After install, the shell
  cache has 0 audio entries.
- Instrumented Chrome run (Playwright, `channel: 'chrome'`, iPhone 13 profile, SW enabled, `?demo` on
  `vite preview --port 4191`): results in "Verified OK". H1 and M1 were reproduced as described. No console or page
  errors.
- Scripts lived in `/tmp/r16-sound/` (copied into `app/` as `.r16snd-*.mjs` only to run, then deleted).
