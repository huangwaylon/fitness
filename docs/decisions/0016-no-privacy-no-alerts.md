# 0016 — No privacy rules; no alerts
**Status:** Accepted (user decision, 2026-10-29). Supersedes the visibility parts of 0004 and PROPOSAL §5 "Privacy", and the notification parts of 0005, 0011 and 0015.

**User input:** "Get rid of the concept of privacy: all data should be shown to all players." "No alerts are needed, remove and simplify."

## Decision
- **Everything is visible to both people:** each other's raw numbers (minutes, steps, days, ticks), scores, fruit and eating check-ins. The app no longer has sharing toggles or a 見せる範囲 setting. The `share` event type is ignored when reading (old rows are harmless) and no longer sent.
- **No alerts or reminders:** no notification settings, no reminder copy, no reminder Shortcut automations in the setup docs. In-app confirmations that belong to an action stay (the undo banner, a failed-save banner).

## Consequences
- Simpler model and UI: one person-card shape, no visibility state.
- The partner can see eating check-ins. The tone rules (no meal grading, banned words) still apply.
- Engagement relies on opening the app, not on prompts.
