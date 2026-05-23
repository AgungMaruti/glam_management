# Panduan Aktivasi Login (Supabase Auth)

Setelah update kode ini, aplikasi **wajib login** sebelum bisa dipakai.

Berikut cara mengaktifkannya:

---

## Langkah 1: Enable Email Auth di Supabase

1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project kamu
3. Masuk ke menu **Authentication → Providers**
4. Cari **Email** → toggle **Enabled**
5. Klik **Save**

---

## Langkah 2: Jalankan Migration SQL

1. Di Supabase Dashboard, masuk ke **SQL Editor**
2. Buka file `supabase/migration_auth.sql` dari project ini
3. Copy isinya, paste ke SQL Editor
4. Klik **Run**

Ini akan mengganti policy "allow all" menjadi "authenticated only" — data kamu jadi aman.

---

## Langkah 3: Buat User Pertama

### Cara A: Via Supabase Dashboard (Paling Mudah)

1. Masuk ke **Authentication → Users**
2. Klik **Invite user** atau **Add user**
3. Masukkan email dan password
4. User bisa langsung login di aplikasi

### Cara B: Via SQL (Alternatif)

```sql
-- Ganti dengan email dan password kamu
select supabase_auth.admin_create_user(
  'email@kamu.com',
  'password_rahasia'
);
```

---

## Langkah 4: Login di Aplikasi

1. Buka aplikasi (localhost:3000 atau URL deploy)
2. Masukkan email dan password yang sudah dibuat
3. Klik **Masuk**
4. Selesai! 🎉

---

## Troubleshooting

| Masalah | Solusi |
|---|---|
| "Email atau password salah" | Cek apakah user sudah dibuat di Supabase Dashboard → Users |
| "Error saat login" | Cek apakah `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` sudah benar di `.env.local` |
| "Data tidak muncul setelah login" | Pastikan migration SQL sudah di-run (step 2) |
| Mau tambah user baru | Bisa via Supabase Dashboard → Users → Add user |

---

## Catatan Penting

- **Jangan lupa** jalankan migration SQL, kalau tidak data tetap terbuka untuk umum.
- Supabase Auth gratis untuk project kecil (50,000 users/bulan).
- Password user di-hash otomatis oleh Supabase — kamu tidak perlu khawatir.
