/* Shared admin-token helpers for the truongOS Pages Functions.
 *
 * Token format: base64url(payloadJSON) + "." + base64url(HMAC-SHA256(payload))
 * The signing key is derived from the ADMIN_PASSWORD env secret, so the
 * password itself never appears in any page source or response, and changing
 * the password invalidates every outstanding token. */

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64urlEncode(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str) {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function sha256(bytes) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
}

/* HMAC key derived from the admin password (domain-separated digest). */
async function getKey(adminPassword) {
  const material = await sha256(enc.encode("truongos-session-key:" + adminPassword));
  return crypto.subtle.importKey("raw", material, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

/* Constant-time byte comparison (no early exit, length folded in). */
function timingSafeEqual(a, b) {
  let diff = a.length ^ b.length;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    diff |= (a[i % a.length] || 0) ^ (b[i % b.length] || 0);
  }
  return diff === 0;
}

/* Compare a candidate password against the stored one without leaking
 * length or content through timing: both sides are hashed first. */
export async function passwordMatches(candidate, adminPassword) {
  const a = await sha256(enc.encode(String(candidate)));
  const b = await sha256(enc.encode(String(adminPassword)));
  return timingSafeEqual(a, b);
}

export async function signToken(adminPassword, ttlSeconds) {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payloadJson = JSON.stringify({ role: "admin", exp: exp });
  const payloadB64 = b64urlEncode(enc.encode(payloadJson));
  const key = await getKey(adminPassword);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(payloadB64)));
  return { token: payloadB64 + "." + b64urlEncode(sig), exp: exp };
}

export async function verifyToken(token, adminPassword) {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const key = await getKey(adminPassword);
  let ok = false;
  try {
    ok = await crypto.subtle.verify("HMAC", key, b64urlDecode(parts[1]), enc.encode(parts[0]));
  } catch (e) {
    return null;
  }
  if (!ok) return null;
  let payload;
  try {
    payload = JSON.parse(dec.decode(b64urlDecode(parts[0])));
  } catch (e) {
    return null;
  }
  if (!payload || payload.role !== "admin" || typeof payload.exp !== "number") return null;
  if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
  return payload;
}
