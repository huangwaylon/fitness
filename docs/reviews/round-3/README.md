# Round 3: review of the implementation (lead summary)

Three reviews of the built MVP on branch `impl/phase-0-1`: [fitness + nutrition](fitness-nutrition.md), [motivation + UX](motivation-ux.md), [security + correctness](security-correctness.md). Every blocking/high item is fixed, with tests. Rule changes are recorded in ADR 0011.

| ID | Fix |
|---|---|
| **F1** Blocking: a week spanning two months could hold 7 Cozy Days and pay 100 | 3 per week (API + scoring) on top of 4/month |
| F2 rest bonus was free (strength never "hard") | Rest day = no strength day, no workout ≥ 45 min, none hard |
| F3 backdated Cozy Days on trained days | Today/yesterday only; refused on a trained day |
| F4 calibration zeroed by illness | Cozy Days count as data days |
| F5 正月 check-in still nagged | No reminder; sheet says 「お正月は食事チェックおやすみ」 |
| F6/M9 「おやつ OK」 chip | Removed |
| F7 habit wording | 「おやつに果物・ナッツ」, hints filled and shown for all habits |
| F8 Core Training auto-counted | Now asks "included strength?" |
| F9 confirmed visits uncapped | Max 2 per week |
| F10 three easy weeks in some years | Window Dec 25–Jan 1 (always two) |
| **M1** Blocking: gym prompt could eat the check-in push | One push/day by priority; visit questions in-app only; quiet 22:00–07:00 |
| **M2** Blocking: no harvest push | Sunday 19:30 harvest push (highest priority) |
| **M3** Blocking: 「何があった?」 mid-week | Only shown once the harvest is open |
| M4 「なし」 reads as "nothing" | 洋なし |
| **S1** High: anonymous flood locked both users out (Funnel = one IP) | Authenticate first, rate-limit per device; anonymous traffic has its own bucket |
| S2 pairing code burnable | 10 attempts/code, 20/10 min; runbook: re-run `npm run pair` |
| S3 `/%61pi/...` skipped the guard | Zones classified on the decoded path |
| S4 Mac off past Wednesday → harvest never opened | Catch-up runs provisional, then final |
| S5 rolling cookie never refreshed | Re-issued on page loads |
| S9 push endpoint SSRF | Only Apple/Google/Mozilla/Microsoft push hosts |
| S10 `DEV_PERSON` gated on NODE_ENV only | Also requires a dev build |

**Deferred (tracked, not blocking):** F11 strength type names need checking against a real HAE export (Phase 0) · M5 received high-fives not shown · M6 two primary actions on Island while a confirmation is pending · M7 payday copy · M8 per-person jar layers one tap deeper · M10–M12 copy polish · S6 split spends under ¥5,000 avoid approval · S7 transfer amount frozen before Wednesday top-up · S8 presence reads body before auth · S11 local backup snapshots unencrypted · S12 Docker bind-mount ownership.
