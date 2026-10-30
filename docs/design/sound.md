# Island Fund: sound

How the app sounds, after *あつまれ どうぶつの森* (New Horizons, NH), and how it is built (`app/src/lib/sound/`).
Section numbers (§1–§13) match the references in code comments.

**Standing decisions.** Sound is **off by default** (all three kinds) and kept per phone. Nothing sounds without a
reason the user can see: idle life is silent. **IP:** the hourly music and the opening theme are the user's own files,
committed by the user's decision (§9.2); every sound effect is an original procedural placeholder (§8), replaceable by
a file through the manifest (§9).

## 1. Hourly music

NH's music is the clock: one theme per real hour, in sunny / rainy / snowy arrangements, fading to the next hour's theme
at the top of the hour. Here:

- **Track:** the **Tokyo hour** (`time/clock.ts` `jst()`; `?date=` previews it). Weather hook `sound.weather` (`sunny`
  now; `?weather=rain|snow` previews); a missing variant falls back to the same hour's sunny track.
- **Hour change:** a 3 s crossfade (`hourly.ts CROSSFADE`); the next file is fetched a minute early (`PREFETCH_MS`).
- **Gapless loop:** each file is one sample-exact loop period plus a 3 s copy of its start (§9.2). Two `<audio>` decks
  hand over inside the copy, where both hold the same samples, lined up to ~12 ms with a 0.15 s crossfade
  (`session.ts`), because WebKit's `<audio loop>` seeks to 0 and can drop out for 20–80 ms. Playback starts at the
  period's musical `start`.
- **Coming back:** hidden or locked = silence at once; back in front, the same hour fades in over 0.8 s where it was (a
  changed hour crossfades in).
- **Opening theme:** plays when ミュージック is turned on, under the phone that started it; closing the phone ("pressing
  A") hands over to the hour's track.
- **Level:** music bus 0.30 under effects 0.90; each track normalised to −16 LUFS by its manifest `gain`.

## 2. Ambience

`ambient.ts ambientFor(hour, month, weather)` picks looping layers on the music bus (ducked and muffled with it):
`waves` always; `birds` 05–17 Mar–Nov when fine; `cicadas` 08–17 Jul–Aug; `higurashi` 04–08 and 16–19 Jul–Aug;
`crickets` 17–05 Sep–Nov; `wind` Dec–Feb or snow; `rain` in rain. Each starts at a random point and fades over ~2 s.
**No placeholder** (a synthesised surf wore thin): ambience is silent until files are listed (§9).

## 3. UI sounds

Short (≤ 0.5 s), soft-attacked mallets and bells, like NH's menus: `phone-open` (a rising mallet arpeggio),
`phone-close`, `phone-app` (a pop and a bell), `cursor` (a 45 ms tick), `confirm` (E→B "pi-pon"), `cancel` (D→G). Every
other control names its sound on the element (§13).

## 4. Dialogue blips

NH speaks in Animalese. Here (`dialogue.ts blipPlan`, `ui/Bubble.svelte`) the box types at 33 ms a glyph and **every
other spoken glyph** gets a pitched blip (≈ 15 a second); punctuation is silent and 。！？ pause. Pitch follows the glyph
(±3 semitones from its code point), so a line always "says" the same thing; a line ending in ？ rises. At most 40 blips
a line. Two voices: `blip-host` (しずえ, high and soft) and `blip-villager`. Tap-to-finish stops them. No phonemes are
read (that would be Animalese itself).

## 5. The mapping (`cues.ts CUES`)

One table maps app moments to sounds, levels and delays. Villager reactions name their cue per step in
`motion/reactions.ts` and the director plays it; taps name theirs in `data-sfx` (§13); outcomes call `cue()` where they
happen. No component calls `play()` directly.

| Moment | Cue → sound |
|---|---|
| Tap a tree / a fruit lands | `tree-shake` → `rustle` / `fruit-land` → `thud` (on the drop's beat) |
| New ベル arrive / each coin into the jar | `bells-arrive` → `bells` / `coin-land` → `coin`, one pentatonic step per coin (§7) |
| A badge met (harvest tally) / 受け取る | `badge-met` → `miles` / `harvest-receive` → `fanfare` (jingles, duck the music) |
| Buy a treat | `buy` → `purchase` |
| The phone: open, close, app, back | `phone-open`, `phone-close`, `phone-app`, `back` → `cancel` |
| Choice cursor / pick | `choice-move` → `cursor` / `choice-pick` → `confirm` |
| Tap a villager (R9, R10), しずえ, the jar (R18) | `villager-tap`, `host-tap`, `jar-tap` → `pop` |
| Partner's data (R3), woken up (R14) | `emote-surprise` → `surprise` |
| High-five received (R5) / sent (R4), fruit goal met (R6), all met (R8) | `emote-love` → `heart` / `emote-joy` → `sparkle` |
| Fruit stage up (R7) / sync problem (R17) | `emote-idea` → `pop` / `trouble` → `oops` |
| First open of the day (R1) | `announce` → `chime` (a PA ピンポンパンポン; waits up to 15 s for the first tap) |
| Scenery taps | `scene-<kind>` ([scene-interactions.md](scene-interactions.md)) |
| Startup beats, naps, idle life, strolls | silent |

**World vs UI.** Cues of the island itself (`world: true`: rustle, thud, coins, emotes, the chime, scenery) are skipped
while a sheet, the phone or the harvest covers the scene; UI cues always play. The reward sounds when the sheet closes
and the coins fly.

## 6. Engine (`lib/sound/`)

| File | What |
|---|---|
| `ids.ts` | Sound ids, buses (`music`, `sfx`, `voice`), level, pitch jitter, per-id voice cap, jingle flag |
| `cues.ts` | The mapping and `cue()` |
| `sound.svelte.ts` | The controller: settings state, unlock on the first tap, the hour clock, weather, muffle, visibility, the opening hand-over; `play()`, `talk()`, `setSound()`, `startSound()` |
| `engine.ts` | Web Audio: one context, buses, buffers, voices, duck, muffle, the two music decks, ambience loops, the audio session, idle suspend |
| `session.ts` | Pure: session type switching, when a cue may sound, when a tap must unlock, deck fade-in and hand-off timing |
| `mix.ts` / `hourly.ts` / `ambient.ts` / `dialogue.ts` | Pure: voice limiter, jitter, duck plan / track choice and crossfade / ambience layers / blip plan |
| `synth.ts` | Pure: the placeholder renders (lazy-loaded after the first unlock) |
| `manifest.ts` | `static/audio/manifest.json`, parsed and validated (bundled) |
| `settings.ts` | Settings, defaults, sanitising, persistence |
| `taps.ts` | Every tap's sound: one delegated click listener reads `data-sfx` (§13) |

```
effects  AudioBufferSource → gain ─┬→ sfx bus ──┐
blips    AudioBufferSource → gain ─┴→ voice bus ┼→ master (音量²) → speakers
music    <audio> deck A/B → gain ─┐            │
ambience loop sources → ambient ──┴→ duck → muffle (low-pass under sheets) → music bus
```

- **Effects are decoded buffers** (a manifest file, or the placeholder rendered once at the context's rate). After the
  first unlock the placeholders are pre-rendered one per idle slot, jingles first, only for the kinds that are on.
- **Pitch jitter like NH:** every play detunes at random within the sound's `jitter` (UI and jingles 0).
- **Nothing is queued while locked, interrupted or hidden:** such a sound is dropped (except the daily chime). The tap
  that resumes the context may schedule its sound within 250 ms (`RESUME_WINDOW_MS`); anything scheduled then is
  stopped if the context still isn't running 300 ms later, so nothing bursts out after a call.
- **Idle suspend:** with only 効果音 / おしゃべり on, the context is suspended 10 s after the last sound (an open
  context keeps the audio hardware awake); never while music plays.
- `prefers-reduced-motion` does not mute sound.

## 7. Mix rules

- At most 6 voices (`MAX_VOICES`); per-id caps (2 for rustle, thud, pop, sparkle, blips and scenery; 3 for coin; 1
  otherwise); a new voice stops the oldest of its id, and over the total the oldest non-jingle.
- Jingles (`fanfare`, `miles`, `chime`) never overlap; the music ducks to 25% under one (`duckPlan`).
- Levels (bus × sound): music 0.30, ambience 0.28, effects 0.90, blips 0.40; keypad 0.26 (the softest), taps
  0.24–0.45, confirm 0.55, island 0.6–0.7, coins 0.4, jingles 0.55–0.75; nothing above 0.8 (tested). Master 音量 is
  squared, default 0.8.
- Coins climb one major-pentatonic run (0, 2, 4, 7, 9, 12, 14, 16, 19 semitones) across a batch, then hold the top.
- Muffle: a low-pass at 900 Hz on music and ambience while a sheet, the phone or the harvest is up.

## 8. Placeholder effects

`synth.ts` renders every id from a few primitives: soft mallets, inharmonic bells, a vibraphone, glides and
band-passed noise (with crackle grains for leaves). Deterministic (seeded noise), peaks at 0.8, 5 ms fade-out; all
under 1 s except the fanfare (1.4 s) and the chime (2.1 s). Original: plain arpeggios, the generic Japanese PA chime,
no game melody. Good enough to tune timing and levels by; meant to be replaced (§9).

## 9. Files and the manifest

`app/static/audio/manifest.json` (paths relative to `static/audio/`). **To add or replace a sound:** put the file there,
add its entry, rebuild; no code change.

```json
{
  "sfx": { "coin": "sfx/coin.m4a" },
  "opening": { "file": "music/opening.m4a", "start": 0, "gain": -5.3 },
  "music": { "sunny": { "07": { "file": "music/hour-07.m4a", "start": 66.188, "end": 75, "gain": -1.8 } }, "rain": {}, "snow": {} },
  "ambient": { "waves": "ambient/waves.m4a" }
}
```

| Kind | Keys | Format |
|---|---|---|
| Effects | `sfx.<id>` (any id in `ids.ts`) | AAC-LC .m4a, mono 44.1 kHz, ~64 kbps, < 3 s, no leading silence |
| Hourly music | `music.<sunny\|rain\|snow>.<00–23>` = `{file, start, end?, gain?}` | AAC-LC .m4a, stereo, 64 kbps, `+faststart`; one loop period plus a 3 s copy of its start when `end` is given; `gain` = dB to −16 LUFS |
| Opening | `opening` = `{file, start, gain}` | as music, one-shot |
| Ambience | `ambient.<waves\|birds\|cicadas\|higurashi\|crickets\|wind\|rain>` | AAC-LC .m4a, mono, 10–30 s seamless loops |

A missing or undecodable effect keeps its placeholder; missing music or ambience is silence. `sound.test.ts` flags
unknown keys, checks every listed file exists and holds the budget (≤ 1 MB a track, ≤ 20 MB in all).

### 9.2 The hourly music in the repo

The 24 hourly tracks and the opening theme are the user's own copies, committed by the user's decision (2026-10-30);
the repo and site are public (ADR 0018), so if asked to, delete `static/audio/music/` and the app falls back to
silence. **To add or rebuild a track:** `npm run audio:music -- <dir>` (`scripts/music.ts`, needs ffmpeg) reads the
source MP3s (never downloads) and per hour finds the loop period (spectral self-similarity, then sample-exact
cross-correlation from inside the loop), cuts one period, records the musical `start`, appends a 3 s copy of the
period's start (`end`), encodes AAC-LC 64 kbps, measures loudness (EBU R128) and writes `gain` to −16 LUFS (true peak
kept under −1 dBTP after the music bus), then writes the manifest. `--gains` re-measures only the gains. Result: 24
loops of 50–104 s, 14.5 MB in all, plus the 0.5 MB opening.

## 10. Settings (しまフォン → サウンド)

Three switches and a slider, all off at first: **ミュージック** (the hourly music and ambience), **効果音** (every effect
and jingle), **おしゃべり** (dialogue blips), **音量** 0–10 (master; disabled while all three are off). Turning a kind on
previews it (a confirm, a few blips, the opening theme). A note says what's playing and how the silent switch works.
音量 at 0 is muted, not off: the decks pause in place and resume there. Kept per phone in localStorage
(`DEVICE.sound` = `island.sound`, `sync/storage.ts`), never synced; shared by the live app and the demo.

## 11. iOS (Home Screen web app)

- **Unlock:** WebKit starts audio only from a user gesture. The controller listens (capture, passive) for `pointerup`,
  `touchend`, `click` and `keydown`: the first one after a setting is on creates and resumes the `AudioContext` and
  plays a 50 ms silent clip on both music decks. `pointerdown` (not an activation on touch) only wakes the context, so
  scenery taps are heard. iOS fires no `click` on plain scenery, so nothing depends on it. No context exists until a
  setting is first turned on.
- **The first tap starts the music:** with ミュージック on, the hour's file is prefetched 1 s after launch, so the first
  tap sets the deck's `blob:` source and calls `play()` inside the gesture; a track that should be playing but isn't is
  replayed synchronously inside the next tap of any kind. `e2e/sound.spec.ts` checks this under a strict media policy.
- **Silent switch and audio session:** where `navigator.audioSession` exists, the type is `'playback'` only while
  ミュージック is on, so the music plays in silent mode (user decision) and, like any media app, stops other apps' audio;
  otherwise `'ambient'`, so effects mix with the user's audio and follow the switch. Older iOS without the API: effects
  follow the switch unless music plays.
- **Why `<audio>` for music:** decoding a 1–2 minute track costs 20–40 MB of PCM, so music streams through two
  `<audio>` decks into gain nodes (iOS ignores `volume`); effects are short decoded buffers.
- **Background:** hidden (`visibilitychange`, `pagehide`) → gains to 0, decks paused, context suspended; visible again →
  the same hour fades back in. Music never plays from a pocket.
- **Media Session:** the lock-screen tile is named after the tune with しまの貯金箱 as the artist; ▶ resumes only while
  the app is in front, ⏸ fades out and holds, seeking is disabled.
- **Service worker:** audio is never precached (14 MB for a feature that starts off). A runtime cache
  (`island-audio-v1`, cache-first) survives builds; music is LRU-limited to 3 files. The engine fetches whole files and
  plays them from `blob:` URLs, so no Range request reaches the worker. The CSP allows `media-src 'self' blob:`.

## 12. Not done

- Effect files (official or original recreations): drop-in per §9.
- Rain and snow arrangements and ambience files: the slots and the weather hook are ready; there is no weather source.
- K.K. Slider for the harvest: needs a file and a decision; the fanfare stands in.
- Footsteps: villagers stroll at diorama distance, silently by design.
- A pass on a real iPhone (the unlock, the silent switch, the session, background, the Media Session and the loop
  hand-off were verified in Chrome with Playwright).

## 13. Every tap

Every tappable element names its sound in **`data-sfx`**, and one delegated listener (`sound/taps.ts`, capture phase,
after the unlock listener) plays it on the click, so never on a scroll or a drag:

```svelte
<button data-sfx="open" onclick={…}>                <!-- a tap cue from TAP_SFX -->
<button data-sfx="self" onclick={buy}>               <!-- the handler plays the outcome's cue (buy → purchase) -->
<input data-sfx="none">                              <!-- silent: a text field (the keyboard clicks) -->
<button aria-disabled={short > 0} data-sfx="open">   <!-- can't right now: swallowed, and the boop -->
```

- **No double sounds:** a control whose action has an outcome sound says `self` (buy → `purchase`, 受け取る → the
  fanfare, the phone → its tunes, a villager → its reaction). A sheet dismissed by hand (backdrop, Esc) is `back`,
  played by `Sheet`.
- **"Can't":** a control that can't act now uses `aria-disabled="true"`, not `disabled`: it stays focusable, the
  listener swallows the click before the page sees it and plays `boop` (NH's "can't afford"). A real `disabled` is
  kept only where silence is right (the villagers and jar during the opening beats, the volume slider while all is off,
  つなぐ while the key is checked).
- **Enforced** by `taps.test.ts` (every `<button>`, link, input and `role=` control in `components/` and `routes/` has a
  known `data-sfx`; `self` / `none` need a reason; `disabled` needs an allow-list entry) and walked by
  `e2e/sound.spec.ts` (each tap's cue via `window.__cues`; with sound off, no `AudioContext` is created).

| Cue | Sound | Used for |
|---|---|---|
| `tick` | `cursor` × 0.8 | tabs, radios, the volume slider, a tree popup |
| `open` | `select` | opening something: a treat, ✎ へんしゅう, ＋ a row |
| `page` | `page` (a paper flick) | going deeper in きろく: a week, a day, the weight card, ✎, ＋ workout |
| `confirm` / `choice-pick` | `confirm` | primary actions (保存, ハイタッチ, つなぐ); NH's choice list |
| `back` | `cancel` | ‹, やめる, あとで, a dismissed sheet or banner |
| `toggle-on` / `toggle-off` | a switch pair | サウンド switches |
| `key` / `key-fn` | `key` (a soft "tok"; ⌫ and C lower) | the ATM keypad, tapped or typed |
| `sync` | `whoosh` | いま つうしん, the sync chip, retry |
| `remove` | `poof` | × a menu row |
| `undo` | `undo` | とりけす on a banner |
| `boop` | `boop` | any `aria-disabled` control: a treat the wallet can't cover, 保存 with nothing changed, a future day, … |

Deliberately silent: text fields, scrubbing the weight chart, swiping a banner away, a tap on what is already chosen,
finishing しずえ's line with a tap.
