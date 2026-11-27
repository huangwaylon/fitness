# Speech test

Does the relay's Whisper (`relay/src/sttRoute.ts STT_MODEL`) understand us well and fast enough on our iPhones?
すごろく's speaking step ([sugoroku](sugoroku.md#speaking), `game.ts SPEAK`) waits on it.

## The page
`/speech`, from English Study's ⚙. Say one of eight sentences or anything (≤ 10 s); it shows what was heard, each word
heard or missed (match = 1 − WER, `lib/speech/match.ts`), the step times and the session's medians. The mic is asked
only on 録音; the page takes the audio floor (`sound.svelte.ts micFocus`: WebKit refuses the mic under the island's
session). Silent or < 0.3 s takes aren't sent; silence trimmed; a failed upload retried once; opening warms the relay.

## The relay
`POST /stt`: a member's key; a WAV ≤ 340 KB (empty = warm-up, 204). `{ok, text, words?, aiMs}` or 401, 413, 429
(`STT_DAY_MAX` 100 a role a day), 502, 503 (`STT_OFF`). Nothing kept.

## What's logged
One `speech.test` event a take: sizes, step ms, match, sentence, outcome; never audio or text
(`npm run logs -- --event speech.test --since 1d` in `relay/`).

## Deciding
Speaking turns on when, on both phones, a 5 s sentence returns in ≤ ~2 s (median) and read sentences match ≥ 0.9.
Phone A measured close (≈ 2.0–2.25 s, 0.8–1.0); phone B not yet.
