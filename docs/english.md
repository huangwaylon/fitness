# English Study

The leaf menu's 英語 pill opens **English Study**: one real TV clip a day, about 15 minutes: watch it, answer 6-8
questions with replays of the exact segment, read short Japanese notes. Solo; the guest has their own progress. Code:
`app/src/lib/english/` (strings in `i18n.ts`, the sheet in `components/`). Japanese copy is casual as すごろく's (〜よう,
〜だよ; never です/ます) with sheet kanji ([design](design.md) "Copy"). Never red, ×, a sound, a score or a percentage;
nothing locked.

## Content

A clip (`lib/english/types.ts` Clip) is an official YouTube video plus our lesson: segments `[from, to]` s, English
questions, Japanese notes (言っていること / 意味 / 迷いやすい点 / 使えるフレーズ), a `cue` for a second listen, optional
`ja` / `choicesJa`. A question quotes one short line at most (*key words* starred); no audio is ours to ship. One file
a clip in `clips/` (`clips/index.ts` reads the folder). A question has an `id` (≤ 8 of a-z0-9, never reused: answers'
and flags' key), a `skill` (its card label), a `level` (B1-C2), a `point`, what it `reveals`, `ctx` for a two-turn
context item; `retired` takes it out (never deleted).

- **The draw** (`draw.ts`, pure, seeded by player, clip and play, so both phones draw the same): 6-8 items by length,
  an easy opening (a B1 listening item among the first three; never a dictation), then clip order, the gist too; one
  gist, ≤ 1 C1 and ≤ 1 each of dictation, humor, predict, pragma a play; unseen before repeats, never two on one
  point; numbers in its header and `draw.test.ts`. The C2 tier
  only with ⚙ 難しめの質問を増やす (≤ 1 a play).
- **Speed and segments**: `npm run english:wpm -- <captions dir> [--write]` (bands ゆっくり / ふつう / 速い are the
  library's thirds, `bandsOf`); `npm run english:segs -- <captions dir> [--write [left.md]]` cuts segments on YouTube's
  json3 word times.
- **The plan** (`plan.ts`): one clip order on every phone, so both members meet the same clip most days: a slow ramp by
  ease, `// A2 LATE:` banks last, variety by show and situation. `plan-order.ts` keeps it (`npm run english:plan`;
  `-- --fresh` only while nobody is part-way); new clips go after it.
- **Rules**: `clips.test.ts` holds the countable ones (its checks name them; `// SKIP a-b: why`, `// EXCLUDE a-b`
  for slurs, ethnic jokes, explicit, suicide, crude lines and swears, `// SWEAR-OK a-b: why`). For an A2 learner:
  form-heavy, B1 the bulk, 3 parallel choices, the key never the longest, ≤ 1 pragma a play; `// A2 RAMP` (the first 30
  plan banks): a key may reuse one heard word, at most one distractor may carry a line word the key lacks; notes never say 不正解, 間違い or 残念.

## Data

`clips/` stays the source; vite.config.ts `english-data` builds:
- **The index** (`catalog.ts` ClipMeta in plan order, version `v` = `hash.ts clipHash`): the module
  `clips/index.ts?english-index` in the sheet's chunk. Nothing else imports `clips/` (`deps.test.ts`).
- **A bank a clip**, `english/c/<id>.<v>.json` (retired questions trimmed: `catalog.ts bankOf`; scenes and transcript
  added: `withScenes`, `withTranscript`), fetched when its lesson opens; home prefetches today's, the next one's, the part-way and the offered review's banks and
  the current フレーズ deck file. Service worker
  `island-english-v1`, cache first, never precached. Without the bank a lesson shows the player but no questions
  (読み込み中…, or a note with もう一度; a second online failure reloads into the newer build).
- `app/scripts/load-budget.ts`: the sheet's chunk ≤ 80 KB gzipped, banks and deck files never precachable.

## The page

Three tabs, **ホーム · フレーズ · すごろく** ([sugoroku.md](sugoroku.md)), and levels pushed over them: the library, a
lesson, これまでの記録 and a play's page, ⚙ (難しめの質問を増やす, 音声認識テスト › [speech-test.md](speech-test.md),
報告した内容). Every ‹ goes back one level; ✕ closes the sheet. No swipe, no in-page 戻る.

- **The pill's dot** (`due.ts englishDue`): a leaf dot on the menu's 英語 while today has no まとめ and the week is
  under 3 days; no push.
- **Home**: 今日の動画 (始める / 続きから / もう一度（新しい質問）: the plan's first clip neither finished nor skipped,
  `progress.ts dailyOf`; 別の動画にする skips it 14 days on this phone), 今週, the これまでの記録 › row, ライブラリ (≤ 5
  rows). A member sees the partner's line.
- **もう一度** (`progress.ts reviewOf`): a finished clip with new questions, beside today's, at most weekly.
- **The library**: chips すべて, 短い動画 (≤ 2:30), then by show; 場面で選ぶ tiles (`collections.ts`); thumbnails from i.ytimg.com (no referrer).
- **Lesson**: the player pinned on top. Watching first is a suggestion: 質問へ, ‹ 前へ / 次へ ›, unanswered questions
  and まとめ always work. One primary action a state. A question card fits above the fold at 393×852. Japanese only
  on 訳を見る, nothing recorded. Offline the watch card offers フレーズを練習する and この部分を聞く is greyed out.
- **ツール** (`StudySheet.svelte`): 字幕, 字幕の大きさ, 再生速度, 場面のあらすじ, セリフ（全文）, この動画のセリフと解説
  (`phrases.ts`, `ClipPhrases.svelte`; every keyed line is a `KeyedText`), ⚑, the credit.
- **A miss**: the segment again, the `cue`, a 答えを見る link; a second miss shows 「答えはこれ」. ◎ first try, ○ second.
  The reveal (the kit's ok card) shows the line, 意味, 使えるフレーズ; the rest under 「くわしく」.
- **まとめ** writes the clip's row ([Progress](#progress)) and shows 今週 ●○○ k/3日: the もう一度聞きたい場面 (answered, not ◎), unanswered count,
  phrases. Foot: [前へ][ふりかえる（N場面）] or [前へ][おわる]; おわる goes back as ‹ does and ignores a tap begun within
  600 ms of its arrival (`ui-state/tapGuard.ts`).
- **ふりかえり** (`lesson.ts` Review): the scenes again, nothing recorded. Leaving keeps the place on this phone; a
  play that reached まとめ is finished.

## Phrase review

フレーズの復習 (`phrase-review.ts`, `PhraseReview.svelte`), a card on home only when phrases are due: the `use` of
questions in my finished plays and ☆-saved deck cards, back after 1, 3, 7, 14, then every 30 days; ≤ 3 a day. One card
at a time (`PhraseCard`): もう一度 (tomorrow) or 覚えた (a step on), 今日はスキップ. Kept per player on this phone
(`island.english.phrases`); ≤ 4 banks fetched, a failed one passed over. Counted `act:english.phrase.*`.

## フレーズ

**The deck** (`catalog.ts deckOf` at build; rules in `catalog.test.ts`): a live B1 question's `use` with its Japanese,
short, its segment ≤ 15 s, one card per phrase; shipped as `catalog.ts SHARDS` (12) files `english/p/<n>.<v>.json`, a
card in `fnv(clip/qid) % 12`, versions in the index's `DECK`, each ≤ 32 KB gzipped (`load-budget.ts`). **The page**
(`deck.ts`, `Phrases.svelte`, `PhraseCard.svelte`): 5 a set, seeded per player, place kept (`island.english.deck`);
today's and the next 2 plan clips skipped. Back of a card: Japanese, the line, one shared embed, ▶ この場面を聞く, ☆
復習に入れる. Counted `act:english.deck.*`.

## The player

The youtube-nocookie embed driven over postMessage (`enablejsapi=1`, `origin=`; seekTo / playVideo / pauseVideo /
cueVideoById); no `iframe_api` script (it would need a third-party `script-src`). A segment pauses 0.4 s past its end.
CSP `frame-src https://www.youtube-nocookie.com`; the iframe's `referrerpolicy="strict-origin-when-cross-origin"` (the
site's `no-referrer` gets error 153). `playsinline=1`, `controls=0`, our `Controls.svelte` (44 pt). States: offline,
unavailable, not started (iOS wants a tap). **字幕** cycles オフ → 英語 → 日本語 (YouTube's
tracks and auto-translation; we never render dialogue); **字幕の大きさ** 小 / 中 / 大 / 特大 = `fontSize` -1..2.

**The log**: `npm run logs -- --event english.fail` (`bank`, `deck`, `embed`, `hello`, `stuck`; clip, online).

## Scene summaries

場面のあらすじ: our own short Japanese outline, a sentence every 10-20 s, never a line's words.
`lib/english/scenes/<video id>.json` `{ video, scenes: [{ t: [from, to], ja }], beats? }`; beats carry a move `k`
(`scenes.ts BEAT_KINDS`); `scenes.test.ts` holds shape and lengths. One fixed-height line under the video at the
playhead (`scenes.ts atTime`), never on a question card (it would answer gist items); tapped: the full list
(`Scenes.svelte`). ツール's switch hides it (`prefs.ts`).

## Transcripts

セリフ: the clip's full English text with our Japanese when written (text ships, audio never).
`lib/english/transcripts/<video id>.en.json` `{ video, lines: [{ t, en }] }` from the local whisper pass (`npm run
english:transcripts -- <out dir> [--ids a,b] --write`), and `<video id>.ja.json` line for line (`transcripts.test.ts`).
A transcript without a clip stays unused. ツール's セリフ（全文）: the playhead's line marked, tap to play from it.

## Progress

A `listen` row (`gm` 'tv', `u` the clip id; `contract/listen.ts`) when まとめ is reached (`f: 1`), or without `f` when
left part-way with a minute or more unsent. `ms` is active study time (video playing visibly, plus a question's time
with input in the last 60 s, ≤ 90 s a question). Its owner gets it whole, everyone else `{d, g, ms, gm, f?}`.

- **A day** (Tokyo) counts when a まとめ is reached; weeks start Monday. **今週**: three dots, then 「今週の3日、達成」.
  Never 0日, 途切れた, リセット, 残念.
- **「3日の週」 run**: a 3+ day week adds one, 1-2 days or one empty week hold it, two empty weeks end it silently.
- **これまで N本**: distinct clips finished; minutes are information only.
- **The partner** (members only): today's clip done, the week's dots. Never minutes or runs.
- **これまでの記録** (`History.svelte`, `progress.ts playsOf`, `HistoryPlay.svelte`): my own plays by month (a play is
  a clip's rows up to its `f` row, as `draw.ts historyOf`), counts only; a play's page shows each question's answer,
  line and notes, never the pick. Counted `act:english.history.*`.

## Flags

⚑ 報告 on the clip card and every question: kind chips (答え, 聞こえた言葉・字幕, 問題文, 再生の位置, 解説, その他) and a
note (≤ 200). An `eflag` event (`contract/eflag.ts`, `FlagSheet.svelte`: clip, question, kind, note, player time,
content version `v`), anyone's, the guest's too; ⚙ → 報告した内容 lists them (確認待ち / 確認済み). Review from
`relay/`: `npm run flags` (open flags by clip; uses `english:hashes`), `npm run flags -- done <id> fixed|kept
"note"` (an `eflag_done` from member A).
