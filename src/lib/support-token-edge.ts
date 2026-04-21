/**
 * Edge-runtime-compatible support token verifier.
 *
 * Uses the Web Crypto API (available in Vercel Edge Functions) instead of
 * Node's `crypto` module.  This file MUST NOT import Prisma, Node builtins,
 * or anything that pulls them in transitively.
 *
 * Imported exclusively by src/middleware.ts.
 * All other support utilities live in src/lib/support-session.ts (Node runtime).
 */

export const SUPPORT_COOKIE = "trackio-support-session";

export interface SupportTokenPayload {
  sessionId: string;
  agentId: string;
  orgId: string;
  level: string;
  expiresAt: number; // unix ms
}

// ── Web Crypto helpers ────────────────────────────────────────────────────────

function base64urlToUint8Array(b64url: string): Uint8Array {
  // Restore standard base64 padding and characters
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
}

// ── Verify ────────────────────────────────────────────────────────────────────

/**
 * Verify a support session token using Web Crypto (Edge-compatible).
 * Returns the decoded payload or null if invalid / expired.
 */
export async function verifySupportTokenEdge(
  token: string
): Promise<SupportTokenPayload | null> {
  try {
    // Token format: base64url(JSON_payload).base64url(HMAC_sig)
    const dotIdx = token.lastIndexOf(".");
    if (dotIdx === -1) return null;

    const encoded = token.slice(0, dotIdx);
    const sig = token.slice(dotIdx + 1);
    if (!encoded || !sig) return null;

    const secret =
      process.env.SUPPORT_SESSION_SECRET || process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
    if (!secret) return null;

    const key = await importHmacKey(secret);
    const enc = new TextEncoder();

    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64urlToUint8Array(sig),
      enc.encode(encoded)
    );
    if (!valid) return null;

    // Decode payload JSON
    const payloadJson = new TextDecoder().decode(base64urlToUint8Array(encoded));
    const payload = JSON.parse(payloadJson) as SupportTokenPayload;

    // Reject expired tokens
    if (!payload.expiresAt || payload.expiresAt < Date.now()) return null;

    return payload;
  } catch {
    return null;
  }
}
