# 🤖 Glam Suite Bot Connector

File ini untuk **menghubungkan bot WhatsApp kamu** dengan **Glam Suite**.

## Cara Install

### 1. Copy 2 file ini ke folder bot kamu (Mini PC):

```
bot-kamu/
├── src/
│   ├── glam-suite.js      ← COPY INI
│   ├── handler-wa.js      ← COPY INI (edit sesuai bot kamu)
│   ├── ... (file bot lainnya)
```

### 2. Edit `handler-wa.js` sesuai bot kamu:

Contoh integrasi ke handler pesan WA:

```javascript
const { cekStok, laporanRingkasan, cekPiutang, catatTransaksi, dataFinansial } = require('./glam-suite');

// Handler pesan dari customer/kamu
async function handleMessage(msg, from) {
  const text = msg.body.toLowerCase().trim();

  // ====== 1. CEK STOK ======
  if (text.startsWith('.stok')) {
    const nama = text.replace('.stok', '').trim();
    if (!nama) return "Ketik: .stok [nama bahan/produk]";
    
    const res = await cekStok(nama);
    if (res.status === 'error') return "Error: " + res.message;
    
    let reply = "📦 Hasil pencarian:\n";
    if (res.data.bahan?.length) {
      reply += "\n🧪 Bahan Baku:\n";
      res.data.bahan.forEach(b => {
        reply += `- ${b.name}: ${b.stock} ${b.unit} (min: ${b.min_stock})\n`;
      });
    }
    if (res.data.produk?.length) {
      reply += "\n🎁 Produk:\n";
      res.data.produk.forEach(p => {
        reply += `- ${p.name}: Stok sendiri ${p.stock} pcs, Reseller ${p.stock_reseller || 0} pcs\n`;
      });
    }
    return reply;
  }

  // ====== 2. LAPORAN ======
  if (text === '.laporan' || text.startsWith('.laporan')) {
    const periode = text.split(' ')[1] || 'bulan_ini'; // hari_ini, minggu_ini, bulan_ini
    const res = await laporanRingkasan(periode);
    if (res.status === 'error') return "Error: " + res.message;
    
    const r = res.ringkasan;
    return `📊 Laporan ${res.periode}:\n` +
           `Pemasukan: Rp ${r.pemasukan.toLocaleString()}\n` +
           `Pengeluaran: Rp ${r.pengeluaran.toLocaleString()}\n` +
           `Saldo: Rp ${r.saldo.toLocaleString()}\n` +
           `Transaksi: ${r.total_transaksi} kali`;
  }

  // ====== 3. PIUTANG ======
  if (text === '.piutang') {
    const res = await cekPiutang();
    if (res.status === 'error') return "Error: " + res.message;
    
    if (!res.data?.length) return "✅ Tidak ada piutang!";
    
    let reply = `💰 Total Piutang: Rp ${res.total_piutang.toLocaleString()}\n\n`;
    res.data.forEach(p => {
      reply += `👤 ${p.name}\n`;
      reply += `   Tagihan: Rp ${p.tagihan.toLocaleString()}\n`;
      reply += `   Dibayar: Rp ${p.dibayar.toLocaleString()}\n`;
      reply += `   SISA: Rp ${p.sisa.toLocaleString()}\n\n`;
    });
    return reply;
  }

  // ====== 4. CATAT PENGELUARAN ======
  if (text.startsWith('.catat')) {
    // Format: .catat [jenis] [kategori] [nominal] [keterangan]
    // Contoh: .catat expense Produksi 50000 Beli alkohol 1 liter
    const parts = text.split(' ');
    if (parts.length < 4) return "Format: .catat [income/expense] [kategori] [nominal] [keterangan]";
    
    const jenis = parts[1]; // income atau expense
    const kategori = parts[2];
    const nominal = parts[3];
    const keterangan = parts.slice(4).join(' ');
    
    const res = await catatTransaksi(jenis, kategori, nominal, keterangan);
    if (res.status === 'error') return "Error: " + res.message;
    return "✅ " + res.message;
  }

  // ====== 5. ANALISIS AI (GEMINI) ======
  if (text === '.analisis' || text === '.advisor') {
    const res = await dataFinansial('bulan_ini');
    if (res.status === 'error') return "Error: " + res.message;
    
    // Kirim data ini ke Gemini AI untuk dianalisis
    const prompt = `Kamu adalah CFO bisnis parfum. Analisis data keuangan ini dan kasih saran:
    
    Periode: ${res.periode}
    Pemasukan: Rp ${res.ringkasan.pemasukan.toLocaleString()}
    Pengeluaran: Rp ${res.ringkasan.pengeluaran.toLocaleString()}
    Saldo: Rp ${res.ringkasan.saldo.toLocaleString()}
    Total Terjual: ${res.ringkasan.total_terjual} botol
    Revenue: Rp ${res.ringkasan.total_revenue.toLocaleString()}
    Biaya Tetap (gaji+marketing+ops): Rp ${res.ringkasan.biaya_tetap.toLocaleString()}
    BEP: ${res.ringkasan.bep_botol} botol
    Margin per botol: Rp ${res.ringkasan.margin_per_botol}
    Piutang Reseller: Rp ${res.ringkasan.piutang_reseller.toLocaleString()}
    Bahan Kritis: ${res.detail.bahan_kritis.map((b: any) => b.name).join(', ') || 'Tidak ada'}
    
    Kasih saran singkat 3-4 poin: apa yang baik, apa yang perlu diperbaiki, dan rekomendasi.`;
    
    // Kirim prompt ini ke Gemini API bot kamu
    const geminiReply = await askGemini(prompt); // fungsi Gemini di bot kamu
    return geminiReply;
  }

  return null; // bukan perintah Glam Suite
}

module.exports = { handleMessage };
```

### 3. Jalankan bot kamu seperti biasa

Bot sekarang punya perintah baru:
- `.stok [nama]` — cek stok bahan/produk
- `.laporan [hari_ini/minggu_ini/bulan_ini]` — ringkasan keuangan
- `.piutang` — daftar piutang reseller
- `.catat [income/expense] [kategori] [nominal] [keterangan]` — catat transaksi
- `.analisis` — AI analysis lengkap (kirim ke Gemini)

## API Endpoint Glam Suite (Sudah Ready)

Base URL: `https://glam-management.vercel.app/api/bot`

| Endpoint | Method | Fungsi |
|----------|--------|--------|
| `/stok?nama=xxx&jenis=semua` | GET | Cek stok bahan/produk |
| `/laporan?periode=bulan_ini` | GET | Ringkasan cashflow |
| `/piutang` | GET | Daftar piutang reseller |
| `/kritis` | GET | Bahan yang mau habis |
| `/catat` | POST | Catat transaksi cepat |
| `/finansial?periode=bulan_ini` | GET | Data lengkap untuk AI |

## Troubleshooting

**Error "Cannot fetch"**
- Pastikan Mini PC punya internet
- Cek URL `GLAM_API_URL` sudah benar (Vercel URL kamu)

**Data tidak update**
- Vercel deploy otomatis dari GitHub. Pastikan push terbaru sudah sukses.

## Keamanan

⚠️ **PENTING:** API ini terbuka publik (tidak perlu auth khusus). 
Untuk produksi, tambahkan API Key:
1. Di Glam Suite: tambah validasi header `x-api-key`
2. Di bot: kirim header `x-api-key` di setiap request
