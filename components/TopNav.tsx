"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type User = { id: number; name: string; email: string; role?: string } | null;

export default function TopNav() {
  const [user, setUser] = useState<User>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const me = await fetch("/api/auth/me", { cache: "no-store" });
        if (!active) return;
        if (me.ok) {
          const j = await me.json();
          setUser(j?.user ?? null);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    })();
    return () => { active = false; };
  }, []);

  const doLogout = async () => {
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
    window.location.href = "/login";
  };

  return (
    <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
      <Link href="/" className="text-base font-semibold">BNN HRIS</Link>
      <nav className="flex items-center gap-3 text-sm">
        <Link href="/" className="rounded-lg px-3 py-1 hover:bg-gray-100">Dashboard</Link>
        <Link href="/reminders" className="rounded-lg px-3 py-1 hover:bg-gray-100">Pengingat</Link>
        <Link href="/print" className="rounded-lg px-3 py-1 hover:bg-gray-100">Cetak</Link>
        <span className="mx-2 h-5 w-px bg-gray-200" />
        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-gray-700">👋 {user.name}</span>
            <button onClick={doLogout} className="rounded-lg border px-3 py-1 hover:bg-gray-50">Keluar</button>
          </div>
        ) : (
          <Link href="/login" className="rounded-lg border px-3 py-1 hover:bg-gray-50">Masuk</Link>
        )}
      </nav>
    </div>
  );
}
