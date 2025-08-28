"use client";

import { useEffect, useMemo, useState } from "react";

type Item = {
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
  return x.toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "2-digit" });
}

export default function RemindersPage() {
  const [months, setMonths] = useState<1 | 3 | 6>(3);
  const [kgb, setKgb] = useState<Item[]>([]);
  const [pangkat, setPangkat] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(`/api/reminders?months=${months}`, { cache: "no-store" });
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      setKgb(j?.kgb ?? []);
      setPangkat(j?.pangkat ?? []);
    } catch (e: any) {
      setErr(e?.message || "Gagal memuat pengingat");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [months]);

  const total = (kgb?.length ?? 0) + (pangkat?.length ?? 0);

  const kgbSorted = useMemo(() => {
    const data = [...kgb];
    data.sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
    return data;
  }, [kgb]);

  const pangkatSorted = useMemo(() => {
    const data = [...pangkat];
    data.sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
    return data;
  }, [pangkat]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Pengingat</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Rentang:</label>
          <select
            value={months}
            onChange={(e) => setMonths(Number(e.target.value) as 1 | 3 | 6)}
            className="rounded-lg border px-2 py-1 text-sm"
          >
            <option value={1}>1 bulan</option>
            <option value={3}>3 bulan</option>
            <option value={6}>6 bulan</option>
          </select>
          <button onClick={fetchData} className="rounded-lg border px-3 py-1 text-sm hover:bg-white" disabled={loading}>
            {loading ? "Memuat..." : "Muat ulang"}
          </button>
        </div>
      </div>

      {err && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">Error: {err}</div>}

      <div className={`rounded-xl border p-4 ${total > 0 ? "border-amber-2 00 bg-amber-50" : "border-gray-200 bg-gray-50"}`}>
        <p className="text-sm">
          {total > 0
            ? <>Ada <b>{total}</b> pengingat dalam {months} bulan: {kgb.length} <b>Kenaikan Gaji Berkala</b>, {pangkat.length} <b>Kenaikan Pangkat</b>.</>
            : <>Tidak ada pengingat dalam {months} bulan.</>}
        </p>
      </div>

      {/* Mobile cards */}
      <div className="grid gap-4 sm:hidden">
        <div className="rounded-2xl border bg-white">
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-base font-semibold">Kenaikan Gaji Berkala</h2>
            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">{kgb.length}</span>
          </div>
          <div className="divide-y">
            {kgbSorted.length === 0 && <div className="p-4 text-center text-sm text-gray-500">Tidak ada data.</div>}
            {kgbSorted.map((r) => (
              <div key={`kgb-${r.id}`} className="p-4 text-sm">
                <div className="font-medium">{r.nama}</div>
                <div className="text-gray-600">NIP: {r.nip}</div>
                <div className="mt-1 text-gray-600">Jadwal: {fmt(r.jadwal_kgb_berikutnya)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-white">
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-base font-semibold">Kenaikan Pangkat</h2>
            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">{pangkat.length}</span>
          </div>
          <div className="divide-y">
            {pangkatSorted.length === 0 && <div className="p-4 text-center text-sm text-gray-500">Tidak ada data.</div>}
            {pangkatSorted.map((r) => (
              <div key={`pg-${r.id}`} className="p-4 text-sm">
                <div className="font-medium">{r.nama}</div>
                <div className="text-gray-600">NIP: {r.nip}</div>
                <div className="mt-1 text-gray-600">Jadwal: {fmt(r.jadwal_pangkat_berikutnya)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop tables */}
      <section className="hidden gap-6 sm:grid sm:grid-cols-2">
        <div className="rounded-2xl border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-base font-semibold">Kenaikan Gaji Berkala</h2>
            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">{kgb.length}</span>
          </div>
          <div className="overflow-x-auto p-2">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-2">Nama</th>
                  <th className="px-3 py-2">NIP</th>
                  <th className="px-3 py-2">Jadwal</th>
                </tr>
              </thead>
              <tbody>
                {kgbSorted.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2">{r.nama}</td>
                    <td className="px-3 py-2">{r.nip}</td>
                    <td className="px-3 py-2">{fmt(r.jadwal_kgb_berikutnya)}</td>
                  </tr>
                ))}
                {kgbSorted.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-gray-500">Tidak ada data.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-base font-semibold">Kenaikan Pangkat</h2>
            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">{pangkat.length}</span>
          </div>
          <div className="overflow-x-auto p-2">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-2">Nama</th>
                  <th className="px-3 py-2">NIP</th>
                  <th className="px-3 py-2">Jadwal</th>
                </tr>
              </thead>
              <tbody>
                {pangkatSorted.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2">{r.nama}</td>
                    <td className="px-3 py-2">{r.nip}</td>
                    <td className="px-3 py-2">{fmt(r.jadwal_pangkat_berikutnya)}</td>
                  </tr>
                ))}
                {pangkatSorted.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-gray-500">Tidak ada data.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
