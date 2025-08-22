import { neon } from "@neondatabase/serverless";

export const sql = neon(process.env.DATABASE_URL!);

// Catatan: kita tidak lagi mengekspor TABLE dinamis.
// Nama tabel ditulis literal "asns" di tiap query agar tidak jadi $1.
