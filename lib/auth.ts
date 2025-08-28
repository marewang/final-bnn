// lib/auth.ts
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const AUTH_SECRET = process.env.AUTH_SECRET || "dev-secret"; // set di Vercel

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
