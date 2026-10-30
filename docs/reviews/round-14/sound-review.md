# Round 14: sound

**Question (user, 2026-10-30):** "with a sound design team, explore sound effects from the original game. can we play the original animal crossing theme in the background. have a setting to turn off music / sound effects. follow the game closely, be detailed and review with team."

**Answer:**
- **Yes.** The hourly BGM plays by the Tokyo hour, from the user's own 24 tracks plus the opening theme. The user decided to commit them (round brief); `sound.md` §9.2 has the details.
- **Effects:** every NH moment we have is mapped. Original procedural placeholders stand in until the user picks a source for real files.
- **Settings:** しまフォン → サウンド has ミュージック, 効果音, おしゃべり (all **off** by default) and 音量.

Research, mapping and engine: [docs/design/sound.md](../../design/sound.md).

## Team

| Role | Owned |
|---|---|
| Sound designer | NH research (§1–§5), the catalogue and levels (`ids.ts`), the mapping (`cues.ts`, reaction `cue`s), the placeholders (`synth.ts`), the blip voice (`dialogue.ts`) |
| Audio engineer | The engine (`engine.ts`, `sound.svelte.ts`): unlock, buses, voices, duck, muffle, the two music decks and crossfade, iOS session / silent switch / background. Also the music pipeline (`scripts/music.ts`), the service worker's audio cache and the CSP |
| Game-feel reviewer | Critique against NH: timing, subtlety, overuse and annoyance across a day of use. Findings below, all applied or decided |

## How the review ran

The reviewer walked a day with 効果音, おしゃべり and ミュージック on (Chrome, iPhone 13 viewport, `?demo`, `?date=` for the hours):
1. The first open in the morning.
2. Tapping the trees and the villagers.
3. Two check-ins.
4. The しまフォン and its apps.
5. A treat bought on the pots screen.
6. A sync with the partner's earnings.
7. Sunday's harvest.
8. Going to the background and back.
9. An hour change.

Each moment was compared with what NH does at the same beat. The reviewer asked:
- Does it sound when you act, and only then?
- Is it the right weight?
- Does it stack with something else?
- Would it grate on the 30th day?

The music path was checked with an instrumented AudioContext and `<audio>` decks (see Verification).

## Findings

| # | Finding | NH reference | Fix | Status |
|---|---|---|---|---|
| R1 | **A check-in tick stacked four sounds**: the confirm, plus the tree's rustle, the fruit's thud and a ripeness emote, because the scene reacts to the new data behind the open sheet | Under a menu, NH's world is quiet; only the menu sounds | Cues of the island itself (`world: true`: rustle, thud, coins, bells, emotes, chime) are skipped while a sheet, the phone or the harvest covers the scene. A tick is one confirm, and the reward sounds when the sheet closes and the coins fly | Fixed |
| R2 | **Coin chatter:** up to 8 flights × 3 coins each climbed the same 0-2-4 semitone figure, eight times over | Bells counting in is one rising rattle, not a repeated motif | One major-pentatonic run across the whole batch (0 2 4 7 9 12 14 16 19, then holds), and only each flight's last coin at full level | Fixed |
| R3 | **Harvest:** six coin clinks under the fanfare's held note | NH's item-get plays alone, and the world waits for it | The fanfare plays alone (it also ducks the music to 25%); the coins fall silently | Fixed |
| R4 | **R2's heart competed with the bells jingle** when the check-in sheet closes. Also: should idle life make sound? | NH's villagers make sound when they react to *you*; their ambient life is quiet at a distance | R2 is silent (the tick already confirmed, and the coins are the reward). Startup beats (R11, R12, R15), naps (R13), the dance (R16), idle life, strolls and the idle tree shake are silent. Footsteps are not used (diorama distance). Tested in `mix.test.ts` | Fixed |
| R5 | **The opening theme** started muffled (the phone that started it counts as a sheet), and it was a minute-long detour before the island's own music | NH's title theme plays clear until you press Ⓐ, then the island takes over | The opening plays unmuffled. **Closing the phone is "pressing A"**: the hour's track takes over with the 3 s crossfade (or when the opening ends). e2e covers it | Fixed |
| R6 | A procedural surf as the ambience placeholder: pleasant for a minute, wearing after an hour, grating by day 3 | NH's surf is recorded, positional and varies | No ambience placeholder. Ambience stays silent until real loops are listed (slots and hour/season rules are ready) | Decided |
| R7 | **音量 had no feedback**, and while all three kinds were off it was faded but still live, which breaks round 13's "brown edge = tappable" | The console volume pops per step | A confirm on release (with 効果音 on), a tick on the music and voice rows, and the disabled tier (sunk, no edge) while all is off | Fixed |
| R8 | **The daily announcement chime would never play:** R1 fires 0.7 s after launch, before any tap can unlock audio | NH plays the announcement when you first step out | A requested chime waits up to 15 s for the first tap of the session, then lapses | Fixed in build |
| R9 | **Blips on every glyph** (33 ms) were a 30-a-second rattle | Animalese reads syllables, pauses at punctuation, and a question rises | Every other spoken glyph (≈ 15/s), silent punctuation and spaces, pitch from the glyph (stable per line), a rise on ？, a 40-blip cap per line, stopped by tap-to-finish. A separate おしゃべり switch, off by default | Fixed in build |
| R10 | **Precache:** `$app/manifest` paths are relative (`audio/…`), so the `/audio/` filter missed them and all 14 MB of music would have been precached on install. The same bug let all villager art and the art manifest in | n/a | `precachable()` (tested) normalises the path and keeps out audio, fonts, non-default villagers, the bundled manifests and `.DS_Store`. Music is cached on first play in `island-audio-v1`, LRU 3 | Fixed |
| R11 | The note said "いまは15時の曲" while the opening was playing | n/a | `sound.playing`: いまはオープニングテーマ / いまは15時の曲 | Fixed |
| R12 | Levels: the music must sit under everything | NH's BGM is gentle and the effects are on top | Music 0.30, ambience 0.28, effects 0.90, blips 0.40, × 音量² (0.64 at the default). UI ticks 0.35 under island actions 0.6–0.7, jingles on top. Ducked 25% under jingles and muffled (900 Hz low-pass) under sheets | Kept |

## The daily budget

On a typical day with everything on:
- one chime;
- 3–6 confirms (ticks);
- one bells jingle and 6–15 coin notes per arrival;
- 2–6 phone figures;
- a handful of taps;
- the blips of しずえ's few lines;
- one purchase.

That's roughly 30–40 sounds a day, all under 1.5 s. The only ones you didn't trigger yourself are the daily chime (after your first tap) and the partner's arrivals (the coins and a "!"). Nothing loops except the music and ambience. In the background, everything stops.

## Open, accepted

- **Not heard on a real iPhone yet.** The ambient session and silent switch, the unlock, lock/background and the loop seams on iOS's AAC decoder need a pass on the user's phone.
- **Older iOS without the Audio Session API:** the music `<audio>` elements may play in silent mode. Effects are still muted.
- **Placeholders are synthetic:** the fanfare and the Nook Miles jingle are the weakest. Replace those first once the user chooses official files or original recreations (sound.md §9 lists names and formats).
- **Blips replay** when a line re-types (back to the island). That matches the visual, and おしゃべり is its own switch, off by default.
- **Two batches at once** can hit the coin cap (3 voices) and drop a note. Inaudible in practice.
- **Chrome on Android** may show a media notification for the music element. The target is the iPhone Home Screen app.

## Verification

- `npm run check`: 0 errors, 0 warnings.
- `npx vitest run`: 716 passed, including the sound tests (`sound/mix.test.ts`, `hourly.test.ts`, `sound.test.ts`, `service-worker/caches.test.ts`) and the i18n usage, font coverage and folder-boundary tests.
- `npm run build`: the audio is served from `build-pages/audio/` only. No audio is in any JS chunk (the bundled manifest is paths and loop starts, ~1.5 KB), and `audio/` is not in the precache list.
- `npm run e2e`: 9 passed, including the new サウンド test:
  - all off by default, and no audio fetched;
  - the toggles and volume persist across a reload;
  - ミュージック fetches the opening, and closing the phone fetches the hour's track.
- `npx knip`: clean for this round (the only report is another agent's untracked `.scene-sheet.mjs`).
- **Instrumented Chrome run** (Playwright, installed Chrome):
  - the AudioContext runs after the tap, and the opening plays;
  - when the opening ends (or the phone closes), the hour's deck plays its own period (e.g. 15:00 = 56.84 s, 08:00 = 70.71 s) from its loop start with `loop` on;
  - hidden: the context is suspended and nothing plays; visible: resumed at the same position.
- **Screenshots** (looked at): `/tmp/r14-sound/` has the phone home with the サウンド tile (day, night), サウンド off with the disabled 音量 row, on, all on, the opening note, night, and English at 320 px.
