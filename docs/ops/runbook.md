# Runbook: running Island Fund on the home Mac

One Mac, Tailscale only on the Mac (ADR 0010), the app in Docker on `127.0.0.1:3000`, public HTTPS via Tailscale Funnel. Items marked [U] still need checking on real devices.

## 1. One-time Mac setup
1. **Power:** connect the Mac to a UPS, then run:
   `sudo pmset -a autorestart 1 sleep 0 disksleep 0` (restarts after a power cut and never sleeps).
   Turn on FileVault. Set Docker Desktop to start at login.
2. **Tailscale (Mac only):** install it and log in. In the admin console:
   - Enable **MagicDNS** and **HTTPS certificates**.
   - Rename the machine to **`island`**. Do this **before pairing anything**. Renaming later means re-pairing both phones and re-subscribing push.
   - **Disable key expiry** for this machine.
3. **App:**
   ```sh
   cd app && cp .env.example .env
   npx tsx scripts/vapid.ts >> .env        # then delete the duplicate empty VAPID_* lines
   docker compose up -d --build
   ```
4. **Funnel:** run `tailscale funnel --bg 3000`. The first run may ask you to allow Funnel in the tailnet policy. Check it with `tailscale funnel status`.
   The URL is `https://island.<tailnet>.ts.net`. Only `/ingest/*`, `/api/*` and the PWA are served, and there are no admin endpoints.

Upgrade: `git pull && docker compose up -d --build`. Migrations run automatically on boot.

## 2. Pairing the phones (PWA)
1. On each iPhone, open the URL in Safari, choose **Share → Add to Home Screen**, then open the app **from the Home Screen icon**. The installed app has its own cookie jar.
2. On the Mac, run `docker compose exec island node scripts/pair.ts A` (or `B`). This prints a 6-digit code that works once, for 10 minutes, with 10 attempts. The URL is public, so a stranger can burn a code with wrong guesses; if pairing says the code is invalid or busy, wait a few minutes and run it again.
3. Type the code into the installed app. The app sets a session cookie for about a year.
4. In the app, tap **Enable reminders** to turn on web push.

Devices: `docker compose exec island node scripts/devices.ts` lists them. Add `revoke <id>` to revoke a lost phone or a leaked token.

## 3. Health data from the phones (iOS Shortcuts)
Follow [shortcut-health-sync.md](shortcut-health-sync.md). A built-in Shortcut sends steps, exercise minutes and workouts to `/ingest/shortcut/A` (or `/B`) when you open an everyday app, at most hourly. No third-party app is needed. Token: `docker compose exec island node scripts/token.ts A shortcut "A iPhone"`; the same token works for the gym Shortcuts below.

## 4. Gym Arrive/Leave Shortcuts (per phone)
Token: the phone's Shortcuts token from §3 (or a separate one: `node scripts/token.ts A shortcut "A gym"`). Place keys come from `PLACES` in `.env`; the defaults are `anytime` (A), and `pt_studio` and `anytime_b` (B).
In **Shortcuts → Automation**, create a **new Arrive automation** at the gym address. Choose **Run Immediately** and allow it to run while locked. Add the action **Get Contents of URL**:
- URL `https://island.<tailnet>.ts.net/api/presence`, Method **POST**
- Headers: `Authorization` = `Bearer isl_…`
- Request Body **JSON**: `place` = `anytime`, `event` = `arrive`

Duplicate it as a **Leave** automation with `event` = `leave`. If adding the header is awkward, put `token` = `isl_…` in the JSON body instead [U].
After a visit of 30 minutes or more with no Watch strength workout, the app shows 「筋トレとして記録する？」 as a card on the Island page (in-app only, no push).

## 5. Schedules (JST, in-process, idempotent)
- **Sun 19:30:** provisional pay (`earn:*` ledger entries). The harvest overlay opens.
- **Wed 04:00:** final pass. It writes top-ups only, then locks the week.
- **20:00:** check-in reminder (skipped if already checked in or on a Cozy Day). **25th, 12:00:** payday reminder.
- Missed runs (Mac off) catch up on the next boot. To preview what the current rules would pay: `node scripts/recompute.ts --dry-run`.

## 6. Backups (the ledger can't be recreated)
- Every night, `scripts/backup.sh` makes a `sqlite3 .backup` snapshot, checks it with an integrity check, then runs `restic backup` to a bucket **outside Kantō**, encrypted on the client side. Run it from launchd or cron on the Mac host, with `RESTIC_REPOSITORY`, `RESTIC_PASSWORD_FILE` and the bucket credentials set. Keep the restic password somewhere off the Mac as well, such as a password manager.
- **Monthly restore drill:** `scripts/restore-drill.sh` restores the latest snapshot to a temp folder, runs an integrity check and prints the ledger totals. Compare the totals with the Jar screen.
- Health metrics can be re-sent from the phones (run the baseline Shortcut from shortcut-health-sync.md §5). Check-ins, promises, presence and the ledger exist only in the DB.

## 7. Troubleshooting
| Symptom | Check |
|---|---|
| Shortcut gets 401 | Token revoked or mistyped; the URL person must match the token's person (403 `person_mismatch`) |
| Shortcut gets 413 | The body is over 20 MB: shorten the date range |
| PWA asks to pair again | Cookie lost (reinstalled app); run `pair.ts` again |
| No pushes | `VAPID_*` set? Reminders enabled inside the installed app? Only one push per day by design |
| Logs | `docker compose logs -f island`. Payload bodies are never logged |
