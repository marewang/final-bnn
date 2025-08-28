// app/api/auth/debug/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const sess = readSession();
    if (!sess) {
      return NextResponse.json(
        { session: null, user: null, note: "No session cookie" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    // Opsional: ambil user dari DB
    const rows = (await sql/* sql */`
      SELECT id, name, email, role
      FROM "users"
      WHERE id = ${sess.uid}
      LIMIT 1;
    `) as unknown as Array<{ id: number; name: string; email: string; role: string }>;

    const user = rows[0] ?? null;

    return NextResponse.json(
      {
        session: sess, // { uid, email, role, iat }
        user,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || String(e) },
      { status: 500 }
    );
  }
}
