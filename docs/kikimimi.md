# ききみみ: the English listening game

A listening game for Japanese speakers learning English, for one to three players (A, B and the guest), opened from
the HUD menu's 「英語」 pill and synced so everyone plays the same round at once. Villagers speak the English; しずえ
hosts. No ベル, かいがら or economy tie.

This doc is the player's side: rules, screens, progress and rewards. The summary is docs/design.md "ききみみ クイズ";
the relay's side, docs/backend.md. The other ききみみ docs:
- [kikimimi-engine.md](kikimimi-engine.md): the round engine, the wire, content loading, audio and each game's deal.
- [kikimimi-mic.md](kikimimi-mic.md): the opt-in speaking modes and the microphone's privacy rule.
- [curriculum.md](curriculum.md): what is taught (stages, scenarios, units) and the content.

The sheet's strings are kanji Japanese; mode names, the HUD pill and the villagers' and しずえ's speech stay spaced
kana (docs/decisions.md "Copy"). i18n/kikimimi.ja.json and the per-game `kiki-<gm>` catalogs are the wording's source;
this doc names a string by its key.

## Open items

The one list for ききみみ (the engine, the mic and the curriculum point here).
- **Wire:** stop parsing `quiz` on the client no sooner than 11-24, then drop it from the contract, relay last
  (kikimimi-engine.md "Wire migration").
- **Mic:** the probe on both phones, then the backend thresholds (kikimimi-mic.md "The probe"); until then pick.ts's
  自動 is whisper once its model is on the phone. Workers AI's data terms still to be written into docs/ops; until
  then the relay recogniser is never 自動. Leftovers: こたえて！'s "is it this one?" band and its voice / tap
  preference; くりかえし's device-local speaking span (checked against a month of placements before it touches みみ
  チェック or the stats); the unit page's ロールプレイ row; the input latency off まねっこ's lag.
- **Content:** the listening check of the gate's flagged clips (curriculum.md "Listening check"); backdrops, the tone
  spike and wave 3 (curriculum.md "Backlog"); じっせん as a ladder, and card tiers below はまべ or above やま; placement on
  accent and phone clips, and a stage-boundary re-check offer.
- **Not built (UX):** the couple quest's 30 / 90 setting (needs the relay); the 図鑑 tile's new-entry count and a
  "both know it" line; 記録's skill pages and recent games; an hours-heard meter and K.K. songs; villager, week-stamp
  and tent rewards; an asynchronous "heard it" and a synced shared review; lock-screen playback for stories; segmented
  talks with a comprehension map; a game for ふたりで ジグソー (`half` in the call schema is ready); intonation contours
  over the text; per-lever abilities.
- **Questions:** keep the pill's sub-label? Gulliver and Blathers as hosts of ジョニーの たび / フータの おはなし, or island
  villagers only? Mild swearing at やま and ほし? ウェイ's field of work, for meeting scenarios?

## The game

The quiz, ひとこと クイズ, is the base every other game reuses (kikimimi-engine.md "The round engine").

- **Host and speakers.** Each question is spoken by a villager: their icon bobs with an empty NH speech bubble and a
  progress bar the clip's length. The text is never shown before the reveal; no Animalese over the English.
- **Length.** 8 questions: a level's mix, the アナウンス pack, or two スピード はしご ladders of 4 rungs.
- **Countdown.** 3-2-1 once (4 s); a player's chip gets a ✓ when they answer, never what they chose.
- **Answering.** The choices show dimmed while the clip plays and unlock when its first play ends; one tap, final. The
  limit, from the end of the first play, is the lobby's 答える時間 (`kiki.timer`): 20 / **30** / 60 s or none (the
  question waits for everyone joined and here). The host sets it, each phone remembers its last
  (`DEVICE.kikimimiTimer`), it rides the `open`'s seed. 🔁 replays freely; 🐢 slow at levels 1 and 2 only.
- **Reveal.** Once everyone joined has answered, or at the limit; untimed. The host taps 次へ (solo: you); the others
  tap 読み終わった (📖 on their chip, counted on the host's button, `kiki.nextReady`); with the host gone everyone gets
  次へ. ○ on the right choice, × on a wrong pick (colour is never the only signal); the English at ≥ 17 px with the key
  word marked, played once; the Japanese, the accent and the reactions.
- **Scoring.** Right 100, wrong or timed out 0. No speed bonus (it rewards guessing) and no first-listen points: 1回目で正解
  (一発 in code: right with no replay or slow play, `kiki.firstTry`) is a stamp on the reveal, review and results, so replaying is
  never punished. 音を1台にまとめる never gives it (only the host's phone can replay).
- **Results:** しずえ reads them like the morning broadcast: co-op's team tally, 勝負 a ranking. Then the **review list**,
  the main learning moment, opening on the misses (間違えただけ, the first open). A row: the English with sound marks and
  karaoke, the Japanese, the answer, the `note`, the skills it tripped, my pick, ▶︎ and 🐢 (L1/L2).
  間違えた問題をもう一度 replays just the misses solo, untimed, as practice (`p: 1`) for the SRS.
- **Solo** is the same game with one player. **音を1台にまとめる** (`kiki.same`): only the host's phone speaks (phones
  slightly out of step sound like a chorus); the others' 🔁 / 🐢 are off. Without it, earphones are suggested.

## Question types

- **`pic`**: tap the picture heard, from 4 NH art choices with Japanese labels (so VoiceOver doesn't give the English
  away); the distractors are in the sentence or sound close.
- **`word`**: the sentence with a blank; 3 near-sound choices that each fit (light/right, can/can't, fifteen/fifty).
- **`num`**: prices, times and dates with close distractors (2:15 / 2:50, the 13th / 30th).
- **`reply`**: the best of 3 written replies to a question (TOEIC Part 2). Level 2 up.
- **`mean`**: what the speaker really means, from 3 paraphrases (literal, opposite, a plausible wrong inference).
- **`gist`** and **`next`**: over a 2–4-line dialogue (or a single bulletin at ほし and in the pack), what's going on, or
  the best next line.

**The mix** (mix.ts, per level): はまべ and かわ lean on `pic`, `word`, `num` and (from L2) `reply`; もり up on `mean`,
`gist`, `next`, `reply`, with a word and a number kept for the sounds.

## Japanese help

Each optional, on every item and game (caps: curriculum.md "Audio and script rules"): `ctx`, the situation before the
clip; `cja`, each choice in Japanese; `why`, the 解説 box; `note`, the trap. A missing field is hidden (frame/Why.svelte,
ChoiceGrid `ja`); bank.ts `helpProblems` checks them, and past draft they're required in the listening files
(app/content/listen/README.md). 設定's 日本語訳 (いつも / 間違えたら / 見ない) hides the Japanese on right answers or always.

## Places

One ladder named after places, never "easy / hard" (choosing the easy one in front of a partner is shaming):

| Place | ★ | CEFR (private, under 詳しく) | Quiz level |
|---|---|---|---|
| はまべ | ★ | A2–B1 | L1, L2 (sub-steps はまべ 1・2) |
| かわ | ★★ | B1+ | L3 |
| もり | ★★★ | B2 | L4 |
| やま | ★★★★ | B2+ | L6 |
| ほし | ★★★★★ | C1 | L7 |

L5 is the アナウンス mode beside もり. The mapping is a UI table (catalog.ts `PLACES`, `placeOfLv`, `lvOfPlace`), so the
wire and the `listen` row keep plain `lv` (1–8). A place with no content in this build is sunk (`aria-disabled`).
**おまかせ**, the place row's default (catalog.ts `omakaseLv`): the latest みみ チェック's level, else the comfortable
level (stages.ts `stageAt`), else はまべ 2. A tap overrides it per mode; おまかせに戻す clears it.

## Co-op and たいせん

- **Co-op is the default** with several players: the team tally (`kiki.team.2`, `kiki.team.3`) counts a question at
  least one player got right; answers hide till the reveal, so a miss never costs what the partner caught. Under it,
  そろって正解 (`kiki.teamAll`).
- **Never shame:** in co-op the chips show only ✓; the reveal says how many got it (`kiki.teamNow`, `kiki.teamNone`),
  never who. Each phone keeps its own tally (`kiki.tallyMine`) and review.
- **協力 ／ 勝負** (`kiki.vs`), the host's lobby switch (where supported): points, ✓ / × at the reveal, a ranking. It rides
  the seed's bit 0; flipping it deals a new deck; もう一度遊ぶ keeps it. The quiz ranks plain points; the tournament and
  すうじ ラッシュ score against expectation.

## Dialogues

2–4 lines, two villagers taking turns (たちぎき: three), one clip a line (`<item>-<n>`) in turn on the relay clock
(kikimimi-engine.md "Content"); heard late, a line already over is skipped. Replays play the whole sequence (no 🐢).
Both speakers' heads show, the one talking bobbing; the reveal has the two-sided transcript (`Transcript.svelte`) with
each line's Japanese.

## Visuals

- **Scene card** (`scene/SceneCard.svelte`): a staged item's setting from the lead-in to the reveal: a painted backdrop
  (bank.ts `SCENE_IDS`), the place's name and the channel (face to face, `PhoneFrame`, `PaFrame`, `VideoFrame`, all
  CSS/SVG). Levels 1–3 stay on the plain stage.
- **The backdrops** are generated paper-gouache (`npm run art:scenes`; no text or numbers, so they never give an answer
  away), the villagers' official art composited over them. No NH character or Nintendo look is ever generated.
- **Sound marks at the reveal** (`SoundLine.svelte`, marks.ts): the focus, `say` (Let me → *lemme*), `link`, `drop` and
  `stress`, keyed by `MarkLegend`; authored for every `tts` respelling.
- **Karaoke** while the clip replays: the words said in ink, the current one underlined (`words.json`).

## The アナウンス pack

Level 5 (bank5.ts, 30 items, B1+ → B2): announcements, airport PA, phone menus and voicemails, each with its condition.
Difficulty and the level nudge count it as もり (bank.ts `levelRank`).

## スピード はしご

- **The mechanic.** One line heard four times, faster each time: 0.8×, 1.0×, 1.2×, 1.4× of natural speech (ladder.ts
  `SPEEDS`; 1.0× = 4.3 syllables a second). Each rung asks something new: the gist, a detail, a harder detail (in
  Japanese, so nothing English is read before the faster listen), then the line with its key chunk blanked and 3
  near-sound forms, so only the weak forms heard at 1.4× give it. A game is 2 ladders.
- **The climb** (ladder.ts `climb`): a rung counts when right on the first listen with every rung under it climbed; it
  stops at the first miss, replay or time-out. A flat 100 a rung.
- **Reveals.** A lower rung moves on after 3 s and keeps the line hidden and silent, so the next rung is a listen of its
  own. The top rung's reveal adds the height (`kiki.rung.height`); the results a review row a ladder with ▶︎ at each
  speed.
- **記録's fastest comfortable speed** (progress.ts `speedOf`): the fastest rung climbed in ≥ 75 % of my last 8 ladders
  (from 4). Ladder games stay out of the quiz's trend, nudge and skills.

## 音の へんしん

A daily drill of American connected speech (3–4 minutes of the 15-minute day): the phenomena, curriculum.md "Connected
speech"; the deal and audio, kikimimi-engine.md "音の へんしん".
- **A game:** 8 phrases, 5 of today's phenomenon and one each of earlier ones, each in another voice. Rounds alternate:
  pick the full form of the blanked words from 3 near-sound choices (gonna → going to / got to / want to), or write them
  (typed and matched forgivingly by games/henshin/match.ts, never a near spelling such as then / than; or tiles,
  remembered per phone).
- **Reveal:** ○ / ×, the line with its sound mark, the full form beside the spelling as said, the Japanese, the trap's
  note, and three takes: careful, natural, fast (1.25×). Easy: two choices and one decoy tile; hard four decoys. Co-op
  counts a phrase anyone got; no たいせん.
- **Today's phenomenon** (henshin.ts `focusOf`): the first not yet 習得; the host's rides the lobby. The mode page lists
  each with its bar; a tap plays another until reset.
- A missed phrase is an item card; おさらい asks it through another phrase of its phenomenon (srs.ts `isSibling`). Level
  8 feeds 記録's つながる音 and the features, never the ability, difficulties, trend or nudge.

## まるごと 聞く

C1 listening, everyday and travel (curriculum.md "Long listening"; the engine, kikimimi-engine.md "まるごと 聞く"). At
ほし, on じっくり (never きまぐれ); about 6 minutes, solo or co-op.
- **A game:** one 2–5 minute piece played whole (its speakers on the stage, `ctx` under it; nothing to answer while it
  plays), then 4–5 questions with no clip (the point, the implied meaning, the feeling, the next step), 3 English choices
  each (easy: two). 通しでもう一度 replays it all.
- **Reveal:** ○ / ×, each choice's Japanese, 解説, and the answering line with ▶︎. **Results:** the review, the transcript
  (every line tappable, each question's mark on its line), the credit of a real recording, then dictation of 1–2 lines
  near my misses.
- **The pieces:** 5 real recordings and 5 generated scenes. Today's: the first not heard, then one I missed (under 75 %)
  a week ago or more, else the least recent; the mode page picks another.
- Each question and dictation line is an item (`<piece>-q1`, `<piece>-k12`, outside every deck); a miss comes back in
  おさらい through a sibling. 設定's 音声の出典 lists each real recording's credit and licence.

## Navigation

```
pill ─▶ sheet ききみみ
hub ─┬─ ⚙ 設定
     ├─ menu card ───────────────▶ [game frame] ─▶ results
     ├─ 遊ぶ ─┬─ しまの みち ─ unit ─▶ [frame]
     │        ├─ 寝る前に ─ StoryList ─▶ StoryFrame
     │        └─ mode detail ─┬─▶ [frame] ─▶ results
     │                        └─ みんなで (game preselected)
     ├─ みんなで (lobby) ─▶ [frame on every phone] ─▶ results
     ├─ 図鑑
     ├─ 記録
     └─ たいかい banner (Fri 18:00 – Mon 05:00) ─▶ TaikaiLobby
first open: welcome ─ sound check ─ みみ チェック ─ result ─▶ hub
```

A hub and one push/pop stack (nav.ts `Page`, ≤ 4 deep, `MAX_DEPTH`), not a tab bar: each page's foot is its sticky
action row, and most opens are "do today's thing".
- ‹, a backdrop tap or Esc pops, and closes at the hub; ✕ closes the sheet from any page (with others in my lobby it
  asks first).
- **A game** is a level over the page that started it: ‹ (a backdrop tap, Esc) leaves for that page, ✕ closes the
  sheet. Mid-game both ask `kiki.quit` (the record so far is kept; with others, `kiki.quitOthers`: the game goes on
  without me), except solo before my first answer. ‹ and 終わる land on the stack under the game with a fresh lobby of
  mine (actions.ts `done`): a mode's page, the unit's page, みんなで, たいかい's page; from the hub or a lobby I joined, the
  hub; the first run's みみ チェック, the welcome's last step.
- **Results:** ‹ = 終わる (no ask); もう一度遊ぶ restarts the mode and re-invites.
- **Deep links:** the invite opens `[lobby]` (`inviteStack`), the たいかい banner `[taikai]`, a mode `[asobu, mode]`.
- StoryFrame is a game page (‹ to 寝る前に, its place kept; a backdrop tap does nothing); its sleep timer ends it and the sheet fades closed
  over 2 s.

## Screens

Cream cards on the tan panel (`--r-card` 24, buttons 16, taps ≥ 44 px).

### The hub

The invite card while one waits; しずえ's line by the hour (never a count of missed days); the daily menu's three cards
(a done card folds to ✓, the first undone has the only green button); a quiet 👂 みみ チェック card until a check row
exists; four tiles, 遊ぶ · みんなで · 図鑑 · 記録; the たいかい banner; the week card (stamps and the quest); by day after a
bedtime chapter, `hub/MorningCard.svelte`.

### 遊ぶ

しまの みち's card first, then the modes in a 2-column grid per group (catalog.ts `MODES`, `shelves`; later games add
theirs from round/registry.ts):

| Group (`kiki.group.*`) | Modes |
|---|---|
| さくっと（3分でできる） | ひとこと クイズ, スピード はしご, おさらい, ことば タイル, すうじ ラッシュ, 音の へんしん |
| 街で・電話で（場面で聞く） | アナウンス, ようじ でんわ, たちぎき |
| じっくり（長めに聞く） | しずえの ニュース, まるごと 聞く (ほし) |
| 寝る前に（点数なし） | おやすみ ものがたり |
| 声に出す（マイクを使う） | the mic modes, only while the mic is on (kikimimi-mic.md "Where they show") |
| みんなで picker only | ふたりで ロールプレイ |
| hub only | しずえの しゅうまつ たいかい (the banner), みみ チェック (first run; again from ⚙) |

Only playable modes show; an empty group is hidden; no "coming soon" wall, no filter UI. おさらい: 8 questions from the
SRS ("Adaptivity").

### しまの みち

The island path of units (curriculum.md "Units"), from 遊ぶ's first card and the menu's 今日の一歩
(`path/IslandPath.svelte`, its own chunk; the pure model `kikimimi/path.ts` `pathOf`).
- **Stages in order**, each folding under its head (name, ★, landmark, ✓ k / n), open for the current unit's stage and
  the placed one; anchors (`glue`) first. はまべ has no units: its stop is the quiz.
- **The current unit:** the last played and unstamped, else the first unstamped from my comfortable stage up; its next
  lesson (`nextLesson`): the core lessons, the チェック until stamped, then the extras. 続ける opens that lesson's intro
  card; a tap elsewhere opens the unit's page.
- **Never locked.** Above the placed (or comfortable + 1) stage a stage is soft (striped, `kiki.path.soft`); one with no
  units is mist.
- **Domains** are tags (`DOMAINS`: an emoji badge and a tint) filtered by chips; others collapse to a dot so the stage
  keeps its shape; anchors stay under every filter.
- **Couple view:** ✓ mine, ✓✓ both, an outlined ✓ the partner's alone; never their answers.
- The 30-day recheck (`rechecksDue`) is a yuzu banner and takes menu card 1 when due. A `draft` unit shows only with the
  dev hooks (a dev build or `?demo`).

### A unit's page

`path/UnitPage.svelte`: the backdrop with the host; the can-do's line (`cando.short`, the full one under 詳しく); the
stamp line (mine and the partner's) with my tally; the letter once stamped; the three core lessons and the extras with
playable items (`playIds`); the phrases caught k / n → 図鑑; 飛ばしてチェック until the チェック is next or stamped.

### Mode detail

`mode/ModeDetail.svelte`: backdrop, cast and blurb, the place row (`mode/StageRow.svelte`: only places its files cover,
catalog.ts `contentLevels`), 答える時間, and the foot 誘う / 始める. At volume 0, `kiki.testZero`. Units live on the path,
not here.

### しゅうまつ たいかい

`taikai/TaikaiLobby.svelte`, from the hub's banner while `taikaiOpen` (`?date=` previews it): who's in with how many
misses each offered (never which), 協力 ／ 勝負, a solo start or 誘う. The show (`TaikaiPlay.svelte`): the team against
しずえ's target or 勝負's chips; a confident miss (bet ≥ 70) is a coral card with the answer large and the clip once more.
Trophies sit on 記録's and 図鑑's shelves. Rules: kikimimi-engine.md "しゅうまつ たいかい".

### みんなで

The lobby, from the hub tile, a mode's 誘う or an invite (joined; read-only, `kiki.waitHost`): the game picker (co-op-only
games included), `PathCard` (the host picks a unit and lesson for everyone), who's in, 協力 ／ 勝負, 音を1台にまとめる
(default from 設定), 誘う and 始める（N人）. Alone: `kiki.soloOk`. An invite of content this build lacks (its `cv`) shows
`kiki.update` with 更新する. Each phone's tier is its own, never shown beside anyone else's.

### The results page

The frame (frame/RoundFrame, RevealFrame) owns the bar, countdown, replay row, timer and foot; a game supplies its stage,
input and reveal. しずえ's words are polite (です／ます); casual cheers are the villagers'. The results: しずえ's line with the team tally or ranking, my tally and 1回目で正解 count, the missed features, the review list, 終わる /
もう一度遊ぶ. A lesson adds a strip: the unit's dots, the next lesson, after a チェック the stamp (two for a double) or
`kiki.stamp.notYet`, and the letter the first time. 読んでから もう一度 on a review row is よみきき サンド
(kikimimi-engine.md "よみきき サンド").

### おやすみ ものがたり

A bedtime story in the night palette whatever the hour, no score (`story/StoryFrame.svelte`, its own chunk; serials in
app/content/listen/story/).
- **The frame:** the scene dimmed with the heads of who's in it; ⏮ ⏯ ⏭; the sleep timer 10 / 20 / 30 min or 全部;
  本文を見る (hidden by default) and 詳しく. The end card unlocks the next chapter.
- **Model and player** (`kikimimi/bedtime.ts`, `story/player.svelte.ts`): chapters unlock one by one (finished: played to
  the end, or the timer ran out in its last third), resume where left, play on the voice bus with the music down; a
  timed story goes on into the next chapter after a pause.
- **The list** (`story/StoryList.svelte`, 遊ぶ › 寝る前に): each serial's chapters, later ones locked; past `draft` only.
- **The hub:** 21:00–04:00 (today.ts `isNight`) きまぐれ is the story; by day `MorningCard` asks `kiki.story.morning` (the
  chapter's `predict` choices).
- **Minutes, no score:** a `listen` row `{gm: 'story', u: <serial>, lv 4, n 1, r: []}` of the time heard (≥ 10 s), one
  game id a sitting, feeding 記録's minutes, the quest, a week stamp and a menu tick at ≥ 3 min. Progress and the last
  timer per player on the phone (`DEVICE.kikiStory`).

### 記録

`Progress.svelte` (lazy): the place, the eight sub-skills as bars (unmeasured as an outline), the trend, the week's dots,
the trophies, the couple line (times played together and minutes, never a level), the mic games' minutes, and 詳しく
(per type, accent and level; the CEFR). The guest's has no couple line.

### 図鑑

`zukan/KikiZukan.svelte` (from the hub, the path and a unit page), four tabs (`kiki.zukan.tab.*`), each its own chunk,
over `zukan/data.svelte.ts`; owner-only. Pure folds: `kikimimi/zukan.ts`, `friendship.ts`, week.ts `weekStamps`.
- **言葉** (`Words`): every unit's and serial's key phrases. Caught (srs.ts `phrasesOf`): the phrase, its Japanese and ★
  (`phraseBook`); heard: a silhouette with a count; never: ？. The entry: the trap, the scene, who said it, ▶︎ a clip.
- **声** (`Voices`): the cast's voices, each with the items heard and a bar to caught; a tap plays a sample.
- **仲間** (`Friends`): the villagers heard, closest first, five hearts ("なかよし"); a new level is announced once.
- **スタンプ** (`Stamps`): unit stamps, letters, week stamps, 1回目で正解 badges, trophies, bedtime chapters finished.

### 設定

`settings/KikiSettings.svelte`: 聞こえる？ (the sound check); 音を1台にまとめる as a new lobby's default (`DEVICE.kikiSame`);
日本語訳 (`DEVICE.kikiJa`); 今週の目標 3 / 5 / 7 days (`DEVICE.kikiWeekGoal`, default 3); みみ チェックをもう一度; 音声の出典
(settings/LongCredits.svelte); the mic's switch and probe (kikimimi-mic.md "Where they show").

### First run

1. **Welcome** (`onboarding/Welcome.svelte`, once per player and phone, the guest too): あとで lands on the hub with the
   quiet 👂 card.
2. **The sound check** (🔊, the volume-0 line).
3. **みみ チェック**, the placement (kikimimi-engine.md "みみ チェック"): solo, about 3 minutes, a progress bar, no score.
4. **The result** (`onboarding/Placed.svelte`): `kiki.placed.say` on the five-place strip, 得意 / これから chips,
   `kiki.placed.mine` (only you see it). It sets おまかせ.

## Progress & feedback

Both learners are B1+ (TOEIC 700+), so the point is which sounds and skills still trip you, not a score. Details are
each person's own; only summaries reach the partner.

### What's measured

- **Every answer:** the item, right or not, the authored choice picked (so distractors diagnose), first listen or not,
  replays, the level, whether practice.
- **Sub-skills** (tags.ts `SKILLS`, `kiki.skill.*`): L と R, ship と sheep, b・v・th, つながる音, 数字, 細かい情報, 返事, 本音.
  Each item counts for its primary skill (its type, or its first feature for `word`) and at half weight its other
  features' (tags.ts `FEATURE_SKILL`, `skillsOf`); bank.test checks every item has tags and every tag maps to a skill.
- **Mastery** (0–1, progress.ts): a recency-weighted, smoothed mean (first listen right 1, after a replay 0.6, wrong 0),
  shown from 3 answers.
- **The level estimate:** an Elo-style ability θ against each item's learned difficulty (progress.ts `difficultyOf`),
  learned on each phone from its owner's rows only (pooling three people's results would reveal them). The comfortable
  level is where θ predicts 80 %, capped at the hardest played + 0.5; `kiki.prog.measuring` until 16 answers.
- **Trend:** first-listen accuracy over the last 12 games. **Consistency, never a streak:** the days played this Tokyo
  week.

### Storage

- **One `listen` row per person per game** (docs/backend.md "Events"; fields: kikimimi-engine.md "The listen row"),
  written once at the results with its own event id, so a retry is a duplicate and two phones never overwrite a day. A
  game left and rejoined writes a second row with the same `g`; `gamesOf` folds them. Never compacted.
- **Who sees it** (`contract/guest.ts rowsFor`, server-enforced): its owner the whole row; everyone else `{d, g, n, ms}`
  and a unit's `{u, stamped: 1}`; never one partner's level beside the other's, nor who picked what live. The guest's
  rows are in no couple summary.
- **Offline:** the write queue, the optimistic view and the phone's copy of my last 300 games (`DEVICE.kikimimiGames`);
  the record's rows win by game id. Everything else, the SRS too, is folded from the rows, never stored.

### Adaptivity

- **The shared deck stays deterministic**; personal adaptivity is solo only.
- **Cards** (srs.ts; a chunk or a feature, never a clip): an item card for each item missed or right only after a
  replay, a feature card for each feature answered. A due item card returns through a sibling (`isSibling`: same level
  and type, another clip, voice and choices), else with its choices turned (`bank.ts rotateChoices`); a unit phrase
  through a clip of it not yet heard. Leitner boxes 0 / 1 / 3 / 7 / 16 / 35 / 90 days: first listen right good, after a
  replay hard, wrong again; よみきき サンド's まだ counts as hard on that phone.
- **おさらい**: 8 questions: due item cards first (≤ 4), then items carrying the weakest due features, then the weakest
  skills' items, least recently heard first, then those whose chance is nearest 75–85 %; a recommendation narrows it to
  a skill or an accent. Nothing on the wire.

### Recommendations and feedback

`kikimimi/advice.ts`, pure (thresholds there):
- **What next** on the results (`kiki.rec.*`, ≤ 3, one tap each): due cards ≥ 4 → おさらい; the weakest skills; a level
  nudge (the last 3 games ≥ 85 % → a try higher; ≤ 50 % → practice first); an accent ≥ 15 points below; an unmeasured
  skill; スピード はしご.
- **しずえ's line after a game** (`advice.ts feedback`): all right, `kiki.fb.perfect`; under half right, `kiki.fb.tough`
  (hear the misses again: no next set, 間違えた問題をもう一度 leaf green); else the skill that rose most (≥ +0.05) or
  `kiki.fb.keep`, with the first recommendation.

## Rewards

No XP, hearts, leagues, streaks or rankings outside 勝負: the rewards are stamps, the 図鑑, friendship, letters and
landmarks. **No かいがら:** English practice pays nothing in the island economy (ベル stays the fitness wallet); the
たいかい's chips are round-only.

### The daily menu

`today.ts`, pure, from the Tokyo day, the report and the SRS: the same on every phone of mine.

| Card | Content |
|---|---|
| 1 おさらい | due SRS cards, capped at 8 (`kiki.review.picked`, never "14 overdue"); a due 30-day recheck takes its place; none due: folded as done |
| 2 今日の一歩 | the current unit's next lesson; before units, ひとこと クイズ at my place |
| 3 きまぐれ | one playable mode in turn by the day, never yesterday's (not the quiz when card 2 is one; ニュース only 05:00–11:00; never a mic mode); 21:00–04:00 おやすみ ものがたり |

One finished session (a row with ≥ 4 answers, or a story heard ≥ 3 min) means 今日はOK and stamps the day; it ticks the
first undone card it matches, else the first undone card, so free play is never "off menu".

### The weekly stamp card

`week.ts`, `WeekCard`: a target of 3, 5 or 7 days a week (default 3), a day stamped by one finished session. 今週聞いた日
k / n and 月…日 dots; met, `kiki.week.met`. A new card each Monday, nothing said of the last, never "0 days"; a met week
is a stamp in 図鑑.

### ふたりの クエスト

One shared bar of minutes heard, Monday to Sunday, 60 min. Minutes, not right answers, so each person adds the same at
any level. It sums both members' `ms` (my rows and the partner's summaries), never who added what, never the guest's;
met, `kiki.quest.met`; missed, nothing said. The guest has its own solo quest (30 min).

### Stamps, letters and landmarks

- **A unit's stamp:** 5 of 6 right on the first listen in its チェック, alone or as a team (curriculum.md "Playing
  together"); retakeable. Computed from the rows (`kikimimi/stamps.ts`), never stored.
- **Letters:** my stamp brings the host villager's letter (40–60 words using a unit phrase; `kikimimi/letters.ts`), never
  for the partner's stamp alone: open on the results that first stamped it, then on the unit's page and in 図鑑 › スタンプ.
- **Landmarks:** a stage whose units I've all stamped is cleared (path.ts `landmarksOf`): its head carries the landmark
  (`kiki.landmark.*`), the first time with a celebration card. Cosmetic.
- **Trophies:** the tournament's bronze (taking part), silver, gold.

### なかよし

`friendship.ts`, from my answers: +2 for a villager's item understood on the first listen, +1 after a replay, nothing
for a miss; a dialogue counts each villager in it. Points never drop and are never shown; hearts at 10 / 30 / 70 / 150
/ 300 (`FRIEND_LEVELS`), each person's own. In 図鑑 › 仲間: L1 their English greeting, L2 a short letter, L3 a
phone-friend badge 📞, L4 a silver frame, L5 their photo in a gold frame.

## Empty and edge states

All done: three ✓, `kiki.hub.enough`. After a gap: the hour's greeting, the due cap holds (≤ 8). Offline with a pack not
cached, the game can't start its clips. The guest: its own solo quest, place, 図鑑 and 記録, no partner lines.
Never in the UI: study, test or exam words, "lesson" (lessons go by their names: であい, ばめん, チェック, おと, じっせん),
quotas, "mistake" labels, easy / hard.

## UI details

- **Starting.** The pill opens the sheet on its hub; the voice session begins in the pill's tap (`wakeQuizVoice`). While
  an invite is live the pill's sub-label says so.
- **The invite banner** (KikimimiHost.svelte, invite.svelte.ts: always loaded, a few hundred bytes) keeps the last 10
  min of game intents and shows `kiki.invite` [`kiki.join`] through the toast host; さんか opens みんなで, joined. My lobby
  stays on this phone until 誘う.
- **Mid-game notices** (`kiki.notice.*`): the host closed the room, the connection dropped, it stopped for inactivity.
- **Look.** The paper theme and `ui/Sheet.svelte`; taps ≥ 44 px with `data-sfx`; an item without `ask` gets its type's
  (`kiki.ask.*`).
- **After a lock or app switch** iOS suspends the audio context (the voice is Web Audio): a タップして続ける card resumes
  it, so nothing plays with the screen locked; a story pauses and keeps its place.

Speaking is opt-in and private: [kikimimi-mic.md](kikimimi-mic.md) "The privacy rule".

## Tests

The engine's vitest: kikimimi-engine.md "Tests"; the choice tells, curriculum.md "Choice tells". e2e (logic tier,
Chromium; specs pass the welcome with `e2e/fixtures.ts` `kikiFirstRun` and go through the hub with `e2e/kikimimi-nav.ts`):
two players over `?demo` and `?demo&as=B`, every game solo and co-op; `?kikimimi=fast` shortens the timed windows;
`KIKI_SHOTS=1` writes screenshots under /tmp/kikimimi-shots/. Rendering is judged on the iOS Simulator and the phones.
