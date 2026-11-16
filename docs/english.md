# English Study

The leaf menu's 英語 pill opens **English Study**: one real TV clip a day, about 15 minutes. Watch it whole, answer
6–8 questions with replays of the exact segment, read short Japanese notes. Solo; the guest has their own progress.
Code: `app/src/lib/english/` (content, logic, strings in `i18n.ts`, the sheet in `components/`; the progress block one component, so it can change alone).

## Content

A clip (`lib/english/types.ts` Clip) is an official YouTube video and our lesson over it: segments `[from, to]` s,
English questions, Japanese notes (言っていること / 意味 / 迷いやすい点 / 使えるフレーズ) and a one-line `cue` for a
second listen. A question quotes one short line at most (*key words* starred); no audio or transcript is ours to ship.
`clips/index.ts` lists them in order, easier first; one file a clip, each checked by the unit tests.

- Pick a clip by its captions: ≥ 110 words a minute, ≥ 6 askable points, playable as an embed in Japan.
- At most one 書き取り a clip; 大意 first, then in clip order.
- Bands: ゆっくり < 100 wpm, ふつう 100–130, 速い > 130.

## The page

One sheet, two levels: home (今日の動画, this week, the library) and a clip's lesson; ⚙ holds 報告した内容.

- **Home:** today's clip is the first in order not finished; 別の動画にする the next. The library lists every clip,
  ✓ once finished. A member sees the partner's line (finished today, or this week's days); the guest sees none.
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
`playsinline=1`. States: offline (a note, nothing loaded), unavailable (an error 100/101/150/153: a note and a link to
YouTube), a play that doesn't start (iOS wants a tap on the video itself: a hint). The e2e answer the frame with
a stand-in player.

## Progress

A `listen` row (`gm` 'tv', `u` the clip's id, contract/listen.ts) each time a まとめ is reached (`f: 1`, every answer
so far; a re-watch too), and one without `f` when a clip is left part-way with a minute or more not yet sent. `ms` is
the active study time the row adds: the video playing with the page visible, plus a question card's time with input
in the last 60 s, at most 90 s a question.

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
