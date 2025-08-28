"use client";

import { useEffect, useState } from "react";
import AsnForm from "@/components/AsnForm";
import { parseJsonSafe } from "@/lib/json";

type Row = {
  id: number;
  nama: string;
  nip: string;
  tmt_pns?: string | null;
  riwayat_tmt_kgb?: string | null;
  riwayat_tmt_pangkat?: string | null;
  jadwal_kgb_berikutnya?: string | null;
  jadwal_pangkat_berikutnya?: string | null;
  updated_at?: string | null;
};

function fmt(d?: string | null) {
  if (!d) return "-";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "-";
  return x.toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "2-digit" });
}

export default function Page() {
  // Guard ringan di sisi client (tambahan selain middleware)
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/auth/me", { cache: "no-store", credentials: "include" });
        if (!r.ok) window.location.href = "/login";
      } catch {
        window.location.href = "/login";
      }
    })();
  }, []);

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editRow, setEditRow] = useState<Row | null>(null);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const u = new URL("/api/asn", window.location.origin);
      if (q.trim()) u.searchParams.set("q", q.trim());
      u.searchParams.set("page", String(page));
      u.searchParams.set("pageSize", String(pageSize));

      const r = await fetch(u, { cache: "no-store", credentials: "include" });
      const j = await parseJsonSafe(r);
      if (!r.ok) {
        const msg = j?.error || j?._text || `Gagal memuat data (HTTP ${r.status})`;
        throw new Error(msg);
      }

      setRows(Array.isArray(j?.data) ? j.data : []);
      setTotal(Number(j?.total ?? 0));
    } catch (e: any) {
      setRows([]);
      setTotal(0);
      setError(e?.message || "Gagal memuat data");
    } finally {
      setLoading(false);
      setInitialLoaded(true);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  const onDelete = async (id: number) => {
    if (!confirm("Hapus data ini?")) return;
    try {
      const r = await fetch(`/api/asn/${id}`, { method: "DELETE", credentials: "include" });
      const j = await parseJsonSafe(r);
      if (!r.ok) throw new Error(j?.error || j?._text || `Gagal menghapus (HTTP ${r.status})`);
      // refresh
      const currentCount = rows.length;
      // bila item terakhir di halaman dihapus, mundurkan halaman bila perlu
      if (currentCount === 1 && page > 1) setPage((p) => p - 1);
      else fetchData();
    } catch (e: any) {
      alert(e?.message || "Gagal menghapus");
    }
  };

  const openCreate = () => { setEditRow(null); setShowForm(true); };
  const openEdit = (r: Row) => { setEditRow(r); setShowForm(true); };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dashboard Pegawai</h1>
          <p className="text-sm text-gray-600">Kelola Data Pegawai</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            onKeyDown={(e) => { if (e.key === "Enter") fetchData(); }}
            placeholder="Cari nama/NIP…"
            className="w-48 rounded-lg border px-3 py-1.5 text-sm outline-none ring-2 ring-transparent focus:ring-indigo-200"
          />
          <button
            onClick={fetchData}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Cari
          </button>
          <button
            onClick={openCreate}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Tambah ASN
          </button>
        </div>
      </div>

      {/* Banner error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Tabel */}
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-3 py-2">Nama</th>
              <th className="px-3 py-2">NIP</th>
              <th className="px-3 py-2">TMT PNS</th>
              <th className="px-3 py-2">Riwayat KGB</th>
              <th className="px-3 py-2">Riwayat Pangkat</th>
              <th className="px-3 py-2">Jadwal KGB</th>
              <th className="px-3 py-2">Jadwal Pangkat</th>
              <th className="px-3 py-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="px-3 py-6">
                  <div className="animate-pulse space-y-2">
                    <div className="h-3 rounded bg-gray-200" />
                    <div className="h-3 rounded bg-gray-200" />
                    <div className="h-3 rounded bg-gray-200" />
                  </div>
                </td>
              </tr>
            )}

            {!loading && rows.length === 0 && initialLoaded && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-gray-500">
                  {q ? "Data tidak ditemukan." : "Belum ada data."}
                </td>
              </tr>
            )}

            {!loading && rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">{r.nama}</td>
                <td className="px-3 py-2">{r.nip}</td>
                <td className="px-3 py-2">{fmt(r.tmt_pns)}</td>
                <td className="px-3 py-2">{fmt(r.riwayat_tmt_kgb)}</td>
                <td className="px-3 py-2">{fmt(r.riwayat_tmt_pangkat)}</td>
                <td className="px-3 py-2">{fmt(r.jadwal_kgb_berikutnya)}</td>
                <td className="px-3 py-2">{fmt(r.jadwal_pangkat_berikutnya)}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button
                      className="rounded-lg border px-2 py-1 hover:bg-gray-50"
                      onClick={() => openEdit(r)}
                    >
                      Edit
                    </button>
                    <button
                      className="rounded-lg border px-2 py-1 text-red-600 hover:bg-red-50"
                      onClick={() => onDelete(r.id)}
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>

          {/* Footer paging */}
          <tfoot>
            <tr className="border-t">
              <td colSpan={8} className="px-3 py-2">
                <div className="flex items-center justify-between text-sm">
                  <div>Total: {total}</div>
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded-lg border px-2 py-1 disabled:opacity-50"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      ‹ Sebelumnya
                    </button>
                    <span>Hal {page} / {pageCount}</span>
                    <button
                      className="rounded-lg border px-2 py-1 disabled:opacity-50"
                      disabled={page >= pageCount}
                      onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    >
                      Berikutnya ›
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Sheet Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/30 sm:items-center sm:justify-center">
          <div className="w-full rounded-t-2xl bg-white p-4 shadow-xl sm:max-w-xl sm:rounded-2xl">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-base font-semibold">
                {editRow ? "Ubah ASN" : "Tambah ASN"}
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border px-2 py-1 text-sm hover:bg-gray-50"
              >
                ✕
              </button>
            </div>
            <AsnForm
              initial={editRow}
              onCancel={() => setShowForm(false)}
              onSaved={() => {
                setShowForm(false);
                fetchData();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
