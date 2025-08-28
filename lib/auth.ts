// lib/auth.ts
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual, randomBytes, scryptSync } from "crypto";

const AUTH_SECRET = process.env.AUTH_SECRET || "dev-secret"; // SET di Vercel!

function b64urlToBuf(s: string) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 ? 4 - (s.length % 4) : 0;
  s += "=".repeat(pad);
  return Buffer.from(s, "base64");
}

export type SessionPayload = { uid: number; email: string; role: string; iat: number };

export function readSession(): SessionPayload | null {
  const token = cookies().get("session")?.value;
  if (!token) return null;
  const [p, s] = token.split(".");
  if (!p || !s) return null;

  const payloadBytes = b64urlToBuf(p);
  const sigBytes = b64urlToBuf(s);
  const expSig = createHmac("sha256", AUTH_SECRET).update(payloadBytes).digest();

  try {
    if (sigBytes.length !== expSig.length || !timingSafeEqual(sigBytes, expSig)) return null;
  } catch {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payloadBytes).toString("utf8"));
  } catch {
    return null;
  }
}

/**
 * Menghasilkan hash password dengan scrypt.
 * Format: scrypt$N$r$p$saltHex$keyHex
 */
export function hashPassword(password: string): string {
  const N = 16384, r = 8, p = 1, keylen = 32;
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, keylen, { N, r, p, maxmem: 32 * 1024 * 1024 });
  return `scrypt$${N}$${r}$${p}$${salt.toString("hex")}$${key.toString("hex")}`;
}

/**
 * Verifikasi password terhadap hash scrypt di atas.
 * Mendukung fallback plaintext (untuk dev lama) jika tidak diawali "scrypt$".
 */
export function verifyPassword(password: string, stored: string): boolean {
  if (!stored) return false;

  if (stored.startsWith("scrypt$")) {
    const parts = stored.split("$");
    if (parts.length !== 6) return false;
    const [, Ns, rs, ps, saltHex, keyHex] = parts;
    const N = Number(Ns), r = Number(rs), p = Number(ps);
    const salt = Buffer.from(saltHex, "hex");
    const key = Buffer.from(keyHex, "hex");
    const derived = scryptSync(password, salt, key.length, { N, r, p, maxmem: 32 * 1024 * 1024 });
    try {
      return timingSafeEqual(key, derived);
    } catch {
      return false;
    }
  }

  // fallback dev (hindari di produksi)
  return password === stored;
}
