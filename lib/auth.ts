import { createHmac, randomBytes, timingSafeEqual, scrypt as _scrypt } from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(_scrypt);

const SESSION_NAME = "session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("Missing AUTH_SECRET env");
  return s;
}

// ---------- Password Hashing (scrypt) ----------
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const N = 16384, r = 8, p = 1, keylen = 32;
  const key = (await scrypt(password, salt, keylen, { N, r, p })) as Buffer;
  return `scrypt$${N}$${r}$${p}$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [algo, nStr, rStr, pStr, saltHex, keyHex] = stored.split("$");
    if (algo !== "scrypt") return false;
    const N = Number(nStr), r = Number(rStr), p = Number(pStr);
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(keyHex, "hex");
    const derived = (await scrypt(password, salt, expected.length, { N, r, p })) as Buffer;
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

// ---------- Session (HMAC-SHA256 signed cookie) ----------
type SessionPayload = { uid: number; email: string; name: string; role?: string; exp: number };

export function signSession(payload: Omit<SessionPayload, "exp">, maxAgeSec = SESSION_MAX_AGE_SECONDS): string {
  const exp = Math.floor(Date.now() / 1000) + maxAgeSec;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString("base64url");
  const sig = createHmac("sha256", getSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifySessionCookie(raw?: string): SessionPayload | null {
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = createHmac("sha256", getSecret()).update(body).digest("base64url");
  const ok = timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  if (!ok) return null;
  const payload = JSON.parse(Buffer.from(body, "base64url").toString());
  if (!payload?.exp || Date.now() / 1000 > payload.exp) return null;
  return payload as SessionPayload;
}

export function buildSessionCookie(value: string, maxAgeSec = SESSION_MAX_AGE_SECONDS) {
  const attrs = [
    `${SESSION_NAME}=${value}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${maxAgeSec}`,
  ];
  return attrs.join("; ");
}

export function clearSessionCookie() {
  const attrs = [
    `${SESSION_NAME}=;`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  return attrs.join("; ");
}

export function readCookie(req: Request, name: string): string | undefined {
  const raw = req.headers.get("cookie") || "";
  const cookies = raw.split(";").map(s => s.trim());
  for (const c of cookies) {
    const [k, ...rest] = c.split("=");
    if (k === name) return rest.join("=");
  }
}

export function getSession(req: Request): SessionPayload | null {
  const raw = readCookie(req, "session");
  return verifySessionCookie(raw);
}
