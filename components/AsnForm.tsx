// components/AsnForm.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

function isValidDateInput(v?: string) {
  if (!v) return true;
  const d = new Date(v);
  return !Number.isNaN(d.getTime());
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

  // Focus ke input nama saat form dibuka
  const nameRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  // VALIDASI
  const vNama = useMemo(() => nama.trim().length >= 3, [nama]);
  const vNip = useMemo(() => /^\d{18}$/.test(nip.trim()), [nip]);
  const vTmtPns = useMemo(() => isValidDateInput(tmt_pns), [tmt_pns]);
  const vKgb = useMemo(() => isValidDateInput(riwayat_tmt_kgb), [riwayat_tmt_kgb]);
  const vPangkat = useMemo(() => isValidDateInput(riwayat_tmt_pangkat), [riwayat_tmt_pangkat]);
  const vJadwalKgb = useMemo(() => isValidDateInput(jadwal_kgb_berikutnya), [jadwal_kgb_berikutnya]);
  const vJadwalPangkat = useMemo(() => isValidDateInput(jadwal_pangkat_berikutnya), [jadwal_pangkat_berikutnya]);

  const canSave = vNama && vNip && vTmtPns && vKgb && vPangkat && vJadwalKgb && vJadwalPangkat && !saving;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
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
      const res = await fetch(isEdit ? `/api/asn/${initial?.id}` : "/api/asn", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Gagal menyimpan data");
      onSaved?.(j);
    } catch (e: any) {
      setMsg(String(e?.message || e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* NAMA */}
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium" htmlFor="f-nama">Nama</label>
          <input
            id="f-nama"
            ref={nameRef}
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className={`w-full rounded-xl border px-3 py-2 outline-none ring-2 ring-transparent focus:ring-indigo-200 ${!vNama ? "border-red-300" : ""}`}
            placeholder="Nama lengkap"
            aria-invalid={!vNama}
            aria-describedby={!vNama ? "err-nama" : undefined}
            required
          />
          {!vNama && (
            <p id="err-nama" className="mt-1 text-xs text-red-600">Minimal 3 karakter.</p>
          )}
        </div>

        {/* NIP */}
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium" htmlFor="f-nip">NIP</label>
          <input
            id="f-nip"
            inputMode="numeric"
            pattern="\d*"
            value={nip}
            onChange={(e) => setNip(e.target.value.replace(/[^0-9]/g, ""))}
            className={`w-full rounded-xl border px-3 py-2 outline-none ring-2 ring-transparent focus:ring-indigo-200 ${!vNip ? "border-red-300" : ""}`}
            placeholder="197605201998121001"
            aria-invalid={!vNip}
            aria-describedby={!vNip ? "err-nip" : undefined}
            required
          />
          {!vNip && (
            <p id="err-nip" className="mt-1 text-xs text-red-600">Harus 18 digit angka.</p>
          )}
        </div>

        {/* TANGGAL2 */}
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="f-tmtpns">TMT PNS</label>
          <input
            id="f-tmtpns"
            type="date" value={tmt_pns} onChange={(e) => setTmtPns(e.target.value || "")}
            className={`w-full rounded-xl border px-3 py-2 outline-none ring-2 ring-transparent focus:ring-indigo-200 ${!vTmtPns ? "border-red-300" : ""}`}
            aria-invalid={!vTmtPns}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="f-riwayatkgb">Riwayat TMT Kenaikan Gaji Berkala</label>
          <input
            id="f-riwayatkgb"
            type="date" value={riwayat_tmt_kgb} onChange={(e) => setRiwayatTmtKgb(e.target.value || "")}
            className={`w-full rounded-xl border px-3 py-2 outline-none ring-2 ring-transparent focus:ring-indigo-200 ${!vKgb ? "border-red-300" : ""}`}
            aria-invalid={!vKgb}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="f-riwayatpangkat">Riwayat TMT Kenaikan Pangkat</label>
          <input
            id="f-riwayatpangkat"
            type="date" value={riwayat_tmt_pangkat} onChange={(e) => setRiwayatTmtPangkat(e.target.value || "")}
            className={`w-full rounded-xl border px-3 py-2 outline-none ring-2 ring-transparent focus:ring-indigo-200 ${!vPangkat ? "border-red-300" : ""}`}
            aria-invalid={!vPangkat}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="f-jadwalkgb">Jadwal Kenaikan Gaji Berkala Berikutnya</label>
          <input
            id="f-jadwalkgb"
            type="date" value={jadwal_kgb_berikutnya} onChange={(e) => setJadwalKgbBerikutnya(e.target.value || "")}
            className={`w-full rounded-xl border px-3 py-2 outline-none ring-2 ring-transparent focus:ring-indigo-200 ${!vJadwalKgb ? "border-red-300" : ""}`}
            aria-invalid={!vJadwalKgb}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium" htmlFor="f-jadwalpangkat">Jadwal Kenaikan Pangkat Berikutnya</label>
          <input
            id="f-jadwalpangkat"
            type="date" value={jadwal_pangkat_berikutnya} onChange={(e) => setJadwalPangkatBerikutnya(e.target.value || "")}
            className={`w-full rounded-xl border px-3 py-2 outline-none ring-2 ring-transparent focus:ring-indigo-200 ${!vJadwalPangkat ? "border-red-300" : ""}`}
            aria-invalid={!vJadwalPangkat}
          />
        </div>
      </div>

      {msg && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{msg}</div>}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2 pt-2">
        <button type="button" onClick={() => onCancel?.()} className="rounded-xl border px-4 py-2 hover:bg-gray-50">
          Batal
        </button>
        <button
          type="submit"
          disabled={!canSave}
          className="rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving ? "Menyimpan..." : (isEdit ? "Simpan Perubahan" : "Simpan")}
        </button>
      </div>
    </form>
  );
}
