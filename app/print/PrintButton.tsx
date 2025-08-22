"use client";
export default function PrintButton() {
  return (
    <button onClick={() => window.print()} className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50">
      🖨️ Cetak
    </button>
  );
}
