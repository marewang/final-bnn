"use client";

export const dynamic = "force-dynamic";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const returnTo = sp.get("returnTo") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Jika sudah login, redirect
  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const r = await fetch("/api/auth/me", { cache: "no-store" });
        if (r.ok) {
          const j = await r.json();
          if (!canceled && j?.user) router.replace(returnTo);
        }
      } catch {}
    })();
    return () => {
      canceled = true;
    };
  }, [router, returnTo]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Gagal login");
      router.replace(returnTo);
    } catch (e: any) {
      setMsg(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-16 max-w-md rounded-2xl border bg-white p-6 shadow-sm">
      <h1 className="mb-1 text-xl font-semibold">Masuk</h1>
      <p className="mb-6 text-sm text-gray-500">Gunakan email dan password Anda.</p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 outline-none ring-2 ring-transparent focus:ring-indigo-200"
            placeholder="nama@contoh.go.id"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 outline-none ring-2 ring-transparent focus:ring-indigo-200"
            placeholder="••••••••"
            required
          />
        </div>
        {msg && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700">
            {msg}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? "Memproses..." : "Masuk"}
        </button>
      </form>

      <div className="mt-6 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
        <p className="mb-2 font-semibold">Belum ada user?</p>
        <p>Buat admin pertama (sekali saja) via API:</p>
        <pre className="mt-2 overflow-auto rounded-lg border bg-white p-2">
{`POST /api/auth/register
{ "name": "Admin", "email": "admin@contoh.go.id", "password": "rahasia", "role": "admin" }`}
        </pre>
      </div>
    </div>
  );
}

export default function LoginPage() {
  // Wajib dibungkus Suspense bila memakai useSearchParams()
  return (
    <Suspense fallback={<div className="p-6">Memuat...</div>}>
      <LoginInner />
    </Suspense>
  );
}
