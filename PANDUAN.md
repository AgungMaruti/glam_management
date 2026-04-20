# Panduan Glam Suite — Bisnis Parfum

---

## 1. Setup Awal (lakukan sekali)

1. **Inventori** — tambah semua bahan baku (botol, bibit, stiker, dll) beserta stok & harga beli
2. **RAD & HPP** — buat resep parfum dari bahan baku, otomatis hitung HPP per pcs
3. **Produk & Varian** — tambah produk (misal "Parfum Seri A"), lalu tambah varian (Rose 35ml, harga jual 75rb, stok awal)
4. **Dashboard** — set Modal Bisnis (total uang yang kamu investasikan)
5. **Cashflow** — set Saldo Awal (total uang di rekening sekarang)

---

## 2. Operasional Harian

**Produksi selesai / stok bertambah:**
- Produk & Varian → edit varian → update stok

**Restock bahan baku:**
- Inventori → tombol restock di kartu bahan → input qty + total biaya

**Jual sendiri ke konsumen:**
- Produk & Varian → kartu varian → tombol **Jual** → input qty + harga → otomatis kurangi stok + catat cashflow

**Distribusi ke reseller:**
- Produk & Varian → kartu varian → tombol **Dist** → input qty + harga ke reseller → stok berpindah ke "Stok Reseller"

**Reseller lapor laku / bayar:**
- Produk & Varian → kartu varian → tombol **Bayar** → input qty + harga → otomatis kurangi stok reseller + catat cashflow

**Pengeluaran lain (beli bahan, ongkir, dll):**
- Cashflow → tambah transaksi → pilih Pengeluaran

---

## 3. Pantau Bisnis

- **Dashboard** — lihat total pemasukan, pengeluaran, profit, ROI, stok kritis
- **Cashflow** — riwayat semua transaksi masuk & keluar
- **Kalkulator Harga** — simulasi harga jual di e-commerce atau ke reseller

---

## 4. Detail Menu

### Produk & Varian (`/products`)

**Konsep:**
- **Produk** = nama seri/brand (contoh: "Aqua Kiss")
- **Varian** = ukuran/jenis di dalam produk (contoh: "Rose 35ml", "Rose 50ml")

**Tombol di tiap kartu varian:**
| Tombol | Fungsi |
|--------|--------|
| **Dist** | Distribusi stok ke reseller — stok sendiri berkurang, stok reseller bertambah, cashflow belum bergerak |
| **Jual** | Catat penjualan sendiri — kurangi stok sendiri + catat pemasukan ke cashflow |
| **Bayar** | Reseller lapor laku/bayar — kurangi stok reseller + catat pemasukan ke cashflow |
| Edit (pensil) | Edit nama, ukuran, harga, koreksi stok |
| Hapus (trash) | Hapus varian |

**Stok Sendiri vs Stok Reseller:**
- Stok Sendiri = produk yang ada di tanganmu
- Stok Reseller = produk yang sudah dikirim ke reseller, belum terbayar
- Saat **Dist**: stok sendiri berkurang → stok reseller bertambah
- Saat **Bayar**: stok reseller berkurang → cashflow masuk

---

### Inventori (`/inventory`)

**Bahan Baku:**
- Tambah semua bahan dengan stok & harga beli
- Set stok minimum → muncul alert kritis di dashboard kalau stok di bawah batas
- Tombol **Restock** → input qty beli + total biaya → stok bertambah, harga rata-rata otomatis dihitung ulang

**Resep / BOM:**
- Assign bahan ke tiap varian — berapa banyak bahan per 1 botol

**Produksi:**
- Pilih varian + jumlah batch → stok bahan berkurang, stok varian bertambah

---

### RAD & HPP (`/rad`)

Hitung HPP (Harga Pokok Produksi) per botol sebelum produksi:
- Input semua bahan, jumlah pemakaian, harga beli
- Otomatis kalkulasi HPP/botol, margin, net profit batch
- Saran harga jual margin 30% & 50%

---

### Cashflow (`/cashflow`)

- **Saldo Awal** = uang di rekening sebelum pakai aplikasi (input sekali)
- **Saldo Sekarang** = Saldo Awal + semua pemasukan − semua pengeluaran
- Tambah transaksi manual untuk pemasukan/pengeluaran di luar yang otomatis
- Filter periode: Hari Ini / Minggu Ini / Bulan Ini / Semua

---

### Dashboard (`/`)

- **4 kartu statistik** — Saldo Bersih, Total Pemasukan, Total Pengeluaran, Stok Kritis
- **Modal Bisnis Tracker** — set total modal yang ditanam, lihat Kas Bisnis, Profit Bersih, ROI
- **Profit Breakdown** — analisis detail per botol & total batch
- **Grafik** — produk paling laku & tren cashflow 6 bulan
- **Alert Stok Kritis** — muncul otomatis kalau ada bahan habis

---

### Kalkulator Harga (`/pricing`)

**Tab E-Commerce:**
- Simulasi harga jual di Shopee, Tokopedia, TikTok Shop, Lazada
- Input HPP + biaya tambahan → otomatis hitung harga minimum & rekomendasi harga setelah dipotong fee platform

**Tab Reseller:**
- Hitung harga ke reseller dari HPP + ongkir kirim
- Input total ongkir + jumlah produk → otomatis hitung ongkir per pcs
- Tampilkan saran harga jual reseller ke konsumen
