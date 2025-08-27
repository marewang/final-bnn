export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

function escapeLike(input: string) {
  // Escape backslash, %, _, and single quote for LIKE ... ESCAPE '\'
  return input
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_")
    .replace(/'/g, "''");
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const qRaw = (url.searchParams.get("q") || "").trim();
    const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
    const pageSizeRaw = Math.max(1, Number(url.searchParams.get("pageSize") || "10"));
    const pageSize = Math.min(100, pageSizeRaw);
    const offset = (page - 1) * pageSize;

    let where = "";
    if (qRaw) {
      const q = escapeLike(qRaw);
      where = `WHERE (nama ILIKE '%${q}%' ESCAPE '\\' OR nip ILIKE '%${q}%' ESCAPE '\\')`;
    }

    const queryRows = `
      SELECT id, nama, nip, tmt_pns, riwayat_tmt_kgb, riwayat_tmt_pangkat, jadwal_kgb_berikutnya, jadwal_pangkat_berikutnya, updated_at
      FROM "asns"
      ${where}
      ORDER BY updated_at DESC
      LIMIT ${pageSize} OFFSET ${offset};
    `;

    const rows = await sql(queryRows);

    const queryCount = `
      SELECT COUNT(*)::int AS total
      FROM "asns"
      ${where};
    `;
    const totalRows = await sql(queryCount);
    const total: number = (totalRows?.[0]?.total) ?? 0;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));

    return NextResponse.json({ data: rows, page, pageSize, total, pageCount });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || "Gagal mengambil data" }, { status: 500 });
  }
}
