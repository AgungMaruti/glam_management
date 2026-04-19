# Panduan Glam Suite — Bisnis Parfum

## Gambaran Besar

Glam Suite adalah aplikasi manajemen bisnis parfum yang terdiri dari 5 menu utama. Alur kerja idealnya dimulai dari **Produk → Inventori → RAD → Produksi → Cashflow → Dashboard**.

---

## Alur Kerja yang Disarankan

```
1. Tambah Produk & Varian
         ↓
2. Tambah Bahan Baku (Inventori)
         ↓
3. Buat Resep/BOM — assign bahan ke varian
         ↓
4. Buat RAD — hitung HPP & estimasi profit
         ↓
5. Jalankan Produksi — stok bahan berkurang, stok produk bertambah
         ↓
6. Catat Penjualan & Cashflow
         ↓
7. Pantau di Dashboard
```

---

## 1. Produk & Varian (`/products`)

**Fungsi:** Katalog produk parfum kamu.

### Konsep
- **Produk** = nama seri/brand (contoh: "Aqua Kiss")
- **Varian** = ukuran/jenis di dalam produk itu (contoh: "Aqua Kiss Lace 35ml", "Aqua Kiss Lace 50ml")

### Cara Kerja
1. Tambah produk dulu (nama + deskripsi opsional)
2. Di dalam produk, tambah varian — isi nama, ukuran (ml), harga jual, dan stok awal
3. Stok varian akan berubah otomatis saat **produksi dijalankan** (bertambah) atau **penjualan dicatat** (berkurang)

### Field Varian
| Field | Keterangan |
|-------|-----------|
| Nama | Nama varian (contoh: "Lace 35ml") |
| Ukuran (ml) | Volume parfum dalam botol |
| Harga Jual | Harga yang kamu jual ke konsumen |
| Stok | Jumlah stok saat ini — bisa diedit manual untuk koreksi |

---

## 2. Inventori (`/inventory`)

**Fungsi:** Kelola bahan baku, resep produksi, dan jalankan produksi batch.

Terdiri dari 3 tab:

---

### Tab Bahan Baku
Daftar semua bahan yang kamu beli untuk produksi.

**Cara input bahan:**
- **Harga Beli Total + Dapat** → sistem auto-hitung harga per satuan
  - Contoh: Stiker Rp 17.000 dapat 100 pcs → otomatis **Rp 170/pcs**
  - Contoh: Bibit parfum Rp 150.000 dapat 500 ml → otomatis **Rp 300/ml**
- Atau langsung input **Harga per Satuan** kalau sudah tahu

| Field | Keterangan |
|-------|-----------|
| Nama | Nama bahan (contoh: Bibit Parfum, Alkohol, Botol) |
| Satuan | Satuan pengukuran: ml, gram, pcs, liter, kg |
| Stok Awal | Jumlah stok saat pertama kali diinput |
| Harga/Satuan | Harga per 1 satuan — dihitung otomatis kalau pakai cara total |
| Stok Min | Batas minimum stok — kalau di bawah ini muncul alert **Kritis** |

Indikator stok:
- 🔴 **Kritis** = stok ≤ stok minimum → perlu restock
- Progress bar menunjukkan seberapa penuh stok relatif terhadap batas minimum

---

### Tab Resep / BOM (Bill of Materials)
Daftar bahan yang dibutuhkan untuk membuat **1 botol** dari setiap varian.

**Cara pakai:**
1. Pilih varian yang mau dibuatkan resep
2. Pilih bahan baku (dari daftar yang sudah ditambahkan)
3. Isi jumlah pemakaian per 1 botol
4. Ulangi untuk setiap bahan yang dipakai varian tersebut

Contoh resep "Aqua Kiss Lace 35ml":
| Bahan | Qty per Botol |
|-------|--------------|
| Bibit Parfum | 15 ml |
| Alkohol | 18 ml |
| Botol 35ml | 1 pcs |
| Stiker | 1 pcs |
| Box | 1 pcs |

> Resep ini yang dipakai saat **Produksi Batch** — stok bahan berkurang sesuai resep × jumlah produksi.

---

### Tab Produksi
Jalankan produksi batch — membuat banyak botol sekaligus.

**Cara pakai:**
1. Pilih varian yang mau diproduksi
2. Isi jumlah yang mau diproduksi (pcs)
3. Sistem menampilkan **preview kebutuhan bahan** — cek apakah stok cukup
4. Klik "Jalankan Produksi"

**Yang terjadi otomatis:**
- Stok bahan baku berkurang sesuai resep × jumlah produksi
- Stok varian bertambah
- Biaya produksi (dari harga bahan) otomatis tercatat ke **Cashflow** sebagai pengeluaran

---

## 3. RAD & HPP Calculator (`/rad`)

**Fungsi:** Rencana Anggaran & Biaya — hitung HPP (Harga Pokok Produksi) per botol dan estimasi profit sebelum produksi.

### Konsep HPP
HPP = total biaya semua bahan per 1 botol, dihitung **proporsional**:

```
HPP bahan X per botol = (Harga Total Beli ÷ Qty Beli) × Pemakaian per Botol
```

Contoh bibit parfum:
- Beli 500ml seharga Rp 150.000
- Pakai 15ml per botol
- HPP bibit = (150.000 ÷ 500) × 15 = **Rp 4.500/botol**

### Cara Buat RAD
1. Isi judul dan jumlah produksi (batch)
2. Input semua bahan di tabel (nama, qty beli, satuan, harga total, pakai/botol)
3. Isi harga jual, gaji karyawan (opsional), biaya lain (opsional)
4. Lihat **preview kalkulasi** — muncul otomatis:
   - HPP/botol
   - Margin/botol
   - Net Profit total batch
   - Saran harga jual (margin 30% & 50%)

### Hasil RAD
Setiap RAD yang disimpan menampilkan:
| Info | Keterangan |
|------|-----------|
| HPP/botol | Biaya produksi per 1 botol |
| Harga Jual | Harga yang kamu tetapkan |
| Margin/botol | Keuntungan per botol |
| Margin % | Persentase keuntungan |
| Net Profit | Keuntungan bersih setelah dikurangi gaji & biaya lain |

---

## 4. Cashflow (`/cashflow`)

**Fungsi:** Catat semua pemasukan dan pengeluaran — rekam jejak keuangan bisnis.

### Saldo Rekening
- **Set Saldo Awal** = jumlah uang di rekening/kas sebelum mulai pakai aplikasi
- Saldo Rekening Saat Ini = Saldo Awal + Total Pemasukan − Total Pengeluaran
- Selalu update real-time setiap ada transaksi baru

### Tambah Transaksi Manual
Untuk mencatat pemasukan/pengeluaran di luar penjualan otomatis.

**Kategori Pemasukan:**
| Kategori | Contoh |
|----------|--------|
| Penjualan | Jual langsung ke konsumen |
| Reseller | Titip ke reseller/agen |
| Dropship | Order via dropshipper |
| Lainnya | Pemasukan lain-lain |

**Kategori Pengeluaran:**
| Kategori | Contoh |
|----------|--------|
| Produksi | Beli bahan baku, biaya produksi |
| Gaji Karyawan | Upah karyawan/asisten |
| Marketing | Iklan, endorse, promosi |
| Packaging | Bubble wrap, box pengiriman |
| Ongkir | Biaya kirim paket ke pembeli |
| Operasional | Listrik, internet, sewa tempat |
| Lainnya | Pengeluaran lain-lain |

### Catat Penjualan (Cara Cepat)
Tombol khusus untuk catat penjualan tanpa buka modal transaksi biasa:
1. Pilih varian
2. Isi jumlah (pcs) dan harga/pcs
3. Simpan → stok varian **otomatis berkurang**, pemasukan otomatis tercatat

### Pencatatan Ongkir
Untuk pengiriman luar daerah, ada 2 skenario:

**Pembeli bayar ongkir, kamu yang transfer ke ekspedisi:**
1. Catat pemasukan → kategori "Penjualan" → harga barang saja
2. Catat pengeluaran → kategori "Ongkir" → nominal ongkir

**Ongkir sudah include di harga jual (kamu nanggung):**
1. Catat pemasukan → kategori "Penjualan" → total (sudah include ongkir)
2. Catat pengeluaran → kategori "Ongkir" → nominal ongkir aktual

### Filter Periode
| Filter | Tampilkan |
|--------|----------|
| Hari Ini | Transaksi hari ini saja |
| Minggu Ini | 7 hari terakhir |
| Bulan Ini | Bulan berjalan |
| Semua | Seluruh riwayat transaksi |

---

## 5. Dashboard (`/`)

**Fungsi:** Ringkasan kondisi bisnis secara keseluruhan.

### Kartu Statistik
| Kartu | Keterangan |
|-------|-----------|
| Saldo Bersih | Total pemasukan − pengeluaran sepanjang waktu |
| Total Pemasukan | Semua pemasukan yang pernah dicatat |
| Total Pengeluaran | Semua pengeluaran yang pernah dicatat |
| Stok Kritis | Jumlah bahan baku yang di bawah stok minimum |

### Profit Breakdown
Analisis profit secara detail — nilai bisa diedit langsung dengan klik:
- **Per Botol:** Harga jual, HPP, margin per botol
- **Total:** Gross revenue, total HPP, gross profit, net profit setelah dikurangi gaji & operasional

### Grafik
- **Produk Paling Laku** — bar chart berdasarkan total nilai penjualan per varian
- **Tren Cashflow** — line chart pemasukan vs pengeluaran 6 bulan terakhir

### Alert Stok Kritis
Muncul otomatis di bawah kalau ada bahan baku yang stoknya di bawah minimum — langsung terlihat bahan apa yang perlu direstock.

---

## Ringkasan Alur Lengkap

```
SETUP AWAL:
├── Produk & Varian → daftarkan semua produk yang dijual
├── Inventori → Bahan Baku → daftarkan semua bahan + harga
├── Inventori → Resep/BOM → assign bahan ke tiap varian
└── Cashflow → Set Saldo Awal → samakan dengan saldo rekening

OPERASIONAL HARIAN:
├── Mau produksi?
│   ├── (Opsional) Buat RAD dulu → hitung HPP & estimasi profit
│   └── Inventori → Produksi → jalankan batch
│       └── Stok bahan berkurang, stok produk bertambah ✓
│
├── Ada penjualan?
│   └── Cashflow → Catat Penjualan
│       └── Stok produk berkurang, pemasukan tercatat ✓
│
├── Ada pengeluaran? (beli bahan, ongkir, gaji, dll)
│   └── Cashflow → Tambah Transaksi → Pengeluaran
│       └── Saldo berkurang ✓
│
└── Pantau kondisi bisnis → Dashboard
```
