export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const m = Number(url.searchParams.get("months") ?? "3");
    const months: 1 | 3 | 6 = m === 1 ? 1 : m === 6 ? 6 : 3;

    // We use a static query string for interval, chosen from a safe whitelist.
    const intervalExpr = months === 1 ? "INTERVAL '1 month'" : months === 6 ? "INTERVAL '6 months'" : "INTERVAL '3 months'";

    const qKgb = `
      SELECT id, nama, nip, jadwal_kgb_berikutnya
      FROM "asns"
      WHERE jadwal_kgb_berikutnya IS NOT NULL
        AND (jadwal_kgb_berikutnya::date)
          BETWEEN CURRENT_DATE AND (CURRENT_DATE + ${intervalExpr})
      ORDER BY jadwal_kgb_berikutnya ASC
    `;
    const qPangkat = `
      SELECT id, nama, nip, jadwal_pangkat_berikutnya
      FROM "asns"
      WHERE jadwal_pangkat_berikutnya IS NOT NULL
        AND (jadwal_pangkat_berikutnya::date)
          BETWEEN CURRENT_DATE AND (CURRENT_DATE + ${intervalExpr})
      ORDER BY jadwal_pangkat_berikutnya ASC
    `;

    const kgb = await sql(qKgb);
    const pangkat = await sql(qPangkat);

    return NextResponse.json({ months, kgb, pangkat });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || "Gagal mengambil reminder" }, { status: 500 });
  }
}
