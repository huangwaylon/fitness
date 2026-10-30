# Island Fund: sound

How the app sounds, after *あつまれ どうぶつの森* (New Horizons, NH), and how it is built (`app/src/lib/sound/`). Round 14 (sound designer, audio engineer, game-feel reviewer); the review is [round-14/sound-review.md](../reviews/round-14/sound-review.md). Section numbers (§1–§11) match the references in code comments.

**Standing decisions.** Sound is **OFF by default** (all three kinds) and kept per phone. Japanese-first labels. Nothing sounds without a reason the user can see: idle life is silent. **IP:** the hourly music and the opening theme are the user's own files, committed by the user's decision (§9.2). Every sound effect is an original procedural placeholder (§8). No downloaded game effects are in the repo, and the manifest is ready for files when the user decides where they come from.

NH facts below come from play and the official soundtrack's track list. Where a detail is from memory rather than checked, it says so.

---

## 1. Hourly music

**In NH.** The island's music is the clock. There is one theme per real-world hour (24 of them, 5 AM bright and early, 3 AM sparse and sleepy), each in three arrangements: **sunny, rainy and snowy**, so 72 tracks in all. The official soundtrack names them that way ("5:00 AM (Sunny)", "(Rainy)", "(Snowy)"). The weather variant is the same tune, rearranged softer and darker, and it follows the island's weather that hour. The hour's theme loops for the whole hour. At the top of the hour the playing theme **fades out and the new hour's theme starts from its beginning**: there is no chime, just a short breath between two tunes. Special days replace the hourly music (fireworks, the New Year countdown, tourneys, K.K. Slider's Saturday-evening show in the plaza), and there's a separate theme on the title screen.

**Level.** NH has **no audio options**, only the console's volume. The BGM is mixed gently and sits *under* the effects and the ambience: you hear the surf and your footsteps over the tune. Under menus and the NookPhone the music dips and dulls (from play, not measured).

**Here.**

| | NH | Island Fund |
|---|---|---|
| Track choice | The real hour (the console's clock) | The **Tokyo hour** (`time/clock.ts` `jst()`), like every other clock in the app; `?date=` previews it |
| Weather | Sunny / rainy / snowy arrangements | `sound.weather` hook (`sunny` now; `?weather=rain\|snow` previews). A missing variant falls back to **the same hour's sunny track**, never another hour |
| Hour change | Fade out, new theme from its top | **3 s crossfade**: the old track fades over 3 s, the new one enters from its loop start 1 s in and is full at 3 s (`hourly.ts CROSSFADE`). The next hour's file is fetched **a minute early** (`PREFETCH_MS`), so the change never waits on the network |
| Loop | Whole hour | Each file is **one sample-exact loop period plus a 3 s copy of its start** (§9.2). The two decks **hand over inside the copy**, where both hold the same samples: the idle deck loads the file 4 s before the period ends, starts at the matching point once the playing deck is 0.12 s into the copy, is lined up to within 12 ms by the decks' reported positions, and takes over with a 0.15 s crossfade (`session.ts WRAP`). WebKit implements `<audio loop>` as a seek to 0 at the end, which can drop out for 20–80 ms; the hand-off never seeks at the seam. If a hand-off can't happen (timers held up), the deck carries on from the same point in the music when its file ends. Playback starts at the period's musical start (`start` in the manifest) |
| Coming back | n/a | Hidden / locked: silence at once. Back in front: the same hour fades back in over 0.8 s from where it was; a changed hour crossfades in. Any deck that isn't audibly up fades in (also one iOS played from the lock screen while hidden: round 16 H1) |
| Title theme | The title screen | The **opening theme** plays when ミュージック is turned on, unmuffled, under the phone that started it. **Closing the phone is "pressing A"**: the hour's track takes over with the crossfade. If the phone stays open, the hour follows when the opening ends |
| Level | Gentle, under the effects | Music bus 0.30, ambience 0.28, effects 0.90, blips 0.40, × master 音量² (§7). Each track is **normalised to −16 LUFS** by its manifest `gain` (§9.2), so the hours sit level with each other and the opening is no longer the loudest |

## 2. Ambience

**In NH.** The island is never silent between notes. The main layers:
- **Surf** grows as you near the beach; rivers and waterfalls are positional.
- **Birdsong** on fine mornings and days.
- **Insects follow the real seasons and hours of the northern hemisphere:** cicadas by day in July–August, the evening cicada (ヒグラシ) at dawn and dusk in summer (the bug's 4–8 AM / 4–7 PM window), crickets and bell crickets on autumn nights.
- **Wind** in winter.
- **Rain patter** (on the umbrella when you hold one), and snowfall that softens everything.

**Here.** `ambient.ts ambientFor(hour, month, weather)` picks the layers and their levels:

| Layer | When |
|---|---|
| `waves` 0.5 | always |
| `birds` 0.45 (05–09) / 0.3 | 05:00–17:00, March–November, not in rain or snow |
| `cicadas` 0.35 | 08:00–17:00, July–August, fine |
| `higurashi` 0.35 | 04:00–08:00 and 16:00–19:00, July–August, fine |
| `crickets` 0.35 | 17:00–05:00, September–November, not snow |
| `wind` 0.25 (0.4 in snow) | December–February, or snow |
| `rain` 0.55 | rain |

The layers loop as decoded buffers (short mono files, gapless). Each one starts at a random point so the surf isn't the same every launch, and fades in or out over about 2 s. They play on the music bus (ミュージック), ducked and muffled with it. **No placeholder:** a synthesised surf wore thin within a day in the review (R6). Ambience is silent until files are listed (§9).

## 3. UI sounds (NookPhone and menus)

**In NH.**
- **NookPhone:** it comes up with a bright little rising figure and its app icons pop in. Opening an app is a select "pop" plus the app's own sting, and putting the phone away is a short falling figure.
- **Menus:** the cursor moves with a soft tick, Ⓐ confirms with a bright two-note "pi-pon", and Ⓑ cancels with a lower, rounder pair.
- **Inventory:** opening the pockets rustles like a bag.

Everything is short (≤ 0.5 s), soft-attacked and pitched: mallets and bells, not clicks.

**Here.** `phone-open` (C–E–G–C mallet arpeggio), `phone-close` (G–C), `phone-app` (a gliding pop plus a bell), `cursor` (a 45 ms tick), `confirm` (E→B, up a fifth), `cancel` (D→G, down a fourth, triangle). The しまフォン plays them on open, close, app and ‹ back. NH's choice list plays the tick when its cursor moves (keyboard, or a mouse hover) and the confirm when an answer is picked.

## 4. Dialogue blips

**In NH.** Speech is **Animalese**: the text is spoken as it types, every syllable a sped-up, pitched blip of the real phoneme (in the Japanese version each kana is read). The voice depends on the villager (personality and species set pitch and timbre). **しずえ (Isabelle)** has her own high, soft voice, and the morning announcement is hers. Questions rise at the end, and emphasised words are pushed. Ⓐ hurries the line, and the voice stops with the text.

**Here** (`dialogue.ts blipPlan`, `Bubble.svelte`):
- The box types at 33 ms a glyph, too fast for one blip each, so **every other spoken glyph** gets a blip (≈ 15 a second). Punctuation and spaces are silent, and 。！？ pause the voice as they pause the text.
- **Pitch follows the glyph** (±3 semitones from its code point), so the same line always "says" the same thing. A line ending in ？ rises 4 semitones on its last two blips.
- **Cap:** 40 blips a line, then the voice stops (it never drones on a long line).
- Two voices: `blip-host` (しずえ: a 560 Hz gliding triangle with a little harmonic body) and `blip-villager` (anyone else, e.g. たぬきち on the error screen: 300 Hz, squarer).
- Tap-to-finish stops the blips with the text. A new line cancels the old one.
- **We read no actual phonemes.** That would be Animalese itself (ac-research §4 rules out an Animalese voice); these are pitched syllable blips in its spirit.

## 5. Item, money, island and reaction sounds, and the mapping

**In NH.**
- **Item get:** "You got …!" with a short music-box fanfare, a bigger brass fanfare for a catch or a new DIY recipe, and a pose.
- **Bells:** picking up a bag of bells is a bright jingle, a bag set down clinks, and coins scatter when a tree drops 100 bells.
- **The ATM** (the ABD at Resident Services) counts deposits in with a coin rattle.
- **Nook's Cranny:** a purchase is rung up with a register-style ding (from memory).
- **Shaking a tree:** a leafy rustle, then each fruit lands with a soft thud (sometimes a wasp nest or furniture drops instead).
- **Villager emotes** each carry a sound under the bubble: a sharp sting for "!", a twinkle for joy, notes when humming.
- **Footsteps** change with the ground: grass, dirt paths, sand, wood (bridges, floors), stone and snow crunch, plus a splash in shallow water.
- **Nook Miles:** an achievement drops a banner from the top with its own short jingle.
- **Morning announcement:** the day's announcement at Resident Services opens with a PA-style chime.

**Mapping** (one table in code: `cues.ts CUES`; villager reactions name their cue in `reactions.ts`, and the director plays it):

| App moment | Where | NH sound | Cue → sound id | Placeholder now (`synth.ts`) |
|---|---|---|---|---|
| Tap a tree (canopy) | `FruitTree` | tree-shake rustle | `tree-shake` → `rustle` | band-passed noise swell with leaf-crackle grains, 0.42 s |
| A fruit lands | `FruitTree` drop-in (at 55% of the 520 ms fall) | fruit thud | `fruit-land` → `thud` | 150→55 Hz sine drop and a soft click |
| New ベル arrive (the "+N" pops) | `JarSpot` | bell-bag jingle | `bells-arrive` → `bells` | C7–E7–G7–C8 bell run and a shimmer |
| Each coin into the jar | `CoinFlow` (per coin) | bells counting in (ATM rattle) | `coin-land` → `coin`, one pentatonic step per coin across the batch | two-strike bell "chi-ling" (E7, A7) |
| Badge met (the harvest tally) | `HarvestOverlay`, after the last badge pops | Nook Miles achievement jingle | `badge-met` → `miles` (jingle) | E6–G6–C7 mallets and a shimmer |
| Sunday harvest 受け取る！ | `HarvestOverlay` | item-get fanfare (K.K. Slider stays for later, §12) | `harvest-receive` → `fanfare` (jingle, ducks the music) | an original rising arpeggio to a held vibrato G6 over a soft chord, 1.4 s |
| Buy a treat or trip | `routes/jar` | shop purchase "ka-ching" | `buy` → `purchase` | drawer noise "ka", then a C–E–G register bell |
| Open / close the phone | `ShimaPhone` | NookPhone open / put away | `phone-open` / `phone-close` | mallet arpeggio up / two notes down |
| Open an app / ‹ back | `ShimaPhone` | app select / Ⓑ | `phone-app` / `back` → `cancel` | gliding pop and bell / down a fourth |
| しずえ and others talking | `Bubble` | Animalese | `blip-host` / `blip-villager` (おしゃべり) | §4 |
| Check-in saved (a habit ticked on) | `CheckinSheet` | Ⓐ confirm | `checkin-saved` → `confirm` | "pi-pon", E6→B6 |
| A habit ticked off, a settings row | `CheckinSheet`, `SoundApp` | cursor tick | `toggle` → `cursor` | 45 ms tick |
| Choice cursor moves / picked | `ChoiceList` | cursor / confirm | `choice-move` / `choice-pick` | tick / pi-pon |
| Tap a villager (R9, R10) | reactions | emote pop | `villager-tap` → `pop` | 420→950 Hz pop |
| Partner's data arrives (R3), woken up (R14) | reactions, `wake()` | "!" surprise sting | `emote-surprise` → `surprise` | an upward boing and a bell |
| High-five received (R5) | reactions | love emote | `emote-love` → `heart` | two soft notes up, a little vibrato |
| High-five sent (R4), fruit ripe (R6), all ripe (R8) | reactions | joy twinkle | `emote-joy` → `sparkle` | G6–C7–E7 bells |
| Fruit stage up (R7) | reactions | inspiration "!" | `emote-idea` → `pop` | pop |
| Sync problem (R17) | reactions | a sheepish "oops" | `trouble` → `oops` | a falling wobble |
| Jar tapped (R18), しずえ tapped | reactions, `hostTap()` | emote pop | `jar-tap`, `host-tap` → `pop` (softer) | pop |
| First open of the day (R1) | reactions | Resident Services announcement chime | `announce` → `chime` (jingle) | ピンポンパンポン F–A–C–F on a soft vibraphone. It fires before any tap can unlock audio, so it waits up to 15 s for the first tap (as NH plays it when you step out) |
| Scenery taps (bushes, flowers, sea, sand, grass, clouds, sun, moon, stars, the balloon) | `SceneTaps`, `Balloon` → `sceneSfx(kind)` | rustles, footsteps, splashes, twinkles | `scene-<kind>` (world cues): bush → `rustle` .7; flower → `swish`; butterfly → `sparkle` .3 +7 st; cloud → `puff`; sun → `sparkle` .5; moon → `sparkle` .4 −3 st; star → `sparkle` .3 +12 st; shooting star → `twinkle` (not a jingle: no duck); sea → `splash`; fish → `splash` .6 −4 st; sand / grass / snow → `step-sand` / `step-grass` / `step-snow`; balloon → `squeak` | swish: high band-passed noise swell; puff: low airy swell; twinkle: a rising G6→C8 glide with three bells, 0.76 s; splash: a 320→980 Hz plop and spray; steps: short gritty / soft / squeaky noise; squeak: a wobbly 330→760 Hz triangle. All ≤ 0.45, jittered 30–90 cents, two at once |
| Startup beats (R11, R12, R15), naps (R13), the dance (R16), R2, idle life, strolls | | (NH's ambient life) | **silent** | Sounds come only from taps and events (review R4). Footsteps are not used: the villagers stroll at diorama distance |

**World vs UI.** Cues of the island itself (rustle, thud, coins, bells, emotes, the chime) are skipped **while a sheet, the phone or the harvest covers the scene** (NH's world goes quiet under its menus). UI cues (confirm, phone, buy, fanfare, Nook Miles) always play. A check-in tick is therefore one confirm. The fruit falls silently behind the sheet, and the reward (bells and coins) sounds when the sheet closes and the coins fly.

## 6. Engine (`lib/sound/`)

| File | What |
|---|---|
| `ids.ts` | Sound ids, buses (`music`, `sfx`, `voice`), level, pitch jitter, per-id voice cap, jingle flag |
| `cues.ts` | **The mapping** (moment → sound, level, delay, world/UI) and `cue()` |
| `sound.svelte.ts` | The controller: settings state, unlock on the first tap, the hour clock, weather hook, muffle, visibility, the opening hand-over; `play()`, `talk()`, `setSound()`, `startSound()` |
| `engine.ts` | Web Audio: one context, buses, buffers, voices, the duck, the muffle, two music decks (crossfades, the loop hand-off), ambience loops, the audio session, the idle suspend |
| `session.ts` | Pure: the session type and its switching order, when a cue may sound, when a tap must unlock, the idle timer, when a deck fades back in, the hand-off timing |
| `mix.ts` | Pure: `VoiceLimiter`, `jitterRate`, `semitones`, `duckPlan` |
| `hourly.ts` / `ambient.ts` | Pure: track choice, next hour, crossfade plan / ambience layers |
| `dialogue.ts` | Pure: the blip plan |
| `synth.ts` | Pure: the placeholder renders (lazy-loaded after the first unlock) |
| `manifest.ts` | `static/audio/manifest.json` parsed and validated (bundled; the readme is stripped in `vite.config.ts`) |
| `settings.ts` | Settings, defaults, sanitising, persistence |

```
effects  AudioBufferSource → gain ─┬→ sfx bus ──┐
blips    AudioBufferSource → gain ─┴→ voice bus ┼→ master (音量²) → speakers
music    <audio> deck A/B → gain ─┐            │
ambience loop sources → ambient ──┴→ duck → muffle (low-pass 900 Hz under sheets) → music bus
```

- **Effects are decoded buffers.** A file from the manifest is decoded once. Otherwise the placeholder is rendered at the context's rate and kept (≈ 12 s of mono in all, ≈ 2.3 MB). The renderer chunk is fetched 2 s after launch when a setting is on (never while all are off); after the first unlock the placeholders are **pre-rendered one per idle slot** (`requestIdleCallback`, or 60 ms timeouts on Safari), jingles first and only for the kinds that are on, so the 25–35 ms fanfare, chime and heart renders never land on their cue. A renderer chunk that fails to load (a stale build after a deploy) is forgotten and retried by the next tap or cue.
- **Pitch variation like NH:** every play detunes at random within the sound's `jitter` (rustle ±80 cents, pop and thud ±60, coin ±25, UI and jingles 0).
- **Nothing is queued while locked, interrupted or in the background:** a sound asked for before the unlock, while hidden or while the context is interrupted is dropped (except the daily chime, §5). The tap that resumes the context may schedule its own sound for **250 ms** (`RESUME_WINDOW_MS`), and anything scheduled in that window is stopped if the context still isn't running 300 ms later (in WebKit a `resume()` during a call or Siri stays pending until it ends). So nothing bursts out later.
- **Idle suspend.** With only 効果音 / おしゃべり on, the context is suspended **10 s after the last sound** (`IDLE_SUSPEND_MS`; an open context keeps the audio hardware awake). The next tap resumes it as usual; a cue without a tap (the partner's bells, a director emote, the idle shooting star) resumes it itself, and is dropped if iOS refuses. Never while music plays.
- **Wired in one place:** villager reactions carry a `cue` per step in the catalogue (`reactions.ts`), played by the director (`applyStep` / `play`: once per step, never for an absent しずえ). The remaining moments call `cue()` where they happen. There are no ad-hoc `play()` calls in components.
- `prefers-reduced-motion` does not mute sound: sound is separate, and the settings decide.

## 7. Mix rules

- **At most 6 voices** at once (`MAX_VOICES`). Per id: rustle, thud, pop, sparkle, blips and the scenery sounds 2; coin 3; everything else 1. A new one stops the oldest of its id. Over the total, the oldest non-jingle voice stops.
- **Jingles** (`fanfare`, `miles`, `chime`) never overlap: a jingle while another plays is dropped. The **music ducks to 25%** under a jingle (0.12 s down, back over 0.8 s after it ends; `duckPlan`).
- **Levels** (bus × sound): music 0.30, ambience 0.28, effects 0.90, blips 0.40. Sounds: UI ticks 0.35, confirm 0.55, island actions 0.6–0.7, coins 0.4 (a flight's first two coins at 60%), jingles 0.55–0.75. Nothing above 0.8 (tested). Master 音量 is squared (an even-feeling slider), default 0.8.
- **Coins:** a batch climbs one major-pentatonic run (0, 2, 4, 7, 9, 12, 14, 16, 19 semitones), one note per coin across every flight, then holds the top. It reads as one rising gesture.
- **Muffle:** a low-pass at 900 Hz on the music and ambience while a sheet, the phone or the harvest is up (not during the opening theme).

## 8. Placeholder effects

`synth.ts` renders every id from a few primitives: soft **mallets** (a sine plus a 4× partial), **bells** (inharmonic 2.76× / 5.4× / 8.93× partials), **vibraphone** (with tremolo), **glides** and **band-passed noise** (with crackle grains for leaves). Every render is deterministic (seeded noise), peaks at 0.8 and ends with a 5 ms fade. All are under 1 s except the fanfare (1.4 s) and the chime (2.1 s). They are original:
- The jingles are plain arpeggios.
- The announcement is the generic Japanese PA ピンポンパンポン.
- Nothing quotes a game melody.

They are good enough to tune timing and levels by, and are meant to be replaced (§9).

## 9. Files and the manifest

`app/static/audio/manifest.json` (paths relative to `static/audio/`; add a file and its entry, rebuild; no code change):

```json
{
  "sfx": { "coin": "sfx/coin.m4a", "rustle": "sfx/rustle.m4a" },
  "opening": { "file": "music/opening.m4a", "start": 0, "gain": -5.3 },
  "music": {
    "sunny": { "07": { "file": "music/hour-07.m4a", "start": 66.188, "end": 75, "gain": -1.8 } },
    "rain":  { "07": { "file": "music/rain-07.m4a", "start": 0 } },
    "snow":  {}
  },
  "ambient": { "waves": "ambient/waves.m4a" }
}
```

| Kind | Keys | Suggested name | Format |
|---|---|---|---|
| Effects | `sfx.<id>`: `cursor confirm cancel phone-open phone-close phone-app blip-host blip-villager rustle thud coin bells purchase fanfare miles chime pop surprise heart sparkle oops` | `sfx/<id>.m4a` | AAC-LC .m4a, mono 44.1 kHz, ~64 kbps, under 3 s, trimmed tight (no leading silence: the cue timing assumes the sound starts at 0) |
| Hourly music | `music.<sunny\|rain\|snow>.<00–23>` = `{ file, start, end?, gain? }` (a bare path plays from 0) | `music/hour-HH.m4a` (sunny, present), `music/rain-HH.m4a`, `music/snow-HH.m4a` | AAC-LC .m4a, stereo 44.1 kHz, 64 kbps, `+faststart`, **one seamless loop period**, plus a 3 s copy of its start when `end` (the period's end, s) is given (the deck hand-off, §1). Without `end`, `<audio loop>` wraps the file. `start` = where the loop begins musically. `gain` = dB to −16 LUFS (clamped to −24…+12 in the engine) |
| Opening | `opening` = `{ file, start: 0, gain }` or a bare path | `music/opening.m4a` (present) | as music, a one-shot |
| Ambience | `ambient.<waves\|birds\|cicadas\|higurashi\|crickets\|wind\|rain>` | `ambient/<id>.m4a` | AAC-LC .m4a, mono, 10–30 s seamless loops |

A missing or undecodable effect file keeps its placeholder. Missing music or ambience is silence. Unknown keys are dropped and flagged by the test (`sound.test.ts`), which also checks that every listed file exists and the music budget holds (≤ 1 MB a track, ≤ 20 MB in all).

### 9.2 The hourly music in the repo

**The 24 hourly tracks and the opening theme are user-provided and committed by the user's decision** (2026-10-30). They are the user's own copies, and the repo and site are public (ADR 0018), with the same takedown risk and the same response: delete `static/audio/music/` and the app falls back to silence. Effects are not downloaded; the placeholders stand in until the user chooses official files or original recreations.

`npm run audio:music -- <dir>` (`scripts/music.ts`) rebuilds them from the source MP3s (`1-01. Opening Theme.mp3`, `1-02. 1200 AM (Sunny).mp3` … `1-25. 1100 PM (Sunny).mp3`). The script never downloads, and the sources stay out of the repo. The rips play each loop about twice and fade out. Per hour, the script:
1. **Finds the loop period** with a spectral self-similarity scan (the largest lag at which the track repeats itself for at least as long as the lag).
2. **Refines it to the sample** by cross-correlation, from a point at least 8 s into the loop. The first pass's opening differs: it lacks the reverb that spills over from the loop's end, which is why the cut is taken from inside the loop. Every hour matched at **0.9956–1.0000**, and many periods came out as round musical lengths (54.000, 72.000, 84.000, 96.000 s).
3. **Cuts one period there**, with a 250 ms safety blend into the audio before the cut (a no-op when the period is exact).
4. **Records the musical start** (the loop's first beat as heard on the second pass) as `start`.
5. **Appends a 3 s copy of the period's start** (the same samples the loop wraps to) and records the period's end as `end`.
6. **Encodes** AAC-LC 64 kbps stereo with `+faststart`, and writes the manifest's `music.sunny` and `opening`.
7. **Measures loudness** of every encoded file (ffmpeg `loudnorm` analysis: EBU R128 integrated loudness and true peak) and writes `gain` = −16 LUFS − measured, held so that the true peak after the gain and the music bus (0.30 = −10.5 dB) stays under −1 dBTP at full volume, within −12…+6 dB. `npm run audio:music -- --gains` re-measures only this, from the committed files.

**Result** (round 16): 24 loops of 50–104 s (+3 s copy), 0.43–0.86 MB each, **14.5 MB** in all (plus the 0.5 MB opening). Checked by decoding: every copy lines up with the period's start at lag 0 (correlation 0.977–0.997; the rest is AAC coding noise, −13 to −22 dB, which a 0.15 s crossfade of the same music hides). Measured loudness before the gain: the opening −10.7 LUFS, the hours −18.7 (05:00) to −11.9 (12:00), a 7 LU spread. Gains: opening −5.3 dB, 12:00 −4.1, 08:00 −3.4 … 00:00 +1.4, 05:00 +2.7: everything plays at −16 LUFS. The true-peak ceiling binds nowhere (the loudest peak, 15:00 at +4.1 dBTP, lands at −9.1 dBTP after its −2.7 dB and the bus).

## 10. Settings (しまフォン → サウンド)

A sixth しまフォン tile (our own note glyph on a leaf tile: NH's phone has no sound app, since its volume is the console's). Three ON/OFF rows and a slider:
- **ミュージック** (1時間ごとに変わるBGM): the hourly music and the ambience.
- **効果音** (タップ・コイン・ジングル): every effect and jingle.
- **おしゃべり** (しずえたちのセリフの声): the dialogue blips.
- **音量**: 0–10, master.

All start **OFF**. Each row is a `role="switch"` with NH's yellow selected tier when on, plus a leaf switch. Every control has the round-13 brown edge. The volume row takes the disabled tier (sunk, no edge) while all three are off.

Turning a kind on previews it: 効果音 a confirm, おしゃべり a few blips, ミュージック the opening theme. The note under the rows says what's playing (いまはオープニングテーマ / いまは15時の曲) and how the silent switch works: 「ミュージックは消音モードでも鳴ります（ほかのアプリの音楽は止まります）。ミュージックがオフのとき、効果音とおしゃべりは消音モードに従います。」

音量 at 0 with a kind on is **muted, not off**: the master goes to 0, and after 0.8 s the decks pause where they are and the context sleeps. Turning it up again resumes the same track in place (it doesn't restart the hour or replay the opening). Only all three switches off is "off".

Settings are kept in localStorage under `DEVICE.sound` = `island.sound` (`sync/storage.ts`, the storage registry): a phone's speaker is not shared data, so they are not synced like the language. The live app and the demo share them.

## 11. iOS (Home Screen web app) constraints and choices

- **Autoplay.** WebKit starts audio only from a user gesture. The controller listens (capture phase, passive) for `pointerup`, `touchend`, `click` and `keydown`. On the first one after a setting is on, it creates the `AudioContext` and `resume()`s it inside the gesture, starts a 1-sample buffer (older iOS), and **plays a 50 ms silent WAV on both music `<audio>` decks** (they count as unlocked once that play succeeds; until then every tap tries again). iOS lets an element play later only if it played once inside a gesture. Turning a setting on is itself such a tap. Scenery taps sound on `pointerdown`, which on a touch screen isn't a user activation, so `pointerdown` is also listened to: it only creates and resumes the context (the tap's sound is scheduled in the 250 ms resume window, §6), and the `pointerup` does the rest. After a call, Siri or the background, iOS can leave the context `suspended`/`interrupted`; the next tap resumes it, and a `statechange` back to `running` brings the music back by itself. A current track that something outside paused (Control Center, AirPods out, Siri) also counts as needing a tap, so the next tap resumes it. **No context exists until a setting is first turned on** (an open context keeps the audio hardware awake); after that a *suspended* one remains while everything is off.
- **The Ring/Silent switch and the audio session** (round 16, option A). Web Audio in Safari is muted by the switch, but a plain `<audio>` element plays through it (media playback category). Where `navigator.audioSession` exists (WebKit's Audio Session API), the engine sets **`'playback'` only while ミュージック is on**, so the music plays **even in silent mode** (user decision 2026-10-30). Like any media app, that **stops music playing in other apps** (Spotify, Podcasts), and they don't resume by themselves. With music off the type is **`'ambient'`**: 効果音 and おしゃべり mix with the user's own audio and follow the silent switch. While music is on, effects and voices play in silent mode too (the session is per page). Order (`session.ts SessionSwitch`): the type is set before the context is created, `'playback'` is set at once inside the tap that turns music on (before any deck plays), and the change back to `'ambient'` waits 0.8 s for the music's fade-out. Music pauses when the app is hidden, so it never plays from a pocket.
- **Older iOS without `navigator.audioSession`.** The page's category follows whatever media is active. Effects are audible in silent mode only while the music deck plays; with only 効果音 or おしゃべり on, the switch mutes them. Not worked around (the user's iPhone runs iOS 26).
- **Why `<audio>` for music and buffers for effects.** Decoding a 1–2 minute track costs 20–40 MB of PCM on a phone, so music streams through two `HTMLAudioElement` decks into `MediaElementAudioSourceNode` → `GainNode`. iOS ignores `HTMLMediaElement.volume`, so every level and fade is a gain node. Effects are short, so decoded buffers give instant, sample-accurate, pitch-shiftable playback.
- **Background and lock.** `visibilitychange` → hidden (and `pagehide`): gains to 0, both decks paused, ambience stopped, context suspended (iOS would suspend the page anyway). Visible (and `pageshow` from the back/forward cache): resume, fade the same hour back in, re-arm the hour timers. A deck's start that was pending when the page hid is cancelled, and a deck that starts playing while the page is hidden is paused at once.
- **Lock screen / Control Center (Media Session).** Under `'playback'`, iOS may make the music deck the Now Playing item. The app takes the Media Session over so that tile does our thing (round 16 H1): **▶** resumes the music only while the app is in front (never from a pocket; hidden, it just shows paused); **⏸ / stop** fade the music out and hold it in place, and the next tap in the app brings it back; seeking and skipping are disabled. The tile is named after the tune (「いまは15時の曲」 without the ♪) with 「しまの貯金箱」 as the artist and the app icon, so it isn't a bare URL. `playbackState` is `playing` / `paused` / `none` with the music. If iOS still shows a tile after locking [device], releasing the deck's source in `pause()` is the next step (round 16 review H1).
- **Formats and budgets.** AAC-LC in .m4a: iOS decodes it natively in both `<audio>` and `decodeAudioData`, and Safari's Ogg/Opus support is uneven. Music 64 kbps stereo, 0.4–0.9 MB a track, 14.5 MB in all. In memory at most two music blobs (the current hour and the prefetched next), never decoded (the loop hand-off plays the same blob on both decks). Effects ≈ 2.3 MB decoded. The engine is in the main bundle (small), the placeholder renderer loads after the first unlock, and the manifest is ~1.5 KB of JSON in the bundle; audio is never imported into JS.
- **Service worker** (`service-worker/index.ts`, `caches.ts`):
  - **Audio is never precached.** Its 14 MB would land on every install for a feature that starts off. `precachable()` keeps `audio/` out; it also matches `$app/manifest`'s relative paths, which the old filter missed for villager art and the art manifest.
  - **A runtime cache, `island-audio-v1`, cache-first,** survives new builds.
  - **The music is LRU-limited to 3 files** (≈ 2.4 MB): a hit is re-put to mark it recent, and the oldest goes. Effects and ambience are small and kept.
  - The engine **fetches whole music files and plays them from `blob:` URLs**, so no `Range` request ever reaches the worker (a cached 200 answering a Range request breaks Safari's media playback). The worker passes any Range request straight to the network. An hour heard once plays offline.
  - The CSP allows `media-src 'self' blob:`.

## 12. Not done (yet)

- **Effect files.** Waiting on the user's choice between official files and original NH-style recreations. Drop-in per §9.
- **Rain and snow arrangements, and ambience files.** The slots and the weather hook are ready, but there is no weather source.
- **K.K. Slider for the Sunday harvest** ("K.K. style"): NH's Saturday-night concert would fit the weekly harvest. It needs a file and a user decision, and the item-get fanfare stands in.
- **Footsteps by ground type:** no player avatar walks, and the villagers stroll at diorama distance (silent by design).
- **Not heard on a real iPhone yet.** The unlock, the silent switch, the session switching, background behaviour, the Media Session and the loop hand-off were verified in Chrome (Playwright, an instrumented AudioContext and `<audio>` decks). They need a pass on the user's iPhone (round 16 sound review, "Test on the real iPhone").
