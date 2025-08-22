export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const kgb = await sql`
      SELECT id, nama, nip, jadwal_kgb_berikutnya
      FROM "asns"
      WHERE jadwal_kgb_berikutnya IS NOT NULL
        AND (jadwal_kgb_berikutnya::date) BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '3 months')
      ORDER BY jadwal_kgb_berikutnya ASC
    `;

    const pangkat = await sql`
      SELECT id, nama, nip, jadwal_pangkat_berikutnya
      FROM "asns"
      WHERE jadwal_pangkat_berikutnya IS NOT NULL
        AND (jadwal_pangkat_berikutnya::date) BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '3 months')
      ORDER BY jadwal_pangkat_berikutnya ASC
    `;

    return NextResponse.json({ kgb, pangkat });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || "Gagal mengambil reminder" }, { status: 500 });
  }
}
