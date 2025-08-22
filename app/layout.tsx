import "./globals.css";
import type { ReactNode } from "react";
import TopNav from "@/components/TopNav";
import { Toaster } from "@/components/toast";

export const metadata = {
  title: "ASN CRUD (Neon)",
  description: "CRUD ASN + Pengingat KGB & Pangkat",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body>
        <header className="border-b bg-white">
          <TopNav />
        </header>
        <main className="mx-auto max-w-6xl p-6">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
