export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const hasSecret = !!process.env.AUTH_SECRET;
    let userCount = 0;
    try {
      const r = await sql(`SELECT COUNT(*)::int AS c FROM "users";`);
      userCount = r?.[0]?.c ?? 0;
    } catch {}
    const session = getSession(req);
    return NextResponse.json({
      hasAuthSecret: hasSecret,
      userCount,
      hasSession: !!session,
      sessionUser: session ? { uid: session.uid, email: session.email, name: session.name, role: session.role } : null,
    });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || "debug failed" }, { status: 500 });
  }
}
