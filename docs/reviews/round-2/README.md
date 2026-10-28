# Round 2: Sign-off summary (lead)

All four reviewers signed off **conditionally**. All 15 blocking items were applied to `PROPOSAL.md` and the ADR "Round 2 amendments" sections.

| Reviewer | Blocking item | Resolution |
|---|---|---|
| Software engineer | B1 HAE automations max 7 days, so 12-week backfill impossible via automation | One-time Manual Export at onboarding (ADR 0001) |
| | B2 Extra-fruit recovery undefined | Per-person shortfall bank formula (ADR 0003) |
| | B3 No edit cutoff for top-ups | Wednesday 04:00 final pass, then week locks |
| | B4 "Never leaves your hardware" vs off-site backups | Reworded: client-side-encrypted backups |
| | B5 Data model missing tables | Added visibility_pref, cozy_day kind, redemption approval, transfer, habit_choice, etc. |
| Fitness coach | B1 Yoga/HIIT auto-counted as strength | Strength/Core/Pilates ≥ 15 min auto; others with a one-time tap |
| | B2 90-min daily cap lets B fill a week in one day | `min(90, max(60, ½ weekly target))` |
| | B3 Pause cap with no ramp-back | Longer pauses excluded (to shortfall bank), return at ×0.8 |
| Nutritionist | B1 "15 of 21" assumes 3 habits but plan grew to 5 | Always 3 habits; seasons swap, not add |
| | B2 Holiday leniency in wrong season | Holiday grace Dec 20–Jan 1 in Season 1 |
| | B3 No under-fuelling safeguard | Refuel tips + private monthly self-check |
| | B4 Banned-words list incomplete | Extended |
| Motivational coach | B1 "Both ≥ 60" ticket punishes the partner | ½ ticket per person ≥ 60; paused counts |
| | B2 Sick partner drags team share | Paused partner counts as 1.0 |
| | B3 Extra fruit could recover the partner's or team's shortfall | Personal shortfall only |

Non-blocking suggestions adopted: monthly cooperative quest; rest-day and together definitions; recovery hint on any one signal; Transfer Day by ledger creation month; Phase 0 measures VPN reliability; revisit 85 = full share after Season 1.
