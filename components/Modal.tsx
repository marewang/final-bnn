"use client";
import { ReactNode, useEffect } from "react";
export default function Modal({ open, onClose, children, title }:{ open:boolean; onClose:()=>void; children:ReactNode; title:string }) {
  useEffect(()=>{ const esc=(e:KeyboardEvent)=>{ if(e.key==="Escape") onClose(); }; document.addEventListener("keydown",esc); return ()=>document.removeEventListener("keydown",esc); },[onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-full px-3 py-1 text-sm hover:bg-gray-100">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
