// app/print/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { sql } from "@/lib/db";

type Row = {
  id: number;
  nama: string;
  nip: string;
  jadwal_kgb_berikutnya?: string | null;
  jadwal_pangkat_berikutnya?: string | null;
};

function fmt(d?: string | null) {
  if (!d) return "-";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "-";
  return x.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });
}

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

  // Hindari error tipe TS: cast ke Row[]
  const kgb = (await sql(qKgb)) as unknown as Row[];
  const pangkat = (await sql(qPangkat)) as unknown as Row[];
  return { kgb, pangkat };
}

export default async function PrintPage() {
  const { kgb, pangkat } = await getData();
  const total = (kgb?.length ?? 0) + (pangkat?.length ?? 0);

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <a href="/" className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50">
          ← Kembali
        </a>
        <div className="text-sm text-gray-600">Rentang: 3 bulan • Total: {total}</div>
        <button
          onClick={() => (typeof window !== "undefined" ? window.print() : null)}
          className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50"
        >
          🖨 Cetak
        </button>
      </div>

      <h1 className="mb-1 text-xl font-semibold">Daftar Pengingat</h1>
      <p className="mb-4 text-sm text-gray-600">
        Kenaikan Gaji Berkala & Kenaikan Pangkat (3 bulan ke depan)
      </p>

      {/* KGB */}
      <section className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-semibold">Kenaikan Gaji Berkala</h2>
          <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
            {kgb.length}
          </span>
        </div>
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-3 py-2">Nama</th>
                <th className="px-3 py-2">NIP</th>
                <th className="px-3 py-2">Jadwal</th>
              </tr>
            </thead>
            <tbody>
              {kgb.length > 0 ? (
                kgb.map((r) => (
                  <tr key={`kgb-${r.id}`} className="border-t">
                    <td className="px-3 py-2">{r.nama}</td>
                    <td className="px-3 py-2">{r.nip}</td>
                    <td className="px-3 py-2">{fmt(r.jadwal_kgb_berikutnya)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-3 py-4 text-center text-gray-500">
                    Tidak ada data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pangkat */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-semibold">Kenaikan Pangkat</h2>
          <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
            {pangkat.length}
          </span>
        </div>
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-3 py-2">Nama</th>
                <th className="px-3 py-2">NIP</th>
                <th className="px-3 py-2">Jadwal</th>
              </tr>
            </thead>
            <tbody>
              {pangkat.length > 0 ? (
                pangkat.map((r) => (
                  <tr key={`pg-${r.id}`} className="border-t">
                    <td className="px-3 py-2">{r.nama}</td>
                    <td className="px-3 py-2">{r.nip}</td>
                    <td className="px-3 py-2">{fmt(r.jadwal_pangkat_berikutnya)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-3 py-4 text-center text-gray-500">
                    Tidak ada data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Styling cetak sederhana via Tailwind */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 14mm;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
