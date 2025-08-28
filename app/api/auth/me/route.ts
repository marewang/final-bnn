// app/api/auth/me/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET() {
  const sess = readSession();
  if (!sess) {
    return NextResponse.json({ user: null }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  // Ambil info user terbaru dari DB (opsional, tapi bagus)
  const rows = await sql/* sql */`
    SELECT id, name, email, role
    FROM "users"
    WHERE id = ${sess.uid}
    LIMIT 1;
  ` as unknown as Array<{ id: number; name: string; email: string; role: string }>;

  const user = rows[0] ?? { id: sess.uid, name: sess.email, email: sess.email, role: sess.role };
  return NextResponse.json({ user }, { headers: { "Cache-Control": "no-store" } });
}
