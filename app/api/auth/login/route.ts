// app/api/auth/login/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { sql } from "@/lib/db"; // gunakan helper Neon milik projekmu
import { createHmac, scryptSync, timingSafeEqual } from "crypto";

const AUTH_SECRET = process.env.AUTH_SECRET || "dev-secret"; // set di Vercel

function b64url(buf: Buffer) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function signSession(payload: object) {
  const bytes = Buffer.from(JSON.stringify(payload));
  const sig = createHmac("sha256", AUTH_SECRET).update(bytes).digest();
  return `${b64url(bytes)}.${b64url(sig)}`;
}

function verifyScrypt(password: string, stored: string) {
  if (!stored) return false;

  // dukung format: scrypt$N$r$p$saltHex$keyHex
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

  // fallback dev: plaintext (tidak untuk produksi)
  return password === stored;
}

export async function POST(req: Request) {
  try {
    const { email, password } = (await req.json()) as { email?: string; password?: string };
    if (!email || !password) {
      return NextResponse.json({ error: "Email dan password wajib diisi." }, { status: 400 });
    }

    // Ambil user (sesuaikan nama kolom & tabel di DB kamu)
    // diasumsikan ada tabel "users": id, name, email, role, password_hash
    const rows = await sql/* sql */`
      SELECT id, name, email, role, password_hash
      FROM "users"
      WHERE email = ${email}
      LIMIT 1;
    ` as unknown as Array<{ id: number; name: string; email: string; role: string; password_hash: string }>;

    const user = rows[0];
    if (!user) {
      return NextResponse.json({ error: "Email atau kata sandi salah." }, { status: 401 });
    }

    const ok = verifyScrypt(password, user.password_hash);
    if (!ok) {
      return NextResponse.json({ error: "Email atau kata sandi salah." }, { status: 401 });
    }

    // Buat token sesi
    const payload = { uid: user.id, email: user.email, role: user.role, iat: Math.floor(Date.now() / 1000) };
    const token = signSession(payload);

    const res = NextResponse.json(
      { user: { id: user.id, name: user.name, email: user.email, role: user.role } },
      { headers: { "Cache-Control": "no-store" } },
    );

    res.cookies.set({
      name: "session",
      value: token,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 jam
    });

    return res;
  } catch (e: any) {
    return NextResponse.json({ error: "Login gagal. " + (e?.message || "") }, { status: 500 });
  }
}
