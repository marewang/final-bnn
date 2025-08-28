// app/print/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { sql } from "@/lib/db";
import PrintClient from "@/components/PrintClient";

type Row = {
  id: number;
  nama: string;
  nip: string;
  jadwal_kgb_berikutnya?: string | null;
  jadwal_pangkat_berikutnya?: string | null;
};

async function getData() {
  const qKgb = `
    SELECT id, nama, nip, jadwal_kgb_berikutnya
    FROM "asns"
    WHERE jadwal_kgb_berikutnya IS NOT NULL
      AND (jadwal_kgb_berikutnya::date) BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '3 months')
    ORDER BY jadwal_kgb_berikutnya ASC;
  `;
  const qPangkat = `
    SELECT id, nama, nip, jadwal_pangkat_berikutnya
    FROM "asns"
    WHERE jadwal_pangkat_berikutnya IS NOT NULL
      AND (jadwal_pangkat_berikutnya::date) BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '3 months')
    ORDER BY jadwal_pangkat_berikutnya ASC;
  `;

  const kgb = (await sql(qKgb)) as unknown as Row[];
  const pangkat = (await sql(qPangkat)) as unknown as Row[];
  return { kgb, pangkat };
}

export default async function PrintPage() {
  const { kgb, pangkat } = await getData();
  return <PrintClient kgb={kgb} pangkat={pangkat} />;
}
