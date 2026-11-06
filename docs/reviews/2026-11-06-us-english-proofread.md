# US English cross-proofread (2026-11-06)

The panel: a second native American editor (not one of the four rewrite writers), an EFL teacher for Japanese adults and a native Japanese reviewer. After the US pass (もり d03ece1b, やま 307b9ab1, ほし + units + drafts 11e1b840, the bank, dialogues, ladders and アナウンス 0d8a4957) we read every item and dialogue line in bank1/4/5, dialogues, ladders, content/*.ts, content/units/*.yaml and content/listen/*.yaml.

## Verdict

**The US pass holds.** No UK/AU wording is left outside the `accent-exposure` items, and those use standard English with no slang. The arithmetic is right everywhere, including the tips, splits, the DST time-zone item, °F/°C and the date and phone corrections. Every dialogue's last line leads to its `next` answer. The near-duplicate test passes. The fixes below are small.

## What we fixed

- **Leftover UK phrasing (spoken):** "quick one" became "quick question" (dk-bday-call, dk-boss-call), "Same again?" became "Another one of those?" (dml-one-for-the-road), "had a look" became "taken a look" (yb-hit-pause), "Quick round" became "Quick update" (dyb-blocked), "services have resumed" became "service has resumed" (ho-trains-restored), "no water supply" became "a water outage" (a5-burst-pipe), "Package for number 12" became "Package for 12B" (d4-parcel-1), and cancelling/cancelled became canceling/canceled in fr-replan. We also changed shown-only text: "We'd got" became "We'll get" (ml-w-weve-got) and "Mark the date" became "Somebody mark the calendar" (ho-couldnt-agree).
- **Logic and realism:** Tokyo was given highs of 31 and lows of 13. It's now winter, 13 and 3, still teaching thirTEEN against THIRty (n4-highs). In call-missed-connection, a flight two hours late still beat tomorrow's 7:10, so the flight is now canceled. mw-surprise-time said "Doors at 7", concert talk, at a surprise party at home. ya-m-rocket repeated dya-escalate's "turn it off and on again".
- **Distractors:** a wrong choice in d4-gate-change was actually true. In yb-role-affected and km-cheers-thanks the choices didn't match who was being addressed.
- **Notes that were wrong for American English:** ［キャーント］ (the British vowel) in the can't notes (mu-w-cant-tonight, mu-w-heard-cant). Wrong stress claims in ho-exports, a5-behind and w4-better. Wrong meanings in ho-wasnt-worst, yb-bearer, yb-fill-out, kw-talk-soon, kw-at-mine and ml-w-wont. a5-press-three and ho-empire were also unclear.
- **Japanese that didn't match the rewritten English:** about 20 lines, including 開場 for setting up, 夫の両親 for in-laws, 晴れて始まる for "start dry", 会社の飲み会 for "my work thing", こんにちは for "Good evening", and the 5B neighbor memo.
- **Tags:** dya-hang-left had a US speaker but was tagged `accent-exposure`. We removed the tag, so yama-a now has 9 such items.

## Changed spoken text (to re-voice; karaoke timings dropped from words.json)

n4-highs, d4-parcel-1, a5-burst-pipe, dml-one-for-the-road-3, mw-surprise-time, ya-m-rocket, yb-hit-pause, dyb-blocked-1, ho-trains-restored, dk-bday-call-1, dk-boss-call-1, dk-movie-switch-2 (spelling only, so it may not need re-voicing), and call-missed-connection-6 (a draft).

## Variety clusters for a new-situations writer

- **Corrected numbers ("X, sorry, Y"):** sp-key-code (still a key code), a5-key-code, n4-gate, n4-water, n4-platform, a5-track. The listen calls all turn on a slot that changes mid-call (call-redelivery, -dentist-move, -prescription-ready, -installer-signal, -leak-again, -gp-callback), and the units' corrected times are another dozen (kn-*-time, dk-cut-out, dk-fast-wrap).
- **Medical:** six clinic or pharmacy settings at level 4 (r4-anything-else, r4-triage, w4-cant-uk, w4-id-ill, d4-receptionist, d4-cough-drive). The ladders' appointment slots are all medical too.
- **Transit PA:** nine train announcements and five airport ones in アナウンス. もり adds nine flight items and ほし five commute disruptions.
- **Hotel desk:** ml-* (7), d4-hotel-suite, r4-room-ready, m4-upgrade, plus the whole tr-hotel unit, which has three refuse-tonight-fix-tomorrow items and three checkout-fee items.
- **Customer-service phone calls:** about 14 in yama-b (the living room, escalation, fees waived).
- **Leases and landlords:** yama-b (6), r4-leak, m4-damp and d4-landlord (all Tom Nook, "sometime next week").
- **Exact repeats across files:** d4-installer is nearly the same as listen call-installer-signal (8 to 1, someone over 18 at home); the test doesn't see the drafts. rain check and ballpark are taught at both もり and やま. Kyoto crowds come up three times in yama-b. The phone digits 4473 appear in both ya-n-phone and call-gp-callback.
- **Openers:** wk-chat opens five times with "How was your weekend?"; tr-hotel and tr-guide use "Sorry, did you say X?" six times.
- **Settings:** the listen drafts are almost all set in Tokyo. An American diner, Target or a ballgame in the たちぎき items would help. d4-oat-latte still opens on a misheard name.
- **Speakers:** kk-slider is the radio host in all 7 of his ほし lines.
