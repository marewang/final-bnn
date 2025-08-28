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

function byDateAsc(get: (r: Item) => string | null | undefined) {
  return (a: Item, b: Item) => {
    const da = new Date(get(a) ?? "");
    const db = new Date(get(b) ?? "");
    const va = Number.isNaN(da.getTime()) ? Infinity : da.getTime();
    const vb = Number.isNaN(db.getTime()) ? Infinity : db.getTime();
    return va - vb || (a.nama || "").localeCompare(b.nama || "");
  };
}

export default function RemindersPage() {
  const [months, setMonths] = useState<1 | 3 | 6>(3);
  const [kgb, setKgb] = useState<Item[]>([]);
  const [pangkat, setPangkat] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loadedOnce, setLoadedOnce] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(`/api/reminders?months=${months}`, { cache: "no-store", credentials: "include" });
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      setKgb(j?.kgb ?? []);
      setPangkat(j?.pangkat ?? []);
    } catch (e: any) {
      setErr(e?.message || "Gagal memuat pengingat");
      setKgb([]);
      setPangkat([]);
    } finally {
      setLoading(false);
      setLoadedOnce(true);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [months]);

  const kgbSorted = useMemo(() => [...kgb].sort(byDateAsc(r => r.jadwal_kgb_berikutnya)), [kgb]);
  const pangkatSorted = useMemo(() => [...pangkat].sort(byDateAsc(r => r.jadwal_pangkat_berikutnya)), [pangkat]);
  const total = (kgbSorted?.length ?? 0) + (pangkatSorted?.length ?? 0);

  const subLabelKGB = `Jadwal Kenaikan Gaji Berkala Kurang ${months} Bulan`;
  const subLabelPangkat = `Jadwal Kenaikan Pangkat Kurang ${months} Bulan`;

  return (
    <div className="space-y-6">
      {/* Header + filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Pengingat</h1>
          <p className="text-sm text-gray-600">
            Daftar ASN yang jatuh tempo dalam {months} bulan ke depan.
          </p>
        </div>
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
          <button
            onClick={fetchData}
            className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50"
            disabled={loading}
          >
            {loading ? "Memuat..." : "Muat ulang"}
          </button>
        </div>
      </div>

      {/* Ringkasan */}
      <div className={`rounded-xl border p-4 ${total > 0 ? "border-amber-200 bg-amber-50" : "border-gray-200 bg-gray-50"}`}>
        <p className="text-sm">
          {total > 0
            ? <>Ada <b>{total}</b> pengingat dalam {months} bulan: {kgbSorted.length} <b>Kenaikan Gaji Berkala</b>, {pangkatSorted.length} <b>Kenaikan Pangkat</b>.</>
            : <>Tidak ada pengingat dalam {months} bulan.</>}
        </p>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid gap-6 sm:grid-cols-2">
          {[0,1].map(i => (
            <div key={i} className="animate-pulse rounded-2xl border bg-white p-4">
              <div className="mb-3 h-5 w-1/2 rounded bg-gray-200" />
              <div className="mb-4 h-4 w-2/3 rounded bg-gray-200" />
              <div className="space-y-2">
                <div className="h-3 rounded bg-gray-200" />
                <div className="h-3 rounded bg-gray-200" />
                <div className="h-3 rounded bg-gray-200" />
                <div className="h-3 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mobile cards */}
      {!loading && (
        <div className="grid gap-4 sm:hidden">
          {/* KGB */}
          <div className="rounded-2xl border bg-white">
            <div className="border-b p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Kenaikan Gaji Berkala</h2>
                <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">{kgbSorted.length}</span>
              </div>
              <p className="mt-1 text-xs text-gray-600">{subLabelKGB}</p>
            </div>
            <div className="divide-y">
              {kgbSorted.length === 0 && (
                <div className="p-4 text-center text-sm text-gray-500">
                  Tidak ada data.
                </div>
              )}
              {kgbSorted.map((r) => (
                <div key={`kgb-${r.id}`} className="p-4 text-sm">
                  <div className="font-medium">{r.nama}</div>
                  <div className="text-gray-600">NIP: {r.nip}</div>
                  <div className="mt-1 text-gray-600">Jadwal: {fmt(r.jadwal_kgb_berikutnya)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Pangkat */}
          <div className="rounded-2xl border bg-white">
            <div className="border-b p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Kenaikan Pangkat</h2>
                <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">{pangkatSorted.length}</span>
              </div>
              <p className="mt-1 text-xs text-gray-600">{subLabelPangkat}</p>
            </div>
            <div className="divide-y">
              {pangkatSorted.length === 0 && (
                <div className="p-4 text-center text-sm text-gray-500">
                  Tidak ada data.
                </div>
              )}
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
      )}

      {/* Desktop tables */}
      {!loading && (
        <section className="hidden gap-6 sm:grid sm:grid-cols-2">
          {/* KGB */}
          <div className="rounded-2xl border bg-white shadow-sm">
            <div className="border-b p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Kenaikan Gaji Berkala</h2>
                <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">{kgbSorted.length}</span>
              </div>
              <p className="mt-1 text-xs text-gray-600">{subLabelKGB}</p>
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
                  {kgbSorted.length === 0 && loadedOnce && !err && (
                    <tr>
                      <td colSpan={3} className="px-3 py-6 text-center text-gray-500">Tidak ada data.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pangkat */}
          <div className="rounded-2xl border bg-white shadow-sm">
            <div className="border-b p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Kenaikan Pangkat</h2>
                <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">{pangkatSorted.length}</span>
              </div>
              <p className="mt-1 text-xs text-gray-600">{subLabelPangkat}</p>
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
                  {pangkatSorted.length === 0 && loadedOnce && !err && (
                    <tr>
                      <td colSpan={3} className="px-3 py-6 text-center text-gray-500">Tidak ada data.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Error banner (di bawah juga) */}
      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Error: {err}
        </div>
      )}
    </div>
  );
}
