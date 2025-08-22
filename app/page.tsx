"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/Modal";
import Confirm from "@/components/Confirm";
import AsnForm, { type Asn } from "@/components/AsnForm";
import { toISODateInput } from "@/utils/date";

export default function Home() {
  const [data, setData] = useState<Asn[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Asn | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dueKgb, setDueKgb] = useState<Asn[]>([]);
  const [duePangkat, setDuePangkat] = useState<Asn[]>([]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/asn", { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setData(json);

      // load reminders (in-app only)
      const r = await fetch("/api/reminders", { cache: "no-store" });
      if (r.ok) {
        const j = await r.json();
        setDueKgb(j.kgb || []);
        setDuePangkat(j.pangkat || []);
      }
    } catch (e: any) {
      setError(e?.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    if (!keyword) return data;
    return data.filter(d =>
      d.nama?.toLowerCase().includes(keyword) ||
      (d as any).nip?.toLowerCase().includes(keyword)
    );
  }, [q, data]);

  const startCreate = () => { setEditing(null); setModalOpen(true); };
  const startEdit = (row: Asn) => { setEditing(row); setModalOpen(true); };

  const doDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/asn/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setConfirmId(null);
      load();
    } catch (e:any) {
      alert("Gagal menghapus data: " + (e?.message || ""));
    }
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
          />
        </div>
        <button onClick={startCreate} className="rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">
          + Tambah ASN
        </button>
      </div>

      {(dueKgb.length > 0 || duePangkat.length > 0) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-medium">🔔 Pengingat (≤ 3 bulan):</span>
            <span>KGB: <b>{dueKgb.length}</b></span>
            <span>Pangkat: <b>{duePangkat.length}</b></span>
          </div>
          <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
            {dueKgb.length > 0 && (
              <div>
                <div className="mb-1 text-xs font-semibold uppercase text-amber-600">KGB terdekat</div>
                <ul className="list-disc pl-5">
                  {dueKgb.slice(0, 5).map((r: any, i: number) => (
                    <li key={r.id ?? 'k'+i}>{toISODateInput(r.jadwal_kgb_berikutnya)} — {r.nama} ({r.nip || "-"})</li>
                  ))}
                </ul>
              </div>
            )}
            {duePangkat.length > 0 && (
              <div>
                <div className="mb-1 text-xs font-semibold uppercase text-amber-600">Kenaikan Pangkat terdekat</div>
                <ul className="list-disc pl-5">
                  {duePangkat.slice(0, 5).map((r: any, i: number) => (
                    <li key={r.id ?? 'p'+i}>{toISODateInput(r.jadwal_pangkat_berikutnya)} — {r.nama} ({r.nip || "-"})</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">Error: {error}</div>}

      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="min-w-full divide-y">
          <thead className="bg-gray-50">
            <tr>
              <Th>Nama</Th>
              <Th>NIP</Th>
              <Th>TMT PNS</Th>
              <Th>Riwayat TMT KGB</Th>
              <Th>Riwayat TMT Pangkat</Th>
              <Th>Jadwal KGB Berikutnya</Th>
              <Th>Jadwal Kenaikan Pangkat Berikutnya</Th>
              <Th>Aksi</Th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && (<tr><td className="p-4 text-center" colSpan={8}>Memuat data...</td></tr>)}
            {!loading && filtered.length === 0 && (<tr><td className="p-4 text-center" colSpan={8}>Belum ada data</td></tr>)}
            {filtered.map((row: any) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <Td>{row.nama}</Td>
                <Td className="font-mono">{row.nip}</Td>
                <Td>{toISODateInput(row.tmt_pns)}</Td>
                <Td>{toISODateInput(row.riwayat_tmt_kgb)}</Td>
                <Td>{toISODateInput(row.riwayat_tmt_pangkat)}</Td>
                <Td className="font-medium">{toISODateInput(row.jadwal_kgb_berikutnya)}</Td>
                <Td className="font-medium">{toISODateInput(row.jadwal_pangkat_berikutnya)}</Td>
                <Td>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(row)} className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50">Edit</button>
                    <button onClick={() => setConfirmId(row.id!)} className="rounded-lg bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700">Hapus</button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit ASN" : "Tambah ASN"}>
        <AsnForm initial={editing ?? undefined} onDone={() => { setModalOpen(false); load(); }} />
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

function Th({ children }: { children: any }) { return <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{children}</th>; }
function Td({ children, className="" }: { children: any; className?: string }) { return <td className={"px-4 py-3 text-sm " + className}>{children}</td>; }
