# Design Doc: Financial & Reseller Features
**Date:** 2026-04-21  
**Status:** Approved

---

## Problem Statement

Glam Suite saat ini kurang dalam beberapa aspek pencatatan bisnis:
1. Distribusi ke reseller tidak mencatat nama reseller → tidak bisa tracking piutang per orang
2. Kartu varian hanya menampilkan stok saat ini, tidak ada gambaran perjalanan produk dari produksi sampai terjual
3. Dashboard hanya menampilkan angka all-time, tidak bisa lihat performa per periode
4. Tidak ada indikator minimum penjualan agar bisnis tidak rugi (BEP)

---

## Fitur 1: Reseller + Tracking Piutang

### Deskripsi
Menambahkan pencatatan nama reseller pada setiap distribusi, serta menampilkan status piutang per reseller.

### Database Changes
- Tambah tabel `resellers`: `id`, `name`, `created_at`
- Tambah kolom `reseller_id` (nullable) di tabel `distributions` — namun karena distribusi saat ini dicatat via perubahan `variants.stock_reseller` (bukan tabel distributions terpisah), perlu dibuat tabel `distributions` baru:
  - `id`, `variant_id`, `reseller_id`, `quantity`, `price_per_unit`, `distributed_at`
- Tambah tabel `reseller_payments`: `id`, `reseller_id`, `variant_id`, `quantity`, `amount`, `paid_at`

### Alur
1. User klik **Dist** pada kartu varian
2. Form Dist sekarang ada field "Reseller" → dropdown dari reseller yang pernah ada + opsi ketik nama baru
3. Kalau nama baru diketik → otomatis insert ke tabel `resellers`
4. Submit Dist → insert ke `distributions`, update `variants.stock_reseller` (bertambah) dan `variants.stock` (berkurang) seperti sekarang
5. User klik **Bayar** → pilih reseller, input qty laku + harga → insert ke `reseller_payments`, update `variants.stock_reseller` (berkurang), insert cashflow pemasukan

### UI
- Form Dist: tambah combobox "Reseller" (searchable, creatable)
- Dashboard: kartu baru **"Total Piutang"** = sum(distributions.quantity × price_per_unit) - sum(reseller_payments.amount)
- Halaman Produk/Varian atau bagian baru: list per reseller dengan progress bar bayar

### Data Lama
- Distribusi lama (via stock_reseller langsung) tidak punya reseller_id → ditampilkan sebagai "Tanpa Nama" atau diabaikan dari tracking piutang
- Ke depan semua Dist baru wajib pilih reseller

---

## Fitur 2: Breakdown Stok Per Varian

### Deskripsi
Menampilkan perjalanan produk per varian di kartu varian: total diproduksi, terjual, di reseller, sisa sendiri.

### Data Source
Semua data sudah ada, tinggal ditampilkan:
- **Diproduksi** → `SUM(productions.quantity)` WHERE `variant_id = X`
- **Terjual** → `SUM(sales.quantity)` WHERE `variant_id = X`
- **Stok Reseller** → `variants.stock_reseller`
- **Stok Sendiri** → `variants.stock`

### UI
Di kartu varian (halaman `/products`), di bawah harga jual tambahkan section:
```
Total Produksi: 18 pcs
├ Terjual:        10 pcs  ████████░░
├ Stok Reseller:   5 pcs  ████░░░░░░
└ Stok Sendiri:    3 pcs  ██░░░░░░░░
```
Progress bar horizontal untuk masing-masing, warna berbeda:
- Terjual → hijau
- Reseller → indigo
- Sendiri → amber

### Notes
- Data lama otomatis ikut karena semua dari tabel yang sudah ada
- Kalau total produksi = 0, section ini disembunyikan

---

## Fitur 3: Filter Periode Dashboard

### Deskripsi
Menambahkan filter waktu di dashboard agar user bisa melihat performa per periode, bukan hanya all-time.

### UI
- Di bawah PageHeader dashboard, tambah tombol pill:
  `Hari Ini | Minggu Ini | Bulan Ini | Semua`
- Default: **Bulan Ini**

### Data yang Terfilter
Semua angka yang berubah mengikuti filter:
- Total Pemasukan
- Total Pengeluaran
- Saldo periode (bukan saldo akumulatif)
- Grafik cashflow (sudah per bulan, tinggal disesuaikan)

### Yang TIDAK Terfilter
- Stok Kritis → kondisi real-time, tidak relevan difilter
- Modal Bisnis & ROI → akumulatif dari awal, tidak relevan difilter
- Total Piutang Reseller → kondisi saat ini

### Implementation
- Query cashflow ditambah filter `transaction_date >= startDate AND transaction_date <= endDate`
- `startDate` dan `endDate` dihitung dari pilihan filter

---

## Fitur 4: BEP Bisnis

### Deskripsi
Menampilkan berapa botol minimum yang harus terjual bulan ini agar semua biaya operasional tertutup.

### Formula
```
Biaya Tetap Bulan Ini = SUM cashflow pengeluaran bulan ini (kategori: Gaji Karyawan + Operasional + Marketing)
Margin per Botol = rata-rata (selling_price - hpp) dari semua varian aktif
BEP = Biaya Tetap ÷ Margin per Botol
```

### UI
Di dashboard, tambah card/section:
```
BEP Bulan Ini
Minimal jual: 13 botol
Sudah terjual: 8 botol
Kurang: 5 botol ⚠️
```
- Kalau sudah melewati BEP → hijau ✅
- Kalau belum → amber/merah dengan indikator kurang berapa

### Notes
- Jika tidak ada data biaya tetap bulan ini → BEP = 0, tampilkan pesan "Tidak ada biaya tetap bulan ini"
- Margin per botol diambil dari settings `selling_price` dan `hpp_per_unit` yang sudah ada
- BEP hanya tampil untuk periode "Bulan Ini" (tidak relevan untuk filter lain)

---

## Urutan Implementasi

1. **Fitur 2** — paling simpel, tidak ada perubahan DB, langsung visible impact
2. **Fitur 3** — filter periode, perubahan di dashboard saja
3. **Fitur 4** — BEP, kalkulasi baru di dashboard
4. **Fitur 1** — paling kompleks karena ada perubahan DB dan alur Dist/Bayar

---

## Files yang Akan Diubah

- `src/app/products/page.tsx` — breakdown stok per varian (Fitur 2)
- `src/app/page.tsx` — filter periode + BEP (Fitur 3, 4) + kartu piutang (Fitur 1)
- `src/app/inventory/page.tsx` — tidak ada perubahan
- `src/types/index.ts` — tambah type Reseller, Distribution, ResellerPayment
- `supabase/` — migration untuk tabel resellers, distributions, reseller_payments
- Form Dist & Bayar di `src/app/products/page.tsx` — tambah field reseller (Fitur 1)
