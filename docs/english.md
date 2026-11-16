# English Study

The leaf menu's 英語 pill opens **English Study**: one real TV clip a day, about 15 minutes. Watch it whole, answer
6–8 questions with replays of the exact segment, read short Japanese notes. Solo; the guest has their own progress.
Code: `app/src/lib/english/` (content, logic, strings in `i18n.ts`, the sheet in `components/`; the progress block one component, so it can change alone).

## Content

A clip (`lib/english/types.ts` Clip) is an official YouTube video and our lesson over it: segments `[from, to]` s,
English questions, Japanese notes (言っていること / 意味 / 迷いやすい点 / 使えるフレーズ) and a one-line `cue` for a
second listen. A question quotes one short line at most (*key words* starred); no audio or transcript is ours to ship.
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
  もう一度（新しい質問）), 今週, and ライブラリ, at most five rows: the latest play left part-way, the next clips in order,
  すべて見る（N本）›. Today's clip is the first in the plan neither finished nor skipped; 別の動画にする shows the next and
  skips the one passed over for 14 days on this phone. All finished: 全部見ました and the one finished longest ago.
  A member sees the partner's line (finished today, or this week's days); the guest sees none.
- **The library:** one chip row (すべて, each show, each situation), the clips in order with the part-way first and the
  finished last (✓, 2回), 20 at a time with もっと見る. Thumbnails are YouTube's stills from i.ytimg.com (CSP img-src,
  no referrer); offline or gone, a paper tile with the show's name.
- **むずかしめの質問を増やす** (off by default, this phone's) lets the native tier into a first play; a C2 item's card
  carries a むずかしめ tag. Nothing is locked either way.
- **Lesson:** the player stays pinned on top. Watching first is a suggestion: 質問へ and ‹ 前へ / 次へ › always work, a
  question can be left unanswered, and まとめ is always reachable.
- **A miss:** the segment plays again by itself, a nudge with the `cue`, the choices as they were, and a quiet 答えを見る.
  A second miss shows 「答えはこれ」. Never red, ×, a sound or a percentage; ◎ first try, ○ second.
- **書き取り:** the words heard are counted (「k/n 語 聞き取れました」), the rest shown in the answer colour.
- **まとめ:** the scenes worth hearing again (anything not ◎), the clip's phrases, 通して見る. It finishes the clip once
  six questions (all, if fewer) are answered or shown; else it says how many are left and goes to the first.
- Leaving keeps the place on this phone: the clip, the question, the answers.

## The player

The player drives the youtube-nocookie embed over postMessage (`enablejsapi=1`, `origin=`): the
`listening` handshake, `infoDelivery` for the time and the state, `command` for seekTo / playVideo / pauseVideo. No
`iframe_api` script (it would need a third-party `script-src`). A segment pauses at its end (the time extrapolated
between deliveries). CSP `frame-src https://www.youtube-nocookie.com`; the iframe's own
`referrerpolicy="strict-origin-when-cross-origin"` (the site sends `no-referrer`, which the embed refuses: error 153);
`playsinline=1`, `controls=0`: our controls under it (`app/src/lib/english/components/Controls.svelte`): play / pause (on from where it
stopped), −5秒, この部分 (the question's segment), a scrubber with the time (never locked), and 0.75× only when the
frame's `availablePlaybackRates` offer more than 1. States: offline (a note, nothing loaded), unavailable (an error 100/101/150/153: a note and a link to
YouTube), a play that doesn't start (iOS wants a tap on the video itself: a hint). The player is edge to edge (393 pt on an
iPhone 15): YouTube ignores a forced quality and picks by the frame's device pixels, so the width is the fix; 'hd720' is
still asked (setPlaybackQuality) at ready and each play, and the quality played is counted once a play
(`act:english.q.<quality>` in the log's `use`). The e2e answer the frame with a stand-in player.

## Progress

A `listen` row (`gm` 'tv', `u` the clip's id, contract/listen.ts) each time a まとめ is reached (`f: 1`, every answer
so far; a re-watch too), and one without `f` when a clip is left part-way with a minute or more not yet sent. `ms` is
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
