# ASN CRUD (Next.js + Neon SQL, tanpa Prisma)

Terhubung langsung ke NeonDB dengan kolom **snake_case** seperti data Anda:
- `id, nama, nip, tmt_pns, riwayat_tmt_kgb, riwayat_tmt_pangkat, jadwal_kgb_berikutnya, jadwal_pangkat_berikutnya, created_at, updated_at`

## Jalankan Lokal
1. Salin `.env.example` menjadi `.env` dan isi `DATABASE_URL` Neon.
2. Install:
   ```bash
   npm install
   npm run dev
   ```

## Deploy ke Vercel
- **Framework Preset**: Next.js
- **Output Directory**: `.next`
- **Environment Variables** (Preview & Production):
  - `DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB?sslmode=require`
  - (Opsional) `TABLE_NAME=asn` jika nama tabel Anda berbeda, set sesuai nama tabel di Neon.

## Endpoint API
- `GET /api/asn` – list
- `POST /api/asn` – create (auto-hitung KGB +2 tahun, Pangkat +4 tahun jika tidak diisi)
- `GET /api/asn/:id` – detail
- `PUT /api/asn/:id` – update
- `DELETE /api/asn/:id` – delete
