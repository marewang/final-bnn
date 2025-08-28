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

// Parser JSON aman — tidak melempar “Unexpected end of JSON input”
async function parseJsonSafe(res: Response): Promise<any> {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try { return await res.json(); } catch { return null; }
  }
  try {
    const txt = await res.text();
    return txt ? { _text: txt } : null;
  } catch {
    return null;
  }
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
      const j = await parseJsonSafe(r);

      if (!r.ok) {
        const msg = j?.error || j?._text || `Gagal memuat data (HTTP ${r.status})`;
        throw new Error(msg);
      }

      setRows(Array.isArray(j?.data) ? j.data : []);
      setTotal(Number(j?.total ??
