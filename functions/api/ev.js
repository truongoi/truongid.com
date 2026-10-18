/* GET /api/ev — home EV charging history, admin only.
 * Requires header: Authorization: Bearer <token from /api/login>.
 * The dashboard slug URL exists only in this gated response (and in the
 * _lib data module on the server) — it never ships in the terminal page. */

import { verifyToken } from "../_lib/auth.js";
import { EV_DATA } from "../_lib/ev-data.js";

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}

export async function onRequestGet(context) {
  const env = context.env;
  if (!env.ADMIN_PASSWORD) {
    return json({ error: "unauthorized" }, 401);
  }
  const header = context.request.headers.get("Authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  const payload = match ? await verifyToken(match[1], env.ADMIN_PASSWORD) : null;
  if (!payload) {
    return json({ error: "unauthorized" }, 401);
  }
  return json(EV_DATA, 200);
}

export async function onRequest(context) {
  if (context.request.method !== "GET") {
    return json({ error: "method_not_allowed" }, 405);
  }
  return onRequestGet(context);
}
