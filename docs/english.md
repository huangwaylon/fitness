# English Study

The leaf menu's 英語 opens **English Study**: one real TV clip a day, ~15 min: watch, answer 6–8 questions with
replays of the exact segment, read short Japanese notes. Solo; the guest has its own progress. Code
`app/src/lib/english/` (strings `i18n.ts`). Copy casual (〜よう, 〜だよ, never です/ます) with sheet kanji; never red, ×, a
sound, a score or a percentage; nothing locked ([decisions](decisions.md#english-and-food-data)).

## Content
A clip (`types.ts` Clip, one file each in `clips/`) is an official YouTube video plus our lesson: segments, English
questions, Japanese notes (言っていること / 意味 / 迷いやすい点 / 使えるフレーズ), a `cue` for a second listen. A question quotes
one short line at most (*key words* starred); no audio ships. Each question has a never-reused `id`, `skill`, `level`
(B1–C2), `point`, `reveals`, optional `ctx`; `retired` takes it out (never deleted).
- **The draw** (`draw.ts`, pure, seeded by player, clip and play): 6–8 items, an easy opening (a B1 listening item in
  the first three, never a dictation), one gist, ≤ 1 C1 and ≤ 1 each of dictation, humor, predict, pragma, unseen
  first; C2 only with ⚙ 難しめの質問を増やす. Numbers in `draw.test.ts`.
- **The plan** (`plan.ts`, kept in `plan-order.ts`, `npm run english:plan`): one clip order on every phone, a slow ramp
  by ease, `// A2 LATE:` banks last, varied by show; new clips go after it.
- **Rules** (`clips.test.ts`, its markers `// SKIP`, `// EXCLUDE`, `// SWEAR-OK`): for an A2 learner, B1 the bulk, 3
  parallel choices, the key never the longest; `// A2 RAMP` (first 30 banks) eases distractors; notes never say 不正解,
  間違い or 残念. Tools: `npm run english:wpm` (speed bands), `english:segs` (segments from json3 word times).

## Data
vite.config.ts `english-data` builds from `clips/`: **the index** (`catalog.ts` ClipMeta in plan order, `v` =
`clipHash`; nothing else imports `clips/`) and **a bank a clip** `english/c/<id>.<v>.json` (scenes and transcript
added), fetched when its lesson opens; home prefetches today's, next, part-way and review banks. Cache
`island-english-v1`, never precached. `app/scripts/load-budget.ts`: the sheet's chunk ≤ 80 KB gzipped.

## The page
Tabs **ホーム · フレーズ · すごろく** ([sugoroku.md](sugoroku.md)); levels pushed over them (library, lesson, これまでの記録,
⚙ with [speech-test](speech-test.md) and 報告した内容). ‹ goes back one level, ✕ closes.
- **The pill's dot** (`due.ts englishDue`): while today has no まとめ and the week is under 3 days; no push.
- **Home**: 今日の動画 (`progress.ts dailyOf`; 別の動画にする skips 14 days), 今週, これまでの記録, ライブラリ; もう一度 a
  finished clip with new questions at most weekly (`reviewOf`). A member sees the partner's line.
- **The library**: すべて, 短い動画 (≤ 2:30), by show; 場面で選ぶ (`collections.ts`).
- **Lesson**: the player pinned on top; 質問へ, ‹ 前へ / 次へ ›, まとめ always open; a card fits above the fold at
  393×852; 訳を見る records nothing. ツール (`StudySheet.svelte`): 字幕, size, speed, あらすじ, セリフ, phrases, ⚑.
- **A miss**: the segment again, the `cue`, 答えを見る; a second miss shows 「答えはこれ」. ◎ first try, ○ second.
- **まとめ** writes the row ([Progress](#progress)), lists scenes to hear again; おわる ignores a tap within 600 ms
  (`ui-state/tapGuard.ts`). ふりかえり replays the scenes, records nothing.

## Phrase review
`phrase-review.ts`: questions' `use` from my finished plays and ☆ cards, back after 1, 3, 7, 14, then 30 days, ≤ 3 a
day; もう一度 / 覚えた / 今日はスキップ. Kept per player on the phone (`island.english.phrases`).

## フレーズ
**The deck** (`catalog.ts deckOf`): a live B1 question's `use`, segment ≤ 15 s, one card per phrase, in `SHARDS` (12)
files ≤ 32 KB gzipped. The page (`deck.ts`): 5 a set, seeded, today's and the next 2 plan clips skipped; ☆ 復習に入れる.

## The player
youtube-nocookie over postMessage (no `iframe_api` script: CSP); a segment pauses 0.4 s past its end;
`referrerpolicy="strict-origin-when-cross-origin"` (`no-referrer` gets error 153); `playsinline`, our `Controls.svelte`.
**字幕** cycles オフ → 英語 → 日本語 (YouTube's tracks; we never render dialogue). Failures: `npm run logs -- --event
english.fail`.

## Scene summaries
場面のあらすじ: our own Japanese outline, a sentence every 10–20 s, never a line's words
(`lib/english/scenes/<video id>.json`, `scenes.test.ts`); one line at the playhead, never on a question card.

## Transcripts
セリフ: the full English text plus our Japanese (`lib/english/transcripts/<id>.en.json` / `.ja.json`, from the local
whisper pass `npm run english:transcripts`); text ships, audio never.

## Progress
A `listen` row (`gm` 'tv', `u` clip; `contract/listen.ts`) at まとめ (`f: 1`) or when left part-way after a minute.
`ms` is active time (≤ 90 s a question). Others see `{d, g, ms, gm, f?}`.
- A Tokyo day counts at a まとめ; **今週** three dots; never 0日, 途切れた, リセット, 残念.
- **The weeks' run** (`progress.ts runOf`): a 3+ day week adds one, a thin or one empty week holds, two empty end it
  silently. **これまで N本**: distinct clips. The partner sees today's done and the dots only.
- **これまでの記録** (`History.svelte`): my plays by month, answers and notes, never the pick.

## Flags
⚑ 報告 on a clip or question: a kind and a note (≤ 200) as an `eflag` event (`contract/eflag.ts`), anyone's. Review:
`cd relay && npm run flags`, `npm run flags -- done <id> fixed|kept "note"`.
