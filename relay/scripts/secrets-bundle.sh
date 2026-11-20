#!/bin/sh
# The secrets bundle (docs/ops/runbook.md#6-backups "The secrets bundle"): every Worker secret this Mac holds a copy of,
# by Worker, encrypted straight to the archive's age recipient (the plain text is never on disk, never printed).
#   sh relay/scripts/secrets-bundle.sh   (from the repo; again after any rotation)
# Reads ~/.config/island-fund/keys, ~/.config/gym-bot/secrets.env, ~/.config/its-bot/{secrets.env,vapid-private} and
# relay/.smoke-keys; writes ~/.config/island-fund/secrets-bundle.age (600). Upload it nowhere; commit nothing.
set -eu
C="$HOME/.config"
SMOKE="$(dirname "$0")/../.smoke-keys"
OUT="$C/island-fund/secrets-bundle.age"
umask 077
[ -f "$SMOKE" ] || { echo "no $SMOKE" >&2; exit 1; }
bundle() {
val() { grep "^$2=" "$1" | head -1 | cut -d= -f2- | tr -d '\r\n'; }
sec() { printf '%s=%s\n' "$1" "$2"; }
echo "# Island Fund: every Worker secret we hold a copy of, by Worker. Made $(date -u +%Y-%m-%dT%H:%MZ)."
echo "# Restore one: printf %s '<value>' | npx wrangler secret put <NAME> [--env test]  (from relay/, its/worker/ or gym/)"
echo "# Not covered (no copy anywhere; reissue instead): docs/ops/runbook.md section 6, 'The secrets bundle'."
echo
echo "[worker island-fund-relay]  (relay/)"
for k in KEY_A KEY_B KEY_C; do sec $k "$(val $C/island-fund/keys $k)"; done
sec GYM_TOKEN "$(val $C/gym-bot/secrets.env GYM_TOKEN)"
echo "# ARCHIVE_TOKEN, HEALTH_TOKEN: no copy"
echo
echo "[worker island-fund-relay-test]  (relay/, --env test; also relay/.smoke-keys)"
for k in KEY_A KEY_B KEY_C; do sec $k "$(val "$SMOKE" $k)"; done
echo "# ARCHIVE_TOKEN, HEALTH_TOKEN: no copy"
echo
echo "[worker its-bot]  (its/worker/)"
for k in KEY_A KEY_B ITS_RUNNER_TOKEN ITS_HEALTH_TOKEN; do sec $k "$(val $C/its-bot/secrets.env $k)"; done
sec VAPID_PRIVATE "$(tr -d '\r\n' < $C/its-bot/vapid-private)"
echo "# GH_DISPATCH_TOKEN: no copy"
echo
echo "[worker gym-bot]  (gym/)"
for k in GYM_TOKEN KEY_A KEY_B LINE_CHANNEL_SECRET LINE_CHANNEL_TOKEN LINE_GROUP_ID NAME_A NAME_B; do sec $k "$(val $C/gym-bot/secrets.env $k)"; done
echo
echo "[GitHub huangwaylon/fitness: repository secrets]  (gh secret set NAME)"
sec ITS_HEALTH_TOKEN "$(val $C/its-bot/secrets.env ITS_HEALTH_TOKEN)"
sec CLOUDFLARE_ACCOUNT_ID 984dde81c150a207305c312cde950046
echo "# CLOUDFLARE_API_TOKEN, HEALTH_TOKEN: no copy"
echo
echo "[GitHub huangwaylon/fitness: environment its]  (gh secret set NAME --env its)"
sec ITS_RUNNER_TOKEN "$(val $C/its-bot/secrets.env ITS_RUNNER_TOKEN)"
echo "# ITS_IMAP_USER, ITS_IMAP_APP_PASSWORD and the applicant's fields (ITS_ADDR ITS_BANGOU ITS_BIRTH ITS_KANA_MEI ITS_KANA_SEI ITS_KIGOU ITS_OFFICE_NAME ITS_SEX ITS_STATE ITS_TEL ITS_ZIP ITS_ZOKUGARA): no copy"
echo "# variable ITS_LOG_RECIPIENT = $(tr -d '\n' < $C/island-fund/archive-age.pub) (public)"
}
bundle | age -R "$C/island-fund/archive-age.pub" -o "$OUT.new"
chmod 600 "$OUT.new"
mv "$OUT.new" "$OUT"
echo "wrote $OUT"
