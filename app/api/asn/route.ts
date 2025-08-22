export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();
    const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
    const pageSizeRaw = Math.max(1, Number(url.searchParams.get("pageSize") || "10"));
    const pageSize = Math.min(100, pageSizeRaw);
    const offset = (page - 1) * pageSize;

    let whereSql = sql``;
    if (q) {
      const like = `%${q}%`;
      whereSql = sql`WHERE (nama ILIKE ${like} OR nip ILIKE ${like})`;
    }

    const rows = await sql`
      SELECT *
      FROM "asns"
      ${whereSql}
      ORDER BY updated_at DESC
      LIMIT ${pageSize} OFFSET ${offset};
    `;

    const totalRows = await sql`
      SELECT COUNT(*)::int AS total
      FROM "asns"
      ${whereSql};
    `;
    const total: number = (totalRows?.[0]?.total) ?? 0;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    return NextResponse.json({ data: rows, page, pageSize, total, pageCount });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || "Gagal mengambil data" }, { status: 500 });
  }
}
