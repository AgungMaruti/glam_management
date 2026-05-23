// =============================================
// GLAM SUITE CONNECTOR
// Copy file ini ke folder bot kamu (Mini PC)
// =============================================

const GLAM_API_URL = "https://glam-management.vercel.app/api/bot";

// Helper: fetch dengan error handling
async function glamFetch(endpoint, options = {}) {
  try {
    const res = await fetch(`${GLAM_API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    const data = await res.json();
    if (data.status === "error") throw new Error(data.message);
    return data;
  } catch (err) {
    return { status: "error", message: err.message };
  }
}

// 1. Cek Stok (bahan baku atau produk)
// Contoh: cekStok("bibit") atau cekStok("aqua", "produk")
async function cekStok(nama, jenis = "semua") {
  return glamFetch(`/stok?nama=${encodeURIComponent(nama)}&jenis=${jenis}`);
}

// 2. Laporan Ringkasan (hari_ini / minggu_ini / bulan_ini)
// Contoh: laporanRingkasan("minggu_ini")
async function laporanRingkasan(periode = "bulan_ini") {
  return glamFetch(`/laporan?periode=${periode}`);
}

// 3. Cek Piutang Reseller
// Contoh: cekPiutang()
async function cekPiutang() {
  return glamFetch(`/piutang`);
}

// 4. Cek Bahan Kritis (mau habis)
// Contoh: cekKritis()
async function cekKritis() {
  return glamFetch(`/kritis`);
}

// 5. Catat Transaksi Cepat
// jenis: "income" (pemasukan) atau "expense" (pengeluaran)
// Contoh: catatTransaksi("expense", "Produksi", 50000, "Beli alkohol")
async function catatTransaksi(jenis, kategori, nominal, keterangan = "") {
  return glamFetch(`/catat`, {
    method: "POST",
    body: JSON.stringify({ jenis, kategori, nominal, keterangan }),
  });
}

// 6. Data Finansial Lengkap (untuk AI analysis)
// Contoh: dataFinansial("bulan_ini")
async function dataFinansial(periode = "bulan_ini") {
  return glamFetch(`/finansial?periode=${periode}`);
}

module.exports = {
  cekStok,
  laporanRingkasan,
  cekPiutang,
  cekKritis,
  catatTransaksi,
  dataFinansial,
};
