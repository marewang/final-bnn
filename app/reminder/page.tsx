"use client";

import { useEffect, useMemo, useState } from "react";
import { toISODateInput } from "@/utils/date";

type Row = {
  id: number;
  nama: string;
  nip: string;
  jadwal_kgb_berikutnya?: string | null;
  jadwal_pangkat_berikutnya?: string | null;
};

export default function RemindersPage() {
  const [kgb, setKgb] = useState<Row[]>([]);
  const [pangkat, setPangkat] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/reminders", { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        const { kgb, pangkat } = await res.json();
        setKgb(kgb || []);
        setPangkat(pangkat || []);
      } catch (e: any) {
        setError(e?.message || "Gagal memuat pengingat");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filterByQ = (rows: Row[]) => {
    const key = q.trim().toLowerCase();
    if (!key) return rows;
    return rows.filter(r =>
      r.nama?.toLowerCase().includes(key) ||
      r.nip?.toLowerCase().includes(key)
    );
  };

  const kgbFiltered = useMemo(() => filterByQ(kgb), [kgb, q]);
  const pangkatFiltered = useMemo(() => filterByQ(pangkat), [pangkat, q]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Pengingat (≤ 3 bulan)</h1>
          <p className="text-sm text-gray-500">Daftar ASN yang akan jatuh tempo KGB dan Kenaikan Pangkat dalam 3 bulan ke depan.</p>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari nama atau NIP..."
          className="w-72 rounded-xl border px-3 py-2 outline-none ring-2 ring-transparent focus:ring-indigo-200"
        />
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">Error: {error}</div>}
      {loading && <div className="rounded-2xl border bg-white p-4 text-sm">Memuat…</div>}

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* KGB */}
        <div className="rounded-2xl border bg-white shadow-sm">
          <header className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-700">KGB ≤ 3 bulan</h2>
            <span className="rounded-lg bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">{kgbFiltered.length} orang</span>
          </header>
          <div className="max-h-[70vh] overflow-auto">
            <table className="min-w-full divide-y">
              <thead>
                <tr className="bg-white">
                  <Th>Nama</Th>
                  <Th>NIP</Th>
                  <Th>Jadwal</Th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {kgbFiltered.length === 0 && (
                  <tr><Td colSpan={3} className="p-4 text-center text-sm text-gray-500">Tidak ada yang due</Td></tr>
                )}
                {kgbFiltered.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <Td>{row.nama}</Td>
                    <Td className="font-mono">{row.nip}</Td>
                    <Td className="font-medium">{toISODateInput(row.jadwal_kgb_berikutnya)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pangkat */}
        <div className="rounded-2xl border bg-white shadow-sm">
          <header className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-700">Kenaikan Pangkat ≤ 3 bulan</h2>
            <span className="rounded-lg bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-800">{pangkatFiltered.length} orang</span>
          </header>
          <div className="max-h-[70vh] overflow-auto">
            <table className="min-w-full divide-y">
              <thead>
                <tr className="bg-white">
                  <Th>Nama</Th>
                  <Th>NIP</Th>
                  <Th>Jadwal</Th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pangkatFiltered.length === 0 && (
                  <tr><Td colSpan={3} className="p-4 text-center text-sm text-gray-500">Tidak ada yang due</Td></tr>
                )}
                {pangkatFiltered.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <Td>{row.nama}</Td>
                    <Td className="font-mono">{row.nip}</Td>
                    <Td className="font-medium">{toISODateInput(row.jadwal_pangkat_berikutnya)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

function Th({ children }: { children: any }) {
  return <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">{children}</th>;
}
function Td({ children, className="", colSpan }: { children: any; className?: string; colSpan?: number }) {
  return <td className={"px-4 py-3 text-sm " + className} colSpan={colSpan}>{children}</td>;
}
