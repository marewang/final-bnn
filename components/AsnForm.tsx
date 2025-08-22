"use client";
import { useEffect, useMemo, useState } from "react";
import { addYears, toISODateInput } from "@/utils/date";
import { toast } from "@/components/toast";

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

  // auto dates
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

  const setField = (name: keyof Asn, value: string) => {
    setForm(prev => ({ ...prev, [name]: value ?? "" }));
  };
  const onNama = (e: React.ChangeEvent<HTMLInputElement>) => setField("nama", e.currentTarget.value);
  const onNip = (e: React.ChangeEvent<HTMLInputElement>) => setField("nip", e.currentTarget.value.replace(/\D/g, "").slice(0, 18));

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!form.nama?.trim()) e.nama = "Nama wajib diisi";
    if (!form.nip?.trim()) e.nip = "NIP wajib diisi";
    return e;
  }, [form.nama, form.nip]);
  const isValid = Object.keys(errors).length === 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      toast({ title: "Data kurang lengkap", description: "Nama dan NIP wajib diisi.", variant: "error" });
      return;
    }
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
    const res = await fetch(url, { method, headers: { "Content-Type":"application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) {
      const txt = await res.text().catch(()=> "");
      toast({ title: "Gagal menyimpan data", description: txt, variant: "error" });
      return;
    }
    toast({ title: "Tersimpan", description: "Data ASN berhasil disimpan.", variant: "success" });
    onDone?.();
  };

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Nama" value={form.nama} onChange={onNama} />
        <Field label="NIP" value={form.nip} onChange={onNip} inputMode="numeric" />
        <Field label="TMT PNS" value={form.tmt_pns ?? ""} onChange={(e)=>setField("tmt_pns", e.currentTarget.value)} type="date" />
        <Field label="Riwayat TMT KGB" value={form.riwayat_tmt_kgb ?? ""} onChange={(e)=>setField("riwayat_tmt_kgb", e.currentTarget.value)} type="date" />
        <Field label="Riwayat TMT Pangkat" value={form.riwayat_tmt_pangkat ?? ""} onChange={(e)=>setField("riwayat_tmt_pangkat", e.currentTarget.value)} type="date" />
        <Field label="Jadwal KGB Berikutnya" value={form.jadwal_kgb_berikutnya ?? ""} onChange={(e)=>setField("jadwal_kgb_berikutnya", e.currentTarget.value)} type="date" />
        <Field label="Jadwal Kenaikan Pangkat Berikutnya" value={form.jadwal_pangkat_berikutnya ?? ""} onChange={(e)=>setField("jadwal_pangkat_berikutnya", e.currentTarget.value)} type="date" />
      </div>
      <div className="flex justify-end gap-2">
        <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">Simpan</button>
      </div>
    </form>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-gray-700">{props.label}</span>
      <input
        type={props.type ?? "text"}
        value={props.value ?? ""}
        onChange={props.onChange}
        inputMode={props.inputMode}
        autoComplete="off"
        className="w-full rounded-lg border px-3 py-2 outline-none ring-2 ring-transparent focus:ring-indigo-200"
      />
    </label>
  );
}
