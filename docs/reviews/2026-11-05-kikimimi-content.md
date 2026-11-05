# ききみみ クイズ: content review (2026-11-05)

An English-teacher pass (Japanese adult learners, listening and phonology) over `app/src/lib/kikimimi/bank.ts`: all 144 items, against docs/kikimimi.md "Question types" and "Content". The bank is still 144 items (46 / 49 / 49). Two ids were renamed because their content changed: p2-phone → p2-camera and w3-breathe → w3-breath. The changed clips were spoken again and re-transcribed with whisper large-v3-turbo (whisper-cli, the same model the first pass used). Every rewritten clip is heard word for word.

## Verdict

The bank was in good shape. Most of the English is natural, the Japanese is accurate, the reply traps are TOEIC-like, and the num distractors are mostly real listening traps. The fixes below are about fairness: a word distractor that the sentence's meaning rules out, a num distractor that is only a digit swap on paper, wording that doesn't match the voice's accent, and the two whisper near misses.

## Changes

**word: distractors that didn't fit the sentence (meaning gave the answer away)**
- w1-cup: cub → cab ("Where's my cab?" makes sense; "my cub" doesn't).
- w1-walk: "I walk every morning" with *wake* → "Let's walk after lunch. It's good for you!" with walk / work / talk. All three fit, and US rhotic *work* is distinct.
- w1-sing: "Let's sing together" (*sink together* is nonsense) → "I love to sing in the bath." with sing / think / sink.
- w2-live: "live here" / *lie here* → "I'd love to live by the sea someday." (*lie by the sea* fits).
- w2-first: "came first" (*came fast in the race* is ungrammatical) → "I was first in the race today!"
- w2-best: rest → test.
- w2-read: "Can you read this for me?" (*need this for me* doesn't fit) → "Who's going to read first?" with read / lead / leave.
- w3-breathe: breathe / breed / bleed ("forget to bleed") → w3-breath, "Okay, take a breath and go again!" with breath / break / bath.
- w3-kitchen: "left it in the kitchen" (*in the chicken*, *in the kitten*) → "I've never seen such a big kitchen!" ("Wow" was dropped: whisper heard Daniel's "Wow" as "Well".)

**pic**
- p1-coffee: no distractor was heard in the line → "No juice for me, thanks. I'll have a coffee."
- p2-phone → p2-camera: the art is a cordless phone, so "take a picture with my phone" was wrong for the picture → "I meant to bring my laptop, but I only brought my camera."
- p2-scale: UK voice, so "the scale" → "the scales".
- p3-butterfly: says "ladybug" (UK would say *ladybird*), so the voice changed UK → US.

**num: digit swaps (a reading trap, not a listening one) and a far distractor**
- n1-price-2: 18,000 → 1,800 (eight hundred / eighteen hundred).
- n3-steal-2: 84,800 → 40,800. n3-loan-1: 89,000 → 90,800 (98,000 is Nook's real first loan).
- n3-turnips-2: 89 / 99 → 88 / 90. n3-meteor-2: 2日 (second) → 22日 (twenty-second vs twelfth).
- These are choice changes only; the spoken sentences are unchanged, so no clips were redone.

**reply**
- r2-caught: "Who caught this sea bass?" (heard as "the") → "Who caught that sea bass?"
- r3-boxes: in non-rhotic UK, *boxes* and *boxers* are nearly the same → "Mind giving me a hand with this box?", with the replies to match.
- r2-break: US voice, so "Shall we" → "Should we".
- r3-picnic: "We had one." was a plausible decline → "Yes, I picked it up." (a sound trap).

**Japanese**
- n3-loan: たぬきち's ending だも → だなも.
- n2-days: 「この しまに きて 14日。」→「…14日に なるよ。」
- w3-hold: 「キープ… あと 5びょう！」→「そのまま キープ… あと 5びょう！」

## Checked and kept

- The accent pairs: UK can't / can (distinct vowels); AU sore / sure / short, thought / fought / taught (non-rhotic, the same vowel); US hat / hut and hard / hot. There is no walk/work in a UK voice, and no cot/caught in a US voice.
- The flapped t: the n1-reps and n1-birthday teens and tens. Choices like 13 / 30 / 3 carry the stress cue, and whisper hears them right.
- p1-tarantula, p1-octopus and p1-snowman test a noun more than the sentence. They are kept as easy level 1 katakana-trap items (the spec names tarantula).

## Remaining concerns

- **TTS voices.** Only Samantha, Daniel and Karen are installed, so both genders of an accent share one voice: a male villager speaks with a female voice in US and AU, and a male voice speaks for UK women. Daniel also flattens weak forms ("this" → "the"). Installing the Premium voices (Ava/Evan, Serena/Jamie, Matilda/Lee) would fix the gender mismatch and likely the clarity, and the script would re-speak everything. The listening check would then need to run again.
- **Level 3 reductions are written, not spoken.** `say` reads "gotta", "wanna", "should've" and "Where'd" fairly carefully. Real connected speech (*whaddya*, *gonna*, flapped "got a") is milder than a learner will meet. That needs human recordings or a neural TTS.
- **Contrastive stress.** Several pic items rely on it ("Not the kettlebell, the dumbbell!"), and `say` stresses it only weakly. The sentences still work by word order.
- **Slow clips** (70% rate) were not re-transcribed. They are usually clearer, but a person should still listen through them.
- **US/UK splits.** The num answers accept quarter past / to in a US voice, and "twenty-five past four" in a US voice is understood but less usual. That is fine for learners.
