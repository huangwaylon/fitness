# Speech test

Whether the relay's Whisper (Workers AI `@cf/openai/whisper-large-v3-turbo`) understands us well enough and fast
enough on our iPhones; 英語すごろく's speaking step ([sugoroku](sugoroku.md#speaking), off by `game.ts SPEAK`) is built on
it and waits for this page's results. Safari's own recogniser is out: it needs Siri turned on.

## The page

`/speech`, from English Study's ⚙ (音声認識テスト ›) or すごろく's new-game screen; ‹ goes back there. Pick one of eight everyday sentences (short to long, a few
with joins like "want to", "got to", "did you"), or say anything. Tap to record, tap again to stop (10 s at most).
The page shows:

- **What was heard**, and each asked word heard or missed. The match is 1 − the word error rate. Case, punctuation and
  contractions don't count (lib/speech/match.ts).
- **Times:** the take's length, the phone's decode and resample to 16 kHz WAV (`変換`), the network both ways (`通信`),
  the model's own time (`認識`, from the relay), and the total from tapping stop to the text.
- **A summary** of the session's takes: the median total and the median match.

The mic is asked for only when 録音 is tapped. The site's Permissions-Policy allows `microphone=(self)`.

**The mic and the island's sound.** WebKit refuses getUserMedia under the island's iOS audio session (`ambient`, or
`playback` under a lesson's video: `InvalidStateError`). So the page (and 英語すごろく's speaking step, for the take)
holds the floor (sound.svelte.ts `micFocus`): the session `play-and-record`, the island's audio paused, no tap sounds;
leaving (‹ or the browser's back, mid-take too) closes the mic, sends nothing and puts both back. getUserMedia is asked
with plain `{ audio: true }`, in the tap, once however fast the taps. A take under 0.3 s or all zeros (a muted mic)
isn't sent (`empty`, `silent`). A refusal says why on the page, in plain Japanese, with the error's name.

**The upload.** The silence at either end of a take is cut before it goes (match.ts `trimSilence`: 20 ms frames, a gate
at −35 dB of the loudest, 0.3 s kept before the first sound and 0.4 s after the last, never a pause inside). An upload
that never reaches the relay (fetch throws) is sent once more after 0.3 s, the same WAV (the relay keeps nothing),
logged once as `stt.retry`. As the page or a speaking step opens, an empty POST warms the relay (the connection up, the
CORS preflight cached), at most once in 30 s.

## The relay

`POST /stt` (relay/src/sttRoute.ts):

- Needs a person's key in `Authorization` (the guest's isn't one).
- Takes a WAV of at most 340 KB (10 s). An empty body is a warm-up: 204, never logged or counted.
- Answers `{ ok, text, words?, aiMs }`, or 401, 413, 429 (`STT_DAY_MAX` calls a role a UTC day, 100), 502, or 503
  (`STT_OFF`).
- The model gets only the audio and `language: 'en'`, never the sentence asked for.
- **Nothing is kept:** the audio and its text live for the request only.
- The relay's `stt` log line has sizes, ms and the outcome.

## What's logged

Each take sends one phone event, `speech.test`: the take's seconds and the seconds sent (`sentS`), the WAV's KB, each step's ms, the match, the
sentence's index (`lvl`, −1 for free speech), ok or why not. A refusal adds getUserMedia's error (`gum`, `msg`), the mic's permission
(`perm`), the home-screen app (`pwa`), and the island's audio context and session as the page opened (`ctx`, `sess`)
and as the mic was asked (`sessNow`); a take adds its recording's KB and type, whether it decoded, its loudest sample
(×1000) and a muted track. Never the audio or what was heard. Read the results with
`npm run logs -- --event speech.test --since 1d` in relay/.

A retried upload adds `stt.retry`: the first try's time to its error and its message, online, shown, a service worker
in control, and how the second went.

## Deciding

It is good enough if, on both phones, a 5 s sentence comes back in about 2 s or less (median total), and read
sentences match at 0.9 or better: then すごろく's speaking step is turned on. If not, it stays off.

**Where it stands:** phone A (2026-11-19, home-screen app): matches 0.8–1.0, median total ≈ 2.25 s (the model's
1.0–2.9 s is the spread; the network 0.5–0.9 s), two of eight uploads lost before the relay (hence the retry and the
warm-up, which bring the expected median to ≈ 2.0–2.1 s). The relay's /stt uses 9–14 ms of CPU a call (the Free plan's
nominal limit is 10 ms): none cut off yet. Phone B: not measured yet.
