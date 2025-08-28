// app/api/asn/[id]/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { readSession } from "@/lib/auth";

type Ctx = { params: { id: string } };

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

export async function PUT(req: Request, ctx: Ctx) {
  const sess = readSession();
  if (!sess) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(ctx.params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  const b = (await req.json()) as Body;

  const nama = (b.nama || "").trim();
  const nip = (b.nip || "").trim();
  if (nama.length < 3) return NextResponse.json({ error: "Nama minimal 3 karakter" }, { status: 400 });
  if (!/^\d{18}$/.test(nip)) return NextResponse.json({ error: "NIP harus 18 digit" }, { status: 400 });

  const rows = (await sql/* sql */`
    UPDATE "asns"
    SET nama=${nama},
        nip=${nip},
        tmt_pns=${b.tmt_pns || null},
        riwayat_tmt_kgb=${b.riwayat_tmt_kgb || null},
        riwayat_tmt_pangkat=${b.riwayat_tmt_pangkat || null},
        jadwal_kgb_berikutnya=${b.jadwal_kgb_berikutnya || null},
        jadwal_pangkat_berikutnya=${b.jadwal_pangkat_berikutnya || null},
        updated_at=NOW()
    WHERE id=${id}
    RETURNING id, nama, nip, tmt_pns, riwayat_tmt_kgb, riwayat_tmt_pangkat, jadwal_kgb_berikutnya, jadwal_pangkat_berikutnya, updated_at;
  `) as unknown as Row[];

  if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const sess = readSession();
  if (!sess) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(ctx.params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  await sql/* sql */`DELETE FROM "asns" WHERE id=${id};`;
  return NextResponse.json({ ok: true });
}

// (opsional) GET detail per id
export async function GET(_req: Request, ctx: Ctx) {
  const sess = readSession();
  if (!sess) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(ctx.params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  const rows = (await sql/* sql */`
    SELECT id, nama, nip, tmt_pns, riwayat_tmt_kgb, riwayat_tmt_pangkat,
           jadwal_kgb_berikutnya, jadwal_pangkat_berikutnya, updated_at
    FROM "asns"
    WHERE id=${id}
    LIMIT 1;
  `) as unknown as Row[];

  if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}
