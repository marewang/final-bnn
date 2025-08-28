// app/api/asn/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { readSession } from "@/lib/auth";

type Row = {
  id: number;
  nama: string;
  nip: string;
  tmt_pns: string | null;
  riwayat_tmt_kgb: string | null;
  riwayat_tmt_pangkat: string | null;
  jadwal_kgb_berikutnya: string | null;
  jadwal_pangkat_berikutnya: string | null;
  updated_at: string | null;
};

type Body = {
  nama?: string;
  nip?: string;
  tmt_pns?: string | null;
  riwayat_tmt_kgb?: string | null;
  riwayat_tmt_pangkat?: string | null;
  jadwal_kgb_berikutnya?: string | null;
  jadwal_pangkat_berikutnya?: string | null;
};

export async function GET(req: Request) {
  const sess = readSession();
  if (!sess) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || "10")));
  const offset = (page - 1) * pageSize;

  const where =
    q.length > 0
      ? (sql as any)`WHERE nama ILIKE ${"%" + q + "%"} OR nip ILIKE ${"%" + q + "%"}`
      : (sql as any)``;

  const data = (await sql/* sql */`
    SELECT id, nama, nip, tmt_pns, riwayat_tmt_kgb, riwayat_tmt_pangkat,
           jadwal_kgb_berikutnya, jadwal_pangkat_berikutnya, updated_at
    FROM "asns"
    ${where}
    ORDER BY updated_at DESC NULLS LAST, id DESC
    LIMIT ${pageSize} OFFSET ${offset};
  `) as unknown as Row[];

  const totalRows = (await sql/* sql */`
    SELECT COUNT(*)::text AS count
    FROM "asns"
    ${where};
  `) as unknown as Array<{ count: string }>;

  const total = Number(totalRows[0]?.count || 0);
  return NextResponse.json({ data, total, page, pageSize }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const sess = readSession();
  if (!sess) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = (await req.json()) as Body;
  const nama = (b.nama || "").trim();
  const nip = (b.nip || "").trim();

  if (nama.length < 3) return NextResponse.json({ error: "Nama minimal 3 karakter" }, { status: 400 });
  if (!/^\d{18}$/.test(nip)) return NextResponse.json({ error: "NIP harus 18 digit" }, { status: 400 });

  const rows = (await sql/* sql */`
    INSERT INTO "asns" (nama, nip, tmt_pns, riwayat_tmt_kgb, riwayat_tmt_pangkat,
                        jadwal_kgb_berikutnya, jadwal_pangkat_berikutnya)
    VALUES (${nama}, ${nip}, ${b.tmt_pns || null}, ${b.riwayat_tmt_kgb || null},
            ${b.riwayat_tmt_pangkat || null}, ${b.jadwal_kgb_berikutnya || null},
            ${b.jadwal_pangkat_berikutnya || null})
    RETURNING id, nama, nip, tmt_pns, riwayat_tmt_kgb, riwayat_tmt_pangkat,
              jadwal_kgb_berikutnya, jadwal_pangkat_berikutnya, updated_at;
  `) as unknown as Row[];

  return NextResponse.json(rows[0], { status: 201 });
}
