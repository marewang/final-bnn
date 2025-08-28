// app/api/auth/logout/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function POST() {
  // balas JSON dan hapus cookie sesi
  const res = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  res.cookies.set({
    name: "session",
    value: "",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0, // expire segera = terhapus
  });
  return res;
}
