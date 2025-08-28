"use client";

import { useEffect, useRef, useState } from "react";
import { parseJsonSafe } from "@/lib/json";

type Row = {
  id?: number;
  nama?: string;
  nip?: string;
  tmt_pns?: string | null;
  riwayat_tmt_kgb?: string | null;
  riwayat_tmt_pangkat?: string | null;
  jadwal_kgb_berikutnya?: string | null;
  jadwal_pangkat_berikutnya?: string | null;
};

type Props = {
  initial?: Row | null;
  onSaved?: (row: Row) => void;
  onCancel?: () => void;
};

// --- Helpers tanggal ---
function toISO(d?: string | null) {
  if (!d) return "";
  const [y, m, dd] = (d || "").slice(0, 10).split("-").map(Number);
  if (!y || !m || !dd) return "";
  const dt = new Date(y, m - 1, dd);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd2 = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd2}`;
}

function addYearsISO(ymd: string, years: number) {
  if (!ymd) return "";
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return "";
  const dt = new Date(y, m - 1, d);
  dt.setFullYear(dt.getFullYear() + years);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd2 = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd2}`;
}

export default function AsnForm({ initial, onSaved, onCancel }: Props) {
  const [nama, setNama] = useState(initial?.nama ?? "");
  const [nip, setNip] = useState(initial?.nip ?? "");
  const [tmt_pns, setTmtPns] = useState(toISO(initial?.tmt_pns));
  const [riwayat_tmt_kgb, setRiwayatKgb] = useState(toISO(initial?.riwayat_tmt_kgb));
  const [riwayat_tmt_pangkat, setRiwayatPangkat] = useState(toISO(initial?.riwayat_tmt_pangkat));
  const [jadwal_kgb_berikutnya, setJadwalKgb] = useState(toISO(initial?.jadwal_kgb_berikutnya));
  const [jadwal_pangkat_berikutnya, setJadwalPangkat] = useState(toISO(initial?.jadwal_pangkat_berikutnya));

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [manualKgb, setManualKgb] = useState<boolean>(Boolean(initial?.jadwal_kgb_berikutnya));
  const [manualPangkat, setManualPangkat] = useState<boolean>(Boolean(initial?.jadwal_pangkat_berikutnya));

  const isEdit = Boolean(initial?.id);
  const namaRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => { namaRef.current?.focus(); }, []);

  // Validasi sederhana
  const namaOk = nama.trim().length >= 3;
  const nipOk = /^\d{18}$/.test(nip.trim());
  const canSave = namaOk && nipOk;

  // Auto-isi jadwal KGB = Riwayat KGB + 2 tahun (jika belum diubah manual)
  useEffect(() => {
    if (!manualKgb) {
      if (riwayat_tmt_kgb) {
        setJadwalKgb(addYearsISO(riwayat_tmt_kgb, 2));
      } else {
        setJadwalKgb("");
      }
    }
  }, [riwayat_tmt_kgb, manualKgb]);

  // Auto-isi jadwal Pangkat = Riwayat Pangkat + 4 tahun (jika belum diubah manual)
  useEffect(() => {
    if (!manualPangkat) {
      if (riwayat_tmt_pangkat) {
        setJadwalPangkat(addYearsISO(riwayat_tmt_pangkat, 4));
      } else {
        setJadwalPangkat("");
      }
    }
  }, [riwayat_tmt_pangkat, manualPangkat]);

  // Input handlers
  const onNama = (e: React.ChangeEvent<HTMLInputElement>) => setNama(e.target.value);
  const onNip = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D+/g, "").slice(0, 18); // hanya angka, maks 18
    setNip(v);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || !canSave) return;

    setSaving(true);
    setMsg(null);
    try {
      const payload = {
        nama: nama.trim(),
        nip: nip.trim(),
        tmt_pns: tmt_pns || null,
        riwayat_tmt_kgb: riwayat_tmt_kgb || null,
        riwayat_tmt_pangkat: riwayat_tmt_pangkat || null,
        jadwal_kgb_berikutnya: jadwal_kgb_berikutnya || null,
        jadwal_pangkat_berikutnya: jadwal_pangkat_berikutnya || null,
      };

      const res = await fetch(isEdit ? `/api/asn/${initial!.id}` : "/api/asn", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const j = await parseJsonSafe(res);
      if (!res.ok) throw new Error(j?.error || j?._text || "Gagal menyimpan data");

      onSaved?.(j);
    } catch (e: any) {
      setMsg(String(e?.message || e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      {msg && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium">Nama</label>
          <input
            ref={namaRef}
            value={nama}
            onChange={onNama}
            className="w-full rounded-lg border px-3 py-2 outline-none ring-2 ring-transparent focus:ring-indigo-200"
            placeholder="Nama ASN"
            required
          />
          {!namaOk && <p className="mt-1 text-xs text-red-600">Minimal 3 karakter.</p>}
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium">NIP (18 digit)</label>
          <input
            value={nip}
            onChange={onNip}
            inputMode="numeric"
            pattern="\d{18}"
            className="w-full rounded-lg border px-3 py-2 outline-none ring-2 ring-transparent focus:ring-indigo-200"
            placeholder="Contoh: 198712312019032001"
            required
          />
          {!nipOk && <p className="mt-1 text-xs text-red-600">NIP harus 18 digit angka.</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">TMT PNS</label>
          <input
            type="date"
            value={tmt_pns}
            onChange={(e) => setTmtPns(e.target.value || "")}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Riwayat TMT KGB</label>
          <input
            type="date"
            value={riwayat_tmt_kgb}
            onChange={(e) => setRiwayatKgb(e.target.value || "")}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div className="sm:col-span-2">
          <div className="flex items-center justify-between">
            <label className="mb-1 block text-sm font-medium">Jadwal KGB Berikutnya</label>
            <button
              type="button"
              className="text-xs text-indigo-700 hover:underline"
              onClick={() => { setManualKgb(false); /* trigger re-calc via effect */ }}
              title="Hitung otomatis dari Riwayat TMT KGB (+2 tahun)"
            >
              ↺ Otomatis
            </button>
          </div>
          <input
            type="date"
            value={jadwal_kgb_berikutnya}
            onChange={(e) => { setJadwalKgb(e.target.value || ""); setManualKgb(true); }}
            className="w-full rounded-lg border px-3 py-2"
          />
          <p className="mt-1 text-[11px] text-gray-500">Otomatis = Riwayat TMT KGB + <b>2 tahun</b>.</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Riwayat TMT Pangkat</label>
          <input
            type="date"
            value={riwayat_tmt_pangkat}
            onChange={(e) => setRiwayatPangkat(e.target.value || "")}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div className="sm:col-span-2">
          <div className="flex items-center justify-between">
            <label className="mb-1 block text-sm font-medium">Jadwal Pangkat Berikutnya</label>
            <button
              type="button"
              className="text-xs text-indigo-700 hover:underline"
              onClick={() => { setManualPangkat(false); /* trigger re-calc via effect */ }}
              title="Hitung otomatis dari Riwayat TMT Pangkat (+4 tahun)"
            >
              ↺ Otomatis
            </button>
          </div>
          <input
            type="date"
            value={jadwal_pangkat_berikutnya}
            onChange={(e) => { setJadwalPangkat(e.target.value || ""); setManualPangkat(true); }}
            className="w-full rounded-lg border px-3 py-2"
          />
          <p className="mt-1 text-[11px] text-gray-500">Otomatis = Riwayat TMT Pangkat + <b>4 tahun</b>.</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={!canSave || saving}
          className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving ? "Menyimpan…" : (isEdit ? "Simpan Perubahan" : "Simpan")}
        </button>
      </div>
    </form>
  );
}
