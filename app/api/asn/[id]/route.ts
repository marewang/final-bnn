export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { sql, TABLE } from "@/lib/db";
import { addYears } from "@/utils/date";

type Ctx = { params: { id: string } };

export async function GET(_: Request, ctx: Ctx) {
  try {
    const id = Number(ctx.params.id);
    const rows = await sql`SELECT * FROM "${TABLE}" WHERE id = ${id}`;
    if (rows.length === 0) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Gagal mengambil data" }, { status: 500 });
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const id = Number(ctx.params.id);
    const body = await req.json();
    const {
      nama, nip, tmt_pns, riwayat_tmt_kgb, riwayat_tmt_pangkat,
      jadwal_kgb_berikutnya, jadwal_pangkat_berikutnya
    } = body ?? {};

    const kgb = jadwal_kgb_berikutnya ?? addYears(riwayat_tmt_kgb, 2);
    const pangkat = jadwal_pangkat_berikutnya ?? addYears(riwayat_tmt_pangkat, 4);

    const rows = await sql`
      UPDATE "${TABLE}" SET
        nama = ${nama},
        nip = ${nip},
        tmt_pns = ${tmt_pns ?? null},
        riwayat_tmt_kgb = ${riwayat_tmt_kgb ?? null},
        riwayat_tmt_pangkat = ${riwayat_tmt_pangkat ?? null},
        jadwal_kgb_berikutnya = ${kgb ?? null},
        jadwal_pangkat_berikutnya = ${pangkat ?? null},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *;
    `;
    if (rows.length === 0) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Gagal memperbarui data" }, { status: 500 });
  }
}

export async function DELETE(_: Request, ctx: Ctx) {
  try {
    const id = Number(ctx.params.id);
    await sql`DELETE FROM "${TABLE}" WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Gagal menghapus data" }, { status: 500 });
  }
}
