"use client";

import { useEffect } from "react";

export default function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    // lock scroll when modal open
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  if (!open) return null; // <— tidak render sama sekali saat tertutup

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <header className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-base font-semibold">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 hover:bg-gray-100">
            ✕
          </button>
        </header>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
