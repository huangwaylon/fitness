# 0003 — Economy: Fruit, Jar, Tickets
**Status:** Accepted (round 1). Resolves C2, C5, C6 and C8. Currency superseded by [0006](0006-yen-single-currency-and-accountability.md), goal and shortfall bank by [0008](0008-open-ended-savings-per-fruit-rate.md), ledger and locking by [0015](0015-google-sheet-backend.md) (compute-on-read).

**One sentence:** *Healthy habits grow fruit; every Sunday your fruit fills the vacation jar and earns treat tickets.*

**Decision.**
1. **Pre-commit.** On day 1 the couple moves the vacation budget (default $3,000) into a separate savings account, either up front or as a monthly standing transfer. The app is the ledger. Humans move money, prompted by a monthly "Transfer Day" reminder. No bank APIs.
2. **Jar (vacation $).** Weekly allotment = budget / 52 (≈ $57.69). Split into **Partner A share 42.5%**, **Partner B share 42.5%**, **Team share 15%**.
   Personal share pays `min(score/85, 1)`. Team share pays at the lower partner's ratio.
3. **Tickets (treat $).** A separate treat budget (default $50/month). Each week **both partners score ≥ 60** → +1 ticket (≈ $11.50). Tickets are redeemed in the Shop. At least half the Shop items are non-food (class, massage, movie, plants), and big items need both partners to agree.
4. **Unearned money** is never lost. It stays in savings. Extra fruit (85–100) recovers earlier shortfalls. Whatever is still unclaimed at year-end stays as ordinary savings, or goes wherever the couple chooses at setup.
5. **Settlement timing.** The Sunday 7:30 pm ceremony pays a **provisional** amount for Mon–Sun. Days finalise at D+2, and a Wednesday job adds **top-ups only**, never clawbacks. The ledger is append-only with idempotency keys.
6. **Display.** Daily feedback is fruit only. Dollars appear at the Sunday ceremony, plus a quiet "≈ $X so far this week" line on the Jar screen.

**Dropped** (complexity): Miles as a separate currency, Bells, Lost & Found, Rainy Day, Stretch/upgrade fund, daily "+$" chips, and per-meal grading.

**Worked numbers** ($3,000 jar, both partners at a similar level):

| Typical weekly score | Jar at year end (approx.) |
|---|---|
| ≥ 85 | $3,000 (full) |
| 75 | ~$2,650, plus whatever extra-fruit weeks recover |
| 60 | ~$2,100 |
| 40 | ~$1,400 |

## Round 2 amendments (supersede the matching items above)
- **Tickets:** each person scoring ≥ 60 earns **½ ticket** per week, and a paused week counts as ≥ 60. This replaces "both ≥ 60 → 1 ticket", so one partner's rough week never costs the other.
- **Team share:** a partner on a paused week counts as ratio 1.0.
- **Shortfall bank (extra fruit):** per person, `S += (1 − min(score,85)/85) × personal_weekly`. Then `recovery = min(S, max(0, score − 85)/85 × personal_weekly)` and `S −= recovery`. It applies to personal shares only. It's computed sequentially from week 1, with ledger key `recover:<person>:<week>`. Weeks excluded by a long pause add their personal share to `S`.
- **Locking:** Sunday 19:30 writes provisional `earn:` entries. **Wednesday 04:00 is the final pass** (all days ≥ D+2): it writes `topup:` = max(0, final − provisional), then the week locks. Edits to locked weeks are rejected with a friendly message.
- **Transfer Day** moves the total of ledger entries *created* in the previous calendar month.
- Year-end table assumes steady weekly scores. Revisit "85 = full share" after Season 1 using real data.
