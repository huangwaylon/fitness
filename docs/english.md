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

- A question has an `id` (≤ 8 of a-z0-9, never reused: the listen answers' and flags' key), a `skill` (its card
  label: 大意 詳細 数字 誰が 含み 気持ち 言葉の働き 笑い 次の一言 つなぎ言葉 フレーズ 音 書き取り), a `level` (B1/B2/C1), a
  `point` and the points it `reveals`. A bank is 16–24 items; `clips.test.ts` runs the review rubric's mechanical checks
  (a lesson under 16 only the schema, segments, wording, dictations and draws).
- **The draw** (`draw.ts`, pure, seeded by player, clip and play): 6 items under 90 s, 7 under 180 s, else 8. A gist
  first, then the best set of the rest (a bounded search): on play 2+ a C1 whenever one fits, the unseen before any
  repeat, then the group quotas (play 1 L2 I2 F1 at n 6; play 2+ leans to interpretation), new points first; always
  ≤ 1 dictation, one item a point, nothing that reveals a chosen point; then clip order. A play's ids
  are kept with its place; choices are shuffled per player unless `keep`.
- **The native tier (C2):** 0 or 2–4 items a bank, ≤ 1 a point, skills infer / attitude / pragma / humor / sound /
  dict, notes 90–140 characters, not counted in the B1/B2/C1 shares; a stress item (a C2 `sound`) ships `retired` until
  its ear check. The draw takes none on play 1 (one with `{ harder: true }`, the ⚙ むずかしめ opt-in), ≤ 1 on play 2,
  1–2 from play 3 while one is unseen.
- Speed: `wpm` is words a minute over speech time from the captions, one measure for every clip
  (`npm run english:wpm -- <captions dir> [--write]`). Bands are the library's thirds by it: ゆっくり, ふつう, 速い =
  the slowest, middle and fastest third (`bandsOf`, rewritten by the script, held by the test).
- **The plan** (`plan.ts`): one order every phone offers the clips in, so both members meet the same clip most days
  without seeing each other's. A slow ramp by ease (wpm's rank 0.7, the bank's C1+ share's 0.3; a bank under 16 the
  mean) with variety: each pick the one of the nearest five that avoids three of a show or a situation in a row and
  keeps the shows near their share. `plan-order.ts` keeps it as written (`npm run english:plan`; `-- --fresh` only
  while nobody is part-way); a clip added since goes after it. The build orders the index by it.

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

One sheet: home, the library, a clip's lesson (‹ back to where it was opened) and ⚙ (むずかしめの質問を増やす, 報告した内容).

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
- **The library:** one chip row (すべて, each show, each situation), the clips in order with the part-way first and the
  finished last (✓, 2回), 20 at a time with もっと見る. On すべて, collections first (`collections.ts`: situation tags,
  curated ids or both; shown with 4+ clips; 電話の英語, 断り方・お願い, 職場の会話, お店で, カメラに話す本音, 旅行), a row
  「N本 · N本完了 ›」 and a level of its own: its note, its clips, no chips. Not courses: no order, nothing locked. Thumbnails are YouTube's stills from i.ytimg.com (CSP img-src,
  no referrer); offline or gone, a paper tile with the show's name.
- **むずかしめの質問を増やす** (off by default, this phone's) lets the native tier into a first play; a C2 item's card
  carries a むずかしめ tag. Nothing is locked either way.
- **Lesson:** the player stays pinned on top. Watching first is a suggestion: 質問へ and ‹ 前へ / 次へ › always work, a
  question can be left unanswered, and まとめ is always reachable.
- **この動画のフレーズ** (the lesson bar's list button, never locked, and まとめ's; `phrases.ts`, `ClipPhrases.svelte`): a
  level under the same pinned player, ‹ back to where it was. The bank's quoted lines (every question's `line`, the
  retired too), once each, in time order; lines starting within a second are one moment, a card each: ▶ m:ss plays it,
  then each line (key words underlined), 言っていること, 意味 and the phrase. Only the questions' own short quotes,
  never a transcript.
- **A miss:** the segment plays again by itself, a nudge with the `cue`, the choices as they were, and a quiet 答えを見る.
  A second miss shows 「答えはこれ」. Never red, ×, a sound or a percentage; ◎ first try, ○ second.
- **書き取り:** the words heard are counted (「k/n 語 聞き取れました」; none: 「答えはこれ」, never a 0), the rest shown in the answer colour.
- **まとめ:** the scenes worth hearing again (anything not ◎), the clip's phrases, 通して見る. It finishes the clip once
  six questions (all, if fewer) are answered or shown; else it says how many are left and goes to the first.
- Leaving keeps the place on this phone: the clip, the question, the answers. A play whose まとめ was reached is
  finished, even if gone back from it: its next opening draws the next.

## The player

The player drives the youtube-nocookie embed over postMessage (`enablejsapi=1`, `origin=`): the
`listening` handshake, `infoDelivery` for the time and the state, `command` for seekTo / playVideo / pauseVideo. No
`iframe_api` script (it would need a third-party `script-src`). A segment pauses at its end (the time extrapolated
between deliveries). CSP `frame-src https://www.youtube-nocookie.com`; the iframe's own
`referrerpolicy="strict-origin-when-cross-origin"` (the site sends `no-referrer`, which the embed refuses: error 153);
`playsinline=1`, `controls=0`: our controls under it (`app/src/lib/english/components/Controls.svelte`): play / pause (on from where it
stopped), −5秒, a scrubber with the time (never locked), 字幕 and its ⋯ sheet, and 0.75× only when the frame's `availablePlaybackRates` offer more than 1
(a question's segment is its card's この部分を聞く, not a control). States: offline (a note, nothing loaded), unavailable (an error 100/101/150/153: a note and a link to
YouTube), a play that doesn't start (iOS wants a tap on the video itself: a hint). The player is edge to edge (393 pt on an
iPhone 15). The quality can't be set (setPlaybackQuality is a no-op since YouTube's 2019-10-24 revision): YouTube picks
it by the frame's device pixels, so the edge-to-edge width is what drives it. The quality played (`onPlaybackQualityChange`
or infoDelivery's `playbackQuality`) is counted once a play (`act:english.q.<quality>` in the log's `use`). Captions are unloaded at ready and at each play, unless 字幕 is on.
字幕 cycles オフ → 英語 → 日本語 in one tap, the clip playing on, オフ by default and again in each lesson (the player's, not saved); turned on, counted
once a play (`act:english.cc`). 英語: YouTube's own English track (`loadModule` captions, `setOption` captions track en,
again at each play). 日本語: `setOption` track `{ languageCode: 'en', translationLanguage: { languageCode: 'ja' } }`
(YouTube's auto-translation), or `{ languageCode: 'ja' }` once the frame has listed a Japanese track (its `tracklist`,
read from infoDelivery or apiInfoDelivery wherever nested: the shape is undocumented). How it went is counted 5 s into
each play (`act:english.ccja.<track | tr | offer | none | silent>`: a Japanese track on, the translation on, offered
only, no Japanese reported, nothing reported). Unverified on the iPhone: if the embed ignores it, the captions stay
English or off. YouTube shows one caption track only, and the dialogue is never ours to render, so there are never two
tracks: with 英語 on, 場面のあらすじ's line sits directly under the video instead, on its black and centred, the English
caption and the Japanese gist read as a pair. ⋯ beside the chip opens 字幕's sheet: 言語 (the chip's choice),
**字幕の大きさ** 小 / 中 / 大 / 特大 = `setOption` captions `fontSize` −1 / 0 / 1 / 2 (大 by default: the user found
YouTube's own small; this phone's), sent each time the captions load and when it changes, and あらすじ (a clip with
scenes). The e2e answer
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

Under the controls (under the video with 字幕 英語: The player), one calm line: the scene at the playhead (`scenes.ts sceneAt`; in a gap, the one before), following
it as it plays; with beats, the beat at the playhead instead, its category in a small pill before it. Tapped: a sheet of every scene (time, then the line; the one on now in yuzu), one tapped plays from
there. With beats, the scenes are headers with their beats under them (time, category, line), and a chip row
(すべて and the categories present) filters the beats; a header or a beat tapped plays from there. 字幕's sheet's あらすじ switch shows or hides the line, shown by default, kept on this phone (`prefs.ts`). A clip
without scenes shows neither.

## Transcripts

せりふ: the clip's full English text with our Japanese translation (the user, 2026-11-16: the transcripts ship, the
audio still never does). One file a video: `app/src/lib/english/transcripts/<YouTube video id>.en.json`,
`{ "video", "lines": [{ "t": [from, to], "en" }] }` — the local whisper pass's segments (0.1 s; a run of 3+ identical
lines is its loop over music or a talking head, cut), written by `app/scripts/english-transcripts.ts` from
`~/friends/out/<video>/whisper.json` on the importer's machine. The translation is a second file,
`<video id>.ja.json`: one line for each of the en file's, the same `t`, written by the translators (the paced fleet,
`~/friends/TRANSLATE.md`). `transcripts.test.ts` holds every file: the shape (`video` = the file name), time order, no
overlaps, the clip's end held when it's in the library; `en` ≤ 200 characters, trimmed; the ja file's lines the en
file's own count and `t`s, `ja` ≤ 80 characters, no English lines (names in katakana), every character in the trimmed
font. The build adds `lines` to the clip's bank, each line with its `ja` when the translation is in (its file name
carries the transcript's version too: `catalog.ts withTranscript`); nothing more is precached. The lesson's せりふ
button opens the whole transcript under the pinned player: the line at the playhead follows it as it plays (`transcripts.ts
lineAt`), one tapped plays from there, the Japanese under its English when in.

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
