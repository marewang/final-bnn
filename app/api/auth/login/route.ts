export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { signSession, buildSessionCookie, verifyPassword } from "@/lib/auth";

async function ensureUsersTable() {
  await sql(`
    CREATE TABLE IF NOT EXISTS "users" (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

export async function POST(req: Request) {
  try {
    await ensureUsersTable();
    const body = await req.json().catch(() => ({}));
    const { email, password } = body ?? {};
    if (!email || !password) return NextResponse.json({ error: "Email dan password wajib diisi" }, { status: 400 });

    const rows = await sql(`SELECT id, name, email, password_hash, role FROM "users" WHERE email = '${String(email).replace(/'/g, "''")}' LIMIT 1;`);
    const user = rows?.[0];
    if (!user) return NextResponse.json({ error: "Email tidak terdaftar" }, { status: 401 });

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) return NextResponse.json({ error: "Password salah" }, { status: 401 });

    const token = signSession({ uid: user.id, email: user.email, name: user.name, role: user.role });
    const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    res.headers.set("Set-Cookie", buildSessionCookie(token));
    return res;
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || "Gagal login" }, { status: 500 });
  }
}
