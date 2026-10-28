# 0003 — Economy: Fruit, Jar, Tickets
**Status:** Accepted (round 1). Resolves C2, C5, C6 and C8.

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
