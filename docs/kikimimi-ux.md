# ききみみ UX: the hub, the menu, progression (design, 2026-11-06)

> **The user's decisions (2026-11-06):** the design is approved for building. **No かいがら:** English practice pays nothing in the island economy, so drop every reward amount below and keep the stamps, the ずかん, friendship, gifts and letters as the rewards. The weekly target defaults to **3 days**. A stage's reward comes **only when it's cleared unit by unit**, never when the placement test skips it.


This is the lead product designer's synthesis of the UI/UX round on the English-listening feature. The inputs were the brief (the user: "overhaul the menu and UI design… make it intuitive and reorganize features", and "take inspiration from Duolingo and other language-learning game apps"), the IA and wireframes (UX), the game team's study of Duolingo and the island's loops, and the copy and naming review (a UX writer with the ウェイ / うめ panel). It builds on docs/kikimimi.md (as built), docs/curriculum.md §3, §7, §7.1, §11 and §14, and docs/kikimimi-framework.md §5 and §7. Nothing here is built yet. Builders follow this document and update it as they go. Settled choices move into docs/decisions.md as they land.

A clickable static prototype of every screen below was built alongside this doc (plain HTML, the app's tokens, fonts and art, screenshots at 393×852 in WebKit). It isn't in the repo. The wireframes here are the reference.

**Built so far:**
- **U0 (2026-11-06):** the naming of §3 in the strings (i18n/kikimimi.*.json, ja.json): the pill 「ききみみ」 with its small 「えいご」 (「さそわれています！」 while an invite waits), the sheet 「ききみみ」, the banner 「{name}が ききみみに さそっています」 and the idle card 「{name}が さそっています」; the quiz 「ひとこと クイズ」; levels 1–4 as はまべ 1 / はまべ 2 / かわ / もり under 「ばしょ」; 「おとを 1だいに まとめる」 with its 「おなじ へやで ハモらない ように」; 「きょうりょく ／ しょうぶ」 as a Segmented (`data-kiki-vs` coop | vs); はじめる / さそう; 「ここで やめる？」 + 「ここまでの きろくは のこります」; 「けっか」; the tallies 「7 / 8 もん せいかい」, 「じぶんは 7 / 8」, 「ふたりで 7 / 8」; the notices without ホスト; the skill and chip labels (ship と sheep, b・v・th, こまかい じょうほう, へんじ, I'd / I'll, はぶかれる ことば); いっぱつ for 1かいで; しずえ's lines in です／ます (the cheers, results, feedback). The bank's translations (kanji-kana at ★1) wait for a content pass.
- **U1 (2026-11-06):** the hub and the one stack. `components/kikimimi/nav.ts` (pure: push / pop, the depth, the deep links), `kikimimi/catalog.ts` (pure: the modes' groups, minutes, sharing and gates; the ばしょ places over the levels). The sheet opens on `hub/Hub.svelte` (its own chunk): the invite card while one waits (さんか → `[hub, みんなで]`; a newer content's こうしんする), しずえ's greeting by the hour, a v0 today card (ひとこと クイズ at my place, はじめる at once; the menu comes in U2), the four tiles with their live lines, ⚙ in ‹'s place. あそぶ (`asobu/Asobu.svelte`): しまの みち's card, then さくっと (ひとこと クイズ, スピード はしご, おさらい once a game is played) and まちで・でんわで (アナウンス), 2 columns. A mode's page (`mode/ModeDetail.svelte`, StageRow, TimerRow) sets my lobby's game on entering; はまべ's two steps are chips under the row; no おまかせ yet (the level last played is kept, `DEVICE.kikimimiLv`). みんなで is the lobby (`Lobby.svelte`, game chips, the path card for co-op lessons); ‹ from it cancels a shared lobby, a joined player's ‹ leaves for its hub; ✕ with others in it asks 「へやを とじる？」. きろく is Progress as it was; せってい (`settings/KikiSettings.svelte`) has the sound check. Results' おわる goes to the hub. Pages are `{#await import()}` chunks under scripts/kikimimi-budget.ts (hub ≤ 25 KB, the others ≤ 15 KB; as built 0.7-3.6 KB). e2e kikimimi-hub (push/pop, Esc, ✕, today's card, みんなで shared / joined / cancelled) and every kikimimi spec through the hub (`e2e/kikimimi-nav.ts`).
- **U2 (2026-11-06):** the daily menu. `kikimimi/today.ts` (pure, today.test): `pickMenu` over the Tokyo day, the due cards, the first due 30-day recheck, the path's current unit and its next lesson, my comfortable level, the playable modes and today's finished sessions (≥ 4 answers). Card 1 おさらい (「しずえが Nもん えらびました」, ≤ 8; the recheck takes it when due; none due: 「おさらいは ぜんぶ おわり！」, folded), card 2 きょうの いっぽ (the unit's next lesson; before units ひとこと クイズ at my place), card 3 きまぐれ (the playable modes in turn by the day, so never yesterday's; the quiz left out when card 2 is one). A session ticks the first undone card it matches (おさらい ↔ practice, a lesson ↔ its unit, the quiz, the ladder, アナウンス), else the first undone card; any one is 「きょうは OK」, all three 「きょうは ここまでで じゅうぶんです！」. After 21:00 きまぐれ is おやすみ ものがたり (G-おやすみ below). The hub shows the cards (a done one folded to a coral ✓, the first undone one green-edged with the only green はじめる) and the line 「1つで きょうは OK。のこりは おまけです」. A card plays at once (おさらい, the recheck's or the lesson's intro card, the quiz, the ladder, アナウンス: actions.ts `menu`). The recommendations left きろく (advice.ts still words the results' 「つぎは…」).
- **U4 (2026-11-06), the week and せってい, no かいがら:** `kikimimi/week.ts` (pure, week.test): the stamp card (a day stamped by one finished session, Monday first, against my target; a new card each Monday, nothing said of the last; never a streak) and the quest (a member's phone: both members' minutes this week summed from my rows and the partner's summaries, never the guest's, one bar, 60 min; the guest's own solo quest, 30 min). `hub/WeekCard.svelte` under the tiles: 「こんしゅう きいた ひ 2 / 5 にち」, 月…日 dots (today ringed, a coral ✓ for a stamped day), 「ふたりの クエスト ふたりで 12 / 60 ぷん」 and its bar; met: 「こんしゅうの めあて たっせい！」 / 「クエスト たっせい！」. No rewards are paid (the user's decision): the week stamps and quest gifts wait for ずかん › スタンプ and the present path. せってい: 🔊 きこえる？, 「おとを 1だいに まとめる」 as a new lobby's default (`DEVICE.kikiSame`; my lobby kept alone takes it at once), にほんごやく いつも / まちがえたら / みない (`DEVICE.kikiJa`: the sheet's `data-kiki-ja` hides `.ja` at a right reveal and on right review rows, or always), こんしゅうの めあて 3 / 5 / 7 にち (`DEVICE.kikiWeekGoal`, 3 by default). The quest's 30 / 60 / 90 shared setting needs the relay and isn't built (60 fixed); 「みみ チェックを もういちど」 came with the placement check (U6). Screenshots: /tmp/kikimimi-shots/ux/ (hub, hub-week, asobu, mode-quiz, mode-ladder, mode-announce, lobby-alone, lobby-shared, lobby-joined, record, settings).
- **G-おやすみ (2026-11-07), おやすみ ものがたり:** `kikimimi/bedtime.ts` (pure, bedtime.test): the chapter's timeline (each segment after the one before plus a gap: 0.6 s when the same voice goes on, 0.9 s at a change of speaker), the sleep timer (10 / 20 / 30 ぷん of listening, a pause stops it; ぜんぶ: to the chapter's end) and its fade (`fadeCurve`: an equal-power curve over the last 20 s), chapters unlocked one by one (finished = played to the end, or the timer ran out in the last third), つづき (`nextOf`: the chapter left part-way at its segment), `pickSerial` (the serial last played with a chapter left) and the morning card. `story/player.svelte.ts` plays a chapter through packs.ts `voiceClip` → `playVoice`, moving on by the clips' lengths (a clip that can't sound passes silently after 3 s), the music held down under the whole run (engine.ts `holdDuck`: no swell in the gaps) and the timer's fade on the voice bus (engine.ts `fadeVoice`); a timed story goes on into the next chapter after 4 s, ぜんぶ stops at the end card. `story/StoryFrame.svelte` (its own chunk, 5.2 KB): a game page (no ‹; Esc and the backdrop do nothing, ✕ closes), the sheet in the night palette (`data-kiki-night` on the body sets tokens.css' night values a step deeper on the dialog) whatever the hour; the serial and chapter, the scene dimmed to 42 % with the heads of who's in it (the speaker lit with a soft ring, nothing bobs), the title and caption, the bar and time, ⏮ ⏯ (92 px) ⏭, the timer chips (the picked one a soft ring, not yuzu) with 「のこり m:ss」, ほんぶんを みる (the segment's words with a karaoke underline, hidden by default) and くわしく (the summary `ja` and the chapter's phrases); controls are silent (no cue over the voice); reduced motion drops the fades. The end card: 「だい Nわ おしまい」, the morning's guess revealed, 「つぎの おはなしが ひらきました」 with もくじ / つぎの おはなし. The timer's end: the sheet fades over 2 s and closes. The page hidden pauses it (see the limit below). `story/StoryList.svelte` (あそぶ › ねる まえに, a night-navy tile 🌙; Page `story`): each serial's chapters, ✓ heard, the next green-edged (きく / つづきから), later ones locked (aria-disabled). The hub: after 21:00 (today.ts `isNight`, 21:00-04:00) きまぐれ is the story (「ジャスミンの きっさてん・だい 2わ」), playing the picked serial's next chapter at once; by day `hub/MorningCard.svelte` under the menu asks 「きのうの つづき、どうなると おもう？」 the day after a chapter (its three `predict` choices, あとで hides it for the day), the guess revealed at the next chapter's end. Progress per serial and the last timer on the phone (`DEVICE.kikiStory`, by who). Minutes: a `listen` row `{gm: 'story', u: <serial>, lv 4, n 1, r: []}` of the time heard since the last one at each stop (a pause, a lock, a chapter's or the timer's end, the close; ≥ 10 s), one game id per sitting (gamesOf sums them into the report's `stories`): きろく's minutes, the couple quest, a week stamp and a menu tick at ≥ 3 min. **Relay deploy needed** before phones send these rows (contract/listen.ts: `r` may be empty only with gm `story`); until then the relay refuses them silently and the phone's own copy still counts. **Limit: no playback with the screen locked.** The voice is Web Audio, and the app pauses the engine when the page hides (sound.svelte.ts `onHide`; iOS suspends the context anyway): the story pauses, keeps its place, and the sheet's 「タップして つづける」 card resumes the voice. Lock-screen audio would need a media-element path with a Media Session; not done (no native hacks). e2e kikimimi-story (21:30 night card → play, ⏸ / ▶, the timer, the words, ⏭ to the end, the next chapter unlocked; the morning card and the reveal). Screenshots: /tmp/kikimimi-shots/story/ (hub-night, frame, frame-timer, frame-text, end, list, hub-morning, end-reveal).
- **U5 (2026-11-07), the full ずかん:** ことば · こえ · なかま · スタンプ, §6.10 "Built (U5)".
- **G-たいかい (2026-11-07), しずえの しゅうまつ たいかい's UI** (the logic: kikimimi-framework.md "G-たいかい logic as built"): the hub's yuzu banner under the tiles while `taikaiOpen` (Fri 18:00 – Mon 05:00, the scene clock: a `?date=` preview moves it), 「こんしゅうの まちがいから 7もん ＋ かけの もんだい」 or, once played, this weekend's best trophy (🥉 🥈 🥇, `trophiesOf` over my games: progress.ts now keeps a row's `gm` and `u`) and 「もういちど ちょうせん できます」. It pushes Page `taikai` (`taikaiStack`), the lobby (`taikai/TaikaiLobby.svelte`, its own chunk): しずえ's welcome, the three rules, who's in with how many misses each offered (never which: the host's count rides the options' third int, the others' are their `ev` offers), きょうりょく ／ しょうぶ (co-op default), then 「ひとりで はじめる」 or 「さそう」 (the primary when someone's on the island) and the host's 「はじめる（Nにん）」. game.svelte.ts `openTaikai` opens it at my tier (`tierOf` my comfortable level) with my offer (`taikaiOffer`: my week's misses), a joiner's phone sends its offer once in (`#taikaiOf`; a taikai invite's join carries my tier) and the host's picks again (`taikaiPickFor`, its recent games' items last among the fillers) whenever the offers or tiers change, once the ids' levels are loaded (`configure({ids})`); ‹ from the page goes back to the hub's quiz lobby. The show (`taikai/TaikaiPlay.svelte` over Play's new `show` / `gate` snippets): しずえ's bar (だい N もん / 7, かけの もんだい), co-op's team against her target (a pip a round, her line 🥈 and gold 🥇 flagged; solo the same against my tier) or しょうぶ's chips; the wager's bet chips 10–100 first (`QuizGame.bet`; the choices stay closed till one is picked; the answer goes as `[choice, bet / 10]`), its reveal: a confident miss (≥ 70) as a coral card, 「おしい！ これは わすれませんね」, the answer large and my pick struck, −bet → chips, the clip once more; a confident right the leaf cheer. Results (`taikai/TaikaiResults.svelte` over Results' new `hostLine` / `extra`): the medal dropping in, 「ぎんの トロフィー」, her target and gold lines, the wager's chips, 「トロフィーは きろくの たなに かざりました」, しずえ's line by the trophy, then the usual feedback and the review list of the misses; もういっかい reopens the tournament (re-invites when shared). The row: `taikaiRow` (gm taikai, u the trophy, lv my tier's level; left mid-way, no trophy), its day the scene clock's. きろく: the trophy shelf (each weekend's best, newest first). **The tent:** its catalogue is NH's converted models (scripts/room-models.ts) and has no trophy, so placing this week's trophy as decor is a follow-up (a converted NH fishing-tourney trophy, then a present-path item). catalog.ts: the `taikai` mode in group `event` (no shelf, not in みんなで's picker). Chunks: TaikaiLobby 1.8 KB, TaikaiPlay 2.0 KB, TaikaiResults 0.9 KB (scripts/kikimimi-budget.ts). e2e kikimimi-taikai (a Saturday 20:00: the banner, a solo run through the wager's confident miss to the trophy, the banner and the shelf showing it; two phones in co-op with B's seeded misses offered and picked, the same deck on both, the same trophy). Screenshots: /tmp/kikimimi-shots/taikai/.
- **U6 (2026-11-07), the first run and みみ チェック:** a player's first open on a phone with no games yet (`DEVICE.kikiOnboarded` unset for them) shows `onboarding/Welcome.svelte` in the hub's place (no ⚙): step 1 しずえ's hello and three points (1にち 3ぷんから · ふたりで いっしょに · まず みみ チェック（3ぷん）), [あとで] / [はじめる]; step 2 the sound check (🔊 きこえる？, the volume-0 line); [みみ チェックへ] starts the check (step 3) at once. Either way the welcome is marked seen; あとで lands on the hub, which shows a quiet 👂 みみ チェック card (above the tiles, a paper button, never the green one) for anyone without a check row, so players from before it are offered it too (no welcome for them). The check is the `check` GameDef (`kikimimi/games/check/`, framework §7 #11): solo, nothing on the wire, rounds dealt one at a time through the new `GameDef.next` (the round session asks at `go` and at each round's reveal; `Game.adapted` guards it). It starts at かわ (B1+), goes up a band after 2 right and down after 1 wrong, and stops after two reversals (at least 8 items) or at 12. The skills take turns (すうじ, つながる おと, へんじ・ほんね, にた おと, one gist), and items come from the places' voiced items numbered as the tournament's (`TAIKAI_IDS`), with the neighbouring levels loaded as the walk moves. Play shows a progress bar (no score), and the reveal hides the +100. The result, `onboarding/Placed.svelte`, says 「もりから はじめましょう！」 on the five-place strip with とくい / これから chips, 「🔒 この けっかは あなただけに みえます。」 and [ききみみへ]. It's kept as a `listen` row `{gm: 'check', lv: <placed level>, u: <a digit a skill, x unsampled>}`, which the relay accepts as is. **おまかせ:** `catalog.ts omakaseLv` is the latest check's level, else きろく's comfortable level, else はまべ 2. It drives the hub's today quiz, しまの みち's soft stages and ひとこと クイズ's ばしょ row (the 「おまかせ」 pill and its hint; a tap is an override kept per mode in `DEVICE.kikiStage`, and 「おまかせに もどす」 clears it). せってい: 「みみ チェックを もういちど」 with 「いまの ばしょ：もり ★★★」 under it. e2e `kikimimi-check` (the guest's first run through a もり listener's check to the result, the row, おまかせ / override / reset, せってい's redo; あとで → the card, no second welcome). The other specs open past the welcome (`e2e/fixtures.ts`: `kikiFirstRun` off by default). Budget: Welcome 1.3 KB, Placed 1.1 KB. Screenshots: /tmp/kikimimi-shots/check/ (welcome, sound, check-q, check-reveal, placed, mode-omakase, mode-override, settings, hub-later).
- **U7 (2026-11-07), しまの みち's polish:** the path reads the placement: with a みみ チェック every stage above the placed one is soft (path.ts `pathOf({placed})`; before one, the old rule: more than a step above my level) and the placed stage's head says 「ここから」 (`Path.here`). Each stage folds under a head button (its name, ★, 「ここから」, the landmark, a stamps bar and ✓ k / n); open by default: the current unit's stage (`Path.open`), the placed one, a stage with a celebration, every stage a filter shows; hand toggles are kept while a page or a lesson is over the path. Opening the path scrolls smoothly to the current stop (at once under reduced motion; a waiting celebration first); back from a stop's page, a lesson or the ずかん it's where it was. A stop with both stamps adds 「ふたりで スタンプ！」 under its dots. **Villager letters:** a unit's YAML may carry `letter: {en, ja}` (40-60 words of American English using one of its phrases; units.ts checks it), compiled into one chunk `parts/letters.json` (2.5 KB gz, pool.ts `loadLetters`); `kikimimi/letters.ts lettersOf(units, states, texts)` (pure) lists mine, newest first: one per unit I stamped (solo or co-op), never for the partner's stamp alone. `path/VillagerLetter.svelte` is the letter (an envelope row that opens in place; 「Dear {me},」, the English, the villager's name; 「にほんごやく」 shows the gloss); it arrives open on the results of the チェック that first stamped the unit (`UnitState.stampedIn`), sits folded under the stamps on the unit's page, and `path/LetterShelf.svelte` lists them in ずかん › スタンプ (zukan/Stamps.svelte, under the can-do stamps). Text only, no audio, no gift yet (the furniture piece via presents is a follow-up). The 7 wave-1 letters are written. **Landmarks:** a stage whose units are all stamped by me is cleared (`landmarksOf`, `StageRow.cleared`: the placement never clears one, nor the partner's stamps; はまべ has no units, so none yet): its head carries the landmark (📻 はまべ ラジカセ, 🛶 かわ いかだ, 🏮 もり ツリーハウスの ランプ, 🔭 やま てんぼうだい, 🌌 ほし てんたいぼうえんきょう) and the first time a celebration card in the stage (「かわを クリア！ いかだが できました」, やったね; seen once per player on the phone: `DEVICE.kikiLandmarks`). Cosmetic: no economy; the tent item is a follow-up. Tests: path.test (the placement's soft stages, here and open; landmarks incl. placement and partner not counting), lesson.test (the letter with the stamp), units.test (the letter's checks and chunk); e2e kikimimi-path (tr-hotel stamped: the letter on the results, the unit page, ずかん; seeded rows placed at かわ with its four units stamped: 「ここから」, the celebration once, the badge, the scroll). Screenshots: /tmp/kikimimi-shots/path/ (results-letter, results-letter-ja, unit-letter, zukan-letters, landmark, placed, path-open).

---

## 1. Decisions and the conflicts they settle

| Question | IA (UX) | Game team | Copy team | **Decision** |
|---|---|---|---|---|
| The feature's name | 「ききみみ」 | — | 「ききみみ」; the old quiz becomes a mode | **「ききみみ」** everywhere (the pill, the sheet, the invite). The HUD pill reads 「ききみみ」 with a small 「えいご」 sub-label. The old quiz is the mode **「ひとこと クイズ」** |
| Home structure | hub + push/pop stack, no tab bar | 4 bottom tabs: きょう · みち · ずかん · きろく | 4 tabs: きょう · あそぶ · ずかん · きろく | **Hub + one push/pop stack.** The root is きょう. Under the menu, a row of **four entry tiles**: あそぶ · みんなで · ずかん · きろく. No tab bar (§2) |
| Where the path lives | — | its own tab, みち | — | **「しまの みち」 is pushed** from the top of あそぶ and from the menu's きょうの いっぽ card. It's where lessons come from, not a fifth destination |
| The stage ladder | open | §3 names | §3 names, label 「ばしょ」 | **はまべ → かわ → もり → やま → ほし**, labelled 「ばしょ」 (§4) |
| Mode grouping | 3 shelves by length/kind | ささっと / じっくり / ゆったり | 5 groups by situation | **4 groups by situation**: さくっと · まちで・でんわで · じっくり · ねる まえに. Co-op-only modes sit in the みんなで picker, the tournament in きょう |
| Shelves | horizontal 96×112 tiles | — | — | **A 2-column grid per group, scrolling vertically.** At 393 px, horizontal shelves hide two thirds of each group and are hard to scan with VoiceOver |
| おさらい | the today card only | menu card 1 | in さくっと | **Both**: menu card 1 every day, and a tile in さくっと. Users shouldn't have to hunt for review |
| アナウンス | a pack inside the quiz | — | a mode | **A mode** (today's `lv` 5 becomes this mode, not a stage) |
| よみきき サンド | an action on review rows | — | a reveal button | **A button on every review row**: 「よんでから もういちど」 |
| Daily rhythm | one today card | 3 menu cards | one soft goal | **3 menu cards** (§6). Any one card means 「きょうは OK」 |
| Rewards | stamps, ずかん | かいがら, capped | stamps, no XP | **かいがら with a daily cap, never ベル** (§7) |
| Streak | none | weekly days | a stamp card | **A weekly stamp card.** No streak, ever |
| たいせん | shown only when `modes.vs` | opt-in | 「きょうりょく ／ しょうぶ」 | **A two-way switch 「きょうりょく ／ しょうぶ」, defaulting to きょうりょく**, shown only for games that support しょうぶ |
| 「おなじへや」 | settings default + lobby | — | 「おとを 1だいに まとめる」 | **「おとを 1だいに まとめる」**, sub-label 「おなじ へやで ハモらない ように」; a lobby toggle with its default in settings |
| しずえ's voice | — | — | polite | **です／ます** (「おみごとです！」, 「おつかれさまでした！」). Casual cheers belong to the villagers |
| Kanji | — | — | rule set | UI chrome and speech: **kana with spaces**. Translations, notes and glosses: **normal kanji-kana** at every stage |

**Ruled out:** hearts or lives, XP, leagues, rankings outside しょうぶ, streak counters or freezes, missed-day counts, push notifications and nagging copy (「さみしかった」), and payouts per correct answer.

## 2. Why hub tiles, not a tab bar

The sheet is a full-height bottom sheet (`Sheet` variant `pop`), 393 px wide, about 780 px of usable height on an iPhone 15/16.

1. **The foot is already taken.** Mode detail, the lobby, the game frame and results each need a sticky action row at the bottom (はじめる, つぎへ, おわる / もういっかい). A tab bar would either stack under it (about 140 px of chrome out of 780) or vanish on push, and a bar that comes and goes reads as broken.
2. **The use isn't balanced.** Most opens are "do today's thing" (one green button). ずかん and きろく are weekly visits. Tabs promise four equal places and spend permanent chrome on the rare ones.
3. **One back model.** Tabs with a push stack mean one stack per tab, and ‹ becomes ambiguous ("back to which tab?"). The app's sheets already use one stack (SettingsSheet `stack`), and the invite deep link is simple with one: `[hub, lobby]`.
4. **Reach and size.** The four tiles sit mid-sheet, in the thumb's arc, at 84×92 px each (art, name, a live line such as 「うめが いるよ」 or 「かわ ★★」), so they say more than a tab label could.
5. **The cost is small.** Every place is one tap from the root. From deep pages it's ‹ then a tile, and ✕ / おわる always lands on the hub.

## 3. Naming: old → new

| Today | New | Note |
|---|---|---|
| pill 「えいご ききとり」 | 「ききみみ」 with the sub-label 「えいご」 | while an invite waits, the sub-label becomes 「さそわれています！」 |
| sheet title 「ききみみ クイズ」 | 「ききみみ」 at the root; the page's name on pushes; the mode's name in a game | |
| 「ききとりクイズに さそっています」 | 「{name}が ききみみに さそっています」 + the mode on the second line | |
| ききみみ クイズ (the game) | **ひとこと クイズ** | subtitle 「ひとことを きいて えらぶ」 |
| レベル | **ばしょ** | never やさしい / むずかしい |
| ★ はまべ / ★★ いりえ / ★★★ かわぐち / ★★★★ かわ・もり | はまべ (1, 2) / かわ / もり (§4) | いりえ, かわぐち and かわ・もり are dropped |
| L5 (the アナウンス mix) | the mode **アナウンス** | 「えき・くうこう・るすでん」 |
| にがて れんしゅう | **おさらい** | にがて stays only as a private word in きろく |
| 「つぎは これを れんしゅう しよう」 (きろく) | the menu's cards | |
| 「おなじ へやで あそぶ」 | **「おとを 1だいに まとめる」** | |
| 「たいせん」 | **「きょうりょく ／ しょうぶ」** | しょうぶ sub-label 「ばしょに あわせて てんすう」 |
| ひとりで はじめる / みんなを さそう | **はじめる** (primary) / **さそう** (second) | |
| やめる？ | **「ここで やめる？」** + 「ここまでの きろくは のこります」 | |
| 「せいかい！ +100」 / 「いっぱつ せいかい！ +30」 | 「せいかい！」 + a **いっぱつ** badge (no number) | the user's decision 2026-11-06 |
| 「1いは …さん！」, 「1040てん」 (co-op) | co-op: 「ふたりで 7 / 8 です。」; ranks only in しょうぶ | |
| 「8もん中 6もん」 | 「じぶんは 6 / 8」 | |
| 「ホストが …」 | 「{name}が おわりに しました」 / 「{name}との つながりが きれました」 / 「しばらく うごきが なかったので おわりました」 | |
| skill labels にた ぼいん / にた しいん / だいじな ところ / うけこたえ | **ship と sheep / b・v・th / こまかい じょうほう / へんじ** | L と R, つながる おと, すうじ, ほんね stay. One list for the bars and the trip chips |
| たんしゅくけい / しょうりゃく (chips) | 「I'd / I'll」 / 「はぶかれる ことば」 | |
| 1かいで せいかい | いっぱつ | |
| placement test | **みみ チェック** | |
| ふたりで ジグソー / ディクトグロス | **はんぶんこ** / **ふたりで タイル** | |
| トーン あて / かいぎの ぎじろく / フータ／ラジオ | **きもち あて / かいぎ メモ / フータの おはなし** | |

Words never used in the UI: べんきょう, テスト, しけん, レッスン (except the path's lesson labels, which read 「レッスン 2「おと」」 for now; open question 5), ノルマ, ミス, やさしい / むずかしい.

## 4. One ladder: ばしょ

| Stage | ★ | CEFR (private, under くわしく) | Today's content | Note |
|---|---|---|---|---|
| **S0 はまべ** | ★ | A2–B1 | **L1 → はまべ 1, L2 → はまべ 2** | two sub-steps, shown as two dots under the name; one stage to the user |
| **S1 かわ** | ★★ | B1+ | **L3** | |
| **S2 もり** | ★★★ | B2 | **L4** (today's かわ・もり bank) | the L4 bank is S1/S2 material (curriculum §3); it lives at もり because its `mean` / dialogue items are its core |
| **S3 やま** | ★★★★ | B2+ | none yet | greyed in pickers until a unit ships; the path shows it in mist |
| **S4 ほし** | ★★★★★ | C1 | none yet | as やま |
| — | | | **L5 → the アナウンス mode** | a mode with its own ばしょ (its PA/voicemail items keep their S1/S2 tags) |

- **The contract keeps `lv` 1–5** (the wire and the `listen` row). The mapping is a UI table in `catalog.ts` (`stageOfLv`), so no relay change. Rows written with `lv` 5 count toward アナウンス, not a stage.
- **The comfortable stage** (progress.ts, as built: below L2.5 S0, below L3.5 S1, below L4.5 S2, else S3) now prints 「いまの ばしょ：かわ ★★」, and the next step 「つぎは もり が ちょうど いい ころ」.
- **おまかせ** is every mode's default: the stage its skill suggests. An override is kept per mode (`DEVICE.kikiStage[gm]`).

## 5. IA and navigation

```
pill ─▶ sheet 「ききみみ」
hub (きょう) ─┬─ ⚙ せってい
              ├─ menu card ───────────────▶ [game frame] ─▶ results
              ├─ あそぶ ─┬─ しまの みち ─ unit ─▶ [frame]
              │          └─ mode detail ─┬─▶ [frame] ─▶ results
              │                          └─ みんなで (game preselected)
              ├─ みんなで (lobby) ─▶ [frame on every phone] ─▶ results
              ├─ ずかん ─ entry
              ├─ きろく ─ skill / past game (ReviewList)
              └─ たいかい banner (Fri 18:00 – Mon 05:00) ─▶ mode detail
first open: welcome ─ sound check ─ みみ チェック ─ result ─▶ hub
```

**Rules**
- **One stack** (`nav.svelte.ts`, SettingsSheet's pattern): ‹ pops one level, scroll is restored on pop, and focus returns to the row that pushed. Pages are at most three deep.
- **✕ closes the sheet from any page.** If others have joined my lobby, it asks first: 「みんなの へやが なくなります」.
- **In a game** (countdown → reveal) there is no ‹. ✕ asks 「ここで やめる？」. A backdrop tap or Esc does nothing.
- **Results:** おわる pops to the hub (it doesn't close). もういっかい restarts the same mode (and re-invites in a shared game).
- **Backdrop tap / Esc** pops when the stack is deeper than the hub and closes at the hub.
- **Deep links** build a full stack: the invite banner gives `[hub, lobby]`; the たいかい banner gives `[hub, mode(taikai)]`. ‹ always lands on the hub.
- **The night:** StoryFrame is a game page (no ‹). Its sleep timer ends it, and the sheet then closes itself (fading out over 2 s).
- **The invite** is a card at the top of the hub (and the banner on the island, as built). さんか pushes the lobby, joined.

## 6. Screens

The prototype's screens, in order. Sizes are the app's tokens: cards `--r-card` 24, buttons 16, taps ≥ 44 px, the 4 px lip, cream cards on the tan panel.

### 6.1 Hub (きょう)

```
┌───────────────────────────────────────────┐
│ (⚙)            ききみみ               (✕) │
├───────────────────────────────────────────┤
│ ┌ invite (only while one waits) ────────┐ │
│ │ (うめ) うめが さそっています  [さんか]│ │
│ └───────────────────────────────────────┘ │
│ (しずえ) こんばんは！ きょうの メニューです。│
│ ┌ すみ  おさらい · 6もん          🐚+20 ┐ │  done: folded
│ ┌ (ジュン) きょうの いっぽ · かわ ③      ┐ │  green-edged: the next one
│ │ カフェで ちゅうもん                    │ │
│ │ レッスン 2「おと」· 6ふん   [つづける] │ │  the only primary
│ ┌ (マスター) きまぐれ                    ┐ │
│ │ すうじ ラッシュ · 3ふん          🐚+20 │ │
│ 1つで きょうは OK。のこりは おまけです  🐚20/80│
│ [あそぶ] [みんなで] [ずかん(2)] [きろく]   │  4 entry tiles, 84×92
│ ┌ しずえの しゅうまつ たいかい   › ┐ yuzu │  Fri 18:00 – Mon 05:00
│ ┌ こんしゅう きいた ひ        3 / 5 にち ┐ │
│ │ (月)(火)(水)(木)[金](土)(日)            │ │
│ │ ふたりの クエスト  ふたりで 42 / 60 ぷん│ │
│ │ ━━━━━━━━━━━━░░░░░  🎁                 │ │
└───────────────────────────────────────────┘
```

- **しずえ's line** changes with the time and state: 「おはようございます！」 / 「こんばんは！」; after the menu 「きょうは ここまでで じゅうぶんです！」; after a gap 「おかえりなさい！」 (never a count of missed days).
- **The menu** (`today.ts`, pure, §7.1) shows three cards. A done card folds to a stamp and a line. The first undone card has the only green button. Each undone card shows its かいがら.
- **The entry tiles** carry one live line: あそぶ 「14の ゲーム」, みんなで 「うめが いるよ」 (presence) or 「ひとりでも OK」, ずかん 「ことば 28」 + a coral count of new entries, きろく 「かわ ★★」.
- **The week card** is the stamp card and, for members, the couple quest. The guest sees its own solo quest (§7.4).

### 6.2 あそぶ

```
┌───────────────────────────────────────────┐
│ (‹)              あそぶ               (✕) │
├───────────────────────────────────────────┤
│ ┌ (ジュン) しまの みち            › ┐     │
│ │ かわ ★★ · ユニット 3 / 10  ●●◉○○○ │     │
│ さくっと  3ぷんで できる                   │
│ ┌ ひとこと クイズ ┐ ┌ スピード はしご ┐   │  2-col tiles: art, name,
│ │ ひとことを きいて│ │ ゆっくり → はやい│   │  one-line subtitle,
│ │ えらぶ  4ふん 👥 │ │ 3ふん 👥         │   │  mins, 👥 if shareable
│ ┌ すうじ ラッシュ ✨┐ ┌ おさらい        ┐   │
│ まちで・でんわで  ばめんで きく            │
│ [ようじ でんわ] [アナウンス] [たちぎき] [かいぎ メモ]
│ じっくり  ながめに きく                    │
│ [しずえの ニュース] [フータの おはなし] [ジョニーの たび]
│ ねる まえに  てんすう なし                 │
│ ┌ (ジョニー) おやすみ ものがたり     › ┐  │  night-tinted icon
└───────────────────────────────────────────┘
```

| Group | Modes (as they ship) |
|---|---|
| **さくっと**（3ぷんで できる） | ひとこと クイズ, スピード はしご, すうじ ラッシュ, おさらい, ことば タイル, きもち あて |
| **まちで・でんわで**（ばめんで きく） | ようじ でんわ, アナウンス, たちぎき, かいぎ メモ, ざつだん パーティ, うわさの でんごん, めいたんてい フータ |
| **じっくり**（ながめに きく） | しずえの ニュース, フータの おはなし (long-form), ジョニーの たび (serial) |
| **ねる まえに**（てんすう なし） | おやすみ ものがたり |
| みんなで picker only | はんぶんこ (jigsaw), ふたりで タイル (dictogloss) |
| きょう only | しずえの しゅうまつ たいかい (Fri 18:00 – Mon 05:00), みみ チェック (first run; again from ⚙) |

- **Only playable modes show** (a game's gate, as `LEVELS` works today). There's never a 「もうすぐ」 wall. An empty group is hidden.
- **At most one ✨ 「あたらしい」 pill** at a time: the newest mode until it's been played once.
- **No filter UI.** At 18 modes, four labelled groups are faster than filters.

### 6.3 しまの みち (the island path) — built (U4, 2026-11-06)

```
│ (‹)            しまの みち             (✕) │
│ (しずえ) すきな ところから どうぞ。1かい 2ぷんで おわります。│
│ ┌ おさらい チェック 「…」30にち たったよ   [あそぶ] ┐ │  only when a recheck is due
│ [ぜんぶ][👥 ともだち][✈️ たび][💼 しごと][🎉 …] →   │  chips, one row, scrolls sideways
│ はまべ ★                                          │
│        ┌ (しずえ) はまべ 1・2 · ひとこと クイズ  › ┐ │  the quick quiz at はまべ (no units)
│ かわ ★★                              ✓ 0 / 4     │
│  はじめに おすすめ                                 │  the anchors (glue) first
│ ┌(💬 マスター) ききかえす      [つづける] ┐          │  current: green edge
│ │ マスター · きほん  ◉○○ ☆☆             │          │  3 core dots (next ringed yuzu) + 2 extras
│        ┌(💬 キャラメル) でんわを おえる  › ┐        │  zig-zag
│ もり ★★★  すこし はやいかも。でも あそべます ✓ 1 / 4│  soft: striped, still tappable
│ ┌(✈️ ナタリー ✓) ホテルで こまった ○○● › ┐          │  ✓ my stamp; ✓✓ both; outline ✓ the partner's
│ やま ★★★★  ░ まだ きりの なか。みちが できるのを まってね ░ │  no units yet: mist
│ [📖 ことば ずかん                        ›]       │
```

- **Where it lives:** until the hub is built, the lobby's first card (`path/PathCard.svelte`: the current unit's host, its domain icon, name and dots, ›) pushes it. The sheet keeps one stack over my lobby (`KikimimiSheet` `pages`: `path › unit(id)`, and `zukan(unit?)`); ‹ pops one, ✕ closes the sheet, the stack is cleared on close. A lesson's intro card and its game sit over the stack; ‹ on the intro card goes back to the page; the lesson's おわる comes back to the page it was started from. The `?units` test list is gone.
- **The model** is `kikimimi/path.ts` (pure, path.test): `pathOf({units, states, level, played, filter})`. Stages in STAGES' order; in a stage the anchors (`glue`) first under 「はじめに おすすめ」, then the index's file order. **The current unit** is the last one I played a lesson of that isn't stamped, else the first unstamped unit from my comfortable stage up, else the first unstamped one anywhere. `nextLesson`: the first core lesson not played to the end; the チェック until stamped; stamped, an extra not played, else the チェック again.
- **Domains** are tags (`DOMAINS`: an emoji icon on a badge over the host's face and a theme-token tint behind it). The chips are ぜんぶ plus the domains the units carry. A filter collapses other domains' stops to a dot so the stage keeps its shape; the anchors stay under every filter (they're reused across domains), and a unit's `also` counts.
- **The stage gate:** every stage stays playable. A stage more than a step above my comfortable level (きろく's; はまべ 2's before any data) is shown softly (striped, 「すこし はやいかも。でも あそべます」), never locked. Once みみ チェック is taken, every stage above the placed one is soft and the placed one says 「ここから」 (progress.svelte.ts `currentPath`; U7). A stage with no units is mist. Stages fold; the current unit's opens by default; a stage cleared unit by unit carries its landmark (U7).
- **Drafts:** a unit with `status: draft` (not voiced: no clips) shows only with the dev hooks on (a dev build or `?demo`), so the phones see wave 1 once it's voiced.
- **「つづける」** on the current stop opens its next lesson's intro card at once; a tap anywhere else on a stop opens the unit's page.
- **Couple view:** the double stamp (✓ ✓, fanned) from the partner's summary bit; the partner's stamp alone is an outlined ✓. Never their answers.
- **Hub card 1** (the 30-day おさらい チェック, `rechecksDue`) is, until the hub, a yuzu banner on top of the path with its own あそぶ (a solo recheck, `recheck: true`).
- Its own chunk (`{#await import()}`), as are the unit page and the ずかん; `scripts/kikimimi-budget.ts` fails the build over 15 KB gzipped each (≈ 3 KB as built).

### 6.3b A unit's page — built (U4)

```
│ (‹)          ホテルで こまった          (✕) │
│ [ scene backdrop (or the domain's tint), the host standing, ナタリー tag ] ✈️ たび │
│ できるように なること                        │
│ ホテルの もんだいを ききとれる               │  the can-do's one line (cando.short), large
│ ▸ くわしく                                   │  folds 「ホテルの スタッフが … わかる」, the template's sentence
│ ( ○ じぶん ) ( ○ うめ )  チェックで いっぱつ 5もん せいかい → スタンプ │  🏅 when stamped; ふたりで スタンプ！
│ ┌ (1) であい  かいわを まるごと · 6もん・2ぷん  [あそぶ] ┐ │  the next: green edge, the only green
│ ┌ (2) ばめん  いろんな こえ・へんじ · 6もん・2ぷん       ┐ │
│ ┌ (3) チェック でんわの ようじ · 6もん・2ぷん            ┐ │  ✓ once played to the end
│ おまけ（スタンプには ひつようなし）  [☆ おと] [☆ じっせん] │  only the extras the unit has
│ ┌ フレーズ つかまえた 0 / 8          ›  [the room is ready] … ┐ │  → ずかん on this unit
│ [              とばして チェック              ]  │  until the チェック is next or it's stamped
```

- The can-do: its one line (`cando.short`, ≤ 25 characters) is the page's headline; the template's full sentence is folded under 「くわしく」 (a draft with no one line shows the sentence as before). The lesson intro card's 「できるように なること」 shows the one line too, and a path stop's subtitle is the one line instead of host · domain (the face and the domain badge already say those).
- `path/UnitPage.svelte` loads the unit's chunk (pool.ts `load` / `unitPart`); the lessons shown are those with playable items (`playIds`). My tally under the stamp line (stamps.ts). Co-op: the host opens it from a shared lobby's card (framework 8c).

### 6.4 Mode detail

```
│ (‹)          ひとこと クイズ           (✕) │
│ [ scene backdrop with the cast           ] │  150 px, art/scene/*
│ ひとことを きいて えらぶ                    │
│ しまの みんなの ひとこと。きこえた ことば、│
│ へんじ、ほんねを えらびます。               │
│ (8もん) (4ふん) (👥 ふたりで できる)        │
│ ┌ ばしょ                       (おまかせ) ┐ │
│ │ [★ はまべ ••][★★ かわ][★★★ もり][やま][ほし] │  radiogroup; やま/ほし off
│ │ いまの あなたに ちょうど いい ばしょ です。 │
│ ┌ このごろ (じぶんだけ)        ○ ○ × ○ ○ ┐ │
│ [さそう]  [        はじめる         ]       │  sticky foot
```

- **The stage row** is the StagePicker inline: five places with ★, the selected one yuzu, the empty ones sunk (`--ctl-off`, `aria-disabled`). Tapping a place sets an override and the pill turns into 「おまかせに もどす」. はまべ shows its two sub-steps as dots; tapping はまべ again toggles 1 ↔ 2.
- **No unit picker here** (U4): units live on the path and in the lobby's しまの みち card.
- **The volume check** shows inline here only when the volume is 0 or before the day's first game: 「おとが 0 です。せってい で あげてね」 with 🔊.
- **The たいかい's detail** has the wager explained in one line and, when the partner is on the island, the primary is 「みんなで」.

### 6.5 みんなで (lobby)

```
│ (‹)              みんなで              (✕) │
│ あそぶ ゲーム                               │
│ [ひとこと クイズ✓][はしご][すうじ][はんぶんこ][かいぎ] → │  scrolls; co-op-only included
│ さんかする ひと                             │
│ ┌ (ウェイ✓) さんか (うめ✓) さんか (？) おきゃくさん しまに いない ┐ │
│ ばしょは ひとりずつ ちょうど いい ところに あわせます。│
│ ┌ [ きょうりょく ][ しょうぶ ]                 ┐ │  Segmented, default きょうりょく
│ │ ふたりで ひとつの スコア。だれが まちがえたかは でません。│
│ ┌ おとを 1だいに まとめる                [○  ]┐ │
│ │ おなじ へやで ハモらない ように               │ │
│ [          はじめる（2にん）              ]  │  before さそう: [さそう]
```

- **Getting here:** the hub tile, a mode's さそう (the game preselected) or an invite (joined; controls read-only, foot 「ウェイが はじめるのを まっています」).
- **しまの みち** (U4, the UX review's sketch D): until the hub, the lobby's first card is the path's (the current unit and its dots). The host picks a unit and a lesson there, in a shared lobby for everyone (co-op lessons, framework 8c: the others see its intro card with the players and 「…が はじめるのを まっています」; a チェック's card adds the team's way to the stamp). An invite of content this build hasn't (its `cv`) shows 「アプリを こうしんしてね」 with こうしんする instead of さんか.
- **きょうりょく／しょうぶ** shows only when the picked game has `modes.vs`. Each phone's tier is its own (`join.tr`) and never shown next to anyone else's.
- **Alone:** 「ひとりでも はじめられます」 under the people card; さそう still works.
- **Leaving:** ✕ with others joined asks first. When the host leaves, the notice shows and ‹ goes to the hub.

### 6.6 In-game frame (RoundFrame / RevealFrame)

```
question                                  reveal
│ (ウェイ)(うめ✓)  ひとこと クイズ  (✕) │  │ (ウェイ)(うめ)  ひとこと クイズ  (✕) │
│                  ●●▬○○○○○            │  │                 ●●▬○○○○○             │
│ ┌ scene: カフェ ─────────────────┐   │  │        ◯ せいかい！                   │
│ │ (ジュン) ♪… ━━━━━░░░            │   │  │  [★ いっぱつ] (2にん せいかい！)      │
│ [🔁 もういちど] [🐢]                  │  │ ┌ No worries, I'm not in a rush. ◯ ┐  │
│ なんて こたえる？                     │  │ (ジュン) Sorry, the oat latte's gonna │
│ [ No worries, I'm not in a rush. ]    │  │   be a few more minutes. That OK?     │
│ [ Sure, I'll have it here.       ]    │  │   すみません、オーツラテはもう少し…   │
│ [ Yes, it's on the house.        ]    │  │ [メモ] gonna = going to。「待てますか」…│
│ ━━━━━━━━━━━━░░░ (time)               │  │ (しずえ) おみごとです！                │
│                                       │  │ [            つぎへ             ]     │
```

- **The bar:** the players' chips at the left (✓ when answered), the mode's name with the round dots (the current one a yuzu pill) in the middle, ✕ at the right. The old 「3 / 4」 title goes.
- **The frame owns** the countdown, the bar, the replay row (🔁 / 🐢, listenOnly on おとを 1だいに), the timer, the foot and ✕. A game supplies the Stage, Input and Reveal slots (framework §5).
- **The reveal:** ○ / × with 「せいかい！」 or 「こたえは ○○ でした」 (「おしい！」 only for a near-miss pick); the いっぱつ badge without a number; 「2にん せいかい！」 in co-op, never who; the Japanese and the note in normal kanji-kana; しずえ's polite word (「おみごとです！」, 「だいじょうぶですよ、つぎに いきましょう」).

### 6.7 Results

```
│                  けっか                (✕) │
│ (しずえ) おつかれさまでした！ ふたりで 7 / 8 です。│
│          じぶんは 6 / 8 · いっぱつ 4          │
│ ┌ きょうの ごほうび ──────────────────────┐ │
│ │ 🐚 +20 かいがら    │ 金 スタンプ          │ │
│ │    きょう 40 / 80  │    4 / 5 にち        │ │
│ │ 🎁 ふたりで +4ぷん │ (フータ) ことば +2   │ │
│ │    クエスト 46 / 60│    ずかんへ          │ │
│ │ (ジュン) ジュンと もっと なかよく なりました ♥ │  only at a level-up
│ ┌ つまずいた ところ  (I'd / I'll ×1) (つながる おと) ┐ │
│ ┌ きょうの ひとこと  No worries, I'm not in a rush. ┐ │  mint card
│ ふりかえり                       まちがえた だけ │
│ ┌ × I'd grab a table if I were you.        ┐ │
│ │   私なら席を取っておくよ。 えらんだ: I'll ×  │ │
│ │   (▶︎) (🐢) [よんでから もういちど]          │ │
│ [おわる]  [       もういっかい        ]       │
```

- **The rewards card** shows only what moved: かいがら while under the cap (at the cap: 「きょうの かいがらは ここまで。ずかんと なかよしは まだ ふえます」), the day's stamp the first time, quest minutes (members), new ずかん entries, a friendship level-up.
- **しょうぶ** adds the ranking above the rewards (as built), scored against expectation.
- **A lesson's strip** (U4, the UX review's sketch C): the host's face, the unit's name and its dots; after であい / ばめん a green 「つぎは「ばめん」 ›」 (the next lesson's intro card at once); after a チェック the stamp (🏅 dropping in, two for ふたりで スタンプ！; reduced motion: still) with my own first-listen tally (and the team's in co-op), or 「あと すこし！」. A lesson's おわる goes back to the page it came from; もういっかい deals it again. No かいがら, no letter yet (the villager's letter and gift come with the rewards step).

### 6.8 おやすみ ものがたり (StoryFrame)

```
│        おやすみ ものがたり             (✕) │  night palette (data-tod night)
│        ジョニーの たび · だい 3わ           │
│ ┌ dimmed scene (art/scene/living, 42 %) ☾ ┐ │
│ │             (ジョニー)                   │ │
│ The Lighthouse Keeper's Cat                 │
│ ジョニーが とうだいの ねこの はなしを します │
│ ━━━━━━━━━░░░░░░░░░  4:12 / 9:30            │
│                 ( ⏸ )                       │  92 px
│              おやすみ タイマー               │
│ [10ぷん] [20ぷん] [30ぷん] [ぜんぶ]          │
│ てんすうは ありません。タイマーで しずかに おわります。│
```

- No score, no chips, no review list; it writes a `listen` row with its minutes (no answers) so the minutes count for the week and the quest.
- The timer fades the voice over the last 20 s, then the sheet closes over 2 s. The chapter resumes from its segment next time (つづき).

### 6.9 きろく

```
│ (‹)               きろく               (✕) │
│ ┌ いまの ばしょ  ★★ かわ   3 / 10 ユニット ┐ │
│ │ ━━━━━━░░░░░░░░                          │ │
│ │ 「つながる おと」が のびています。もりまで あと すこし！│
│ │                                 くわしく › │ │  CEFR, TOEIC めやす, tables
│ ┌ こんしゅう        ウィーク スタンプ 18こ ┐ │
│ │ (月)(火)(水)(木)[金](土)(日)             │ │
│ │ じぶん 26ぷん · ふたりで 42ぷん · ぜんぶで 12じかん │
│ とくい・にがて            タップで れんしゅう │
│ ┌ L と R ━━━░░ 38% … ほんね ━━━░░ 47%     ┐ │  8 bars, one list
│ さいきん                                    │
│ ┌ ひとこと クイズ  11/6 · ふたりで 7 / 8  › ┐ │  pushes its ReviewList
```

- A skill row pushes 「{skill}」 with one button, 「れんしゅう」 (おさらい focused on that skill).
- The recommendations move to the menu. The couple line is minutes only, never a level.

### 6.10 ずかん

Segmented: **ことば · こえ · なかま · スタンプ** (four 85-px segments).
- **ことば:** sections by scenario family (みせ, でんわ, たび, しごと…) with a completion bar; 3-column cards. Caught: the phrase, its Japanese, stars. Seen: a silhouette with the scenario icon and 「みせ · 1かい きいた」. New: a coral 「NEW」. An entry pushes: the phrase, the meaning, the trap note, ▶︎ for every clip and voice it was heard in, who said it, the date.
- **こえ:** the cast and accents, caught after 10 items understood from that voice.
- **なかま:** villagers with NH hearts (levels only, never points) and the next reward line; unheard villagers are silhouettes.
- **スタンプ:** unit can-do stamps, shared stamps, week stamps, the いっぱつ badge count, tournament trophies.
- Owner-only. The partner sees only 「ふたりとも しってる: 48」 (in きろく's couple line, later).
- **Built (U5, 2026-11-07), the full ずかん, no かいがら:** `zukan/KikiZukan.svelte` (the hub's ずかん tile, the path's 「ことば ずかん」, a unit page's phrases on that unit; the title 「ずかん」) is a Segmented of four sections, each its own chunk (KikiZukan 2.7 KB, Words 3.3, Voices 1.8, Friends 4.7, Stamps 2.4 KB gz), over `zukan/data.svelte.ts` (the units' chunks, every bedtime chapter's, the levels of my answered items loaded once; a sample clip through packs.ts `voiceClip` → `playVoice`, one at a time; `DEVICE.kikiZukan`: the levels announced, the caught phrases seen). The folds are pure: `kikimimi/zukan.ts` and `kikimimi/friendship.ts` (their tests), week.ts `weekStamps`.
  - **ことば** (`Words`): every unit's key phrases by domain, then each bedtime serial's (🌙), a section's caught count and bar; ぜんぶ / つかまえた / まだ. Caught (srs.ts `phrasesOf`) shows the phrase, its Japanese, its ★ (`phraseBook`: ★ caught, +★ first listens in 2 accents, +★ one on a phone, a PA or in noise) and a coral NEW until seen once; heard, a silhouette with 「Nかい きいた」; never, ？. A story's phrases are seen once its chapter is begun and caught once it's heard to the end (a story has no answers: no ★). The entry: the phrase, the trap, the scene and register (a story's: its chapter), who said it (heads), the last day, and ▶︎ a clip with it (`phraseClip`: one I heard first, a dialogue's line that says it; heard phrases only, never a spoiler). Today's review button stays on top.
  - **こえ** (`Voices`): the 18 cast voices (speech.ts `CAST_IDS`) as cards: the voice's first villager's face, the accent and a one-line kind, the items heard in it and a bar to caught (10 understood: `voicesOf`), unheard a silhouette; a tap plays a sample (`sampleClip`: a clip I heard in it first; with none loaded the levels load once) and opens who speaks with it (cast.ts CAST, else EXPOSURE's accent items).
  - **なかま** (`Friends`): §7.7's points (+2 an item of theirs understood on the first listen, +1 after a replay, a miss nothing; a dialogue counts each villager in it), never shown and never dropping; the villagers I've heard, closest first, with five hearts (the level only) and 「つぎ：てがみ」. A level reached since ずかん last showed it is announced once (a coral card with a heart: `levelUps` over `DEVICE.kikiZukan`). The rewards are cosmetic, because English practice has no present path yet: L1 their greeting on the card (English, by personality), L2 a short letter (English, Japanese a tap away), L3 the でんわ ともだち badge 📞 (the ようじ でんわ calls are later), L4 a silver frame round their face (for the furniture gift), L5 their photo in a gold frame (for the tent's photo). The villagers not met yet are silhouettes (a count and the first 14). Bedtime stories add no friendship (no answers).
  - **スタンプ** (`Stamps`): the units' can-do stamps in the path's order (mine with its day, rotated coral; the double stamp ringed mint with 「ふたりで」; the partner's alone a mint ring and 「{name}は もってる」; a dashed blank), the week stamps (`weekStamps`: weeks that met my target as set now; the 10 / 20 / 30 / 40 gifts wait for the present path), いっぱつ (my first-listen rights, badges at 10 / 50 / 100 / 300 / 1000: `ippatsuOf`), the tournament's trophies (the same shelf as きろく's, mirrored there) and the bedtime chapters heard to the end.
  - Owner-only (my answers, this phone's story progress); the partner's 「ふたりとも しってる」 line in きろく isn't built. The hub tile's live line is still 「ことばを あつめる」 (its count of new entries comes with the hub's next pass). e2e kikimimi-zukan (from the hub over seeded games: the caught phrases and NEW, the entry and its clip, the filters, 18 voices and a sample asked for, a level-up heart said once, the stamp, いっぱつ, the trophy, the chapter). Screenshots: /tmp/kikimimi-shots/zukan/ (words, words-entry, voices, friends, friends-gift, stamps, stamps-more).

### 6.11 せってい (⚙)

🔊 「きこえる？」 with the earphones tip; 「おとを 1だいに まとめる」 default; にほんごやく (いつも / まちがえた とき / みない); こんしゅうの めあて (3 / 5 / 7 にち); ふたりの クエスト (30 / 60 / 90 ぷん, members only, shared setting); 「みみ チェックを もういちど」.

### 6.12 First run

1. **Welcome** (`DEVICE.kikiOnboarded` unset): しずえ standing, 「はじめまして！ ここは えいごの みみを そだてる ところです。」, three points (1にち 3ぷんから · ふたりで いっしょに · まず みみ チェック（3ぷん）), [あとで] / [はじめる]. Step dots 1/3.
2. **The sound check** (🔊, volume 0 warning).
3. **みみ チェック** (about 12 adaptive items, 8 at least, framework §7 #11), ending on the result: 「ちょうど いい ばしょ ★★ かわ」 on the five-place strip, とくい / これから chips, 「🔒 この けっかは あなただけに みえます。」, [ききみみへ].

あとで drops to the hub at はまべ 2 (S0 high). A hub card (not the menu's card 2, as built) offers みみ チェック quietly until it's done. Existing players skip the welcome: their stage comes from their rows (progress.ts), and the menu offers the check once. The guest gets the same flow with its own data.

## 7. Progression and rewards

### 7.1 The daily menu (`today.ts`, pure)

Picked from the Tokyo day (`d`, the same day key as the `listen` rows and the week dots), the report and the SRS fold. Same inputs, same menu, on every phone of mine.

| Card | Content | Length |
|---|---|---|
| 1 **おさらい** | due SRS cards, capped at 8 (「しずえが 6もん えらびました」, never "14 overdue"). None due: the card becomes 「おさらいは ぜんぶ おわり！」 and the slot moves on | ≤ 3 min |
| 2 **きょうの いっぽ** | the next lesson of the current unit on the path. Before units: 「きょうの クイズ」 at your stage. Before みみ チェック: the check | 5–8 min |
| 3 **きまぐれ** | one rotating playable mode, seeded by the day, never the same as yesterday's; after 21:00 JST it becomes **おやすみ ものがたり** | 3–10 min |

- **The tournament** (Fri 18:00 – Mon 05:00 JST) is a banner above the tiles, not a card; playing it fills a card slot like any session.
- **Any one finished session means 「きょうは OK」** and stamps the day. A session that doesn't match a card ticks the first undone card, so free play is never "off menu".
- **After all three:** しずえ says 「きょうは ここまでで じゅうぶんです！」. Free play stays open; it moves ずかん, friendship and the path, but not かいがら.
- **A finished session** = a `listen` row with ≥ 4 answers, or a no-answer mode (story, long-form segments) with `ms` ≥ 3 min.

### 7.2 かいがら (never ベル)

かいがら is the shop's per-person currency (docs/design.md "The shop": NH's Bells ÷ 20; a median piece 110, a sea bass 20, a koi 200). ベル stays the fitness wallet for real treats and trips; English never touches it.

| Source | かいがら | Rule |
|---|---|---|
| A finished session | **20** | the first 3 of a Tokyo day |
| All three in a day | **+20** | with the third |
| **Daily cap** | **80** | nothing per correct answer, nothing past the cap |
| ふたりの クエスト met | **150 each** | + a seasonal item (record player, world map, English-label poster) through the present path |
| The guest's solo quest (30 min) met | **100** | |
| たいかい chips | **none** | 100 chips for the wager round only: a bet of 10–100, a right answer pays it ×2, a wrong one loses it. Round-only, never kept or converted: no かいがら (the user's decision) |
| Unit stamped (チェック ≥ 80 % first play) | **200** | + the host villager's gift: one furniture piece with a short English letter |
| Stage cleared (every unit stamped) | **1,000** | + the landmark: はまべ ラジカセ, かわ いかだ, もり ツリーハウスの ランプ, やま てんぼうだい, ほし てんたいぼうえんきょう |

- **A typical week** (all menus, the quest, one unit): 560 + 150 + 200 ≈ **910**, about nine median pieces. A light week (3 days, one card): 60 + 0–150. The tuning knob is the per-session amount; open question 1.
- **Server-verifiable, no new event.** Income is a pure fold over my own `listen` rows (`contract/kaigara.ts listenIncome(rows)`: per day, the first three finished sessions; units from rows with `u` set and the チェック's first-play rate; the quest from both members' public summaries `{d, g, n, ms}`). `shopLedger` adds it to `shells`, so the record checks a buy against it like any other. The relay deploys first (curriculum §12 rule). Gifts, trophies and landmarks go through the present path (a present's furniture is もようがえ's and never sells).
- **No streak-like payout.** Nothing pays more for consecutive days.

### 7.3 The weekly stamp card (never a streak)

- Each person picks a target of **3, 5 or 7 days** a week (default **3**). A day is stamped by one finished session.
- Hitting the target earns a **week stamp** (ずかん › スタンプ). Week stamps 10 / 20 / 30 / 40 each send a gift; 40 in a year is a big item (the NH-style stamp card).
- What's visible is 「こんしゅう 3 / 5 にち」. It resets each Monday with no loss and no "0 days". A missed week says nothing.

### 7.4 ふたりの クエスト (minutes)

- Monday 00:00 to Sunday 24:00, one shared bar: **minutes heard**, 60 by default (30 / 60 / 90, a shared setting). Minutes, not correct answers, so each person adds the same per minute at any level.
- The bar shows 「ふたりで 42 / 60 ぷん」 and never who added what (it sums both members' `ms` from the public summaries).
- Met: 150 かいがら each + a seasonal item. Missed: nothing is said; the bar just starts again.
- **The guest** has a solo quest (30 min, 100 かいがら), never inside the couple bar.

### 7.5 The island path
**As built (U4):** the stamp needs 5 of 6 right on the first listen in the チェック (curriculum-units §3), retakeable; no かいがら (the user's decision); since U7 a stamp brings the host's letter and a stage cleared unit by unit its landmark (cosmetic; the furniture gifts are a follow-up). Wave 1 is 7 units (かわ 4, もり 3), each a 3-lesson core (~8 min) plus extras.


47 units over five stages (curriculum §13), about 10 per stage, in any order inside an open stage. Unit stamp 200 + a villager gift; stage clear 1,000 + a landmark (§7.2). **Hours heard** is a quiet lifetime meter in きろく; K.K. songs unlock at 1, 5, 10, 25 and 50 hours for the island radio. A stage reached by placement opens without its 1,000 or landmark (open question 2).

### 7.6 ずかん

- **ことば:** みた (heard once: a silhouette) → つかまえた (understood in 3 contexts: the full entry). Stars: ★ caught on a first listen (the いっぱつ badge lives here), ★★ with 2 accents, ★★★ under a condition (phone, PA, noise). About 300–400 chunks; a completed section sends a display case for the tent.
- **こえ:** ≥ 12 cast voices, then the exposure accents; caught after 10 items understood from that voice.
- **スタンプ:** can-do stamps per unit, shared stamps (both stamped), week stamps, the いっぱつ count, trophies (bronze for taking part, silver ≥ 70 % at your tier, gold ≥ 85 %; one per tier per season).
- Needs the content's `Phrase` (curriculum §12) to tag items with chunks; until increment 9 the quiz's `focus` words stand in.

### 7.7 なかよし (friendship that never drops)

- +1 point per item understood from that villager, +2 on a first listen. Points never drop and are never shown; hearts appear at level-ups.
- Levels at **10 / 30 / 70 / 150 / 300**: L1 an English greeting on the island; L2 a letter; L3 they phone you with ようじ でんわ; L4 a furniture gift; L5 their photo for the tent.
- Each person's own. A villager both have at L5 gives a shared photo.
- **As built (U5):** the points and levels as above (friendship.ts, from my answers; a dialogue counts each villager in it); the rewards are cosmetic in ずかん › なかま until the present path carries English gifts: L1 the greeting on their card, L2 a letter, L3 a でんわ ともだち badge, L4 a silver frame, L5 their photo in a gold frame (§6.10). The shared L5 photo isn't built.

## 8. Empty and edge states

| Where | State |
|---|---|
| Hub, first open | the welcome (§6.12) |
| Hub, no data (あとで) | card 2 = みみ チェック; cards 1/3 as normal (おさらい: a starter set) |
| Menu, none due | 「おさらいは ぜんぶ おわり！」 and the slot moves on |
| Menu, all done | three stamps, 「きょうは ここまでで じゅうぶんです！」, tiles as normal |
| Daily cap reached | the cards show 「✓」 without +20; results say the cap line (§6.7) |
| After a gap | 「おかえりなさい！」; the due cap holds (≤ 8), no count of missed days |
| Partner already played | 「うめは もう きいたよ」 on the みんなで tile line, never the score |
| きろく, empty | しずえ 「まだ まっしろ。1かい きくと ここに あしあとが つきます。」 + [あそぶ] (pops to the hub) |
| ずかん, empty | three silhouettes + 「ゲームで みつかります」 |
| A group in あそぶ with no playable mode | hidden |
| Lobby, alone | 「ひとりでも はじめられます」; さそう still works |
| Lobby, host left | 「{name}が おわりに しました」; ‹ to the hub |
| Offline, pack not cached | the tile dimmed with 「オフラインでは まだ」; cached packs play |
| `cv` mismatch | 「アプリを こうしんしてね」 (framework §4.2) |
| Volume 0 | the inline 🔊 row in mode detail and the lobby |
| Night (≥ 21:00) | きまぐれ = おやすみ; StoryFrame in the night palette whatever the island's time |
| Guest | no couple quest (its solo one), no partner lines, its own stage, ずかん and きろく |

## 9. What's removed or merged

| Today | Becomes |
|---|---|
| the あそぶ / きろく tabs | gone: the hub + a pushed きろく |
| the level grid (4 buttons) | the ばしょ row with おまかせ in mode detail |
| 🎯 にがて れんしゅう | おさらい (menu card 1, a さくっと tile, きろく's skill rows) |
| three stacked lobby buttons | mode detail: さそう / はじめる |
| 🔊 in the lobby | せってい, first run, and inline only at volume 0 |
| recommendations in きろく | the menu |
| +100 / +30 いっぱつ pills | 「せいかい！」 + the いっぱつ badge |
| the 「3 / 4」 game title | the mode's name + round dots |
| たいせん always shown | 「きょうりょく ／ しょうぶ」, only for games with `modes.vs` |
| 「けっか はっぴょう」 + ranks in co-op | 「けっか」; ranks only in しょうぶ |
| `DEVICE.kikimimiLv` | `DEVICE.kikiStage[gm]` (migrated: lv 1–2 → はまべ, 3 → かわ, 4 → もり, 5 → アナウンス's override) |

## 10. Components and files

Aligned with the framework's layout (framework §2, §5). New pieces are marked **new**.

```
app/src/lib/kikimimi/
  catalog.ts        new · pure: per GameDef meta {gm, group, mins, coop, vs, night, playable(ctx)}; GROUPS; stageOfLv
  today.ts          new · pure: pickMenu(day, report, srs, units, now) → 3 cards; matchSession(card, row)
  rewards.ts        new · pure: the display side (today's かいがら, quest minutes, week stamps) over the rows
  friendship.ts     built · pure: points and levels per villager from my answers, level-ups, the greeting and letter
  zukan.ts          built · pure: seen / caught / stars per phrase (and a story's), voices, いっぱつ, the stamps
  progress.ts, srs.ts, advice.ts, report.ts   as built (advice feeds today.ts)
app/src/lib/contract/
  kaigara.ts        new · listenIncome(rows) folded by shopLedger (relay first)
app/src/lib/components/kikimimi/
  frame/            framework §5: RoundSheet, RoundFrame, RevealFrame, Results, ReviewList, Lobby (+ GamePicker),
                    PlayerChip, ChoiceGrid, Transcript, scene/*
    nav.svelte.ts   new · the stack: Page = hub | asobu | path | mode(gm) | lobby | record | skill(id) | game(id)
                    | zukan(tab) | entry(id) | settings | welcome | placed; push / pop / reset, scroll + focus restore
    RewardStrip.svelte   new · results' きょうの ごほうび
  hub/              new · Hub, MenuCard, InviteCard, EntryTiles, EventBanner, WeekCard     (the hub chunk)
  asobu/            new · Asobu (groups), ModeTile, PathCard
  mode/             new · ModeDetail, StageRow (StagePicker), UnitPicker
  path/             new · IslandPath, UnitNode                                            (lazy)
  record/           Progress.svelte → Record.svelte + SkillDetail                         (lazy)
  zukan/            built · KikiZukan, Words, Voices, Friends, Stamps (each lazy), data.svelte.ts
  story/            built · StoryFrame (the night frame, sleep timer), StoryList, player.svelte.ts, serials.svelte.ts  (lazy)
  settings/         new · KikiSettings                                                    (lazy)
  onboarding/       new · Welcome, Placed                                                 (lazy)
  KikimimiHost.svelte, invite.svelte.ts   always loaded; the pill label + sub-label
app/src/lib/sync/storage.ts   DEVICE: kikiStage, kikiOnboarded, kikiPrefs {ja, sameRoom, weekGoal}
app/src/lib/i18n/kikimimi.*.json   the strings (§3)
```

- **Budgets:** the hub chunk (nav, catalog, today, hub/*) ≤ 25 KB gz; each game ≤ 15 KB gz; きろく, ずかん, the path, settings, onboarding and StoryFrame are `{#await import()}` chunks; the always-loaded part stays as built (+ the sub-label string).
- **e2e:** keep every `data-kiki-*` hook; add `data-kiki-page` on each page, specs for push/pop and ✕, the invite deep link (`[hub, lobby]`), the menu picks (fixed day seed) and the reward strip.

## 11. Build plan (each step small, shippable and green)

Framework step 8b (`round/`, `RoundSession`, `frame/`) is the hinge: it waits for increments 6 and 7, and it moves Lobby / Play / Results into `frame/`. UX work that edits those files waits for 8b, or lands before 8b starts and is rebased by it.

| Step | When | Work | Tests | Est. |
|---|---|---|---|---|
| **U0** copy pass | now, before 8b starts (strings + small markup) | pill 「ききみみ」 + 「えいご」; titles; invite line; ばしょ names (はまべ 1 / 2, かわ, もり); the いっぱつ badge (no +30, no +100 in co-op); 「ふたりで 7 / 8 です。」; しずえ polite; translations in kanji-kana (bank `ja` at ★1); 「おとを 1だいに まとめる」; 「きょうりょく ／ しょうぶ」 as a Segmented; skill labels; notices without ホスト | i18n key tests; e2e text asserts updated; screenshot pass | 0.5 d |
| **8b** | after 6 and 7 | framework (unchanged plan) | framework §9 | 1.5 d |
| **U1** the stack | after 8b | `nav.svelte.ts` in RoundSheet; Hub v0 (しずえ's line, one card 「きょうの クイズ」 at your stage, the four tiles); あそぶ with the playable modes (ひとこと クイズ, アナウンス, スピード はしご); ModeDetail + StageRow replacing the level grid (`DEVICE.kikiStage` migration); みんなで page = frame/Lobby; きろく pushed (Progress as is); ずかん tile hidden | nav unit tests (push/pop/reset, deep link); catalog tests; e2e: solo from the hub, two players from the invite, ✕ ask | 1.5 d |
| **U2** the menu | after U1 | `today.ts` + MenuCard ×3, done states, 「きょうは OK」, the soft stop; recommendations leave きろく | today.test (seeded days, night swap, none due, session matching); e2e menu flow | 1 d |
| **U3** かいがら | after U2; relay first | `contract/kaigara.ts` + `shopLedger`; RewardStrip; the cap lines; the shop shows the new balance | contract tests (cap, finished-session rule, idempotent per `g`, guest's own); relay tests; ledger round-trip | 1 d |
| **G-たいかい** | after U3 (the user's order) | the tournament game (curriculum §7.1) + the banner + round-only chips (no かいがら) + trophies | per framework | 2–3 d |
| **U4** week + quest + settings | after U3 | WeekCard (stamps, target), the couple quest (summaries), the guest's solo quest, KikiSettings, the volume-0 inline row | rewards.test (Monday reset, guest separation); e2e settings | 1 d |
| **G-おやすみ** + StoryFrame | after U4 | the story game in StoryFrame; つづき; the night card | story timer tests (fake clock); e2e open → timer end closes | 2 d |
| **U5** ずかん v1 (built 2026-11-07, with U8's こえ) | after 9b (Phrase in content) | KikiZukan (ことば, なかま, スタンプ), friendship.ts, zukan.ts; the ずかん tile shows | fold tests; e2e entry push | 1.5 d |
| **U6** first run | with increment 11 (みみ チェック) | Welcome, the sound check, Placed; card 2 offers the check | e2e first open, あとで | 1 d |
| **U7** the path | after 9b/9c (units index) and the first S1 unit packs | IslandPath, UnitNode, とばして チェック; unit and stage rewards, villager gifts via presents | path ordering tests; income tests for units | 1.5 d |
| **U8** こえ ずかん, K.K. songs, polish | later | voices tab, hours meter unlocks | — | 1 d |

Each step keeps main green and is playable: U0 alone already fixes the naming; U1 is the new home with today's content; every later step adds one visible thing.

## 12. Open questions for the user

1. **かいがら amounts.** 80 a day max, ~1,000 in a full week (about nine median furniture pieces). Is that right next to the island's catches, or should a session pay 10 (cap 40)?
2. **Placement windfall.** Should a stage reached by みみ チェック (e.g. はまべ for both of you) pay its 1,000 and landmark, or only stages cleared unit by unit?
3. **Weekly target default.** 3 days (gentlest) or 5?
4. **The 「えいご」 sub-label** on the pill: keep it for good, or drop it after a few weeks as the copy team suggested?
5. **「レッスン」** inside the path's units: the copy team bans the word; keep the five lesson names only (であい, おと, ばめん, じっせん, チェック)?
6. **ジョニーの たび / フータの おはなし:** fine to use Gulliver and Blathers as hosts (both appear in the art set), or keep hosts to island villagers?
