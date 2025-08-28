// components/AsnForm.tsx
"use client";

import { useState } from "react";

export type Asn = {
  id?: number;
  nama: string;
  nip: string;
  tmt_pns?: string | null;
  riwayat_tmt_kgb?: string | null;
  riwayat_tmt_pangkat?: string | null;
  jadwal_kgb_berikutnya?: string | null;
  jadwal_pangkat_berikutnya?: string | null;
  updated_at?: string | null;
};

type Props = {
  initial?: Partial<Asn> | null;
  onCancel?: () => void;
  onSaved?: (row: Asn) => void;
};

function toDateInput(v?: string | null) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function AsnForm({ initial, onCancel, onSaved }: Props) {
  const [nama, setNama] = useState(initial?.nama ?? "");
  const [nip, setNip] = useState(initial?.nip ?? "");
  const [tmt_pns, setTmtPns] = useState(toDateInput(initial?.tmt_pns));
  const [riwayat_tmt_kgb, setRiwayatTmtKgb] = useState(toDateInput(initial?.riwayat_tmt_kgb));
  const [riwayat_tmt_pangkat, setRiwayatTmtPangkat] = useState(toDateInput(initial?.riwayat_tmt_pangkat));
  const [jadwal_kgb_berikutnya, setJadwalKgbBerikutnya] = useState(toDateInput(initial?.jadwal_kgb_berikutnya));
  const [jadwal_pangkat_berikutnya, setJadwalPangkatBerikutnya] = useState(toDateInput(initial?.jadwal_pangkat_berikutnya));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const isEdit = !!initial?.id;
  const canSave = (nama.trim().length > 0) && (nip.trim().length > 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave || saving) return;
    setSaving(true);
    setMsg(null);
    try {
      const payload: any = {
        nama: nama.trim(),
        nip: nip.trim(),
        tmt_pns: tmt_pns || null,
        riwayat_tmt_kgb: riwayat_tmt_kgb || null,
        riwayat_tmt_pangkat: riwayat_tmt_pangkat || null,
        jadwal_kgb_berikutnya: jadwal_kgb_berikutnya || null,
        jadwal_pangkat_berikutnya: jadwal_pangkat_berikutnya || null,
      };
      let res: Response;
      if (isEdit) {
        res = await fetch(`/api/asn/${initial?.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/asn", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Gagal menyimpan data");
      onSaved?.(j);
    } catch (e:any) {
      setMsg(String(e?.message || e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium">Nama</label>
          <input
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 outline-none ring-2 ring-transparent focus:ring-indigo-200"
            placeholder="Nama lengkap"
            required
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium">NIP</label>
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            value={nip}
            onChange={(e) => setNip(e.target.value.replace(/[^0-9]/g, ""))}
            className="w-full rounded-xl border px-3 py-2 outline-none ring-2 ring-transparent focus:ring-indigo-200"
            placeholder="197605201998121001"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">TMT PNS</label>
          <input type="date" value={tmt_pns} onChange={(e) => setTmtPns(e.target.value || "")}
                 className="w-full rounded-xl border px-3 py-2 outline-none ring-2 ring-transparent focus:ring-indigo-200" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Riwayat TMT Kenaikan Gaji Berkala</label>
          <input type="date" value={riwayat_tmt_kgb} onChange={(e) => setRiwayatTmtKgb(e.target.value || "")}
                 className="w-full rounded-xl border px-3 py-2 outline-none ring-2 ring-transparent focus:ring-indigo-200" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Riwayat TMT Kenaikan Pangkat</label>
          <input type="date" value={riwayat_tmt_pangkat} onChange={(e) => setRiwayatTmtPangkat(e.target.value || "")}
                 className="w-full rounded-xl border px-3 py-2 outline-none ring-2 ring-transparent focus:ring-indigo-200" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Jadwal Kenaikan Gaji Berkala Berikutnya</label>
          <input type="date" value={jadwal_kgb_berikutnya} onChange={(e) => setJadwalKgbBerikutnya(e.target.value || "")}
                 className="w-full rounded-xl border px-3 py-2 outline-none ring-2 ring-transparent focus:ring-indigo-200" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium">Jadwal Kenaikan Pangkat Berikutnya</label>
          <input type="date" value={jadwal_pangkat_berikutnya} onChange={(e) => setJadwalPangkatBerikutnya(e.target.value || "")}
                 className="w-full rounded-xl border px-3 py-2 outline-none ring-2 ring-transparent focus:ring-indigo-200" />
        </div>
      </div>

      {msg && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{msg}</div>}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2 pt-2">
        <button type="button" onClick={() => onCancel?.()} className="rounded-xl border px-4 py-2 hover:bg-gray-50">
          Batal
        </button>
        <button type="submit" disabled={!canSave || saving}
                className="rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
          {saving ? "Menyimpan..." : (isEdit ? "Simpan Perubahan" : "Simpan")}
        </button>
      </div>
    </form>
  );
}
