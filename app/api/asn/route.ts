export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

function escape(str: any) {
  return String(str ?? "").replace(/'/g, "''");
}
function toDateLiteral(v: any) {
  if (!v) return "NULL";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "NULL";
  return `'${d.toISOString().slice(0,10)}'::date`;
}
function toTextLiteral(v: any) {
  if (v === null || v === undefined || v === "") return "NULL";
  return `'${escape(v)}'`;
}

function escapeLike(input: string) {
  return input
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_")
    .replace(/'/g, "''");
}

// ---------- GET (list with search + paging) ----------
export async function GET(req: Request) {
  const s = getSession(req);
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

// ---------- POST (create) ----------
export async function POST(req: Request) {
  const s = getSession(req);
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const b = await req.json().catch(() => ({} as any));
    // Terima camelCase atau snake_case
    const nama = b.nama ?? b.name;
    const nip = b.nip ?? b.nomorPegawai ?? b.nomor_pegawai;
    const tmt_pns = b.tmt_pns ?? b.tmtPns;
    const riwayat_tmt_kgb = b.riwayat_tmt_kgb ?? b.riwayatTmtKgb;
    const riwayat_tmt_pangkat = b.riwayat_tmt_pangkat ?? b.riwayatTmtPangkat;
    const jadwal_kgb_berikutnya = b.jadwal_kgb_berikutnya ?? b.jadwalKgbBerikutnya;
    const jadwal_pangkat_berikutnya = b.jadwal_pangkat_berikutnya ?? b.jadwalPangkatBerikutnya;

    if (!nama || !nip) {
      return NextResponse.json({ error: "Nama dan NIP wajib diisi" }, { status: 400 });
    }

    const q = `
      INSERT INTO "asns"
      (nama, nip, tmt_pns, riwayat_tmt_kgb, riwayat_tmt_pangkat, jadwal_kgb_berikutnya, jadwal_pangkat_berikutnya, created_at, updated_at)
      VALUES (
        ${toTextLiteral(nama)},
        ${toTextLiteral(nip)},
        ${toDateLiteral(tmt_pns)},
        ${toDateLiteral(riwayat_tmt_kgb)},
        ${toDateLiteral(riwayat_tmt_pangkat)},
        ${toDateLiteral(jadwal_kgb_berikutnya)},
        ${toDateLiteral(jadwal_pangkat_berikutnya)},
        now(), now()
      )
      RETURNING id, nama, nip, tmt_pns, riwayat_tmt_kgb, riwayat_tmt_pangkat, jadwal_kgb_berikutnya, jadwal_pangkat_berikutnya, updated_at;
    `;
    const rows = await sql(q);
    return NextResponse.json(rows?.[0] ?? null);
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || "Gagal membuat data" }, { status: 500 });
  }
}
