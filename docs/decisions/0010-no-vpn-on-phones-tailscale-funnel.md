# 0010 — No VPN on the phones: Tailscale Funnel on the Mac only
**Status:** Accepted (round 4; user input). Supersedes the network parts of 0005 and the Tailscale-on-iPhone setup in 0001.

**User input:** avoid Tailscale or any VPN running on the phones; something simpler, e.g. ngrok or GitHub Pages + a spreadsheet.
Detail: the round 4 software-engineer memo (git history) and the [runbook](../ops/runbook.md).

| Option | Verdict |
|---|---|
| **Mac + Tailscale Funnel** (public `https://<mac>.<tailnet>.ts.net`, Tailscale only on the Mac) | **Chosen.** ¥0, no domain, TLS terminates on the Mac (the relay can't read traffic), stable hostname |
| Mac + Cloudflare Tunnel | Runner-up. Needs a domain on Cloudflare (~$10/yr), and Cloudflare terminates TLS. Skip Cloudflare Access (awkward in PWAs) |
| Mac + ngrok | Rejected. The free browser warning page breaks the PWA; removing it costs ~$10/month |
| GitHub Pages + Google Sheets/Apps Script | Rejected. Pages sites are public except on Enterprise; Apps Script can't read request headers (no bearer tokens); no workable web push; health data would sit in Google |

## Decision
- The phones need **nothing installed** except the PWA (Add to Home Screen), Health Auto Export and two gym Shortcuts.
- **App-level auth (required now that the URL is public):**
  - **Pairing:** a one-time 6-digit code, shown on the Mac's admin CLI and entered *inside the installed PWA*, sets a long-lived, HttpOnly, signed session cookie per device.
  - **Machine tokens:** per-device, revocable bearer tokens for HAE (`Authorization` header on `/ingest`) and for the Shortcuts presence POSTs.
  - Rate limiting, failed-attempt lockout, and only `/ingest`, `/api/*` and static assets exposed. No admin endpoints over Funnel.
- **Fix the hostname before pairing** (the Mac's Tailscale machine name). Renaming it later means re-pairing and re-subscribing push.
- Web push works from the public HTTPS origin unchanged.
