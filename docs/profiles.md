# Participant Profiles
| | Partner A | Partner B |
|---|---|---|
| Villager name | ウェイ | うめ |
| Sex | Male | Female |
| Age | 29 | 26 |
| Height | 175 cm | 153 cm |
| Weight | 66 kg | 55 kg |
| BMI | ~21.6 (healthy range) | ~23.5 (healthy range) |
| Devices | iPhone + Apple Watch (often iPhone only: [ADR 0017](decisions/0017-round-4-rule-changes-and-rule-versions.md)) | iPhone + Apple Watch |
| Fitness level / history | TBD (calibration weeks of Nov 2 and Nov 9) | TBD (calibration weeks of Nov 2 and Nov 9) |

**Implication:** both are in the healthy BMI range, so the program is about **fitness, strength, habits and maintenance**, not weight loss.
Body-size differences mean active-energy (Move ring) numbers aren't comparable between partners, so goals use minutes or are relative to each person's own baseline.

## Context (added 2026-10-28)
- **Location:** Japan (JST, metric, ¥). Currency for all rewards: **yen**.
- **Gyms:** **Partner B (F, 26)** trains with a **personal trainer**. **Partner A (M, 29)** has an **Anytime Fitness (Japan)** membership.
- **Design constraint:** the app must be super simple: few pages, little text, readable at a glance.
- **Language:** app UI in **Japanese by default**, switchable to English.
- **Budget confirmed:** Trip Jar ¥520,000/yr (¥10,000/week); Treat Purse up to ¥104,000/yr (¥1,000 per person per week at ≥ 60 fruit). *(Now an estimate only: ¥50 per fruit, [ADR 0008](decisions/0008-open-ended-savings-per-fruit-rate.md).)*

## Eating patterns (added 2026-10-28)
- Cook at home on weekdays; sometimes eat out at weekends.
- **Partner B:** works from home all week; sometimes skips lunch; often snacks (potato chips).
- **Partner A:** in the office 3 days a week; eats lunch out on those days.
- **Neither drinks coffee or alcohol.**

## Answers (2026-10-28, round 4)
- No regular sweet drinks → "no sweetened drinks" habit stays dropped.
- **No fixed destination or goal:** save as much as possible. ¥520,000/yr is only a *calibration* for how much each action earns.
- Always-on **Mac at home**: yes *(superseded: no Mac needed, [ADR 0015](decisions/0015-google-sheet-backend.md))*. Location: **Tokyo**.
- **Neither wears the Watch to bed** → sleep can't be measured automatically.
- No health conditions.
- Wants **no VPN app (Tailscale etc.) running on the phones**; something simpler (ngrok or similar) *(superseded: the Apps Script web app, [ADR 0015](decisions/0015-google-sheet-backend.md))*.

## Answers (2026-10-29)
- Villagers from the 10-villager roster, named **ウェイ (A)** and **うめ (B)**; しずえ hosts.
- Use the official Animal Crossing art; the repo stays public for now ([ADR 0018](decisions/0018-official-art-public-site.md)).
- No privacy rules, no alerts ([ADR 0016](decisions/0016-no-privacy-no-alerts.md)).
