import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "ASN CRUD (Neon)",
  description: "CRUD ASN + Pengingat KGB & Pangkat (≤ 3 bulan)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
            <Link href="/" className="text-base font-semibold">ASN Monitor</Link>
            <nav className="flex items-center gap-3 text-sm">
              <Link href="/" className="rounded-lg px-3 py-1 hover:bg-gray-100">Dashboard</Link>
              <Link href="/reminders" className="rounded-lg px-3 py-1 hover:bg-gray-100">Pengingat</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl p-6">{children}</main>
      </body>
    </html>
  );
}
