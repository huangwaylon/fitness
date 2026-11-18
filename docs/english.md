# English Study

The leaf menu's 英語 pill opens **English Study**: one real TV clip a day, about 15 minutes. Watch it whole, answer
6–8 questions with replays of the exact segment, read short Japanese notes. Solo; the guest has their own progress.
Code: `app/src/lib/english/` (content, logic, strings in `i18n.ts`, the sheet in `components/`; the progress block one component, so it can change alone).

## Content

A clip (`lib/english/types.ts` Clip) is an official YouTube video and our lesson over it: segments `[from, to]` s,
English questions, Japanese notes (言っていること / 意味 / 迷いやすい点 / 使えるフレーズ) and a one-line `cue` for a
second listen. A question quotes one short line at most (*key words* starred); no audio is ours to ship (the
transcript is, since 2026-11-16: Transcripts).
`clips/index.ts` lists them; one file a clip, each checked by the unit tests.
A question may carry its Japanese: `ja` (the stem, ≤ 60 characters) and `choicesJa` (one a choice, in `choices`' order,
≤ 40 each), trimmed, Japanese, every character in the trimmed font (`clips.test.ts`); without them nothing is shown.

- A question has an `id` (≤ 8 of a-z0-9, never reused: the listen answers' and flags' key), a `skill` (its card
  label: 大意 詳細 数字 誰が 本当の意味 気持ち 一言のねらい 笑いどころ 次の一言 つなぎ言葉 フレーズ 音の聞き分け 書き取り), a `level` (B1/B2/C1), a
  `point` and the points it `reveals`. A bank is 16–24 items; `clips.test.ts` runs the review rubric's mechanical checks
  (a lesson under 16 only the schema, segments, wording, dictations and draws). A bank whose file has the line
  `// A2 REVIEW` (reviewed for the A1–A2 learner, 2026-11-17) has the A2 rules: 12–24 live, gist ≥ 2, L ≥ 4, F ≥ 4
  (phrase ≥ 1, sound + dict ≥ 1), I 2 to 40 %, humor and predict ≤ 1, each skill ≤ 5, C2 0–2; B1 45–65 %, B2 25–45 %,
  C1 ≤ 15 %; a key-length tell with 6 characters of slack; said + mean + trap 60–160 characters; a gist's segment ≤ 45 s;
  3 choices an item (a number 3–4). The others keep the older rules until their review.
- **The draw** (`draw.ts`, pure, seeded by player, clip and play): 6 items under 90 s, 7 under 180 s, else 8. A gist
  first (unseen, a set-up one: starting in the first 40 %), then the best set of the rest (a bounded search): the
  unseen before any repeat, then the group quotas (L I F: n 6 2 1 2, play 2+ 2 2 1; n 7 2 1 3 / 2 2 2; n 8 3 1 3 / 2 2
  3), then ≥ 1 context item (`ctx`: the answer needs two turns) when one fits, then spread (the speech span in n − 1
  parts: the most parts hit, no two segments overlapping by over half), new points first, a B1 opening; always ≤ 1 C1,
  ≤ 1 dictation, humor and predict, one gist, one item a point, nothing that reveals a chosen point; then clip order.
  A play's ids are kept with its place; choices are shuffled per player unless `keep`.
- **The native tier (C2):** 0 or 2–4 items a bank, ≤ 1 a point, skills infer / attitude / pragma / humor / sound /
  dict, notes 90–140 characters, not counted in the B1/B2/C1 shares; a stress item (a C2 `sound`) ships `retired` until
  its ear check (an A2-reviewed bank: 0–2). The draw takes none unless `{ harder: true }` (the ⚙ むずかしめ opt-in),
  then ≤ 1 a play, one while one is unseen.
- Speed: `wpm` is words a minute over speech time from the captions, one measure for every clip
  (`npm run english:wpm -- <captions dir> [--write]`). Bands are the library's thirds by it: ゆっくり, ふつう, 速い =
  the slowest, middle and fastest third (`bandsOf`, rewritten by the script, held by the test).
- Segments: from YouTube's word timings (the same captions; whisper's punctuation for the sentence ends):
  `npm run english:segs -- <captions dir> [--write [left.md]]` finds each item's line and plays it whole, from its
  sentence's start and ≥ 1.5 s before it to its sentence's end and ≥ 1 s after; ≥ 5 s, ≤ 12 s where it can (a gist
  ≤ 45 s, a dictation ≤ 8 s), never shorter than one that held the line already; a line it can't find is left and listed.
- **The plan** (`plan.ts`): one order every phone offers the clips in, so both members meet the same clip most days
  without seeing each other's. A slow ramp by ease (wpm's rank 0.8, the rank of the bank's non-B1 share among live non-C2 items 0.2; a bank
  under 16 the mean; since 2026-11-17, for the A1–A2 learner), a bank with a `// A2 LATE:` line after all the others (as planned: a written place stays till a `--fresh` run),
  with variety: each pick the one of the nearest five that avoids three of a show or a situation in a row and
  keeps the shows near their share. `plan-order.ts` keeps it as written (`npm run english:plan`; `-- --fresh` only
  while nobody is part-way); a clip added since goes after it. Last `--fresh`: 2026-11-17, for the A2 learner. The build orders the index by it.

## Data

`clips/` stays the source. The build makes two things of it (vite.config.ts `english-data`):

- **The index**, in the plan's order (`catalog.ts` ClipMeta: id, video, title, show, length, band, tags, the play's
  size, the clip's version `v` = `hash.ts clipHash`, credit), the module `clips/index.ts?english-index`, in the
  sheet's chunk: home, the library and ⚙ need nothing else. Nothing in the app imports `clips/` itself (`deps.test.ts`).
- **A bank a clip**, `english/c/<id>.<v>.json` (the clip as authored), fetched when its lesson opens; home fetches
  today's ahead while idle. The service worker keeps them (`island-english-v1`, cache first: the name carries the
  version), never precached. A lesson shows its player and watch card at once; its questions say 読み込み中… till the
  bank is in, or 質問を読み込めませんでした / offline with もう一度 (failing again online: a reload into the newer build).
  `load-budget.ts` holds the sheet's chunk to 80 KB gzipped and the banks out of the precache.

## The page

One sheet: two tabs, **ホーム · フレーズ** (the kit's TabBar, on those two only; each opening on ホーム), and the levels
pushed over them, with no tab bar: the library, a clip's lesson (‹ back to where it was opened) and ⚙
(むずかしめの質問を増やす, 報告した内容).

**Back (2026-11-17), as 設定's levels:** every pushed level has ‹ at the NavBar's top left and goes back exactly one
level: ⚙, the library → home; a 場面 → the library; a lesson → where it was opened (home, the library with its chip, or
the 場面); セリフ and この動画のフレーズ → what opened them (ツール, or まとめ). A paper sheet opened from ツール's row
(場面のあらすじ一覧, ⚑ この動画を報告) closes and reopens ツール on its ‹ (as 図鑑's ‹ to 設定); opened from elsewhere (the
あらすじ band, a question's ⚑) it has ✕ only. ✕ is always top right: on English Study's levels it closes the sheet, on a
paper sheet that sheet. No swipe, no in-page 戻る (まとめ's 完了 is the lesson's ‹).

- **Home**, three cards: 今日の動画 (the thumbnail, Friends · band · situation · N問, one button: 始める / 続きから /
  もう一度（新しい質問）), 今週, and ライブラリ, at most five rows: the latest play left part-way, もう一度 (below), the
  next clips in the plan, すべて見る（N本）›. Today's clip is the first in the plan neither finished nor skipped
  (`progress.ts dailyOf`): once it's finished, the card goes on to the next (次の動画 · 今日の分は完了 ✓), and the
  finished one comes back only as もう一度's row;
  別の動画にする shows the next and skips the one passed over for 14 days on this phone. All finished: 全部見ました and
  the one finished longest ago. A member sees the partner's line (finished today, or this week's days); the guest
  sees none.
- **もう一度** (`progress.ts reviewOf`): a finished clip offered again with new questions, a row beside today's clip
  (never in its place), at most once a week: on a week with a study day and no clip finished again yet; a clip
  finished 7+ days ago (28+ once it's had two plays), the one with the most items not met first, then the oldest.
  Its sub line says 新しい質問; ignoring it changes nothing.
- **The library:** one chip row by show (すべて, each show), the clips in order with the part-way first and the
  finished last (✓, 2回), 20 at a time with もっと見る. On すべて, **場面で選ぶ** first (`collections.ts`): a tile a
  situation in two columns (職場, 友だち, 恋愛, 家, お願い・断り, お店 = 店・レストラン + 買い物, 電話, 旅行; a few curated
  ids join; shown with 4+ clips), 「N本 · N本完了 ›」, each a level of its own: its note, its clips, no chips. Each
  situation is reachable one way only (never a chip as well): one row of pills at a time. Not courses: no order,
  nothing locked. Thumbnails are YouTube's stills from i.ytimg.com (CSP img-src,
  no referrer); offline or gone, a paper tile with the show's name.
- **むずかしめの質問を増やす** (off by default, this phone's) lets the native tier into the draw (≤ 1 a play; never without it); a C2 item's card
  carries a むずかしめ tag. Nothing is locked either way.
- **Lesson:** the player stays pinned on top. Watching first is a suggestion: 質問へ and ‹ 前へ / 次へ › always work, a
  question can be left unanswered, and まとめ is always reachable. One primary action a state: ▶ 全部見る on the watch
  card (質問へ paper till the clip has played or ended, green after; never disabled), この部分を聞く (sky, before the
  choices) while answering, 次へ (green) once answered, ▶ もう一度、通して見る at まとめ (完了 paper). A question card's
  meta is 「質問 1/6 · 大意」 (question 1, open: 「聞いてから、合うものを選びましょう。何回聞いてもOK」 under the stem); the stem's `ja` under
  it in grey; a 訳 chip by the meta shows the choices' `choicesJa` before answering (this lesson's; none for a form item:
  marker, phrase, sound), and the reveal shows them under every choice; its ⚑ 報告 a quiet link at its foot. The credit shows on the watch card, at まとめ and in ツール.
- **ツール** (the lesson bar's one labelled button, `StudySheet.svelte`; ‹, the title with an ellipsis, ツール, ✕): 字幕
  オフ / 英語 / 日本語 and 字幕の大きさ (The player), the 場面のあらすじ switch, then 場面のあらすじ一覧, セリフ（全文） (a bank with
  lines only) and この動画のフレーズ (「質問の答えと解説を含みます」), then ⚑ この動画を報告 and the credit.
- **この動画のフレーズ** (ツール's row, never locked, and まとめ's; `phrases.ts`, `ClipPhrases.svelte`): a
  level under the same pinned player, ‹ back to where it was. The bank's quoted lines (every question's `line`, the
  retired too), once each, in time order; lines starting within a second are one moment, a card each: ▶ m:ss plays it,
  then each line (key words underlined), 言っていること, 意味 and the phrase. Only the questions' own short quotes,
  never a transcript.
- **A miss:** the segment plays again by itself, a nudge with the `cue`, the choices as they were, and a quiet 答えを見る.
  A second miss shows 「答えはこれ」. Never red, ×, a sound or a percentage; ◎ first try, ○ second.
- **The reveal:** the result, the line (key words underlined), 意味 and 使えるフレーズ; 言っていること and 迷いやすい点 under
  「くわしく」 (a `<details>`), open by itself after a miss (anything not heard in full the first time), closed on ◎. It
  scrolls up with the answered choice on top, so the ○ and the notes' head are both in view.
- **書き取り:** the words heard are counted (「k/n 語 聞き取れました」; none: 「答えはこれ」, never a 0), the rest shown in the answer colour.
- **まとめ:** 「この動画は完了です」, the scenes worth hearing again (anything not ◎; each row its segment and the line heard there, else the phrase), the clip's phrases, 通して見る. It finishes the clip once
  six questions (all, if fewer) are answered or shown; else it says how many are left and goes to the first.
- Leaving keeps the place on this phone: the clip, the question, the answers. A play whose まとめ was reached is
  finished, even if gone back from it: its next opening draws the next.

## Phrase review

フレーズの復習 (approved 2026-11-17; `phrase-review.ts`, `PhraseReview.svelte`): a card above 今日の動画 on home, only
when phrases are due. The phrases are the `use` of the questions in my finished plays (`listen` rows with `f`) and
those フレーズ's ☆ saved (`k`, the day; never pruned but once its question or clip is retired, un-☆ leaves the rest as it was); each comes back 1, 3, 7, 14,
then every 30 days after it was last met in a play, saved or shown here. At most 3 a day: those shown
before first (the longest overdue first), then the never shown (the latest met first), one per English phrase.

- One at a time: the English, 意味を見る → its Japanese, the clip's line (key words underlined) and the clip's player,
  この場面を聞く playing the question's segment; then もう一回 (tomorrow again) or 覚えた (a step on). These only space
  it: never a score, a percentage, red or ×. 今日はスキップ ends today's (the steps as they were).
- Kept per player on this phone (`island.english.phrases`). Banks it needs are fetched (at most 4); one that doesn't
  load is passed over, and the card never holds up today's clip. Counted: `act:english.phrase.<show | kept | again | skip>`.

## フレーズ

A deck of the library's phrases, one card at a time. **The deck** (`catalog.ts deckOf`, at build time): a question's
`use` makes a card when the question is live, B1, not a gist / humor / who / predict; the `use` has its Japanese in
（…）, ≤ 8 English words, no character's name, and shares a key word with its `line` (the starred words, lower case,
punctuation dropped, a / an / the aside, found as whole words of the English; a common one — pronoun, preposition, be /
do / have, so, just — counts only when it is all the line's key words, as in "*So* what…"); its segment ≤ 15 s. One
card per English phrase (the first in the plan's order). Entry `[clip, qid, from, to, use, line, mean]`; the video and
title from the index. It ships as 12 files, `english/p/<n>.<v>.json`, a card in `fnv(clip/qid) % 12` (each mixes the
whole library; ~2,800 cards, ~28 KB gzipped a file), their versions the index's `DECK`; the service worker keeps them
as the banks (an older version of a file goes), never precached; `load-budget.ts` holds them to 12, each ≤ 32 KB
gzipped.

**The page** (`deck.ts`, `Phrases.svelte`): one card at a time, 5 a set. The order is seeded per player (the shards
in a seeded order, each shard's cards too; each round a new order), the place kept on this phone
(`island.english.deck`), so the tab comes back to the same card, face down. Passed over (back next round): a card of
a clip already in this set, of today's clip and of the next 2 open ones in the plan (their lessons stay fresh).

- Front: the clip's thumbnail beside 1/5 and show · title, the phrase (the key words it shares with the line
  underlined, punctuation outside), **意味を見る**. Back: its Japanese, 動画では + the line (key words underlined) and
  its 意味 (small; it explains the line, so it sits under it), the clip's player (mounted at 意味を見る, so ▶ meets a ready
  frame within the tap; one frame at most, none on the front, gone on 次へ), **▶ この場面を聞く** (its segment, paused at
  its end), 声に出して言ってみよう, then ☆ 復習に入れる (paper; ★ 復習に入れました, tapped again: out) and 次へ ›.
- After the 5th: 「5枚見ました · これまで Nフレーズ」 (cards revealed), もう5枚 / ホームへ. Never a score, %, red or ×.
- A shard that doesn't load: フレーズを読み込めませんでした (offline: its note) with もう一度. Counted:
  `act:english.deck.<show | reveal | play | save | more>`.

## The player

The player drives the youtube-nocookie embed over postMessage (`enablejsapi=1`, `origin=`): the
`listening` handshake, `infoDelivery` for the time and the state, `command` for seekTo / playVideo / pauseVideo. No
`iframe_api` script (it would need a third-party `script-src`). A segment pauses 0.4 s past its end (the time
extrapolated between deliveries, by 1 s at most for the stop: a stall not yet reported never pauses it early). CSP `frame-src https://www.youtube-nocookie.com`; the iframe's own
`referrerpolicy="strict-origin-when-cross-origin"` (the site sends `no-referrer`, which the embed refuses: error 153);
`playsinline=1`, `controls=0`: our controls under it (`app/src/lib/english/components/Controls.svelte`): play / pause (on from where it
stopped), −5秒 and 0.75× (only when the frame's `availablePlaybackRates` offer more than 1) side by side, 字幕 at the row's end,
each a 44 pt target, and a scrubber with the time (never locked) (a question's segment is its card's この部分を聞く, not a control). States: offline (a note, nothing loaded), unavailable (an error 100/101/150/153: a note and a link to
YouTube), a play that doesn't start (iOS wants a tap on the video itself: a hint). The player is edge to edge (393 pt on an
iPhone 15). The quality can't be set (setPlaybackQuality is a no-op since YouTube's 2019-10-24 revision): YouTube picks
it by the frame's device pixels, so the edge-to-edge width is what drives it. Captions are unloaded at ready and at each play, unless 字幕 is on.
字幕 cycles オフ → 英語 → 日本語 in one tap, the clip playing on, オフ by default and again in each lesson (the player's, not saved); turned on, counted
once a play (`act:english.cc`). 英語: YouTube's own English track (`loadModule` captions, `setOption` captions track en,
again at each play). 日本語: `setOption` track `{ languageCode: 'en', translationLanguage: { languageCode: 'ja' } }`
(YouTube's auto-translation), or `{ languageCode: 'ja' }` once the frame has listed a Japanese track (its `tracklist`,
read from infoDelivery or apiInfoDelivery wherever nested: the shape is undocumented). Unverified on the iPhone: if the embed ignores it, the captions stay
English or off. YouTube shows one caption track only, and the dialogue is never ours to render, so there are never two
tracks. ツール (The page) holds 字幕 too (the chip's choice) and
**字幕の大きさ** 小 / 中 / 大 / 特大 = `setOption` captions `fontSize` −1 / 0 / 1 / 2 (大 by default: the user found
YouTube's own small; this phone's), sent each time the captions load and when it changes. The e2e answer
the frame with a stand-in player.

**The log** (`npm run logs -- --event english.fail`): a bank that didn't load (`bank`: its HTTP status, none for no
answer, `bad` a file not its clip), the embed in error (`embed` with YouTube's `code`; `hello` no answer to the
handshake), a play that didn't start (`stuck`, once a lesson); each with the clip and whether the phone was online.

## Scene summaries

場面のあらすじ: our own short Japanese outline of the clip, one sentence (≤ 40 characters) every 10–20 s: who does what
and why, never a line's words in any language, no quoted dialogue. Written on another machine (the importer), one file
a video: `app/src/lib/english/scenes/<YouTube video id>.json`, `{ "video", "scenes": [{ "t": [from, to], "ja" }] }`.
`scenes.test.ts` holds every file: the shape (`video` = the file name), time order within the clip's `dur`, no overlaps,
gaps ≤ 5 s; `ja` ≤ 40 characters, no 「」『』 or quotation marks, no English words, every character in the trimmed font.
The build adds `scenes` to the clip's bank (its file name carries their version too: `catalog.ts withScenes`); nothing
more is precached.

**Beats** (optional, the user 2026-11-16): the same clip in shorter steps, each categorized, in the same file:
`"beats": [{ "t": [from, to], "ja", "k" }]`. `k` is the beat's main move, one of ask 頼む・誘う, decline 断る, suggest
提案, explain 説明, feeling 気持ち, joke 冗談, irony 皮肉, argue 言い合い, action 動作 (`scenes.ts BEAT_KINDS`, i18n
`beat.<k>`). The test holds them too: each 2–10 s, time order, no overlaps, gaps ≤ 5 s, each inside one scene's span,
`ja` ≤ 30 characters with the scenes' line rules, `k` in the set; no keys but `video`, `scenes`, `beats`. The bank
carries `beats` as well (their version is in the scenes' hash).

One place, directly under the video, on its black, one fixed height (two lines' worth: 字幕 or the
playhead never move what's under it): the scene at the playhead (`scenes.ts atTime`; in a gap, the one before), following
it as it plays; with beats, the beat at the playhead instead, its category in a small pill before it. It shows on the watch card, at まとめ and in the levels
(フレーズ, セリフ), never while a question card is open (a gist line would answer gist, infer and attitude items).
Tapped, or from ツール's 場面のあらすじ一覧 (at any point, a question's too): a sheet of every scene (time, then the line; the one on now in yuzu), one tapped plays from
there. With beats, the scenes are headers with their beats under them (time, category, line), and a chip row
(すべて and the categories present) filters the beats; a header or a beat tapped plays from there. ツール's 場面のあらすじ switch shows or hides the line, shown by default, kept on this phone (`prefs.ts`). A clip
without scenes shows none of them.

## Transcripts

セリフ: the clip's full English text, with our Japanese translation when written (the user, 2026-11-16: the
transcripts ship, the audio still never does). One file a video: `app/src/lib/english/transcripts/<YouTube video id>.en.json`,
`{ "video", "lines": [{ "t": [from, to], "en" }] }`: the local whisper pass's segments (0.1 s; noise that is mostly not
Latin letters dropped; a run of 3+ identical lines, its loop over music or a talking head, cut; a line over 200
characters split at a sentence end), written by `npm run english:transcripts -- <out dir> [--ids a,b] --write` from
`~/friends/out/<video>/whisper.json`. A translation is a second file, `<video id>.ja.json`: one line for each of the en
file's, the same `t`. `transcripts.test.ts` holds every file: the shape (`video` = the file name), time order, no
overlaps; `en` ≤ 200 characters, trimmed; the ja file's lines the en file's own count and `t`s, `ja` ≤ 80 characters,
no English lines (names in katakana), every character in the trimmed font. The build adds `lines` to a library clip's
bank, each with its `ja` when in, held to the clip's length (a file written before its clip joined the library needs no
rewrite); the bank's file name carries the transcript's version (`catalog.ts withTranscript`); nothing more is
precached. ツール's セリフ（全文） row (a bank with lines only) opens the whole transcript as a level under the
pinned player: the line at the playhead marked and kept in view (`scenes.ts atTime`; a touch or a wheel on the list
holds the follow 6 s), one tapped plays from there, the Japanese under its English when in.

## Progress

A `listen` row (`gm` 'tv', `u` the clip's id, contract/listen.ts) once a play, when its まとめ is reached (`f: 1`, every
answer so far; もう一度 the same day is a play of its own), and one without `f` when a clip is left part-way with a minute or more not yet sent. `ms` is
the active study time the row adds: the video playing with the page visible, plus a question card's time with input
in the last 60 s, at most 90 s a question. It is the only `listen` row the record takes (the retired ききみみ's
were deleted); its owner gets it whole, everyone else `{d, g, n, ms, gm, f?}`.

- **A day** (Tokyo) counts when a まとめ is reached. Weeks start on Monday.
- **今週:** three dots (`●●○ 2/3日`), then 「今週の3日、達成」 (past three, 「4日」). Monday before any study:
  「新しい週です」. Nothing is said for no days: never 0日, 途切れた, リセット, 残念.
- **The run, 「3日の週」:** a week of 3+ days adds one; 1–2 days hold it; one empty week holds it (a rest week); two
  empty weeks in a row end it silently. A run of 2+ reads 「3日の週が N週つづいています」, else the lifetime count
  「3日の週 これまで N回」 (none before the first). The week in progress counts once it has its 3 days.
- **これまで N本:** distinct clips finished; ✓ in the library. 「今週 約N分」 in small grey, rounded to 5 min:
  information only (no minutes goal, no daily figure).
- **After 7+ days away**, once: 「おかえりなさい。今日の1本からどうぞ」 (the gap never named).
- **The partner** (members only): their today's clip done and their week's dots; 「今週はふたりとも達成」 on both cards
  once both have 3 days. Never the run or minutes. The guest has their own progress and no partner line. Others get a
  row's summary only (`d`, `gm`, `f`, `ms`), never the clip or the answers.

## Flags

⚑ 報告 on the clip card and every question, before or after answering: a sheet with kind chips (答え, 聞こえた言葉・字幕,
問題文, 再生の位置, 解説, その他) and an optional note (≤ 200), 送る. An `eflag` event (contract/eflag.ts: the clip,
the question or null, the kind, the note, the player's time, the content's version `v` from `hash.ts`, what was shown),
anyone's, the guest's too; everyone sees every flag. ⚙ → 報告した内容 lists them, newest first, 確認待ち or 確認済み
with the review's note.

Review together from `relay/`: `npm run flags` (open flags by clip: the question, what was seen, the note, a YouTube
link at the time, and whether the content changed since), `npm run flags -- done <id> fixed|kept "note"` (an
`eflag_done` from member A; the guest can't write one).
