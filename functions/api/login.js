/* POST /api/login — verify the truongOS admin password server-side.
 * Body: JSON { password: "..." }
 * The password is compared against the ADMIN_PASSWORD env secret
 * (set in the Cloudflare dashboard — never hardcoded). On success a
 * 12-hour HMAC-signed token is returned; the terminal keeps it in
 * sessionStorage and presents it to /api/ev. */

import { passwordMatches, signToken } from "../_lib/auth.js";

const TOKEN_TTL_SECONDS = 12 * 60 * 60;
const FAIL_DELAY_MS = 600;

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}

function delay(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

export async function onRequestPost(context) {
  const env = context.env;
  if (!env.ADMIN_PASSWORD) {
    return json({ error: "not_configured" }, 503);
  }

  let candidate = null;
  try {
    const body = await context.request.json();
    if (body && typeof body.password === "string") candidate = body.password;
  } catch (e) {
    candidate = null;
  }

  if (candidate === null || !(await passwordMatches(candidate, env.ADMIN_PASSWORD))) {
    await delay(FAIL_DELAY_MS); /* slow down guessing */
    return json({ ok: false, error: "invalid_credentials" }, 401);
  }

  const signed = await signToken(env.ADMIN_PASSWORD, TOKEN_TTL_SECONDS);
  return json({
    ok: true,
    token: signed.token,
    expires: new Date(signed.exp * 1000).toISOString()
  }, 200);
}

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }
  return onRequestPost(context);
}
