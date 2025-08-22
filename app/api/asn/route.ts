export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { sql, TABLE } from "@/lib/db";
import { addYears } from "@/utils/date";

export async function GET() {
  try {
    const rows = await sql(`SELECT * FROM "${TABLE}" ORDER BY updated_at DESC`);
    return NextResponse.json(rows);
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || "Gagal mengambil data" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nama, nip, tmt_pns, riwayat_tmt_kgb, riwayat_tmt_pangkat, jadwal_kgb_berikutnya, jadwal_pangkat_berikutnya } = body ?? {};
    if (!nama || !nip) return NextResponse.json({ error: "nama dan nip wajib diisi" }, { status: 400 });

    const kgb = jadwal_kgb_berikutnya || addYears(riwayat_tmt_kgb, 2);
    const pangkat = jadwal_pangkat_berikutnya || addYears(riwayat_tmt_pangkat, 4);

    const rows = await sql(
      `INSERT INTO "${TABLE}" 
       (nama, nip, tmt_pns, riwayat_tmt_kgb, riwayat_tmt_pangkat, jadwal_kgb_berikutnya, jadwal_pangkat_berikutnya, created_at, updated_at)
       VALUES (${nama}, ${nip}, ${tmt_pns || null}, ${riwayat_tmt_kgb || null}, ${riwayat_tmt_pangkat || null}, ${kgb || null}, ${pangkat || null}, NOW(), NOW())
       RETURNING *`
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || "Gagal membuat data" }, { status: 500 });
  }
}
