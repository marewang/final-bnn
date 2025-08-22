"use client";
export default function Confirm({ message, onConfirm, onCancel }:{ message:string; onConfirm:()=>void; onCancel:()=>void }) {
  return (
    <div className="space-y-4">
      <p>{message}</p>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">Batal</button>
        <button onClick={onConfirm} className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700">Hapus</button>
      </div>
    </div>
  );
}
