# 🔥 Tahu Walik — Aplikasi Order

Web app pemesanan **Tahu Walik** (isi bakso + Basreng + Otak-otak). Bisa dibuka di browser HP/laptop **dan dipasang seperti aplikasi** (PWA) — tanpa install dari Play Store.

## Fitur
- 🎨 Hero ekspresif: maskot interaktif (tap untuk ngobrol), stempel harga berputar, efek bumbu bertaburan
- ⏳ Hitung mundur otomatis ke **hari Kamis** (hari ready)
- 🧪 Racik pesanan: pilih rasa (Bojot, Balado, BBQ, Jagung Bakar), paket (15K / +Air Mineral 17K / +Teh Pucuk 19K), jumlah — dengan preview animasi & meter level pedas
- 🎰 **Roda Rasa** buat yang bingung pilih
- 🛒 Keranjang (mix rasa, ubah jumlah, hapus) — tersimpan otomatis
- 📲 Checkout → pesanan otomatis terformat & dikirim ke **WhatsApp Anarta (0812-8239-7512)** + kode pesanan unik
- 💳 Pembayaran **hanya via QRIS** (gambar QRIS + total bayar tampil di checkout & setelah pesan, bisa disimpan ke galeri). Ganti QRIS: timpa `assets/img/qris.jpg`.
- 🧾 Riwayat pesanan + tombol **Pesan lagi**
- 🌗 Mode gelap/terang, responsif (HP → desktop), aksesibel (keyboard, reduced-motion)
- 📴 Bisa dipakai offline & dipasang ke layar utama

## Jalankan lokal
Cukup file statis, tidak perlu build:
```bash
python3 -m http.server 8080
# buka http://localhost:8080
```

## Online-kan (gratis)
- **GitHub Pages**: Settings → Pages → Deploy from branch → pilih branch & folder `/ (root)`.
- **Netlify / Vercel / Cloudflare Pages**: import repo, framework “Other/Static”, build command kosong, output `.`

## Ubah menu / harga / nomor WA
Edit objek `CONFIG`, `FLAVORS`, dan `PACKS` di bagian atas `app.js`. Setelah ubah aset, naikkan `VERSION` di `sw.js` agar cache diperbarui.
