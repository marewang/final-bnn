"use client";
import { useEffect, useMemo, useState } from "react";
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

export default function AsnForm({
  initial,
  onDone
}: {
  initial?: Partial<Asn>;
  onDone?: () => void;
}) {
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

  // ===== Handlers ============================================================
  const setField = (name: keyof Asn, value: string) => {
    // jaga-jaga semua value menjadi string agar tidak terjadi "uncontrolled → controlled"
    const v = value ?? "";
    setForm(prev => ({ ...prev, [name]: v }));
  };

  const onNamaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setField("nama", e.currentTarget.value);
  };

  const onNipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // hanya angka, tetap string
    const onlyDigits = e.currentTarget.value.replace(/\D/g, "");
    // (opsional) batasi panjang, contoh 18 digit:
    const limited = onlyDigits.slice(0, 18);
    setField("nip", limited);
  };

  const onDateChange = (name: keyof Asn) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setField(name, e.currentTarget.value);
  };

  // ===== Auto hitung jadwal dari riwayat ====================================
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

  // ===== Validasi ringan =====================================================
  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!form.nama?.trim()) e.nama = "Nama wajib diisi";
    if (!form.nip?.trim()) e.nip = "NIP wajib diisi";
    return e;
  }, [form.nama, form.nip]);

  const isValid = Object.keys(errors).length === 0;

  // ===== Submit ==============================================================
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

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
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      alert("Gagal menyimpan data: " + err);
      return;
    }
    onDone?.();
  };

  // ===== UI =================================================================
  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-semibold">Data ASN</h3>
          <p className="mt-1 text-sm text-gray-500">Lengkapi identitas & riwayat untuk kalkulasi jadwal otomatis.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* NAMA */}
          <Field
            label="Nama"
            placeholder="Contoh: Rina Setyawati"
            value={form.nama}
            onChange={onNamaChange}
            error={errors.nama}
            autoCapitalize="words"
          />
          {/* NIP */}
          <Field
            label="NIP"
            placeholder="Hanya angka"
            value={form.nip}
            onChange={onNipChange}
            inputMode="numeric"
            error={errors.nip}
          />

          {/* Tanggal-tanggal */}
          <Field label="TMT PNS" type="date" value={form.tmt_pns ?? ""} onChange={onDateChange("tmt_pns")} />
          <Field
            label="Riwayat TMT KGB"
            type="date"
            value={form.riwayat_tmt_kgb ?? ""}
            onChange={onDateChange("riwayat_tmt_kgb")}
            hint="Isi untuk menghitung KGB berikutnya (+2 tahun)"
          />
          <Field
            label="Riwayat TMT Pangkat"
            type="date"
            value={form.riwayat_tmt_pangkat ?? ""}
            onChange={onDateChange("riwayat_tmt_pangkat")}
            hint="Isi untuk menghitung Kenaikan Pangkat berikutnya (+4 tahun)"
          />
          <Field
            label="Jadwal KGB Berikutnya"
            type="date"
            value={form.jadwal_kgb_berikutnya ?? ""}
            onChange={onDateChange("jadwal_kgb_berikutnya")}
          />
          <Field
            label="Jadwal Kenaikan Pangkat Berikutnya"
            type="date"
            value={form.jadwal_pangkat_berikutnya ?? ""}
            onChange={onDateChange("jadwal_pangkat_berikutnya")}
          />
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() =>
              setForm({
                id: initial?.id,
                nama: initial?.nama ?? "",
                nip: initial?.nip ?? "",
                tmt_pns: initial?.tmt_pns ? toISODateInput(initial.tmt_pns) : "",
                riwayat_tmt_kgb: initial?.riwayat_tmt_kgb ? toISODateInput(initial.riwayat_tmt_kgb) : "",
                riwayat_tmt_pangkat: initial?.riwayat_tmt_pangkat ? toISODateInput(initial.riwayat_tmt_pangkat) : "",
                jadwal_kgb_berikutnya: initial?.jadwal_kgb_berikutnya ? toISODateInput(initial.jadwal_kgb_berikutnya) : "",
                jadwal_pangkat_berikutnya: initial?.jadwal_pangkat_berikutnya ? toISODateInput(initial.jadwal_pangkat_berikutnya) : ""
              })
            }
            className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={!isValid}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Simpan
          </button>
        </div>
      </div>
    </form>
  );
}

/** Input field kecil yang rapi */
function Field(props: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoCapitalize?: "off" | "none" | "sentences" | "words" | "characters";
  error?: string;
  hint?: string;
}) {
  const {
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    inputMode,
    autoCapitalize,
    error,
    hint
  } = props;

  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      <input
        type={type}
        value={value ?? ""} // pastikan controlled value selalu string
        onChange={onChange}
        placeholder={placeholder}
        inputMode={inputMode}
        autoCapitalize={autoCapitalize}
        autoComplete="off"
        aria-invalid={Boolean(error)}
        className="w-full rounded-lg border px-3 py-2 outline-none ring-2 ring-transparent focus:border-indigo-500 focus:ring-indigo-100"
      />
      {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </label>
  );
}
