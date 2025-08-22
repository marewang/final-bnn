"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function TopNav() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch("/api/reminders?months=3", { cache: "no-store" });
        if (!res.ok) throw new Error();
        const j = await res.json();
        if (!active) return;
        const total = (j?.kgb?.length ?? 0) + (j?.pangkat?.length ?? 0);
        setCount(total);
      } catch {}
    };
    load();
    // refresh every 5 minutes
    const t = setInterval(load, 5 * 60 * 1000);
    return () => { active = false; clearInterval(t); };
  }, []);

  return (
    <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
      <Link href="/" className="text-base font-semibold">ASN Monitor</Link>
      <nav className="flex items-center gap-3 text-sm">
        <Link href="/" className="rounded-lg px-3 py-1 hover:bg-gray-100">Dashboard</Link>
        <Link href="/reminders" className="relative rounded-lg px-3 py-1 hover:bg-gray-100">
          Pengingat
          {typeof count === "number" && count > 0 && (
            <span className="absolute -right-2 -top-2 inline-flex min-w-[22px] items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-semibold text-white">
              {count}
            </span>
          )}
        </Link>
      </nav>
    </div>
  );
}
