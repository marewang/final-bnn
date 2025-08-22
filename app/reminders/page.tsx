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

type SortKey = "name-asc" | "name-desc" | "date-asc" | "date-desc";

export default function RemindersPage() {
  const [months, setMonths] = useState<1 | 3 | 6>(3);
  const [sort, setSort] = useState<SortKey>("date-asc");
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
        const res = await fetch(`/api/reminders?months=${months}`, { cache: "no-store" });
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
  }, [months]);

  const filterByQ = (rows: Row[]) => {
    const key = q.trim().toLowerCase();
    if (!key) return rows;
    return rows.filter(r =>
      r.nama?.toLowerCase().includes(key) ||
      r.nip?.toLowerCase().includes(key)
    );
  };

  const sortRows = (rows: Row[], dateKey: keyof Row) => {
    const copy = [...rows];
    copy.sort((a, b) => {
      if (sort === "name-asc" || sort === "name-desc") {
        const aa = (a.nama || "").toLowerCase();
        const bb = (b.nama || "").toLowerCase();
        const cmp = aa.localeCompare(bb);
        return sort === "name-asc" ? cmp : -cmp;
      } else {
        const da = new Date((a[dateKey] as string) || 0).getTime();
        const db = new Date((b[dateKey] as string) || 0).getTime();
        const cmp = (da || 0) - (db || 0);
        return sort === "date-asc" ? cmp : -cmp;
      }
    });
    return copy;
  };

  const kgbFiltered = useMemo(() => sortRows(filterByQ(kgb), "jadwal_kgb_berikutnya"), [kgb, q, sort]);
  const pangkatFiltered = useMemo(() => sortRows(filterByQ(pangkat), "jadwal_pangkat_berikutnya"), [pangkat, q, sort]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Pengingat (≤ {months} bulan)</h1>
          <p className="text-sm text-gray-500">Daftar ASN yang akan jatuh tempo KGB dan Kenaikan Pangkat.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama atau NIP..."
            className="w-64 rounded-xl border px-3 py-2 outline-none ring-2 ring-transparent focus:ring-indigo-200"
          />
          <select
            value={months}
            onChange={(e) => setMonths(Number(e.target.value) as 1 | 3 | 6)}
            className="rounded-xl border px-3 py-2 text-sm"
            aria-label="Rentang"
          >
            <option value={1}>≤ 1 bulan</option>
            <option value={3}>≤ 3 bulan</option>
            <option value={6}>≤ 6 bulan</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-xl border px-3 py-2 text-sm"
            aria-label="Urutkan"
          >
            <option value="date-asc">Tanggal paling dekat</option>
            <option value="date-desc">Tanggal paling jauh</option>
            <option value="name-asc">Nama A-Z</option>
            <option value="name-desc">Nama Z-A</option>
          </select>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">Error: {error}</div>}
      {loading && <div className="rounded-2xl border bg-white p-4 text-sm">Memuat…</div>}

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Panel title={`KGB ≤ ${months} bulan`} badge={kgbFiltered.length} badgeClass="bg-amber-100 text-amber-800">
          <Table rows={kgbFiltered} dateKey="jadwal_kgb_berikutnya" />
        </Panel>
        <Panel title={`Kenaikan Pangkat ≤ ${months} bulan`} badge={pangkatFiltered.length} badgeClass="bg-indigo-100 text-indigo-800">
          <Table rows={pangkatFiltered} dateKey="jadwal_pangkat_berikutnya" />
        </Panel>
      </section>
    </div>
  );
}

function Panel({ title, badge, badgeClass, children }:{
  title: string; badge: number; badgeClass: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-white shadow-sm">
      <header className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
        <span className={`rounded-lg px-2 py-1 text-xs font-medium ${badgeClass}`}>{badge} orang</span>
      </header>
      <div className="max-h-[70vh] overflow-auto">{children}</div>
    </div>
  );
}

function Table({ rows, dateKey }:{ rows: Row[]; dateKey: "jadwal_kgb_berikutnya" | "jadwal_pangkat_berikutnya" }) {
  return (
    <table className="min-w-full divide-y">
      <thead>
        <tr className="bg-white">
          <Th>Nama</Th>
          <Th>NIP</Th>
          <Th>Jadwal</Th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {rows.length === 0 && (
          <tr><Td colSpan={3} className="p-4 text-center text-sm text-gray-500">Tidak ada yang due</Td></tr>
        )}
        {rows.map(row => (
          <tr key={row.id} className="hover:bg-gray-50">
            <Td>{row.nama}</Td>
            <Td className="font-mono">{row.nip}</Td>
            <Td className="font-medium">{toISODateInput(row[dateKey] as any)}</Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Th({ children }: { children: any }) {
  return <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">{children}</th>;
}
function Td({ children, className="", colSpan }: { children: any; className?: string; colSpan?: number }) {
  return <td className={"px-4 py-3 text-sm " + className} colSpan={colSpan}>{children}</td>;
}
