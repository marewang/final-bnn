// app/api/auth/register/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { readSession, hashPassword } from "@/lib/auth";

async function ensureUsersTable() {
  await sql/* sql */`
    CREATE TABLE IF NOT EXISTS "users" (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'user',
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
}

export async function POST(req: Request) {
  await ensureUsersTable();

  const { name, email, password, role } = (await req.json()) as {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
  };

  if (!name || !email || !password) {
    return NextResponse.json({ error: "name, email, password wajib diisi" }, { status: 400 });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Format email tidak valid" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
  }

  // Cek jumlah user
  const cnt = await sql/* sql */`SELECT COUNT(*)::int AS n FROM "users";` as unknown as Array<{ n: number }>;
  const totalUsers = cnt[0]?.n ?? 0;

  // Jika sudah ada user, hanya admin yang boleh register user baru
  let finalRole = "user";
  if (totalUsers === 0) {
    // pendaftaran pertama — izinkan tanpa login, default admin
    finalRole = role === "user" ? "user" : "admin";
  } else {
    const sess = readSession();
    if (!sess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // Ambil role terbaru dari DB (opsional)
    const u = await sql/* sql */`
      SELECT role FROM "users" WHERE id = ${sess.uid} LIMIT 1;
    ` as unknown as Array<{ role: string }>;
    const myRole = u[0]?.role ?? sess.role;
    if (myRole !== "admin") return NextResponse.json({ error: "Hanya admin yang dapat menambah user" }, { status: 403 });
    finalRole = role === "admin" ? "admin" : "user";
  }

  const pwdHash = hashPassword(password);

  try {
    const rows = await sql/* sql */`
      INSERT INTO "users" (name, email, role, password_hash)
      VALUES (${name.trim()}, ${email.trim().toLowerCase()}, ${finalRole}, ${pwdHash})
      RETURNING id, name, email, role;
    ` as unknown as Array<{ id: number; name: string; email: string; role: string }>;

    return NextResponse.json({ user: rows[0] }, { status: 201 });
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg.toLowerCase().includes("duplicate key")) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
    }
    return NextResponse.json({ error: "Gagal membuat user: " + msg }, { status: 500 });
  }
}
