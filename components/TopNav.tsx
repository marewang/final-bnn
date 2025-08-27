"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function TopNav() {
  const [kgb, setKgb] = useState<number | null>(null);
  const [pangkat, setPangkat] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch("/api/reminders?months=3", { cache: "no-store" });
        if (!res.ok) throw new Error();
        const j = await res.json();
        if (!active) return;
        setKgb(j?.kgb?.length ?? 0);
        setPangkat(j?.pangkat?.length ?? 0);
      } catch {}
    };
    load();
    const t = setInterval(load, 5 * 60 * 1000);
    return () => { active = false; clearInterval(t); };
  }, []);

  return (
    <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
      <Link href="/" className="text-base font-semibold">BNN App</Link>
      <nav className="flex items-center gap-3 text-sm">
        <Link href="/" className="rounded-lg px-3 py-1 hover:bg-gray-100">Dashboard</Link>
        <Link href="/reminders" className="relative rounded-lg px-3 py-1 hover:bg-gray-100">
          Pengingat
          <span className="ml-2 inline-flex items-center gap-1">
            {typeof kgb === "number" && kgb > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">KGB {kgb}</span>
            )}
            {typeof pangkat === "number" && pangkat > 0 && (
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-800">Pangkat {pangkat}</span>
            )}
          </span>
        </Link>
        <Link href="/print" className="rounded-lg px-3 py-1 hover:bg-gray-100">Cetak</Link>
      </nav>
    </div>
  );
}
