"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/Modal";
import Confirm from "@/components/Confirm";
import AsnForm, { type Asn } from "@/components/AsnForm";
import { toISODateInput } from "@/utils/date";
import { toast } from "@/components/toast";

type SortKey = {
  field: keyof Asn | "updated_at";
  dir: "asc" | "desc";
};

export default function Home() {
  const [rows, setRows] = useState<Asn[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Asn | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);

  const [sort, setSort] = useState<SortKey>({ field: "updated_at", dir: "desc" });

  const fetchData = async (opts?: { keepPage?: boolean }) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      params.set("page", String(opts?.keepPage ? page : 1));
      params.set("pageSize", String(pageSize));
      const res = await fetch(`/api/asn?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setRows(json.data || []);
      setPage(json.page || 1);
      setPageCount(json.pageCount || 1);
      setTotal(json.total || 0);
    } catch (e: any) {
      setError(e?.message || "Gagal memuat data");
      toast({ title: "Gagal memuat data", description: String(e?.message || e), variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onSearch = () => fetchData({ keepPage: false });
  const onChangePage = (p: number) => { setPage(p); setTimeout(() => fetchData({ keepPage: true }), 0); };

  const sorted = useMemo(() => {
    const data = [...rows];
    const { field, dir } = sort;
    const getVal = (r: any) => {
      const v = r[field];
      if (["tmt_pns", "riwayat_tmt_kgb", "riwayat_tmt_pangkat", "jadwal_kgb_berikutnya", "jadwal_pangkat_berikutnya", "updated_at"].includes(field as string)) {
        return v ? new Date(v).getTime() : 0;
      }
      if (typeof v === "string") return v.toLowerCase();
      return v ?? "";
    };
    data.sort((a, b) => {
      const va = getVal(a), vb = getVal(b);
      let cmp = 0;
      if (typeof va === "number" && typeof vb === "number") cmp = va - vb;
      else cmp = String(va).localeCompare(String(vb));
      return dir === "asc" ? cmp : -cmp;
    });
    return data;
  }, [rows, sort]);

  const startCreate = () => { setEditing(null); setModalOpen(true); };
  const startEdit = (row: Asn) => { setEditing(row); setModalOpen(true); };

  const doDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/asn/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setConfirmId(null);
      toast({ title: "Terhapus", description: "Data ASN berhasil dihapus.", variant: "success" });
      fetchData({ keepPage: true });
    } catch (e:any) {
      toast({ title: "Gagal menghapus data", description: String(e?.message || e), variant: "error" });
    }
  };

  const ThSort = ({ children, field }: { children: any; field: SortKey["field"] }) => {
    const isActive = sort.field === field;
    const dir = isActive ? sort.dir : undefined;
    const icon = !isActive ? "↕" : dir === "asc" ? "↑" : "↓";
    return (
      <th
        className={"cursor-pointer select-none px-4 py-3 text-left text-sm font-semibold " + (isActive ? "text-indigo-700" : "text-gray-700")}
        onClick={() => {
          setSort(prev => (prev.field === field ? { field, dir: prev.dir === "asc" ? "desc" : "asc" } : { field, dir: "asc" }));
        }}
        title="Klik untuk mengurutkan"
      >
        <span className="inline-flex items-center gap-1">{children} <span className="text-xs opacity-70">{icon}</span></span>
      </th>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <input
            placeholder="Cari nama atau NIP..."
            className="w-72 rounded-xl border px-3 py-2 outline-none ring-2 ring-transparent focus:ring-indigo-200"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onSearch(); }}
          />
          <button type="button" onClick={onSearch} className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">Cari</button>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Baris:</label>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); setTimeout(() => fetchData({ keepPage: false }), 0); }}
            className="rounded-lg border px-2 py-1 text-sm"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <button type="button" onClick={startCreate} className="rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">
            + Tambah Pegawai
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">Error: {error}</div>}

      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="min-w-full divide-y">
          <thead className="bg-gray-50">
            <tr>
              <ThSort field="nama">Nama</ThSort>
              <ThSort field="nip">NIP</ThSort>
              <ThSort field="tmt_pns">TMT PNS</ThSort>
              <ThSort field="riwayat_tmt_kgb">Riwayat TMT KGB</ThSort>
              <ThSort field="riwayat_tmt_pangkat">Riwayat TMT Pangkat</ThSort>
              <ThSort field="jadwal_kgb_berikutnya">Jadwal KGB Berikutnya</ThSort>
              <ThSort field="jadwal_pangkat_berikutnya">Jadwal Kenaikan Pangkat Berikutnya</ThSort>
              <ThSort field="updated_at">Diperbarui</ThSort>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && (<tr><td className="p-4 text-center" colSpan={9}>Memuat data...</td></tr>)}
            {!loading && sorted.length === 0 && (<tr><td className="p-4 text-center" colSpan={9}>Belum ada data</td></tr>)}
            {sorted.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{row.nama}</td>
                <td className="px-4 py-3 text-sm font-mono">{row.nip}</td>
                <td className="px-4 py-3 text-sm">{toISODateInput(row.tmt_pns)}</td>
                <td className="px-4 py-3 text-sm">{toISODateInput(row.riwayat_tmt_kgb)}</td>
                <td className="px-4 py-3 text-sm">{toISODateInput(row.riwayat_tmt_pangkat)}</td>
                <td className="px-4 py-3 text-sm font-medium">{toISODateInput(row.jadwal_kgb_berikutnya)}</td>
                <td className="px-4 py-3 text-sm font-medium">{toISODateInput(row.jadwal_pangkat_berikutnya)}</td>
                <td className="px-4 py-3 text-sm">{toISODateInput((row as any).updated_at)}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="relative z-10 flex gap-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); startEdit(row); }}
                      className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setConfirmId(row.id!); }}
                      className="rounded-lg bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-gray-600">Total: {total} data</div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded-lg border px-3 py-1 text-sm disabled:opacity-50"
            onClick={() => onChangePage(Math.max(1, page - 1))}
            disabled={page <= 1}
          >
            ‹ Prev
          </button>
          <span className="px-2 text-sm">Hal {page} / {pageCount}</span>
          <button
            type="button"
            className="rounded-lg border px-3 py-1 text-sm disabled:opacity-50"
            onClick={() => onChangePage(Math.min(pageCount, page + 1))}
            disabled={page >= pageCount}
          >
            Next ›
          </button>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit ASN" : "Tambah ASN"}>
        <AsnForm initial={editing ?? undefined} onDone={() => { setModalOpen(false); fetchData({ keepPage: true }); }} />
      </Modal>

      <Modal open={confirmId !== null} onClose={() => setConfirmId(null)} title="Konfirmasi Hapus">
        <Confirm
          message="Yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan."
          onCancel={() => setConfirmId(null)}
          onConfirm={() => doDelete(confirmId!)}
        />
      </Modal>
    </div>
  );
}
