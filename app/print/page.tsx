export const dynamic = "force-dynamic";

import { sql } from "@/lib/db";
import { toISODateInput } from "@/utils/date";
import PrintButton from "./PrintButton";

type Row = {
  id: number;
  nama: string;
  nip: string;
  jadwal_kgb_berikutnya?: string | null;
  jadwal_pangkat_berikutnya?: string | null;
};

export default async function PrintPage({
  searchParams,
}: {
  searchParams?: { months?: string | string[] };
}) {
  const mParam = Array.isArray(searchParams?.months)
    ? searchParams?.months[0]
    : searchParams?.months;
  const m = Number(mParam ?? "3");
  const months: 1 | 3 | 6 = m === 1 ? 1 : m === 6 ? 6 : 3;

  const intervalExpr =
    months === 1
      ? "INTERVAL '1 month'"
      : months === 6
      ? "INTERVAL '6 months'"
      : "INTERVAL '3 months'";

  const qKgb = `
    SELECT id, nama, nip, jadwal_kgb_berikutnya
    FROM "asns"
    WHERE jadwal_kgb_berikutnya IS NOT NULL
      AND (jadwal_kgb_berikutnya::date) BETWEEN CURRENT_DATE AND (CURRENT_DATE + ${intervalExpr})
    ORDER BY jadwal_kgb_berikutnya ASC
  `;

  const qPangkat = `
    SELECT id, nama, nip, jadwal_pangkat_berikutnya
    FROM "asns"
    WHERE jadwal_pangkat_berikutnya IS NOT NULL
      AND (jadwal_pangkat_berikutnya::date) BETWEEN CURRENT_DATE AND (CURRENT_DATE + ${intervalExpr})
    ORDER BY jadwal_pangkat_berikutnya ASC
  `;

  const kgb = (await sql(qKgb)) as Row[];
  const pangkat = (await sql(qPangkat)) as Row[];

  return (
    <div className="mx-auto max-w-5xl p-6 print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-xl font-semibold">Laporan Pengingat ASN (≤ {months} bulan)</h1>
          <p className="text-sm text-gray-500">Dicetak: {new Date().toLocaleString()}</p>
        </div>
        <PrintButton />
      </div>

      <section className="space-y-4">
        <h2 className="mt-2 text-base font-semibold">KGB ≤ {months} bulan</h2>
        <table className="min-w-full divide-y text-sm">
          <thead>
            <tr className="bg-gray-50 print:bg-white">
              <Th>Nama</Th>
              <Th>NIP</Th>
              <Th>Jadwal</Th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {kgb.length === 0 ? (
              <tr>
                <Td colSpan={3} className="p-3 text-center text-gray-500">
                  Tidak ada data
                </Td>
              </tr>
            ) : (
              kgb.map((r) => (
                <tr key={r.id}>
                  <Td>{r.nama}</Td>
                  <Td className="font-mono">{r.nip}</Td>
                  <Td>{toISODateInput(r.jadwal_kgb_berikutnya)}</Td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <h2 className="mt-8 text-base font-semibold">Kenaikan Pangkat ≤ {months} bulan</h2>
        <table className="min-w-full divide-y text-sm">
          <thead>
            <tr className="bg-gray-50 print:bg-white">
              <Th>Nama</Th>
              <Th>NIP</Th>
              <Th>Jadwal</Th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {pangkat.length === 0 ? (
              <tr>
                <Td colSpan={3} className="p-3 text-center text-gray-500">
                  Tidak ada data
                </Td>
              </tr>
            ) : (
              pangkat.map((r) => (
                <tr key={r.id}>
                  <Td>{r.nama}</Td>
                  <Td className="font-mono">{r.nip}</Td>
                  <Td>{toISODateInput(r.jadwal_pangkat_berikutnya)}</Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Th({ children }: { children: any }) {
  return <th className="px-3 py-2 text-left font-semibold">{children}</th>;
}
function Td({
  children,
  className = "",
  colSpan,
}: {
  children: any;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td className={"px-3 py-2 " + className} colSpan={colSpan}>
      {children}
    </td>
  );
}
