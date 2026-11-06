# Wave 1 review (2026-11-06): the seven pilot units, before voicing

The panel: an EFL teacher for Japanese adults, a native English scriptwriter and a native Japanese reviewer (docs/curriculum-units.md §10: each wave is reviewed before voicing). We read every item, line, note, phrase, can-do and tier in app/content/units/ against §11–§12. We fixed the problems in the YAML, and the compiler, vitest, knip and build all pass.

## Verdict

**Ready to voice once the fixes below are in.** The brief holds: the lessons are short, the situations are ones the couple will really meet, and the humour lands. Highlights: Friday the 13th seats "up in the sky", the long goodbye that won't end, "the kids are going feral", the toast to "the worst singer", "she's right behind you", "How not cheap are we talking?", and the report that got pushed back, "Brilliant." The level is right: かわ is B1+ (short turns, one repair a clip, the clock and number traps), and もり is B2 (longer dialogues, implied meaning, polite service English, sarcasm). Each チェック tests its can-do: the corrected detail, the pre-closing and the agreement, the new plan versus a soft cancel, the when/where/what to bring, the friend's worry, the possible/impossible/charge, and a real plan versus a polite one. The phrases are everyday chunks, and their traps are the ones Japanese learners really fall into.

## What we fixed

- **Respellings that would have voiced the wrong word.** "I mean' the", "I can' make it", "I won' keep you", "I wouldn' miss it" (×2) and "Tex' me" would make TTS say *mean*, *can*, *won*, *would*: the distractor itself. We dropped those `tts` fields and kept the `drop` marks; natural speech elides the t on its own. We also dropped "f'tonight".
- **Answers that weren't clearly the best:**
  - kw-meant: "I mean" was also grammatical. It's now "when I said the bag, I meant…".
  - kr-last-bit: the last bit was a sign-off, not the missed word.
  - km-east-exit: "east… I meant east" corrected nothing.
  - kr-warm-up: "Sorry?" with nothing to repair, and a joke distractor.
- **Japanese errors:**
  - kn-push-time: "quarter to nine" was glossed 8時15分前.
  - The ask fields with kanji (6 in もり) are now kana with spaces, like the rest of the chrome.
  - dk-call-back asked "when do they meet?" though no meeting was said.
- **Dialogue flow:**
  - dk-fast-replan: one line both asked and answered "did you say the pub?". It's now three turns.
  - dk-wrong-time: a speaker "corrected" his own confirmation. It's now "Wait, no, Ebisu… Sorry, long day."
  - dk-surprise-hide: "It's a surprise, everyone!" was said to the people hiding, and the answer contradicted "wait for my signal".
  - dmu-wrong-dates: it had no closing.
- **Register and dialect:**
  - "What do you fancy?" was in an American host's mouth.
  - "The game was mad" was said by an American.
  - "Sure, take the tip on the left" was a pun distractor in もり. It's now a cultural TOEIC trap, "ten percent is normal".
- **Weak distractors replaced with real traps:**
  - "Sorry, I meant Friday" → "Fifty? Right by the stage!"
  - "Which bus is the show on?" → "which episode are you on?"
  - "Ten? I'll get two." → "see you at ten, then!" (ten minutes heard as ten o'clock)
  - "temples sell shoes" → "never take them off in a home"
- **Notes and translations:**
  - The so-that's note now names the answer it gives (Will do).
  - "till Sunday" no longer claims Monday is free.
  - A few translations read more naturally.
  - tr-guide's, tr-hotel's and wk-chat's ひとこと now have a real Japanese line, and tr-guide's is warmer ("I don't want this trip to end").
- **Recycling:** trimming kr-last-bit cost gl-clarify one recycled item (6 of 31). km-i-meant-tuesday now closes with "See you then!", which brings it back to 7.

## Left as written (deliberately)

- kw-heres-to: "Here's to" and "Here's two" sound the same, and the note says to judge by meaning. It's a nice aha moment, and the only item like it.
- The silly third distractors in かわ ("No, I'm not mad", "Feral? Like cats?"): one per item, for warmth. The second distractor is always the real trap.
- Two conventions for a mean item's `ja`: the answer's gloss (かわ) or the line plus 「→ つまり」 (もり). Both exist in the bank.

## For the ear, after voicing

- The dropped-t items (kw-meant, kw-make-it, kw-wont-keep, kw-wouldnt, km-wouldnt-miss, kw-text-me): is the t still faintly there, enough to tell *can't* from *can* and *won't* from *want*? This matters most for the US voices.
- The stress pairs: thirTEEN/THIRty (dk-gig-date, kn-fast-day), fourteen/four (kn-table), six forty/six fourteen (kn-time-fast). Is the contrast audible under the heavy café bed?
- AU "can't" [kaːnt] (mu-w-heard-cant) and UK "can't" (mu-w-cant-tonight): the vowel should carry it.
- "Tues-day" and "Up-stairs" spelt with hyphens (dk-call-back, dk-phone-clarify): they should sound deliberately syllabled, not glitchy.
- "letcha", "couldja", "didja": check none of them come out as a spelled word.
- "Hooroo!", "Barbie… arvo… legend": the AU voices should sound natural, not read.
- dk-gig-date's "One, three" and kn-apartment's "Two, oh, three" should be read as digits.
- Every phone and street clip: can the corrected detail still be caught at the heavy level? If not, drop it to light.
