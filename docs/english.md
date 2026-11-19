# English Study

The leaf menu's 英語 pill opens **English Study**: one real TV clip a day, about 15 minutes. Watch it whole, answer
6–8 questions with replays of the exact segment, read short Japanese notes. Solo; the guest has their own progress.
Code: `app/src/lib/english/` (content, logic, strings in `i18n.ts`, the sheet in `components/`).
The sheet's Japanese UI copy is casual, as すごろく's (〜よう, 〜だよ, 〜してね; never です/ます), kanji and the term list as
every sheet (design.md "Copy"; linebreaks.test reads `i18n.ts`); the clips' notes keep their own register.

## Content

A clip (`lib/english/types.ts` Clip) is an official YouTube video and our lesson over it: segments `[from, to]` s,
English questions, Japanese notes (言っていること / 意味 / 迷いやすい点 / 使えるフレーズ) and a one-line `cue` for a
second listen. A question quotes one short line at most (*key words* starred); no audio is ours to ship (the
transcript is: Transcripts). One file a clip in `clips/`; `clips/index.ts` reads the folder (CLIPS by id), so a clip
joins by its file alone. A question may carry its Japanese, `ja` (the stem) and `choicesJa` (one a choice); without
them nothing is shown.

- A question has an `id` (≤ 8 of a-z0-9, never reused: the listen answers' and flags' key), a `skill` (its card
  label: 大意 詳細 数字 誰が 本当の意味 気持ち 一言のねらい 笑いどころ 次の一言 つなぎ言葉 フレーズ 音の聞き分け 書き取り), a `level` (B1/B2/C1/C2), a
  `point`, the points it `reveals`, and `ctx` for a context item. `retired` takes a question out (never deleted).
- **The draw** (`draw.ts`, pure, seeded by player, clip and play, so a resume and the other phone draw the same): 6–8
  items by the clip's length, a set-up gist first, then the unseen before any repeat, group quotas form-heavy for an
  A2 learner, a context item, spread over the clip; never two items on one point or one giving another away; then clip
  order. The numbers are in its header and `draw.test.ts`. Choices are shuffled per player unless `keep`.
- **The native tier (C2):** 0–2 items a bank (a stress item, a C2 `sound`, stays `retired` till its ear check); the
  draw takes none unless ⚙ 難しめ (`{ harder: true }`), then ≤ 1 a play.
- Speed: `wpm` over speech time from the captions (`npm run english:wpm -- <captions dir> [--write]`); the bands
  ゆっくり / ふつう / 速い are the library's thirds by it (`bandsOf`).
- Segments: cut on YouTube's json3 word times (`npm run english:segs -- <captions dir> [--write [left.md]]`): each
  item's line played whole, from its sentence's start to its end with a second or more around it; a line it can't
  find is listed.
- **The plan** (`plan.ts`): one order every phone offers the clips in, so both members meet the same clip most days
  without seeing each other's: a slow ramp by ease (wpm, then how much of the bank is past B1), `// A2 LATE:` banks
  last, with variety (no three of a show or situation in a row, the shows near their share). `plan-order.ts` keeps it
  as written (`npm run english:plan`; `-- --fresh` only while nobody is part-way); a clip added since goes after it.
  The build orders the index by it.

## Content rules

`clips.test.ts` holds every bank to the countable rules (its checks name them: size and level mix, the key's length
and echo, notes' lengths, coverage of the speech span, ≤ 3 starts in 10 s, context items, EXCLUDE / SKIP / SWEAR-OK
header ranges, the trap opener, a full draw); the review rubric (mbp2 ~/friends/review-rubric.md, question-framework.md)
holds the rest. The why, for an author:

- **For an A2 learner:** form-heavy, little interpretation, B1 the bulk; most items turn on a chunk usable this week (a
  stock reply in the clip gets one). Stems short and wh-first, names not roles; 3 parallel choices in A2 words, every
  distractor something a careless listener could believe, the key never the longest or the one echoing the line.
- **Notes** never say 不正解, 間違い, 残念 or ×; the trap opener 「思いやすい」 rotates with others.
- **Coverage:** items spread over the whole talk; a long stretch without one says why in `// SKIP a–b: why` (credits,
  music, crosstalk, an excluded joke).
- **Context items** (`ctx`): the answer needs two turns; their `line` quotes both, split by ` / `.
- **EXCLUDE** (`// EXCLUDE a–b`; no live seg overlaps one): slurs, racial or ethnic jokes, explicit sexual lines,
  suicide, crude bodily lines, and swears (the test's SWEAR list; bleeped ones too). Mild innuendo, damn / hell / crap
  / sucks and screw up may play. `// SWEAR-OK a–b: why` clears a name (Moby Dick).

## Data

`clips/` stays the source. The build makes two things of it (vite.config.ts `english-data`):

- **The index**, in the plan's order (`catalog.ts` ClipMeta; the clip's version `v` = `hash.ts clipHash`), the module `clips/index.ts?english-index`, in the
  sheet's chunk: home, the library and ⚙ need nothing else. Nothing in the app imports `clips/` itself (`deps.test.ts`).
- **A bank a clip**, `english/c/<id>.<v>.json` (the clip as authored, its retired questions cut to what
  この動画のセリフと解説 shows: `catalog.ts bankOf`), fetched when its lesson opens; home fetches
  today's ahead while idle. The service worker keeps them (`island-english-v1`, cache first: the name carries the
  version), never precached. A lesson shows its player and watch card at once; its questions wait (読み込み中…) till
  the bank is in, or say it didn't load (offline: why) with もう一度 (failing again online: `reloadOnRepeat`, a reload into the newer
  build). Till then nothing finishes the clip: まとめ needs the bank.
  `load-budget.ts` holds the sheet's chunk to 80 KB gzipped and the banks out of the precache.

## The page

One sheet: three tabs, **ホーム · フレーズ · すごろく** (the kit's TabBar, on those three only; each opening on ホーム;
すごろく: docs/sugoroku.md), and levels pushed over them with no tab bar: the library, a clip's lesson and ⚙
(難しめの質問を増やす, 音声認識テスト › (/speech: docs/speech-test.md), 報告した内容). As 設定's levels, every ‹ goes back
exactly one level, to what opened it; a paper sheet opened from ツール's row reopens ツール on its ‹, opened elsewhere it
has ✕ only; ✕ closes the sheet it is on. No swipe, no in-page 戻る (まとめ's 完了 is the lesson's ‹).

- **Home**, three cards: 今日の動画 (thumbnail, show · band · situation · N問, one button: 始める / 続きから /
  もう一度（新しい質問）), 今週, and ライブラリ (≤ 5 rows: the latest play left part-way, もう一度, the next clips in the
  plan, すべて見る（N本）›). Today's clip is the plan's first neither finished nor skipped (`progress.ts dailyOf`);
  finished, the card moves on (今日の分は完了 ✓). 別の動画にする skips the one passed over for 14 days on this phone. A
  member sees the partner's line; the guest none.
- **もう一度** (`progress.ts reviewOf`): a finished clip again with new questions, a row beside today's (never in its
  place), at most once a week; finished 7+ days ago (28+ after two plays), the most unmet items first. Ignoring it
  changes nothing.
- **The library:** a chip row by show, the part-way first and the finished last (✓, 2回), 20 at a time with もっと見る.
  On すべて, **場面で選ぶ** first (`collections.ts`): a tile a situation with 4+ clips, each a level (its note, its
  clips); a situation is reachable one way only. Not courses: no order, nothing locked. Thumbnails from i.ytimg.com
  (CSP img-src, no referrer); offline, a paper tile with the show's name.
- **難しめの質問を増やす** (off by default, this phone's): the native tier in the draw; a C2 card carries a 難しめ tag.
- **Lesson:** the player pinned on top. Watching first is a suggestion: 質問へ and ‹ 前へ / 次へ › always work, a question
  may be left unanswered, まとめ is always reachable. One primary action a state: ▶ 全部見る on the watch card (sunk
  while the player shows its offline or unavailable note; 質問へ green once the clip has played), この部分を聞く while
  answering, 次へ once answered, 完了 at まとめ. A dictation's 答える turns leaf once typed; Return answers too, and answering blurs the field
  (the keyboard down); with the keyboard up, 前へ / 次へ hide. A question card fits its choices and ⚑ above the fold at 393×852 (two at least at 375×667:
  `english-lesson.spec.ts`): one control row, its meta 「質問 1/6 · 大意」 (question 1: 「聞いてから選ぼう」 under the stem).
  The Japanese stays out of the page till 訳を見る (the kit's `.text-link` under the stem): the stem's `ja` and the choices'
  `choicesJa` (never a form item's before answering), this question only, nothing recorded; the reveal shows all of it.
  The credit shows on the watch card, at まとめ and in ツール.
- **ツール** (`StudySheet.svelte`): 字幕, 字幕の大きさ, 再生速度, the 場面のあらすじ switch and list, セリフ（全文）, この動画の
  セリフと解説 (「質問の答えと解説を含みます」), ⚑ この動画を報告, the credit.
- **この動画のセリフと解説** (`phrases.ts`, `ClipPhrases.svelte`; ツール's row and まとめ's): the bank's quoted lines
  (every question's `line`, the retired too) in time order, a card a moment (lines within a second): ▶ m:ss, each line,
  言っていること, 意味, the phrase. Every keyed line in the sheet is one `KeyedText` (key words underlined).
- **A miss:** the segment again by itself, a nudge with the `cue`, and a 答えを見る link; a second miss shows
  「答えはこれ」. Never red, ×, a sound or a percentage; ◎ first try, ○ second.
- **The reveal:** the result, the line, 意味 and 使えるフレーズ; 言っていること and 迷いやすい点 under 「くわしく」, open by
  itself after a miss. It scrolls up with the answered choice on top. 書き取り counts the words heard (none: 「答えはこれ」,
  never a 0). The reveal is the kit's ok card (`--ok-bg`: a navy leaf by night); the nudge and まとめ's rows are navy by night like the choices (a light panel glared).
- **まとめ** writes the clip's row (Progress): 「おつかれさま！」, the scenes worth hearing again (anything not ◎: its
  segment and the line heard there), the clip's phrases, 通して見る.
- Leaving keeps the place on this phone (the clip, the question, the answers). A play whose まとめ was reached is
  finished, even if gone back from: its next opening draws the next.

## Phrase review

フレーズの復習 (`phrase-review.ts`, `PhraseReview.svelte`): a card above 今日の動画 on home, only
when phrases are due. The phrases are the `use` of the questions in my finished plays (`listen` rows with `f`) and
those フレーズ's ☆ saved (`k`; un-☆ leaves the rest as it was); each comes back 1, 3, 7, 14, then every 30 days after
it was last met, saved or shown here. At most 3 a day: those shown
before first (the longest overdue first), then the never shown (the latest met first), one per English phrase.

- One at a time, on the deck's `PhraseCard` (below): the English, 意味を見る → its Japanese, the clip's line and its
  player, この場面を聞く playing the question's segment; then もう一度 (tomorrow again) or 覚えた (a step on). These only space
  it: never a score, a percentage, red or ×. 今日はスキップ ends today's (the steps as they were).
- Kept per player on this phone (`island.english.phrases`). Banks it needs are fetched (at most 4); one that doesn't
  load is passed over, and the card never holds up today's clip. Counted: `act:english.phrase.<show | kept | again | skip>`.

## フレーズ

A deck of the library's phrases, one card at a time. **The deck** (`catalog.ts deckOf`, at build time; `catalog.test.ts`
holds its rules): a live B1 question's `use` (not a gist / humor / who / predict) with its Japanese in （…）, short, no
character's name, sharing a key word with its `line`, its segment ≤ 15 s; one card per English phrase. It ships as 12
files, `english/p/<n>.<v>.json`, a card in `fnv(clip/qid) % 12` (each mixes the whole library, so a card's file is
stable as cards come and go), versions in the index's `DECK`; cached by the service worker as the banks, never
precached; `load-budget.ts` holds them to 12, each ≤ 32 KB gzipped.

**The page** (`deck.ts`, `Phrases.svelte`, the card `PhraseCard.svelte`, shared with フレーズの復習): 5 a set, the order
seeded per player (a new one each round), the place kept on this phone (`island.english.deck`), so the tab comes back to
the same card, face down. Passed over till next round: a second card of a clip in this set, and today's clip's and the
next 2 in the plan (their lessons stay fresh).

- Front: the clip's thumbnail, 1/5 and show · title, the phrase (shared key words underlined), **意味を見る**. Back: its
  Japanese, 動画では + the line and its 意味, the clip's player (mounted at the first 意味を見る, kept for the set, the next
  clip cued into it: one embed a set), **▶ この場面を聞く**, 声に出して言ってみよう, ☆ 復習に入れる (the star soft-filled once
  saved; again: out) and 次へ ›.
- After the 5th: 「5枚見たよ · これまで Nフレーズ」, もう5枚 / ホームへ. Never a score, %, red or ×. A file that doesn't
  load: its note with もう一度. Counted: `act:english.deck.<show | reveal | play | save | more>`.

## The player

The player drives the youtube-nocookie embed over postMessage (`enablejsapi=1`, `origin=`): the `listening`
handshake, `infoDelivery` for the time and the state, `command` for seekTo / playVideo / pauseVideo / cueVideoById
(フレーズ's cards share one frame). No `iframe_api` script (it would need a third-party `script-src`). A segment pauses
0.4 s past its end (the time extrapolated between deliveries, 1 s at most, so a stall never stops it early). CSP
`frame-src https://www.youtube-nocookie.com`; the iframe's own `referrerpolicy="strict-origin-when-cross-origin"` (the
site's `no-referrer` gets error 153). `playsinline=1`, `controls=0`: our controls under it (`Controls.svelte`, 44 pt
each): play / pause (on from where it stopped), the scrubber (never locked, a seek a frame) and 字幕; off a question
card −5秒 and 0.75× (only when `availablePlaybackRates` offer it; ツール's 再生速度 too). States: offline (a note,
nothing loaded), unavailable (error 100/101/150/153: a note, YouTube's link, もう一度読み込む), a play that doesn't
start (iOS wants a tap on the video: a hint). Edge to edge, since YouTube picks the quality by the frame's pixels
(setPlaybackQuality is a no-op).

**字幕** cycles オフ → 英語 → 日本語 in one tap, the clip playing on, オフ again in each lesson; counted once a play
(`act:english.cc`). Captions are unloaded at ready and each play unless on. 英語: YouTube's English track (`loadModule`,
`setOption` track en, again each play). 日本語: YouTube's auto-translation (`translationLanguage: ja`), or a Japanese
track once the frame lists one (its `tracklist`, wherever nested: undocumented); ignored by the embed, they stay English
or off. One track only; the dialogue is never ours to render. **字幕の大きさ** (ツール) 小 / 中 / 大 / 特大 = `fontSize`
−1…2, 大 by default (this phone's), sent at each load and change. The e2e answer the frame with a stand-in.

**The log** (`npm run logs -- --event english.fail`): a bank that didn't load (`bank`: its HTTP status, none for no
answer, `bad` a file not its clip), a フレーズ deck file that didn't (`deck`, its number `n`, likewise) (failing a second time online: a reload into the newer build, as a lesson's bank), the embed in error (`embed` with YouTube's `code`; `hello` no answer to the
handshake), a play that didn't start (`stuck`, once a lesson); each with the clip and whether the phone was online.

## Scene summaries

場面のあらすじ: our own short Japanese outline, a sentence every 10–20 s (who does what and why, never a line's words),
one file a video, `lib/english/scenes/<video id>.json` `{ video, scenes: [{ t, ja }], beats? }`, written by the
importer; **beats** (optional) split it into shorter steps, each with its move `k` (`scenes.ts BEAT_KINDS`: 頼む・誘う,
断る, 提案, 説明, 気持ち, 冗談, 皮肉, 言い合い, 動作). `scenes.test.ts` holds the shape and lengths. The build puts them in
the clip's bank (their version in its file name: `catalog.ts withScenes`).

One fixed-height line directly under the video (字幕 or the playhead never move what's under it): the scene, or beat
with its category pill, at the playhead (`scenes.ts atTime`). On the watch card, at まとめ and in the levels, never on a
question card (it would answer gist, infer and attitude items), nor with the player's offline or unavailable note. Tapped, or ツール's row: a sheet of every scene (with
beats: scenes as headers, a category chip row), one tapped plays from there. ツール's switch hides the line (this
phone's, `prefs.ts`).

## Transcripts

セリフ: the clip's full English text, with our Japanese when written (the transcripts ship, the audio never does). One
file a video, `lib/english/transcripts/<video id>.en.json` `{ video, lines: [{ t, en }] }` from the local whisper pass
(`npm run english:transcripts -- <out dir> [--ids a,b] --write`, from `~/friends/out/<video>/whisper.json`: noise and
loops dropped, long lines split), and `<video id>.ja.json`, one line for each en line, the same `t`
(`transcripts.test.ts` holds both). The build adds `lines` to a library clip's bank, held to the clip's length (version
in its file name: `catalog.ts withTranscript`); a transcript without a clip stays in the folder, unused (the user's
call). ツール's セリフ（全文） (a bank with lines only): a level under the pinned player, the playhead's line marked and
kept in view (a touch on the list holds it 6 s), one tapped plays from there.

## Progress

A `listen` row (`gm` 'tv', `u` the clip's id, contract/listen.ts) once a play, when its まとめ is reached (`f: 1`, every
answer so far; もう一度 the same day is a play of its own), and one without `f` when a clip is left part-way with a minute or more not yet sent. `ms` is
the active study time the row adds: the video playing with the page visible, plus a question card's time with input
in the last 60 s, at most 90 s a question. Its owner gets it whole, everyone else `{d, g, ms, gm, f?}`.

- **A day** (Tokyo) counts when a まとめ is reached. Weeks start on Monday.
- **今週:** three dots (`●●○ 2/3日`), then 「今週の3日、達成」 (past three, 「4日」). Monday before any study:
  「新しい週だよ」; before the first day ever, 「週3日見たら達成」 says what the dots mean. Never 0日, 途切れた, リセット, 残念.
- **The run, 「3日の週」:** a week of 3+ days adds one; 1–2 days hold it; one empty week holds it (a rest week); two
  empty weeks in a row end it silently. A run of 2+ reads 「3日の週がN週つづいているよ」, else the lifetime count
  「3日の週は、これまでN回」 (none before the first). The week in progress counts once it has its 3 days.
- **これまで N本:** distinct clips finished; ✓ in the library. 「今週は約N分」 in small grey, rounded to 5 min:
  information only (no minutes goal, no daily figure).
- **After 7+ days away**, once: 「おかえり！今日の1本から始めよう」 (the gap never named).
- **The partner** (members only): their today's clip done and their week's dots; 「今週はふたりとも達成」 on both cards
  once both have 3 days. Never the run or minutes. The guest has their own progress and no partner line. Others get a
  row's summary only (`d`, `gm`, `f`, `ms`), never the clip or the answers.

## Flags

⚑ 報告 on the clip card and every question, before or after answering: a sheet with kind chips (答え, 聞こえた言葉・字幕,
問題文, 再生の位置, 解説, その他) and an optional note (≤ 200), 送る. An `eflag` event (contract/eflag.ts: the clip,
the question or null, the kind, the note, the player's time, the content's version `v` from `hash.ts`, what was shown),
anyone's, the guest's too; everyone sees every flag. Sent: 「ありがとう！」 with ✕ and 閉じる (no ‹ back into the form). ⚙ → 報告した内容 lists them, newest first, 確認待ち or 確認済み
with the review's note.

Review together from `relay/`: `npm run flags` (open flags by clip: the question, what was seen, the note, a YouTube
link at the time, and whether the content changed since), `npm run flags -- done <id> fixed|kept "note"` (an
`eflag_done` from member A; the guest can't write one).
