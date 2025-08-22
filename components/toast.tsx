"use client";
import { useEffect, useState } from "react";

type ToastItem = {
  id: number;
  title?: string;
  description?: string;
  variant?: "success" | "error" | "info";
  duration?: number;
};

let counter = 1;
export function toast(t: Omit<ToastItem, "id">) {
  const detail: ToastItem = { id: counter++, duration: 3500, ...t };
  window.dispatchEvent(new CustomEvent("app:toast", { detail }));
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const onAdd = (e: Event) => {
      const ce = e as CustomEvent<ToastItem>;
      setItems((prev) => [...prev, ce.detail]);
      const timeout = ce.detail.duration ?? 3500;
      setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== ce.detail.id));
      }, timeout);
    };
    window.addEventListener("app:toast", onAdd as EventListener);
    return () => window.removeEventListener("app:toast", onAdd as EventListener);
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
      {items.map((t) => {
        const color =
          t.variant === "success"
            ? "border-green-300 bg-green-50 text-green-800"
            : t.variant === "error"
            ? "border-red-300 bg-red-50 text-red-800"
            : "border-gray-300 bg-white text-gray-800";
        return (
          <div key={t.id} className={`pointer-events-auto rounded-xl border p-3 shadow ${color}`}>
            {t.title && <div className="text-sm font-semibold">{t.title}</div>}
            {t.description && <div className="mt-0.5 text-sm opacity-90">{t.description}</div>}
          </div>
        );
      })}
    </div>
  );
}
