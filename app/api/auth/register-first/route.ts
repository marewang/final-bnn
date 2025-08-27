export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

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
    const { name, email, password, role } = body ?? {};
    if (!name || !email || !password) return NextResponse.json({ error: "Nama, email, password wajib" }, { status: 400 });

    const countRows = await sql(`SELECT COUNT(*)::int AS c FROM "users";`);
    const count = countRows?.[0]?.c ?? 0;
    if (count > 0) return NextResponse.json({ error: "Sudah ada user, gunakan /api/auth/register biasa" }, { status: 400 });

    const pass = await hashPassword(password);
    const safeName = String(name).replace(/'/g, "''");
    const safeEmail = String(email).replace(/'/g, "''");
    const r = await sql(`
      INSERT INTO "users"(name, email, password_hash, role)
      VALUES ('${safeName}', '${safeEmail}', '${pass}', '${role === "admin" ? "admin" : "admin"}')
      RETURNING id, name, email, role;
    `);
    return NextResponse.json({ ok: true, user: r?.[0] });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || "Gagal register admin pertama" }, { status: 500 });
  }
}
