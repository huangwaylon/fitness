# The ITS site: what the code cannot tell you

Sources: [申し込みから利用まで](https://www.its-kenpo.or.jp/shisetsu/moushikomi.html) (procedure, 申込受付期間一覧表,
cancellation), the [直営](https://www.its-kenpo.or.jp/shisetsu/chokuei/) /
[通年](https://www.its-kenpo.or.jp/shisetsu/keiyaku/tsunen/) /
[夏季](https://www.its-kenpo.or.jp/shisetsu/keiyaku/kaki/) /
[冬季](https://www.its-kenpo.or.jp/shisetsu/keiyaku/touki/) rosters, and
[notice id=144](https://as.its-kenpo.or.jp/column_comments/notice_info?id=144). **Measured** = from this repo's own
runs; **unverified** says so. `runner/test_its.py`'s `FakeITS` replays every
page below; **where this doc and the fake disagree, the fake is right.**

## 1. Published rules

- **Two channels.** Only 空き照会申込 is automated (抽選申込 is a lottery: speed wins nothing). Five applications a
  month per 記号番号.
- **Release instant**: what the draw left drops at **00:00 JST on the 照会開始日** (FY2026: the 27th of M−2; earlier
  years varied). **Per-year editorial: never hard-code it.**
- **Cutoff per facility**: **D−4** for 直営 (the three トスラブ), ブルーベリーヒル勝浦, 日光千姫物語, 熱海後楽園ホテル and all
  夏季/冬季; **D−10** for every other 通年.
- **Rosters**: `app/src/lib/its/roster.ts` is the one home (kind, cutoff, region, seasons, 利用不可日 per fiscal year
  from each facility's page; re-read each fiscal year). `ホテルハーヴェスト スキージャム勝山` is on no roster
  but stays in `SKIP_HOTELS` (skipping is free; dropping it would book it if re-contracted).
- **Names differ between the booking system and the rosters** (「グランドメルキュール伊勢志摩」 vs the roster's
  「グランドメルキュール 伊勢志摩リゾート＆スパ」); `is_skipped()` compares normalised names exactly, so use a name seen
  in a 「Found N hotels: …」 log line.
- **`PRIORITY_HOTELS = ['NAGU']`** is NAGU勝浦, 夏季 and 冬季 (D−4), not offered for stays past 9/30 until 冬季 opens.
- **Month-end two-night stays** open with the second night's month; one scanner thread per month.
- **Cancellation is the only later supply.** Web self-service until **D−10**; from D−9 50% and telephone-only
  (weekdays 09:00–17:00 JST); full price on the day. No waitlist: polling only.
- **Stay limits**: ≤ 2 nights per stay per facility, no overlapping applications at one facility, ≤ 10 rooms.
- **Only dates with vacancy are shown** (「{date}に空きがある施設です」, ~3 facilities), yet may lack a matching room.
- **Vacancy search pauses during a draw** (banner; timing **unverified**): looks like a quiet month.

## 2. Measured

- **A 503 with `<title>セキュリティアラート</title>` is a ~24-hour IP ban, not load** (アクセス過多, blocked 約24時間).
  Every recovered dump of it was on the scanner's `calendar_get`, the most frequent request. **Request volume is the
  dominant operational constraint**: a ban costs a day of every target date; bank what `SCAN_REUSE_SESSION` saves.
- **Dumps are not a census**: `DEBUG_DUMP_KEEP` prunes oldest-first. Read the bodies, not the timestamps.
- **22% of availability episodes start at exactly D−10, 57% within D−9…D−14** (the free-cancellation boundary).
- **Episodes last**: of 104 gaps, 38 are 20–21 s and 66 ≥ 1800 s. Design for a half-hour window.
- **Sessions die after ~30 s idle between steps**: run a chain back to back.

## 3. The official procedure and the 30-minute hold

Steps 1–4 choose facility, date and room behind the 画像認証; **step 5, 「予約手続きに進む」, starts the 30-minute
clock**; step 6 sends the mail; steps 7–9 are the emailed leg (URL, 申込する, 確認) and **only step 9 is 予約確定**
. `holds.json` records step-5 holds, `reservations.json` step-9 numbers. **The site
refuses a second application at a facility it already holds for us** (「空き部屋がございません」): the only bound on a
leaked hold, and why nothing tracks the 30-minute clock.

## 4. The request chain

Rails behind an AWS ALB: `_src_session` and the four `AWSALB*` cookies **must all survive** (one cookie jar per
thread). Redirects are never followed (`--max-redirs 0`): `-L` would land on `/service_category/index`.

| # | Request | Mints / needs |
|---|---|---|
| 0 | browser: `GET /` → `/calendar_apply` → Turnstile → `POST /calendar_apply` | 302 → `calendar_select?s=CALENDAR_S`. Cache **only** a URL containing `calendar_select` (others answer 200 and poison the cache) |
| 1 | `GET /calendar_apply/calendar_select?s=CALENDAR_S` | meta `csrf-token`, `authenticity_token`, `name="s" id="s"` |
| 1b | `POST /calendar_apply/calendar_select` (AJAX) | `join_date` (1st of month) + `s` only; CSRF in `X-CSRF-Token`; the whole month |
| 2 | `POST /calendar_apply/service_group_select` | `utf8`, `authenticity_token`, `join_time`, `s` → hotel list (the largest failure class) |
| 3 | `POST /calendar_apply/apply_service_select` | `+ empty=`, `service_group_id` → service list |
| 4 | `POST /calendar_apply/check_apply_service_coma` | `apply_service_id` → **302** `/apply/empty_new?s=APPLY_S` + new ALB cookies; no `empty_new` = failed |
| 5 | `GET /apply/empty_new?s=APPLY_S` | `authenticity_token`, `action="/apply/empty_create?s=…"` (FORM_S), `coma_search('…')` (COMA_S, URL-encode) |
| 6 | `POST /apply/empty_new?s=COMA_S` (AJAX) | room ids + `apply_session_guid`; `X-CSRF-Token` = the meta value; `Referer` = the **APPLY_S** URL |
| 7 | `POST /apply/empty_create?s=FORM_S` | **takes the 30-minute hold: the point of no return** → 302 `/apply/rule?s=RULE_S` |
| 8 | `POST` the `/apply/rule` form action | **the hidden `s` is mandatory** (else 302 `/service_category/index`); **no** `commit` (同意する is a button) |
| 9 | `POST /apply/send_complete?s=SEND_S` | **never retried**; `__token__` **and** `commit=送信` required, else an identical page and **no mail** |

- **Date cells**: `<td data-join-time="YYYY-MM-DD">` classed `empty` (○), `a_little` (few left), `full`, `over`.
  **Both `empty` and `a_little` are bookable**; matching `empty` alone skips the dates closest to selling out.
- **AJAX responses (1b, 6) are Rails-UJS JavaScript with backslash-escaped quotes**: extractors match `\"`. All four
  AJAX headers are required (without `X-Requested-With`: HTML or a redirect). Steps 8–9 answer 200, not 302.
- **Hotel names** are HTML-escaped and mix U+3000 with spaces: normalise before comparing.
- **A dead session**: a 302 to `/service_category/index` (itself a 404), 「セッションがタイムアウトしました」, or
  `parent.location.href='/service_category/index'` in an AJAX body. Not the §2 ban.
- **「…ご指定の施設において空き部屋がございません。」** with no form action is an ordinary lost race (often our own hold).
- **`authenticity_token` and `<meta csrf-token>` are valid for the session's life** (BREACH masking, no nonce store):
  one token serves steps 6 and 7, and `SCAN_REUSE_SESSION` depends on it. **`__token__`** (40 hex, email form only) is
  a separate, plausibly single-use nonce: re-read it every time.

## 5. The emailed leg

From `noreply@mail.its-kenpo.or.jp`, subject 「{施設名}申込手続きのご案内」, one URL `/apply/new?c=<uuid4>`. **It names
neither the stay date nor anything but the facility**, so two holds at one facility are told apart only by arrival
order: the confirm worker pairs holds oldest-to-oldest and claims each link once.

`GET /apply/new?c=<uuid>` → one form to `/apply/confirm?c=<uuid>`, 15 controls:

| Trap | Reality |
|---|---|
| `_method` | `value="true"`, not a verb: echo verbatim (`patch` makes the route 404) |
| `utf8` | absent |
| required-ness | no `required`, no 「必須」: an `<img src=".../must-*.png">` in `<dd class="must">` |
| labels | proximity only, no `for=`: **match the field name first**, the label as a fallback |
| options | `man`/`woman`, `myself`/`family`, prefectures `1`…`47`; birth is three **unpadded** selects with 和暦 labels |

`POST /apply/confirm` → 申込内容確認画面, which **echoes the insurance record as prose** (a dump of it is private data).
`POST /apply/complete?c=<uuid>` → **never retried**; files and mails. The receipt is
`<strong>申込受付番号：  …</strong>` (label and number in one tag): search the tag-stripped text. **A lapsed hold's
link** answers 200 with no form and 「30分が経過しましたので、ご利用のURLは無効となりました。」 (the only way to tell it
from changed markup or a consumed link).

**`POST /apply/confirm` refuses curl and accepts Chrome**, so Chrome commits. Measured on live holds: curl 0 for 3,
Chrome 2 for 2. curl gets `302 → /service_category/index`, empty body, `x-runtime ≈ 0.02` (a `before_action`)
regardless of token, `utf8`, `commit`, `Origin`, `Sec-Fetch-*`, `sec-ch-ua*` or a shared connection. Chrome succeeds
even via in-page `fetch()`, so the difference is the client (TLS fingerprint or egress). **Caveat**: measured behind a proxy that may vary the source address (a session pinned to `remote_ip` acts the same). **Check off a proxied network before restoring a curl commit path** (curl
would save ~20 s and a browser launch per booking).

## 6. Turnstile

Measured on Actions (pydoll, real Google Chrome):

- **The checkbox is centred**: the widget is a centred 300 px box inside `.cf-turnstile`, so click
  **`x + w/2 − 150 + 22`**, vertically centred; `chrome.py` tries that first, `x + 28` second, and records `spot`.
- **Headed Chrome under xvfb passes on ubuntu runners** (with `fonts-noto-cjk`, `--no-sandbox --lang=ja-JP`): 5/5,
  ~19–90 s. curl with the minted `s=` then reads the calendar.
- A `HeadlessChrome` UA, Cloudflare Browser Rendering and Playwright's Chromium are detected. `s=` lifetime: unmeasured.
- The checkbox is in a cross-origin iframe: only CDP mouse events reach it. An escalated interactive challenge never
  yields a token. The solve's budget (`TURNSTILE_ATTEMPTS` × `TURNSTILE_TOKEN_SEC` + pauses) must fit inside
  `CAPTCHA_TIMEOUT` (config.py checks at import).
