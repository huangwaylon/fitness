# ききみみ: the English listening game

A listening game for Japanese speakers learning English, for one to three players (A, B and the guest), opened from the HUD menu's 「英語」 pill and synced so everyone plays the same round at once. Villagers speak the English; しずえ hosts. No ベル, かいがら or economy tie.

This doc is the player's side: the games' rules, the screens, progress and rewards. The other ききみみ docs:
- [kikimimi-engine.md](kikimimi-engine.md): the round engine, the wire, content loading, audio and each game's deal.
- [kikimimi-mic.md](kikimimi-mic.md): the opt-in speaking modes and the microphone's privacy rule.
- [curriculum.md](curriculum.md): what is taught (stages, scenarios, units) and the content.

docs/design.md "ききみみ クイズ" has the one-paragraph summary; docs/backend.md the relay's side of the wire and the caches.

## Open items

- **Audio on Pages.** The packs are 101.6 MiB (games) + 21.4 MiB (stories), under bank.test's budget (160 and 32 MiB). No R2 (the user, 2026-11-09: it needs a payment method on file); revisit only if Pages' per-file 25 MiB or the file cap binds.
- **`QUIZ_ON_PLAY`** (round/wire.ts) is off: the quiz and スピード はしご still go out as `quiz`. Turn it on once `npm run logs` shows both phones on a build that hears `play` (kikimimi-engine.md "Wire migration").
- **The mic probe** on both phones, then the backend thresholds (kikimimi-mic.md "The probe"). Workers AI's data terms still to be written into docs/ops; until then the relay recogniser is never 自動.
- **Mic leftovers:** こたえて！'s 「これ？」 band and 「声で / タップで」 preference, くりかえし's device-local speaking span, the unit page's ロールプレイ row, the input latency off まねっこ's lag.
- **The listening check** of the gate's flagged clips: curriculum.md "Listening check". Content work (backdrops, the tone spike, wave 3): curriculum.md "Backlog".
- **Not built (UX):** the couple quest's 30 / 90 setting (needs the relay); the ずかん tile's new-entry count and the partner's 「ふたりとも しってる」 line; きろく's skill pages and recent games; the hours-heard meter and K.K. songs; villager gifts, week-stamp gifts and the tent's trophy and landmark items (no present path for English rewards); the asynchronous 「もう きいたよ」 and a synced shared review; lock-screen playback for stories.
- **Questions:** keep the pill's sub-label for good? Gulliver and Blathers as hosts of ジョニーの たび / フータの おはなし, or island villagers only?

## The game

The quiz, ひとこと クイズ, is the base every other game reuses (kikimimi-engine.md "The round engine").

- **Host and speakers.** Each question is spoken by a villager: their icon bobs with an empty NH speech bubble (「♪…」) and a thin progress bar the clip's length. The text is never shown before the reveal. No Animalese before or over the English.
- **Length.** 8 questions: a level's mix, the アナウンス pack, or two スピード はしご ladders of 4 rungs.
- **Countdown.** 「よーい」 then 3-2-1 once (4 s); each question then has a ~1.5 s lead-in with a chime.
- **Answering.**
  - The choices show dimmed while the clip plays and unlock when its first play ends. One tap, final.
  - The limit runs from the end of the first play: the lobby's 「こたえる じかん」, 20 / **30** / 60 s or なし (untimed: the question waits for everyone joined and here). The host sets it; each phone remembers its last (`DEVICE.kikimimiTimer`); it rides on the `open`'s seed.
  - 🔁 replay freely. 🐢 slow at levels 1 and 2 only (a slowed take undoes level 3's reductions).
- **Showing who answered.** A player's chip gets a ✓ when they answer, never what they chose.
- **Reveal.** Once everyone joined has answered, or at the limit. Untimed, so there's time to read: it stays until the host taps つぎへ (solo: you). The others tap 「よみおわった」 (📖 on their chip); the host's button counts them (「つぎへ（よみおわった 1/2）」) but can always go on; with the host gone everyone gets つぎへ. ○ on the right choice, × on a wrong pick (colour is never the only signal); the English at ≥ 17 px with the key word marked, played once; the Japanese, the voice's accent and the reactions (✨ / 💦).
- **Scoring.** Right 100, wrong or timed out 0. No speed bonus (it rewards guessing) and no first-listen points: 「いっぱつ！」 (right with no replay or slow play) is a stamp on the reveal, the review and the results, so replaying is never punished. おなじへや never gives it (only the host's phone can replay).
- **Results.** しずえ reads them out like the morning broadcast: co-op 「ふたりで n/8」, たいせん a ranking. Then the **review list**, the main learning moment: with any misses it opens on them (「まちがえた だけ」, the first missed row open). A row opens to the English with its sound marks and karaoke, the Japanese, the answer, the `note`, the skills it tripped, my pick, ▶︎ and 🐢 (L1/L2). 「まちがえた もんだいを もういちど」 replays just the misses solo, untimed, recorded as practice (`p: 1`) so they feed the SRS.
- **Solo** is the same game with one player.
- **おなじへや** (「おとを 1だいに まとめる」): only the host's phone speaks (phones slightly out of step sound like a chorus); the others show 🔁 / 🐢 off with 「ホストの スマホで ながれます」. Without it, earphones are suggested.

## Question types

- **`pic`**: tap the picture heard, from 4 NH art choices with Japanese labels (for VoiceOver, so the English isn't given away). The sentence carries the test; the distractors are heard in it or sound close ("I didn't catch a tuna, but I got a squid!" → squid).
- **`word`**: the sentence with a blank; pick the word heard from 3 near-sound choices that each fit (light/right, hat/hut/hot, berry/very, can/can't, fifteen/fifty), each pair checked in American English.
- **`num`**: prices, times and dates with close distractors (2:15 / 2:50, 1,500 / 15,000, the 13th / 30th), from templates (speaker × phrase × number).
- **`reply`**: the best of 3 written replies to a question (TOEIC Part 2). Level 2 up.
- **`mean`**: what the speaker really means, from 3 paraphrases (the literal reading, the opposite, a plausible wrong inference): 「つまり、どういうこと？」.
- **`gist`** and **`next`**: over a 2-4-line dialogue (or a single bulletin at ほし and in the pack), what's going on, or the best next line.

**Mix per 8 questions** (mix.ts): L1 3 pic, 3 word, 2 num. L2 2 pic, 2 word, 2 num, 2 reply. L3 1 pic, 2 word, 2 num, 3 reply. L4 2 word, 1 num, 1 reply, 2 mean, 1 gist, 1 next. L5 3 num, 2 gist, 2 mean, 1 reply. L6 2 reply, 2 mean, 1 gist, 1 next, 1 word, 1 num. L7 2 mean, 2 gist, 1 next, 1 reply, 1 word, 1 num.

## Japanese help

On every level, dialogue, unit item and listening game, each optional: `ctx`, the situation before the clip (≤ 30 字, under the speaker); `cja`, each choice in Japanese (under it at the reveal, carried through the shuffle, no English letters); `why`, the かいせつ (≤ 90 字, a 「解説」 box); `note`, the trap (≤ 40 字). The same in the review, lessons and dialogues; a missing field is hidden (frame/Why.svelte, ChoiceGrid `ja`). bank.ts `helpProblems` checks them; past draft they're required in the listening files (kikimimi-engine.md "Listen parts"). せってい's にほんごやく いつも / まちがえたら / みない hides the Japanese on right answers or always.

## Places

One ladder, ばしょ, named after places, never やさしい / むずかしい (choosing やさしい in front of a partner is shaming):

| Place | ★ | CEFR (private, under くわしく) | Quiz level |
|---|---|---|---|
| はまべ | ★ | A2–B1 | L1, L2 (sub-steps はまべ 1・2) |
| かわ | ★★ | B1+ | L3 |
| もり | ★★★ | B2 | L4 |
| やま | ★★★★ | B2+ | L6 |
| ほし | ★★★★★ | C1 | L7 |

L5 is the アナウンス mode beside もり, not a place. The mapping is a UI table (catalog.ts `PLACES`, `placeOfLv`, `lvOfPlace`), so the wire and the `listen` row keep plain `lv` (1-8). A place this build has no content for is sunk (`aria-disabled`).
- **The comfortable place** (stages.ts `stageAt` over progress.ts's level) prints 「いまの ばしょ：かわ ★★」 and 「つぎは もり が ちょうど いい ころ」.
- **おまかせ** is the place row's default (catalog.ts `omakaseLv`): the latest みみ チェック's level, else the comfortable level, else はまべ 2. A tap is an override kept per mode (`DEVICE.kikiStage[gm]`); 「おまかせに もどす」 clears it.

## Co-op and たいせん

- **Co-op is the default** with several players. The results read 「ふたりで n/8」 (three: 「さんにんで」): a question counts when at least one player got it right. Answers are hidden till the reveal, so nobody leans on the other, and a miss never costs what the partner caught. Under it, 「そろって せいかい m もん」: the questions every player who had them got right.
- **Never shame:** in co-op the chips show only ✓; the reveal says how many got it (「2にん せいかい！」, none: 「むずかしかったね！」), never who. Each phone keeps its own tally (「じぶんは 6 / 8」) and review.
- **「きょうりょく ／ しょうぶ」**, the host's lobby switch (only for games that support しょうぶ): points, ✓ / × at the reveal and a ranking. It rides on the seed's bit 0; flipping it deals a new deck. もういっかい keeps the mode. The quiz ranks plain points; the tournament and すうじ ラッシュ score against expectation.

## Dialogues

- **Shape.** 2-4 lines, two villagers taking turns (たちぎき: three); one clip per line (`<item>-<n>`), played in turn on the relay clock with a 0.3 s gap (`LINE_GAP`). Heard late, a line already over is skipped, never two at once. Replays play the whole sequence (no 🐢).
- **Distractors:** for `gist` a heard detail misplaced, the literal reading or the opposite; for `next` a repeated word, the wrong role, an answer to what wasn't asked.
- **UI.** Both speakers' heads, the one talking bobbing. At the reveal the two-sided transcript (`Transcript.svelte`: first speaker left, the other right, three seated left/centre/right, each line's Japanese; a `next` answer as a dashed 「つぎの ひとこと」 bubble).

## Visuals

- **Scene card** (`scene/SceneCard.svelte`): a staged item's setting from the lead-in to the reveal: one of 8 painted backdrops (`cafe`, `platform`, `pharmacy`, `office`, `door`, `gate`, `street`, `living`; bank.ts `SCENE_IDS`) softened under a paper vignette, the place's name, and the channel: face to face the speakers stand in it full-body; `PhoneFrame` (「つうわちゅう」 or 「るすでん」, signal bars that drop on a `signal` line), `PaFrame` (a horn with ripples), `VideoFrame` (a 2×2 call grid), all CSS/SVG. Reduced motion stills them. Levels 1-3 stay on the plain stage.
- **No visual gives the answer away:** backdrops hold no text or numbers; transcripts and marks appear only at the reveal.
- **The backdrops** are generated paper-gouache (`npm run art:scenes`, scripts/scenes/scenes.ts: Z-Image-Turbo, Apache-2.0, through MFlux, seed 7, scenes.json's shared style; webp at 393×224 @1-3x under `static/art/scene/`), the villagers' official art composited over them by the app. No NH character or Nintendo look is ever generated.
- **Sound marks at the reveal** (`SoundLine.svelte`, marks.ts): the English with the focus and `say` (Let me → *lemme*), `link` ‿, `drop` (tryin~~g~~), `stress` ●, keyed by `MarkLegend`; authored per clip for every `tts` respelling.
- **Karaoke** while the clip replays: the words said in ink, the one being said underlined, timed by `words.json` (kikimimi-engine.md "Audio").

## The アナウンス pack

Level 5 (bank5.ts, 30 items, B1+ → B2), the mode アナウンス: station and train announcements, airport PA, phone menus, voicemails, shop announcements, a fire alarm test, a radio typhoon blurb in a café. 12 `num`, 6 single-clip `gist`, 6 `mean`, 6 `reply`, all US, each with its condition (PA, call or voicemail; 8 heavy). Difficulty and the level nudge count it as もり (bank.ts `levelRank`).

## スピード はしご

- **The mechanic.** One line of daily life heard four times, faster each time: 0.8×, 1.0×, 1.2×, 1.4× of natural speech (ladder.ts `SPEEDS`; 1.0× = 4.3 syllables a second). Each rung asks something different: the gist, a detail, a harder detail (all in Japanese, so there's nothing English to read before the faster listen), then ことば: the line with its key chunk blanked and 3 near-sound forms that mean much the same, so only the weak forms heard at 1.4× give it. A game is 2 ladders.
- **The climb.** A rung is climbed when right on the first listen with every rung under it climbed (ladder.ts `climb`): the climb stops at the first miss, replay or time-out. A flat 100 a rung climbed (never more for a higher one, which would invite guessing).
- **Reveals.** A lower rung moves on by itself after 3 s and keeps the line hidden and silent, so the next rung is a listen of its own. The top rung's reveal adds how high the ladder went (「1.0× まで のぼった！」). Four steps rise over the stage.
- **Results:** how high I climbed, co-op's 「ふたりで n/8」, a review row a ladder with ▶︎ at each speed.
- **きろく: the fastest comfortable speed** (progress.ts `speedOf`): the fastest rung climbed in ≥ 75 % of my last 8 ladders; under 4 ladders 「はかっている とちゅう」. Ladder games stay out of the quiz's trend, nudge and skills.

## 音の へんしん

A daily drill of American connected speech (about 3–4 minutes of the 15-minute day): the phenomena and phrases are curriculum.md "Connected speech"; the deal and the audio, kikimimi-engine.md "音の へんしん".
- **A game:** 8 phrases, 5 of today's phenomenon and one each of the phenomena before it, every phrase in another voice. The rounds take turns:
  - 「なんて言った？」: the line with its changed words blanked; pick the full form from 3 near-sound choices (gonna → going to / got to / want to).
  - 「書きとり」: write the missing words. Typed on the phone, matched forgivingly: case and punctuation aside, a contraction as good as its long form either way, the apostrophe optional where no other word is spelled so (dont), a reduced spelling as good as what it stands for (gonna, whaddaya); never a near spelling (then / than). 「タイルで答える」 instead: the words and 1–4 decoys to tap (remembered per phone, `DEVICE.kikiTiles`).
- **Reveal:** ○ / ×, the line with its sound mark, the full form beside the spelling as said (「didja」＝ did you), the Japanese and the trap's note, and 聞きくらべ: はっきり (a careful take, the full form word by word), ふつう, 速く (1.25×). The same three takes on every review row.
- **Tiers** as the listening games': easy two choices and one decoy tile, hard four decoys. Co-op counts a phrase anyone got; no たいせん.
- **Today's phenomenon** (henshin.ts `focusOf`): the first in order not yet 習得 (≥ 80 % over ≥ 6 answers, recency-weighted, first listen 1, after a replay 0.6); one tried 24 times without it waits in review. The host's rides the lobby's options.
- **The mode page** lists each phenomenon in order with its bar (outlined till 3 answers), 「今日」 and 「✓ 習得」; a tap plays that one instead, till 「今日の音に戻す」. Mine alone, never the partner's.
- **Recycling:** a missed phrase is an item card like any; おさらい asks it through another phrase of its phenomenon (another voice and sentence: srs.ts `isSibling`), the drill's phrases joining おさらい only that way.
- **The row:** `gm: 'henshin'`, `lv` 8, `[id, ok, pick, rp]` (a choice as authored; the dictation's wrong words as a mask). Level 8 trains the sounds, not a place: きろく's つながる おと and the features count it; the ability, the item difficulties, the trend and the level nudge leave it out.

## まるごと 聞く

C1 listening, everyday and travel (curriculum.md "Long listening"; the engine, kikimimi-engine.md "まるごと 聞く"). At ほし, on じっくり (never きまぐれ's pick); about 6 minutes, solo or co-op.
- **A game:** one 2–5 minute piece played whole (its speakers on the stage, the one talking lifted, `ctx` under it; nothing to answer while it plays), then 4–5 questions with no clip: 話の中心, 言外の意味, 気持ち, 次の行動, 3 English choices each (easy, at かわ or below: two). 「通しで もう一度」 replays it all.
- **Reveal:** ○ / ×, each choice's Japanese, 解説, and 「ここで わかる」: the line that answers it, with ▶︎.
- **Results:** the review, the transcript (every line tappable to hear it alone, each question's Q mark on its line, a miss in coral), the credit of a real recording, then 書きとり: 1–2 lines near my misses (all right: one near the end), the missing words typed (音の へんしん's matching) or tapped as tiles with near-sound decoys.
- **The pieces:** 5 real recordings (本物の録音) and 5 generated scenes (会話劇), 31 minutes. The mode page lists the place's pieces with my last score; 「今日」 is the first not heard, then one I missed (under 75 %) a week ago or more, else the least recent. A tap plays another, till 「今日の会話に戻す」.
- **Recycling:** each question and dictation line is an item (`<piece>-q1`, `<piece>-k12`, outside every deck); a missed one comes back in おさらい through a sibling (a ほし item of its type, a drill phrase of its sound).
- **Credits:** せってい's 「音声の出典」 lists each real recording's credit line and licence, and the results show it under the transcript.

## Navigation

```
pill ─▶ sheet 「ききみみ」
hub (きょう) ─┬─ ⚙ せってい
              ├─ menu card ───────────────▶ [game frame] ─▶ results
              ├─ あそぶ ─┬─ しまの みち ─ unit ─▶ [frame]
              │          ├─ ねる まえに ─ StoryList ─▶ StoryFrame
              │          └─ mode detail ─┬─▶ [frame] ─▶ results
              │                          └─ みんなで (game preselected)
              ├─ みんなで (lobby) ─▶ [frame on every phone] ─▶ results
              ├─ ずかん
              ├─ きろく
              └─ たいかい banner (Fri 18:00 – Mon 05:00) ─▶ TaikaiLobby
first open: welcome ─ sound check ─ みみ チェック ─ result ─▶ hub
```

A hub and one push/pop stack, not a tab bar: the foot is taken by each page's sticky action row (a tab bar under it would cost ~140 of 780 px), most opens are "do today's thing", and one stack keeps ‹ unambiguous.
- **One stack** over the hub (nav.ts `Page`), at most 4 deep (`MAX_DEPTH`). ‹ pops one; a backdrop tap or Esc pops, and closes at the hub.
- **✕ closes the sheet from any page.** With others in my lobby it asks first (「部屋を閉じますか？」).
- **In a game** (countdown → reveal) there is no ‹; ✕, a backdrop tap or Esc asks 「ここで やめる？」 (「ここまでの きろくは のこります」).
- **Results:** おわる goes to the hub (or back to the page a lesson came from); もういっかい restarts the mode and re-invites.
- **Deep links:** the invite gives `[lobby]` (`inviteStack`), the たいかい banner `[taikai]`, a mode `[asobu, mode]`.
- **The night:** StoryFrame is a game page (no ‹, a backdrop tap does nothing); its sleep timer ends it and the sheet fades closed over 2 s.

## Screens

Cream cards on the tan panel (`--r-card` 24, buttons 16, taps ≥ 44 px). The sheet's strings are kanji Japanese; the HUD pill and the villagers' speech stay spaced kana (docs/decisions.md "Copy"). i18n/kikimimi.ja.json and the per-game `kiki-<gm>` catalogs are the source of truth.

### The hub

The root page, 「ききみみ」: the invite card while one waits; しずえ's line by the hour (おはよう / こんにちは / こんばんは; once the menu's done, 「きょうは ここまでで じゅうぶんです！」; never a count of missed days); the daily menu's three cards ("The daily menu": a done card folds to a coral ✓, the first undone is green-edged with the only green button, a card plays at once); 「1つで きょうは OK。のこりは おまけです」; a quiet 👂 みみ チェック card until a check row exists; four entry tiles, あそぶ · みんなで · ずかん · きろく, each with one live line; the yuzu たいかい banner (Fri 18:00 – Mon 05:00); the week card (`hub/WeekCard.svelte`: the stamp card and the quest). By day after a bedtime chapter, `hub/MorningCard.svelte` sits under the menu.

### あそぶ

しまの みち's card first, then the modes in a 2-column grid per group, scrolling vertically (catalog.ts `MODES`, `shelves`; the later games add theirs from round/registry.ts):

| Group | Modes |
|---|---|
| さくっと（3ぷんで できる） | ひとこと クイズ, スピード はしご, おさらい, ことば タイル, すうじ ラッシュ, 音の へんしん |
| まちで・でんわで（ばめんで きく） | アナウンス, ようじ でんわ, たちぎき |
| じっくり（ながめに きく） | しずえの ニュース |
| ねる まえに（てんすう なし） | おやすみ ものがたり |
| 声に出す（マイクを使う） | the mic modes, only while the mic is on (kikimimi-mic.md "Where they show") |
| みんなで picker only | ふたりで ロールプレイ |
| hub only | しずえの しゅうまつ たいかい (the banner), みみ チェック (first run; again from ⚙) |

Only playable modes show (content and gate); an empty group is hidden; no 「もうすぐ」 wall and no filter UI. おさらい is にがて れんしゅう: 8 questions from the SRS ("Adaptivity").

### しまの みち

The island path of units (curriculum.md "Units"), from あそぶ's first card and the menu's きょうの いっぽ; `path/IslandPath.svelte`, its own chunk. The model is `kikimimi/path.ts` (pure): `pathOf({units, states, level, played, filter, placed})`.
- **Stages in order**, each folding under a head button (name, ★, 「ここから」, the landmark, a stamps bar, ✓ k / n), open by default for the current unit's stage, the placed one, one with a celebration, and every stage a filter shows. In a stage the anchors (`glue`) come first under 「はじめに おすすめ」. はまべ has no units: its stop is the quiz.
- **The current unit:** the last one I played a lesson of that isn't stamped, else the first unstamped from my comfortable stage up, else the first unstamped anywhere. `nextLesson`: the first core lesson not played to the end, the チェック until stamped, then an unplayed extra, else the チェック again. 「つづける」 on the current stop opens its next lesson's intro card; a tap elsewhere opens the unit's page.
- **Every stage stays playable, never locked.** Above the placed (or comfortable + 1) stage a stage is soft: striped, 「すこし はやいかも。でも あそべます」. A stage with no units is mist.
- **Domains** are tags (`DOMAINS`: an emoji badge and a tint), filtered by chips; other domains' stops collapse to a dot so the stage keeps its shape; anchors stay under every filter.
- **Couple view:** ✓ mine, ✓✓ both (「ふたりで スタンプ！」), an outlined ✓ the partner's alone; never their answers.
- The 30-day recheck (`rechecksDue`) is a yuzu banner with its own あそぶ, and takes menu card 1 when due. A `draft` unit shows only with the dev hooks on (a dev build or `?demo`). Opening scrolls smoothly to the current stop.

### A unit's page

`path/UnitPage.svelte`: the backdrop (or the domain's tint) with the host; the can-do's one line (`cando.short`, ≤ 25 characters, also a stop's subtitle and the intro card's headline), the full sentence under 「くわしく」; the stamp line (mine and the partner's, 🏅 once stamped) with my tally; the letter, folded, once stamped; the three core lessons (the next green-edged, ✓ once played to the end), the extras (「おまけ（スタンプには ひつようなし）」); フレーズ つかまえた k / n → ずかん on this unit; 「飛ばしてチェック」 until the チェック is next or it's stamped. The lessons shown are those with playable items (`playIds`).

### Mode detail

A mode's page (`mode/ModeDetail.svelte`): its backdrop and cast, subtitle and blurb, chips (8もん, 4ふん, 👥 ふたりで できる; no 問 chip or timer for a mic mode), the place row (`mode/StageRow.svelte`: five places, the picked yuzu, empty ones sunk, はまべ's sub-steps as chips; a listening game offers only the places its files cover, catalog.ts `contentLevels`), こたえる じかん (`TimerRow`), and the sticky foot: さそう / はじめる. At volume 0 an inline 「おとが 0 です。せってい で あげてね」 line. No unit picker: units live on the path.

### しゅうまつ たいかい

`taikai/TaikaiLobby.svelte` (Page `taikai`), from the hub's banner while `taikaiOpen` (Fri 18:00 – Mon 05:00 on the scene clock; `?date=` previews it): しずえ's welcome and three rules, who's in with how many misses each offered (never which), きょうりょく ／ しょうぶ, then 「ひとりで はじめる」 or 「さそう」 and the host's 「はじめる（Nにん）」. The show (`TaikaiPlay.svelte`): しずえ's bar (だい N もん / 7, かけの もんだい), co-op's team against her target or しょうぶ's chips; the wager's bet chips 10–100 first; a confident miss (bet ≥ 70) is a coral 「おしい！ これは わすれませんね」 card with the answer large and the clip once more. Results: the medal, her target and gold lines, the feedback and the misses. Trophies sit on きろく's and ずかん's shelves. The rules: kikimimi-engine.md "しゅうまつ たいかい".

### みんなで

The lobby, from the hub tile, a mode's さそう (game preselected) or an invite (joined; controls read-only, 「ウェイが はじめるのを まっています」): the game picker (co-op-only games included), しまの みち's card (`PathCard`: the host picks a unit and a lesson for everyone), who's in, きょうりょく ／ しょうぶ (when supported), 「おとを 1だいに まとめる」 (default from せってい), then さそう and 「はじめる（Nにん）」. Alone: 「ひとりでも はじめられます」. An invite of content this build lacks (its `cv`) shows 「アプリを こうしんしてね」 with こうしんする. Each phone's tier is its own and never shown beside anyone else's.

### In-game frame

The frame (frame/RoundFrame, RevealFrame) owns the bar (players' chips at the left, the mode's name with round dots, ✕), the countdown, the replay row (🔁 / 🐢, listen-only on the other phones with おなじへや), the timer, the foot and ✕; a game supplies its stage, input and reveal. The reveal: ○ / × with 「せいかい！」 or the answer, the いっぱつ badge, 「2にん せいかい！」 in co-op, the Japanese help, しずえ's polite word (です／ます; casual cheers belong to the villagers).

### The results page

しずえ's line with the team tally (co-op) or ranking (しょうぶ), my tally and いっぱつ count, 「つまずいた ところ」 chips of the missed features, the review list ("The game"), おわる / もういっかい. Every game's results are built from frame/'s parts (ResultsShell, ScoreCard, ReviewRow, LineRow, HearButton, Note, FirstStamp). A lesson adds a strip: the host's face, the unit's dots, after であい / ばめん 「つぎは「ばめん」 ›」, after a チェック the stamp (two for ふたりで スタンプ！) with my first-listen tally (and the team's), or 「あと すこし！」, and the letter the first time. 「📖 読んでから もう一度」 on a review row is よみきき サンド (kikimimi-engine.md "よみきき サンド").

### おやすみ ものがたり

A bedtime story in the night palette whatever the hour, no score (`story/StoryFrame.svelte`, its own chunk; 3 serials: st-johnny, st-cafe, st-tokyo).
- **The frame:** the scene dimmed to 42 % with the heads of who's in it; ⏮ ⏯ ⏭; the sleep timer 10 / 20 / 30 ぷん of listening (a pause stops it) or ぜんぶ, with 「のこり m:ss」; ほんぶんを みる (the words with a karaoke underline, hidden by default) and くわしく (the summary and the chapter's phrases). The end card: 「だい Nわ おしまい」, the morning's guess revealed, 「つぎの おはなしが ひらきました」.
- **The model** (`kikimimi/bedtime.ts`, pure): the timeline (0.6 s between lines of one voice, 0.9 s at a change of speaker), the timer's equal-power fade over its last 20 s, chapters unlocked one by one (finished: played to the end, or the timer ran out in its last third), つづき from the segment left at, the morning card.
- **Playing** (`story/player.svelte.ts`): segments through packs.ts `voiceClip` → `playVoice` (a clip that can't sound passes after 3 s), the music held down (`holdDuck`), the fade on the voice bus (`fadeVoice`); a timed story goes on into the next chapter after 4 s. The timer's end fades the sheet out and closes it.
- **The list** (`story/StoryList.svelte`, あそぶ › ねる まえに): each serial's chapters, ✓ heard, the next green-edged, later ones locked; a serial shows once past `draft`.
- **The hub:** 21:00-04:00 (today.ts `isNight`) the menu's きまぐれ is the story. By day `MorningCard` asks 「きのうの つづき、どうなると おもう？」 (the chapter's three `predict` choices).
- **Minutes, no score:** a `listen` row `{gm: 'story', u: <serial>, lv 4, n 1, r: []}` of the time heard (≥ 10 s), one game id a sitting: きろく's minutes, the quest, a week stamp, a menu tick at ≥ 3 min. Progress and the last timer per player on the phone (`DEVICE.kikiStory`).
- **No playback with the screen locked:** the voice is Web Audio and iOS suspends the context; the story pauses, keeps its place, and 「タップして つづける」 resumes it.

### きろく

`Progress.svelte` (lazy): the place and its bar, the eight sub-skills as horizontal bars (one hue, the value at the end, unmeasured as an outline: bars read better than a radar at 8 skills), the trend sparkline, the week's dots, the trophy shelf, the couple line 「ふたりで こんしゅう: いっしょに Nかい · Mふん」 (minutes only, never a level), the mic games' 「声に出す ○分」, and 「くわしく」 (per type, accent and level; the CEFR). Empty: 「まだ まっしろ…」 with あそぶ. The guest sees its own きろく without the couple line. Day `#3E9E4C`, night `--c-leaf`.

### ずかん

`zukan/KikiZukan.svelte` (from the hub's tile, the path's 「ことば ずかん」 and a unit page), four sections, each its own chunk, over `zukan/data.svelte.ts`; owner-only. The folds are pure: `kikimimi/zukan.ts`, `friendship.ts`, week.ts `weekStamps`.
- **ことば** (`Words`): every unit's key phrases by domain, then each serial's (🌙). Caught (srs.ts `phrasesOf`: right on the first listen in 3 items on ≥ 2 days) shows the phrase, its Japanese, its ★ (`phraseBook`: caught, +★ first listens in 2 accents, +★ one on a phone, a PA or in noise) and a coral NEW until seen; heard, a silhouette with 「Nかい きいた」; never, ？. The entry: the trap, the scene and register, who said it, ▶︎ a clip with it (heard phrases only).
- **こえ** (`Voices`): the 18 cast voices: a face, the accent, the items heard and a bar to caught (10 understood); a tap plays a sample.
- **なかま** (`Friends`): the villagers I've heard, closest first, five hearts ("なかよし"); a level reached is announced once.
- **スタンプ** (`Stamps`): the units' stamps in path order (the double stamp ringed mint), the letters (`LetterShelf`), the week stamps, いっぱつ badges at 10 / 50 / 100 / 300 / 1000, the tournament's trophies, the bedtime chapters heard to the end.

### せってい

`settings/KikiSettings.svelte`: 🔊 「きこえる？」; 「おとを 1だいに まとめる」 as a new lobby's default (`DEVICE.kikiSame`); にほんごやく いつも / まちがえたら / みない (`DEVICE.kikiJa`); こんしゅうの めあて 3 / 5 / 7 にち (`DEVICE.kikiWeekGoal`, 3 by default); 「みみ チェックを もういちど」 with the placed place; 「音声の出典」 (まるごと 聞く's recordings, opened on a tap: settings/LongCredits.svelte); the mic's switch and probe (kikimimi-mic.md "Where they show").

### First run

1. **Welcome** (`onboarding/Welcome.svelte`, in the hub's place; for a player with no games on a phone whose `DEVICE.kikiOnboarded` lacks them): しずえ's hello and three points, あとで / はじめる.
2. **The sound check** (🔊, the volume-0 line).
3. **みみ チェック**, the placement (kikimimi-engine.md "みみ チェック"): solo, about 3 minutes, a progress bar, no score.
4. **The result** (`onboarding/Placed.svelte`): 「もりから はじめましょう！」 on the five-place strip, とくい / これから chips, 「🔒 この けっかは あなただけに みえます。」. It sets おまかせ.

Either way the welcome is marked seen; あとで lands on the hub with the quiet 👂 card. The guest gets the same flow with its own data.

## Progress & feedback

Both learners are B1+ (TOEIC 700+), so the point is which sounds and skills still trip you, not a score. Each person's details are theirs alone; only summaries reach the partner.

### What's measured

- **Every answer:** the item, right or not, the authored choice picked (so distractors diagnose), first listen or not, replays, the level, whether practice.
- **Sub-skills** (the bars): each item's primary skill (its type, or its first feature for `word`) and secondaries (its other features, half weight). Levels 4 up carry `tags`; levels 1-3 a table (`kikimimi/tags.ts`); bank.test checks every item has tags and every tag maps to a skill.

  | skill | label | from |
  |---|---|---|
  | `lr` | L と R | `l-r` |
  | `vowel` | ship と sheep | `vowel` |
  | `cons` | b・v・th | `b-v`, `th`, `sh-s`, `f-h`, `ending`; a `word` item with no feature |
  | `reduce` | つながる おと | `contraction`, `weak-form`, `flap`, `yod`, `gonna` … `kinda`, `can-cant`, `t-glottal`, `ellipsis` |
  | `num` | すうじ | type `num`; `numbers`, `teen-ty`, `clock`, `self-repair` |
  | `detail` | こまかい じょうほう | type `pic`, `gist`; `contrast`, `katakana` |
  | `reply` | へんじ | `reply`, `next`; `idiom` |
  | `indirect` | ほんね | type `mean`; a `reply`, `next` or `gist` whose pragmatic layer is unsaid; `intonation` |

- **Mastery** (0-1): a recency-weighted (half-life 21 days), smoothed (prior 0.7 × 2) mean: first listen right 1, after a replay 0.6, wrong 0. Shown from 3 answers.
- **The level estimate:** an Elo-style ability θ against each item's learned difficulty (progress.ts `difficultyOf`): filed at its place (L1 −1 … もり 2, やま 3, ほし 4; the pack as もり) plus a type offset, then shifted by my answers, the item's own shift (0.4 / (1 + n) a step, ± 1.5) and its shelf's (a place and a type, 0.04 a step, ± 1). θ's K is 0.3 for the first 24 answers, then 0.15. Learned on each phone from its owner's rows only: the record never sends anyone else's answers, and pooling three people's item results would reveal them. The comfortable level is where θ predicts 80 % (θ − ln 4), capped at the hardest played + 0.5. 「はかっている とちゅう」 until 16 answers.
- **Trend:** first-listen accuracy over the last 12 games. **Consistency, never a streak:** the days played this Tokyo week.

### Storage

- **One `listen` row per person per game** (docs/backend.md "Events", `contract/listen.ts`; fields: kikimimi-engine.md "The listen row"): written once at the results with its own event id, so a retry is a duplicate and two phones never overwrite a day. A game left and rejoined writes a second row with the same `g`; `gamesOf` folds them. ~200 bytes, ~2,000 rows a year, never compacted.
- **Who sees it** (`contract/guest.ts rowsFor`, server-enforced): its owner the whole row; everyone else only `{d, g, n, ms}` and a unit's `{u, stamped: 1}`. The guest writes its own.
- **Offline:** the write queue, the optimistic view, and the phone's copy of my last 300 games (`DEVICE.kikimimiGames`); the record's rows win by game id. Everything else, the SRS too, is folded from the rows, never stored.

### Adaptivity

- **The shared deck stays deterministic**; personal adaptivity is solo only.
- **Cards** (a chunk or a feature, never a clip): an item card for each item missed or right only after a replay, a feature card for each feature answered. A due item card comes back through a sibling where one is offered (`srs.ts isSibling`: the same level and type, its num template or first feature; another clip, voice and choices), and the sibling's practice answer steps the card (a sibling with a card of its own steps only its own; the card's own answer that day replaces the step); with none, the same item with its choices turned a place (`bank.ts rotateChoices`). A unit phrase's review takes a clip of it not yet heard first. Leitner boxes 0 / 1 / 3 / 7 / 16 / 35 / 90 days: first listen right good, after a replay hard, wrong again. よみきき サンド's まだ counts as hard on that phone. Folded from the answers (`srs.ts`).
- **おさらい** (にがて れんしゅう): 8 questions from the levels offered: due item cards first (≤ 4), then items carrying the weakest due features, then the weakest skills' items, the least recently heard first, then those whose chance (θ against the learned difficulty) is nearest 75–85 %; a recommendation narrows it to a skill or an accent. Nothing on the wire.

### Recommendations and feedback

`kikimimi/advice.ts`, pure:
- **「つぎは これを れんしゅう しよう」** on the results (at most 3, each one tap): due cards ≥ 4 → おさらい; the weakest skills (mastery < 0.75); a level nudge (the last 3 games ≥ 85 % and a higher place offered → 「… に ちょうせん」; ≤ 50 % → practice first); an accent ≥ 15 points below; an unmeasured skill; スピード はしご.
- **しずえ's line after a game:** the skill that rose most (≥ +0.05), else the first recommendation; all right 「ぜんもん せいかい！ すごい！」.

## Rewards

No かいがら, XP, hearts, leagues, streaks or rankings outside しょうぶ: the rewards are stamps, the ずかん, friendship, letters and landmarks.

### The daily menu

`today.ts`, pure, from the Tokyo day, the report and the SRS: the same menu on every phone of mine.

| Card | Content |
|---|---|
| 1 おさらい | due SRS cards, capped at 8 (「しずえが 6もん えらびました」, never "14 overdue"); a due 30-day recheck takes its place; none due: folded as done |
| 2 きょうの いっぽ | the current unit's next lesson; before units, ひとこと クイズ at my place |
| 3 きまぐれ | one playable mode in turn by the day, never yesterday's (not the quiz when card 2 is one; ニュース only 05:00-11:00; never a mic mode); 21:00-04:00 おやすみ ものがたり |

Any one finished session (a row with ≥ 4 answers, or a story heard ≥ 3 min) means 「きょうは OK」 and stamps the day; a session ticks the first undone card it matches, else the first undone card, so free play is never "off menu". The tournament is a banner, not a card.

### No かいがら

English practice pays nothing in the island economy: ベル stays the fitness wallet and English never touches either currency. The たいかい's wager chips are round-only, never kept.

### The weekly stamp card

`week.ts`, `WeekCard`: each person's target of 3, 5 or 7 days a week (default 3); a day is stamped by one finished session. 「こんしゅう きいた ひ 2 / 3 にち」 and 月…日 dots; met, 「こんしゅうの めあて たっせい！」. A new card each Monday, nothing said of the last, never a "0 days". A week that met the target is a stamp in ずかん.

### ふたりの クエスト

One shared bar of minutes heard, Monday to Sunday, 60 min (fixed). Minutes, not right answers, so each person adds the same per minute at any level. It sums both members' `ms` from my rows and the partner's summaries, never who added what and never the guest's; met, 「クエスト たっせい！」; missed, nothing said. The guest has its own solo quest (30 min).

### Stamps, letters and landmarks

- **A unit's stamp:** 5 of 6 right on the first listen in its チェック, alone or as a team (curriculum.md "Playing together"); retakeable, never locked. Computed from the rows (`kikimimi/stamps.ts`), never stored.
- **Letters:** a stamp brings the host villager's letter (`letter: {en, ja}`, 40-60 words of American English using one of the unit's phrases), compiled into `parts/letters.json` (`kikimimi/letters.ts lettersOf`: one per unit I stamped, never for the partner's stamp alone). `path/VillagerLetter.svelte` arrives open on the results of the チェック that first stamped it, sits folded on the unit's page, and `LetterShelf` lists them in ずかん › スタンプ. Text only.
- **Landmarks:** a stage whose units are all stamped by me is cleared (path.ts `landmarksOf`; never by the placement or the partner's stamps): its head carries the landmark (📻 はまべ ラジカセ, 🛶 かわ いかだ, 🏮 もり ツリーハウスの ランプ, 🔭 やま てんぼうだい, 🌌 ほし てんたいぼうえんきょう) and the first time a celebration card (`DEVICE.kikiLandmarks`). Cosmetic.
- **Trophies:** the tournament's bronze (taking part), silver, gold (kikimimi-engine.md "しゅうまつ たいかい").

### なかよし

`friendship.ts`, from my answers: +2 for an item of a villager's understood on the first listen, +1 after a replay, nothing for a miss; a dialogue counts each villager in it. Points never drop and are never shown; hearts show levels at 10 / 30 / 70 / 150 / 300 (`FRIEND_LEVELS`). Each person's own. In ずかん › なかま: L1 their English greeting, L2 a short letter, L3 a でんわ ともだち badge 📞, L4 a silver frame, L5 their photo in a gold frame.

## Empty and edge states

| Where | State |
|---|---|
| Hub, first open | the welcome |
| Hub, no check yet | the quiet 👂 みみ チェック card; the menu as normal |
| Menu, all done | three ✓, 「きょうは ここまでで じゅうぶんです！」 |
| After a gap | the hour's greeting; the due cap holds (≤ 8), no count of missed days |
| Lobby, host left | 「{name}が おわりに しました」; ‹ to the hub |
| Offline, pack not cached | the game can't start its clips (a chunk that won't load drops what waited); cached packs play |
| `cv` mismatch | 「アプリを こうしんしてね」 |
| Night (21:00-04:00) | きまぐれ = おやすみ |
| Guest | its own solo quest, place, ずかん and きろく; no partner lines |

## Words

The quiz is ひとこと クイズ; levels are ばしょ; にがて れんしゅう is おさらい (にがて only privately in きろく); the placement is みみ チェック; たいせん reads 「きょうりょく ／ しょうぶ」; おなじへや reads 「おとを 1だいに まとめる」; 1かいで せいかい is いっぱつ. Never in the UI: べんきょう, テスト, しけん, レッスン (a unit's lessons go by their names: であい, ばめん, チェック, おと, じっせん), ノルマ, ミス, やさしい / むずかしい.

## UI details

- **Starting.** The HUD menu's 「英語」 pill opens the sheet on its hub; the voice session begins in the pill's tap (`wakeQuizVoice`). While an invite is live the pill's sub-label reads 「誘われています！」.
- **The invite banner** (KikimimiHost.svelte, invite.svelte.ts: always loaded, a few hundred bytes) keeps the last 10 min of game intents and shows 「ウェイが ききみみに さそっています」 [さんか] through the toast host; さんか opens みんなで, joined. My lobby stays on this phone until さそう.
- **Mid-game notices:** 「ホストが ゲームを とじました」, 「ホストが いなくなりました」, 「じかんが たったので おわりました」.
- **Look.** The paper theme, `ui/Sheet.svelte`, villager art via `villagerArt()`; taps ≥ 44 px with `data-sfx`; reduced motion honoured. Play: 🔁 / 🐢 under the bubble, the question centred, choices `clamp(56px, 8vh, 72px)`; an item without `ask` gets its type's (「きこえた ことばは？」, 「なんて こたえる？」).
- **After a lock or app switch** the audio context is suspended; a 「タップして つづける」 card resumes it, so nothing plays with the screen locked.

## マイク

Speaking is opt-in and private: off by default, per phone, recordings never stored or sent. The rule and the modes: [kikimimi-mic.md](kikimimi-mic.md) "The privacy rule".

## Tests

- **vitest:** the deck's determinism and mix; the bank's validity (speakers and art exist, answers in range, clips and caps); the choice tells per level (curriculum.md "Choice tells"); the session's state machine with fake time; the protocol's parse cases (size, guest, ≤ 256 B relayed); the stats, SRS, advice and tag table; each game's kinds.
- **relay vitest:** `quiz` and `play` go to the others and are never stored; `listen` rows owner-only with summaries.
- **e2e** (logic tier, Chromium; specs open past the welcome with `e2e/fixtures.ts` `kikiFirstRun` and go through the hub with `e2e/kikimimi-nav.ts`): two players over `?demo` and `?demo&as=B`, solo, every game solo and co-op; `?kikimimi=fast` shortens the timed windows. `KIKI_SHOTS=1` writes screenshots under /tmp/kikimimi-shots/. Rendering is judged on the iOS Simulator and the phones.
