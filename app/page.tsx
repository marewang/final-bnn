// app/page.tsx
"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import AsnForm from "@/components/AsnForm";

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
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editRow, setEditRow] = useState<Row | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const u = new URL("/api/asn", window.location.origin);
      if (q) u.searchParams.set("q", q);
      u.searchParams.set("page", String(page));
      u.searchParams.set("pageSize", String(pageSize));
      const r = await fetch(u, { cache: "no-store", credentials: "include" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Gagal memuat data");
      setRows(j?.data ?? []);
      setTotal(j?.total ?? 0);
    } catch (e: any) {
      setError(e?.message || "Gagal memuat data");
    } finally {
      setLoading(false);
      setInitialLoaded(true);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [q, page, pageSize]);

  // Sheet — lock body scroll saat terbuka & tutup pakai ESC
  useLayoutEffect(() => {
    if (showForm) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowForm(false); };
      window.addEventListener("keydown", onKey);
      return () => {
        document.body.style.overflow = prev;
        window.removeEventListener("keydown", onKey);
      };
    }
  }, [showForm]);

  const openCreate = () => { setEditRow(null); setShowForm(true); };
  const openEdit = (r: Row) => { setEditRow(r); setShowForm(true); };

  const onSaved = () => {
    setShowForm(false);
    setEditRow(null);
    fetchData();
  };

  const onDelete = async (id: number) => {
    if (!confirm("Hapus data ini?")) return;
    const r = await fetch(`/api/asn/${id}`, { method: "DELETE", credentials: "include" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      alert(j?.error || "Gagal menghapus");
      return;
    }
    fetchData();
  };

  return (
    <div className="space-y-4">
      {/* Header + search + add */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Daftar ASN</h1>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={q}
            onChange={(e) => { setPage(1); setQ(e.target.value); }}
            className="w-full sm:w-64 rounded-xl border px-3 py-2 text-sm outline-none ring-2 ring-transparent focus:ring-indigo-200"
            placeholder="Cari nama atau NIP…"
          />
          <button
            type="button"
            onClick={openCreate}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Tambah ASN
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Error: {error}
        </div>
      )}

      {/* Loading skeleton (pertama kali / saat cari & paging) */}
      {loading && (
        <div className="grid gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border bg-white p-4">
              <div className="mb-3 h-4 w-1/3 rounded bg-gray-200" />
              <div className="grid grid-cols-2 gap-3">
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
        <div className="grid gap-3 sm:hidden">
          {rows.map((r) => (
            <div key={r.id} className="rounded-2xl border bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold">{r.nama}</div>
                  <div className="text-xs text-gray-600">NIP: {r.nip}</div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(r)} className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50">Edit</button>
                  <button onClick={() => onDelete(r.id)} className="rounded-lg border px-2 py-1 text-xs text-red-600 hover:bg-red-50">Hapus</button>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div><div className="text-gray-500">TMT PNS</div><div className="font-medium">{fmt(r.tmt_pns)}</div></div>
                <div><div className="text-gray-500">Riwayat TMT KGB</div><div className="font-medium">{fmt(r.riwayat_tmt_kgb)}</div></div>
                <div><div className="text-gray-500">Riwayat TMT Pangkat</div><div className="font-medium">{fmt(r.riwayat_tmt_pangkat)}</div></div>
                <div><div className="text-gray-500">Jadwal KGB</div><div className="font-medium">{fmt(r.jadwal_kgb_berikutnya)}</div></div>
                <div><div className="text-gray-500">Jadwal Pangkat</div><div className="font-medium">{fmt(r.jadwal_pangkat_berikutnya)}</div></div>
              </div>
            </div>
          ))}
          {!rows.length && initialLoaded && !error && (
            <div className="rounded-2xl border bg-white p-6 text-center">
              <div className="mb-2 text-gray-500">Belum ada data.</div>
              <button onClick={openCreate} className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50">+ Tambah data pertama</button>
            </div>
          )}
        </div>
      )}

      {/* Desktop table */}
      {!loading && (
        <div className="hidden overflow-x-auto rounded-2xl border bg-white shadow-sm sm:block">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-3 py-2">Nama</th>
                <th className="px-3 py-2">NIP</th>
                <th className="px-3 py-2">TMT PNS</th>
                <th className="px-3 py-2">Riwayat TMT KGB</th>
                <th className="px-3 py-2">Riwayat TMT Pangkat</th>
                <th className="px-3 py-2">Jadwal KGB</th>
                <th className="px-3 py-2">Jadwal Pangkat</th>
                <th className="px-3 py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
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
                      <button onClick={() => openEdit(r)} className="rounded-lg border px-3 py-1 text-xs hover:bg-gray-50">Edit</button>
                      <button onClick={() => onDelete(r.id)} className="rounded-lg border px-3 py-1 text-xs text-red-600 hover:bg-red-50">Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length && initialLoaded && !error && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                    Belum ada data. <button onClick={openCreate} className="ml-2 rounded-lg border px-2 py-1 text-xs hover:bg-gray-50">Tambah data pertama</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && (
        <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
          <p className="text-xs text-gray-600">
            Halaman {page} / {pageCount} • Total {total} data
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border px-3 py-1 text-sm disabled:opacity-60"
            >
              ‹ Prev
            </button>
            <button
              disabled={page >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              className="rounded-lg border px-3 py-1 text-sm disabled:opacity-60"
            >
              Next ›
            </button>
          </div>
        </div>
      )}

      {/* SHEET (drawer) — Fixed + backdrop, tidak menimpa layout list */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="flex-1 bg-black/40 backdrop-blur-[1px]"
            onClick={() => setShowForm(false)}
          />
          {/* Panel */}
          <div className="ml-auto h-full w-full max-w-xl overflow-auto bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">
                {editRow ? "Edit ASN" : "Tambah ASN"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border px-3 py-1 hover:bg-gray-50"
                aria-label="Tutup"
              >
                Tutup
              </button>
            </div>
            <AsnForm
              initial={editRow ?? undefined}
              onCancel={() => setShowForm(false)}
              onSaved={onSaved}
            />
          </div>
        </div>
      )}
    </div>
  );
}
