// app/api/reminders/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { readSession } from "@/lib/auth";

export async function GET(req: Request) {
  const sess = readSession();
  if (!sess) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const months = Math.max(1, Math.min(6, Number(searchParams.get("months") || "3")));

  // Pakai make_interval agar parameter bulan aman & tidak membentuk literal '$1 months'
  const kgb = await sql/* sql */`
    SELECT id, nama, nip, jadwal_kgb_berikutnya
    FROM "asns"
    WHERE jadwal_kgb_berikutnya IS NOT NULL
      AND (jadwal_kgb_berikutnya::date)
          BETWEEN CURRENT_DATE AND (CURRENT_DATE + make_interval(months => ${months}))
    ORDER BY jadwal_kgb_berikutnya ASC;
  `;

  const pangkat = await sql/* sql */`
    SELECT id, nama, nip, jadwal_pangkat_berikutnya
    FROM "asns"
    WHERE jadwal_pangkat_berikutnya IS NOT NULL
      AND (jadwal_pangkat_berikutnya::date)
          BETWEEN CURRENT_DATE AND (CURRENT_DATE + make_interval(months => ${months}))
    ORDER BY jadwal_pangkat_berikutnya ASC;
  `;

  return NextResponse.json({ kgb, pangkat }, { headers: { "Cache-Control": "no-store" } });
}
