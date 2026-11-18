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

**The mic and the island's sound** (the bug of 2026-11-18: the home-screen app refused every take). The island sets
iOS's audio session to `ambient` (or `playback` under a lesson's video), and WebKit refuses getUserMedia under either:
`InvalidStateError: AudioSession category is not compatible with audio capture` (seen in the iOS Simulator's Safari
too). Safari worked only while its own storage had the sound off. So the page (and 英語すごろく's speaking step, for the
take) holds the floor (sound.svelte.ts `micFocus`): the session `play-and-record`, the island's audio paused, no tap
sounds; leaving puts both back. getUserMedia is asked with plain `{ audio: true }`, in the tap. A take under 0.3 s or
all zeros (a muted mic) isn't sent (`empty`, `silent`): one empty take had reached the relay as a bare 44-byte WAV.
A refusal says why on the page, in plain Japanese, with the error's name.

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
sentence's index (`lvl`, −1 for free speech), ok or why not. A refusal adds getUserMedia's error (`gum`, `msg`), the mic's permission
(`perm`), the home-screen app (`pwa`), and the island's audio context and session as the page opened (`ctx`, `sess`)
and as the mic was asked (`sessNow`); a take adds its recording's KB and type, whether it decoded, its loudest sample
(×1000) and a muted track. Never the audio or what was heard. Read the results with
`npm run logs -- --event speech.test --since 1d` in relay/.

## Deciding

It is good enough if, on both phones, a 5 s sentence comes back in about 2 s or less (median total), and read
sentences match at 0.9 or better. Then speaking can go into the deeper-English plan. If not, drop it or try something
else.

## Grade

`POST /grade` (relay/src/gradeRoute.ts): one 英語すごろく sentence (spoken, then confirmed) graded gently.

- Body `{ s, t, lv }`: the sentence (1–200 chars), the target word (lowercase), the seat's level (1–3). A person's key,
  CORS like `/stt`.
- Answers `{ ok, verdict: great|ok|tip, fixed, natural, also, tip, used, src: ai|wasei, aiMs }`, or 400, 401, 413,
  429 (`GRADE_DAY_MAX` calls a role a UTC day, 250), 502 (the model failed or gave no JSON), 503 (`GRADE_OFF`).
- First the Japanese-English list (relay/src/wasei.ts: mansion, テンション, challenge, open the TV…): a hit answers at
  once, no model, nothing spent.
- Else Workers AI `@cf/google/gemma-4-26b-a4b-it` (json schema, thinking off, temperature 0). The prompt is a cheerful
  friend's Japanese (〜だよ, 〜してみてね), no grammar terms, no scolding. The sentence is sent as `<s>` data.
- The relay cleans the answer: a tip with a scolding word or a grammar term, or over 50 chars, is dropped; `also` only
  on great; a placeholder `fixed` falls back to the sentence.
- No answer in 2.5 s: one identical second call, the first answer wins (the slow calls come alone); one call against
  the cap, the log says `hedged` and which `won`.
- About 6–8 neurons a call; two roles' caps (250 + 100 STT each) stay under the free 10k a day.
- **Nothing is kept:** the `grade` log line has the length, ms, verdict and source only; the phone's `sg.grade` the
  layer, verdict, ms and takes.
