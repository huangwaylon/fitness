# Speech test

Does the relay's Whisper (`relay/src/sttRoute.ts` `STT_MODEL`) understand us well and fast enough on our iPhones?
英語すごろく's speaking step ([sugoroku](sugoroku.md#speaking), off by `game.ts SPEAK`) waits on it. Not Safari's own
recogniser: it needs Siri on.

## The page

`/speech`, from English Study's ⚙ (音声認識テスト ›). Pick one of eight sentences or say anything; tap to record, tap to
stop (≤ 10 s). It shows what was heard, each word heard or missed (match = 1 − word error rate, `lib/speech/match.ts`),
the times (変換, 通信, 認識, total) and the session's medians. Permissions-Policy `microphone=(self)`; the mic is asked
only on 録音.

**The mic and the island's sound**: WebKit refuses getUserMedia under the island's audio session, so the page and the
speaking step take the floor (`lib/sound/sound.svelte.ts` `micFocus`: `play-and-record`, island audio paused) and give
it back on leave. A take under 0.3 s or silent isn't sent. Silence at both ends is cut (`match.ts trimSilence`); an
upload that never reaches the relay is retried once after 0.3 s (`stt.retry`); opening warms the relay with an empty
POST at most every 30 s (`lib/speech/stt.ts`).

## The relay

`POST /stt`: a person's key (not the guest's); a WAV ≤ 340 KB; an empty body is a warm-up (204, not counted). Answers
`{ ok, text, words?, aiMs }`, or 401, 413, 429 (`STT_DAY_MAX`, 100 a role a UTC day), 502, 503 (`STT_OFF`). The model
gets only the audio and `language: 'en'`. Nothing is kept; the `stt` log line has sizes, ms and the outcome.

## What's logged

One `speech.test` event a take: seconds, KB, each step's ms, the match, the sentence (`lvl`, −1 free), the outcome; a
refusal adds the error, permission and audio session. Never the audio or the text. Read:
`npm run logs -- --event speech.test --since 1d` in `relay/`.

## Deciding

Good enough if on both phones a 5 s sentence returns in about 2 s or less (median total) and read sentences match at
0.9 or better: then the speaking step is turned on. Phone A measured close (≈ 2.0-2.25 s, matches 0.8-1.0); phone B
not yet.
