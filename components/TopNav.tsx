// components/TopNav.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type User = { id: number; name: string; email: string; role?: string } | null;

export default function TopNav() {
  const [user, setUser] = useState<User>(null);
  const [reminderCount, setReminderCount] = useState<number>(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const refetch = async () => {
      try {
        const me = await fetch("/api/auth/me", { cache: "no-store", credentials: "include" });
        if (!active) return;
        setUser(me.ok ? (await me.json())?.user ?? null : null);
      } catch {
        setUser(null);
      }
    };
    refetch();
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("auth");
      bc.onmessage = (e) => {
        if (e?.data?.type === "login" || e?.data?.type === "logout") refetch();
      };
    } catch {}
    return () => { active = false; try { bc?.close(); } catch {} };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const r = await fetch("/api/reminders?months=3", { cache: "no-store", credentials: "include" });
        if (!active || !r.ok) return;
        const j = await r.json();
        setReminderCount((j?.kgb?.length ?? 0) + (j?.pangkat?.length ?? 0));
      } catch {}
    })();
    return () => { active = false; };
  }, []);

  const doLogout = async () => {
    try { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); } catch {}
    try { new BroadcastChannel("auth").postMessage({ type: "logout" }); } catch {}
    window.location.href = "/login";
  };

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden rounded-lg border px-2 py-1 text-sm"
            aria-label="Toggle menu"
            onClick={() => setOpen(v => !v)}
          >
            ☰
          </button>
          <Link href="/" className="text-base font-semibold">BNN App</Link>
        </div>

        <nav className="hidden items-center gap-3 text-sm md:flex">
          <Link href="/" className="rounded-lg px-3 py-1 hover:bg-gray-100">Dashboard</Link>
          <Link href="/reminders" className="relative rounded-lg px-3 py-1 hover:bg-gray-100">
            <span className="inline-flex items-center gap-2">
              Pengingat
              {reminderCount > 0 && (
                <span className="ml-1 inline-flex min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                  {reminderCount}
                </span>
              )}
            </span>
          </Link>
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

      {open && (
        <div className="border-t bg-white md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col p-2 text-sm">
            <Link href="/" className="rounded-lg px-3 py-2 hover:bg-gray-100" onClick={() => setOpen(false)}>Dashboard</Link>
            <Link href="/reminders" className="rounded-lg px-3 py-2 hover:bg-gray-100" onClick={() => setOpen(false)}>
              <span className="inline-flex items-center gap-2">
                Pengingat
                {reminderCount > 0 && (
                  <span className="ml-1 inline-flex min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                    {reminderCount}
                  </span>
                )}
              </span>
            </Link>
            <Link href="/print" className="rounded-lg px-3 py-2 hover:bg-gray-100" onClick={() => setOpen(false)}>Cetak</Link>
            <div className="my-1 h-px bg-gray-200" />
            <Link href="/login" className="rounded-lg border px-3 py-2 hover:bg-gray-50" onClick={() => setOpen(false)}>Masuk/Keluar</Link>
          </nav>
        </div>
      )}
    </header>
  );
}
