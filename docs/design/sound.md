# Island Fund: sound

How the app sounds, after *あつまれ どうぶつの森* (New Horizons, NH), and how it is built (`app/src/lib/sound/`). Round 14 (sound designer, audio engineer, game-feel reviewer); the review is [round-14/sound-review.md](../reviews/round-14/sound-review.md). Section numbers (§1–§13) match the references in code comments.

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

**Here.** `phone-open` (C–E–G–C mallet arpeggio), `phone-close` (G–C), `phone-app` (a gliding pop plus a bell), `cursor` (a 45 ms tick), `confirm` (E→B, up a fifth), `cancel` (D→G, down a fourth, triangle). The しまフォン plays them on open, close, app and ‹ back. NH's choice list plays the tick when its cursor moves (keyboard, or a mouse hover) and the confirm when an answer is picked. Every other control names its sound on the element (`data-sfx`): a select for opening, a paper flick for きろく's levels, Ⓑ for cancel and dismiss, a switch pair, soft keypad clicks, a sync whoosh, a poof, an undo blip and a "can't" boop (§13).

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
| A habit ticked off, a サウンド switch | `CheckinSheet`, `SoundApp` | a switch on / off | `toggle-on` / `toggle-off` | two quick notes up / down (§13) |
| Every other tap (tabs, cards, keys, cancel, sync, remove, undo, "can't") | `data-sfx` on the control, `taps.ts` | NH's menu sounds | §13 | §13 |
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
| `taps.ts` | Every tap's sound: one delegated click listener reads the control's `data-sfx`; `aria-disabled` controls boop (§13) |

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
- **Wired in one place:** villager reactions carry a `cue` per step in the catalogue (`reactions.ts`), played by the director (`applyStep` / `play`: once per step, never for an absent しずえ). Taps name their sound on the control (`data-sfx`, §13), and one listener plays it. The remaining moments (outcomes: a purchase, a check-in, the fanfare) call `cue()` where they happen. There are no ad-hoc `play()` calls in components. `cue()` runs untracked, so a cue fired from an `{@attach}` or an `$effect` never makes it depend on the sheets or the settings.
- `prefers-reduced-motion` does not mute sound: sound is separate, and the settings decide.

## 7. Mix rules

- **At most 6 voices** at once (`MAX_VOICES`). Per id: rustle, thud, pop, sparkle, blips and the scenery sounds 2; coin 3; everything else 1. A new one stops the oldest of its id. Over the total, the oldest non-jingle voice stops.
- **Jingles** (`fanfare`, `miles`, `chime`) never overlap: a jingle while another plays is dropped. The **music ducks to 25%** under a jingle (0.12 s down, back over 0.8 s after it ends; `duckPlan`).
- **Levels** (bus × sound): music 0.30, ambience 0.28, effects 0.90, blips 0.40. Sounds: keypad 0.26, UI ticks 0.35, the tap sounds 0.24–0.45 (§13), confirm 0.55, island actions 0.6–0.7, coins 0.4 (a flight's first two coins at 60%), jingles 0.55–0.75. Nothing above 0.8 (tested). Master 音量 is squared (an even-feeling slider), default 0.8.
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
- **The first tap starts the music, wherever it lands** (user report 2026-10-30: "music doesn't start until I interact with something that has a sound effect"). On iOS a tap on plain scenery is `pointerdown` → `pointerup` → `touchend` and **no `click`** (iOS fires click only on elements with a click handler), so nothing may depend on the click (`session.ts gestureAction`: `pointerdown` wakes the context only; `pointerup`, `touchend`, `click` and `keydown` each do the full unlock while anything still waits).
  - **Root cause.** The hour's `play()` never ran inside a tap. The tap only played the silent clip; the music file was fetched afterwards, and its `play()` ran after the fetch, `loadedmetadata` and a timer. That works only if WebKit carries the silent clip's unlock over to the new source. When it doesn't, the `play()` is refused and the deck stalls. The next tap then saw the decks as "ready", so it skipped the in-gesture `play()` and retried from a timer again. Reproduced in Chrome under a strict per-source media policy (`e2e/sound.spec.ts`): before the fix, taps on the sea never started the music.
  - **Fix.** (1) With ミュージック on, **the hour's file is prefetched 1 s after launch** (no context; the service worker's audio cache makes a relaunch instant). When the first tap asks for it, `setTrack` uses the resolved `blob:` URL with no `await`, sets the deck's `src` and calls `play()` **inside the tap**, at gain 0; the seek to the loop start and the fade-in follow. (2) A track that should be playing but isn't (refused, or paused from outside) is `play()`ed **synchronously inside the next tap of any kind** (`Engine.unlock`), not from a timer. (3) The decks count as unlocked only once a `play()` inside a gesture has succeeded; until then every activation retries.
  - **Limits.** A tap in the first second, before the file is in, may still need a second tap under the strictest policy (the file arrives after the tap). Verified in Chrome only (Playwright, an instrumented WebKit-like policy); needs the iPhone [device].
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

## 13. Every tap

User report (2026-10-30): "We are missing sound effects for various menu buttons. Anything tappable should have a corresponding sound effect that makes sense." Before this pass, 19 of the app's 71 tappable elements made a sound; the menus, きろく, the pots and the sheets' own buttons were silent.

**The rule.** Every tappable element names its sound on the element, in **`data-sfx`**, and one delegated listener plays it (`sound/taps.ts`, started in the root layout after `startSound`):

```svelte
<button data-sfx="open" onclick={…}>           <!-- a tap cue, played on the click -->
<button data-sfx="self" onclick={buy}>          <!-- the handler plays the outcome's own cue (buy → purchase) -->
<input data-sfx="none">                         <!-- deliberately silent (a text field: the system keyboard clicks) -->
<button aria-disabled={short > 0} data-sfx="open"> <!-- can't right now: swallowed, and the "can't" boop -->
```

- **On the click, so on commit only.** A click never follows a scroll or a drag, so nothing sounds on scroll or drag. The listener is on the document in the capture phase, after the unlock listener (so the tap that starts audio also sounds).
- **No double sounds.** A control whose action has an outcome sound says `self`, and the outcome plays alone: buy → `purchase`, a habit → `checkin-saved`, 受け取る！ → the fanfare, the phone's buttons → its own tunes, an island villager → its reaction. A tap that closes a sheet sounds the tap (保存 → confirm), and the sheet adds nothing; a sheet dismissed by hand (the backdrop, Esc, the grabber) is Ⓑ, played by `Sheet`.
- **"Can't" (NH's boop when you can't afford something).** A control that can't act now uses `aria-disabled="true"` instead of `disabled`. It stays focusable and announced as unavailable, looks the same (`theme.css` styles both alike), and still gets the tap: the listener swallows the click before the page sees it (`preventDefault` and `stopPropagation` in the capture phase, so no handler, no form submit, no link) and plays `boop`. A real `disabled` (no boop) is kept only where silence is right: the villagers and the jar during the opening beats, the volume slider while every sound is off, and つなぐ while the key is being checked.
- **UI cues always play.** Every tap cue is a UI cue, so it sounds under a sheet too. World cues still go quiet under sheets, and the voice limit (6, per-id caps) still applies.
- **Enforced** by `taps.test.ts`: it scans every `.svelte` file in `components/` and `routes/` (dev/ excepted) for `<button>`, `<a href>`, `<input>`, `<select>`, `<textarea>`, `role="button|switch|tab|radio|checkbox|…"` and `onclick=`, and fails on any without a `data-sfx`, on an unknown value, on a `self` or `none` without a reason in its table, and on a real `disabled` outside its allow-list. `e2e/sound.spec.ts` walks the screens and checks each tap's cue (the log below).

**The sounds** (new ids are procedural placeholders in `synth.ts` with manifest ids, so a file in `static/audio/manifest.json` replaces any of them; levels are the game-feel pass, loudest 50 ms RMS × level):

| Cue | Sound id | NH model | Placeholder | Level (≈ dB) | Used for |
|---|---|---|---|---|---|
| `tick` | `cursor` × 0.8 | the cursor moving | 45 ms tick | −27.6 | tabs, 今日/昨日, radios, a fruit ring, the volume slider (on change), a tree popup |
| `open` | **`select`** | selecting an item with Ⓐ | one soft triangle mallet (A6) | −22.5 | opening something: the check-in, a treat, 行く！, ✎ へんしゅう, ＋ add a row |
| `page` | **`page`** | (the Nook Miles log's pages) | a paper flick | −22.9 | going deeper in きろく: a week, a day, the weight card, ✎ (each pencil), ＋ workout, a type, なかったことに |
| `confirm` | `confirm` | Ⓐ "pi-pon" | E6 → B6 | −15.5 | primary actions: 保存, ハイタッチ, 島へもどる, the demo / home links, つなぐ |
| `choice-pick` | `confirm` | Ⓐ on a choice | | −15.5 | NH's choice list (けってい, はい) |
| `back` | `cancel` | Ⓑ | D6 → G5 | −18.1 | ‹ back, やめる (button or choice), あとで, a dismissed sheet or banner, ◀ 島へ |
| `toggle-on` / `toggle-off` | **`toggle-on`** / **`toggle-off`** | a switch | C6 → G6 / G6 → C6 (rounder) | −20.6 / −22.5 | サウンド switches, a check-in fixed in きろく; a habit off in チェックイン |
| `key` / `key-fn` | **`key`** (⌫ and C 5 semitones lower) | the text-entry keyboard | a 35 ms "tok" | −31.4 | the ATM keypad, tapped or typed: the softest sound in the app |
| `sync` | **`whoosh`** | (the rescue service's call) | an airy rising whoosh and a bell | −19.5 | いま同期, the sync pill, もう一度 (retry) |
| `remove` | **`poof`** | an item vanishing in a puff | a low airy swell and a falling note | −19.7 | × a menu row |
| `undo` | **`undo`** | (the app-open blip reversed) | 1300 → 600 Hz glide and a low note | −19.9 | もとに戻す on any banner |
| `boop` | **`boop`** | can't afford / can't do | two soft low notes down (330 → 247 Hz) | −20.0 | any `aria-disabled` control: a treat it can't afford, 買う！ when short, ぜんぶそろいました, 保存 with nothing changed, ＋ when the menu is full, a future day, いま同期 while syncing, けってい with nothing typed, つなぐ before the key is whole; a failed purchase or harvest |
| (kept) | `purchase`, `phone-*`, `checkin-saved`, `harvest-receive`, the island cues | | | | outcomes (`self`) |

**Game feel** (daily use). The keypad is 9 dB under a tab tick and 16 dB under a confirm; the paper flick (`page`), the most frequent sound in きろく, sits under the select; every tap sound is under 0.6 s except the whoosh. Taps that change nothing are silent (the tab, day, language or villager already chosen; a banner with 取り消す, where a tap only holds it). The choice list still ticks when its cursor moves by mouse or keyboard (NH's cursor), not on touch.

**Deliberately silent.** Text fields (the key, the weight, menu names and prices, the villager's name and search): the system keyboard has its own clicks. Scrubbing the weight chart (a drag). Finishing しずえ's line with a tap (the blips stop, as Ⓐ skips text in NH; the next tap is her hop, `host-tap`). The villagers and the jar during the opening beats (`disabled`: the scene is still arriving). Swiping a banner away (a drag). Scenery taps keep their own world sounds (§5), and plain scenery has no control.

**Inventory** (71 tappable elements in 30 files; `taps.test.ts` keeps it complete). "Before" is the sound before this pass.

| File:line | Element | What it does | Before | Now (`data-sfx`) |
|---|---|---|---|---|
| island/Hud.svelte:49 | today's ベル ribbon | opens きろく ベル in the phone | phone-open | `self` (phone-open) |
| ui/PhoneButton.svelte:12 | NookPhone button | opens the phone | phone-open | `self` (phone-open) |
| ui/SyncPill.svelte:13 | sync pill | sync now | none | `sync`; boop while syncing |
| island/JarSpot.svelte:147 | the jar | to ふたりの壺 | jar-tap (R18), none with reduced motion | `self` (jar-tap, also with reduced motion) |
| island/IslandScene.svelte:162 | a villager (×2) | mine → check-in, partner → partner sheet | villager-tap / surprise | `self` (same) |
| island/FruitTree.svelte:152 | tree canopy (×2) | shake, popup; again closes | rustle; closing silent | `self` (tree-shake; closing → tick) |
| island/FruitTree.svelte:170 | fruit row (×2) | the popup at a fruit | none | `self` (tick) |
| island/Balloon.svelte:51 | balloon | wobble | squeak | `self` (scene-balloon) |
| ui/Bubble.svelte:75, :81 | しずえ / the box | finish the line, then her hop | host-tap | `self` (finish silent, then host-tap) |
| ui/ChoiceList.svelte:33 | a choice (はい, けってい, やめる…) | answer | confirm | `choice-pick`, a `cancel` choice `back`, a `disabled` one boops |
| routes/+page.svelte:145 | check-in CTA | opens チェックイン | none | `open` |
| sheets/CheckinSheet.svelte:71, :74 | 昨日 / 今日 | switch day | none | `tick` (none when already shown) |
| sheets/CheckinSheet.svelte:85 | ぜんぶできた！ | tick all | confirm | `self` (checkin-saved); `aria-disabled` when all done → boop |
| sheets/CheckinSheet.svelte:92 | a habit switch | check in / out | confirm / tick | `self` (checkin-saved / toggle-off) |
| sheets/CheckinSheet.svelte:105 | 保存 | close | none | `confirm` |
| sheets/FruitRing.svelte:53 | a fruit ring (partner sheet) | show its detail | none | `tick` |
| sheets/PartnerSheet.svelte:52 | ハイタッチ | send a high-five, close | none (R4's sparkle muted under the sheet) | `confirm` |
| sheets/HarvestOverlay.svelte:99 | あとで | later | none | `back` (and Esc) |
| sheets/HarvestOverlay.svelte:131 | 受け取る！ | confirm the harvest | fanfare | `self` (fanfare; boop if it fails) |
| sheets/HarvestOverlay.svelte:152 | 島へもどる | close | none | `confirm` |
| ui/Sheet.svelte:80 | backdrop / Esc | dismiss | none | `self` (back; the phone: phone-close) |
| ui/Sheet.svelte:85 | grabber | dismiss | none (phone: phone-close) | `back` (phone: `self`) |
| ui/Toast.svelte:70 | the banner | dismiss (with 取り消す: hold) | none | `back` (`none` with 取り消す) |
| ui/Toast.svelte:78 | もとに戻す / 取り消す | undo | none | `undo` |
| routes/jar/+page.svelte:75 | ◀ 島へ | back to the island | none | `back` |
| routes/jar/+page.svelte:100 | recent moves card | きろく ベル | phone-open | `self` (phone-open) |
| pots/TreatShelf.svelte:15 | a treat | ask to buy | none (unaffordable: `disabled`, no tap) | `open`; `aria-disabled` when short → boop |
| pots/TripList.svelte:28 | 行く！ | ask to go | none | `open` |
| pots/BuyConfirm.svelte:43 | 買う！ / 行く！ | spend | purchase | `self` (purchase; boop when short) |
| pots/PotCard.svelte:33 | ✎ へんしゅう | menu editor | none | `open` |
| pots/MenuEditor.svelte:68, :73 | name, price | type | none | `none` |
| pots/MenuEditor.svelte:77 | × | remove a row | none | `remove` |
| pots/MenuEditor.svelte:83 | ＋ add | a new row | none | `open`; `aria-disabled` when full → boop |
| pots/MenuEditor.svelte:86 | やめる | cancel | none | `back` |
| pots/MenuEditor.svelte:87 | 保存 | save the menu | none | `confirm`; `aria-disabled` when unchanged → boop |
| phone/ShimaPhone.svelte:107 | ‹ back | up a level / home | cancel | `self` (back) |
| phone/ShimaPhone.svelte:113 | × close | put the phone away | phone-close | `self` (phone-close) |
| phone/ShimaPhone.svelte:122 | an app tile (×6) | open the app | phone-app | `self` (phone-app) |
| kiroku/Kiroku.svelte:168 | からだ / ベル | switch list | none | `tick` (none when shown) |
| kiroku/WeightCard.svelte:28 | a weight row (×2) | weight screen | none | `page` |
| kiroku/WeekList.svelte:28 | a week card | the week | none | `page` |
| kiroku/WeekDetail.svelte:62 | a day | the day | none (future: `disabled`) | `page`; future `aria-disabled` → boop |
| kiroku/DayDetail.svelte:63, :70, :78 | ✎ steps / minutes / a workout | edit | none | `page` |
| kiroku/DayDetail.svelte:91 | a check-in chip | fix a check-in | none | `toggle-on` / `toggle-off` |
| kiroku/DayDetail.svelte:97 | ＋ workout | add one | none | `page` |
| kiroku/Kiroku.svelte:245 | a workout type | to the keypad | none | `page` |
| kiroku/NumberPad.svelte:54 | keypad keys (×12) | type | none | `self` (key / key-fn; typed digits too) |
| kiroku/WeightDetail.svelte:67, :68, :86 | 体重を記録, 目標, ✎ a day | the weight entry | none | `page` |
| kiroku/WeightInput.svelte:35 | the weight field | type | none | `none` |
| kiroku/BellsLog.svelte:83 | なかったことに | ask to void a spend | none | `page` |
| phone/SyncApp.svelte:21 | いま同期 | sync now | none | `sync`; boop while syncing |
| phone/LangApp.svelte:13 | 日本語 / English | language | none | `tick` (none when chosen) |
| phone/VillagerApp.svelte:46, :53 | name, search | type | none | `none` |
| phone/VillagerApp.svelte:60 | a villager (×158) | choose | none | `tick` (none when chosen) |
| phone/SoundApp.svelte:20 | ミュージック / 効果音 / おしゃべり | switch | tick (効果音: its confirm preview) | `self` (toggle-on / toggle-off; 効果音 previews) |
| phone/SoundApp.svelte:33 | 音量 slider | volume | confirm on change | `self` (tick on change, none while dragged) |
| routes/+layout.svelte:102 | デモを見る | the demo | none | `confirm` |
| routes/+layout.svelte:112 | もう一度 (retry) | sync again | none | `sync` |
| routes/+error.svelte:24, :28 | 島へもどる / デモを見る | reload home / the demo | none | `confirm` |
| routes/pair/+page.svelte:65 | English / 日本語 | language | none | `tick` |
| routes/pair/+page.svelte:75 | the key field | type | none | `none` |
| routes/pair/+page.svelte:91 | つなぐ | pair | none | `confirm`; `aria-disabled` until the key is whole → boop |

Also not elements: the NumberPad's keyboard (digits → key, ⌫ → key-fn, Esc → back, Enter → choice-pick), Esc on the harvest (back), scenery taps (§5).

**The walk** (`e2e/sound.spec.ts`, installed Chrome, iPhone 13 profile, 効果音 on, `?demo`; each tap's cues from the cue function's test hook, `window.__cues`; island sounds after a sheet closes, such as coins landing, are the island answering and are listed after the tap's own cue):

| Screen | Tap | Cue(s) |
|---|---|---|
| 島 | しずえ: はい (choice) | choice-pick |
| 島 | check-in CTA | open |
| チェックイン | 昨日 | tick |
| チェックイン | 昨日 again (already shown) | (silent) |
| チェックイン | 今日 | tick |
| チェックイン | habit switch on | checkin-saved |
| チェックイン | habit switch off | toggle-off |
| チェックイン | ぜんぶできた！ | checkin-saved |
| チェックイン | ぜんぶそろいました (aria-disabled) | boop |
| チェックイン | 保存 | confirm + emote-idea |
| 島 | tree canopy | tree-shake |
| 島 | tree canopy again (closes) | tick + coin-land + coin-land |
| 島 | partner villager | villager-tap + coin-land |
| なかま | fruit ring | tick |
| なかま | grabber | back |
| なかま | Esc | back |
| なかま | ハイタッチ | confirm |
| しまフォン | NookPhone button | phone-open |
| しまフォン | きろく tile | phone-app |
| きろく | ベル tab | tick |
| きろく | ベル tab again | (silent) |
| きろく | からだ tab | tick |
| きろく | weight card | page |
| きろく | back (‹) | back |
| きろく | week card | page |
| きろく | a future day (aria-disabled) | boop |
| きろく | day | page |
| きろく | ✎ steps | page |
| きろく | keypad 1 | key |
| きろく | keypad ⌫ | key-fn |
| きろく | keypad 2 | key |
| きろく | keypad C | key-fn |
| きろく | けってい with nothing typed (aria-disabled) | boop |
| きろく | やめる (choice) | back |
| きろく | ✎ steps again | page |
| きろく | けってい | choice-pick |
| きろく | もとに戻す (banner) | undo |
| きろく | back (‹) to the week | back |
| きろく | back (‹) to the list | back |
| きろく | back (‹) to home | back |
| しまフォン | あそびかた tile | phone-app |
| しまフォン | back | back |
| しまフォン | 通信 tile | phone-app |
| 通信 | いま同期 | sync |
| 通信 | いま同期 while syncing (aria-disabled) | (silent) |
| しまフォン | ことば tile | phone-app |
| ことば | 日本語 (already chosen) | (silent) |
| しまフォン | じゅうにん tile | phone-app |
| じゅうにん | search field | (silent) |
| じゅうにん | pick a villager | tick |
| しまフォン | サウンド tile | phone-app |
| サウンド | おしゃべり on | toggle-on |
| サウンド | おしゃべり off | toggle-off |
| サウンド | 音量 slider (change) | tick |
| しまフォン | close (×) | phone-close |
| 島 | ribbon (→ きろく ベル) | phone-open |
| しまフォン | grabber | phone-close |
| 島 | jar | jar-tap |
| 壺 | a treat | open |
| 壺 | 買う！ | buy |
| 壺 | もとに戻す | undo |
| 壺 | ✎ へんしゅう | open |
| へんしゅう | save, nothing changed (aria-disabled) | boop |
| へんしゅう | ＋ add | open |
| へんしゅう | name field | (silent) |
| へんしゅう | × remove | remove |
| へんしゅう | やめる | back |
| 壺 | 行く！ | open |
| 壺 | backdrop | back |
| 壺 | ◀ 島へ | back |

Not reached by the demo data: a treat it can't afford (the demo's pot covers every treat) and いま同期 while syncing (the demo syncs at once). Both use the same `aria-disabled` path as the boops above. **Sound off:** the same kinds of taps create no `AudioContext` and play no media element (checked in the same file).
