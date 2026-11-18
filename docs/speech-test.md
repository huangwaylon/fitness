# Speech test

A test, not a feature yet: whether the relay's Whisper (Workers AI `@cf/openai/whisper-large-v3-turbo`) understands us
well enough and fast enough on our iPhones to build speaking into English Study. Safari's own recogniser is out: it
needs Siri turned on.

## The page

`/speech`, from English Study's すごろく tab (音声認識テスト). Pick one of eight everyday sentences (short to long, a few
with joins like "want to", "got to", "did you"), or say anything. Tap to record, tap again to stop (10 s at most).
The page shows:

- **What was heard**, and each asked word heard or missed. The match is 1 − the word error rate. Case, punctuation and
  contractions don't count (lib/speech/match.ts).
- **Times:** the take's length, the phone's decode and resample to 16 kHz WAV (`変換`), the network both ways (`通信`),
  the model's own time (`認識`, from the relay), and the total from tapping stop to the text.
- **A summary** of the session's takes: the median total and the median match.

The mic is asked for only when 録音 is tapped. The site's Permissions-Policy allows `microphone=(self)`.

## The relay

`POST /stt` (relay/src/sttRoute.ts):

- Needs a person's key in `Authorization` (the guest's isn't one).
- Takes a WAV of at most 340 KB (10 s).
- Answers `{ ok, text, words?, aiMs }`, or 401, 413, 429 (`STT_DAY_MAX` calls a role a UTC day, 100), 502, or 503
  (`STT_OFF`).
- The model gets only the audio and `language: 'en'`, never the sentence asked for.
- **Nothing is kept:** the audio and its text live for the request only.
- The relay's `stt` log line has sizes, ms and the outcome.

## What's logged

Each take sends one phone event, `speech.test`: the take's seconds, the WAV's KB, each step's ms, the match, the
sentence's index (`lvl`, −1 for free speech), ok or why not. Never the audio or what was heard. Read the results with
`npm run logs -- --event speech.test --since 1d` in relay/.

## Deciding

It is good enough if, on both phones, a 5 s sentence comes back in about 2 s or less (median total), and read
sentences match at 0.9 or better. Then speaking can go into the deeper-English plan. If not, drop it or try something
else.
