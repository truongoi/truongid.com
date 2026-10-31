# truongOS admin login + EV dashboard — deploy notes

Status: built locally only (2026-10-18). Nothing pushed or deployed yet.

## What this adds

An admin `login` command in the truongOS terminal on truongid.com. The
password is checked **server-side** by a Cloudflare Pages Function against an
env secret. After login, `help` shows an ADMIN section and the `ev` command
unlocks: it fetches the home EV charging history from a gated endpoint and
prints recent sessions + week/month/all-time totals + the unlisted dashboard
link (the one to share with Mom). `logout` ends the session. The token lives
in `sessionStorage` (gone when the tab closes) and expires after 12 hours.

## Files → repo paths (repo `truongoi/truongid.com`, Pages project `truongid-com`)

| Local file | Repo path | Notes |
|---|---|---|
| `index-v2.html` | `index.html` | Terminal + login system. Replaces the current `index.html` (keep the old one as backup). Every existing command/gag is untouched. |
| `functions/api/login.js` | `functions/api/login.js` | POST `{password}` → `{ok, token, expires}`; 503 until the secret is set; 401 (after ~600 ms) on a wrong password. |
| `functions/api/ev.js` | `functions/api/ev.js` | GET with `Authorization: Bearer <token>` → the EV data JSON; 401 otherwise. |
| `functions/_lib/auth.js` | `functions/_lib/auth.js` | HMAC token sign/verify; signing key derived from `ADMIN_PASSWORD`; constant-time password compare. |
| `functions/_lib/ev-data.js` | `functions/_lib/ev-data.js` | The charging data (single source the API serves). |
| `ev-t8k2x7m4q9/index.html` | `ev-t8k2x7m4q9/index.html` | Mom's dashboard: static, data baked in, Vietnamese-first, `noindex, nofollow`. |

The live `index.html` and `arcade.html` in this folder are NOT modified by
this package.

## The one step only you can do (dashboard)

1. Cloudflare dashboard → Workers & Pages → **truongid-com** → Settings →
   Environment variables → **Production** → Add variable:
   - Name: `ADMIN_PASSWORD`
   - Value: the admin password you choose (encrypt it if offered)
2. Save, then trigger a **new deployment** (push the files above, or
   "Retry deployment"). Pages Functions read env vars per deployment — the
   secret does nothing until a fresh deployment picks it up.
3. Test: truongid.com → type `login` → enter the password → `ev`.

Notes: changing `ADMIN_PASSWORD` later also invalidates every outstanding
login token (the signing key is derived from it) — that's by design. Nobody
else ever needs the password; it appears in no file, page, or repo.

## How data updates flow

Charging data has two baked/served copies, both regenerated from the logs
(`~/workspace/goals/home-ev-charging-cost-log/files/charging-log-*.md`)
whenever a new session is reported:

1. `functions/_lib/ev-data.js` — sessions, month totals, current ISO week,
   `dashboardUrl`. (September log summary: 165.20 kWh · $39.65 · 4 sessions.
   October: 322.60 kWh · $77.44 · 8 sessions. All time: 487.80 kWh · $117.09
   · 12 sessions. Latest session 2026-10-14, ISO week 2026-W42: 58.40 kWh ·
   $14.02 · 2 sessions.)
2. `ev-t8k2x7m4q9/index.html` — the same numbers baked into the static page,
   including the `SESSIONS` array in its bill-period calculator script
   (date = session END date; the calculator sums per-session costs, the
   log's convention — summing rounded session costs can differ by a cent
   or two from total-kWh × rate).

Edit both, push, and the terminal printout and Mom's page stay in sync.

3. Bill periods: the dashboard calculator's `PERIODS` array (newest first)
   holds saved SCE bill periods — start, end, total, household kWh,
   headcount. When a new bill arrives, add its period to the array on the
   next push; the newest period is selected and calculated on page load.
   Current list: 16/09–14/10/2026, $393.76, 1,508 kWh, 4 people.

## Security model (3 lines)

- The password exists only as a Pages env secret and is verified on the
  server; neither it nor the dashboard slug appears anywhere in the page
  source — the slug is returned by `/api/ev` only after a valid login.
- The dashboard page itself is protected by its unguessable slug +
  `noindex` (anyone holding the link can view it; rotate the folder name to
  revoke), and tokens are HMAC-signed, expire in 12 hours, and die with the
  tab.
