import "./globals.css";

export const metadata = {
  title: "ASN CRUD (Neon)",
  description: "CRUD ASN langsung ke Neon DB (snake_case columns)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <div className="mx-auto max-w-6xl p-6">{children}</div>
      </body>
    </html>
  );
}
