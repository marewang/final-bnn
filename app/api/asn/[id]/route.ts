export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

type Ctx = { params: { id: string } };

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

// ---------- PUT (update by id) ----------
export async function PUT(req: Request, ctx: Ctx) {
  const s = getSession(req);
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const id = Number(ctx.params.id);
    if (!Number.isFinite(id)) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

    const b = await req.json().catch(() => ({} as any));
    const nama = b.nama ?? b.name;
    const nip = b.nip ?? b.nomorPegawai ?? b.nomor_pegawai;
    const tmt_pns = b.tmt_pns ?? b.tmtPns;
    const riwayat_tmt_kgb = b.riwayat_tmt_kgb ?? b.riwayatTmtKgb;
    const riwayat_tmt_pangkat = b.riwayat_tmt_pangkat ?? b.riwayatTmtPangkat;
    const jadwal_kgb_berikutnya = b.jadwal_kgb_berikutnya ?? b.jadwalKgbBerikutnya;
    const jadwal_pangkat_berikutnya = b.jadwal_pangkat_berikutnya ?? b.jadwalPangkatBerikutnya;

    const q = `
      UPDATE "asns" SET
        nama = ${toTextLiteral(nama)},
        nip = ${toTextLiteral(nip)},
        tmt_pns = ${toDateLiteral(tmt_pns)},
        riwayat_tmt_kgb = ${toDateLiteral(riwayat_tmt_kgb)},
        riwayat_tmt_pangkat = ${toDateLiteral(riwayat_tmt_pangkat)},
        jadwal_kgb_berikutnya = ${toDateLiteral(jadwal_kgb_berikutnya)},
        jadwal_pangkat_berikutnya = ${toDateLiteral(jadwal_pangkat_berikutnya)},
        updated_at = now()
      WHERE id = ${id}
      RETURNING id, nama, nip, tmt_pns, riwayat_tmt_kgb, riwayat_tmt_pangkat, jadwal_kgb_berikutnya, jadwal_pangkat_berikutnya, updated_at;
    `;
    const rows = await sql(q);
    if (!rows?.length) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || "Gagal memperbarui data" }, { status: 500 });
  }
}

// ---------- DELETE (by id) ----------
export async function DELETE(req: Request, ctx: Ctx) {
  const s = getSession(req);
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const id = Number(ctx.params.id);
    if (!Number.isFinite(id)) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    await sql(`DELETE FROM "asns" WHERE id = ${id};`);
    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || "Gagal menghapus data" }, { status: 500 });
  }
}
