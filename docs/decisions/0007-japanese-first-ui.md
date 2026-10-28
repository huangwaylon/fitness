# 0007 — Japanese-first UI, switchable to English
**Status:** Accepted (user input 2026-10-28)

**Decision.** The UI defaults to **Japanese (ja-JP)**, with a per-person setting to switch to English. Each partner can choose independently.
- **i18n:** all strings live in message catalogs (`ja.json`, `en.json`) from day one. The PWA uses a lightweight library (e.g. Paraglide or svelte-i18n with SvelteKit), and the native companion uses String Catalogs.
- **Typography:** rounded Japanese fonts with full JIS coverage under the SIL OFL (Zen Maru Gothic, M PLUS Rounded 1c). Latin numerals use Fredoka/Nunito for the big numbers.
- **Formatting:** `¥128,000` with a half-width yen sign and grouping (Intl with `ja-JP`, normalising the full-width ￥), JST dates like `10月28日(水)`, metric units.
- **Copy:** short and gentle in both languages. The banned-word list (PROPOSAL §3.9) gets Japanese equivalents (e.g. 失敗, サボり, チートデイ, 罪悪感, 太る).
- **Simplicity:** Japanese text is denser, so the per-screen word budget is counted in characters too (≈ 40–50 Japanese characters of non-numeric text per screen).
