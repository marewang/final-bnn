"use client";
import { useEffect, useState } from "react";
import { addYears, toISODateInput } from "@/utils/date";

export type Asn = {
  id?: number;
  nama: string;
  nip: string;
  tmt_pns?: string | null;
  riwayat_tmt_kgb?: string | null;
  riwayat_tmt_pangkat?: string | null;
  jadwal_kgb_berikutnya?: string | null;
  jadwal_pangkat_berikutnya?: string | null;
};

export default function AsnForm({ initial, onDone }:{ initial?: Partial<Asn>; onDone?: () => void }) {
  const [form, setForm] = useState<Asn>({
    id: initial?.id,
    nama: initial?.nama ?? "",
    nip: initial?.nip ?? "",
    tmt_pns: initial?.tmt_pns ? toISODateInput(initial.tmt_pns) : "",
    riwayat_tmt_kgb: initial?.riwayat_tmt_kgb ? toISODateInput(initial.riwayat_tmt_kgb) : "",
    riwayat_tmt_pangkat: initial?.riwayat_tmt_pangkat ? toISODateInput(initial.riwayat_tmt_pangkat) : "",
    jadwal_kgb_berikutnya: initial?.jadwal_kgb_berikutnya ? toISODateInput(initial.jadwal_kgb_berikutnya) : "",
    jadwal_pangkat_berikutnya: initial?.jadwal_pangkat_berikutnya ? toISODateInput(initial.jadwal_pangkat_berikutnya) : ""
  });

  // Hitung otomatis jadwal jika riwayat diisi
  useEffect(() => {
    if (form.riwayat_tmt_kgb && !initial?.jadwal_kgb_berikutnya) {
      const d = addYears(form.riwayat_tmt_kgb, 2);
      setForm(prev => ({ ...prev, jadwal_kgb_berikutnya: toISODateInput(d ?? undefined) }));
    }
    if (form.riwayat_tmt_pangkat && !initial?.jadwal_pangkat_berikutnya) {
      const d = addYears(form.riwayat_tmt_pangkat, 4);
      setForm(prev => ({ ...prev, jadwal_pangkat_berikutnya: toISODateInput(d ?? undefined) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.riwayat_tmt_kgb, form.riwayat_tmt_pangkat]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      tmt_pns: form.tmt_pns || null,
      riwayat_tmt_kgb: form.riwayat_tmt_kgb || null,
      riwayat_tmt_pangkat: form.riwayat_tmt_pangkat || null,
      jadwal_kgb_berikutnya: form.jadwal_kgb_berikutnya || null,
      jadwal_pangkat_berikutnya: form.jadwal_pangkat_berikutnya || null
    };
    const method = form.id ? "PUT" : "POST";
    const url = form.id ? `/api/asn/${form.id}` : `/api/asn`;
    const res = await fetch(url, { method, headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) { const err = await res.text().catch(()=> ""); alert("Gagal menyimpan data: " + err); return; }
    onDone?.();
  };

  // Komponen input generik — perhatikan onChange pakai functional update
  const Field = ({
    label, name, type="text", inputMode, pattern, autoCapitalize
  }:{
    label: string;
    name: keyof Asn;
    type?: string;
    inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
    pattern?: string;
    autoCapitalize?: "off" | "none" | "sentences" | "words" | "characters";
  }) => (
    <label className="block">
      <span className="mb-1 block text-sm text-gray-700">{label}</span>
      <input
        type={type}
        value={(form[name] as string) ?? ""}
        inputMode={inputMode}
        pattern={pattern}
        autoCapitalize={autoCapitalize}
        autoComplete="off"
        onChange={(e) => {
          const v = e.target.value;
          setForm(prev => ({ ...prev, [name]: v }));
        }}
        className="w-full rounded-lg border px-3 py-2 outline-none ring-2 ring-transparent focus:ring-indigo-200"
      />
    </label>
  );

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Nama" name="nama" autoCapitalize="words" />
        {/* NIP numeric-friendly, tetap string agar leading zero aman */}
        <Field label="NIP" name="nip" inputMode="numeric" pattern="[0-9]*" />
        <Field label="TMT PNS" name="tmt_pns" type="date" />
        <Field label="Riwayat TMT KGB" name="riwayat_tmt_kgb" type="date" />
        <Field label="Riwayat TMT Pangkat" name="riwayat_tmt_pangkat" type="date" />
        <Field label="Jadwal KGB Berikutnya" name="jadwal_kgb_berikutnya" type="date" />
        <Field label="Jadwal Kenaikan Pangkat Berikutnya" name="jadwal_pangkat_berikutnya" type="date" />
      </div>
      <div className="flex justify-end gap-2">
        <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">
          Simpan
        </button>
      </div>
    </form>
  );
}
