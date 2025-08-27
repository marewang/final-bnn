export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET(req: Request) {
  const s = getSession(req);
  if (!s) return NextResponse.json({ user: null }, { status: 401 });
  const rows = await sql(`SELECT id, name, email, role FROM "users" WHERE id = ${s.uid} LIMIT 1;`);
  const user = rows?.[0] ?? null;
  return NextResponse.json({ user });
}
