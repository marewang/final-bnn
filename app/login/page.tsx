"use client";

import { useRef, useState, useEffect } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const emailRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => { emailRef.current?.focus(); }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setOkMsg(null);
    setErrMsg(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // pastikan cookie sesi tersimpan
        body: JSON.stringify({ email: email.trim(), password }),
      });

      let data: any = {};
      try { data = await res.json(); } catch {}

      if (!res.ok) {
        throw new Error(data?.error || "Email atau kata sandi salah.");
      }

      setOkMsg("Berhasil masuk. Mengalihkan ke dashboard…");

      // (opsional) beri tahu komponen lain untuk re-fetch user
      try { new BroadcastChannel("auth").postMessage({ type: "login" }); } catch {}

      // Hard navigation biar cookie langsung aktif di SSR/middleware/layout
      window.location.href = "/";
    } catch (err: any) {
      setErrMsg(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
      <h1 className="mb-1 text-xl font-semibold">Masuk</h1>
      <p className="mb-4 text-sm text-gray-600">Silakan masuk untuk mengakses aplikasi.</p>

      {errMsg && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errMsg}
        </div>
      )}
      {okMsg && (
        <div className="mb-3 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {okMsg}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">Email</label>
          <input
            id="email"
            ref={emailRef}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
            className="w-full rounded-xl border px-3 py-2 outline-none ring-2 ring-transparent focus:ring-indigo-200"
            placeholder="app@bnn.go.id"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">Kata Sandi</label>
          <div className="relative">
            <input
              id="password"
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full rounded-xl border px-3 py-2 pr-24 outline-none ring-2 ring-transparent focus:ring-indigo-200"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
              aria-label={showPass ? "Sembunyikan sandi" : "Tampilkan sandi"}
            >
              {showPass ? "Sembunyikan" : "Lihat"}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Tips: klik “Lihat” untuk memastikan sandi sudah benar.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? "Memproses…" : "Masuk"}
        </button>
      </form>
    </div>
  );
}
