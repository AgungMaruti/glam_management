# Panduan Glam Suite — Bisnis Parfum

---

## 1. Setup Awal (lakukan sekali, urut)

### Langkah 1 — Isi Inventori (Bahan Baku)
Masuk ke menu **Inventori** → tab **Bahan Baku** → klik **"+ Tambah Bahan"**

Isi setiap bahan yang kamu pakai untuk produksi:
- **Nama** → nama bahan (contoh: Bibit Parfum, Alkohol 96%, Botol 35ml, Stiker, Box)
- **Satuan** → ml, gram, pcs, liter, kg — sesuaikan dengan cara kamu ukur bahan itu
- **Stok Awal** → berapa stok yang kamu punya sekarang
- **Harga per Satuan** → bisa diisi langsung, atau pakai cara cepat:
  - Klik toggle "Hitung dari total beli"
  - Isi **"Beli berapa"** (qty) + **"Total harga"** → sistem auto-hitung harga/satuan
  - Contoh: beli 500ml bibit seharga Rp 150.000 → otomatis Rp 300/ml
- **Stok Minimum** → batas aman stok. Kalau stok turun sampai sini, muncul alert **Kritis** di dashboard

Ulangi untuk semua bahan.

---

### Langkah 2 — Buat Resep / BOM (Bill of Materials)
Masuk ke **Inventori** → tab **Resep / BOM**

Resep = daftar bahan yang dibutuhkan untuk membuat **1 botol** produk.

1. Pilih varian dari dropdown (misal: "Aqua Kiss Lace 35ml")
2. Klik **"+ Tambah Bahan"**
3. Pilih bahan dari list, isi jumlah pemakaian per 1 botol
4. Ulangi untuk semua bahan yang dipakai varian tersebut

Contoh resep "Aqua Kiss Lace 35ml":
| Bahan | Qty per Botol |
|-------|--------------|
| Bibit Parfum | 15 ml |
| Alkohol 96% | 18 ml |
| Botol 35ml | 1 pcs |
| Stiker | 1 pcs |
| Box | 1 pcs |

> Resep ini dipakai saat produksi batch — stok bahan otomatis berkurang sesuai resep × jumlah produksi.

---

### Langkah 3 — Tambah Produk & Varian
Masuk ke menu **Produk & Varian** → klik **"Tambah Produk"**

**Tambah Produk:**
- **Nama Produk** → nama seri/brand (contoh: "Aqua Kiss", "Scandalous")
- **Deskripsi** → opsional, keterangan singkat

**Tambah Varian** (di dalam produk):
Klik tombol **"+ Varian"** atau **"+ Tambah varian"** di dalam kartu produk
- **Nama Varian** → (contoh: "Lace 35ml", "New 50ml")
- **Ukuran (ml)** → volume botol
- **Harga Jual** → harga yang kamu jual ke konsumen
- **Stok** → jumlah stok produk jadi yang kamu punya sekarang

---

### Langkah 4 — Set Modal Bisnis
Masuk ke **Dashboard** → klik **"Set Modal Awal"**

- Isi total uang yang sudah kamu investasikan ke bisnis ini sejak awal (beli bahan, peralatan, dll)
- Ini dipakai untuk menghitung **Profit Bersih** dan **ROI**
- Bisa diedit kapanpun kalau ada penambahan modal

---

### Langkah 5 — Set Saldo Awal
Masuk ke **Cashflow** → klik **"Set Saldo Awal"**

- Isi total uang yang ada di rekening/kas kamu sekarang (sebelum mulai pakai aplikasi)
- Ini jadi titik awal perhitungan saldo
- Input sekali saja, tidak perlu diubah lagi kecuali koreksi

---

## 2. Operasional Harian

### Beli Bahan Baku (Restock)
Setiap kali kamu beli bahan, gunakan fitur **Restock** di Inventori — jangan input manual ke cashflow saja.

**Alur:**
1. Inventori → tab Bahan Baku → cari bahan yang mau direstock
2. Klik tombol **Restock** (ikon kotak + panah masuk) di pojok kartu bahan
3. Isi form:
   - **Qty Beli** → berapa yang kamu beli (dalam satuan bahan, misal 500 ml)
   - **Total Harga Beli** → total yang kamu bayar (misal Rp 150.000)
   - **Catat ke Cashflow** → centang ini agar pengeluaran otomatis masuk cashflow sebagai "Produksi"
4. Klik **Simpan**

**Yang terjadi otomatis:**
- Stok bahan bertambah (50ml + 100ml = 150ml)
- Harga rata-rata per satuan dihitung ulang (weighted average)
- Cashflow keluar tercatat otomatis (kalau checkbox dicentang)

> Kenapa pakai Restock dan bukan input cashflow manual? Karena Restock sekaligus update stok bahan di Inventori. Kalau cuma catat cashflow, stok tidak berubah.

---

### Produksi Batch
Saat kamu selesai bikin produk, jalankan produksi di aplikasi.

1. Inventori → tab **Produksi**
2. Pilih varian yang diproduksi
3. Isi jumlah yang dibuat (pcs)
4. Cek preview kebutuhan bahan — pastikan stok cukup
5. Klik **"Jalankan Produksi"**

**Yang terjadi otomatis:**
- Stok bahan berkurang sesuai resep × jumlah produksi
- Stok varian di Produk & Varian bertambah
- Biaya produksi (dari harga bahan) masuk cashflow sebagai pengeluaran

---

### Jual Sendiri ke Konsumen
Setiap ada penjualan langsung ke konsumen (WA, Instagram, COD, dll):

1. Produk & Varian → kartu varian yang terjual → klik **"Jual"** (tombol hijau)
2. Isi form:
   - **Jumlah Terjual** → berapa pcs yang terjual
   - **Harga Jual** → sudah terisi otomatis dari harga varian, bisa diubah kalau harga beda
   - **Catat ke Cashflow** → centang ini agar pemasukan masuk cashflow otomatis
3. Klik **Simpan**

**Yang terjadi otomatis:**
- Stok Sendiri berkurang sesuai qty
- Pemasukan masuk cashflow kategori "Penjualan"
- Data masuk tabel penjualan untuk Profit Breakdown di dashboard

---

### Distribusi ke Reseller
Saat kamu kirim produk ke reseller untuk dijualkan:

1. Produk & Varian → kartu varian → klik **"Dist"** (tombol biru/indigo)
2. Isi form:
   - **Jumlah** → berapa pcs yang dikirim ke reseller
   - **Harga ke Reseller** → harga yang kamu sepakati dengan reseller (bisa beda tiap saat)
3. Klik **"Distribusi"**

**Yang terjadi:**
- Stok Sendiri berkurang
- Stok Reseller bertambah
- **Cashflow TIDAK bergerak** — karena uang belum masuk, barang baru dititipkan

---

### Reseller Bayar / Lapor Laku
Saat reseller lapor ada yang laku dan transfer bayaran ke kamu:

1. Produk & Varian → kartu varian → klik **"Bayar"** (tombol kuning)
2. Isi form:
   - **Jumlah Laku** → berapa pcs yang berhasil dijual reseller
   - **Harga per Pcs** → harga yang sudah disepakati waktu distribusi
   - **Catat ke Cashflow** → centang agar pemasukan masuk cashflow
3. Klik **Simpan**

**Yang terjadi otomatis:**
- Stok Reseller berkurang
- Pemasukan masuk cashflow kategori "Penjualan Reseller"

---

### Pengeluaran Lain-lain
Untuk pengeluaran yang tidak lewat Restock (ongkir kirim, packaging tambahan, iklan, dll):

1. Cashflow → klik **"+ Tambah Transaksi"**
2. Pilih **Pengeluaran**
3. Pilih kategori yang sesuai:
   - **Produksi** → beli bahan (kalau tidak pakai Restock)
   - **Packaging** → bubble wrap, selotip, box pengiriman
   - **Ongkir** → biaya kirim ke pembeli
   - **Marketing** → iklan, endorse, promosi
   - **Gaji Karyawan** → upah karyawan/asisten
   - **Operasional** → listrik, internet, sewa
   - **Lainnya** → apapun yang tidak masuk kategori di atas
4. Isi nominal + deskripsi + tanggal → Simpan

---

## 3. Pantau Bisnis

### Dashboard (`/`)

**4 Kartu Statistik:**
| Kartu | Artinya |
|-------|---------|
| Saldo | Total semua pemasukan dikurangi semua pengeluaran = uang kamu sekarang |
| Total Pemasukan | Semua uang yang pernah masuk (belum dikurangi apapun) |
| Total Pengeluaran | Semua uang yang pernah keluar |
| Stok Kritis | Jumlah bahan baku yang stoknya di bawah minimum |

**Modal & Profit Tracker:**
| Kartu | Artinya |
|-------|---------|
| Total Modal Ditanam | Total uang yang kamu investasikan ke bisnis |
| Kas Bisnis Saat Ini | Sama dengan Saldo — total uang yang ada sekarang |
| Profit Bersih | Kas Sekarang − Modal Ditanam = keuntungan nyata yang kamu dapat |
| ROI | Profit Bersih ÷ Modal × 100% = seberapa efisien modal kamu bekerja |

**Tombol Set Modal Awal / Edit Modal** → untuk set atau update total modal bisnis

**Tombol Tambah Modal** → muncul setelah modal diset, untuk tambah investasi baru + opsional catat ke cashflow

**Profit Breakdown:**
- **Per Botol** → Harga Jual, HPP, Margin per botol (bisa diklik untuk edit)
- **Total** → kalkulasi dari semua penjualan yang tercatat: Gross Revenue, Total HPP, Gross Profit, Net Profit

**Floating Button 🔮 (pojok kanan bawah):**
- Muncul hanya kalau profit bersih > 0
- Klik → pop up simulasi: "Dengan profit kamu, bisa produksi X pcs lagi"
- Dihitung dari: Profit Bersih ÷ HPP per pcs
- Klik lagi → hilang

**Grafik:**
- **Produk Paling Laku** → bar chart berdasarkan total nilai penjualan per varian
- **Tren Cashflow** → line chart pemasukan vs pengeluaran 6 bulan terakhir

**Alert Stok Kritis:**
- Muncul otomatis di bawah kalau ada bahan di bawah stok minimum
- Langsung kelihatan bahan apa yang perlu direstock

---

### Cashflow (`/cashflow`)

**Filter Periode:**
| Filter | Tampilkan |
|--------|----------|
| Hari Ini | Transaksi hari ini saja |
| Minggu Ini | 7 hari terakhir |
| Bulan Ini | Bulan berjalan |
| Semua | Seluruh riwayat |

**Tombol "+ Tambah Transaksi"** → form untuk input pemasukan atau pengeluaran manual

**Tombol "Set Saldo Awal"** → input saldo rekening sebelum pakai aplikasi (sekali saja)

**Riwayat Transaksi** → semua transaksi urut dari terbaru, lengkap dengan kategori, deskripsi, tanggal, dan nominal

---

### RAD & HPP (`/rad`)

Kalkulator HPP (Harga Pokok Produksi) — untuk hitung biaya produksi sebelum bikin batch.

**Cara buat RAD:**
1. Klik **"+ Buat RAD Baru"**
2. Isi judul dan jumlah produksi batch (misal: 20 pcs)
3. Tambah semua bahan di tabel:
   - Nama bahan, qty yang dibeli, satuan, total harga beli, pemakaian per botol
4. Isi harga jual, gaji (opsional), biaya lain (opsional)
5. Preview kalkulasi muncul otomatis:
   - HPP/botol
   - Margin/botol
   - Net Profit total batch
   - Saran harga jual (margin 30% & 50%)
6. Klik **Simpan**

> RAD hanya kalkulator — tidak mengurangi stok atau saldo. Aman dibuat kapanpun.

---

### Kalkulator Harga (`/pricing`)

**Tab E-Commerce:**
Simulasi harga jual di marketplace dengan potongan fee platform.

1. Pilih platform (Shopee Regular/Mall, Tokopedia, TikTok Shop, Lazada, atau Custom)
2. Input:
   - **HPP per pcs** → dari RAD atau estimasi
   - **Biaya Tambahan** → packaging, bubble wrap, dll
   - **Ongkir Subsidi** → kalau kamu subsidi ongkir ke pembeli
   - **Target Margin** → % keuntungan yang kamu inginkan
3. Hasil:
   - **Harga Minimum** → harga paling murah yang masih tidak rugi setelah dipotong fee
   - **Harga Rekomendasi** → harga dengan margin target yang sudah kamu set
   - **Simulasi Harga Manual** → input harga yang mau kamu pakai, langsung kelihatan profit & margin-nya

**Tab Reseller:**
Hitung harga ke reseller dari HPP + ongkir kirim.

1. Input HPP, biaya tambahan, margin yang kamu mau
2. Input total ongkir kirim ke reseller + jumlah produk dikirim
3. Hasil:
   - **Harga yang Kamu Kasih ke Reseller** → sudah include ongkir per pcs
   - **Reseller Bisa Jual ke Konsumen Seharga** → saran harga jual ke konsumen dengan margin wajar untuk reseller
